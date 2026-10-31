const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const roster=w=>JSON.parse(w.localStorage.getItem('ppms_v3_employees'));
const submit=w=>w.document.querySelector('#productionSupervisorAssignmentForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
(async()=>{
 const {w,errors}=await setup('index.html');
 try{
  const scope={...w.PPMS_RUNTIME.organizationScope()},original=roster(w);
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  w.document.querySelector('[data-assign-production-supervisor]').click();
  let form=w.document.querySelector('#productionSupervisorAssignmentForm');
  assert(w.document.querySelector('[data-remove-production-supervisor="SUP"]'));
  assert(!form.querySelector('option[value="SUP"]'));assert(!form.querySelector('option[value="MANAGER"]'));assert(!form.querySelector('option[value="SUP-OTHER-PLANT"]'));
  form.elements.employeeId.value='OP0';submit(w);await wait(140);
  let e=roster(w).find(e=>e.id==='OP0');assert.equal(e.position,'Supervisor Production');assert.equal(e.section,'Production Division');assert.deepEqual(e.productionSupervisorPreviousRole,{section:'Stamping Section',position:'Operator'});
  assert.equal(roster(w).length,original.length);assert(w.document.querySelector('.production-supervisor-top [data-edit="OP0"]'));assert(!w.document.querySelector('#employeeForm'));
  const pending=JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves')).OP0;assert.equal(pending.expectedPosition,'Operator');assert(pending.organizationScopeUpdate);assert(!pending.patchFields.includes('name'));
  w.document.querySelector('[data-assign-production-supervisor]').click();w.document.querySelector('[data-remove-production-supervisor="OP0"]').click();
  form=w.document.querySelector('#productionSupervisorRemovalForm');assert.equal(form.elements.section.value,'Stamping Section');assert.equal(form.elements.position.value,'Operator');
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(140);
  e=roster(w).find(e=>e.id==='OP0');assert.equal(e.position,'Operator');assert.equal(e.section,'Stamping Section');assert(w.document.querySelector('.division-section [data-edit="OP0"]'));assert(!w.document.querySelector('.production-supervisor-top [data-edit="OP0"]'));assert.equal(roster(w).length,original.length);
  assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_v3_deleted_employee_ids')||'[]'),[]);
  // Existing supervisors without a previous-role snapshot have an editable destination.
  w.document.querySelector('[data-assign-production-supervisor]').click();w.document.querySelector('[data-remove-production-supervisor="SUP"]').click();form=w.document.querySelector('#productionSupervisorRemovalForm');assert.equal(form.elements.section.value,'Bending Section');assert.equal(form.elements.position.value,'Supervisor');
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(140);assert.equal(roster(w).find(e=>e.id==='SUP').position,'Supervisor');
  // Cloud confirmation merges only changed role fields into a concurrent profile edit.
  const server=structuredClone(original);server.find(e=>e.id==='OP1').name='CONCURRENT NAME';server.find(e=>e.id==='OP1').certifications=[{course:'KEEP'}];
  const calls=[];w.PPMS_EMPLOYEE_SAVE_SERVICE.upsert=async(data,id,options)=>{calls.push({data,options});const e=server.find(e=>e.id===id);for(const key of options.patchFields)e[key]=data[key];return {employees:structuredClone(server),deletedEmployeeIds:[],organizationScope:{division:data.organizationDivision,plant:data.organizationPlant}}};
  Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});await w.PPMS_RUNTIME.assignProductionSupervisor('OP1',scope);await wait(100);
  e=roster(w).find(e=>e.id==='OP1');assert.equal(e.name,'CONCURRENT NAME');assert.equal(e.certifications[0].course,'KEEP');assert.equal(e.position,'Supervisor Production');assert(calls.length);
  await assert.rejects(w.PPMS_RUNTIME.assignProductionSupervisor('QC',scope),/ไม่พบพนักงาน/);await assert.rejects(w.PPMS_RUNTIME.assignProductionSupervisor('OP2',{...scope,plant:'โรง 2'}),/โรงงานเปลี่ยน/);
  w.sessionStorage.removeItem('ppms_admin');await assert.rejects(w.PPMS_RUNTIME.assignProductionSupervisor('OP2',scope),/Admin/);
  assert.deepEqual(errors,[]);console.log('PASS direct add/remove, editable legacy destinations, previous-role restore, intact roster/history, durable narrow role patches, cloud confirmation, scope and permission guards');
 }finally{w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
