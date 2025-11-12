const multer = require("multer");
const path = require("path");

// Storage setup for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const learnupload = multer({ storage });

module.exports = learnupload;
