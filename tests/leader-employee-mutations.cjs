// Uses a synthetic Firebase database; never reads or writes production records.
const assert=require('node:assert/strict');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<80;i++){if(check())return;await wait(25)}assert(check(),'Operation completed')}
(async()=>{
 const actor=employees.find(e=>e.position==='Leader');
 const app=await setup(false,'index.html',{session:{ppms_leader_id:actor.id,ppms_admin_user:'previous-admin'}}),{w}=app;
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
  const beforeRemoval=writes.length;
  await assert.rejects(w.PPMS_RUNTIME.deleteEmployeeNow('REMOTE-ONLY'),/เหตุผล/);
  await assert.rejects(w.PPMS_RUNTIME.deleteEmployeeNow('REMOTE-ONLY',{resignationReason:'   '}),/เหตุผล/);
  assert.equal(writes.length,beforeRemoval,'Missing reasons cannot mutate or queue removal');
  assert(!w.PPMSResignations.pending('REMOTE-ONLY'));
  w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]').click();
  let removal=w.document.querySelector('#leaderRemoveEmployee');assert(removal,'Leader removal opens a reason form');
  assert.deepEqual(Array.from(removal.elements.resignationReason.options,o=>o.value),['','ย้ายแผนก','ลาออก','คืนซัพ']);
  removal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(50);
  assert.equal(writes.length,beforeRemoval,'An unselected reason leaves employee and history intact');
  w.document.querySelector('[data-leader-removal-back]').click();
  await until(()=>w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]'));
  assert.equal(writes.length,beforeRemoval,'Cancel leaves the roster unchanged');
  w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]').click();
  removal=w.document.querySelector('#leaderRemoveEmployee');
  removal.elements.resignationReason.value='คืนซัพ';removal.elements.resignationNote.value='Returned to synthetic supplier';
  removal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>!w.document.querySelector('#leaderRemoveEmployee'));
  await until(()=>!w.document.querySelector('[data-leader-remove="REMOTE-ONLY"]'));
  assert(!db.ppms.employees.some(e=>e.id==='REMOTE-ONLY'));
  const archived=Object.values(db.ppms.formerEmployeeHistory).find(e=>e.id==='REMOTE-ONLY');assert(archived);
  assert.equal(archived.resignationReason,'คืนซัพ');assert.equal(archived.resignationNote,'Returned to synthetic supplier');assert.equal(archived.recordedBy,actor.id);assert(archived.resignationDate);
  for(const reason of ['ย้ายแผนก','ลาออก']){
   const target={...actor,id:'REASON-'+reason,name:'Synthetic reason test',position:'Operator'};db.ppms.employees.push(target);
   await open();w.document.querySelector('[data-leader-remove="'+target.id+'"]').click();
   removal=w.document.querySelector('#leaderRemoveEmployee');removal.elements.resignationReason.value=reason;
   const effective=removal.elements.resignationDate.value,beforeInvalid=writes.length;
   removal.elements.resignationDate.value='2099-01-01';removal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(30);
   assert.equal(writes.length,beforeInvalid,'Future dates cannot remove employees');
   removal.elements.resignationDate.value=effective;removal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
   await until(()=>!w.document.querySelector('#leaderRemoveEmployee'));
   const record=Object.values(db.ppms.formerEmployeeHistory).find(e=>e.id===target.id);assert.equal(record.resignationReason,reason);assert.equal(record.recordedBy,actor.id);
  }
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
  fail=false;await open();w.document.querySelector('[data-leader-remove="'+id+'"]').click();
  removal=w.document.querySelector('#leaderRemoveEmployee');removal.elements.resignationReason.value='ย้ายแผนก';removal.elements.resignationNote.value='Destination: CNC';fail=true;
  removal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>w.PPMSResignations.pending(id)&&!removal.querySelector('[data-leader-removal-back]').disabled);
  assert.equal(w.PPMSResignations.pending(id).resignationReason,'ย้ายแผนก');
  assert(db.ppms.employees.some(e=>e.id===id),'Offline removal retains cloud employee until archive is saved');
  assert(removal.querySelector('[data-leader-removal-status]').textContent.includes('รอเชื่อมต่อ'));
  assert(removal.querySelector('[type=submit]').disabled,'Pending removal cannot be submitted twice');
  assert.deepEqual(app.errors.filter(e=>!e.includes('HTMLCanvasElement.prototype.getContext')),[]);
  console.log('PASSED Leader form submission, fresh-roster deletion, resignation archive, shared-suffix IDs, duplicate protection, stale SDK, Section/self guards and offline failure.');
 }catch(error){console.error(error);throw error}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
