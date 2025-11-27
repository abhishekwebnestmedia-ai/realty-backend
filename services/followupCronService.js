const cron = require("node-cron");
const mongoose = require("mongoose");
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Broker = require("../models/broker");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");
const { parseFollowupInput, formatIstDbString } = require("../utils/followupTime");

const CRON_EXPRESSION = "*/10 * * * * *"; // run every 10 seconds for near-real-time reminders
const FOLLOWUP_WINDOW_MS = 60 * 1000; // ±30 seconds around the scheduled time (widened for reliability)
const MISSED_ALERT_DELAY_MS = 5 * 60 * 1000; // notify 5 minutes after missed
const MISSED_WINDOW_MS = 60 * 1000; // ±30 seconds for missed window
const DUPLICATE_SUPPRESS_MS = 3 * 60 * 1000; // suppress duplicates for 3 minutes
const TIMEZONE = "Asia/Kolkata";
const LEGACY_FETCH_LIMIT = 500;
const IDLE_LOG_THROTTLE_MS = 60 * 1000;
const DEBUG_FOLLOWUPS = String(process.env.FOLLOWUP_DEBUG).toLowerCase() === "true" || true; // Enable debug logging temporarily

const debugLog = (...args) => {
  if (DEBUG_FOLLOWUPS) {
    console.log("[followup-debug]", ...args);
  }
};

const userNameCache = new Map();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const hasStoredDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
let lastIdleLog = 0;

const ENTITY_CONFIG = {
  lead: {
    kind: "lead",
    Model: Lead,
    select: "customerName contactNumber requirement remark followUp followUpUtc assignTo transferTo",
    rawField: "followUp",
    fallbackFields: ["__legacyDueAt", "followUpUtc", "followUpDate", "followUp"],
    legacy: {
      fieldName: "followUp",
      rangeType: "istString",
      projection: {
        customerName: 1,
        contactNumber: 1,
        requirement: 1,
        remark: 1,
      },
    },
  },
  inventory: {
    kind: "inventory",
    Model: Inventory,
    select: "sellerName contactNumbers sector demand requirement followUpDate followUpUtc assignTo transferTo",
    rawField: "followUpDate",
    fallbackFields: ["__legacyDueAt", "followUpUtc", "followUpDate", "followUp"],
    legacy: {
      fieldName: "followUpDate",
      rangeType: "istString",
      projection: {
        sellerName: 1,
        contactNumbers: 1,
        sector: 1,
        demand: 1,
        requirement: 1,
      },
    },
  },
  broker: {
    kind: "broker",
    Model: Broker,
    select: "brokerName contactNumber requirement remark followUpDate followUpUtc assignTo transferTo",
    rawField: "followUpDate",
    fallbackFields: ["__legacyDueAt", "followUpUtc", "followUpDate"],
    legacy: {
      fieldName: "followUpDate",
      rangeType: "date",
      projection: {
        brokerName: 1,
        contactNumber: 1,
        requirement: 1,
        remark: 1,
      },
    },
  },
};

async function fetchLegacyFollowups(Model, {
  fieldName,
  utcField = "followUpUtc",
  windowStart,
  windowEnd,
  projection = {},
  rangeType = "date",
}) {
  const fieldCriteria = { $exists: true, $ne: null, $ne: "" };
  if (rangeType === "istString") {
    const istStart = formatIstDbString(windowStart);
    const istEnd = formatIstDbString(windowEnd);
    if (istStart && istEnd) {
      fieldCriteria.$gte = istStart;
      fieldCriteria.$lte = istEnd;
    }
  } else if (rangeType === "date") {
    fieldCriteria.$gte = windowStart;
    fieldCriteria.$lte = windowEnd;
  }
  const utcFieldPath = `$${utcField}`;
  const docs = await Model.find({
    [fieldName]: fieldCriteria,
    $or: [
      { [utcField]: { $exists: false } },
      { [utcField]: null },
      { $expr: { $ne: [{ $type: utcFieldPath }, "date"] } },
    ],
  })
    .select({ [fieldName]: 1, [utcField]: 1, assignTo: 1, transferTo: 1, ...projection })
    .limit(LEGACY_FETCH_LIMIT)
    .lean();

  return docs
    .filter((doc) => !hasStoredDate(doc[utcField]))
    .map((doc) => {
      const parsed = ensureDateInstance(doc[fieldName] ?? doc[utcField]);
      return parsed ? { ...doc, __legacyDueAt: parsed } : null;
    })
    .filter((doc) => doc && doc.__legacyDueAt >= windowStart && doc.__legacyDueAt <= windowEnd);
}

