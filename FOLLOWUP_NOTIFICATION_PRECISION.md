# Follow-up Notification Precision Report — 27 Nov 2025

## Why reminders missed the exact time
- **Naive timestamps were parsed in server local time**. When users updated follow-ups with values like `2025-11-27T14:30`, `Date(...)` stored them as the host timezone (often UTC), so `followUpUtc` drifted by ±5:30 hours instead of pinning to IST.
- **Cron checked only once per minute with a ±30 s window**, so even correctly stored UTC values could fire noticeably earlier than the requested second (modal popped up at the top of the minute instead of the exact follow-up time).

## Fixes shipped
1. **IST-first parsing** (`utils/followupTime.js`):
   - Prefer the structured `YYYY-MM-DD`, `DD/MM/YYYY`, and AM/PM patterns before touching `new Date(...)`.
   - Treat every naive string as IST, only honoring timezone offsets when the value explicitly contains `Z` or `±HH:MM`.
   - Added numeric timestamp handling so automation or imports can pass UNIX seconds/milliseconds safely.
2. **High-frequency cron** (`services/followupCronService.js`):
   - Cron now runs every **10 seconds** with a ±10 s window (missed-alert window also tightened to 20 s) so reminders align with the exact scheduled moment.
   - Added idle-log throttling to avoid spamming logs while still reporting real dispatches/missed alerts.
3. **Precision regression test** (`scripts/test_followup_precision.js`):
   - Spins up an in-memory MongoDB, seeds lead/inventory using naive IST strings, waits for the due time, and asserts that `processLeadFollowups` / `processInventoryFollowups` each emit exactly one notification routed to `transferTo → assignTo → admins`.

## Test evidence
| Command | Purpose | Result |
| --- | --- | --- |
| `node scripts/test_followup_precision.js` | Validates IST parsing, cron window, and receiver routing for both Lead & Inventory | ✅ 1 lead + 1 inventory notification emitted at the exact due times (socket warnings expected because Socket.IO isn’t bootstrapped inside the test harness) |
| `node scripts/test_lead_followup_cron.js` | Legacy regression on lead reminder flow | ✅ Creates reminder within the ±30 s legacy window; notification persisted once |
| `node scripts/test_inventory_cron.js` | Legacy regression on inventory reminder flow | ✅ Inventory reminders created and routed; duplicate suppression intact |

## Next steps
1. Deploy the updated backend (`utils/followupTime.js`, `services/followupCronService.js`, `scripts/test_followup_precision.js`).
2. Keep `FOLLOWUP_CRON_DISABLED` unset (or `false`) in production so the 10-second cron keeps running.
3. After deployment, set a lead/inventory follow-up a minute in the future via the UI, leave the dashboard open, and confirm the modal rings exactly on time; check server logs for the matching "Follow-up reminders sent" entry.
