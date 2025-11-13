const cron = require("node-cron");
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Notification = require("../models/notification");
const { emitNotification } = require("../utils/socketEmitter");

// 🔹 Convert JS Date → "YYYY-MM-DDTHH:mm:ss+05:30" (IST)
function toISTISOString(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().split(".")[0] + "+05:30";
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

    // 🔔 Emit notification (specific user or global)
    if (lead.assignedTo) {
      await emitNotification(lead.assignedTo.toString(), payload);
    } else {
      global.io.emit("notification_received", payload);
    }

  } catch (err) {
    console.error(`❌ Lead notification error for ${lead.clientName}:`, err);
  }
}

    
    
    const inventories = await Inventory.find({
      followUpDate: { $gte: startStr, $lte: endStr },
    });

    for (const inv of inventories) {
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"}) at ${new Date(inv.followUpDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}. Property in sector ${inv.sector || "N/A"} — Demand: ${inv.demand || "N/A"}.`;

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

        if (inv.assignedTo) {
          emitNotification(inv.assignedTo.toString(), payload);
        } else {
          global.io.emit("notification_received", payload);
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





