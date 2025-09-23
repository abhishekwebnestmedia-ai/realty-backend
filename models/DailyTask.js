

const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true }, 
  morningCommitment: {
    onlinePortalChecked: { type: Number, required: true },
    whatsappStatus: { type: Number, required: true },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number, required: true }
  },
  eveningAchievements: {
    onlinePortalChecked: { type: Number, required: true },
    whatsappStatus: { type: Number, required: true },
    buyersWorking: { type: Number }, 
    sellersWorking: { type: Number, required: true }
  }
});

module.exports = mongoose.model('DailyPerformance', performanceSchema);