const pickFields = (doc, fields = []) =>
  fields.reduce((acc, field) => {
    acc[field] = doc ? doc[field] : undefined;
    return acc;
  }, {});

async function fetchEntityDocs(config, windowStart, windowEnd) {
  const { Model, select, legacy, kind } = config;
  
  // Also query by the raw field (followUp for leads, followUpDate for inventory/broker)
  // in case followUpUtc wasn't normalized yet
  const rawFieldName = config.rawField;
  const primaryQuery = Model.find({
    $or: [
      { followUpUtc: { $gte: windowStart, $lte: windowEnd } },
      // Also check the raw field directly if it's a Date
      { [rawFieldName]: { $gte: windowStart, $lte: windowEnd, $type: "date" } },
    ]
  })
    .select(select)
    .lean();

  const [primary, legacyDocs] = await Promise.all([
    primaryQuery,
    fetchLegacyFollowups(Model, {
      fieldName: legacy.fieldName,
      utcField: legacy.utcField || "followUpUtc",
      windowStart,
      windowEnd,
      projection: legacy.projection,
      rangeType: legacy.rangeType,
    }),
  ]);

  // Deduplicate by _id in case both queries return same doc
  const seen = new Set();
  const combined = [...primary, ...legacyDocs].filter(doc => {
    const id = doc._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  debugLog(
    `${kind} window ${windowStart.toISOString()} - ${windowEnd.toISOString()} => primary ${primary.length}, legacy ${legacyDocs.length}, combined ${combined.length}`
  );

  return combined;
}

const resolveDueDate = (doc, fallbackFields = []) => {
  if (!doc) return null;
  for (const field of fallbackFields) {
    if (field === "__legacyDueAt" && doc.__legacyDueAt) {
      return ensureDateInstance(doc.__legacyDueAt);
    }
    const candidate = doc[field];
    const parsed = ensureDateInstance(candidate);
    if (parsed) return parsed;
  }
  return null;
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
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  const parsed = parseFollowupInput(value);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function persistFollowupUtc(Model, doc, utcField, rawField, dueAt) {
  if (!Model || !doc || !doc._id || !dueAt || hasStoredDate(doc[utcField])) {
    return Promise.resolve();
  }

  const update = {
    [utcField]: dueAt,
  };

  if (rawField) {
    update[rawField] = dueAt;
  }

  return Model.updateOne({ _id: doc._id }, { $set: update })
    .catch((err) => {
      console.error(
        `⚠️ Failed to normalize follow-up timestamp for ${Model.modelName} ${doc._id}:`,
        err?.message || err
      );
    });
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

    // Check for duplicate notification (same item, same followup time, same status, within suppression window)
    const duplicate = await Notification.findOne({
      type,
      itemId: doc._id,
      "meta.event": "followup",
      "meta.status": status,
      "meta.followUpDueAt": dueIso,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_SUPPRESS_MS) },
    }).lean();
    if (duplicate) {
      debugLog(`${type} ${doc._id} skipped (duplicate within ${DUPLICATE_SUPPRESS_MS / 1000}s window)`);
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

    let notif;
    try {
      notif = await Notification.create({
        type,
        itemId: doc._id,
        message,
        receiver: receiverId || null,
        changedBy: "System",
        meta,
      });
    } catch (createErr) {
      // Handle duplicate key error gracefully - notification already exists
      if (createErr.code === 11000) {
        debugLog(`${type} ${doc._id} skipped (MongoDB duplicate key - notification already exists)`);
        // Try to find and emit the existing notification instead
        const existing = await Notification.findOne({
          type,
          itemId: doc._id,
          "meta.event": "followup",
        }).sort({ createdAt: -1 }).lean();
        if (existing && receiverId) {
          const payload = { ...existing, notificationId: existing._id, itemId: doc._id.toString() };
          if (kind === "lead") payload.leadId = doc._id.toString();
          if (kind === "inventory") payload.inventoryId = doc._id.toString();
          if (kind === "broker") payload.brokerId = doc._id.toString();
          await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
          return true; // Still emit the existing notification
        }
        return false;
      }
      throw createErr; // Re-throw other errors
    }

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

async function processEntityFollowups(kind, windowStart, windowEnd, status) {
  const config = ENTITY_CONFIG[kind];
  if (!config) {
    console.error(`❌ Unknown follow-up entity: ${kind}`);
    return 0;
  }

  try {
    const docs = await fetchEntityDocs(config, windowStart, windowEnd);
    let count = 0;
    const normalizationJobs = [];

    for (const doc of docs) {
      const dueAt = resolveDueDate(doc, config.fallbackFields);
      if (!dueAt) {
        debugLog(`${kind} ${doc._id} skipped - could not parse follow-up fields`, pickFields(doc, config.fallbackFields));
        continue;
      }

      if (!hasStoredDate(doc.followUpUtc)) {
        normalizationJobs.push(
          persistFollowupUtc(config.Model, doc, "followUpUtc", config.rawField, dueAt)
        );
      }

      const sent = await emitFollowupNotification({ kind, doc, dueAt, status });
      if (sent) count += 1;
    }

    if (normalizationJobs.length) {
      await Promise.allSettled(normalizationJobs);
    }

    debugLog(`${kind} processed=${docs.length} emitted=${count} status=${status}`);
    return count;
  } catch (err) {
    console.error(`❌ process${kind}Followups (${status}) error:`, err);
    return 0;
  }
}

const processLeadFollowups = (windowStart, windowEnd, status) =>
  processEntityFollowups("lead", windowStart, windowEnd, status);

const processInventoryFollowups = (windowStart, windowEnd, status) =>
  processEntityFollowups("inventory", windowStart, windowEnd, status);

const processBrokerFollowups = (windowStart, windowEnd, status) =>
  processEntityFollowups("broker", windowStart, windowEnd, status);

if (process.env.FOLLOWUP_CRON_DISABLED === "true") {
  console.log("⚙️ Follow-up cron disabled via FOLLOWUP_CRON_DISABLED flag.");
} else {
  cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const now = new Date();
      const nowIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const dueStart = new Date(now.getTime() - FOLLOWUP_WINDOW_MS / 2);
      const dueEnd = new Date(now.getTime() + FOLLOWUP_WINDOW_MS / 2);
      
      debugLog(`Cron tick at IST: ${nowIST} | UTC: ${now.toISOString()}`);
      debugLog(`Due window: ${dueStart.toISOString()} to ${dueEnd.toISOString()}`);

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
        const nowTs = Date.now();
        if (nowTs - lastIdleLog >= IDLE_LOG_THROTTLE_MS) {
          const nowIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          console.log(`⏸️ No follow-up notifications to dispatch right now. (IST: ${nowIST})`);
          lastIdleLog = nowTs;
        }
      }
    } catch (err) {
      console.error("🚨 followUpCronService error:", err);
    }
  });

  console.log("✅ Follow-up cron job initialized (runs every 10 seconds).");
}

module.exports = {
  processLeadFollowups,
  processInventoryFollowups,
  processBrokerFollowups,
};








