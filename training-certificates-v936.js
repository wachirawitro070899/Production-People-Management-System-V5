/* Employee course and certificate history. No automatic qualification assignment. */
(()=>{
 'use strict';
 const KEY='ppms_v3_certificate_outbox',MAX_FILE=5*1024*1024;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const context=()=>window.PPMS_RUNTIME?.certificateContext()||{employees:[],isAdmin:false,allowed:false};
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const statuses={certified:'มีใบเซอร์',completed:'ผ่านอบรม / ยังไม่มีใบเซอร์',planned:'วางแผนอบรม'};
 let jobs={},running=false,syncTask=null,query='',courseFilter='',statusFilter='';
 const ready=Promise.resolve(window.ppmsErrorGuard?.ready).then(()=>{try{jobs=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{jobs={}}});
 const key=(id,rid)=>JSON.stringify([String(id),rid]);
 const pending=(id,rid)=>jobs[key(id,rid)];
 const persist=()=>localStorage.setItem(KEY,JSON.stringify(jobs));
 const isPermanent=employee=>window.PPMS_EMPLOYEE_SAVE_SERVICE?.isPermanent(employee)===true;
 const ordered=list=>window.PPMS_RUNTIME?.sortEmployees?.(list)||[...list];
 const people=()=>ordered(context().employees.filter(isPermanent));
 function records(employee){
  if(!isPermanent(employee))return [];
  const map=new Map((Array.isArray(employee?.certifications)?employee.certifications:[]).map(r=>[r.id,r]));
  for(const job of Object.values(jobs))if(String(job.employeeId)===String(employee?.id))map.set(job.record.id,job.record);
  return [...map.values()].sort((a,b)=>String(b.date||b.createdAt).localeCompare(String(a.date||a.createdAt)));
 }
 function state(record){return record.status==='certified'&&record.expiryDate&&record.expiryDate<today()?'expired':record.status}
 function label(record){return state(record)==='expired'?'ใบเซอร์หมดอายุ':statuses[record.status]||'ไม่ระบุ'}
 const courseKey=value=>String(value||'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
 function courseRecords(employee){
  const groups=new Map(),priority={certified:4,completed:3,expired:2,planned:1};
  for(const record of records(employee)){
   const k=courseKey(record.course),old=groups.get(k);if(!k)continue;
   if(!old||(priority[state(record)]||0)>(priority[state(old)]||0))groups.set(k,record);
  }
  return [...groups.values()];
 }
 function summary(employee){return courseRecords(employee).map(r=>r.course+' · '+label(r)+(pending(employee.id,r.id)?' (รอซิงก์)':'')).join('; ')}
 function names(employee){return courseRecords(employee).map(r=>r.course).join(', ')}
 function previewMarkup(employee){
  const list=courseRecords(employee);if(!list.length)return '';
  return '<span class="cert-course-preview" data-i18n-ignore>'+esc(list[0].course)+'</span>'+(list.length>1?'<span class="cert-course-count" data-i18n-ignore>+อีก '+(list.length-1)+' หลักสูตร</span>':'');
 }
 function cardMarkup(employee){
  const list=courseRecords(employee);if(!list.length)return '';
  return '<div class="wallet-course-strip" data-course-card="'+esc(employee.id)+'" title="'+esc(names(employee))+'"><b>COURSES</b><span data-i18n-ignore>'+previewMarkup(employee)+'</span></div>';
 }
 function matrixModel(list){
  const courses=new Map(),rows=ordered(list).map(e=>{const entries=courseRecords(e);for(const r of entries)if(!courses.has(courseKey(r.course)))courses.set(courseKey(r.course),r.course);return {employee:e,entries:new Map(entries.map(r=>[courseKey(r.course),r]))}});
  return {courses:[...courses].map(([key,name])=>({key,name})),rows};
 }
 function courseTable(model,columns=model.courses,rows=model.rows){
  return '<div class="table-wrap"><table class="cert-course-matrix"><thead><tr><th>รหัส / Employee ID</th><th>พนักงาน / Employee</th>'+columns.map(c=>'<th data-i18n-ignore>'+esc(c.name)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(({employee:e,entries})=>'<tr data-course-matrix-employee="'+esc(e.id)+'"><td>'+esc(e.id)+'</td><td><b data-i18n-ignore>'+esc(e.name)+'</b><small>'+esc(e.position)+'</small></td>'+columns.map(c=>{const r=entries.get(c.key);return '<td data-course-key="'+esc(c.key)+'">'+(r?'<span class="cert-badge cert-'+esc(state(r))+'">'+esc(label(r))+'</span>'+(r.date?'<small>'+esc(r.date)+'</small>':'')+(r.expiryDate?'<small>Exp. '+esc(r.expiryDate)+'</small>':'')+(pending(e.id,r.id)?'<small>รอซิงก์</small>':''):'—')+'</td>'}).join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function matrixMarkup(list){
  const model=matrixModel(list);if(!model.courses.length)return '';
  return '<section class="cert-matrix-section"><h3>Training & Certificate Matrix / หลักสูตรอบรมและใบเซอร์</h3><p>แสดงสถานะหลักสูตรรายคน · — = ยังไม่มีรายการ</p>'+courseTable(model)+'</section>';
 }
 function matrixPages(list,title=''){
  const model=matrixModel(list),pages=[];if(!model.courses.length)return pages;
  for(let c=0;c<model.courses.length;c+=4)for(let r=0;r<model.rows.length;r+=10)pages.push('<section class="cert-matrix-section"><h3>Training & Certificate Matrix</h3><p>'+esc(title)+' · หลักสูตรอบรมและใบเซอร์ · — = ยังไม่มีรายการ</p>'+courseTable(model,model.courses.slice(c,c+4),model.rows.slice(r,r+10))+'</section>');
  return pages;
 }
 function safeUrl(value){try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}}
 function fileValid(file){return file&&typeof file.data==='string'&&/^data:(application\/pdf|image\/png|image\/jpeg);base64,[A-Za-z0-9+/=]+$/.test(file.data)&&file.data.length<MAX_FILE*1.4+100}
 function evidence(record){
  return (safeUrl(record.certificateUrl)?'<a href="'+esc(safeUrl(record.certificateUrl))+'" target="_blank" rel="noopener noreferrer">เปิดใบเซอร์</a>':'')+
   (fileValid(record.attachment)?'<button type="button" class="secondary compact" data-cert-download="'+esc(record.id)+'" title="'+esc(record.attachment.name)+'">ดาวน์โหลดไฟล์</button>':'');
 }
 function row(employee,record,individual=false){
  const job=pending(employee.id,record.id);
  return '<tr data-cert-row="'+esc(record.id)+'" data-cert-owner="'+esc(employee.id)+'">'+(!individual?'<td><b>'+esc(employee.name)+'</b><small>'+esc(employee.id)+' · '+esc(employee.position)+'</small></td><td>'+esc(employee.section)+'</td>':'')+
   '<td><b data-i18n-ignore>'+esc(record.course)+'</b><small data-i18n-ignore>'+esc(record.provider||'')+'</small></td><td>'+esc(record.date||'ไม่ระบุ')+'</td><td>'+esc(record.expiryDate||'ไม่ระบุ')+'</td><td><span class="cert-badge cert-'+esc(state(record))+'">'+esc(label(record))+'</span>'+(job?'<small class="cert-pending">'+esc(job.error||'รอซิงก์')+'</small>':'')+'</td><td>'+esc(record.certificateNumber||'—')+'<div class="cert-evidence">'+evidence(record)+'</div></td><td class="no-print">'+(context().isAdmin?'<button type="button" class="secondary" data-cert-edit="'+esc(record.id)+'" data-cert-employee="'+esc(employee.id)+'">แก้ไข</button>':'')+'</td></tr>';
 }
 const headings=individual=>'<thead><tr>'+(!individual?'<th>พนักงาน</th><th>Section</th>':'')+'<th>หลักสูตร / ผู้จัดอบรม</th><th>วันที่อบรม</th><th>วันหมดอายุ</th><th>สถานะ</th><th>เลขที่ / หลักฐาน</th><th class="no-print"></th></tr></thead>';
 function panel(employee){
  if(!context().allowed||!people().some(e=>String(e.id)===String(employee?.id)))return '';
  const list=records(employee);
  return '<section class="panel cert-panel" data-cert-panel="'+esc(employee.id)+'"><div class="cert-title"><div><h3>การอบรมและใบรับรอง</h3><p>หลักสูตรและใบเซอร์ที่บันทึกไว้ '+list.length+' รายการ</p></div>'+(context().isAdmin?'<button type="button" data-cert-add="'+esc(employee.id)+'">+ เพิ่มหลักสูตร / ใบเซอร์</button>':'')+'</div><div class="table-wrap"><table>'+headings(true)+'<tbody>'+list.map(r=>row(employee,r,true)).join('')+(list.length?'':'<tr><td colspan="6">ยังไม่มีประวัติอบรมหรือใบเซอร์</td></tr>')+'</tbody></table></div></section>';
 }
 function allRows(){return people().flatMap(e=>records(e).map(record=>({employee:e,record})))}
 function courses(){return [...new Set(['CQI-15',...allRows().map(x=>x.record.course)])].sort((a,b)=>a.localeCompare(b))}
 function filtered(){const q=query.toLowerCase();return allRows().filter(({employee:e,record:r})=>(!courseFilter||r.course===courseFilter)&&(!statusFilter||state(r)===statusFilter)&&(!q||[e.id,e.name,e.thaiName,e.section,e.position,r.course,r.provider,r.certificateNumber].join(' ').toLowerCase().includes(q)))}
 function table(){const list=filtered();return '<table>'+headings(false)+'<tbody>'+list.map(x=>row(x.employee,x.record)).join('')+(list.length?'':'<tr><td colspan="8">ยังไม่มีรายการตามตัวกรอง เลือกเพิ่มหลักสูตร / ใบเซอร์เพื่อบันทึกข้อมูล</td></tr>')+'</tbody></table>'}
 function page(){
  if(!context().allowed)return '<div class="empty">กรุณาเข้าสู่ระบบ</div>';
  const list=allRows(),valid=new Set(list.filter(x=>state(x.record)==='certified').map(x=>String(x.employee.id)));
  return '<section id="certificatePage"><div class="cert-title no-print"><p>สำหรับพนักงานประจำเท่านั้น · พิมพ์หลักสูตรใหม่ได้ เช่น CQI-15 แล้วเลือกผู้ที่ผ่านอบรมจริง</p><div class="actions"><button type="button" data-cert-add="">+ เพิ่มหลักสูตร / ใบเซอร์</button><button type="button" class="secondary" data-cert-export>ดาวน์โหลด CSV</button></div></div><div class="cert-summary"><div><b data-cert-total>'+list.length+'</b><span>รายการอบรม</span></div><div><b data-cert-valid>'+valid.size+'</b><span>คนที่มีใบเซอร์ยังไม่หมดอายุ</span></div><div><b data-cert-expired>'+list.filter(x=>state(x.record)==='expired').length+'</b><span>ใบเซอร์หมดอายุ</span></div></div><div class="panel cert-filters no-print"><label>ค้นหาพนักงาน / Section<input id="certSearch" value="'+esc(query)+'" placeholder="รหัส ชื่อ ตำแหน่ง หรือหลักสูตร"></label><label>หลักสูตร<select id="certCourseFilter"><option value="">ทุกหลักสูตร</option>'+courses().map(c=>'<option data-i18n-ignore value="'+esc(c)+'" '+(c===courseFilter?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label>สถานะ<select id="certStatusFilter"><option value="">ทุกสถานะ</option>'+Object.entries({...statuses,expired:'ใบเซอร์หมดอายุ'}).map(([k,v])=>'<option value="'+k+'" '+(k===statusFilter?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label></div><div class="table-wrap" id="certTable">'+table()+'</div></section>';
 }
 function refresh(){
  const tableNode=document.getElementById('certTable');if(tableNode){
   tableNode.innerHTML=table();const list=allRows(),counts={'total':list.length,'valid':new Set(list.filter(x=>state(x.record)==='certified').map(x=>String(x.employee.id))).size,'expired':list.filter(x=>state(x.record)==='expired').length};
   for(const [key,value] of Object.entries(counts)){const node=document.querySelector('[data-cert-'+key+']');if(node)node.textContent=value}
  }
  for(const el of document.querySelectorAll('[data-cert-panel]')){const e=people().find(e=>String(e.id)===el.dataset.certPanel);if(e)el.outerHTML=panel(e)}
 }
 async function attachment(file){
  if(file.size>MAX_FILE)throw Error('ไฟล์ใบเซอร์ต้องไม่เกิน 5 MB หรือใส่ลิงก์ HTTPS แทน');
  const bytes=new Uint8Array(await file.arrayBuffer()),prefix=[...bytes.slice(0,8)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const type=prefix.startsWith('255044462d')?'application/pdf':prefix==='89504e470d0a1a0a'?'image/png':prefix.startsWith('ffd8ff')?'image/jpeg':'';
  if(!type)throw Error('รองรับไฟล์ PDF, JPG และ PNG เท่านั้น');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).replace(/^data:[^;]*;/,'data:'+type+';'));reader.onerror=()=>reject(Error('อ่านไฟล์ไม่สำเร็จ'));reader.readAsDataURL(file)});
  return {name:file.name,type,data};
 }
 function attendeePicker(employeeId,editing){
  if(editing){const employee=people().find(e=>String(e.id)===String(employeeId));return '<label class="full">พนักงาน<select name="employeeId" disabled><option>'+esc(employee?.name||employeeId)+'</option></select></label>'}
  return '<fieldset class="full cert-attendees"><legend>เลือกพนักงานประจำเข้าอบรม (เลือกได้หลายคน)</legend><input id="certAttendeeSearch" placeholder="ค้นหา รหัส ชื่อ แผนก หรือตำแหน่ง" aria-label="ค้นหาผู้เข้าอบรม"><div class="cert-attendee-tools"><button type="button" class="secondary" id="certSelectVisible">เลือกทุกคนตามผลค้นหา</button><button type="button" class="secondary" id="certClearSelection">ล้างที่เลือก</button><b id="certAttendeeCount" aria-live="polite"></b></div><div class="cert-attendee-list">'+people().map(e=>'<div class="cert-attendee-row" data-cert-attendee-search="'+esc([e.id,e.name,e.thaiName,e.section,e.position].join(' ').toLowerCase())+'"><label><input type="checkbox" name="employeeIds" value="'+esc(e.id)+'" '+(String(e.id)===String(employeeId)?'checked':'')+'><span data-i18n-ignore><b>'+esc(e.name)+'</b><small>'+esc(e.id+' · '+e.position+' · '+e.section)+'</small></span></label><input data-cert-person-number="'+esc(e.id)+'" placeholder="เลขที่ใบเซอร์รายคน (ถ้ามี)" aria-label="'+esc('เลขที่ใบเซอร์ '+e.name)+'" maxlength="120" hidden></div>').join('')+'</div><small>รายละเอียดหลักสูตรและไฟล์แนบจะใช้กับผู้ที่เลือก สามารถใส่เลขที่ใบเซอร์รายคนได้</small></fieldset>';
 }
 function bindAttendees(form){
  if(!form.querySelector('.cert-attendees'))return;
  const update=()=>{const boxes=[...form.querySelectorAll('[name="employeeIds"]')];form.querySelector('#certAttendeeCount').textContent='เลือกแล้ว '+boxes.filter(b=>b.checked).length+' คน';boxes.forEach(b=>{b.closest('.cert-attendee-row').querySelector('[data-cert-person-number]').hidden=!b.checked})};
  form.querySelector('#certAttendeeSearch').oninput=event=>{const q=event.target.value.toLowerCase();form.querySelectorAll('[data-cert-attendee-search]').forEach(row=>{row.hidden=!row.dataset.certAttendeeSearch.includes(q)})};
  form.querySelector('#certSelectVisible').onclick=()=>{form.querySelectorAll('.cert-attendee-row:not([hidden]) [name="employeeIds"]').forEach(box=>box.checked=true);update()};
  form.querySelector('#certClearSelection').onclick=()=>{form.querySelectorAll('[name="employeeIds"]').forEach(box=>box.checked=false);update()};
  form.querySelectorAll('[name="employeeIds"]').forEach(box=>box.onchange=update);update();
 }
 function open(employeeId='',recordId=''){
  if(!context().isAdmin)return;
  document.getElementById('certificateDialog')?.remove();
  const employee=people().find(e=>String(e.id)===String(employeeId)),old=employee&&records(employee).find(r=>r.id===recordId)||{};
  if(recordId&&!old.id)return;
  const editExpected=old.id?(pending(employee.id,old.id)?.expectedUpdatedAt??(employee.certifications||[]).find(r=>r.id===old.id)?.updatedAt??''):'';
  const dialog=document.createElement('div');dialog.id='certificateDialog';dialog.className='modal cert-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','certificateDialogTitle');
  dialog.innerHTML='<div class="modal-card"><button type="button" class="close" data-cert-close aria-label="ปิด">×</button><h2 id="certificateDialogTitle">'+(old.id?'แก้ไข':'เพิ่ม')+'หลักสูตร / ใบเซอร์</h2><p>เฉพาะพนักงานประจำ · เลือกผู้เข้าอบรมได้หลายคน แล้วบันทึกหลักสูตรครั้งเดียว</p><form id="certificateForm" class="form-grid">'+attendeePicker(employeeId,!!old.id)+'<label>ชื่อหลักสูตร<input name="course" list="certificateCourses" required maxlength="180" placeholder="เช่น CQI-15 หรือพิมพ์หลักสูตรใหม่" value="'+esc(old.course||'')+'"><datalist id="certificateCourses">'+courses().map(c=>'<option value="'+esc(c)+'">').join('')+'</datalist></label><label>ผู้จัดอบรม / สถาบัน<input name="provider" maxlength="180" value="'+esc(old.provider||'')+'"></label><label>วันที่อบรม<input name="date" type="date" value="'+esc(old.date||'')+'"><small>เว้นว่างได้หากยังไม่ทราบวันที่เดิม</small></label><label>วันหมดอายุใบเซอร์<input name="expiryDate" type="date" value="'+esc(old.expiryDate||'')+'"><small>เว้นว่างได้หากไม่ระบุวันหมดอายุ</small></label><label>สถานะ<select name="status">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'" '+(k===(old.status||'certified')?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label><label>เลขที่ใบเซอร์<input name="certificateNumber" maxlength="120" value="'+esc(old.certificateNumber||'')+'"></label><label class="full">ลิงก์ใบเซอร์ (HTTPS)<input name="certificateUrl" type="url" value="'+esc(old.certificateUrl||'')+'" placeholder="https://..."></label><label class="full">แนบไฟล์ใบเซอร์<input name="certificateFile" type="file" accept="application/pdf,image/jpeg,image/png"><small>PDF / JPG / PNG ไม่เกิน 5 MB'+(old.attachment?' · ไฟล์เดิม: '+esc(old.attachment.name):'')+'</small></label>'+(old.attachment?'<label class="full"><span><input type="checkbox" name="removeAttachment"> เอาไฟล์แนบเดิมออกจากรายการ</span></label>':'')+'<label class="full">หมายเหตุ<textarea name="note" maxlength="1000">'+esc(old.note||'')+'</textarea></label><p id="certificateStatus" class="full" role="status" aria-live="polite"></p><div class="full actions"><button type="submit">บันทึกหลักสูตร / ใบเซอร์</button><button type="button" class="secondary" data-cert-close>ยกเลิก</button></div></form></div>';
  document.body.append(dialog);const form=dialog.querySelector('form'),batchId=crypto.randomUUID(),recordIds=new Map();bindAttendees(form);form.elements.course.focus();
  form.onsubmit=async event=>{
   event.preventDefault();const message=dialog.querySelector('#certificateStatus'),button=form.querySelector('[type="submit"]');
   if(button.disabled)return;button.disabled=true;message.textContent='กำลังบันทึก...';
   try{
    await ready;if(running)throw Error('ระบบกำลังส่งรายการก่อนหน้า กรุณาลองอีกครั้ง');
    const ids=old.id?[String(employeeId)]:[...new Set([...form.querySelectorAll('[name="employeeIds"]:checked')].map(box=>box.value))],eligible=new Map(people().map(e=>[String(e.id),e]));if(!context().isAdmin||!ids.length||ids.some(id=>!eligible.has(id)))throw Error('กรุณาเลือกพนักงานประจำในฝ่ายปัจจุบันอย่างน้อย 1 คน');
    const data=Object.fromEntries(new FormData(form));
    if(!String(data.course||'').trim())throw Error('กรุณาระบุหลักสูตร');
    if(data.date&&data.expiryDate&&data.expiryDate<data.date)throw Error('วันหมดอายุต้องไม่ก่อนวันที่อบรม');
    if(data.status!=='planned'&&data.date&&data.date>today())throw Error('วันที่ผ่านอบรมต้องไม่เป็นวันในอนาคต');
    if(data.certificateUrl&&!safeUrl(data.certificateUrl))throw Error('ลิงก์ใบเซอร์ต้องขึ้นต้นด้วย https://');
    const stamp=new Date().toISOString(),record={course:data.course.trim(),provider:data.provider.trim(),date:data.date,expiryDate:data.expiryDate,status:data.status,certificateNumber:data.certificateNumber.trim(),certificateUrl:data.certificateUrl.trim(),note:data.note.trim(),createdAt:old.createdAt||stamp,updatedAt:stamp,recordedBy:context().actor};
    if(old.attachment&&!data.removeAttachment)record.attachment=old.attachment;
    const file=form.elements.certificateFile.files[0];if(file)record.attachment=await attachment(file);
    const before={...jobs},submitted=[];
    for(const id of ids){
     const e=eligible.get(id),rid=old.id||recordIds.get(id)||crypto.randomUUID();recordIds.set(id,rid);
     const ownNumber=[...form.querySelectorAll('[data-cert-person-number]')].find(el=>el.dataset.certPersonNumber===id)?.value.trim(),personal={...record,id:rid,...(ownNumber?{certificateNumber:ownNumber}:{})},remote=(e.certifications||[]).find(r=>r.id===rid),job={employeeId:id,record:personal,expectedUpdatedAt:old.id?editExpected:(remote?.updatedAt||''),batchId},k=key(id,rid);
     jobs[k]=job;submitted.push(k);
    }
    try{persist();if(await window.ppmsErrorGuard?.flushStorage?.([KEY])===false)throw Error('ยังเก็บข้อมูลในเครื่องไม่ได้ กรุณาลองใหม่')}catch(error){jobs=before;persist();throw error}
    refresh();if(navigator.onLine!==false)await sync();
    const remaining=submitted.filter(k=>jobs[k]),failed=remaining.map(k=>jobs[k]).find(j=>j.error);
    if(failed){message.textContent='บันทึกแล้ว '+(ids.length-remaining.length)+' คน • รอส่ง '+remaining.length+' คน: '+failed.error;return}
    dialog.remove();window.PPMS_RUNTIME?.refreshCertificates();refresh();
    alert('บันทึกหลักสูตร / ใบเซอร์ '+ids.length+' คน'+(remaining.length?' • รอซิงก์ '+remaining.length+' คนเมื่อมีอินเทอร์เน็ต':'เรียบร้อยแล้ว'));
   }catch(error){message.textContent=error.message}finally{button.disabled=false}
  };
 }
 function sync(){
  if(!syncTask)syncTask=runSync().finally(()=>{syncTask=null});
  return syncTask;
 }
 async function runSync(){
  await ready;if(running||navigator.onLine===false||!context().isAdmin||!window.PPMS_EMPLOYEE_SAVE_SERVICE)return;
  running=true;
  try{
   const eligible=new Set(people().map(e=>String(e.id))),groups=new Map();
   for(const [k,job] of Object.entries(jobs)){if(!eligible.has(String(job.employeeId)))continue;const group=job.batchId||k;if(!groups.has(group))groups.set(group,[]);groups.get(group).push([k,job])}
   const confirm=(entries,result)=>{if(window.PPMS_RUNTIME.confirmCertificateSnapshots)window.PPMS_RUNTIME.confirmCertificateSnapshots(entries.map(([,job])=>job.employeeId),result);else entries.forEach(([,job])=>window.PPMS_RUNTIME.confirmCertificateSnapshot(job.employeeId,result));for(const [k,job] of entries)if(jobs[k]?.record.updatedAt===job.record.updatedAt)delete jobs[k];persist()};
   const fail=(k,job,error)=>{if(error.existing)window.PPMS_RUNTIME.confirmCertificateSnapshot(job.employeeId,{employees:[error.existing]});if(jobs[k]){jobs[k].error=error.message;persist()}};
   for(const entries of groups.values()){
    if(entries.length>1&&window.PPMS_EMPLOYEE_SAVE_SERVICE.saveCertificates){
     try{confirm(entries,await window.PPMS_EMPLOYEE_SAVE_SERVICE.saveCertificates(entries.map(([,job])=>job)));continue}
     catch(error){if(!['certificate-conflict','employee-missing','employee-not-permanent'].includes(error.code)){entries.forEach(([k,job])=>fail(k,job,error));break}}
    }
    for(const [k,job] of entries){try{confirm([[k,job]],await window.PPMS_EMPLOYEE_SAVE_SERVICE.saveCertificate(job.employeeId,job.record,job.expectedUpdatedAt))}catch(error){fail(k,job,error);if(!['certificate-conflict','employee-missing','employee-not-permanent'].includes(error.code))return}}
   }
  }finally{running=false;refresh()}
 }
 function download(employeeId,recordId){
  const employee=people().find(e=>String(e.id)===employeeId),record=employee&&records(employee).find(r=>r.id===recordId);if(!fileValid(record?.attachment))return;
  const a=document.createElement('a');a.href=record.attachment.data;a.download=record.attachment.name||'Certificate';a.click();
 }
 function exportCsv(){
  const csvCell=v=>'"'+String(v??'').replace(/"/g,'""').replace(/^\s*[=+@-]/,"'$&")+'"';
  const rows=[['Employee ID','Name','Section','Position','Course','Provider','Training date','Expiry date','Status','Certificate number','Certificate URL','Note'],...filtered().map(({employee:e,record:r})=>[e.id,e.name,e.section,e.position,r.course,r.provider,r.date,r.expiryDate,label(r),r.certificateNumber,r.certificateUrl,r.note])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Training_Certificates.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 document.addEventListener('click',event=>{
  const b=event.target.closest('[data-cert-add],[data-cert-edit],[data-cert-close],[data-cert-download],[data-cert-export]');if(!b)return;
  event.preventDefault();if(b.hasAttribute('data-cert-close')){document.getElementById('certificateDialog')?.remove();return}
  if(b.hasAttribute('data-cert-add'))open(b.dataset.certAdd);
  if(b.hasAttribute('data-cert-edit'))open(b.dataset.certEmployee,b.dataset.certEdit);
  if(b.hasAttribute('data-cert-download'))download(b.closest('[data-cert-owner]').dataset.certOwner,b.dataset.certDownload);
  if(b.hasAttribute('data-cert-export'))exportCsv();
 });
 document.addEventListener('input',event=>{if(event.target.id==='certSearch'){query=event.target.value;refresh()}});
 document.addEventListener('change',event=>{if(event.target.id==='certCourseFilter'){courseFilter=event.target.value;refresh()}if(event.target.id==='certStatusFilter'){statusFilter=event.target.value;refresh()}});
 window.addEventListener('ppms-employees-changed',refresh);
 window.addEventListener('online',()=>void sync());
 window.addEventListener('focus',()=>void sync());
 setInterval(()=>void sync(),15000);
 ready.then(()=>{refresh();void sync()});
 window.PPMSCertificates={page,panel,records,state,safeUrl,sync,exportCsv,summary,names,previewMarkup,cardMarkup,courseRecords,matrixModel,matrixMarkup,matrixPages,label};
})();
