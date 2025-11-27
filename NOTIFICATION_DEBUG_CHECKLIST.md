# Notification Debug Checklist

Use this guide to verify that scheduled follow-up notifications (Lead, Inventory, Broker) are created, stored, and visible in the UI/API.

---

## 1. Prerequisites

1. **Backend running** with cron enabled:
   ```powershell
   cd C:\Users\admin\Desktop\ralty\crmbackend
   npm install
   npm start
   ```
   Expected log: `✅ Follow-up cron job initialized (runs every 10 seconds).`

2. **Database connectivity**: `MONGO_URI` must be set (either in `.env` or environment). Running `node scripts\manual_followup_cron_test.js` should connect successfully.

3. **Frontend** (optional) running via `npm start` in `realstatecrm` if you want to create test follow-ups through the UI.

---

## 2. Quick sanity check via test endpoint

1. Hit the protected route mapped to `notificationController.createTestNotification` with JSON body:
   ```json
   {
     "type": "Lead",
     "itemId": "<some-existing-lead-id>",
     "message": "Manual test notification",
     "assignTo": "<your user name or _id>"
   }
   ```
2. Confirm response `201` and verify in MongoDB (`notifications` collection) and UI/API (`GET /notifications`).
3. If this works, sockets + fetching logic are healthy; continue to scheduled follow-up testing.

---

## 3. Manual scheduled follow-up test

1. In the UI (or direct Mongo insert), create **one lead, inventory, and broker** whose follow-up is 1–2 minutes in the future.
2. Keep backend logs visible.
3. Around the due time, expect log entries like:
   - `✅ Follow-up reminders sent — leads: 1, inventory: 0, brokers: 0`
4. Confirm in MongoDB that new notifications exist with:
   - `meta.event = "followup"`
   - `meta.entity = "lead" | "inventory" | "broker"`
5. When logged in as the receiver (assignTo/transferTo) or as an admin, `GET /notifications` should list the new reminder.

---

## 4. Cron helper smoke test

1. Run the scripted test to avoid UI work:
   ```powershell
   cd C:\Users\admin\Desktop\ralty\crmbackend
   node scripts\manual_followup_cron_test.js
   ```
2. The script seeds one lead/inventory/broker with follow-ups ~30–40 seconds out, waits, invokes the cron helpers, and prints emitted notification info.
3. Successful output contains non-zero counts and logs of the generated notifications. If it fails, inspect the error (most common: missing/invalid `MONGO_URI`).

---

## 5. Troubleshooting matrix

| Symptom | Checks |
| --- | --- |
| No cron logs | Ensure backend started without `FOLLOWUP_CRON_DISABLED=true` |
| "MONGO_URI is not defined" | Populate `.env` or environment with a valid connection string |
| Notifications exist in DB but UI empty | Verify logged-in user matches `notification.receiver`; non-admins only see their own |
| Instant notifications still firing | Confirm controller edits removed follow-up-change notifications (lead/inventory/broker controllers) |
| Legacy records not firing | Run `node scripts\backfill_followup_utc.js` to populate `followUpUtc` |

---

## 6. Recording results

Document your run below:

```md
- Date/Time:
- Env (local/staging/prod):
- MONGO_URI / DB cluster:
- Test path (UI / script / Postman):
- Cron logs observed:
- Notifications created (IDs / count):
- Receiver user:
- UI/API verification result:
- Issues & next actions:
```

Attach this filled section to Jira / internal QA notes so others can reproduce the exact steps.
