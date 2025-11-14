const cron = require("node-cron");
const Notification = require("../models/notification");

// 🕒 Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const deleteBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      createdAt: { $lte: deleteBefore }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-Cleanup: Deleted ${result.deletedCount} notifications older than 7 days`);
    }
  } catch (err) {
    console.error("❌ Notification cleanup error:", err);
  }
});

console.log("🧹 Notification cleanup cron initialized");

