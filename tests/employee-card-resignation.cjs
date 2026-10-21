const assert=require('node:assert/strict');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function state(){
 const app=await setup(),{w}=app,originalFetch=w.fetch;
 const db={settings:{organizationMaster:JSON.parse(w.localStorage.getItem('ppms_organization_master_v1'))},ppms:{employees:structuredClone(employees),deletedEmployeeIds:[]}};let offline=false,writes=0;
 w.fetch=async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.slice(1).replace(/\.json$/,''));
  if(!/^(settings\/organizationMaster|ppms\/(employees|deletedEmployeeIds|formerEmployees|formerEmployeeHistory|ngHistoryArchive))(\/|$)/.test(path))return originalFetch(url,options);
  if(offline)throw Error('offline');const keys=path.split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||={};
  if(options.method==='PUT'){writes++;parent[keys.at(-1)]=JSON.parse(options.body)}
  return {ok:true,status:200,headers:{get:()=> 'etag'},json:async()=>structuredClone(parent[keys.at(-1)]??null)};
 };
 w.document.querySelector('#nav [data-page="dashboard"]').click();await wait(150);
 return {...app,db,writes:()=>writes,setOffline:value=>offline=value};
}
function open(w){const card=w.document.querySelector('.division-org .person[data-edit]');assert(card);const id=card.dataset.edit;card.click();const form=w.document.querySelector('#employeeForm');assert(form);const button=form.querySelector('[data-delete]');assert(button,'The card editor has a resignation action');assert.equal(button.type,'button');assert.equal(button.dataset.delete,id);return {id,form,button}}
(async()=>{
 const s=await state(),{w,dom,db,errors}=s;
 try{
  let {id,form,button}=open(w);const roster=w.localStorage.getItem('ppms_v3_employees');
  form.elements.id.value='UNSAVED-ID';form.elements.name.value='UNSAVED NAME';button.click();assert(w.document.querySelector('#resignationDialog').textContent.includes(id));assert(!w.document.querySelector('#resignationDialog').textContent.includes('UNSAVED-ID'),'Deletion uses the original employee identity');assert.equal(s.writes(),0);
  w.document.querySelector('[data-resignation-close]').click();assert(!w.document.querySelector('#modal').classList.contains('hidden'));assert.equal(form.elements.id.value,'UNSAVED-ID');assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster,'Cancel preserves employee data and the editor draft');
  form.querySelector('[type=submit]').disabled=true;button.click();assert(!w.document.querySelector('#resignationDialog'),'Deletion cannot overlap an employee save');form.querySelector('[type=submit]').disabled=false;
  button.click();let confirmation=w.document.querySelector('#resignationForm');confirmation.elements.resignationDate.value='2099-01-01';confirmation.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(100);assert(!form.querySelector('[type=submit]').disabled,'A rejected date unlocks the original editor');assert.equal(s.writes(),0);w.document.querySelector('[data-resignation-close]').click();
  button.click();confirmation=w.document.querySelector('#resignationForm');confirmation.elements.resignationReason.value='Resigned via employee card';confirmation.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(400);
  assert(!db.ppms.employees.some(e=>e.id===id));assert(!db.ppms.employees.some(e=>e.id==='UNSAVED-ID'));assert.equal(db.ppms.employees.length,employees.length-1);const archived=Object.values(db.ppms.formerEmployeeHistory)[0];assert.equal(archived.id,id);assert.equal(archived.resignationReason,'Resigned via employee card');assert.notEqual(archived.name,'UNSAVED NAME');assert(w.PPMSPositionSlots.plans().some(t=>t.count>0&&t.position===archived.position));
  assert(w.document.querySelector('#modal').classList.contains('hidden'));assert(!w.document.querySelector('#modalBody #employeeForm'),'The stale editor cannot save the resigned employee back into the roster');assert(!w.document.querySelector('#resignationDialog'));
  w.document.querySelector('#nav [data-page="add"]').click();await wait(50);assert(!w.document.querySelector('#employeeForm [data-delete]'),'New employee drafts have no deletion action');assert.deepEqual(errors,[]);
  console.log('PASSED card-to-editor resignation, original identity, cancel/draft preservation, save overlap guard, validation recovery, archive/vacancy retention, and stale editor removal.');
 }finally{dom.window.close()}
 const offline=await state();try{
  const {w}=offline,{id,button}=open(w);offline.setOffline(true);button.click();w.document.querySelector('#resignationForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
  assert(w.PPMSResignations.pending(id));assert(offline.db.ppms.employees.some(e=>e.id===id),'Cloud employee remains until the resignation can be archived');assert(w.document.querySelector('[data-resignation-save-status]').textContent.includes('รอเชื่อมต่อ'));assert(w.document.querySelector('#modal').classList.contains('hidden'));assert(!w.document.querySelector('#employeeForm'),'A locally pending resignation also closes the stale editor');assert.deepEqual(offline.errors,[]);
  console.log('PASSED offline card resignation with durable pending history and no stale employee editor.');
 }finally{offline.dom.window.close()}
 const publicApp=await setup(false);try{publicApp.w.PPMS_RUNTIME.openOrganizationEmployee(employees[0].id);assert(!publicApp.w.document.querySelector('#employeeForm [data-delete]'),'Only Admin sees the deletion action')}finally{publicApp.dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
