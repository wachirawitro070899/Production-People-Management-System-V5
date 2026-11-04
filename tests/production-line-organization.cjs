const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const divisions=['Production Division','Quality Division','Warehouse Division','Corporate Administration Division','Business Operations Division'];
const employee=(id,division,plant,section,position='Operator')=>({id,name:'SCOPE '+id,position,section,organizationDivision:division,organizationPlant:plant,startDate:'2020-01-01',contractType:'Permanent',currentSkillLevel:1,skillLevels:{}});
const employees=[employee('M',divisions[0],'โรง 1','Stamping Section','Manager'),employee('S1',divisions[0],'โรง 1','Stamping Section'),employee('S2',divisions[0],'โรง 1','Stamping Section'),employee('W1',divisions[0],'โรง 1','Welding Section'),employee('C1',divisions[0],'โรง 1','CNC Section'),employee('X',divisions[0],'โรง 1','Tooling Maintenance'),employee('U',divisions[0],'โรง 1','Other Section'),employee('P2',divisions[0],'โรง 2','Stamping Section'),employee('Q',divisions[1],'รวม','Inspection Section')];
const master={plants:['โรง 1','โรง 2','โรง 3'],divisions,sections:['Stamping Section','Shared Section','Inspection Section','Warehouse Section'],positions:['Manager','Operator'],positionMap:Object.fromEntries(divisions.map(d=>[d,['Manager','Operator']])),sectionMap:{'Production Division::โรง 1':['Stamping Section','Welding Section','CNC Section','Tooling Maintenance','Other Section'],'Production Division::โรง 2':['Shared Section'],'Production Division::โรง 3':[],'Quality Division::รวม':['Inspection Section','Shared Section'],'Warehouse Division::รวม':['Warehouse Section'],'Corporate Administration Division::รวม':[],'Business Operations Division::รวม':[]},sectionPositions:{},productionPlantsV751:true,corporateAdministrationV784:true,businessOperationsV785:true,fullDivisionNamesV787:true,sortingSectionsSplit:true,generatedVacanciesRemoved:true};
const attendance=employees.map(e=>({employeeId:e.id,section:e.section,date:'2026-10-12',checkIn:'2026-10-12T01:00:00.000Z',checkOut:'2026-10-12T10:00:00.000Z',status:'Present'}));
const examResults=employees.map((e,i)=>({employeeId:e.id,section:e.section,date:'2026-10-12',createdAt:'2026-10-12T01:00:0'+i+'.000Z',examType:'quarterly',quarter:'Q4',level:1,setName:'A',correct:10,total:20,score:50}));
const layout={machines:{p1:{name:'P1 MACHINE',section:'Shared Section',division:divisions[0],plant:'โรง 1',assignments:{}},p2:{name:'P2 MACHINE',section:'Shared Section',division:divisions[0],plant:'โรง 2',assignments:{}},q:{name:'QUALITY MACHINE',section:'Shared Section',division:divisions[1],plant:'รวม',assignments:{}},legacyQ:{name:'LEGACY QUALITY MACHINE',section:'Inspection Section',assignments:{}}},sectionMaps:{p1:{name:'P1 MAP',section:'Shared Section',division:divisions[0],plant:'โรง 1',src:'p1.png'},p2:{name:'P2 MAP',section:'Shared Section',division:divisions[0],plant:'โรง 2',src:'p2.png'},q:{name:'QUALITY MAP',section:'Shared Section',division:divisions[1],plant:'รวม',src:'q.png'},legacyQ:{name:'LEGACY QUALITY MAP',section:'Inspection Section',src:'q2.png'}}};
async function setup(entry){
 const html=fs.readFileSync(entry,'utf8'),scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(p=>!/^https?:/.test(p));
 const errors=[],downloads=[],requests=[],writes=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/'+entry,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc,storageQuota:50*1024*1024}),w=dom.window;
 w.queueMicrotask=callback=>queueMicrotask(()=>{if(w.document)callback()});w.HTMLCanvasElement.prototype.getContext=()=>null;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.CSS={escape:s=>String(s)};w.AbortSignal=AbortSignal;Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 w.alert=()=>{};w.confirm=()=>false;w.prompt=()=>null;w.print=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.remove()};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 w.Blob=Blob;const blobs=new Map();w.URL.createObjectURL=blob=>{const url='blob:test-'+blobs.size;blobs.set(url,blob);return url};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push({name:this.download,blob:blobs.get(this.href)})};
 const remoteLines={};let lineFailure=false;w.setLineFailure=value=>lineFailure=value;
 w.fetch=async (url,options={})=>{if(String(url).includes('/settings/productionLines/')&&options.method==='PATCH'){const address=String(url),patch=JSON.parse(options.body);writes.push({url:address,patch});if(lineFailure)throw Error('offline test');remoteLines[address]||={sections:{},employees:{}};for(const [path,value]of Object.entries(patch)){const [group,id]=path.split('/');if(value===null)delete remoteLines[address][group][id];else (remoteLines[address][group]||={})[id]=value}return {ok:true,json:async()=>patch}}requests.push(String(url));return {ok:true,status:200,headers:{get:()=>null},json:async()=>String(url).includes('/settings/productionLines/')?(remoteLines[String(url)]||null):String(url).includes('ppmsFactoryLayout/v1.json')?layout:String(url).includes('/api/ppms/employee-kpi')?{month:new URL(url).searchParams.get('month'),histories:new URL(url).searchParams.get('codes').split(',').map(employeeCode=>({employeeCode,history:[],online:true})),online:true}:String(url).includes('adminAccounts')?[{username:'tester',passwordHash:'test',active:true,owner:false}]:String(url).includes('/employees.json')?employees:String(url).includes('/deletedEmployeeIds.json')?[]:null}};
 for(const [key,value] of Object.entries({ppms_v3_employees:employees,ppms_organization_master_v1:master,ppms_v3_attendance:attendance,ppms_v3_exam_results:examResults,ppms_factory_layout_v1:layout}))w.localStorage.setItem(key,JSON.stringify(value));
 w.localStorage.setItem('ppms_v768_admin_device_id','test-device');w.sessionStorage.setItem('ppms_device_lock_verified','test-device');w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_admin_user','tester');w.sessionStorage.setItem('ppms_scope_division',divisions[0]);w.sessionStorage.setItem('ppms_scope_plant','โรง 1');
 await wait(0);for(const script of scripts)w.eval(fs.readFileSync(script,'utf8')+'\n//# sourceURL='+script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(450);
 return {dom,w,errors,downloads,requests,writes};
}
async function nav(w,page){w.document.activeElement?.blur();const button=w.document.querySelector('#nav [data-page="'+page+'"]');assert(button,page+' navigation');button.click();await wait(200);assert(!w.document.querySelector('.page-error'),page+' renders')}
async function select(w,division,plant){w.document.activeElement?.blur();const d=w.document.querySelector('body.section-production-kpi-view #sectionKpiOrganizationDivision')||w.document.querySelector('#app [data-organization-division]');assert(d,'Scope selector');d.value=division;d.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(220);if(plant){const p=w.document.querySelector('#app [data-organization-plant]');assert(p);p.value=plant;p.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(220)}}
function roster(w,ids){assert.deepEqual(Array.from(w.PPMS_RUNTIME.factoryLayoutEmployees(),e=>e.id).sort(),ids.slice().sort())}
function noForeign(w,scopeIds){const root=w.document.body.classList.contains('section-production-kpi-view')?w.document.querySelector('#sectionProductionKpiPage'):w.document.querySelector('#app');for(const e of employees.filter(e=>!scopeIds.includes(e.id))){assert(!root.textContent.includes(e.name),'Foreign name '+e.id);assert(!root.querySelector('[data-edit="'+e.id+'"]'),'Foreign employee action '+e.id)}assert(!root.querySelector('.page-error'))}
async function exportText(w,downloads,action,scopeIds){const b=w.document.querySelector('[data-action="'+action+'"]');assert(b,action+' button');const before=downloads.length;b.click();await wait(20);assert(downloads.length>before,action+' download');const text=await downloads.at(-1).blob.text();for(const id of scopeIds)assert(text.includes(id),action+' includes '+id);for(const e of employees.filter(e=>!scopeIds.includes(e.id)))assert(!text.includes(e.id),action+' excludes '+e.id);return text}

