const fs = require('node:fs'), assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require(process.env.JSDOM_MODULE || 'jsdom');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const source = fs.readFileSync('exam-plan-details-v592.js', 'utf8');
const key = section => '2026__' + Buffer.from(section).toString('base64url');
const quarter = title => ({training:title, exam:'Assessment', method:'OJT', criteria:'80%', trainer:'Trainer', plannedDate:'2026-03-10', planStatus:'planned'});
const plan = title => ({Q1:quarter(title)});
const page = section => '<div class="page-head"><h2>Training Plan</h2></div><div class="exam-plan-controls"><select id="examPlanSection"><option>' + section + '</option></select><input id="examPlanYear" value="2026"></div>';
async function setup({cached, offline = false, admin = true, brokenStorage = false} = {}) {
  const errors = [], requests = [], alerts = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM('<html><head></head><body><main id="app">' + page('Stamping Section') + '</main></body></html>', {url:'https://example.test', runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc});
  const w = dom.window;
  w.alert = message => alerts.push(message);
  if (admin) w.sessionStorage.setItem('ppms_admin', '1');
  if (cached) w.localStorage.setItem('ppms_exam_plan_details_v592', JSON.stringify({[key('Stamping Section')]:cached}));
  if (brokenStorage) {
    w.Storage.prototype.getItem = () => { throw new Error('Storage denied'); };
    w.Storage.prototype.setItem = () => { throw new Error('Storage denied'); };
  }
  Object.defineProperty(w.navigator, 'onLine', {value:!offline, configurable:true});
  let transactionCurrent = null, transactionWrites = 0;
  w.PPMS_FIREBASE_CONFIG = {};
  w.firebase = {apps:[{}], database:() => ({ref:path => ({
    on(event, success, fail) { if(path.startsWith('ppmsTrainingImplementationStatus/')) {w.setTimeout(()=>success({val:()=>null}),0);return;} requests.push({path, success, fail, detached:false}); },
    off(event, success) { const request = requests.find(r => r.path === path && r.success === success); if (request) request.detached = true; },
    async transaction(update) {
      const next = update(transactionCurrent);
      if (JSON.stringify(next) !== JSON.stringify(transactionCurrent)) transactionWrites++;
      transactionCurrent = next;
      return {committed:true};
    }
  })})};
  // Keep the real 8-second read deadline observable without slowing the suite.
  const setTimeout = w.setTimeout.bind(w);
  w.setTimeout = (fn, ms, ...args) => setTimeout(fn, ms === 8000 ? 250 : ms, ...args);
  await wait(0);
  w.eval(source);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {w, errors, requests, alerts,
    current:value => { transactionCurrent = value; },
    writes:() => transactionWrites,
    answer:(request, value) => request.success({val:() => value}),
    show:async section => { w.document.querySelector('#app').innerHTML = page(section); await wait(100); }
  };
}
const status = w => w.document.querySelector('[data-plan-sync]').textContent;
const cards = w => w.document.querySelectorAll('[data-training-quarter]');
(async () => {
  // A dead Firebase connection must never leave the four cards behind a spinner.
  let t = await setup({cached:{Q1:{...quarter('CACHED TOPIC'), _saved:true}}});
  try {
    assert.equal(cards(t.w).length, 4);
    assert(t.w.document.querySelector('[data-training-quarter="Q1"]').textContent.includes('CACHED TOPIC'));
    assert(status(t.w).includes('กำลังตรวจข้อมูลล่าสุด'));
    assert.equal(t.requests.length, 1);
    await wait(300);
    assert(status(t.w).includes('ยังยืนยันข้อมูลล่าสุดไม่ได้'));
    assert(t.requests[0].detached, 'Timed-out Firebase listener must be removed');
    t.w.document.querySelector('[data-plan-sync] button').click();
    assert.equal(t.requests.length, 2, 'Retry must start a new request');
    t.answer(t.requests[1], plan('CLOUD TOPIC'));
    await wait(0);
    assert(t.w.document.querySelector('[data-training-quarter="Q1"]').textContent.includes('CLOUD TOPIC'));
    assert.equal(status(t.w), 'ข้อมูลแผนล่าสุด');
    assert(t.requests[1].detached);
    await t.show('Stamping Section');
    assert.equal(t.requests.length, 2, 'Recent successful plan must be reused');
    assert(t.w.document.querySelector('[data-training-quarter="Q1"]').textContent.includes('CLOUD TOPIC'));
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }

  // Fresh installs, permission failures and offline/storage failures stay usable.
  t = await setup();
  try {
    assert.equal(cards(t.w).length, 4);
    assert(status(t.w).includes('แสดงแผนแนะนำ'));
    t.requests[0].fail(new Error('PERMISSION_DENIED'));
    await wait(0);
    assert(status(t.w).includes('ยังยืนยันข้อมูลล่าสุดไม่ได้'));
    assert(t.w.document.querySelector('[data-plan-sync] button'));
    assert(t.requests[0].detached);
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }
  t = await setup({offline:true, brokenStorage:true, admin:false});
  try {
    await wait(0);
    assert.equal(cards(t.w).length, 4);
    assert.equal(t.requests.length, 0);
    assert(status(t.w).includes('ยังยืนยันข้อมูลล่าสุดไม่ได้'));
    assert.equal(t.w.document.querySelectorAll('[data-plan-edit]').length, 0);
    Object.defineProperty(t.w.navigator, 'onLine', {value:true, configurable:true});
    t.w.document.querySelector('[data-plan-sync] button').click();
    t.answer(t.requests[0], plan('RECOVERED'));
    await wait(0);
    assert.equal(status(t.w), 'ข้อมูลแผนล่าสุด');
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }

  // Late replies must not replace the newly selected Section/year/scope.
  t = await setup();
  try {
    await t.show('Welding Section');
    assert.equal(t.requests.length, 2);
    t.answer(t.requests[0], plan('STAMPING ONLY'));
    t.answer(t.requests[1], plan('WELDING ONLY'));
    await wait(0);
    assert(t.w.document.querySelector('#examPlanDetailsV592').textContent.includes('WELDING ONLY'));
    assert(!t.w.document.querySelector('#examPlanDetailsV592').textContent.includes('STAMPING ONLY'));
    t.w.document.querySelector('#examPlanYear').value = '2027';
    t.w.document.querySelector('#app').appendChild(t.w.document.createElement('span'));
    await wait(100);
    assert(t.requests[2].path.includes('/2027/'));
    assert(!t.w.document.querySelector('#examPlanDetailsV592').textContent.includes('WELDING ONLY'));
    t.answer(t.requests[2], null);
    await wait(0);
    t.w.PPMSOrganizationScope = {current:() => ({division:'Production Division', plant:'โรง 2'})};
    t.w.document.querySelector('#app').appendChild(t.w.document.createElement('span'));
    await wait(100);
    assert(t.requests[3].path.includes('/scope_'));
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }

  // Reopening while the first read is pending shares a single Firebase request.
  t = await setup({cached:{Q1:{...quarter('DELETED PLAN'), _saved:true}}});
  try {
    await t.show('Stamping Section');
    assert.equal(t.requests.length, 1);
    t.answer(t.requests[0], null);
    await wait(0);
    assert(!t.w.document.querySelector('#examPlanDetailsV592').textContent.includes('DELETED PLAN'));
    assert(t.w.document.querySelector('.training-plan-state').textContent.includes('ยังไม่ได้บันทึก'));
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }

  // An editor opened from an old cached plan must never overwrite a cloud change.
  const old = quarter('OLD PLAN'), latest = quarter('NEW CLOUD PLAN');
  t = await setup({cached:{Q1:{...old, _saved:true}}});
  try {
    t.w.document.querySelector('[data-plan-edit="Q1"]').click();
    const form = t.w.document.querySelector('.exam-detail-editor');
    form.elements.training.value = 'MY EDIT';
    t.current(latest);
    t.answer(t.requests[0], {Q1:latest});
    await wait(0);
    form.dispatchEvent(new t.w.Event('submit', {bubbles:true, cancelable:true}));
    await wait(0);
    assert.equal(t.writes(), 0);
    assert(t.alerts.some(message => message.includes('แผนถูกแก้ไขจากเครื่องอื่น')));
    assert(!form.querySelector('[type="submit"]').disabled);
    assert.deepEqual(t.errors, []);
  } finally { t.w.close(); }
  console.log('PASS: immediate quarterly cards, bounded Firebase reads, listener cleanup, retry/recovery, cache reuse/deletion, offline/permission/storage failures, context isolation, and stale edit conflict protection.');
})().catch(error => {console.error(error); process.exitCode = 1;});
