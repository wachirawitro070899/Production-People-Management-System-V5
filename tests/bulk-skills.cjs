const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function dispose(dom){const w=dom.window;w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(50);w.close();await wait(0)}
const app=fs.readFileSync('app-v588.js','utf8');
const start=app.indexOf('function skillMatrixPositionRank('),end=app.indexOf('function skillMatrixEmploymentRank(',start),ctx={window:{}};
vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);
const order=['ผู้จัดการฝ่ายผลิต','Supervisor Production','Stamping Specialist','Production Engineer','Leader','Assistant Leader','Technician','Production Planning','Document Control','Store','Custom Role','OP1'];
assert.deepEqual([...order].reverse().sort((a,b)=>ctx.skillMatrixPositionRank(a)-ctx.skillMatrixPositionRank(b)),order);
for(const pos of ['OP','OP10','Operator','Opeartor','Operater','พนักงานทั่วไป','พนักงานผลิต'])assert.equal(ctx.skillMatrixPositionRank(pos),11,pos);
const first=employees.find(e=>e.id==='TEST-4-0'),second=employees.find(e=>e.id==='TEST-4-1');
first.skillLevels={Safety:2,'Machine Operation':4};first.currentSkillLevel=1;second.skillLevels={Safety:3};
(async()=>{
 const {dom,w,errors}=await setup(true,'index.html',{session:{matrixSec:'Stamping Section'}});
 try{
  const microtask=w.queueMicrotask.bind(w);w.queueMicrotask=fn=>microtask(()=>{if(w.document)fn()});
  const alerts=[];w.alert=s=>alerts.push(s);Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  w.document.querySelector('#nav [data-page="matrix"]').click();await wait(100);
  const ids=[...w.document.querySelectorAll('.skill-matrix-table tbody tr')].map(tr=>tr.cells[2].textContent);
  assert.equal(ids[0],'TEST-4-0','Manager above engineer and supervisor');assert.equal(ids.at(-1),'TEST-4-5','Operator is last');
  w.document.querySelector('[data-action="bulkSkills"]').click();
  let f=w.document.querySelector('#bulkSkillForm');assert(f);
  const submit=()=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  submit();assert(w.document.querySelector('#bulkSkillStatus').textContent.includes('เลือกพนักงาน'));
  const search=w.document.querySelector('#bulkSkillSearch');search.value='TEST-4-0';search.dispatchEvent(new w.Event('input',{bubbles:true}));w.document.querySelector('#bulkSkillSelectAll').click();
  assert.equal(f.querySelectorAll('[name="bulkEmployee"]:checked').length,1,'Select all respects search');
  search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const box=f.querySelector('[name="bulkEmployee"][value="TEST-4-1"]');box.checked=true;box.dispatchEvent(new w.Event('change',{bubbles:true}));
  submit();assert(w.document.querySelector('#bulkSkillStatus').textContent.includes('หัวข้อ'));
  const topic=f.querySelector('[name="bulkTopic"][value="0"]');topic.checked=true;topic.dispatchEvent(new w.Event('change',{bubbles:true}));f.elements.bulkLevel0.value='4';
  submit();assert(w.document.querySelector('#bulkSkillStatus').textContent.includes('ผู้ประเมิน'));
  f.elements.evaluator.value='QA Evaluator';f.elements.evaluator.dispatchEvent(new w.Event('input',{bubbles:true}));
  const original=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));
  submit();assert(w.document.querySelector('#bulkSkillPreview').textContent.includes('2 คน'));assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_v3_employees')),original,'Review never writes');
  submit();await wait(150);
  assert(w.document.querySelector('#modal').classList.contains('hidden'),w.document.querySelector('#bulkSkillStatus')?.textContent+' / '+alerts.join(';'));assert(alerts.at(-1).includes('รอซิงก์ 2 คน'));
  const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees')),pending=JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves'));
  for(const id of ['TEST-4-0','TEST-4-1']){
   const e=saved.find(e=>e.id===id);assert.equal(e.skillLevels.Safety,4);assert.equal(e.skillHistory[0].evaluator,'QA Evaluator');assert.deepEqual(e.skillHistory[0].changed,['Safety']);assert.equal(e.skillHistory.length,1);assert(pending[id].patchFields.includes('skillLevels'));assert.equal(pending[id].expectedSection,'Stamping Section');assert(!Object.hasOwn(pending[id].data,'name'),'Skill patches exclude names and photos');
   for(const key of ['id','name','position','section','contractType','startDate'])assert.equal(e[key],original.find(e=>e.id===id)[key]);
  }
  assert.equal(saved.find(e=>e.id==='TEST-4-0').skillLevels['Machine Operation'],4,'Unselected topics preserved');
  for(const e of original.filter(e=>!['TEST-4-0','TEST-4-1'].includes(e.id)))assert.deepEqual(saved.find(x=>x.id===e.id),e,'Unselected employees unchanged');
  assert(w.document.querySelector('.skill-matrix-table tbody').textContent.includes('QA Evaluator')===false);
  // A reopened bulk dialog supports the existing durable outbox without duplicating history on no-op.
  w.document.querySelector('[data-action="bulkSkills"]').click();f=w.document.querySelector('#bulkSkillForm');
  f.querySelector('[name="bulkEmployee"][value="TEST-4-0"]').checked=true;f.querySelector('[name="bulkTopic"][value="0"]').checked=true;f.querySelector('[name="bulkTopic"][value="0"]').dispatchEvent(new w.Event('change',{bubbles:true}));f.elements.bulkLevel0.value='4';f.elements.evaluator.value='QA Evaluator';submit();
  assert(w.document.querySelector('#bulkSkillStatus').textContent.includes('ตรงกับค่าที่กำหนดแล้ว'));
  assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id==='TEST-4-0').skillHistory.length,1);
  const writes=[];w.PPMS_EMPLOYEE_SAVE_SERVICE.upsert=async(data,id,options)=>{writes.push({data,id,options});const list=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));return {employees:list.map(e=>e.id===id?{...e,...data}:e),deletedEmployeeIds:[]}};
  Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});f.elements.bulkLevel0.value='3';f.elements.bulkLevel0.dispatchEvent(new w.Event('change',{bubbles:true}));submit();submit();await wait(180);
  assert(w.document.querySelector('#modal').classList.contains('hidden'));assert(alerts.at(-1).includes('ซิงก์ Firebase แล้ว 1 คน'));assert.equal(writes.length,1);assert(writes[0].options.patchFields.includes('skillHistory'));assert(!JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves'))['TEST-4-0']);assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id==='TEST-4-0').skillLevels.Safety,3);
  const section=w.document.querySelector('#matrixSection');section.value='Sorting Section';section.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(80);
  w.document.querySelector('[data-action="bulkSkills"]').click();
  const sortingIds=[...w.document.querySelectorAll('#bulkSkillForm [name="bulkEmployee"]')].map(e=>e.value);
  assert(sortingIds.length);for(const id of sortingIds)assert.equal(employees.find(e=>e.id===id).sortingGroup,'Sorting 1');
  assert.deepEqual(errors,[],errors.join('\n'));
  console.log('Passed: hierarchy aliases, actual matrix row order, bulk search/select, validation, review before write, offline durable skill patches, audit history, untouched employees/topics, no-op guard and Sorting scope.');
 }finally{await dispose(dom)}
 const publicState=await setup(false);try{const microtask=publicState.w.queueMicrotask.bind(publicState.w);publicState.w.queueMicrotask=fn=>microtask(()=>{if(publicState.w.document)fn()});assert(!publicState.w.document.querySelector('[data-action="bulkSkills"]'));assert.deepEqual(publicState.errors,[])}finally{await dispose(publicState.dom)}
})().catch(error=>{console.error(error);process.exitCode=1});

