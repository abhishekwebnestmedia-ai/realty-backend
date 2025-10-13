// const cron = require("node-cron");
// const Lead = require("../models/leadModel");
// const Inventory = require("../models/inventryModel");
// const Notification = require("../models/notification");

// function getCurrentISTDateTimeMinute() {
//   const now = new Date();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   const ist = new Date(now.getTime() + istOffset);
//   return ist.toISOString().replace("T", " ").substring(0, 16) + ":00";
// }

// // 🔹 Unified follow-up checker (runs every minute)
// cron.schedule("* * * * *", async () => {
//   try {
//     const nowIST = getCurrentISTDateTimeMinute();
//     console.log("🕒 Checking follow-ups for:", nowIST);

//     // -------- LEADS --------
//     const leads = await Lead.find({ followUp: nowIST }).populate("assignTo", "name email");
//     for (const lead of leads) {
//       const msg = `🔔 Lead follow-up: ${lead.customerName} (${lead.contactNumber})`;
//       await Notification.create({
//         type: "Lead",
//         itemId: lead._id,
//         message: msg,
//         forUser: lead.assignTo?._id || null,
//       });
//       if (global.io && lead.assignTo?._id) {
//         global.io.to(lead.assignTo._id.toString()).emit("followup_notification", {
//           type: "Lead",
//           leadId: lead._id,
//           message: msg,
//         });
//       }
//     }

//     // -------- INVENTORY --------
//     const inventories = await Inventory.find({ followUpDate: nowIST });
//     for (const inv of inventories) {
//       const msg = `📦 Inventory follow-up: ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"})`;
//       await Notification.create({
//         type: "Inventory",
//         itemId: inv._id,
//         message: msg,
//         forUser: inv.assignTo || null,
//       });
//       if (global.io && inv.assignTo) {
//         global.io.to(inv.assignTo.toString()).emit("followup_notification", {
//           type: "Inventory",
//           inventoryId: inv._id,
//           message: msg,
//         });
//       }
//     }
//   } catch (err) {
//     console.error("❌ followupCronService error:", err);
//   }
// });

// console.log("✅ Follow-up cron job initialized (every minute).");




// const cron = require("node-cron");
// const Lead = require("../models/leadModel");
// const Inventory = require("../models/inventryModel");
// const Notification = require("../models/notification");

// // ✅ Convert JS Date → IST string ("YYYY-MM-DD HH:mm:ss")
// function formatISTDate(date) {
//   const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours
//   const ist = new Date(date.getTime() + istOffset);
//   return ist.toISOString().replace("T", " ").substring(0, 19);
// }

// // ✅ Unified follow-up checker (runs every minute)
// cron.schedule("* * * * *", async () => {
//   try {
//     const now = new Date();

//     // ±1 minute window
//     const start = new Date(now.getTime() - 60 * 1000);
//     const end = new Date(now.getTime() + 60 * 1000);

//     const startStr = formatISTDate(start);
//     const endStr = formatISTDate(end);

//     console.log(`🕒 Checking follow-ups between ${startStr} and ${endStr}`);

//     // -------- LEADS (field = followUp) --------
//     const leads = await Lead.find({
//       followUp: { $gte: startStr, $lte: endStr }
//     }).populate("assignTo", "name email");

//     for (const lead of leads) {
//       const msg = `🔔 Lead follow-up: ${lead.customerName} (${lead.contactNumber})`;

//       await Notification.create({
//         type: "Lead",
//         itemId: lead._id,
//         message: msg,
//         forUser: lead.assignTo?._id || null,
//       });

//       if (global.io && lead.assignTo?._id) {
//         global.io.to(lead.assignTo._id.toString()).emit("followup_notification", {
//           type: "Lead",
//           leadId: lead._id,
//           message: msg,
//         });
//       }

//       console.log(`✅ Lead notification created: ${lead.customerName}`);
//     }

//     // -------- INVENTORIES (field = followUpDate) --------
//     const inventories = await Inventory.find({
//       followUpDate: { $gte: startStr, $lte: endStr }
//     });

//     for (const inv of inventories) {
//       const msg = `📦 Inventory follow-up: ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"})`;

//       await Notification.create({
//         type: "Inventory",
//         itemId: inv._id,
//         message: msg,
//         forUser: inv.assignTo || null,
//       });

//       if (global.io && inv.assignTo) {
//         global.io.to(inv.assignTo.toString()).emit("followup_notification", {
//           type: "Inventory",
//           inventoryId: inv._id,
//           message: msg,
//         });
//       }

//       console.log(`✅ Inventory notification created: ${inv.sellerName}`);
//     }

//     if (!leads.length && !inventories.length) {
//       console.log("🔕 No follow-ups this minute.");
//     }

//   } catch (err) {
//     console.error("❌ followUpCronService error:", err);
//   }
// });

// console.log("✅ Follow-up cron job initialized (every minute).");


const cron = require("node-cron");
const Lead = require("../models/leadModel");
const Inventory = require("../models/inventryModel");
const Notification = require("../models/notification");

// ✅ Convert JS Date → IST string ("YYYY-MM-DD HH:mm:ss")
function formatISTDate(date) {
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours
  const ist = new Date(date.getTime() + istOffset);
  return ist.toISOString().replace("T", " ").substring(0, 19);
}

// ✅ Unified follow-up checker (runs every minute)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // ±1 minute window
    const start = new Date(now.getTime() - 60 * 1000);
    const end = new Date(now.getTime() + 60 * 1000);

    const startStr = formatISTDate(start);
    const endStr = formatISTDate(end);

    console.log(` Checking follow-ups between ${startStr} and ${endStr}`);

    // -------- LEADS --------
    const leads = await Lead.find({
      followUp: { $gte: startStr, $lte: endStr }
    });

    for (const lead of leads) {
      const msg = ` Lead follow-up: ${lead.customerName} (${lead.contactNumber})`;

      await Notification.create({
        type: "Lead",
        itemId: lead._id,
        message: msg,
      });

      if (global.io) {
        global.io.emit("followup_notification", {
          type: "Lead",
          leadId: lead._id,
          message: msg,
        });
      }

      console.log(` Lead notification created: ${lead.customerName}`);
    }

    // -------- INVENTORIES --------
    const inventories = await Inventory.find({
      followUpDate: { $gte: startStr, $lte: endStr }
    });

    for (const inv of inventories) {
      const msg = `📦 Inventory follow-up: ${inv.sellerName} (${inv.contactNumbers?.[0] || "N/A"})`;

      await Notification.create({
        type: "Inventory",
        itemId: inv._id,
        message: msg,
      });

      if (global.io) {
        global.io.emit("followup_notification", {
          type: "Inventory",
          inventoryId: inv._id,
          message: msg,
        });
      }

      console.log(` Inventory notification created: ${inv.sellerName}`);
    }

    if (!leads.length && !inventories.length) {
      console.log(" No follow-ups this minute.");
    }

  } catch (err) {
    console.error(" followUpCronService error:", err);
  }
});

console.log(" Follow-up cron job initialized (every minute).");
