/* Section fundamentals tracked separately for each employee and employment cycle. */
(()=>{'use strict';
 const states=new Map(),ROOT='ppmsTrainingImplementationStatus';
 const service=()=>window.PPMSTrainingPlanService;
 const esc=value=>service().esc(value);
 const language=()=>window.PPMSLanguage?.language||'th';
 const t=(th,en)=>language()==='en'?en:th;
 const selectionKey=ctx=>'ppms_new_employee_training::'+ctx.sectionKey;
 const openKey=ctx=>selectionKey(ctx)+'::open';
 const get=(key,fallback='')=>{try{return sessionStorage.getItem(key)||fallback}catch{return fallback}};
 const put=(key,value)=>{try{sessionStorage.setItem(key,value)}catch{}};
 function requiredTopics(section){
  const api=service(),source=api.defaults(section,true).Q1.training+'\n'+api.sectionFocus(window.PPMSOrganizationScope?.sectionKey(section)||section),seen=new Set();
  return api.trainingItems(source).filter(item=>{const key=item.title.trim().toLowerCase();if(seen.has(key))return false;seen.add(key);return true}).map((item,index)=>({...item,index}));
 }
 function personalContext(ctx,employee){
  const year=/^\d{4}-\d{2}-\d{2}$/.test(employee.startDate||'')?Number(employee.startDate.slice(0,4)):ctx.year;
  const sectionKey='new_'+service().safeKey([ctx.scope.division,ctx.scope.plant,ctx.section,String(employee.id),employee.startDate||'undated'].join('::'));
  return {...ctx,year,sectionKey,key:year+'__'+sectionKey};
 }
 function resultFor(ctx,employee){
  const source=window.PPMS_RUNTIME?.monthReportContext?.();if(!source?.allowed)return null;
  const deleted=new Set(source.deletedExamKeys||[]),sectionKey=value=>window.PPMSOrganizationScope?.sectionKey(value)||String(value).trim().toLowerCase();
  return (source.examResults||[]).filter(result=>{
   if(String(result.employeeId)!==String(employee.id)||result.examType!=='new_employee'||result.deleted||result.forcedExit===true||deleted.has(result.recordKey))return false;
   if(result.organizationDivision&&result.organizationDivision!==ctx.scope.division||result.organizationPlant&&result.organizationPlant!==ctx.scope.plant||result.section&&sectionKey(result.section)!==sectionKey(ctx.section))return false;
   const date=String(result.date||result.createdAt||'').slice(0,10);
   return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!!employee.startDate&&date>=employee.startDate;
  }).sort((a,b)=>String(b.createdAt||b.date).localeCompare(String(a.createdAt||a.date)))[0]||null;
 }
 function stateOf(record,item,result,loaded=true,error=''){
  if(!loaded)return {key:error?'unavailable':'checking',label:error?t('ยังตรวจสอบสถานะไม่ได้','Status unavailable'):t('กำลังตรวจสอบสถานะ','Checking status'),className:'checking'};
  if(record?.topic!==item.title||!service().trainingDone(record))return {key:'waiting-training',label:t('รออบรม','Waiting for training'),className:'pending'};
  return result?{key:'completed',label:t('อบรมและสอบครบแล้ว','Training and exam completed'),className:'done'}:{key:'waiting-exam',label:t('รอสอบ','Waiting for exam'),className:'waiting-exam'};
 }
 function currentPerson(ctx,id){return service().roster(ctx).find(person=>String(person.id)===String(id))}
 function currentHost(ctx,employee){const host=document.getElementById('newEmployeeTrainingV974');return host?.__ctx?.key===ctx.key&&host.querySelector('[data-new-employee-select]')?.value===String(employee.id)&&currentPerson(ctx,employee.id)?.startDate===employee.startDate?host:null}
 const quarterOf=topics=>({training:topics.map(item=>item.title+' — '+item.detail).join('\n'),method:'ปฐมนิเทศ Section + สาธิต WI / Q-Point + ฝึก OJT กับผู้สอน',criteria:'ผ่านเกณฑ์ข้อสอบพนักงานใหม่และการประเมินภาคปฏิบัติตามมาตรฐานของ Section',exam:'ข้อสอบพนักงานใหม่ของ Section'});
 function load(ctx,employee,force=false){
  const personal=personalContext(ctx,employee),old=states.get(personal.key);
  if(!force&&(old?.loaded||old?.request))return old?.request||Promise.resolve(old);
  const state={loaded:false,rows:old?.rows||{},revision:(old?.revision||0)+1,error:''};states.set(personal.key,state);
  const request=service().readTrainingValue(ROOT+'/'+personal.year+'/'+personal.sectionKey).then(value=>{state.rows=value?.NEW||{};state.loaded=true;state.error='';}).catch(error=>{state.error=error.message;}).finally(()=>{state.request=null;state.revision++;mount();});state.request=request;return request;
 }
 async function viewWholeCourse(ctx,employee){
  const host=currentHost(ctx,employee);if(!host)return;
  const course=await window.PPMSNewEmployeeCourse.prepare(ctx,{force:true}),personal=personalContext(ctx,employee),record=await service().readTrainingRecord(personal,'NEW','bundle');
  if(!currentHost(ctx,employee))return;
  if(record&&!(record.attendeeIds||[]).map(String).includes(String(employee.id)))throw Error(t('หลักฐานเดิมไม่ตรงกับพนักงานที่เลือก','Stored evidence belongs to a different employee'));
  showRecord(ctx,employee,{index:'bundle',title:course.deck.source.topic,detail:course.topics.map(topic=>topic.title).join(' • ')},record);
 }
 function showRecord(ctx,employee,item,record){
  const overlay=document.createElement('div');overlay.className='exam-detail-overlay exam-topic-overlay';
  overlay.innerHTML='<section class="exam-training-topic-viewer" role="dialog" aria-modal="true"><div class="exam-viewer-head"><div><span class="exam-viewer-quarter">'+t('พนักงานใหม่','New employee')+'</span><h2>'+esc(item.title)+'</h2><p>'+esc(employee.id)+' · '+esc(employee.thaiName||employee.name)+' · '+esc(ctx.section)+'</p></div><button type="button" data-new-close>'+t('ปิด','Close')+'</button></div><p>'+esc(item.detail)+'</p>'+(record?'<div class="training-record-panel"><h3>'+t('ผลการอบรม','Training record')+'</h3><p>'+esc(record.trainingDate)+' · '+esc(record.trainingTime)+' · '+esc(record.trainingPlace)+'<br>'+t('ผู้สอน: ','Trainer: ')+esc(record.trainer)+'</p><p>'+esc(record.effect)+'</p>'+service().evidenceHtml(record.evidence||[])+'</div>':'<p class="modal-note">'+t('รออบรม · ยังไม่มีผลการอบรมที่บันทึกไว้','Waiting for training · No saved training record')+'</p>')+'<div class="actions"><button type="button" data-new-slides>'+t('สไลด์อบรมพนักงานใหม่','New employee training slides')+'</button><button type="button" data-new-signature>'+t('พิมพ์ใบลงชื่ออบรม','Print training attendance sheet')+'</button></div></section>';
  overlay.querySelector('[data-new-close]').onclick=()=>overlay.remove();overlay.onclick=event=>{if(event.target===overlay)overlay.remove()};
  const input={ctx,q:'NEW',quarter:quarterOf(requiredTopics(ctx.section)),item,record:record||{}};
  overlay.querySelector('[data-new-slides]').onclick=async event=>{try{await window.PPMSNewEmployeeCourse.open(ctx,employee,event.currentTarget)}catch(error){alert(error.message)}};
  overlay.querySelector('[data-new-signature]').onclick=event=>window.PPMSTrainingSignatureForm?.open(input,event.currentTarget);
  document.body.append(overlay);
 }
 async function recordWholeCourse(ctx,employee){
  const host=currentHost(ctx,employee);if(!host||!service().isAdmin())return;
  const status=host.querySelector('[data-new-employee-sync]');status.textContent='กำลังโหลดหลักสูตรและผลอบรม…';
  try{
   const course=await window.PPMSNewEmployeeCourse.prepare(ctx,{force:true}),personal=personalContext(ctx,employee),record=await service().readTrainingRecord(personal,'NEW','bundle');
   if(!currentHost(ctx,employee))return;
   if(record&&!(record.attendeeIds||[]).map(String).includes(String(employee.id)))throw Error('หลักฐานเดิมไม่ตรงกับพนักงานที่เลือก');
   if(!employee.startDate)throw Error('กรุณาระบุวันที่เริ่มงานในข้อมูลพนักงานก่อนบันทึกอบรม');
   status.textContent='';const item={index:'bundle',title:course.deck.source.topic,detail:course.topics.map(topic=>topic.title).join(' • ')};
   service().openTrainingRecordEditor(personal,'NEW',quarterOf(course.topics),'bundle',item,record,value=>{const state=states.get(personal.key)||{loaded:true,rows:{},revision:0};state.rows.bundle=service().summaryOf(value);state.loaded=true;state.error='';state.revision++;states.set(personal.key,state);mount()},{employee,trainingCourse:course.snapshot});
  }catch(error){if(currentHost(ctx,employee))status.textContent=error.message}
 }
 function mount(){
  const api=service(),quarterHost=document.getElementById('examPlanDetailsV592'),ctx=quarterHost?.__trainingContext;
  if(!api||!ctx||!window.PPMS_RUNTIME?.monthReportContext?.().allowed){document.getElementById('newEmployeeTrainingV974')?.remove();return}
  let host=document.getElementById('newEmployeeTrainingV974');if(host?.__ctx?.key!==ctx.key){host?.remove();host=document.createElement('section');host.id='newEmployeeTrainingV974';host.className='new-employee-training-v974';host.__ctx=ctx;quarterHost.before(host)}
  const people=api.roster(ctx).sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||''))||String(a.id).localeCompare(String(b.id))),selected=get(selectionKey(ctx)),employee=people.find(person=>String(person.id)===selected),course=window.PPMSNewEmployeeCourse?.current(ctx),topics=course?course.topics:requiredTopics(ctx.section),personal=employee&&personalContext(ctx,employee),state=personal&&states.get(personal.key),result=employee&&resultFor(ctx,employee),opened=get(openKey(ctx))==='1';
  const signature=JSON.stringify([ctx.key,opened,selected,people.map(person=>[person.id,person.name,person.thaiName,person.startDate]),state?.revision,state?.loaded,state?.error,course?.revision,window.PPMSNewEmployeeCourse?.error(ctx),result?[result.id||result.recordKey||'',result.date||result.createdAt]:null,language(),api.isAdmin()]);if(host.dataset.viewSignature===signature)return;host.dataset.viewSignature=signature;
  const bundle=state?.rows?.bundle,whole=api.trainingDone(bundle)&&(!course||bundle.courseRevision===course.revision)&&topics.every(item=>(bundle.courseTopics||[]).includes(item.title));
  const trained=whole?topics.length:topics.filter(item=>state?.rows?.[item.index]?.topic===item.title&&api.trainingDone(state.rows[item.index])).length;
  const overall=!state?.loaded?(state?.error?t('ยังตรวจสอบสถานะไม่ได้','Status unavailable'):t('กำลังตรวจสอบสถานะ','Checking status')):trained!==topics.length?t('รออบรม','Waiting for training'):result?t('อบรมและสอบครบแล้ว','Training and exam completed'):t('รอสอบ','Waiting for exam');
  host.innerHTML='<details '+(opened?'open':'')+' data-new-employee-details><summary><b>'+t('แผนอบรมพื้นฐานพนักงานใหม่','New employee fundamentals')+'</b><span>'+esc(ctx.section)+'</span></summary><div class="ne-body"><p>'+t('เลือกพนักงานเพื่อดูหลักสูตรอบรมพื้นฐานของ Section และบันทึกผลอบรมรวมเป็นรายคน','Select an employee to view their Section’s combined fundamentals course and individual training progress.')+'</p><label class="ne-select-label">'+t('เลือกพนักงานใหม่','Select employee')+'<select data-new-employee-select><option value="">'+t('— เลือกพนักงาน —','— Select employee —')+'</option>'+people.map(person=>'<option value="'+esc(person.id)+'" '+(String(person.id)===selected?'selected':'')+'>'+esc(person.id)+' · '+esc(person.thaiName||person.name)+' · '+esc(person.startDate||t('ยังไม่ระบุวันเริ่มงาน','Start date missing'))+'</option>').join('')+'</select></label>'+(employee?'<div class="ne-person"><b>'+esc(employee.id)+' · '+esc(employee.thaiName||employee.name)+'</b><span>'+t('เริ่มงาน ','Start date: ')+esc(employee.startDate||'—')+' · '+esc(ctx.section)+'</span><strong data-new-employee-overall data-status="'+(!state?.loaded?'checking':trained!==topics.length?'waiting-training':result?'completed':'waiting-exam')+'">'+esc(overall)+'</strong><span>'+t('อบรมพื้นฐานแล้ว ','Fundamentals completed: ')+trained+' / '+topics.length+' '+t('หัวข้อ','topics')+' · '+t('ข้อสอบพนักงานใหม่: ','New employee exam: ')+(result?t('สอบแล้ว','Completed'):t('รอสอบ','Waiting for exam'))+'</span></div>':'')+'<p data-new-employee-sync role="status">'+esc(state?.error||window.PPMSNewEmployeeCourse?.error(ctx)||'')+'</p>'+(employee?'<div class="actions ne-course-actions"><button type="button" data-new-course-open>สไลด์อบรมพนักงานใหม่</button><button type="button" class="secondary" data-new-course-download>ดาวน์โหลดสไลด์รวม</button><button type="button" class="secondary" data-new-course-view>'+t('หลักฐาน / ใบลงชื่อ','Evidence / attendance sheet')+'</button><button type="button" class="secondary" data-new-course-exam>ไปหน้าสอบ (ระบบเดิม)</button>'+(api.isAdmin()?'<button type="button" data-new-course-record>บันทึกอบรมครบหลักสูตร</button>':'')+'<button type="button" class="secondary" data-new-employee-refresh>'+t('อัปเดตสถานะ','Refresh status')+'</button></div>':'')+'</div></details>';
  host.querySelector('[data-new-employee-details]').ontoggle=event=>{put(openKey(ctx),event.target.open?'1':'0');if(event.target.open&&employee&&!state?.loaded&&!state?.request&&!state?.error)void load(ctx,employee)};
  host.querySelector('[data-new-employee-select]').onchange=event=>{put(selectionKey(ctx),event.target.value);mount();const person=currentPerson(ctx,event.target.value);if(person)void load(ctx,person)};
  for(const button of host.querySelectorAll('[data-new-course-open],[data-new-course-download],[data-new-course-exam],[data-new-course-record],[data-new-course-view]'))button.onclick=async()=>{
   const status=host.querySelector('[data-new-employee-sync]');button.disabled=true;status.textContent='กำลังเตรียมหลักสูตร…';
   try{if(button.hasAttribute('data-new-course-open'))await window.PPMSNewEmployeeCourse.open(ctx,employee,button);else if(button.hasAttribute('data-new-course-download'))await window.PPMSNewEmployeeCourse.download(ctx);else if(button.hasAttribute('data-new-course-record'))await recordWholeCourse(ctx,employee);else if(button.hasAttribute('data-new-course-view'))await viewWholeCourse(ctx,employee);else window.PPMSNewEmployeeCourse.examEntry(employee);if(status.isConnected&&!button.hasAttribute('data-new-course-record'))status.textContent='';}catch(error){if(status.isConnected)status.textContent=error.message}finally{button.disabled=false}
  };
  const refresh=host.querySelector('[data-new-employee-refresh]');if(refresh)refresh.onclick=()=>{void load(ctx,employee,true);mount()};
  if(opened&&employee&&window.PPMSNewEmployeeCourse&&!course&&!window.PPMSNewEmployeeCourse.error(ctx))void window.PPMSNewEmployeeCourse.prepare(ctx).catch(()=>mount());
  if(opened&&employee&&!state?.loaded&&!state?.request&&!state?.error){void load(ctx,employee);mount()}
 }
 const init=()=>{const app=document.getElementById('app');if(app)new MutationObserver(()=>{clearTimeout(window.__newEmployeeTrainingMount);window.__newEmployeeTrainingMount=setTimeout(mount,60)}).observe(app,{childList:true,subtree:true});mount()};
 for(const event of ['ppms-quarterly-exams-changed','ppms-exam-result-confirmed','ppms-new-employee-course-changed','ppms-employees-changed','ppms-language-changed'])window.addEventListener(event,mount);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.PPMSNewEmployeeTraining={requiredTopics,personalContext,resultFor,stateOf,mount};
})();
