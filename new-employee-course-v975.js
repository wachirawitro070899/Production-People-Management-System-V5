/* One concise published course supplies both slides and the existing new-employee exam. */
(()=>{'use strict';
 const courses=new Map(),jobs=new Map(),errors=new Map();
 const service=()=>window.PPMSTrainingPlanService,esc=value=>service().esc(value),copy=value=>JSON.parse(JSON.stringify(value));
 const hash=value=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};
 const key=input=>service().trainingContext(input).key;
 const title=section=>'อบรมพื้นฐานพนักงานใหม่ — '+section;
 function buildBase(input){
  const ctx=service().trainingContext(input),topics=window.PPMSNewEmployeeTraining.requiredTopics(ctx.section);
  if(!topics.length||topics.length>22)throw Error('หลักสูตรต้องมีหัวข้ออบรม และรวมทั้งหมดไม่เกิน 25 สไลด์');
  const quarter={method:'สรุปพื้นฐาน Section + สาธิตหน้างาน + OJT + สอบพนักงานใหม่ในระบบเดิม',criteria:'อบรมครบทุกหัวข้อ และประเมินด้วยข้อสอบพนักงานใหม่ในระบบเดิม'};
  const built=topics.map(item=>window.PPMSTrainingLessons.build({ctx,q:'NEW',quarter,item})),deck=copy(built[0]);
  deck.source={...deck.source,topic:title(ctx.section),index:0,detail:topics.map(topic=>topic.title+' — '+topic.detail).join('\n'),quarter:'NEW',method:quarter.method,criteria:quarter.criteria};
  deck.references=[...new Map(built.flatMap(value=>value.references).map(ref=>[ref.url,ref])).values()];
  deck.pages=[{type:'cover',title:title(ctx.section),kicker:'หลักสูตรพนักงานใหม่',lead:'สรุปทุกหัวข้อในชุดเดียว • อบรมแล้วเข้าสอบในระบบเดิม',points:['ความปลอดภัยและพื้นฐานการทำงานของ Section','มาตรฐานงาน จุดตรวจคุณภาพ และการตอบสนองเมื่อผิดปกติ','ฝึกปฏิบัติร่วมกับผู้สอน แล้วประเมินด้วยข้อสอบที่อิงเนื้อหาชุดนี้']},...topics.map((topic,i)=>({type:'list',title:topic.title,kicker:topic.title,lead:topic.detail,points:[...built[i].pages[3].points.slice(0,2),...built[i].pages[4].points.slice(0,2)],family:built[i].family,topicIndex:topic.index,callout:'ฝึกกับ WI / Q-Point และตัวอย่างจริงของ '+ctx.section})),{type:'practice',title:'ฝึกปฏิบัติร่วมกับผู้สอน',kicker:'OJT และการยืนยันความเข้าใจ',points:['ผู้สอนสาธิตงานตาม WI / Q-Point ของสถานีที่รับผิดชอบ','พนักงานฝึกปฏิบัติและอธิบายจุดสำคัญในแต่ละหัวข้อ','ประเมิน Critical Step และวิธีรับมือเมื่อพบความผิดปกติ','ยืนยันและบันทึกผลการอบรม แล้วเข้าสอบพนักงานใหม่ในระบบเดิม']},{type:'summary',title:'สรุปก่อนเข้าสอบพนักงานใหม่',kicker:'ทบทวนและประเมินผล',points:['ทบทวนหัวข้อพื้นฐานและจุดควบคุมของ Section','ยืนยันว่าเข้าใจและปฏิบัติงานตามมาตรฐานได้','เข้าระบบสอบเดิม เลือกประเภทพนักงานเริ่มงานใหม่'],method:quarter.method,criteria:quarter.criteria}];
  return {ctx,deck,input:{ctx,q:'NEW',quarter,item:{index:0,title:deck.source.topic,detail:deck.source.detail}}};
 }
 function compile(base,record){
  const deck=copy(base.deck);if(record){if(record.topic!==deck.source.topic)throw Error('ชื่อหลักสูตรไม่ตรงกับสไลด์ที่บันทึกไว้');deck.pages=window.PPMSTrainingLessonEditor.sanitizePages(record.pages,deck.pages)}
  const revision=hash(JSON.stringify([base.ctx.scope,base.ctx.section,deck.pages]));
  const topics=deck.pages.filter(page=>Number.isInteger(page.topicIndex)).map(page=>({index:page.topicIndex,title:page.title,detail:[page.lead,...page.points].filter(Boolean).join('\n'),facts:[page.lead,...page.points].map(value=>String(value||'').trim()).filter(Boolean)}));
  const snapshot={kind:'new-employee-course',section:base.ctx.section,year:base.ctx.year,quarter:'NEW',organizationDivision:base.ctx.scope.division,organizationPlant:base.ctx.scope.plant,revision,slideCount:deck.pages.length,topics:topics.map(({facts,...topic})=>topic),method:base.input.quarter.method,criteria:base.input.quarter.criteria};
  return {...base,deck,topics,snapshot,revision,at:Date.now(),path:window.PPMSTrainingLessonEditor.identity(base.input)};
 }
 async function prepare(input,{force=false}={}){
  const k=key(input);if(!force&&ready(input))return courses.get(k);if(jobs.has(k))return jobs.get(k);
  const base=buildBase(input),path=window.PPMSTrainingLessonEditor.identity(base.input);
  const job=service().readTrainingValue(path).then(record=>{const value=compile(base,record);courses.set(k,value);errors.delete(k);window.dispatchEvent(new Event('ppms-new-employee-course-changed'));return value}).catch(error=>{errors.set(k,error.message);throw error}).finally(()=>jobs.delete(k));jobs.set(k,job);return job;
 }
 function ready(input){const value=courses.get(key(input));return !!value&&Date.now()-value.at<60000}
 function snapshot(input){return courses.has(key(input))?copy(courses.get(key(input)).snapshot):null}
 function questions(input,bank=[]){
  const course=courses.get(key(input));if(!course)throw Error('กรุณาโหลดสไลด์หลักสูตรพนักงานใหม่ก่อนเข้าสอบ');
  const count=Number(input.count)||40,used=new Set();
  return Array.from({length:count},(_,i)=>{
   const topic=course.topics[i%course.topics.length],saved=bank.find(q=>q.trainingPlanRevision===course.revision&&Number(q.trainingTopicIndex)===topic.index&&Array.isArray(q.options)&&q.options.length===4&&Number.isInteger(Number(q.correct))&&Number(q.correct)>=0&&Number(q.correct)<4&&!used.has(q.text));
   if(saved){used.add(saved.text);return {...copy(saved),trainingTopic:topic.title,trainingTopicIndex:topic.index,trainingPlanRevision:course.revision}}
   const position=Math.floor(i/course.topics.length),factIndex=position%topic.facts.length,fact=topic.facts[factIndex];
   const prompts=['สาระสำคัญที่ต้องเข้าใจ','แนวทางปฏิบัติประเด็นที่ 1','แนวทางปฏิบัติประเด็นที่ 2','จุดตรวจยืนยันประเด็นที่ 1','จุดตรวจยืนยันประเด็นที่ 2'];
   const options=[fact,'ข้ามขั้นตอนที่กำหนดเพื่อให้งานเสร็จเร็วขึ้น','ใช้วิธีเดิมโดยไม่ตรวจ WI / Q-Point หรือยืนยันกับผู้สอน','ทำงานต่อเมื่อพบความผิดปกติ โดยไม่แยกงานและไม่แจ้งผู้รับผิดชอบ'];
   const shift=parseInt(hash([input.section,input.setName,i,course.revision].join('|')),16)%4;
   return {id:'new-course-'+course.revision+'-'+(input.setName||'A')+'-'+i,text:'ตามสไลด์ “'+topic.title+'” '+prompts[factIndex]+' คือข้อใด?',skill:topic.title,level:Number(input.level)||1,options:options.map((_,j)=>options[(j+shift)%4]),correct:(4-shift)%4,explanation:fact,source:'new-employee-course',trainingTopic:topic.title,trainingTopicIndex:topic.index,trainingPlanRevision:course.revision};
  });
 }
 function loadingMarkup(input){return '<section class="panel" data-new-course-loading data-context="'+esc(JSON.stringify(input))+'"><h3>ข้อสอบพนักงานใหม่อิงสไลด์อบรมของ Section</h3><p role="status">กำลังโหลดหลักสูตรเดียวกับสไลด์อบรม…</p><button type="button" disabled>ลองโหลดหลักสูตรอีกครั้ง</button></section>'}
 function mountLoading(){for(const root of document.querySelectorAll('[data-new-course-loading]')){if(root.dataset.mounted)continue;root.dataset.mounted='1';const input=JSON.parse(root.dataset.context),status=root.querySelector('[role=status]'),button=root.querySelector('button');const run=async()=>{button.disabled=true;status.textContent='กำลังโหลดหลักสูตรเดียวกับสไลด์อบรม…';try{await prepare(input,{force:true});if(root.isConnected)window.PPMS_RUNTIME?.refreshQuarterlyExamPage?.()}catch(error){if(root.isConnected){status.textContent='โหลดหลักสูตรไม่สำเร็จ: '+error.message;button.disabled=false}}};button.onclick=run;void run()}}
 const fileName=course=>('อบรมพื้นฐานพนักงานใหม่_'+course.ctx.section+'_'+course.ctx.year).replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');
 async function download(input){const course=await prepare(input,{force:true}),html=window.PPMSTrainingLessons.printMarkup(course.deck),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=fileName(course)+'.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function examEntry(employee){
  const nav=document.querySelector('#nav [data-page="exam"]');if(!nav)throw Error('กรุณาเปิดระบบสอบพนักงานใหม่จากเมนูระบบสอบ');
  sessionStorage.removeItem('examEmp');sessionStorage.setItem('employeeExamType','new_employee');nav.click();
  const form=document.querySelector('[data-exam-entry-type="new_employee"]');if(form){form.elements.employeeCode.value=String(employee.id);form.scrollIntoView({block:'center'});form.elements.employeeCode.focus()}
 }
 async function open(input,employee,trigger){
  const course=await prepare(input,{force:true}),view=window.PPMSTrainingLessons.open({...course.input,preparedDeck:course.deck},trigger);
  const toolbar=view.overlay.querySelector('.tl-toolbar-actions');
  const downloadButton=document.createElement('button');downloadButton.type='button';downloadButton.className='tl-button';downloadButton.textContent='ดาวน์โหลดสไลด์รวม';downloadButton.onclick=()=>{const html=window.PPMSTrainingLessons.printMarkup(view.deck),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=fileName(course)+'.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};toolbar.prepend(downloadButton);
  if(employee){const exam=document.createElement('button');exam.type='button';exam.className='tl-button tl-primary';exam.textContent='ไปหน้าสอบพนักงานใหม่ (ระบบเดิม)';exam.onclick=()=>{if(view.close()!==false)examEntry(employee)};toolbar.prepend(exam)}
  return view;
 }
 function invalidate(input){courses.delete(key(input));errors.delete(key(input))}
 window.addEventListener('ppms-training-lesson-saved',event=>{for(const[k,course]of courses){if(course.path===event.detail?.path){courses.set(k,compile(course,event.detail.record));window.dispatchEvent(new Event('ppms-new-employee-course-changed'))}}});
 const init=()=>{const app=document.getElementById('app');if(app)new MutationObserver(()=>{clearTimeout(window.__newCourseLoading);window.__newCourseLoading=setTimeout(mountLoading,40)}).observe(app,{childList:true,subtree:true});mountLoading()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.PPMSNewEmployeeCourse={buildBase,prepare,ready,snapshot,questions,loadingMarkup,open,download,examEntry,invalidate,current:input=>courses.get(key(input)),error:input=>errors.get(key(input))||''};
})();
