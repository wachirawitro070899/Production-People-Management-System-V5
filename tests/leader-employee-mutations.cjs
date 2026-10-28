// Uses a synthetic Firebase database; never reads or writes production records.
const assert=require('node:assert/strict');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<80;i++){if(check())return;await wait(25)}assert(check(),'Operation completed')}
(async()=>{
 const actor=employees.find(e=>e.position==='Leader');
 const app=await setup(false,'index.html',{session:{ppms_leader_id:actor.id}}),{w}=app;
 const db={ppms:{employees:structuredClone(employees),deletedEmployeeIds:[]},settings:{organizationMaster:JSON.parse(w.localStorage.getItem('ppms_organization_master_v1'))}};
 const alerts=[],writes=[];let fail=false;
 w.alert=message=>alerts.push(String(message));w.confirm=()=>true;
 // The realtime SDK remains stale even after REST confirms a mutation.
 w.firebase={apps:[{}],database:()=>({ref:path=>({once:async()=>({val:()=>path==='ppms/employees'?employees:path==='ppms/deletedEmployeeIds'?[]:{}})})})};
 const original=w.fetch;
 w.fetch=async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.slice(1).replace(/\.json$/,''));
  if(!/^(ppms\/(employees|deletedEmployeeIds|formerEmployees|formerEmployeeHistory|ngHistoryArchive)|settings\/organizationMaster)(\/|$)/.test(path))return original(url,options);
  if(fail)throw Error('Offline test');
  const keys=path.split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||={};
  if(options.method==='PUT'){writes.push(path);parent[keys.at(-1)]=JSON.parse(options.body)}
  return {ok:true,status:200,headers:{get:()=> '"version"'},json:async()=>structuredClone(parent[keys.at(-1)]??null)};
 };
 const open=async()=>{w.document.querySelector('[data-action="leaderOpenShift"]').click();w.document.querySelector('[data-leader-menu="employees"]').click();await until(()=>w.document.querySelector('#leaderAddEmployee'))};
 const submit=async(id)=>{
  const form=w.document.querySelector('#leaderAddEmployee');
  form.elements.namedItem('id').value=id;form.elements.namedItem('name').value='Synthetic Employee';form.elements.startDate.value='2026-10-01';
  // Chromium's HTMLFormElement named getter shadows .id with input[name=id].
  Object.defineProperty(form,'id',{configurable:true,get:()=>form.elements.namedItem('id')});
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>!form.isConnected||!form.querySelector('[type=submit]').disabled);
 };
 try{
  // Another device adds someone while this app's in-memory roster is stale.
  db.ppms.employees.push({...actor,id:'REMOTE-ONLY',name:'Remote new employee',position:'Operator'});
  await open();assert(w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]'));
  w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]').click();
  await until(()=>!w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]'));
  assert(!db.ppms.employees.some(e=>e.id==='REMOTE-ONLY'));
  assert(Object.values(db.ppms.formerEmployeeHistory).some(e=>e.id==='REMOTE-ONLY'));
  // Different prefixes sharing a numeric suffix are different employee IDs.
  const id='NCN'+actor.id.match(/\d+$/)[0];await submit(id);
  assert(db.ppms.employees.some(e=>e.id===id),'Submission saves despite form.id clobbering');
  assert(w.document.querySelector('[data-leader-remove="'+id+'"]'),'Confirmed add remains visible despite stale SDK');
  const saved=db.ppms.employees.find(e=>e.id===id);assert.equal(saved.section,actor.section);assert.equal(saved.createdByLeader,actor.id);
  const before=writes.length;await submit(id);assert.equal(writes.length,before,'Duplicate ID never overwrites');assert.match(alerts.at(-1),/มีอยู่แล้ว/);
  await assert.rejects(w.PPMS_RUNTIME.deleteEmployeeNow(actor.id),/Section/);
  await assert.rejects(w.PPMS_RUNTIME.deleteEmployeeNow(employees.find(e=>e.section!==actor.section).id),/Section/);
  // Offline saves are queued without falsely reporting a confirmed cloud save.
  await open();fail=true;await submit('OFFLINE-NEW');assert(!db.ppms.employees.some(e=>e.id==='OFFLINE-NEW'));assert.match(alerts.at(-1),/ไม่สำเร็จ/);
  assert(JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves'))['OFFLINE-NEW'],'Offline employee remains in the retry outbox');
  assert.deepEqual(app.errors.filter(e=>!e.includes('HTMLCanvasElement.prototype.getContext')),[]);
  console.log('PASSED Leader form submission, fresh-roster deletion, resignation archive, shared-suffix IDs, duplicate protection, stale SDK, Section/self guards and offline failure.');
 }catch(error){console.error(error);throw error}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
