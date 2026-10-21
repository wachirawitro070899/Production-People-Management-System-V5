const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const MK='ppms_organization_master_v1',OUTBOX='ppms_position_slots_outbox_v903';
function setup(){
 const dom=new JSDOM('<html><head></head><body></body></html>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 const master={plants:['โรง 1','โรง 2'],divisions:['Production Division','Quality Division'],sections:['Stamping Section','Sorting 1','Sorting 2'],positionMap:{'Production Division':['Operator']},sectionMap:{'Production Division::โรง 1':['Stamping Section','Sorting 1','Sorting 2'],'Production Division::โรง 2':['Stamping Section'],'Quality Division::รวม':['Inspection Section']}};
 const people=[{id:'A',name:'A',section:'Stamping Section',position:'Operator'},{id:'B',name:'B',section:'Stamping Section',position:'Operator'},{id:'OTHER',section:'Stamping Section',position:'Operator',organizationPlant:'โรง 2'},{id:'SORT1',section:'Sorting Section',sortingGroup:'Sorting 1',position:'Operator'},{id:'SORT2',section:'Sorting Section',sortingGroup:'Sorting 2',position:'Operator'}];
 w.localStorage.setItem(MK,JSON.stringify(master));w.localStorage.setItem('ppms_v3_employees',JSON.stringify(people));w.sessionStorage.setItem('ppms_admin','1');
 w.PPMS_RUNTIME={factoryLayoutIsAdmin:()=>w.sessionStorage.getItem('ppms_admin')==='1'};w.PPMS_FIREBASE_CONFIG={databaseURL:'https://example.test'};
 for(const file of ['organization-scope-v866.js','production-hierarchy-v862.js','organization-position-slots-v903.js','employee-resignations-v885.js','employee-delete-v823.js'])w.eval(fs.readFileSync(file,'utf8'));
 Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
 const db={settings:{organizationMaster:structuredClone(master)},ppms:{employees:structuredClone(people),deletedEmployeeIds:[]}},writes=[];let conflict=false,deny=false,lost=false;
 w.fetch=async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.slice(1).replace(/\.json$/,'')),keys=path.split('/');let parent=db;
  for(const key of keys.slice(0,-1))parent=parent[key]||={};
  if(deny&&path==='settings/organizationMaster')throw Error('master unavailable');
  if(options.method==='PUT'){
   writes.push(path);
   if(conflict&&path==='settings/organizationMaster'){conflict=false;db.settings.organizationMaster.external='preserved';return response(412,db.settings.organizationMaster)}
   parent[keys.at(-1)]=JSON.parse(options.body);
   if(lost&&path==='settings/organizationMaster'){lost=false;throw Error('lost response')}
  }
  return response(200,parent[keys.at(-1)]??null);
  function response(status,value){return {ok:status===200,status,headers:{get:()=> 'version'},json:async()=>structuredClone(value)}}
 };
 return {dom,w,db,writes,people,slots:w.PPMSPositionSlots,setConflict:()=>conflict=true,setDeny:v=>deny=v,setLost:()=>lost=true,online:()=>Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true})};
}
(async()=>{
 const s=setup(),{dom,w,db,slots,people,writes}=s;
 try{
  const original=w.localStorage.getItem('ppms_v3_employees');await slots.add('OP','Stamping Section',2);
  let plan=slots.plans().find(t=>t.section==='Stamping Section');assert.equal(plan.required,4);assert.equal(plan.filled,2);assert.equal(plan.count,2);assert.equal(plan.position,'Operator');assert.equal(w.localStorage.getItem('ppms_v3_employees'),original,'A vacancy never creates a fake employee');
  const queued=JSON.parse(w.localStorage.getItem(OUTBOX))[0],local=JSON.parse(w.localStorage.getItem(MK));assert.equal(slots.replay(local).positionVacancies[0].required,4,'Replaying a pending addition is idempotent');
  s.online();s.setConflict();await slots.sync();assert.equal(JSON.parse(w.localStorage.getItem(OUTBOX)).length,0);assert.equal(db.settings.organizationMaster.external,'preserved');assert.equal(db.settings.organizationMaster.positionVacancies[0].required,4);assert.equal(db.settings.organizationMaster.positionVacancies[0].slotChanges[queued.id],true);
  await slots.add('Operator','Sorting 1',1);await wait(30);assert.equal(slots.plans().find(t=>t.section==='Sorting 1').count,1);assert.equal(w.PPMSProductionHierarchy.positionVacancies('Sorting 2').length,0,'Sorting 1 and 2 keep independent vacancies');
  const snapshot=w.PPMSResignations.capture(people[0],{},{resignationDate:'2026-10-17'});assert.equal(snapshot._positionSlot.required,4);
  w.localStorage.setItem('ppms_v3_employees',JSON.stringify(people.filter(e=>e.id!=='A')));assert.equal(slots.plans().find(t=>t.section==='Stamping Section').count,3);
  s.setDeny(true);await assert.rejects(w.PPMS_EMPLOYEE_DELETE_SERVICE.remove('A',snapshot),/master unavailable/);assert(db.ppms.employees.some(e=>e.id==='A'));assert(!db.ppms.deletedEmployeeIds.includes('A'),'Staffing retention is confirmed before the active roster is deleted');
  s.setDeny(false);const result=await w.PPMS_EMPLOYEE_DELETE_SERVICE.remove('A',snapshot);w.PPMSResignations.confirmed(result.formerEmployee);assert(!db.ppms.employees.some(e=>e.id==='A'));assert.equal(db.settings.organizationMaster.positionVacancies.find(t=>t.section==='Stamping Section').required,4);assert(result.formerEmployee._positionSlot);
  assert(writes.indexOf('settings/organizationMaster')<writes.indexOf('ppms/deletedEmployeeIds'));assert.equal(slots.plans().find(t=>t.section==='Stamping Section').count,3);
  await w.PPMS_EMPLOYEE_DELETE_SERVICE.remove('A',snapshot);assert.equal(db.settings.organizationMaster.positionVacancies.find(t=>t.section==='Stamping Section').required,4,'Repeated resignation synchronization never adds duplicate slots');
  const rehire={id:'NEW',name:'Replacement',section:'Stamping Section',position:'OP'};w.localStorage.setItem('ppms_v3_employees',JSON.stringify([...people.filter(e=>e.id!=='A'),rehire]));assert.equal(slots.plans().find(t=>t.section==='Stamping Section').count,2,'A replacement fills the same authorized slot');
  const retained=slots.preserve(db.settings.organizationMaster,people[1],people),again=slots.preserve(retained,people[1],people);assert.equal(again.positionVacancies.find(t=>t.section==='Stamping Section').required,4);
  assert.equal(slots.plans({division:'Production Division',plant:'โรง 2'}).length,0);assert.equal(slots.plans({division:'Quality Division',plant:'รวม'}).length,0);
  const before=w.localStorage.getItem(OUTBOX);await assert.rejects(slots.add('Operator','Stamping Section',0));await assert.rejects(slots.add('Operator','Missing',1));assert.equal(w.localStorage.getItem(OUTBOX),before);
  slots.openDialog('Stamping Section');assert.equal(w.document.querySelector('#positionSlotDialog select').value,'Stamping Section');assert(w.document.querySelector('#positionSlotDialog input[name="amount"]'));w.document.querySelector('[data-slot-close]').click();w.sessionStorage.removeItem('ppms_admin');await assert.rejects(slots.add('Operator','Stamping Section',1),/Admin/);
  console.log('PASSED slot creation, canonical roles, authorized/filled/vacant counts, no fake employees, conditional retries, scope and Sorting boundaries, archive/position-before-delete, failed retention, offline local vacancy, retry idempotency and replacement hiring.');
 }finally{dom.window.close()}
 const lost=setup();try{
  await lost.slots.add('Operator','Stamping Section',1);lost.setLost();lost.online();await lost.slots.sync();assert.equal(JSON.parse(lost.w.localStorage.getItem(OUTBOX)).length,1);assert.equal(lost.db.settings.organizationMaster.positionVacancies[0].required,3);await lost.slots.sync();assert.equal(lost.db.settings.organizationMaster.positionVacancies[0].required,3,'A lost response cannot double the authorized headcount');assert.equal(JSON.parse(lost.w.localStorage.getItem(OUTBOX)).length,0);
  console.log('PASSED lost-response recovery without duplicate staffing slots.');
 }finally{lost.dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
