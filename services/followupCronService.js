const cron = require("node-cron");
const mongoose = require('mongoose');
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");

// 🔹 Convert JS Date → "YYYY-MM-DD HH:mm:ss" (IST) matching Lead/Inventory storage
function toISTDBString(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().replace('T', ' ').substring(0, 19);
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
    hour12: true
  });
}

// 🕒 Runs every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // --- 🔹 Trigger exactly at follow-up time (±30 seconds) ---
    const targetStart = new Date(now.getTime() - 30 * 1000);
    const targetEnd = new Date(now.getTime() + 30 * 1000);

    // Use same DB string format used by Lead/Inventory models
    const startStr = toISTDBString(targetStart);
    const endStr = toISTDBString(targetEnd);

    console.log(`🔍 Checking follow-ups between ${startStr} and ${endStr}`);

    // ----------------- LEADS -----------------
    const leads = await Lead.find({
      followUp: { $gte: startStr, $lte: endStr },
    });




    // ----------------- INVENTORIES -----------------

    for (const lead of leads) {
      const msg = `🔔 Reminder: Follow up with ${lead.customerName} (${lead.contactNumber}). Requirement: ${lead.projects || lead.remark || "N/A"}.`;
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const exists = await Notification.findOne({
        type: "Lead",
        itemId: lead._id,
        message: msg,
        createdAt: { $gte: twoMinutesAgo },
      });

      if (exists) {
        console.log(`⏩ Skipped duplicate lead notification for ${lead.customerName}`);
        continue;
      }

      let receiverId = null;
      try {
        if (lead.transferTo) {
          const r = await User.findOne({ name: lead.transferTo });
          if (r) receiverId = r._id;
        }

        const assignCandidate = lead.assignTo || lead.assignedTo;
        if (!receiverId && assignCandidate) {
          if (mongoose.Types.ObjectId.isValid(String(assignCandidate))) {
            receiverId = assignCandidate;
          } else {
            const r2 = await User.findOne({ name: assignCandidate });
            if (r2) receiverId = r2._id;
          }
        }
      } catch (resolveErr) {
        console.error("❌ Error resolving lead recipient:", resolveErr);
      }

      try {
        const notif = await Notification.create({
          type: "Lead",
          itemId: lead._id,
          message: msg,
          receiver: receiverId || null,
          meta: {
            leadId: lead._id,
            customerName: lead.customerName,
            contactNumber: lead.contactNumber,
            followUpAt: lead.followUp,
            followUpReadable: formatIST(lead.followUp),
            assignTo: assignCandidate,
            transferTo: lead.transferTo,
          },
        });

        console.log(`✅ Lead notification created for ${lead.customerName}`);

        const istOffset = 5.5 * 60 * 60 * 1000;
        const createdAtIST = new Date(notif.createdAt.getTime() + istOffset)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);

        const payload = {
          ...notif.toJSON(),
          createdAt: createdAtIST,
        };

        if (receiverId) {
          await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
        } else {
          emitToAdmins(payload);
          console.log(`📩 Unassigned lead notification sent to admins`);
        }
      } catch (err) {
        console.error(`❌ Lead notification error for ${lead.customerName}:`, err);
      }
    }

    
    
    // Support both `followUpDate` (Inventory) and legacy `followUp` keys
    let inventories = await Inventory.find({
      $or: [
        { followUpDate: { $gte: startStr, $lte: endStr } },
        { followUp: { $gte: startStr, $lte: endStr } },
      ],
    });

    // Fallback: if no inventories matched by string-range (different stored format),
    // scan inventories with followUp fields and parse their values to detect matches.
    if (!inventories.length) {
      const candidates = await Inventory.find({
        $or: [{ followUpDate: { $exists: true } }, { followUp: { $exists: true } }],
      });

      const matched = [];
      for (const inv of candidates) {
        const raw = inv.followUpDate || inv.followUp || null;
        if (!raw) continue;

        // Try to parse common formats (ISO, epoch, or already IST string)
        let parsed = null;
        // If raw matches YYYY-MM-DD HH:mm:ss, convert to ISO by replacing space
        const maybeISO = raw.replace(' ', 'T');
        const tryDates = [maybeISO, raw, new Date(raw)];
        for (const t of tryDates) {
          const d = new Date(t);
          if (!isNaN(d.getTime())) {
            parsed = d;
            break;
          }
        }

        if (!parsed) continue;

        const parsedStr = toISTDBString(parsed);
        if (parsedStr >= startStr && parsedStr <= endStr) {
          matched.push(inv);
        }
      }

      if (matched.length) inventories = matched;
    }

    for (const inv of inventories) {
      // Use whichever follow-up field is present (support legacy `followUp`)
      const followUpValue = inv.followUpDate || inv.followUp || null;
      const istTime = formatIST(followUpValue);
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"}) at ${istTime} IST. Property in sector ${inv.sector || "N/A"} — Demand: ${inv.demand || "N/A"}.`;

      const exists = await Notification.findOne({
        type: "Inventory",
        itemId: inv._id,
        message: msg,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (exists) {
        console.log(`⏩ Skipped duplicate inventory notification for ${inv.sellerName}`);
        continue;
      }

      try {
        let receiverId = null;
        if (inv.transferTo) {
          const r = await User.findOne({ name: inv.transferTo });
          if (r) receiverId = r._id;
        }

        const assignCandidate = inv.assignedTo || inv.assignTo;
        if (!receiverId && assignCandidate) {
          if (mongoose.Types.ObjectId.isValid(String(assignCandidate))) {
            receiverId = assignCandidate;
          } else {
            const r2 = await User.findOne({ name: assignCandidate });
            if (r2) receiverId = r2._id;
          }
        }

        const notif = await Notification.create({
          type: "Inventory",
          itemId: inv._id,
          message: msg,
          receiver: receiverId || null,
          meta: {
            inventoryId: inv._id,
            sellerName: inv.sellerName,
            contactNumbers: inv.contactNumbers,
            followUpDate: followUpValue,
            followUpReadable: istTime,
            inventoryType: inv.inventoryType,
            assignTo: assignCandidate,
            transferTo: inv.transferTo,
            hierarchy: {
              cityId: inv.cityId,
              divisionId: inv.divisionId,
              sectorId: inv.sectorId,
              projectId: inv.projectId,
              towerId: inv.towerId,
              unitId: inv.unitId,
              ...(inv.meta || {}),
            },
          },
        });

        console.log(`✅ Inventory notification created for ${inv.sellerName}`);

        const istOffset = 5.5 * 60 * 60 * 1000;
        const createdAtIST = new Date(notif.createdAt.getTime() + istOffset)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);

        const payload = {
          ...notif.toJSON(),
          createdAt: createdAtIST,
        };

        if (receiverId) {
          await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
        } else {
          emitToAdmins(payload);
          console.log(`📩 Unassigned inventory notification sent to admins`);
        }

      } catch (err) {
        console.error("❌ Inventory notification error:", err);
      }
    }

    if (!leads.length && !inventories.length) {
      console.log("⏸️ No follow-ups this minute.");
    }
  } catch (err) {
    console.error("🚨 followUpCronService error:", err);
  }
});

console.log("✅ Follow-up cron job initialized (runs every minute).");





