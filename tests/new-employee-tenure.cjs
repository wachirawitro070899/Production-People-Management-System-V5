const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<200;i++){if(fn())return;await wait(10)}throw Error('Tenure validation did not settle')}
(async()=>{
 let instant='2026-11-24T09:00:00Z';
 const fixture=await setup(true,'index.html',{beforeScripts(w){const NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[instant]))}static now(){return NativeDate.parse(instant)}}}}),w=fixture.w;
 const scope={division:'Production Division',plant:'โรง 1'},section='Welding Section';
 const people=[['BOUNDARY','2026-10-24'],['EXPIRED','2026-10-23'],['TODAY','2026-11-24'],['TOMORROW','2026-11-25'],['INVALID','2026-11-31'],['MISSING',''],['NEXTBOUNDARY','2026-10-25']].map(([id,startDate])=>({id,name:id,section,startDate,organizationDivision:scope.division,organizationPlant:scope.plant}));
 let writes=0,advanceDuringRead=false;const db={};
 try{
  const runtime={...w.PPMS_RUNTIME.monthReportContext(),allSections:true,scope,employees:people,examResults:[]};w.PPMS_RUNTIME.monthReportContext=()=>runtime;
  const service=w.PPMSTrainingPlanService;
  for(const [start,on,expected]of [
   ['2026-10-24','2026-11-24',true],['2026-10-23','2026-11-24',false],['2026-11-24','2026-11-24',true],['2026-11-25','2026-11-24',false],
   ['2026-01-31','2026-02-28',true],['2026-01-31','2026-03-01',false],['2024-01-31','2024-02-29',true],['2024-01-31','2024-03-01',false],
   ['2024-02-29','2024-03-29',true],['2024-02-29','2024-03-30',false],['2026-12-31','2027-01-31',true],['2026-12-31','2027-02-01',false],
   ['2026-02-30','2026-03-01',false],['','2026-11-24',false],['bad','2026-11-24',false],['2026-11-01','bad',false]
  ])assert.equal(service.newEmployeeEligible({startDate:start},on),expected,start+' on '+on);
  const fallback=w.fetch;w.fetch=async(url,options={})=>{
   const path=new URL(String(url)).pathname.slice(1).replace(/\.json$/,'');
   if(options.method==='PATCH'&&path===''){writes++;Object.assign(db,JSON.parse(options.body));return {ok:true,status:204};}
   if(path.startsWith('ppmsTrainingImplementation')||path.startsWith('ppmsExamPlanDetails/')){
    if(advanceDuringRead&&path.endsWith('/NEW/bundle/topic')){instant='2026-11-25T17:00:00Z';advanceDuringRead=false;}
    return {ok:true,status:200,json:async()=>db[path]||null};
   }
   return fallback(url,options);
  };
  w.document.querySelector('#nav [data-page=trainingPlan]').click();await wait(150);
  const sectionSelect=w.document.querySelector('#examPlanSection');sectionSelect.value=section;sectionSelect.dispatchEvent(new w.Event('change',{bubbles:true}));
  await until(()=>w.document.querySelector('#newEmployeeTrainingV974')?.__ctx?.section===section);
  const api=w.PPMSNewEmployeeTraining,ctx=w.document.querySelector('#newEmployeeTrainingV974').__ctx;
  const options=()=>[...w.document.querySelector('[data-new-employee-select]').options].map(option=>option.value);
  assert(options().includes('BOUNDARY'));assert(options().includes('TODAY'));
  for(const id of ['EXPIRED','TOMORROW','INVALID','MISSING'])assert(!options().includes(id),id+' is filtered from individual training');
  const details=w.document.querySelector('[data-new-employee-details]');details.open=true;details.dispatchEvent(new w.Event('toggle'));
  const picker=w.document.querySelector('[data-new-employee-select]');picker.value='BOUNDARY';picker.dispatchEvent(new w.Event('change',{bubbles:true}));
  await until(()=>w.document.querySelector('[data-new-course-record]'));w.document.querySelector('[data-new-course-record]').click();
  await until(()=>w.document.querySelector('.training-record-editor'));let form=w.document.querySelector('.training-record-editor');
  function fill(date){for(const[name,value]of Object.entries({trainingDate:date,trainingTime:'09:00–10:00',trainingPlace:'Room',trainer:'Trainer',effect:'Completed OJT'}))form.elements[name].value=value;form.elements.trainingCompleted.checked=true;Object.defineProperty(form.elements.evidence,'files',{value:[],configurable:true});}
  const submit=()=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  fill('2026-11-24');instant='2026-11-24T17:00:00Z';submit();await until(()=>form.querySelector('[data-training-save-status]').textContent.includes('อายุงานไม่เกิน 1 เดือน'));assert.equal(writes,0,'Backdating cannot enroll a currently expired employee');form.querySelector('[data-close]').click();
  api.mount();assert(!options().includes('BOUNDARY'),'Bangkok midnight changes eligibility');assert(options().includes('NEXTBOUNDARY'));
  w.document.querySelector('[data-new-group-record]').click();await until(()=>w.document.querySelector('.training-attendee-picker'));form=w.document.querySelector('.training-record-editor');
  assert(!form.querySelector('[value=BOUNDARY]'));assert(!form.querySelector('[value=EXPIRED]'));
  for(const id of ['NEXTBOUNDARY','TODAY'])form.querySelector('[value='+id+']').checked=true;
  fill('2026-11-25');advanceDuringRead=true;submit();await until(()=>form.querySelector('[data-training-save-status]').textContent.includes('อายุงานไม่เกิน 1 เดือน'));
  assert.equal(writes,0,'Eligibility is rechecked after asynchronous group reads; no partial save');assert.equal(Object.keys(db).length,0);
  form.querySelector('[value=NEXTBOUNDARY]').checked=false;submit();await until(()=>!form.isConnected);assert.equal(writes,1,'An eligible attendee can still be trained');
  assert.equal(Object.values(db).filter(record=>record.trainingCompleted&&record.attendeeIds?.includes('TODAY')).length,3);
  runtime.employees=people.filter(person=>person.id==='EXPIRED');api.mount();assert(w.document.querySelector('[data-new-group-record]').disabled);assert.equal(options().length,1);
  assert.deepEqual(fixture.errors,[]);
  console.log('PASS calendar-month and month-end/leap/year boundaries, invalid/future dates, Bangkok midnight, filtered individual/group pickers, stale form/backdating prevention and atomic expiry rejection.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(250);w.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
