


const Lead = require('../models/leadModel');
const User = require('../models/user');
const mongoose = require("mongoose");
const LeadHistory = require("../models/leadHistory");
const Notification = require("../models/notification");
const { emitToAdmins, emitNotification } = require('../utils/socketEmitter');



const validStatuses = [
  "Hot",
  "Not Connected",
  "Serious",
  "Potential",
  "Futuristic",
  "Dead Lead",
  "Completed"
];

const validLeadTypes = ["Buyer", "Rental"];

// 🔹 Helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{7,15}$/.test(phone);

// 🔹 Resolve assignTo: accepts ObjectId, name, or email
async function resolveAssignTo(assignTo) {
  if (!assignTo) return null;

  // If it's a valid ObjectId, try by ID first
  if (mongoose.Types.ObjectId.isValid(assignTo)) {
    const user = await User.findById(assignTo);
    if (user) return user;
  }

  // Otherwise, search by name or email
  return await User.findOne({ $or: [{ name: assignTo }, { email: assignTo }] });
}

// 🔹 Validate Lead Data
function validateLeadData(data, isUpdate = false) {
  if (!isUpdate || data.customerName !== undefined) {
    if (!data.customerName || data.customerName.trim() === '') {
      return "Customer Name is required";
    }
  }
  if (!isUpdate || data.contactNumber !== undefined) {
    if (!data.contactNumber || !isValidPhone(data.contactNumber)) {
      return "Invalid or missing Contact Number";
    }
  }
  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !isValidEmail(data.email)) {
      return "Invalid or missing Email";
    }
  }
  if (!isUpdate || data.status !== undefined) {
    if (!data.status || !validStatuses.includes(data.status)) {
      return "Invalid or missing Status";
    }
  }
  if (!isUpdate || data.leadType !== undefined) {
    if (!data.leadType || !validLeadTypes.includes(data.leadType)) {
      return "Invalid or missing Lead Type";
    }
  }
  return null;
}

// 🔹 Create Lead
exports.createLead = async (req, res) => {
  try {
    const errorMsg = validateLeadData(req.body);
    if (errorMsg) {
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { assignTo, ...leadData } = req.body;

    let user = null;
    if (assignTo) {
      user = await resolveAssignTo(assignTo);
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
    }

    const lead = new Lead({
      ...leadData,
      assignTo: user ? user._id : null,
    });

    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error(" createLead error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 Assign/Reassign Lead
exports.assignLead = async (req, res) => {
  try {
    const { assignTo } = req.body;
    if (!assignTo) {
      return res.status(400).json({ success: false, message: "assignTo field is required" });
    }

    const user = await resolveAssignTo(assignTo);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid assignTo user" });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignTo: user._id },
      { new: true }
    ).populate("assignTo", "name email");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, message: "Lead assigned successfully", data: lead });
  } catch (err) {
    console.error(" assignLead error:", err);
    res.status(500).json({ success: false, message: "Error assigning lead" });
  }
};







// exports.getLeads = async (req, res) => {
//   try {
//     // ✅ Step 1 - Ensure the user is authenticated
//     if (!req.user || !req.user.name) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized access"
//       });
//     }

//     const userRole = req.user.role || "user";
//     const userName = req.user.name;
//     let filter = {};

//     // ✅ Step 2 - Apply filtering only if user is NOT admin
//     if (userRole !== "admin") {
//       const userId = req.user._id?.toString();

//       filter = {
//         $or: [
//           { transferTo: userName }, // Leads transferred to user
//           {
//             $and: [
//               {
//                 $or: [
//                   { transferTo: { $exists: false } },
//                   { transferTo: null },
//                   { transferTo: "" }
//                 ]
//               },
//               {
//                 assignTo: mongoose.isValidObjectId(userId)
//                   ? new mongoose.Types.ObjectId(userId)
//                   : userId
//               }
//             ]
//           }
//         ]
//       };
//     }

//     // ✅ Step 3 - Query leads
//     const leads = await Lead.find(filter)
//       .populate("assignTo", "name email role")
//       .sort({ createdAt: -1 });

//     // ✅ Step 4 - Return response
//     res.status(200).json({
//       success: true,
//       role: userRole,
//       count: leads.length,
//       data: leads
//     });

//   } catch (err) {
//     console.error("❌ getLeads error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error fetching leads"
//     });
//   }
// };


exports.getLeads = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userRole = req.user.role || "user";
    const userId = req.user._id.toString();
    const userName = req.user.name;

    let filter = {};

    // Admin sees all leads (including transferred)
    if (userRole !== "admin") {
      filter = {
        status: { $ne: "Dead Lead" },  // ❌ exclude dead leads
        $or: [
          { transferTo: userName }, // priority 1
          { assignTo: mongoose.isValidObjectId(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId 
          } // priority 2
        ]
      };
    }

    // Fetch leads
    let leads = await Lead.find(filter)
      .populate("assignTo", "name email role")
      .sort({ createdAt: -1 });

    // Reorder to prioritize transferTo first
    if (userRole !== "admin") {
      leads = [
        ...leads.filter(l => l.transferTo === userName),
        ...leads.filter(l =>
          l.assignTo && l.assignTo._id?.toString() === userId && l.transferTo !== userName
        )
      ];
    }

    res.status(200).json({
      success: true,
      role: userRole,
      count: leads.length,
      data: leads,
    });

  } catch (err) {
    console.error("❌ getLeads error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching leads",
    });
  }
};




exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const oldLead = await Lead.findById(id).populate("assignTo", "name email");
    if (!oldLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // ✅ If assignTo provided, resolve to user ID
    if (updateData.assignTo !== undefined) {
      const user = await resolveAssignTo(updateData.assignTo);
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid assignTo user" });
      }
      updateData.assignTo = user._id;
    }

    // ✅ Update the lead
    const updatedLead = await Lead.findByIdAndUpdate(id, updateData, { new: true })
      .populate("assignTo", "name email");

    // ✅ Tracked fields
    const trackedFields = ["status", "assignTo", "capturedBy", "transferTo", "remark", "followUp"];

    // ✅ Identify who made the change
    let changedBy = null;
    if (req.user) {
      const user = await User.findById(req.user._id).select("name email");
      if (user) {
        changedBy = {
          _id: user._id,
          name: user.name,
          email: user.email,
        };
      }
    }

    // ✅ Loop over tracked fields
    for (const field of trackedFields) {
      let oldValue = oldLead[field];
      let newValue = updatedLead[field];

      if (field === "assignTo") {
        oldValue = oldLead.assignTo?.name || "";
        newValue = updatedLead.assignTo?.name || "";
      }

      if (String(oldValue || "") !== String(newValue || "")) {
        // 🔹 Existing functionality — Create history
        await LeadHistory.create({
          leadId: id,
          changedBy,
          field,
          oldValue,
          newValue,
        });

        // 🔹 NEW functionality — Create notifications (safely)
        try {
          // Resolve receiver: prefer transferTo (name) -> assignTo (id or name)
          let receiverId = null;
          if (updatedLead.transferTo) {
            const r = await User.findOne({ name: updatedLead.transferTo });
            if (r) receiverId = r._id;
          }

          if (!receiverId && updatedLead.assignTo) {
            // assignTo may be an ObjectId or a string name
            if (mongoose.Types.ObjectId.isValid(String(updatedLead.assignTo))) {
              receiverId = updatedLead.assignTo;
            } else {
              const r2 = await User.findOne({ name: updatedLead.assignTo });
              if (r2) receiverId = r2._id;
            }
          }

          if (field === "assignTo") {
            const msg = `👤 Lead "${oldLead.customerName}" was reassigned  by ${changedBy?.name || "System"}`;
            const notif = await Notification.create({
              type: "Lead",
              itemId: id,
              message: msg,
              changedBy: changedBy?.name || "System",
              receiver: receiverId || null,
            });

            const payload = { ...notif.toJSON(), leadId: id };
            if (receiverId) {
              // send to specific user and also to admins
              await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
            } else {
              emitToAdmins(payload);
            }
          }

          if (field === "status") {
            const msg = `🔄 Lead "${oldLead.customerName}" status changed by ${changedBy?.name || "System"}`;
            const notif = await Notification.create({
              type: "Lead",
              itemId: id,
              message: msg,
              changedBy: changedBy?.name || "System",
              receiver: receiverId || null,
            });

            const payload = { ...notif.toJSON(), leadId: id };
            if (receiverId) {
              await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
            } else {
              emitToAdmins(payload);
            }
          }
        } catch (notifErr) {
          console.warn("⚠️ Notification creation failed (lead):", notifErr.message);
        }
      }
    }

    res.json({ success: true, message: "Lead updated successfully", data: updatedLead });
  } catch (err) {
    console.error("updateLead error:", err);
    res.status(500).json({ success: false, message: "Error updating lead" });
  }
};




exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lead ID" });
    }

    const lead = await Lead.findById(id).populate("assignTo", "name email");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error(" getLeadById error:", err);
    res.status(500).json({ success: false, message: "Error fetching lead" });
  }
};

exports.bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body; // expecting array

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: Provide an array of lead IDs"
      });
    }

    const result = await Lead.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} leads deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (err) {
    console.error("bulkDeleteLeads error:", err);
    res.status(500).json({ success: false, message: "Error deleting leads" });
  }
};

// 🔹 Delete Lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    console.error(" deleteLead error:", err);
    res.status(500).json({ success: false, message: "Error deleting lead" });
  }
};

// 🔹 Bulk Upload Leads
exports.bulkUploadLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "Leads array is required" });
    }

    const processedLeads = [];
    for (const lead of leads) {
      const errorMsg = validateLeadData(lead);
      if (errorMsg) {
        return res.status(400).json({ message: `Validation failed for ${lead.customerName || "Unknown"}: ${errorMsg}` });
      }

      let user = null;
      if (lead.assignTo) {
        user = await resolveAssignTo(lead.assignTo);
        if (!user) {
          return res.status(400).json({ message: `Invalid assignTo user for lead: ${lead.customerName}` });
        }
      }

      processedLeads.push({
        ...lead,
        assignTo: user ? user._id : null
      });
    }

    const insertedLeads = await Lead.insertMany(processedLeads, { ordered: false });

    res.status(201).json({
      success: true,
      message: "Bulk upload successful",
      insertedCount: insertedLeads.length,
      insertedLeads,
    });
  } catch (error) {
    console.error("❌ bulkUploadLeads error:", error);
    res.status(500).json({
      success: false,
      message: "Error during bulk upload",
      error: error.message,
    });
  }
};





exports.getLeadsByUserName = async (req, res) => {
  try {
    const { name } = req.query; // Example: ?name=Abhishek Singh

    if (!name) {
      return res.status(400).json({ error: "User name is required" });
    }

    // 🔍 Find leads where transferTo matches the provided name (case-insensitive)
    const leads = await Lead.find({
      transferTo: { $regex: new RegExp("^" + name + "$", "i") }
    })
      .populate("assignTo", "name email") // Optional: populate assigned user details
      .sort({ createdAt: -1 });

    if (!leads.length) {
      return res.status(404).json({ message: "No leads found for this user" });
    }

    res.status(200).json(leads);
  } catch (err) {
    console.error("Error fetching leads by transferTo:", err);
    res.status(500).json({ error: "Server error" });
  }
};



