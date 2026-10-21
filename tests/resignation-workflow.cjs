const assert=require('node:assert/strict');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const state=await setup(),{w,dom,errors}=state;const originalFetch=w.fetch;
 const db={settings:{organizationMaster:JSON.parse(w.localStorage.getItem('ppms_organization_master_v1'))},employees:structuredClone(employees),deletedEmployeeIds:[],formerEmployees:{old:{id:'OLD',name:'OLD EMPLOYEE',section:'Engineering Support Section',startDate:'2010-01-01',resignedAt:'2025-01-01T00:00:00Z'}}};
 let offline=false;
 w.fetch=async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.replace(/^\/(?:ppms\/)?/,'').replace(/\.json$/,''));
  if(!/^(settings\/organizationMaster|employees|deletedEmployeeIds|formerEmployees|formerEmployeeHistory|ngHistoryArchive)(\/|$)/.test(path))return originalFetch(url,options);
  if(offline)throw Error('Offline');
  const parts=path.split('/');let parent=db;for(const key of parts.slice(0,-1))parent=parent[key]||={};
  if(options.method==='PUT')parent[parts.at(-1)]=JSON.parse(options.body);
  return {ok:true,status:200,headers:{get:()=> '"etag"'},json:async()=>structuredClone(parent[parts.at(-1)]??null)};
 };
 try{
  w.document.querySelector('#nav [data-page="search"]').click();await wait(100);
  const button=w.document.querySelector('[data-delete]'),id=button.dataset.delete;button.click();
  let form=w.document.getElementById('resignationForm');assert(form,'Delete opens the resignation form');
  assert(w.document.querySelector('#resignationDialog').textContent.includes(id),'The confirmation identifies the employee');
  form.elements.resignationDate.value='2026-10-17';form.elements.resignationReason.value='Personal reasons';form.elements.resignationNote.value='Workflow test';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(500);
  assert(!w.document.getElementById('resignationDialog'),'Confirmed submission closes the dialog');assert(!db.employees.some(e=>e.id===id));assert.equal(Object.values(db.formerEmployeeHistory).length,1);assert.equal(Object.values(db.formerEmployeeHistory)[0].resignationReason,'Personal reasons');
  assert(!JSON.parse(w.localStorage.getItem('ppms_v3_employees')).some(e=>e.id===id),'Active roster no longer includes the employee');
  const retained=Object.values(db.settings.organizationMaster.positionVacancies||{}).find(t=>t.position===Object.values(db.formerEmployeeHistory)[0].position);assert(retained,'The position is retained as authorized staffing');assert(w.PPMSPositionSlots.plans().some(t=>t.id===retained.id&&t.count>0),'HR sees the vacancy after resignation');
  w.document.querySelector('#nav [data-page="resignations"]').click();await wait(250);
  assert(w.document.querySelector('#resignationHistory').textContent.includes(id));assert(w.document.querySelector('#resignationHistory').textContent.includes('OLD'),'Legacy resignation records remain visible');
  w.document.querySelector('[data-resignation-detail]').click();assert(w.document.querySelector('#resignationDialog').textContent.includes('Workflow test'));w.document.querySelector('[data-resignation-close]').click();
  w.PPMSLanguage.setLanguage('en');await wait(60);assert.equal(w.document.querySelector('#resignationHistory h2').textContent,'Resignation History');w.PPMSLanguage.setLanguage('th');
  w.document.querySelector('#nav [data-page="search"]').click();await wait(100);const offlineButton=w.document.querySelector('[data-delete]'),offlineId=offlineButton.dataset.delete;offlineButton.click();form=w.document.getElementById('resignationForm');offline=true;
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(300);
  assert(w.document.querySelector('[data-resignation-save-status]').textContent.includes('รอเชื่อมต่อ'));assert(w.PPMSResignations.pending(offlineId));assert(db.employees.some(e=>e.id===offlineId),'Cloud roster is retained while archive is offline');
  w.document.querySelector('[data-resignation-close]').click();w.document.querySelector('#nav [data-page="resignations"]').click();await wait(100);assert(w.document.querySelector('#resignationHistory').textContent.includes('รอซิงก์'));
  // A second device may finish a pending deletion; history acknowledges it after refresh.
  offline=false;const pending=w.PPMSResignations.pending(offlineId);db.formerEmployeeHistory[pending.resignationEventId]=JSON.parse(JSON.stringify(pending));db.employees=db.employees.filter(e=>e.id!==offlineId);db.deletedEmployeeIds.push(offlineId);await w.PPMSResignations.refresh();assert.equal(w.PPMSResignations.pending(offlineId),null);
  assert.deepEqual(errors,[]);console.log('PASSED full app: delete confirmation, identity/date/reason, archive and roster sync, legacy history, detail view, TH/EN, offline pending preservation and confirmation from another device.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
