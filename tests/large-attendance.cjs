const assert=require('node:assert/strict'),{setup,employees}=require('./app-pages.cjs');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const base=employees.slice();for(let i=0;i<320;i++)employees.push({...base[i%base.length],id:'LOAD-'+i,name:'Synthetic Employee '+i});
 const attendance=employees.flatMap(e=>Array.from({length:30},(_,i)=>({employeeId:e.id,name:e.name,section:e.section,date:'2026-10-'+String(i+1).padStart(2,'0'),checkIn:'2026-10-'+String(i+1).padStart(2,'0')+'T00:30:00.000Z',shift:'day',updatedAt:'2026-10-29T00:00:00.000Z'})));
 const {w,dom,errors}=await setup(true,'index.html',{session:{attendanceYear:'2026',attendanceMonth:'10'},local:{ppms_v3_attendance:JSON.stringify(attendance),ppms_v3_attendance_settings:JSON.stringify({kpiStartDate:'2026-10-01',operatingMode:'live'})}});w.HTMLCanvasElement.prototype.getContext=()=>null;
 try{
  w.document.querySelector('#nav [data-page="attendanceAdmin"]').click();await wait(150);
  const panel=()=>w.document.querySelector('[data-attendance-detail-page]').closest('.panel'),rows=()=>[...panel().querySelectorAll('tbody tr')];assert.equal(rows().length,50);assert(panel().textContent.includes('1–50 / 12000'));const first=rows()[0].textContent;
  w.document.querySelector('[data-attendance-detail-page="1"]').click();await wait(100);assert.equal(rows().length,50);assert(panel().textContent.includes('51–100 / 12000'));assert.notEqual(rows()[0].textContent,first);
  const select=w.document.querySelector('#attendanceSection');select.value='Stamping Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(100);assert(panel().textContent.includes('1–50 / 1200'),'Changing Section resets pagination and keeps its full count');
  let savedBlob;w.URL.createObjectURL=blob=>{savedBlob=blob;return 'blob:export'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};w.document.querySelector('[data-action="attendanceDetailCsv"]').click();assert(savedBlob);
  const text=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(savedBlob)});assert.equal(text.trim().split(/\r?\n/).length,1201,'CSV exports every filtered record, not the 50 visible rows');
  w.document.activeElement?.blur();w.document.querySelector('#nav [data-page="search"]').click();await wait(100);const query=w.document.getElementById('q');query.value='LOAD-319';query.dispatchEvent(new w.Event('input',{bubbles:true}));query.value='LOAD-318';query.dispatchEvent(new w.Event('input',{bubbles:true}));await wait(220);assert.equal(w.document.querySelectorAll('#empBody tr').length,1);assert(w.document.querySelector('#empBody').textContent.includes('LOAD-318'),'Search displays only the latest input');
  assert.deepEqual(errors,[]);console.log('PASS 400 employees/12,000 records: bounded detail DOM, page navigation, Section reset, full CSV export and latest-query search.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(150);dom.window.close()}
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
