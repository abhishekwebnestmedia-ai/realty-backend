
const Inventory = require('../models/inventryModel'); 


// exports.createInventry = async (req, res) => {
//   try {
//     const record = new Inventory(req.body);
//     await record.save();
//     res.status(201).json(record);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };


// exports.getInventryById = async (req, res) => {
//   try {
//     const record = await Inventory.findById(req.params.id);
//     if (!record) {
//       return res.status(404).json({ error: "Record not found" });
//     }
//     res.json(record);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };




// exports.bulkUploadInventry = async (req, res) => {
//   try {
//     const { records } = req.body;

//     if (!Array.isArray(records) || records.length === 0) {
//       return res.status(400).json({ message: "Records array is required" });
//     }

//     // Insert many inventory records
//     const insertedRecords = await Inventory.insertMany(records, { ordered: false });

//     res.status(201).json({
//       message: "Bulk upload successful",
//       insertedCount: insertedRecords.length,
//       insertedRecords,
//     });
//   } catch (err) {
//     console.error("Bulk upload error:", err);

//     res.status(500).json({
//       message: "Error during bulk upload",
//       error: err.message,
//     });
//   }
// };



// exports.updateInventry = async (req, res) => {
//   try {
//     const record = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!record) {
//       return res.status(404).json({ error: 'Record not found' });
//     }
//     res.json(record);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };


// exports.deleteInventry = async (req, res) => {
//   try {
//     const record = await Inventory.findByIdAndDelete(req.params.id);
//     if (!record) {
//       return res.status(404).json({ error: 'Record not found' });
//     }
//     res.json({ message: 'Record deleted' });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };


// exports.getAllInventry = async (req, res) => {
//   try {
//     const records = await Inventory.find().sort({ createdAt: -1 }); // Sort by createdAt descending
//     res.json(records);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// controllers/inventoryController.js


// ✅ Helper to dynamically push values into array fields if not already present
const addDynamicValue = async (field, value) => {
  try {
    // Ensure value is an array (so we can push multiple at once)
    const values = Array.isArray(value) ? value : [value];

    // Update all docs to ensure enum-like unique push
    await Inventory.updateMany(
      {}, 
      { $addToSet: { [field]: { $each: values } } }
    );
  } catch (err) {
    console.error(`Error adding dynamic value to ${field}:`, err.message);
  }
};

// ✅ Create Inventory
exports.createInventory = async (req, res) => {
  try {
    const { source, paymentStatus, typology } = req.body;

    // Dynamically add values
    if (source) await addDynamicValue("source", source);
    if (paymentStatus) await addDynamicValue("paymentStatus", paymentStatus);
    if (typology) await addDynamicValue("typology", typology);

    // Ensure fields are arrays
    const cleanBody = {
      ...req.body,
      source: source ? (Array.isArray(source) ? source : [source]) : [],
      paymentStatus: paymentStatus ? (Array.isArray(paymentStatus) ? paymentStatus : [paymentStatus]) : [],
      typology: typology ? (Array.isArray(typology) ? typology : [typology]) : []
    };

    // Save record
    const record = new Inventory(cleanBody);
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Helper function to add dynamic value to fields
async function addDynamicValue(field, value) {
  const validFields = ['source', 'paymentStatus', 'typology'];
  if (!validFields.includes(field)) {
    throw new Error('Invalid field for dynamic value addition');
  }

  await Inventory.updateMany(
    {},
    { $addToSet: { [field]: value } } // Adds to array if not already present
  );
}


exports.updateInventry = async (req, res) => {
  try {
    const { source, paymentStatus, typology } = req.body;

    // Ensure to add dynamic values before updating the record
    if (source) await addDynamicValue('source', source);
    if (paymentStatus) await addDynamicValue('paymentStatus', paymentStatus);
    if (typology) await addDynamicValue('typology', typology);

    const record = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



exports.bulkUploadInventry = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "Records array is required" });
    }

    // Loop through records and add dynamic values
    for (const record of records) {
      if (record.source) await addDynamicValue('source', record.source);
      if (record.paymentStatus) await addDynamicValue('paymentStatus', record.paymentStatus);
      if (record.typology) await addDynamicValue('typology', record.typology);
    }

    // Insert many inventory records
    const insertedRecords = await Inventory.insertMany(records, { ordered: false });

    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: insertedRecords.length,
      insertedRecords,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({
      message: "Error during bulk upload",
      error: err.message,
    });
  }
};


exports.deleteInventry = async (req, res) => {
  try {
    const record = await Inventory.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getInventryById = async (req, res) => {
  try {
    const record = await Inventory.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getAllInventry = async (req, res) => {
  try {
    const records = await Inventory.find().sort({ createdAt: -1 }); // Sort by createdAt descending
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
