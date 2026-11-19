const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const source=fs.readFileSync('exam-plan-details-v592.js','utf8'),section='Stamping Section',sectionKey=Buffer.from(section).toString('base64url');
const recordPath='ppmsTrainingImplementationRecords/2026/'+sectionKey+'/Q1/0',statusPath='ppmsTrainingImplementationStatus/2026/'+sectionKey+'/Q1/0';
const person=id=>({id,name:'Person '+id,section,organizationDivision:'Production Division',organizationPlant:'โรง 1'});
const exam=(employeeId,more={})=>({employeeId,examType:'quarterly',quarter:'Q1',date:'2026-03-15',score:90,...more});
const db={['ppmsExamPlanDetails/2026/'+sectionKey]:{Q1:{training:'Safety — Work safely',exam:'Safety',method:'OJT',criteria:'80%'}}};
function get(p){if(p in db)return db[p];const out={},entries=Object.entries(db).filter(([k])=>k.startsWith(p+'/'));for(const [key,value]of entries){let node=out;const keys=key.slice(p.length+1).split('/');for(const k of keys.slice(0,-1))node=node[k]||={};node[keys.at(-1)]=value;}return entries.length?out:null;}
let failRead=false,failWrite=false,writes=0;
async function setup(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<html><head></head><body><main id="app"><div class="page-head"><h2>Training Plan</h2></div><div class="exam-plan-controls"><select id="examPlanSection"><option>'+section+'</option></select><input id="examPlanYear" value="2026"></div></main></body></html>',{url:'https://ppms.test',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.sessionStorage.setItem('ppms_admin','1');w.PPMS_FIREBASE_CONFIG={};
 w.runtimeFixture={allowed:true,isAdmin:true,allSections:true,scope:{division:'Production Division',plant:'โรง 1'},employees:[person('1'),person('2'),{...person('OTHER'),organizationPlant:'โรง 2'}],examResults:[exam('1'),exam('2',{date:'2025-03-15'}),exam('2',{quarter:'Q2'}),exam('2',{organizationPlant:'โรง 2'})]};
 w.PPMS_RUNTIME={monthReportContext:()=>w.runtimeFixture};w.PPMSIndividualReports={decision:r=>({label:r.score>=80?'ผ่านเกณฑ์':'ไม่ผ่านเกณฑ์ / ฝึกอบรมซ้ำ'})};
 w.firebase={apps:[{}],database:()=>({ref:(path='')=>({on:(event,success,fail)=>w.setTimeout(()=>failRead?fail(Error('PERMISSION_DENIED')):success({val:()=>get(path)}),0),off:()=>{},update:async values=>{if(failWrite)throw Error('PERMISSION_DENIED');Object.assign(db,values);writes++;}})})};
 w.File.prototype.arrayBuffer=function(){return new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsArrayBuffer(this);});};
 await wait(0);w.eval(source);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(20);return {w,errors};
}
(async()=>{
 let t=await setup(),w=t.w;
 const quarter=()=>w.document.querySelector('[data-quarter-progress="Q1"]').textContent;
 const open=async()=>{w.document.querySelector('[data-training-quarter="Q1"] [data-plan-evidence="0"]').click();await wait(20);assert(w.document.querySelector('.training-record-editor'));};
 const form=()=>w.document.querySelector('.training-record-editor');
 const files=values=>Object.defineProperty(form().elements.evidence,'files',{value:values,configurable:true});
 const submit=async()=>{form().dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(30);};
 const close=()=>w.document.querySelector('.exam-topic-overlay [data-close]').click();
 const pdf=()=>new w.File(['%PDF-1.4\nTest\n%%EOF'],'Attendance.pdf',{type:'application/pdf'});
 try{
  assert(quarter().includes('1 / 2 คน'),'Exclude wrong years, quarters and plants');
  await open();assert.equal(form().querySelectorAll('[name="attendeeIds"]').length,2);
  for(const [name,value]of Object.entries({trainingDate:'2026-03-01',trainingTime:'09:00–11:00',trainingPlace:'Room',trainer:'Trainer',effect:'OJT completed'}))form().elements[name].value=value;
  form().querySelectorAll('[name="attendeeIds"]').forEach(b=>b.checked=true);await submit();assert.equal(form(),null);assert.equal(db[recordPath].evidence.length,0);close();assert(!quarter().includes('อบรมเสร็จแล้ว'));
  await open();files([pdf()]);await submit();assert.equal(form(),null);assert.equal(db[recordPath].attendeeIds.length,2);assert.equal(db[statusPath].evidenceCount,1);assert(!JSON.stringify(db[statusPath]).includes('data:'));assert(w.document.querySelector('[data-record-panel]').textContent.includes('รอสอบ'));close();assert(quarter().includes('อบรมเสร็จแล้ว • รอสอบ'));
  assert.deepEqual(t.errors,[]);w.close();t=await setup();w=t.w;assert(quarter().includes('อบรมเสร็จแล้ว • รอสอบ'),'Confirmed status survives reload');
  await open();assert(form().textContent.includes('Attendance.pdf'));
  files([new w.File(['<script>fake</script>'],'fake.pdf',{type:'application/pdf'})]);await submit();assert(form().querySelector('[data-training-save-status]').textContent.includes('ไฟล์'));assert.equal(db[recordPath].evidence.length,1);
  files([pdf(),pdf(),pdf(),pdf()]);await submit();assert(form().querySelector('[data-training-save-status]').textContent.includes('สูงสุด 4'));
  files([new w.File([new Uint8Array(1572865)],'large.pdf',{type:'application/pdf'})]);await submit();assert(form().querySelector('[data-training-save-status]').textContent.includes('1.5 MB'));
  files([]);form().elements.effect.value='Must not save';failWrite=true;const before=writes;await submit();assert(form().querySelector('[data-training-save-status]').textContent.includes('PERMISSION_DENIED'));assert.equal(writes,before);assert.notEqual(db[recordPath].effect,'Must not save');failWrite=false;
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});await submit();assert(form().querySelector('[data-training-save-status]').textContent.includes('อินเทอร์เน็ต'));assert.equal(writes,before);Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});form().querySelector('[data-close]').click();close();
  w.runtimeFixture.examResults.push(exam('2',{score:50}));w.document.querySelector('[data-training-refresh]').click();await wait(20);assert(quarter().includes('สอบเสร็จแล้ว'));w.document.querySelector('[data-training-quarter="Q1"] [data-plan-topic="0"]').click();await wait(20);assert(w.document.querySelector('[data-record-panel]').textContent.includes('ไม่ผ่านเกณฑ์'));close();
  await open();form().querySelector('[name="removeEvidence"]').checked=true;await submit();close();assert(!quarter().includes('อบรมเสร็จแล้ว'));assert.equal(db[statusPath].evidenceCount,0);
  delete db[recordPath];delete db[statusPath];w.document.querySelector('[data-training-refresh]').click();await wait(20);w.document.querySelector('[data-training-quarter="Q1"] [data-plan-topic="0"]').click();await wait(20);assert(w.document.querySelector('[data-record-panel]').textContent.includes('ยังไม่ได้บันทึก'));close();
  failRead=true;w.document.querySelector('[data-training-quarter="Q1"] [data-plan-evidence="0"]').click();await wait(20);assert(w.document.querySelector('[data-record-panel]').textContent.includes('PERMISSION_DENIED'));assert(!w.document.querySelector('[data-training-form]').disabled);assert(w.document.querySelector('[data-record-panel] button'));failRead=false;w.document.querySelector('[data-training-form]').click();await wait(20);assert(form(),'Retry must open editor without closing the topic');form().querySelector('[data-close]').click();close();
  w.sessionStorage.removeItem('ppms_admin');w.document.querySelector('[data-training-refresh]').click();await wait(20);assert.equal(w.document.querySelectorAll('[data-plan-evidence]').length,0);assert.deepEqual(t.errors,[]);
  console.log('PASS evidence save/reload/removal, metadata-only cards, scoped quarterly exams, participant links, draft status, failed/offline saves, read failures, file validation and readonly controls.');
 }finally{w.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
