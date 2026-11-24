/* Canonical Matrix skill keys connect training, lesson content and assessed skills. */
(()=>{'use strict';
 const normalize=v=>String(v||'').toLowerCase().replace(/[^a-z0-9ก-๙]+/g,' ').trim();
 const definitions={
 'Safety':['ความปลอดภัย','safety|ppe|ความปลอดภัย|ฉุกเฉิน|emergency|loto','ตรวจจุดอันตราย การ์ด PPE และวิธีหยุด/แจ้งเหตุประจำพื้นที่ก่อนเริ่มงาน'],
 'Machine Operation':['เครื่องจักร การปฏิบัติงาน','machine operation|wi|sop|pre.start|ปฏิบัติงาน|เดินเครื่อง|ตั้งเครื่อง','ตรวจเครื่อง Material และ WI Revision ล่าสุด ปฏิบัติตามลำดับและหยุดแจ้งเมื่อผิดปกติ'],
 'Die Setup':['แม่พิมพ์ การตั้ง','die setup|die|แม่พิมพ์|ตั้งเครื่อง','Leader หรือช่างที่ได้รับมอบอำนาจตรวจและตั้งแม่พิมพ์ตามมาตรฐาน ยืนยันค่าพารามิเตอร์และชิ้นแรกกับ QC/QA และผู้จัดการตามขั้นตอน'],
 'First Piece Inspection':['ชิ้นแรก การตรวจสอบ','first.piece|ชิ้นแรก','ตรวจชิ้นแรกตาม Drawing และ Q-Point บันทึกผลและรออนุมัติก่อนผลิตต่อ'],
 'Quality Check':['คุณภาพ ตรวจสอบ','quality|q.point|defect|sample|ng|คุณภาพ|ตรวจสอบ|เกณฑ์','ตรวจงานตาม Q-Point เปรียบเทียบ Sample OK/NG ตามความถี่ แยกกัก ติดป้ายและแจ้งเมื่อพบงานเสีย'],
 'OEE Record':['OEE รายการที่','oee|record|บันทึก','บันทึก Output OK/NG เวลาเดินเครื่อง Downtime และเหตุหยุดให้ตรงข้อมูลจริง ตรวจยอดก่อนส่ง'],
 '5S':['5S','5s|5ส|สะสาง|สะดวก|สะอาด','แยกสิ่งของ จัดตำแหน่ง ทำความสะอาด ตรวจมาตรฐานและรักษาวินัยประจำพื้นที่'],
 'Welding Operation':['การปฏิบัติงานเชื่อม','welding operation|wi|sop|weld|เชื่อม','ตรวจ WI ลำดับและจำนวนจุดเชื่อม สภาพ Electrode และเงื่อนไขที่อนุมัติ บันทึกและแจ้งความผิดปกติ'],
 'Jig Setup':['การตั้งจิ๊ก','jig|จิ๊ก','ตรวจรหัส Jig ตำแหน่งและการยึดจับตาม WI โดยผู้ได้รับมอบหมาย ยืนยันชิ้นแรกก่อนผลิต'],
 'Parameter Check':['ตรวจพารามิเตอร์','parameter|current|pressure|พารามิเตอร์','ตรวจ Current Time Pressure หรือค่ามาตรฐานประจำงาน เฉพาะ Leader/ช่างที่ได้รับมอบอำนาจปรับค่า บันทึกการเปลี่ยนและให้ QC/QA กับผู้จัดการยืนยันตามขั้นตอน'],
 'Visual Inspection':['การตรวจด้วยสายตา','visual|q.point|ตรวจจุด|ตรวจผิว|ตรวจด้วยสายตา','ตรวจทุกตำแหน่งตาม Q-Point เปรียบเทียบ Sample OK/NG ภายใต้แสงและลำดับการตรวจที่กำหนด'],
 'Poka-Yoke':['ป้องกันความผิดพลาด','poka|error.proof|sensor|เซนเซอร์','ทดสอบ Master OK/NG ตาม WI ยืนยันระบบป้องกันความผิดพลาดและห้ามข้ามระบบ'],
 'Measurement':['การวัด','measurement|drawing|tolerance|dimension|เครื่องมือวัด|มิติ','อ่าน Drawing และ Tolerance เลือกเครื่องมือที่สอบเทียบแล้ว ตรวจ Zero วัดและบันทึกตามเกณฑ์'],
 'Defect Criteria':['เกณฑ์งานเสีย','defect|sample|ng|เกณฑ์|งานเสีย','เทียบ Sample OK/NG กับเกณฑ์อนุมัติ ตัดสินแต่ละตำแหน่ง แยกกักและแจ้งเมื่อไม่แน่ใจ'],
 'Traceability':['สอบย้อนกลับ','traceability|lot|label|สอบย้อน|ปะปน','ตรวจ Part No. Lot Label และสถานะงานให้เชื่อมโยงประวัติได้ ป้องกันการปะปน'],
 'Packing':['บรรจุ','packing|บรรจุ','ตรวจชนิดภาชนะ จำนวน ทิศทางและ Label ตาม WI ป้องกันเสียหายและรุ่นปะปน'],
 'Program Selection':['เลือกโปรแกรม','program|โปรแกรม','เลือกโปรแกรมให้ตรง Part No. และ Revision ตรวจยืนยันก่อนเริ่มงานและห้ามแก้โดยไม่มีอำนาจ'],
 'Tool Offset':['ค่าออฟเซ็ต','offset|zero|ออฟเซ็ต','ตรวจ Tool Offset และ Zero ตามมาตรฐาน เฉพาะผู้ได้รับมอบหมายปรับค่าและตรวจยืนยันหลังปรับ'],
 'Tool Setup':['ตั้งเครื่องมือ','tool|tap|ตั้งเครื่อง','ตรวจชนิด Tool/Jig อายุใช้งานและค่าตั้งให้ตรง Part ยืนยันความพร้อมและชิ้นแรก'],
 'Thread Inspection':['ตรวจเกลียว','thread|go|เกลียว','ใช้ Go/No-Go Gauge ที่ถูกต้อง ตรวจสภาพและสอบเทียบ ตรวจเกลียวตาม WI บันทึกและแยกงาน NG'],
 'Angle Inspection':['ตรวจมุม','angle|มุม','ตรวจมุมและทิศทางตาม Drawing ด้วยเครื่องมือที่กำหนด บันทึกและจัดการค่าเกินเกณฑ์']
 };
 Object.assign(definitions,{
 'Quality System':['ระบบคุณภาพ','quality.system|pfmea|control.plan|iatf','ใช้ข้อกำหนดและเอกสารระบบคุณภาพ Revision ล่าสุด ตรวจความสอดคล้อง PFD/PFMEA/Control Plan และเก็บหลักฐาน'],
 'Process Improvement':['ปรับปรุงกระบวนการ','improvement|cycle.time|loss|ปรับปรุง','วิเคราะห์ Cycle Time Defect และ Loss กำหนดวิธีปรับปรุง ทดลองและติดตามผลเทียบเป้าหมาย'],
 'Drawing / Specification':['แบบและข้อกำหนด','drawing|specification|แบบ|ข้อกำหนด','อ่าน Dimension Tolerance Material Special Characteristic และ Revision เทียบมาตรฐานกระบวนการ'],
 'Problem Solving':['แก้ปัญหา','root.cause|problem|5.why|fishbone|สาเหตุ','แยกอาการกับสาเหตุด้วยหลักฐาน วิเคราะห์ 5 Why/Fishbone กำหนดการแก้และตรวจประสิทธิผล'],
 'Training & Coaching':['ฝึกและสอนงาน','training|coaching|ojt|ฝึก|สอน','กำหนด Skill Gap สาธิต Critical Step ให้ผู้เรียนฝึก ประเมินและบันทึกหลักฐานติดตามผล'],
 'Project Management':['บริหารโครงการ','project|โครงการ','กำหนดเป้าหมาย ผู้รับผิดชอบ แผนเวลา ความเสี่ยงและเกณฑ์ส่งมอบ ติดตามและบันทึกผล'],
 'Document Control':['ควบคุมเอกสาร','document|revision|เอกสาร','ตรวจ Revision แจกจ่ายฉบับอนุมัติ เรียกคืนฉบับเก่าและจัดเก็บบันทึกให้สอบย้อนกลับได้'],
 'Production Planning':['วางแผนผลิต','planning|capacity|order|แผน.*ผลิต','อ่าน Order ตรวจ Capacity Material และลำดับผลิต ติดตาม Plan/Actual และปรับแผนตามอำนาจ'],
 'Material Control':['ควบคุมวัตถุดิบ','material|fifo|lot|วัตถุดิบ','ตรวจ Part No. Lot จำนวนและ FIFO ป้องกัน Material Shortage และการปะปน บันทึกรับจ่าย'],
 'ERP / Record':['บันทึก ERP','erp|record|บันทึก','บันทึกรับจ่าย ผลผลิต NG และเวลาในระบบให้ตรงเอกสารจริง ตรวจยอดและแก้ตามขั้นตอน'],
 'Communication':['การสื่อสาร','communication|สื่อสาร|ประสาน','ส่งต่องาน สถานะ Lot และความผิดปกติให้ผู้รับผิดชอบครบถ้วน ยืนยันความเข้าใจและบันทึกติดตาม'],
 'Preventive Maintenance':['บำรุงรักษาป้องกัน','preventive|pm|บำรุง','ตรวจตามจุด ความถี่และเกณฑ์ PM ควบคุมพลังงานโดยผู้ได้รับมอบหมาย บันทึกผลและส่งมอบหลังตรวจ'],
 'Breakdown Repair':['ซ่อมเครื่องขัดข้อง','breakdown|repair|ซ่อม','รับแจ้ง วิเคราะห์อาการ ควบคุมพลังงาน ซ่อมโดยผู้ได้รับมอบหมาย ทดสอบและบันทึกส่งมอบเครื่อง'],
 'Electrical':['ระบบไฟฟ้า','electrical|sensor|plc|ไฟฟ้า','อ่านวงจร ตรวจ Sensor Motor Relay และ PLC ด้วยวิธีที่อนุมัติ เฉพาะผู้มีหน้าที่และผ่านการฝึก'],
 'Mechanical':['ระบบกลไก','mechanical|bearing|belt|gear|กลไก','ตรวจ Bearing Belt Gear Lubrication Alignment และความแน่นตามมาตรฐาน ควบคุมพลังงานก่อนซ่อม'],
 'Spare Part Control':['ควบคุมอะไหล่','spare|อะไหล่','ระบุ Critical Spare รหัสและ Revision ตรวจ Min-Max อายุใช้งานและประวัติเบิกคืนให้สอบย้อนกลับได้'],
 'Die Maintenance':['บำรุงแม่พิมพ์','die.maintenance|แม่พิมพ์|pm','ตรวจ Punch Die Guide และ Lubrication ตามแผน บันทึก Stroke และยืนยันชิ้นงานหลังบำรุงรักษา'],
 'Grinding':['เจียร','grinding|เจียร','ตรวจเครื่อง หินเจียรและการ์ด เลือกวิธีตามมาตรฐานโดยผู้ได้รับมอบหมาย ตรวจมิติและสภาพหลังเจียร'],
 'Tool Assembly':['ประกอบเครื่องมือ','assembly|ประกอบ','ตรวจรหัส Drawing และทิศทางประกอบ ขันตามค่าที่กำหนด ตรวจยืนยันและบันทึกก่อนใช้งาน'],
 'Drawing Reading':['อ่านแบบ','drawing|clearance|แบบ','อ่าน Drawing Revision Dimension Tolerance และ Clearance ให้ตรงมาตรฐาน ยืนยันก่อนประกอบหรือซ่อม'],
 'Troubleshooting':['วิเคราะห์ขัดข้อง','troubleshooting|breakdown|defect|สาเหตุ','วิเคราะห์อาการและ Defect ที่สัมพันธ์กับแม่พิมพ์ แยกสาเหตุ ทดลองแก้โดยผู้มีหน้าที่และยืนยันผล']
 });
 const skills=section=>[...(window.PPMSSkillCatalog?.forSection(section)||[])];
 function resolve(section,item,plan){
  const linked=plan?.skillLinks?.[normalize(item.title)];if(skills(section).includes(linked))return linked;
  const list=skills(section),title=normalize(item.title),exact=list.find(k=>normalize(k)===title||normalize(definitions[k]?.[0])===title);if(exact)return exact;
  const preferred=[[/first.piece|ชิ้นแรก/,'First Piece Inspection'],[/parameter|พารามิเตอร์/,'Parameter Check'],[/die|แม่พิมพ์|ตั้งเครื่อง/,'Die Setup'],[/wi|sop/,'Machine Operation'],[/q.point|quality|ng.control|sample/,'Quality Check']].find(([pattern,key])=>pattern.test(item.title.toLowerCase())&&list.includes(key));
  if(preferred)return preferred[1];
  const matches=list.filter(k=>definitions[k]&&new RegExp(definitions[k][1],'i').test(item.title));
  return matches.length===1?matches[0]:'';
 }
 function detail(skill){return definitions[skill]?.[2]||'ทบทวนมาตรฐาน '+skill+' ของ Section ตรวจ Revision ฝึกตาม WI กับผู้สอน ตรวจยืนยันผล บันทึกและแจ้งความผิดปกติตามขั้นตอน'}
 function defaults(section,plan){
  const list=skills(section);if(!list.length)return plan;
  const themes={Q1:'พื้นฐานและการปฏิบัติตามมาตรฐาน',Q2:'ฝึกปฏิบัติและตรวจยืนยันก่อนผลิต',Q3:'ทบทวนความผิดปกติและการควบคุมกระบวนการ',Q4:'ทบทวนประจำปีและประเมินความสามารถ'};
  return Object.fromEntries(Object.entries(plan).map(([q,value])=>[q,{...value,training:list.map(k=>k+' — '+themes[q]+': '+detail(k)).join('\n'),exam:list.join('\n')}]))
 }
 function assessed(section,questions,answers){
  const out={};questions.forEach((q,i)=>{const key=skills(section).includes(q.skillKey)?q.skillKey:resolve(section,{title:q.skill});if(!key)return;const row=out[key]||={correct:0,total:0};row.total++;if(Number(answers['q'+(i+1)])===Number(q.correct))row.correct++});
  for(const row of Object.values(out))row.score=Math.round(row.correct/row.total*100);return out;
 }
 function badge(section,item,plan){const key=resolve(section,item,plan);return '<small class="training-skill-link">'+(key?'Skill Matrix: '+window.PPMSTrainingPlanService.esc(key):'หัวข้อเสริม — ยังไม่เชื่อม Skill Matrix')+'</small>'}
 window.PPMSSkillTraining={skills,resolve,detail,defaults,assessed,badge,normalize};
})();
