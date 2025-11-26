

const mongoose = require("mongoose");
const BrokerRequirement = require("../models/broker");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");

const FOLLOWUP_DISPLAY_LOCALE = {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

const formatFollowupDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "N/A";
  }
  return date.toLocaleString("en-IN", FOLLOWUP_DISPLAY_LOCALE);
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBrokerMeta = (record) => {
  if (!record) return {};
  return {
    brokerId: record._id,
    brokerName: record.brokerName,
    companyName: record.companyName,
    status: record.status,
    capturedBy: record.capturedBy,
    requirement: record.requirement,
    contactNumber: record.contactNumber,
    followUpDate: record.followUpDate,
    followUpUtc: record.followUpUtc,
  };
};

async function resolveBrokerReceiver(record) {
  if (!record) return null;

  const tryResolve = async (candidate) => {
    if (!candidate) return null;

    if (mongoose.Types.ObjectId.isValid(String(candidate))) {
      return typeof candidate === "string" ? new mongoose.Types.ObjectId(candidate) : candidate;
    }

    if (typeof candidate === "object" && candidate._id) {
      return candidate._id;
    }

    const name = candidate.toString().trim();
    if (!name) return null;

    const user = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    })
      .select("_id")
      .lean();

    return user ? user._id : null;
  };

  const transferReceiver = await tryResolve(record.transferTo);
  if (transferReceiver) return transferReceiver;

  const assignReceiver = await tryResolve(record.assignTo);
  if (assignReceiver) return assignReceiver;

  return tryResolve(record.capturedBy);
}

// Create Single Requirement
exports.createRequirement = async (req, res) => {
  try {
    // Normalize followUpDate if provided (accepts ISO or datetime-local)
    if (req.body.followUpDate) {
      const d = new Date(req.body.followUpDate);
      if (!isNaN(d.getTime())) req.body.followUpDate = d;
      else delete req.body.followUpDate;
    }

    const newRequirement = new BrokerRequirement(req.body);
    await newRequirement.save();
    res.status(201).json(newRequirement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All
exports.getAllRequirements = async (req, res) => {
  try {
    const requirements = await BrokerRequirement.find().sort({ createdAt: -1 });
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get by ID
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await BrokerRequirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ error: "Requirement not found" });
    res.json(requirement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = { ...req.body };
    const followUpFieldProvided = Object.prototype.hasOwnProperty.call(req.body, "followUpDate");

    if (updatePayload.followUpDate) {
      const d = new Date(updatePayload.followUpDate);
      if (!isNaN(d.getTime())) updatePayload.followUpDate = d;
      else delete updatePayload.followUpDate;
    } else if (followUpFieldProvided) {
      updatePayload.followUpDate = null;
      updatePayload.followUpUtc = null;
    }

    const oldRequirement = await BrokerRequirement.findById(id);
    if (!oldRequirement) return res.status(404).json({ error: "Requirement not found" });

    const updatedRequirement = await BrokerRequirement.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!updatedRequirement) return res.status(404).json({ error: "Requirement not found" });

    const prevTimestamp = oldRequirement.followUpDate
      ? new Date(oldRequirement.followUpDate).getTime()
      : null;
    const newTimestamp = updatedRequirement.followUpDate
      ? new Date(updatedRequirement.followUpDate).getTime()
      : null;
    const followUpChanged = followUpFieldProvided && prevTimestamp !== newTimestamp;

    if (followUpChanged) {
      try {
        const actorName = req.user?.name || "System";
        const receiverId = await resolveBrokerReceiver(updatedRequirement);
        const message = `📅 Broker "${oldRequirement.brokerName || "Requirement"}" follow-up updated to ${formatFollowupDisplay(updatedRequirement.followUpDate)} by ${actorName}`;
        const notif = await Notification.create({
          type: "Broker",
          itemId: id,
          message,
          changedBy: actorName,
          receiver: receiverId || null,
          meta: {
            ...buildBrokerMeta(updatedRequirement),
            event: "followup_change",
            previousFollowUp: oldRequirement.followUpDate
              ? new Date(oldRequirement.followUpDate).toISOString()
              : null,
            newFollowUp: updatedRequirement.followUpDate
              ? new Date(updatedRequirement.followUpDate).toISOString()
              : null,
          },
        });

        const payload = {
          ...notif.toJSON(),
          brokerId: id,
          _id: notif._id,
          notificationId: notif._id,
        };
        console.log("🔔 Broker followUpDate notification created:", { receiverId, payload });
        if (receiverId) {
          await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
        } else {
          emitToAdmins(payload);
        }
      } catch (notifErr) {
        console.warn("⚠️ Broker follow-up notification failed:", notifErr.message);
      }
    }

    res.json(updatedRequirement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteRequirement = async (req, res) => {
  try {
    const deletedRequirement = await BrokerRequirement.findByIdAndDelete(req.params.id);
    if (!deletedRequirement) return res.status(404).json({ error: "Requirement not found" });
    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk Upload
exports.bulkUpload = async (req, res) => {
  try {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Please send an array of broker requirements" });
    }

    const brokers = await BrokerRequirement.insertMany(data, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      count: brokers.length,
      brokers
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


