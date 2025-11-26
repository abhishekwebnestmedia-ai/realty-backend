# Notification Verification (Lead & Inventory)

_Date:_ 26 Nov 2025  \
_Environment:_ local Windows workstation, Node.js scripts backed by mongodb-memory-server (no external services).

## Lead Notifications
- **Command:** `node scripts/test_lead_notifications.js`
- **Coverage:** assignTo reassignment, transferTo routing, status changes, capturedBy updates, routing priority tests.
- **Observed:**
  - 4 notifications persisted (assignTo, transferTo, status update, routing scenario). Messages targeted the correct users with transferTo taking priority over assignTo.
  - Socket emission warnings (`Socket.IO not initialized`) are expected when the test harness runs outside the live server.
  - Change-history entries were recorded for each tracked field.
- **Verdict:** CRUD-triggered lead notifications are working end-to-end, limited only by the disabled websocket layer in the test harness.

## Inventory Notifications
- **Command:** `node scripts/test_inventory_followup.js`
- **Coverage:** follow-up date updates, transferTo routing, assignTo reassignment.
- **Observed:**
  - Updating only `followUpDate` or setting `transferTo` did **not** persist any notifications (0 rows in `notifications` collection after each step).
  - Reassigning `assignTo` created a notification (`👤 Inventory "Test Seller" was reassigned to Salesman2 by Admin`) with the receiver resolved correctly.
  - Same Socket.IO warning surfaced because the test runs without the live server.
- **Verdict:** Inventory reassignment notifications work, but follow-up date/transfer updates are not generating notifications. This matches the current controller logic and needs product clarification or code changes if reminders are expected.

## Outstanding Risks / Follow-up Tasks
1. **Cron parsing failure:** The production cron job (`services/followupCronService.js`) still errors on `%I/%p` format tokens, so scheduled follow-up reminders (for both leads and inventory) will not fire until the formats are trimmed or all legacy records receive `followUpUtc` values.
2. **Inventory follow-up notifications:** Decide whether follow-up date or transfer changes should emit notifications similarly to leads; if yes, extend `inventrycontroller.updateInventry` to enqueue notification records.
3. **End-to-end socket check:** Once server-side Socket.IO is hooked up, re-run the scripts (or manual UI tests) to verify actual push delivery to admins/users.
