/* Original teaching files are stored separately from generated slides and training evidence. */
(()=>{
 'use strict';
 const MAX=20*1024*1024,TYPES={pdf:'application/pdf',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const canEdit=()=>window.PPMSTrainingLessonEditor?.canEdit()===true;
 const suffix=input=>window.PPMSTrainingLessonEditor.identity(input).replace(/^ppmsTrainingLessonDecks\//,'');
 const safeName=name=>{const clean=String(name||'สไลด์อบรม').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'-').replace(/^[. ]+|[. ]+$/g,'')||'สไลด์อบรม',extension=clean.match(/\.(?:pdf|pptx?)$/i)?.[0]||'';return clean.length>200?clean.slice(0,200-extension.length)+extension:clean;};
 const sizeLabel=size=>size<1024*1024?Math.max(1,Math.ceil(size/1024)).toLocaleString('th-TH')+' KB':(size/1024/1024).toLocaleString('th-TH',{maximumFractionDigits:2})+' MB';
 let active=null,zipLoading=null;
 function zipReady(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(!zipLoading)zipLoading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='vendor/jszip-3.10.1.min.js';const failed=()=>{clearTimeout(timer);script.remove();zipLoading=null;reject(Error('โหลดตัวอ่าน PowerPoint ไม่สำเร็จ กรุณาลองอีกครั้ง'));},timer=setTimeout(failed,15000);script.onload=()=>{clearTimeout(timer);if(window.JSZip)resolve(window.JSZip);else failed();};script.onerror=failed;document.head.append(script);
  });return zipLoading;
 }
 async function request(path,options={},timeout=12000){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base||navigator.onLine===false)throw Error('กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อจัดเก็บหรือเปิดไฟล์');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetch(base+'/'+path+'.json',{...options,signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error(response.status===401||response.status===403?'ไม่มีสิทธิ์เข้าถึงไฟล์สไลด์':'เชื่อมต่อไฟล์ไม่สำเร็จ ('+response.status+')');return response.status===204?null:await response.json();}
  catch(error){if(error.name==='AbortError')throw Error('ยังไม่ได้รับการยืนยันจากฐานข้อมูล กรุณาลองอีกครั้ง');throw error;}finally{clearTimeout(timer);}
 }
 function read(file,kind){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('อ่านไฟล์ '+file.name+' ไม่สำเร็จ'));kind==='buffer'?reader.readAsArrayBuffer(file):reader.readAsDataURL(file);});}
 async function prepareFile(file){
  const ext=String(file?.name||'').split('.').pop().toLowerCase();
  if(!TYPES[ext])throw Error('รองรับเฉพาะไฟล์ .ppt .pptx และ .pdf');
  if(!file.size||file.size>MAX)throw Error('ไฟล์ต้องมีขนาดมากกว่า 0 และไม่เกิน 20 MB');
  const bytes=new Uint8Array(await read(file,'buffer')),prefix=[...bytes.slice(0,8)].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(ext==='pdf'&&!prefix.startsWith('255044462d')||ext==='ppt'&&prefix!=='d0cf11e0a1b11ae1'||ext==='pptx'&&!prefix.startsWith('504b0304'))throw Error('เนื้อหาไฟล์ไม่ตรงกับนามสกุล กรุณาเลือกไฟล์สไลด์ต้นฉบับ');
  if(ext==='pptx'){
   const Zip=await zipReady();let zip;try{zip=await Zip.loadAsync(bytes);}catch{throw Error('ไฟล์ PowerPoint ไม่สมบูรณ์หรือเปิดไม่ได้');}
   if(!zip.file('[Content_Types].xml')||!zip.file('ppt/presentation.xml'))throw Error('ไฟล์นี้ไม่ใช่ PowerPoint .pptx ที่ถูกต้อง');
  }
  const url=String(await read(file,'data')),data=url.slice(url.indexOf(',')+1);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw Error('อ่านข้อมูลไฟล์ไม่สำเร็จ');
  return {name:safeName(file.name),ext,type:TYPES[ext],size:file.size,data};
 }
 function validMeta(value){return value&&typeof value.id==='string'&&/^[A-Za-z0-9-]+$/.test(value.id)&&TYPES[value.ext]===value.type&&Number.isInteger(value.size)&&value.size>0&&value.size<=MAX&&typeof value.name==='string';}
 function fileBlob(file,meta){
  if(!validMeta(file)||file.id!==meta.id||file.type!==meta.type||file.size!==meta.size||typeof file.data!=='string'||file.data.length>MAX*1.34||!/^[A-Za-z0-9+/]+={0,2}$/.test(file.data))throw Error('ข้อมูลไฟล์ไม่สมบูรณ์ กรุณาติดต่อผู้อัปโหลด');
  const binary=atob(file.data);if(binary.length!==file.size)throw Error('ขนาดไฟล์ไม่ตรงกับข้อมูลที่จัดเก็บ');
  const chunks=[];for(let i=0;i<binary.length;i+=65536)chunks.push(Uint8Array.from(binary.slice(i,i+65536),c=>c.charCodeAt(0)));
  return new Blob(chunks,{type:file.type});
 }
 function open(input,trigger=document.activeElement){
  if(active&&active.close()===false)return active;
  const key=suffix(input),indexPath='ppmsTrainingLessonFileIndex/'+key,filePath='ppmsTrainingLessonFiles/'+key;
  const overlay=document.createElement('div');overlay.className='tl-files-overlay';overlay.setAttribute('data-i18n-ignore','');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','tlFilesTitle');
  overlay.innerHTML='<section class="tl-files-shell"><header><div><small>สื่อการอบรมที่จัดเก็บ</small><h2 id="tlFilesTitle">'+esc(input.item.title)+'</h2><p>'+esc(input.ctx.section)+' · '+esc(input.q)+' / '+esc(input.ctx.year)+'</p></div><button type="button" data-files-close>ปิด</button></header><div class="tl-files-body">'+(canEdit()?'<form data-files-upload><label>อัปโหลดสไลด์ที่มีอยู่<input type="file" name="materials" multiple accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"></label><p>เลือกได้หลายไฟล์ · ไฟล์ละไม่เกิน 20 MB · จัดเก็บในหัวข้อ Section และไตรมาสนี้</p><button type="submit">อัปโหลดและจัดเก็บ</button></form>':'')+'<p class="tl-files-note">PDF เปิดดูในเว็บได้ · PowerPoint ดาวน์โหลดเพื่อเปิดหรือแก้ไขใน Microsoft PowerPoint</p><div class="tl-files-list-head"><h3>ไฟล์ที่จัดเก็บ</h3><button type="button" data-files-refresh>โหลดรายการล่าสุด</button></div><p data-files-status role="status" aria-live="polite"></p><div data-files-list></div><section data-files-preview hidden><div><h3 data-preview-name></h3><button type="button" data-preview-close>ปิดตัวอย่าง</button></div><iframe title="ตัวอย่างไฟล์ PDF" data-pdf-frame></iframe></section></div></section>';
  const status=overlay.querySelector('[data-files-status]'),list=overlay.querySelector('[data-files-list]'),form=overlay.querySelector('form'),pendingIds=new Map(),completedUploads=new Set();
  let closed=false,busy=false,previewUrl=null,firstLoad=true;const downloadUrls=new Set();
  const say=message=>{if(!closed)status.textContent=message;};
  const lock=value=>{busy=value;for(const node of overlay.querySelectorAll('input,button'))node.disabled=value;};
  function hidePreview(){overlay.querySelector('[data-pdf-frame]').removeAttribute('src');overlay.querySelector('[data-files-preview]').hidden=true;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}}
  function rows(records){
   const files=Object.values(records||{}).filter(validMeta).sort((a,b)=>String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
   list.innerHTML=files.length?'<ul>'+files.map(file=>'<li><div><b>'+esc(file.name)+'</b><small>'+esc(file.ext.toUpperCase())+' · '+esc(sizeLabel(file.size))+' · '+esc(new Date(file.uploadedAt).toLocaleString('th-TH'))+'</small></div><div>'+ (file.ext==='pdf'?'<button type="button" data-file-open="'+file.id+'">เปิด PDF</button>':'')+'<button type="button" data-file-download="'+file.id+'">ดาวน์โหลด</button></div></li>').join('')+'</ul>':'<p class="tl-files-empty">ยังไม่มีไฟล์สไลด์ที่อัปโหลดในหัวข้อนี้</p>';
   const map=new Map(files.map(file=>[file.id,file]));
   list.querySelectorAll('[data-file-open],[data-file-download]').forEach(button=>button.onclick=()=>void access(map.get(button.dataset.fileOpen||button.dataset.fileDownload),button.hasAttribute('data-file-open')));
   return files.length;
  }
  async function load(){
   if(busy||closed)return;lock(true);say('กำลังโหลดรายการไฟล์');
   try{const records=await request(indexPath);if(closed)return;const count=rows(records);say('จัดเก็บแล้ว '+count+' ไฟล์');}catch(error){say('โหลดรายการไม่สำเร็จ: '+error.message);}finally{lock(false);if(firstLoad){firstLoad=false;overlay.querySelector('[data-files-close]').focus();}}
  }
  async function access(meta,preview){
   if(busy||closed||!meta)return;lock(true);say('กำลังเปิด '+meta.name);
   try{
    const file=await request(filePath+'/'+meta.id,{},60000);if(closed)return;const blob=fileBlob(file,meta),url=URL.createObjectURL(blob);
    if(preview){hidePreview();previewUrl=url;overlay.querySelector('[data-preview-name]').textContent=meta.name;overlay.querySelector('[data-pdf-frame]').src=url;overlay.querySelector('[data-files-preview]').hidden=false;overlay.querySelector('[data-files-preview]').scrollIntoView({block:'nearest'});say('เปิด PDF: '+meta.name);}
    else{downloadUrls.add(url);const link=document.createElement('a');link.href=url;link.download=safeName(meta.name);document.body.append(link);link.click();link.remove();say('ดาวน์โหลด '+meta.name);setTimeout(()=>{URL.revokeObjectURL(url);downloadUrls.delete(url);},60000);}
   }catch(error){say('เปิดไฟล์ไม่สำเร็จ: '+error.message);}finally{lock(false);}
  }
  if(form)form.onsubmit=async event=>{
   event.preventDefault();if(!canEdit()){say('บัญชีนี้ไม่มีสิทธิ์อัปโหลดไฟล์');return;}if(busy)return;
   const files=[...form.elements.materials.files];if(!files.length){say('กรุณาเลือกไฟล์สไลด์ก่อน');return;}lock(true);const results=[];
   for(let i=0;i<files.length;i++){
    const file=files[i];say('กำลังจัดเก็บ '+(i+1)+' / '+files.length+' : '+file.name);
    try{
     const retryKey=JSON.stringify([file.name,file.size,file.lastModified]);if(completedUploads.has(retryKey)){results.push({name:file.name,ok:true});continue;}
     const prepared=await prepareFile(file);if(!canEdit())throw Error('บัญชีนี้ไม่มีสิทธิ์อัปโหลดไฟล์');
     let id=pendingIds.get(retryKey);if(!id){id=crypto.randomUUID?.()||'slide-'+Date.now()+'-'+Math.random().toString(36).slice(2);pendingIds.set(retryKey,id);}
     const {data,...info}=prepared,meta={...info,id,topic:input.item.title,uploadedAt:new Date().toISOString(),uploadedBy:sessionStorage.getItem('ppms_admin_user')||'admin'};
     // Both the original bytes and the lightweight list entry commit together.
     await request('',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[filePath+'/'+id]:{...meta,data},[indexPath+'/'+id]:meta})},60000);
     pendingIds.delete(retryKey);completedUploads.add(retryKey);results.push({name:file.name,ok:true});
    }catch(error){results.push({name:file.name,ok:false,error:error.message});}
   }
   lock(false);await load();if(closed)return;
   const good=results.filter(r=>r.ok).length,bad=results.filter(r=>!r.ok);say('จัดเก็บสำเร็จ '+good+' / '+files.length+' ไฟล์'+(bad.length?' · ยังไม่สำเร็จ: '+bad.map(r=>r.name+' ('+r.error+')').join(' · '):' · เปิดจากเครื่องอื่นได้'));
   if(!bad.length)form.reset();
  };
  function close(){if(busy){say('กรุณารอให้จัดเก็บหรือเปิดไฟล์เสร็จก่อนปิด');return false;}closed=true;hidePreview();for(const url of downloadUrls)URL.revokeObjectURL(url);overlay.remove();document.removeEventListener('keydown',keyboard,true);if(trigger?.isConnected)trigger.focus();if(active?.overlay===overlay)active=null;return true;}
  function keyboard(event){
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
   if(event.key==='Tab'){const all=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),iframe')].filter(n=>!n.closest('[hidden]')),first=all[0],last=all.at(-1);if(!overlay.contains(document.activeElement)){event.preventDefault();first?.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }
  overlay.querySelector('[data-files-close]').onclick=close;overlay.querySelector('[data-files-refresh]').onclick=()=>void load();overlay.querySelector('[data-preview-close]').onclick=hidePreview;
  overlay.onclick=event=>{if(event.target===overlay)close();};document.body.append(overlay);document.addEventListener('keydown',keyboard,true);active={overlay,close};void load();overlay.querySelector('[data-files-close]').focus();return active;
 }
 window.PPMSTrainingLessonFiles={open,prepareFile,fileBlob,validMeta,close:()=>active?.close()};
})();
