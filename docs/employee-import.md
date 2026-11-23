# Import employees with photos

Open Section Information, Section Organization Chart, Add Employee or Export Center, then select **อัปโหลดรายชื่อพร้อมรูป**. Select the division and plant before opening the dialog, then choose the destination Section.

Upload a UTF-8 CSV, or a ZIP containing `employees.csv` and a photo folder. The `Warehouse_Employees_With_Photos.zip` prepared for the warehouse organization is supported. Accepted columns are `employee_id`, `name`, `thai_name`, `position`, `start_date`, `contract_type`, and `photo_file`. The warehouse package's `name_from_source` and `duty_from_source` columns are also recognized. Photo paths are relative to the CSV, such as `photos/01_Aree.png`.

Review the photos and fill the real employee ID, position, start date and Permanent/Subcontractor type. Name and date fields can be edited in the review table. The shared controls fill only blank position, date and employment-type fields. Employee IDs and employment dates are never invented. JPG, PNG and WebP photos use the existing employee photo preparation function.

The import adds new employee records only. A duplicate ID, including a case-only duplicate, cancels the batch without changing existing profiles. Existing employees, skills, certificates, attendance, exams and training remain intact. Previously deleted IDs require separate review and cannot be restored through this importer. A conflicting plant/division override also stops the import.

The dialog stores the reviewed batch locally before sending it. If acknowledgement is lost, reopen the dialog in the same division and plant and retry the pending batch. A stable import key prevents duplicate records. **ล้างรายการรอในเครื่อง** discards the local retry only; it never deletes saved employees. The browser must have room to store the prepared photos before submission.

Limits: 1–100 employees, a 30 MB uploaded file, 60 MB expanded ZIP and 8 MB per source photo. CSV files that reference photos must be packaged with those photos in a ZIP.

The existing Admin login and edit permission are required. The importer does not change account permissions or login behavior. Success appears after the database confirms all selected IDs in the selected Section and organization scope. The roster write is conditional and atomic for the batch; retrying the same batch preserves subsequent profile edits.

Validation: `node tests/employee-import.cjs` (JSZip must be available, or set `JSZIP_MODULE` to its installed module path). This uses synthetic data and intercepted requests. Browser preview QA covers the review dialog, photo display, missing fields, shared field filling, duplicate IDs and a synthetic save.
