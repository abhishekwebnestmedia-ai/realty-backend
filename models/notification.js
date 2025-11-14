


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
      type: String,
    },

    // 👇👇 NEW FIELD ADDED
    meta: {
      type: Object,
      default: null,
    },
     read: {
      type: Boolean,
      default: false
    },

    createdAt: {
      type: Date,
      default: getISTDate,
    },
  },
  { versionKey: false }
);

// Prevent duplicate
notificationSchema.index({ type: 1, itemId: 1, message: 1 }, { unique: true });

// Format IST date on output
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

module.exports = mongoose.model("Notification", notificationSchema);








