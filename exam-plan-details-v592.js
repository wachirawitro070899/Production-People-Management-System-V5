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
    if (s.includes('stamping')) return 'Safety เครื่องปั๊ม\nWI และ Q-Point งานปั๊ม\nการตรวจ First Piece\nDefect งานปั๊มและการแยก NG';
    if (s.includes('welding')) return 'Safety งานเชื่อม\nWI และพารามิเตอร์การเชื่อม\nการตรวจจุดเชื่อมและ Carbon Paper\nDefect งานเชื่อมและการแยก NG';
    if (s.includes('sorting')) return 'Safety\nVisual Inspection ตาม Q-Point\nDefect Criteria และ Sample NG\nTraceability และ Packing';
    if (s.includes('machine maintenance')) return 'Safety และ LOTO\nPreventive Maintenance\nBreakdown Repair\nElectrical / Mechanical';
    if (s.includes('tooling maintenance') || s.includes('tooling')) return 'Safety งานแม่พิมพ์\nPreventive Maintenance แม่พิมพ์\nBreakdown และการซ่อม\nSpare Part Control';
    if (s.includes('engineering')) return 'Safety\nDrawing และ Specification\nProblem Solving\nProcess Improvement';
    if (s.includes('support production')) return 'Safety\nProduction Planning\nMaterial Control\nERP Record และ Document Control';
    if (s.includes('cnc')) return 'Safety เครื่อง CNC\nWI และ Program / Parameter\nMeasurement และ Drawing\nDefect Criteria';
    if (s.includes('tapping')) return 'Safety เครื่อง Tapping\nWI และการตั้งเครื่อง\nการตรวจเกลียวและ Measurement\nDefect Criteria';
    if (s.includes('bending')) return 'Safety เครื่อง Bending\nWI และการตั้งเครื่อง\nDrawing และ Measurement\nDefect Criteria';
    return 'Safety\nWI / SOP ประจำ Section\nQuality และ Defect Criteria\n5S และการตอบสนองเมื่อพบความผิดปกติ';
  }

  function defaults(section) {
    const focus = sectionFocus(section);
    return {
      Q1: {
        training: 'ทบทวน Safety และกฎพื้นฐานประจำพื้นที่\nทบทวน WI / SOP และ Q-Point\nฝึกปฏิบัติงานพื้นฐานตามตำแหน่ง\n5S และการแจ้งความผิดปกติ',
        exam: 'Safety\nWI / SOP\nQ-Point\n5S',
        method: 'Classroom + OJT + Job Observation',
        criteria: 'ข้อสอบรายไตรมาส 20 ข้อ • ผ่าน 80%'
      },
      Q2: {
        training: focus,
        exam: focus,
        method: 'ทบทวนมาตรฐาน + OJT หน้างาน + Sample OK/NG',
        criteria: 'ข้อสอบรายไตรมาส 20 ข้อ • ผ่าน 80%'
      },
      Q3: {
        training: 'Measurement และการใช้เครื่องมือวัด\nTraceability และการบันทึก Record\nDefect Criteria / Sample NG\nการควบคุมงานผิดปกติและ Escalation',
        exam: 'Measurement\nTraceability\nDefect Criteria\nการตอบสนองเมื่อพบ NG',
        method: 'สาธิต + ฝึกปฏิบัติ + Job Observation',
        criteria: 'ข้อสอบรายไตรมาส 20 ข้อ • ผ่าน 80%'
      },
      Q4: {
        training: 'ทบทวนหัวข้อ Q1–Q3\nบทเรียนจาก NG / Customer Complaint\nการป้องกันการเกิดซ้ำ\nประเมิน Skill และแผนพัฒนาปีถัดไป',
        exam: 'ข้อสอบรวม Safety / Quality / Process\nข้อผิดพลาดและบทเรียนประจำปี\nการป้องกันปัญหาเกิดซ้ำ\nหัวข้อ Skill ของ Section',
        method: 'Annual Refresh + Case Study + Practical Evaluation',
        criteria: 'ข้อสอบรายไตรมาส 20 ข้อ • ผ่าน 80%'
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
  function cardHtml(q, data) {
    return '<article class="exam-detail-card">' +
      '<div class="exam-detail-head"><h4>' + q + '</h4>' +
      (isAdmin() ? '<button type="button" data-exam-detail-edit="' + q + '">แก้ไข</button>' : '') + '</div>' +
      '<div class="exam-detail-block training"><b>📘 Training / หัวข้อเทรนนิ่ง</b>' + listHtml(data.training) + '</div>' +
      '<div class="exam-detail-block exam"><b>📝 Examination / หัวข้อสอบ</b>' + listHtml(data.exam) + '</div>' +
      '<p><b>วิธีดำเนินการ:</b> ' + esc(data.method || '-') + '</p>' +
      '<p><b>เกณฑ์ผ่าน:</b> ' + esc(data.criteria || '-') + '</p></article>';
  }
  async function enhance() {
    const select = document.querySelector('#examPlanSection');
    const title = document.querySelector('#app .page-head h1, #app h1');
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
    host.innerHTML = '<h3>รายละเอียด Training & Examination Q1–Q4</h3><p class="modal-note">กำลังโหลดรายละเอียดแผน...</p>';
    const controls = document.querySelector('.exam-plan-controls');
    (controls?.nextElementSibling || controls || select.closest('.panel'))?.before(host);
    const plan = await readPlan(ctx);
    if (!document.body.contains(host)) return;
    host.innerHTML = '<div class="exam-detail-title"><div><h3>รายละเอียด Training & Examination Q1–Q4</h3><p>' +
      esc(ctx.section) + ' • ปี ' + esc(ctx.year) + '</p></div><span>Training ก่อนสอบทุก Quarter</span></div>' +
      '<div class="exam-detail-grid">' + QUARTERS.map(q => cardHtml(q, plan[q] || defaults(ctx.section)[q])).join('') + '</div>';
    host.querySelectorAll('[data-exam-detail-edit]').forEach(button => {
      button.onclick = () => openEditor(ctx, plan, button.dataset.examDetailEdit);
    });
  }
  function openEditor(ctx, plan, q) {
    const current = plan[q] || defaults(ctx.section)[q];
    const overlay = document.createElement('div');
    overlay.className = 'exam-detail-overlay';
    overlay.innerHTML = '<form class="exam-detail-editor"><h2>' + q + ' · ' + esc(ctx.section) + '</h2>' +
      '<label>หัวข้อ Training (1 บรรทัดต่อ 1 หัวข้อ)<textarea name="training" rows="7" required>' + esc(current.training) + '</textarea></label>' +
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
      .exam-detail-overlay{position:fixed;inset:0;z-index:10060;background:#0f172acc;display:flex;align-items:center;justify-content:center;padding:16px}
      .exam-detail-editor{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;box-shadow:0 24px 70px #0007}
      .exam-detail-editor label{display:block;font-weight:700;margin:12px 0}.exam-detail-editor textarea,.exam-detail-editor input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;font:inherit}
      @media(max-width:900px){.exam-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.exam-detail-grid{grid-template-columns:1fr}.exam-detail-title{align-items:flex-start;flex-direction:column}}
      @media print{.exam-detail-head button{display:none}.exam-detail-grid{grid-template-columns:1fr 1fr;overflow:visible}}
    `;
    document.head.appendChild(style);
  }
  const observer = new MutationObserver(() => { clearTimeout(window.__examPlanDetailTimer); window.__examPlanDetailTimer = setTimeout(enhance, 80); });
  document.addEventListener('DOMContentLoaded', () => {
    addStyle();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    enhance();
  });
})();