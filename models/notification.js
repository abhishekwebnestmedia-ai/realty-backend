


const mongoose = require("mongoose");

// We store dates in UTC (Date.now). Formatting to IST is done in toJSON for responses.

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
    action: {
      type: String,
      default: null,
    },
    changedBy: {
      type: String,
    },

    // optional metadata
    meta: {
      type: Object,
      default: () => ({}),
    },
     read: {
      type: Boolean,
      default: false
    },

    // store as UTC timestamp
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },


  },
  { versionKey: false }
);

// Prevent duplicate
notificationSchema.index({ type: 1, itemId: 1, message: 1 });

// Return createdAt as ISO UTC string for frontend to parse and format correctly
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // Return ISO UTC string; frontend will convert to IST as needed
  if (obj.createdAt && obj.createdAt instanceof Date) {
    obj.createdAt = obj.createdAt.toISOString();
  }
  return obj;
};

module.exports = mongoose.model("Notification", notificationSchema);










