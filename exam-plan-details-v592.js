(function () {
  'use strict';
  const ROOT = 'ppmsExamPlanDetails';
  const RECORD_ROOT = 'ppmsTrainingImplementationRecords';
  const STATUS_ROOT = 'ppmsTrainingImplementationStatus';
  const recordSummaries = new Map();
  const summaryRequests = new Map();
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const LOCAL_KEY = 'ppms_exam_plan_details_v592';
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const isAdmin = () => {
    try { return sessionStorage.getItem('ppms_admin') === '1' && window.PPMSAccess?.canEdit() !== false; }
    catch (_) { return false; }
  };
  const planStates = {planned:'วางแผนอบรม',in_progress:'กำลังดำเนินการ',completed:'อบรมครบตามแผน',postponed:'เลื่อนแผน'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lines = value => String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const safeKey = value => btoa(unescape(encodeURIComponent(String(value)))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  function trainingContext({section,year,scope}) {
    scope ||= window.PPMSOrganizationScope?.current() || {division:'Production Division',plant:'โรง 1'};
    const sectionKey=scope.division==='Production Division'&&scope.plant==='โรง 1'?safeKey(section):'scope_'+safeKey(scope.division+'::'+scope.plant+'::'+section);
    return {section,year:Number(year),scope,sectionKey,key:Number(year)+'__'+sectionKey};
  }

  function sectionFocus(section) {
    const s = String(section || '').toLowerCase();
    if (/mold|mould|แม่พิมพ์/.test(s)) return 'การตรวจสภาพแม่พิมพ์ — ตรวจผิว จุดสึก และจุดเสียหายตามมาตรฐานงาน\nแผน PM แม่พิมพ์ — จุดตรวจ ความถี่ ผู้รับผิดชอบ และประวัติการซ่อม\nDrawing และชิ้นส่วนอะไหล่ — ตรวจ Revision และ Part No. ก่อนเปลี่ยน\nการยืนยันหลังซ่อม — ทดลองและส่งตรวจชิ้นงานก่อนส่งมอบแม่พิมพ์\nการบันทึกประวัติ — ระบุปัญหา วิธีแก้ อะไหล่ และผลตรวจยืนยัน';
    if (/smelt|หลอม/.test(s)) return 'มาตรฐานงานหลอม — ชนิดวัตถุดิบ เงื่อนไขกระบวนการ และ WI ที่ใช้\nการตรวจวัตถุดิบ — ตรวจชนิด Lot และการป้องกันวัสดุปะปน\nการควบคุมคุณภาพโลหะ — จุดตรวจและเกณฑ์ยอมรับตามมาตรฐาน\nเครื่องมือและอุปกรณ์ — ตรวจสภาพตามรายการตรวจประจำงาน\nการบันทึกและสอบย้อนกลับ — เชื่อมโยงวัตถุดิบ Batch และผลตรวจ';
    if (/die.?cast|หล่อ/.test(s)) return 'WI งาน Die Casting — ลำดับงานและจุดควบคุมเฉพาะ Part\nParameter งานหล่อ — ตรวจค่าตามมาตรฐานและเงื่อนไขการเปลี่ยนค่า\nการตรวจแม่พิมพ์และเครื่องจักร — ตรวจความพร้อมก่อนเริ่มงาน\nDefect งานหล่อ — เปรียบเทียบตัวอย่างและเกณฑ์ Porosity, Crack, Flash และ Short Shot\nFirst Piece และ Traceability — ตรวจยืนยันชิ้นแรกและบันทึก Lot การผลิต';
    if (/polish|shot.?blast|x.?ray|ขัด/.test(s)) return 'มาตรฐานกระบวนการ — เลือก WI และเงื่อนไขให้ตรงกับงานขัด Shot Blasting หรือ X-Ray\nการเตรียมเครื่องและอุปกรณ์ — ตรวจความพร้อมและวัสดุสิ้นเปลืองตามหน้าที่\nDefect Criteria — ตรวจผิว Burr, Scratch และความผิดปกติตาม Q-Point\nการตรวจยืนยัน — ใช้วิธีและเกณฑ์ตรวจที่ได้รับอนุมัติสำหรับแต่ละกระบวนการ\nการควบคุม Lot — แยกสถานะก่อนและหลังทำงานพร้อมบันทึกผล';
    if (/warehouse|\bwh\b|คลัง/.test(s)) return 'การรับเข้าและจัดเก็บ — ตรวจ Part No. Lot จำนวน และตำแหน่งจัดเก็บ\nFIFO / FEFO — จ่ายสินค้าตามลำดับและข้อกำหนดที่เกี่ยวข้อง\nLabel และ Traceability — ตรวจป้ายและเชื่อมโยงประวัติรับจ่าย\nStock Accuracy — ตรวจนับและจัดการผลต่างตามขั้นตอน\nการควบคุม NG — แยกกัก ติดป้าย และป้องกันจ่ายของผิดสถานะ';
    if (/quality|\bqc\b|\bqa\b|คุณภาพ/.test(s)) return 'Drawing และ Q-Point — ตรวจ Revision จุดตรวจ และเกณฑ์ยอมรับ\nเครื่องมือวัด — เลือกเครื่องมือและตรวจสถานะสอบเทียบก่อนใช้\nDefect Criteria — ฝึกตัดสิน Sample OK/NG ตามเกณฑ์อนุมัติ\nInspection Record — บันทึกผลตรวจและข้อมูลสอบย้อนกลับ\nการควบคุมงานไม่เป็นไปตามข้อกำหนด — แยกกัก แจ้งปัญหา และตรวจยืนยันผลแก้ไข';
    if (s.includes('stamping')) return 'Safety เครื่องปั๊ม — จุดอันตรายของ Die, Flywheel, Feeding และวิธีหยุดเครื่องฉุกเฉิน\nWI และ Q-Point งานปั๊ม — ลำดับการทำงาน จุดตรวจสำคัญ ความถี่ตรวจ และค่ามาตรฐานของ Part\nการตั้งเครื่องและ Parameter — วิธีตรวจ Die, Material, Feeder, Counter และค่าที่อนุญาตก่อนเริ่มผลิต\nFirst Piece Inspection — ตรวจชิ้นแรกตาม Drawing/Q-Point บันทึกผล และรออนุมัติก่อนผลิตต่อ\nDefect งานปั๊ม — วิธีแยก Crack, Burr, Dent, Dimension NG พร้อมการติดป้ายและกักงาน';
    if (s.includes('welding')) return 'Safety งานเชื่อม — อันตรายจากไฟฟ้า สะเก็ดไฟ ความร้อน ควันเชื่อม PPE และ Emergency Stop\nWI และ Welding Parameter — วิธีตรวจ Current, Time, Pressure และเงื่อนไขก่อนเริ่มงาน\nการตรวจจุดเชื่อม — ตำแหน่งและจำนวนจุดเชื่อม ลักษณะรอยเชื่อม และ Carbon Paper Test\nการควบคุม Electrode — การตรวจสภาพหัวเชื่อม การเจียร การเปลี่ยน และการบันทึกอายุการใช้งาน\nDefect งานเชื่อม — Missing Weld, Weak Weld, Burn, Spatter, Deformation และวิธีกักงาน NG';
    if (s.includes('sorting')) return 'Safety พื้นที่ Sorting — การจัดโต๊ะ แสงสว่าง PPE และการป้องกัน Part ปะปน\nVisual Inspection ตาม Q-Point — ตำแหน่งตรวจ วิธีจับชิ้นงาน ระยะมอง และลำดับการตรวจครบทุกจุด\nDefect Criteria — เปรียบเทียบ Sample OK/NG และเกณฑ์ Scratch, Dent, Crack, Burr, Rust และงานประกอบผิด\nMeasurement — เลือกและใช้เครื่องมือวัดให้เหมาะกับจุดตรวจ พร้อมตรวจ Zero ก่อนใช้งาน\nTraceability และ Packing — ควบคุม Lot, Label, จำนวนบรรจุ และป้องกัน Part ต่างรุ่นปะปน';
    if (s.includes('machine maintenance')) return 'Safety และ LOTO — ตัดแยกพลังงาน ล็อกแหล่งพลังงาน ทดสอบ Zero Energy และคืนเครื่องอย่างปลอดภัย\nPreventive Maintenance — จุดตรวจรายวัน/เดือน วิธีตรวจสภาพ และเกณฑ์ตัดสินก่อนเกิด Breakdown\nBreakdown Repair — รับแจ้ง วิเคราะห์อาการ แยกสาเหตุ ซ่อม ทดสอบ และส่งมอบเครื่อง\nElectrical — อ่านวงจร ตรวจ Sensor, Motor, Relay, PLC และใช้อุปกรณ์วัดอย่างปลอดภัย\nMechanical — ตรวจ Bearing, Belt, Gear, Lubrication, Alignment และความแน่นของอุปกรณ์';
    if (s.includes('tooling maintenance') || s.includes('tooling')) return 'Safety งานแม่พิมพ์ — การยกเคลื่อนย้าย การค้ำยัน จุดหนีบคม และการใช้เครื่องมืออย่างปลอดภัย\nPreventive Maintenance แม่พิมพ์ — ทำความสะอาด ตรวจ Punch/Die/Guide/Lubrication และบันทึกจำนวน Stroke\nBreakdown และการซ่อม — วิเคราะห์ Defect ที่สัมพันธ์กับแม่พิมพ์ ซ่อม ประกอบ ทดลอง และยืนยันชิ้นงาน\nDrawing และ Clearance — อ่าน Drawing ตรวจ Dimension และตั้ง Clearance ให้ตรงมาตรฐาน\nSpare Part Control — ระบุ Critical Spare, Min-Max, อายุใช้งาน และการเบิกคืนให้สอบย้อนกลับได้';
    if (s.includes('engineering')) return 'Safety และข้อกำหนดกระบวนการ — ประเมินความเสี่ยงและกำหนด Control ให้สอดคล้อง WI/PFMEA\nDrawing และ Specification — อ่าน Dimension, Tolerance, Material, Special Characteristic และ Revision\nProblem Solving — ใช้ 5 Why/Fishbone แยก Root Cause และกำหนด Corrective Action\nProcess Improvement — วิเคราะห์ Cycle Time, Defect และ Loss เพื่อวางแผนปรับปรุงที่วัดผลได้\nTraining & Coaching — จัดทำเนื้อหา สาธิต ประเมินความเข้าใจ และติดตามผลหลังอบรม';
    if (s.includes('support production')) return 'Safety และการประสานงาน — ข้อควรระวังในการสนับสนุนหน้างานและช่องทางแจ้งเหตุผิดปกติ\nProduction Planning — อ่าน Order จัดลำดับผลิต ตรวจ Capacity และติดตาม Plan เทียบ Actual\nMaterial Control — ตรวจ Part No., Lot, FIFO, จำนวน และป้องกัน Material Shortage หรือปะปน\nERP Record — บันทึกรับ-จ่าย ผลผลิต NG และเวลาให้ถูกต้องครบถ้วน\nDocument Control — ใช้เอกสาร Revision ล่าสุด แจกจ่าย เรียกคืน และจัดเก็บ Record';
    if (s.includes('cnc')) return 'Safety เครื่อง CNC — จุดหมุน เศษโลหะ ประตูนิรภัย Coolant และ Emergency Stop\nProgram และ Parameter — เลือก Program ถูก Part ตรวจ Tool Offset, Speed, Feed และป้องกันแก้ค่าโดยไม่ได้รับอนุญาต\nSetup และ First Piece — ติดตั้ง Jig/Tool ตั้ง Zero ผลิตชิ้นแรก และรออนุมัติก่อนผลิตต่อ\nMeasurement และ Drawing — อ่าน Tolerance และใช้ Vernier, Micrometer, Height Gauge ตามจุดตรวจ\nDefect Criteria — Burr, Tool Mark, Dimension NG, Surface NG และวิธีหยุด/กักงาน';
    if (s.includes('tapping')) return 'Safety เครื่อง Tapping — จุดหมุน จุดหนีบ เศษโลหะ การใช้ Guard และ Emergency Stop\nการตั้งเครื่อง — เลือก Tap, Jig, Speed, Depth และ Lubricant ให้ตรง Part\nการตรวจเกลียว — ใช้ Go/No-Go Gauge ตรวจความลึก ตำแหน่ง และเกลียวเสีย\nการควบคุมอายุ Tap — กำหนดจำนวนใช้งาน ตรวจการสึก และเปลี่ยนก่อนเกิด NG\nDefect Criteria — เกลียวไม่เต็ม เกลียวหวาน Tap หัก รูเอียง และวิธีกักงาน';
    if (s.includes('bending')) return 'Safety เครื่อง Bending — จุดหนีบ การวางมือ Guard, Foot Switch และ Emergency Stop\nWI และการตั้งเครื่อง — เลือก Tool/Jig ตั้ง Back Gauge, Angle และ Parameter ให้ตรง Part\nDrawing และ Measurement — อ่านมุม ระยะ ความสูง และใช้ Angle Gauge/Vernier ตรวจชิ้นงาน\nFirst Piece และ Q-Point — ตรวจชิ้นแรกทุกจุดสำคัญ บันทึก และรออนุมัติ\nDefect Criteria — มุมผิด ระยะผิด Crack, Dent, Springback และวิธีกักงาน';
    return 'Safety — อันตรายของพื้นที่ PPE จุดฉุกเฉิน และช่องทางแจ้งเหตุ\nWI / SOP — ลำดับงาน เงื่อนไขสำคัญ และข้อห้ามของตำแหน่ง\nQuality และ Defect Criteria — เกณฑ์ OK/NG ตัวอย่างมาตรฐาน และการกักงาน\n5S — แยกของ จัดวาง ทำความสะอาด รักษามาตรฐาน และสร้างวินัย\nAbnormal Response — หยุดงาน แยกของ แจ้งหัวหน้า และบันทึกเหตุการณ์';
  }

  function defaults(section,legacy=false) {
    const focus = sectionFocus(section);
    const plan = {
      Q1: {
        training: 'Safety ประจำพื้นที่ — รู้จุดอันตราย จุดหนีบ/จุดหมุน แหล่งพลังงาน เส้นทางหนีไฟ และปุ่ม Emergency Stop\nPPE ประจำงาน — เลือก สวม ตรวจสภาพ และเปลี่ยน PPE ให้เหมาะกับความเสี่ยงของงาน\nWI / SOP — อ่านเอกสาร Revision ล่าสุด เข้าใจลำดับงาน เงื่อนไขควบคุม และข้อห้าม\nQ-Point — ระบุจุดตรวจ วิธีตรวจ ความถี่ Sample และเกณฑ์ OK/NG ของ Part ที่รับผิดชอบ\n5S — แยกสิ่งของ จัดตำแหน่ง ทำความสะอาด ตรวจมาตรฐาน และรักษาวินัยประจำพื้นที่\nAbnormal Response — เมื่อพบเครื่อง/Material/ชิ้นงานผิดปกติ ให้หยุด แยก แจ้ง และบันทึกก่อนเริ่มงานต่อ\nBasic OJT — ฝึกเริ่มงาน ผลิต ตรวจ บันทึก และจบงานตามขั้นตอนโดยมีผู้สอนประเมิน',
        exam: 'Safety และตำแหน่งอุปกรณ์ฉุกเฉิน\nการเลือกและใช้ PPE\nลำดับ WI / SOP และข้อห้าม\nQ-Point และเกณฑ์ OK/NG\n5S ประจำพื้นที่\nขั้นตอน Stop–Segregate–Report–Record',
        method: 'Classroom 1 ชั่วโมง + สาธิตหน้างาน + OJT อย่างน้อย 2 ชั่วโมง + Job Observation',
        criteria: 'ข้อสอบ 20 ข้อ ผ่านอย่างน้อย 80% • ทำ Safety Check และปฏิบัติงานพื้นฐานถูกต้องทุก Critical Step'
      },
      Q2: {
        training: focus + '\nPre-start Check — ตรวจ Machine/Jig/Tool/Material/Document และสภาพพื้นที่ก่อนเปิดงาน\nFirst Piece Inspection — ตรวจชิ้นแรกตาม Drawing/Q-Point บันทึกผล และขออนุมัติก่อนผลิตต่อ\nSample OK/NG — ฝึกเปรียบเทียบของจริง อธิบายสาเหตุ และตัดสินงานตาม Defect Criteria\nNG Control — หยุดผลิต แยกกัก ติดป้าย ระบุ Lot/จำนวน แจ้งหัวหน้า และป้องกันงานหลุด\nProcess Control — รู้ Parameter และจุดควบคุมที่ห้ามเปลี่ยนเอง รวมถึง Reaction Plan เมื่อค่าเกินมาตรฐาน',
        exam: 'Safety เฉพาะกระบวนการ\nWI และ Parameter ของ Section\nPre-start Check และ First Piece\nDefect Criteria จาก Sample OK/NG\nขั้นตอนกักและรายงาน NG\nReaction Plan เมื่อ Process ผิดมาตรฐาน',
        method: 'ทบทวนมาตรฐาน 1 ชั่วโมง + OJT กับเครื่อง/กระบวนการจริง + ฝึกตัดสิน Sample OK/NG + Job Observation',
        criteria: 'ข้อสอบ 20 ข้อ ผ่านอย่างน้อย 80% • ตั้งงาน/ตรวจ First Piece ตามหน้าที่ได้ • แยกและควบคุม NG ถูกต้อง 100%'
      },
      Q3: {
        training: 'Measurement — เลือกเครื่องมือวัดให้ตรงจุด ตรวจ Zero ทำความสะอาด จับวัด และอ่านค่าอย่างถูกต้อง\nDrawing และ Specification — อ่าน Dimension, Tolerance, Datum, Symbol และ Revision ที่ใช้กับ Part\nInspection Method — วัดตามลำดับและตำแหน่งใน Q-Point พร้อมควบคุมแรงวัดและสภาพชิ้นงาน\nProduction / Inspection Record — บันทึกเวลา Lot ค่าที่วัด จำนวน OK/NG และผู้ตรวจให้ครบ ห้ามบันทึกย้อนหลังโดยไม่มีเหตุผล\nTraceability — เชื่อมโยง Material Lot, Machine, Operator, Date/Shift และ Packing Label เพื่อสอบย้อนกลับ\nOut-of-Spec Response — หยุดงาน กักตั้งแต่ Last Good Check แจ้งผู้เกี่ยวข้อง ตรวจยืนยัน และบันทึกผลการจัดการ',
        exam: 'การเลือกและตรวจ Zero เครื่องมือวัด\nการอ่าน Drawing, Tolerance และ Specification\nวิธีวัดตาม Q-Point\nการบันทึก Production/Inspection Record\nTraceability จาก Material ถึง Finished Good\nReaction Plan เมื่อค่าตรวจเกินมาตรฐาน',
        method: 'สาธิต 1 ชั่วโมง + ฝึกวัดชิ้นงานจริงอย่างน้อย 5 ชิ้น + ฝึกอ่าน Drawing/Record + Practical Evaluation',
        criteria: 'ข้อสอบ 20 ข้อ ผ่านอย่างน้อย 80% • ผลวัดตรงกับ Master/ผู้ประเมิน • บันทึกและสอบย้อนกลับได้ครบถ้วน'
      },
      Q4: {
        training: 'Annual Review — ทบทวน Safety, WI, Q-Point, Quality และ Process Control จาก Q1–Q3\nNG และ Customer Complaint — ศึกษาปัญหาจริง ผลกระทบ จุดที่ควรตรวจพบ และข้อกำหนดใหม่หลังแก้ไข\nRoot Cause — แยกอาการกับสาเหตุ ใช้ 5 Why/Fishbone และตรวจหลักฐานก่อนสรุป\nCorrective/Preventive Action — กำหนดวิธีแก้ ผู้รับผิดชอบ กำหนดเสร็จ และวิธีตรวจประสิทธิผลเพื่อป้องกันซ้ำ\nEmergency Response — ฝึกตอบสนองไฟไหม้ อุบัติเหตุ เครื่องเสีย สารเคมีรั่ว หรือ Quality Escape ตามบทบาท\nSkill Matrix Review — เปรียบเทียบทักษะปัจจุบันกับเป้าหมาย ระบุ Skill Gap และแผน OJT ปีถัดไป\nLesson Learned — แชร์ปัญหาและวิธีป้องกันให้พนักงานใน Section นำไปใช้กับงานคล้ายกัน',
        exam: 'ข้อสอบรวม Safety / Quality / Process จาก Q1–Q3\nกรณีศึกษา NG และ Customer Complaint\n5 Why / Root Cause / Corrective Action\nEmergency Response ตามบทบาท\nหัวข้อทักษะเฉพาะ Section\nการประเมินภาคปฏิบัติปลายปี',
        method: 'Annual Refresh 1 ชั่วโมง + Case Study + Emergency/NG Simulation + Practical Evaluation + Skill Review รายบุคคล',
        criteria: 'ข้อสอบ 20 ข้อ ผ่านอย่างน้อย 80% • Case Study และภาคปฏิบัติผ่าน • Skill Matrix มีผลประเมินและแผนพัฒนาปีถัดไป'
      }
    };
    return legacy?plan:window.PPMSSkillTraining?.defaults(section,plan)||plan;
  }

  function localRead(key) {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')[key] || null; } catch (_) { return null; }
  }
  function localWrite(key, value) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {}; } catch (_) {}
    all[key] = value;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  }
  function dbReady() {
    return typeof firebase !== 'undefined' && window.PPMS_FIREBASE_CONFIG;
  }
  function ensureFirebase() {
    if (!firebase.apps.length) firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
    return firebase.database();
  }
  function context() {
    const section = document.querySelector('#examPlanSection')?.value || '';
    const year = Number(document.querySelector('#examPlanYear')?.value || new Date().getFullYear());
    const scope = window.PPMSOrganizationScope?.current() || {division:'Production Division',plant:'โรง 1'};
    const sectionKey = scope.division === 'Production Division' && scope.plant === 'โรง 1' ? safeKey(section) : 'scope_' + safeKey(scope.division + '::' + scope.plant + '::' + section);
    return { section, year, sectionKey, scope, key: year + '__' + sectionKey };
  }
  const planRequests = new Map();
  const freshPlans = new Map();
  const READ_TIMEOUT = 8000;
  const PLAN_FRESHNESS = 60000;
  function trainingRestReady() {
    return !!window.PPMS_FIREBASE_CONFIG?.databaseURL && typeof fetch === 'function' && typeof AbortController === 'function';
  }
  async function trainingRequest(path, options = {}, timeout = 20000) {
    const base = String(window.PPMS_FIREBASE_CONFIG?.databaseURL || '').replace(/\/$/,'');
    const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),timeout);
    try {
      const response=await fetch(base+'/'+path+'.json'+(options.method==='PATCH'?'?print=silent':''),{...options,signal:controller.signal,cache:'no-store'});
      if (!response.ok) throw Error(response.status===401 || response.status===403 ? 'ไม่มีสิทธิ์เข้าถึงหลักฐาน กรุณาตรวจสอบบัญชีผู้ใช้' : 'เชื่อมต่อหลักฐานไม่สำเร็จ ('+response.status+')');
      return response.status===204?null:await response.json();
    } catch(error) {
      if(error.name==='AbortError') throw Error('ยังไม่ได้รับการยืนยันจากฐานข้อมูล กรุณาลองโหลดข้อมูลล่าสุดอีกครั้ง');
      throw error;
    } finally { clearTimeout(timer); }
  }
  const readTrainingValue = path => trainingRestReady() ? trainingRequest(path) : readCloudValue(path);
  function readCloudValue(path) {
    return new Promise((resolve, reject) => {
      let ref, settled = false;
      const finish = (error, snapshot) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (ref) ref.off('value', onValue);
        if (error) reject(error); else resolve(snapshot.val());
      };
      const onValue = snapshot => finish(null, snapshot);
      const timer = setTimeout(() => finish(new Error('การเชื่อมต่อใช้เวลานาน กรุณาลองใหม่')), READ_TIMEOUT);
      try {
        ref = ensureFirebase().ref(path);
        ref.on('value', onValue, error => finish(error));
        if (settled) ref.off('value', onValue);
      } catch (error) { finish(error); }
    });
  }
  function readPlan(ctx) {
    if (planRequests.has(ctx.key)) return planRequests.get(ctx.key);
    if ((!trainingRestReady() && !dbReady()) || navigator.onLine === false) return Promise.reject(new Error('ยังไม่เชื่อมต่อฐานข้อมูล'));
    const request = Promise.all([readTrainingValue(ROOT + '/' + ctx.year + '/' + ctx.sectionKey),readTrainingValue(STATUS_ROOT+'/'+ctx.year+'/'+ctx.sectionKey)]).then(([cloud,status]) => {
      const plan = defaults(ctx.section);
      QUARTERS.forEach(q => { if (cloud?.[q]) plan[q] = {...cloud[q], _saved:true};else if(Object.values(status?.[q]||{}).some(r=>r?.topic))plan[q]=defaults(ctx.section,true)[q]; });
      try { localWrite(ctx.key, plan); } catch (_) {}
      freshPlans.set(ctx.key, {plan, at:Date.now()});
      return plan;
    }).finally(() => planRequests.delete(ctx.key));
    planRequests.set(ctx.key, request);
    return request;
  }
  const canonical = value => JSON.stringify(value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
  async function savePlan(ctx, plan, q, expected) {
    if (!isAdmin()) throw new Error('บัญชีนี้ไม่มีสิทธิ์แก้ไขแผน');
    if (!dbReady() || navigator.onLine === false) throw new Error('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนบันทึกแผน');
    const next = {...plan[q], updatedAt:new Date().toISOString()}; delete next._saved;
    let matched = false;
    const result = await ensureFirebase().ref(ROOT + '/' + ctx.year + '/' + ctx.sectionKey + '/' + q).transaction(current => {
      matched = canonical(current || null) === canonical(expected || null);
      return matched ? next : current; // A cold SDK cache may start at null; let the server retry without changing data.
    });
    if (!result.committed || !matched) throw new Error('แผนถูกแก้ไขจากเครื่องอื่น กรุณาปิดแล้วเปิดแผนใหม่');
    freshPlans.delete(ctx.key);
    window.PPMSQuarterlyTraining?.invalidate(ctx);
    plan[q] = {...next, _saved:true};
    try { localWrite(ctx.key, plan); } catch (_) {}
  }
  function recordKey(ctx, q, topicIndex) {
    return ctx.year + '__' + ctx.sectionKey + '__' + q + '__' + topicIndex;
  }
  function roster(ctx) {
    const source = window.PPMS_RUNTIME?.monthReportContext?.();
    if (!source?.allowed) return [];
    const api = window.PPMSOrganizationScope;
    return (source.employees || []).filter(e => {
      const scope = api?.employeeScope(e) || {division:e.organizationDivision || 'Production Division',plant:e.organizationPlant || 'โรง 1'};
      return scope.division === ctx.scope.division && scope.plant === ctx.scope.plant &&
        (source.allSections || (api?.sameSection(e.section, source.section) ?? e.section === source.section)) &&
        (api?.sameSection(e.section, ctx.section) ?? e.section === ctx.section);
    }).sort((a,b) => String(a.id).localeCompare(String(b.id), undefined, {numeric:true}));
  }
  function newEmployeeEligible(employee,on=today()){
    const start=String(employee?.startDate||'');
    const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
    if(!valid(start)||!valid(on)||on<start)return false;
    const [year,month,day]=start.split('-').map(Number),deadline=new Date(Date.UTC(year,month+1,0));
    // One calendar month, inclusive; clamp month-end hires to the next month's last day.
    deadline.setUTCDate(Math.min(day,deadline.getUTCDate()));
    return on<=deadline.toISOString().slice(0,10);
  }
  const newEmployeeRoster=ctx=>roster(ctx).filter(employee=>newEmployeeEligible(employee));
  function assertNewEmployeeTraining(ctx,record){
    const eligible=new Map(roster(ctx).map(person=>[String(person.id),person]));
    if(!record.attendeeIds?.length||record.attendeeIds.some(id=>!newEmployeeEligible(eligible.get(String(id)))))throw Error('อบรมพนักงานใหม่ได้เฉพาะผู้มีอายุงานไม่เกิน 1 เดือนนับจากวันเริ่มงาน');
    const date=String(record.trainingDate||'');
    if(date>today()||record.attendeeIds.some(id=>!newEmployeeEligible(eligible.get(String(id)),date)))throw Error('วันที่อบรมต้องอยู่ภายใน 1 เดือนนับจากวันเริ่มงาน และไม่เป็นวันในอนาคต');
  }
  function summaryOf(record) {
    return {topic:record.topic,trainingDate:record.trainingDate || '',evidenceCount:(record.evidence || []).length,
      trainingCompleted:record.trainingCompleted === true,attendeeIds:record.attendeeIds || [],updatedAt:record.updatedAt || '',...(record.trainingCourse?{courseRevision:record.trainingCourse.revision,courseTopics:record.trainingCourse.topics.map(topic=>topic.title)}:{})};
  }
  function trainingDone(record) { return !!record?.trainingDate && (record.trainingCompleted === true || Number(record.evidenceCount) > 0); }
  function topicSummary(ctx, q, item) {
    const record = recordSummaries.get(ctx.key)?.data?.[q]?.[item.index];
    return record?.topic === item.title ? record : null;
  }
  function topicState(ctx,q,item){
    const state=recordSummaries.get(ctx.key),record=topicSummary(ctx,q,item);
    if(!record&&!state?.loaded)return {key:state?.error?'unavailable':'checking',label:state?.error?'ยังตรวจสอบสถานะไม่ได้':'กำลังตรวจสอบสถานะ',className:'checking',detail:state?.error||'กำลังตรวจข้อมูลการอบรมล่าสุด'};
    if(!trainingDone(record))return {key:'waiting-training',label:'รออบรม',className:'pending',detail:'ยังไม่มีหลักฐานยืนยันการอบรมที่บันทึกสำเร็จ'};
    const {people,results,available}=examProgress(ctx,q),ids=new Set((record.attendeeIds||[]).map(String)),attendees=people.filter(person=>ids.has(String(person.id))),examined=attendees.filter(person=>results.has(String(person.id))).length;
    const complete=available&&attendees.length>0&&examined===attendees.length;
    return {key:complete?'completed':'waiting-exam',label:complete?'อบรมและสอบครบแล้ว':'อบรมเรียบร้อยแล้ว • พร้อมสอบ',className:complete?'done':'waiting-exam',detail:'อบรมเรียบร้อยแล้ว • หลักฐาน '+(Number(record.evidenceCount)||0)+' ไฟล์ • '+(attendees.length?'สอบแล้ว '+examined+' / '+attendees.length+' คน':'กรุณาเชื่อมรหัสผู้เข้าอบรมเพื่อตรวจผลสอบ')};
  }
  function topicBadge(ctx, q, item) {
    const state=topicState(ctx,q,item);
    return '<span class="training-progress-badge '+state.className+'" data-training-topic-status="'+item.index+'" data-quarter="'+q+'" data-training-status="'+state.key+'" title="'+esc(state.detail)+'">'+esc(state.label)+'</span>';
  }
  function examProgress(ctx,q) {
    const source = window.PPMS_RUNTIME?.monthReportContext?.(), people = roster(ctx), ids = new Set(people.map(e=>String(e.id))), results = new Map();
    const deleted=new Set(source?.deletedExamKeys||[]);
    for (const r of [...(window.PPMSQuarterlyTraining?.notifications(ctx)||[]),...(source?.examResults || [])]) {
      if (r.recordKey && deleted.has(r.recordKey)) continue;
      if (r.deleted || r.forcedExit === true || !ids.has(String(r.employeeId)) || (r.examType || 'quarterly') !== 'quarterly' || r.quarter !== q) continue;
      const date = String(r.date || r.createdAt || ''), year = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Number(date.slice(0,4)) : Number.isFinite(new Date(date).getTime()) ? Number(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric'}).format(new Date(date))) : null;
      if (year !== ctx.year || r.organizationDivision && r.organizationDivision !== ctx.scope.division || r.organizationPlant && r.organizationPlant !== ctx.scope.plant) continue;
      const old = results.get(String(r.employeeId));
      if (!old || String(r.createdAt || r.date) > String(old.createdAt || old.date)) results.set(String(r.employeeId),r);
    }
    return {people,results,available:!!source?.allowed};
  }
  function quarterProgress(ctx,q,quarter) {
    const items = trainingItems(quarter.training), complete = items.filter(item=>trainingDone(topicSummary(ctx,q,item))).length;
    const {people,results,available} = examProgress(ctx,q), all = items.length > 0 && complete === items.length;
    const label = all ? 'อบรมเสร็จแล้ว' + (!available || !people.length ? '' : results.size === people.length ? ' • สอบเสร็จแล้ว' : ' • พร้อมสอบ') : complete ? 'กำลังอบรม' : recordSummaries.get(ctx.key)?.loaded ? 'รออบรม' : recordSummaries.get(ctx.key)?.error ? 'ยังตรวจสอบสถานะไม่ได้' : 'กำลังตรวจสอบสถานะ';
    return '<div class="training-quarter-progress" data-quarter-progress="'+q+'"><b>'+label+'</b><span>อบรมเรียบร้อยแล้ว '+complete+' / '+items.length+' หัวข้อ</span><span>'+(available ? 'สอบประจำไตรมาสแล้ว '+results.size+' / '+people.length+' คน • เหลือสอบ '+(people.length-results.size)+' คน' : 'เข้าสู่ระบบเพื่อดูสถานะสอบ')+'</span><small>ผลสอบอิงข้อสอบประจำไตรมาสของ Section นี้ แยกจากหลักฐานอบรมแต่ละหัวข้อ</small></div>';
  }
  async function readSummaries(ctx) {
    if ((!trainingRestReady() && !dbReady()) || navigator.onLine === false) throw Error('ยังไม่เชื่อมต่อฐานข้อมูล');
    if (summaryRequests.has(ctx.key)) return summaryRequests.get(ctx.key);
    const request = readTrainingValue(STATUS_ROOT+'/'+ctx.year+'/'+ctx.sectionKey).then(data=>{
      recordSummaries.set(ctx.key,{loaded:true,data:data || {}});
    }).finally(()=>summaryRequests.delete(ctx.key));
    summaryRequests.set(ctx.key,request);return request;
  }
  function rememberRecord(ctx,q,index,record) {
    const state = recordSummaries.get(ctx.key) || {loaded:false,data:{}};
    state.data[q] ||= {};
    if (record) state.data[q][index] = summaryOf(record); else delete state.data[q][index];
    recordSummaries.set(ctx.key,state);
    if (context().key === ctx.key) { document.querySelector('#examPlanDetailsV592')?.remove(); enhance(); }
  }
  async function readTrainingRecord(ctx, q, topicIndex) {
    if ((!trainingRestReady() && !dbReady()) || navigator.onLine === false) throw Error('กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อตรวจหลักฐานล่าสุด');
    let record = await readTrainingValue(RECORD_ROOT + '/' + ctx.year + '/' + ctx.sectionKey + '/' + q + '/' + topicIndex);
    if(record?.evidenceSource){
      if(q!=='NEW'||!/^ppmsTrainingImplementationRecords\/\d{4}\/[A-Za-z0-9_-]+\/NEW\/group_[A-Za-z0-9_-]+$/.test(record.evidenceSource))throw Error('ข้อมูลอ้างอิงหลักฐานกลุ่มไม่ถูกต้อง');
      const group=await readTrainingValue(record.evidenceSource);
      if(!group||group.trainingGroupId!==record.trainingGroupId||group.topic!==record.topic||!(record.attendeeIds||[]).every(id=>(group.attendeeIds||[]).map(String).includes(String(id))))throw Error('ยังโหลดหลักฐานอบรมกลุ่มไม่ได้ กรุณาลองใหม่');
      record={...record,evidence:group.evidence||[]};
    }
    rememberRecord(ctx,q,topicIndex,record); return record;
  }
  async function saveNewEmployeeGroup(ctx,record,employees,groupId){
    if(!isAdmin())throw Error('บัญชีนี้ไม่มีสิทธิ์บันทึกผลการอบรม');
    if((!trainingRestReady()&&!dbReady())||navigator.onLine===false)throw Error('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนบันทึกหลักฐาน');
    if(!employees.length||!/^group_[A-Za-z0-9_-]+$/.test(groupId))throw Error('กรุณาเลือกผู้เข้าอบรมอย่างน้อย 1 คน');
    assertNewEmployeeTraining(ctx,record);
    const entries=employees.map(employee=>({employee,personal:window.PPMSNewEmployeeTraining.personalContext(ctx,employee)}));
    const existing=await Promise.all(entries.map(({personal})=>readTrainingValue(RECORD_ROOT+'/'+personal.year+'/'+personal.sectionKey+'/NEW/bundle/topic')));
    const recorded=employees.filter((_,i)=>existing[i]!=null);
    if(recorded.length)throw Error('มีบันทึกอบรมแล้ว: '+recorded.map(person=>person.id).join(', ')+' กรุณานำออกจากกลุ่ม หรือแก้ไขผลอบรมรายคน');
    const eligible=new Map(roster(ctx).map(person=>[String(person.id),person]));
    if(employees.some(person=>!person.startDate||eligible.get(String(person.id))?.startDate!==person.startDate))throw Error('ข้อมูลพนักงานเปลี่ยนไป กรุณาเปิดฟอร์มกลุ่มใหม่');
    const groupPath=RECORD_ROOT+'/'+ctx.year+'/'+ctx.sectionKey+'/NEW/'+groupId;
    const group={...record,trainingGroupId:groupId},updates={[groupPath]:group};
    // Upload shared evidence once and commit every personal record/status in the same write.
    const saved=entries.map(({employee,personal})=>{
      const value={...record,year:personal.year,attendeeIds:[String(employee.id)],attendees:[String(employee.id)+' - '+(employee.thaiName||employee.name)],trainingGroupId:groupId,groupAttendees:record.attendees,evidence:[],evidenceSource:groupPath};
      const suffix='/'+personal.year+'/'+personal.sectionKey+'/NEW/bundle';
      updates[RECORD_ROOT+suffix]=value;updates[STATUS_ROOT+suffix]=summaryOf({...value,evidence:record.evidence});
      return {personal,value:{...value,evidence:record.evidence}};
    });
    assertNewEmployeeTraining(ctx,record);
    if(trainingRestReady())await trainingRequest('',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updates)},120000);
    else await ensureFirebase().ref().update(updates);
    for(const {personal,value} of saved)rememberRecord(personal,'NEW','bundle',value);
    return saved;
  }
  async function saveTrainingRecord(ctx, q, topicIndex, record) {
    if (!isAdmin()) throw new Error('บัญชีนี้ไม่มีสิทธิ์บันทึกผลการอบรม');
    if ((!trainingRestReady() && !dbReady()) || navigator.onLine === false) throw new Error('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนบันทึกหลักฐาน');
    if(q==='NEW')assertNewEmployeeTraining(ctx,record);
    const suffix = '/' + ctx.year + '/' + ctx.sectionKey + '/' + q + '/' + topicIndex;
    // Commit evidence and its small dashboard summary atomically; never download attachments for the four cards.
    const updates = {[RECORD_ROOT + suffix]:record,[STATUS_ROOT + suffix]:summaryOf(record)};
    if (trainingRestReady()) await trainingRequest('',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updates)},120000);
    else await ensureFirebase().ref().update(updates);
    rememberRecord(ctx,q,topicIndex,record);
  }
  const EVIDENCE_LIMITS={count:20,file:5*1024*1024,total:50*1024*1024};
  const EVIDENCE_KINDS={other:'หลักฐานอื่นๆ',atmosphere:'บรรยากาศการอบรม',attendance:'ใบลงชื่อ / ใบเทรนนิ่ง',assessment:'ผลการประเมิน'};
  const evidenceSize=bytes=>bytes<1024*1024?Math.max(1,Math.ceil(bytes/1024))+' KB':(bytes/1024/1024).toFixed(2)+' MB';
  function validateEvidence(files){
    if(files.length>EVIDENCE_LIMITS.count)throw Error('แนบหลักฐานได้สูงสุด 20 ไฟล์ต่อหัวข้อ');
    if(files.some(file=>Number(file.size||0)>EVIDENCE_LIMITS.file))throw Error('หลักฐานแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB');
    if(files.reduce((sum,file)=>sum+Number(file.size||0),0)>EVIDENCE_LIMITS.total)throw Error('หลักฐานทั้งหมดต้องมีขนาดรวมไม่เกิน 50 MB');
  }
  async function readEvidenceFile(file) {
    if (!file) throw Error('ไม่พบไฟล์');
    if (!file.size || file.size > EVIDENCE_LIMITS.file) throw Error('ไฟล์ ' + file.name + ' ต้องมีขนาดมากกว่า 0 และไม่เกิน 5 MB');
    const bytes=new Uint8Array(await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('อ่านไฟล์ '+file.name+' ไม่สำเร็จ'));reader.readAsArrayBuffer(file);})),prefix=[...bytes.slice(0,12)].map(b=>b.toString(16).padStart(2,'0')).join('');
    const type=prefix.startsWith('255044462d')?'application/pdf':prefix.startsWith('89504e470d0a1a0a')?'image/png':prefix.startsWith('ffd8ff')?'image/jpeg':prefix.startsWith('52494646')&&prefix.slice(16,24)==='57454250'?'image/webp':'';
    if (!type) throw Error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF ที่ถูกต้อง');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('อ่านไฟล์ ' + file.name + ' ไม่สำเร็จ'));
      reader.onload = () => resolve({name:file.name,type,size:file.size,dataUrl:String(reader.result).replace(/^data:[^;]*;/,'data:'+type+';'),uploadedAt:new Date().toISOString()});
      reader.readAsDataURL(file);
    });
  }
  function evidenceSelection(overlay,existing){
    const form=overlay.querySelector('form'),input=form.elements.evidence,host=overlay.querySelector('[data-training-evidence-queue]'),submit=form.querySelector('[type=submit]'),items=[];
    let nextId=0,processing=null,locked=false,selectionError='';
    const retained=()=>{const removed=new Set([...form.querySelectorAll('[name=removeEvidence]:checked')].map(node=>Number(node.value)));return existing.filter((_,i)=>!removed.has(i));};
    function render(){
      const kept=retained(),working=items.some(item=>item.state==='queued'||item.state==='reading');
      host.innerHTML='<div class="training-evidence-selection-head"><b>หลักฐานเดิม '+kept.length+' ไฟล์ + เลือกใหม่ '+items.length+' ไฟล์ · รวม '+(kept.length+items.length)+' / 20</b>'+((items.length||selectionError)?'<button type="button" class="secondary" data-evidence-clear>ล้างไฟล์ที่เลือกใหม่</button>':'')+'</div><p class="training-evidence-selection-note">กด Choose Files อีกครั้งเพื่อเพิ่มภาพบรรยากาศอบรม ใบเทรนนิ่ง หรือใบลงชื่อ · รูปที่เลือกไว้ยังอยู่ในรายการ</p>'+(selectionError?'<p class="training-evidence-selection-error" role="alert">'+esc(selectionError)+'</p>':'')+'<div class="training-evidence-selected">'+items.map(item=>'<article data-evidence-item="'+item.id+'">'+(item.data?.type.startsWith('image/')?'<img src="'+item.data.dataUrl+'" alt="'+esc(item.file.name)+'">':'<div class="training-evidence-file-icon">'+(item.data?.type==='application/pdf'?'PDF':item.state==='error'?'แนบไม่สำเร็จ':'กำลังเตรียมไฟล์')+'</div>')+'<b>'+esc(item.file.name)+'</b><small>'+esc(evidenceSize(item.file.size))+' · '+(item.state==='ready'?'พร้อมบันทึก':item.state==='error'?'แนบไม่สำเร็จ':'กำลังเตรียม')+'</small>'+(item.error?'<p role="alert">'+esc(item.error)+'</p>':'')+'<label>ประเภทหลักฐาน<select data-evidence-kind="'+item.id+'">'+Object.entries(EVIDENCE_KINDS).map(([value,label])=>'<option value="'+value+'" '+(item.kind===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label><button type="button" class="secondary" data-evidence-remove="'+item.id+'">นำออก</button></article>').join('')+'</div>';
      input.disabled=locked;submit.disabled=locked||working;
      for(const checkbox of form.querySelectorAll('[name=removeEvidence]'))checkbox.disabled=locked;
      host.querySelectorAll('button,select').forEach(node=>node.disabled=locked);
      host.querySelectorAll('[data-evidence-remove]').forEach(button=>button.onclick=()=>{if(locked)return;const i=items.findIndex(item=>item.id===Number(button.dataset.evidenceRemove));if(i>=0)items.splice(i,1);selectionError='';render();});
      host.querySelectorAll('[data-evidence-kind]').forEach(select=>select.onchange=()=>{if(locked)return;const item=items.find(item=>item.id===Number(select.dataset.evidenceKind));if(item)item.kind=select.value;});
      const clear=host.querySelector('[data-evidence-clear]');if(clear)clear.onclick=()=>{if(locked)return;items.length=0;selectionError='';render();};
    }
    function prepare(){
      if(processing)return processing;
      processing=(async()=>{
        let item;while((item=items.find(entry=>entry.state==='queued'))){
          item.state='reading';render();
          try{const data=await readEvidenceFile(item.file);if(items.includes(item)){item.data=data;item.state='ready';}}
          catch(error){if(items.includes(item)){item.state='error';item.error=error.message;}}
          render();
        }
      })().finally(()=>{processing=null;render();});
      return processing;
    }
    function addFiles(){
      if(locked)return;
      const chosen=[...(input.files||[])],known=new Set(items.map(item=>item.key)),added=[];selectionError='';
      for(const file of chosen){const key=JSON.stringify([file.name,file.size,file.lastModified]);if(!known.has(key)){known.add(key);added.push({id:++nextId,key,file,state:'queued',kind:'other',data:null,error:''});}}
      input.value='';
      if(retained().length+items.length+added.length>EVIDENCE_LIMITS.count){selectionError='แนบหลักฐานได้สูงสุด 20 ไฟล์ต่อหัวข้อ กรุณาเลือกเพิ่มให้ไม่เกินจำนวนที่เหลือ';render();return;}
      if([...retained(),...items.map(item=>item.file),...added.map(item=>item.file)].reduce((sum,file)=>sum+Number(file.size||0),0)>EVIDENCE_LIMITS.total){selectionError='หลักฐานทั้งหมดต้องมีขนาดรวมไม่เกิน 50 MB';render();return;}
      items.push(...added);render();void prepare();
    }
    input.onchange=addFiles;
    form.querySelectorAll('[name=removeEvidence]').forEach(checkbox=>checkbox.addEventListener('change',render));
    render();
    return {
      async collect(){if(input.files?.length)addFiles();if(processing)await processing;if(selectionError)throw Error(selectionError);const failed=items.filter(item=>item.state==='error');if(failed.length)throw Error('กรุณานำไฟล์ที่แนบไม่สำเร็จออกก่อนบันทึก: '+failed.map(item=>item.file.name+' ('+item.error+')').join(' · '));return items.map(item=>({...item.data,category:item.kind}));},
      lock(value){locked=value;render();}
    };
  }
  function listHtml(value) {
    const items = lines(value);
    return items.length ? '<ul>' + items.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul>' : '<p class="exam-detail-empty">ยังไม่กำหนด</p>';
  }
  function trainingItems(value) {
    return lines(value).map((line, index) => {
      const parts = line.split(/\s+[—–-]\s+/);
      return { index, title: (parts.shift() || ('หัวข้อ ' + (index + 1))).trim(), detail: parts.join(' — ').trim() || line };
    });
  }
  function trainingTopicHtml(value) {
    const items = trainingItems(value);
    return items.length ? '<div class="exam-training-topic-list">' + items.map(item =>
      '<button type="button" class="exam-training-topic" data-training-topic="' + item.index + '"><span><b>' + esc(item.title) + '</b><small>' + esc(item.detail) + '</small></span><strong>ดูรายละเอียด ›</strong></button>'
    ).join('') + '</div>' : '<p class="exam-detail-empty">ยังไม่กำหนด</p>';
  }
  function planMeta(data) {
    return '<dl class="training-plan-meta"><div><dt>กำหนดอบรม</dt><dd>' + esc(data.plannedDate || 'ยังไม่กำหนดวัน') + '</dd></div><div><dt>ผู้สอน / ผู้รับผิดชอบ</dt><dd>' + esc(data.trainer || 'ยังไม่ระบุ') + '</dd></div><div><dt>กลุ่มเป้าหมาย</dt><dd>' + esc(data.targetGroup || 'พนักงานทุกคนใน Section') + '</dd></div></dl>';
  }
  function cardHtml(q, data, ctx) {
    const months = {Q1:'ม.ค.–มี.ค.',Q2:'เม.ย.–มิ.ย.',Q3:'ก.ค.–ก.ย.',Q4:'ต.ค.–ธ.ค.'};
    return '<article class="exam-detail-card" data-training-quarter="' + q + '"><div class="exam-detail-head"><h4>' + q + '</h4><span>' + months[q] + '</span></div>' +
      '<p class="training-plan-state">' + (data._saved ? esc(planStates[data.planStatus] || planStates.planned) : 'แผนแนะนำ · ยังไม่ได้บันทึก') + '</p>' +
      quarterProgress(ctx,q,data) +
      '<h5>หัวข้อการเทรนนิ่ง (' + trainingItems(data.training).length + ')</h5><ol class="training-plan-topics">' + trainingItems(data.training).map(item => '<li><button type="button" data-plan-topic="' + item.index + '" data-quarter="' + q + '">' + esc(item.title) + '</button>' + (window.PPMSSkillTraining?.badge(ctx.section,item,data)||'') + topicBadge(ctx,q,item) + '<button type="button" class="training-slides-action no-print" data-plan-slides="'+item.index+'" data-quarter="'+q+'">เปิดสไลด์อบรม</button>' + '<button type="button" class="training-materials-action no-print" data-plan-materials="'+item.index+'" data-quarter="'+q+'">'+(isAdmin()?'ไฟล์สไลด์ / อัปโหลด':'ไฟล์สไลด์ที่จัดเก็บ')+'</button>' + '<button type="button" class="training-signature-action no-print" data-plan-signature="'+item.index+'" data-quarter="'+q+'">พิมพ์ใบลงชื่ออบรม</button>' + (isAdmin()?'<button type="button" class="training-evidence-action no-print" data-plan-evidence="'+item.index+'" data-quarter="'+q+'">บันทึกอบรม / หลักฐาน</button>':'') + '</li>').join('') + '</ol>' +
      planMeta(data) + '<p><b>วิธีอบรม:</b> ' + esc(data.method || '-') + '</p><div class="actions no-print"><button type="button" class="exam-detail-view-button" data-exam-detail-view="' + q + '">ดูรายละเอียด ' + q + '</button>' + (isAdmin() ? '<button type="button" class="secondary" data-plan-edit="' + q + '">แก้ไขแผน ' + q + '</button>' : '') + '</div></article>';
  }
  function enhance() {
    const select = document.querySelector('#examPlanSection');
    const title = document.querySelector('#app .page-head h2, #app .page-head h1, #app h2, #app h1');
    if (!select || !title) return;
    const ctx = context();
    const signature = ctx.scope.division + ctx.scope.plant + ctx.key + '__' + (isAdmin() ? 'admin' : 'user');
    const existing = document.querySelector('#examPlanDetailsV592');
    if (existing?.dataset.signature === signature) return;
    if (existing) existing.remove();
    const host = document.createElement('section');
    host.id = 'examPlanDetailsV592';
    host.dataset.signature = signature;
    host.className = 'panel exam-plan-details-v592';
    const fresh = freshPlans.get(ctx.key);
    const cached = fresh?.plan || localRead(ctx.key);
    const plan = {...defaults(ctx.section), ...(cached || {})};
    host.__trainingContext=ctx;host.__trainingPlan=plan;
    let planStatusMessage = '', planRetry = false;
    const controls = document.querySelector('.exam-plan-controls');
    controls?.after(host);
    const render = () => {
      if (!document.body.contains(host)) return;
      host.innerHTML = '<div class="exam-detail-title"><div><h3>แผนการเทรนนิ่ง Q1–Q4</h3><p>' +
        esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><button type="button" class="secondary no-print" data-training-refresh>อัปเดตสถานะ</button></div><p class="modal-note">หัวข้อแนะนำสามารถปรับให้ตรงกับงานจริงของ Section · กดชื่อหัวข้อเพื่อดูเนื้อหาและแบบฟอร์มอบรม</p>' +
        '<p class="modal-note">อบรมเสร็จแล้ว กดบันทึกอบรม / หลักฐาน แล้วเลือกยืนยันอบรมเสร็จ ระบบจะแสดงพร้อมสอบ • แนบรูป ใบลงชื่อ หรือ PDF เพิ่มเติมได้</p><p class="modal-note no-print" data-plan-sync role="status"></p><p class="modal-note no-print" data-evidence-sync role="status"></p><div class="exam-detail-grid">' + QUARTERS.map(q => cardHtml(q, plan[q] || defaults(ctx.section)[q],ctx)).join('') + '</div>';
      host.querySelectorAll('[data-plan-topic]').forEach(button => { button.onclick = () => openTrainingTopic(ctx, button.dataset.quarter, plan[button.dataset.quarter], Number(button.dataset.planTopic)); });
      host.querySelectorAll('[data-plan-slides]').forEach(button => { button.onclick = () => { const q=button.dataset.quarter,quarter=plan[q],item=trainingItems(quarter.training)[Number(button.dataset.planSlides)];window.PPMSTrainingLessons?.open({ctx,q,quarter,item},button); }; });
      host.querySelectorAll('[data-plan-materials]').forEach(button=>{button.onclick=()=>{const q=button.dataset.quarter,quarter=plan[q],item=trainingItems(quarter.training)[Number(button.dataset.planMaterials)];window.PPMSTrainingLessonFiles?.open({ctx,q,quarter,item},button);};});
      host.querySelectorAll('[data-plan-signature]').forEach(button=>{button.onclick=()=>{const q=button.dataset.quarter,quarter=plan[q],item=trainingItems(quarter.training)[Number(button.dataset.planSignature)];window.PPMSTrainingSignatureForm?.open({ctx,q,quarter,item},button);};});
      host.querySelectorAll('[data-plan-evidence]').forEach(button => { button.onclick = () => openTrainingTopic(ctx, button.dataset.quarter, plan[button.dataset.quarter], Number(button.dataset.planEvidence),true); });
      host.querySelector('[data-training-refresh]').onclick=()=>{
        window.PPMSQuarterlyTraining?.refreshNotices(ctx);
        recordSummaries.delete(ctx.key);freshPlans.delete(ctx.key);host.remove();enhance();
      };
      host.querySelectorAll('[data-plan-edit]').forEach(button => { button.onclick = () => openEditor(ctx, plan, button.dataset.planEdit); });
      host.querySelectorAll('[data-exam-detail-view]').forEach(element => {
        element.onclick = event => {
          event.stopPropagation();
          openViewer(ctx, plan, element.dataset.examDetailView);
        };
        element.onkeydown = event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openViewer(ctx, plan, element.dataset.examDetailView);
          }
        };
      });
      status(planStatusMessage,planRetry);
    };
    const status = (message, retry = false) => {
      planStatusMessage=message;planRetry=retry;
      const node = host.querySelector('[data-plan-sync]');
      if (!node) return;
      node.textContent = message;
      if (retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary';
        button.textContent = 'ลองเชื่อมต่อใหม่';
        button.onclick = sync;
        node.append(' ', button);
      }
    };
    const sync = () => {
      status(cached ? 'แสดงแผนที่เก็บไว้ในเครื่อง · กำลังตรวจข้อมูลล่าสุด...' : 'แสดงแผนแนะนำ · กำลังตรวจแผนที่บันทึกไว้...');
      readPlan(ctx).then(latest => {
        if (!document.body.contains(host)) return;
        Object.assign(plan, latest);
        render();
        status('ข้อมูลแผนล่าสุด');
      }).catch(() => {
        if (!document.body.contains(host)) return;
        status('ยังยืนยันข้อมูลล่าสุดไม่ได้ · ' + (cached ? 'แสดงแผนที่เก็บไว้ในเครื่อง' : 'แสดงแผนแนะนำ ซึ่งอาจต่างจากแผนที่บันทึกไว้'), true);
      });
    };
    render();
    if (fresh && Date.now() - fresh.at < PLAN_FRESHNESS) status('ข้อมูลแผนล่าสุด');
    else sync();
    if (!recordSummaries.has(ctx.key)) {
      recordSummaries.set(ctx.key,{loaded:false,data:{}});
      host.querySelector('[data-evidence-sync]').textContent='กำลังตรวจสถานะหลักฐาน...';
      readSummaries(ctx).then(()=>{
        if (!document.body.contains(host)) return;
        render();
      }).catch(error=>{
        if (!document.body.contains(host)) return;
        const state=recordSummaries.get(ctx.key)||{loaded:false,data:{}};state.error=error.message;recordSummaries.set(ctx.key,state);render();
        const node=host.querySelector('[data-evidence-sync]');node.textContent='ยังตรวจสถานะหลักฐานไม่ได้ กรุณาเปิดหัวข้อเพื่อตรวจข้อมูลล่าสุด';
      });
    }
  }
  function openViewer(ctx, plan, q) {
    const current = plan[q] || defaults(ctx.section)[q];
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay';
    overlay.innerHTML = '<section class="exam-detail-viewer" role="dialog" aria-modal="true" aria-label="รายละเอียด ' + q + '">' +
      '<div class="exam-viewer-head"><div><span class="exam-viewer-quarter">' + q + '</span><h2>รายละเอียด Training & Examination</h2><p>' + esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<div class="exam-viewer-section training"><h3>📘 หัวข้อการเทรนนิ่ง</h3><p class="exam-topic-hint">กดหัวข้อเพื่อดูรายละเอียดว่าอบรมอะไรและฝึกอย่างไร</p>' + trainingTopicHtml(current.training) + '</div>' +
      '<div class="exam-viewer-section exam"><h3>📝 หัวข้อ Examination</h3>' + listHtml(trainingItems(current.training).map(item=>item.title).join('\n')) + '</div>' +
      planMeta(current) + '<div class="exam-viewer-meta"><p><b>วิธีดำเนินการ:</b> ' + esc(current.method || '-') + '</p><p><b>เกณฑ์ผ่าน:</b> ' + esc(current.criteria || '-') + '</p></div>' +
      (isAdmin() ? '<div class="actions"><button type="button" data-edit>แก้ไขรายละเอียด ' + q + '</button></div>' : '') + '</section>';
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    const edit = overlay.querySelector('[data-edit]');
    if (edit) edit.onclick = () => { overlay.remove(); openEditor(ctx, plan, q); };
    overlay.querySelectorAll('[data-training-topic]').forEach(button => {
      button.onclick = () => openTrainingTopic(ctx, q, current, Number(button.dataset.trainingTopic));
    });
    document.body.appendChild(overlay);
  }
  function openTrainingTopic(ctx, q, quarter, index, editImmediately = false) {
    const item = trainingItems(quarter.training)[index];
    if (!item) return;
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay exam-topic-overlay';
    overlay.innerHTML = '<section class="exam-training-topic-viewer" role="dialog" aria-modal="true" aria-label="รายละเอียดหัวข้อ ' + esc(item.title) + '">' +
      '<div class="exam-viewer-head"><div><span class="exam-viewer-quarter">' + q + '</span><h2>' + esc(item.title) + '</h2><p>' + esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<section class="training-lesson-topic-intro"><h3>สไลด์อบรมหัวข้อนี้</h3><p>สรุปเนื้อหา จุดควบคุม ตัวอย่างหน้างาน แบบฝึก และคำถามทบทวน</p><button type="button" data-open-training-slides>เปิดสไลด์อบรม</button> <button type="button" data-open-training-files>ไฟล์สไลด์ที่จัดเก็บ / อัปโหลด</button></section>' +
      '<div class="exam-topic-detail-grid"><article><h3>🎯 วัตถุประสงค์</h3><p>ให้ผู้เข้าอบรมเข้าใจมาตรฐานของหัวข้อนี้ สามารถอธิบายขั้นตอน และนำไปปฏิบัติกับงานจริงได้อย่างถูกต้อง</p></article>' +
      '<article><h3>📚 เนื้อหาที่ต้องอบรม</h3><p>' + esc(item.detail) + '</p></article>' +
      '<article><h3>🛠️ วิธีอบรมและฝึกปฏิบัติ</h3><p>' + esc(quarter.method || 'ผู้สอนอธิบายมาตรฐาน สาธิต แล้วให้พนักงานฝึกปฏิบัติจริง') + '</p></article>' +
      '<article><h3>✅ การประเมินผล</h3><p>' + esc(quarter.criteria || 'ประเมินความเข้าใจและตรวจการปฏิบัติงานจริง') + '</p></article></div>' +
      '<div class="exam-topic-related"><h3>📝 หัวข้อสอบที่เกี่ยวข้อง</h3>' + listHtml(item.title+' — '+item.detail) + '</div>' +
      '<div class="training-record-panel" data-record-panel><h3>📋 แบบฟอร์มและหลักฐานการอบรม</h3><p>กำลังตรวจสอบข้อมูลการอบรม...</p></div>' +
      '<div class="actions"><button type="button" data-print-signature>พิมพ์ใบลงชื่ออบรม</button><button type="button" data-training-form disabled>แนบหลักฐาน / บันทึกผลอบรม</button><button type="button" class="secondary" data-print-training disabled>พิมพ์ผลอบรม / หลักฐาน</button></div></section>';
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    overlay.querySelector('[data-open-training-slides]').onclick=event=>window.PPMSTrainingLessons?.open({ctx,q,quarter,item},event.currentTarget);
    overlay.querySelector('[data-open-training-files]').onclick=event=>window.PPMSTrainingLessonFiles?.open({ctx,q,quarter,item},event.currentTarget);
    let record = null, recordLoaded = false, loadingRecord = null;
    const recordPanel = overlay.querySelector('[data-record-panel]');
    const printButton = overlay.querySelector('[data-print-training]');
    const formButton = overlay.querySelector('[data-training-form]');
    if (!isAdmin()) formButton.hidden = true;
    const loadRecord = () => {
      if (loadingRecord) return loadingRecord;
      formButton.disabled = true;
      recordPanel.textContent = 'กำลังตรวจสอบข้อมูลการอบรม...';
      loadingRecord = readTrainingRecord(ctx, q, index).then(value => {
        if (value && value.topic !== item.title) throw Error('หัวข้อในแผนเปลี่ยนไป หลักฐานเดิมเป็นของ “'+value.topic+'” กรุณาตรวจสอบแผนก่อนบันทึก');
        if (!document.body.contains(overlay)) return false;
        record = value || null;recordLoaded = true;
        if (record) {
          const evidence = Array.isArray(record.evidence) ? record.evidence : [], done = trainingDone(summaryOf(record));
          recordPanel.innerHTML = '<h3>📋 แบบฟอร์มและหลักฐานการอบรม</h3><div class="training-record-status '+(done?'done':'')+'"><b>'+(done?'อบรมเรียบร้อยแล้ว':'บันทึกแบบฟอร์มแล้ว • รอยืนยันอบรมเสร็จ')+'</b><span>' + esc(record.trainingDate || '-') + ' • Trainer: ' + esc(record.trainer || '-') + ' • หลักฐาน ' + evidence.length + ' ไฟล์</span></div>' + evidenceHtml(evidence) + participantProgress(ctx,q,record);
          printButton.disabled = false;
        } else {
          recordPanel.innerHTML = '<h3>📋 แบบฟอร์มและหลักฐานการอบรม</h3><div class="training-record-status"><b>ยังไม่ได้บันทึกผลการอบรม</b><span>กรอกรายละเอียดก่อนพิมพ์แบบฟอร์มไปใช้เทรนนิ่ง</span></div>';
        }
        return true;
      }).catch(error => {
        if (document.body.contains(overlay)) {
          recordPanel.textContent = 'ยังโหลดหลักฐานไม่ได้: '+error.message+' • กดลองใหม่ได้จากหน้านี้';
          const retry=document.createElement('button');retry.type='button';retry.className='secondary';retry.textContent='ลองโหลดหลักฐานอีกครั้ง';retry.onclick=()=>void loadRecord();recordPanel.append(' ',retry);
        }
        return false;
      }).finally(()=>{loadingRecord=null;if(document.body.contains(overlay))formButton.disabled=false;});
      return loadingRecord;
    };
    formButton.onclick = async () => {
      if (!isAdmin() || (!recordLoaded && !await loadRecord()) || !document.body.contains(overlay)) return;
      openTrainingRecordEditor(ctx, q, quarter, index, item, record, value => {
        record = value;overlay.remove();openTrainingTopic(ctx, q, quarter, index);
      });
    };
    loadRecord().then(ok=>{if(ok && editImmediately && isAdmin()) formButton.click();});
    overlay.querySelector('[data-print-signature]').onclick=event=>window.PPMSTrainingSignatureForm?.open({ctx,q,quarter,item,record:record||{}},event.currentTarget);
    printButton.onclick = () => { if (record) openTrainingPrintForm(ctx, q, quarter, item, record); };
  }
  function evidenceHtml(evidence) {
    evidence = evidence.filter(file => /^(?:image\/(?:jpeg|png|webp)|application\/pdf)$/.test(file?.type || '') && new RegExp('^data:' + file.type + ';base64,[A-Za-z0-9+/=]+$').test(file.dataUrl || ''));
    if (!evidence.length) return '<p class="exam-detail-empty">ยังไม่ได้แนบหลักฐาน</p>';
    return '<div class="training-evidence-grid">' + evidence.map((file, index) => file.type.startsWith('image/')
      ? '<a href="' + file.dataUrl + '" target="_blank" rel="noopener"><img src="' + file.dataUrl + '" alt="หลักฐาน ' + (index + 1) + '"><span>' + esc(file.name) + (EVIDENCE_KINDS[file.category]?' · '+esc(EVIDENCE_KINDS[file.category]):'') + '</span></a>'
      : '<a class="training-evidence-file" href="' + file.dataUrl + '" download="' + esc(file.name) + '"><b>PDF</b><span>' + esc(file.name) + (EVIDENCE_KINDS[file.category]?' · '+esc(EVIDENCE_KINDS[file.category]):'') + '</span></a>').join('') + '</div>';
  }
  function participantProgress(ctx,q,record) {
    const ids=new Set((record.attendeeIds || []).map(String)), {people,results}=examProgress(ctx,q), selected=people.filter(e=>ids.has(String(e.id)));
    if (!selected.length) return '<p class="modal-note">ยังไม่ได้เชื่อมรายชื่อกับรหัสพนักงาน เลือกผู้เข้าอบรมเพื่อดูสถานะรายคน</p>';
    return '<h4>สถานะผู้เข้าอบรม · สอบประจำไตรมาส '+q+'</h4><div class="table-wrap"><table><thead><tr><th>รหัส / ชื่อ</th><th>อบรม</th><th>การสอบ</th><th>ผลสอบ</th></tr></thead><tbody>'+selected.map(e=>{
      const result=results.get(String(e.id)), decision=result&&window.PPMSIndividualReports?.decision(result);
      const outcome=decision?.label || (result ? 'รอตรวจสอบผล' : '—');
      return '<tr><td>'+esc(e.id)+' · '+esc(e.thaiName || e.name)+'</td><td>'+(trainingDone(summaryOf(record))?'อบรมเรียบร้อยแล้ว':'รออบรม')+'</td><td>'+(result?'สอบเสร็จแล้ว':trainingDone(summaryOf(record))?'พร้อมสอบ':'รออบรม')+'</td><td>'+esc(outcome)+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  function attendeePicker(ctx,current,groupEmployees) {
    const ids=new Set((current.attendeeIds || []).map(String));
    // Legacy names are retained in the text field until an administrator links employee IDs.
    return '<fieldset class="full training-attendee-picker"><legend>เลือกผู้เข้าอบรม (เชื่อมสถานะสอบรายคน)</legend><input type="search" data-training-person-search placeholder="ค้นหา รหัส ชื่อ หรือวันเริ่มงาน"><div class="actions"><button type="button" class="secondary" data-training-select-all>เลือกทุกคนที่แสดง</button><button type="button" class="secondary" data-training-clear>ล้างที่เลือก</button><span data-training-selected-count role="status"></span></div>'+(groupEmployees?'<p class="modal-note">เลือกพนักงานใหม่อายุงานไม่เกิน 1 เดือนใน Section นี้ กรอกข้อมูลและแนบหลักฐานครั้งเดียว ระบบจะบันทึกแยกเป็นรายคน · ผู้ที่มีบันทึกแล้วให้แก้ไขจากหน้ารายคน</p>':'')+'<div class="training-attendee-list">'+(groupEmployees||roster(ctx)).map(e=>'<label data-person-search="'+esc([e.id,e.name,e.thaiName,...(groupEmployees?[e.startDate]:[])].join(' ').toLowerCase())+'"><input type="checkbox" name="attendeeIds" value="'+esc(e.id)+'" '+(ids.has(String(e.id))?'checked':'')+' '+(groupEmployees&&!e.startDate?'disabled':'')+'> '+esc(e.id)+' · '+esc(e.thaiName || e.name)+(groupEmployees?' · '+esc(e.startDate||'กรุณาระบุวันเริ่มงานก่อน'):'')+'</label>').join('')+'</div></fieldset>';
  }
  function openTrainingRecordEditor(ctx, q, quarter, index, item, existing, onSaved, options={}) {
    options={...options,employee:options.employee?{...options.employee}:null,groupEmployees:options.groupEmployees?.map(person=>({...person}))};
    const groupId=options.groupEmployees?'group_'+Date.now().toString(36)+'_'+Array.from(crypto.getRandomValues(new Uint32Array(3)),value=>value.toString(36)).join(''):null;
    const current = existing || (options.employee?{attendeeIds:[String(options.employee.id)]}:{});
    const evidence = Array.isArray(current.evidence) ? current.evidence : [];
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay exam-topic-overlay';
    overlay.innerHTML = '<form class="training-record-editor"><div class="exam-viewer-head"><div><span class="exam-viewer-quarter">' + q + '</span><h2>'+(options.groupEmployees?'อบรมพนักงานเป็นกลุ่ม':'Training Implementation Record')+'</h2><p>' + esc(ctx.section) + ' • ' + esc(item.title) + '</p></div><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<div class="training-record-fields"><label>วันที่อบรม<input type="date" name="trainingDate" max="'+today()+'" value="' + esc(current.trainingDate || today()) + '" required></label>' +
      '<label>เวลาอบรม<input type="text" name="trainingTime" value="' + esc(current.trainingTime || '') + '" placeholder="เช่น 09:00–11:00" required></label>' +
      '<label>สถานที่อบรม<input name="trainingPlace" value="' + esc(current.trainingPlace || '') + '" placeholder="Training place" required></label>' +
      '<label>ผู้ฝึกอบรม<input name="trainer" value="' + esc(current.trainer || '') + '" placeholder="Trainer" required></label>' +
      '<label class="full">หน่วยงานที่อบรม<input name="trainingUnit" value="' + esc(current.trainingUnit || ctx.section) + '" required></label>' +
      (options.employee?'<fieldset class="full training-new-employee"><legend>พนักงานที่เข้าอบรม</legend><p>'+esc(options.employee.id)+' · '+esc(options.employee.thaiName||options.employee.name)+'<br>'+esc(ctx.section)+' • เริ่มงาน '+esc(options.employee.startDate||'—')+'</p><input type="hidden" name="attendeeIds" value="'+esc(options.employee.id)+'"></fieldset>':attendeePicker(ctx,current,options.groupEmployees)) +
      '<label class="full">รายชื่อเพิ่มเติม / รายชื่อเดิมที่ยังไม่เชื่อมรหัส (1 คนต่อ 1 บรรทัด)<textarea name="attendees" rows="3" placeholder="ผู้เข้าอบรมเพิ่มเติม (ถ้ามี)">' + esc((current.additionalAttendees || (current.attendeeIds?.length ? [] : current.attendees) || []).join('\n')) + '</textarea><small>รายชื่อที่พิมพ์เพิ่มเติมจะไม่เชื่อมผลสอบอัตโนมัติ</small></label>' +
      '<label class="full">Training implementation effect / ผลการอบรม<textarea name="effect" rows="4" placeholder="สรุปผล ความเข้าใจ ผล OJT หรือสิ่งที่ต้องติดตาม" required>' + esc(current.effect || '') + '</textarea></label>' +
      '<fieldset class="full"><legend>Planned training?</legend><label><input type="radio" name="planned" value="yes" ' + (current.planned !== 'no' ? 'checked' : '') + '> Yes</label><label><input type="radio" name="planned" value="no" ' + (current.planned === 'no' ? 'checked' : '') + '> No, but recorded</label></fieldset>' +
      '<label class="full training-completion-confirmation"><span><input type="checkbox" name="trainingCompleted" '+(current.trainingCompleted === true?'checked':'')+'> ยืนยันอบรมเสร็จเรียบร้อยแล้ว / พร้อมสอบ</span><small>เลือกเมื่ออบรมจริงเสร็จแล้ว สามารถแนบหลักฐานเพิ่มเติมภายหลังได้</small></label>' +
      '<div class="full evidence-upload"><label>แนบหลักฐานการอบรม<input type="file" name="evidence" accept="image/jpeg,image/png,image/webp,application/pdf" multiple><small>รูปบรรยากาศอบรม ใบเทรนนิ่ง ใบลงชื่อ หรือผลประเมิน • สูงสุด 20 ไฟล์ • ไม่เกิน 5 MB/ไฟล์ • ขนาดรวมไม่เกิน 50 MB</small></label><div data-training-evidence-queue></div></div></div>' +
      (evidence.length ? '<div class="existing-evidence"><h3>หลักฐานที่บันทึกแล้ว</h3>' + evidence.map((file,i) => '<label><input type="checkbox" name="removeEvidence" value="' + i + '"> ลบ ' + esc(file.name) + '</label>').join('') + evidenceHtml(evidence) + '</div>' : '') +
      '<p class="modal-note">ยืนยันอบรมเสร็จแล้วบันทึกสำเร็จ จะแสดง “อบรมเรียบร้อยแล้ว • พร้อมสอบ” หากยังสอบไม่ครบ • ผลสอบจะอัปเดตจากการสอบจริง</p><label><input type="checkbox" name="printAfterSave"> เปิดแบบฟอร์มพิมพ์หลังบันทึก</label><p data-training-save-status role="status"></p><div class="actions"><button type="submit">บันทึกหลักฐาน / ผลอบรม</button><button type="button" class="secondary" data-close>ยกเลิก</button></div></form>';
    const selectedEvidence=evidenceSelection(overlay,evidence);let savingRecord=false;
    const picker=overlay.querySelector('.training-attendee-picker');
    if(picker){const count=()=>{picker.querySelector('[data-training-selected-count]').textContent='เลือกแล้ว '+picker.querySelectorAll('[name=attendeeIds]:checked').length+' คน';};picker.onchange=count;count();
    picker.querySelector('[data-training-person-search]').oninput=event=>{picker.querySelectorAll('[data-person-search]').forEach(row=>row.hidden=!row.dataset.personSearch.includes(event.target.value.toLowerCase()));};
    picker.querySelector('[data-training-select-all]').onclick=()=>{picker.querySelectorAll('[data-person-search]:not([hidden]) input:not(:disabled)').forEach(box=>box.checked=true);count();};
    picker.querySelector('[data-training-clear]').onclick=()=>{picker.querySelectorAll('[name="attendeeIds"]').forEach(box=>box.checked=false);count();};}
    if(options.employee||options.groupEmployees){overlay.querySelector('[name=attendees]').closest('label').hidden=true;}
    overlay.querySelectorAll('[data-close]').forEach(button => button.onclick = () => {if(!savingRecord)overlay.remove();});
    overlay.onclick = event => { if (event.target === overlay&&!savingRecord) overlay.remove(); };
    overlay.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      if(savingRecord)return;
      const form = event.currentTarget, submit = form.querySelector('[type="submit"]');
      const fd=new FormData(form);savingRecord=true;
      const preparing=selectedEvidence.collect();selectedEvidence.lock(true);submit.disabled=true;submit.textContent='กำลังเตรียมหลักฐาน...';
      let added;
      try { added=await preparing; } catch(error) {savingRecord=false;selectedEvidence.lock(false);submit.textContent='บันทึกหลักฐาน / ผลอบรม';overlay.querySelector('[data-training-save-status]').textContent=error.message;return;}
      submit.textContent='กำลังบันทึก...';
      try {
        const removed = new Set(fd.getAll('removeEvidence').map(Number));
        const kept = evidence.filter((_, i) => !removed.has(i));
        validateEvidence([...kept,...added]);
        const eligible=new Map(roster(ctx).map(e=>[String(e.id),e])), attendeeIds=options.employee?[String(options.employee.id)]:fd.getAll('attendeeIds').map(String);
        if(options.employee&&eligible.get(String(options.employee.id))?.startDate!==options.employee.startDate)throw Error('ข้อมูลการจ้างงานเปลี่ยนไป กรุณาเปิดแผนพนักงานใหม่อีกครั้ง');
        if (attendeeIds.some(id=>!eligible.has(id))) throw Error('รายชื่อพนักงานเปลี่ยนไป กรุณาเปิดฟอร์มใหม่');
        if (String(fd.get('trainingDate')) > today()) throw Error('วันที่อบรมต้องไม่เป็นวันในอนาคต');
        const groupPeople=options.groupEmployees?.filter(person=>attendeeIds.includes(String(person.id)));
        if(groupPeople&&(!groupPeople.length||groupPeople.length!==attendeeIds.length))throw Error('กรุณาเลือกผู้เข้าอบรมอย่างน้อย 1 คน');
        const newPeople=groupPeople||(options.employee?[options.employee]:[]);
        if(newPeople.some(person=>!/^\d{4}-\d{2}-\d{2}$/.test(person.startDate||'')||eligible.get(String(person.id))?.startDate!==person.startDate))throw Error('ข้อมูลวันเริ่มงานเปลี่ยนไปหรือยังไม่ครบ กรุณาเปิดฟอร์มใหม่');
        if(q==='NEW'&&newPeople.some(person=>!newEmployeeEligible(eligible.get(String(person.id)))))throw Error('อบรมพนักงานใหม่ได้เฉพาะผู้มีอายุงานไม่เกิน 1 เดือนนับจากวันเริ่มงาน');
        if(newPeople.some(person=>String(fd.get('trainingDate'))<person.startDate))throw Error('วันที่อบรมต้องไม่ก่อนวันเริ่มงานของผู้เข้าอบรม');
        if ((fd.has('trainingCompleted') || kept.length+added.length) && !attendeeIds.length && !lines(fd.get('attendees')).length) throw Error('กรุณาเลือกหรือระบุผู้เข้าอบรมอย่างน้อย 1 คน');
        const additionalAttendees=options.employee||options.groupEmployees?[]:lines(fd.get('attendees'));
        const record = {
          section:ctx.section, year:ctx.year, quarter:q, topicIndex:index, topic:item.title, detail:item.detail,
          trainingDate:String(fd.get('trainingDate') || ''), trainingTime:String(fd.get('trainingTime') || ''),
          trainingPlace:String(fd.get('trainingPlace') || ''), trainer:String(fd.get('trainer') || ''),
          trainingUnit:String(fd.get('trainingUnit') || ''), attendeeIds, additionalAttendees,
          attendees:[...attendeeIds.map(id=>id+' - '+(eligible.get(id).thaiName || eligible.get(id).name)),...additionalAttendees],
          trainingCompleted:fd.has('trainingCompleted'), effect:String(fd.get('effect') || ''), planned:String(fd.get('planned') || 'yes'), evidence:[...kept, ...added],
          method:quarter.method || '', criteria:quarter.criteria || '', updatedAt:new Date().toISOString()
        };
        if(options.trainingCourse)record.trainingCourse=JSON.parse(JSON.stringify(options.trainingCourse));
        if(groupPeople){
          if(q!=='NEW'||index!=='bundle')throw Error('ฟอร์มกลุ่มนี้ใช้สำหรับหลักสูตรพนักงานใหม่');
          const saved=await saveNewEmployeeGroup(ctx,record,groupPeople,groupId);record.groupRecords=saved;
        }else await saveTrainingRecord(ctx, q, index, record);
        overlay.remove();
        if (onSaved) onSaved(record);
        if (fd.get('printAfterSave')) {if(window.PPMSTrainingSignatureForm)window.PPMSTrainingSignatureForm.open({ctx,q,quarter,item,record});else openTrainingPrintForm(ctx,q,quarter,item,record);}
      } catch (error) {
        savingRecord=false;selectedEvidence.lock(false);submit.disabled=false;submit.textContent='บันทึกหลักฐาน / ผลอบรม';
        overlay.querySelector('[data-training-save-status]').textContent='บันทึกไม่สำเร็จ: ' + error.message;
      }
    };
    document.body.appendChild(overlay);
  }
  function openTrainingPrintForm(ctx, q, quarter, item, record) {
    const overlay = document.createElement('div');
    overlay.className = 'training-print-overlay';
    const attendees = record.attendees?.length ? record.attendees : Array.from({length:8}, () => '');
    const imageEvidence = (record.evidence || []).filter(file => file.type.startsWith('image/'));
    overlay.innerHTML = '<div class="training-print-toolbar no-print"><button type="button" data-print>พิมพ์แบบฟอร์ม</button><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<section class="training-record-sheet"><h1>Training implementation effect record sheet.</h1>' +
      '<div class="tr-row tr-program"><b>Training program</b><div><h2>' + esc(q + ' — ' + item.title) + '</h2><p>' + esc(item.detail) + '</p><p><b>Training method:</b> ' + esc(quarter.method || '-') + '</p><p><b>Evaluation criteria:</b> ' + esc(quarter.criteria || '-') + '</p></div></div>' +
      '<div class="tr-row tr-two"><b>Training Date<br>(date, hour)</b><span>' + esc(record.trainingDate) + '<br>' + esc(record.trainingTime) + '</span><b>Training place</b><span>' + esc(record.trainingPlace) + '</span></div>' +
      '<div class="tr-row tr-two"><b>Training and<br>implementation unit</b><span>' + esc(record.trainingUnit) + '</span><b>Trainer</b><span>' + esc(record.trainer) + '</span></div>' +
      '<div class="tr-signatures"><b>Signature :</b><table><thead><tr><th>No.</th><th>Employee ID / Name</th><th>Signature</th></tr></thead><tbody>' + attendees.map((name,i) => '<tr><td>' + (i+1) + '</td><td>' + esc(name) + '</td><td></td></tr>').join('') + '</tbody></table></div>' +
      '<div class="tr-planned"><b>Planned training?</b><span>' + (record.planned === 'no' ? '☐ Yes　　☑ No, But recorded' : '☑ Yes　　☐ No, But recorded') + '</span></div>' +
      '<div class="tr-effect"><b>Training implementation effect:</b><p>' + esc(record.effect).replace(/\n/g,'<br>') + '</p></div></section>' +
      (imageEvidence.length ? '<section class="training-evidence-sheet"><h1>Training Evidence / หลักฐานการอบรม</h1><p><b>' + esc(ctx.section) + ' • ' + esc(q) + ' • ' + esc(item.title) + '</b><br>' + esc(record.trainingDate) + ' • Trainer: ' + esc(record.trainer) + '</p><div>' + imageEvidence.map((file,i) => '<figure><img src="' + file.dataUrl + '" alt="Evidence ' + (i+1) + '"><figcaption>' + (i+1) + '. ' + esc(file.name) + '</figcaption></figure>').join('') + '</div></section>' : '');
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.querySelector('[data-print]').onclick = () => { document.body.classList.add('training-form-printing'); window.print(); setTimeout(() => document.body.classList.remove('training-form-printing'), 600); };
    document.body.appendChild(overlay);
  }
  function openEditor(ctx, plan, q) {
    if (!isAdmin()) return;
    const current = plan[q] || defaults(ctx.section)[q];
    const expected = current._saved ? {...current} : null; if (expected) delete expected._saved;
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay';
    overlay.innerHTML = '<form class="exam-detail-editor"><h2>' + q + ' · ' + esc(ctx.section) + '</h2>' +
      '<label>กำหนดอบรม<input name="plannedDate" type="date" value="' + esc(current.plannedDate || '') + '"></label>' +
      '<label>ผู้สอน / ผู้รับผิดชอบ<input name="trainer" maxlength="180" value="' + esc(current.trainer || '') + '"></label>' +
      '<label>กลุ่มเป้าหมาย<input name="targetGroup" maxlength="300" value="' + esc(current.targetGroup || 'พนักงานทุกคนใน Section') + '"></label>' +
      '<label>สถานะแผน<select name="planStatus">' + Object.entries(planStates).map(([key,label]) => '<option value="' + key + '" ' + (key === (current.planStatus || 'planned') ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>' +
      '<label>หัวข้อและรายละเอียด Training (1 บรรทัดต่อ 1 หัวข้อ พร้อมอธิบายสิ่งที่ต้องสอน)<textarea name="training" rows="7" required>' + esc(current.training) + '</textarea></label>' +
      '<div data-skill-links></div><p>หัวข้อ Examination ใช้หัวข้อเดียวกับ Training และเนื้อหาสไลด์ที่บันทึกไว้</p>' +
      '<label>วิธีดำเนินการ<input name="method" value="' + esc(current.method) + '" required></label>' +
      '<label>เกณฑ์ผ่าน<input name="criteria" value="' + esc(current.criteria) + '" required></label>' +
      '<div class="actions"><button type="submit">บันทึกแผน ' + q + '</button><button type="button" class="secondary" data-close>ยกเลิก</button></div></form>';
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    const linkHost=overlay.querySelector('[data-skill-links]'),trainingField=overlay.querySelector('[name=training]');
    const drawLinks=()=>{if(!linkHost||!window.PPMSSkillTraining)return;const api=window.PPMSSkillTraining,existing={...current.skillLinks};for(const select of linkHost.querySelectorAll('select'))existing[select.dataset.topic]=select.value;linkHost.innerHTML='<h3>เชื่อมหัวข้อกับ Skill Matrix</h3>'+trainingItems(trainingField.value).map(item=>{const name=api.normalize(item.title),key=api.resolve(ctx.section,item,{skillLinks:existing});return '<label>'+esc(item.title)+'<select data-topic="'+esc(name)+'"><option value="">หัวข้อเสริม (ไม่ปรับ Skill)</option>'+api.skills(ctx.section).map(skill=>'<option '+(skill===key?'selected':'')+'>'+esc(skill)+'</option>').join('')+'</select></label>'}).join('')};drawLinks();if(trainingField)trainingField.addEventListener('change',drawLinks);
    overlay.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget, submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const fd = new FormData(form);
        const date = String(fd.get('plannedDate') || '');
        const quarterIndex = QUARTERS.indexOf(q);
        if (date && (Number(date.slice(0,4)) !== ctx.year || Math.floor((Number(date.slice(5,7))-1)/3) !== quarterIndex)) throw new Error('วันอบรมต้องอยู่ใน ' + q + ' ปี ' + ctx.year);
        const draft = {...plan, [q]: {
          plannedDate:date, trainer:String(fd.get('trainer') || '').trim(), targetGroup:String(fd.get('targetGroup') || '').trim(), planStatus:String(fd.get('planStatus') || 'planned'),
          training: String(fd.get('training') || '').trim(),
          exam:trainingItems(String(fd.get('training')||'')).map(item=>item.title).join('\n'),
          skillLinks:Object.fromEntries([...linkHost.querySelectorAll('select')].map(select=>[select.dataset.topic,select.value])),
          method: String(fd.get('method') || '').trim(),
          criteria: String(fd.get('criteria') || '').trim()
        }};
        await savePlan(ctx, draft, q, expected);
        overlay.remove();
        document.querySelector('#examPlanDetailsV592')?.remove();
        await enhance();
        alert('บันทึกรายละเอียดแผน ' + q + ' เรียบร้อยแล้ว');
      } catch (error) {
        submit.disabled = false;
        alert('บันทึกไม่สำเร็จ: ' + error.message);
      }
    };
    document.body.appendChild(overlay);
  }
  function addStyle() {
    if (document.querySelector('#examPlanDetailsV592Style')) return;
    const style = document.createElement('style');
    style.id = 'examPlanDetailsV592Style';
    style.textContent = `
      .exam-plan-details-v592{margin:14px 0;border:1px solid #bfdbfe;background:#f8fbff}
      .training-quarter-progress{display:grid;gap:4px;background:#f0f7ff;border:1px solid #c6dcfa;border-radius:9px;padding:12px;margin:10px 0;color:#123c73}.training-quarter-progress b{font-size:16px}.training-quarter-progress small{font-size:11px;color:#52657b}.training-plan-topics li{padding:9px 0!important;border-bottom:1px solid #eef2f7}.training-progress-badge{display:inline-block;font-size:11px;padding:3px 7px;border-radius:5px;margin:2px 6px;vertical-align:middle}.training-progress-badge.done{background:#dcfce7;color:#166534}.training-progress-badge.pending{background:#fff2cc;color:#854d0e}.training-progress-badge.waiting-exam{background:#e0f2fe;color:#075985}.training-progress-badge.checking{background:#f1f5f9;color:#475569}.training-plan-topics button.training-evidence-action{display:block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;text-decoration:none;font-size:12px;padding:4px 8px;margin-top:4px}.training-record-fields .training-attendee-picker{display:block}.training-attendee-list{display:grid;max-height:210px;overflow:auto;margin:8px 0}.training-record-fields .training-attendee-list label{display:block;padding:6px;border-bottom:1px solid #eef2f7}.training-record-fields .training-attendee-list label[hidden]{display:none}.training-attendee-list input[type=checkbox]{display:inline;width:auto;margin-right:7px}.training-record-fields .training-attendee-picker input[type=search]{display:block;width:100%}.training-record-fields .training-attendee-picker .actions{margin-top:8px;flex-wrap:wrap}[data-training-save-status]{color:#b91c1c}
      .exam-detail-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}
      .exam-detail-title h3,.exam-detail-title p{margin:0}.exam-detail-title span{background:#dbeafe;color:#1e3a8a;border-radius:999px;padding:7px 12px;font-weight:800}
      .exam-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;overflow:auto;padding-bottom:4px}
      .training-plan-topics{margin:10px 0;padding-left:24px}.training-plan-topics li{padding:4px 0;color:#1d4ed8}.training-plan-topics button{background:transparent;border:0;box-shadow:none;text-align:left;padding:2px;color:#123c73;font-size:14px;line-height:1.5;text-decoration:underline;text-underline-offset:3px}.training-plan-topics button:hover{background:#eff6ff}.training-plan-state{background:#eff6ff;color:#1d4ed8;padding:7px 10px;border-radius:7px}.training-plan-meta{font-size:13px;border-top:1px solid #dbe3ef;padding-top:8px}.training-plan-meta div{display:grid;grid-template-columns:140px 1fr;gap:8px;margin:5px 0}.training-plan-meta dt{font-weight:700}.training-plan-meta dd{margin:0;overflow-wrap:anywhere}.exam-detail-card h5{font-size:15px;margin:12px 0 4px}.exam-detail-card .actions{flex-wrap:wrap}.exam-detail-card .exam-detail-view-button{width:auto;margin:0}
      @media print{.exam-detail-card{break-inside:avoid;box-shadow:none}.training-plan-topics button{text-decoration:none;color:#111}.exam-detail-grid{display:block!important}.exam-detail-card{margin-bottom:10px}.training-plan-state{background:none}}
      .exam-detail-card{background:#fff;border:1px solid #dbe3ef;border-top:5px solid #2563eb;border-radius:12px;padding:13px;min-width:0}
      .exam-detail-head{display:flex;justify-content:space-between;align-items:center}.exam-detail-head h4{font-size:20px;margin:0;color:#123c73}.exam-detail-head button{padding:6px 10px;font-size:12px}
      .exam-detail-block{margin:10px 0;padding:10px;border-radius:9px}.exam-detail-block.training{background:#eff6ff}.exam-detail-block.exam{background:#fff7ed}
      .exam-detail-block ul{margin:7px 0 0;padding-left:20px}.exam-detail-block li{margin:4px 0}.exam-detail-card p{font-size:13px;margin:7px 0}.exam-detail-empty{color:#64748b}
      .exam-detail-card-clickable{cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.exam-detail-card-clickable:hover,.exam-detail-card-clickable:focus{transform:translateY(-3px);box-shadow:0 10px 28px #2563eb26;outline:2px solid #60a5fa}
      .exam-quarter-badge{font-size:11px;font-weight:800;color:#1d4ed8;background:#dbeafe;border-radius:999px;padding:5px 8px}
      .exam-detail-summary{display:grid;grid-template-columns:1fr auto;gap:3px 8px;margin:10px 0;padding:12px;border-radius:10px}.exam-detail-summary.training{background:#eff6ff}.exam-detail-summary.exam{background:#fff7ed}.exam-detail-summary strong{font-size:22px;color:#123c73}.exam-detail-summary small{grid-column:1/-1;color:#64748b}
      .exam-detail-method{min-height:42px}.exam-detail-view-button{width:100%;margin-top:8px;background:#1d4ed8;color:#fff}
      .exam-detail-viewer{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;box-shadow:0 24px 70px #0007}
      .exam-viewer-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid #dbe3ef;padding-bottom:14px}.exam-viewer-head h2,.exam-viewer-head p{margin:3px 0}.exam-viewer-quarter{display:inline-block;background:#1d4ed8;color:#fff;border-radius:999px;padding:6px 14px;font-size:18px;font-weight:900}
      .exam-viewer-section{margin:16px 0;padding:16px;border-radius:12px}.exam-viewer-section.training{background:#eff6ff}.exam-viewer-section.exam{background:#fff7ed}.exam-viewer-section h3{margin:0 0 10px}.exam-viewer-section ul{margin:0;padding-left:23px}.exam-viewer-section li{margin:8px 0;line-height:1.5}
      .exam-topic-hint{margin:-4px 0 12px;color:#475569}.exam-training-topic-list{display:grid;gap:9px}.exam-training-topic{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left;background:#fff;color:#0f172a;border:1px solid #bfdbfe;border-radius:11px;padding:12px 14px}.exam-training-topic:hover,.exam-training-topic:focus{border-color:#2563eb;box-shadow:0 5px 16px #2563eb20;transform:translateY(-1px)}.exam-training-topic span{display:grid;gap:4px}.exam-training-topic b{font-size:15px;color:#123c73}.exam-training-topic small{font-weight:500;line-height:1.45;color:#475569}.exam-training-topic strong{white-space:nowrap;color:#1d4ed8;font-size:12px}
      .exam-topic-overlay{z-index:10070}.exam-training-topic-viewer{width:min(820px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;box-shadow:0 24px 70px #0007}.exam-topic-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.exam-topic-detail-grid article,.exam-topic-related{border:1px solid #dbe3ef;border-radius:12px;padding:15px;background:#f8fafc}.exam-topic-detail-grid h3,.exam-topic-related h3{margin:0 0 8px;color:#123c73}.exam-topic-detail-grid p{margin:0;line-height:1.65}.exam-topic-related ul{margin:0;padding-left:22px}.exam-topic-related li{margin:6px 0}
      .training-record-panel{margin:14px 0;border:1px solid #cbd5e1;border-radius:12px;padding:15px}.training-record-panel h3{margin:0 0 10px;color:#123c73}.training-record-status{display:grid;gap:3px;background:#fff7ed;border-left:5px solid #f59e0b;padding:10px 12px}.training-record-status.done{background:#ecfdf5;border-color:#10b981}.training-record-status span{color:#475569}
      .training-record-editor{width:min(850px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:16px;padding:22px}.training-record-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.training-record-fields label{font-weight:700}.training-record-fields input,.training-record-fields textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;font:inherit}.training-record-fields .full{grid-column:1/-1}.training-record-fields .training-completion-confirmation input{display:inline-block;width:auto;margin-right:8px}.training-completion-confirmation small{display:block;font-weight:400;margin-top:6px}.training-record-fields fieldset{display:flex;gap:20px;border:1px solid #cbd5e1}.training-record-fields fieldset label{font-weight:500}.training-record-fields fieldset input{display:inline;width:auto}.evidence-upload{background:#eff6ff;border:1px dashed #3b82f6;border-radius:10px;padding:12px}.evidence-upload small{display:block;color:#475569;margin-top:5px}.existing-evidence{border-top:1px solid #e2e8f0;padding-top:12px}.existing-evidence>label{margin-right:14px}
      .training-evidence-grid{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:8px;margin-top:10px}.training-evidence-grid a{display:grid;gap:4px;color:#1d4ed8;text-decoration:none}.training-evidence-grid img{width:100%;height:100px;object-fit:cover;border:1px solid #cbd5e1;border-radius:8px}.training-evidence-grid span{font-size:11px;overflow-wrap:anywhere}.training-evidence-file{place-items:center;border:1px solid #cbd5e1;border-radius:8px;padding:12px}.training-evidence-file b{font-size:22px;color:#dc2626}
      .training-print-overlay{position:fixed;inset:0;z-index:10100;background:#64748b;overflow:auto;padding:20px}.training-print-toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:center;gap:10px;margin-bottom:12px}.training-record-sheet,.training-evidence-sheet{width:210mm;min-height:297mm;margin:0 auto 18px;background:#fff;color:#000;box-sizing:border-box;padding:12mm;font-family:Arial,sans-serif}.training-record-sheet h1,.training-evidence-sheet h1{text-align:center;font-size:22px;margin:0 0 10px}.tr-row{display:grid;border:1.5px solid #111;border-bottom:0}.tr-row>b{display:flex;align-items:center;justify-content:center;text-align:center;border-right:1.5px solid #111;padding:7px}.tr-program{grid-template-columns:42mm 1fr;min-height:65mm}.tr-program>div{padding:8px}.tr-program h2{font-size:17px;margin:0 0 8px}.tr-program p{margin:7px 0;line-height:1.45}.tr-two{grid-template-columns:42mm 1fr 42mm 1fr;min-height:22mm}.tr-two span{display:flex;align-items:center;padding:8px}.tr-two span:nth-of-type(1){border-right:1.5px solid #111}.tr-signatures{border:1.5px solid #111;border-bottom:0;padding:7px;min-height:90mm}.tr-signatures table{width:100%;border-collapse:collapse;margin-top:7px}.tr-signatures th,.tr-signatures td{border:1px solid #111;height:9mm;padding:3px}.tr-signatures th:first-child,.tr-signatures td:first-child{width:12mm;text-align:center}.tr-signatures th:last-child,.tr-signatures td:last-child{width:55mm}.tr-planned{display:grid;grid-template-columns:42mm 1fr;align-items:center;border:1.5px solid #111;border-bottom:0;min-height:17mm}.tr-planned b{padding:7px}.tr-planned span{font-size:16px}.tr-effect{border:1.5px solid #111;min-height:36mm;padding:8px}.tr-effect p{line-height:1.5}.training-evidence-sheet>p{border-bottom:1px solid #111;padding-bottom:8px}.training-evidence-sheet>div{display:grid;grid-template-columns:1fr 1fr;gap:10mm}.training-evidence-sheet figure{margin:0;break-inside:avoid}.training-evidence-sheet img{width:100%;height:95mm;object-fit:contain;border:1px solid #111}.training-evidence-sheet figcaption{text-align:center;margin-top:4px}
      .exam-viewer-meta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px}.exam-viewer-meta p{margin:7px 0}
      .exam-detail-overlay{position:fixed;inset:0;z-index:10060;background:#0f172acc;display:flex;align-items:center;justify-content:center;padding:16px}
      .exam-detail-editor{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;box-shadow:0 24px 70px #0007}
      .exam-detail-editor label{display:block;font-weight:700;margin:12px 0}.exam-detail-editor textarea,.exam-detail-editor input,.exam-detail-editor select{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;font:inherit}
      @media(max-width:900px){.exam-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.exam-detail-grid{grid-template-columns:1fr}.exam-detail-title{align-items:flex-start;flex-direction:column}.exam-topic-detail-grid,.training-record-fields{grid-template-columns:1fr}.training-record-fields .full{grid-column:auto}.exam-training-topic{align-items:flex-start}.exam-training-topic strong{display:none}.training-evidence-grid{grid-template-columns:1fr 1fr}}
      @media print{.exam-detail-head button{display:none}.exam-detail-grid{grid-template-columns:1fr 1fr;overflow:visible}body.training-form-printing>*:not(.training-print-overlay){display:none!important}body.training-form-printing .training-print-overlay{position:static;background:#fff;padding:0;overflow:visible}body.training-form-printing .training-record-sheet,body.training-form-printing .training-evidence-sheet{margin:0;width:210mm;min-height:297mm;page-break-after:always}body.training-form-printing .training-evidence-sheet:last-child{page-break-after:auto}}
    `;
    document.head.appendChild(style);
  }
  function renamePlanLabels() {
    document.querySelectorAll('#nav button, #nav a, button, a').forEach(el => {
      const label = String(el.textContent || '').trim();
      if (label === 'Examination Plan') {
        el.textContent = 'Training & Examination Plan';
        el.setAttribute('aria-label', 'Training & Examination Plan');
      }
    });
    const title = document.querySelector('#app .page-head h2, #app .page-head h1');
    if (title && String(title.textContent || '').trim() === 'Examination Plan') {
      title.textContent = 'Training & Examination Plan';
    }
  }
  window.PPMSTrainingPlanService={defaults,readPlan,trainingContext,trainingItems,readTrainingValue,esc,safeKey,readEvidenceFile,validateEvidence,evidenceLimits:EVIDENCE_LIMITS,sectionFocus,roster,newEmployeeEligible,newEmployeeRoster,isAdmin,summaryOf,trainingDone,readTrainingRecord,openTrainingRecordEditor,topicState,evidenceHtml};
  window.addEventListener('ppms-quarterly-exams-changed',()=>{
    const host=document.getElementById('examPlanDetailsV592'),ctx=host?.__trainingContext,plan=host?.__trainingPlan;
    if(!ctx||!plan)return;
    for(const q of QUARTERS){const quarter=plan[q]||defaults(ctx.section)[q],node=host.querySelector('[data-quarter-progress="'+q+'"]'),html=quarterProgress(ctx,q,quarter);if(node&&node.outerHTML!==html)node.outerHTML=html;for(const item of trainingItems(quarter.training)){const badge=host.querySelector('[data-training-quarter="'+q+'"] [data-training-topic-status="'+item.index+'"]'),next=topicBadge(ctx,q,item);if(badge&&badge.outerHTML!==next)badge.outerHTML=next;}}
  });
  const observer = new MutationObserver(() => {
    clearTimeout(window.__examPlanDetailTimer);
    window.__examPlanDetailTimer = setTimeout(() => { renamePlanLabels(); enhance(); }, 80);
  });
  document.addEventListener('DOMContentLoaded', () => {
    addStyle();
    renamePlanLabels();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    enhance();
  });
})();

