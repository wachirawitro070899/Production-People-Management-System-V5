/* Editable bilingual drafts. These are not approved job descriptions. */
(()=>{
 'use strict';
 const common=[
  ['ปฏิบัติตามเอกสารและขั้นตอนที่อนุมัติของงาน รวมถึงมาตรฐานคุณภาพ ความปลอดภัย และสิ่งแวดล้อมที่เกี่ยวข้อง','Follow approved job documents and procedures and applicable quality, safety, and environmental standards.'],
  ['บันทึกผลการทำงานให้ถูกต้อง และแจ้งผู้บังคับบัญชาเมื่อพบความผิดปกติ','Keep accurate records and report abnormalities to the supervisor.'],
  ['ร่วมกิจกรรม 5S, Kaizen และการฝึกอบรมที่เกี่ยวข้องกับหน้าที่','Participate in 5S, Kaizen, and relevant training.']
 ];
 const roles={
  manager:{reportsTo:'ผู้บริหารโรงงาน / Plant Management',duties:[
   ['วางแผนและบริหารกำลังคน เครื่องจักร งบประมาณ และกำลังการผลิต','Plan and manage manpower, machines, budget, and production capacity.'],
   ['กำหนดและติดตาม KPI ด้านคุณภาพ ต้นทุน การส่งมอบ ประสิทธิภาพ และความปลอดภัย','Set and monitor quality, cost, delivery, efficiency, and safety KPIs.'],
   ['ประสานงาน Planning, Quality, Warehouse และหน่วยงานสนับสนุนให้ผลิตได้ตามแผน','Coordinate with Planning, Quality, Warehouse, and support functions to meet production plans.'],
   ['ทบทวนปัญหาหลัก อนุมัติแผนแก้ไข และติดตามประสิทธิผล','Review major issues, approve corrective plans, and verify effectiveness.'],
   ['พัฒนาทีมงาน ประเมินผล และกำหนดแผนทดแทนบุคลากร','Develop the team, assess performance, and plan succession.']
  ],qualification:'ประสบการณ์บริหารการผลิตและทีมงาน; ทักษะวางแผน วิเคราะห์ KPI และแก้ปัญหา / Production and team management experience; planning, KPI analysis, and problem-solving skills.'},
  engineer:{reportsTo:'ผู้จัดการ / Manager',duties:[
   ['วิเคราะห์กระบวนการ Cycle Time, Capacity และปัญหาการผลิตเพื่อกำหนดแนวทางปรับปรุง','Analyze processes, cycle time, capacity, and production problems to define improvements.'],
   ['จัดทำและปรับปรุง WI, ค่าตั้งเครื่อง และมาตรฐานการทำงานร่วมกับหน่วยงานที่เกี่ยวข้อง','Develop and update WIs, machine settings, and work standards with relevant functions.'],
   ['ทดลองและยืนยันกระบวนการ ชิ้นงาน เครื่องมือ และการเปลี่ยนแปลงก่อนใช้งานจริง','Trial and validate processes, parts, tools, and changes before implementation.'],
   ['วิเคราะห์สาเหตุของเสียและ Downtime และติดตามมาตรการป้องกันซ้ำ','Analyze defects and downtime and follow up recurrence prevention measures.'],
   ['สนับสนุนการฝึกอบรมและประเมินทักษะพนักงาน','Support employee training and skill assessments.']
  ],qualification:'ความรู้วิศวกรรมที่เกี่ยวข้อง; อ่าน Drawing และวิเคราะห์กระบวนการได้ / Relevant engineering knowledge; ability to read drawings and analyze processes.'},
  supervisor:{reportsTo:'ผู้จัดการหรือวิศวกร / Manager or Engineer',duties:[
   ['ควบคุมแผนการผลิตประจำวันและจัดสรรกำลังคนตามความสามารถ','Control daily production plans and allocate manpower based on competence.'],
   ['กำกับ Leader และทีมงานให้ผลิตตาม WI และ Control Plan','Supervise leaders and teams to follow the WI and Control Plan.'],
   ['ติดตาม Output, KPI, ของเสีย และ Downtime พร้อมรายงานปัญหา','Monitor output, KPIs, defects, and downtime and report issues.'],
   ['ควบคุมการเปลี่ยนรุ่น การส่งมอบระหว่างกะ และการตอบสนองความผิดปกติ','Control changeovers, shift handovers, and abnormality response.'],
   ['ประเมินทักษะและวางแผนพัฒนาพนักงานร่วมกับ Leader','Assess skills and plan employee development with leaders.']
  ],qualification:'ประสบการณ์ควบคุมการผลิต; ภาวะผู้นำและทักษะแก้ปัญหาหน้างาน / Production supervision experience; leadership and shop-floor problem-solving skills.'},
  leader:{reportsTo:'หัวหน้างาน / Supervisor',duties:[
   ['จัดกะและกำหนดพนักงานประจำเครื่องตามแผนและ Skill Matrix','Assign shifts and machine operators according to the plan and Skill Matrix.'],
   ['ตรวจความพร้อมคน เครื่องจักร เครื่องมือ และเอกสารก่อนเริ่มกะ','Check manpower, machine, tool, and document readiness before the shift.'],
   ['ติดตามผลผลิตและคุณภาพระหว่างกะ พร้อมแจ้งปัญหาให้ Supervisor','Monitor output and quality during the shift and report issues to the supervisor.'],
   ['สอนงานและตรวจยืนยันว่าพนักงานปฏิบัติตาม WI','Coach employees and verify compliance with the WI.'],
   ['จัดทำข้อมูลส่งมอบกะและดูแลข้อมูลพนักงานในแผนกตามสิทธิ์','Prepare shift handover records and maintain authorized employee data for the section.']
  ],qualification:'เข้าใจกระบวนการของแผนก; สื่อสาร จัดคน และสอนงานได้ / Understand section processes; able to communicate, assign manpower, and coach.'},
  technician:{reportsTo:'หัวหน้างานหรือวิศวกร / Supervisor or Engineer',duties:[
   ['ตรวจสอบ บำรุงรักษา และซ่อมเครื่องจักรหรือแม่พิมพ์ตามความรับผิดชอบ','Inspect, maintain, and repair assigned machines or dies.'],
   ['วิเคราะห์อาการเสียและแก้ไขภายใต้มาตรฐานความปลอดภัยและ LOTO','Diagnose faults and repair safely according to safety and LOTO standards.'],
   ['ตั้งเครื่องหรือปรับเครื่องตามค่าที่อนุมัติ และตรวจยืนยันก่อนผลิต','Set or adjust machines using approved parameters and verify before production.'],
   ['บันทึกงานซ่อม อะไหล่ Downtime และติดตามปัญหาซ้ำ','Record repairs, spare parts, and downtime and follow up recurring faults.']
  ],qualification:'ความรู้เครื่องจักรหรือแม่พิมพ์ที่เกี่ยวข้อง; ใช้เครื่องมือและอ่านเอกสารเทคนิคได้ / Relevant machine or die knowledge; able to use tools and read technical documents.'},
  operator:{reportsTo:'หัวหน้าทีม / Leader',duties:[
   ['ตรวจความพร้อมเครื่องจักร วัตถุดิบ และชิ้นงานก่อนเริ่มผลิต','Check machine, material, and part readiness before production.'],
   ['ผลิตหรือคัดแยกงานตาม WI, Control Plan และแผนการผลิต','Produce or sort parts according to the WI, Control Plan, and production plan.'],
   ['ตรวจชิ้นแรกและตรวจระหว่างผลิตตามจุดตรวจและความถี่ที่กำหนด','Perform first-piece and in-process checks at specified points and frequencies.'],
   ['แยกงาน OK/NG ระบุชิ้นงาน และหยุดแจ้งเมื่อพบความผิดปกติ','Separate and identify OK/NG parts; stop and report abnormalities.'],
   ['บันทึกจำนวนผลิต ของเสีย Downtime และส่งมอบงานระหว่างกะ','Record output, defects, and downtime and hand over work between shifts.']
  ],qualification:'ผ่านการฝึกอบรมและประเมินทักษะของงานที่ได้รับมอบหมาย / Trained and assessed as competent for assigned work.'},
  document:{reportsTo:'ผู้จัดการหรือวิศวกร / Manager or Engineer',duties:[
   ['ควบคุมเลขที่เอกสาร Revision การอนุมัติ และวันที่มีผล','Control document numbers, revisions, approvals, and effective dates.'],
   ['แจกจ่ายเอกสารฉบับล่าสุดและเรียกคืนเอกสารล้าสมัย','Distribute current documents and recall obsolete copies.'],
   ['จัดเก็บ WI, แบบฟอร์ม และบันทึกให้ค้นหาและสอบย้อนกลับได้','Store WIs, forms, and records for retrieval and traceability.'],
   ['ติดตามการทบทวนเอกสารและสนับสนุนการตรวจประเมิน','Follow up document reviews and support audits.']
  ],qualification:'เข้าใจการควบคุมเอกสารและใช้โปรแกรมสำนักงานได้ / Understand document control and use office software.'},
  planning:{reportsTo:'ผู้จัดการ / Manager',duties:[
   ['จัดทำและปรับแผนการผลิตตามคำสั่งซื้อ วัตถุดิบ และ Capacity','Prepare and adjust production plans based on orders, material availability, and capacity.'],
   ['ประสานงานกำลังคน เครื่องจักร และวัตถุดิบกับหน่วยงานที่เกี่ยวข้อง','Coordinate manpower, machines, and materials with relevant functions.'],
   ['ติดตามความคืบหน้า WIP การส่งมอบ และงานคงค้าง','Track progress, WIP, delivery, and backlog.'],
   ['รายงานความเสี่ยงการส่งมอบและปรับแผนเมื่อเกิดความผิดปกติ','Report delivery risks and revise plans when abnormalities occur.']
  ],qualification:'ทักษะวางแผน วิเคราะห์ข้อมูล และประสานงาน / Planning, data analysis, and coordination skills.'},
  store:{reportsTo:'หัวหน้างานหรือผู้จัดการ / Supervisor or Manager',duties:[
   ['รับ จัดเก็บ และจ่ายวัตถุดิบ ชิ้นงาน และอุปกรณ์ตามรายการที่อนุมัติ','Receive, store, and issue materials, parts, and supplies against approved records.'],
   ['ควบคุมการบ่งชี้ Lot, FIFO และตำแหน่งจัดเก็บ','Control lot identification, FIFO, and storage locations.'],
   ['บันทึกยอดรับจ่ายและตรวจนับสต๊อกให้ตรงกับข้อมูล','Record receipts and issues and reconcile stock counts.'],
   ['ป้องกันชิ้นงานปะปน เสียหาย และสนับสนุนการส่งมอบให้การผลิต','Prevent mixing or damage and support timely delivery to production.']
  ],qualification:'เข้าใจการควบคุมสต๊อก FIFO และการบ่งชี้ชิ้นงาน / Understand inventory control, FIFO, and part identification.'},
  other:{reportsTo:'ผู้บังคับบัญชาตามโครงสร้างองค์กร / Supervisor in the organization structure',duties:[
   ['ดำเนินงานตามขอบเขตตำแหน่งและแผนงานของแผนก','Perform work within the position scope and section plan.'],
   ['ประสานงานกับหน่วยงานที่เกี่ยวข้องและติดตามงานที่ได้รับมอบหมาย','Coordinate with relevant functions and follow up assigned work.'],
   ['ปรับปรุงขั้นตอนการทำงานและรักษาคุณภาพของข้อมูลหรือผลงาน','Improve work procedures and maintain the quality of data or output.']
  ],qualification:'ความรู้และทักษะที่เหมาะกับงานในตำแหน่งนี้ — กรุณาปรับรายละเอียด / Relevant knowledge and skills for this position — please customize.'}
 };

 const sections=[
  {match:/stamping|ปั๊ม/i,name:['ปั๊ม','Stamping'],tasks:[
   ['ตรวจรหัสวัตถุดิบ ล็อต ความหนา และทิศทางป้อนให้ตรงกับชิ้นงานก่อนเริ่มปั๊ม','Verify material code, lot, thickness, and feed direction against the part before stamping.'],
   ['ตรวจความพร้อมแม่พิมพ์ เซนเซอร์ อุปกรณ์ป้องกัน และระบบป้อนตามรายการตรวจ โดยไม่ยกเลิกระบบป้องกัน','Check die, sensor, guard, and feed-system readiness against the checklist without bypassing safeguards.'],
   ['ป้อนและรับชิ้นงานตาม WI ตรวจครีบ รอยแตก รอยกด และขนาดตามความถี่ที่กำหนด','Feed and collect parts per the WI; check burrs, cracks, press marks, and dimensions at the specified frequency.'],
   ['แยกชิ้นงานผิดปกติ หยุดเครื่องและแจ้งหัวหน้าทีมเมื่อพบงานค้าง แม่พิมพ์ผิดปกติ หรือเซนเซอร์ไม่ทำงาน','Segregate abnormal parts; stop and notify the leader for stuck parts, die abnormalities, or sensor failure.'],
   ['บันทึกจำนวนผลิต ของเสีย และเหตุหยุดเครื่อง พร้อมส่งมอบล็อตและสถานะแม่พิมพ์ระหว่างกะ','Record output, scrap, and downtime causes; hand over lots and die status between shifts.']
  ],engineering:[['วิเคราะห์แรงปั๊ม ระยะป้อน ความเร็ว และลำดับงานร่วมกับทีมแม่พิมพ์ ทดลองและยืนยันค่าที่อนุมัติก่อนผลิต','Analyze press load, feed pitch, speed, and operation sequence with tooling; trial and validate approved settings before production.'],['วิเคราะห์ครีบ แตก และอายุแม่พิมพ์ พร้อมกำหนดวิธีตรวจและมาตรการป้องกันซ้ำ','Analyze burrs, cracks, and die life; define inspection methods and recurrence prevention.']]},
  {match:/welding|เชื่อม/i,name:['เชื่อม','Welding'],tasks:[
   ['ตรวจ Part จิ๊ก ตำแหน่งประกอบ และความสะอาดผิวสัมผัสก่อนเชื่อม','Check parts, fixtures, assembly orientation, and contact-surface cleanliness before welding.'],
   ['ใช้โปรแกรมและค่าการเชื่อมที่อนุมัติ ตรวจสภาพอิเล็กโทรด ลวดเชื่อม และก๊าซตามชนิดกระบวนการ','Use the approved welding program and parameters; check electrodes, wire, and gas as applicable to the process.'],
   ['ประกอบและเชื่อมตามลำดับใน WI ตรวจแนวเชื่อม ตำแหน่ง ขนาด และข้อบกพร่องตามเกณฑ์','Assemble and weld in the WI sequence; inspect weld location, dimensions, and defects against criteria.'],
   ['แยกงานเชื่อมไม่สมบูรณ์ งานไหม้ หรือประกอบผิด แจ้งหัวหน้าทีมและไม่แก้ไขงานนอกวิธีที่อนุมัติ','Segregate incomplete welds, burn-through, or assembly errors; notify the leader and rework only by approved methods.'],
   ['บันทึกจำนวนผลิต ของเสีย อายุอิเล็กโทรดหรือวัสดุสิ้นเปลือง และปัญหาจิ๊กระหว่างกะ','Record output, defects, electrode life or consumables, and fixture issues for shift handover.']
  ],engineering:[['ทดลองและยืนยันโปรแกรม กระแส เวลา แรงกด หรือค่าการเชื่อมที่เกี่ยวข้อง พร้อมวิธีทดสอบความแข็งแรงตามมาตรฐานที่อนุมัติ','Trial and validate programs, current, time, pressure, or applicable welding parameters and strength-test methods against approved standards.'],['วิเคราะห์สาเหตุรอยเชื่อมผิดปกติและปรับปรุงจิ๊ก ลำดับเชื่อม และการป้องกันประกอบผิด','Analyze weld defects and improve fixtures, welding sequence, and assembly error prevention.']]},
  {match:/cnc|ซีเอ็นซี/i,name:['ซีเอ็นซี','CNC'],tasks:[
   ['ตรวจรหัสชิ้นงาน โปรแกรม จิ๊กจับงาน และเครื่องมือตัดให้ตรงกับใบงาน','Verify part code, program, workholding fixture, and cutting tools against the job order.'],
   ['ใส่ชิ้นงานและยึดจับตาม WI ตรวจความพร้อมน้ำหล่อเย็นและสภาพเครื่องก่อนเดินงาน','Load and clamp parts per the WI; check coolant and machine readiness before operation.'],
   ['ตรวจชิ้นแรกและขนาดระหว่างผลิตด้วยเครื่องมือวัดที่กำหนด บันทึกผลตามความถี่','Check first-piece and in-process dimensions using specified gauges and record results at the required frequency.'],
   ['แจ้งเมื่อพบขนาดเริ่มเบี่ยงเบน เครื่องมือตัดสึก หรือเสียงผิดปกติ ปรับชดเชยได้เฉพาะผู้ได้รับอนุญาต','Report dimensional drift, worn tools, or abnormal noise; compensation changes are restricted to authorized personnel.'],
   ['แยกล็อต งานรอตรวจ และงานเสีย พร้อมบันทึกผลผลิตและประวัติเปลี่ยนเครื่องมือตัด','Separate lots, pending-inspection parts, and rejects; record output and cutting-tool changes.']
  ],engineering:[['พัฒนาและยืนยันโปรแกรม ลำดับตัด จิ๊กจับงาน ความเร็วตัด และอัตราป้อนตาม Drawing และกำลังเครื่อง','Develop and validate programs, machining sequence, workholding, cutting speed, and feed against drawings and machine capability.'],['วิเคราะห์ความสามารถกระบวนการ อายุเครื่องมือตัด และ Cycle Time พร้อมกำหนดจุดชดเชยที่ควบคุม','Analyze process capability, tool life, and cycle time; establish controlled compensation points.']]},
  {match:/tapping|taping|ต๊าป/i,name:['ต๊าป','Tapping'],tasks:[
   ['ตรวจชนิดและขนาดดอกต๊าป รูเจาะ และชิ้นงานให้ตรงกับใบงาน','Verify tap type and size, pre-drilled holes, and parts against the job order.'],
   ['ยึดจับงานและต๊าปตาม WI ใช้น้ำหล่อเย็นหรือสารหล่อลื่นตามที่กำหนด','Clamp and tap parts per the WI using the specified coolant or lubricant.'],
   ['ตรวจเกลียวด้วยเกจ GO/NO-GO และตรวจความลึก ครีบ และความสะอาดตามมาตรฐาน','Check threads with GO/NO-GO gauges and verify depth, burrs, and cleanliness against the standard.'],
   ['หยุดและแจ้งเมื่อดอกต๊าปหัก เกลียวเสีย หรือเกจไม่ผ่าน แยกงานที่อาจได้รับผลกระทบ','Stop and report broken taps, damaged threads, or failed gauge checks; segregate potentially affected parts.'],
   ['บันทึกผลผลิต งานเสีย และจำนวนการใช้งานหรือการเปลี่ยนดอกต๊าป','Record output, rejects, and tap usage or changes.']
  ],engineering:[['กำหนดและยืนยันชนิดดอกต๊าป ความเร็ว ระยะต๊าป การหล่อลื่น และวิธีตรวจเกลียว','Define and validate tap type, speed, tapping depth, lubrication, and thread-inspection methods.'],['วิเคราะห์ดอกหักและเกลียวไม่ผ่าน ปรับปรุงการจับงานและมาตรฐานอายุเครื่องมือ','Analyze tap breakage and thread failures; improve workholding and tool-life standards.']]},
  {match:/bending|พับ|ดัด/i,name:['พับ','Bending'],tasks:[
   ['ตรวจชิ้นงาน แม่พิมพ์พับ และทิศทางวางงานให้ตรงตาม Drawing และ WI','Verify parts, bending tools, and loading orientation against the drawing and WI.'],
   ['จัดวางงานตามตัวหยุดและลำดับพับที่กำหนด ตรวจอุปกรณ์ป้องกันก่อนใช้งาน','Position parts against stops in the specified bending sequence and check safeguards before use.'],
   ['ตรวจมุมพับ ขนาด ระยะ และรอยกดของชิ้นแรกและระหว่างผลิตตามความถี่','Check bend angles, dimensions, distances, and press marks on first-piece and in-process samples at the required frequency.'],
   ['แยกงานมุมผิด ขนาดผิด หรือแตกร้าว แจ้งผู้มีสิทธิ์ปรับตั้ง ไม่แก้ค่าหรือแม่พิมพ์เองนอกขอบเขต','Segregate incorrect angles, dimensions, or cracks; notify authorized setters and do not adjust settings or tools beyond authorization.'],
   ['บันทึกจำนวนผลิต ของเสีย และสถานะการตั้งงานเพื่อส่งมอบกะ','Record output, defects, and setup status for shift handover.']
  ],engineering:[['ทดลองและยืนยันลำดับพับ แม่พิมพ์ ตัวหยุด ระยะกด และการชดเชยการคืนตัว','Trial and validate bending sequence, tools, stops, press depth, and springback compensation.'],['วิเคราะห์ความแปรปรวนมุมและขนาด ปรับปรุงจิ๊กและวิธีตรวจโดยอิง Drawing ที่อนุมัติ','Analyze angle and dimensional variation; improve fixtures and inspection methods using approved drawings.']]},
  {match:/tooling.*maintenance|ซ่อม.*แม่พิมพ์/i,name:['ซ่อมบำรุงแม่พิมพ์','Tooling Maintenance'],tasks:[
   ['ตรวจและบำรุงรักษาแม่พิมพ์ตามแผน ตรวจ Punch, Die, สปริง ไกด์ และระบบหล่อลื่น','Inspect and maintain dies to plan; check punches, dies, springs, guides, and lubrication.'],
   ['ถอด ประกอบ ลับ หรือเปลี่ยนชิ้นส่วนตามแบบและขอบเขตที่ได้รับอนุญาต','Disassemble, assemble, sharpen, or replace components to drawings within authorized scope.'],
   ['ตรวจระยะเคลียร์รันซ์และทดลองแม่พิมพ์ร่วมกับฝ่ายผลิตและคุณภาพก่อนส่งคืน','Check clearance and trial dies with production and quality before release.'],
   ['บันทึกประวัติซ่อม จำนวนช็อต อะไหล่ และปัญหาซ้ำ พร้อมติดป้ายสถานะแม่พิมพ์','Record repair history, shot counts, spare parts, and recurring issues; label die status.'],
   ['จัดเก็บและเคลื่อนย้ายแม่พิมพ์ด้วยวิธีและอุปกรณ์ยกที่ได้รับอนุญาต','Store and move dies using authorized methods and lifting equipment.']
  ],engineering:[['วิเคราะห์การสึกหรอ อายุแม่พิมพ์ และสาเหตุแตกหักเพื่อปรับปรุงแบบและแผน PM','Analyze wear, die life, and breakage to improve design and preventive maintenance.'],['ยืนยันการเปลี่ยนแปลงแม่พิมพ์และผลทดลองชิ้นงานร่วมกับฝ่ายผลิตและคุณภาพ','Validate die changes and trial-part results with production and quality.']]},
  {match:/machine.*maintenance|maintenance|ซ่อมบำรุงเครื่อง/i,name:['ซ่อมบำรุงเครื่องจักร','Machine Maintenance'],tasks:[
   ['ตรวจและทำ PM ตามแผนของเครื่องจักร ระบบไฟฟ้า ลม ไฮดรอลิก และอุปกรณ์ป้องกันที่ได้รับมอบหมาย','Inspect and perform planned PM on assigned machines, electrical, pneumatic, hydraulic, and safeguard systems.'],
   ['วิเคราะห์อาการเสีย ตัดแยกพลังงานตามขั้นตอน LOTO และซ่อมเฉพาะงานที่ได้รับอนุญาต','Diagnose faults, isolate energy using LOTO procedures, and repair only authorized work.'],
   ['ทดสอบการทำงานและอุปกรณ์ป้องกันร่วมกับผู้ใช้งานก่อนส่งมอบเครื่อง','Test machine operation and safeguards with the user before handover.'],
   ['บันทึกเวลาซ่อม สาเหตุ อะไหล่ และผลทดสอบ พร้อมติดตามการเสียซ้ำ','Record repair time, causes, parts, and test results; follow up recurring failures.'],
   ['ตรวจรายการอะไหล่สำรองและแจ้งความเสี่ยงที่อาจทำให้เครื่องหยุดนาน','Check spare-parts availability and report risks of prolonged downtime.']
  ],engineering:[['วิเคราะห์ MTBF, MTTR และสาเหตุหยุดเครื่องเพื่อกำหนดแผนป้องกันและอะไหล่วิกฤต','Analyze MTBF, MTTR, and downtime causes to define prevention plans and critical spares.'],['วางแผนและยืนยันการปรับปรุงเครื่องจักรและระบบป้องกันก่อนใช้งาน','Plan and validate machine and safeguard modifications before use.']]},
  {match:/sorting|คัดแยก/i,name:['คัดแยก','Sorting'],tasks:[
   ['ตรวจ Part ล็อต เกณฑ์คัดแยก และตัวอย่าง OK/NG ให้ตรงกับงานที่ได้รับมอบหมาย','Verify part, lot, sorting criteria, and OK/NG samples against the assignment.'],
   ['คัดแยกและตรวจตาม WI โดยรักษาการแยกพื้นที่และภาชนะ OK/NG','Sort and inspect per the WI while keeping OK/NG areas and containers separate.'],
   ['ใช้เกจหรือเครื่องมือตรวจที่กำหนด ตรวจสถานะสอบเทียบและความพร้อมก่อนใช้','Use specified gauges or inspection tools and check calibration status and readiness before use.'],
   ['ระบุจำนวนและชนิดข้อบกพร่อง แจ้งเมื่อพบปัญหาใหม่หรือเกณฑ์ไม่ชัดเจน','Record defect counts and types; report new defects or unclear criteria.'],
   ['บันทึกผลคัดแยก ติดป้ายล็อตและสถานะงาน ส่งมอบพร้อมตรวจนับจำนวน','Record sorting results, label lot and status, and verify counts at handover.']
  ],engineering:[['กำหนดวิธีตรวจ เกจ และวิธีป้องกันงานปะปนร่วมกับฝ่ายคุณภาพ','Define inspection methods, gauges, and mixing prevention with quality.'],['วิเคราะห์ข้อมูลข้อบกพร่องและประสิทธิภาพการคัดแยกเพื่อแก้ปัญหาที่กระบวนการต้นทาง','Analyze defects and sorting effectiveness to address upstream process causes.']]},
  {match:/engineering.*support|สนับสนุนวิศวกรรม/i,name:['สนับสนุนวิศวกรรม','Engineering Support'],tasks:[
   ['เตรียม Drawing, WI, จิ๊ก และข้อมูลตั้งเครื่องตาม Revision ที่อนุมัติ','Prepare approved-revision drawings, WIs, fixtures, and setup data.'],
   ['สนับสนุนทดลองงานใหม่ เก็บข้อมูล Cycle Time ผลตรวจ และปัญหาหน้างาน','Support new-work trials and collect cycle time, inspection results, and shop-floor issues.'],
   ['จัดเตรียมและตรวจสภาพเครื่องมือหรือจิ๊กตามรายการก่อนส่งมอบให้ผลิต','Prepare and check tools or fixtures against the checklist before production handover.'],
   ['บันทึกการเปลี่ยนแปลงและติดตามงานแก้ไขร่วมกับวิศวกรโดยไม่เปลี่ยนมาตรฐานเอง','Record changes and track actions with engineers without independently changing standards.'],
   ['สนับสนุนการสอนงานและรวบรวมหลักฐานการยืนยันกระบวนการ','Support training and collect process-validation evidence.']
  ],engineering:[['ออกแบบหรือปรับปรุงจิ๊ก Layout และลำดับงาน พร้อมวิเคราะห์ Capacity และสมดุลไลน์','Design or improve fixtures, layouts, and work sequences; analyze capacity and line balance.'],['ควบคุมการทดลองและการเปลี่ยนแปลงทางวิศวกรรม อัปเดต WI และยืนยันก่อนส่งมอบ','Control trials and engineering changes, update WIs, and validate before handover.']]},
  {match:/support.*production|production.*support|สนับสนุนการผลิต/i,name:['สนับสนุนการผลิต','Support Production'],tasks:[
   ['เตรียมและส่งวัตถุดิบ ภาชนะ และชิ้นงานให้ตรงเครื่อง Part และแผนการผลิต','Prepare and deliver materials, containers, and parts to the correct machine, part, and production plan.'],
   ['ตรวจรหัส ล็อต จำนวน และป้ายสถานะก่อนรับส่ง ป้องกันงานปะปน','Check codes, lots, quantities, and status labels before transfers to prevent mixing.'],
   ['เคลื่อนย้ายงานตามเส้นทางและอุปกรณ์ที่อนุญาต จัด WIP และ FIFO ตามที่กำหนด','Move work by authorized routes and equipment and organize WIP and FIFO as specified.'],
   ['สนับสนุนหน้างานที่ได้รับการฝึกอบรมและมอบหมาย แจ้งเมื่อวัสดุขาดหรือส่งงานไม่ทัน','Support trained and assigned tasks; report material shortages or delayed transfers.'],
   ['บันทึกรับส่งงานและส่งมอบยอดคงเหลือ ปัญหา และงานค้างระหว่างกะ','Record transfers and hand over remaining quantities, issues, and pending work between shifts.']
  ],engineering:[['วิเคราะห์การไหลงาน ระยะเคลื่อนย้าย WIP และจุดรอเพื่อปรับปรุง Layout และรอบส่งงาน','Analyze workflow, travel distances, WIP, and waiting points to improve layout and delivery cycles.'],['กำหนดมาตรฐานภาชนะ การบ่งชี้ และการส่งมอบให้สอบกลับได้','Define container, identification, and traceable handover standards.']]}
 ];
 const functions=[
  {match:/qc|quality|คุณภาพ|inspection|ตรวจสอบ/i,name:['คุณภาพ','Quality'],tasks:[
   ['ตรวจรับ ตรวจระหว่างกระบวนการ หรือก่อนส่งมอบตามแผนตรวจและขอบเขตที่ได้รับมอบหมาย','Perform assigned incoming, in-process, or outgoing inspections against the inspection plan.'],
   ['ตรวจ Drawing, Control Plan, เกณฑ์ยอมรับ และสถานะเครื่องมือวัดก่อนใช้','Check drawings, control plans, acceptance criteria, and gauge status before use.'],
   ['บันทึกผลตรวจ ระบุและกักกันงานไม่ผ่าน พร้อมแจ้งผู้มีอำนาจตัดสินใจ','Record results, identify and contain nonconforming parts, and notify authorized decision makers.'],
   ['ติดตามการคัดแยกและแก้ไขปัญหา พร้อมรักษาการสอบกลับของล็อต','Follow up sorting and corrective actions while maintaining lot traceability.']
  ]},
  {match:/warehouse|\bwh\b|คลัง/i,name:['คลังสินค้า','Warehouse'],tasks:[
   ['ตรวจรหัส ล็อต จำนวน และสภาพสินค้ารับเข้าเทียบเอกสาร','Verify received item codes, lots, quantities, and condition against documents.'],
   ['จัดเก็บตามตำแหน่งและเงื่อนไขที่กำหนด ติดป้ายและควบคุม FIFO','Store in designated locations and conditions, label goods, and control FIFO.'],
   ['เบิกจ่ายตามรายการอนุมัติ ตรวจนับและบันทึกรับจ่ายให้ตรงสต๊อก','Issue against approved requests, count, and record movements accurately.'],
   ['ตรวจนับคงเหลือ แยกของเสียหายหรือกักกัน และรายงานผลต่าง','Count stock, segregate damaged or held items, and report discrepancies.']
  ]},
  {match:/planning|วางแผน/i,name:['วางแผน','Planning'],tasks:[
   ['ทบทวนคำสั่งซื้อ กำหนดส่ง Capacity และความพร้อมวัตถุดิบก่อนจัดแผน','Review orders, due dates, capacity, and material availability before scheduling.'],
   ['จัดแผนรายวันและรายสัปดาห์แยก Part กระบวนการ เครื่อง และกะ','Prepare daily and weekly plans by part, process, machine, and shift.'],
   ['ติดตามผลจริง WIP และงานค้างร่วมกับผลิตและคลังสินค้า','Track actual output, WIP, and backlog with production and warehouse.'],
   ['ปรับและสื่อสารแผนเมื่อเครื่องเสีย วัสดุขาด หรือคำสั่งซื้อเปลี่ยน พร้อมรายงานความเสี่ยงส่งมอบ','Revise and communicate plans for breakdowns, shortages, or order changes and report delivery risks.']
  ]},
  {match:/purchasing|จัดซื้อ/i,name:['จัดซื้อ','Purchasing'],tasks:[
   ['ตรวจความต้องการและสเปกที่อนุมัติ ขอราคาและเปรียบเทียบเงื่อนไขผู้ขาย','Review approved requirements and specifications, obtain quotations, and compare supplier terms.'],
   ['จัดทำใบสั่งซื้อผ่านผู้มีอำนาจอนุมัติตามขั้นตอน','Prepare purchase orders through authorized approval procedures.'],
   ['ติดตามกำหนดส่งและประสานรับสินค้ากับคลังและผู้ร้องขอ','Track delivery dates and coordinate receipt with warehouse and requesters.'],
   ['ติดตามปัญหาคุณภาพหรือส่งล่าช้าและเก็บประวัติประเมินผู้ขาย','Follow up quality or late-delivery issues and retain supplier evaluation records.']
  ]},
  {match:/human|\bhr\b|บุคคล/i,name:['บุคคล','Human Resources'],tasks:[
   ['ดูแลข้อมูลพนักงานและเอกสารเข้าออกงานให้ถูกต้องและรักษาความลับ','Maintain accurate personnel and employment records with confidentiality.'],
   ['ประสานสรรหา ปฐมนิเทศ และการฝึกอบรมตามแผนกำลังคน','Coordinate recruitment, orientation, and training against staffing plans.'],
   ['ตรวจข้อมูลเวลาทำงานและลา ประสานผู้รับผิดชอบค่าจ้างและสิทธิประโยชน์','Check attendance and leave records and coordinate payroll and benefits responsibilities.'],
   ['ติดตามการประเมินผล ทักษะ และเอกสารที่ต้องครบตามขั้นตอนบริษัท','Track performance, skills, and required records under company procedures.']
  ]},
  {match:/safety|ความปลอดภัย/i,name:['ความปลอดภัย','Safety'],tasks:[
   ['ตรวจพื้นที่และงานเสี่ยง ติดตามการประเมินอันตรายและมาตรการควบคุม','Inspect areas and hazardous work and track hazard assessments and controls.'],
   ['ติดตาม PPE อุปกรณ์ฉุกเฉิน และการปฏิบัติตามมาตรฐานความปลอดภัย','Monitor PPE, emergency equipment, and compliance with safety standards.'],
   ['ประสานอบรม ซ้อมฉุกเฉิน และการสอบสวนอุบัติเหตุหรือเหตุเกือบเกิด','Coordinate training, emergency drills, and incident or near-miss investigations.'],
   ['บันทึกข้อบกพร่อง ติดตามการแก้ไข และรายงานความเสี่ยงต่อผู้รับผิดชอบ','Record findings, follow up corrective actions, and report risks to responsible persons.']
  ]},
  {match:/marketing|การตลาด/i,name:['การตลาด','Marketing'],tasks:[
   ['รวบรวมความต้องการลูกค้า สเปก และกำหนดส่งเพื่อประสานหน่วยงาน','Collect customer requirements, specifications, and due dates for internal coordination.'],
   ['จัดทำและติดตามใบเสนอราคาตามข้อมูลและการอนุมัติของบริษัท','Prepare and follow up quotations using company-approved information.'],
   ['ติดตามคำสั่งซื้อและการส่งมอบร่วมกับวางแผน ผลิต และคลัง','Track orders and deliveries with planning, production, and warehouse.'],
   ['บันทึกข้อร้องเรียนและข้อมูลตลาด ส่งต่อผู้รับผิดชอบและติดตามคำตอบ','Record complaints and market information, refer to responsible teams, and follow up responses.']
  ]}
 ];
 function sectionProfile(scope){
  // A non-production division takes precedence over incidental section words.
  const division=String(scope.division||''),section=String(scope.section||'');
  if(!/production|ผลิต/i.test(division)){
   const functional=functions.find(s=>s.match.test(division));if(functional)return functional;
  }
  return sections.find(s=>s.match.test(section))||functions.find(s=>s.match.test(section+' '+division))||null;
 }
 function sectionDuties(scope,key){
  const profile=sectionProfile(scope);if(!profile)return [];
  const [th,en]=profile.name,controls=profile.tasks;
  if(key==='manager')return [
   ['กำหนดเป้าหมาย ทรัพยากร และแผนพัฒนางาน'+th+' พร้อมทบทวนผลและความเสี่ยงของหน่วยงาน','Set objectives, resources, and development plans for '+en+' and review departmental results and risks.'],
   ['กำกับมาตรฐานงาน'+th+' ประสานหน่วยงานที่เกี่ยวข้อง และติดตามการแก้ปัญหาที่กระทบคุณภาพ ต้นทุน หรือการส่งมอบ','Oversee '+en+' work standards, coordinate related functions, and follow up issues affecting quality, cost, or delivery.']
  ];
  if(key==='engineer'&&profile.engineering)return profile.engineering.concat([
   ['กำหนดจุดควบคุมและวิธีตรวจของงาน'+th+' ร่วมกับผู้รับผิดชอบ พร้อมฝึกอบรมก่อนนำมาตรฐานใหม่ไปใช้','Define '+en+' control points and inspection methods with responsible functions and train staff before introducing new standards.']
  ]);
  if(key==='leader'||key==='supervisor')return [
   ['ตรวจความพร้อมและติดตามทีมงาน'+th+' ตามจุดควบคุมต่อไปนี้: '+controls.slice(0,3).map(x=>x[0]).join('; '),'Verify readiness and monitor the '+en+' team against these controls: '+controls.slice(0,3).map(x=>x[1]).join('; ')],
   ['ควบคุมงานผิดปกติของแผนก'+th+' แยกงานที่ได้รับผลกระทบ ประสานผู้มีอำนาจตรวจยืนยันก่อนเริ่มงานต่อ และบันทึกส่งมอบกะ','Control '+en+' abnormalities, segregate affected work, coordinate authorized restart verification, and record shift handover.'],
   ['ติดตามผลของแผนก'+th+' เทียบแผน ตรวจความครบถ้วนของบันทึก และสอนงานตามช่องว่างทักษะ','Compare '+en+' results with the plan, verify record completeness, and coach against skill gaps.']
  ];
  if(key==='technician'&&/Maintenance/.test(en))return controls;
  if(key==='technician'&&profile.engineering)return [
   ['ตรวจและตั้งอุปกรณ์ของงาน'+th+' ตาม WI และค่าที่อนุมัติ ซ่อมหรือปรับเฉพาะขอบเขตที่ได้รับอนุญาต','Inspect and set up '+en+' equipment to the WI and approved parameters; repair or adjust only within authorized scope.'],
   ['วิเคราะห์ปัญหาจากจุดควบคุมของงาน'+th+': '+controls[1][0],'Diagnose issues at this '+en+' control point: '+controls[1][1]],
   ['ทดสอบและส่งมอบอุปกรณ์งาน'+th+' ร่วมกับผู้ใช้งาน พร้อมบันทึกค่าตั้ง อะไหล่ และปัญหาที่แก้ไข','Test and hand over '+en+' equipment with users and record settings, parts, and resolved faults.']
  ];
  return controls;
 }

 function role(position){const p=String(position||'').toLowerCase();if(/manager|ผู้จัดการ/.test(p))return'manager';if(p.includes('document'))return'document';if(p.includes('planning'))return'planning';if(/store|warehouse/.test(p))return'store';if(/engineer|วิศวกร/.test(p))return'engineer';if(/supervisor|หัวหน้างาน|หัวหน้าแผนก/.test(p))return'supervisor';if(/leader|หัวหน้าทีม/.test(p))return'leader';if(/technician|ช่าง/.test(p))return'technician';if(/operator|opeartor|operater|พนักงาน/.test(p))return'operator';return'other'}
 function draft(scope){
  const key=role(scope.position),process=sectionProfile(scope),profile=roles[key],specific=sectionDuties(scope,key);
  const functional=process&&functions.includes(process),maintenance=process&&/Maintenance/.test(process.name[1]);
  const baseDuties=(functional&&['operator','other','planning','store'].includes(key)||maintenance&&['operator','technician'].includes(key))?[]:profile.duties;
  if(/tooling engineer/i.test(scope.position))specific.push(['ออกแบบ ปรับปรุง และตรวจยืนยันแม่พิมพ์/เครื่องมือ รวมถึงอายุการใช้งานและอะไหล่','Design, improve, and validate dies/tools, including service life and spare parts.']);
  if(/welding engineer/i.test(scope.position))specific.push(['กำหนดและยืนยันพารามิเตอร์การเชื่อม คุณภาพรอยเชื่อม และแผนควบคุมกระบวนการ','Define and validate welding parameters, weld quality, and process controls.']);
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:profile.reportsTo,
   responsibilities:[...baseDuties,...specific,...common].map((x,i)=>`${i+1}. ${x[0]}\n   ${x[1]}`).join('\n'),
   qualifications:profile.qualification,documentUrl:'',status:'draft',templateSource:'PPMS section duties V849',templateVersion:2,version:1};
 }
 window.PPMSJDTemplates={draft,role};
})();