exports.bulkAssignLeads = async (req, res) => {
  try {
    const { leadIds, assignTo } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: "leadIds array is required" });
    }
    if (!assignTo) {
      return res.status(400).json({ success: false, message: "assignTo field is required" });
    }

    // Resolve the user
    const user = await resolveAssignTo(assignTo);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid assignTo user" });
    }

    // Bulk update
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { assignTo: user._id } }
    );

    res.json({
      success: true,
      message: ` ${result.modifiedCount} leads assigned successfully to ${user.name}`,
      count: result.modifiedCount,
      assignedTo: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(" bulkAssignLeads error:", err);
    res.status(500).json({ success: false, message: "Error assigning leads in bulk" });
  }
};

// 🔹 Get Lead Count by capturedBy
// 🔹 Get Leads by capturedBy (specific user)
exports.getLeadsByCapturedBy = async (req, res) => {
  try {
    const { capturedBy } = req.query; // pass ?capturedBy=Abhishek

    if (!capturedBy) {
      return res.status(400).json({
        success: false,
        message: "capturedBy query parameter is required (e.g. ?capturedBy=Abhishek)"
      });
    }

    // ✅ Case-insensitive match for capturedBy
    const filter = { capturedBy: { $regex: new RegExp(`^${capturedBy}$`, "i") } };

    // ✅ Fetch all matching leads (most recent first)
    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      capturedBy,
      totalLeads: leads.length,
      leads,
      message: `Total leads captured by ${capturedBy}: ${leads.length}`
    });
  } catch (err) {
    console.error("❌ getLeadsByCapturedBy error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching leads by capturedBy"
    });
  }
};


// controllers/leadController.js (history getter)
exports.getLeadChangeHistory = async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, message: 'Invalid lead ID' });
    }

    const history = await LeadHistory.find({ leadId })
      .sort({ changedAt: -1 });

    return res.status(200).json({
      success: true,
      totalChanges: history.length,
      data: history
    });
  } catch (err) {
    console.error('getLeadChangeHistory error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching lead change history' });
  }
};



// ✅ Receive leads from 99acres.com
// exports.createFrom99acres = async (req, res) => {
//   try {
//     const { secret } = req.query;

//     // 🔒 Validate secret key
//     if (secret !== process.env.LEAD_WEBHOOK_SECRET) {
//       return res.status(403).json({ success: false, message: "Unauthorized source" });
//     }

//     const data = req.body;

//     // ✅ Map incoming fields to your CRM model
//     const leadData = {
//       customerName: data.customerName || data.name || "Unknown",
//       contactNumber: data.contactNumber || data.phone || "",
//       email: data.email || "",
//       status: "Hot", // Default for new leads
//       leadType: "Buyer",
//       requirement: data.requirement || data.project || "",
//       remark: `From 99acres. Project: ${data.project || "N/A"}, City: ${data.city || "N/A"}`,
//       source: "99acres",
//       capturedBy: "99acres",
//     };

//     // ✅ Create lead
//     const lead = new Lead(leadData);
//     await lead.save();

//     // ✅ Optional: Create notification for your CRM
//     try {
//       const notif = await Notification.create({
//         type: "Lead",
//         itemId: lead._id,
//         message: `📥 New lead from 99acres: ${lead.customerName}`,
//         changedBy: "99acres",
//       });

//       // Emit to admin room
//       emitToAdmins({
//         ...notif.toJSON(),
//         leadId: lead._id,
//       });
//     } catch (notifErr) {
//       console.warn("⚠️ Notification failed:", notifErr.message);
//     }

//     res.status(201).json({ success: true, message: "Lead received successfully", data: lead });
//   } catch (err) {
//     console.error("❌ 99acres webhook error:", err);
//     res.status(500).json({ success: false, message: "Server error while receiving lead" });
//   }
// };



// ✅ Receive leads from 99acres.com
// exports.createFrom99acres = async (req, res) => {
//   try {
//     const { secret } = req.query;

//     // 🔒 Validate secret key
//     if (secret !== process.env.LEAD_WEBHOOK_SECRET) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Unauthorized source" });
//     }

