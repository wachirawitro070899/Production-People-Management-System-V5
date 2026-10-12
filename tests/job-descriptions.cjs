const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync('jd-manager-v837.js','utf8');
const store=new Map([
 ['ppms_organization_master_v1',JSON.stringify({plants:['โรง 1','โรง 2'],divisions:['Production Division','Quality Division'],sectionMap:{'Production Division::โรง 1':['Assembly Section'],'Quality Division::รวม':['Inspection Section']},positions:['Leader','Operator']})],
 ['ppms_v3_employees',JSON.stringify([{id:'A',section:'New Production Section'},{id:'B',section:'Quality Only Section'}])],
 ['ppms_employee_organization_v1',JSON.stringify({B:{division:'Quality Division',plant:'รวม'}})]
]);
const context={localStorage:{getItem:key=>store.get(key)||null},sessionStorage:{getItem:key=>key==='ppms_admin'?'1':null},crypto:webcrypto,TextEncoder,URL};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const CACHE='),source.indexOf('function installStyle('))+';this.api={recordKey,validateRecord,nextRevision,sectionList,employeeList,normalize,url,esc};',context);
const api=context.api,draft={employeeId:'A',employeeName:'พนักงาน A',division:'Production Division',plant:'โรง 1',section:'Assembly Section',position:'Operator',responsibilities:'1. ตรวจสอบเครื่องจักร\n2. ผลิตตาม WI',qualifications:'ผ่านการอบรม',documentUrl:'https://example.com/jd.pdf',updatedAt:'2026-10-12T03:00:00Z'};
(async()=>{
 const record=api.validateRecord(draft);assert(record.documentUrl.startsWith('https://'));
 assert.throws(()=>api.validateRecord({...draft,responsibilities:'  '}));
 for(const documentUrl of ['javascript:alert(1)','data:text/html,test','file:///secret','not a URL'])assert.throws(()=>api.validateRecord({...draft,documentUrl}));
 assert.equal(api.url(''),'');assert.equal(api.esc('<script>"'), '&lt;script&gt;&quot;');
 const id=await api.recordKey(draft);assert.match(id,/^[0-9a-f]{64}$/);
 assert.equal(await api.recordKey({...draft,position:' operator  '}),id,'Case/whitespace duplicate uses same record key');
 assert.notEqual(await api.recordKey({...draft,employeeId:'B',employeeName:'พนักงาน B'}),id,'Same position has a separate JD per person');
 for(const change of [{section:'Packing Section'},{plant:'โรง 2'},{division:'Quality Division'},{position:'Leader'}])assert.equal(await api.recordKey({...draft,...change}),id,'Employee transfer keeps one personal JD identity');
 const legacy={...draft};delete legacy.employeeId;delete legacy.employeeName;assert.throws(()=>api.validateRecord(legacy));assert(api.validateRecord(legacy,true));assert.notEqual(await api.recordKey(legacy),id);
 for(const change of [{section:'Packing Section'},{plant:'โรง 2'},{division:'Quality Division'}])assert.notEqual(await api.recordKey({...legacy,...change}),await api.recordKey(legacy),'Legacy position JDs retained separately');
 assert.deepEqual(Array.from(api.employeeList('Production Division','โรง 1')).map(e=>e.id),['A']);
 assert.deepEqual(Array.from(api.employeeList('Quality Division','รวม')).map(e=>e.id),['B']);
 store.set('ppms_v3_deleted_employee_ids',JSON.stringify(['A']));assert.equal(api.employeeList('Production Division','โรง 1').length,0);store.delete('ppms_v3_deleted_employee_ids');
 const first=api.nextRevision(null,record,0);assert.equal(first.version,1);assert.equal(first.createdAt,draft.updatedAt);
 assert.equal(api.nextRevision(first,record,0),undefined,'Duplicate creation aborts transaction');
 const edit=api.nextRevision(first,{...record,updatedAt:'2026-10-13T03:00:00Z'},1);assert.equal(edit.version,2);assert.equal(edit.createdAt,first.createdAt);
 assert.equal(api.nextRevision(edit,record,1),undefined,'Stale edits cannot overwrite another Admin revision');
 assert.deepEqual(Array.from(api.sectionList('Production Division','โรง 1')),['Assembly Section','New Production Section']);
 assert.deepEqual(Array.from(api.sectionList('Quality Division','รวม')),['Inspection Section','Quality Only Section']);
 console.log('Passed: JD validation, unsafe URL rejection, escaped content, individual employee keys, same-role employee separation, transfer identity, legacy JD retention, deleted-employee exclusion, duplicate creation, revision conflict, original creation date, Division/plant Section isolation.');
})().catch(error=>{console.error(error);process.exitCode=1});
