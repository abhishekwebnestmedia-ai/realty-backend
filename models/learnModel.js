// models/learn.js
const mongoose = require("mongoose");

const learnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["folder", "file"], required: true },

    // parent folder reference (null means it's root)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Learn",
      default: null,
    },

    // For files only
    fileUrl: { type: String },
    fileType: { type: String }, // mp3, mp4, pdf, xlsx, etc.
    size: { type: Number }, // in bytes

    // user who uploaded
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Learn", learnSchema);
