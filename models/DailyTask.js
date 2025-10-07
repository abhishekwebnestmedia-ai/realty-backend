

// const mongoose = require('mongoose');

// const performanceSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   date: { type: Date, required: true },
//   morningCommitment: {
//     onlinePortalChecked: { type:  Number, required: true },
//     whatsappStatus: { type:  Number, required: true },
//     emailWorking: { type: Number },
//     buyersWorking: { type: Number },
//     sellersWorking: { type: Number, required: true }
//   },
//   eveningAchievements: {
//     onlinePortalChecked: { type:  Number, required: true },
//     whatsappStatus: { type:  Number, required: true },
//     emailWorking: { type: Number },
//     buyersWorking: { type: Number },
//     sellersWorking: { type: Number, required: true }
//   },
//   meetingVisits: { type: Number },
//   addNotes: { type: String }
// });


// performanceSchema.index({ name: 1, date: 1 }, { unique: true });

// module.exports = mongoose.model('DailyPerformance', performanceSchema);



const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  morningCommitment: {
    onlinePortalChecked: { type: Boolean, default: false },
    whatsappStatus: { type: Boolean, default: false },
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number,}
  },
  eveningAchievements: {
    onlinePortalChecked: { type: Boolean , default: false},
    whatsappStatus: { type: Boolean , default: false},
    emailWorking: { type: Number },
    buyersWorking: { type: Number },
    sellersWorking: { type: Number }
  },
  meetingVisits: { type: Number },
  addNotes: { type: String },
  planstatus: { type: Number, default: 0 }
});

performanceSchema.index({ name: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyPerformance', performanceSchema);
