const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app-v588.js','utf8');let jobs=new Map(),next=0,busy=false,renders=[],events=0;
const ctx={current:'dashboard',remoteRenderQueued:false,remoteRenderTimer:null,setTimeout(fn){jobs.set(++next,fn);return next},clearTimeout(id){jobs.delete(id)},uiInteractionBusy:()=>busy,renderCore(){renders.push(ctx.employees.map(e=>e.id))},employees:[{id:'old'}],organizationRenderMaster:null,employeeMasterWriteRevision:0,cloudWritePending:false,pendingEmployeeDeletes:new Set(),pendingEmployeeSaves:{},deletedEmployeeIds:new Set(),firebaseDecodeData:x=>x,cloudEmployeeList:v=>v.employees,applySkillOverrides:x=>x,withPendingEmployeeSaves:x=>x,persistDeletedIds(){},persistCloudToLocal(){},window:{dispatchEvent(){events++}},Event:class{}};
vm.createContext(ctx);
let a=app.indexOf('function pageAllowsLiveRemoteRender()'),b=app.indexOf('\n',a);vm.runInContext(app.slice(a,b),ctx);
a=app.indexOf('function queueRemoteRender()');b=app.indexOf('function flushRemoteRender',a);vm.runInContext(app.slice(a,b),ctx);
a=app.indexOf(' applyEmployeeRosterSnapshot(value,revision){');b=app.indexOf(' applyEmployeeDeletionSnapshot',a);vm.runInContext('this.runtime={'+app.slice(a,b)+'};',ctx);
function tick(){const f=[...jobs.values()];jobs.clear();f.forEach(fn=>fn())}
ctx.runtime.applyEmployeeRosterSnapshot({employees:[{id:'old'},{id:'leader-new',createdByLeader:'L'}],deletedEmployeeIds:[]},0);
assert.equal(renders.length,0);tick();assert.deepEqual(renders,[['old','leader-new']]);assert.equal(events,1);
busy=true;ctx.runtime.applyEmployeeRosterSnapshot({employees:[{id:'leader-new'}],deletedEmployeeIds:['old']},0);tick();assert.equal(renders.length,1);assert.equal(jobs.size,1);busy=false;tick();assert.deepEqual(renders[1],['leader-new']);
ctx.current='exam';ctx.queueRemoteRender();assert.equal(jobs.size,0);ctx.current='add';ctx.queueRemoteRender();assert.equal(jobs.size,0);ctx.current='search';ctx.queueRemoteRender();tick();assert.equal(renders.length,3);
ctx.runtime.applyEmployeeRosterSnapshot({employees:[],deletedEmployeeIds:[]},-1);assert.equal(ctx.employees.length,1);
console.log('Passed: confirmed Leader employee appears without manual navigation, deletions update visible cards, active input defers then resumes, exam/add forms protected, stale roster read ignored.');
