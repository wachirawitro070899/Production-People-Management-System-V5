const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const t=await setup(true,'index.html',{beforeScripts(w){w.HTMLCanvasElement.prototype.getContext=()=>null;}}),w=t.w;
 try{
  w.document.querySelector('#nav [data-page="trainingPlan"]').click();await wait(350);
  const before={training:w.localStorage.getItem('ppms_v3_training'),exams:w.localStorage.getItem('ppms_v3_exam_results')},card=w.document.querySelector('[data-training-quarter="Q1"]'),button=card.querySelector('[data-plan-signature="0"]');
  assert(button,'Print signing form is directly available on every topic');button.click();assert(w.document.querySelector('.training-signature-overlay'));assert(w.document.querySelector('[data-form-topic]').textContent.trim());assert(w.document.querySelector('[data-form-date]').textContent.includes(w.PPMSTrainingSignatureForm.model({ctx:{section:'test'},item:{title:'test'}}).date));w.document.querySelector('[data-ts-close]').click();assert.equal(w.document.activeElement,button);
  const original=w.fetch;w.fetch=(url,options)=>String(url).includes('ppmsTrainingImplementationRecords')?new Promise(()=>{}):original(url,options);
  card.querySelector('[data-plan-topic="1"]').click();const topic=w.document.querySelector('.exam-training-topic-viewer'),print=topic.querySelector('[data-print-signature]');assert(print&&!print.disabled,'Signing sheet does not wait for evidence');assert(topic.querySelector('[data-training-form]').disabled);print.click();assert(w.document.querySelector('.training-signature-overlay'));w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!w.document.querySelector('.training-signature-overlay'));assert(topic.isConnected);assert.equal(w.document.activeElement,print);
  assert.equal(w.localStorage.getItem('ppms_v3_training'),before.training);assert.equal(w.localStorage.getItem('ppms_v3_exam_results'),before.exams);assert.deepEqual(t.errors,[]);
  console.log('PASS quarterly plan and topic signing-sheet entries, current topic/date, printing independent of stalled evidence, focus restoration and unchanged training/exam status.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(150);w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
