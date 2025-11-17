# ✅ Notification System Updates - Complete Summary

## 📋 Changes Made

### 1. **Fixed Created Time (UTC → IST Display)**
   - **File**: `crmbackend/models/notification.js`
   - **Changes**:
     - Store `createdAt` as UTC timestamp using `Date.now` (recommended best practice)
     - Added `toJSON()` method to format `createdAt` to IST (YYYY-MM-DD HH:mm:ss) for API responses
     - This ensures correct timezone display without double-shifting issues
   
   **Example Output**:
   ```json
   {
     "createdAt": "2025-11-16 18:45:30",  // IST formatted in API response
     "message": "Lead notification"
   }
   ```

### 2. **Added Receiver Field & User-Specific Routing**
   - **File**: `crmbackend/models/notification.js`
   - **Changes**:
     - Added `receiver` field (ObjectId ref to User) to store who should receive the notification
   
   **Recipient Logic** (across all files):
   - **Preference order**: `transferTo` (username lookup) → `assignTo` (id or name lookup) → null (admin only)
   - When a notification is created:
     1. Check if `transferTo` exists and find user by name
     2. If not found, check `assignTo` and resolve (could be ObjectId or name)
     3. Save the resolved user ID in `receiver` field
     4. If resolved: emit to that user's room + admin room
     5. If not resolved: emit to admin room only

### 3. **Updated Lead Notifications**
   - **File**: `crmbackend/controllers/leadController.js`
   - **Changes**:
     - When a lead is updated (assignTo or status change):
       1. Resolve recipient using `transferTo` → `assignTo` logic
       2. Create Notification with `receiver` field set
       3. Emit to user-specific socket room + admins (or admins only if unresolved)

### 4. **Updated Inventory Notifications**
   - **File**: `crmbackend/controllers/inventrycontroller.js`
   - **Changes**:
     - Same receiver resolution and emission logic as leads
     - When inventory is updated, notifications go to `transferTo` user or fallback to `assignTo`

### 5. **Updated Follow-Up Cron Service**
   - **File**: `crmbackend/services/followupCronService.js`
   - **Changes**:
     - Follow-up reminder notifications now resolve `transferTo` → `assignedTo`
     - Emit to resolved user (+ admins) or to admins only
     - Timestamps handled in IST internally during cron matching

### 6. **Restricted Non-Admin API Access**
   - **File**: `crmbackend/controllers/notificationController.js`
   - **Changes**:
     - `GET /api/notifications`
       - **Admin users**: see ALL notifications
       - **Non-admin users**: see only notifications where `receiver` = their user ID
     - This ensures user-specific notification filtering at API level

### 7. **Added Test Endpoint**
   - **File**: `crmbackend/routes/notificationRoutes.js` + `controllers/notificationController.js`
   - **Endpoint**: `POST /api/notifications/test-create` (protected by auth)
   - **Purpose**: Manual testing of notification creation with specific recipients
   - **Request body**:
     ```json
     {
       "type": "Lead",
       "itemId": "507f1f77bcf86cd799439011",
       "message": "Test notification",
       "transferTo": "Abhishek",
       "assignTo": ""
     }
     ```
   - **Response**: Notification object with `createdAt` in IST and `receiver` populated

---

## 🧪 Testing Checklist

After deploying, verify:

### ✅ Local Testing (Server Running on port 5000)
1. **Notification Timestamps**:
   - Create a lead/inventory or use test endpoint
   - Check MongoDB: `createdAt` should be UTC timestamp
   - Fetch via API: `createdAt` should display as IST (YYYY-MM-DD HH:mm:ss)

2. **Receiver Resolution**:
   - Set a lead's `transferTo` to a known username (e.g., "Abhishek")
   - Create/update the lead
   - Check MongoDB: Notification should have `receiver` = that user's ObjectId
   - If `transferTo` blank, check `assignTo` is used instead

3. **Admin vs User Notifications**:
   - Admin user hits `GET /api/notifications`: should see ALL notifications
   - Regular user hits `GET /api/notifications`: should see only their notifications

