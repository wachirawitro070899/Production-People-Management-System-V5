const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const productionSections=['Stamping Section','Bending Section','Tapping Section','Welding Section','CNC Section','Sorting 1','Sorting 2'];
const supportSections=['Engineering Support','Support Production','Machine Maintenance','Tooling Maintenance'];
const employee=(id,section,position='Operator',extra={})=>({id,name:'TEST '+id,section,position,startDate:'2020-01-01',contractType:'Permanent',skillLevels:{},currentSkillLevel:1,...extra});
const employees=[employee('MANAGER','Engineering Support Section','Manager'),employee('SUP','Bending Section','Supervisor Production'),employee('SUP-OTHER-PLANT','CNC Section','Supervisor Production',{organizationPlant:'โรง 2'}),employee('WELD-SUP','Welding Section','Supervisor'),...productionSections.map((section,index)=>employee('OP'+index,index>4?'Sorting Section':section,'Operator',index>4?{sortingGroup:section}:{})),...supportSections.map((section,index)=>employee('DIRECT'+index,section+' Section','Technician')),employee('QC','Inspection Section','Supervisor',{organizationDivision:'Quality Division'})];
const master={plants:['โรง 1','โรง 2','โรง 3'],divisions:['Production Division','Quality Division'],sections:[...productionSections,...supportSections],positions:['Manager','Engineer','Supervisor','Leader','Technician','Operator'],positionMap:{'Production Division':[],'Quality Division':['Supervisor']},sectionMap:{'Production Division::โรง 1':[...productionSections,...supportSections],'Production Division::โรง 2':['CNC Section'],'Quality Division::รวม':['Inspection Section']},sectionPositions:{},productionPlantsV751:true,corporateAdministrationV784:true,businessOperationsV785:true,fullDivisionNamesV787:true,sortingSectionsSplit:true,generatedVacanciesRemoved:true};
async function setup(entry){
 const html=fs.readFileSync(entry,'utf8'),scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(p=>!/^https?:/.test(p));
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/'+entry,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc,storageQuota:50*1024*1024}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.CSS={escape:s=>String(s)};Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 w.alert=()=>{};w.confirm=()=>false;w.prompt=()=>null;w.print=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 w.fetch=async url=>({ok:true,status:200,headers:{get:()=>null},json:async()=>String(url).includes('adminAccounts')?[{username:'tester',passwordHash:'test',active:true,owner:false}]:String(url).includes('/employees.json')?employees:String(url).includes('/deletedEmployeeIds.json')?[]:null});
 w.localStorage.setItem('ppms_v3_employees',JSON.stringify(employees));w.localStorage.setItem('ppms_organization_master_v1',JSON.stringify(master));
 w.localStorage.setItem('ppms_v768_admin_device_id','test-device');w.sessionStorage.setItem('ppms_device_lock_verified','test-device');w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_admin_user','tester');w.sessionStorage.setItem('ppms_scope_division','Production Division');w.sessionStorage.setItem('ppms_scope_plant','โรง 1');
 await wait(0);for(const script of scripts)w.eval(fs.readFileSync(script,'utf8')+'\n//# sourceURL='+script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(450);
 if(entry!=='factory-organization.html'){w.document.querySelector('#nav [data-page="dashboard"]').click();await wait(300)}
 return {dom,w,errors};
}
function checkHierarchy(w,factory=false){
 const selector=factory?'.factory-org-section':'.division-section',root=w.document.querySelector('.production-reporting-tree');assert(root,'Production hierarchy loads');
 const supervised=[...root.querySelectorAll('.production-supervised-sections '+selector)].map(el=>el.dataset.orgSection.replace(/\s+Section$/,''));
 assert.deepEqual(supervised,['Stamping','Bending','Tapping','Welding','CNC','Sorting 1','Sorting 2']);
 const direct=[...root.querySelectorAll('.production-direct-sections '+selector)].map(el=>el.dataset.orgSection.replace(/\s+Section$/,''));assert.deepEqual(direct,supportSections);
 assert.equal(root.querySelectorAll('.production-supervisor-top [data-edit="SUP"]').length,1);
 assert.equal(root.querySelectorAll(selector+' [data-edit="SUP"]').length,0,'Division supervisor must never be repeated inside a section');
 assert(root.querySelector('.production-supervised-sections '+selector+' [data-edit="WELD-SUP"]'),'Ordinary Section Supervisor remains in Welding');
 assert.equal(root.querySelectorAll('[data-edit="SUP-OTHER-PLANT"]').length,0,'Other plant supervisor remains outside this scope');
 for(const e of employees.filter(e=>!['MANAGER','SUP-OTHER-PLANT','QC'].includes(e.id)))assert.equal(root.querySelectorAll('[data-edit="'+e.id+'"]').length,1,e.id+' appears once');
}
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   checkHierarchy(w,entry==='factory-organization.html');
   const h=w.PPMSProductionHierarchy;
   for(const position of ['Sup Production','Supervisor Production','Production Supervisor','หัวหน้างานฝ่ายผลิต'])assert(h.isSupervisor(position));
   assert(!h.isSupervisor('Supervisor'),'Ordinary Section Supervisor is a separate role');assert(!h.reportsToSupervisor('Assembly Section'),'New sections do not acquire supervisor reporting by default');
   const normalized=JSON.parse(w.localStorage.getItem('ppms_organization_master_v1'));assert(normalized.positions.includes('Supervisor Production'));assert(normalized.positionMap['Production Division'].includes('Supervisor Production'));assert.deepEqual(normalized.positionMap['Quality Division'],['Supervisor']);
   assert.deepEqual(h.withPosition(master).sectionMap,master.sectionMap);assert(!master.positions.includes('Supervisor Production'),'Position normalization does not mutate previous settings');
   assert.equal(w.PPMSPositionTitle({position:'Supervisor Production',section:'Bending Section',division:'Production Division'}),'หัวหน้างานฝ่ายผลิต');
   w.PPMSLanguage.setLanguage('en');await wait(100);assert.equal(w.PPMSPositionTitle({position:'Supervisor Production',section:'Bending Section',division:'Production Division'}),'Supervisor Production');assert.equal(w.document.querySelector('.production-branch-heading h4'),null,'Direct-report label is omitted in both languages');assert(!w.document.querySelector('.production-direct-sections').textContent.includes('Reports directly to Manager'));w.PPMSLanguage.setLanguage('th');await wait(100);
   const jd=w.PPMSJDTemplates.draft({position:'Supervisor Production',section:'Bending Section',division:'Production Division'});assert.equal(jd.reportsTo,'ผู้จัดการฝ่ายผลิต / Production Manager');for(const name of ['Stamping','Bending','Tapping','Welding','CNC','Sorting 1','Sorting 2'])assert(jd.responsibilities.includes(name));
   if(entry==='index.html'){
    w.document.querySelector('[data-assign-production-supervisor]').click();const choose=w.document.querySelector('#productionSupervisorAssignmentForm');assert(choose);choose.elements.employeeId.value='OP0';choose.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
    const form=w.document.querySelector('#employeeForm');assert.equal(form.elements.position.value,'Supervisor Production');assert([...form.querySelectorAll('#orgPositions option')].some(option=>option.value==='Supervisor Production'));
    Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(500);
    const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));assert.equal(saved.find(e=>e.id==='OP0').position,'Supervisor Production');assert.equal(saved.find(e=>e.id==='OP0').section,'Stamping Section');assert.equal(saved.find(e=>e.id==='OP0').startDate,'2020-01-01');assert.equal(saved.length,employees.length);
    w.document.activeElement?.blur();w.document.querySelector('#nav [data-page="dashboard"]').click();await wait(300);assert.equal(w.document.querySelectorAll('.production-supervisor-top [data-edit="OP0"]').length,1,JSON.stringify({scope:w.sessionStorage.getItem('ppms_scope_division'),plant:w.sessionStorage.getItem('ppms_scope_plant'),map:w.localStorage.getItem('ppms_employee_organization_v1'),saved:JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id==='OP0'),html:w.document.querySelector('.production-supervisor-top')?.textContent}));assert.equal(w.document.querySelectorAll('.division-section [data-edit="OP0"]').length,0);
    const division=w.document.querySelector('#globalOrganizationDivision');division.value='Quality Division';division.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(300);assert(!w.document.querySelector('.production-reporting-tree'),'Nonproduction divisions retain their existing structure');assert(w.document.querySelector('[data-edit="QC"]'));
   }
   assert.deepEqual(errors,[],errors.join('\n'));console.log('PASSED',entry,'7 supervised / 4 direct sections, unique supervisor, ordinary supervisor, plant scope, position persistence, bilingual labels, and production JD');
  }finally{dom.window.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
