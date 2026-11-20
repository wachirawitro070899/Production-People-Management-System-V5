/* Per-topic slide content. Published edits use conditional writes; drafts remain local to their author. */
(()=>{
 'use strict';
 const ROOT='ppmsTrainingLessonDecks',CACHE='ppms_training_lesson_cache_v1:',DRAFT='ppms_training_lesson_draft_v1:';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const copy=value=>JSON.parse(JSON.stringify(value));
 const canEdit=()=>{try{return sessionStorage.getItem('ppms_admin')==='1'&&window.PPMSAccess?.canEdit()!==false;}catch{return false;}};
 const safeKey=value=>btoa(unescape(encodeURIComponent(String(value)))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
 const safeImage=value=>typeof value==='string'&&value.length<=450000&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
 function identity(input){
  const ctx=window.PPMSTrainingPlanService?.trainingContext(input.ctx)||input.ctx;
  const scope=ctx.scope||{division:'Production Division',plant:'โรง 1'};
  const sectionKey=ctx.sectionKey||safeKey(scope.division+'::'+scope.plant+'::'+ctx.section);
  if(!ctx.section||!Number.isInteger(Number(ctx.year))||!/^(?:Q[1-4]|NEW)$/.test(input.q))throw Error('ข้อมูล Section หรือไตรมาสไม่ครบ');
  return ROOT+'/'+Number(ctx.year)+'/'+sectionKey+'/'+input.q+'/'+safeKey(String(input.item.index??0)+'::'+input.item.title);
 }
 function readLocal(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
 function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value));if(window.ppmsErrorGuard?.pendingStorageKeys?.().includes(key))throw Error('พื้นที่เก็บฉบับร่างเต็ม');}
 function sanitizePages(values,base){
  if(!Array.isArray(values)||values.length!==base.length||values.length>25)throw Error('จำนวนสไลด์ต้องครบตามหลักสูตร และไม่เกิน 25 สไลด์');
  const text=(value,max)=>String(value??'').slice(0,max);
  return base.map((page,i)=>{
   const value=values[i]||{},next=copy(page);
   for(const key of ['title','kicker','lead','callout','method','criteria','imageCaption'])if(Object.hasOwn(value,key))next[key]=text(value[key],key==='title'?180:key==='kicker'?100:1200);
   if(!next.title.trim())throw Error('กรุณาระบุชื่อสไลด์หน้า '+(i+1));
   if(page.points){if(!Array.isArray(value.points))throw Error('เนื้อหาสไลด์ไม่ถูกต้อง');next.points=value.points.slice(0,8).map(v=>text(v,700));}
   if(page.questions){if(!Array.isArray(value.questions)||!value.questions.length)throw Error('กรุณาระบุคำถามทบทวน');next.questions=value.questions.slice(0,5).map(v=>({question:text(v.question,600),answer:text(v.answer,1000)}));}
   if(value.image){if(!safeImage(value.image))throw Error('ภาพประกอบไม่ถูกต้อง กรุณาเลือกภาพ JPG PNG หรือ WebP ใหม่');next.image=value.image;}else delete next.image;
   return next;
  });
 }
 const revision=record=>record?.revision||null;
 async function request(path,options={},timeout=8000){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
  if(!base||navigator.onLine===false)throw Error('ยังไม่เชื่อมต่อฐานข้อมูล');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const response=await fetch(base+'/'+path+'.json',{...options,cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Object.assign(Error(response.status===412?'มีฉบับใหม่จากเครื่องอื่น กรุณาโหลดฉบับล่าสุดก่อนบันทึก':response.status===401||response.status===403?'ไม่มีสิทธิ์บันทึกสไลด์ กรุณาตรวจสอบบัญชีผู้ใช้':'เชื่อมต่อสไลด์ไม่สำเร็จ ('+response.status+')'),{conflict:response.status===412});
   return {record:await response.json(),etag:response.headers.get('ETag')};
  }catch(error){if(error.name==='AbortError')throw Error('ยังไม่ได้รับการยืนยันจากฐานข้อมูล กรุณาลองอีกครั้ง');throw error;}finally{clearTimeout(timer);}
 }
 async function imageFromFile(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('เลือกไฟล์ JPG PNG หรือ WebP เท่านั้น');
  if(file.size>12*1024*1024)throw Error('ไฟล์ภาพต้องไม่เกิน 12 MB');
  const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('อ่านไฟล์ภาพไม่สำเร็จ'));reader.readAsDataURL(file);});
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('เปิดภาพไม่สำเร็จ'));img.src=src;});
  let width=Math.min(1000,image.naturalWidth),height=Math.round(image.naturalHeight*width/image.naturalWidth);
  if(height>1000){width=Math.round(width*1000/height);height=1000;}
  if(!width||!height)throw Error('ขนาดภาพไม่ถูกต้อง');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');
  if(!context)throw Error('เบราว์เซอร์ไม่รองรับการเตรียมภาพ');
  context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
  for(const quality of [.86,.72,.58,.44]){const data=canvas.toDataURL('image/jpeg',quality);if(safeImage(data))return data;}
  throw Error('ภาพมีรายละเอียดมากเกินไป กรุณาลดขนาดภาพก่อนแนบ');
 }
 function mount({deck,input,overlay,render,getIndex}){
  const path=identity(input),cacheKey=CACHE+path,actor=sessionStorage.getItem('ppms_admin_user')||'admin',draftKey=DRAFT+safeKey(actor)+':'+path,basePages=copy(deck.pages);
  let currentRevision=null,dirty=false,editing=false,displayed=-1,destroyed=false,busy=false,imageBusy=false,saveUncertain=false,saveId=null,draftTimer=0,saving=false;
  const toolbar=overlay.querySelector('.tl-toolbar-actions'),workspace=overlay.querySelector('.tl-workspace'),status=overlay.querySelector('[data-tl-status]'),print=overlay.querySelector('[data-tl-print]');
  const controls=document.createElement('div');controls.className='tl-editor-actions';
  controls.innerHTML=(canEdit()?'<button type="button" class="tl-button" data-tl-edit>แก้ไขสไลด์</button><button type="button" class="tl-button tl-primary" data-tl-save hidden>บันทึกสไลด์</button>':'')+'<button type="button" class="tl-button" data-tl-reload hidden>โหลดฉบับล่าสุด</button>';
  toolbar.prepend(controls);
  const panel=document.createElement('aside');panel.className='tl-editor';panel.hidden=true;panel.setAttribute('aria-label','แก้ไขสไลด์');workspace.append(panel);
  function say(text){if(!destroyed)status.textContent=text;}
  function apply(record){
   if(record&&record.topic!==input.item.title)throw Error('หัวข้อของฉบับที่บันทึกไม่ตรงกับแผน');
   deck.pages=record?sanitizePages(record.pages,basePages):copy(basePages);currentRevision=revision(record);render();
  }
  const cached=readLocal(cacheKey);if(cached)try{apply(cached);}catch{say('ฉบับในเครื่องไม่สมบูรณ์ กำลังโหลดฉบับล่าสุด');}
  function draft(){return {topic:input.item.title,expectedRevision:currentRevision,pages:copy(deck.pages),updatedAt:new Date().toISOString()};}
  function keepDraft(){
   try{writeLocal(draftKey,draft());return true;}catch{say('พื้นที่เก็บฉบับร่างเต็ม กรุณาบันทึกสไลด์ก่อนปิดหน้าต่าง');return false;}
  }
  function changed(){dirty=true;saveId=null;saveUncertain=false;render();clearTimeout(draftTimer);say('มีการแก้ไข · ยังไม่บันทึกส่วนกลาง');draftTimer=setTimeout(()=>{if(keepDraft())say('มีการแก้ไข · เก็บฉบับร่างในเครื่องแล้ว · กดบันทึกสไลด์เพื่อใช้ร่วมกัน');},250);}
  function field(label,name,value,{area=false,max=1200}={}){return '<label>'+esc(label)+(area?'<textarea name="'+name+'" maxlength="'+max+'" rows="3">'+esc(value)+'</textarea>':'<input name="'+name+'" maxlength="'+max+'" value="'+esc(value)+'">')+'</label>';}
  function showPanel(force=false){
   if(!editing||destroyed)return;
   const index=getIndex();if(!force&&displayed===index)return;displayed=index;const page=deck.pages[index];
   panel.innerHTML='<header><div><b>แก้ไขหน้า '+(index+1)+' / '+deck.pages.length+'</b><small>ดูตัวอย่างการแก้ไขในสไลด์</small></div><button type="button" data-editor-done>ดูสไลด์</button></header><form data-slide-form>'+field('หัวข้อสไลด์','title',page.title,{max:180})+field('ชื่อหัวข้อในสารบัญ','kicker',page.kicker,{max:100})+field('ข้อความนำ','lead',page.lead||'',{area:true})+
    (page.points?field('เนื้อหา (1 บรรทัดต่อข้อ สูงสุด 8 ข้อ)','points',page.points.join('\n'),{area:true,max:5600}):'')+
    (page.questions?'<fieldset><legend>คำถามทบทวน</legend>'+page.questions.map((qa,i)=>field('คำถามที่ '+(i+1),'question-'+i,qa.question,{area:true,max:600})+field('คำตอบที่ '+(i+1),'answer-'+i,qa.answer,{area:true,max:1000})).join('')+'</fieldset>':'')+
    field('ข้อความเน้น / ข้อควรจำ','callout',page.callout||'',{area:true})+(page.type==='summary'?field('วิธีอบรม','method',page.method||'',{area:true})+field('เกณฑ์ประเมิน','criteria',page.criteria||'',{area:true}):'')+
    '<fieldset><legend>ภาพประกอบหน้านี้</legend><label>เปลี่ยนภาพ (JPG PNG WebP)<input type="file" accept="image/jpeg,image/png,image/webp" data-slide-image></label><p class="tl-editor-help">ใช้ภาพเดียวต่อหน้า ระบบปรับขนาดให้เหมาะกับสไลด์</p>'+field('คำบรรยายภาพ','imageCaption',page.imageCaption??'')+'<button type="button" data-original-image '+(!page.image?'disabled':'')+'>ใช้ภาพประกอบเดิม</button></fieldset><div class="tl-editor-page-tools"><button type="button" data-reset-page>คืนเนื้อหาต้นฉบับหน้านี้</button><button type="button" data-restore-draft hidden>เปิดฉบับร่างในเครื่อง</button></div><p class="tl-editor-help">แก้ไขเฉพาะสื่ออบรมของหัวข้อ Section และไตรมาสนี้</p></form>';
   const stored=readLocal(draftKey);panel.querySelector('[data-restore-draft]').hidden=!stored||dirty;
   panel.querySelector('[data-editor-done]').onclick=()=>toggle(false);
   const form=panel.querySelector('form');form.onsubmit=event=>event.preventDefault();
   form.oninput=event=>{
    if(!canEdit()){say('บัญชีนี้ไม่มีสิทธิ์แก้ไขสไลด์');return;}
    const name=event.target.name;if(!name)return;const value=event.target.value;
    if(name==='points')page.points=value.split(/\r?\n/).slice(0,8);
    else if(name.startsWith('question-'))page.questions[Number(name.split('-')[1])].question=value;
    else if(name.startsWith('answer-'))page.questions[Number(name.split('-')[1])].answer=value;
    else if(['title','kicker','lead','callout','method','criteria','imageCaption'].includes(name))page[name]=value;
    else return;changed();
   };
   panel.querySelector('[data-slide-image]').onchange=async event=>{
    if(!canEdit()||imageBusy||busy)return;
    const file=event.target.files?.[0];if(!file)return;
    imageBusy=true;setBusy();say('กำลังเตรียมภาพประกอบ');
    try{const data=await imageFromFile(file);if(destroyed||!canEdit())return;page.image=data;changed();if(getIndex()===index)showPanel(true);}catch(error){say(error.message);}finally{imageBusy=false;setBusy();}
   };
   panel.querySelector('[data-original-image]').onclick=()=>{if(!canEdit())return;delete page.image;delete page.imageCaption;changed();showPanel(true);};
   panel.querySelector('[data-reset-page]').onclick=()=>{if(!canEdit()||!confirm('คืนเนื้อหาและภาพต้นฉบับของหน้า '+(index+1)+'?'))return;deck.pages[index]=copy(basePages[index]);changed();showPanel(true);};
   panel.querySelector('[data-restore-draft]').onclick=()=>{
    if(!canEdit())return;const value=readLocal(draftKey);if(!value)return;
    try{if(value.expectedRevision!==currentRevision&&!confirm('ฉบับร่างอ้างอิงฉบับเก่า ต้องการนำมาแก้ไขต่อโดยอ้างอิงฉบับล่าสุดหรือไม่? กรุณาทบทวนทุกหน้าก่อนบันทึก'))return;deck.pages=sanitizePages(value.pages,basePages);dirty=true;saveId=null;render();showPanel(true);say('เปิดฉบับร่างแล้ว · กดบันทึกสไลด์เพื่อใช้ร่วมกัน');}catch(error){say(error.message);}
   };
   setBusy();
  }
  function toggle(value){
   if(value&&!canEdit())return;
   editing=value;panel.hidden=!value;workspace.classList.toggle('tl-workspace-editing',value);controls.querySelector('[data-tl-save]')?.toggleAttribute('hidden',!value);const button=controls.querySelector('[data-tl-edit]');if(button)button.textContent=value?'ดูสไลด์':'แก้ไขสไลด์';
   displayed=-1;if(value){showPanel(true);panel.querySelector('input')?.focus();}else button?.focus();
  }
  function setBusy(){
   for(const button of controls.querySelectorAll('button'))button.disabled=busy||imageBusy;
   for(const field of panel.querySelectorAll('input,textarea,button'))field.disabled=busy||imageBusy||!canEdit()||field.matches('[data-original-image]')&&!deck.pages[getIndex()].image;
   print.disabled=busy||imageBusy;
  }
  async function load(){
   if(busy||destroyed)return;
   if(dirty&&!confirm('มีฉบับร่างในเครื่อง ต้องการโหลดสไลด์ที่บันทึกส่วนกลางแทนหรือไม่?'))return;
   busy=true;setBusy();say('กำลังโหลดสไลด์ล่าสุด');
   try{const {record}=await request(path);if(destroyed)return;apply(record);dirty=false;saveUncertain=false;try{if(record)writeLocal(cacheKey,record);else localStorage.removeItem(cacheKey);}catch{}say(record?'สไลด์ฉบับที่บันทึกแล้ว · '+new Date(record.updatedAt).toLocaleString('th-TH'): 'สไลด์ต้นฉบับ · ยังไม่มีการแก้ไข');controls.querySelector('[data-tl-reload]').hidden=true;if(editing)showPanel(true);}
   catch(error){say(error.message+' · แสดง'+(cached?'ฉบับในเครื่อง':'สไลด์ต้นฉบับ'));controls.querySelector('[data-tl-reload]').hidden=false;}
   finally{busy=false;setBusy();}
  }
  async function save(){
   if(!canEdit()){say('บัญชีนี้ไม่มีสิทธิ์แก้ไขสไลด์');return;}
   if(busy||imageBusy||destroyed)return;
   let pages;try{pages=sanitizePages(deck.pages,basePages);}catch(error){say(error.message);return;}
   clearTimeout(draftTimer);keepDraft();busy=true;saving=true;setBusy();say('กำลังบันทึกสไลด์');
   try{
    const latest=await request(path, {headers:{'X-Firebase-ETag':'true'}});
    if(!canEdit())throw Error('บัญชีนี้ไม่มีสิทธิ์แก้ไขสไลด์');
    // A timed-out PUT may have reached the server. Recognize only this exact operation.
    let record;
    if(saveUncertain&&saveId&&latest.record?.revision===saveId){record=latest.record;}
    else{
     if(revision(latest.record)!==currentRevision)throw Object.assign(Error('มีฉบับใหม่จากเครื่องอื่น กรุณาโหลดฉบับล่าสุดก่อนบันทึก · ฉบับร่างของคุณยังอยู่ในเครื่อง'),{conflict:true});
     if(!latest.etag)throw Error('ยังยืนยันฉบับล่าสุดไม่ได้ กรุณาลองโหลดอีกครั้ง');
     saveId=crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
     record={schema:1,topic:input.item.title,section:input.ctx.section,year:input.ctx.year,quarter:input.q,pages,revision:saveId,updatedAt:new Date().toISOString(),updatedBy:actor};
     if(JSON.stringify(record).length>3800000)throw Error('ชุดสไลด์มีขนาดใหญ่เกินไป กรุณาลดจำนวนหรือขนาดภาพ');
     saveUncertain=true;
     await request(path,{method:'PUT',headers:{'Content-Type':'application/json','If-Match':latest.etag},body:JSON.stringify(record)},20000);
    }
    currentRevision=record.revision;deck.pages=pages;dirty=false;saveUncertain=false;window.dispatchEvent(new CustomEvent('ppms-training-lesson-saved',{detail:{path,record}}));let warning='';
    try{writeLocal(cacheKey,record);localStorage.removeItem(draftKey);}catch{warning=' · พื้นที่ในเครื่องเต็ม แต่บันทึกส่วนกลางสำเร็จ';}
    render();showPanel(true);say('บันทึกสไลด์แล้ว · เปิดใช้จากเครื่องอื่นและดาวน์โหลด PDF ได้'+warning);controls.querySelector('[data-tl-reload]').hidden=true;
   }catch(error){controls.querySelector('[data-tl-reload]').hidden=false;say('ยังไม่บันทึกส่วนกลาง: '+error.message+(keepDraft()?' · เก็บฉบับร่างในเครื่องแล้ว':''));}
   finally{busy=false;saving=false;setBusy();}
  }
  controls.querySelector('[data-tl-edit]')?.addEventListener('click',()=>toggle(!editing));
  controls.querySelector('[data-tl-save]')?.addEventListener('click',()=>void save());
  controls.querySelector('[data-tl-reload]').onclick=()=>void load();
  const unload=()=>{if(dirty)keepDraft();};window.addEventListener('beforeunload',unload);
  void load();
  return {onRender:()=>showPanel(),beforeClose(){if(saving||imageBusy){say('กรุณารอให้บันทึกหรือเตรียมภาพเสร็จก่อนปิด');return false;}clearTimeout(draftTimer);if(dirty&&!keepDraft())return confirm('ยังเก็บฉบับร่างไม่ได้ ต้องการปิดโดยไม่บันทึกการแก้ไขหรือไม่?');return true;},destroy(){destroyed=true;clearTimeout(draftTimer);window.removeEventListener('beforeunload',unload);controls.remove();panel.remove();}};
 }
 window.PPMSTrainingLessonEditor={mount,canEdit,identity,sanitizePages,safeImage};
})();