4. **Socket Emissions**:
   - Connect a socket client as `notif_admin` room
   - Update a lead → should receive notification
   - Connect as `notif_<userId>` room
   - Update lead with `transferTo` = that user → should receive notification

---

## 🚀 Quick Start Commands

### Start Server Locally
```powershell
cd c:\Users\admin\Desktop\ralty\crmbackend
npm install       # (if needed)
npm run dev       # starts nodemon with hot-reload
```

**Expected output**:
```
✅ Follow-up cron job initialized (runs every minute).
🧹 Notification cleanup cron initialized
🚀 Server running on port 5000
```

### MongoDB Connection
- Ensure MongoDB is running and accessible at the URI in `.env`
- Current URI: `mongodb://admin:StrongPassword123@127.0.0.1:27017/realtyexpo?authSource=admin`

### Test Endpoint Example (PowerShell)
```powershell
# After logging in and getting a JWT token:
$token = "Bearer YOUR_JWT_TOKEN"
$body = @{
  type = "Lead"
  itemId = "507f1f77bcf86cd799439011"
  message = "Test with IST"
  transferTo = "Abhishek"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/notifications/test-create" `
  -Method Post `
  -Headers @{ Authorization = $token } `
  -Body $body `
  -ContentType "application/json"
```

---

## 📦 Files Modified

1. ✅ `crmbackend/models/notification.js` — UTC storage + IST toJSON + receiver field
2. ✅ `crmbackend/controllers/leadController.js` — resolve & emit notifications
3. ✅ `crmbackend/controllers/inventrycontroller.js` — resolve & emit notifications
4. ✅ `crmbackend/services/followupCronService.js` — resolve recipients for follow-ups
5. ✅ `crmbackend/controllers/notificationController.js` — filter by receiver, add test endpoint
6. ✅ `crmbackend/routes/notificationRoutes.js` — add test route
7. ✅ `crmbackend/scripts/parse_check.js` — syntax validation (all files pass)
8. ✅ `crmbackend/scripts/test_notifications.js` — basic HTTP test
9. ✅ `crmbackend/scripts/test_full.js` — comprehensive DB + API test

---

## 🔄 Next Steps for Production Deployment

1. **Commit Changes** (PowerShell):
   ```powershell
   cd c:\Users\admin\Desktop\ralty
   git add -A
   git commit -m "Fix: Notification IST timezone, add receiver field, implement user-specific routing"
   git push origin project
   ```

2. **On Production Server** (SSH):
   ```bash
   git pull origin project
   npm install --production
   pm2 restart crmbackend
   # or
   sudo systemctl restart crmbackend
   ```

3. **Verify on Production**:
   - Check server logs: `pm2 logs crmbackend | tail -50`
   - Test notification creation via API
   - Verify createdAt is IST in responses
   - Test receiver filtering for non-admin users

---

## 📝 Notes

- **UTC Storage**: Timestamps stored in UTC (UTC+0) is the industry standard and avoids issues with daylight saving time.
- **IST Display**: When API responds, times are converted to IST (UTC+5:30) using the format YYYY-MM-DD HH:mm:ss for readability.
- **Receiver Filtering**: Non-admin users will now only see notifications intended for them, improving security and UX.
- **Backward Compatibility**: Existing notifications without a `receiver` field will have `receiver: null` and will not be returned to non-admin users (only admins see them).
- **Socket Rooms**: Notifications are emitted to both individual user rooms (`notif_<userId>`) and admin room (`notif_admin`) for real-time updates.

---

## ✅ Summary

All notification system updates are complete and ready for local and production deployment. The changes ensure:
- ✅ Correct IST timezone display
- ✅ User-specific notification routing (via transferTo/assignTo)
- ✅ Admin users receive all notifications
- ✅ Non-admin users receive only their notifications
- ✅ Real-time socket emissions to correct recipients
- ✅ Cron jobs (follow-up, cleanup) work with proper recipient resolution
