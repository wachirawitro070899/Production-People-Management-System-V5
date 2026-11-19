/* Quarterly exams follow the saved training plan. Attempt snapshots never change while answering. */
(()=>{
 'use strict';
 const service=window.PPMSTrainingPlanService;if(!service)return;
 const {trainingContext,trainingItems,defaults,readTrainingValue,esc}=service;
 const plans=new Map(),jobs=new Map(),notices=new Map(),noticeJobs=new Map();
 const hash=value=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16);};
 const normalize=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9ก-๙]+/g,' ').trim();
 const key=input=>{const ctx=trainingContext(input);return ctx.key+'__'+input.quarter;};
 const revision=plan=>hash(JSON.stringify([plan.training||'',plan.exam||'',plan.method||'',plan.criteria||'']));
 const tags=[
  ['safety',/safety|ppe|ความปลอดภัย|ฉุกเฉิน|emergency|loto/i],['5s',/5s|5ส|สะสาง|สะดวก|สะอาด/i],
  ['quality',/quality|q.point|defect|sample|visual|inspection|ตรวจสอบ|เกณฑ์|คุณภาพ|งานเสีย|\bng\b/i],
  ['measurement',/measurement|เครื่องมือวัด|drawing|specification|tolerance|dimension|วัด|มิติ/i],
  ['traceability',/traceability|lot|label|fifo|material|packing|สอบย้อน|ปะปน|บรรจุ/i],
  ['record',/record|erp|oee|บันทึก|เอกสาร|document/i],['process',/machine|parameter|setup|setting|pre.start|first.piece|\bwi\b|\bsop\b|กระบวนการ|ตั้งเครื่อง|ชิ้นแรก|ปฏิบัติงาน/i],
  ['maintenance',/maintenance|repair|\bpm\b|แม่พิมพ์|ซ่อม|electrical|mechanical|spare/i],['problem',/problem|root.cause|5.why|fishbone|corrective|preventive|ปรับปรุง|สาเหตุ|แก้ไข|ป้องกันซ้ำ/i],
  ['training',/training|ojt|coaching|skill|lesson|ฝึก|ทักษะ|สอน/i]
 ];
 const classify=value=>new Set(tags.filter(([,pattern])=>pattern.test(value)).map(([tag])=>tag));
 function match(q,topic,planRevision){
  if(q.trainingPlanRevision){return q.trainingPlanRevision===planRevision&&Number(q.trainingTopicIndex)===topic.index?100:0;}
  const title=normalize(topic.title),skill=normalize(q.skill),text=normalize(q.text);
  if(skill&&title.includes(skill))return 40;
  if(title.length>3&&text.includes(title))return 35;
  const wanted=classify(topic.title),candidate=classify(q.skill||q.text);
  // Use bank questions only when their saved skill belongs to this training topic.
  return [...wanted].some(tag=>candidate.has(tag))?10:0;
 }
 function snapshot(input){const state=plans.get(key(input));return state?JSON.parse(JSON.stringify(state.snapshot)):null;}
 async function prepare(input){
  const k=key(input);if(plans.has(k))return plans.get(k);if(jobs.has(k))return jobs.get(k);
  const ctx=trainingContext(input);
  const job=readTrainingValue('ppmsExamPlanDetails/'+ctx.year+'/'+ctx.sectionKey).then(data=>{
   const saved=data?.[input.quarter],plan=saved||defaults(ctx.section)[input.quarter];
   if(!plan)throw Error('ไม่พบแผนอบรมสำหรับไตรมาสนี้');
   const topics=trainingItems(plan.training);if(!topics.length)throw Error('กรุณากำหนดหัวข้ออบรมก่อนออกข้อสอบ');
   const state={ctx,quarter:input.quarter,plan,topics,snapshot:{section:ctx.section,year:ctx.year,quarter:input.quarter,organizationDivision:ctx.scope.division,organizationPlant:ctx.scope.plant,revision:revision(plan),source:saved?'saved-plan':'suggested-plan',topics:topics.map(t=>({index:t.index,title:t.title,detail:t.detail})),method:plan.method||'',criteria:plan.criteria||''}};
   plans.set(k,state);return state;
  }).finally(()=>jobs.delete(k));jobs.set(k,job);return job;
 }
 function planQuestion(topic,input,index,planRevision){
  const detail=topic.detail||topic.title,variant=index%3;
  const prompts=[`ตามแผนอบรม ${input.quarter} หัวข้อ “${topic.title}” จุดควบคุมหรือวิธีปฏิบัติที่กำหนดคือข้อใด?`,`การปฏิบัติงานข้อใดสอดคล้องกับเนื้อหาอบรม ${input.quarter} หัวข้อ “${topic.title}”?`,`เมื่อต้องยืนยันความเข้าใจเรื่อง “${topic.title}” ตามแผน ${input.quarter} ควรอ้างอิงข้อใด?`];
  const choices=[detail,'ข้ามจุดควบคุมที่กำหนดเพื่อทำงานให้เร็วขึ้น','ใช้วิธีตามความเคยชินโดยไม่ตรวจมาตรฐานที่กำหนด','ดำเนินงานต่อโดยไม่บันทึกหรือแจ้งเมื่อพบความผิดปกติ'];
  const shift=parseInt(hash([input.section,input.quarter,input.setName,index,planRevision].join('|')),16)%4;
  return {id:'training-'+planRevision+'-'+input.setName+'-'+index,skill:topic.title,level:Number(input.level)||1,text:prompts[variant],options:choices.map((_,i)=>choices[(i+shift)%4]),correct:(4-shift)%4,explanation:detail,source:'training-plan'};
 }
 function questions(input,bank,pool=[]){
  const state=plans.get(key(input));if(!state)throw Error('ยังโหลดแผนอบรมไม่สำเร็จ');
  const {topics}=state,rev=state.snapshot.revision,count=Number(input.count)||20,used=new Set();
  const candidates=[...(bank||[]),...pool].filter(q=>q&&q.text&&Array.isArray(q.options)&&q.options.length===4&&Number.isInteger(Number(q.correct))&&Number(q.correct)>=0&&Number(q.correct)<4);
  return Array.from({length:count},(_,i)=>{
   const topic=topics[i%topics.length],matches=candidates.filter(q=>!used.has(normalize(q.text))).map(q=>({q,score:match(q,topic,rev)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||parseInt(hash(input.setName+'|'+a.q.text),16)-parseInt(hash(input.setName+'|'+b.q.text),16));
   let q=matches[0]?.q;if(q){used.add(normalize(q.text));q={...q,options:[...q.options]};}else q=planQuestion(topic,input,i,rev);
   return {...q,trainingTopicIndex:topic.index,trainingTopic:topic.title,trainingPlanRevision:rev};
  });
 }
 function loadingMarkup(input){return '<section class="panel" data-quarter-exam-loading data-context="'+esc(JSON.stringify(input))+'"><h3>ข้อสอบอิงแผนอบรม '+esc(input.quarter)+'</h3><p role="status">กำลังโหลดแผนอบรมล่าสุด...</p><button type="button" disabled>ลองโหลดแผนอบรมใหม่</button></section>';}
 function mountLoading(){for(const root of document.querySelectorAll('[data-quarter-exam-loading]')){
  if(root.dataset.mounted)return;root.dataset.mounted='1';const input=JSON.parse(root.dataset.context),button=root.querySelector('button'),status=root.querySelector('[role="status"]');
  const run=async()=>{button.disabled=true;status.textContent='กำลังโหลดแผนอบรมล่าสุด...';try{await prepare(input);if(root.isConnected)window.PPMS_RUNTIME?.refreshQuarterlyExamPage?.();}catch(error){if(root.isConnected){status.textContent='โหลดแผนอบรมไม่สำเร็จ: '+error.message;button.disabled=false;}}};button.onclick=run;void run();
 }}
 function noticeRows(ctx){
  const runtime=window.PPMS_RUNTIME?.monthReportContext?.();if(!runtime?.allowed)return [];
  const deleted=new Set(runtime.deletedExamKeys||[]);
  return Object.values(notices.get(ctx.key)?.data||{}).flatMap(group=>Object.values(group||{})).filter(r=>r&&r.year===ctx.year&&r.section===ctx.section&&!deleted.has(r.recordKey)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 }
 function seenKey(ctx){const actor=window.PPMS_RUNTIME?.monthReportContext?.().actorId||'admin';return 'ppms_training_exam_seen_v963::'+actor+'::'+ctx.key;}
 function seen(ctx){try{return new Set(JSON.parse(localStorage.getItem(seenKey(ctx))||'[]'));}catch{return new Set();}}
 function paintNotices(ctx){
  const host=document.getElementById('examPlanDetailsV592');if(!host||host.__trainingContext?.key!==ctx.key)return;
  let slot=host.querySelector('[data-training-exam-notices]');if(!slot){slot=document.createElement('section');slot.setAttribute('data-training-exam-notices','');slot.setAttribute('role','status');slot.setAttribute('aria-live','polite');host.querySelector('.exam-detail-title').after(slot);}
  const rows=noticeRows(ctx),known=seen(ctx),unread=rows.filter(r=>!known.has(r.resultId));
  const signature=hash(JSON.stringify([rows,Array.from(known),notices.get(ctx.key)?.error||'']));if(slot.dataset.signature===signature)return;slot.dataset.signature=signature;
  const error=notices.get(ctx.key)?.error;
  slot.innerHTML='<div style="padding:12px;margin:10px 0;border:1px solid #b9d8cd;border-radius:9px;background:#effbf5;color:#14543c"><b>'+(unread.length?'แจ้งเตือน: มีพนักงานสอบเสร็จแล้ว '+unread.length+' รายการใหม่':'แจ้งเตือนผลสอบประจำไตรมาส')+'</b>'+(rows.length?'<ul>'+rows.slice(0,5).map(r=>'<li>'+esc(r.employeeId)+' · '+esc(r.employeeName||'')+' · '+esc(r.quarter)+' · สอบเสร็จแล้ว · '+esc(r.score)+'% · '+esc(r.forcedExit?'ส่งอัตโนมัติ':r.approvalStatus==='pending'?'รออนุมัติ':Number(r.score)>=80?'ผ่าน':'ไม่ผ่าน')+'</li>').join('')+'</ul>':'<p>ยังไม่มีการแจ้งเตือนผลสอบใหม่</p>')+(unread.length?'<button type="button" data-training-exams-seen>รับทราบผลสอบ</button>':'')+(error?'<p>'+esc(error)+'</p>':'')+'</div>';
  const button=slot.querySelector('[data-training-exams-seen]');if(button)button.onclick=()=>{try{localStorage.setItem(seenKey(ctx),JSON.stringify([...new Set([...known,...rows.map(r=>r.resultId)])].slice(-2000)));paintNotices(ctx);}catch{button.textContent='ยังบันทึกการรับทราบไม่ได้';}};
 }
 async function refreshNotices(ctx){
  if(noticeJobs.has(ctx.key))return noticeJobs.get(ctx.key);
  const runtime=window.PPMS_RUNTIME?.monthReportContext?.();if(!runtime?.allowed)return;
  const job=readTrainingValue('ppms/trainingExamNotifications/'+ctx.year+'/'+ctx.sectionKey).then(data=>{
   notices.set(ctx.key,{data:data||{},at:Date.now()});paintNotices(ctx);window.dispatchEvent(new Event('ppms-quarterly-exams-changed'));
  }).catch(()=>{const old=notices.get(ctx.key)||{data:{}};notices.set(ctx.key,{...old,at:Date.now(),error:'ยังตรวจแจ้งเตือนล่าสุดไม่ได้ กดอัปเดตสถานะเพื่อลองใหม่'});paintNotices(ctx);}).finally(()=>noticeJobs.delete(ctx.key));noticeJobs.set(ctx.key,job);return job;
 }
 function mount(){mountLoading();const host=document.getElementById('examPlanDetailsV592'),ctx=host?.__trainingContext;if(!ctx)return;paintNotices(ctx);if(!notices.has(ctx.key)||Date.now()-(notices.get(ctx.key).at||0)>15000)void refreshNotices(ctx);}
 const observer=new MutationObserver(()=>{clearTimeout(window.__quarterlyTrainingExamMount);window.__quarterlyTrainingExamMount=setTimeout(mount,60);});
 const init=()=>{const app=document.getElementById('app');if(app)observer.observe(app,{subtree:true,childList:true});mount();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 setInterval(()=>{const host=document.getElementById('examPlanDetailsV592');if(host?.__trainingContext&&navigator.onLine!==false&&document.visibilityState!=='hidden')void refreshNotices(host.__trainingContext);},15000);
 window.addEventListener('ppms-exam-result-confirmed',()=>{const ctx=document.getElementById('examPlanDetailsV592')?.__trainingContext;if(ctx)void refreshNotices(ctx);});
 const invalidate=input=>{const prefix=trainingContext(input).key+'__';for(const k of plans.keys())if(k.startsWith(prefix))plans.delete(k);};
 window.PPMSQuarterlyTraining={prepare,ready:input=>plans.has(key(input)),questions,snapshot,revision,loadingMarkup,mount,refreshNotices,notifications:noticeRows,invalidate};
})();
