const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/section-offline-save.cjs','utf8').split('(async()=>{')[0];
const {setup,fixture}=new Function('require',prefix+'\nreturn {setup,fixture};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const scope='Production Division::โรง 1',other='Production Division::โรง 2',name='Delete Empty Section';
fixture.master.sectionMap[scope].push(name);fixture.master.sectionMap[other].push(name);fixture.master.sections.push(name);fixture.master.sectionPositions={[scope+'::'+name]:['Empty Role']};
const response=(status,value,etag)=>({ok:status>=200&&status<300,status,headers:{get:key=>key.toLowerCase()==='etag'?etag:null},json:async()=>structuredClone(value)});
async function state(options={}){
 const seed=options.pending?{ppms_organization_section_outbox_v872:JSON.stringify([{id:'pending-empty',division:'Production Division',plant:'โรง 1',name,createdAt:'2026-10-20'}])}:{};
 const result=await setup(seed,false),{w}=result;w.firebase=undefined;w.confirm=()=>options.confirm!==false;Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});
 let server=structuredClone(fixture.master),people=structuredClone(fixture.employees),version=1,puts=0,conflict=options.conflict;
 w.fetch=async(url,request={})=>{
  const path=String(url).replace('https://database.test/','').replace('.json','');
  if(options.failRead&&path==='ppms/employees')throw Error('network unavailable');
  if(path==='ppms/employees')return response(200,people);
  if(path==='employeeOrganization'||path==='ppms/deletedEmployeeIds')return response(200,null);
  assert.equal(path,'settings/organizationMaster');
  if(request.method!=='PUT')return response(200,server,'"v'+version+'"');
  puts++;assert.equal(request.headers['if-match'],'"v'+version+'"');
  if(conflict){conflict=false;server.unknownSetting={keep:true};server.sectionMap[scope].push('Concurrent Section');version++;return response(412,server)}
  server=JSON.parse(request.body);version++;return response(200,server);
 };
 return {...result,server:()=>server,puts:()=>puts,setPeople:value=>{people=value}};
}
async function remove(w,target){w.document.querySelector('[data-delete-section-picker]').click();const dialog=w.document.querySelector('#deleteSectionDialog');dialog.querySelector('select').value=target;assert.equal(dialog.querySelector('select').value,target);const button=dialog.querySelector('[data-delete-confirm]');button.click();for(let i=0;i<40&&button.disabled;i++)await wait(5);assert(!button.disabled,'Delete request completes and unlocks its button');return button}
(async()=>{
 let s=await state({conflict:true,pending:true});
 try{
  const original=s.w.localStorage.getItem('ppms_v3_employees');await remove(s.w,name);assert(s.alerts.at(-1).includes('เรียบร้อย'));
  assert.equal(s.puts(),2);assert(!s.server().sectionMap[scope].includes(name));assert(s.server().sectionMap[other].includes(name));assert(s.server().sections.includes(name));assert(s.server().sectionMap[scope].includes('Concurrent Section'));assert(s.server().unknownSetting.keep);assert(!s.server().sectionPositions?.[scope+'::'+name]);assert(s.server().removedSections[scope].includes(name));
  assert.equal(s.w.localStorage.getItem('ppms_v3_employees'),original);assert.equal(s.w.PPMSOrganizationManager.pendingSections().length,0);assert.equal(s.sdkWrites.length,0);assert.deepEqual(s.errors,[]);
 }finally{s.dom.window.close()}
 for(const target of ['Support Production','Sorting 1']){s=await state();try{await remove(s.w,target);assert(s.alerts.at(-1).includes('1 คน'),'Count aliases and legacy numbered Sorting members once');assert.equal(s.puts(),0);assert(s.server().sectionMap[scope].includes(target));assert.deepEqual(s.errors,[])}finally{s.dom.window.close()}}
 s=await state();try{s.w.localStorage.setItem('ppms_v3_pending_employee_saves',JSON.stringify({pending:{data:{id:'pending',name:'Pending Employee',section:name}}}));await remove(s.w,name);assert(s.alerts.at(-1).includes('1 คน'));assert.equal(s.puts(),0)}finally{s.dom.window.close()}
 s=await state();try{s.setPeople(fixture.employees.filter(e=>e.id!=='OP6'));await remove(s.w,'Sorting 2');assert(s.alerts.at(-1).includes('เรียบร้อย'),'Stale local rows do not block a Section emptied on the server');assert(s.server().sectionMap[scope].includes('Sorting 1'));assert(!s.server().sectionMap[scope].includes('Sorting 2'));assert.deepEqual(s.server().sectionMap[other],fixture.master.sectionMap[other])}finally{s.dom.window.close()}
 for(const options of [{confirm:false},{failRead:true}]){s=await state(options);try{await remove(s.w,name);assert.equal(s.puts(),0);assert(s.server().sectionMap[scope].includes(name));if(options.failRead)assert(s.alerts.at(-1).includes('ไม่สำเร็จ'))}finally{s.dom.window.close()}}
 // Check that legacy Sorting expansion respects an empty deleted subgroup.
 const source=fs.readFileSync('app-v588.js','utf8'),key=value=>String(value).toLowerCase().replace(/\s+section$/,'').replace(/\s/g,''),ctx={sections:['Sorting Section'],employees:[{id:'one',section:'Sorting Section',sortingGroup:'Sorting 1'}],organizationScope:()=>({division:'Production Division',plant:'โรง 1'}),organizationMaster:()=>({sectionMap:{[scope]:['Sorting 1']},removedSections:{[scope]:['Sorting 2']}}),organizationScopedEmployees:value=>value,sectionChartIsSorting:value=>/^sorting/i.test(value),sectionChartSortingName:value=>/^sorting\s*[12]$/i.test(value)?value:'',window:{PPMSOrganizationScope:{sectionKey:key},PPMSProductionHierarchy:{sectionKey:key,isSupervisor:()=>false}}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function sectionChartSectionHidden('),source.indexOf('function sectionChartEmployees(')),ctx);vm.runInContext(source.slice(source.indexOf('function orgSectionDescriptors('),source.indexOf('function orgEmployeesForDescriptor(')),ctx);
 ctx.sectionChartLevels=()=>'';ctx.sectionChartSortingGroup=e=>e.sortingGroup;ctx.esc=value=>value;vm.runInContext(source.slice(source.indexOf('function sectionChartCombinedMarkup('),source.indexOf('function sectionView(',source.indexOf('function sectionChartCombinedMarkup('))),ctx);assert(!ctx.sectionChartCombinedMarkup('Sorting Section',ctx.employees).includes('data-sorting-group="Sorting 2"'));
 assert.deepEqual(Array.from(ctx.sectionChartOptions()),['Sorting Section','Sorting 1']);assert.deepEqual(Array.from(ctx.orgSectionDescriptors(),item=>item.title),['Sorting 1']);
 console.log('Passed: Section delete works without the Firebase SDK, uses bounded REST/ETag retries, preserves concurrent settings and other plants, protects members/Sorting subgroups and pending employee saves, cancels a queued addition, ignores stale local rows, fails closed on cancellation/read failure, and deleted empty Sorting groups stay hidden.');
})().catch(error=>{console.error(error);process.exitCode=1});
