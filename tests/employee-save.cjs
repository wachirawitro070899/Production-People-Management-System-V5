const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('employee-delete-v823.js','utf8');
async function scenario(initial,conflict=false){
 const db=structuredClone(initial),paths=[];let etag=0,conflicted=false;
 const ctx={window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://example.test'},addEventListener(){}},navigator:{onLine:true},AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async(url,opts={})=>{
  const path=new URL(url).pathname.replace('/ppms/','').replace('.json','');paths.push(path);
  if(opts.method==='PUT'){
   if(conflict&&!conflicted&&path==='employees'){conflicted=true;db.employees.push({id:'concurrent',name:'OTHER'});if(conflict.changes)Object.assign(db.employees[0],conflict.changes);etag++;return response(412,db[path])}
   assert.equal(opts.headers['if-match'],String(etag));db[path]=JSON.parse(opts.body);etag++;
  }
  return response(200,db[path]??null);
  function response(status,value){return {ok:status===200,status,headers:{get(){return String(etag)}},json:async()=>structuredClone(value)}}
 }};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {service:ctx.window.PPMS_EMPLOYEE_SAVE_SERVICE,db,paths};
}
(async()=>{
 let s=await scenario({employees:[{id:'1',name:'FIRST'}],deletedEmployeeIds:['gone']},true);
 await s.service.upsert({id:'2',name:'NEW',updatedAt:'r1'});
 assert.deepEqual(s.db.employees.map(e=>e.id),['1','concurrent','2']);assert(!s.paths.includes(''));assert.deepEqual(s.db.deletedEmployeeIds,['gone']);
 s=await scenario({employees:{a:{id:'1'},b:{id:'3'}},deletedEmployeeIds:[]});
 await s.service.upsert({id:'2',updatedAt:'r2'},'1');assert.deepEqual(Object.values(s.db.employees).map(e=>e.id).sort(),['2','3']);assert.deepEqual(s.db.deletedEmployeeIds,['1']);
 s=await scenario({employees:[],deletedEmployeeIds:['2']});await assert.rejects(s.service.upsert({id:'2',updatedAt:'r'},'2'));assert.equal(s.db.employees.length,0);
 await s.service.upsert({id:'2',updatedAt:'r'});assert.deepEqual(s.db.deletedEmployeeIds,[]);
 const app=fs.readFileSync('app-v588.js','utf8'),start=app.indexOf('function persistPendingEmployeeSaves()'),end=app.indexOf('function loadArray(',start);
 const store=new Map(),ctx={pendingEmployeeSaves:{},pendingEmployeeDeletes:new Set(),deletedEmployeeIds:new Set(),employeeMasterWriteRevision:0,KEY:'employees',EMPLOYEE_SAVE_PENDING_KEY:'pending',localStorage:{setItem(k,v){store.set(k,v)},getItem(k){return store.get(k)??null}},applySkillOverrides:x=>x,isEmployeeRecord:e=>e&&e.id!=null};
 vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);
 ctx.queueEmployeeSave({id:'new',updatedAt:'r'},'');assert.equal(ctx.withPendingEmployeeSaves([],[])[0].id,'new');assert.equal(ctx.loadEmployees()[0].id,'new');
 ctx.pendingEmployeeSaves=JSON.parse(store.get('pending'));assert.equal(ctx.loadEmployees()[0].id,'new');
 ctx.pendingEmployeeDeletes.add('new');assert.equal(ctx.withPendingEmployeeSaves([],[]).length,0);
 ctx.pendingEmployeeDeletes.clear();ctx.queueEmployeeSave({id:'edited'},'edited');assert(!ctx.withPendingEmployeeSaves([],['edited']).some(e=>e.id==='edited'));
 ctx.queueEmployeeSave({id:'renamed'},'old');assert(!ctx.withPendingEmployeeSaves([{id:'old'}],[]).some(e=>e.id==='old'));
 s=await scenario({employees:[{id:'1',name:'CURRENT',photoData:'CURRENT PHOTO',section:'Stamping Section',position:'Operator',skillLevels:{Safety:5},stampingShift:'Team A'}],deletedEmployeeIds:['gone']},{changes:{name:'CONCURRENT EDIT',photoData:'NEW PHOTO'}});
 await s.service.upsert({id:'1',name:'STALE',photoData:'STALE',section:'Wrong Section',stampingShift:'Team B',updatedAt:'team-r'},'1',{patchFields:['stampingShift','updatedAt'],expectedSection:'Stamping Section'});
 const team=s.db.employees.find(e=>e.id==='1');assert.equal(team.stampingShift,'Team B');assert.equal(team.section,'Stamping Section');assert.equal(team.position,'Operator');assert.equal(team.name,'CONCURRENT EDIT');assert.equal(team.photoData,'NEW PHOTO');assert.equal(team.skillLevels.Safety,5);assert.deepEqual(s.db.deletedEmployeeIds,['gone']);
 await assert.rejects(s.service.upsert({id:'1',stampingShift:'Team A',updatedAt:'r2'},'1',{patchFields:['stampingShift','updatedAt'],expectedSection:'Welding Section'}),/แผนกพนักงานเปลี่ยน/);assert.equal(team.stampingShift,'Team B');
 s=await scenario({employees:[],deletedEmployeeIds:[]});await assert.rejects(s.service.upsert({id:'gone',stampingShift:'Team A',updatedAt:'r'},'gone',{patchFields:['stampingShift','updatedAt'],expectedSection:'Stamping Section'}),/พนักงานถูกลบ/);assert.deepEqual(s.db.employees,[]);
 s=await scenario({employees:[{id:'sorting',section:'Sorting Section',sortingGroup:'Sorting 1',organizationTeam:'Team A'}],deletedEmployeeIds:[]},{changes:{sortingGroup:'Sorting 2'}});await assert.rejects(s.service.upsert({id:'sorting',organizationTeam:'Team B',updatedAt:'r'},'sorting',{patchFields:['organizationTeam','updatedAt'],expectedSection:'Sorting Section',expectedSortingGroup:'Sorting 1'}),/กลุ่ม Sorting/);assert.equal(s.db.employees[0].sortingGroup,'Sorting 2');assert.equal(s.db.employees[0].organizationTeam,'Team A','Concurrent Sorting changes cancel the stale team move');
 ctx.queueEmployeeSave({id:'sorting',organizationTeam:'Team B',updatedAt:'r'},'sorting',{patchFields:['organizationTeam','updatedAt'],expectedSection:'Sorting Section',expectedSortingGroup:'Sorting 1'});assert.equal(ctx.pendingEmployeeSaves.sorting.expectedSortingGroup,'Sorting 1');assert.equal(ctx.withPendingEmployeeSaves([{id:'sorting',section:'Sorting Section',sortingGroup:'Sorting 2',organizationTeam:'Team A'}],[]).find(e=>e.id==='sorting').organizationTeam,'Team A');
 // Bulk assessments patch only selected topics against the latest conditional read.
 const fields=['skillLevels','currentSkillLevel','skillUpdatedAt','skillRevisionAt','skillQuarter','skillEvaluator','skillHistory','updatedAt'];
 const bulk={id:'bulk',updatedAt:'bulk-r',skillLevels:{Safety:4,Quality:1},currentSkillLevel:4,skillUpdatedAt:'2026-10-24',skillRevisionAt:'2026-10-24',skillQuarter:'Q4',skillEvaluator:'QA',skillHistory:[{source:'Admin Bulk Skill Update',batchId:'batch-1',before:{Safety:1,Quality:1},after:{Safety:4,Quality:1},selectedSkills:['Safety'],changed:['Safety'],createdAt:'2026-10-24'}]};
 s=await scenario({employees:[{id:'bulk',name:'KEEP',section:'Welding Section',photoData:'PHOTO',skillLevels:{Safety:2,Quality:3},skillHistory:[{batchId:'older'}]},{id:'other',name:'OTHER'}],deletedEmployeeIds:[]},{changes:{name:'CONCURRENT',skillLevels:{Safety:3,Quality:5}}});
 await s.service.upsert(bulk,'bulk',{patchFields:fields,expectedSection:'Welding Section'});
 let result=s.db.employees.find(e=>e.id==='bulk');assert.equal(result.name,'CONCURRENT');assert.equal(result.photoData,'PHOTO');assert.equal(result.skillLevels.Safety,4);assert.equal(result.skillLevels.Quality,5);assert.equal(result.skillHistory[0].before.Safety,3);assert.equal(result.skillHistory[0].before.Quality,5);assert.equal(result.skillHistory.length,2);assert.equal(s.db.employees.find(e=>e.id==='other').name,'OTHER');
 result.updatedAt='newer';result.skillLevels.Quality=2;
 await s.service.upsert(bulk,'bulk',{patchFields:fields,expectedSection:'Welding Section'});result=s.db.employees.find(e=>e.id==='bulk');assert.equal(result.skillHistory.length,2,'Retry is idempotent');assert.equal(result.updatedAt,'newer');assert.equal(result.skillLevels.Quality,2,'Retry preserves a later assessment');
 const encoded='__ppmskey__Drawing%20%2F%20Specification';bulk.skillHistory[0]={source:'Admin Bulk Skill Update',batchId:'batch-2',before:{[encoded]:1},after:{[encoded]:5},selectedSkills:['Drawing / Specification']};
 await s.service.upsert(bulk,'bulk',{patchFields:fields,expectedSection:'Welding Section'});result=s.db.employees.find(e=>e.id==='bulk');assert.equal(result.skillLevels[encoded],5);assert.equal(result.skillLevels.Safety,4);assert.equal(result.skillHistory.length,3);
 // An explicit transfer updates the employee and the scope index, retaining index metadata.
 s=await scenario({employees:[{id:'move',name:'KEEP',section:'Warehouse Section',organizationDivision:'Warehouse Division',organizationPlant:'รวม'}],deletedEmployeeIds:[],'/employeeOrganization/move':{division:'Warehouse Division',plant:'รวม',note:'KEEP'}});
 const moved={id:'move',name:'KEEP',section:'Stamping Section',organizationDivision:'Production Division',organizationPlant:'โรง 2',updatedAt:'transfer-r'};
 const transfer=await s.service.upsert(moved,'move',{organizationScopeUpdate:true});assert.equal(transfer.organizationScope.division,'Production Division');assert.deepEqual(s.db['/employeeOrganization/move'],{division:'Production Division',plant:'โรง 2',note:'KEEP'});assert.equal(s.db.employees[0].section,'Stamping Section');
 await assert.rejects(s.service.upsert({...moved,organizationPlant:''},'move',{organizationScopeUpdate:true}),/เลือกฝ่ายและโรงงาน/);assert.equal(s.db.employees[0].organizationPlant,'โรง 2','Invalid transfer does not write the employee');
 console.log('Passed: explicit division transfers persist both employee and scope index; invalid transfers leave the saved employee untouched.');
 console.log('Passed: bulk conditional writes preserve concurrent profiles/unselected skills/history, retry idempotently, and handle encoded topic names.');
 console.log('Passed: employee saves, durable pending state, deletion guards, and team patches preserve concurrent names/photos/skills, original departments, tombstones and other employees.');
})().catch(err=>{console.error(err);process.exitCode=1});
