const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('employee-delete-v823.js','utf8');
async function setup(roster,conflict){
 const db={employees:structuredClone(roster),deletedEmployeeIds:[]};let revision=1,conflicted=false;
 const ctx={window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://synthetic.test'},addEventListener(){}},navigator:{onLine:true},AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async(url,options={})=>{
  const path=new URL(url).pathname.replace('/ppms/','').replace('.json','');assert(['employees','deletedEmployeeIds'].includes(path));
  if(options.method==='PUT'){
   if(conflict&&!conflicted){conflicted=true;conflict(db);revision++;return response(412,db[path])}
   assert.equal(options.headers['if-match'],String(revision));db[path]=JSON.parse(options.body);revision++;
  }
  return response(200,db[path]);
  function response(status,value){return {ok:status===200,status,headers:{get:()=>String(revision)},json:async()=>structuredClone(value)}}
 }};vm.createContext(ctx);vm.runInContext(source,ctx);return {db,service:ctx.window.PPMS_EMPLOYEE_SAVE_SERVICE};
}
const employee={id:'E1',name:'KEEP NAME',section:'Welding Section',skillLevels:{Safety:4},photoData:'KEEP PHOTO',organizationDivision:'Production Division'},record={id:'C1',course:'CQI-15',status:'certified',date:'2026-09-01',updatedAt:'r1'};
(async()=>{
 let s=await setup([employee,{id:'OTHER',name:'KEEP OTHER'}],db=>{db.employees[0].name='CONCURRENT NAME';db.employees[0].certifications=[{id:'C2',course:'Other course',updatedAt:'other'}]});
 await s.service.saveCertificate('E1',record);
 let saved=s.db.employees[0];assert.equal(saved.name,'CONCURRENT NAME');assert.equal(saved.photoData,employee.photoData);assert.deepEqual(saved.skillLevels,employee.skillLevels);assert.equal(saved.certifications.length,2);assert.equal(s.db.employees[1].name,'KEEP OTHER');
 await s.service.saveCertificate('E1',record);assert.equal(s.db.employees[0].certifications.length,2,'Retries do not duplicate courses');
 await s.service.upsert({...employee,name:'EDITED PROFILE',updatedAt:'profile'},'E1');assert.equal(s.db.employees.at(-1).certifications.length,2,'Profile edits preserve the latest certificates');
 const edited={...record,provider:'Updated provider',updatedAt:'r2'};await s.service.saveCertificate('E1',edited,'r1');assert.equal(s.db.employees.at(-1).certifications.find(r=>r.id==='C1').provider,'Updated provider');
 await assert.rejects(s.service.saveCertificate('E1',{...record,updatedAt:'stale'},'r1'),e=>e.code==='certificate-conflict');assert.equal(s.db.employees.at(-1).certifications.find(r=>r.id==='C1').updatedAt,'r2');
 s=await setup({employee});await s.service.saveCertificate('E1',record);assert.equal(s.db.employees.employee.certifications[0].course,'CQI-15','Keyed rosters are supported');
 s.db.deletedEmployeeIds=['E1'];await assert.rejects(s.service.saveCertificate('E1',{...record,id:'C3'}),e=>e.code==='employee-missing');
 s=await setup([]);await assert.rejects(s.service.saveCertificate('E1',record),e=>e.code==='employee-missing');assert.equal(s.db.employees.length,0);
 s=await setup([employee,{...employee,id:'E2',name:'SECOND'},{id:'OTHER',name:'UNSELECTED'}],db=>{db.employees[1].photoData='LATEST PHOTO'});
 const changes=['E1','E2'].map(employeeId=>({employeeId,record:{...record,id:'BATCH-'+employeeId,certificateNumber:employeeId},expectedUpdatedAt:''}));
 await s.service.saveCertificates(changes);assert.equal(s.db.employees[0].certifications[0].certificateNumber,'E1');assert.equal(s.db.employees[1].certifications[0].certificateNumber,'E2');assert.equal(s.db.employees[1].photoData,'LATEST PHOTO');assert.equal(s.db.employees[2].certifications,undefined);
 await s.service.saveCertificates(changes);assert.equal(s.db.employees[0].certifications.length,1,'Whole-batch retry is idempotent');
 const before=structuredClone(s.db.employees);await assert.rejects(s.service.saveCertificates([{employeeId:'E1',record:{...record,id:'NEW'}},{employeeId:'MISSING',record}]),e=>e.code==='employee-missing');assert.deepEqual(s.db.employees,before,'Invalid recipient prevents a partial batch commit');
 await assert.rejects(s.service.saveCertificates([{employeeId:'E1',record:{...record,id:'NEW'}},{employeeId:'E2',record:{...record,id:'BATCH-E2',updatedAt:'stale'},expectedUpdatedAt:'wrong'}]),e=>e.code==='certificate-conflict');assert.deepEqual(s.db.employees,before,'Conflicting recipient prevents a partial batch commit');
 console.log('PASS certificate CAS retries, concurrent course and profile preservation, idempotence, stale-edit conflict, keyed rosters and deletion guards.');
})().catch(e=>{console.error(e);process.exitCode=1});
