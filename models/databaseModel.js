const mongoose = require("mongoose");

const databaseSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    divisionName: {
      type: String,
      trim: true,
    },
    typology: {
      type: String,
      trim: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    price: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    pdfLink: {
      type: String,
      trim: true,
    },

    // 🔹 Select Type
    type: {
      type: String,
      enum: ["Residential", "Commercial"],
      required: true,
    },

    // 🔹 Select Construction Type
    constructionType: {
      type: String,
      enum: ["Under Construction", "Ready To Move"],
      required: true,
    },

    // 🔹 Who created the record
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Database", databaseSchema);
