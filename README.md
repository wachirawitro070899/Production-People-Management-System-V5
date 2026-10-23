# Production People Management System

GitHub Pages production files only.

Required runtime files are kept in this repository. Historical backup files and old update notes were removed to make GitHub uploads smaller and easier.


## V512
- Employee photo save no longer fails when Google Apps Script Drive uploader is not configured.
- Local photo selection is compressed and saved with the employee record/Firebase as fallback.
- Google Drive upload remains optional when configured.


## V521
Attendance GPS check-in radius can be configured by Admin from 50-500 meters.


## V528
- Removed legacy per-employee Attendance shift selector from employee edit UI.
- Shift source is the 4-round plan / individual override.
- Engineering Support Section and Support Production Section remain fixed Day shift.


## V558 Attendance durable sync
- Store each employee/date check-in in Firebase recordsByKey to prevent stale whole-array writes from losing other employees.
- Verify the exact keyed record before showing check-in success.
- Recover previously verified missing check-ins from ppmsArchive on startup, while respecting Admin deletion tombstones.
- Attendance Admin page refreshes automatically when new central records arrive.
- Permanent deletion also removes keyed and archive copies.

## V879 Excel organization charts
- Reporting lines follow shared horizontal and vertical routes around employee cards and headings.
- Department export spacing accommodates paired employee cards.
- Lines use editable freeform geometry so Office preserves their planned route when opening the workbook. Adjust the lines separately when moving cards.

## V918 Month Report charts and A4 export
- Month Report shows six-month hire/resignation trends, movements by Section, training plans/results and quarterly examination progress using the existing scoped models.
- Print A4 produces one portrait summary with 8 mm margins. Save PDF downloads the summary; when details are included, use Save as PDF in the print dialog. Employee, training and exam details continue on subsequent A4 pages.
- The report uses isolated print styles, preserving paper settings on other reports. Existing Leader/Section and Supervisor/Division permissions apply.
- Regression checks: `node tests/month-report.cjs` (jsdom) and `node tests/month-report-a4.cjs` (Playwright Chromium). Set `JSDOM_MODULE` or `PLAYWRIGHT_MODULE` if dependencies are installed outside the repository. Optional `PPMS_PDF_TEST_MODULES` points to a node_modules directory containing html2canvas and jspdf to test the PDF download.
