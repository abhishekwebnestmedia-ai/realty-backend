const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  morningCommitment: {
    onlinePortalChecked: { type: Boolean, required: true },
    whatsappStatus: { type: Boolean, required: true },
    emailWorking: { type: Number },       // added according to your latest image
    buyersWorking: { type: Number },
    sellersWorking: { type: Number, required: true }
  },
  eveningAchievements: {
    onlinePortalChecked: { type: Boolean, required: true },
    whatsappStatus: { type: Boolean, required: true },
    emailWorking: { type: Number },       // added here too for evening
    buyersWorking: { type: Number },
    sellersWorking: { type: Number, required: true }
  },
  meetingVisits: { type: Number },         // field from your latest image
  addNotes: { type: String }                // added field for 'Add notes'
});

module.exports = mongoose.model('DailyPerformance', performanceSchema);
