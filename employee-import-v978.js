/* Employee ZIP/CSV import. Files stay in the browser until the reviewed batch is saved. */
(()=>{'use strict';
 const PENDING='ppms_employee_import_pending_v978',MAX_ROWS=100,MAX_FILE=30*1024*1024,MAX_UNPACKED=60*1024*1024;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s??'').trim();
 function parseCSV(text){
  text=String(text).replace(/^\ufeff/,'');const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(quoted)quoted=false;else if(!cell)quoted=true;else throw Error('รูปแบบ CSV ไม่ถูกต้อง')}
   else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c;
  }
  if(quoted)throw Error('ไฟล์ CSV มีเครื่องหมายคำพูดไม่ครบ');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  const header=(rows.shift()||[]).map(x=>x.trim().toLowerCase());if(!header.length||new Set(header).size!==header.length)throw Error('กรุณาตรวจหัวคอลัมน์ CSV');
  if(rows.length>MAX_ROWS||!rows.length)throw Error('นำเข้าได้ครั้งละ 1–100 คน');
  return rows.map((r,i)=>{if(r.length>header.length)throw Error('จำนวนคอลัมน์ CSV ไม่ตรงกัน แถว '+(i+2));return Object.fromEntries(header.map((h,j)=>[h,r[j]||'']))});
 }
 const take=(r,...keys)=>{for(const key of keys)if(clean(r[key]))return clean(r[key]);return ''};
 function normalizeRow(r){return {id:take(r,'employee_id','employeeid','id','รหัสพนักงาน'),name:take(r,'name_from_source','name','englishname','ชื่อภาษาอังกฤษ','ชื่อ'),thaiName:take(r,'thainame','thai_name','ชื่อภาษาไทย'),position:take(r,'position','ตำแหน่ง'),startDate:take(r,'startdate','start_date','วันที่เริ่มงาน'),contractType:take(r,'contracttype','contract_type','ประเภทพนักงาน'),photoFile:take(r,'photo_file','photo'),sourceDuty:take(r,'duty_from_source','duty'),photoData:''}}
 function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s}
 const fieldLabels={id:'รหัสพนักงาน',name:'ชื่อภาษาอังกฤษ',position:'ตำแหน่ง',startDate:'วันที่เริ่มงาน',contractType:'ประเภทพนักงาน',photoData:'รูปภาพ'};
 function reviewRows(rows,existing=[]){
  const issues=[],seen=new Map(),ids=new Set(existing.map(e=>clean(e.id).toUpperCase()));
  const add=(row,field,message)=>issues.push({row,field,message});
  rows.forEach((r,i)=>{
   const id=clean(r.id),name=clean(r.name),position=clean(r.position),date=clean(r.startDate),type=clean(r.contractType),photo=clean(r.photoData);
   if(!id)add(i,'id','กรุณากรอกรหัสพนักงาน');
   else if(id.length>64||/[.#$\[\]\/\\\x00-\x1f\x7f]/.test(id)||['__proto__','prototype','constructor'].includes(id))add(i,'id','รหัสพนักงานมีอักขระที่ใช้ไม่ได้');
   else{const key=id.toUpperCase();if(seen.has(key)){add(i,'id','รหัสซ้ำกับแถว '+(seen.get(key)+1));if(!issues.some(x=>x.row===seen.get(key)&&x.field==='id'))add(seen.get(key),'id','รหัสซ้ำกับแถว '+(i+1))}else seen.set(key,i);if(ids.has(key))add(i,'id','รหัส '+id+' มีอยู่แล้ว กรุณาตรวจรหัสก่อนเพิ่ม')}
   if(!name)add(i,'name','กรุณากรอกชื่อภาษาอังกฤษ');else if(name.length>200)add(i,'name','ชื่อยาวเกิน 200 ตัวอักษร');
   if(!position)add(i,'position','กรุณากรอกตำแหน่ง');else if(position.length>200)add(i,'position','ตำแหน่งยาวเกิน 200 ตัวอักษร');
   if(!validDate(date))add(i,'startDate','กรุณากรอกวันที่เริ่มงานจริง');
   if(!['Permanent','Subcontractor'].includes(type))add(i,'contractType','กรุณาเลือกประเภทพนักงาน');
   if(photo&&(!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(photo)||photo.length>2*1024*1024))add(i,'photoData','รูปภาพไม่ถูกต้องหรือใหญ่เกินไป');
  });return issues.sort((a,b)=>a.row-b.row);
 }
 function validateBatch(batch){
  if(!batch||typeof batch.key!=='string'||!/^EMPIMPORT-[a-z0-9-]{8,100}$/i.test(batch.key))throw Error('รายการนำเข้าไม่ถูกต้อง');
  const scope={division:clean(batch.scope?.division),plant:clean(batch.scope?.plant)},section=clean(batch.section);
  if(!scope.division||!scope.plant||!section)throw Error('กรุณาเลือกฝ่าย โรงงาน และ Section');
  if(!Array.isArray(batch.employees)||!batch.employees.length||batch.employees.length>MAX_ROWS)throw Error('นำเข้าได้ครั้งละ 1–100 คน');
  const issues=reviewRows(batch.employees);if(issues.length)throw Error('แถว '+(issues[0].row+1)+': '+issues[0].message);
  const rows=batch.employees.map(r=>{
   const id=clean(r.id),name=clean(r.name),position=clean(r.position),startDate=clean(r.startDate),contractType=clean(r.contractType),photoData=clean(r.photoData);
   return {id,name,thaiName:clean(r.thaiName).slice(0,200),position,startDate,contractType,section,organizationDivision:scope.division,organizationPlant:scope.plant,photoData,photoUrl:'',employeeImportKey:batch.key,importSourceDuty:clean(r.sourceDuty||r.importSourceDuty).slice(0,500),updatedAt:batch.updatedAt||new Date().toISOString()};
  });return {key:batch.key,scope,section,employees:rows,updatedAt:rows[0].updatedAt};
 }
 function safePath(path){const s=String(path).replace(/\\/g,'/');if(s.startsWith('/')||s.split('/').some(x=>x==='..')||/^[a-z]:/i.test(s))throw Error('พบชื่อไฟล์ที่ไม่ปลอดภัยใน ZIP');return s}
 async function readFile(file,photoConverter){
  if(!file||file.size>MAX_FILE)throw Error('เลือกไฟล์ ZIP หรือ CSV ขนาดไม่เกิน 30 MB');
  let input,zip=null,files=[],total=0;
  if(/\.zip$/i.test(file.name)){
   if(!window.JSZip)throw Error('โหลดระบบ ZIP ไม่ครบ กรุณารีเฟรชหน้าเว็บ');
   zip=await window.JSZip.loadAsync(await file.arrayBuffer());files=Object.values(zip.files).filter(x=>!x.dir);
   if(files.length>250)throw Error('ZIP มีไฟล์มากเกินไป');
   for(const f of files){safePath(f.unsafeOriginalName||f.name);total+=Number(f._data?.uncompressedSize||0);if(total>MAX_UNPACKED)throw Error('ข้อมูลใน ZIP ใหญ่เกิน 60 MB')}
   const csv=files.filter(f=>/\.(csv)$/i.test(f.name)&&!f.name.startsWith('__MACOSX/'));
   const entry=csv.find(f=>/(^|\/)employees\.csv$/i.test(f.name))||(csv.length===1?csv[0]:null);if(!entry)throw Error('ZIP ต้องมี employees.csv หรือ CSV เพียงไฟล์เดียว');
   input=await entry.async('string');if(input.length>2*1024*1024)throw Error('CSV ใหญ่เกินไป');
   const base=entry.name.slice(0,entry.name.lastIndexOf('/')+1);input=parseCSV(input).map(normalizeRow);
   for(const r of input){if(!r.photoFile)continue;const relative=safePath(r.photoFile),entry=zip.file(base+relative)||zip.file(relative);if(!entry)throw Error('ไม่พบรูป '+r.photoFile);
    if(!/\.(jpe?g|png|webp)$/i.test(entry.name))throw Error('รูปต้องเป็น JPG, PNG หรือ WebP');
    if(Number(entry._data?.uncompressedSize||0)>8*1024*1024)throw Error('รูป '+r.photoFile+' ใหญ่เกิน 8 MB');
    const bytes=await entry.async('uint8array');if(bytes.length>8*1024*1024)throw Error('รูปใหญ่เกิน 8 MB');
    const mime=/\.png$/i.test(entry.name)?'image/png':/\.webp$/i.test(entry.name)?'image/webp':'image/jpeg';
    r.photoData=await photoConverter(new File([bytes],entry.name.split('/').pop(),{type:mime}));
   }
  }else if(/\.csv$/i.test(file.name)){
   const text=await file.text();if(text.length>2*1024*1024)throw Error('CSV ใหญ่เกินไป');input=parseCSV(text).map(normalizeRow);
   if(input.some(r=>r.photoFile))throw Error('CSV อ้างอิงรูป กรุณารวม CSV กับโฟลเดอร์รูปเป็น ZIP');
  }else throw Error('รองรับไฟล์ ZIP และ CSV เท่านั้น');
  return input;
 }
 function label(value){return window.PPMSLanguage?.translate?.(String(value),'th')||String(value)}
 function context(){return window.PPMS_RUNTIME?.employeeImportContext?.()}
 function sameScope(a,b){return a?.division===b?.division&&a?.plant===b?.plant}
 function downloadTemplate(){const data='\ufeffemployee_id,name,thai_name,position,start_date,contract_type,photo_file\r\n,,,,,,\r\n',url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='employee_import_template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 let dialog=null,state=null;
 function close(){if(state?.busy)return;if(dialog){dialog.close();dialog.remove();dialog=null;state=null}}
 function open(){
  const ctx=context();if(!ctx?.allowed)return;
  if(dialog)return;state={scope:{...ctx.scope},section:ctx.section,rows:[],busy:false,batch:null};
  dialog=document.createElement('dialog');dialog.className='employee-import-dialog';dialog.setAttribute('aria-labelledby','employeeImportTitle');
  dialog.innerHTML=`<header><h2 id="employeeImportTitle">อัปโหลดรายชื่อพร้อมรูป</h2><button type="button" data-import-close aria-label="ปิด">ปิด</button></header><p>เพิ่มพนักงานใหม่ใน ${esc(label(ctx.scope.division))} · ${esc(ctx.scope.plant)} โดยคงรายชื่อเดิมไว้</p><label>Section ปลายทาง<select data-import-section>${ctx.sections.map(s=>`<option value="${esc(s)}" ${s===ctx.section?'selected':''}>${esc(label(s))}</option>`).join('')}</select></label><div class="employee-import-upload"><label>ไฟล์ ZIP หรือ CSV (ไม่เกิน 30 MB)<input type="file" accept=".zip,.csv" data-import-file></label><button type="button" data-import-template>ดาวน์โหลดแบบฟอร์ม CSV</button><p>ZIP: รวม employees.csv และโฟลเดอร์รูป ใช้ได้กับไฟล์ Warehouse_Employees_With_Photos.zip</p></div><div class="employee-import-common"><strong>กรอกให้ทุกแถวที่ยังว่าง</strong><label>ตำแหน่ง<input data-import-common="position" placeholder="เช่น Operator"></label><label>วันที่เริ่มงาน<input type="date" data-import-common="startDate"></label><label>ประเภทพนักงาน<select data-import-common="contractType"><option value="">เลือกประเภท</option><option value="Permanent">พนักงานประจำ</option><option value="Subcontractor">พนักงานซัพคอนแทรค</option></select></label><button type="button" data-import-apply>เติมช่องว่าง</button></div><p role="status" aria-live="polite" data-import-message>เลือกไฟล์เพื่อตรวจรายชื่อและรูปก่อนบันทึก</p><div class="employee-import-table"></div><footer><p role="status" aria-live="polite" id="employeeImportValidationSummary" data-import-footer-message>เลือกไฟล์เพื่อตรวจรายชื่อก่อนบันทึก</p><button type="button" data-import-save disabled>ยืนยันเพิ่มพนักงาน</button><button type="button" data-import-discard hidden>ล้างรายการรอในเครื่อง</button><button type="button" data-import-close>ปิด</button></footer>`;
  document.body.append(dialog);dialog.showModal();
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});dialog.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-import-close'))return close();if(b.hasAttribute('data-import-template'))return downloadTemplate();if(b.hasAttribute('data-import-discard')){localStorage.removeItem(PENDING);state.batch=null;state.complete=false;for(const el of dialog.querySelectorAll('input,select,button'))el.disabled=false;b.hidden=true;message('ล้างรายการรอในเครื่องแล้ว รายชื่อที่บันทึกแล้วจะยังอยู่');check();return}if(b.hasAttribute('data-import-apply')){for(const input of dialog.querySelectorAll('[data-import-common]'))if(input.value)for(const r of state.rows)if(!r[input.dataset.importCommon])r[input.dataset.importCommon]=input.value;draw();return}if(b.hasAttribute('data-import-save'))await save()});
  dialog.querySelector('[data-import-section]').onchange=e=>{state.section=e.target.value;check()};
  dialog.querySelector('[data-import-file]').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;lock(true);message('กำลังอ่านรายชื่อและเตรียมรูป...');try{state.rows=await readFile(file,f=>window.PPMS_RUNTIME.employeePhotoData(f));state.batch=null;draw()}catch(err){state.rows=[];draw();message(err.message,true)}finally{lock(false);check()}};
  try{const pending=JSON.parse(localStorage.getItem(PENDING)||'null');if(pending){if(!sameScope(pending.scope,state.scope))message('มีรายการนำเข้ารอส่งในฝ่ายหรือโรงงานอื่น กรุณาเปิดฝ่ายและโรงงานนั้นก่อน',true);else{state.batch=validateBatch(pending);state.section=pending.section;state.rows=state.batch.employees;dialog.querySelector('[data-import-section]').value=pending.section;draw();lock(false);freeze();message('พบรายการรอการยืนยัน กดนำเข้าซ้ำเพื่อตรวจและบันทึกรายการเดิม โดยไม่เพิ่มซ้ำ');check()}}}catch{dialog.querySelector('[data-import-discard]').hidden=false;message('อ่านรายการรอส่งไม่ได้ กรุณาตรวจข้อมูลในหน้าค้นหาพนักงานก่อนลองใหม่',true)}
 }
 function message(text,error=false){if(!dialog)return;for(const el of dialog.querySelectorAll('[data-import-message],[data-import-footer-message]')){el.textContent=text;el.classList.toggle('employee-import-error',error)}}
 function freeze(){dialog.querySelector('[data-import-discard]').hidden=false;for(const input of dialog.querySelectorAll('input,select,[data-import-apply]'))input.disabled=true}
 function lock(busy){state.busy=busy;for(const el of dialog.querySelectorAll('input,select,button'))el.disabled=busy;dialog.setAttribute('aria-busy',String(busy));if(!busy&&state.batch)freeze()}
 function rowsFromUI(){for(const input of dialog.querySelectorAll('[data-import-row]'))state.rows[Number(input.dataset.importRow)][input.dataset.field]=input.value}
 function draw(){
  const table=dialog.querySelector('.employee-import-table');if(!state.rows.length){table.innerHTML='';return}
  table.innerHTML=`<table><thead><tr><th>รูป</th><th>รหัสพนักงาน</th><th>ชื่อภาษาอังกฤษ</th><th>ชื่อภาษาไทย</th><th>ตำแหน่ง</th><th>วันที่เริ่มงาน</th><th>ประเภทพนักงาน</th></tr></thead><tbody>${state.rows.map((r,i)=>`<tr><td>${r.photoData?`<img src="${esc(r.photoData)}" alt="รูป ${esc(r.name)}">`:'ไม่มีรูป'}</td>${['id','name','thaiName','position','startDate','contractType'].map(field=>`<td>${field==='contractType'?`<select data-import-row="${i}" data-field="${field}" aria-label="ประเภทพนักงาน แถว ${i+1}"><option value="">เลือกประเภท</option><option value="Permanent" ${r[field]==='Permanent'?'selected':''}>ประจำ</option><option value="Subcontractor" ${r[field]==='Subcontractor'?'selected':''}>ซัพคอนแทรค</option></select>`:`<input type="${field==='startDate'?'date':'text'}" data-import-row="${i}" data-field="${field}" aria-label="${{id:'รหัสพนักงาน',name:'ชื่อภาษาอังกฤษ',thaiName:'ชื่อภาษาไทย',position:'ตำแหน่ง',startDate:'วันที่เริ่มงาน'}[field]} แถว ${i+1}" value="${esc(r[field]||'')}">`}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  table.oninput=()=>{rowsFromUI();check()};table.onchange=table.oninput;check();
 }
 function previewBatch(){return validateBatch({key:'EMPIMPORT-preview00',scope:state.scope,section:state.section,employees:state.rows})}
 function check(focus=false){
  if(!state||state.busy)return false;
  const button=dialog.querySelector('[data-import-save]'),ctx=context();
  if(state.complete){button.disabled=true;button.textContent='บันทึกแล้ว '+state.rows.length+' คน';return false}
  button.disabled=true;
  if(!ctx?.allowed||!sameScope(ctx.scope,state.scope)){message('สิทธิ์ ฝ่าย หรือโรงงานเปลี่ยน กรุณาปิดแล้วเปิดหน้านำเข้าใหม่',true);return false}
  if(!state.rows.length)return false;
  const issues=reviewRows(state.rows,state.batch?[]:ctx.employees),byField=new Map();
  for(const issue of issues)byField.set(issue.row+':'+issue.field,issue);
  for(const input of dialog.querySelectorAll('[data-import-row]')){
   const issue=byField.get(input.dataset.importRow+':'+input.dataset.field);
   if(issue){input.setAttribute('aria-invalid','true');input.title=issue.message;input.setAttribute('aria-describedby','employeeImportValidationSummary')}
   else{input.removeAttribute('aria-invalid');input.removeAttribute('title');input.removeAttribute('aria-describedby')}
  }
  button.disabled=false;
  if(issues.length){
   const counts=new Map();for(const issue of issues)counts.set(issue.field,(counts.get(issue.field)||0)+1);
   const first=issues[0],name=clean(state.rows[first.row].name),summary=[...counts].map(([field,n])=>fieldLabels[field]+' '+n+' ช่อง').join(', ');
   button.textContent='ตรวจข้อมูลก่อนบันทึก ('+state.rows.length+' คน)';
   message('ต้องแก้ '+issues.length+' ช่อง: '+summary+' · แถว '+(first.row+1)+(name?' ('+name+')':'')+': '+first.message,true);
   if(focus){const input=dialog.querySelector('[data-import-row="'+first.row+'"][data-field="'+first.field+'"]');input?.focus({preventScroll:true});input?.scrollIntoView({block:'center',inline:'center',behavior:'smooth'})}
   return false;
  }
  try{
   if(!state.batch)previewBatch();
   const pending=JSON.parse(localStorage.getItem(PENDING)||'null');if(pending&&!state.batch)throw Error('มีรายการรอการยืนยัน กรุณาทำรายการเดิมให้เสร็จก่อน');
   button.textContent=state.batch?'นำเข้าซ้ำ / ตรวจการบันทึก':'ยืนยันเพิ่มพนักงาน '+state.rows.length+' คน';
   message((state.batch?'รายการรอการยืนยัน: ':'พร้อมนำเข้า: ')+state.rows.length+' คน · '+state.rows.filter(r=>r.photoData).length+' รูป · '+label(state.section));return true;
  }catch(err){button.textContent='ตรวจข้อมูลก่อนบันทึก ('+state.rows.length+' คน)';message(err.message,true);return false}
 }
 async function save(){
  if(state?.busy||state?.complete)return;rowsFromUI();if(!check(true))return;
  try{
   if(!state.batch){const key='EMPIMPORT-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));state.batch=validateBatch({key,scope:state.scope,section:state.section,employees:state.rows});localStorage.setItem(PENDING,JSON.stringify(state.batch))}
   lock(true);message('กำลังบันทึกและตรวจยืนยันรายชื่อกับรูป...');
   const result=await window.PPMS_RUNTIME.importEmployeeBatch(state.batch);
   if(result.importedIds.length!==state.rows.length)throw Error('ยังยืนยันจำนวนพนักงานไม่ครบ');
   localStorage.removeItem(PENDING);dialog.querySelector('[data-import-discard]').hidden=true;state.busy=false;
   for(const b of dialog.querySelectorAll('[data-import-close]'))b.disabled=false;
   message('บันทึกสำเร็จ '+result.importedIds.length+' คน พร้อมรูป '+state.rows.filter(r=>r.photoData).length+' รูป ใน '+label(state.scope.division)+' · '+state.scope.plant+' · '+label(state.section));
   state.complete=true;dialog.querySelector('[data-import-save]').disabled=true;dialog.querySelector('[data-import-save]').textContent='บันทึกแล้ว '+result.importedIds.length+' คน';
  }catch(err){if(state?.batch)try{if(localStorage.getItem(PENDING)!==JSON.stringify(state.batch))state.batch=null}catch{}lock(false);check();message('ยังไม่ยืนยันการบันทึก: '+(err.message||String(err)),true)}
 }
 function mount(){
  const ctx=context(),host=document.getElementById('app');if(!host)return;
  let box=host.querySelector('[data-employee-import-toolbar]');
  if(!ctx?.admin||!['section','sectionChart','add','export'].includes(ctx.page)){box?.remove();return}
  if(!box){box=document.createElement('div');box.dataset.employeeImportToolbar='1';box.className='employee-import-toolbar no-print';box.innerHTML='<button type="button" data-open-employee-import>อัปโหลดรายชื่อพร้อมรูป</button><span></span>';host.prepend(box);box.querySelector('button').onclick=open}
  box.querySelector('button').disabled=!ctx.allowed;const hint=ctx.allowed?'ZIP / CSV · ตรวจข้อมูลก่อนบันทึก':'บัญชีนี้ดูข้อมูลได้อย่างเดียว';if(box.querySelector('span').textContent!==hint)box.querySelector('span').textContent=hint;
 }
 let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
 window.PPMSEmployeeImport={parseCSV,normalizeRow,reviewRows,validateBatch,readFile,open};
 new MutationObserver(queue).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 for(const event of ['ppms-account-permissions-changed','ppms-organization-scope-changed','ppms-employees-changed'])window.addEventListener(event,()=>{queue();if(dialog&&!state?.complete)check()});
 queue();
})();
