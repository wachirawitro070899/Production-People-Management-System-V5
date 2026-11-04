const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(r=>setTimeout(r,ms)),all=w=>w.PPMS_RUNTIME.factoryLayoutEmployees(),nav=async(w,page)=>{w.document.activeElement?.blur();w.document.querySelector(`#nav [data-page="${page}"]`).click();await wait(120)},chooseLine=async(w,line)=>{w.document.activeElement?.blur();w.PPMSProductionLines.select(line);await wait(100)};
(async()=>{
 const run=await setup('index.html');try{
  const {w}=run,h=w.PPMSProductionHierarchy,api=w.PPMSProductionLines,scope={...w.PPMS_RUNTIME.organizationScope()},count=all(w).length;
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  assert.equal(w.document.querySelectorAll('[data-supervisor-group]').length,2);assert(w.document.querySelector('[data-supervisor-group="12"] [data-edit="SUP"]'));assert(w.document.querySelector('[data-supervisor-group="3"] .line-supervisor-vacancy'));assert(!w.document.querySelector('.production-reporting-tree').textContent.includes('หัวหน้างานฝ่ายผลิต'));
  w.document.querySelector('[data-edit="SUP"]').click();await wait(80);assert.equal(w.document.querySelector('#employeeForm').elements.position.value,'Supervisor Line 1–2');w.document.querySelector('#closeModal').click();w.document.activeElement?.blur();assert.equal(all(w).find(e=>e.id==='SUP').position,'Supervisor Production');
  assert.equal(h.supervisorGroup('Supervisor'),null);
  await assert.rejects(w.PPMS_RUNTIME.assignProductionSupervisor('OP0',scope,null,'12'),/1 คน/);
  await w.PPMS_RUNTIME.assignProductionSupervisor('OP1',scope,null,'3');
  assert.equal(all(w).find(e=>e.id==='OP1').position,'Supervisor Line 3');
  assert.equal(all(w).length,count);await assert.rejects(w.PPMS_RUNTIME.assignProductionSupervisor('OP2',scope,null,'3'),/1 คน/);
  await w.PPMS_RUNTIME.assignProductionSupervisor('SUP',scope,null,'12');assert.equal(all(w).find(e=>e.id==='SUP').position,'Supervisor Line 1–2');
  api.saveAssignments({['employees/'+api.personKey('OP0')]:'1',['employees/'+api.personKey('OP2')]:'2',['employees/'+api.personKey('OP3')]:'3'},scope);
  await nav(w,'dashboard');assert.equal(w.document.querySelectorAll('.production-supervisor-top [data-edit="SUP"]').length,1);assert.equal(w.document.querySelectorAll('.production-supervisor-top [data-edit="OP1"]').length,1);
  const list=all(w);assert.deepEqual(Array.from(api.filter(list,scope,'1'),e=>e.id).filter(id=>['SUP','OP1'].includes(id)),['SUP']);assert.deepEqual(Array.from(api.filter(list,scope,'2'),e=>e.id).filter(id=>['SUP','OP1'].includes(id)),['SUP']);assert.deepEqual(Array.from(api.filter(list,scope,'3'),e=>e.id).filter(id=>['SUP','OP1'].includes(id)),['OP1']);
  assert.throws(()=>api.saveAssignments({['employees/'+api.personKey('SUP')]:'3'},scope),/Supervisor/);
  const model=w.PPMSOrganizationEditor.model({},list,scope),parent=id=>model.parents.get(id);
  assert.equal(String(parent('OP0')),'SUP');assert.equal(String(parent('OP2')),'SUP');assert.equal(String(parent('OP3')),'OP1');
  await nav(w,'lineOrganization');assert.equal(w.document.querySelectorAll('[data-supervisor-group]').length,2);assert(!w.document.querySelector('[data-board-person="SUP"]'));assert(!w.document.querySelector('[data-board-person="OP1"]'));
  w.PPMSLineBoard.setMode('report');await wait(80);
  assert.equal(w.document.querySelectorAll('[data-edit="SUP"]').length,1,'One shared supervisor above lines 1 and 2');assert.equal(w.document.querySelectorAll('[data-edit="OP1"]').length,1);
  assert(w.document.querySelector('[data-supervisor-family="12"] [data-production-line="1"]'));assert(w.document.querySelector('[data-supervisor-family="12"] [data-production-line="2"]'));assert(w.document.querySelector('[data-supervisor-family="3"] [data-production-line="3"]'));
  await chooseLine(w,'1');assert(w.document.querySelector('[data-edit="SUP"]'));assert(!w.document.querySelector('[data-edit="OP1"]'));
  await chooseLine(w,'2');assert(w.document.querySelector('[data-edit="SUP"]'));assert(!w.document.querySelector('[data-edit="OP1"]'));
  await chooseLine(w,'3');assert(!w.document.querySelector('[data-edit="SUP"]'));assert(w.document.querySelector('[data-edit="OP1"]'));
  w.document.querySelector('.production-line-controls [data-line-matrix]').click();await wait(100);const sec=w.document.querySelector('#matrixSection');sec.value='Production Division';sec.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(100);assert.equal(w.document.querySelector('#matrixSection').value,'Production Division');assert.deepEqual(Array.from(w.PPMSMatrixReport.snapshot().rows,e=>e.id),['OP1']);
  await nav(w,'lineOrganization');w.PPMSLineBoard.setMode('board');await wait(80);assert.equal(w.document.querySelectorAll('[data-supervisor-group]').length,2,'Board retains both roles even after filtering a report');
  w.document.querySelector('[data-assign-production-supervisor="3"]').click();assert(w.document.querySelector('[data-remove-production-supervisor="OP1"]'));assert(!w.document.querySelector('#productionSupervisorAssignmentForm option[value="SUP"]'));
  w.document.querySelector('[data-remove-production-supervisor="OP1"]').click();let f=w.document.querySelector('#productionSupervisorRemovalForm');assert.equal(f.elements.position.value,'Operator');assert.equal(f.elements.section.value,'Bending Section');f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(120);assert.equal(all(w).find(e=>e.id==='OP1').position,'Operator');assert.equal(all(w).length,count);
  w.PPMSLanguage.setLanguage('en');await wait(80);assert(w.document.querySelector('[data-supervisor-group="12"]').textContent.includes('Lines 1 & 2'));
  // Native Excel uses the new position labels even for unchanged legacy records.
  const ExcelJS=require('../vendor/exceljs-4.4.0.min.js'),JSZip=require('../vendor/jszip-3.10.1.min.js');
  const exporter=new Function('ExcelJS','JSZip','window',fs.readFileSync('organization-excel-v877.js','utf8')+';return window.PPMSOrganizationExcel;')(ExcelJS,JSZip,{PPMSProductionHierarchy:h});
  const native={title:'Line Supervisors',nodes:[{employee:{id:'LEGACY',name:'Legacy',position:'Supervisor Production',section:'Production Division'},parent:'',x:0,y:0,w:160,h:180},{employee:{id:'THREE',name:'Three',position:'Supervisor Line 3',section:'Production Division'},parent:'',x:180,y:0,w:160,h:180}],labels:[],width:400,height:240};
  const bytes=Buffer.from(await exporter.workbook(native,[{data:null},{data:null}])),zip=await JSZip.loadAsync(bytes),drawing=await zip.file('xl/drawings/drawing1.xml').async('string');
  assert(drawing.includes('Supervisor Line 1–2'));assert(drawing.includes('Supervisor Line 3'));assert(!drawing.includes('Supervisor Production'));
  assert.deepEqual(run.errors,[]);console.log('PASS two fixed line supervisors, legacy compatibility, single-person guards, cross-line membership, unique charts, reporting parents, board protection, Matrix scope, removal/history preservation and bilingual titles');
 }finally{run.w.close()}
 // Factory and 404 entry points use the same two positions and preserve plant isolation.
 employees.find(e=>e.id==='OP1').position='Supervisor Line 3';employees.find(e=>e.id==='OP1').section='Production Division';
 for(const entry of ['factory-organization.html','404.html']){const run=await setup(entry);try{assert.equal(run.w.document.querySelectorAll('[data-supervisor-group]').length,2);assert(run.w.document.querySelector('[data-supervisor-group="3"] [data-edit="OP1"]'));assert(!run.w.document.querySelector('[data-supervisor-group] [data-edit="SUP-OTHER-PLANT"]'));assert.deepEqual(run.errors,[]);console.log('PASS line supervisor structure and plant isolation:',entry)}finally{run.w.close()}}
})().catch(error=>{console.error(error);process.exitCode=1});
