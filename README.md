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

### Batch exam reports (v921)
Examination History includes one A4 print/PDF command for all visible employees: individual summaries, selected exam evidence, or both. Respects current employment, Section, quarter and search filters. Summaries are deduplicated per employee and include full history; evidence uses only selected attempts and saved snapshots. Each report starts on a new page in a single print dialog.

### Bulk skill assessment (v922)
Admin: Section Skill Matrix → ปรับสกิลหลายคน. Search and select employees in the current organization/Section/Sorting group, choose topics and Level 1–5, enter evaluator/date, review the per-person changes, then confirm. Each employee retains an assessment history and offline retry job. Conditional Firebase writes merge only the selected topics with the latest employee record and deduplicate retried batches. Matrix rows and exports sort management first and Operator/OP aliases last, then employment type and seniority within each role.
Validation: `NODE_PATH=<jsdom module directory> node tests/bulk-skills.cjs`; `node tests/employee-save.cjs`.

## V929 Full organization chart printing
- Save PDF / Print on the main organization chart opens paper, zoom and layout controls. Poster mode tiles the complete chart across A4 or A3 landscape pages, with 5 mm overlap, trim guides and row/column coordinates. Empty tiles are omitted. Fit mode keeps the complete chart on one sheet.
- A scoped headcount footer shows unique chart employees, Sections, Permanent, Subcontract, Thai subcontractors (NCN IDs) and Myanmar subcontractors. The counts appear below the chart, on each printed page, and below the native Excel chart. Vacancies are excluded.
- Regression: `node tests/organization-poster.cjs` with Playwright Chromium; optionally set `CHROMIUM_EXECUTABLE_PATH` and `PPMS_QA_DIR`. The test uses a synthetic 152-person roster and checks poster coverage, A4/A3 PDFs, counts, scope and source-data preservation.

## V935 Leader employee maintenance
- Leader employee submission reads the form ID attribute, avoiding HTML form named-property shadowing by the employee ID field. Different employee-ID prefixes sharing a numeric suffix no longer count as duplicates.
- The dialog reads the employee roster and deletion markers through REST before falling back to the realtime SDK. Confirmed fresh snapshots update the shared runtime before permission checks, so recently added employees can be removed and stale socket caches do not hide successful mutations.
- Removal retains resignation history and existing Section/self-removal guards. Both entry pages request the updated Leader module.
- Validation: `node tests/leader-employee-mutations.cjs` with jsdom; `node tests/leader-employee-browser.cjs` with Playwright Chromium (optional `CHROMIUM_EXECUTABLE_PATH`). Both use synthetic intercepted databases. Employee save, live-roster and Section-access regressions also pass.

## V936 Training and certificates
- Admins can record actual employee courses from Training & Certificates or an employee profile. CQI-15 is a suggestion; any course name can be entered. Courses are assigned to selected people only and never change Skill levels automatically.
- Records include provider, training date, optional expiry date, certification status, certificate number, note, HTTPS evidence link and an optional PDF/JPG/PNG up to 1 MB. Expired certificates are identified separately. Search, course/status filters and CSV downloads respect the current division scope.
- Certificates are stored with employee records and included in employee backups/resignation archives. Conditional record-level merges preserve concurrent courses, profiles and skills; profile saves retain the latest certificate collection. Offline entries use a durable outbox and retry after reconnection; conflicting edits require reopening the record.
- Validation: `node tests/training-certificate-save.cjs`; `JSDOM_MODULE=<jsdom path> node tests/training-certificates.cjs`; `PLAYWRIGHT_MODULE=<playwright path> CHROMIUM_EXECUTABLE_PATH=<chromium path> node tests/training-certificates-browser.cjs`. All data in these tests is synthetic and all database requests are intercepted.

