# Follow-up Notification Smoke Test (26 Nov 2025)

All tests executed locally with `mongodb-memory-server`, so no production data was touched. Socket-side warnings are expected because the harness runs outside the live server instance.

| Test | Command | Focus | Result | Notes |
| --- | --- | --- | --- | --- |
| Lead controller regression | `node scripts/test_lead_notifications.js` | Notifications triggered on assign/transfer/status changes | ✅ Pass | 4 notifications persisted with correct routing priority (`transferTo` > `assignTo`). |
| Inventory controller regression | `node scripts/test_inventory_followup.js` | CRUD notifications + follow-up normalization | ⚠️ Partial | Follow-up date edits normalize `followUpUtc` but do **not** emit notifications per current controller logic; reassignment still notifies. |
| Broker cron helper | `node scripts/test_broker_followup.js` | `processBrokerFollowups` flow (legacy parsing + reminder) | ✅ Pass | 1 broker reminder stored with meta + admin routing, proving cron pathway works when invoked. |

## Key Findings
- **Inventory & broker follow-up reminders only run via `followupCronService`.** The controller tests confirm CRUD paths work, but real follow-up alerts depend on the cron worker being active and the documents having `followUpUtc` populated.
- **Inventory follow-up edits don’t send notifications immediately.** This is by design today; only assignment changes raise notifications. If product wants instant alerts on follow-up changes, controller logic must be expanded.
- **Broker schema normalization holds.** Newly created brokers now store `followUpUtc`, allowing the cron helper to emit reminders even when dates were supplied in various formats.

## Recommended Next Steps
1. In production, ensure the cron worker is running (no `FOLLOWUP_CRON_DISABLED`) and monitor logs for `✅ Follow-up reminders sent — ...` entries.
2. Run `node scripts/backfill_followup_utc.js` against production data so every lead/inventory/broker has `followUpUtc`, minimizing legacy parsing.
3. Schedule near-term follow-ups via the UI and confirm real-time delivery to admins and the intended assignee.
