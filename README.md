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
