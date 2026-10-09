const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const service=fs.readFileSync('exam-submit-v831.js','utf8'),app=fs.readFileSync('app-v588.js','utf8');
function setup(mode='ok'){
 let canonical=mode==='existing'?{employeeId:'1',createdAt:'today',score:90,approvalStatus:'approved'}:null,calls=[],timer;const ctx={AbortController,window:{PPMS_FIREBASE_CONFIG:{databaseURL:'https://example.test'}},setTimeout(fn){timer=fn;return 1},clearTimeout(){},fetch:async(url,options={})=>{
  calls.push({url,options});if(mode==='abort'){timer();throw Object.assign(Error('aborted'),{name:'AbortError'})}
  if(mode==='denied')return {ok:false,status:403};
  if(options.method==='PATCH'){const patch=JSON.parse(options.body);canonical=patch['examResultsByKey/result'];assert(patch['examResultInbox/result']);assert.equal(url,'https://example.test/ppms.json')}
  return {ok:true,json:async()=>mode==='wrong'?{...canonical,score:0}:canonical};
 }};vm.createContext(ctx);vm.runInContext(service,ctx);return {submit:ctx.window.PPMS_EXAM_SUBMIT_SERVICE.submit,calls};
}
(async()=>{
 const record={employeeId:'1',createdAt:'today',score:85};let existing=setup('existing');assert.equal((await existing.submit('result',record,true)).score,90);assert.equal(existing.calls.length,1);assert(!existing.calls[0].options.method);let recovered=setup();await recovered.submit('result',record,true);assert.equal(recovered.calls.length,3);let s=setup();assert.equal((await s.submit('result',record)).score,85);assert.equal(s.calls.length,2);assert(!s.calls.some(c=>c.url.endsWith('/examResults.json')));
 await assert.rejects(setup('wrong').submit('result',record));await assert.rejects(setup('denied').submit('result',record));await assert.rejects(setup('abort').submit('result',record),/หมดเวลา/);
 const start=app.indexOf('const examSubmissionJobs=new Map()'),end=app.indexOf('\n\nfunction currentAbsentEmployees()',start);let outbox=[],requests=0,resolve;
 const ctx={recordStableKey:r=>r.createdAt,firebaseSafeKey:x=>x,firebaseEncodeData:x=>x,firebaseDecodeData:x=>x,queueExamResult:r=>outbox.push(r),removeExamOutbox:r=>{outbox=outbox.filter(x=>x.createdAt!==r.createdAt)},examResults:[],examDeletedKeys:new Set(),mergeRecordArrays:(a,b)=>[...a,...b],localStorage:{setItem(){}},EXAM_RESULT_KEY:'exam',LOCAL_UPDATED_KEY:'updated',setCloudStatus(){},window:{PPMS_EXAM_SUBMIT_SERVICE:{submit:async()=>{requests++;return new Promise(r=>resolve=r)}}}};
 vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);
 const first=ctx.syncExamResultCloudVerified(record),second=ctx.syncExamResultCloudVerified(record);assert.equal(outbox.length,1);assert.equal(requests,1);resolve(record);await Promise.all([first,second]);assert.equal(outbox.length,0);
 ctx.window.PPMS_EXAM_SUBMIT_SERVICE.submit=async()=>{throw Error('offline')};await assert.rejects(ctx.syncExamResultCloudVerified(record));assert.equal(outbox.length,1);
 const submitStart=app.indexOf("xf.onsubmit=async"),submitEnd=app.indexOf('activeExamForceSubmit=reason',submitStart),handler=app.slice(submitStart,submitEnd);
 assert(!handler.includes('await persistExamUpskillEmployee'));assert(handler.includes('setTimeout(retryPendingEmployeeSaves,0)'));
 assert(app.includes('setTimeout(recoverRecentLocalExamResults,1000)'));assert(app.includes('syncExamResultCloudVerified(record,true)'));
 console.log('Passed: recovery preserves existing server results, recovery sends missing locally saved exams, atomic per-result write, canonical verification, denied/mismatch/timeout, durable outbox before request, duplicate submit single request, offline retention, no blocking skill/master upload.');
})().catch(e=>{console.error(e);process.exitCode=1});
