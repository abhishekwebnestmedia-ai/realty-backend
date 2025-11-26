# Follow-up Notification Test Report

_Date:_ 26 Nov 2025  \
_Environment:_ Local Windows workstation using Node.js scripts with `mongodb-memory-server` (no production data touched).

## Test Matrix

| Test | Command | Focus Area | Result | Notes |
| --- | --- | --- | --- | --- |
| Lead notification regression | `node scripts/test_lead_notifications.js` | CRUD-triggered lead notifications (assignTo/transferTo/status) | ✅ Pass | 4 notifications created, routing prefers `transferTo`, Socket.IO disabled warning is expected in harness. |
| Inventory controller regression | `node scripts/test_inventory_followup.js` | Inventory CRUD notifications + follow-up normalization | ⚠️ Partial | Follow-up date edits normalize `followUpUtc` but do not emit notifications (by design). Reassignment still notifies correctly. |
| Broker follow-up cron path | `node scripts/test_broker_followup.js` | `processBrokerFollowups` end-to-end (legacy parsing + notification persistence) | ✅ Pass | Script invokes exported cron helper with broker due window; 1 broker reminder stored with expected meta, routed to admins because no assign/transfer. |

## Key Observations
- All three scripts run against isolated in-memory Mongo instances, so they are safe to repeat anytime.
- Inventory controller still only emits notifications on reassignment. Actual follow-up reminders occur via `followupCronService` (validated indirectly by the broker cron test). If product requirements demand notifications when users manually edit `followUpDate`, additional controller logic is needed.
- Broker schema changes successfully capture `followUpUtc`, letting the cron helper emit notifications even for legacy documents.

## Next Steps
1. Run `node scripts/backfill_followup_utc.js` on a staging snapshot, verify counts for leads/inventory/brokers, then execute against production to eliminate legacy parsing overhead.
2. Restart the backend worker (or PM2 process) without `FOLLOWUP_CRON_DISABLED` so the minute-by-minute cron picks up the new logic.
3. Perform a live smoke test by scheduling near-term lead, inventory, and broker follow-ups and monitoring Socket.IO delivery to admins + assignees.
