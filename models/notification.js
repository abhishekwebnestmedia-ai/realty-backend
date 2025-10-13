// const mongoose = require("mongoose");

// const notificationSchema = new mongoose.Schema({
//   type: { type: String, enum: ["Lead", "Inventory"], required: true },
//   itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   message: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Notification", notificationSchema);


const mongoose = require("mongoose");

function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours
  return new Date(now.getTime() + istOffset);
}

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Lead", "Inventory"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: getISTDate },
});

// ✅ Ensure createdAt always in IST (when inserted manually)
notificationSchema.pre("save", function (next) {
  if (!this.createdAt) {
    this.createdAt = getISTDate();
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
