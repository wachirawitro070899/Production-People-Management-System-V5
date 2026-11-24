const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<200;i++){if(fn())return;await wait(10)}throw Error('Group training did not settle')}
(async()=>{
 const fixture=await setup(true,'index.html'),w=fixture.w,scope={division:'Production Division',plant:'โรง 1'},section='Welding Section';
 const people=[
  {id:'GROUP1',name:'New welder one',section,startDate:'2026-11-01'},
  {id:'GROUP2',name:'New welder two',section,startDate:'2026-11-02'},
  {id:'GROUP3',name:'Unselected welder',section,startDate:'2026-11-01'},
  {id:'MISSING',name:'No start date',section,startDate:''},
  {id:'OTHER',name:'Other plant',section,startDate:'2026-11-01',organizationPlant:'โรง 2'},
  {id:'STAMP',name:'Other section',section:'Stamping Section',startDate:'2026-11-01'}
 ].map(person=>({organizationDivision:scope.division,organizationPlant:scope.plant,...person}));
 const db={};let writes=[],fail=false;
 const value=path=>{if(Object.hasOwn(db,path))return db[path];for(const[key,record]of Object.entries(db)){if(path.startsWith(key+'/'))return path.slice(key.length+1).split('/').reduce((node,key)=>node?.[key],record)??null;}const out={};let found=false;for(const[key,record]of Object.entries(db)){if(!key.startsWith(path+'/'))continue;found=true;const parts=key.slice(path.length+1).split('/');let node=out;for(const part of parts.slice(0,-1))node=node[part]||={};node[parts.at(-1)]=record;}return found?out:null;};
 try{
  const runtime={...w.PPMS_RUNTIME.monthReportContext(),allSections:true,scope,employees:people,examResults:[]};w.PPMS_RUNTIME.monthReportContext=()=>runtime;
  const fallback=w.fetch;w.fetch=async(url,options={})=>{
   const path=new URL(String(url)).pathname.slice(1).replace(/\.json$/,'');
   if(options.method==='PATCH'&&path===''){
    if(fail)return {ok:false,status:403};const updates=JSON.parse(options.body);writes.push(updates);Object.assign(db,updates);return {ok:true,status:204};
   }
   if(path.startsWith('ppmsTrainingImplementation')||path.startsWith('ppmsExamPlanDetails/'))return {ok:true,status:200,json:async()=>value(path)};
   return fallback(url,options);
  };
  w.document.querySelector('#nav [data-page=trainingPlan]').click();await wait(150);
  const sectionSelect=w.document.querySelector('#examPlanSection');sectionSelect.value=section;sectionSelect.dispatchEvent(new w.Event('change',{bubbles:true}));
  await until(()=>w.document.querySelector('#newEmployeeTrainingV974')?.__ctx?.section===section);
  const api=w.PPMSNewEmployeeTraining,ctx=w.document.querySelector('#newEmployeeTrainingV974').__ctx;
  const details=w.document.querySelector('[data-new-employee-details]');details.open=true;details.dispatchEvent(new w.Event('toggle'));
  async function openGroup(){w.document.querySelector('[data-new-group-record]').click();await until(()=>w.document.querySelector('.training-attendee-picker'));return w.document.querySelector('.training-record-editor')}
  let form=await openGroup();assert(!form.querySelector('[value=OTHER]'));assert(!form.querySelector('[value=STAMP]'));assert(form.querySelector('[value=MISSING]').disabled);
  const search=form.querySelector('[data-training-person-search]');search.value='GROUP1';search.dispatchEvent(new w.Event('input',{bubbles:true}));form.querySelector('[data-training-select-all]').click();assert.deepEqual([...form.querySelectorAll('[name=attendeeIds]:checked')].map(box=>box.value),['GROUP1']);
  form.querySelector('[data-training-clear]').click();search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  for(const id of ['GROUP1','GROUP2']){const box=form.querySelector('[name=attendeeIds][value='+id+']');box.checked=true;box.dispatchEvent(new w.Event('change',{bubbles:true}))}
  assert(form.querySelector('[data-training-selected-count]').textContent.includes('2'));
  for(const[name,text]of Object.entries({trainingDate:'2026-11-03',trainingTime:'09:00–11:00',trainingPlace:'Training room',trainer:'Group trainer',effect:'OJT and defect recognition completed'}))form.elements[name].value=text;
  form.elements.trainingCompleted.checked=true;
  Object.defineProperty(form.elements.evidence,'files',{value:[new w.File(['%PDF-1.4\nShared evidence\n%%EOF'],'Group-attendance.pdf',{type:'application/pdf'})],configurable:true});
  const submit=()=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  fail=true;submit();await until(()=>form.querySelector('[data-training-save-status]').textContent.includes('บันทึกไม่สำเร็จ'));
  assert.equal(writes.length,0);assert.equal(Object.keys(db).length,0);assert(form.querySelector('[value=GROUP1]').checked);
  fail=false;submit();await until(()=>!form.isConnected);assert.equal(writes.length,1,'All attendees and evidence are committed atomically');
  const groupPath=Object.keys(db).find(path=>/\/NEW\/group_/.test(path)),group=db[groupPath];assert(groupPath);assert.deepEqual(group.attendeeIds,['GROUP1','GROUP2']);assert.equal(group.evidence.length,1);
  const paths=people.slice(0,3).map(person=>{const personal=api.personalContext(ctx,person);return 'ppmsTrainingImplementationRecords/'+personal.year+'/'+personal.sectionKey+'/NEW/bundle'});
  for(const [i,path]of paths.slice(0,2).entries()){
   const record=db[path],summary=db[path.replace('Records/','Status/')];assert.equal(record.attendeeIds.join(','),people[i].id);assert.equal(record.evidence.length,0);assert.equal(record.evidenceSource,groupPath);assert.equal(summary.evidenceCount,1);assert.equal(summary.trainingCompleted,true);assert.equal(summary.courseTopics.length,api.requiredTopics(section).length);
  }
  assert(!db[paths[2]],'Unselected employees are untouched');assert.equal(runtime.examResults.length,0,'Training never fabricates an exam');
  async function select(id){const select=w.document.querySelector('[data-new-employee-select]');select.value=id;select.dispatchEvent(new w.Event('change',{bubbles:true}));await until(()=>['waiting-training','waiting-exam','completed'].includes(w.document.querySelector('[data-new-employee-overall]')?.dataset.status));}
  await select('GROUP2');assert.equal(w.document.querySelector('[data-new-employee-overall]').dataset.status,'waiting-exam');
  w.document.querySelector('[data-new-course-view]').click();await until(()=>w.document.querySelector('.exam-topic-overlay'));assert(w.document.querySelector('.exam-topic-overlay').textContent.includes('Group-attendance.pdf'));assert(w.document.querySelector('.exam-topic-overlay').textContent.includes('GROUP1'));w.document.querySelector('[data-new-close]').click();
  runtime.examResults.push({employeeId:'GROUP1',examType:'new_employee',date:'2026-11-04',section,organizationDivision:scope.division,organizationPlant:scope.plant});w.dispatchEvent(new w.Event('ppms-exam-result-confirmed'));
  assert.equal(w.document.querySelector('[data-new-employee-overall]').dataset.status,'waiting-exam');await select('GROUP1');assert.equal(w.document.querySelector('[data-new-employee-overall]').dataset.status,'completed');
  await select('GROUP3');assert.equal(w.document.querySelector('[data-new-employee-overall]').dataset.status,'waiting-training');
  // A later personal edit becomes independent of the shared immutable evidence.
  await select('GROUP2');w.document.querySelector('[data-new-course-record]').click();await until(()=>w.document.querySelector('.training-record-editor'));form=w.document.querySelector('.training-record-editor');form.elements.effect.value='Personal follow-up';Object.defineProperty(form.elements.evidence,'files',{value:[],configurable:true});submit();await until(()=>!form.isConnected);
  assert.equal(db[paths[1]].effect,'Personal follow-up');assert.equal(db[paths[1]].evidence.length,1);assert.equal(db[paths[0]].evidenceSource,groupPath);assert.equal(group.evidence.length,1);
  // Existing individual records and changes to employment are validated before a group write.
  form=await openGroup();for(const id of ['GROUP1','GROUP3'])form.querySelector('[value='+id+']').checked=true;
  for(const[name,text]of Object.entries({trainingDate:'2026-11-03',trainingTime:'09:00–11:00',trainingPlace:'Room',trainer:'Trainer',effect:'Complete'}))form.elements[name].value=text;form.elements.trainingCompleted.checked=true;Object.defineProperty(form.elements.evidence,'files',{value:[],configurable:true});submit();await until(()=>form.querySelector('[data-training-save-status]').textContent.includes('มีบันทึกอบรมแล้ว'));assert.equal(writes.length,2);assert(!db[paths[2]]);
  form.querySelector('[value=GROUP1]').checked=false;people[2].startDate='2026-11-05';submit();await until(()=>form.querySelector('[data-training-save-status]').textContent.includes('ข้อมูลวันเริ่มงาน'));assert.equal(writes.length,2);form.querySelector('[data-close]').click();
  w.PPMSAccess={canEdit:()=>false};api.mount();assert(!w.document.querySelector('[data-new-group-record]'));assert.deepEqual(fixture.errors,[]);
  console.log('PASS group selection/search, scoped employees, atomic failure/retry, shared evidence, separate progress/exams, individual follow-up and existing-record/employment/readonly protection.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(250);w.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
