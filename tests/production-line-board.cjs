const assert=require('node:assert/strict');
const {setup,nav,select,line,employees,divisions}=require('./production-line-organization.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ids=(w,l)=>Array.from(w.document.querySelectorAll(`[data-board-drop="${l}"] [data-board-person]`),n=>n.dataset.boardPerson).sort();
const change=(w,selector,value)=>{const el=w.document.querySelector(selector);assert(el,selector);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
(async()=>{
 const {w,errors,writes}=await setup('index.html');try{
  const api=w.PPMSProductionLines,board=w.PPMSLineBoard,scope={division:divisions[0],plant:'โรง 1'},section=api.sectionKey('Stamping Section');
  api.saveAssignments({['sections/'+section]:'1',['sections/'+api.sectionKey('Welding Section')]:'1'},scope);await wait(60);
  await nav(w,'lineOrganization');assert(w.document.querySelector('[data-line-organizer]'));assert(!w.document.querySelector('[data-line-path]'),'No per-person dropdowns in the simple organizer');assert(!w.document.querySelector('.division-org'),'The editor is the primary page');
  assert.deepEqual(ids(w,'1'),['S1','S2','W1']);assert.deepEqual(ids(w,'shared'),['M']);
  const original=JSON.stringify(JSON.parse(w.localStorage.getItem('ppms_v3_employees')));
  // One checkbox moves an entire section group, preserving shared manager assignments.
  change(w,`[data-board-group="${section}"][data-board-group-line="1"]`,true);
  assert(w.document.querySelector('[data-board-selected-count]').textContent.includes('2'));
  w.document.querySelector('[data-board-move="2"]').click();await wait(80);
  assert.deepEqual(ids(w,'2'),['S1','S2']);assert.deepEqual(ids(w,'1'),['W1']);assert.deepEqual(ids(w,'shared'),['M']);
  assert.equal(Object.keys(writes.at(-1).patch).length,2);assert(w.document.querySelector('[data-board-message]').textContent.includes('2'));
  // Undo restores inherited section membership, removing individual overrides.
  w.document.querySelector('[data-board-undo]').click();await wait(80);assert.deepEqual(ids(w,'1'),['S1','S2','W1']);assert.equal(api.record(scope).employees?.[api.personKey('S1')],undefined);
  // Split one section across lines, then combine people from different sections.
  change(w,'[data-board-person="S2"]',true);w.document.querySelector('[data-board-move="2"]').click();await wait(80);
  assert.deepEqual(ids(w,'1'),['S1','W1']);assert.deepEqual(ids(w,'2'),['S2']);assert(w.document.querySelector('.line-board-split').textContent.includes('2'));
  change(w,'[data-board-person="W1"]',true);w.document.querySelector('[data-board-move="2"]').click();await wait(80);assert.deepEqual(ids(w,'2'),['S2','W1']);assert.equal(w.document.querySelectorAll('[data-board-drop="2"] .line-board-section').length,2);
  // Filtering/select-all uses only shown people while preserving earlier selections.
  const search=w.document.querySelector('[data-board-search]');search.value='SCOPE S';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  change(w,'[data-board-filter="section"]',section);change(w,'[data-board-select-visible]',true);assert(w.document.querySelector('[data-board-selected-count]').textContent.includes('2'));
  change(w,'[data-board-filter="section"]',api.sectionKey('Welding Section'));assert(w.document.querySelector('[data-board-selected-count]').textContent.includes('นอกตัวกรอง 2'));
  search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));change(w,'[data-board-select-visible]',true);change(w,'[data-board-target]','3');w.document.querySelector('[data-board-move="target"]').click();await wait(80);
  change(w,'[data-board-filter="section"]','all');assert.deepEqual(ids(w,'3'),['S1','S2','W1']);assert.equal(w.document.querySelectorAll('[data-board-person]:checked').length,0);
  // The matrix consumes the same assignments; the editor and report are separate views.
  w.document.querySelector('[data-board-drop="3"] [data-line-matrix]').click();await wait(120);assert.deepEqual(Array.from(w.PPMSMatrixReport.snapshot().rows,r=>r.id),['S1','S2']);
  await nav(w,'lineOrganization');assert(w.document.querySelector('[data-line-organizer]'));w.document.querySelector('[data-line-board-view="report"]').click();await wait(80);assert(w.document.querySelector('.division-org'));w.document.querySelector('[data-line-board-view="board"]').click();await wait(80);assert(w.document.querySelector('[data-line-organizer]'));
  // Simulated native drag moves a whole group using the same guarded save operation.
  const group=w.document.querySelector(`[data-board-drop="3"] [data-board-drag-section="${section}"]`);group.dispatchEvent(new w.Event('dragstart',{bubbles:true}));w.document.querySelector('[data-board-drop="1"]').dispatchEvent(new w.Event('drop',{bubbles:true,cancelable:true}));await wait(80);assert.deepEqual(ids(w,'1'),['S1','S2']);assert.deepEqual(ids(w,'3'),['W1']);
  // Failed network writes stay durable, and can be undone before reconnecting.
  w.setLineFailure(true);change(w,'[data-board-person="S1"]',true);w.document.querySelector('[data-board-move="2"]').click();await wait(60);assert.equal(api.pending.length,1);assert.deepEqual(ids(w,'2'),['S1']);board.undo();await wait(30);assert.equal(api.pending.length,2);assert.deepEqual(ids(w,'1'),['S1','S2']);w.setLineFailure(false);await api.sync();assert.equal(api.pending.length,0);
  // Reject stale undo if another editor has reassigned a member meanwhile.
  change(w,'[data-board-person="S1"]',true);w.document.querySelector('[data-board-move="2"]').click();await wait(60);api.saveAssignments({['employees/'+api.personKey('S1')]:'3'},scope);await wait(60);assert.throws(()=>board.undo(),/จัดไลน์เปลี่ยน/);assert.deepEqual(ids(w,'3'),['S1','W1']);
  // Plant changes clear selection/filters, and never move foreign employees.
  change(w,'[data-board-person="S1"]',true);await select(w,divisions[0],'โรง 2');assert.deepEqual(ids(w,'unassigned'),['P2']);assert.equal(w.document.querySelectorAll('[data-board-person]:checked').length,0);assert.throws(()=>board.move(['S1'],'1'),/รายชื่อเปลี่ยน/);
  assert.equal(JSON.stringify(JSON.parse(w.localStorage.getItem('ppms_v3_employees'))),original);
  w.PPMSLanguage.setLanguage('en');await wait(80);assert(w.document.querySelector('[data-line-organizer]').textContent.includes('Move selected'));
  w.sessionStorage.removeItem('ppms_admin');assert.throws(()=>board.move(['P2'],'1'),/edit access/);
  assert.deepEqual(errors,[]);console.log('PASS bulk group moves, split/mixed sections, filtered multi-selection, drag groups, undo, conflict guards, offline replay, matrix sync, report view, scope isolation, permissions and bilingual UI');
 }finally{w.close()}
 const fallback=await setup('404.html');try{await nav(fallback.w,'lineOrganization');assert(fallback.w.document.querySelector('[data-line-organizer]'));assert.deepEqual(fallback.errors,[]);console.log('PASS simple organizer is available from both HTML entry points')}finally{fallback.w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
