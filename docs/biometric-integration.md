# Wi-Fi scanner integration staging

Status: **manual scan-file upload is enabled; no hardware connection or unattended ingestion is enabled**.
The Admin Attendance page offers “อัปโหลดข้อมูลจากเครื่องสแกน”. No device model or device registration is required for file uploads. Existing web check-in and leave workflows continue normally.

## Manual upload

- Accepts UTF-8 or BOM-marked UTF-16 CSV, TSV and TXT, with comma, tab or semicolon delimiters. Excel files must first be saved as CSV UTF-8.
- Maximum 5 MiB and 10,000 data rows. Header row required. A CSV example can be downloaded from the upload dialog.
- Map employee ID and either a timestamp column or separate date/time columns. Choose year-month-day or day-month-year; Buddhist years are converted to Gregorian years. Local timestamps are interpreted in Asia/Bangkok.
- Map an IN/OUT column, or explicitly confirm that the file contains entry times only. Numeric vendor status codes are not guessed.
- Preview all rows and show the first 200 in the table. Bad rows, exits, duplicate scans and leave/Admin conflicts are excluded from ready rows.
- User confirmation starts the import. Current cloud records and deletion markers are checked again before each write. Earliest valid check-in wins. Failed uploads remain in the existing pending queue, and the UI distinguishes confirmed, pending, skipped and failed records.
- File provenance is stored with the attendance row; it does not contain raw fingerprint templates or face images. Device connection settings saved by the earlier staging screen are retained but are not required or activated by file upload.


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

Additional tests: `node tests/scan-upload-leave.cjs`.
