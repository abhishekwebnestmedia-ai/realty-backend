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

// 📂 Get root folder contents (when no folderId)
router.get("/", authMiddleware, getFolderContents);

// 📂 Get specific folder contents
router.get("/:folderId", authMiddleware, getFolderContents);

// 🗑️ Delete file/folder
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;
