/* Shared Thai/English UI. Source text and form values remain unchanged. */
(()=>{
 'use strict';
 const KEY='ppms_ui_language', texts=new WeakMap(), attributes=new WeakMap();
 let language='th', scheduled=false, applying=false;
 try{language=localStorage.getItem(KEY)==='en'?'en':'th'}catch{}
 const dictionary=Object.fromEntries(`
แก้ไขชื่อ Section|Rename Section
ชื่อ Section ใหม่|New Section name
บันทึกชื่อ Section|Save Section name
กำลังบันทึกชื่อ Section...|Saving Section name...
แก้ไขชื่อ Section เรียบร้อยแล้ว|Section name updated
แก้ไขชื่อ Section ไม่สำเร็จ|Could not rename Section
กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนแก้ไขชื่อ Section|Connect to the internet before renaming a Section
ชื่อ Section ถูกแก้ไขจากเครื่องอื่น กรุณาเปิดรายการใหม่|Another device renamed this Section. Reopen the form.
รายชื่อพนักงานและเครื่องจักรที่จัดไว้จะอยู่ใน Section เดิม|Employees and machine assignments remain in this Section
ผู้เชี่ยวชาญงานปั๊มโลหะ|Stamping Specialist
ผู้เชี่ยวชาญงานหล่ออลูมิเนียม|Die Casting Specialist
ผังกำลังคน|Manpower Planning
ผังกำลังคนแยก Section|Section Manpower Planning
ยกเลิก|Cancel
บันทึก|Save
บันทึกข้อมูล|Save changes
ปิด|Close
เปิด|Open
ลบ|Delete
เพิ่ม|Add
แก้ไข|Edit
ค้นหา|Search
เลือก|Select
ยืนยัน|Confirm
ล้าง|Clear
อัปเดต|Update
อัพเดต|Update
ดาวน์โหลด|Download
พิมพ์|Print
สร้าง|Create
จัดการ|Manage
ตั้งค่า|Settings
รายละเอียด|Details
สถานะ|Status
หมายเหตุ|Notes
ชื่อ|Name
รหัส|ID
วันที่|Date
เวลา|Time
ประเภท|Type
จำนวน|Quantity
ทั้งหมด|All
รวม|Total
รายการ|Records
คะแนน|Score
ผล|Result
เหตุผล|Reason
หลักฐาน|Evidence
ข้อมูล|Data
ไฟล์|File
รูป|Photo
ปัจจุบัน|Current
ใหม่|New
สำเร็จ|Successful
ไม่สำเร็จ|Failed
เรียบร้อยแล้ว|Completed
เรียบร้อย|Completed
ไม่มีข้อมูล|No data
ไม่พบข้อมูล|No data found
ยังไม่มีข้อมูล|No data yet
กำลังโหลด|Loading
กำลังบันทึก|Saving
กำลังตรวจสอบ|Checking
กำลังค้นหา|Searching
กำลังสร้าง|Creating
กำลังส่ง|Sending
กำลังนำเข้า|Importing
กำลังอ่านไฟล์|Reading file
กรุณาลองอีกครั้ง|Please try again
กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่|Check your internet connection and try again
กรุณาเข้าสู่ระบบ|Please sign in
เข้าสู่ระบบ|Sign in
กลับหน้าหลัก|Back to home
กลับรายการ|Back to list
กลับรายชื่อ|Back to employee list
ไม่ระบุ|Not specified
ยังไม่เลือก|Not selected
ไม่เลือก|None
ไม่ระบุชื่อ|Unnamed
แสดงรหัสผ่าน|Show password
ซ่อนรหัสผ่าน|Hide password
แสดงตัวอย่าง|Preview
ดูรายละเอียด|View details
เปิดไฟล์|Open file
เปิดข้อมูล|Open details
ดูทั้งหมดใน|View all in
ดูทั้งหมด|View all
เปิดประวัติ|View history
ลบประวัติ|Delete history
ล้างข้อมูล|Clear data
ลบข้อมูล|Delete data
บันทึกไม่สำเร็จ|Save failed
อัปโหลดไม่สำเร็จ|Upload failed
นำเข้าไม่สำเร็จ|Import failed
อ่านไฟล์ไม่สำเร็จ|Failed to read file
ไฟล์แนบ|Attachment
ชื่อพนักงาน|Employee name
รหัสพนักงาน|Employee ID
พนักงานลาออก|Resigned employee
พนักงานประจำ|Permanent employee
พนักงานทั่วไป|Operator
พนักงานผลิต|Production operator
พนักงานใหม่เดือนนี้|New employees this month
พนักงานทั้งหมด|Total employees
พนักงานเริ่มงานใหม่|New employee
พนักงาน|Employee
เลือกพนักงาน|Select employee
เลือกแผนก|Select section
ทุกแผนก|All sections
แผนก|Section
โรงงาน|Factory
รวมทุกโรง|All plants
รวมโรงงาน|Factory overview
ส่วนกลาง|Central
ตำแหน่ง|Position
หน้าที่|Responsibilities
ชื่อภาษาอังกฤษ|English name
ชื่อภาษาไทย|Thai name
เบอร์โทร|Phone number
วันที่เริ่มงาน|Start date
ประเภทพนักงาน|Employment type
วันที่ปรับเป็นพนักงานประจำ|Permanent employment date
ประวัติพนักงานลาออก|Resignation History
อายุงาน|Length of service
ข้อมูลพนักงาน|Employee information
เพิ่มพนักงาน|Add employee
ลบพนักงาน|Remove employee
แก้ไขข้อมูลพนักงาน|Edit employee information
แก้ไขข้อมูล|Edit information
คลิกเพื่อแก้ไขข้อมูลพนักงาน|Click to edit employee information
คลิกเพื่อดูข้อมูลและประวัติ Attendance|View employee information and attendance history
เปิดการ์ดรายละเอียดพนักงาน|Open employee details
จัดการพนักงาน|Manage employees
รูปพนักงาน|Employee photo
ลบรูปปัจจุบัน|Remove current photo
ลบรูป|Remove photo
บันทึกรูป|Save photo
เลือกรูป|Choose photo
ยังไม่มีรูป|No photo yet
เลือกรูปจากมือถือหรือคอม แล้วกดบันทึก ทุกคนจะเห็นรูปจากระบบเดียวกัน|Choose a photo from your phone or computer and save. Everyone will see the same photo.
พร้อมบันทึกรูปเข้าระบบ PPMS โดยตรง|Ready to save the photo directly to PPMS
สำหรับผู้ที่เปลี่ยนจาก Subcontractor เป็นประจำ ระบบเริ่มนับอายุงานใหม่จากวันนี้ หากเป็นประจำตั้งแต่เริ่มงาน ใช้วันที่เริ่มงานเดิมได้|For employees becoming permanent, service starts from this date. Employees hired as permanent can use their original start date.
กรอกเมื่อปรับบรรจุ เพื่อเริ่มนับอายุงานประจำใหม่|Enter the permanent employment date to restart permanent service calculation
กลุ่ม Sorting|Sorting group
ทีม Stamping|Stamping team
หน้าที่ในกลุ่ม|Group responsibility
เครื่องที่รับผิดชอบ|Assigned machines
ใช้เมื่อ Section เป็น Sorting Section|Used for Sorting Section
ใช้เมื่อ Section เป็น Stamping Section|Used for Stamping Section
รหัสพนักงานนี้มีอยู่แล้ว|This employee ID already exists
ไม่พบข้อมูลพนักงาน|Employee not found
ไม่พบพนักงาน|Employee not found
ไม่พบรหัสพนักงานนี้|Employee ID not found
ไม่พบพนักงานใน|No employees in
ยังไม่มีพนักงานใน|No employees in
ยังไม่มีพนักงาน|No employees yet
ไม่มีพนักงานในแผนกนี้|No employees in this section
ไม่มีพนักงานในแผนกที่เลือก|No employees in the selected section
ไม่มีพนักงานในขอบเขตที่เลือก|No employees in the selected scope
ไม่มีข้อมูลพนักงานตามตัวกรองนี้|No employees match these filters
ไม่มีข้อมูลพนักงาน|No employee data
กรุณากรอกรหัสและชื่อพนักงาน|Enter the employee ID and name
กรุณากรอกรหัสพนักงานก่อน|Enter the employee ID first
กรอกรหัสพนักงาน|Enter employee ID
กรุณาเลือกรูปพนักงาน|Choose an employee photo
กรุณาเลือกรูปหรือเลือกการลบรูป|Choose a photo or select remove photo
กำลังบันทึกรูป|Saving photo
ทุกคนใช้รูปเดียวกัน|Everyone uses the same photo
ยังบันทึกรูปไม่สำเร็จ|Photo has not been saved
แก้ไขได้เฉพาะพนักงานในแผนกตัวเอง|You can only edit employees in your own section
ไม่สามารถลบพนักงานต่างแผนก|You cannot remove employees from other sections
ลาออก|Resigned
นำพนักงานออกไม่สำเร็จ|Failed to remove employee
เพิ่มพนักงานไม่สำเร็จ|Failed to add employee
เลือกงานที่ต้องการดำเนินการ|Select an action
เช็คชื่อ|Check in
เช็คชื่อเข้า|Check in
เช็คชื่อปกติ|Normal check-in
เช็คชื่อสำเร็จ|Check-in successful
เช็คชื่อแล้ว|Checked in
เช็คชื่อวันนี้|Today's check-ins
เช็คชื่อวันนี้แล้ว เวลา|Already checked in today at
เวลาเช็คชื่อ|Check-in time
เวลาเช็คชื่อของคุณ|Your check-in time
กรอกรหัสเพื่อดูเวลา|Enter employee ID to view the check-in window
แจ้งเข้าสายล่วงหน้า|Report lateness in advance
แจ้งเข้าสาย|Report lateness
เข้าสาย|Late arrival
มาสาย|Late
ตรงเวลา|On time
ขาดงาน|Absent
ขาด|Absent
สาย|Late
ลาป่วย|Sick leave
ลากิจ|Personal leave
ลา|Leave
วันหยุดบริษัท|Company holiday
วันหยุด|Holiday
ทำงาน|Working
รอเข้ากะ|Waiting for shift
รอเช็คชื่อ|Awaiting check-in
ยังไม่เช็คชื่อ|Not checked in
ไม่มีเช็คชื่อ|No check-in
กะปัจจุบัน|Current shift
กะเช้า / Day Shift|Day Shift
กะดึก / Night Shift|Night Shift
กะกลางวัน|Day shift
กะกลางคืน|Night shift
กะเช้า|Day shift
กะดึก|Night shift
ทุกกะ|All shifts
กะ|Shift
ทีม A|Team A
ทีม B|Team B
ทีม|Team
จัดกะพนักงานรายคน|Assign individual employee shifts
จัดกะพนักงาน|Employee shift planning
จัดรายบุคคล|Assign individually
จัดกะ|Shift planning
ตั้งกะ|Set shift
แผนกะล่วงหน้า|Upcoming shift plan
แผนกะ|Shift plan
บันทึกกะและยืนยัน|Save and confirm shifts
บันทึกแผนกะ|Save shift plan
บันทึกกะไม่สำเร็จ|Failed to save shifts
บันทึกกะ|Save shifts
บันทึกรอบที่แสดงทั้ง|Save all displayed cycles
รอบปัจจุบัน|Current cycle
รอบถัดไป|Next cycle
ใช้รอบปัจจุบัน|Use current cycle
วันเริ่มรอบต้องเป็นวันจันทร์|The cycle must start on Monday
วันจันทร์เริ่มรอบ|Cycle starts on Monday
วันอาทิตย์|Sunday
จันทร์|Monday
อาทิตย์|Sunday
รอบ|Cycle
กลุ่ม|Group
รายคน|Individual
รายบุคคล|Individual
วันเปลี่ยนเป็นลากิจย้อนหลัง|days; changes to retrospective personal leave
ลาป่วยย้อนหลังเกิน|Retrospective sick leave exceeding
ลากิจย้อนหลังเกิน|Retrospective personal leave exceeding
ลาป่วยย้อนหลัง|Retrospective sick leave
ลากิจย้อนหลัง|Retrospective personal leave
ลากิจล่วงหน้า|Advance personal leave
ลาย้อนหลัง|Retrospective leave
วันเดียวกัน|Same day
ลาป่วยวันนั้นไม่มีใบรับรอง|Same-day sick leave without a medical certificate
ลาป่วยวันนั้น|Same-day sick leave
ลาป่วยไม่มีใบรับรองเกิน|Sick leave without a medical certificate for more than
ประเภทการลา|Leave type
แจ้งลา|Request leave
วันที่ลา|Leave date
บันทึกการลา|Save leave request
สถานะการลา|Leave status
ส่งคำขอลาแล้ว|Leave request submitted
กำลังเปิดแบบแจ้งลา|Opening leave form
เปิดแบบแจ้งลาไม่สำเร็จ|Failed to open leave form
กำลังตรวจสอบข้อมูลการลา|Checking leave details
กำลังส่งการลาไปข้อมูลกลาง|Submitting leave request
บันทึกการลาเรียบร้อย|Leave request saved
กรุณาเลือกประเภทการลาและระบุเหตุผล|Select a leave type and enter a reason
กรุณาระบุวันที่ลาที่ถูกต้อง|Enter a valid leave date
วันที่ลาอยู่ก่อนวันที่เริ่มงาน|The leave date is before the employment start date
ลาป่วยไม่สามารถเลือกวันที่ในอนาคตได้|Sick leave cannot be requested for a future date
ประเภทการลาไม่ถูกต้อง|Invalid leave type
ใบรับรองแพทย์|Medical certificate
ใบรับรอง|Certificate
แนบใบรับรองแพทย์ภายหลัง|Attach medical certificate later
แนบใบรับรองแพทย์|Attach medical certificate
เปิดใบรับรองแพทย์|Open medical certificate
ไม่มีใบรับรองแพทย์|No medical certificate
มีใบรับรอง แต่ไม่พบไฟล์|Medical certificate indicated but file missing
เลือกรายการลาป่วย|Select sick leave record
กรุณาเลือกไฟล์ใบรับรองแพทย์|Choose a medical certificate file
กำลังเตรียมใบรับรองแพทย์|Preparing medical certificate
ไม่พบข้อมูลไฟล์ใบรับรองแพทย์|Medical certificate file not found
รูปแบบไฟล์ใบรับรองแพทย์ไม่ถูกต้อง|Invalid medical certificate file format
ไม่สามารถเปิดใบรับรองแพทย์ได้|Unable to open medical certificate
รายการนี้มีใบรับรองแพทย์แล้ว|This record already has a medical certificate
ไม่พบรายการลาป่วยนี้|Sick leave record not found
ไม่พบรายการลาป่วยที่ยังไม่มีใบรับรองแพทย์ภายใน|No sick leave without a medical certificate within
สำหรับรายการที่ยังไม่มีใบรับรองแพทย์|For records without a medical certificate
วันนับจากวันที่ลาป่วย|days from the sick leave date
วันจากวันที่ลาป่วย ไม่สามารถแนบใบรับรองแพทย์ได้|days after sick leave; a medical certificate can no longer be attached
ตามกติกาการลา|According to leave rules
แนบได้ภายใน|Can be attached within
แนบภายหลังได้ภายใน|Can be attached later within
เวลาประเทศไทย|Thailand time
เวลาไทย|Thailand time
เวลาเข้า|Check-in time
เวลาออก|Check-out time
วันเวลา|Date and time
วันที่สแกน|Scan date
วันที่กะ|Shift date
เวลาสแกน|Scan time
วันเวลาสแกน|Scan date and time
วันที่เวลา|Date and time
ไม่หักคะแนน|No deduction
ยังไม่หักคะแนน|Not deducted yet
รายการล่วงหน้า|Future record
คะแนนหักวันนี้|Today's deductions
คะแนนหักรวม|Total deductions
คะแนนเริ่มต้น|Starting score
คะแนนเฉลี่ยรวม|Overall average score
คะแนนเฉลี่ยแผนก|Section average score
คะแนนบุคคล|Individual score
คะแนนรวมเต็ม|Maximum total score
รอคำนวณคะแนน|Awaiting score calculation
ยังไม่มีรายการหักคะแนน|No deduction records yet
ไม่นับคะแนน|Not counted
ดีเยี่ยม|Excellent
ดีมาก|Very good
ต้องปรับปรุง|Needs improvement
เกรด|Grade
กติกาหัก|Deduction rules
เช็คชีท ขาด|Attendance sheet: absence
มาสาย รายเดือน|monthly lateness
เดือนเช็คชีท|Attendance sheet month
มุมมองเช็คชีท|Attendance sheet view
เลือกพนักงานเพื่อดูเช็คชีทรายเดือน|Select an employee to view the monthly attendance sheet
แนวโน้มรายเดือน|Monthly trend
รายละเอียดรายวัน|Daily details
รายวัน|Daily
รายเดือน|Monthly
รายแผนก|By section
เดือนสรุป|Summary month
กรุณาเลือกเดือน|Select a month
เช็คชื่อรวม|Total check-ins
มาสายรวม|Total late arrivals
ลารวม|Total leave
ขาดรวม|Total absences
มาสายวันนี้|Late arrivals today
ลาวันนี้|On leave today
ขาดวันนี้|Absences today
เดือน|Month
ปี|Year
วันนี้|Today
วัน|Day
ชั่วโมง|Hours
นาที|Minutes
วินาที|Seconds
เมตร|Meters
ชิ้น|Pieces
ครั้ง|Times
คน|People
ข้อ|Questions
แถว|Rows
ชุด|Set
หัวข้อ|Topics
มม|mm
มกราคม|January
กุมภาพันธ์|February
มีนาคม|March
เมษายน|April
พฤษภาคม|May
มิถุนายน|June
กรกฎาคม|July
สิงหาคม|August
กันยายน|September
ตุลาคม|October
พฤศจิกายน|November
ธันวาคม|December
เริ่มใช้งานจริง|Start live mode
โหมดทดลอง|Trial mode
ทดลองใช้|Trial
ช่วงทดลองระบบ|System trial period
ช่วงทดลอง|Trial period
ล้างข้อมูลทดลองทั้งหมด|Clear all trial data
ล้างข้อมูลทดลอง|Clear trial data
ล้างประวัติผลสอบ|Clear examination history
ล้างการผูกเครื่อง|Clear device bindings
กลับเป็นโหมดทดลอง|Return to trial mode
กำลังอยู่ในโหมดทดลอง|Currently in trial mode
รีเซ็ตและเริ่มใช้งานจริงใหม่|Reset and restart live mode
วันที่เริ่มใช้งาน|Live start date
วันที่เริ่มใช้|Start date
วันเริ่ม|Start date
วันที่เริ่ม|Start date
วันที่สิ้นสุด|End date
ขอบเขต|Scope
ล้างตามปี|Clear by year
ตามวันที่|By date
เริ่มประเมิน|Start assessment
ยังไม่เริ่มประเมิน|Assessment not started
เริ่มนับคะแนนปีนี้|Start score calculation this year
เริ่มนับ|Start counting
ยกเลิกการล้างข้อมูล|Cancel data clearing
ไม่ลบข้อมูลพนักงาน|Employee records will not be deleted
ข้อมูลพนักงานจะไม่ถูกลบ|Employee records will not be deleted
ยกเลิกช่วงนี้|Cancel this period
ช่วงทดลองที่ตั้งไว้|Configured trial period
กรุณาเลือกวันที่ให้ครบ|Select both dates
วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด|The start date must not be later than the end date
ยืนยันล้าง|Confirm clearing
ล้างข้อมูลแล้ว|Data cleared
จัดการเครื่องเช็คชื่อ|Manage attendance devices
อัปโหลดข้อมูลจากเครื่องสแกน|Upload attendance device data
อัปโหลดข้อมูลการสแกน|Upload scan records
ประเภทการสแกน|Scan type
ประเภทเข้า|Check-in type
เข้างาน|Check in
ออกงาน|Check out
ไม่ต้องระบุรุ่นเครื่อง|Device model not required
เลือกไฟล์ข้อมูลการสแกน|Choose scan data file
ดาวน์โหลดไฟล์ตัวอย่าง|Download sample file
ตรวจสอบข้อมูล|Validate data
ยืนยันนำเข้ารายการที่พร้อม|Import validated records
พร้อมนำเข้า|Ready to import
ไม่มีรายการพร้อมนำเข้า|No records ready to import
ข้อมูลผิด|Invalid data
ต้องตรวจสอบ|Review required
รอส่ง|Pending submission
ซ้ำ|Duplicate
ข้าม|Skip
ผลตรวจสอบ|Validation result
วันและเวลาในคอลัมน์เดียว|Date and time in one column
รูปแบบวันที่|Date format
ไฟล์นี้มีเฉพาะเวลาเข้า|This file contains check-in records only
เลือกคอลัมน์รหัสพนักงาน และวันเวลาสแกนให้ครบ|Select the employee ID and scan date/time columns
คอลัมน์แต่ละรายการต้องไม่ซ้ำกัน|Each field must use a different column
จำนวนช่องข้อมูลไม่ตรงกับหัวคอลัมน์|The number of fields does not match the column headers
ใช้วันที่พร้อมเวลา เช่น|Use date and time, for example
ไม่มีรายการที่ต้องแก้ไข|No records need correction
กำลังนำเข้าข้อมูลอยู่|Import is already in progress
บันทึกข้อมูลเครื่อง|Save device details
กำลังบันทึกข้อมูลเครื่อง|Saving device details
บันทึกข้อมูลเครื่องแล้ว|Device details saved
ชื่อเครื่อง|Device name
รหัสเครื่อง|Device ID
ยี่ห้อ|Brand
รุ่น|Model
จุดติดตั้ง|Installation location
วิธีเชื่อมต่อ|Connection method
เขตเวลา|Time zone
เตรียมเชื่อมต่อเครื่องสแกนนิ้ว|Prepare fingerprint device integration
ยังไม่เปิดเชื่อมต่อเครื่องจริง|Live device integration is not enabled yet
เครื่องสแกนทางเข้าโรงงาน|Factory entrance scanner
ระบุเมื่อเลือกซื้อเครื่องแล้ว|Enter after selecting a device
ผ่านโปรแกรมตัวกลางในโรงงาน|Through a local integration service
ผ่านระบบ|Through the system
กรุณาระบุชื่อเครื่องและรหัสเครื่อง|Enter the device name and ID
ข้อมูลเครื่องสแกนไม่ถูกต้อง|Invalid scanner details
ตั้งค่าหมุดโรงงานและเวลา|Factory location and time settings
ตั้งค่าหมุด|Location settings
หมุดโรงงาน|Factory pin
ยังไม่ได้ยืนยันหมุด|Factory pin not confirmed
ชื่อสถานที่|Location name
ที่อยู่|Address
ชื่อบริษัท|Company name
ค้นหาสถานที่|Search location
วิธีตั้งหมุด|How to set the pin
ปักหมุดที่กึ่งกลางแผนที่|Place pin at map center
รัศมีเช็คชื่อ|Check-in radius
สูงสุดที่ยอมรับ|Maximum allowed
พื้นที่เช็คชื่อ|Check-in area
วันที่เริ่มนับ|Calculation start date
มาตรฐานเวลา|Time standard
ประเทศไทย|Thailand
กติกาเวลาคงที่|Fixed time rules
ยืนยันตำแหน่งโรงงานและบันทึก|Confirm and save factory location
ค้นหาเพื่อเลื่อนแผนที่ไปบริเวณใกล้เคียง|Search to move the map near the factory
ซูมแผนที่เองให้เห็นตัวอาคาร|Zoom manually until you can see the building
คลิกบนแผนที่เพื่อปักหมุดใหม่ หรือจับหมุดลากเอง|Click the map to place a new pin or drag the existing pin
ตรวจวงรัศมี|Check the radius circle
กดยืนยันเพื่อบันทึกจริง|Confirm to save
คลิกหรือลากหมุดเพื่อปรับให้ตรงตัวอาคาร|Click or drag the pin onto the building
ยังไม่บันทึกจนกว่าจะกดยืนยัน|Changes are not saved until you confirm
กรุณาพิมพ์ชื่อสถานที่หรือที่อยู่|Enter a location name or address
ค้นหาสถานที่ไม่สำเร็จ|Location search failed
ค้นหาไม่สำเร็จ|Search failed
ไม่พบสถานที่ ลองค้นด้วยชื่อบริษัทภาษาอังกฤษหรือที่อยู่|Location not found. Try the English company name or address.
บันทึกหมุดโรงงานเรียบร้อย|Factory location saved
อยู่นอกพื้นที่โรงงาน|Outside the factory area
นอกพื้นที่โรงงาน|Outside the factory area
กรุณาอนุญาตการเข้าถึงตำแหน่ง|Allow location access
อุปกรณ์นี้ไม่รองรับ|This device does not support
กำลังตรวจรหัสพนักงาน|Checking employee ID
กำลังตรวจระบบ|Checking the system
กำลังยืนยันข้อมูล|Confirming data
กำลังส่งเวลาเดิม|Sending the saved check-in time
กำลังตรวจ|Checking
เวลาเช็คชื่อไม่ถูกต้อง|Invalid check-in time
วันที่ไม่ถูกต้อง|Invalid date
วันเวลาสแกนไม่ถูกต้อง|Invalid scan date/time
เวลาสายไม่ครบ|Missing lateness duration
ยังไม่มีเวลาเช็คชื่อ|No check-in time yet
เลยเวลาเช็คชื่อปกติ|The normal check-in window has closed
เปิดเช็คชื่อตั้งแต่|Check-in opens at
กรุณาเช็คชื่อเมื่อถึงเวลา|Check in when the check-in window opens
สาเหตุการเข้าสาย|Reason for lateness
กรุณาพิมพ์สาเหตุการเข้าสาย|Enter the reason for lateness
กรุณาระบุสาเหตุการเข้าสาย|Enter the reason for lateness
พิมพ์สาเหตุการเข้าสายให้ชัดเจน เช่น รถเสีย รถติดฉุกเฉิน|Describe the reason clearly, e.g. vehicle breakdown or unexpected traffic
บันทึกแจ้งเข้าสายล่วงหน้า|Save advance lateness notice
บันทึกแจ้งเข้าสายล่วงหน้าและส่งขึ้นเว็บเรียบร้อย|Advance lateness notice saved and submitted
ต้องพิมพ์สาเหตุการเข้าสาย|A reason for lateness is required
หลังเวลานี้ต้องแจ้งเหตุผล|A reason is required after this time
แจ้งเข้าสายหรือลาต่าง ๆ ล่วงหน้าไม่เกิน|Report lateness or leave in advance no later than
ซิงก์|Sync
ซิงค์|Sync
ซิงก์ไม่สำเร็จ|Sync failed
ซิงค์ฐานข้อมูลกลาง|Sync shared database
รอซิงก์|Pending sync
รอส่งซ้ำ|Pending retry
รอส่งซ้ำอัตโนมัติ|Awaiting automatic retry
รอส่งข้อมูลอัตโนมัติ|Awaiting automatic submission
ยังซิงก์ไม่สำเร็จ|Sync not completed
ข้อมูลกลางยืนยันแล้ว|Shared data confirmed
เชื่อมต่อข้อมูลกลางแล้ว|Connected to shared data
ข้อมูลกลางอัปเดตแล้ว|Shared data updated
เชื่อมต่อแล้ว|Connected
ขาดการเชื่อมต่อ|Disconnected
ยังไม่เชื่อมต่อ|Not connected
ยังไม่ได้เชื่อม|Not connected
กำลังเชื่อมต่อฐานข้อมูล|Connecting to database
ยังไม่ได้ตั้งค่า|Not configured
ไม่พบการตั้งค่า|Settings not found
ยังไม่พร้อม|Not ready
ยังไม่ยืนยัน|Not confirmed
ยืนยันแล้ว|Confirmed
รอตรวจสอบ|Pending review
รอตรวจ|Pending review
รอข้อมูล|Awaiting data
อ่านข้อมูล|Read data
ส่งข้อมูล|Submit data
ยืนยันข้อมูล|Confirm data
บันทึกแล้ว|Saved
บันทึกสำเร็จ|Saved successfully
ยังไม่บันทึก|Not saved
ยังบันทึกไม่สำเร็จ|Not saved yet
บันทึกในเครื่องแล้ว รอซิงก์|Saved locally; awaiting sync
บันทึกในเครื่องแล้วและรอซิงก์|Saved locally; awaiting sync
บันทึกในเครื่องแล้ว แต่|Saved locally, but
ลบในเครื่องแล้ว แต่|Deleted locally, but
ลบในเครื่องแล้ว รอซิงก์|Deleted locally; awaiting sync
เก็บรายการรอลบไว้แล้ว|Deletion queued
เก็บรายการรอส่งไว้แล้ว|Submission queued
ต้องเชื่อมต่อข้อมูลล่าสุดก่อนบันทึก|Connect to the latest data before saving
มีการแก้ไขพร้อมกัน กรุณาลองบันทึกอีกครั้ง|Someone else updated the data. Please save again.
ฐานข้อมูลไม่ส่งเวอร์ชันยืนยัน กรุณาลองอีกครั้ง|Database confirmation was not received. Please try again.
หมดเวลา กรุณาลองอีกครั้ง|Request timed out. Please try again.
หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง|Session expired. Please sign in again.
หมดอายุ|Expired
หมดเวลา|Timed out
การอัปเดตสดขาดการเชื่อมต่อ|Live update connection lost
แสดงข้อมูลสำรองและยังบันทึกไม่ได้|Showing cached data; saving is temporarily unavailable
กดโหลดข้อมูลล่าสุด|Reload the latest data
จากข้อมูลกลาง|From shared data
บันทึกในเครื่องแล้ว รอส่งซ้ำอัตโนมัติเมื่อเชื่อมต่อได้|Saved locally; will retry automatically when connected
ระบบจะส่งซ้ำอัตโนมัติเมื่อเชื่อมต่อได้|The system will retry automatically when connected
ไม่พบการตั้งค่าฐานข้อมูล|Database settings not found
ไม่มีสิทธิ์|Access denied
สิทธิ์|Permissions
ไม่พบสิทธิ์|Permission not found
บัญชีหลัก|Primary account
บัญชีที่ใช้อยู่|Current account
เพิ่มบัญชี|Add account
เปิดบัญชี|Enable account
ปิดบัญชี|Disable account
บัญชี|Account
กำลังโหลดบัญชี|Loading accounts
ไม่พบบัญชีผู้ใช้|User account not found
ไม่พบบัญชี|Account not found
เพิ่มและจัดการบัญชี|Add and manage accounts
ใช้งาน|Enabled
ปิดใช้งาน|Disabled
ใช้งานจริง|Live mode
รหัสผ่าน|Password
ชื่อผู้ใช้|Username
กู้บัญชีและเข้าสู่ระบบ|Recover account and sign in
กู้บัญชี|Recover account
กำลังกู้บัญชี|Recovering account
เครื่องของ|Device belongs to
ตรวจสอบเครื่อง|Verify device
กำลังตรวจสอบเครื่อง|Checking device
ไม่ตรงกัน|Does not match
ไม่ถูกต้อง|Invalid
ยังไม่ได้อนุญาต|Not authorized yet
รหัสนี้ไม่มีสิทธิ์|This ID does not have permission
เครื่องนี้ไม่มีสิทธิ์จัดการ|This device is not authorized to manage
เครื่องนี้ไม่มีสิทธิ์เข้าใช้งาน|This device is not authorized to sign in
กรุณา Login เป็น Admin|Please sign in as Admin
กรุณากลับไป Login เป็น Admin ก่อนเข้า Factory Organization|Sign in as Admin before opening Factory Organization
หน้านี้สำหรับ Admin เท่านั้น|This page is for Admin only
ไม่พบการตั้งค่าฐานข้อมูลบัญชีผู้ใช้|User account database settings not found
ไม่อนุญาตให้บันทึกบัญชีผู้ใช้|User account changes are not permitted
เชื่อมต่อฐานข้อมูลบัญชีผู้ใช้ไม่สำเร็จ|Failed to connect to the user account database
มีการแก้ไขบัญชีพร้อมกัน กรุณาลองอีกครั้ง|Another user changed the accounts. Please try again.
ไม่สามารถลบหรือปิดบัญชี|Cannot delete or disable account
ข้อสอบ|Examination
ระบบสอบ|Examination system
คลังข้อสอบ|Question bank
ชุดข้อสอบ|Exam set
ประเภทข้อสอบ|Exam type
เลือกประเภทข้อสอบ|Select exam type
เลือกชุดข้อสอบ|Select exam set
คำถาม|Question
คำตอบที่ถูก|Correct answer
พนักงานตอบ|Employee answer
ข้อเขียน|Written questions
กรณีศึกษา|Case study
ตรวจข้อเขียน|Review written answers
แก้ไขข้อสอบ|Edit examination
เช็ค/แก้ไขข้อสอบ|Review / edit examinations
ตรวจคำตอบ|Review answers
ส่งข้อสอบ|Submit examination
ส่งข้อสอบเรียบร้อยแล้ว|Examination submitted successfully
ส่งข้อสอบแล้ว ไม่สามารถทำซ้ำ|Examination submitted; retakes are not allowed
ส่งข้อสอบและบันทึก|Submit examination and save
ส่งผลสอบหมดเวลา|Examination submission timed out
เก็บผลสอบแล้ว|Exam results saved
ยังไม่มีผลสอบ|No exam results yet
ไม่พบผลสอบ|Exam results not found
ยังไม่มีประวัติการสอบ|No examination history yet
ประวัติการสอบ|Examination history
วันที่ส่ง|Submission date
สอบแล้ว|Completed
ยังไม่สอบ|Not taken
ใกล้สอบ|Exam due soon
เกินกำหนด|Overdue
รออนุมัติ|Pending approval
ผู้จัดการอนุมัติแล้ว|Approved by manager
ผู้จัดการอนุมัติ|Manager approval
อนุมัติ|Approve
อัปสกิลอัตโนมัติแล้ว|Skill level updated automatically
อัพสกิลปกติ|Regular skill upgrade
ข้อสอบอัพสกิลปกติ|Regular skill upgrade exam
ข้อสอบปรับบรรจุ|Permanent employment exam
ข้อสอบพนักงานเริ่มงานใหม่|New employee exam
เข้าสอบอัพสกิล|Take skill upgrade exam
เข้าสอบปรับบรรจุ|Take permanent employment exam
เข้าสอบพนักงานใหม่|Take new employee exam
เข้าสอบตามรอบ|Take scheduled exam
สามารถบรรจุได้|Eligible for permanent employment
ยังไม่สามารถบรรจุได้|Not yet eligible for permanent employment
ประเมินความพร้อมสำหรับการบรรจุเป็นพนักงานประจำ|Assess readiness for permanent employment
ไม่ยืนยันผลสอบ|Exam results not confirmed
ยังไม่ยืนยันผลสอบ|Exam results not confirmed yet
ไม่พบรหัสชุดข้อสอบ|Exam set ID not found
ข้อมูลผลสอบไม่สมบูรณ์|Incomplete examination result
เลือกชุดข้อสอบ แล้วแก้คำถาม ตัวเลือก และคำตอบที่ถูก|Select an exam set, then edit questions, choices, and correct answers
บันทึกข้อสอบชุดนี้|Save this exam set
คืนค่าเริ่มต้น|Restore defaults
ค่าเริ่มต้น|Default
แก้ไขแล้ว|Edited
ไม่ได้ตอบ|Unanswered
ตอบแล้ว|Answered
ตอบถูกทุกข้อ ไม่พบหัวข้อที่ต้องทบทวน|All answers are correct; no topics require review
ดูข้อที่ตอบผิด|View incorrect answers
ประวัติข้อที่ตอบผิด|Incorrect answer history
หัวข้อที่ควรเทรนนิ่งซ้ำ|Topics requiring retraining
ส่งอัตโนมัติ|Automatically submitted
ออกจากหน้าสอบ|Left the exam page
ระบบส่งข้อสอบอัตโนมัติเนื่องจากออกจากหน้าสอบ|The exam was submitted automatically because you left the exam page
ห้ามออกจากหน้าสอบ สลับแอป สลับแท็บ หรือปิดหน้าจอ ระหว่างทำข้อสอบ หากออกจากหน้าสอบ ระบบจะส่งคำตอบที่ทำไว้ทันที แม้ยังทำไม่ครบ และไม่สามารถกลับมาทำต่อได้|Do not leave the exam page, switch apps or tabs, or turn off the screen during the exam. If you leave, your answers will be submitted immediately and you cannot resume the exam.
โหมดสอบป้องกันการเปิดข้อมูลภายนอก|Exam mode prevents access to external information
ไม่สามารถกลับเข้ามาทำต่อหรือส่งข้อสอบชุดนี้ซ้ำได้|You cannot resume or resubmit this exam set
เมื่อส่งข้อสอบ ระบบจะแจ้งผลว่า สามารถบรรจุได้ หรือ ยังไม่สามารถบรรจุได้|After submission, the system will show whether you are eligible for permanent employment
ข้อสอบปรับบรรจุสอบได้|Permanent employment exams may be taken
ครั้งต่อเดือน และเดือนนี้ได้ใช้สิทธิ์สอบแล้ว|time per month; your attempt for this month has already been used
มีประวัติการส่งข้อสอบแล้ว ระบบปิดข้อสอบชุดนี้และห้ามทำซ้ำ|This exam has already been submitted. The exam is closed and cannot be taken again.
พิมพ์คำตอบอย่างละเอียด|Enter a detailed answer
ตอบให้ครบ|Answer all questions
เกณฑ์ผ่าน|Passing requirement
ผ่านเกณฑ์|Passed
ไม่ผ่านเกณฑ์|Failed
ถึงเกณฑ์|Target achieved
ไม่ถึงเกณฑ์|Below target
ต่ำกว่าเกณฑ์|Below requirement
ผ่าน|Pass
ผิด|Incorrect
ถูก|Correct
ระดับความเชี่ยวชาญ|Proficiency level
ระดับ|Level
ตารางทักษะพนักงาน|Employee skill matrix
สกิลปัจจุบัน|Current skill level
อัปเดตค่าปัจจุบันก่อนเริ่มรอบใหม่|Update current levels before starting a new cycle
อัปเดตค่าปัจจุบันของพนักงานก่อนเริ่มรอบใหม่|Update the employee's current levels before starting a new cycle
บันทึกผลประเมิน|Save assessment
ชื่อผู้ประเมิน|Evaluator name
ผู้ประเมิน|Evaluator
วันที่ประเมิน|Assessment date
ประเภทการอัปเดต|Update type
เลือกทุกหัวข้อ|Select all topics
ยกเลิกการเลือกทั้งหมด|Deselect all
กรุณาเลือกอย่างน้อย|Select at least
กรุณากรอกชื่อผู้ประเมิน|Enter the evaluator's name
ยังไม่มีการเปลี่ยนแปลง|No changes yet
รายไตรมาส|Quarterly
มีความรู้พื้นฐาน ต้องได้รับการสอนและควบคุมอย่างใกล้ชิด|Basic knowledge; requires instruction and close supervision
ปฏิบัติงานพื้นฐานได้ แต่ยังต้องได้รับคำแนะนำหรือการตรวจสอบ|Can perform basic tasks but still needs guidance or checks
ปฏิบัติงานได้ด้วยตนเองตามมาตรฐาน|Works independently according to standards
มีความชำนาญ แก้ไขปัญหาเบื้องต้นและสอนงานได้|Skilled; can solve basic problems and coach others
เป็นผู้เชี่ยวชาญ กำหนดมาตรฐานและฝึกสอนผู้อื่นได้|Expert; can establish standards and train others
พื้นฐาน|Basic
การปฏิบัติงาน|Operation
การวิเคราะห์หน้างาน|Shop-floor analysis
การตัดสินใจและควบคุม|Decision-making and control
ผู้เชี่ยวชาญ|Expert
ก่อนปรับ|Before update
ปรับอัตโนมัติ|Automatically updated
หัวข้อคะแนนต่ำสุด|Lowest-scoring topics
ประวัติการทำงานเสีย|Defect history
ใบแดงสะสม|Accumulated red cards
ใบเหลืองรอบปัจจุบัน|Yellow cards in current cycle
ใบเหลืองรอบนี้|Yellow cards this cycle
ใบเหลือง|Yellow card
ใบแดง|Red card
บันทึกประวัติ|Save history
ยังไม่มีประวัติ|No history yet
วันที่เกิดเหตุ|Incident date
ประเภทปัญหา|Issue type
ลืมประกอบ|Missing assembly
ประกอบผิด|Incorrect assembly
ผลิตผิดสเปก|Out-of-spec production
ตรวจสอบไม่พบ|Undetected defect
อื่น ๆ|Other
การแก้ไข|Corrective action
ป้องกันซ้ำ|Recurrence prevention
แนบภาพหลักฐาน|Attach evidence photo
กรุณาแนบภาพหลักฐาน|Attach an evidence photo
เปิดภาพหลักฐาน|Open evidence photo
เหตุการณ์ทั้งหมด|All incidents
เหตุการณ์|Incident
ล้างตัวกรอง|Clear filters
เลือกมุมมอง|Select view
เลือกกลุ่ม|Select group
ผู้จัดทำ|Prepared by
ผู้ตรวจสอบ|Reviewed by
ผู้อนุมัติ|Approved by
จัดทำโดย|Prepared by
ตรวจสอบโดย|Reviewed by
อนุมัติโดย|Approved by
พิมพ์หน้าหลัง|Print front and back
เปิดหน้าพิมพ์หน้าหลัง|Open front/back print view
ขนาดบัตร|Card size
ขนาดกระดาษ|Paper size
แนวนอน|Landscape
แนวตั้ง|Portrait
กำลังเตรียมหน้าพิมพ์|Preparing print view
กำลังสร้างไฟล์|Creating file
สำรองข้อมูลเต็ม|Full backup
สำรอง|Backup
นำเข้า|Import
สำรองและส่งออกข้อมูลจาก|Back up and export data from
ไม่พบรายงานสำหรับดาวน์โหลด|No report available for download
วันที่มีผล|Effective date
รูปแบบ|Format
ขนาด|Size
ประวัติ|History
รับทราบ|Acknowledge
ผู้เยี่ยมชม|Visitor
มีผู้เยี่ยมชมเข้าพื้นที่|Visitors will enter the area
มีผู้เยี่ยมชม|Visitors expected
แผนแจ้งเตือน|Notification schedule
ส่งไปยังกะ|Send to shift
แจ้งเตือนล่วงหน้า|Advance notification
ข้อความ|Message
กำลังโหลดแผน|Loading schedule
ยังไม่มีแผนแจ้งเตือน|No notification schedule yet
ลบแผนแจ้งเตือนนี้หรือไม่|Delete this notification schedule?
กะที่กำลังทำงานตอนแจ้ง|Shift active at notification time
วันที่หรือเวลาไม่ถูกต้อง|Invalid date or time
บันทึกแผนเรียบร้อย|Schedule saved
บันทึกแผน|Save schedule
ส่งทันที|Send now
แจ้งเตือน|Notifications
เปิดแจ้งเตือน|Enable notifications
เปิดแจ้งเตือนเรียบร้อย|Notifications enabled
เปิดแจ้งเตือนไม่สำเร็จ|Failed to enable notifications
เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน|This browser does not support notifications
กรุณาจัดเตรียมพื้นที่ รักษาความสะอาด|Prepare the area and keep it clean
และปฏิบัติตามมาตรฐานความปลอดภัย|and follow safety standards
กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน|Prepare the area and follow standards
รายละเอียดงานรายบุคคล|Individual job description
เลขที่เอกสาร|Document number
รายงานต่อ|Reports to
ผู้บังคับบัญชา|Supervisor
หน้าที่และความรับผิดชอบ|Duties and responsibilities
คุณสมบัติ|Qualifications
ทักษะที่จำเป็น|Required skills
ลิงก์ไฟล์|File link
ใส่ลิงก์|Enter link
กรอกหน้าที่งาน แยกแต่ละข้อคนละบรรทัด|Enter one responsibility per line
หรือเอกสารที่ผู้ใช้งานมีสิทธิ์เปิดดู|or a document the user has permission to access
กรุณาเลือกพนักงานที่ต้องการจัดทำ|Select an employee to create
กรุณากรอกหน้าที่และความรับผิดชอบ|Enter duties and responsibilities
รายละเอียดงานยาวเกินกำหนด|Job description exceeds the maximum length
กรุณาเชื่อมต่อฐานข้อมูลก่อนบันทึก|Connect to the database before saving
แสดงรายการที่เคยโหลดไว้|Showing previously loaded records
เพื่อเพิ่มรายละเอียดงาน|to add job details
เพิ่ม / แก้ไข JD|Add / edit JD
เพิ่ม/แก้ไข JD|Add / edit JD
เปิด JD|View JD
บันทึก JD|Save JD
เพิ่ม Section|Add Section
เพิ่ม Section ใหม่|Add new Section
ชื่อ Section|Section name
เพิ่มตำแหน่งใน Section|Add position to Section
ยังไม่มีตำแหน่ง|No positions yet
ไม่ระบุตำแหน่ง|Position not specified
ตั้งค่า Factory Organization|Factory Organization settings
โครงสร้างองค์กร|Organization structure
วิธีดำเนินการ|Procedure
แผนการอบรมและการสอบ|Training and examination plan
แบบฟอร์มและหลักฐานการอบรม|Training forms and evidence
พิมพ์แบบฟอร์ม|Print form
บันทึกและเปิดแบบฟอร์มพิมพ์|Save and open printable form
บรรทัดต่อ|Lines per
การผลิตรายเดือน|Monthly production
การผลิต|Production
เดือนสรุป|Summary month
วันที่ผลิต|Production date
ผลรายวัน|Daily results
วันที่ถึงเกณฑ์|Target achievement dates
วันถึงเกณฑ์รวม|Total days achieving target
วันถึงเกณฑ์|Days achieving target
วันไม่ถึงเกณฑ์|Days below target
วันรอตรวจ|Days awaiting review
ยังไม่มีวันถึงเกณฑ์|No target achievement days yet
ยังไม่มีข้อมูลสรุป|No summary data yet
กำลังเตรียมสรุป|Preparing summary
ดูรายวัน|View daily results
ทำได้|Achieved
เป้า|Target
ชิ้นดี|Good pieces
ผลผลิต|Output
ไม่มีการผลิต|No production
รอตรวจข้อมูลล่าสุดก่อนนับวันผ่าน|Awaiting review of the latest data before counting as a successful day
วันที่รอตรวจยังไม่นับเป็นวันผ่าน|Days awaiting review are not counted as successful days
ยังไม่นับข้อมูลนี้เป็นวันผ่าน|This record is not counted as a successful day yet
หน้าเครื่องและทุกเครื่องที่ทำในวันนั้นถึงเกณฑ์|Machine records and all machines used that day must achieve the target
ไม่ตรงกับวันที่ผลิต|Does not match the production date
ล่าสุด|Latest
อัปเดตข้อมูล|Refresh data
โหลดข้อมูลล่าสุด|Reload latest data
Layout โรงงาน|Factory Layout
ผังเครื่องจักรโรงงาน|Factory machine layout
ผังโรงงาน|Factory layout
ผัง|Layout
เครื่องจักร|Machine
เครื่อง|Machine
จุดงาน|Workstation
พื้นที่|Area
ภาพผัง|Layout image
ชื่อผัง|Layout name
ค้นหาเครื่อง|Search machines
ค้นหาตำแหน่งพนักงานหรือเครื่องจักร|Search employee assignments or machines
ค้นหาชื่อหรือรหัสพนักงาน|Search employee name or ID
พิมพ์ชื่อหรือรหัสพนักงาน|Enter employee name or ID
เลือกเครื่องจักร|Select a machine
รายละเอียดเครื่องจักร|Machine details
เพิ่มเครื่องจักรหรือเปลี่ยนตัวกรอง|Add a machine or change filters
ไม่พบเครื่องจักร|No machines found
เลือกเครื่องปลายทาง|Select destination machine
เครื่องปลายทาง|Destination machine
ย้ายพนักงานไปเครื่องอื่น|Move employee to another machine
ย้ายไปเครื่องอื่น|Move to another machine
ย้ายพนักงานไปเครื่องปลายทาง|Move employee to destination machine
บันทึกการย้าย|Save move
เพิ่มพนักงานประจำเครื่อง|Assign employee to machine
พนักงานประจำเครื่อง|Assigned employees
พนักงานที่ยังไม่ประจำเครื่อง|Unassigned employees
ประจำเครื่อง|Assigned to machine
กำหนดเป็นผู้รับผิดชอบประจำจุด|Assign as workstation owner
กำหนดพนักงานครบแล้ว|All employees assigned
ยังไม่จัดทั้งสองกะ|Unassigned in both shifts
ยังไม่ได้กำหนดพนักงาน|No employees assigned yet
ยังไม่กำหนดพนักงาน|No employees assigned yet
ยังไม่กำหนดตำแหน่ง|Position not assigned
ยังไม่วางตำแหน่ง|Not placed yet
วางบนผังแล้ว|Placed on layout
พนักงานอยู่บนผัง|Employees on layout
ยกเลิกพนักงานประจำเครื่องก่อนเปลี่ยน|Unassign employees before changing
ลากกลับแถบรายชื่อเพื่อยกเลิกประจำเครื่อง|Drag back to the employee list to unassign
ลากพนักงานกลับมาที่นี่เพื่อยกเลิกประจำเครื่อง|Drag employees back here to unassign
ลากกลับแถบนี้เพื่อยกเลิกประจำเครื่อง|Drag back to this list to unassign
ลากหรือเลือกพนักงานมาวาง|Drag or select an employee to assign
ลากพนักงานมาวางที่นี่เพื่อยกเลิกตำแหน่ง|Drag an employee here to unassign
ลากการ์ด หรือแตะพนักงานแล้วแตะช่องเครื่องจักรเพื่อย้าย|Drag a card, or tap an employee and then a machine slot to move
ลากรูปหรือแตะพนักงานแล้วเลือกเครื่องจักร|Drag a photo or tap an employee, then select a machine
ลากรูปพนักงานที่อยู่บนป้ายเครื่องไปวางบนป้ายเครื่องปลายทางเพื่อย้ายทันที|Drag an employee photo from the current machine label to the destination machine label to move immediately
กดเครื่องเพื่อดูผู้รับผิดชอบ|Select a machine to view assigned employees
เลือกเครื่องจากผังหรือรายการด้านซ้าย เพื่อดูและกำหนดพนักงาน|Select a machine on the layout or in the left list to view and assign employees
เลือกเครื่องแล้วลากพนักงานลงพื้นที่ว่างบนผัง หรือวางลงป้ายเครื่อง|Select a machine, then drag an employee onto the layout or the machine label
เลือกเครื่องแล้วลากพนักงานลงพื้นที่ว่างบนผัง|Select a machine, then drag an employee onto an empty area of the layout
การ์ดจะอยู่ตรงจุดที่วาง|The card will stay where you place it
เลือกกะเช้าหรือกะดึก|Select day or night shift
เลือกกะพนักงานประจำเครื่อง|Select assignment shift
ลากรูปจากรายชื่อเพื่อกำหนดเครื่อง|Drag a photo from the list to assign a machine
ลากรูปจากเครื่องเดิมไปเครื่องใหม่เพื่อย้าย|Drag a photo from the current machine to another machine to move
ซูมแผนก|Zoom to section
ซูมเครื่อง|Zoom to machine
ระดับซูม|Zoom level
กำหนดเอง|Custom
ย่อผัง|Zoom out
ขยายผัง|Zoom in
เต็มผังแผนก|Fit section layout
เต็มผังรวม|Fit factory layout
รวมเต็มภาพ|Fit full layout
แสดงผังแผนกเต็มภาพ|Show full section layout
เลือกระดับซูมและเลื่อนดูพื้นที่โรงงาน|Select a zoom level and pan around the factory
กำหนดพื้นที่แผนก|Define section area
ยกเลิกกำหนดพื้นที่|Cancel area selection
ยังไม่ได้กำหนดพื้นที่|Area not defined yet
วางจุดบนผัง|Place point on layout
ย้ายจุดบนผัง|Move point on layout
ยกเลิกวางตำแหน่ง|Cancel placement
ยังไม่ได้วางจุด|Point not placed yet
กดตำแหน่งจริงบนผังเพื่อบันทึกจุดเครื่อง|Click the actual position on the layout to save the machine point
กรุณาวางจุดตามตำแหน่งจริง|Place the point at the actual location
เพิ่มเครื่อง|Add machine
ลบเครื่อง|Delete machine
แก้ไขเครื่อง|Edit machine
แก้ไขชื่อ|Rename
หมายเลขเครื่อง|Machine number
เครื่องนี้ถูกลบแล้ว|This machine has been deleted
เครื่องต้นทางหรือปลายทางถูกลบแล้ว|The source or destination machine has been deleted
เลือกเครื่องปลายทางที่ต่างจากเครื่องเดิม|Select a different destination machine
ยังไม่มีเครื่องปลายทางอื่นใน|No other destination machines in
พนักงานไม่ตรงกับเครื่อง|The employee and machine sections do not match
กรุณาเลือกพนักงานจากรายชื่อ|Select an employee from the list
ตำแหน่งไม่ถูกต้อง|Invalid position
เลือกเครื่องในผังที่กำลังแสดงก่อนวางพนักงาน|Select a machine on the current layout before placing an employee
อัปโหลดผังแผนก|Upload section layout
อัปโหลดผังแยกแผนก|Upload separate section layouts
ผังที่จะอัปโหลด|Layout to upload
อัปโหลดและบันทึก|Upload and save
เพิ่มผังใหม่ในแผนกนี้|Add a new layout to this section
เก็บความละเอียดต้นฉบับ|Keep original resolution
กำลังอัปโหลดภาพต้นฉบับ|Uploading original image
กำลังโหลดภาพผังแผนก|Loading section layout image
กำลังโหลดภาพผัง|Loading layout image
ไฟล์ภาพผังไม่ถูกต้อง|Invalid layout image file
ที่อยู่ภาพผังไม่ถูกต้อง|Invalid layout image URL
โหลดหรือบันทึกภาพผังไม่สำเร็จ|Failed to load or save layout image
โหลดภาพไม่ได้|Cannot load image
อ่านไฟล์ภาพไม่ได้|Cannot read image file
เปิดไฟล์ภาพไม่ได้|Cannot open image file
ภาพไม่มีขนาดที่ถูกต้อง|Invalid image dimensions
ผังนี้ถูกลบแล้ว|This layout has been deleted
อัปโหลดผังแผนกแล้ว|Section layout uploaded
บันทึกพื้นที่แผนกแล้ว|Section area saved
รายชื่อพนักงานประจำเครื่องยังอยู่|Existing employee assignments are retained
คงจุดเครื่องเดิมเมื่อภาพใหม่มีตำแหน่งตรงกับเดิม|Keep existing machine points when the new image uses the same positions
เมื่อเปลี่ยนภาพ จุดเครื่องในผังนี้จะต้องวางใหม่ เว้นแต่เลือกคงจุดเดิม|When replacing the image, place the machine points again unless you choose to keep existing points
ขยายได้ตามความละเอียดต้นฉบับ|Zoom quality depends on the original image resolution
อาจเห็นพิกเซลเมื่อขยายมาก แต่ป้ายชื่อยังคมชัด|The image may pixelate at high zoom; labels remain sharp
ช่องพนักงานว่างแสดงเฉพาะคนที่ยังไม่จัดทั้งสองกะ|The available list only shows employees unassigned in both shifts
รายชื่อบนเครื่องแยกตามกะ|Machine assignments are separated by shift
รายการเดิมที่ยังไม่ระบุกะแสดงในกะเช้า|Legacy assignments without a shift appear in the day shift
พนักงานไม่ได้ประจำเครื่องต้นทางแล้ว กรุณาโหลดข้อมูลล่าสุด|The employee is no longer assigned to the source machine. Reload the latest data.
กะเปลี่ยนระหว่างลาก กรุณาเลือกพนักงานใหม่|The shift changed during the drag. Select the employee again.
ย้ายออกจากเครื่องเดิมและเพิ่มที่เครื่องปลายทางในครั้งเดียว|Remove from the source and assign to the destination in one action
เครื่องอื่นที่พนักงานดูแลยังคงอยู่|Other machine assignments remain unchanged
ตามรายชื่อหลัก|Based on the employee roster
ลบรายการประจำเครื่องของพนักงานที่ถูกลบแล้ว|Remove assignments for deleted employees
สลับผู้รับผิดชอบ|Swap assignees
ย้ายตำแหน่ง|Move assignment
สลับตำแหน่งและบันทึก|Swap assignments and save
ย้ายตำแหน่งและบันทึก|Move assignment and save
ว่าง|Available
ฝั่งละ|Per side
คนต่อกะ|People per shift
เพื่อดูเฉพาะพื้นที่แผนก|to view only the selected section
เพื่อแสดงพนักงาน|to show employees
เพื่อแสดงพื้นที่ของแผนก|to show the section area
ยังไม่มีผังสำหรับ|No layout available for
ยังไม่มีภาพผัง กรุณาอัปโหลดผังของ|No layout image; upload a layout for
แผนกนี้ยังไม่มีผัง กรุณาอัปโหลดผังแผนกก่อน|This section has no layout. Upload a section layout first.
อัปโหลด|Upload
ไม่พบข้อมูลยืนยันเวอร์ชันฐานข้อมูล|Database version confirmation not found
ไม่พบตำแหน่งบัญชีผู้ใช้|User account record not found
เชื่อมต่อฐานข้อมูลบัญชีผู้ใช้หมดเวลา กรุณาลองอีกครั้ง|User database connection timed out. Please try again.
ข้อมูลกะเป็นปัจจุบันแล้ว|Shift data is up to date
รับข้อมูลกะไม่ครบ กรุณากดบันทึกอีกครั้ง|Incomplete shift data received. Please save again.
ไม่พบหน้าต่างจัดกะ|Shift planning window not found
ยังไม่ได้เลือกพนักงาน|No employee selected
ยังไม่เลือกพนักงาน|No employee selected
เหตุการณ์ทั้งหมด|All incidents
ระบบพบข้อผิดพลาด|An error occurred
หน้าปัจจุบันยังใช้งานได้ กรุณาลองอีกครั้ง|You can still use this page. Please try again.
ระบบพบข้อผิดพลาด แต่ยังใช้งานหน้าปัจจุบันได้|An error occurred, but you can still use this page
ไม่สามารถโหลดระบบสร้าง|Unable to load the generator
ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่|. Connect to the internet and try again.
โหลดรูปไม่สำเร็จ|Failed to load photo
โหลดรายชื่อไม่สำเร็จ|Failed to load employee roster
กำลังโหลดรายชื่อ|Loading employee roster
ไม่สามารถเปิดหน้าแก้ไขได้ กรุณารีเฟรชหน้าเว็บแล้วลองอีกครั้ง|Unable to open the editor. Refresh the page and try again.
อัตโนมัติ|Automatic
ล่าสุด|Latest
พร้อม|Ready
รอ|Waiting
ไม่พร้อม|Not ready
ไม่เกิน|No more than
อย่างน้อย|At least
สูงสุด|Maximum
ต่ำกว่า|Below
มากกว่า|More than
เกิน|Over
เท่านั้น|Only
ครบ|Complete
เดิม|Original
ตาม|According to
ก่อน|Before
หลัง|After
ตั้งแต่|From
ถึง|To
เช่น|For example
ตัวอย่าง|Example
โดยตรง|Directly
ทุกคน|Everyone
ทุก|Every
เฉพาะ|Only
ด้วยรหัส|Using ID
ของตนเอง|Own
ของตน|Own
ครั้งละ|At a time
กำหนด|Configure
ไม่พบ|Not found
ไม่มี|None
ยังไม่มี|Not available yet
ยังไม่กำหนด|Not assigned
เหลือ|Remaining
หรือไม่|?
หรือ|or
และ|and
แล้ว|Already
กรุณา|Please
ดู|View
อ่าน|Read
แสดง|Show
เริ่ม|Start
จบ|End
แบบฟอร์ม|Form
ชื่อตำแหน่งใหม่ใน|New position name in
แก้ไขได้ที่|Edit in
ไม่พบรายงานสำหรับดาวน์โหลด Excel|No Excel report available
ดาวน์โหลด Excel แล้ว|Excel downloaded
คนนี้ยังไม่ได้กำหนด|This employee has not been assigned
กรุณาให้|Ask
อีกครั้ง|again
ตามคู่มือ|According to the guide
กรุณากรอก|Please enter
กรุณาระบุ|Please specify
กรุณาเลือก|Please select
เพื่อยืนยัน|to confirm
สำหรับจัดกะ|For shift planning
ผู้บันทึก|Recorded by
วันถึง|Days until
จำนวนครั้ง|Number of occurrences
จำนวนคนที่มีเวลา|Employees with check-in records
บันทึกสะสมตามรหัสพนักงาน|Records accumulated by employee ID
บันทึกสะสมถาวรตามรหัสพนักงาน|Permanent records accumulated by employee ID
เลือกพนักงานเพื่อดูประวัติย้อนหลัง|Select an employee to view history
เลือกพนักงานเพื่อดูประวัติย้อนหลังหรือบันทึก|Select an employee to view history or record
อยู่ด้านล่างการ์ดพนักงาน|Below the employee card
เลือกรายบุคคลเพื่อบันทึก|Select an individual employee to record
หรือดูประวัติย้อนหลัง|or view history
ใบ|Cards
แผน|Plan
เครื่องมือ|Tools
งาน|Work
ข้อมูลกลาง|Shared data
พร้อมใช้งาน|Ready to use
ไม่ยืนยันการบันทึก|Save not confirmed
ไม่ส่งข้อมูลยืนยันเวอร์ชัน|No version confirmation returned
มีการแก้รายชื่อพร้อมกัน|The roster was updated concurrently
ยังไม่ยืนยันการลบ|Deletion not confirmed yet
พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่|Employee deleted. Reload the roster.
ยังไม่ยืนยันรายชื่อใหม่|New roster not confirmed yet
ข้อมูลยืนยันผลสอบไม่ตรงกัน|Exam result confirmation does not match
ยังไม่ยืนยันผลสอบที่ส่ง|Submitted exam results not confirmed yet
เก็บผลสอบไว้และจะส่งซ้ำอัตโนมัติ|Exam results saved; submission will retry automatically
ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต|Failed. Check your internet connection.
ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่|Failed. Check your internet connection and try again.
ไม่พบรายงาน|Report not found
อ้างอิงกะที่จัดในระบบ|Based on the assigned system shift
ภาพ|Image
ถาวร|Permanent
รองรับ|Supported
ขนาดไม่เกิน|Maximum size
ไฟล์ต้องไม่เกิน|Maximum file size
รองรับไม่เกิน|Maximum supported
แถวต่อไฟล์|rows per file
แสดงพนักงานประจำเครื่องและ|Show machine assignments and
เลือกระดับซูมและเลื่อนดูพื้นที่โรงงาน|Choose zoom level and pan around the factory
ล่าสุด|Latest
จัดซื้อ|Purchasing
การตลาด|Marketing
โรง|Plant
การผูกเครื่อง|Device binding
ล้างข้อมูลแล้ว จึงไม่นำเข้าซ้ำ|Data was cleared; record will not be imported again
กำลังใช้งาน|In use
ตามเวลาตัดของแต่ละกะ|Based on each shift's cutoff time
กู้คืน|Restore
กู้|Recover
รอวันทำงาน|Awaiting workday
เครื่องหมาย|Legend
แบบรวม|Combined
รวมทั้งหมด|Grand total
เพื่อ|to
ที่เลือก|selected
ในช่วงที่เลือก|Within the selected period
นับวันละ|Count per day
รอตรวจข้อมูลล่าสุดก่อนนับวันผ่าน|Awaiting review of latest data before counting a successful day
วิธีตรวจ|Inspection method
วิธีกักงาน|Containment method
ประจำพื้นที่|Assigned area
ตามบทบาท|By role
การตั้งเครื่อง|Machine setup
งานปั๊ม|Stamping
งานเชื่อม|Welding
งานแม่พิมพ์|Tooling
การตรวจเกลียว|Thread inspection
จุดตรวจรายวัน|Daily checkpoints
มาตรฐาน|Standard
การควบคุม|Control
กำลังดึงข้อมูล|Fetching data
กำลังดึง|Fetching
โหลด|Load
อัปเดตข้อมูล|Refresh data
หัก|Deduct
หัวข้อเรียบร้อย|topics completed
เช็ค|Check
สอบ|Take exam
หัวหน้าทีม|Team leader
วันที่รอตรวจยังไม่นับเป็นวันผ่าน|Pending-review days do not count as successful days
กำลังเตรียมสรุป|Preparing summary
เก็บในเครื่องและจะซิงก์|Saved locally and will sync
ไม่ทราบชนิด|Unknown type
ส่วนข้อมูลความรับผิดชอบจะแสดงเมื่อเลือก|Responsibility details are shown when selecting
เขียว|Green
เหลือง|Yellow
แดง|Red
โหมด|Mode
ตัวกรอง|Filters
ชื่อผัง|Layout name
แทนภาพ|Replace image
พื้นที่ใน|Area in
ลิงก์เอกสารต้องเป็น|Document link must be
เก็บถาวรเพื่อวิเคราะห์และปรับปรุง|Kept permanently for analysis and improvement
ไม่สามารถกลับเข้ามาทำต่อหรือส่งข้อสอบชุดนี้ซ้ำได้|This exam cannot be resumed or submitted again
วันหยุดและช่วงทดลอง|Holidays and trial periods
รายการล่วงหน้ายังไม่หักคะแนน|Future records are not deducted yet
สรุป|Summary
กำลังเตรียม|Preparing
ข้อมูลเช็คชื่อ|Attendance data
ไม่สำเร็จ จึงยังไม่อนุญาตให้เช็คชื่อ|Failed; check-in is not permitted yet
บันทึกเวลาไว้ในเครื่องแล้ว แต่|Check-in time saved locally, but
ไม่ถูกนับเป็นขาดงาน|Not counted as absent
บันทึกเป็นมาสาย|Recorded as late
บันทึกเข้า|Save to
ก่อนวันเริ่มงาน|Before employment start date
ก่อนวันเริ่ม|Before start date
ยังไม่มีข้อมูลสรุป|No summary data yet
เครื่องนี้ถูกลบแล้ว|This machine has been deleted
กำลังเตรียมหน้าพิมพ์|Preparing print view
เตรียมหน้าพิมพ์ไม่สำเร็จ|Failed to prepare print view
อ่านรูปไม่ได้|Cannot read image
เวอร์ชันล่าสุด|Latest version
กรุณารีเฟรชหน้าเว็บ|Please refresh the page
เบราว์เซอร์นี้ไม่รองรับ|This browser does not support
กลุ่ม Sorting|Sorting group
ส่งแจ้งเตือนไปยัง|Send notification to
แจ้ง|Notify
กลางคืน|Night
กลางวัน|Day
เช้า|Day
ดึก|Night
การบันทึกและลบ|Saving and deletion
บันทึกรูปเข้าระบบ|Save photo to the system
ไม่กรอก|Leave blank
ประจำ|Assigned
ใช้ค่าเดิม|Keep current value
ใช้กะทีม|Use team shift
ล้างตัวกรอง|Clear filters
เลือกพนักงานเพื่อดู|Select an employee to view
สแกนซ้ำในไฟล์|Duplicate scan in file
ใช้เวลาแรก|Use earliest time
เวลาสแกนไม่ถูกต้องหรืออยู่ในอนาคต|Scan time is invalid or in the future
รับเฉพาะบันทึกเวลา ไม่เก็บภาพหรือลายนิ้วมือในเว็บนี้|Only attendance records are received; this website does not store face images or fingerprints
ตรวจสอบข้อมูลกลางแล้ว|Shared data checked
มีเวลาเช็คชื่ออยู่ในเครื่อง|A check-in time is saved on this device
แต่ตรวจสอบข้อมูลกลางไม่สำเร็จ|but shared data could not be verified
ยังไม่ได้รับการยืนยันจากข้อมูลกลาง|Confirmation from shared data has not been received
บันทึกในเครื่องแล้ว แต่ส่งขึ้นเว็บไม่สำเร็จ|Saved locally but submission to the website failed
บันทึกสะสมถาวรตามรหัสพนักงาน|Permanent records accumulated by employee ID
ทุกเครื่องใช้ชุดเดียวกัน|All devices use the same exam set
หัวข้อที่ระดับต่ำสุดก่อน|Lowest-level topics first
คะแนนรวม|Total score
กำลังบันทึกและตรวจสอบ|Saving and verifying
รอรายการ|Awaiting records
ไม่สามารถหาตำแหน่ง|Unable to determine location
ใช้เวลานานเกินไป กรุณาลองใหม่|Request took too long. Please try again.
ใช้เวลานานเกินไป กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่|Request took too long. Check your connection and try again.
โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วเปิดหน้านี้ใหม่|Map failed to load. Check your connection and reopen this page.
กดโหลดข้อมูลล่าสุดเพื่อลองใหม่|Reload the latest data to try again
แผนกของผังเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด|The layout section changed. Reload the latest data.
เป็นข้อมูลหลักทุกเครื่อง รวมแผนกะ|is the source of truth for all devices, including shift plans
สำเร็จ และแสดงในระบบแล้ว|saved and now shown in the system
รายการนี้หรือไม่|this record?
รายการหรือไม่|records?
ไปเครื่องอื่น|to another machine
ลากเพื่อย้าย|Drag to move
ซูมดูภาพรวมโรงงาน หรือเลือก|Zoom to the factory overview or select
เพื่อดูเครื่องจักรและลากย้ายพนักงาน|to view machines and drag employee assignments
เพื่อเปิดเฉพาะผัง เครื่องจักร และพนักงานในแผนกนั้น|to show only the selected section's layout, machines, and employees
ย้ายได้เฉพาะเครื่องใน|Can move only to machines in
เดียวกับพนักงาน|the employee's section
กรุณาระบุชื่อ|Enter name
ไม่สามารถบันทึก|Unable to save
ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาเชื่อมต่อแล้วบันทึกอีกครั้ง|Database not connected. Connect and save again.
บันทึกประวัติทุกหัวข้อที่เปลี่ยนแปลง พร้อมซิงก์|Save history for all changed topics and sync
ตอบกลับไม่ถูกต้อง กรุณาตรวจสอบ|Invalid response. Please check
ตอบกลับไม่ถูกต้อง กรุณา|Invalid response. Please
จำนวนรูป|Number of photos
เลือกพนักงานเพื่อดูประวัติย้อนหลัง|Select an employee to view history
เริ่มนับ|Start counting
ใช้เวลานานเกิน|Request took longer than
ตามรายชื่อหลัก|Based on the employee roster
ยกเลิกพนักงานใน|Unassign employees in
หน้านี้รองรับการเช็คชื่อเข้าเท่านั้น|This page supports check-in only
เลือกเครื่องที่จะให้|Select the machine to assign
ตรวจข้อเขียนและอนุมัติ|Review written answers and approve
กรุณาโหลดหน้าใหม่เพื่อใช้ระบบส่งข้อสอบล่าสุด|Reload the page to use the latest examination submission system
ด้านบน|above
ด้านล่าง|below
ก่อนย้ายตำแหน่ง|before moving assignments
ไม่ตรงกับวันที่ผลิต|Does not match production date
วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด|The start date must not be later than the end date
ตั้งแต่วันนี้|From today
ทำงาน • กะดึก|Working • Night shift
รอเข้ากะวันถัดไป • กะดึก|Awaiting tomorrow's night shift
รอเช็คชื่อวันถัดไป|Awaiting tomorrow's check-in
ไม่พบสิทธิ์ Leader|Leader permission not found
ยังไม่กำหนดทีม|Team not assigned
ปกติ|Normal
สอบได้|Eligible to take exam
วิธีดำเนินการ|Procedure
บรรทัดต่อ|Lines per
รออนุมัติ|Pending approval
คลิกเพื่อตั้งค่า|Click to configure
คลิกเพื่อปรับระดับ|Click to change level
ปัจจุบันทุกหัวข้อ|Current values for all topics
ไป|to
พบ|Found
นี้มีอยู่แล้ว|already exists
ไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน|Invalid credentials or account disabled
ไม่มีรายการ|No records
ก่อนเริ่มงาน|Before starting work
ประวัติผลสอบ|Exam result history
ติดต่อ|Contact
กด|Click
ต้องมีอย่างน้อย|Must have at least
เช็คชื่อรวม|Total check-ins
กติกา|Rules
เดิมตามตำแหน่ง|Original position-based values
ระบบเลือกหัวข้อ|The system selects topics
และเกณฑ์|and requirements
ถ้ามี|if available
สี|Color
ข้อมูลกะบน|Shift data on
ชื่อตำแหน่ง|Position name
โรงงานที่เลือก|Selected factory
เพื่อกำหนดหรือย้ายพนักงานประจำเครื่อง|to assign or move machine operators
ใช้เมื่อ|Used when
แสดงพนักงานประจำเครื่องและ|Show assigned employees and
ยังคำนวณ|Not calculated yet
รูปแบบไฟล์|File format
เลือกวันนี้ ล่วงหน้าไม่เกิน|Select today or a future date within
วัน หรือย้อนหลังไม่เกิน|days, or a past date within
ลาป่วยเลือกวันนี้หรือย้อนหลังได้ ไม่บังคับแนบใบรับรองตอนแจ้ง|Sick leave may be requested for today or a past date. A medical certificate is not required at submission.
กรอกรหัสพนักงาน ระบบจะเลือกกะและเวลาเช็คชื่อให้ตามที่กำหนดไว้สำหรับพนักงานคนนั้น|Enter your employee ID. The system will select your assigned shift and check-in window.
กรอกรหัสพนักงานก่อน ระบบจะเลือกกะและเวลาให้อัตโนมัติ|Enter your employee ID first; your shift and check-in window will be selected automatically.
ไม่ยืนยันการบันทึก|Save not confirmed
ต้องระบุสาเหตุ จึงจะบันทึกได้|A reason is required before saving
บันทึกแผนกะ|Save shift plan
วัน เริ่มวันจันทร์และจบวันอาทิตย์|days, starting on Monday and ending on Sunday
อัปโหลดผังแยกแผนก|Upload layouts by section
ลบแผนแจ้งเตือนนี้หรือไม่|Delete this notification schedule?
โหลดรายชื่อจาก|Load employee roster from
พบพนักงาน|Employees found
ไม่พบรหัสพนักงานนี้ใน|Employee ID not found in
ดูตัวอย่างไฟสถานะ|Preview status indicators
ปิดตัวอย่าง|Close preview
โหมดตัวอย่างเท่านั้น|Preview mode only
ไม่แก้ผลสอบหรือข้อมูลจริง|Exam results and actual data are not changed
ทดสอบเช็คชื่อ|Test check-in
เครื่องเดิม|Original device
เครื่องเสีย|Device failure
อินเทอร์เน็ตกลับมาแล้ว|Internet connection restored
กำลังซิงก์ข้อมูลที่ค้าง|Syncing pending data
เมื่อพร้อมให้กด|When ready, click
ยังไม่เริ่มประเมิน|Assessment has not started
ไม่สามารถลบ|Unable to delete
บันทึกผล|Save result
อนุมัติผล|Approve result
พื้นที่นี้แสดง|This area shows
ตั้งค่าการแจ้งเตือน|Notification settings
งานเสีย|Defects
ตรวจ|Review
ล้างประวัติ|Clear history
เริ่มใช้งาน|Start using
แนวนอน|Landscape
แนวตั้ง|Portrait
อัพสกิล|Skill upgrade
ฝึกอบรม|Training
การอบรม|Training
การสอบ|Examination
ตามรอบ|By cycle
ระบุ|Specify
สรุปกำลังคน|Staffing summary
ยังไม่ยืนยันการลงทะเบียนเครื่อง|Device registration not confirmed
กรุณากดเช็คชื่อใหม่|Please check in again
บันทึกเวลา|Record time
ตรวจสอบสิทธิ์เครื่องไม่ได้ กรุณาลองอีกครั้ง|Unable to verify device permissions. Please try again.
เฉพาะกรณีเปลี่ยนโทรศัพท์|Only when changing phones
ยังไม่มีเครื่องที่ลงทะเบียน|No registered devices yet
รหัส ชื่อ|ID or name
เก็บรายการ|Keep record
เครื่องหลัก|Primary device
ข้อมูลเครื่อง|Device details
วันทำงาน|Workday
แก้|Edit
กดบันทึก|Click Save
แจ้งได้เฉพาะวันนี้และต้องไม่เกิน|Only today's notice is allowed, no later than
ต้องแจ้งไม่เกิน|Must notify no later than
เวลาแจ้งสายล่วงหน้าต้องมาก่อนเวลาบังคับเหตุผลสาย|The advance notice deadline must be before the time when a late reason becomes mandatory
ไม่พร้อม กรุณาลองอีกครั้ง|Not ready. Please try again.
ไม่ยืนยันข้อมูล|Data not confirmed
ผู้จัดการ|Manager
หัวหน้างาน|Supervisor
หัวหน้าทีม|Leader
ช่างเทคนิค|Technician
วิศวกร|Engineer
พนักงานปฏิบัติการ|Operator
หน้าพิมพ์|Print view
ส่งผลสอบ|Submit exam results
หลักเท่านั้นที่จัดการ|Only the primary account can manage
หลัก|Primary
ถูกล็อกไว้กับเครื่องเจ้าของแล้ว เครื่องนี้ไม่มีสิทธิ์เข้าใช้งาน|Locked to the owner's device. This device is not authorized.
กำลังแสดง|Showing
กำลังโหลดหน้า|Loading page
กลับมา|Return
ลงทะเบียน|Register
ยังเชื่อมต่อ|Connected to
ยังเชื่อม|Connected to
บันทึกข้อมูลเรียบร้อย|Data saved successfully
ไม่ตรง|Does not match
ข้อความแจ้งเตือน|Notification message
ทักษะ|Skills
เครื่องหมายคำพูด|Quotation marks
เครื่องหมายคำพูดปิดไม่ครบ|Unclosed quotation marks
ไม่ถูกต้องหลังเครื่องหมายคำพูด|Invalid content after quotation marks
ต้องมีหัวคอลัมน์และข้อมูลอย่างน้อย|Column headers and at least one data row are required
กรุณาใส่ชื่อหัวคอลัมน์ให้ครบ|Enter all column headers
พร้อมนำเข้า|Ready to import
ใช้กะจากเครื่องนี้เป็น|Use shifts from this device as
บันทึกในเครื่อง|Saved locally
ไม่ลบ|Do not delete
ไม่เปลี่ยน|Do not change
แยก|Separate
อ้างอิง|Reference
ใบเหลืองรอบปัจจุบัน|Yellow cards in the current cycle
รอตรวจล่าสุด|Latest review pending
การผลิตไม่ได้|Production has not
หน้าเครื่องและทุกเครื่องถึงเกณฑ์|Machine records and all machines achieved target
ไม่พบข้อมูลยืนยัน|Confirmation data not found
เต็ม|Maximum
ไม่เกิน|No more than
กรุณาเลือกอย่างน้อย 1 หัวข้อ|Select at least one topic
ระดับ Skill ยังไม่มีการเปลี่ยนแปลง|Skill levels have not changed
อัปเดต Skill|Update skill levels
คำอธิบาย|Description
ยังไม่ตั้งค่า|Not configured
กรุณาพิมพ์|Please enter
ชื่อผู้ประเมิน|Evaluator name
เพื่อดู|to view
รหัสเครื่องใช้ตัวอักษรอังกฤษ ตัวเลข ขีดกลาง หรือขีดล่าง|Device ID may contain English letters, digits, hyphens, or underscores
ไม่พบข้อมูลพนักงานสำหรับอัปเดต|Employee to update was not found
หัวข้อที่เลือก|Selected topics
สิ้นสุดแล้ว|Finished
เสร็จแล้ว|Completed
ข้อมูลไม่ครบ|Incomplete data
ปรับบรรจุ|Permanent employment
หน้างาน|Shop floor
กำลังโหลดรูปจาก|Loading photo from
เลือกรูปจาก|Choose photo from
เปิดรูปในโฟลเดอร์ Drive|Open photos in Drive folder
ลิงก์รูปจาก Google Drive|Google Drive photo link
เปิดโฟลเดอร์รูปพนักงานใน Google Drive|Open employee photo folder in Google Drive
พิมพ์ยืนยันในขั้นตอนถัดไปเพื่อดำเนินการ|Type the confirmation in the next step to continue
เพื่อป้องกันการลบผิด กรุณาพิมพ์|To avoid accidental deletion, type
เพื่อยืนยันการล้างข้อมูลช่วงทดลอง|to confirm clearing trial-period data
ระบบจะเก็บเวลาในเครื่องและส่งซ้ำอัตโนมัติ|The time will be saved locally and resent automatically
เปลี่ยนรหัสพนักงาน|Change employee ID
จำนวนพนักงาน|Employee count
คะแนนเฉลี่ย|Average score
การบันทึก|Saving
ลบรายการ|Delete record
ไม่พบข้อมูลไฟล์|File data not found
ไฟล์ไม่มีข้อมูล|Empty file
ไม่สามารถอ่าน|Unable to read
ผิดพลาด|Error
ถูกต้อง|Valid
ออก|Out
เข้า|In
ครบทุกหัวข้อ|All topics completed
ตั้งค่า Organization|Organization settings
กำหนดทั้ง|Assign all
รายงาน|Report
โหลดผล|Load results
ถาวรแล้ว|permanently
ไม่อนุญาต|Not allowed
ตั้งกะจากเครื่องนี้เป็น|Set shifts from this device as
วันเริ่มรอบ|Cycle start date
ครอบคลุมถึง|Covers through
กะที่กำลังแสดงด้านบน|Shift shown at the top
คนในกะปัจจุบัน|Employees in the current shift
จัดกะตามแผน|Based on the shift plan
แสดงด้านบน|Shown at the top
ระบบสลับกลุ่มด้านบนอัตโนมัติ|The group at the top switches automatically
ช่วง|Period
ก่อนวันเริ่ม|Before start date
ก่อนวันเริ่มงาน|Before employment start date
แจ้งเข้าสายล่วงหน้า ต้องแจ้งไม่เกิน|Advance lateness notice must be submitted by
ลากิจล่วงหน้าได้สูงสุด|Maximum advance personal leave
ลากิจล่วงหน้าได้ไม่เกิน|Advance personal leave is allowed up to
ลากิจย้อนหลังได้ไม่เกิน|Retrospective personal leave is allowed up to
ลากิจย้อนหลังไม่เกิน|Retrospective personal leave within
ลาป่วยย้อนหลังไม่เกิน|Retrospective sick leave within
แจ้งลาป่วยก่อนได้ แล้วแนบภายใน|You may report sick leave first and attach the certificate within
วันจากวันที่ลา|days from the leave date
รายการนี้ระบุว่ามีใบรับรองแพทย์ แต่ไม่พบข้อมูลไฟล์ กรุณาให้พนักงานแนบไฟล์ใหม่|This record indicates a medical certificate but the file is missing. Ask the employee to attach it again.
ใบรับรองแพทย์ต้องมีขนาดไม่เกิน|Medical certificate maximum file size
รองรับเฉพาะไฟล์รูปภาพหรือ|Only image files or
รองรับไฟล์รูปจากมือถือ|Mobile photos supported
และรูปภาพทั่วไป|and common image formats
หน้านี้สำหรับ|This page is for
สำหรับ|For
ให้ถูกต้อง|correctly
ต้องมีรหัสเครื่องและรหัสรายการที่ไม่ซ้ำ|A device ID and a unique record ID are required
ประเภทบันทึกเวลาต้องเป็น|Attendance record type must be
เวลาสแกนต้องระบุวันที่ เวลา และเขตเวลา|Scan time must include date, time, and time zone
มีรายการลาในวันเดียวกัน|Leave is already recorded for this day
วันสแกนอยู่ก่อนวันที่เริ่มงาน|Scan date is before employment start date
รายการนี้เกิดก่อนเวลาล้างข้อมูลทดลอง จึงไม่กู้กลับอัตโนมัติ|This record predates the trial-data reset and will not be restored automatically
ให้เช็คชื่อใหม่เพื่อสร้างรายการหลังเวลาเริ่มใช้งาน|Check in again to create a record after the live start time
ใช้ข้อมูลกะเดิมจากเครื่องนี้เป็น|Use existing shifts on this device as
ข้อมูลกะบน Firebase จะถูกแทนที่ด้วยชุดนี้ และเครื่องอื่นจะตามชุดนี้|Firebase shift data will be replaced with this set and shared with other devices
ใช้รหัสพนักงานในเครื่องให้ตรงกับ|Use device employee IDs matching
ซ่อมและซิงก์|Repair and sync
จากผลสอบย้อนหลัง|From historical exam results
จากผลสอบ|From exam results
รายการแล้ว|records completed
ก่อนบันทึก|Before saving
การเพิ่ม แก้ไข และลบจะซิงก์ไปทุกเครื่องอัตโนมัติเมื่อเชื่อมต่อสำเร็จ|Employee additions, edits, and deletions sync automatically to all devices when connected
เป็นฐานข้อมูลหลักของรายชื่อพนักงาน|is the master employee database
ไม่เก็บรายชื่อพนักงานอีกแล้ว จึงอัปเดต|no longer stores employee records, so updates
ได้โดยไม่ทำให้รายชื่อเก่ากลับมา|will not restore old employee records
การนำเข้าจะอัปเดตข้อมูลในเครื่อง และเมื่อ|Import updates local data and, when
เชื่อมต่อจะซิงก์เป็นข้อมูลกลาง|connected, syncs to the shared database
ถูกแปลงเป็นค่า|is converted to
ก่อนบันทึก และบัญชีจะซิงก์ผ่าน|before saving, and accounts sync through
เพื่อใช้ได้ทุกเครื่อง|for use on all devices
เฉพาะเครื่องของ|Only the device of
หลักที่ผูกไว้เท่านั้นที่เพิ่มหรือลบ|bound primary account may add or delete
ยังไม่เปิดรับข้อมูลจริงจนกว่าจะเชื่อมบริการของเครื่องหรือโปรแกรมตัวกลางสำเร็จ|Live data will be received only after the device service or integration program is connected
บันทึกข้อมูลเครื่องไว้ก่อนได้|You can save device details in advance
ไม่แก้|Do not modify
เก็บรายการรอลบซ้ำ|Retry queued deletions
กฎกะในเครื่องก่อนโหลด|Local shift rules before loading
กลับหน้า|Back to
สิ้นสุด|End
พิมพ์แบบฟอร์ม|Print form
รายเดือน|Monthly
คุณสามารถดูและแก้ไขกะได้เฉพาะพนักงานใน|You can view and edit shifts only for employees in
เข้าสู่หน้าจัดกะ|Open shift planning
เปิดหน้าแก้ไขกะ|Open shift editor
ไม่พบสิทธิ์ Leader|Leader permission not found
กำหนดพื้นที่|Define area
จำนวนช่อง|Slot count
จุดเครื่อง|Machine point
ล้างตำแหน่ง|Clear assignments
ทั้งหมดเรียบร้อย|all completed
อัปโหลดรูป|Upload photo
รวมทั้ง|including
เต็มผัง|Fit layout
ตำแหน่งปัจจุบัน|Current location
ย้อนกลับ|Back
เลือกคำตอบ|Select answer
ทำข้อสอบ|Take examination
ยังไม่ส่ง|Not submitted
ยืนยันส่ง|Confirm submission
ปรับหลัง|Update after
มีชื่อ|Named
กู้เวลาเช็คชื่อ|Restore check-in time
รอรับข้อมูล|Awaiting data
กำลังเตรียมไฟล์|Preparing file
ลืมรหัสผ่าน|Forgot password
สลับกะ|Switch shift
ย้ายพนักงาน|Move employee
เพิ่มรายการ|Add record
ขยาย|Zoom in
ย่อ|Zoom out
เปลี่ยน|Change
ตรง|Matches
จำกัด|Limit
บัตร|Card
บังคับเหตุผลสาย|Require reason for lateness
ใช้เวลานาน|Taking longer than expected
ก่อนเข้า|before entering
ระบุชื่อ|Enter name
ครั้งต่อเดือน|times per month
เวลาสิ้นสุด|End time
เวลาเริ่ม|Start time
เลือกรายบุคคล|Select individual
เลือกทั้งหมด|Select all
กะเปลี่ยน|Shift changed
ลบทั้งเช็คชื่อ|Delete all check-ins
ไม่พบข้อมูลยืนยันเวอร์ชันฐานข้อมูล|Database version confirmation not found
ผิดสเปก|Out of specification
ใบแพทย์|Medical certificate
ไม่มีใบแพทย์|No medical certificate
ลาป่วยวันเดียวกันมีใบแพทย์|Same-day sick leave with a medical certificate
ลาป่วยวันเดียวกันมีใบรับรอง|Same-day sick leave with a medical certificate
และเกิน|and more than
วันยังไม่แนบ|days without an attachment
ขาดอัตโนมัติหลังปิดเช็คชื่อ|Automatically marked absent after check-in closes
เมื่อเช็คชื่อภายหลัง คิดคะแนนจากเวลาสายแทนขาดงาน|A later check-in replaces the absence deduction with a lateness deduction
ไม่สำเร็จ จึงยังไม่อนุญาตให้เช็คชื่อ|Failed; check-in is not allowed yet
ยังไม่เชื่อมต่อข้อมูลกลางได้|Unable to connect to shared data
ยังเชื่อมต่อข้อมูลกลางไม่ได้ กรุณาลองใหม่|Unable to connect to shared data. Please try again.
กรุณาโหลดข้อมูลล่าสุด|Reload the latest data
ยังไม่บันทึกจนกว่าจะกดยืนยัน|Not saved until confirmed
บันทึกเข้า Firebase|Saved to Firebase
ไม่ยืนยันการลบ|Deletion not confirmed
ก่อนปรับ|Before update
ไม่พบข้อมูลยืนยัน|Confirmation not found
ยังไม่ครบ|Incomplete
เงื่อนไข|Conditions
เต็มคะแนน|Maximum score
หลักฐานการอบรม|Training evidence
หน้าตา|Appearance
ประวัติการแก้ไข|Revision history
แก้ไขล่าสุด|Last updated
วันที่อัปเดต|Updated date
วันที่สอบ|Exam date
วันที่สแกน|Scan date
วันที่ประเมิน|Assessment date
ผู้รับผิดชอบ|Responsible person
แผนกนี้|This section
พนักงานคนนี้|This employee
ระบบจะล้าง|The system will clear
ระบบจะลบข้อมูล|The system will delete data
จริง|Live
ทดลอง|Trial
ได้|Available
ใน|in
ของ|of
ที่|at
เป็น|is
มี|has
นี้|this
ยัง|still
ให้|to
ต้อง|must
จะ|will
ใช้|use
ด้วย|with
จาก|from
ตาม|according to
เมื่อ|when
ไม่|not
ระบบ|System
สรุป KPI รายเดือน|Monthly KPI summary
คะแนนตามเกณฑ์|Score against requirement
ผลิต|Produce
แสดงผล|Display
อัปโหลดไฟล์|Upload file
เครื่องนี้|This device
ขึ้น|up
ลง|down
ต่อ|per
ตัว|items
สีสถานะ|Status color
ทุกเครื่อง|All devices
ทุกแผนก|All sections
เครื่องอื่น|Other devices
ในเครื่อง|Locally
บันทึกประวัติ|Save history
โดย|by
อาจ|may
สำหรับรายการ|For records
ด้าน|side
รอส่งข้อมูล|Awaiting submission
ถ้า|if
เพื่อดูรายละเอียด|to view details
ข้อมูลทั้งหมด|All data
ไม่พบไฟล์|File not found
ไม่สามารถ|Unable to
ไฟล์ตัวอย่าง|Sample file
คอลัมน์|Column
หัวคอลัมน์|Column header
พิมพ์รายงาน|Print report
รายชื่อ|Employee list
โครงสร้าง|Structure
ช่วย|Help
คืน|Return
ไม่มีรายการพร้อมนำเข้า|No records ready to import
เลือกคอลัมน์|Select column
กรอก|Enter
เครือข่าย|Network
เชื่อมต่อ|Connect
เหมือนกัน|Same
ใส่|Enter
เริ่มต้น|Initial
ล่วงหน้า|In advance
ย้อนหลัง|Retrospective
เข้าใช้งาน|Sign in
ระยะ|Distance
เวลารอ|Wait time
ข้อมูลสำรอง|Cached data
หมายเลข|Number
กดเลือก|Select
เครื่องเดิม|Original device
เพิ่มใหม่|Add new
ขอบเขตที่เลือก|Selected scope
เจ้าของ|Owner
หน้า|Page
รอบใหม่|New cycle
ปรับ|Adjust
ป้องกัน|Prevent
แนะนำ|Guide
กะใหม่|New shift
พร้อมใช้งาน|Ready
ไม่อนุญาตให้|Not permitted to
ในช่วงนี้|During this period
เต็มจำนวน|Full count
ต้องการ|Need
ตรวจสอบ|Check
ประเมิน|Assess
สิทธิ์สอบ|Exam eligibility
แจ้งลา|Request leave
ลบถาวร|Delete permanently
ไม่ให้|Prevent
ใกล้|Near
ระหว่าง|During
จำนวนบรรจุ|Packing quantity
เอกสาร|Document
คุณภาพ|Quality
กระบวนการ|Process
ความปลอดภัย|Safety
อบรม|Training
วิธี|Method
ค่ามาตรฐาน|Standard value
ความถี่|Frequency
ชิ้นงาน|Part
จัดทำ|Prepare
การตรวจ|Inspection
ความเสี่ยง|Risk
ตามมาตรฐาน|According to standards
สอบย้อนกลับ|Traceability
การปรับปรุง|Improvement
หน่วย|Unit
ขั้นตอน|Step
ก่อนเริ่ม|Before starting
หลังจบ|After finishing
สอนงาน|Coach
วิเคราะห์|Analyze
ปัญหา|Problem
แก้ปัญหา|Solve problem
ปรับปรุง|Improve
บันทึกการย้าย|Save move
ตำแหน่งนี้|This position
เดียวกัน|Same
จะยังอยู่|will remain
ข้อมูลรายบุคคล|Individual data
กรณี|Case
เลือกวันที่|Select date
เกณฑ์|Requirement
ไม่มีผล|No result
ฝั่ง|Side
ชื่อตำแหน่งใหม่ใน|New position name in
ไม่ลบข้อมูลพนักงาน|Employee records are not deleted
เดือนนี้|This month
ปีนี้|This year
วันนั้น|That day
ออกงาน|Check out
ผลสอบ|Exam result
ข้อมูลเครื่องสแกน|Scanner details
เอกสารล่าสุด|Latest document
หมายเลขเครื่อง|Machine number
พนักงานใหม่|New employee
กติกาเวลาคงที่|Fixed time rules
จำนวนวัน|Number of days
อัปเดตล่าสุด|Last updated
งานคงค้าง|Pending work
อุปกรณ์|Equipment
ค่าที่|Value at
ความชำนาญ|Proficiency
จำเป็น|Required
เต็มผังแผนก|Fit section layout
เพิ่ม/ลบพนักงาน|Add / remove employees
เปลี่ยนภาษา|Change language
ภาษา|Language
ไทย|Thai
อังกฤษ|English
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]}));
 Object.assign(dictionary,Object.fromEntries(`
รายการที่|Record
บันทึกไฟล์|Save file
ได้เฉพาะเครื่องของ|Only on the device of
หลักที่ผูกไว้|bound primary account
หลักได้|primary account
ฐานข้อมูลไม่ยืนยันบัญชี|The database has not confirmed the account
ฐานข้อมูลไม่ส่งข้อมูลยืนยันเวอร์ชัน กรุณาลองอีกครั้ง|Database version confirmation was not received. Please try again.
ฐานข้อมูลยังไม่ยืนยันบัญชีเดิมครบทุกบัญชี กรุณาลองอีกครั้ง|Not all existing accounts have been confirmed. Please try again.
ฐานข้อมูลยังไม่ยืนยันบัญชีใหม่ กรุณาลองอีกครั้ง|The new account has not been confirmed. Please try again.
เข้าสู่ระบบด้วย|Sign in using
ตัวอย่างไฟเหลืองกระพริบ|Flashing yellow indicator preview
ตัวอย่างไฟแดง|Red indicator preview
ตัวอย่างไฟเขียว|Green indicator preview
ยังไม่ถึงช่วงแจ้งเตือน|Notification period has not started
เหลืองกระพริบ|Flashing yellow
วันและยังไม่สอบ|days and exam not taken
และยังไม่สอบ|and exam not taken
สอบแล้วในไตรมาสนี้|Exam completed this quarter
ผ่านข้อสอบ คะแนน|Passed examination with score
ที่ระดับต่ำสุดก่อนและปรับอัตโนมัติครั้งละสูงสุด|starting with the lowest levels; maximum automatic changes per attempt
ปัจจุบันของพนักงาน|Employee's current values
สามารถกำหนด|Can set
ได้ครบทุกหัวข้อ เพื่อบันทึกสกิลที่พนักงานมีอยู่ก่อนเริ่มใช้ระบบ โดยไม่ต้องรอผลสอบ|for all topics to record existing skills before using the system, without waiting for exam results
เลือกขั้นตอนมาตรฐานที่ถูกต้อง|Select the correct standard procedure
เลือกวิธีปฏิบัติที่ควบคุมความเสี่ยงได้ครบถ้วน|Select the method that fully controls the risks
เลือกการตอบสนองที่แก้ปัญหาโดยไม่สร้างความเสี่ยงเพิ่ม|Select a response that resolves the issue without creating additional risks
เลือกแผนควบคุมที่มีหลักฐานและยืนยันประสิทธิผล|Select a control plan supported by evidence and verified effectiveness
เลือกแนวทางเชิงระบบที่ป้องกันการเกิดซ้ำและถ่ายทอดได้|Select a systematic approach that prevents recurrence and can be taught to others
ก่อนเริ่มกะพบข้อมูลในเอกสารกับสภาพหน้างานไม่ตรงกัน|Before the shift, the documented information does not match shop-floor conditions
ระหว่างผลิตพบแนวโน้มค่าตรวจวัดเคลื่อนเข้าใกล้ขีดจำกัด|Measurements are trending toward the specification limit during production
หลังเปลี่ยนรุ่นผลิตพบความผิดปกติเล็กน้อยแต่ยังไม่เกินสเปก|A minor abnormality is found after a model change, while measurements remain within specification
พนักงานกะก่อนบันทึกข้อมูลไม่ครบและมีงานคงค้าง|The previous shift left incomplete records and unfinished work
เกิดปัญหาซ้ำหลังแก้ไขเฉพาะหน้าไปแล้วหนึ่งครั้ง|The problem recurred after a temporary correction
เครื่องมือหรืออุปกรณ์สำคัญมีสถานะไม่ชัดเจน|The status of an important tool or equipment is unclear
พบชิ้นงานต้องสงสัยปะปนกับงานที่ระบุว่า|Suspect parts are mixed with parts identified as
มีการเปลี่ยนพารามิเตอร์โดยไม่มีหลักฐานการอนุมัติ|Parameters were changed without approval evidence
ผลตรวจจากสองผู้ประเมินไม่สอดคล้องกัน|Inspection results from two evaluators are inconsistent
การผลิตเร่งด่วนทำให้ทีมเสนอข้ามขั้นตอนตรวจยืนยัน|An urgent production request leads the team to propose skipping verification
หยุดงาน กักกัน ตรวจตามมาตรฐาน และบันทึกผล|Stop work, contain the material, inspect to the standard, and record results
เดินงานต่อแบบช้าลง แล้วค่อยบันทึกภายหลัง|Continue at a slower speed and record the results later
ปรับค่าตามประสบการณ์ และตรวจเฉพาะชิ้นท้าย|Adjust using experience and inspect only the final part
แยกเฉพาะชิ้นเสีย แล้วปล่อยงานที่เหลือต่อ|Separate only defective parts and release the rest
ข้อใดเป็นแนวทางที่เหมาะสมที่สุดสำหรับ|Which is the most appropriate approach for
เมื่อต้องตัดสินใจจากสถานการณ์|When making a decision in this situation
ข้อใดถูกต้องที่สุด|Which answer is most appropriate?
หากต้องยืนยันความสามารถระดับ|When demonstrating proficiency at level
ในสถานการณ์|in the situation
ควรดำเนินการอย่างไร|what should you do?
ข้อใดแสดงการควบคุมงานในหัวข้อ|Which action demonstrates control of the topic
ได้สอดคล้องกับระดับ|consistent with level
มากที่สุด เมื่อ|most effectively when
กรุณาทำตามไฟล์|Follow the instructions in the file
และสิทธิ์|and permissions
โดยไม่ต้องใช้|without using
พื้นที่จัดเก็บของเบราว์เซอร์เต็ม กรุณาดาวน์โหลด|Browser storage is full. Please download
แล้วลดขนาด|and reduce the size
ยังไม่พร้อม ข้อมูลเก็บไว้ในเครื่องและรอส่งซ้ำ|Not ready. Data is saved locally and awaiting retry.
ยังยืนยันชุดข้อสอบไม่ครบ|Not all exam sets are confirmed
อ่านกลับมาแล้วแต่เนื้อหายังไม่ตรงกับที่แก้ไข|Read-back content does not match the edited content
บันทึกข้อสอบลง|Save exam to
และตรวจยืนยันแล้ว|and verified
ยังไม่พร้อม การคืนค่าเก็บคิวไว้ในเครื่อง|Not ready. Restore request is queued locally.
ยังไม่ยืนยันการคืนค่าเริ่มต้น|Default restoration has not been confirmed
คืนข้อสอบเป็นค่าเริ่มต้นบน|Restore default exam on
ยังไม่สามารถเชื่อมต่อ|Unable to connect yet
ในคลังสำรอง|in the backup archive
รายการเดิมเกิดก่อนเวลาที่|The original record predates
กรุณาเช็คชื่อใหม่|Please check in again
รายการเดิมถูก|The original record was
ลบแล้ว กรุณาเช็คชื่อใหม่เพื่อสร้างเวลาใหม่|deleted. Check in again to record a new time.
รายการเดิม|Original record
ไม่รับข้อมูล|Data not received
ยังไม่ยืนยันเวลาเช็คชื่อจากช่องทางใดเลย|Check-in time has not been confirmed through any channel
ช่องทาง|Channel
กู้เวลาเช็คชื่อจากเครื่องและส่ง|Recover local check-in time and send
อัตโนมัติแล้ว|automatically completed
กู้เวลาเช็คชื่อจากเครื่องพนักงานและยืนยัน|Recover check-in time from employee device and confirm
กรุณาโหลดหน้าใหม่เพื่อใช้ระบบบันทึกพนักงานล่าสุด|Reload the page to use the latest employee save function
บันทึกพนักงานและอัปเดตรายชื่อจาก|Save employee and update roster from
กรุณาโหลดหน้าใหม่เพื่อใช้ระบบลบพนักงานล่าสุด|Reload the page to use the latest employee removal function
ลบพนักงานจาก|Remove employee from
รับข้อมูลล่าสุดจาก|Get latest data from
ข้อมูลทุกเครื่องเป็นปัจจุบัน|All devices are up to date
กำลังซิงก์แบบรักษาข้อมูลเดิม|Syncing while retaining existing data
แผนกะ ซิงก์ครบแล้ว|Shift plans fully synced
เก็บข้อมูลไว้ในเครื่องแล้ว|Data saved locally
เชื่อมต่อกลับมาแล้ว|Connection restored
ซิงก์ข้อมูลที่ค้างรวมแผนกะเรียบร้อย|Pending data and shift plans synced
ยังมีข้อมูลรอซิงก์|Some data is still awaiting sync
ใช้งานเฉพาะข้อมูลในเครื่องนี้|Using local data only
กำลังโหลดข้อมูลกลางจาก|Loading shared data from
แสดงข้อมูลสำรองในเครื่อง|Showing locally cached data
ไม่บังคับ|Optional
ทุกวันอาทิตย์เป็นวันหยุดอัตโนมัติ|Every Sunday is automatically a holiday
ไม่ต้องเพิ่มเอง และจะไม่ถูกตัดขาดงาน|No manual entry is needed; no absence deduction applies
วันที่หยุด|Holiday date
ชื่อวันหยุด|Holiday name
วันหยุดนักขัตฤกษ์|Public holiday
ยังไม่ได้กำหนดวันหยุด|No holidays configured
แสดงกะของ|Show shift for
วันถัดไป|Next day
รอเข้ากะวันถัดไป|Awaiting next day's shift
คลิกเพื่อดูข้อมูลและประวัติ|Click to view details and history
กรุณาออกจากระบบแล้วเข้าสู่ระบบด้วยรหัสพนักงาน|Sign out and sign in using the employee ID
หรือตั้งกะให้ทุกแผนกได้|or assign shifts to all sections
แก้ไขข้อมูลพนักงานก่อน|Edit employee information first
แก้ไขข้อมูลและรูปภาพ|Edit information and photo
เป็นโครงสร้างประจำ|Fixed organization structure
จึงไม่ย้ายตาม|does not move with
กะถัดไป|Next shift
อีกกะ|Other shift
ไม่มีพนักงานในกะนี้|No employees in this shift
รอบอัตโนมัติ|automatic cycles
ทดแทนพนักงานขาด|Replace absent employees
คลิกเพื่อแก้ไขพนักงานประจำเครื่อง|Click to edit machine assignments
ต่อกะ|Per shift
รวมพนักงาน|Total employees
สำหรับผู้ที่เปลี่ยนจาก|For employees changing from
เป็นประจำ ระบบเริ่มนับอายุงานใหม่จากวันนี้ หากเป็นประจำตั้งแต่เริ่มงาน ใช้วันที่เริ่มงานเดิมได้|to permanent employment, service restarts from this date. Employees hired as permanent can use the original start date.
เพิ่มข้อมูลพนักงานใหม่|Add new employee information
รอสอบ|Awaiting examination
แผนสอบ|Exam plan
แยกตาม|Grouped by
พนักงานทุกคนใน|All employees in
นี้ต้องสอบ|must take the examination
ภายในช่วงวันที่ของแต่ละ|within each period
ไม่มีพนักงานใน|No employees in
แผนการฝึกอบรมรายไตรมาส|Quarterly training plan
กำหนดครั้งถัดไป|Next scheduled date
ยังไม่มีผลประเมิน|No assessment results yet
พนักงานกรอกรหัส แล้วระบบเลือก|Enter employee ID; the system selects
และชุดข้อสอบให้อัตโนมัติ|and the exam set automatically
เลือกประเภทข้อสอบและกรอกรหัสพนักงาน|Select an exam type and enter the employee ID
สำหรับพนักงานที่เข้าสอบตามรอบ|For employees taking scheduled examinations
ข้อจากคลัง|questions from the question bank
และชุด|and set
ใช้ข้อกา|Use multiple-choice questions
ข้อสอบสำหรับประเมินความพร้อมในการบรรจุเป็นพนักงานประจำ จำนวน|Examination for permanent employment readiness, containing
ข้อสอบตามเงื่อนไข|Examination according to eligibility rules
ข้อ และเมื่อสอบขึ้น|questions; when upgrading to
เป็นข้อกา|multiple-choice questions
อธิบายมาตรฐานงานที่สำคัญที่สุดของ|Explain the most important work standard for
และเหตุผลที่ต้องควบคุม|and why it must be controlled
ยกตัวอย่างความผิดปกติในหัวข้อ|Give an example of an abnormality in
พร้อมวิธีหยุด ควบคุม และป้องกันการเกิดซ้ำ|with the stop, control, and recurrence prevention actions
อธิบายวิธีตรวจสอบคุณภาพก่อนเริ่มงาน ระหว่างงาน และหลังจบงาน สำหรับ|Explain quality checks before, during, and after work for
หากผลตรวจไม่เป็นไปตามมาตรฐานในหัวข้อ|If inspection results do not meet the standard for
คุณจะตัดสินใจและรายงานอย่างไร|how would you decide and report?
อธิบายความเสี่ยงด้านความปลอดภัยที่เกี่ยวข้องกับ|Explain the safety risks related to
และวิธีควบคุม|and how to control them
อธิบายขั้นตอนการแก้ปัญหาเมื่อเครื่องมือ เครื่องจักร หรือกระบวนการมีความผิดปกติ โดยไม่ข้ามมาตรฐาน|Explain the steps to resolve tool, machine, or process abnormalities without bypassing standards
อธิบายวิธีสอนพนักงานใหม่ให้ทำงานได้ตามมาตรฐานและวิธีตรวจยืนยันความเข้าใจ|Explain how to train a new employee to follow standards and verify understanding
หากพบของเสียซ้ำ คุณจะวิเคราะห์สาเหตุ เก็บหลักฐาน และติดตามผลอย่างไร|If defects recur, how would you analyze causes, collect evidence, and follow up?
อธิบายตัวอย่างการปรับปรุงงานที่ช่วยลดความเสี่ยง ลดของเสีย หรือเพิ่มประสิทธิภาพ โดยไม่กระทบคุณภาพ|Describe an improvement that reduces risk or defects or increases efficiency without affecting quality
ในฐานะ|As
คุณจะควบคุมมาตรฐานของทั้ง|how would you control standards across
และรับผิดชอบเมื่อเกิดปัญหาอย่างไร|and take responsibility when problems occur?
ข้อสอบจากคลัง|Questions from the question bank
แยกพนักงานใหม่|Separate new employees
ผ่านแล้วระบบปรับขึ้นอัตโนมัติครั้งละ|After passing, the system automatically upgrades
กา|Multiple choice
ข้อ และต้อง|questions and requires
ข้อเขียนสำหรับการปรับเป็น|Written questions for upgrading to
ข้อ ผู้จัดการจะใช้คำตอบประกอบการอนุมัติในหน้าเว็บ|questions; the manager uses these answers for approval on the website
ของแต่ละรอบเป็นใบแดง แล้วเริ่มนับรอบใหม่|of each cycle into a red card, then starts a new cycle
ของแต่ละรอบเป็นใบแดง|of each cycle into a red card
รายการนี้จะได้รับ|This record receives
ระบบจะคำนวณใบเหลือง|The system recalculates yellow cards
ใบแดงใหม่อัตโนมัติ|and red cards automatically
และคำนวณรอบใหม่แล้ว|and recalculates cycles
ปรับอีกครั้งหลัง|Update again after
ไม่มีข้อมูลใน|No data in
จากคลัง|From the archive
ข้อมูลเช็คชื่อถูกแยกเก็บที่|Attendance data is stored separately in
แล้ว ไม่สามารถเช็คชื่อแทนพนักงานอื่นได้ กรุณาติดต่อ|and cannot check in for other employees. Please contact
ไม่ได้ จึงยังตรวจสอบเครื่องไม่ได้|unavailable; device verification cannot continue
กรุณาตรวจอินเทอร์เน็ตแล้วกดเช็คชื่อใหม่|Check your connection and check in again
เครื่องนี้ผูกกับรหัสพนักงาน|This device is bound to employee ID
หากเป็นข้อมูลเก่าให้|If this information is outdated, ask
ไม่มีเช็คชื่อหลังสิ้นสุดเวลาเช็คชื่อ|No check-in after the check-in window closed
กำลังตรวจสอบรหัสพนักงานกับข้อมูลกลาง กรุณากดเช็คชื่ออีกครั้ง|Checking employee ID against shared data. Please check in again.
ยืนยันว่าเครื่องนี้ลงทะเบียนสำหรับรหัสพนักงาน|Confirm this device is registered to employee ID
หากพนักงานเปลี่ยนเครื่องหรือข้อมูลนี้ไม่ถูกต้อง ให้|If the employee changed devices or this information is incorrect, ask
ไม่พบรหัสพนักงานในข้อมูลกลาง กรุณาตรวจสอบรหัสอีกครั้ง หากเป็นพนักงาน|Employee ID not found in shared data. Check the ID again. For employees
สามารถใส่เฉพาะตัวเลขท้ายรหัสได้|you may enter only the numeric suffix of the ID
วัน ระบบคงเป็นขาดงาน|days; the record remains absent
เปิดหน้าตั้งค่า|Open settings
และกดยืนยันตำแหน่งอีกครั้ง|and confirm the location again
หากต้องการกู้เวลาเช็คชื่อ|To restore the check-in time
พบเวลาเดิมในเครื่องและซ่อมข้อมูลกลางสำเร็จแล้ว|Recovered the saved time and repaired shared data
กรุณากดเช็คชื่อซ้ำเมื่ออินเทอร์เน็ตพร้อม|Check in again when connected
อนุญาตไม่เกิน|Allowed maximum
คลาดเคลื่อน|Accuracy error
ระบบบันทึกเวลาแล้วและทำเครื่องหมายรอตรวจสอบ|Time saved and marked for review
พบเวลาเช็คชื่อในเครื่อง แต่ยังไม่ได้รับการยืนยันจากข้อมูลกลาง|Local check-in time found, but shared data has not confirmed it
กรุณากดเช็คชื่อซ้ำ|Please check in again
ระบบจะส่งซ้ำอัตโนมัติ ไม่ต้องกดเช็คชื่อซ้ำ|The system retries automatically; another check-in is not required
ของวันนั้น|of that day
หากมาเช็คชื่อหลัง|If checking in after
ระบบจะบังคับให้พิมพ์สาเหตุการเข้าสายตอนเช็คชื่อ|A reason for lateness is required at check-in
กรุณาพิมพ์สาเหตุจริง|Enter the actual reason
แล้ว ไม่สามารถแจ้งเข้าสายล่วงหน้าได้|; advance lateness notices are no longer allowed
แนบในเครื่องแล้ว แต่ส่งขึ้นเว็บไม่สำเร็จ|Attached locally but submission failed
แนบใบรับรองแพทย์เรียบร้อย คะแนนหักจากลาป่วยรายการนี้ปรับเป็น|Medical certificate attached; this sick leave deduction is now
แนบใบรับรองแพทย์เรียบร้อย คะแนนของรายการนี้เป็น|Medical certificate attached; this record's score is
แจ้งเข้าสายล่วงหน้า ต้องแจ้งไม่เกิน|Advance lateness notice must be submitted by
ลาต่าง ๆ ล่วงหน้าต้องไม่เกิน|Advance leave notice must be submitted by
ระบบตรวจ|The system checks
บันทึกเวลา โดยจำกัดเวลารอ|Record time with a maximum wait of
และคืนปุ่มให้อัตโนมัติเมื่อเกิดปัญหา|and restores the button automatically if a problem occurs
เครื่องนี้ลงทะเบียนกับรหัส|This device is registered to ID
ระบบจะตรวจการผูกเครื่องกับ|The system checks device binding against
ทุกครั้ง หากเปลี่ยนโทรศัพท์ให้ติดต่อ|each time. When changing phones, contact
พิมพ์สาเหตุจริง|Enter the actual reason
เช็คชื่อได้ตั้งแต่|Check-in is available from
เช็คชื่อได้แต่ระบบตัดเป็นสายและบังคับพิมพ์สาเหตุ|Check-in is allowed, but will be recorded as late and requires a reason
ใบรับรองแพทย์ลาป่วยแนบภายหลังได้ภายใน|A sick leave medical certificate can be attached later within
เช็คชีทรายเดือนทั้ง|Monthly attendance sheet for all
ที่ต้องการจากช่อง|desired in the selector
ด้านบน แล้วระบบจะแสดงพนักงานทุกคนใน|above; the system shows all employees in
เริ่มใช้งานจริงวันที่|Live mode starts on
ระบบนับขาด|The system counts absences
มาสายและ|lateness and
จริงแล้ว|in live mode
มาสายได้ตามปกติ|lateness works normally
ทดลองและเริ่มนับใหม่|Trial mode and restart calculation
ปีที่เริ่มใช้ระบบจะคิดเฉพาะตั้งแต่วันที่|In the first year, calculation starts from the date
กำหนด ไม่หักย้อนหลังช่วงที่ไม่มีข้อมูล|configured; no retrospective deductions apply to periods without data
ปีถัดไปเริ่ม|The following year starts
หากเป็นช่วงทดลองระบบ ให้ใช้ปุ่ม|During the system trial period, use
ทุกประเภทในช่วงวันที่ที่เลือก รวมเช็คชื่อ|all record types in the selected date range, including check-ins
และป้องกันข้อมูลเก่ากลับมาหลัง|and prevents old data from returning after
โดยไม่ลบข้อมูลพนักงาน|without deleting employee records
เลือกคอลัมน์เข้า|Select check-in column
ออก หรือยืนยันว่าไฟล์มีเฉพาะเวลาเข้างาน|check-out column, or confirm the file contains check-ins only
ประเภทสแกนต้องเป็น|Scan type must be
ไม่นำเข้า|Not imported
มีเวลาเข้าเดิมที่เท่ากันหรือเร็วกว่าแล้ว|An equal or earlier check-in time already exists
อ่านข้อมูลเดิมและประวัติการลบจากส่วนกลางไม่สำเร็จ|Failed to read existing data and deletion history from shared data
ที่คั่นคอลัมน์ด้วยจุลภาค แท็บ หรืออัฒภาค ขนาดไม่เกิน|with comma, tab, or semicolon separators, maximum size
แถวแรก การนำเข้าครอบคลุมรายการที่พร้อมทั้งหมด|initial rows; import includes all validated records
ถ้าแยกคอลัมน์|If columns are separate
กรณีไม่มีคอลัมน์เข้า|If no check-in column exists
เปลี่ยนการจับคู่แล้ว กรุณากดตรวจสอบข้อมูลอีกครั้ง|Column mapping changed. Validate the data again.
แถวแล้ว เลือกคอลัมน์และกดตรวจสอบข้อมูล|rows loaded. Select columns and validate the data.
นำเข้าไฟล์|Import file
ได้โดยไม่ต้องระบุยี่ห้อหรือรุ่นเครื่อง ตรวจสอบตัวอย่างก่อนยืนยัน ใช้ตารางจัดกะและคะแนน|without specifying device brand or model. Review the preview before confirming. Uses existing shifts and scores.
ของเครื่อง|of the device
รหัสพนักงานในเครื่องไม่ตรงกับ|Device employee ID does not match
ระบบปัจจุบันใช้เวลาเข้างานสำหรับ|The current system uses check-in time for
โหมดปัจจุบัน|Current mode
ระบบอยู่ในโหมดใช้งานจริงแล้ว|The system is in live mode
ระบบอยู่ในช่วงทดลอง เมื่อพร้อมใช้งานจริงให้กดปุ่ม|The system is in trial mode. When ready for live use, click
ที่หน้า|on page
ใช้มาตรฐานเดียวทุกเครื่อง ไม่อิง|All devices use the same time standard, independent of
ของโทรศัพท์|the phone
ผลค้นหาใช้เพื่อพาแผนที่ไปบริเวณใกล้โรงงานเท่านั้น และจะไม่ย้ายหมุดให้อัตโนมัติ จากนั้น|Search only moves the map near the factory; it does not move the pin automatically. Then
ซูมแผนที่และคลิกหรือลากหมุดเอง|Zoom the map and manually click or drag the pin
ลาต่าง ๆ ล่วงหน้าไม่เกิน|Advance leave notice no later than
ลาป่วยสามารถแนบใบรับรองแพทย์เป็นรูปจากมือถือหรือ|Sick leave medical certificates can be mobile photos or
ได้สูงสุด|up to
หากยังไม่มีสามารถแนบภายหลังได้ภายใน|If unavailable, attach later within
จะปรับเป็น|will change to
เมื่อแนบภายใน|when attached within
หากไม่แนบเกิน|if not attached after
เป็นผู้ปักหมุดเองบนแผนที่ จึงไม่ใช้|manually places the pin on the map, without using
ตำแหน่งปัจจุบันของมือถือในการตั้งโรงงาน|the phone's current location to set the factory
พนักงานต้องอยู่ภายในรัศมีที่|Employees must be within the radius configured by
หลายครั้งและเลือกค่าที่แม่นที่สุดก่อนตรวจระยะ หาก|several times, selecting the most accurate reading before checking distance. If
ยังคลาดเคลื่อนเกินค่าที่กำหนด ระบบจะให้ลองใหม่แทนการตัดสินว่าอยู่นอกพื้นที่|accuracy exceeds the allowed limit, the system asks for a retry rather than marking the employee outside the area
ค้นหาสถานที่ แล้วคลิกบนแผนที่ตรงตัวโรงงาน|Search the location, then click the factory building on the map
ปักหมุดที่กึ่งกลางแผนที่แล้ว|Pin placed at map center
เลือกรายการเพื่อซูมเข้าใกล้ แล้วคลิกตำแหน่งจริงของโรงงานบนแผนที่|Select a result to zoom in, then click the factory's actual position
เลื่อนแผนที่มาบริเวณที่ค้นหาแล้ว|Map moved to the search area
หมุดเดิมยังไม่ถูกเปลี่ยน กรุณาเลื่อน|The pin has not changed. Please pan
ซูมและคลิกหรือลากหมุดเองก่อนบันทึก|zoom, and click or drag the pin before saving
กรุณาคลิกหรือเลื่อนหมุดบนแผนที่เพื่อกำหนดตำแหน่งโรงงานก่อน|Click or drag the map pin to set the factory location first
กรุณากรอกเวลาเป็นรูปแบบ|Enter time in the format
ระบบกำลังส่งพิกัดให้ทุกเครื่อง|Sharing the coordinates with all devices
ระบบจะใช้กะปัจจุบันของพนักงานแต่ละคนเป็นค่าเริ่มต้นสำหรับทั้ง|The system uses each employee's current shift as the default for all
รอบ คุณยังแก้|cycles. You can edit
รายคนได้ภายหลัง|individual employees later
บันทึกในเครื่องแล้วและจะซิงก์เมื่อเชื่อมต่อ|Saved locally; will sync when connected
ระบบเลื่อนหน้าต่างรอบให้อัตโนมัติทุก|The system automatically advances the cycle window every
รอบถัดไปแสดงล่วงหน้าเสมอ|upcoming cycles are always displayed
ยังอยู่กะเดิม และเปลี่ยนกะใหม่วันจันทร์ถัดไป|stays on the current shift and changes on the following Monday
เฉพาะคนที่ต่างจากทีม|Only employees differing from the team
รอบนี้ให้ทุกแผนก|this cycle for all sections
หลังจากนั้น|After that
ระบบปรับวันเริ่มเป็นวันจันทร์ของสัปดาห์นั้น|The start date is adjusted to Monday of that week
เครื่องนี้ไม่มีข้อมูลแผนกะเดิมให้ส่งขึ้น|This device has no existing shift plan to upload
จะถูกแทนที่ด้วยชุดนี้ และเครื่องอื่นจะตามชุดนี้|will be replaced by this set and shared with other devices
เครื่องอื่นจะเห็นกะเดียวกันเมื่อ|Other devices will show the same shifts when
ส่งกะ|Send shifts
แล้ว ทุกเครื่องเห็นกะเดียวกัน|; all devices will show the same shifts
กรุณารีเฟรช|Please refresh
ไม่สามารถแสดงหน้านี้ได้|Unable to display this page
เกิดข้อผิดพลาด|An error occurred
กรุณากรอกคำถามและตัวเลือกให้ครบทุกข้อ|Enter all questions and choices
ยืนยันแล้ว รีเฟรชข้อมูลจะไม่กลับเป็นค่าเดิม|Confirmed; refreshing will retain the changes
กรุณาอย่ารีเฟรชจนกว่าสถานะเชื่อมต่อจะกลับมาปกติ|Do not refresh until the connection is restored
ตัวอย่างรูปจาก|Photo preview from
ตัวอย่างรูป|Photo preview
ไม่สามารถอ่านรูปภาพได้|Unable to read image
กรุณาระบุวันที่ปรับเป็นพนักงานประจำ เพื่อเริ่มนับอายุงานใหม่|Enter the permanent employment date to restart service calculation
เตรียมรูปสำหรับบันทึกเข้าระบบ|Preparing photo for saving
กำลังบันทึกข้อมูลพนักงานขึ้น|Saving employee data to
อัปโหลดรูปและบันทึกข้อมูลขึ้น|Upload photo and save data to
แล้วชื่อจะไม่ย้อนกลับ|; the name change will be retained
บันทึกไว้ในเครื่องแล้ว|Saved locally
ยังไม่พร้อม ระบบจะซิงก์ให้อัตโนมัติเมื่ออินเทอร์เน็ต|Not ready. Sync will resume automatically when the internet
ยังส่งข้อมูลไม่สำเร็จ|Data submission has not completed
ระบบเก็บรายการรอส่งไว้และจะลองใหม่|Submission queued; the system will retry
ให้ใส่|Enter
นำหน้ารหัส|before the ID
รหัสนี้ไม่ได้ตั้งประเภทพนักงานเป็น|This ID's employment type is not set to
กรุณาตรวจสอบข้อมูลพนักงานก่อน|Check the employee information first
พนักงานคนนี้สอบปรับบรรจุในเดือนนี้แล้ว สามารถสอบได้เพียง|This employee already took the permanent employment exam this month. Only
กำลังส่งผลสอบเข้า|Submitting exam results to
ข้อสอบปรับบรรจุสอบได้เพียง|Permanent employment exam is limited to
เดือน และเดือนนี้มีผลสอบแล้ว|month, and results already exist this month
พนักงานสอบประจำไตรมาสนี้แล้ว สอบได้เพียง|This employee already took this quarter's exam. Only
ครั้งและไม่สามารถเปลี่ยนไปสอบชุดอื่นได้|attempt is allowed; another exam set cannot be selected
กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง|Answer every question before submitting
หัวข้อการเทรนนิ่ง|Training topics
วัตถุประสงค์|Objective
เนื้อหาที่ต้องอบรม|Training content
วิธีอบรมและฝึกปฏิบัติ|Training and practice method
การประเมินผล|Assessment
หัวข้อสอบที่เกี่ยวข้อง|Related exam topics
บันทึกการอบรมแล้ว|Training recorded
ยังไม่ได้บันทึกผลการอบรม|Training results not recorded yet
กรอกรายละเอียดก่อนพิมพ์แบบฟอร์มไปใช้เทรนนิ่ง|Enter details before printing the training form
ยังไม่ได้แนบหลักฐาน|No evidence attached yet
วันที่อบรม|Training date
เวลาอบรม|Training time
สถานที่อบรม|Training location
ผู้ฝึกอบรม|Trainer
หน่วยงานที่อบรม|Training section
รายชื่อผู้เข้าอบรม|Trainee list
คนต่อ|people per
บรรทัด|Line
ผลการอบรม|Training results
สรุปผล ความเข้าใจ ผล|Summary, understanding, and results
หรือสิ่งที่ต้องติดตาม|or follow-up items
แนบหลักฐานการอบรม|Attach training evidence
รูปขณะอบรม แบบฟอร์มลงชื่อ หรือผลประเมิน|Training photos, attendance sheet, or assessment results
หลักฐานที่บันทึกแล้ว|Saved evidence
แนบหลักฐานได้สูงสุด|Maximum evidence attachments
หัวข้อและรายละเอียด|Topics and details
หัวข้อ พร้อมอธิบายสิ่งที่ต้องสอน|topics, describing what needs to be taught
บันทึกรายละเอียดแผน|Save plan details
กดหัวข้อเพื่อดูรายละเอียดว่าอบรมอะไรและฝึกอย่างไร|Select a topic to view training content and practice methods
ให้ผู้เข้าอบรมเข้าใจมาตรฐานของหัวข้อนี้ สามารถอธิบายขั้นตอน และนำไปปฏิบัติกับงานจริงได้อย่างถูกต้อง|Trainees should understand the standard, explain the steps, and apply them correctly at work
ผู้สอนอธิบายมาตรฐาน สาธิต แล้วให้พนักงานฝึกปฏิบัติจริง|The trainer explains the standard, demonstrates it, and supervises practical training
ประเมินความเข้าใจและตรวจการปฏิบัติงานจริง|Assess understanding and verify actual work performance
เพิ่มรายการจากหน้าเว็บได้ทันที ไม่ต้องแก้หลังบ้าน|Add entries directly on the website without backend editing
แยกตามโรงงาน|By factory
ยังไม่เพิ่มพนักงาน|No employees added yet
เพิ่มตำแหน่งใน|Add position in
นี้แล้ว กรุณาตรวจสอบรายการ|already exists; check the list
ใหม่ใน|new in
กรุณากลับไป|Please return to
วัน เมื่อมีสแกน|days when a scan exists
คน กรุณากดอัปเดตข้อมูลอีกครั้ง|people. Refresh the data again.
ลากพนักงานลงป้ายเครื่องเพื่อบันทึก|Drag an employee onto the machine label to save
คนแล้ว กรุณาย้ายหรือยกเลิกคนเดิมก่อน|people already assigned. Move or unassign an existing employee first.
แล้วลากกรอบบนผัง|then drag a frame on the layout
แล้วเลือกตำแหน่งเครื่องจริง|then select the actual machine position
ฐานข้อมูลไม่อนุญาตให้เปิดหรือบันทึก|The database does not permit reading or saving
ลากกลับแถบรายชื่อเพื่อยกเลิก|Drag back to the list to unassign
ลากเพื่อย้ายตำแหน่ง หรือคืนรายชื่อด้านซ้าย|Drag to move, or return to the list on the left
เพื่อดูเครื่องจักรและพนักงานของแผนก|to view the section's machines and employees
ชื่อเครื่องนี้มีอยู่แล้วใน|This machine name already exists in
นี้ยังไม่มีภาพผัง|has no layout image yet
กดอัปโหลดผังแผนก|Click Upload section layout
จุดงานนี้และรายการพนักงานประจำจุด|this workstation and its employee assignments
ข้อมูลพนักงานใน|Employee data in
ลากลงเครื่องปลายทาง|Drag onto the destination machine
เลือกเครื่องก่อนลากพนักงานลงพื้นที่ว่างบนผัง หรือวางลงป้ายเครื่อง|Select a machine before dragging an employee onto the layout or machine label
ลากกรอบคลุมพื้นที่จริงของ|Drag a frame around the actual area of
บนผัง แล้วปล่อยเพื่อบันทึก|on the layout; release to save
กรุณาลากกรอบให้มีความกว้างและความสูงอย่างน้อย|Drag a frame with width and height of at least
ของผัง|of the layout
รวมเพื่อดูภาพรวมโรงงาน หรือเลือก|All to view the factory overview, or select
เพื่อเปิดพื้นที่ของแผนกนั้น|to open that section's area
และตำแหน่งให้ครบ|and complete the position
ถูกแก้ไขจากเครื่องอื่นแล้ว กรุณากลับรายการและเปิดฉบับล่าสุดก่อนแก้ไข|was changed on another device. Return to the list and open the latest version before editing.
ของพนักงานคนนี้แล้ว กรุณาเปิดรายการของบุคคลนี้และใช้ปุ่มแก้ไข|already exists for this employee. Open their record and use Edit.
ที่แนบลิงก์|linked document
ไม่พบพนักงานคนนี้ กรุณาบันทึกข้อมูลพนักงานก่อนเพิ่ม|Employee not found. Save the employee information before adding
รายบุคคลของรหัส|individual record for ID
ของพนักงานคนนี้|for this employee
เป็นผู้เชี่ยวชาญ|Expert
เครื่องมือวัด|Measuring instrument
การอ่าน|Reading
การเลือก|Selection
การตั้ง|Setup
จุดตรวจ|Inspection point
ความถี่ตรวจ|Inspection frequency
ปฏิบัติ|Perform
ควบคุม|Control
ตรวจชิ้นงาน|Inspect parts
ตรวจชิ้นแรก|First-piece inspection
ชิ้นแรก|First piece
ผิดมาตรฐาน|Nonconforming
กักงาน|Contain material
กักกัน|Quarantine
หยุดงาน|Stop work
หยุดผลิต|Stop production
หยุดเครื่อง|Stop machine
แม่พิมพ์|Die
ลายนิ้วมือ|Fingerprint
เกลียว|Thread
อธิบาย|Explain
ติดตั้ง|Install
ทบทวน|Review
การสอน|Training
สาธิต|Demonstrate
ฝึก|Practice
ติดป้าย|Label
บันทึกผล|Record results
ทดสอบ|Test
แจ้งหัวหน้า|Notify supervisor
ผู้เกี่ยวข้อง|Relevant personnel
สอบประจำ|Scheduled exam
กำหนดเสร็จ|Due date
ติดตาม|Follow up
ประสิทธิผล|Effectiveness
เปรียบเทียบ|Compare
รวบรวม|Collect
สาเหตุ|Cause
เปลี่ยนแปลง|Change
ทดลอง|Trial
ข้อห้าม|Prohibitions
อันตราย|Hazard
อุบัติเหตุ|Accident
ฉุกเฉิน|Emergency
ทำความสะอาด|Clean
ความเข้าใจ|Understanding
ความถูกต้อง|Accuracy
สวม|Wear
ตรวจสภาพ|Inspect condition
การบำรุงรักษา|Maintenance
การแก้ปัญหา|Problem solving
การทำงาน|Work
การใช้งาน|Use
ความรับผิดชอบ|Responsibility
การตรวจสอบ|Inspection
ผลการสอบ|Exam results
ปะปน|Mixing
แจกจ่าย|Distribute
เรียกคืน|Recall
จัดเก็บ|Store
รายงานต่อ|Reports to
เป้าหมาย|Target
แผนพัฒนา|Development plan
วิธีแก้|Correction method
รายไตรมาส|Quarterly
งานจริง|Actual work
ข้อควรระวัง|Precautions
มาตรฐานงาน|Work standards
เงื่อนไขสำคัญ|Key conditions
ลำดับงาน|Work sequence
ตามหน้าที่|According to responsibility
ประจำงาน|Work-specific
ผลกระทบ|Impact
หน้างาน|Shop floor
รับแจ้ง|Receive report
วิธีวัด|Measurement method
ค่าที่วัด|Measured value
แรงวัด|Measuring force
ผลวัด|Measurement result
จัดลำดับ|Sequence
ร่วม|Together
การประเมินภาคปฏิบัติปลายปี|Year-end practical assessment
ข้อสอบรวม|Comprehensive exam
แผนพัฒนาปีถัดไป|Next year's development plan
สิ่งที่ต้องสอน|Training content
ความถี่ตรวจ|Inspection frequency
ทักษะปัจจุบัน|Current skills
ภาคปฏิบัติ|Practical assessment
รัศมี|Radius
แนบ|Attach
พิกัด|Coordinates
ระยะทาง|Distance
ต้องแนบ|Attachment required
ปุ่ม|Button
แบบ|Format
ส่ง|Send
เลื่อน|Move
ตั้ง|Set
เลย|After
นี้แล้วใน|already in
มีสถานะที่|has status set by
กำหนดไว้แล้ว|already configured
หากเป็น|If
ให้บันทึกเป็น|Save as
ตรงกัน|Matching
ทั้ง|All
ไม่นับ|Not counted
คำนวณ|Calculate
ไม่ต้อง|Not required
ชื่อและรหัส|Name and ID
แผนฝึกอบรม|Training plan
ทำ|Perform
รู้|Know
ประจำปี|Annual
ปีถัดไป|Next year
หลังสอบ|After examination
เงื่อนไขควบคุม|Control conditions
ผิดปกติ|Abnormal
ทำต่อ|Resume
รีเฟรช|Refresh
กำลังซิงก์|Syncing
จากมือถือ|From mobile
ระบบจะส่ง|The system will send
พร้อมบันทึก|Ready to save
ตรวจสอบการ|Verify
ตามเวลาจริง|In real time
คำตอบ|Answer
ตัวเลือก|Choice
เพิ่ม/ลบ|Add / remove
ถูกลบ|Deleted
ไม่ผ่าน|Fail
จำเป็นต้อง|Required to
เวอร์ชัน|Version
คลาดเคลื่อน|Accuracy error
ทุกครั้ง|Every time
หาก|If
เพื่อแก้ไขข้อมูลผ่านหน้านี้|to edit data on this page
ถูกแก้ไข|Updated
งานผิดปกติ|Work abnormality
เครื่องปั๊ม|Stamping machine
เครื่องเชื่อม|Welding machine
ประเมินความเสี่ยง|Risk assessment
การประสานงาน|Coordination
การวิเคราะห์|Analysis
ประกอบ|Assemble
นำไปใช้|Apply
ตรวจยืนยัน|Verify
จุดอันตราย|Hazard point
จุดหนีบ|Pinch point
จุดหมุน|Rotating point
กำลังส่งผล|Submitting results
ภายหลัง|Later
สอบขึ้น|Upgrade exam
ประวัติย้อนหลัง|Historical records
เก็บ|Store
ปลดล็อก|Unlock
ประจำวัน|Daily
กติกาการลา|Leave rules
ข้อมูลรายชื่อ|Employee roster data
สเปก|Specification
ข้อกำหนด|Requirement
ความรู้|Knowledge
การฝึก|Practice
การตรวจวัด|Measurement
ตัวอย่างมาตรฐาน|Standard sample
แก้ไขเฉพาะหน้า|Temporary correction
ต้องสงสัย|Suspect
ตัดสิน|Decide
วิเคราะห์สาเหตุ|Analyze causes
ประจำเดือน|Monthly
ข้อมูลย้อนหลัง|Historical data
ข้อความแสดงผล|Display message
การแจ้งเตือน|Notifications
กำหนดเวลา|Schedule time
จุดติดตั้ง|Installation location
ช่องว่าง|Available slots
เมื่อพร้อม|When ready
ส่วน|Section
อัปโหลดแล้ว|Uploaded
เครื่องสแกน|Scanner
เริ่มต้นใหม่|Restart
การแจ้งลา|Leave requests
เชื่อมต่อกลับมา|Reconnected
รองรับเฉพาะ|Only supports
รหัสนี้|This ID
เพียง|Only
ขณะนี้|Currently
เลือกแล้ว|Selected
ต่าง|Different
ป้าย|Label
ชื่อโรงงาน|Factory name
ใบรับรองแพทย์ลาป่วย|Sick leave medical certificate
เฉพาะวันนี้|Today only
ก่อนหน้า|Previous
วันถัดไป|Next day
จัดเรียง|Sort
ทักษะที่จำเป็น|Required skills
ใบรับรองแพทย์เรียบร้อย|Medical certificate attached
ขีดจำกัด|Limit
ภาพหลักฐาน|Evidence image
ผลประเมิน|Assessment result
เนื้อหา|Content
แบบฟอร์มลงชื่อ|Attendance form
ลายเซ็น|Signature
เครื่องนี้ลงทะเบียนสำหรับพนักงาน|This device is registered to employee
อัปโหลดข้อมูล|Upload data
แหล่งข้อมูล|Data source
ลบรูป|Remove photo
ช่วงที่เลือก|Selected period
ตามวันที่จริง|Based on the actual date
ข้อมูลหลัก|Master data
ฐานข้อมูล|Database
พื้นที่จัดเก็บ|Storage space
เริ่มรอบ|Start cycle
จำนวนรอบ|Cycle count
เวลาตัด|Cutoff time
ตั้งกะ|Set shift
สิทธิ์ของ|Permissions of
วันเวลาที่|Date and time
ปิดการ|Disable
อัปเดตค่าปัจจุบัน|Update current values
ล่าสุด แจกจ่าย เรียกคืน และจัดเก็บ|Latest revision, distribution, recall, and storage
และเวลาให้ถูกต้องครบถ้วน|and time accurately and completely
และป้องกันแก้ค่าโดยไม่ได้รับอนุญาต|and prevent unauthorized parameter changes
ผลิตชิ้นแรก และรออนุมัติก่อนผลิตต่อ|Produce the first piece and wait for approval before continuing
ตรวจชิ้นแรกทุกจุดสำคัญ บันทึก และรออนุมัติ|Inspect all key points of the first piece, record results, and wait for approval
หยุดงาน แยกของ แจ้งหัวหน้า และบันทึกเหตุการณ์|Stop work, segregate material, notify the supervisor, and record the incident
ข้อ ผ่านอย่างน้อย|questions; minimum passing score
ลำดับ|Sequence
หัวข้อสอบประจำ|Scheduled examination topics
กำลังโหลดรายละเอียดแผน|Loading plan details
ก่อนสอบทุก|Before each exam
การเลือกและใช้|Selection and use
หัวข้อที่รับผิดชอบ|Assigned topics
รายการอยู่ในช่วงที่|The record is within the period
วันที่นี้ถูก|This date was
ยังบันทึก|Saving still
รอบเรียบร้อย|cycles completed
รูปที่เลือกจาก|Photo selected from
พร้อมการติดป้ายและกักงาน|with labeling and material containment
การเลือกและตรวจ|Selection and checking
และข้อห้าม|and prohibited actions
ถูกแปลง|Converted
ต้องกำหนด|Must configure
ผู้เข้าอบรม|Trainees
การสาธิต|Demonstration
วันที่และเวลาที่ลูกค้า|Customer's date and time
เวลาส่งแจ้งเตือนผ่านมาแล้ว กรุณากำหนดเวลาเข้าพื้นที่ให้มากกว่าระยะเวลาแจ้งล่วงหน้า|The notification time has passed. Set an entry time later than the advance notification period.
กรุณากรอกรหัสพนักงานในหน้าเช็คชื่อก่อน เพื่อให้ระบบดึงกะที่จัดไว้ของพนักงานคนนี้|Enter your employee ID on the attendance page first so the system can retrieve your assigned shift.
ระบบจะส่งตามกะที่จัดไว้ในหน้าเว็บของพนักงานคนนี้|Notifications follow this employee's assigned shift.
กรุณาเปิดด้วย|Please open using
แล้วกด|then click
ไม่สามารถสร้างโทเคนแจ้งเตือนได้|Unable to create a notification token
ยังไม่ได้ใส่|Not entered yet
ลงทะเบียนเครื่องกับ|Register device with
จะเปิดใช้งานอีกครั้งหลังปรับโมดูลจัดการข้อมูลให้แยกจากไฟล์เดิมอย่างปลอดภัย|Will be enabled again after the data management module is safely separated from the legacy file
ระบบจะส่งรายการรอลบซ้ำ|The system retries pending deletions
อุปกรณ์หรือเบราว์เซอร์นี้อาจไม่รองรับการแสดงตัวอย่างไฟล์ชนิด|This device or browser may not support previewing file type
ที่ใช้อยู่ จึงหยุดบันทึกเพื่อป้องกันบัญชีเดิมหาย กรุณาเข้าระบบด้วยบัญชีเดิมก่อน|currently in use. Saving stopped to protect existing accounts. Sign in with the original account first.
ไม่พบหน้าบัตรด้านหน้าและด้านหลัง กรุณาปิดแล้วเปิดหน้า|Front/back card pages were not found. Close and reopen
เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาต|The browser blocked the print window. Allow
สำหรับเว็บไซต์นี้แล้วลองใหม่|for this website and try again
ตามคู่มือ|Follow the guide
ขนาดบัตรแล้ว|card size selected
รวมทุก|All
บันทึกเข้า|Save to
ไม่สามารถลบหรือปิดบัญชี Admin หลักได้|The primary Admin account cannot be deleted or disabled
แก้ไขรูปได้เฉพาะพนักงานใน|You can edit photos only for employees in
ลบได้เฉพาะพนักงานใน|You can remove employees only from
รับข้อมูลกะไม่ครบ กรุณากดบันทึกอีกครั้ง|Incomplete shift data received. Please save again.
รายการนี้ถาวรจาก|this record permanently from
ถาวรและซิงก์|permanently and sync
ยังไม่พร้อม จึงยังปลดล็อกข้อสอบไม่ได้ กรุณาลองลบอีกครั้ง|Not ready; exam access could not be unlocked. Try deletion again.
ยังไม่ยืนยันการปลดล็อกข้อสอบ|Exam access unlock not confirmed
ลบประวัติและปลดล็อกสิทธิ์สอบบน|Delete history and unlock exam access on
ลบในเครื่องแล้ว แต่ยังปลดล็อกข้อสอบส่วนกลางไม่สำเร็จ|Deleted locally, but shared exam access was not unlocked
มีใบรับรอง|Certificate attached
ลาป่วยล่วงหน้า|Advance sick leave
ขึ้นเว็บ|Submit to website
มีผู้เยี่ยมชมเข้าพื้นที่|Visitors entering the area
กดยืนยัน|Click Confirm
แบบฟอร์มเดียวกับหน้า|Same form as page
เพิ่มได้เฉพาะ|Can add only
กรอกเฉพาะทีม กลุ่ม หน้าที่ และเครื่องจักรของ|Enter only the team, group, responsibility, and machines for
กรอกเฉพาะข้อมูลความรับผิดชอบของ|Enter only responsibility details for
ก่อนเริ่มรอบใหม่|Before starting a new cycle
เครื่องที่เลือก|Selected machine
เลือก Section|Select Section
บันทึกแผนกะ|Save shift plan
โดยไม่มีแถบเมนูด้านบน|without the top navigation
เปลี่ยนการจับคู่แล้ว|Column mapping changed
ผิดพลาด|Error
ของแต่ละรอบ|of each cycle
และสามารถ|and can
ข้อมูลผิด|Invalid data
รายละเอียดเครื่อง|Machine details
ก่อนเริ่มงาน|Before work
แสดงกะ|Show shift
ขาดงานอัตโนมัติ|Automatic absence
ยังไม่เชื่อมต่อ|Not connected
รายการเดิมที่ยังไม่ระบุกะแสดงในกะเช้า|Legacy unshifted assignments appear in day shift
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]})));

 Object.assign(dictionary,{
 "โดยตรง กรุณากด": "directly. Please click",
 "ม.ค.": "Jan",
 "ก.พ.": "Feb",
 "มี.ค.": "Mar",
 "เม.ย.": "Apr",
 "พ.ค.": "May",
 "มิ.ย.": "Jun",
 "ก.ค.": "Jul",
 "ส.ค.": "Aug",
 "ก.ย.": "Sep",
 "ต.ค.": "Oct",
 "พ.ย.": "Nov",
 "ธ.ค.": "Dec",
 "สามารถเลือกไฟล์รูปจากเครื่องแล้วกดบันทึกได้ทันที ระบบจะเก็บรูปแบบบีบอัดไว้ใน": "Choose an image on your device and save it. Compressed images are stored in",
 "ไม่พบรูปในโฟลเดอร์แผนกนี้ กรุณาตรวจชื่อโฟลเดอร์หรืออัปโหลดรูปเข้า": "No images found in this section folder. Check the folder name or upload images to",
 "พร้อมบันทึกรูปเข้าระบบ": "Ready to save the photo to",
 "น. กรุณาเช็คชื่อเมื่อถึงเวลา": ". Please check in when the window opens",
 "ยังไม่ได้รับพิกัดโรงงานจากข้อมูลกลาง กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่ หรือให้": "Factory coordinates have not been received. Check your connection and retry, or contact",
 "น. กรุณาระบุสาเหตุการเข้าสาย": ". Please enter the reason for being late",
 "ม. (อนุญาตไม่เกิน": "m (maximum allowed:",
 "ม.)": "m)",
 "ม. ระบบบันทึกเวลาแล้วและทำเครื่องหมายรอตรวจสอบ": "m. Your time has been recorded and marked for review",
 "เลยเวลาแจ้งเข้าสายล่วงหน้าของ": "The advance lateness reporting deadline has passed for",
 "น. ของวันนั้น": "on that day",
 "น. ระบบจะบังคับให้พิมพ์สาเหตุการเข้าสายตอนเช็คชื่อ": ". A lateness reason will be required at check-in",
 "เลยเวลา": "After",
 "น. แล้ว ไม่สามารถแจ้งเข้าสายล่วงหน้าได้": ". Advance lateness reporting is no longer available",
 "กรณีลาป่วยที่แจ้งในวันลาและเดิมถูกหัก": "For same-day sick leave originally deducted",
 "เมื่อแนบสำเร็จจะปรับเป็น": "After successful attachment, this changes to",
 "ลากิจวันเดียวกันหรือล่วงหน้าไม่เกิน 7 วัน -1": "Same-day personal leave or up to 7 days in advance: -1",
 "ลาป่วยวันเดียวกันมีใบรับรอง 0 / ไม่มี -1 และแนบภายใน 3 วัน": "Same-day sick leave: 0 with a medical certificate; -1 without one. Attach within 3 days",
 "น. เช็คชื่อได้แต่ระบบตัดเป็นสายและบังคับพิมพ์สาเหตุ": ". Check-in is allowed but marked late, with a reason required",
 "แสดงสถานะของพนักงานในแต่ละวัน ข้อมูลใช้ชุดเดียวกับ": "Displays daily employee status using the same data as",
 "จึงเห็นตรงกันทุกเครื่องเมื่อซิงก์สำเร็จ": "so all devices match after successful synchronization",
 "มุมมองนี้รวมผลรายเดือนของพนักงานทุกคนในขอบเขตที่เลือก ใช้ข้อมูล": "This view summarizes monthly results for all employees in the selected scope, using data from",
 "ชุดเดียวกับ": "the same dataset as",
 "และสามารถสลับกลับไปดูรายบุคคลเพื่อดูรายละเอียดรายวันได้": "Switch to an individual employee to see daily details",
 "ในช่วงวันที่และขอบเขตที่เลือก ได้แก่ เช็คชื่อ / มาสาย / ลาป่วย / ลากิจ / ขาดงาน และคะแนนที่เกิดจาก": "Within the selected dates and scope: check-ins, lateness, sick leave, personal leave, absences, and scores from",
 "วันที่ที่ล้างจะถูกล็อกเป็นช่วงทดลองเพื่อไม่ให้ข้อมูล": "Cleared dates are locked as a trial period to prevent data from",
 "จากมือถือหรือขาดงานอัตโนมัติกลับมาหลัง": "mobile devices or automatic absences returning after",
 "ทั้งหมดช่วงนี้": "all records in this period",
 "จะลบ เช็คชื่อ / มาสาย / ลา / ขาดงาน และคะแนน": "This deletes check-ins, lateness, leave, absences, and scores",
 "ลบทั้งเช็คชื่อ / มาสาย / ลา / ขาดงาน และคะแนน": "Delete check-ins, lateness, leave, absences, and scores",
 "ถูกป้องกันไม่ให้ข้อมูลเก่าหรือขาดงานอัตโนมัติกลับมาหลัง": "Old data and automatic absences are prevented from returning after",
 "ใหม่ตั้งแต่": "restarts from",
 "ที่ต้องการลบ": "to delete",
 "ยังไม่พร้อม การลบถูกเก็บคิวในเครื่องแล้ว": "is not ready. The deletion is queued on this device",
 "ปลดล็อกวันเริ่มใช้งานจริงและซิงก์": "Unlock the production start date and sync",
 "บันทึกการยกเลิกขาดงานลง": "Save absence cancellation to",
 "อัปเดตการผูกเครื่องและซิงก์": "Update device binding and sync",
 "แก้ข้อมูลเครื่องในเครื่องแล้ว แต่ซิงก์": "Device details updated locally, but synchronization with",
 "แก้ข้อมูลในเครื่องแล้ว แต่ซิงก์": "Data updated locally, but synchronization with",
 "ซิงก์การล้างข้อมูลทดลองไป": "Sync trial data cleanup to",
 "ล้างในเครื่องแล้ว แต่ซิงก์": "Cleared locally, but synchronization with",
 "สามารถกู้เวลาเช็คชื่อของวันนี้จากคลังสำรองได้ และเมื่อพนักงานเปิดเว็บ เครื่องจะส่งเวลาเช็คชื่อวันนี้ที่ค้างอยู่กลับ": "Today's check-ins can be restored from backup. When employees open the site, pending check-ins are resubmitted to",
 "รายการนี้ถูก": "This record was",
 "บริษัทจินร้งอิเล็กทรอนิกส์ เทคโนโลยี (ไทยแลนด์) จำกัด": "Jinrong Electronics Technology (Thailand) Co., Ltd.",
 "หากยังไม่มีสามารถแนบภายหลังได้ภายใน 3 วัน และรายการลาป่วยวันนั้นที่เดิมหัก -1 จะปรับเป็น 0 เมื่อแนบภายใน 3 วัน": "If unavailable, attach within 3 days. The original same-day sick leave deduction of -1 changes to 0 when attached within 3 days",
 "หากไม่แนบเกิน 3 วันจะปรับเป็น -2": "Without an attachment after 3 days, the deduction changes to -2",
 "กำหนด 50–500 เมตร ระบบจะจับ": "Set 50–500 meters. The system captures",
 "ตั้งกะ 4 รอบปัจจุบันให้พนักงานทุกแผนกหรือไม่?": "Assign the current 4 shift cycles to employees in all sections?",
 "ตั้งกะ 4 รอบปัจจุบันให้ทุกแผนกเรียบร้อย": "Current 4 shift cycles assigned to all sections",
 "ถ้าเครื่องหลักกับเครื่องอื่นแสดงกะไม่ตรงกัน ให้เปิดหน้านี้จากเครื่องหลักแล้วกด": "If shifts differ between devices, open this page on the primary device and click",
 "ครั้ง ระบบจะส่งกะที่เครื่องหลักมีอยู่ก่อนรับข้อมูล": "time(s). The primary device uploads its shifts before receiving data",
 "และให้ทุกเครื่องตาม": "and aligns all devices with",
 "ระบบเช็คชื่อจะหา": "The attendance system finds",
 "ตามวันที่จริง และเก็บกะไว้ใน": "by the actual date and stores the shift in",
 "บันทึกไว้ในเครื่องแล้ว แต่": "Saved on this device, but",
 "บันทึกข้อมูลพนักงานขึ้น": "Upload employee data to",
 "ไว้ในเครื่องเรียบร้อยแล้ว ขณะนี้": "saved on this device. Currently,",
 "ยังไม่ได้ตอบข้อ:": "Unanswered questions:",
 "ต้องมีข้อกา 20 ข้อ กรุณาติดต่อ": "20 multiple-choice questions are required. Please contact",
 "กรุณาตอบข้อเขียน": "Please answer the written questions",
 "ให้ครบทั้ง 10 ข้อ": "Complete all 10 questions",
 "ไม่สามารถกลับมาทำข้อสอบชุดนี้ต่อได้": "You cannot return to continue this exam",
 "บันทึกข้อสอบแล้ว": "Exam saved",
 "ระบบจะส่งเข้า": "The system will submit to",
 "อัตโนมัติเมื่อสัญญาณพร้อม": "automatically when connected",
 "บันทึกแล้วและเข้าคิวส่ง": "Saved and queued for submission to",
 "ระบบอัปสกิลอัตโนมัติ": "Automatic skill advancement",
 "ตรวจข้อเขียนและอนุมัติการอัปสกิล": "Grade written answers and approve skill advancement",
 "นำเข้าข้อมูลและรูปภาพสำเร็จแล้ว เครื่องนี้จะแสดงข้อมูลเหมือนเครื่องหลัก": "Data and photos imported. This device now shows the same data as the primary device",
 "ใช้ได้เฉพาะ": "Only supports",
 "จุด, ขีดกลาง และขีดล่าง จำนวน 3–40 ตัว": "periods, hyphens, and underscores; 3–40 characters",
 "ไฟล์ที่เลือกไม่ใช่รูปภาพ": "The selected file is not an image",
 "อ่านไฟล์ไม่ได้": "Unable to read the file",
 "รูปภาพเสียหรือไม่รองรับ": "The image is damaged or unsupported",
 "ดึงจาก": "From",
 "มีทั้งหมด": "Total",
 "แผนเข้ากะรายบุคคล": "Individual shift plan",
 "ของพนักงานคนนี้สำหรับ 4 รอบปัจจุบันได้ทันที": "for this employee across the current 4 cycles",
 "ปรับแผนกะ 4 รอบ": "Adjust the 4-cycle shift plan",
 "ใช้ค่า": "Use value",
 "ปรับแผนเข้ากะรายบุคคล": "Adjust individual shift plan",
 "ตั้งเฉพาะพนักงานคนนี้ โดยไม่กระทบพนักงานคนอื่น": "Apply only to this employee without affecting others",
 "บันทึกแผนกะ 4 รอบของ": "Save the 4-cycle shift plan for",
 "สามารถลงสถานะ": "You can record the status",
 "ให้พนักงานคนนี้ได้โดยตรงจากรายชื่อ": "for this employee directly from the roster",
 "แก้ไขข้อมูลและเพิ่ม เปลี่ยน หรือลบรูปภาพได้จากหน้านี้": "Edit details and add, replace, or remove the photo on this page",
 "รายการนี้บันทึกเข้าประวัติ": "This record is saved in the history of",
 "เวลาเข้าจริง": "Actual arrival time",
 "ระบบจะคำนวณคะแนนมาสายจากเวลาเข้าจริงตามกะของพนักงาน": "Lateness deductions are calculated from actual arrival time and the assigned shift",
 "ระบุเหตุผลหรือหมายเหตุ": "Enter a reason or note",
 "กรุณาระบุวันที่ที่ถูกต้องและเหตุผล": "Enter a valid date and reason",
 "กรุณาระบุเวลาเข้าจริง": "Enter the actual arrival time",
 "เวลาที่เลือกยังไม่ถือว่ามาสาย": "The selected time is not considered late",
 "เริ่มนับสายหลัง": "Lateness starts after",
 "บันทึกในเครื่องแล้ว แต่ส่งขึ้น": "Saved locally, but upload to",
 "ระบบจะนำรายการที่เคยบันทึกไว้กลับมารวมกับข้อมูลปัจจุบัน โดยไม่ลบรายการใหม่": "Previously saved records are merged with current data without deleting new records",
 "ขาดงาน / ลา / มาสาย / คะแนนหักเดิมทั้งหมด": "all previous absences, leave, lateness, and deductions",
 "รายการ และรีเซ็ต": "records, and reset",
 "ของทุกคนกลับเป็น 100 คะแนน": "everyone's score to 100",
 "จะถูกยกเลิกและเปลี่ยนเป็น": "will be canceled and changed to",
 "คลังข้อสอบ จะไม่ถูกลบ": "The question bank will not be deleted",
 "เพื่อยืนยันการรีเซ็ตและเริ่มใช้งานจริง": "to confirm the reset and start live operation",
 "ยกเลิกการเริ่มใช้งานจริง": "Cancel live operation",
 "ไม่นับข้อมูลก่อนวันเริ่มใช้งานจริงใหม่": "Exclude data before the new live start date",
 "รีเซ็ตและเริ่มใช้งานจริงเรียบร้อย": "Reset completed and live operation started",
 "ทุกคนเริ่มใหม่ 100 คะแนน": "Everyone restarts at 100 points",
 "ข้อมูลและคะแนนก่อนวันนี้จะไม่ถูกสร้างย้อนกลับมาอีก": "Data and scores before today will not be recreated",
 "ตั้งค่าในเครื่องแล้ว แต่": "Settings saved locally, but",
 "ขณะนี้เป็นโหมดทดลองอยู่แล้ว": "Trial mode is already active",
 "ที่มีอยู่จะไม่ถูกลบทันที แต่หลังจากนี้ควรใช้ปุ่ม": "Existing data is not deleted immediately. When ready, use the button",
 "เพื่อเคลียร์ข้อมูลทดลองและเริ่มนับใหม่เมื่อพร้อม": "to clear trial data and restart",
 "เปลี่ยนเป็นโหมดทดลองแล้ว": "Switched to trial mode",
 "ยกเลิกการไม่นับคะแนนช่วง": "Cancel score exclusion for the period",
 "หลังยกเลิก ระบบอาจสร้างขาดงานอัตโนมัติย้อนหลังตามกติกาปกติ": "After cancellation, retrospective automatic absences may be created under the normal rules",
 "ลบวันหยุด": "Delete holiday",
 "ไม่พบการลงทะเบียนเครื่อง": "Device registration not found",
 "เรียบร้อย และบันทึก": "completed and saved to",
 "แล้ว พนักงานสามารถลงทะเบียนเครื่องใหม่ได้": ". The employee can now register a new device",
 "ในเครื่องแล้ว แต่": "on this device, but",
 "แบบถาวรหรือไม่?": "permanently?",
 "รายการนี้จะถูกลบจาก": "This record will be deleted from",
 "และทำเครื่องหมายกัน": "and marked to prevent",
 "มือถือส่งข้อมูลเก่ากลับมาอีก": "mobile devices from resending old data",
 "ถาวรเรียบร้อย": "permanently deleted",
 "แล้วข้อมูลจะไม่กลับมา": "and the data will not return",
 "ของรหัส": "for employee ID",
 "ทุกวันที่บันทึกของรหัส": "all recorded dates for employee ID",
 "ทุกปี ทุกแผนก จำนวน": "all years and sections, total",
 "ระบบจะเริ่มนับ": "The system starts counting",
 "และจะไม่สร้างขาดงานย้อนหลังจากช่วงทดลอง": "and will not create retrospective absences for the trial period",
 "ข้อมูลพนักงานและการผูกเครื่องจะยังอยู่": "Employee data and device bindings are retained",
 "ทั้งหมด / ช่วงทดลองก่อน": "all records / trial period before",
 "ระบบจะไม่สร้างขาดงานย้อนหลังจากข้อมูลช่วงทดลอง": "No retrospective absences will be created from trial data",
 "ไม่มีข้อมูลการผูกเครื่องให้ล้าง": "No device bindings to clear",
 "พนักงานจะต้องลงทะเบียนเครื่องใหม่ในการเช็คชื่อครั้งถัดไป": "Employees must register their device again at the next check-in",
 "ล้างการผูกเครื่องทั้งหมดเรียบร้อย และบันทึก": "All device bindings cleared and saved to",
 "คืนข้อสอบชุดนี้เป็นค่าเริ่มต้นหรือไม่?": "Restore this exam to its defaults?",
 "กำลังคืนค่า...": "Restoring...",
 "คืนค่าไว้ในเครื่องแล้ว แต่": "Restored locally, but",
 "ไม่มีประวัติผลสอบให้ล้าง": "No exam results to clear",
 "จะล้างประวัติผลสอบ/คะแนน/สถานะอนุมัติทั้งหมด": "All exam history, scores, and approval statuses will be cleared",
 "ไม่ลบคลังข้อสอบและข้อมูลพนักงาน": "The question bank and employee data will be retained",
 "โหมดทดลอง: จะล้างข้อมูลต่อไปนี้ทั้งหมด": "Trial mode: all the following data will be cleared",
 "ใหม่ตั้งแต่วันนี้": "starting again today",
 "โหมดทดลอง: จะล้าง": "Trial mode: clear",
 "รายการ และการผูกเครื่อง": "records and device bindings",
 "จะไม่ถูกลบ": "will not be deleted",
 "กรอกวันที่ที่ต้องการล้าง": "Enter the date to clear",
 "รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้": "Invalid date format. Use",
 "วันที่นี้จะถูกบันทึกว่า": "This date will be marked as",
 "ลบแล้ว และ": "deleted, and",
 "จากเครื่องพนักงานจะกู้กลับมาไม่ได้": "cannot be restored from employees' devices",
 "ไม่ถูกกู้กลับหลังอัปเดต": "will not be restored after an update",
 "ลบในเครื่องและเก็บคิวลบแล้ว แต่": "Deleted locally and queued for deletion, but",
 "ตามตัวกรองนี้": "matching these filters",
 "การลบนี้ไม่ลบข้อมูลพนักงาน": "Employee data will not be deleted",
 "ระบบจะไม่กู้วันที่ที่ลบกลับมาอีก": "Deleted dates will not be restored",
 "กำลังกู้ข้อมูล...": "Restoring data...",
 "วันนี้ถูก": "Today was",
 "ตั้งเป็นวันที่ล้าง": "marked as cleared",
 "จึงไม่กู้ข้อมูลกลับอัตโนมัติ": "so data is not restored automatically",
 "ไม่พบรายการที่หายจากคลังสำรองวันนี้": "No missing records found in today's backup",
 "หากเวลายังค้างอยู่เฉพาะมือถือพนักงาน ให้พนักงานเปิดเว็บ": "If check-in times remain only on an employee's phone, ask them to open the site",
 "อีกครั้ง ระบบจะส่งกลับ": "again. The system will resubmit to",
 "ไม่พบประวัติการสอบที่ต้องการลบ กรุณา": "Exam history to delete was not found. Please",
 "แล้วลองใหม่": "and try again",
 "ลบประวัติการเข้าสอบรายการนี้หรือไม่?": "Delete this exam history record?",
 "เมื่อลบแล้ว พนักงานจะสามารถเข้าสอบ": "After deletion, the employee can retake",
 "หัวข้อนี้ใหม่ได้": "this topic",
 "หมายเหตุ: การลบประวัติสอบจะไม่ย้อนระดับ": "Note: deleting exam history does not revert the level",
 "ที่เคยอัปเดตจากผลสอบ": "previously updated from exam results",
 "คืนสิทธิ์สอบทันที พนักงานสามารถสอบใหม่ได้ในเดือนนี้": "Exam access is restored immediately. The employee can retake the exam this month",
 "ลบประวัติการเข้าสอบเรียบร้อยแล้ว": "Exam history deleted",
 "ข้อกา 20 ข้อ:": "20 multiple-choice questions:",
 "รายการนี้ได้รับการอนุมัติแล้ว": "This record has already been approved",
 "ระบบปรับอัตโนมัติ ไม่ต้องใช้การอนุมัติ": "Updated automatically; approval is not required",
 "กรอกรหัสอนุมัติสำหรับ": "Enter the approval code for",
 "รหัสอนุมัติไม่ถูกต้อง": "Incorrect approval code",
 "ไม่สามารถอัปสกิลได้ หรือระดับปัจจุบันเท่ากับ/สูงกว่าเป้าหมายแล้ว": "Cannot advance the skill, or the current level already meets or exceeds the target",
 "อนุมัติและอัปสกิลอัตโนมัติ": "Approve and advance the skill automatically",
 "เปิดแบบประเมิน": "Open assessment",
 "ระบบเวอร์ชันนี้ใช้": "This version uses",
 "เป็นฐานข้อมูลหลักแล้ว ไม่ต้องสร้างหรืออัปโหลด": "as the primary database. There is no need to create or upload",
 "ปิดการคืนค่ารายชื่อจากไฟล์แล้ว เพื่อป้องกันรายชื่อเก่ากลับมาอีก กรุณาเพิ่ม/ลบ/แก้ไขพนักงานผ่านระบบ ซึ่งจะบันทึกที่": "Roster restoration from files is disabled to prevent old records returning. Add, remove, or edit employees in the system, which saves to",
 "ลบพนักงานคนนี้ถาวรหรือไม่? ข้อมูลจะถูกลบจาก": "Permanently delete this employee? Data will be deleted from",
 "และจะไม่กลับมาหลังอัปเดตเวอร์ชัน": "and will not return after a version update",
 "ลบข้อมูลพนักงานจาก": "Delete employee data from",
 "อัปเดตเวอร์ชันใหม่ชื่อจะไม่กลับมา": "The employee will not reappear after a version update",
 "ลบในเครื่องแล้ว": "Deleted locally",
 "ยังไม่พร้อม ระบบจะซิงก์เมื่อเชื่อมต่อได้": "is not ready. Synchronization resumes when connected",
 "กรอกรหัส": "Enter code",
 "หรือรหัสพนักงาน": "or employee ID",
 "ตรวจพบข้อผิดพลาด:": "Error detected:",
 "แบบหน้าหลัง": "front and back",
 "ระบบจัดเอกสารให้แล้ว:": "Document prepared:",
 "หน้าแรกเป็นด้านหน้าบัตร และหน้าถัดไปเป็นด้านหลังที่วางตำแหน่งตรงกัน ขนาด": "The first page contains card fronts and the next contains matching backs. Size:",
 "แนวตั้ง จำนวนสูงสุด 10 ใบต่อด้าน": "portrait, up to 10 cards per side",
 "ที่หน้าต่างเครื่องพิมพ์ ให้เลือก:": "In the print dialog, select:",
 "พิมพ์สองด้าน /": "Two-sided printing /",
 "พลิกขอบยาว /": "Flip on long edge /",
 "ตัวเลือกนี้ขึ้นอยู่กับเครื่องพิมพ์ เว็บไม่สามารถเปิด": "This option depends on the printer. The website cannot enable",
 "ของเครื่องแทนผู้ใช้ได้": "on the device for you",
 "ตั้งค่าการพิมพ์ /": "Print settings /",
 "แนวกระดาษ": "Orientation",
 "การจัดขนาด": "Scaling",
 "พอดีความกว้างกระดาษ": "Fit to page width",
 "ระบบจะพิมพ์เฉพาะ": "Prints only",
 "โดยตัดแถบเมนูและหัวข้อหน้าเว็บด้านบนออก รองรับ": "without the navigation bar and website heading. Supports",
 "หลังจากกดพิมพ์ สามารถเลือกเครื่องพิมพ์ หรือ": "After clicking Print, choose a printer or",
 "พิมพ์ตอนนี้": "Print now",
 "ไม่ใช่ไฟล์รูปภาพ": "Not an image file",
 "จะมีเฉพาะ": "Contains only",
 "บัตรทั้ง": "both card sides",
 "การลา และแผนกะพร้อมใช้งาน": "leave and shift plans are ready",
 "การตรวจสอบใช้เวลานานเกินไป กรุณากด": "Verification timed out. Please click",
 "บันทึกเครื่องเจ้าของไม่ได้ กรุณาลองอีกครั้ง": "Unable to save the owner's device. Please retry",
 "ต้องเปิดจากเบราว์เซอร์เดิมบนเครื่อง": "Open with the original browser on the device",
 "ที่เคยผูกไว้": "previously registered",
 "กู้ได้เฉพาะบัญชี": "Recovery is available only for the account",
 "หลักเดิม": "original primary account",
 "เครื่องนี้ไม่ตรงกับเครื่อง": "This device does not match the",
 "เดิม กรุณาใช้เครื่องและเบราว์เซอร์ที่เคย": "original device. Use the device and browser previously used to",
 "บัญชีนี้ไม่ใช่": "This account is not",
 "หลัก จึงไม่สามารถกู้ด้วยวิธีนี้ได้": "the primary account and cannot be recovered this way",
 "เครื่องนี้ไม่ตรงกับเครื่องที่ผูกกับบัญชี": "This device does not match the one bound to the account",
 "เดิมครบ": "all original records",
 "ใช้ได้เฉพาะเครื่องและเบราว์เซอร์เดิมที่ผูกบัญชี": "Use only the original device and browser bound to the account",
 "ไว้ ตั้งรหัสผ่านใหม่เพื่อกลับเข้าใช้งาน": ". Set a new password to restore access",
 "ใหม่ต้องมีอย่างน้อย 8 ตัว": "must have at least 8 characters",
 "หลักใช้ได้เฉพาะเครื่องเจ้าของ": "The primary account works only on the owner's device",
 "ที่เพิ่มใช้จากเครื่องอื่นได้": "Additional accounts can use other devices",
 "ระบบจัดการ": "Management system",
 "ไม่ได้": "unavailable",
 "เทียบ": "compared with",
 "โหลดจาก": "Loaded from",
 "เลือกรูปจากมือถือหรือคอม รูปจะบันทึกเข้าระบบ": "Choose a photo from your phone or computer. It will be saved to",
 "และแชร์ให้ทุกคนเห็น": "and shared with all users",
 "ยืนยันว่า": "Confirm that",
 "รายชื่อจะถูกนำออก แต่ประวัติ": "The employee is removed from the roster, but the history of",
 "จะยังคงเก็บไว้": "is retained",
 "ระบบรายชื่อหลักยังไม่พร้อม กรุณารีเฟรชหน้าเว็บ": "The employee master is not ready. Refresh the page",
 "ออกจากรายชื่อปัจจุบันและเก็บประวัติแล้ว": "removed from the current roster; history retained",
 "กรุณารีเฟรชเพื่อใช้ระบบรายชื่อใหม่": "Refresh to use the updated roster system",
 "หน้าจอย้ายแล้ว แต่": "Moved on screen, but",
 "ยังบันทึกไม่สำเร็จ ระบบจะลองใหม่เมื่อเชื่อมต่อ:": "not saved yet. The system retries when connected:",
 "ย้ายตำแหน่งไว้ในเครื่องแล้ว แต่": "Position saved locally, but",
 "เข้าพื้นที่": "Area entry",
 "รายบุคคล / ตามตำแหน่ง": "Individual / By position",
 "ตามตำแหน่ง": "By position",
 "ตั้งต้นไม่สำเร็จ กรุณาเปิดหน้าใหม่เพื่อลองอีกครั้ง:": "starter creation failed. Reopen the page to retry:",
 "ปฏิบัติตาม WI, Control Plan และมาตรฐานคุณภาพ ความปลอดภัย และสิ่งแวดล้อม": "Follow the WI, Control Plan, quality, safety, and environmental standards.",
 "บันทึกผลการทำงานให้ถูกต้อง และแจ้งผู้บังคับบัญชาเมื่อพบความผิดปกติ": "Keep accurate records and report abnormalities to the supervisor.",
 "ร่วมกิจกรรม 5S, Kaizen และการฝึกอบรมที่เกี่ยวข้องกับหน้าที่": "Participate in 5S, Kaizen, and relevant training.",
 "วางแผนและบริหารกำลังคน เครื่องจักร งบประมาณ และกำลังการผลิต": "Plan and manage manpower, machines, budget, and production capacity.",
 "กำหนดและติดตาม KPI ด้านคุณภาพ ต้นทุน การส่งมอบ ประสิทธิภาพ และความปลอดภัย": "Set and monitor quality, cost, delivery, efficiency, and safety KPIs.",
 "ประสานงาน Planning, Quality, Warehouse และหน่วยงานสนับสนุนให้ผลิตได้ตามแผน": "Coordinate with Planning, Quality, Warehouse, and support functions to meet production plans.",
 "ทบทวนปัญหาหลัก อนุมัติแผนแก้ไข และติดตามประสิทธิผล": "Review major issues, approve corrective plans, and verify effectiveness.",
 "พัฒนาทีมงาน ประเมินผล และกำหนดแผนทดแทนบุคลากร": "Develop the team, assess performance, and plan succession.",
 "วิเคราะห์กระบวนการ Cycle Time, Capacity และปัญหาการผลิตเพื่อกำหนดแนวทางปรับปรุง": "Analyze processes, cycle time, capacity, and production problems to define improvements.",
 "จัดทำและปรับปรุง WI, ค่าตั้งเครื่อง และมาตรฐานการทำงานร่วมกับหน่วยงานที่เกี่ยวข้อง": "Develop and update WIs, machine settings, and work standards with relevant functions.",
 "ทดลองและยืนยันกระบวนการ ชิ้นงาน เครื่องมือ และการเปลี่ยนแปลงก่อนใช้งานจริง": "Trial and validate processes, parts, tools, and changes before implementation.",
 "วิเคราะห์สาเหตุของเสียและ Downtime และติดตามมาตรการป้องกันซ้ำ": "Analyze defects and downtime and follow up recurrence prevention measures.",
 "สนับสนุนการฝึกอบรมและประเมินทักษะพนักงาน": "Support employee training and skill assessments.",
 "ควบคุมแผนการผลิตประจำวันและจัดสรรกำลังคนตามความสามารถ": "Control daily production plans and allocate manpower based on competence.",
 "กำกับ Leader และทีมงานให้ผลิตตาม WI และ Control Plan": "Supervise leaders and teams to follow the WI and Control Plan.",
 "ติดตาม Output, KPI, ของเสีย และ Downtime พร้อมรายงานปัญหา": "Monitor output, KPIs, defects, and downtime and report issues.",
 "ควบคุมการเปลี่ยนรุ่น การส่งมอบระหว่างกะ และการตอบสนองความผิดปกติ": "Control changeovers, shift handovers, and abnormality response.",
 "ประเมินทักษะและวางแผนพัฒนาพนักงานร่วมกับ Leader": "Assess skills and plan employee development with leaders.",
 "จัดกะและกำหนดพนักงานประจำเครื่องตามแผนและ Skill Matrix": "Assign shifts and machine operators according to the plan and Skill Matrix.",
 "ตรวจความพร้อมคน เครื่องจักร เครื่องมือ และเอกสารก่อนเริ่มกะ": "Check manpower, machine, tool, and document readiness before the shift.",
 "ติดตามผลผลิตและคุณภาพระหว่างกะ พร้อมแจ้งปัญหาให้ Supervisor": "Monitor output and quality during the shift and report issues to the supervisor.",
 "สอนงานและตรวจยืนยันว่าพนักงานปฏิบัติตาม WI": "Coach employees and verify compliance with the WI.",
 "จัดทำข้อมูลส่งมอบกะและดูแลข้อมูลพนักงานในแผนกตามสิทธิ์": "Prepare shift handover records and maintain authorized employee data for the section.",
 "ตรวจสอบ บำรุงรักษา และซ่อมเครื่องจักรหรือแม่พิมพ์ตามความรับผิดชอบ": "Inspect, maintain, and repair assigned machines or dies.",
 "วิเคราะห์อาการเสียและแก้ไขภายใต้มาตรฐานความปลอดภัยและ LOTO": "Diagnose faults and repair safely according to safety and LOTO standards.",
 "ตั้งเครื่องหรือปรับเครื่องตามค่าที่อนุมัติ และตรวจยืนยันก่อนผลิต": "Set or adjust machines using approved parameters and verify before production.",
 "บันทึกงานซ่อม อะไหล่ Downtime และติดตามปัญหาซ้ำ": "Record repairs, spare parts, and downtime and follow up recurring faults.",
 "ตรวจความพร้อมเครื่องจักร วัตถุดิบ และชิ้นงานก่อนเริ่มผลิต": "Check machine, material, and part readiness before production.",
 "ผลิตหรือคัดแยกงานตาม WI, Control Plan และแผนการผลิต": "Produce or sort parts according to the WI, Control Plan, and production plan.",
 "ตรวจชิ้นแรกและตรวจระหว่างผลิตตามจุดตรวจและความถี่ที่กำหนด": "Perform first-piece and in-process checks at specified points and frequencies.",
 "แยกงาน OK/NG ระบุชิ้นงาน และหยุดแจ้งเมื่อพบความผิดปกติ": "Separate and identify OK/NG parts; stop and report abnormalities.",
 "บันทึกจำนวนผลิต ของเสีย Downtime และส่งมอบงานระหว่างกะ": "Record output, defects, and downtime and hand over work between shifts.",
 "ควบคุมเลขที่เอกสาร Revision การอนุมัติ และวันที่มีผล": "Control document numbers, revisions, approvals, and effective dates.",
 "แจกจ่ายเอกสารฉบับล่าสุดและเรียกคืนเอกสารล้าสมัย": "Distribute current documents and recall obsolete copies.",
 "จัดเก็บ WI, แบบฟอร์ม และบันทึกให้ค้นหาและสอบย้อนกลับได้": "Store WIs, forms, and records for retrieval and traceability.",
 "ติดตามการทบทวนเอกสารและสนับสนุนการตรวจประเมิน": "Follow up document reviews and support audits.",
 "จัดทำและปรับแผนการผลิตตามคำสั่งซื้อ วัตถุดิบ และ Capacity": "Prepare and adjust production plans based on orders, material availability, and capacity.",
 "ประสานงานกำลังคน เครื่องจักร และวัตถุดิบกับหน่วยงานที่เกี่ยวข้อง": "Coordinate manpower, machines, and materials with relevant functions.",
 "ติดตามความคืบหน้า WIP การส่งมอบ และงานคงค้าง": "Track progress, WIP, delivery, and backlog.",
 "รายงานความเสี่ยงการส่งมอบและปรับแผนเมื่อเกิดความผิดปกติ": "Report delivery risks and revise plans when abnormalities occur.",
 "รับ จัดเก็บ และจ่ายวัตถุดิบ ชิ้นงาน และอุปกรณ์ตามรายการที่อนุมัติ": "Receive, store, and issue materials, parts, and supplies against approved records.",
 "ควบคุมการบ่งชี้ Lot, FIFO และตำแหน่งจัดเก็บ": "Control lot identification, FIFO, and storage locations.",
 "บันทึกยอดรับจ่ายและตรวจนับสต๊อกให้ตรงกับข้อมูล": "Record receipts and issues and reconcile stock counts.",
 "ป้องกันชิ้นงานปะปน เสียหาย และสนับสนุนการส่งมอบให้การผลิต": "Prevent mixing or damage and support timely delivery to production.",
 "ดำเนินงานตามขอบเขตตำแหน่งและแผนงานของแผนก": "Perform work within the position scope and section plan.",
 "ประสานงานกับหน่วยงานที่เกี่ยวข้องและติดตามงานที่ได้รับมอบหมาย": "Coordinate with relevant functions and follow up assigned work.",
 "ปรับปรุงขั้นตอนการทำงานและรักษาคุณภาพของข้อมูลหรือผลงาน": "Improve work procedures and maintain the quality of data or output.",
 "ออกแบบ ปรับปรุง และตรวจยืนยันแม่พิมพ์/เครื่องมือ รวมถึงอายุการใช้งานและอะไหล่": "Design, improve, and validate dies/tools, including service life and spare parts.",
 "กำหนดและยืนยันพารามิเตอร์การเชื่อม คุณภาพรอยเชื่อม และแผนควบคุมกระบวนการ": "Define and validate welding parameters, weld quality, and process controls.",
 "ผู้บริหารโรงงาน": "Plant Management",
 "ประสบการณ์บริหารการผลิตและทีมงาน; ทักษะวางแผน วิเคราะห์ KPI และแก้ปัญหา": "Production and team management experience; planning, KPI analysis, and problem-solving skills.",
 "ผู้จัดการ": "Manager",
 "ความรู้วิศวกรรมที่เกี่ยวข้อง; อ่าน Drawing และวิเคราะห์กระบวนการได้": "Relevant engineering knowledge; ability to read drawings and analyze processes.",
 "ผู้จัดการหรือวิศวกร": "Manager or Engineer",
 "ประสบการณ์ควบคุมการผลิต; ภาวะผู้นำและทักษะแก้ปัญหาหน้างาน": "Production supervision experience; leadership and shop-floor problem-solving skills.",
 "หัวหน้างาน": "Supervisor",
 "เข้าใจกระบวนการของแผนก; สื่อสาร จัดคน และสอนงานได้": "Understand section processes; able to communicate, assign manpower, and coach.",
 "หัวหน้างานหรือวิศวกร": "Supervisor or Engineer",
 "ความรู้เครื่องจักรหรือแม่พิมพ์ที่เกี่ยวข้อง; ใช้เครื่องมือและอ่านเอกสารเทคนิคได้": "Relevant machine or die knowledge; able to use tools and read technical documents.",
 "หัวหน้าทีม": "Leader",
 "ผ่านการฝึกอบรมและประเมินทักษะของงานที่ได้รับมอบหมาย": "Trained and assessed as competent for assigned work.",
 "เข้าใจการควบคุมเอกสารและใช้โปรแกรมสำนักงานได้": "Understand document control and use office software.",
 "ทักษะวางแผน วิเคราะห์ข้อมูล และประสานงาน": "Planning, data analysis, and coordination skills.",
 "หัวหน้างานหรือผู้จัดการ": "Supervisor or Manager",
 "เข้าใจการควบคุมสต๊อก FIFO และการบ่งชี้ชิ้นงาน": "Understand inventory control, FIFO, and part identification.",
 "ผู้บังคับบัญชาตามโครงสร้างองค์กร": "Supervisor in the organization structure",
 "ความรู้และทักษะที่เหมาะกับงานในตำแหน่งนี้ — กรุณาปรับรายละเอียด": "Relevant knowledge and skills for this position — please customize.",
 "กำหนดเป้าหมายและแผนงานของหน่วยงาน": "Set department objectives and operating plans",
 "บริหารกำลังคน งบประมาณ และทรัพยากร": "Manage staffing, budget and resources",
 "ติดตาม KPI คุณภาพ ต้นทุน การส่งมอบ และความปลอดภัย": "Review quality, cost, delivery and safety KPIs",
 "พัฒนาทีมและติดตามการแก้ไขปัญหาข้ามหน่วยงาน": "Develop the team and follow up cross-functional corrective actions",
 "ทักษะบริหารทีม วางแผน วิเคราะห์ข้อมูล และตัดสินใจ": "Team management, planning, data analysis and decision-making",
 "ควบคุมการปฏิบัติงานให้เป็นไปตามแผนของหน่วยงาน": "Supervise operations against the department plan",
 "จัดสรรกำลังคนและติดตามผลแต่ละกะ": "Allocate staff and monitor each shift",
 "ตรวจติดตามมาตรฐานงานและแก้ไขปัญหาหน้างาน": "Verify work standards and resolve operational issues",
 "ประเมินทักษะและวางแผนฝึกอบรมพนักงาน": "Assess skills and plan employee training",
 "ทักษะควบคุมงาน บริหารคน และวิเคราะห์ปัญหา": "Supervision, people management and problem analysis",
 "วิเคราะห์และปรับปรุงกระบวนการในหน่วยงาน": "Analyze and improve department processes",
 "จัดทำและทบทวนมาตรฐานงานและข้อมูลทางเทคนิค": "Prepare and review work standards and technical data",
 "วิเคราะห์สาเหตุปัญหาและยืนยันผลการแก้ไข": "Analyze root causes and verify corrective actions",
 "สนับสนุนการทดลองงาน การเปลี่ยนแปลง และฝึกอบรม": "Support trials, changes and technical training",
 "ความรู้ทางวิศวกรรมที่เกี่ยวข้อง การวิเคราะห์ข้อมูล และการแก้ไขปัญหา": "Relevant engineering knowledge, data analysis and problem-solving",
 "มอบหมายงานและตรวจความพร้อมก่อนเริ่มกะ": "Assign work and verify shift readiness",
 "ติดตามผลผลิต คุณภาพ และความผิดปกติระหว่างกะ": "Monitor output, quality and abnormalities during the shift",
 "สอนงานและตรวจการปฏิบัติตาม WI": "Coach employees and verify WI compliance",
 "ส่งมอบงานระหว่างกะและรายงานปัญหาต่อผู้บังคับบัญชา": "Complete shift handover and escalate issues",
 "ทักษะหน้างาน การสอนงาน และการประสานงาน": "Operational skills, coaching and coordination",
 "ตรวจเช็ค ตั้งค่า และดูแลอุปกรณ์ตามงานที่ได้รับมอบหมาย": "Inspect, set up and maintain assigned equipment",
 "วิเคราะห์และแก้ไขความผิดปกติตามขอบเขตที่ได้รับอนุญาต": "Diagnose and correct faults within authorized scope",
 "บันทึกการซ่อม การตั้งค่า และผลการตรวจสอบ": "Record repairs, settings and inspection results",
 "ตรวจยืนยันความพร้อมและความปลอดภัยก่อนส่งมอบ": "Verify readiness and safety before handover",
 "ทักษะเครื่องมือ งานเทคนิค และความปลอดภัยของอุปกรณ์": "Tool use, technical work and equipment safety",
 "ปฏิบัติงานตามหน้าที่ที่ได้รับมอบหมายและมาตรฐานที่อนุมัติ": "Perform assigned duties according to approved standards",
 "ตรวจความพร้อมของงาน อุปกรณ์ และเอกสารก่อนเริ่มงาน": "Check work, equipment and document readiness",
 "ตรวจสอบและบันทึกผลการทำงานให้ครบถ้วน": "Check and accurately record work results",
 "รายงานความผิดปกติและปฏิบัติตามขั้นตอนการแก้ไข": "Report abnormalities and follow the response procedure",
 "ความรู้ในงานที่รับผิดชอบ การใช้เครื่องมือ และการบันทึกข้อมูล": "Job knowledge, tool use and accurate recordkeeping",
 "ปฏิบัติตามข้อกำหนดความปลอดภัย คุณภาพ และ 5ส ที่เกี่ยวข้อง": "Follow applicable safety, quality and 5S requirements",
 "ฉบับร่างตั้งต้น โปรดทบทวนให้ตรงกับงานจริงก่อนอนุมัติ": "Starter draft: review against actual duties before approval",
 "ระบุวุฒิ ประสบการณ์ และการฝึกอบรมตามความจำเป็นของตำแหน่ง": "Specify education, experience and training required for this role"
});
 Object.assign(dictionary,{
 "เครื่องปั๊ม — จุดอันตรายของ": "Stamping machine — hazards of",
 "และวิธีหยุดเครื่องฉุกเฉิน": "and emergency stopping procedures",
 "งานปั๊ม — ลำดับการทำงาน จุดตรวจสำคัญ ความถี่ตรวจ และค่ามาตรฐานของ": "Stamping — work sequence, key inspection points, frequency, and standard values for",
 "การตั้งเครื่องและ": "Machine setup and",
 "และค่าที่อนุญาตก่อนเริ่มผลิต": "and approved settings before production",
 "ตรวจชิ้นแรกตาม": "Inspect the first piece against",
 "บันทึกผล และรออนุมัติก่อนผลิตต่อ": "Record results and wait for approval before continuing production",
 "งานปั๊ม — วิธีแยก": "Stamping — how to segregate",
 "งานเชื่อม — อันตรายจากไฟฟ้า สะเก็ดไฟ ความร้อน ควันเชื่อม": "Welding — electrical, spark, heat, and fume hazards",
 "และเงื่อนไขก่อนเริ่มงาน": "and conditions before starting work",
 "การตรวจจุดเชื่อม — ตำแหน่งและจำนวนจุดเชื่อม ลักษณะรอยเชื่อม และ": "Weld inspection — location, number, appearance, and",
 "การตรวจสภาพหัวเชื่อม การเจียร การเปลี่ยน และการบันทึกอายุการใช้งาน": "Electrode inspection, dressing, replacement, and service-life records",
 "และวิธีกักงาน": "and containment procedures",
 "การจัดโต๊ะ แสงสว่าง": "Workstation layout and lighting",
 "และการป้องกัน": "and prevention of",
 "ตำแหน่งตรวจ วิธีจับชิ้นงาน ระยะมอง และลำดับการตรวจครบทุกจุด": "Inspection locations, part handling, viewing distance, and complete inspection sequence",
 "และงานประกอบผิด": "and incorrect assembly",
 "เลือกและใช้เครื่องมือวัดให้เหมาะกับจุดตรวจ พร้อมตรวจ": "Select and use suitable measuring equipment; verify",
 "ก่อนใช้งาน": "before use",
 "จำนวนบรรจุ และป้องกัน": "packing quantities, and prevention of",
 "ต่างรุ่นปะปน": "mixed models",
 "ตัดแยกพลังงาน ล็อกแหล่งพลังงาน ทดสอบ": "Isolate and lock energy sources, test",
 "และคืนเครื่องอย่างปลอดภัย": "and safely return the machine to service",
 "จุดตรวจรายวัน/เดือน วิธีตรวจสภาพ และเกณฑ์ตัดสินก่อนเกิด": "Daily/monthly inspection points, condition checks, and criteria before",
 "รับแจ้ง วิเคราะห์อาการ แยกสาเหตุ ซ่อม ทดสอบ และส่งมอบเครื่อง": "Receive reports, diagnose faults, identify causes, repair, test, and hand over equipment",
 "อ่านวงจร ตรวจ": "Read circuits, check",
 "และใช้อุปกรณ์วัดอย่างปลอดภัย": "and use measuring equipment safely",
 "และความแน่นของอุปกรณ์": "and secure fastening of equipment",
 "งานแม่พิมพ์ — การยกเคลื่อนย้าย การค้ำยัน จุดหนีบคม และการใช้เครื่องมืออย่างปลอดภัย": "Tooling — lifting, transport, support, pinch/sharp-edge hazards, and safe tool use",
 "และบันทึกจำนวน": "and record the quantity",
 "และการซ่อม — วิเคราะห์": "and repair — analyze",
 "ที่สัมพันธ์กับแม่พิมพ์ ซ่อม ประกอบ ทดลอง และยืนยันชิ้นงาน": "related to the die; repair, assemble, trial, and validate parts",
 "และตั้ง": "and set",
 "ให้ตรงมาตรฐาน": "to meet the standard",
 "อายุใช้งาน และการเบิกคืนให้สอบย้อนกลับได้": "service life and traceable issue/return records",
 "และข้อกำหนดกระบวนการ — ประเมินความเสี่ยงและกำหนด": "and process requirements — assess risks and define",
 "ให้สอดคล้อง": "consistently",
 "และกำหนด": "and define",
 "เพื่อวางแผนปรับปรุงที่วัดผลได้": "to plan measurable improvements",
 "จัดทำเนื้อหา สาธิต ประเมินความเข้าใจ และติดตามผลหลังอบรม": "Prepare content, demonstrate, assess understanding, and follow up after training",
 "และการประสานงาน — ข้อควรระวังในการสนับสนุนหน้างานและช่องทางแจ้งเหตุผิดปกติ": "and coordination — precautions for operational support and abnormality reporting channels",
 "จัดลำดับผลิต ตรวจ": "Sequence production, check",
 "และติดตาม": "and monitor",
 "จำนวน และป้องกัน": "quantities, and prevent",
 "หรือปะปน": "or mixing",
 "บันทึกรับ-จ่าย ผลผลิต": "Record receipts, issues, output",
 "ใช้เอกสาร": "Use documents",
 "จุดหมุน เศษโลหะ ประตูนิรภัย": "Rotating parts, metal chips, safety doors",
 "และใช้": "and use",
 "ตามจุดตรวจ": "at the inspection points",
 "และวิธีหยุด/กักงาน": "and stopping/containment procedures",
 "จุดหมุน จุดหนีบ เศษโลหะ การใช้": "Rotating parts, pinch points, metal chips, and use of",
 "ให้ตรง": "to match",
 "ตรวจความลึก ตำแหน่ง และเกลียวเสีย": "Check depth, position, and defective threads",
 "การควบคุมอายุ": "Service-life control",
 "กำหนดจำนวนใช้งาน ตรวจการสึก และเปลี่ยนก่อนเกิด": "Set usage limits, check wear, and replace before",
 "เกลียวไม่เต็ม เกลียวหวาน": "Incomplete or stripped threads",
 "หัก รูเอียง และวิธีกักงาน": "breakage, tilted holes, and containment procedures",
 "จุดหนีบ การวางมือ": "Pinch points and hand positioning",
 "และการตั้งเครื่อง — เลือก": "and machine setup — select",
 "อ่านมุม ระยะ ความสูง และใช้": "Read angles, distances, heights, and use",
 "มุมผิด ระยะผิด": "Incorrect angles or distances",
 "อันตรายของพื้นที่": "Area hazards",
 "จุดฉุกเฉิน และช่องทางแจ้งเหตุ": "Emergency points and reporting channels",
 "ลำดับงาน เงื่อนไขสำคัญ และข้อห้ามของตำแหน่ง": "Work sequence, key conditions, and role-specific prohibitions",
 "ตัวอย่างมาตรฐาน และการกักงาน": "Reference samples and containment",
 "แยกของ จัดวาง ทำความสะอาด รักษามาตรฐาน และสร้างวินัย": "Sort, set in order, clean, standardize, and sustain",
 "ประจำพื้นที่ — รู้จุดอันตราย จุดหนีบ/จุดหมุน แหล่งพลังงาน เส้นทางหนีไฟ และปุ่ม": "for the area — identify hazards, pinch/rotating points, energy sources, escape routes, and buttons",
 "ประจำงาน — เลือก สวม ตรวจสภาพ และเปลี่ยน": "for the job — select, wear, inspect, and replace",
 "ให้เหมาะกับความเสี่ยงของงาน": "according to job risks",
 "อ่านเอกสาร": "Read documents",
 "ล่าสุด เข้าใจลำดับงาน เงื่อนไขควบคุม และข้อห้าม": "in the latest revision; understand the work sequence, controls, and prohibitions",
 "ระบุจุดตรวจ วิธีตรวจ ความถี่": "Identify inspection points, methods, and frequency",
 "ที่รับผิดชอบ": "under your responsibility",
 "แยกสิ่งของ จัดตำแหน่ง ทำความสะอาด ตรวจมาตรฐาน และรักษาวินัยประจำพื้นที่": "Sort, organize, clean, check standards, and maintain area discipline",
 "เมื่อพบเครื่อง/": "When a machine or",
 "ชิ้นงานผิดปกติ ให้หยุด แยก แจ้ง และบันทึกก่อนเริ่มงานต่อ": "part is abnormal, stop, segregate, report, and record before restarting",
 "ฝึกเริ่มงาน ผลิต ตรวจ บันทึก และจบงานตามขั้นตอนโดยมีผู้สอนประเมิน": "Practice startup, production, inspection, recording, and shutdown under trainer assessment",
 "และตำแหน่งอุปกรณ์ฉุกเฉิน": "and emergency equipment locations",
 "และปฏิบัติงานพื้นฐานถูกต้องทุก": "and perform all basic operations correctly",
 "และสภาพพื้นที่ก่อนเปิดงาน": "and area conditions before starting work",
 "บันทึกผล และขออนุมัติก่อนผลิตต่อ": "Record results and request approval before continuing production",
 "ฝึกเปรียบเทียบของจริง อธิบายสาเหตุ และตัดสินงานตาม": "Practice comparing actual parts, explaining causes, and judging parts against",
 "หยุดผลิต แยกกัก ติดป้าย ระบุ": "Stop production, contain, label, and identify",
 "จำนวน แจ้งหัวหน้า และป้องกันงานหลุด": "the quantity; notify the leader and prevent escapes",
 "และจุดควบคุมที่ห้ามเปลี่ยนเอง รวมถึง": "and controls that must not be changed without authorization, including",
 "เมื่อค่าเกินมาตรฐาน": "when values exceed the standard",
 "ขั้นตอนกักและรายงาน": "Containment and reporting procedures",
 "กับเครื่อง/กระบวนการจริง + ฝึกตัดสิน": "on actual machines/processes, plus judgment practice",
 "ตั้งงาน/ตรวจ": "Set up / inspect",
 "ตามหน้าที่ได้": "within assigned duties",
 "แยกและควบคุม": "Segregate and control",
 "เลือกเครื่องมือวัดให้ตรงจุด ตรวจ": "Select suitable measuring equipment and check",
 "ทำความสะอาด จับวัด และอ่านค่าอย่างถูกต้อง": "Clean, position, measure, and read correctly",
 "ที่ใช้กับ": "used with",
 "วัดตามลำดับและตำแหน่งใน": "Measure in the sequence and locations specified in",
 "พร้อมควบคุมแรงวัดและสภาพชิ้นงาน": "while controlling measuring force and part condition",
 "และผู้ตรวจให้ครบ ห้ามบันทึกย้อนหลังโดยไม่มีเหตุผล": "and inspector details; do not backdate records without justification",
 "เชื่อมโยง": "Link",
 "หยุดงาน กักตั้งแต่": "Stop work and contain from",
 "แจ้งผู้เกี่ยวข้อง ตรวจยืนยัน และบันทึกผลการจัดการ": "Notify relevant personnel, verify, and record the disposition",
 "วิธีวัดตาม": "Measurement method according to",
 "เมื่อค่าตรวจเกินมาตรฐาน": "when measurements exceed the standard",
 "สาธิต 1 ชั่วโมง + ฝึกวัดชิ้นงานจริงอย่างน้อย 5 ชิ้น + ฝึกอ่าน": "1-hour demonstration, measurement practice on at least 5 actual parts, and reading practice for",
 "ผลวัดตรงกับ": "Measurements agree with",
 "บันทึกและสอบย้อนกลับได้ครบถ้วน": "Complete records and traceability",
 "ศึกษาปัญหาจริง ผลกระทบ จุดที่ควรตรวจพบ และข้อกำหนดใหม่หลังแก้ไข": "Study actual problems, impacts, detection points, and revised requirements",
 "แยกอาการกับสาเหตุ ใช้ 5": "Separate symptoms from causes using 5",
 "และตรวจหลักฐานก่อนสรุป": "and verify evidence before concluding",
 "กำหนดวิธีแก้ ผู้รับผิดชอบ กำหนดเสร็จ และวิธีตรวจประสิทธิผลเพื่อป้องกันซ้ำ": "Define corrective actions, owners, due dates, and effectiveness checks to prevent recurrence",
 "ฝึกตอบสนองไฟไหม้ อุบัติเหตุ เครื่องเสีย สารเคมีรั่ว หรือ": "Practice responses to fire, accidents, breakdowns, chemical spills, or",
 "เปรียบเทียบทักษะปัจจุบันกับเป้าหมาย ระบุ": "Compare current skills against targets; identify",
 "และแผน": "and plans",
 "แชร์ปัญหาและวิธีป้องกันให้พนักงานใน": "Share problems and prevention methods with employees in",
 "นำไปใช้กับงานคล้ายกัน": "for application to similar work",
 "และภาคปฏิบัติผ่าน": "and pass the practical assessment",
 "มีผลประเมินและแผนพัฒนาปีถัดไป": "Have assessment results and a development plan for the next year",
 "ต้องมีขนาดไม่เกิน 1.5": "must not exceed 1.5",
 "อ่านไฟล์": "Read file",
 "กดดูรายละเอียด": "View details",
 "ไม่ต้องเพิ่มเอง และจะไม่ถูกตัดขาดงาน/ไม่หัก": "No manual entry required; no automatic absence or deduction of",
 "หากไม่มีการเช็คชื่อ หากมี": "when there is no check-in. If there is",
 "วันอาทิตย์และพนักงานเช็คชื่อ ระบบยังเก็บ": "on Sunday and the employee checks in, the system still records",
 "ได้ตามปกติ ส่วนวันหยุดโรงงานเพิ่มเติมให้เพิ่มด้านล่าง": "as usual. Add other factory holidays below",
 "ไม่สามารถเปิดหน้าจัดการอื่น เปลี่ยน": "Cannot open other management pages or change",
 "ไฟล์เวอร์ชันใหม่กลับเข้ามา และยังสำรองเพิ่มใน": "a new file version, with an additional backup in",
 "ตรวจชิ้นงานปั๊ม แม่พิมพ์ และอุปกรณ์ป้องกันตาม WI": "Check stamped parts, dies and safeguards per WI",
 "ควบคุมงานเชื่อม จิ๊ก และตรวจแนวเชื่อมตามมาตรฐาน": "Control welding work, fixtures and weld inspection",
 "ตรวจโปรแกรม เครื่องมือตัด และขนาดชิ้นงานตามมาตรฐาน": "Verify programs, cutting tools and part dimensions",
 "ตรวจเครื่องมือต๊าปและคุณภาพเกลียวตามมาตรฐาน": "Check tapping tools and thread quality",
 "ตรวจการตั้งงาน มุมพับ และขนาดชิ้นงาน": "Check bending setup, angles and dimensions",
 "ตรวจและคัดแยกชิ้นงานตามเกณฑ์ พร้อมระบุและแยกงาน NG": "Inspect and sort parts against criteria; identify and segregate NG parts",
 "ดำเนินงานบำรุงรักษาตามแผนและบันทึกประวัติอุปกรณ์": "Perform planned maintenance and record equipment history",
 "ตรวจรับ จัดเก็บ และเบิกจ่ายโดยรักษาการสอบกลับของสินค้า": "Receive, store and issue goods with traceability",
 "ติดตามแผนงาน กำลังการผลิต และความพร้อมของวัสดุ": "Track schedules, capacity and material availability",
 "ติดตามความต้องการจัดซื้อและกำหนดส่งมอบกับผู้ขาย": "Track purchase requirements and supplier delivery dates",
 "ดูแลข้อมูลบุคลากรและประสานงานตามขั้นตอนของหน่วยงาน": "Maintain personnel data and coordinate department procedures"
});
 Object.assign(dictionary,{'ฝ่ายผลิต — ดูแล 7 แผนก':'Production Division — supervises 7 sections'});
 Object.assign(dictionary,{'การแสดงทีม':'Team view','รวมทีม':'Combined teams','แยกทีม A / ทีม B':'Separate Team A / Team B','พนักงานส่วนกลางของแผนก':'Shared section staff','ยังไม่ระบุทีม':'Team not assigned','ไม่มีพนักงานในทีมนี้':'No employees in this team'});
 Object.assign(dictionary,{'ลากการ์ดพนักงานไปทีม A หรือทีม B หรือแตะย้ายทีมแล้วเลือกทีมปลายทาง':'Drag an employee to Team A or Team B, or tap Move team and select a team','ย้ายทีม':'Move team','เลือกทีม A หรือทีม B ที่ต้องการย้าย':'Select Team A or Team B as the destination','กำลังบันทึกทีม...':'Saving team...','บันทึกทีมในเครื่องแล้ว • รอซิงก์ Firebase':'Team saved on this device • Waiting for Firebase sync','ย้ายทีมและบันทึกเรียบร้อยแล้ว':'Team moved and saved','พนักงานอยู่ในทีมนี้แล้ว':'Employee is already in this team','ลากพนักงานมาที่นี่เพื่อยกเลิกทีม':'Drop an employee here to remove the team assignment'});
 Object.assign(dictionary,{'แบ่งทีม A / ทีม B':'Assign Team A / Team B','ลากพนักงานจากผังองค์กรด้านบนไปทีม A หรือทีม B หรือแตะย้ายทีมแล้วเลือกทีมปลายทาง':'Drag an employee from the organization chart above to Team A or Team B, or tap Move team and select a team','รายชื่อในผังองค์กรจะยังอยู่ครบ และพิมพ์เฉพาะผังองค์กรด้านบน':'Every employee stays in the organization chart. Printing includes the organization chart above.'});
 Object.assign(dictionary,{'กรุณากำหนดกลุ่ม Sorting 1 หรือ Sorting 2 ให้พนักงานก่อนแบ่งทีม':'Assign the employee to Sorting 1 or Sorting 2 before assigning a team','กรุณาเลือกทีมภายในกลุ่ม Sorting เดียวกัน':'Select a team within the same Sorting group','กลุ่ม Sorting ของพนักงานเปลี่ยนแล้ว กรุณาโหลดรายชื่อใหม่':'The employee’s Sorting group has changed. Reload the roster.'});
 Object.assign(dictionary,{'ซัพคอนแทรค':'Subcontractor','รูปแบบผัง':'Chart view','ผังตามแผนก':'By department','ผังสายบังคับบัญชา':'Reporting hierarchy','แก้โครงสร้างผัง':'Edit chart structure','เพิ่มตำแหน่ง':'Add position','แก้ตำแหน่ง':'Edit position','จัดลำดับ':'Arrange hierarchy','เหนือ':'Above','ใต้':'Below','อยู่เหนือ':'Place above','อยู่ใต้':'Place below','ระดับบนสุด':'Top level','ใช้ลำดับตามตำแหน่ง':'Use the position hierarchy','จัดลำดับในผังองค์กร':'Arrange the organization chart','ชื่อตำแหน่ง':'Position name','เพิ่มตำแหน่งในรายการ':'Add to the position list','บันทึกตำแหน่ง':'Save position','ลากพนักงานไปช่องเหนือหรือใต้ของอีกคน หรือกดจัดลำดับ':'Drag an employee to another person’s Above or Below zone, or select Arrange hierarchy','บันทึกในเครื่องแล้ว รอซิงก์':'Saved on this device. Waiting to sync.','บันทึกโครงสร้างเรียบร้อยแล้ว':'Organization structure saved','ไม่สามารถจัดลำดับนี้ได้ เพราะสายบังคับบัญชาจะวนกลับหากัน':'This change would create a cycle in the reporting hierarchy','ไม่สามารถให้พนักงานอยู่ใต้หรือเหนือชื่อของตนเอง':'An employee cannot be placed above or below themselves','กรุณาเลือกลำดับผู้บังคับบัญชา':'Select the reporting relationship','ไม่พบพนักงานในฝ่ายและโรงงานที่เลือก กรุณาโหลดรายชื่อใหม่':'The employee is unavailable in this division and factory. Reload the roster.','ฝ่ายหรือโรงงานเปลี่ยนแล้ว กรุณาเลือกพนักงานใหม่':'The division or factory has changed. Select the employee again.','ฝ่ายหรือโรงงานเปลี่ยนแล้ว กรุณาเลือกใหม่':'The division or factory has changed. Select again.','กรุณาระบุชื่อตำแหน่งไม่เกิน 100 ตัวอักษร':'Enter a position name of up to 100 characters','มีชื่อตำแหน่งนี้แล้ว':'This position name already exists','ตำแหน่ง Supervisor Production ใช้ในฝ่ายผลิตเท่านั้น':'Supervisor Production belongs to the Production Division'});
 Object.assign(dictionary,{'พนักงานซัพคอนแทรค':'Subcontractor employees','ทีมลอยเช้า':'Morning Floating Team','จัดทีม A / ทีม B / ทีมลอยเช้า':'Assign Team A / Team B / Morning Floating Team','ดูผังองค์กรอย่างเดียว':'Organization chart only','ลากพนักงานจากผังองค์กรด้านบนไปทีม A ทีม B หรือทีมลอยเช้า หรือแตะย้ายทีมแล้วเลือกทีมปลายทาง':'Drag an employee from the organization chart above to Team A, Team B or the Morning Floating Team, or tap Move team and select a team','เลือกทีม A ทีม B หรือทีมลอยเช้าที่ต้องการย้าย':'Select Team A, Team B or the Morning Floating Team as the destination','กรุณาเลือกทีม A ทีม B หรือทีมลอยเช้า':'Select Team A, Team B or the Morning Floating Team'});
 Object.assign(dictionary,{'เพิ่มแผนกไว้ในเครื่องแล้ว • ระบบจะซิงก์ให้อัตโนมัติ':'Section added on this device • The system will sync automatically','บันทึกแผนกในเครื่องแล้ว • รอซิงก์':'Section saved on this device • Waiting to sync','เพิ่มแผนกและซิงก์เรียบร้อยแล้ว':'Section added and synced','ระบบจะซิงก์ให้อัตโนมัติ':'The system will sync automatically','ไว้ในเครื่องแล้ว':'saved on this device','มีการแก้ไขพร้อมกัน ระบบจะลองซิงก์อีกครั้ง':'Another editor made a change. The system will retry syncing.'});
 const englishUI={
  'Admin Login':'เข้าสู่ระบบผู้ดูแล','Logout':'ออกจากระบบ','Login':'เข้าสู่ระบบ','Sign in':'เข้าสู่ระบบ',
  'Attendance':'เช็คชื่อ','Examination':'ระบบสอบ','Attendance & KPI':'เช็คชื่อและ KPI',
  'Factory Layout':'ผังโรงงาน','Organization Chart':'ผังองค์กร','Section View':'ข้อมูลแผนก',
  'Section Organization Chart':'ผังองค์กรแยกแผนก','Add Employee':'เพิ่มพนักงาน','Search Employee':'ค้นหาพนักงาน',
  'Examination Plan':'แผนการสอบ','Section Skill Matrix':'ตารางทักษะแยกแผนก',
  'Employee Skill Card':'การ์ดทักษะพนักงาน','NG Dashboard':'ประวัติการขาดลามาสายและงานเสีย','Examination History':'ประวัติการสอบ',
  'User Management':'จัดการผู้ใช้งาน','Export Center':'สำรองและส่งออกข้อมูล',
  'Manager':'ผู้จัดการ','Engineer':'วิศวกร','Supervisor':'หัวหน้างาน','Supervisor Production':'หัวหน้างานฝ่ายผลิต','Leader':'หัวหน้าทีม',
  'Technician':'ช่างเทคนิค','Operator':'พนักงานปฏิบัติการ','Other':'อื่น ๆ',
  'Production Division':'ฝ่ายผลิต','Quality Division':'ฝ่ายคุณภาพ','Warehouse Division':'ฝ่ายคลังสินค้า',
  'Corporate Administration Division':'ฝ่ายบริหารองค์กร','Business Operations Division':'ฝ่ายดำเนินธุรกิจ',
  'Permanent':'พนักงานประจำ','Subcontractor':'พนักงานรับเหมาช่วง','Day Shift':'กะเช้า','Night Shift':'กะดึก',
  'Support':'ซัพพอร์ต','Spare':'สำรอง','Team A':'ทีม A','Team B':'ทีม B','Morning Floating Team':'ทีมลอยเช้า',
  'Basic Knowledge':'ความรู้พื้นฐาน','Basic Operation':'การปฏิบัติงานพื้นฐาน',
  'Independent Operation':'ปฏิบัติงานได้ด้วยตนเอง','Advanced Skill':'ทักษะขั้นสูง',
  'Expert / Trainer':'ผู้เชี่ยวชาญ / ผู้ฝึกสอน','Score':'คะแนน','Level':'ระดับ','Acceptance':'ผลประเมิน',
  'Last Update':'อัปเดตล่าสุด','Next Update':'อัปเดตครั้งถัดไป','No.':'ลำดับ','Name':'ชื่อ',
  'Position':'ตำแหน่ง','Section':'แผนก','Division':'ฝ่าย','Start Date':'วันที่เริ่มงาน',
  'Length of Service':'อายุงาน','Emp.ID':'รหัสพนักงาน','Employee ID':'รหัสพนักงาน',
  'Status':'สถานะ','Date':'วันที่','Time':'เวลา','Month':'เดือน','Year':'ปี',
  'Username':'ชื่อผู้ใช้','Password':'รหัสผ่าน','Role':'สิทธิ์','Actions':'จัดการ',
  'Print':'พิมพ์','Download':'ดาวน์โหลด','Save':'บันทึก','Cancel':'ยกเลิก','Close':'ปิด',
  'Delete':'ลบ','Edit':'แก้ไข','Add':'เพิ่ม','Search':'ค้นหา','All':'ทั้งหมด','Total':'รวม',
  'Passed':'ผ่าน','Failed':'ไม่ผ่าน','Pending':'รอตรวจ','Present':'มาทำงาน','Absent':'ขาดงาน',
  'Late':'มาสาย','Leave':'ลา','Holiday':'วันหยุด','Sick Leave':'ลาป่วย','Business Leave':'ลากิจ',
  'Summary':'สรุป','KPI Summary':'สรุป KPI','Production KPI':'KPI การผลิต',
  'Front':'ด้านหน้า','Back':'ด้านหลัง','Landscape':'แนวนอน','Portrait':'แนวตั้ง',
  'Photo':'รูป','Employee':'พนักงาน','Employees':'พนักงาน','Department':'แผนก','Notes':'หมายเหตุ',
  'Job Description':'รายละเอียดงาน','Individual Job Description':'รายละเอียดงานรายบุคคล',
  'Document No.':'เลขที่เอกสาร','Effective Date':'วันที่มีผล','Revision':'ฉบับแก้ไข',
  'Responsibilities':'หน้าที่และความรับผิดชอบ','Qualifications':'คุณสมบัติ','Required Skills':'ทักษะที่จำเป็น',
  'Reports to':'รายงานต่อ','Evaluator':'ผู้ประเมิน','Assessment Date':'วันที่ประเมิน',
  'Factory Organization Chart':'ผังโรงงาน','FACTORY ORGANIZATION CHART':'ผังโรงงาน',
  'FACTORY ORGANIZATION':'โครงสร้างองค์กรโรงงาน','Organization':'องค์กร',
  'Basic':'พื้นฐาน','Advanced':'ขั้นสูง','Expert':'ผู้เชี่ยวชาญ','Trainer':'ผู้ฝึกสอน',
  'Import':'นำเข้า','Export':'ส่งออก','Backup':'สำรองข้อมูล','Reset':'รีเซ็ต','Settings':'ตั้งค่า',
  'OK':'ตกลง','Type':'ประเภท','Details':'รายละเอียด','Result':'ผล','Question':'คำถาม','Answer':'คำตอบ',
  'Safety':'ความปลอดภัย','Quality':'คุณภาพ','Production':'การผลิต','Machine':'เครื่องจักร',
  'Machine No.':'หมายเลขเครื่อง','Capacity':'กำลังการผลิต','Target':'เป้าหมาย','Actual':'ผลจริง',
  'Good Qty':'จำนวนชิ้นดี','Downtime':'เวลาหยุดเครื่อง','Total Score':'คะแนนรวม',
  'Prepared by':'ผู้จัดทำ','Reviewed by':'ผู้ตรวจสอบ','Approved by':'ผู้อนุมัติ'
 };
 Object.assign(dictionary,{'ใช้เอกสารหน้างานและตรวจ Revision ได้; บันทึกข้อมูลและจัดเก็บเอกสารเป็นระบบ; ใช้โปรแกรมสำนักงานพื้นฐานได้ และประสานงานกับผู้บันทึกหรือหัวหน้าทีมได้':'Able to check shop-floor documents and revisions, record and organize data, use basic office software, and coordinate record authors or leaders.'});
 Object.assign(dictionary,{'ประวัติการขาดลามาสายและงานเสีย':'Attendance and Defect History','ยอดสะสมจากประวัติที่บันทึกถึงวันที่':'Cumulative history through','ลารวมลากิจและลาป่วย':'Leave includes personal and sick leave','ใบเหลืองสะสม':'Accumulated yellow cards','เหตุการณ์งานเสียทั้งหมด':'Total defect incidents','สรุปประวัติพนักงาน':'Employee history summary','คลิกเพื่อดูประวัติการขาดลามาสายและงานเสีย':'Click to view attendance and defect history'});
 Object.assign(dictionary,{'บันทึก JD ในเครื่องได้ · จะซิงก์เมื่อเชื่อมต่อ':'JD can be saved on this device and synced when connected','กำลังบันทึก JD ในเครื่อง...':'Saving JD on this device...','บันทึก JD ในเครื่องแล้ว · รอซิงก์เมื่อเชื่อมต่อ':'JD saved on this device · Waiting to sync when connected','รายการรอซิงก์':'pending sync','JD ส่วนกลางถูกแก้ไขจากเครื่องอื่นแล้ว ฉบับที่บันทึกในเครื่องยังเก็บไว้':'The shared JD was changed on another device; your local copy is retained','โหลดระบบบันทึก JD ไม่สำเร็จ กรุณาเปิดหน้าใหม่':'Could not load JD saving; please reopen the page','โหลด JD ในเครื่องไม่สำเร็จ':'Could not load locally saved JDs','JD ในเครื่องถูกแก้ไขจากอีกหน้าต่าง กรุณาเปิดฉบับล่าสุดก่อนบันทึก':'The local JD was changed in another window; reopen the latest copy before saving','พื้นที่เก็บข้อมูลในเครื่องไม่เพียงพอ กรุณาเก็บข้อความไว้ก่อนแล้วลองอีกครั้ง':'Device storage is full; keep a copy of your text and try again'});
 Object.assign(dictionary,{'ตรวจสอบฉบับส่วนกลาง':'Review shared copy','เปรียบเทียบ JD ก่อนซิงก์':'Compare JD before syncing','ฉบับที่บันทึกในเครื่อง':'Copy saved on this device','ฉบับส่วนกลาง':'Shared copy','ไม่พบ JD ส่วนกลาง':'Shared JD not found','ใช้ฉบับในเครื่องและซิงก์':'Use local copy and sync','กลับ JD ในเครื่อง':'Back to local JD','ไม่พบ JD ที่ต้องตรวจสอบก่อนซิงก์':'No JD conflict to review'});
 Object.assign(dictionary,{'ยังซิงก์ JD ไม่สำเร็จ ฉบับในเครื่องยังเก็บไว้':'JD sync is pending; your local copy is retained'});
 Object.assign(dictionary,{'รายงานตรงต่อ Manager':'Reports directly to Manager','ดูแลแผนกผลิต':'Supervises production sections','แผนก':'sections','ยังไม่มีพนักงานในตำแหน่งนี้':'No employee assigned to this position','กำหนดพนักงาน':'Assign employee','เลือกพนักงานสำหรับ Supervisor Production':'Choose an employee for Supervisor Production','เปิดข้อมูลพนักงานเพื่อกำหนดตำแหน่ง Supervisor Production':'Open the employee record to assign the Supervisor Production position','กรุณาเลือกพนักงาน':'Please choose an employee'});
 Object.assign(dictionary,{'โครงสร้างพนักงานตามตำแหน่งและแผนก':'Employee structure by position and section'});
 Object.assign(dictionary,{"เริ่มเรียนรู้ · ต้องมีผู้ควบคุมตลอดเวลา": "Beginner · Constant supervision required", "ทำได้บางส่วน · ต้องมีผู้ควบคุมใกล้ชิด": "Developing · Close supervision required", "ทำงานได้เอง · แจ้งหัวหน้าเมื่อผิดปกติ": "Independent · Report abnormalities to supervisor", "ชำนาญ · ทำงานเอง แก้ปัญหาและแนะนำผู้อื่น": "Skilled · Work independently, troubleshoot and coach", "ผู้เชี่ยวชาญ · ฝึกสอนและประเมินทักษะผู้อื่น": "Expert · Train others and assess their skills", "ความสามารถและการควบคุมดูแล ระดับ 1–5": "Work ability and supervision, levels 1–5"});
 Object.assign(dictionary,{'เพิ่มตำแหน่งว่าง':'Add vacant position','เพิ่มชื่อตำแหน่ง / กำหนดพนักงาน':'Add position name / Assign employee','ตำแหน่งจะคงอยู่เมื่อพนักงานลาออก และแสดงจำนวนที่ HR ต้องสรรหา':'Positions remain after resignation and show the number HR needs to recruit.','จำนวนตำแหน่งว่างที่เพิ่ม':'Additional vacant positions','ตำแหน่งว่าง / สรรหา HR':'Vacancies / HR recruitment','อัตรารวม':'Authorized headcount','มีพนักงาน':'Filled','ว่าง / ต้องสรรหา':'Vacant / To recruit','รอสรรหา / HR':'HR recruitment pending','บันทึกในเครื่องแล้ว · รอซิงก์อัตราตำแหน่ง':'Saved on this device · Position sync pending'});
 Object.assign(dictionary,{'ลบพนักงาน / บันทึกลาออก':'Remove employee / Record resignation'});
 const reverse={};
 for(const [th,en] of Object.entries(dictionary))if(en&&/[A-Za-z]/.test(en))reverse[en]=th;
 Object.assign(reverse,englishUI,{
  'Stamping Section':'แผนกปั๊ม','Welding Section':'แผนกเชื่อม','Bending Section':'แผนกพับ',
  'Tapping Section':'แผนกต๊าป','Taping Section':'แผนกต๊าป','CNC Section':'แผนกซีเอ็นซี',
  'Engineering Support Section':'แผนกสนับสนุนวิศวกรรม','Support Production Section':'แผนกสนับสนุนการผลิต',
  'Machine Maintenance Section':'แผนกซ่อมบำรุงเครื่องจักร','Tooling Maintenance Section':'แผนกซ่อมบำรุงแม่พิมพ์',
  'Sorting1':'คัดแยก 1','Sorting2':'คัดแยก 2','Sorting Section':'แผนกคัดแยก',
  'Stamping':'ปั๊ม','Welding':'เชื่อม','Bending':'พับ','Tapping':'ต๊าป','Taping':'ต๊าป',
  'Sorting':'คัดแยก','Engineering Support':'สนับสนุนวิศวกรรม','Support Production':'สนับสนุนการผลิต',
  'Machine Maintenance':'ซ่อมบำรุงเครื่องจักร','Tooling Maintenance':'ซ่อมบำรุงแม่พิมพ์',
  'Production Division':'ฝ่ายผลิต','Planning':'วางแผน','Purchasing':'จัดซื้อ','Marketing':'การตลาด',
  'Warehouse':'คลังสินค้า','Human Resources':'ทรัพยากรบุคคล','HR':'บุคคล',
  'Quality Control':'ควบคุมคุณภาพ','Quality Assurance':'ประกันคุณภาพ',
  'Admin':'ผู้ดูแลระบบ','Dashboard':'หน้าสรุป','Skill Matrix':'ตารางทักษะ','Skill':'ทักษะ',
  'Factory':'โรงงาน','Group':'กลุ่ม','Team':'ทีม','Training':'การฝึกอบรม','Assessment':'การประเมิน',
  'Draft':'ฉบับร่าง','Document':'เอกสาร','Plant Management':'ผู้บริหารโรงงาน',
  'Control Plan':'แผนควบคุม','Cycle Time':'รอบเวลาผลิต','Drawing':'แบบงาน','Specification':'ข้อกำหนด',
  'Output':'ผลผลิต','Input':'ข้อมูลเข้า','Process':'กระบวนการ','Support':'สนับสนุน','Spare':'สำรอง',
  'Quality System':'ระบบคุณภาพ','Process Improvement':'การปรับปรุงกระบวนการ',
  'Problem Solving':'การแก้ไขปัญหา','Training & Coaching':'การฝึกอบรมและสอนงาน',
  'Project Management':'การบริหารโครงการ','Part':'ชิ้นงาน','Step':'ขั้นตอน','Shift':'กะ',
  'Day':'วัน','Night':'กลางคืน','Online':'ออนไลน์','Offline':'ออฟไลน์','Refresh':'รีเฟรช',
  'Rev.':'ฉบับแก้ไข','JD No.':'เลขที่รายละเอียดงาน','No data':'ไม่มีข้อมูล','Check-in':'เช็คชื่อ','Check-out':'ลงเวลาออก','Skill Card':'การ์ดทักษะ','merge':'รวมข้อมูล','cache':'ข้อมูลชั่วคราว'
 });
 Object.assign(reverse,{"Audit": "การตรวจประเมิน", "Cumulative": "สะสม", "Go-Live": "เริ่มใช้งานจริง", "Quarter": "ไตรมาส", "Upskill": "ยกระดับทักษะ", "Baseline": "ข้อมูลตั้งต้น", "Job Observation": "การสังเกตการทำงาน", "Skill Proficiency Levels": "ระดับความเชี่ยวชาญ", "Checked by": "ผู้ตรวจสอบ", "User": "ผู้ใช้งาน", "Hash": "แฮช", "Live Sync": "ซิงก์แบบทันที", "Card": "การ์ด", "Master": "ข้อมูลหลัก", "Duplex": "พิมพ์สองด้าน", "Leader Login": "เข้าสู่ระบบหัวหน้าทีม", "Training & Examination Plan": "แผนฝึกอบรมและการสอบ", "JINRONG ELECTRONIC TECHNOLOGY (THAILAND) COMPANY LIMITED": "บริษัทจินร้งอิเล็กทรอนิกส์ เทคโนโลยี (ไทยแลนด์) จำกัด", "KPI": "ตัวชี้วัด", "JD": "รายละเอียดงาน", "OJT": "การฝึกปฏิบัติงาน", "NG": "งานเสีย", "QC Division": "ฝ่ายควบคุมคุณภาพ", "WH Division": "ฝ่ายคลังสินค้า", "HR Division": "ฝ่ายบุคคล", "Safety Division": "ฝ่ายความปลอดภัย", "Planning Division": "ฝ่ายวางแผน", "Purchasing Division": "ฝ่ายจัดซื้อ", "Marketing Division": "ฝ่ายการตลาด", "Sorting 1": "คัดแยก 1", "Sorting 2": "คัดแยก 2"});
 Object.assign(reverse,{"Production Manager":"ผู้จัดการฝ่ายผลิต","Production Engineer":"วิศวกรการผลิต","Tooling Engineer":"วิศวกรแม่พิมพ์","Welding Engineer":"วิศวกรการเชื่อม","Manufacturing Engineer":"วิศวกรการผลิต"});
 Object.assign(reverse,{"Stoer":"พนักงานห้องเบิกจ่ายของ","Stroe":"พนักงานห้องเบิกจ่ายของ","Store":"พนักงานห้องเบิกจ่ายของ","Storekeeper":"พนักงานห้องเบิกจ่ายของ","Document Control":"เจ้าหน้าที่ควบคุมเอกสาร","Document Controller":"เจ้าหน้าที่ควบคุมเอกสาร","Production Planning":"เจ้าหน้าที่วางแผนการผลิต","Production Planner":"เจ้าหน้าที่วางแผนการผลิต","Assistant Leader":"ผู้ช่วยหัวหน้าทีม"});
 // Full Section phrases avoid partial translations and cover legacy roster spellings.
 const sectionNames=[
  ['Die-Casting Mold Maintenance Section','แผนกซ่อมบำรุงแม่พิมพ์หล่ออลูมิเนียม',['Die Casting Mold Maintenance Section','Die-Casting Mold Maintenance','ช่างซ่อมแม่พิมพ์อลูมิเนียม']],
  ['Die Casting','หลอมอลูมิเนียม',['Die Casting Section','Die-Casting Section','Die-Casting','แผนกหลอมอลูมิเนียม','หล่ออลูมิเนียม','แผนกหล่ออลูมิเนียม']],
  ['Polishing / Shot Blasting / X-Ray','คัดครีบ-พ่นทราย-X-Ray',['คัดครีบ/พ่นทราย/X-Ray','แผนกคัดครีบ-พ่นทราย-X-Ray']],
  ['Human Resources Section','แผนกทรัพยากรบุคคล',['HR Section']],
  ['Safety Section','แผนกความปลอดภัย',[]],
  ['Accounting Section','แผนกบัญชี',[]],
  ['Planning Section','แผนกวางแผน',[]],
  ['Purchasing Section','แผนกจัดซื้อ',[]],
  ['Marketing Section','แผนกการตลาด',[]],
  ['Warehouse Section','แผนกคลังสินค้า',[]],
  ['Quality Control Section','แผนกควบคุมคุณภาพ',['QC Section']],
  ['Quality Assurance Section','แผนกประกันคุณภาพ',['QA Section']],
  ['Inspection Section','แผนกตรวจสอบ',[]],
  ['Assembly Section','แผนกประกอบ',[]]
 ];
 for(const [en,th,aliases] of sectionNames){
  reverse[en]=th;dictionary[th]=en;
  for(const alias of aliases){if(/[ก-๙]/.test(alias))dictionary[alias]=en;else reverse[alias]=th}
 }
 for(const [en,th] of Object.entries(reverse))if(!dictionary[th])dictionary[th]=en;
 Object.assign(dictionary,{'พนักงานห้องเบิกจ่ายของ':'Store','เจ้าหน้าที่ควบคุมเอกสาร':'Document Control','วางแผนการผลิต':'Production Planning','เจ้าหน้าที่วางแผนการผลิต':'Production Planning','ผู้ช่วยหัวหน้าทีม':'Assistant Leader'});
 const reverseLower=Object.fromEntries(Object.entries(reverse).map(([k,v])=>[k.toLowerCase(),v]));
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const keys=Object.keys(dictionary).sort((a,b)=>b.length-a.length);
 const phrases=new RegExp(keys.map(escape).join('|'),'g');
 const englishKeys=Object.keys(reverse).sort((a,b)=>b.length-a.length);
 const englishPattern=new RegExp('(?<![A-Za-z0-9_#-])(?:'+englishKeys.map(escape).join('|')+')(?![A-Za-z0-9_#-])','gi');
 function bilingual(source,target){
  // Handle explicit Thai / English pairs and numbered two-line JD templates.
  const lines=source.split('\n'),out=[];
  for(let i=0;i<lines.length;i++){
   const line=lines[i],next=lines[i+1];
   if(/[ก-๙]/.test(line)&&next&&/^\s{2,}[A-Za-z]/.test(next)&&!/[ก-๙]/.test(next)){
    out.push(target==='th'?line:(line.match(/^\s*\d+[.)]\s*/)?.[0]||'')+next.trim());i++;continue;
   }
   const parts=line.split(/\s+\/\s+/);
   if(parts.length===2){
    const leftThai=/[ก-๙]/.test(parts[0]),rightThai=/[ก-๙]/.test(parts[1]);
    if(leftThai!==rightThai&&/[A-Za-z]/.test(parts[leftThai?1:0])){
     const thaiPart=parts[leftThai?0:1],englishPart=parts[leftThai?1:0];
     // Only collapse a documented translation pair, not two different controls.
     const thClean=thaiPart.replace(/^\s*\d+[.)]\s*/, '').trim();
     if(dictionary[thClean]?.toLowerCase()===englishPart.trim().toLowerCase()||reverseLower[englishPart.trim().toLowerCase()]===thClean){
      out.push(target==='th'?thaiPart:((thaiPart.match(/^\s*\d+[.)]\s*/)||[''])[0]+englishPart));continue;
     }
    }
   }
   out.push(line);
  }
  return out.join('\n');
 }
 function translate(source,target=language){
  if(typeof source!=='string'||!source.trim())return source;
  source=bilingual(source,target);
  const value=source.trim(),leading=source.match(/^\s*/)[0],trailing=source.match(/\s*$/)[0];
  const aliases={
   'Attendance / เช็คชื่อ':['เช็คชื่อ','Attendance'],'Examination / ระบบสอบ':['ระบบสอบ','Examination'],
   'กะเช้า / Day Shift':['กะเช้า','Day Shift'],'กะดึก / Night Shift':['กะดึก','Night Shift'],
   'กระเช้า / Day Shift':['กะเช้า','Day Shift'],'Production Division Organization Chart':['ผังองค์กร','Organization Chart'],
   'JOB DESCRIPTION / JD รายบุคคล':['รายละเอียดงานรายบุคคล','Individual Job Description'],
   'Job Description · รายละเอียดงานรายบุคคล':['รายละเอียดงานรายบุคคล','Individual Job Description']
  };
  if(aliases[value])return leading+aliases[value][target==='en'?1:0]+trailing;
  if(target==='th'){
   if(reverseLower[value.toLowerCase()])return leading+reverseLower[value.toLowerCase()].replace(englishPattern,match=>reverseLower[match.toLowerCase()]||match)+trailing;
   return source.replace(englishPattern,match=>reverseLower[match.toLowerCase()]||match).replace(/\bNo\.(?=\d)/g,'เครื่อง ');
  }
  if(dictionary[value])return leading+dictionary[value]+trailing;
  return source.replace(phrases,(match,offset,whole)=>{
   if(match.length<=4&&(/[ก-๙]/.test(whole[offset-1]||'')||/[ก-๙]/.test(whole[offset+match.length]||'')))return match;
   const before=whole[offset-1]||'',after=whole[offset+match.length]||'';
   return (/[A-Za-zก-๙]/.test(before)?' ':'')+dictionary[match]+(/[A-Za-zก-๙]/.test(after)?' ':'');
  }).replace(/([A-Za-z])(?=[ก-๙])/g,'$1 ').replace(/([ก-๙])(?=[A-Za-z])/g,'$1 ');
 }
 const ignored=el=>!el||el.closest('script,style,textarea,code,pre,[contenteditable="true"],[data-i18n-ignore],.ppms-language-control');
 let employeeNames=[],employeeNameDisplays=new Map(),employeeNamePattern=null,rosterSource='';
 function refreshProtectedNames(){
  try{const raw=localStorage.getItem('ppms_v3_employees')||'[]';if(raw===rosterSource)return;rosterSource=raw;
   employeeNameDisplays=new Map();
   const rows=JSON.parse(raw),list=Array.isArray(rows)?rows:Object.values(rows||{});
   for(const e of list){
    if(!e)continue;
    const clean=value=>typeof value==='string'?value.trim():'';
    const thai=clean(e.thaiName)||clean(e.nameTh),english=clean(e.englishName)||clean(e.nameEn)||clean(e.name);
    for(const alias of [e.name,e.thaiName,e.englishName,e.nameEn,e.nameTh].map(clean).filter(n=>n.length>1)){
     const display={th:thai||english||alias,en:english||thai||alias},previous=employeeNameDisplays.get(alias);
     // Shared names must not resolve to a different employee's identity.
     employeeNameDisplays.set(alias,previous&&(previous.th!==display.th||previous.en!==display.en)?{th:alias,en:alias}:display);
    }
   }
   employeeNames=[...employeeNameDisplays.keys()].sort((a,b)=>b.length-a.length);
   employeeNamePattern=employeeNames.length?new RegExp('(?<![\\p{L}\\p{N}])(?:'+employeeNames.map(escape).join('|')+')(?![\\p{L}\\p{N}])','gu'):null;
  }catch{employeeNames=[];employeeNameDisplays=new Map();employeeNamePattern=null}
 }
 const sectionDisplayCache=new Map();
 function sectionDisplay(element){
  const api=window.PPMSOrganizationScope;if(!api?.sectionDisplayEntries)return null;
  const scope=api.sectionDisplayScope(element),key=scope.division+'::'+scope.plant;
  if(sectionDisplayCache.has(key))return sectionDisplayCache.get(key);
  const values=new Map();for(const item of api.sectionDisplayEntries(scope))for(const alias of item.aliases){
   // Renamed Section labels still follow the selected language when a translation
   // is known. Keep arbitrary custom names intact and never change Section keys.
   const name=item.name.trim(),display=dictionary[name]||reverseLower[name.toLowerCase()]?translate(item.name):item.name;
   for(const text of [alias,translate(alias,'th'),translate(alias,'en')])if(text)values.set(text,display);
  }
  const keys=[...values.keys()].sort((a,b)=>b.length-a.length),result=keys.length?{values,pattern:new RegExp('(?<![\\p{L}\\p{N}])(?:'+keys.map(escape).join('|')+')(?![\\p{L}\\p{N}])','gu')}:null;
  sectionDisplayCache.set(key,result);return result;
 }
 function displayText(source,element){
  const protectedValues=[];
  const hold=value=>{const token='\uE000'+protectedValues.length+'\uE001';protectedValues.push(value);return token};
  let safe=source;
  if(employeeNamePattern){
   safe=safe.replace(employeeNamePattern,name=>hold(employeeNameDisplays.get(name)?.[language]||name));
  }
  const sections=sectionDisplay(element);if(sections)safe=safe.replace(sections.pattern,name=>hold(sections.values.get(name)));
  safe=safe.replace(/\b[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)+\b/g,value=>/[0-9]/.test(value)?hold(value):value);
  safe=safe.replace(/https?:\/\/[^\s<>]+|\b[\w.-]+\.(?:js|json|csv|xlsx?|pdf|png|jpe?g|html)\b/gi,hold);
  return translate(safe).replace(/\uE000(\d+)\uE001/g,(_,i)=>protectedValues[Number(i)]);
 }
 function textNode(node){
  if(ignored(node.parentElement))return;
  const current=node.nodeValue,state=texts.get(node);
  const original=state&&current===state.rendered?state.original:current;
  if(node.parentElement.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.setAttribute('value',node.parentElement.value);
  const rendered=displayText(original,node.parentElement);
  texts.set(node,{original,rendered});
  if(current!==rendered)node.nodeValue=rendered;
 }
 function elementAttributes(el){
  if(el.closest('script,style,[data-i18n-ignore],.ppms-language-control'))return;
  let states=attributes.get(el);if(!states){states={};attributes.set(el,states)}
  for(const name of ['placeholder','title','aria-label','alt',...(el.matches('input[type=button],input[type=submit],input[type=reset]')?['value']:[])]){
   if(!el.hasAttribute(name))continue;
   const current=el.getAttribute(name),state=states[name],original=state&&current===state.rendered?state.original:current;
   const rendered=displayText(original,el);states[name]={original,rendered};
   if(current!==rendered)el.setAttribute(name,rendered);
  }
 }
 const observer=new MutationObserver(()=>queue());
 function watch(){if(document.body)observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']})}
 function controls(){
  let host=document.getElementById('ppmsLanguageControl');
  if(!host){
   host=document.createElement('div');host.id='ppmsLanguageControl';host.className='ppms-language-control';host.setAttribute('role','group');host.setAttribute('aria-label','Language / ภาษา');
   host.innerHTML='<button type="button" data-language="th" lang="th">ไทย</button><button type="button" data-language="en" lang="en">EN</button>';
   const container=document.querySelector('header .auth')||document.querySelector('header');
   if(container)container.append(host);else{host.classList.add('ppms-language-floating');document.body.append(host)}
   host.addEventListener('click',event=>{const b=event.target.closest('[data-language]');if(b)setLanguage(b.dataset.language)});
  }
  host.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.language===language));b.classList.toggle('selected',b.dataset.language===language)});
 }
 let dragTranslationTimer=0;
 function apply(){
  if(!document.body||applying)return;
  if(window.PPMSOrganizationEditor?.dragging||window.PPMSSectionTeams?.dragging){scheduled=false;clearTimeout(dragTranslationTimer);dragTranslationTimer=setTimeout(queue,120);return}
  applying=true;scheduled=false;observer.disconnect();
  try{
   refreshProtectedNames();sectionDisplayCache.clear();document.documentElement.lang=language;controls();
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   let node;while((node=walker.nextNode()))textNode(node);
   document.body.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type=button],input[type=submit],input[type=reset]').forEach(elementAttributes);
   // Browser title is UI too; it has no effect on data.
   document.title=language==='th'?'PPMS — ระบบจัดการพนักงานและการผลิต':'PPMS — People & Production Management';
  }finally{applying=false;watch()}
 }
 function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(apply)}}
 function setLanguage(next,persist=true){
  language=next==='en'?'en':'th';
  if(persist)try{localStorage.setItem(KEY,language)}catch{}
  apply();window.dispatchEvent(new CustomEvent('ppms-language-changed',{detail:{language}}));
 }
 const style=document.createElement('style');
 style.textContent='.ppms-language-control{display:inline-flex;align-items:center;gap:3px;padding:3px;border:1px solid #9fb8cf;border-radius:10px;background:#fff;flex-shrink:0}.ppms-language-control button{min-width:42px;min-height:36px;padding:6px 9px;border:0;border-radius:7px;background:#edf3f8;color:#174a78;font-size:13px;font-weight:700}.ppms-language-control button.selected{background:#174f82;color:#fff}.ppms-language-control button:focus-visible{outline:3px solid #38bdf8;outline-offset:2px}.ppms-language-floating{position:fixed;top:10px;right:12px;z-index:12000}header .auth{flex-wrap:wrap;align-items:center}@media(max-width:600px){header{gap:6px}header .auth{justify-content:flex-end}.ppms-language-control button{min-width:38px;padding:5px 7px}}@media print{.ppms-language-control{display:none!important}}';
 document.head.append(style);
 for(const name of ['alert','confirm','prompt']){
  const native=window[name].bind(window);
  window[name]=function(message,...rest){return native(displayText(String(message)),...rest)};
 }
 function sourceText(element){if(!element)return '';const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node,out='';while((node=walker.nextNode())){const state=texts.get(node);out+=state&&node.nodeValue===state.rendered?state.original:node.nodeValue}return out}
 function translateDocument(doc){
  if(!doc?.body)return;refreshProtectedNames();sectionDisplayCache.clear();doc.documentElement.lang=language;
  const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode()))textNode(node);
  doc.body.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type=button],input[type=submit]').forEach(elementAttributes);
  doc.title=displayText(doc.title);
 }
 window.PPMSLanguage={translate,setLanguage,sourceText,translateDocument,get language(){return language},refresh:apply};
 window.addEventListener('storage',event=>{if(event.key===KEY)setLanguage(event.newValue,false)});
 window.addEventListener('beforeprint',apply);
 window.addEventListener('ppms-organization-changed',queue);window.addEventListener('ppms-organization-scope-changed',queue);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();

