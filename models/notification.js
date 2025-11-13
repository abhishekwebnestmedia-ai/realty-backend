

const mongoose = require("mongoose");

// ✅ Helper to get IST time
function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

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
    changedBy: {
      type: String, // user name or user ID
    },
    createdAt: {
      type: Date,
      default: getISTDate,
    },
  },
  { versionKey: false }
);

// ✅ Always ensure IST time
notificationSchema.pre("save", function (next) {
  if (!this.createdAt) this.createdAt = getISTDate();
  next();
});

// ✅ Prevent duplicate notifications
notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// ✅ Format createdAt before sending to frontend
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  const istOffset = 5.5 * 60 * 60 * 1000;
  if (obj.createdAt) {
    obj.createdAt = new Date(obj.createdAt.getTime() + istOffset)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
  }
  return obj;
};

// ✅ Auto-emit real-time notifications after saving
// Note: Disabled auto-emit to prevent duplicate emissions.
// Controllers should explicitly call emitToAdmins() or emitNotification() after creating notifications.
// notificationSchema.post("save", function (doc) {
//   try {
//     const { emitToAdmins } = require("../utils/socketEmitter");
//     // Send notification to admin room
//     emitToAdmins(doc.toJSON());
//     console.log(`📢 Auto-emitted notification to admins`);
//   } catch (err) {
//     console.error("❌ Error auto-emitting notification:", err);
//   }
// });

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
