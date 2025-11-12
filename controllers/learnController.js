const Learn = require("../models/learnModel");
const path = require("path");
const fs = require("fs");

// ✅ Create Folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parent } = req.body;

    const folder = new Learn({
      name,
      type: "folder",
      parent: parent || null,
      createdBy: req.user._id,
    });

    await folder.save();
    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Upload File
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { parent } = req.body;

    const file = new Learn({
      name: req.file.originalname,
      type: "file",
      parent: parent || null,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: path.extname(req.file.originalname).substring(1),
      size: req.file.size,
      createdBy: req.user._id,
    });

    await file.save();
    res.status(201).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Folder Contents
exports.getFolderContents = async (req, res) => {
  try {
    const { folderId } = req.params;
    const items = await Learn.find({ parent: folderId || null }).sort({ type: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Delete Folder or File (Recursive)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Learn.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // If it's a folder → delete all contents
    if (item.type === "folder") {
      const children = await Learn.find({ parent: id });
      for (const child of children) {
        await exports.deleteItem(
          { params: { id: child._id } },
          { status: () => ({ json: () => {} }) } // dummy res for recursion
        );
      }
    }

    // Delete file from disk if exists
    if (item.type === "file" && item.fileUrl) {
      const filePath = path.join(__dirname, "..", item.fileUrl.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Learn.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Update Folder or File (Rename or Move)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent } = req.body;

    const item = await Learn.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (name) item.name = name;              // Rename
    if (parent !== undefined) item.parent = parent || null; // Move to another folder (or root)

    await item.save();
    res.json({ success: true, message: "Item updated successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
