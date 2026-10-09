const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('employee-delete-v823.js','utf8');
async function scenario(initial,conflict=false){
 const db=structuredClone(initial),paths=[];let etag=0,conflicted=false;
 const ctx={window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://example.test'},addEventListener(){}},navigator:{onLine:true},AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async(url,opts={})=>{
  const path=new URL(url).pathname.replace('/ppms/','').replace('.json','');paths.push(path);
  if(opts.method==='PUT'){
   if(conflict&&!conflicted&&path==='employees'){conflicted=true;db.employees.push({id:'concurrent',name:'OTHER'});etag++;return response(412,db[path])}
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
 console.log('Passed: small roster writes, concurrent add conflict, object roster, rename, deleted edit guard, deliberate re-add, durable pending saves, reload retention, delete cancellation.');
})().catch(err=>{console.error(err);process.exitCode=1});
