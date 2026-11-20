const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const t=await setup(true,'index.html',{beforeScripts(w){w.HTMLCanvasElement.prototype.getContext=()=>null;}}),w=t.w;
 try{
  w.document.querySelector('#nav [data-page="trainingPlan"]').click();await wait(350);
  const button=w.document.querySelector('[data-training-quarter="Q1"] [data-plan-slides="0"]');assert(button,'Slides are directly available on quarterly topic cards');
  assert(w.document.querySelector('[data-training-quarter="Q1"] [data-plan-materials="0"]'),'Every quarterly topic has a stored-materials entry');
  const before={exam:w.localStorage.getItem('ppms_v3_exam_results'),training:w.localStorage.getItem('ppms_v3_training')};
  button.click();assert(w.document.querySelector('.training-lessons-overlay'));assert.equal(w.document.querySelector('[data-tl-page]').dataset.tlPage,'1');assert(w.document.querySelector('#trainingLessonTitle').textContent.includes('Safety'));
  assert(w.document.querySelector('[data-tl-edit]'),'Existing editing roles can edit lesson pages');
  const files=w.document.querySelector('.training-lessons-overlay .tl-toolbar-actions > button');assert(files.textContent.includes('ไฟล์สไลด์'));files.click();await wait(60);assert(w.document.querySelector('.tl-files-overlay'),'Stored teaching files open from the deck');w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!w.document.querySelector('.tl-files-overlay'));assert(w.document.querySelector('.training-lessons-overlay'),'Closing stored files returns to the lesson');assert.equal(w.document.activeElement,files);
  w.document.querySelector('[data-tl-go="9"]').click();assert(w.document.querySelector('.tl-summary-grid').textContent.includes('80%'));w.document.querySelector('[data-tl-close]').click();assert.equal(w.document.activeElement,button);
  // Existing evidence loading can fail or stall without blocking the independent lesson.
  const fallback=w.fetch;w.fetch=(url,options)=>String(url).includes('ppmsTrainingImplementationRecords')?new Promise(()=>{}):fallback(url,options);
  w.document.querySelector('[data-training-quarter="Q1"] [data-plan-topic="1"]').click();const launch=w.document.querySelector('[data-open-training-slides]');assert(launch);assert(w.document.querySelector('[data-training-form]').disabled);launch.click();assert(w.document.querySelector('.training-lessons-overlay'));assert(w.document.querySelector('#trainingLessonTitle').textContent.includes('PPE'));w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(w.document.querySelector('.exam-training-topic-viewer'),'Closing slides returns to the original topic');assert.equal(w.document.activeElement,launch);
  assert.equal(w.localStorage.getItem('ppms_v3_exam_results'),before.exam);assert.equal(w.localStorage.getItem('ppms_v3_training'),before.training);assert.deepEqual(t.errors,[]);
  console.log('PASS full application: card and topic lesson entry points, correct live-plan content and criteria, independent of stalled evidence, closing/focus restoration and no completion/result changes.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(250);w.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
