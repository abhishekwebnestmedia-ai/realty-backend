const cron = require("node-cron");
const mongoose = require('mongoose');
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Broker = require("../models/broker");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitNotification, emitToAdmins } = require("../utils/socketEmitter");

// 🔹 Convert JS Date → "YYYY-MM-DDTHH:mm:ss+05:30" (IST)
function toISTISOString(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().split(".")[0] + "+05:30";
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

    const startStr = toISTISOString(targetStart);
    const endStr = toISTISOString(targetEnd);

    console.log(`🔍 Checking follow-ups between ${startStr} and ${endStr}`);

    // ----------------- LEADS -----------------
    const leads = await Lead.find({
      followUp: { $gte: startStr, $lte: endStr },
    });




    // ----------------- INVENTORIES -----------------

  for (const lead of leads) {
  // ✅ Use correct fields from Lead model
  const msg = `🔔 Reminder: Follow up with ${lead.customerName} (${lead.contactNumber}). Requirement: ${lead.projects || lead.remark || "N/A"}.`;

  // 🧠 Prevent duplicate notifications within 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  const exists = await Notification.findOne({
    type: "Lead",
    itemId: lead._id,
    message: msg,
    createdAt: { $gte: twoMinutesAgo },
  });

  if (exists) {
    console.log(`⏩ Skipped duplicate lead notification for ${lead.clientName}`);
    continue;
  }

  try {
    // ✅ Create notification
    const notif = await Notification.create({
      type: "Lead",
      itemId: lead._id,
      message: msg,
    });

    console.log(`✅ Lead notification created for ${lead.clientName}`);

    // 🕒 Convert timestamp to IST for payload
    const istOffset = 5.5 * 60 * 60 * 1000;
    const createdAtIST = new Date(notif.createdAt.getTime() + istOffset)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const payload = {
      type: "Lead",
      itemId: lead._id,
      message: msg,
      createdAt: createdAtIST,
    };

    // 🔔 Determine recipient: transferTo (name) -> assignTo (id or name) -> admins
    try {
      let receiverId = null;
      if (lead.transferTo) {
        const r = await User.findOne({ name: lead.transferTo });
        if (r) receiverId = r._id;
      }

      if (!receiverId && lead.assignedTo) {
        if (mongoose.Types.ObjectId.isValid(String(lead.assignedTo))) {
          receiverId = lead.assignedTo;
        } else {
          const r2 = await User.findOne({ name: lead.assignedTo });
          if (r2) receiverId = r2._id;
        }
      }

      if (receiverId) {
        await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
      } else {
        emitToAdmins(payload);
        console.log(`📩 Unassigned lead notification sent to admins`);
      }
    } catch (e) {
      console.error("❌ Error resolving lead recipient:", e);
      emitToAdmins(payload);
    }

  } catch (err) {
    console.error(`❌ Lead notification error for ${lead.clientName}:`, err);
  }
}

    
    
    const inventories = await Inventory.find({
      followUpDate: { $gte: startStr, $lte: endStr },
    });

    for (const inv of inventories) {
      const istTime = formatIST(inv.followUpDate);
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
        const notif = await Notification.create({
          type: "Inventory",
          itemId: inv._id,
          message: msg,
        });

        console.log(`✅ Inventory notification created for ${inv.sellerName}`);

        const payload = {
          type: "Inventory",
          itemId: inv._id,
          message: msg,
          createdAt: notif.createdAt,
        };

        // Determine receiver for inventory: transferTo -> assignTo -> admins
        try {
          let receiverId = null;
          if (inv.transferTo) {
            const r = await User.findOne({ name: inv.transferTo });
            if (r) receiverId = r._id;
          }

          if (!receiverId && inv.assignedTo) {
            if (mongoose.Types.ObjectId.isValid(String(inv.assignedTo))) {
              receiverId = inv.assignedTo;
            } else {
              const r2 = await User.findOne({ name: inv.assignedTo });
              if (r2) receiverId = r2._id;
            }
          }

          if (receiverId) {
            await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
          } else {
            emitToAdmins(payload);
            console.log(`📩 Unassigned inventory notification sent to admins`);
          }
        } catch (e) {
          console.error("❌ Error resolving inventory recipient:", e);
          emitToAdmins(payload);
        }

      } catch (err) {
        console.error("❌ Inventory notification error:", err);
      }
    }

    // ----------------- BROKERS -----------------
    // Broker model stores followUpDate as a Date; query using Date range
    const brokers = await Broker.find({
      followUpDate: { $gte: targetStart, $lte: targetEnd },
    });

    for (const b of brokers) {
      const istTime = formatIST(b.followUpDate);
      const msg = `🔔 Reminder: Follow up with ${b.brokerName} (${b.contactNumber || 'N/A'}) at ${istTime} IST. Requirement: ${b.requirement || 'N/A'}.`;

      const exists = await Notification.findOne({
        type: "Broker",
        itemId: b._id,
        message: msg,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (exists) {
        console.log(`⏩ Skipped duplicate broker notification for ${b.brokerName}`);
        continue;
      }

      try {
        const notif = await Notification.create({
          type: "Broker",
          itemId: b._id,
          message: msg,
        });

        console.log(`✅ Broker notification created for ${b.brokerName}`);

        const payload = {
          type: "Broker",
          itemId: b._id,
          message: msg,
          createdAt: notif.createdAt,
        };

        // Determine receiver for broker: transferTo -> assignTo -> admins
        try {
          let receiverId = null;
          if (b.transferTo) {
            const r = await User.findOne({ name: b.transferTo });
            if (r) receiverId = r._id;
          }

          if (!receiverId && b.assignedTo) {
            if (mongoose.Types.ObjectId.isValid(String(b.assignedTo))) {
              receiverId = b.assignedTo;
            } else {
              const r2 = await User.findOne({ name: b.assignedTo });
              if (r2) receiverId = r2._id;
            }
          }

          if (receiverId) {
            await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
          } else {
            emitToAdmins(payload);
            console.log(`📩 Unassigned broker notification sent to admins`);
          }
        } catch (e) {
          console.error("❌ Error resolving broker recipient:", e);
          emitToAdmins(payload);
        }

      } catch (err) {
        console.error("❌ Broker notification error:", err);
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





