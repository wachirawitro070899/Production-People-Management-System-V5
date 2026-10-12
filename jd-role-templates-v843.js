/* Editable bilingual drafts. These are not approved job descriptions. */
(()=>{
 'use strict';
 const common=[
  ['ปฏิบัติตาม WI, Control Plan และมาตรฐานคุณภาพ ความปลอดภัย และสิ่งแวดล้อม','Follow the WI, Control Plan, quality, safety, and environmental standards.'],
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
 function role(position){const p=String(position||'').toLowerCase();if(p.includes('manager'))return'manager';if(p.includes('document'))return'document';if(p.includes('planning'))return'planning';if(/store|warehouse/.test(p))return'store';if(p.includes('engineer'))return'engineer';if(p.includes('supervisor'))return'supervisor';if(p.includes('leader'))return'leader';if(p.includes('technician'))return'technician';if(/operator|opeartor|operater|พนักงาน/.test(p))return'operator';return'other'}
 function draft(scope){
  const profile=roles[role(scope.position)],specific=[];
  if(/tooling engineer/i.test(scope.position))specific.push(['ออกแบบ ปรับปรุง และตรวจยืนยันแม่พิมพ์/เครื่องมือ รวมถึงอายุการใช้งานและอะไหล่','Design, improve, and validate dies/tools, including service life and spare parts.']);
  if(/welding engineer/i.test(scope.position))specific.push(['กำหนดและยืนยันพารามิเตอร์การเชื่อม คุณภาพรอยเชื่อม และแผนควบคุมกระบวนการ','Define and validate welding parameters, weld quality, and process controls.']);
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:profile.reportsTo,
   responsibilities:[...profile.duties,...specific,...common].map((x,i)=>`${i+1}. ${x[0]}\n   ${x[1]}`).join('\n'),
   qualifications:profile.qualification,documentUrl:'',status:'draft',templateSource:'PPMS position draft V843',version:1};
 }
 window.PPMSJDTemplates={draft,role};
})();