//     const data = req.body || {};

//     // 🧠 Helper for safe defaults
//     const safe = (val, fallback) =>
//       val && val.toString().trim() !== "" ? val : fallback;

//     // ✅ Map incoming data to your Lead schema fields (with defaults)
//     const leadData = {
//       customerName: safe(data.customerName || data.name, "Unknown Lead"),
//       contactNumber: safe(data.contactNumber || data.phone, "0000000000"),
//       email: safe(data.email, "unknown@example.com"),
//       status: safe(data.status, "Not Connected"),
//       leadType: safe(data.leadType, "Buyer"),
//       requirement: safe(
//         data.requirement || data.project || data.propertyType,
//         "No specific requirement provided"
//       ),
//       remark: `Lead from 99acres. Project: ${safe(
//         data.project,
//         "N/A"
//       )}, City: ${safe(data.city, "N/A")}, Budget: ${safe(
//         data.budget,
//         "Not mentioned"
//       )}`,
//       source: "99acres",
//       capturedBy: "99acres",
//       Budget: safe(data.budget, "Not Provided"),
//       transferTo: safe(data.assignedAgent, "Unassigned"),
//     };

//     // ✅ Create and save lead
//     const lead = new Lead(leadData);
//     await lead.save();

//     res.status(201).json({
//       success: true,
//       message: "✅ Lead received and saved successfully",
//       data: lead,
//     });
//   } catch (err) {
//     console.error("❌ 99acres webhook error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error while saving 99acres lead",
//     });
//   }
// };

exports.createFrom99acres = async (req, res) => {
  try {
    const { secret } = req.query;

    // 🔒 Validate secret key
    if (secret !== process.env.LEAD_WEBHOOK_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized source",
      });
    }

    const data = req.body || {};

    // 🧠 Helper for safe defaults
    const safe = (val, fallback) =>
      val && val.toString().trim() !== "" ? val : fallback;

    // ✅ Map incoming data to schema fields
    const leadData = {
      customerName: safe(data.customerName || data.name, "Unknown Lead"),
      contactNumber: safe(data.contactNumber || data.phone, "0000000000"),
      email: safe(data.email, "unknown@example.com"),
      status: safe(data.status, "Not Connected"),
      leadType: safe(data.leadType, "Buyer"),

      requirement: safe(
        data.requirement || data.project || data.propertyType,
        "No specific requirement provided"
      ),

      remark: `Lead from 99acres. Project: ${safe(data.project, "N/A")}, City: ${safe(
        data.city,
        "N/A"
      )}, Budget: ${safe(data.budget, "Not mentioned")}`,

      source: "99acres",
      capturedBy: "99acres",
      Budget: safe(data.budget, "Not Provided"),
      transferTo: safe(data.assignedAgent, "Unassigned"),

      // ⛔ Ensure Follow-up remains blank
      followUp: null,
    };

    // 🧾 Create & save the lead
    const lead = new Lead(leadData);
    await lead.save();

    res.status(201).json({
      success: true,
      message: "✅ Lead received and saved successfully",
      data: lead,
    });

  } catch (err) {
    console.error("❌ 99acres webhook error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving 99acres lead",
    });
  }
};




exports.getUnassignedLeads = async (req, res) => {
  try {
    // ✅ Handle only valid leads where assignTo is missing or null
    const unassignedLeads = await Lead.find({
      $or: [
        { assignTo: { $exists: false } },
        { assignTo: null },
        // don't directly check for empty string — instead check with $type
        { assignTo: { $type: 10 } }, // BSON Null
      ],
    }).populate("assignTo", "name email");

    res.status(200).json({
      success: true,
      count: unassignedLeads.length,
      data: unassignedLeads,
    });
  } catch (error) {
    console.error("❌ getUnassignedLeads error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching unassigned leads",
      error: error.message,
    });
  }
};