## V937 Batch training and competency views
- The course form supports searchable employee checkboxes, selecting all search results, clearing the selection, a selected-person count and optional certificate numbers per person. Course details and evidence can be saved for the selected people in one conditional roster write; each employee retains an independent history and retry identity.
- Skill Cards include a course/status strip while retaining CR80 dimensions. Skill Matrix shows each person's courses and a separate course-by-employee matrix, including planned, trained, certified and expired states. Assessment scores and numeric skill levels remain unchanged.
- Matrix print/PDF appendices and Matrix/Card Excel workbooks include training records for the displayed employees. Employee profile edits continue preserving certificates, and concurrent same-record edits require reopening the form.
- Validation: certificate save and batch atomicity tests; synthetic browser tests for multi-person selection, individual numbers, evidence, card dimensions, course matrices, Excel sheets, offline reload/retry and division isolation; employee-save regressions.

## V938 Permanent employee training eligibility
- Course selection, histories shown in course views, card course strips and training exports are restricted to employees explicitly recorded as Permanent or พนักงานประจำ. Existing stored history is retained.
- Conditional single/batch saves recheck the latest employee contract type, including after a concurrent-write retry. Subcontractors and unspecified contract types cannot receive a course through these save paths; an invalid batch is rejected before any partial write.
- Certificate service, UI selection and synthetic browser regressions pass, including mixed-type batches and a contract change during a conditional write.

## V939 Larger certificate attachments
- PDF, JPG and PNG certificate attachments now accept up to 5 MB per file, including a shared attachment when selecting several permanent employees.
- Certificate conditional writes and their verification reads allow 90 seconds for larger transfers; other employee operations keep their existing request deadline. Existing offline persistence and retry behavior remain in use.
- Browser validation covers a file at the full 5 MB limit, a byte-identical download, reload/edit, batch assignment and rejection of a file larger than 5 MB before any save.

## V940 Employee ordering in training and cards
- Training attendee selection, course history, course matrices and their exports use the existing Skill Matrix position order, highest position first. Employees in the same position follow the existing employment/seniority and employee-ID tie-breakers.
- Skill Card employee choices, all-employee card views, duplex output and A4 PDF output follow the same order. Sorting copies the displayed list and does not rewrite employee records.
- The synthetic browser regression checks attendee, training-history and card-selector order using a deliberately unsorted roster. Existing training, permanent-only eligibility, 5 MB evidence and export checks also pass.

## V941 Compact course labels
- Skill Matrix employee rows show course names after the update date on the same line, such as `Update: 2026-10-15 · CQI-15`. Compact matrix and card summaries omit certificate-status wording.
- Matrix print/PDF and Excel employee summaries use the same compact course names. The update date remains a separate model value, and detailed course status/history remains available in the training records.
- The browser regression verifies the inline label, reduced row lines, unchanged export date and course-only card text; existing course, file and workbook checks pass.

## V942 Bounded course summaries
- Compact employee/card summaries show the first course and a remaining-course count. Full course names are available in the tooltip and detailed history.
- Matrix update lines use constrained flex children and ellipsis, preserving the existing employee-column and table widths. The print/PDF summary uses the same bounded preview; full export data remains available in the training worksheet.
- Browser verification adds 20 long course titles and confirms unchanged table/employee-column widths, one-line height, the remaining count and complete tooltip names. Existing date, card, file and workbook checks pass.


## V955 Organization layout by configurable production lines
- Organization Chart → Layout by line groups sections and people under each line. Shared staff appear once above the lines; unassigned staff remain visible below. A selected-line view includes shared staff in its overall total.
- Admins use Add / name lines to create any needed additional lines, rename them, or remove unused lines. Assign sections / employees supports section defaults and individual overrides. Existing line 1–3 assignments remain compatible; line definitions share the existing scoped Firebase cache/outbox.
- The main chart and Factory Organization support the same line model, scope, filtered exports and unique-person print totals. Existing employee records are not rewritten by line changes.
- Validation: production-line-organization regression passes with eight lines, custom names, split sections, shared staff, scope isolation, pending sync, deletion guards, permission checks and standalone rendering. Synthetic browser QA verifies add/name UI and grouped cards. The older organization-editor regression still fails on its subcontract nationality count assertion; the same failure was reproduced on the unchanged base commit.
