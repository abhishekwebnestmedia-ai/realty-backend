// const mongoose = require('mongoose');

// const performanceSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   date: { type: Date, required: true },
//   morningCommitment: {
//     onlinePortalChecked: { type: Boolean, required: true },
//     whatsappStatus: { type: Boolean, required: true },
//     emailWorking: { type: Number },       
//     buyersWorking: { type: Number },
//     sellersWorking: { type: Number, required: true }
//   },
//   eveningAchievements: {
//     onlinePortalChecked: { type: Boolean, required: true },
//     whatsappStatus: { type: Boolean, required: true },
//     emailWorking: { type: Number },       
//     buyersWorking: { type: Number },
//     sellersWorking: { type: Number, required: true }
//   },
//   meetingVisits: { type: Number },       
//   addNotes: { type: String }                
// });

// module.exports = mongoose.model('DailyPerformance', performanceSchema);


const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  morningCommitment: {
    onlinePortalChecked: { type:  Number, required: true },
    whatsappStatus: { type:  Number, required: true },
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number, required: true }
  },
  eveningAchievements: {
    onlinePortalChecked: { type:  Number, required: true },
    whatsappStatus: { type:  Number, required: true },
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number, required: true }
  },
  meetingVisits: { type: Number },
  addNotes: { type: String }
});

// Add compound unique index on name + date
performanceSchema.index({ name: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyPerformance', performanceSchema);
