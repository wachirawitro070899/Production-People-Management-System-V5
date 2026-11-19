const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const scope={division:'Production Division',plant:'โรง 1'},section='Stamping Section',sectionKey=Buffer.from(section).toString('base64url');
const plans={Q1:{training:'PPE — สวม PPE และตรวจสภาพก่อนเริ่มงาน\nQ-Point — ตรวจตามจุดควบคุมที่กำหนด',exam:'Safety / Quality',method:'OJT',criteria:'80%'},Q2:{training:'หัวข้อใหม่เฉพาะงาน — ตรวจรหัส ABC ก่อนเริ่มงาน',exam:'ABC',criteria:'80%'},Q3:{training:'Measurement — ตรวจ Zero ก่อนวัด'}};
const db={['ppmsExamPlanDetails/2026/'+sectionKey]:plans},requests=[],errors=[];
let restFails=false,stallRest=false,writeCount=0;
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM('<html><head></head><body><main id="app"><div class="page-head"><h2>Training</h2></div><div class="exam-plan-controls"><select id="examPlanSection"><option>'+section+'</option></select><input id="examPlanYear" value="2026"></div></main></body></html>',{url:'https://ppms.test',runScripts:'outside-only',virtualConsole:vc});
const w=dom.window;w.sessionStorage.setItem('ppms_admin','1');w.AbortController=AbortController;w.PPMS_FIREBASE_CONFIG={databaseURL:'https://firebase.test'};
const runtime={allowed:true,allSections:true,isAdmin:true,actorId:'test',employees:[{id:'E1',name:'Example',section}],examResults:[],deletedExamKeys:[],scope};w.PPMS_RUNTIME={monthReportContext:()=>runtime};
const nativeTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===20000?50:ms===8000?80:ms,...args);
function get(p){if(p in db)return db[p];const out={};let any=false;for(const [key,value]of Object.entries(db)){if(!key.startsWith(p+'/'))continue;any=true;const keys=key.slice(p.length+1).split('/');let node=out;for(const k of keys.slice(0,-1))node=node[k]||={};node[keys.at(-1)]=value;}return any?out:null;}
w.firebase={apps:[{}],database:()=>({ref:path=>({on:(event,success)=>{if(path.startsWith('ppmsExamPlanDetails/'))w.setTimeout(()=>success({val:()=>get(path)}),0);},off:()=>{}})})};
w.fetch=async(url,options={})=>{
 const path=new URL(url).pathname.slice(1).replace(/\.json$/,'');requests.push({path,method:options.method||'GET'});
 if(stallRest)return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'})),{once:true}));
 if(restFails)return{ok:false,status:403,json:async()=>null};
 if(options.method==='PATCH'){Object.assign(db,JSON.parse(options.body));writeCount++;return{ok:true,json:async()=>JSON.parse(options.body)};}
 return{ok:true,json:async()=>structuredClone(get(path))};
};
(async()=>{try{
 await wait(0);w.eval(fs.readFileSync('exam-plan-details-v592.js','utf8'));w.eval(fs.readFileSync('quarterly-training-exams-v963.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(40);
 const api=w.PPMSQuarterlyTraining,input={section,quarter:'Q1',year:2026,scope,level:2,setName:'A',count:20};
 // A stalled Firebase SDK no longer prevents a direct REST evidence read or save.
 w.document.querySelector('[data-training-quarter="Q1"] [data-plan-evidence="0"]').click();await wait(30);let form=w.document.querySelector('.training-record-editor');assert(form,'REST opens evidence editor even when SDK evidence listeners never reply');
 for(const [name,value]of Object.entries({trainingDate:'2026-03-01',trainingTime:'09:00',trainingPlace:'Room',trainer:'Trainer',effect:'Complete'}))form.elements[name].value=value;
 form.querySelector('[name="attendeeIds"]').checked=true;form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(40);assert.equal(writeCount,1);w.document.querySelector('.exam-topic-overlay [data-close]').click();
 await api.prepare(input);const rev=api.snapshot(input).revision;
 const bank=[{text:'ตรวจ PPE อย่างไร?',skill:'Safety',options:['A','B','C','D'],correct:1},{text:'ตรวจงานตาม Q-Point อย่างไร?',skill:'Quality Check',options:['A','B','C','D'],correct:2},{text:'Unrelated spindle setup',skill:'Machine Operation',options:['A','B','C','D'],correct:0}];
 const questions=api.questions(input,bank);assert.equal(questions.length,20);assert.equal(new Set(questions.map(q=>q.trainingTopic)).size,2);assert(questions.every(q=>q.trainingPlanRevision===rev));assert(!questions.some(q=>q.text==='Unrelated spindle setup'));assert(questions.some(q=>q.text==='ตรวจ PPE อย่างไร?'));assert.equal(JSON.stringify(api.questions(input,bank)),JSON.stringify(questions));
 const frozen=api.snapshot(input);plans.Q1.training='Changed after exam start';assert.equal(api.snapshot(input).revision,rev,'Active exam plan stays frozen');assert.equal(frozen.topics.length,2);
 const q2={...input,quarter:'Q2'};await api.prepare(q2);const custom=api.questions(q2,bank);assert(custom.every(q=>q.source==='training-plan'));assert(custom.every(q=>q.options[q.correct]==='ตรวจรหัส ABC ก่อนเริ่มงาน'));assert(custom.every(q=>q.trainingTopic==='หัวข้อใหม่เฉพาะงาน'));
 const other={...input,scope:{...scope,plant:'โรง 2'}};await api.prepare(other);assert.notEqual(api.snapshot(other).revision,rev);assert.equal(api.snapshot(other).organizationPlant,'โรง 2');
 // A notification arrives from another browser through a small scoped polling read.
 const ctx=w.PPMSTrainingPlanService.trainingContext(input),noticePath='ppms/trainingExamNotifications/2026/'+sectionKey+'/Q1/RTE';
 db[noticePath]={employeeId:'E1',employeeName:'Example',section,quarter:'Q1',year:2026,score:60,resultId:'result-1',recordKey:'record-1',createdAt:'2026-03-10T10:00:00Z',date:'2026-03-10'};
 await api.refreshNotices(ctx);await wait(20);let panel=w.document.querySelector('[data-training-exam-notices]');assert(panel.textContent.includes('1 รายการใหม่'));assert(panel.textContent.includes('ไม่ผ่าน'));assert(w.document.querySelector('[data-quarter-progress="Q1"]').textContent.includes('1 / 1 คน'));panel.querySelector('[data-training-exams-seen]').click();assert(!panel.textContent.includes('1 รายการใหม่'));await api.refreshNotices(ctx);assert(!panel.textContent.includes('1 รายการใหม่'),'Polling never repeats acknowledged notification');
 runtime.deletedExamKeys.push('record-1');await api.refreshNotices(ctx);assert(!api.notifications(ctx).length,'Deleted exam notification must not resurrect completion');assert(w.document.querySelector('[data-quarter-progress="Q1"]').textContent.includes('0 / 1 คน'));
 // REST deadline/permissions leave a usable retry action and never overwrite unknown evidence.
 restFails=true;w.document.querySelector('[data-training-quarter="Q1"] [data-plan-evidence="0"]').click();await wait(20);assert(!w.document.querySelector('[data-training-form]').disabled);assert(w.document.querySelector('[data-record-panel]').textContent.includes('ไม่มีสิทธิ์'));assert.equal(writeCount,1);restFails=false;w.document.querySelector('[data-training-form]').click();await wait(20);assert(w.document.querySelector('.training-record-editor'));w.document.querySelector('.training-record-editor [data-close]').click();w.document.querySelector('.exam-topic-overlay [data-close]').click();
 stallRest=true;w.document.querySelector('[data-training-quarter="Q1"] [data-plan-evidence="0"]').click();await wait(90);assert(!w.document.querySelector('[data-training-form]').disabled);assert(w.document.querySelector('[data-record-panel] button'));assert.equal(writeCount,1);stallRest=false;
 assert(requests.filter(r=>r.path.includes('ppmsTrainingImplementationRecords')).length>=4);assert.deepEqual(errors,[]);
 // Exam result and notification are written in the same atomic PATCH.
 const calls=[];let canonical=null;const env={AbortController,btoa:s=>Buffer.from(s,'binary').toString('base64'),window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://firebase.test'}},setTimeout,clearTimeout,fetch:async(url,options={})=>{calls.push({url,options});if(options.method==='PATCH'){const data=JSON.parse(options.body);canonical=data['examResultsByKey/result'];assert.equal(Object.keys(data).filter(k=>k.startsWith('trainingExamNotifications/')).length,1);const n=Object.entries(data).find(([k])=>k.startsWith('trainingExamNotifications/'))[1];assert.equal(n.recordKey,'stable-key');assert.equal(n.score,60);}return{ok:true,json:async()=>canonical};}};vm.createContext(env);vm.runInContext(fs.readFileSync('exam-submit-v831.js','utf8'),env);
 await env.window.PPMS_EXAM_SUBMIT_SERVICE.submit('result',{employeeId:'E1',employeeName:'Example',section,examType:'quarterly',quarter:'Q1',date:'2026-03-10',createdAt:'2026-03-10T10:00:00Z',score:60,examRecordKey:'stable-key',trainingPlan:frozen});assert.equal(calls.length,2);
 console.log('PASS stalled SDK with working REST, direct saves, retry/timeout/permission recovery, plan topic coverage, custom-topic questions, deterministic frozen plans, scope isolation, atomic exam notifications, cross-client progress, acknowledgement and deletion handling.');
}finally{w.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
