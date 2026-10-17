const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const moduleSource=fs.readFileSync('employee-resignations-v885.js','utf8'),serviceSource=fs.readFileSync('employee-delete-v823.js','utf8');
const employee={id:'EMP.1/#',name:'MR.TEST PERSON',thaiName:'นายทดสอบ ระบบ',section:'Tooling Maintenance Section',position:'Technician',contractType:'Permanent',startDate:'2020-01-01',photoData:'saved-photo',skillHistory:[{date:'2026-01-01'}],ngHistory:[{date:'2026-02-01'}]};
function ui(saved){const dom=new JSDOM('<html><head></head><body><main id="app"></main></body></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
 w.PPMS_RUNTIME={factoryLayoutIsAdmin:()=>true};w.PPMSLanguage={language:'th',translate:v=>v};w.PPMSOrganizationScope={employeeScope:()=>({division:'Production Division',plant:'รวม'}),contains:e=>e.organizationDivision==='Production Division'};
 if(saved)w.localStorage.setItem('ppms_resignation_history_v885',saved);w.eval(moduleSource);return {dom,w,api:w.PPMSResignations};}
function backend(initial){const db=structuredClone(initial),writes=[];let failPath='',lostPath='',conflict=false;
 const get=path=>path.split('/').reduce((v,key)=>v?.[key],db)??null;
 const put=(path,value)=>{const keys=path.split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||=( {} );parent[keys.at(-1)]=value};
 const ctx={window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://example.test'},addEventListener(){}},navigator:{onLine:true},AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async(url,options={})=>{
  const path=decodeURIComponent(new URL(url).pathname.replace('/ppms/','').replace(/\.json$/,''));
  if(path===failPath)throw Error('offline');
  if(options.method==='PUT'){
   if(conflict&&path==='employees'){conflict=false;db.employees.push({id:'CONCURRENT'});return response(412,get(path))}
   writes.push(path);put(path,JSON.parse(options.body));if(path===lostPath){lostPath='';throw Error('lost response')}
  }
  return response(200,get(path));
 }};function response(status,value){return {ok:status===200,status,headers:{get:()=> '"etag"'},json:async()=>structuredClone(value)}}
 vm.createContext(ctx);vm.runInContext(serviceSource,ctx);return {db,writes,service:ctx.window.PPMS_EMPLOYEE_DELETE_SERVICE,setFail:path=>failPath=path,setLost:path=>lostPath=path,setConflict:()=>conflict=true};}
(async()=>{
 let state=ui(),snapshot;
 try{
  snapshot=state.api.capture(employee,{training:[{employeeId:employee.id,title:'Training'}],evaluations:[{employeeId:employee.id,score:5}]},{resignationDate:'2026-10-17',resignationReason:'Personal reasons',resignationNote:'<script>bad</script>'});
  assert.equal(snapshot.employmentStatus,'resigned');assert.equal(snapshot.photoData,'saved-photo');assert.equal(state.api.pending(employee.id).resignationEventId,snapshot.resignationEventId);
  assert.equal(state.api.capture(employee).resignationEventId,snapshot.resignationEventId,'Retry keeps one stable event');
  const saved=state.w.localStorage.getItem('ppms_resignation_history_v885');const reload=ui(saved);try{assert.equal(reload.api.pending(employee.id).photoData,'saved-photo');assert.equal(reload.api.rows()[0]._pending,true)}finally{reload.dom.window.close()}
  state.w.document.getElementById('app').innerHTML=state.api.page();state.api.mount();assert(state.w.document.querySelector('[data-resignation-list]').textContent.includes(employee.thaiName));
  state.w.document.querySelector('[data-resignation-detail]').click();assert(state.w.document.getElementById('resignationDialog').textContent.includes('<script>bad</script>'));assert.equal(state.w.document.querySelectorAll('#resignationDialog script').length,0);
  state.w.document.querySelector('[data-resignation-close]').click();
  assert.throws(()=>state.api.capture({...employee,id:'invalid'},{},{resignationDate:'2026-02-30'}));assert.throws(()=>state.api.capture({...employee,id:'future'},{},{resignationDate:'2099-01-01'}));
  const original=state.w.localStorage.setItem.bind(state.w.localStorage);Object.getPrototypeOf(state.w.localStorage).setItem=()=>{throw Error('quota')};assert.throws(()=>state.api.capture({...employee,id:'quota'}),/quota/);assert.equal(state.api.pending('quota'),null,'Failed storage never leaves an unpersisted pending entry');Object.getPrototypeOf(state.w.localStorage).setItem=original;
 }finally{state.dom.window.close()}
 let s=backend({employees:[employee,{id:'KEEP'}],deletedEmployeeIds:[]});s.setConflict();
 const result=await s.service.remove(employee.id,snapshot);assert.deepEqual(s.db.employees.map(e=>e.id),['KEEP','CONCURRENT']);assert(s.db.deletedEmployeeIds.includes(employee.id));
 const archived=Object.values(s.db.formerEmployeeHistory)[0];assert.equal(archived.photoData,employee.photoData);assert.equal(archived.resignationDate,'2026-10-17');assert.equal(archived.employmentRecords.training.length,1);assert.equal(archived.skillHistory.length,1);assert.equal(archived.ngHistory.length,1);assert.equal(result.formerEmployee.resignationEventId,snapshot.resignationEventId);
 assert(s.writes.findIndex(p=>p.startsWith('formerEmployeeHistory/'))<s.writes.indexOf('deletedEmployeeIds'),'Archive is confirmed before publishing a tombstone');
 await s.service.remove(employee.id,snapshot);assert.equal(Object.keys(s.db.formerEmployeeHistory).length,1,'Retries after removal are idempotent');
 s=backend({employees:[employee],deletedEmployeeIds:[]});s.setFail('formerEmployeeHistory/'+snapshot.resignationEventId);await assert.rejects(s.service.remove(employee.id,snapshot));assert.equal(s.db.employees.length,1);assert.deepEqual(s.db.deletedEmployeeIds,[],'Archive failure never deletes the employee');
 s.setFail('');s.setLost('formerEmployeeHistory/'+snapshot.resignationEventId);await assert.rejects(s.service.remove(employee.id,snapshot));assert.equal(s.db.employees.length,1);await s.service.remove(employee.id,snapshot);assert.equal(Object.keys(s.db.formerEmployeeHistory).length,1,'Lost response retries do not create duplicate history');
 s=backend({employees:{one:employee,two:{id:'KEEP'}},deletedEmployeeIds:[]});await s.service.remove(employee.id,snapshot);assert.deepEqual(Object.values(s.db.employees).map(e=>e.id),['KEEP'],'Object-shaped rosters are supported');
 const rehire={...employee,name:'MR.REHIRED',startDate:'2026-10-17'};s.db.employees.new=rehire;s.db.deletedEmployeeIds=[];await s.service.remove(employee.id,{...snapshot,resignationEventId:'second-event',resignedAt:'2026-10-17T12:00:00Z'});assert.equal(Object.keys(s.db.formerEmployeeHistory).length,2,'Rehiring with the same ID preserves both resignation events');
 console.log('PASSED resignation snapshots, offline reload, dates, photos/skills/NG/training retention, escaped details, storage failure, archive-before-delete, archive denial, lost responses, conflicts, array/object rosters, retries and rehire history.');
})().catch(error=>{console.error(error);process.exitCode=1});
