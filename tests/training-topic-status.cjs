const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const section='Welding Section',scope={division:'Production Division',plant:'โรง 1'},sk=Buffer.from(section).toString('base64url');
const person=id=>({id,name:'Person '+id,section,organizationDivision:scope.division,organizationPlant:scope.plant,startDate:'2026-01-01'});
const titles=['Safety','WI','OJT','Draft','Unlinked'];
let readError=false,delay=false;const db={['ppmsExamPlanDetails/2026/'+sk]:{Q1:{training:titles.map(title=>title+' — Details').join('\n'),exam:'Assessment',method:'OJT',criteria:'80%'}},['ppmsTrainingImplementationStatus/2026/'+sk]:{Q1:{1:{topic:'WI',trainingDate:'2026-03-01',evidenceCount:1,attendeeIds:['1','2']},2:{topic:'OJT',trainingDate:'2026-03-01',evidenceCount:1,attendeeIds:['1']},3:{topic:'Draft',trainingDate:'2026-03-01',evidenceCount:0,attendeeIds:['1']},4:{topic:'Unlinked',trainingDate:'2026-03-01',evidenceCount:1,attendeeIds:[]}}}};
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<html><head></head><body><main id="app"><div class="page-head"><h2>Training Plan</h2></div><div class="exam-plan-controls"><select id="examPlanSection"><option>'+section+'</option></select><input id="examPlanYear" value="2026"></div></main></body></html>',{url:'https://ppms.test',runScripts:'outside-only',virtualConsole:vc});const w=dom.window;
 const result=(id,extra={})=>({employeeId:id,examType:'quarterly',quarter:'Q1',date:'2026-03-15',...extra});
 w.PPMS_FIREBASE_CONFIG={databaseURL:'https://db.test'};w.AbortController=AbortController;
 w.fetch=async url=>{const path=new URL(url).pathname.slice(1).replace(/\.json$/,'');if(path.startsWith('ppmsTrainingImplementationStatus')&&delay)await wait(80);if(path.startsWith('ppmsTrainingImplementationStatus')&&readError)throw Error('PERMISSION_DENIED');return {ok:true,status:200,json:async()=>db[path]||null}};
 w.runtime={allowed:true,allSections:true,scope,employees:[person('1'),person('2')],examResults:[result('1'),result('2',{date:'2025-03-15'}),result('2',{quarter:'Q2'}),result('2',{organizationPlant:'โรง 2'}),result('2',{forcedExit:true})]};w.PPMS_RUNTIME={monthReportContext:()=>w.runtime};
 try{
  await wait(0);w.eval(fs.readFileSync('exam-plan-details-v592.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(30);
  const badge=i=>w.document.querySelector('[data-training-quarter="Q1"] [data-training-topic-status="'+i+'"]');
  assert.equal(badge(0).textContent,'รออบรม');assert.equal(badge(1).textContent,'รอสอบ');assert.equal(badge(2).textContent,'อบรมและสอบครบแล้ว','Only the topic attendees must complete an exam');assert.equal(badge(3).textContent,'รออบรม');assert.equal(badge(4).textContent,'รอสอบ','Unlinked attendees cannot produce a completed badge');
  const selected=w.document.querySelector('#examPlanSection');w.runtime.examResults.push(result('2'));w.dispatchEvent(new w.Event('ppms-quarterly-exams-changed'));assert.equal(badge(1).textContent,'อบรมและสอบครบแล้ว');assert.equal(w.document.querySelector('#examPlanSection'),selected,'Exam events update badges without rebuilding controls');
  w.runtime.deletedExamKeys=['deleted'];w.runtime.examResults.at(-1).recordKey='deleted';w.dispatchEvent(new w.Event('ppms-quarterly-exams-changed'));assert.equal(badge(1).textContent,'รอสอบ','Deleted results restore the waiting state');
  // Failed reads stay distinct from confirmed not-trained states.
  readError=true;w.document.querySelector('[data-training-refresh]').click();await wait(30);assert.equal(badge(0).dataset.trainingStatus,'unavailable');assert(!badge(0).textContent.includes('รออบรม'));
  readError=false;delay=true;w.document.querySelector('[data-training-refresh]').click();await wait(10);assert.equal(badge(0).dataset.trainingStatus,'checking');await wait(100);assert.equal(badge(0).textContent,'รออบรม');
  assert.deepEqual(errors,[]);console.log('PASS training/exam topic states, topic-specific attendees, scoped quarterly exams, invalid/deleted attempts, live badge refresh and unknown/loading states.');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
