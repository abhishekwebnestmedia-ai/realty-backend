const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const learnupload = require("../middleware/learnupload");
const {
  createFolder,
  uploadFile,
  getFolderContents,
  deleteItem,
} = require("../controllers/learnController");

// 📁 Create new folder
router.post("/folder", authMiddleware, createFolder);

// 📤 Upload a file
router.post("/file", authMiddleware, learnupload.single("file"), uploadFile);

// 📂 Get folder contents (files/subfolders)
router.get("/:folderId?", authMiddleware, getFolderContents);

// 🗑️ Delete file/folder
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;
