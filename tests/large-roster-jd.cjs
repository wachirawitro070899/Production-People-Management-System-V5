const assert=require('node:assert/strict'),{setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const base=employees.slice();for(let i=0;i<320;i++)employees.push({...base[i%base.length],id:'LOAD-'+i,name:'Synthetic Employee '+i});
 // Attachments stay in the real roster even on pages that display only names.
 for(const employee of employees)employee.attachmentData='A'.repeat(8192);
 let parses=0,jdParses=0;
 const {w,dom,errors}=await setup(true,'index.html',{beforeScripts(w){
  w.HTMLCanvasElement.prototype.getContext=()=>null;
  const parse=w.JSON.parse;w.JSON.parse=function(value,...args){
   if(typeof value==='string'&&value.length>1000000){parses++;if(new Error().stack.includes('jd-manager-v837.js'))jdParses++}
   return parse(value,...args);
  };
 }});
 try{
  await wait(500);assert(parses<20,'Startup must not parse the full roster per card: '+parses);assert.equal(jdParses,1,'JD reads the full roster once');
  for(const page of ['search','matrix','ngDashboard','attendanceAdmin','dashboard']){
   parses=0;w.document.querySelector('#nav [data-page="'+page+'"]').click();await wait(350);
   assert(parses<10,page+': bounded roster reads with attachments: '+parses);
   assert(!w.document.querySelector('#app').textContent.includes('ไม่สามารถแสดงหน้านี้ได้'));
  }
  await wait(500);parses=0;const status=w.document.createElement('p');w.document.getElementById('app').append(status);
  for(let i=0;i<5;i++){status.textContent='อัปเดต '+i;await wait(120)}
  assert.equal(parses,0,'Status and translated labels must not reparse the roster');
  // Invalidate on same-tab writes, organization changes and deletions; avoid a
  // permanent stale cache while preserving access to current JD information.
  const person=employees[0],changed=employees.map(e=>e.id===person.id?{...e,position:'Operator'}:e);
  w.localStorage.setItem('ppms_v3_employees',JSON.stringify(changed));
  w.PPMSLanguage.setLanguage('en');await wait(200);assert.equal(jdParses,2,'Same-tab roster update invalidates the source and ID index');
  const title=w.document.querySelector('[data-employee-position-id="'+person.id+'"]');assert(title.textContent.includes('Operator'),'Updated position is displayed');
  const context={division:'Production Division',plant:'โรง 1',section:person.section,position:'Operator',responsibilities:'Updated role JD'};
  w.localStorage.setItem('ppms_job_descriptions_v1',JSON.stringify({role:context}));
  w.dispatchEvent(new w.StorageEvent('storage',{key:'ppms_job_descriptions_v1'}));
  assert.equal((await w.PPMSJDExport.snapshot([changed[0]]))[0]?.responsibilities,'Updated role JD');
  w.localStorage.setItem('ppms_employee_organization_v1',JSON.stringify({[person.id]:{division:'Production Division',plant:'โรง 2'}}));
  assert.equal((await w.PPMSJDExport.snapshot([changed[0]]))[0],null,'Organization reassignment invalidates the source');
  w.localStorage.setItem('ppms_v3_deleted_employee_ids',JSON.stringify([person.id]));
  assert.equal((await w.PPMSJDExport.snapshot([changed[0]]))[0],null,'Deleted employees cannot be resolved from the cached ID index');
  assert.deepEqual(errors,[]);console.log('PASS 400 employees with 3MB of attachments: bounded roster reads across pages, idle updates, latest position, organization and deletion invalidation.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(150);dom.window.close()}
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
