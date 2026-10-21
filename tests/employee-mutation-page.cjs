const assert=require('node:assert/strict');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const active=w=>w.document.querySelector('#nav .active')?.dataset.page;
const change=(w,el,value)=>{el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
async function nav(w,page){w.document.activeElement?.blur();w.document.querySelector('#nav [data-page="'+page+'"]').click();await wait(100);assert.equal(active(w),page)}
async function save(w,form){form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(300)}
function backend(w){
 const original=w.fetch,db={settings:{organizationMaster:JSON.parse(w.localStorage.getItem('ppms_organization_master_v1'))},ppms:{employees:structuredClone(employees),deletedEmployeeIds:[]}};
 w.fetch=async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.slice(1).replace(/\.json$/,''));
  if(!/^(settings\/organizationMaster|ppms\/(employees|deletedEmployeeIds|formerEmployees|formerEmployeeHistory|ngHistoryArchive))(\/|$)/.test(path))return original(url,options);
  const keys=path.split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||={};if(options.method==='PUT')parent[keys.at(-1)]=JSON.parse(options.body);
  return {ok:true,status:200,headers:{get:()=> 'version'},json:async()=>structuredClone(parent[keys.at(-1)]??null)};
 };return db;
}
function fill(form,id){form.elements.id.value=id;form.elements.name.value='New Employee '+id;form.elements.position.value='Operator';form.elements.startDate.value='2026-01-01'}
const session=w=>Object.fromEntries(Array.from({length:w.sessionStorage.length},(_,i)=>{const k=w.sessionStorage.key(i);return [k,w.sessionStorage.getItem(k)]}));
(async()=>{
 const app=await setup(),{w,dom,errors}=app,db=backend(w);let manpowerSession,searchSession;
 try{
  const scrolls=[];Object.defineProperty(w,'scrollY',{value:420,configurable:true});w.scrollTo=(x,y)=>scrolls.push([x,y]);
  await nav(w,'dashboard');w.document.querySelector('.division-org .person[data-edit]').click();await wait(100);let form=w.document.querySelector('#employeeForm');const edited=form.elements.originalId.value;form.elements.phone.value='123456789';await save(w,form);
  assert.equal(active(w),'dashboard');assert.equal(db.ppms.employees.find(e=>e.id===edited).phone,'123456789');assert(w.document.querySelector('#modal').classList.contains('hidden'));assert(scrolls.some(([,y])=>y===420));
  await nav(w,'search');let query=w.document.querySelector('#q');query.value='TEST-4-';query.dispatchEvent(new w.Event('input',{bubbles:true}));const count=w.document.querySelectorAll('#empBody tr').length;assert(count>1);
  w.document.querySelector('#empBody [data-edit]').click();await wait(100);form=w.document.querySelector('#employeeForm');form.elements.phone.value='987654321';await save(w,form);assert.equal(active(w),'search');assert.equal(w.document.querySelector('#q').value,'TEST-4-');assert.equal(w.document.querySelectorAll('#empBody tr').length,count);
  const remove=w.document.querySelector('#empBody [data-delete]'),leaving=remove.dataset.delete;remove.click();w.document.querySelector('#resignationForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(300);assert.equal(active(w),'search');assert.equal(w.document.querySelector('#q').value,'TEST-4-');assert.equal(w.document.querySelectorAll('#empBody tr').length,count-1);assert(!db.ppms.employees.some(e=>e.id===leaving));searchSession=session(w);
  await nav(w,'add');form=w.document.querySelector('#employeeForm');fill(form,'NEW-ADD');await save(w,form);assert.equal(active(w),'add','Adding on the Add Employee page stays there');assert.equal(w.document.querySelector('#employeeForm').elements.id.value,'','The next employee gets a clean form');assert(db.ppms.employees.some(e=>e.id==='NEW-ADD'));
  await nav(w,'manpower');change(w,w.document.querySelector('#mpSection'),'Stamping Section');w.document.querySelector('[data-mp-new-person="Stamping Section"]').click();await wait(100);assert.equal(active(w),'manpower','The section add action opens a modal above the current chart');form=w.document.querySelector('#employeeForm');assert.equal(form.elements.section.value,'Stamping Section');fill(form,'NEW-MANPOWER');await save(w,form);assert.equal(active(w),'manpower');assert.equal(w.document.querySelector('#mpSection').value,'Stamping Section');assert(w.document.querySelector('[data-mp-person="NEW-MANPOWER"]'));assert(w.document.querySelector('#modal').classList.contains('hidden'));manpowerSession=session(w);
  await nav(w,'sectionChart');change(w,w.document.querySelector('#sectionSelect'),'CNC Section');w.document.querySelector('.section-org-report [data-edit]').click();await wait(50);form=w.document.querySelector('#employeeForm');form.querySelector('[data-delete]').click();w.document.querySelector('#resignationForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(300);assert.equal(active(w),'sectionChart');assert.equal(w.document.querySelector('#sectionSelect').value,'CNC Section');
  assert.deepEqual(errors,[]);console.log('PASSED edit/add/delete keep the active page, window position, search query/results, Section chart and manpower filters, with fresh roster data.');
 }finally{dom.window.close()}
 for(const [seed,page,check] of [[manpowerSession,'manpower',w=>assert.equal(w.document.querySelector('#mpSection').value,'Stamping Section')],[searchSession,'search',w=>assert.equal(w.document.querySelector('#q').value,'TEST-4-')]]){
  const reloaded=await setup(true,'index.html',{session:seed});try{assert.equal(active(reloaded.w),page);check(reloaded.w);assert.deepEqual(reloaded.errors,[])}finally{reloaded.dom.window.close()}
 }
 const invalid=await setup(true,'index.html',{session:{ppms_admin_page_v906:'missing-page'}});try{assert.equal(active(invalid.w),'dashboard')}finally{invalid.dom.window.close()}
 const publicApp=await setup(false,'index.html',{session:{ppms_admin_page_v906:'accounts'}});try{assert(!publicApp.w.document.querySelector('#nav [data-page="accounts"]'));assert.equal(active(publicApp.w),'attendance')}finally{publicApp.dom.window.close()}
 console.log('PASSED browser reload restores the last authorized page and filters; invalid/public page restores remain guarded.');
})().catch(error=>{console.error(error);process.exitCode=1});
