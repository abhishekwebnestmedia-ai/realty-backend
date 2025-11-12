


// const cron = require("node-cron");
// const Lead = require("../models/leadModel");
// const Inventory = require("../models/inventryModel");
// const Notification = require("../models/notification");
// const { emitNotification } = require("../utils/socketEmitter"); // ✅ helper

// // ✅ Convert JS Date → IST string ("YYYY-MM-DD HH:mm:ss")
// function formatISTDate(date) {
//   const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hrs
//   const ist = new Date(date.getTime() + istOffset);
//   return ist.toISOString().replace("T", " ").substring(0, 19);
// }

// // ✅ Unified follow-up checker (runs every minute)
// cron.schedule("* * * * *", async () => {
//   try {
//     const now = new Date();

//     // --- Trigger 1 minute BEFORE follow-up time ---
//     const targetStart = new Date(now.getTime() + 30 * 1000); // +30 sec
//     const targetEnd = new Date(now.getTime() + 90 * 1000);   // +90 sec

//     const startStr = formatISTDate(targetStart);
//     const endStr = formatISTDate(targetEnd);

//     console.log(` Checking follow-ups (1 min before) between ${startStr} and ${endStr}`);

//     // ----------------- LEADS -----------------
//     const leads = await Lead.find({
//       followUp: { $gte: startStr, $lte: endStr },
//     });

//     for (const lead of leads) {
//       const msg = ` Reminder: Follow up with ${lead.customerName} (${lead.contactNumber}) at ${new Date(lead.followUp).toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//       })}. Requirement: ${lead.requirement}.`;

//       // 🔹 Prevent duplicates created within last 2 mins
//       const exists = await Notification.findOne({
//         type: "Lead",
//         itemId: lead._id,
//         message: msg,
//         createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
//       });

//       if (exists) {
//         console.log(` Skipped duplicate lead notification for ${lead.customerName}`);
//         continue;
//       }

//       try {
//         const notif = await Notification.create({
//           type: "Lead",
//           itemId: lead._id,
//           message: msg,
//         });

//         console.log(` Lead notification created for ${lead.customerName}`);

//         // ✅ Emit to notif_${userId}
//         const payload = {
//           type: "Lead",
//           itemId: lead._id,
//           message: msg,
//           createdAt: notif.createdAt,
//         };

//         // If your Lead model has assigned user, send to them
//         if (lead.assignedTo) {
//           emitNotification(lead.assignedTo.toString(), payload);
//         } else {
//           // Fallback broadcast (admins, etc.)
//           global.io.emit("notification_received", payload);
//         }

//       } catch (err) {
//         if (err.code === 11000) {
//           console.log(` Duplicate lead notification blocked by DB: ${lead.customerName}`);
//         } else {
//           console.error(" Lead notification error:", err);
//         }
//       }
//     }

//     // ----------------- INVENTORIES -----------------
//     const inventories = await Inventory.find({
//       followUpDate: { $gte: startStr, $lte: endStr },
//     });

//     for (const inv of inventories) {
//       const msg = ` Reminder: Follow up with ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"}) at ${new Date(inv.followUpDate).toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//       })}. Property in sector ${inv.sector || "N/A"} — Demand: ${inv.demand || "N/A"}.`;

//       // 🔹 Prevent duplicates created within last 2 mins
//       const exists = await Notification.findOne({
//         type: "Inventory",
//         itemId: inv._id,
//         message: msg,
//         createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
//       });

//       if (exists) {
//         console.log(` Skipped duplicate inventory notification for ${inv.sellerName}`);
//         continue;
//       }

//       try {
//         const notif = await Notification.create({
//           type: "Inventory",
//           itemId: inv._id,
//           message: msg,
//         });

//         console.log(` Inventory notification created for ${inv.sellerName}`);

//         // ✅ Emit to notif_${userId}
//         const payload = {
//           type: "Inventory",
//           itemId: inv._id,
//           message: msg,
//           createdAt: notif.createdAt,
//         };

//         if (inv.assignedTo) {
//           emitNotification(inv.assignedTo.toString(), payload);
//         } else {
//           global.io.emit("notification_received", payload);
//         }

//       } catch (err) {
//         if (err.code === 11000) {
//           console.log(` Duplicate inventory notification blocked by DB: ${inv.sellerName}`);
//         } else {
//           console.error(" Inventory notification error:", err);
//         }
//       }
//     }

//     if (!leads.length && !inventories.length) {
//       console.log(" No follow-ups this minute.");
//     }
//   } catch (err) {
//     console.error(" followUpCronService error:", err);
//   }
// });

// console.log(" Follow-up cron job initialized (every minute).");



const cron = require("node-cron");
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Notification = require("../models/notification");
const { emitNotification } = require("../utils/socketEmitter");

// 🕒 Unified follow-up checker (runs every minute)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // --- 🔹 Trigger exactly at follow-up time (±30 seconds window) ---
    const targetStart = new Date(now.getTime() - 30 * 1000);
    const targetEnd = new Date(now.getTime() + 30 * 1000);

    console.log(`🔍 Checking follow-ups between ${targetStart.toISOString()} and ${targetEnd.toISOString()}`);

    // ----------------- LEADS -----------------
    const leads = await Lead.find({
      followUp: { $gte: targetStart, $lte: targetEnd },
    });

    for (const lead of leads) {
      const msg = `🔔 Reminder: Follow up with ${lead.customerName} (${lead.contactNumber}) at ${new Date(lead.followUp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}. Requirement: ${lead.requirement || "N/A"}.`;

      // 🧩 Prevent duplicates within last 2 minutes
      const exists = await Notification.findOne({
        type: "Lead",
        itemId: lead._id,
        message: msg,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (exists) {
        console.log(`⏩ Skipped duplicate lead notification for ${lead.customerName}`);
        continue;
      }

      try {
        const notif = await Notification.create({
          type: "Lead",
          itemId: lead._id,
          message: msg,
        });

        console.log(`✅ Lead notification created for ${lead.customerName}`);

        const payload = {
          type: "Lead",
          itemId: lead._id,
          message: msg,
          createdAt: notif.createdAt,
        };

        // 🔹 Emit notification
        if (lead.assignedTo) {
          emitNotification(lead.assignedTo.toString(), payload);
        } else {
          global.io.emit("notification_received", payload);
        }

      } catch (err) {
        console.error("❌ Lead notification error:", err);
      }
    }

    // ----------------- INVENTORIES -----------------
    const inventories = await Inventory.find({
      followUpDate: { $gte: targetStart, $lte: targetEnd },
    });

    for (const inv of inventories) {
      const msg = `🔔 Reminder: Follow up with ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"}) at ${new Date(inv.followUpDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}. Property in sector ${inv.sector || "N/A"} — Demand: ${inv.demand || "N/A"}.`;

      // 🧩 Prevent duplicates within last 2 minutes
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
