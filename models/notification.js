const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Lead", "Inventory"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  forUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
