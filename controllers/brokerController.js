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
  if (isNaN(date.getTime())) return typeof value === "string" ? value : "N/A";
  return date.toLocaleString("en-IN", FOLLOWUP_DISPLAY_LOCALE);
};

const escapeRegex = (val = "") => val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBrokerMeta = (record) => {
  if (!record) return {};
  return {
    brokerId: record._id,
    brokerName: record.brokerName,
    companyName: record.companyName,
    status: record.status,
    requirement: record.requirement,
    contactNumber: record.contactNumber,
    followUpDate: record.followUpDate,
    followUpUtc: record.followUpUtc,
  };
};

// Resolve notification receiver
async function resolveBrokerReceiver(record) {
  if (!record) return null;

  const tryResolve = async (value) => {
    if (!value) return null;

    // if value is ObjectId or string ObjectId
    if (mongoose.Types.ObjectId.isValid(String(value))) {
      return typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
    }

    // if it's an object containing a user ref
    if (typeof value === "object" && value._id) return value._id;

    // Treat as name match
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(value.toString().trim())}$`, "i") },
    })
      .select("_id")
      .lean();

    return user ? user._id : null;
  };

  const transferReceiver = await tryResolve(record.transferTo);
  if (transferReceiver) return transferReceiver;

  const assignReceiver = await tryResolve(record.assignTo);
  if (assignReceiver) return assignReceiver;

  return null; // No capturedBy fallback anymore
}

/* ===========================
    CREATE REQUIREMENT
=========================== */
exports.createRequirement = async (req, res) => {
  try {
    if (req.body.followUpDate) {
      const d = new Date(req.body.followUpDate);
      req.body.followUpDate = isNaN(d.getTime()) ? undefined : d;
    }

    const doc = new BrokerRequirement(req.body);
    await doc.save();

    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===========================
    GET ALL REQUIREMENTS
=========================== */
exports.getAllRequirements = async (req, res) => {
  try {
    const data = await BrokerRequirement.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
    GET SINGLE REQUIREMENT
=========================== */
exports.getRequirementById = async (req, res) => {
  try {
    const doc = await BrokerRequirement.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Requirement not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
    UPDATE REQUIREMENT
=========================== */
exports.updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const followUpProvided = Object.prototype.hasOwnProperty.call(req.body, "followUpDate");

    if (followUpProvided) {
      if (updateData.followUpDate) {
        const d = new Date(updateData.followUpDate);
        if (!isNaN(d.getTime())) {
          updateData.followUpDate = d;
          updateData.followUpUtc = d; // Also update followUpUtc for cron to work!
        } else {
          updateData.followUpDate = null;
          updateData.followUpUtc = null;
        }
      } else {
        updateData.followUpDate = null;
        updateData.followUpUtc = null;
      }
    }

    const oldData = await BrokerRequirement.findById(id);
    if (!oldData) return res.status(404).json({ error: "Requirement not found" });

    const updated = await BrokerRequirement.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Detect follow-up date change
    const prev = oldData.followUpDate ? new Date(oldData.followUpDate).getTime() : null;
    const now = updated.followUpDate ? new Date(updated.followUpDate).getTime() : null;

    // Note: followUpDate changes for broker requirements are persisted but do not send immediate notifications.

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===========================
    DELETE REQUIREMENT
=========================== */
exports.deleteRequirement = async (req, res) => {
  try {
    const deleted = await BrokerRequirement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Requirement not found" });

    res.json({ message: "Requirement deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
    BULK UPLOAD
=========================== */
exports.bulkUpload = async (req, res) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0)
      return res.status(400).json({ error: "Send an array of broker entries" });

    const result = await BrokerRequirement.insertMany(req.body, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      count: result.length,
      brokers: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
