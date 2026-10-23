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

## V919 Employee paper exams
- Admins can download employee exam PDFs or print A4 copies from Check/Edit Exam. Examination Plan also links to the export controls for the selected Section.
- Exports use the displayed type, Section, skill, quarter, level, A/B/C set and question text. They contain employee identity/date fields, questions and unmarked choices; answer keys and explanations are excluded.
- Questions and choices stay together on a page. Level 5 includes ten written questions with answer space, except the existing conversion exam, which remains multiple choice only.
- Paper exports do not save online exam results or change skills. If PDF libraries are unavailable, the button opens the browser print dialog for Save as PDF.
- Browser verification: `node tests/exam-paper.cjs`, using the same `PLAYWRIGHT_MODULE` and optional `PPMS_PDF_TEST_MODULES` paths as the Month Report tests.

## V920 Individual examination evidence and employee summaries
- Examination History has an A4 evidence button for each attempt and individual summary buttons. A selector also covers employees without exam history; employee cards offer the same summary print action.
- Evidence uses the saved questions, choices, submitted answers and written responses from that attempt. Legacy records clearly identify missing original questions and preserve available answer indices without consulting the current question bank.
- Summary reports contain an overview, all recorded attempts, approval/forced-exit status, explicitly stored skill levels and skill-change history. They do not infer skill updates from scores or count pending/rejected Level 5 submissions as approved passes.
- Reports print in isolated A4 documents, with employee IDs and page numbers; use Save as PDF in the print dialog. Reports are read-only and remain restricted to Admin and the selected organization scope.
- Browser regression: `node tests/individual-exam-reports.cjs` with `PLAYWRIGHT_MODULE` pointing to Playwright. Optional `PPMS_QA_DIR` writes test PDFs for visual checks.
- Examination History supports All / Regular / Subcontract filters using current employee contract types, combined with the existing Section, quarter and search filters. Both history print buttons print exactly that selection in an isolated A4 report. Unknown types stay in All and are counted explicitly. Employee summary choices follow the selected contract type; Clear Filters resets the contract selection as well.