const ids=w=>Array.from(new Set(Array.from(w.document.querySelectorAll('.division-org:not(.employee-history-report) .person[data-edit],#factoryDivisionChartDetail .factory-chart-person[data-edit]'),n=>n.dataset.edit))).sort();
async function line(w,value){const select=w.document.querySelector('[data-org-line-select]');assert(select,'Line selector exists');select.value=value;select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(140);assert(!w.document.querySelector('.page-error'))}
function row(w,path,value){const select=Array.from(w.document.querySelectorAll('#productionLineDialog [data-line-path]')).find(n=>n.dataset.linePath===path);assert(select,path);select.value=value}
if(require.main===module)(async()=>{
 const run=await setup('index.html'),{w,writes}=run;
 try{
  await nav(w,'dashboard');assert.deepEqual(ids(w),['C1','M','S1','S2','U','W1','X']);
  w.document.querySelector('[data-org-line-settings]').click();assert(w.document.querySelector('#productionLineDialog'));
  const api=w.PPMSProductionLines,scope={division:divisions[0],plant:'โรง 1'};
  row(w,'sections/'+api.sectionKey('Stamping Section'),'1');row(w,'sections/'+api.sectionKey('Welding Section'),'1');row(w,'sections/'+api.sectionKey('CNC Section'),'3');row(w,'sections/'+api.sectionKey('Tooling Maintenance'),'shared');row(w,'employees/'+api.personKey('S2'),'2');
  w.document.querySelector('#productionLineDialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(180);
  assert.equal(writes.length,1);assert.equal(api.pending.length,0);assert.equal(Object.keys(writes[0].patch).length,5);assert(!writes[0].url.includes('organizationMaster'));
  await line(w,'1');assert.deepEqual(ids(w),['M','S1','W1','X']);assert(w.document.querySelector('#app>.page-head h2').textContent.endsWith('ไลน์ 1'));
  assert.equal(w.document.querySelector('.cards .metric b').textContent,'4');assert.equal(w.PPMSOrgPoster.context().counts.total,4);assert(w.PPMSOrgPoster.context().title.endsWith('ไลน์ 1'));
  let exported;w.PPMSOrganizationExcel.download=data=>{exported=data};w.document.querySelector('[data-action="pageExcel"]').click();await wait(10);assert.deepEqual(Array.from(exported.list,e=>e.id).sort(),['M','S1','W1','X']);assert(exported.title.endsWith('Line 1'));
  const structure=w.document.querySelector('#organizationStructureView');structure.value='tree';structure.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(100);assert.deepEqual(ids(w),['M','S1','W1','X']);
  const departments=w.document.querySelector('#organizationStructureView');departments.value='departments';departments.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(100);
  await line(w,'2');assert.deepEqual(ids(w),['M','S2','X']);assert(!w.document.querySelector('[data-org-section="CNC Section"]'));
  await line(w,'3');assert.deepEqual(ids(w),['C1','M','X']);
  await line(w,'unassigned');assert.deepEqual(ids(w),['U']);
  // Every line view is a projection. The company master and unrelated pages stay complete.
  await nav(w,'search');for(const id of ['M','S1','S2','W1','C1','X','U'])assert(w.document.querySelector('[data-edit="'+id+'"]'));
  assert.equal(w.getAppHealth().employees,employees.length);assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees')).length,employees.length);
  await nav(w,'dashboard');await select(w,divisions[0],'โรง 2');assert.equal(api.selection(),'all');assert.deepEqual(ids(w),['P2']);
  await select(w,divisions[0],'โรง 1');assert.equal(api.selection(),'unassigned');assert.deepEqual(ids(w),['U']);
  await select(w,divisions[1]);assert(!w.document.querySelector('[data-org-line-select]'));assert.deepEqual(ids(w),['Q']);
  await select(w,divisions[0],'โรง 1');await line(w,'1');w.PPMSLanguage.setLanguage('en');await wait(60);assert(w.document.querySelector('#app>.page-head h2').textContent.endsWith('Line 1'));assert.equal(w.PPMSOrgPoster.context().counts.total,4);
  // Failed cloud writes remain queued and are replayed above remote snapshots.
  w.setLineFailure(true);api.saveAssignments({['employees/'+api.personKey('W1')]:'2'},scope);await wait(80);assert.equal(api.pending.length,1);assert.deepEqual(ids(w),['M','S1','X']);
  w.setLineFailure(false);await api.sync();await wait(60);assert.equal(api.pending.length,0);
  // Removing an override returns to the section assignment without changing employee records.
  api.saveAssignments({['employees/'+api.personKey('S2')]:null},scope);await wait(80);assert.deepEqual(ids(w),['M','S1','S2','X']);
  await line(w,'all');assert.deepEqual(ids(w),['C1','M','S1','S2','U','W1','X']);
  // Lines beyond 1–3 are created through the same UI used by administrators.
  w.document.querySelector('[data-org-line-manage]').click();
  for(let n=4;n<=8;n++)w.document.querySelector('[data-line-add]').click();
  w.document.querySelector('[data-line-name="8"]').value='Assembly & Packing';
  w.document.querySelector('#productionLineNamesDialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(100);
  assert.equal(api.lineIds().length,8);assert.equal(api.label('8'),'Assembly & Packing');assert.equal(api.pending.length,0);
  api.saveAssignments({['sections/'+api.sectionKey('Stamping Section')]:'8',['employees/'+api.personKey('S2')]:'6'},scope);await wait(100);
  w.document.querySelector('[data-org-line-view]').click();await wait(100);
  assert.equal(w.document.querySelector('.division-org').dataset.organizationMode,'lines');
  assert.equal(w.document.querySelectorAll('.production-lines-grid>[data-production-line]').length,8);
  assert(w.document.querySelector('[data-production-line="8"] [data-edit="S1"]'));
  assert(w.document.querySelector('[data-production-line="6"] [data-edit="S2"]'));
  assert(w.document.querySelector('[data-production-line="shared"] [data-edit="M"]'));
  assert.equal(w.document.querySelectorAll('.production-lines-chart .person[data-edit]').length,7,'No duplicated shared people in all-lines layout');
  assert.equal(w.PPMSOrgPoster.context().counts.total,7);
  await line(w,'8');assert.deepEqual(ids(w),['M','S1','X']);assert(w.PPMSOrgPoster.context().title.endsWith('Assembly & Packing'));
  assert.throws(()=>api.saveAssignments({'lines/8':{deleted:true}},scope),/Move all/);
  api.saveAssignments({'lines/4':{deleted:true}},scope);await wait(80);assert(!api.lineIds().includes('4'));
  assert.throws(()=>api.saveAssignments({['employees/'+api.personKey('S1')]:'4'},scope));
  await select(w,divisions[0],'โรง 2');assert.deepEqual(Array.from(api.lineIds()),['1','2','3']);
  await select(w,divisions[0],'โรง 1');assert.equal(api.selection(),'8');assert.deepEqual(ids(w),['M','S1','X']);
  w.document.querySelector('[data-org-line-view]').click();await wait(100);assert.equal(w.document.querySelector('.division-org').dataset.organizationMode,'departments');
  assert.deepEqual(ids(w),['M','S1','X']);
  console.log('PASS add/name eight lines, grouping, split assignments, no duplicate people, scoped persistence, print counts, deletion guards and view toggle');
  // A separate page always groups lines without changing the dashboard view mode.
  w.PPMSLineBoard.setMode('report');await nav(w,'lineOrganization');assert.equal(w.sessionStorage.getItem('ppms_admin_page_v906'),'lineOrganization');
  assert.equal(w.document.querySelector('.division-org').dataset.organizationMode,'lines');
  assert(!w.document.querySelector('#organizationStructureView'));assert(!w.document.querySelector('[data-org-line-view]'));
  await line(w,'all');assert.equal(w.document.querySelectorAll('.production-lines-chart .person[data-edit]').length,7);
  assert(w.document.querySelector('[data-org-line-settings]'));
  let lineExport;w.PPMSOrganizationExcel.download=data=>{lineExport=data};
  w.document.querySelector('[data-action="pageExcel"]').click();await wait(10);assert.equal(lineExport.list.length,7);
  await nav(w,'dashboard');assert.equal(w.document.querySelector('.division-org').dataset.organizationMode,'departments');
  await nav(w,'lineOrganization');await line(w,'8');
  w.document.querySelector('.production-line-controls [data-line-matrix]').click();await wait(180);
  assert(w.document.querySelector('#nav [data-page="matrix"].active'));
  const matrixIds=()=>Array.from(w.PPMSMatrixReport.snapshot().rows,r=>r.id).sort();
  assert.deepEqual(matrixIds(),['S1']);assert(w.PPMSMatrixReport.snapshot().title.endsWith('Assembly & Packing'));
  assert.deepEqual(Array.from(w.document.querySelector('#matrixSection').options,o=>o.value),['Stamping Section']);
  assert(!matrixIds().includes('M')&&!matrixIds().includes('X'),'Shared staff stay outside member-only matrices');
  w.document.querySelector('[data-action="bulkSkills"]').click();await wait(20);
  assert.deepEqual(Array.from(w.document.querySelectorAll('[name="bulkEmployee"]'),n=>n.value),['S1']);
  w.document.querySelector('#modal [data-action="close"]').click();w.document.activeElement?.blur();
  // Reports take their rows from the filtered matrix and retain the line name.
  const model=w.PPMSMatrixReport.snapshot(),paper=w.PPMSMatrixReport.options('A4','landscape');
  const pages=w.PPMSMatrixReport.makePages(model,paper);assert(pages.includes('Assembly &amp; Packing'));assert(pages.includes('data-matrix-doc-employee="S1"'));assert(!pages.includes('data-matrix-doc-employee="S2"'));
  w.eval(fs.readFileSync('vendor/exceljs-4.4.0.min.js','utf8'));const book=await w.PPMSMatrixReport.workbook(model,paper);
  const cells=[];book.worksheets[0].eachRow(row=>row.eachCell(cell=>cells.push(cell.value)));
  assert(cells.includes('S1'));assert(!cells.includes('S2'));assert(cells.some(c=>typeof c==='string'&&c.includes('Assembly & Packing')));
  await line(w,'6');assert.deepEqual(matrixIds(),['S2']);
  // Changing assignments immediately rebuilds both the matrix and its section list.
  api.saveAssignments({['employees/'+api.personKey('W1')]:'6'},scope);await wait(100);
  assert.deepEqual(Array.from(w.document.querySelector('#matrixSection').options,o=>o.value),['Stamping Section','Welding Section']);
  const ms=w.document.querySelector('#matrixSection');ms.value='Welding Section';ms.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(100);assert.deepEqual(matrixIds(),['W1']);
  api.saveAssignments({['employees/'+api.personKey('W1')]:'8'},scope);await wait(100);assert.deepEqual(matrixIds(),['S2']);
  await line(w,'5');assert.deepEqual(matrixIds(),[]);assert(w.PPMSMatrixReport.snapshot().title.endsWith('Line 5'));
  await line(w,'unassigned');assert.deepEqual(matrixIds(),['U']);
  await line(w,'all');assert(!w.PPMSMatrixReport.snapshot().title.includes(' — '));
  await nav(w,'search');assert.equal(w.getAppHealth().employees,employees.length);
  await nav(w,'lineOrganization');await select(w,divisions[0],'โรง 2');assert.equal(api.selection(),'all');assert.deepEqual(ids(w),['P2']);
  await select(w,divisions[1]);assert(!w.document.querySelector('.production-lines-chart'));assert(!w.document.querySelector('.page-error'));
  await select(w,divisions[0],'โรง 1');
  console.log('PASS dedicated line page, member-only matrices, scoped section choices, bulk skill roster, filtered A4/XLSX reports, live reassignment, empty lines and plant/division isolation');
  w.sessionStorage.removeItem('ppms_admin');assert.throws(()=>api.saveAssignments({['employees/'+api.personKey('U')]:'3'},scope));assert(!api.controlsMarkup(scope).includes('data-org-line-settings'));
  assert.deepEqual(run.errors,[],run.errors.join('\n'));console.log('PASS line/section assignments, split sections, shared staff, counts, PDF context, Excel, scope isolation, unrelated pages, translations, queued retry, inherited assignments and write permissions');
 }finally{w.close()}
 const standalone=await setup('factory-organization.html');try{
  const {w}=standalone,api=w.PPMSProductionLines,scope={division:divisions[0],plant:'โรง 1'};
  api.saveAssignments({'lines/7':{name:'Line Seven'},['sections/'+api.sectionKey('Stamping Section')]:'1',['employees/'+api.personKey('S2')]:'2'},scope);await wait(80);await line(w,'2');assert.deepEqual(ids(w),['M','S2']);assert(w.document.querySelector('header h1').textContent.endsWith('ไลน์ 2'));assert.equal(w.PPMSOrgPoster.context().counts.total,2);w.document.querySelector('[data-org-line-view]').click();await wait(80);assert(w.document.querySelector('.production-lines-chart'));await line(w,'all');assert(w.document.querySelector('[data-production-line=\"7\"]'));assert.equal(w.PPMSOrgPoster.context().counts.total,7);assert.deepEqual(standalone.errors,[]);console.log('PASS standalone factory line selector, split assignment, title and print summary');
 }finally{standalone.w.close()}
 // Sorting's original skill groups remain separate within each line.
 employees.push(employee('SORT1',divisions[0],'โรง 1','Sorting 1'),employee('SORT2',divisions[0],'โรง 1','Sorting 2'));
 const fallback=await setup('404.html');try{
  const {w}=fallback,api=w.PPMSProductionLines,sc={division:divisions[0],plant:'โรง 1'};
  api.saveAssignments({['employees/'+api.personKey('SORT1')]:'1',['employees/'+api.personKey('SORT2')]:'2'},sc);await wait(80);
  w.PPMSLineBoard.setMode('report');await nav(w,'lineOrganization');w.document.querySelector('[data-production-line="1"] [data-line-matrix]').click();await wait(100);
  assert.equal(w.document.querySelector('#matrixSortingGroup').value,'Sorting 1');assert.deepEqual(Array.from(w.PPMSMatrixReport.snapshot().rows,r=>r.id),['SORT1']);
  await line(w,'2');assert.equal(w.document.querySelector('#matrixSortingGroup').value,'Sorting 2');assert.deepEqual(Array.from(w.PPMSMatrixReport.snapshot().rows,r=>r.id),['SORT2']);
  assert(w.document.querySelector('#nav [data-page="lineOrganization"]').textContent.includes('ผังองค์กรตามไลน์'));
  w.PPMSLanguage.setLanguage('en');await wait(80);assert.equal(w.document.querySelector('#nav [data-page="lineOrganization"]').textContent,'Line Organization');
  assert.deepEqual(fallback.errors,[]);console.log('PASS 404 entry point, original Sorting skill groups, automatic group selection by line and bilingual navigation');
 }finally{fallback.w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

module.exports={setup,nav,select,line,employees,divisions,employee};
