# Wi-Fi scanner integration staging

Status: **draft only — no hardware connection or unattended ingestion is enabled**.
The Admin Attendance page offers “เครื่องสแกนนิ้วผ่าน Wi-Fi”. It saves device metadata under `ppmsAttendance/settings/biometricIntegration` with `enabled: false`, `status: draft`, and timezone `Asia/Bangkok`. It does not store passwords, API keys, fingerprint templates or face images. Existing web check-in and leave workflows continue normally.

A device-specific backend or local gateway is still required. Determine the manufacturer, model and supported vendor API/protocol before implementing it. Wi-Fi connectivity alone does not establish a supported integration. Do not put device credentials or Firebase administrative credentials in this static GitHub Pages app.

## Normalized event contract

```json
{
  "deviceId": "JR-GATE-01",
  "eventId": "vendor-unique-event-0001",
  "employeeId": "12",
  "occurredAt": "2026-09-22T08:06:00+07:00",
  "eventType": "check_in"
}
```

- Employee ID must match the PPMS identifier after whitespace/case normalization. No numeric-tail guessing for device imports. Configure the actual mapping in the future gateway when machine IDs differ.
- `occurredAt` is the original scan timestamp with an explicit UTC offset, not download time. Future timestamps beyond five minutes are rejected by preview.
- `deviceId` plus `eventId` must be stable for retried events. A future backend must enforce idempotency persistently and reconcile employee/work-date records atomically.
- Only entry events become attendance. Exit events are explicitly ignored by this entry-only system.
- A scan before noon for a previous-date night shift belongs to that work date, following the existing Attendance convention.
- Existing leave or manual Admin corrections require review. Cleanup/deletion markers must be respected.
- Keep the earliest valid check-in for repeated scans. Feed records into the same Attendance ledger and KPI evaluator rather than a separate points table.

## Read-only adapter

For an authenticated Admin UI session, `window.PPMS_RUNTIME.previewBiometricEvent(event)` validates an event and returns a proposed record and `kpi` result, `requiresReview`, or an ignored exit event. It never writes Attendance. The browser Admin guard is a UI guard, **not server authorization**. There is no public webhook, polling job or device endpoint in this change.

Before activating real ingestion, implement backend authentication, authorize device identities, validate event timestamps, use durable event IDs and atomic reconciliation, preserve Admin corrections and deletions, and emit confirmed records to the existing canonical Attendance paths. Test vendor retries, out-of-order scans, offline buffering and night shifts against the actual device. Do not accept biometric templates through this event contract.

Tests: `node tests/attendance-policy.cjs` and `node tests/attendance-stability.cjs`.
