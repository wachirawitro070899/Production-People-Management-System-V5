(function () {
  'use strict';
  const ROOT = 'ppmsExamPlanDetails';
  const LOCAL_KEY = 'ppms_exam_plan_details_v592';
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const isAdmin = () => sessionStorage.getItem('ppms_admin') === '1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lines = value => String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const safeKey = value => btoa(unescape(encodeURIComponent(String(value)))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');

  function sectionFocus(section) {
    const s = String(section || '').toLowerCase();
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

  function defaults(section) {
    const focus = sectionFocus(section);
    return {
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
    return { section, year, key: year + '__' + safeKey(section) };
  }
  async function readPlan(ctx) {
    const fallback = localRead(ctx.key) || defaults(ctx.section);
    if (!dbReady()) return fallback;
    try {
      const snap = await ensureFirebase().ref(ROOT + '/' + ctx.year + '/' + safeKey(ctx.section)).once('value');
      const cloud = snap.val();
      if (cloud) { localWrite(ctx.key, cloud); return {...fallback, ...cloud}; }
    } catch (error) { console.warn('Exam plan detail read failed', error); }
    return fallback;
  }
  async function savePlan(ctx, plan) {
    localWrite(ctx.key, plan);
    if (!dbReady()) throw new Error('Firebase ยังไม่พร้อม');
    await ensureFirebase().ref(ROOT + '/' + ctx.year + '/' + safeKey(ctx.section)).set({
      ...plan,
      section: ctx.section,
      year: ctx.year,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
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
  function cardHtml(q, data) {
    const trainingCount = lines(data.training).length;
    const examCount = lines(data.exam).length;
    return '<article class="exam-detail-card exam-detail-card-clickable" data-exam-detail-view="' + q + '" tabindex="0" role="button" aria-label="ดูรายละเอียด ' + q + '">' +
      '<div class="exam-detail-head"><h4>' + q + '</h4><span class="exam-quarter-badge">กดดูรายละเอียด</span></div>' +
      '<div class="exam-detail-summary training"><b>📘 Training</b><strong>' + trainingCount + '</strong><small>หัวข้อพร้อมรายละเอียด</small></div>' +
      '<div class="exam-detail-summary exam"><b>📝 Examination</b><strong>' + examCount + '</strong><small>หัวข้อสอบประจำ Quarter</small></div>' +
      '<p class="exam-detail-method"><b>วิธีดำเนินการ:</b> ' + esc(data.method || '-') + '</p>' +
      '<button type="button" class="exam-detail-view-button" data-exam-detail-view="' + q + '">ดูรายละเอียด ' + q + '</button></article>';
  }
  async function enhance() {
    const select = document.querySelector('#examPlanSection');
    const title = document.querySelector('#app .page-head h2, #app .page-head h1, #app h2, #app h1');
    if (!select || !title || !/Examination Plan/i.test(title.textContent || '')) return;
    const ctx = context();
    const signature = ctx.key + '__' + (isAdmin() ? 'admin' : 'user');
    const existing = document.querySelector('#examPlanDetailsV592');
    if (existing?.dataset.signature === signature) return;
    if (existing) existing.remove();
    const host = document.createElement('section');
    host.id = 'examPlanDetailsV592';
    host.dataset.signature = signature;
    host.className = 'panel exam-plan-details-v592';
    host.innerHTML = '<h3>แผนการอบรมและการสอบ Q1–Q4</h3><p class="modal-note">กำลังโหลดรายละเอียดแผน...</p>';
    const controls = document.querySelector('.exam-plan-controls');
    (controls?.nextElementSibling || controls || select.closest('.panel'))?.before(host);
    const plan = await readPlan(ctx);
    if (!document.body.contains(host)) return;
    host.innerHTML = '<div class="exam-detail-title"><div><h3>แผนการอบรมและการสอบ Q1–Q4</h3><p>' +
      esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><span>Training ก่อนสอบทุก Quarter</span></div>' +
      '<div class="exam-detail-grid">' + QUARTERS.map(q => cardHtml(q, plan[q] || defaults(ctx.section)[q])).join('') + '</div>';
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
  }
  function openViewer(ctx, plan, q) {
    const current = plan[q] || defaults(ctx.section)[q];
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay';
    overlay.innerHTML = '<section class="exam-detail-viewer" role="dialog" aria-modal="true" aria-label="รายละเอียด ' + q + '">' +
      '<div class="exam-viewer-head"><div><span class="exam-viewer-quarter">' + q + '</span><h2>รายละเอียด Training & Examination</h2><p>' + esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<div class="exam-viewer-section training"><h3>📘 หัวข้อการเทรนนิ่ง</h3><p class="exam-topic-hint">กดหัวข้อเพื่อดูรายละเอียดว่าอบรมอะไรและฝึกอย่างไร</p>' + trainingTopicHtml(current.training) + '</div>' +
      '<div class="exam-viewer-section exam"><h3>📝 หัวข้อ Examination</h3>' + listHtml(current.exam) + '</div>' +
      '<div class="exam-viewer-meta"><p><b>วิธีดำเนินการ:</b> ' + esc(current.method || '-') + '</p><p><b>เกณฑ์ผ่าน:</b> ' + esc(current.criteria || '-') + '</p></div>' +
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
  function openTrainingTopic(ctx, q, quarter, index) {
    const item = trainingItems(quarter.training)[index];
    if (!item) return;
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay exam-topic-overlay';
    overlay.innerHTML = '<section class="exam-training-topic-viewer" role="dialog" aria-modal="true" aria-label="รายละเอียดหัวข้อ ' + esc(item.title) + '">' +
      '<div class="exam-viewer-head"><div><span class="exam-viewer-quarter">' + q + '</span><h2>' + esc(item.title) + '</h2><p>' + esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><button type="button" class="secondary" data-close>ปิด</button></div>' +
      '<div class="exam-topic-detail-grid"><article><h3>🎯 วัตถุประสงค์</h3><p>ให้ผู้เข้าอบรมเข้าใจมาตรฐานของหัวข้อนี้ สามารถอธิบายขั้นตอน และนำไปปฏิบัติกับงานจริงได้อย่างถูกต้อง</p></article>' +
      '<article><h3>📚 เนื้อหาที่ต้องอบรม</h3><p>' + esc(item.detail) + '</p></article>' +
      '<article><h3>🛠️ วิธีอบรมและฝึกปฏิบัติ</h3><p>' + esc(quarter.method || 'ผู้สอนอธิบายมาตรฐาน สาธิต แล้วให้พนักงานฝึกปฏิบัติจริง') + '</p></article>' +
      '<article><h3>✅ การประเมินผล</h3><p>' + esc(quarter.criteria || 'ประเมินความเข้าใจและตรวจการปฏิบัติงานจริง') + '</p></article></div>' +
      '<div class="exam-topic-related"><h3>📝 หัวข้อสอบที่เกี่ยวข้อง</h3>' + listHtml(quarter.exam) + '</div></section>';
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  function openEditor(ctx, plan, q) {
    const current = plan[q] || defaults(ctx.section)[q];
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay';
    overlay.innerHTML = '<form class="exam-detail-editor"><h2>' + q + ' · ' + esc(ctx.section) + '</h2>' +
      '<label>หัวข้อและรายละเอียด Training (1 บรรทัดต่อ 1 หัวข้อ พร้อมอธิบายสิ่งที่ต้องสอน)<textarea name="training" rows="7" required>' + esc(current.training) + '</textarea></label>' +
      '<label>หัวข้อ Examination (1 บรรทัดต่อ 1 หัวข้อ)<textarea name="exam" rows="7" required>' + esc(current.exam) + '</textarea></label>' +
      '<label>วิธีดำเนินการ<input name="method" value="' + esc(current.method) + '" required></label>' +
      '<label>เกณฑ์ผ่าน<input name="criteria" value="' + esc(current.criteria) + '" required></label>' +
      '<div class="actions"><button type="submit">บันทึกแผน ' + q + '</button><button type="button" class="secondary" data-close>ยกเลิก</button></div></form>';
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget, submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const fd = new FormData(form);
        plan[q] = {
          training: String(fd.get('training') || '').trim(),
          exam: String(fd.get('exam') || '').trim(),
          method: String(fd.get('method') || '').trim(),
          criteria: String(fd.get('criteria') || '').trim()
        };
        await savePlan(ctx, plan);
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
      .exam-detail-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}
      .exam-detail-title h3,.exam-detail-title p{margin:0}.exam-detail-title span{background:#dbeafe;color:#1e3a8a;border-radius:999px;padding:7px 12px;font-weight:800}
      .exam-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(245px,1fr));gap:12px;overflow:auto;padding-bottom:4px}
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
      .exam-viewer-meta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px}.exam-viewer-meta p{margin:7px 0}
      .exam-detail-overlay{position:fixed;inset:0;z-index:10060;background:#0f172acc;display:flex;align-items:center;justify-content:center;padding:16px}
      .exam-detail-editor{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;box-shadow:0 24px 70px #0007}
      .exam-detail-editor label{display:block;font-weight:700;margin:12px 0}.exam-detail-editor textarea,.exam-detail-editor input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;font:inherit}
      @media(max-width:900px){.exam-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.exam-detail-grid{grid-template-columns:1fr}.exam-detail-title{align-items:flex-start;flex-direction:column}.exam-topic-detail-grid{grid-template-columns:1fr}.exam-training-topic{align-items:flex-start}.exam-training-topic strong{display:none}}
      @media print{.exam-detail-head button{display:none}.exam-detail-grid{grid-template-columns:1fr 1fr;overflow:visible}}
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
d5e40aa017f2eb0facc6157f5ecd740bcb527c4a
