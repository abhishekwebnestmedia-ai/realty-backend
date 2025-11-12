const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const learnupload = require("../middleware/learnupload");
const {
  createFolder,
  uploadFile,
  getFolderContents,
  deleteItem,
  updateItem,
  getAllFolders, // ✅ Added update function
  deleteFile,
} = require("../controllers/learnController");

// 📁 Create new folder
router.post("/folder", authMiddleware, createFolder);


// 📤 Upload a file
router.post("/file", authMiddleware, learnupload.single("file"), uploadFile);
router.delete("/file/:id", authMiddleware, deleteFile); // 👈 New route



// 📁 Get all folders
router.get("/all/folders", authMiddleware, getAllFolders);

// 📂 Get root folder contents (when no folderId)
router.get("/", authMiddleware, getFolderContents);

// 📂 Get specific folder contents
router.get("/:folderId", authMiddleware, getFolderContents);

// ✏️ Update folder or file (rename or move)
router.put("/:id", authMiddleware, updateItem); // ✅ Added this route

// 🗑️ Delete file/folder
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;
