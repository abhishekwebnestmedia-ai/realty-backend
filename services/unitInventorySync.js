const mongoose = require('mongoose');
const Inventory = require('../models/inventryModel');
const Notification = require('../models/notification');
const User = require('../models/user');
const { emitNotification, emitToAdmins } = require('../utils/socketEmitter');

const STATUS_SALE = 'interested in calling';
const STATUS_RENTAL = 'rental';

const INVENTORY_TYPE_MAP = {
  [STATUS_SALE]: 'Sales',
  [STATUS_RENTAL]: 'Rent',
};

const normalize = (value = '') => String(value || '')
  .trim()
  .toLowerCase();

function determineInventoryIntent(status) {
  const normalized = normalize(status);
  if (normalized === STATUS_SALE) {
    return { shouldSync: true, targetType: INVENTORY_TYPE_MAP[STATUS_SALE], label: 'For Sale', normalized };
  }
  if (normalized === STATUS_RENTAL) {
    return { shouldSync: true, targetType: INVENTORY_TYPE_MAP[STATUS_RENTAL], label: 'Rental', normalized };
  }
  return { shouldSync: false, targetType: null, label: null, normalized };
}

function buildHierarchyMeta({
  category,
  projectcategory,
  city,
  division,
  sector,
  project,
  tower,
  unit,
}) {
  if (!unit) return null;
  return {
    cityId: city?._id?.toString?.() || null,
    divisionId: division?._id?.toString?.() || null,
    sectorId: sector?._id?.toString?.() || null,
    projectId: project?._id?.toString?.() || null,
    towerId: tower?._id?.toString?.() || null,
    category,
    projectcategory,
    unitId: unit?._id?.toString?.() || null,
    cityName: city?.cityName || null,
    divisionName: division?.divisionName || null,
    sectorName: sector?.sectorName || null,
    projectName: project?.projectName || null,
    towerName: tower?.towerName || null,
    unitNumber: unit?.unitNumber || null,
  };
}

function snapshotUnit(unit = {}) {
  if (!unit) return {};
  return {
    _id: unit._id?.toString?.() || null,
    unitNumber: unit.unitNumber || null,
    ownerName: unit.ownerName || null,
    mobileNumbers: normalizeMobileNumbers(unit.mobileNumbers),
    email: unit.email || null,
    status: unit.status || null,
    remarks: unit.remarks || null,
    assignTo: unit.assignTo || null,
  };
}

