const cron = require("node-cron");
const mongoose = require("mongoose");
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Broker = require("../models/broker");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");

const FOLLOWUP_WINDOW_MS = 60 * 1000; // ±30 seconds around the scheduled time
const MISSED_ALERT_DELAY_MS = 5 * 60 * 1000; // notify 5 minutes after missed
const MISSED_WINDOW_MS = 60 * 1000;
const DUPLICATE_SUPPRESS_MS = 2 * 60 * 1000;

const userNameCache = new Map();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// 🧮 Build a $dateFromString pipeline that tolerates multiple formats
const computeFollowupDateExpr = (fieldPath) => ({
  $let: {
    vars: { raw: fieldPath },
    in: {
      $switch: {
        branches: [
          { case: { $eq: [{ $type: "$$raw" }, "date"] }, then: "$$raw" },
          { case: { $eq: [{ $type: "$$raw" }, "double"] }, then: { $toDate: "$$raw" } },
          { case: { $eq: [{ $type: "$$raw" }, "decimal"] }, then: { $toDate: "$$raw" } },
          { case: { $eq: [{ $type: "$$raw" }, "int"] }, then: { $toDate: "$$raw" } },
          { case: { $eq: [{ $type: "$$raw" }, "long"] }, then: { $toDate: "$$raw" } },
          {
            case: { $eq: [{ $type: "$$raw" }, "string"] },
            then: {
              $let: {
                vars: {
                  exact: {
                    $dateFromString: {
                      dateString: "$$raw",
                      format: "%Y-%m-%d %H:%M:%S",
                      timezone: "Asia/Kolkata",
                      onError: null,
                      onNull: null,
                    },
                  },
                  minute: {
                    $dateFromString: {
                      dateString: "$$raw",
                      format: "%Y-%m-%d %H:%M",
                      timezone: "Asia/Kolkata",
                      onError: null,
                      onNull: null,
                    },
                  },
                  iso: {
                    $dateFromString: {
                      dateString: "$$raw",
                      timezone: "Asia/Kolkata",
                      onError: null,
                      onNull: null,
                    },
                  },
                },
                in: {
                  $ifNull: ["$$exact", { $ifNull: ["$$minute", "$$iso"] }],
                },
              },
            },
          },
        ],
        default: null,
      },
    },
  },
});

const buildFollowupPipeline = ({ modelField, windowStart, windowEnd, projection = {} }) => {
  const fieldPath = `$${modelField}`;
  return [
    { $match: { [modelField]: { $exists: true, $ne: null, $ne: "" } } },
    { $addFields: { __followUpDate: computeFollowupDateExpr(fieldPath) } },
    { $match: { __followUpDate: { $ne: null, $gte: windowStart, $lte: windowEnd } } },
    { $addFields: { followUpDate: "$__followUpDate" } },
    {
      $project: {
        _id: 1,
        assignTo: 1,
        transferTo: 1,
        [modelField]: 1,
        followUpDate: 1,
        ...projection,
      },
    },
    { $unset: "__followUpDate" },
  ];
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findUserIdByName(name) {
  if (!name) return null;
  const normalized = name.toString().trim().toLowerCase();
  if (!normalized || normalized === "unassigned" || normalized === "none") return null;
  if (userNameCache.has(normalized)) return userNameCache.get(normalized);

  const user = await User.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
  })
    .select("_id")
    .lean();

  const id = user ? user._id : null;
  userNameCache.set(normalized, id);
  return id;
}

async function resolveReceiverId(doc) {
  try {
    const transferRaw =
      typeof doc.transferTo === "string" ? doc.transferTo.trim() : null;
    if (transferRaw) {
      const found = await findUserIdByName(transferRaw);
      if (found) return found;
    }

    const candidateKeys = ["assignTo", "assignedTo"];
    for (const key of candidateKeys) {
      const candidate = doc[key];
      if (!candidate) continue;

      if (candidate && typeof candidate === "object" && candidate._id) {
        const inner = candidate._id;
        if (isValidObjectId(inner)) {
          return typeof inner === "string"
            ? new mongoose.Types.ObjectId(inner)
            : inner;
        }
        const resolved = await findUserIdByName(inner);
        if (resolved) return resolved;
      }

      if (isValidObjectId(candidate)) {
        return typeof candidate === "string"
          ? new mongoose.Types.ObjectId(candidate)
          : candidate;
      }

      const candidateStr = candidate.toString().trim();
      if (!candidateStr) continue;

      if (isValidObjectId(candidateStr)) {
        return new mongoose.Types.ObjectId(candidateStr);
      }

      const resolved = await findUserIdByName(candidateStr);
      if (resolved) return resolved;
    }

    return null;
  } catch (err) {
    console.error("❌ resolveReceiverId error:", err);
    return null;
  }
}

