const assert=require('node:assert/strict'),{setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const person=employees.find(e=>e.position==='Leader'),scope={division:'Production Division',plant:'โรง 1'};
 const old={...scope,employeeId:person.id,employeeName:person.name,section:person.section,position:person.position,responsibilities:'OLD APPROVED PERSONAL DUTIES',qualifications:'Old qualifications',reportsTo:'Old manager',jobPurpose:'Old purpose',version:4,templateVersion:5,revision:'03',effectiveDate:'2026-01-01',documentUrl:'https://example.test/old-jd.pdf',status:'approved',updatedAt:'2026-11-01T00:00:00Z'};
 const target={...scope,section:'Welding Section',position:'Supervisor',responsibilities:'NEW SUPERVISOR WELDING DUTIES',qualifications:'Welding supervisor skills',reportsTo:'New manager',jobPurpose:'Lead welding',documentNo:'JD-WELD-SUP',documentUrl:'https://example.test/new-role.pdf',templateVersion:5,version:2,status:'approved'};
 const {w,dom,errors}=await setup(true,'index.html',{local:{ppms_job_descriptions_v1:JSON.stringify({personal:old,role:target})}});
 try{
  await w.PPMS_JD_OFFLINE.ready;
  const button=()=>w.document.querySelector('[data-jd-employee-id="'+person.id+'"]');
  button().click();assert(w.document.querySelector('#jdDialog').textContent.includes(old.responsibilities));w.document.querySelector('[data-jd-close]').click();
  const changed=employees.map(e=>e.id===person.id?{...e,section:target.section,position:target.position}:e);
  w.localStorage.setItem('ppms_v3_employees',JSON.stringify(changed));w.dispatchEvent(new w.Event('ppms-employees-changed'));
  button().click();let article=w.document.querySelector('#jdDialog article');
  assert(article.textContent.includes(target.responsibilities));assert(article.querySelector('details').textContent.includes(old.responsibilities));
  assert.equal(article.querySelector('.ppms-jd-document a').href,target.documentUrl);
  let exported=(await w.PPMSJDExport.snapshot([changed.find(e=>e.id===person.id)]))[0];
  assert.equal(exported.position,'Supervisor');assert.equal(exported.section,target.section);assert.equal(exported.responsibilities,target.responsibilities);assert.equal(exported.status,'draft');assert.equal(exported.assignmentHistory[0].documentUrl,old.documentUrl);
  await wait(650);assert.equal(w.PPMS_JD_OFFLINE.count(),1,'Only the reassigned personal JD is queued');
  const saved=w.PPMS_JD_OFFLINE.overlay({}).personal;assert.equal(saved.responsibilities,target.responsibilities);assert.equal(saved.assignmentHistory.length,1);assert.equal(saved.version,5);
  w.document.querySelector('#jdDialog [data-jd-edit]').click();let form=w.document.getElementById('jdForm');assert.equal(form.elements.responsibilities.value,target.responsibilities);
  // A later transfer while this editor is open must not save its stale job.
  const moved=changed.map(e=>e.id===person.id?{...e,position:'Technician',section:'CNC Section'}:e);
  w.localStorage.setItem('ppms_v3_employees',JSON.stringify(moved));w.dispatchEvent(new w.Event('ppms-employees-changed'));
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert(form.querySelector('[data-jd-message]').textContent.includes('เปลี่ยนแล้ว'));
  w.document.querySelector('[data-jd-close]').click();button().click();
  exported=(await w.PPMSJDExport.snapshot([moved.find(e=>e.id===person.id)]))[0];assert.equal(exported.position,'Technician');assert.equal(exported.section,'CNC Section');assert(!exported.responsibilities.includes(target.responsibilities));assert.equal(exported.documentUrl,'');assert.equal(exported.effectiveDate,'');assert.equal(exported.assignmentHistory.length,2);
  await wait(650);assert.equal(w.PPMS_JD_OFFLINE.count(),1,'Repeated transfers share one durable personal outbox item');
  const before=w.PPMS_JD_OFFLINE.overlay({}).personal;w.dispatchEvent(new w.Event('ppms-employees-changed'));await wait(450);assert.equal(w.PPMS_JD_OFFLINE.overlay({}).personal.assignmentHistory.length,2,'No duplicate history on unchanged assignment');assert.equal(w.PPMS_JD_OFFLINE.overlay({}).personal._ppmsOfflineOperationId,before._ppmsOfflineOperationId);
  // Department and plant changes participate in matching, including central divisions.
  w.localStorage.setItem('ppms_employee_organization_v1',JSON.stringify({[person.id]:{division:'Warehouse Division',plant:'รวม'}}));
  w.dispatchEvent(new w.StorageEvent('storage',{key:'ppms_employee_organization_v1'}));
  exported=(await w.PPMSJDExport.snapshot([person]))[0];assert.equal(exported.division,'Warehouse Division');assert.equal(exported.plant,'รวม');assert.equal(exported.assignmentHistory.length,3);
  const support=moved.map(e=>e.id===person.id?{...e,section:'คลังสินค้า สนับสนุนการผลิต',position:'Leader'}:e);
  w.localStorage.setItem('ppms_v3_employees',JSON.stringify(support));w.localStorage.setItem('ppms_employee_organization_v1',JSON.stringify({[person.id]:scope}));w.dispatchEvent(new w.Event('ppms-employees-changed'));
  exported=(await w.PPMSJDExport.snapshot([person]))[0];assert.equal(exported.position,'Leader');assert.equal(exported.section,'คลังสินค้า สนับสนุนการผลิต');assert(!/Tapping|ต๊าป/.test(exported.responsibilities),'New support-production duties do not retain the old tapping duties');assert(/สนับสนุนการผลิต|Support Production/.test(exported.responsibilities));
  assert.deepEqual(errors,[]);console.log('PASS current JD after promotion, section/division/plant transfer, saved role selection, generated fallback, history, stale-editor protection, exports and idempotent durable offline updates.');
 }finally{w.requestAnimationFrame=()=>0;await wait(150);dom.window.close()}
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
