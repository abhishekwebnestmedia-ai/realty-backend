

// const mongoose = require("mongoose");

// // ✅ Helper to get IST time
// function getISTDate() {
//   const now = new Date();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   return new Date(now.getTime() + istOffset);
// }

// const notificationSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["Lead", "Inventory"],
//       required: true,
//     },
//     itemId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     message: {
//       type: String,
//       required: true,
//     },
//     changedBy: {
//       type: String, // user name or user ID
//     },
//     createdAt: {
//       type: Date,
//       default: getISTDate,
//     },
//   },
//   { versionKey: false }
// );

// // ✅ Always ensure IST time
// notificationSchema.pre("save", function (next) {
//   if (!this.createdAt) this.createdAt = getISTDate();
//   next();
// });

// // ✅ Prevent duplicate notifications
// notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// // ✅ Format createdAt before sending to frontend
// notificationSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   if (obj.createdAt) {
//     obj.createdAt = new Date(obj.createdAt.getTime() + istOffset)
//       .toISOString()
//       .replace("T", " ")
//       .substring(0, 19);
//   }
//   return obj;
// };

// // ✅ Auto-emit real-time notifications after saving
// notificationSchema.post("save", function (doc) {
//   try {
//     const { emitNotification } = require("../utils/socketEmitter");

//     // If you store userId in changedBy, send to that user
//     const userId = doc.changedBy || "admin"; // fallback to global admin room

//     // Send the notification in real-time
//     emitNotification(userId, doc.toJSON());

//     console.log(`📢 Auto-emitted notification for user: ${userId}`);
//   } catch (err) {
//     console.error("❌ Error auto-emitting notification:", err);
//   }
// });

// module.exports = mongoose.model("Notification", notificationSchema);





const mongoose = require("mongoose");

// ❌ Remove getISTDate()
// Mongo must store UTC always

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Lead", "Inventory"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    changedBy: String,

    // ✔ Save in UTC (correct)
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// ❌ Remove the pre-save hook
// notificationSchema.pre("save", ...)

// ❌ Do NOT add IST twice
// ✔ Convert to IST ONLY here before sending to frontend
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();

  if (obj.createdAt) {
    const ist = new Date(obj.createdAt.getTime() + 5.5 * 60 * 60 * 1000);

    obj.createdAt = ist.toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).replace(",", "");
  }

  return obj;
};

notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// Emit socket
notificationSchema.post("save", function (doc) {
  try {
    const { emitNotification } = require("../utils/socketEmitter");
    const userId = doc.changedBy || "admin";

    emitNotification(userId, doc.toJSON());
  } catch (err) {
    console.error("❌ Error auto-emitting notification:", err);
  }
});

module.exports = mongoose.model("Notification", notificationSchema);

























// const mongoose = require("mongoose");

// // Helper to get IST time
// function getISTDate() {
//   const now = new Date();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   return new Date(now.getTime() + istOffset);
// }

// const notificationSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["Lead", "Inventory"],
//       required: true,
//     },
//     itemId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     message: {
//       type: String,
//       required: true,
//     },
//     changedBy: {
//       type: String,
//     },

//     // 🟢 NEW: Track read/unread list
//     readBy: {
//       type: [String], // store userIds
//       default: [],
//     },

//     createdAt: {
//       type: Date,
//       default: getISTDate,
//     },
//   },
//   { versionKey: false }
// );

// // Always ensure IST time
// notificationSchema.pre("save", function (next) {
//   if (!this.createdAt) this.createdAt = getISTDate();
//   next();
// });

// // Prevent duplicate notifications
// notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// // Format to frontend
// notificationSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   const istOffset = 5.5 * 60 * 60 * 1000;

//   obj.read = obj.readBy.includes(obj.changedBy || "admin");

//   if (obj.createdAt) {
//     obj.createdAt = new Date(obj.createdAt.getTime() + istOffset)
//       .toISOString()
//       .replace("T", " ")
//       .substring(0, 19);
//   }
//   return obj;
// };

// module.exports = mongoose.model("Notification", notificationSchema);