function ensureDateInstance(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// 🕒 Format date to readable IST format (DD/MM/YYYY, HH:mm AM/PM IST)
function formatIST(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function buildMessage(kind, doc, dueAt, status) {
  const whenText = formatIST(dueAt);

  if (kind === "lead") {
    const name = doc.customerName || "the lead";
    const phone = doc.contactNumber || "N/A";
    const requirement = doc.requirement || doc.remark || "N/A";
    if (status === "missed") {
      return `⏰ Missed follow-up with ${name} (${phone}). Scheduled for ${whenText}. Requirement: ${requirement}.`;
    }
    return `🔔 Reminder: Follow up with ${name} (${phone}) at ${whenText}. Requirement: ${requirement}.`;
  }

  if (kind === "inventory") {
    const name = doc.sellerName || "the seller";
    const phone = Array.isArray(doc.contactNumbers) ? doc.contactNumbers.find(Boolean) : null;
    const demand = doc.demand || doc.requirement || "N/A";
    const sector = doc.sector ? `sector ${doc.sector}` : "the property";
    if (status === "missed") {
      return `⏰ Missed inventory follow-up with ${name} (${phone || "N/A"}). Scheduled for ${whenText}. Demand: ${demand}.`;
    }
    return `🔔 Reminder: Inventory follow-up with ${name} (${phone || "N/A"}) at ${whenText}. Location: ${sector}. Demand: ${demand}.`;
  }

  const name = doc.brokerName || "the broker";
  const phone = doc.contactNumber || "N/A";
  const requirement = doc.requirement || doc.remark || "N/A";
  if (status === "missed") {
    return `⏰ Missed broker follow-up with ${name} (${phone}). Scheduled for ${whenText}. Requirement: ${requirement}.`;
  }
  return `🔔 Reminder: Broker follow-up with ${name} (${phone}) at ${whenText}. Requirement: ${requirement}.`;
}

async function emitFollowupNotification({ kind, doc, dueAt, status }) {
  try {
    const typeMap = { lead: "Lead", inventory: "Inventory", broker: "Broker" };
    const type = typeMap[kind] || "Lead";
    const dueIso = dueAt ? dueAt.toISOString() : null;

    const duplicate = await Notification.findOne({
      type,
      itemId: doc._id,
      "meta.event": "followup",
      "meta.status": status,
      "meta.followUpDueAt": dueIso,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_SUPPRESS_MS) },
    }).lean();
    if (duplicate) {
      return false;
    }

    const receiverId = await resolveReceiverId(doc);
    const meta = {
      followupReminder: true,
      entity: kind,
      followUpDueAt: dueIso,
      status,
      event: "followup",
    };
    const message = buildMessage(kind, doc, dueAt, status);

    const notif = await Notification.create({
      type,
      itemId: doc._id,
      message,
      receiver: receiverId || null,
      changedBy: "System",
      meta,
    });

    const entityId = doc._id && doc._id.toString ? doc._id.toString() : doc._id;

    const payload = {
      ...notif.toJSON(),
      notificationId: notif._id,
      itemId: entityId,
      meta,
    };

    if (kind === "lead") payload.leadId = entityId;
    if (kind === "inventory") payload.inventoryId = entityId;
    if (kind === "broker") payload.brokerId = entityId;

    if (receiverId) {
      await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
    } else {
      emitToAdmins(payload);
    }

    return true;
  } catch (err) {
    console.error(`❌ emitFollowupNotification (${kind}, ${status}) failed:`, err);
    return false;
  }
}

