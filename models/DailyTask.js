

const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  morningCommitment: {
    onlinePortalChecked: { type: Boolean, default: false },
    whatsappStatus: { type: Boolean, default: false },
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number }
  },
  eveningAchievements: {
    onlinePortalChecked: { type: Boolean, default: false },
    whatsappStatus: { type: Boolean, default: false },
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number }
  },
  meetingVisits: { type: Number },
  addNotes: { type: String },
  planstatus: { type: Number, default: 0 }
}, { timestamps: true }); // optional — adds createdAt, updatedAt

// Unique index
performanceSchema.index({ name: 1, date: 1 }, { unique: true });

/**
 * ✅ Convert date fields to Indian Standard Time (IST)
 * and format as YYYY-MM-DD
 */
performanceSchema.set('toJSON', {
  transform: function (doc, ret) {
    const toIST = (utcDate) => {
      if (!utcDate) return null;
      const istOffset = 5.5 * 60 * 60 * 1000; // +05:30 offset in ms
      const istDate = new Date(utcDate.getTime() + istOffset);
      return istDate.toISOString().split('T')[0]; // format YYYY-MM-DD
    };

    if (ret.date) ret.date = toIST(ret.date);
    if (ret.createdAt) ret.createdAt = toIST(ret.createdAt);
    if (ret.updatedAt) ret.updatedAt = toIST(ret.updatedAt);

    return ret;
  }
});

module.exports = mongoose.model('DailyPerformance', performanceSchema);
