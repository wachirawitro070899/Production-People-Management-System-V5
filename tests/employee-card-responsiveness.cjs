const assert=require('node:assert/strict'),{setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const base=employees.slice();for(let i=0;i<320;i++)employees.push({...base[i%base.length],id:'LOAD-'+i,name:'Synthetic '+i});
const shifts=Object.fromEntries(employees.map(e=>[e.id,{section:e.section,scope:'employee',employeeId:e.id,startDate:'2026-08-01',endDate:'2026-12-31',shift:'day',updatedAt:'2026-08-01'}]));
const rows=Array.from({length:12000},(_,i)=>({employeeId:employees[i%400].id,date:'2026-10-'+String(1+Math.floor(i/400)%30).padStart(2,'0'),checkIn:'2026-10-01T00:30:00Z'}));
(async()=>{
 const {w,dom,errors}=await setup(true,'index.html',{local:{ppms_v3_shift_schedules:JSON.stringify(shifts),ppms_v3_attendance:JSON.stringify(rows),ppms_v3_attendance_settings:JSON.stringify({kpiStartDate:'2026-08-01'})}});
 try{
  // Exercise derived absence calculations against fixture data with no remote connection.
  w.PPMS_FIREBASE_CONFIG=null;
  const cards=[...w.document.querySelectorAll('.division-org .person[data-edit]')];assert(cards.length>1);
  const before=w.localStorage.getItem('ppms_v3_attendance');let start=performance.now();cards[0].click();const elapsed=performance.now()-start;
  const form=w.document.getElementById('employeeForm');assert(form,'Employee form is available in the same click');assert(w.document.querySelector('[data-employee-history-loading]'),'History waits until after the form is painted');assert.equal(w.localStorage.getItem('ppms_v3_attendance'),before,'Opening the form does not synchronously calculate company-wide absences');assert(elapsed<1000,'Card click must not block for seconds: '+elapsed);
  form.elements.name.value='UNSAVED TYPING';form.elements.name.focus();form.elements.name.setSelectionRange(3,3);await wait(750);
  assert(w.document.querySelector('.employee-attendance-history'),'Selected employee history loads');assert.equal(w.document.getElementById('employeeForm'),form);assert.equal(form.elements.name.value,'UNSAVED TYPING');assert.equal(form.elements.name.selectionStart,3);
  const updated=JSON.parse(w.localStorage.getItem('ppms_v3_attendance'));const created=updated.filter(r=>r.autoAbsent);assert(created.length>0,'The selected employee still has derived absence history');assert(created.every(r=>r.employeeId===cards[0].dataset.edit),'One employee card must not create absences for other employees');
  w.document.getElementById('closeModal').click();cards[0].click();w.document.getElementById('closeModal').click();cards[1].click();const second=w.document.getElementById('employeeForm');await wait(750);assert.equal(w.document.getElementById('employeeForm'),second);assert.equal(second.elements.id.value,cards[1].dataset.edit);assert.equal(w.document.querySelectorAll('.employee-attendance-history').length,1,'A cancelled history task cannot replace the newly opened employee');
  assert.deepEqual(errors,[]);console.log('PASS 400 employees, 400 shift plans and 12,000 history rows: form opens in '+Math.round(elapsed)+' ms; deferred history is limited to the selected employee and preserves unsaved typing and quick card switching.');
 }finally{w.requestAnimationFrame=()=>0;await wait(150);dom.window.close()}
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