async function processLeadFollowups(windowStart, windowEnd, status) {
  try {
    const pipeline = buildFollowupPipeline({
      modelField: "followUp",
      windowStart,
      windowEnd,
      projection: {
        customerName: 1,
        contactNumber: 1,
        requirement: 1,
        remark: 1,
      },
    });

    const leads = await Lead.aggregate(pipeline);
    let count = 0;
    for (const lead of leads) {
      const dueAt = ensureDateInstance(lead.followUpDate);
      if (!dueAt) continue;
      const sent = await emitFollowupNotification({ kind: "lead", doc: lead, dueAt, status });
      if (sent) count += 1;
    }
    return count;
  } catch (err) {
    console.error(`❌ processLeadFollowups (${status}) error:`, err);
    return 0;
  }
}

async function processInventoryFollowups(windowStart, windowEnd, status) {
  try {
    const pipeline = buildFollowupPipeline({
      modelField: "followUpDate",
      windowStart,
      windowEnd,
      projection: {
        sellerName: 1,
        contactNumbers: 1,
        sector: 1,
        demand: 1,
        requirement: 1,
      },
    });

    const inventories = await Inventory.aggregate(pipeline);
    let count = 0;
    for (const inventory of inventories) {
      const dueAt = ensureDateInstance(inventory.followUpDate);
      if (!dueAt) continue;
      const sent = await emitFollowupNotification({ kind: "inventory", doc: inventory, dueAt, status });
      if (sent) count += 1;
    }
    return count;
  } catch (err) {
    console.error(`❌ processInventoryFollowups (${status}) error:`, err);
    return 0;
  }
}

async function processBrokerFollowups(windowStart, windowEnd, status) {
  try {
    const brokers = await Broker.find({
      followUpDate: { $gte: windowStart, $lte: windowEnd },
    })
      .select("brokerName contactNumber requirement remark followUpDate assignTo transferTo")
      .lean();

    let count = 0;
    for (const broker of brokers) {
      const dueAt = ensureDateInstance(broker.followUpDate);
      if (!dueAt) continue;
      const sent = await emitFollowupNotification({ kind: "broker", doc: broker, dueAt, status });
      if (sent) count += 1;
    }
    return count;
  } catch (err) {
    console.error(`❌ processBrokerFollowups (${status}) error:`, err);
    return 0;
  }
}

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const dueStart = new Date(now.getTime() - FOLLOWUP_WINDOW_MS / 2);
    const dueEnd = new Date(now.getTime() + FOLLOWUP_WINDOW_MS / 2);

    const [leadDue, inventoryDue, brokerDue] = await Promise.all([
      processLeadFollowups(dueStart, dueEnd, "due"),
      processInventoryFollowups(dueStart, dueEnd, "due"),
      processBrokerFollowups(dueStart, dueEnd, "due"),
    ]);

    const missedStart = new Date(now.getTime() - MISSED_ALERT_DELAY_MS - MISSED_WINDOW_MS / 2);
    const missedEnd = new Date(now.getTime() - MISSED_ALERT_DELAY_MS + MISSED_WINDOW_MS / 2);

    const [leadMissed, inventoryMissed, brokerMissed] = await Promise.all([
      processLeadFollowups(missedStart, missedEnd, "missed"),
      processInventoryFollowups(missedStart, missedEnd, "missed"),
      processBrokerFollowups(missedStart, missedEnd, "missed"),
    ]);

    if (leadDue + inventoryDue + brokerDue > 0) {
      console.log(
        `✅ Follow-up reminders sent — leads: ${leadDue}, inventory: ${inventoryDue}, brokers: ${brokerDue}`
      );
    }

    if (leadMissed + inventoryMissed + brokerMissed > 0) {
      console.log(
        `⚠️ Missed follow-up alerts sent — leads: ${leadMissed}, inventory: ${inventoryMissed}, brokers: ${brokerMissed}`
      );
    }

    if (
      leadDue + inventoryDue + brokerDue === 0 &&
      leadMissed + inventoryMissed + brokerMissed === 0
    ) {
      console.log("⏸️ No follow-up notifications to dispatch this minute.");
    }
  } catch (err) {
    console.error("🚨 followUpCronService error:", err);
  }
});

console.log("✅ Follow-up cron job initialized (runs every minute).");





