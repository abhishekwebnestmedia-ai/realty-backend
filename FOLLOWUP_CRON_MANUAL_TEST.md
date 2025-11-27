# Follow-up Cron Manual Test

## 1. Start backend with cron enabled

```powershell
cd C:\Users\admin\Desktop\ralty\crmbackend
npm install
npm start
```

Expected log once:
- `✅ Follow-up cron job initialized (runs every 10 seconds).`

While idle you may see:
- `⏸️ No follow-up notifications to dispatch right now.`

Make sure **FOLLOWUP_CRON_DISABLED** is NOT set to `"true"`.

---

## 2. Test lead follow-up reminder

1. In the UI (realstatecrm), create a new Lead:
   - Set follow-up date/time to **1–2 minutes in the future** (IST).
2. Wait around that time while backend is running.

Expected:
- In backend logs:  
  `✅ Follow-up reminders sent — leads: 1, inventory: 0, brokers: 0`
- In Mongo `notifications` collection:
  - A new document with:
    - `type: "Lead"`
    - `meta.event: "followup"`
    - `meta.entity: "lead"`

There should be **no notification at the moment you edit follow-up**, only at due time.

---

## 3. Test inventory follow-up reminder

1. Create or edit an Inventory record:
   - Set `followUpDate` to **1–2 minutes in the future**.
2. Wait around that time.

Expected:
- Logs:  
  `✅ Follow-up reminders sent — leads: 0, inventory: 1, brokers: 0`
- New `Notification` with:
  - `type: "Inventory"`
  - `meta.event: "followup"`
  - `meta.entity: "inventory"`

Again, no instant notification when you change `followUpDate`.

---

## 4. Test broker follow-up reminder

1. Create or update a broker requirement with `followUpDate` **1–2 minutes in the future**.
2. Wait around that time.

Expected:
- Logs:  
  `✅ Follow-up reminders sent — leads: 0, inventory: 0, brokers: 1`
- New `Notification` with:
  - `type: "Broker"`
  - `meta.event: "followup"`
  - `meta.entity: "broker"`

---

## 5. Validate there is no “on-change” spam

For each of the three entities:

1. Change only the follow-up date/time (do NOT change assignTo/transferTo).
2. Immediately check:
   - No new `Notification` with:
     - `meta.event: "followup_change"` or a message like “follow-up updated”.
3. Wait until the scheduled time:
   - Exactly **one** reminder notification should appear, from cron.

---

## 6. If no reminders appear

Check:

1. Cron log lines present (`cron job initialized`, `No follow-up notifications...`).
2. The record has `followUpUtc` set:
   - Lead: `lead.followUpUtc` is a valid Date.
   - Inventory: `inventory.followUpUtc` is a valid Date.
   - Broker: `followUpUtc` is set.
3. If old data lacks `followUpUtc`, run:

```powershell
cd C:\Users\admin\Desktop\ralty\crmbackend
node scripts\backfill_followup_utc.js
```

Then create **new** test records and repeat steps above.
