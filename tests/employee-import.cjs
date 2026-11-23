const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const JSZip=require(process.env.JSZIP_MODULE||'jszip');
const code=fs.readFileSync('employee-import-v978.js','utf8'),service=fs.readFileSync('employee-delete-v823.js','utf8');
function model(){const w={addEventListener(){},JSZip};const c={window:w,document:{getElementById(){return null},body:{}},MutationObserver:class{observe(){}},requestAnimationFrame(){},File,Uint8Array,console,Date,URL,Blob};vm.createContext(c);vm.runInContext(code,c);return w.PPMSEmployeeImport}
const api=model(),scope={division:'Production Division',plant:'โรง 1'},section='Warehouse Support Production Section';
const row=(id='T1')=>({id,name:'TEST '+id,position:'Operator',startDate:'2026-01-01',contractType:'Permanent',photoData:'data:image/png;base64,YQ=='});
const batch=(rows=[row()])=>api.validateBatch({key:'EMPIMPORT-test-00000001',scope,section,employees:rows});
function setup(initial,{conflict,failAfterSave=false,permission='edit',signedIn=true}={}){
 const data=structuredClone(initial),versions={},writes=[];let raced=false,lost=false;
 const c={window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://example.test'},sessionStorage:{getItem(){return signedIn?'1':null}},PPMSAccess:{permission(){return permission}},PPMSEmployeeImport:api,addEventListener(){}},navigator:{onLine:true},AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async(url,options={})=>{
  const path=new URL(url).pathname.slice(1,-5);let status=200;
  if(options.method==='PUT'){
   assert.equal(options.headers['if-match'],String(versions[path]||0));
   if(conflict&&!raced&&path==='ppms/employees'){raced=true;data[path]=conflict(structuredClone(data[path]));versions[path]=(versions[path]||0)+1;status=412}
   else{data[path]=JSON.parse(options.body);versions[path]=(versions[path]||0)+1;writes.push(path);if(failAfterSave&&!lost){lost=true;throw Error('connection lost after write')}}
  }
  const value=structuredClone(data[path]??null);return {ok:status===200,status,headers:{get(){return String(versions[path]||0)}},json:async()=>value};
 }};
 vm.createContext(c);vm.runInContext(service,c);return {data,writes,save:b=>c.window.PPMS_EMPLOYEE_SAVE_SERVICE.importNewEmployees(b)};
}
(async()=>{
 const parsed=api.parseCSV('\ufeffemployee_id,name,position\r\nT1,"NAME, ONE","A ""B"""\r\n');assert.equal(parsed[0].name,'NAME, ONE');assert.equal(parsed[0].position,'A "B"');
 assert.throws(()=>api.parseCSV('id,id\n1,2'),/คอลัมน์/);assert.throws(()=>api.parseCSV('id,name\n1,"oops'),/คำพูด/);
 for(const invalid of [{id:''},{startDate:'2026-02-30'},{contractType:''},{position:''},{photoData:'javascript:bad'},{id:'__proto__'}])assert.throws(()=>batch([{...row(),...invalid}]));
 assert.throws(()=>batch([row('abc'),row('ABC')]),/ซ้ำ/);
 const gaps=api.reviewRows([{name:'Aree'},{...row('T2'),startDate:''}]);
 assert.equal(gaps.filter(x=>x.field==='id').length,1);assert.equal(gaps.filter(x=>x.field==='startDate').length,2);assert(gaps.some(x=>x.row===0&&x.field==='contractType'));
 assert.equal(api.reviewRows([row('T1')],[{id:'t1'}])[0].field,'id');
 assert.equal(api.reviewRows([row('T1')]).length,0);
 const clean=batch([{...row(),skillLevels:{Safety:5},organizationPlant:'โรง 3',certifications:[{}]}]).employees[0];assert(!('skillLevels'in clean));assert.equal(clean.organizationPlant,'โรง 1');assert(!('certifications'in clean));
 const zip=new JSZip();zip.file('employees.csv','employee_id,name_from_source,photo_file\r\nT1,Aree,photos/a.png\r\n');zip.file('photos/a.png',new Uint8Array([1,2,3]));
 const file={name:'people.zip',size:200,arrayBuffer:async()=>zip.generateAsync({type:'arraybuffer'})};let converted=0;const rows=await api.readFile(file,async photo=>{assert.equal(photo.name,'a.png');converted++;return 'data:image/png;base64,YQ=='});assert.equal(rows.length,1);assert.equal(rows[0].name,'Aree');assert.equal(converted,1);
 const missing=new JSZip();missing.file('employees.csv','id,name,photo_file\n1,Test,photos/missing.png');await assert.rejects(api.readFile({name:'x.zip',size:100,arrayBuffer:async()=>missing.generateAsync({type:'arraybuffer'})},async()=>''),/ไม่พบรูป/);
 const traversal=new JSZip();traversal.file('../outside.csv','id,name\n1,Test');await assert.rejects(api.readFile({name:'x.zip',size:100,arrayBuffer:async()=>traversal.generateAsync({type:'arraybuffer'})},async()=>''),/ไม่ปลอดภัย/);
 const old={id:'OLD',name:'EXISTING',photoData:'UNCHANGED',skills:{A:5},certifications:[{id:'C'}]},initial={'ppms/employees':[old,null],'ppms/deletedEmployeeIds':['GONE'],'ppms/training':[{id:'HISTORY'}]};
 let s=setup(initial);const b=batch([row('T1'),row('T2')]);let result=await s.save(b);assert.equal(result.importedIds.length,2);assert.deepEqual(s.data['ppms/employees'][0],old);assert.equal(s.data['ppms/employees'][1],null);assert.deepEqual(s.data['ppms/training'],initial['ppms/training']);assert.deepEqual(s.data['ppms/deletedEmployeeIds'],['GONE']);assert.deepEqual(s.writes,['ppms/employees']);
 await s.save(b);assert.equal(s.writes.length,1,'Retry must not duplicate employees or write old profiles');
 s=setup(initial,{conflict:roster=>[...roster,{id:'OTHER',name:'CONCURRENT'}]});await s.save(b);assert(s.data['ppms/employees'].some(e=>e?.id==='OTHER'));
 s=setup(initial,{conflict:roster=>[...roster,{id:'T2',name:'CONCURRENT'}]});await assert.rejects(s.save(b),/มีอยู่แล้ว/);assert(!s.data['ppms/employees'].some(e=>e?.id==='T1'),'Concurrent duplicate must cancel the entire batch');assert.equal(s.writes.length,0);
 s=setup(initial,{failAfterSave:true});await assert.rejects(s.save(b),/connection/);await s.save(b);assert.equal(s.data['ppms/employees'].filter(e=>e?.id==='T1').length,1,'Lost acknowledgements can safely resume');
 s.data['ppms/employees'].find(e=>e?.id==='T1').photoData='CONCURRENT PHOTO';await assert.rejects(s.save(b),/รูปของ/);assert.equal(s.data['ppms/employees'].find(e=>e?.id==='T1').photoData,'CONCURRENT PHOTO','Retry must never overwrite a later photo change');
 s=setup(initial);await assert.rejects(s.save(batch([row('old'),row('T2')])),/มีอยู่แล้ว/);assert.equal(s.writes.length,0);
 s=setup(initial);await assert.rejects(s.save(batch([row('gone')])),/ประวัติการลบ/);assert.equal(s.writes.length,0);
 s=setup({...initial,'employeeOrganization/T1':{division:'Quality Division',plant:'รวม'}});await assert.rejects(s.save(b),/ฝ่ายหรือโรงงานเดิม/);assert.equal(s.writes.length,0);
 s=setup({'ppms/employees':{keep:old},'ppms/deletedEmployeeIds':[]});await s.save(b);assert.deepEqual(s.data['ppms/employees'].keep,old);assert(s.data['ppms/employees'].T1);
 for(const options of [{permission:'view'},{signedIn:false}]){s=setup(initial,options);await assert.rejects(s.save(b),/สิทธิ์/);assert.equal(s.writes.length,0)}
 const app=fs.readFileSync('app-v588.js','utf8'),methods=app.slice(app.indexOf(' employeeImportContext(){'),app.indexOf(' refreshQuarterlyExamPage(){'));
 let calls=0,allowed=false;const c={window:{PPMSAccess:{permission:()=>allowed?'edit':'view'},PPMSOrganizationScope:{},PPMSEmployeeImport:api,PPMS_EMPLOYEE_SAVE_SERVICE:{importNewEmployees:async()=>{calls++;return {employees:b.employees,deletedEmployeeIds:[],importedIds:['T1','T2']}}}},isAdmin:true,current:"section",sessionStorage:{getItem:key=>key==='ppms_admin'?'1':section},organizationScope:()=>scope,sections:[section],organizationRenderMaster:null,employees:[],deletedEmployeeIds:new Set(),organizationScopedEmployees:x=>x,navigator:{onLine:true},cloudWritePending:false,pendingEmployeeSaves:{},pendingEmployeeDeletes:new Set(),employeeMasterWriteRevision:0,clearTimeout(){},cloudTimer:0,firebaseEncodeData:x=>x,firebaseDecodeData:x=>x,applySkillOverrides:x=>x,withPendingEmployeeSaves:x=>x,cloudEmployeeList:x=>x.employees,persistCloudToLocal(){},Event:class{},queueRemoteRender(){},flushPendingRemoteSnapshot(){}};c.window.dispatchEvent=()=>{};
 vm.createContext(c);vm.runInContext('globalThis.runtime={'+methods+'};',c);
 await assert.rejects(c.runtime.importEmployeeBatch(b),/สิทธิ์/);assert.equal(calls,0);allowed=true;
 await assert.rejects(c.runtime.importEmployeeBatch({...b,scope:{...scope,plant:'โรง 2'}}),/เปลี่ยน/);assert.equal(calls,0);
 c.pendingEmployeeSaves={other:{}};await assert.rejects(c.runtime.importEmployeeBatch(b),/รอซิงก์/);c.pendingEmployeeSaves={};
 await c.runtime.importEmployeeBatch(b);assert.equal(calls,1);assert.equal(c.employees.length,2);assert.equal(c.cloudWritePending,false);
 for(const page of ['index.html','404.html']){const html=fs.readFileSync(page,'utf8');assert(html.includes('employee-import-v978.js?v=979'));assert(html.includes('employee-delete-v823.js?v=978'));assert(html.includes('app-v588.js?v=978'))}
 console.log('Employee import checks passed: ZIP/photos, validation, scope, permissions, duplicate/concurrent guards, safe retry and existing data preservation.');
})().catch(e=>{console.error(e);process.exitCode=1});