// Ensure mobile numbers are always returned as an array of trimmed strings
function normalizeMobileNumbers(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (typeof raw === 'object') {
    try {
      return Object.values(raw)
        .flat()
        .map(String)
        .map(s => s.trim())
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  return [];
}

async function resolveReceiverFromInventory(inv) {
  try {
    if (!inv) return null;

    if (inv.transferTo) {
      const transferUser = await User.findOne({ name: inv.transferTo });
      if (transferUser) return transferUser._id;
    }

    if (inv.assignTo) {
      if (mongoose.Types.ObjectId.isValid(String(inv.assignTo))) {
        return inv.assignTo;
      }
      const assignUser = await User.findOne({
        $or: [{ name: inv.assignTo }, { email: inv.assignTo }],
      });
      if (assignUser) return assignUser._id;
    }
  } catch (err) {
    console.warn('resolveReceiverFromInventory failed:', err.message);
  }

  return null;
}

async function createInventoryNotification({
  inventory,
  message,
  action,
  meta = {},
  changedBy = 'System',
  emitToAdmin = true,
}) {
  if (!inventory) return null;

  const receiverId = await resolveReceiverFromInventory(inventory);
  const payloadMeta = {
    inventoryId: inventory._id,
    inventoryType: inventory.inventoryType,
    ...inventory.meta,
    ...meta,
  };

  // Ensure any unit snapshot in meta has normalized mobileNumbers
  if (payloadMeta.unit) {
    payloadMeta.unit.mobileNumbers = normalizeMobileNumbers(payloadMeta.unit.mobileNumbers);
  }

  const notif = await Notification.create({
    type: 'Inventory',
    itemId: inventory._id,
    message,
    action,
    changedBy,
    receiver: receiverId || null,
    meta: payloadMeta,
  });

  const payload = notif.toJSON();
  payload.meta = payloadMeta;

  if (receiverId) {
    await emitNotification(receiverId.toString(), payload, { emitToAdmin });
  } else {
    emitToAdmins(payload);
  }

  return notif;
}

async function upsertInventoryFromUnit({
  unit,
  hierarchy,
  targetType,
  actor,
}) {
  if (!unit || !hierarchy) return null;

  const base = {
    sellerName: unit.ownerName || '',
    unitNumber: unit.unitNumber,
    towerNo: hierarchy.towerName || '',
    sector: hierarchy.sectorName || '',
    Project: hierarchy.projectName ? [hierarchy.projectName] : [],
    contactNumbers: normalizeMobileNumbers(unit.mobileNumbers),
    remarks: unit.remarks || '',
    inventoryType: targetType,
    assignTo: unit.assignTo || null,
    capturedBy: actor?.name || 'System',
    status: unit.status,
    category: hierarchy.category,
    projectcategory: hierarchy.projectcategory,
    cityId: hierarchy.cityId,
    divisionId: hierarchy.divisionId,
    sectorId: hierarchy.sectorId,
    projectId: hierarchy.projectId,
    towerId: hierarchy.towerId,
    unitId: hierarchy.unitId,
    meta: {
      cityName: hierarchy.cityName,
      divisionName: hierarchy.divisionName,
      sectorName: hierarchy.sectorName,
      projectName: hierarchy.projectName,
      towerName: hierarchy.towerName,
      unitNumber: unit.unitNumber,
    },
  };

  if (actor?._id) {
    base.approvedAt = new Date();
    base.approvedBy = actor._id;
  }

  let inventory = await Inventory.findOne({ unitId: hierarchy.unitId });
  const isNew = !inventory;

  if (inventory) {
    Object.assign(inventory, base);
    inventory = await inventory.save();
  } else {
    inventory = await Inventory.create(base);
  }

  return { inventory, isNew };
}

async function notifyAdminsForApproval({ unit, hierarchy, targetType, requestedBy }) {
  if (!unit || !hierarchy) return null;

  // ensure we have a canonical unitId to use in queries / payloads
  const unitId = hierarchy.unitId || (unit && unit._id ? unit._id.toString() : null);

  const existing = await Notification.findOne({
    type: 'Inventory',
    action: 'inventory_approval',
    itemId: unitId,
    read: false,
  });

  if (existing) {
    return existing;
  }

  // ensure hierarchy includes unitId so frontend can build approve URL
  const ensuredHierarchy = Object.assign({}, hierarchy || {}, { unitId: unitId });

  const payloadMeta = {
    action: 'inventory_approval',
    targetType,
    requestedBy: requestedBy
      ? { id: requestedBy._id, name: requestedBy.name, email: requestedBy.email }
      : null,
    hierarchy: ensuredHierarchy,
    unit: snapshotUnit(unit),
  };

  const notif = await Notification.create({
    type: 'Inventory',
    itemId: unitId,
    action: 'inventory_approval',
    message: `Approval needed: Unit "${unit.unitNumber}" marked as ${targetType === 'Rent' ? 'Rental' : 'For Sale'} by ${requestedBy?.name || 'User'}`,
    changedBy: requestedBy?.name || 'User',
    meta: payloadMeta,
  });

  const payload = notif.toJSON();
  payload.meta = payloadMeta;
  emitToAdmins(payload);
  return notif;
}

module.exports = {
  determineInventoryIntent,
  buildHierarchyMeta,
  snapshotUnit,
  upsertInventoryFromUnit,
  notifyAdminsForApproval,
  createInventoryNotification,
};
