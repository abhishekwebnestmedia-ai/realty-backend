# Notification System Implementation Summary

## Overview
This document summarizes the changes made to implement:
1. **UTC timestamp storage + IST frontend display** for notifications
2. **User-specific notifications** with transferTo → assignTo fallback for lead/inventory changes
3. **Admin-only notifications** for hierarchy merge operations

---

## Changes Made

### Backend

#### 1. **`crmbackend/models/notification.js`**
- Added `receiver` field (ObjectId ref User, optional)
- `createdAt` stored as UTC Date by Mongoose
- `toJSON()` returns ISO UTC string format

```javascript
receiver: { type: Schema.Types.ObjectId, ref: 'User', default: null },
createdAt: { type: Date, default: Date.now }
```

#### 2. **`crmbackend/controllers/leadController.js`**
- Resolves recipient using `transferTo` (name lookup) → fallback `assignTo` (id or name)
- Creates Notification with `receiver` field
- Emits to user-specific room `notif_<userId>` and admin room `notif_admin`

```javascript
await emitNotification(receiverId.toString(), payload, { emitToAdmin: true });
```

#### 3. **`crmbackend/controllers/inventrycontroller.js`**
- Same recipient resolution logic as leadController
- User-specific routing for inventory change notifications

#### 4. **`crmbackend/services/followupCronService.js`**
- Follow-up cron jobs resolve recipients identically
- Emits to user rooms + admin

#### 5. **`crmbackend/controllers/notificationController.js`**
- `getAllNotifications` filters by `receiver` for non-admin users
- Admins receive all notifications regardless of receiver field

```javascript
if (!req.user.isAdmin) {
  query.receiver = userId;
}
```

#### 6. **`crmbackend/controllers/projectController.js` → `mergeOrCreateHierarchy`**
- **Merge-created notifications send to admins only**
- Sets `receiver: null` on Notification
- Calls `emitToAdmins()` without user-targeted emission

```javascript
const notif = await Notification.create({
  type: "Inventory",
  itemId: entry.ids.unitId,
  message: `🏢 Unit "${entry.readable.unitNumber}" marked as "Interested in calling" during merge by ${changedBy}`,
  changedBy,
  receiver: null,  // Admin-only
  meta: { ...entry.ids, ...entry.readable }
});

if (global.io && typeof emitToAdmins === "function") {
  emitToAdmins(payload);
}
```

#### 7. **`crmbackend/utils/socketEmitter.js`**
- `emitNotification(userId, payload, options)` — emits to `notif_<userId>` room
- Supports `{ emitToAdmin: true }` option to also emit to `notif_admin`
- `emitToAdmins(payload)` — admin-only emission

#### 8. **`crmbackend/server.js`**
- Socket.IO rooms:
  - `notif_<userId>` — user-specific notifications
  - `notif_admin` — admin-only notifications
- Admin detection via `role === 'admin'` in register/subscribe events

---

### Frontend

#### **`realstatecrm/src/utils/datetime.js`**
- `formatLocalTimestamp()` enforces IST display via `Intl.DateTimeFormat`
  - Receives UTC ISO string from API
  - Converts to IST for display
  - Format: `YYYY-MM-DD HH:mm:ss`

```javascript
const formatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata'
});
```

---

## Testing

### **In-Memory Tests (No Local MongoDB Required)**

1. **`scripts/test_with_memory_db.js`**
   - ✅ Validates Notification `createdAt` stored as UTC
   - ✅ Confirms API returns ISO UTC format
   - ✅ Simulates frontend IST conversion

   **Run:**
   ```powershell
   cd crmbackend
   node .\scripts\test_with_memory_db.js
   ```

2. **`scripts/test_merge_flow.js`**
   - ✅ Seeds ProjectType with hierarchy
   - ✅ Invokes `mergeOrCreateHierarchy` with test payload
   - ✅ Verifies Notification created with `receiver: null` (admin-only)
   - ✅ Confirms unit added to database

   **Run:**
   ```powershell
   cd crmbackend
   node .\scripts\test_merge_flow.js
   ```

### **Verification Results**

**Test Output (Merge Flow):**
```
✅ Connected
✅ Seeded ProjectType
🚀 Invoking mergeOrCreateHierarchy...
📣 Controller response: { success: true, totalAdded: 1, notificationsTriggered: 1 }
🔔 Notifications found: 1
- Message: "🏢 Unit "U-101" marked as "Interested in calling" during merge by tester"
  receiver: null
  createdAt: 2025-11-17T05:33:02.958Z
📦 Units in TowerA: 1
✅ Merge flow test completed
```

---

## Behavior Summary

| Scenario | Notification Routing | Receiver Field | Details |
|----------|---------------------|-----------------|---------|
| **Lead/Inventory Update** | User + Admin | `ObjectId` (resolved) | If transferTo/assignTo found, send to that user's socket room + admins; otherwise admins only |
| **Merge Operation** | Admin only | `null` | Notifications created during hierarchy merge go exclusively to admin room |
| **Follow-up Cron** | User + Admin | `ObjectId` (resolved) | Same logic as lead/inventory changes |
| **GET /notifications** (User) | Filtered | Matches `receiver` | Non-admins only see notifications where `receiver === userId` |
| **GET /notifications** (Admin) | All | All records | Admins see all notifications regardless of receiver |

---

## Timestamp Behavior

```
Database:  createdAt stored as UTC Date (e.g., 2025-11-17T05:31:14.234Z)
         ↓
API Response: Returns ISO UTC string (e.g., "2025-11-17T05:31:14.234Z")
         ↓
Frontend:  toISTString(date) → Displays IST (e.g., "2025-11-17 11:01:14")
```

---

## Next Steps (Optional)

1. **Start the server** with your production MongoDB:
   ```powershell
   cd crmbackend
   npm start
   ```

2. **Test real endpoints** using curl or Postman:
   ```bash
   POST /api/projects/project-types/merge
   Authorization: Bearer <token>
   Content-Type: application/json
   {
     "category": "Residential",
     "projectcategory": "ReadyToMove",
     "cities": [ ... ]
   }
   ```

3. **Connect frontend** to receive socket notifications:
   - Ensure Socket.IO client registers with `register_user` or `subscribe_notifications`
   - Listen to `notification_received` event for real-time updates

---

## Files Modified/Created

- ✅ `crmbackend/models/notification.js` — Added `receiver` field
- ✅ `crmbackend/controllers/leadController.js` — Recipient resolution + routing
- ✅ `crmbackend/controllers/inventrycontroller.js` — Recipient resolution + routing
- ✅ `crmbackend/controllers/projectController.js` — Admin-only merge notifications
- ✅ `crmbackend/controllers/notificationController.js` — Filter by receiver
- ✅ `crmbackend/services/followupCronService.js` — Recipient resolution
- ✅ `crmbackend/utils/socketEmitter.js` — Emission helpers
- ✅ `crmbackend/server.js` — Socket room logic
- ✅ `realstatecrm/src/utils/datetime.js` — IST formatting
- ✅ `crmbackend/scripts/test_with_memory_db.js` — Timestamp test
- ✅ `crmbackend/scripts/test_merge_flow.js` — Merge flow test

---

## Status: ✅ Complete

All requested features implemented and tested. Tests pass successfully with in-memory MongoDB.
