/* Production line views share one assignment model across organization charts. */
(()=>{
 'use strict';
 const CACHE='ppms_production_lines_v950',OUTBOX='ppms_production_lines_outbox_v950';
 const values=['1','2','3','shared','unassigned'];
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lang=()=>window.PPMSLanguage?.language==='en'?'en':'th';
 const text=(th,en)=>lang()==='en'?en:th;
 const scope=()=>window.PPMS_RUNTIME?.organizationScope?.()||window.PPMSOrganizationScope.current();
 const encoded=value=>encodeURIComponent(String(value)).replace(/\./g,'%2E');
 const key=value=>'scope_'+Array.from(new TextEncoder().encode(JSON.stringify([value.division,value.plant])),byte=>byte.toString(16).padStart(2,'0')).join('');
 const sectionKey=value=>'section_'+encoded(window.PPMSOrganizationScope.sectionGroupKey(value));
 const personKey=value=>'person_'+encoded(value);
 const admin=()=>sessionStorage.getItem('ppms_admin')==='1'&&window.PPMSAccess?.canEdit()!==false&&(!window.PPMS_RUNTIME||window.PPMS_RUNTIME.factoryLayoutIsAdmin());
 let cache=read(CACHE,{}),jobs=read(OUTBOX,[]),syncing=false,unsubscribe=null,retry=null,notice='';
 function label(value,language=lang()){
  const en=language==='en';
  return /^[123]$/.test(value)?(en?'Line ':'ไลน์ ')+value:({all:en?'All lines':'รวมทุกไลน์',shared:en?'Shared across lines':'ดูแลทุกไลน์',unassigned:en?'Unassigned':'ยังไม่จัดไลน์',inherit:en?'Use default':'ตามค่าเริ่มต้น'}[value]||value);
 }
 function selection(value=scope()){const saved=sessionStorage.getItem('ppms_org_line::'+key(value));return value.division==='Production Division'&&['1','2','3','unassigned'].includes(saved)?saved:'all'}
 function patchRecord(record,patch){
  const next={sections:{...(record?.sections||{})},employees:{...(record?.employees||{})}};
  for(const [path,value]of Object.entries(patch)){const [group,id]=path.split('/');if(!['sections','employees'].includes(group)||!id)continue;if(value===null)delete next[group][id];else next[group][id]=value}
  return next;
 }
 function record(value=scope()){let result=cache[key(value)]||{};for(const job of jobs)if(key(job.scope)===key(value))result=patchRecord(result,job.patch);return result}
 function assignment(employee,value=scope(),data=record(value)){
  const own=data.employees?.[personKey(employee.id)];if(values.includes(own))return own;
  if(/manager|ผู้จัดการ/i.test(String(employee.position||'')))return 'shared';
  return data.sections?.[sectionKey(employee.section)]||'unassigned';
 }
 function filter(list,value=scope(),selected=selection(value)){
  if(value.division!=='Production Division'||selected==='all')return list;
  const data=record(value);return list.filter(e=>{const line=assignment(e,value,data);return line===selected||(selected!=='unassigned'&&line==='shared')});
 }
 function visibleSection(section,people,value=scope()){
  const selected=selection(value);if(selected==='all'||value.division!=='Production Division')return true;
  const data=record(value),line=data.sections?.[sectionKey(section)]||'unassigned';
  return line===selected||(selected!=='unassigned'&&line==='shared')||people.some(e=>!/manager|ผู้จัดการ/i.test(String(e.position||''))&&sectionKey(e.section)===sectionKey(section));
 }
 function suffix(value=scope(),language=lang()){const selected=selection(value);return selected==='all'?'':' — '+label(selected,language)}
 function controlsMarkup(value=scope()){
  if(value.division!=='Production Division')return '';
  return `<div class="production-line-controls no-print" data-i18n-ignore><label>${text('ผังองค์กรตามไลน์','Organization by line')}<select data-org-line-select>${['all','1','2','3','unassigned'].map(id=>`<option value="${id}" ${selection(value)===id?'selected':''}>${esc(label(id))}</option>`).join('')}</select></label>${admin()?`<button type="button" class="secondary" data-org-line-settings>${text('จัดไลน์ / กำหนดพนักงาน','Assign sections / employees')}</button>`:''}<small>${text('รวมผู้ที่กำหนดให้ดูแลทุกไลน์ในยอดของแต่ละไลน์','Shared staff are included in each line’s headcount')}</small><span role="status" data-org-line-status>${esc(notice|| (jobs.length?text('บันทึกในเครื่องแล้ว รอซิงก์','Saved locally, awaiting sync'):''))}</span></div>`;
 }
 function roster(value=scope()){
  let list=window.PPMS_RUNTIME?.factoryLayoutEmployees?.();if(!list){const raw=read('ppms_v3_employees',[]);list=Array.isArray(raw)?raw:Object.values(raw);const deleted=new Set(read('ppms_v3_deleted_employee_ids',[]).map(String));list=list.filter(e=>!deleted.has(String(e.id)))}
  return window.PPMSOrganizationScope.employees(list,value);
 }
 function changed(immediate=false){
  window.PPMS_RUNTIME?.refreshOrganizationChart?.(immediate);
  window.dispatchEvent(new Event('ppms-production-lines-changed'));
 }
 function persist(){localStorage.setItem(CACHE,JSON.stringify(cache));localStorage.setItem(OUTBOX,JSON.stringify(jobs))}
 function updateStatus(){document.querySelectorAll('[data-org-line-status]').forEach(node=>node.textContent=notice||(jobs.length?text('บันทึกในเครื่องแล้ว รอซิงก์','Saved locally, awaiting sync'):''))}
 async function request(value,options={}){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error(text('ยังไม่ได้เชื่อมต่อฐานข้อมูล','Database is not connected'));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(base+'/settings/productionLines/'+key(value)+'.json',{...options,signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}
 }
 async function sync(){
  if(syncing||!admin()||navigator.onLine===false||!jobs.length)return;
  syncing=true;clearTimeout(retry);
  try{
   while(jobs.length&&admin()){
    const job=jobs[0];await request(job.scope,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(job.patch)});
    // PATCH touches only edited assignments; other users' assignments stay intact.
    cache[key(job.scope)]=patchRecord(cache[key(job.scope)],job.patch);jobs=jobs.filter(row=>row.id!==job.id);persist();
   }
   notice=jobs.length?'':text('บันทึกไลน์เรียบร้อยแล้ว','Line assignments saved');changed();
  }catch(error){notice=text('บันทึกในเครื่องแล้ว รอซิงก์: ','Saved locally, awaiting sync: ')+error.message;retry=setTimeout(()=>void sync(),30000)}
  finally{syncing=false;updateStatus()}
 }
 function saveAssignments(patch,value=scope()){
  if(!admin())throw Error(text('กรุณาเข้าสู่ระบบ Admin ที่มีสิทธิ์แก้ไข','Sign in as an Admin with edit access'));
  if(value.division!=='Production Division'||key(value)!==key(scope()))throw Error(text('โรงงานเปลี่ยนแล้ว กรุณาเปิดหน้าจัดไลน์ใหม่','Plant changed. Reopen line assignments.'));
  for(const [path,line]of Object.entries(patch)){if(!/^(sections\/section_|employees\/person_)/.test(path)||path.split('/').length!==2||line!==null&&!values.includes(line))throw Error('Invalid line assignment')}
  if(!Object.keys(patch).length)return;
  const job={id:crypto.randomUUID?.()||Date.now()+'_'+Math.random(),scope:{...value},patch};
  const next=[...jobs,job];localStorage.setItem(OUTBOX,JSON.stringify(next));jobs=next;notice='';changed(true);void sync();
 }
 function open(){
  if(!admin())return;
  const captured={...scope()},people=roster(captured).sort((a,b)=>String(a.section).localeCompare(String(b.section))||String(a.id).localeCompare(String(b.id),undefined,{numeric:true})),data=record(captured);
  const sections=window.PPMSOrganizationScope.sections(people,captured,window.PPMSOrganizationScope.master().sections||[]);
  const options=(selected,inherit=false)=>(inherit?['inherit',...values]:values).map(id=>`<option value="${id}" ${selected===id?'selected':''}>${esc(label(id))}</option>`).join('');
  document.getElementById('productionLineDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='productionLineDialog';dialog.className='production-line-dialog';dialog.setAttribute('data-i18n-ignore','');
  dialog.innerHTML=`<form><header><h2>${text('จัดไลน์การผลิต — ','Assign production lines — ')}${esc(captured.plant)}</h2><button type="button" data-line-close aria-label="${text('ปิด','Close')}">×</button></header><p>${text('กำหนดไลน์ให้แผนกก่อน หากแผนกเดียวมีหลายไลน์ ให้กำหนดพนักงานรายคนด้านล่าง Manager เริ่มต้นดูแลทุกไลน์','Assign each section, then override individual employees when a section spans multiple lines. Managers are shared by default.')}</p><h3>${text('1. ไลน์ประจำแผนก','1. Section assignments')}</h3><div class="line-section-grid">${sections.map(section=>`<label>${esc(window.PPMSOrganizationScope.sectionLabel(section,captured))}<select data-line-path="sections/${esc(sectionKey(section))}" data-original="${esc(data.sections?.[sectionKey(section)]||'unassigned')}">${options(data.sections?.[sectionKey(section)]||'unassigned')}</select></label>`).join('')}</div><h3>${text('2. กำหนดเฉพาะพนักงาน','2. Individual overrides')}</h3><label>${text('ค้นหารหัส / ชื่อ / แผนก','Search ID / name / section')}<input type="search" data-line-search autocomplete="off"></label><div class="line-employee-table"><table><thead><tr><th>${text('พนักงาน','Employee')}</th><th>${text('แผนก / ตำแหน่ง','Section / position')}</th><th>${text('ไลน์','Line')}</th></tr></thead><tbody>${people.map(e=>`<tr data-line-person data-search="${esc([e.id,e.name,e.thaiName,e.section,e.position].join(' ').toLowerCase())}"><td><b>${esc(e.id)}</b><br>${esc(e.name||e.thaiName)}</td><td>${esc(e.section)}<br><small>${esc(e.position)}</small></td><td><select aria-label="${esc(e.id)}" data-line-path="employees/${esc(personKey(e.id))}" data-original="${esc(data.employees?.[personKey(e.id)]||'inherit')}">${options(data.employees?.[personKey(e.id)]||'inherit',true)}</select></td></tr>`).join('')}</tbody></table></div><p role="status" data-line-dialog-status></p><footer><button type="submit">${text('บันทึกการจัดไลน์','Save line assignments')}</button><button type="button" class="secondary" data-line-close>${text('ยกเลิก','Cancel')}</button></footer></form>`;
  document.body.append(dialog);dialog.querySelectorAll('[data-line-close]').forEach(button=>button.onclick=()=>{dialog.close?.();dialog.remove()});
  dialog.addEventListener('close',()=>dialog.remove());
  dialog.querySelector('[data-line-search]').oninput=event=>{const query=event.target.value.trim().toLowerCase();dialog.querySelectorAll('[data-line-person]').forEach(row=>row.hidden=!row.dataset.search.includes(query))};
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();try{const patch={};for(const select of dialog.querySelectorAll('[data-line-path]'))if(select.value!==select.dataset.original)patch[select.dataset.linePath]=select.value==='inherit'?null:select.value;saveAssignments(patch,captured);dialog.close?.();dialog.remove()}catch(error){dialog.querySelector('[data-line-dialog-status]').textContent=error.message}};
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 async function bindRemote(){
  unsubscribe?.();unsubscribe=null;const captured={...scope()};if(captured.division!=='Production Division')return;
  const apply=value=>{const before=JSON.stringify(record(captured));cache[key(captured)]=value||{};persist();if(before!==JSON.stringify(record(captured)))changed()};
  try{if(window.firebase?.apps?.length){const ref=firebase.database().ref('settings/productionLines/'+key(captured)),callback=snapshot=>apply(snapshot.val());ref.on('value',callback,()=>{});unsubscribe=()=>ref.off('value',callback)}else apply(await request(captured))}catch{}
 }
 document.addEventListener('change',event=>{if(!event.target.matches?.('[data-org-line-select]'))return;const value=event.target.value;if(!['all','1','2','3','unassigned'].includes(value))return;sessionStorage.setItem('ppms_org_line::'+key(scope()),value);document.activeElement?.blur();changed(true)});
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-org-line-settings]'))open()});
 window.addEventListener('ppms-organization-scope-changed',()=>{document.getElementById('productionLineDialog')?.remove();void bindRemote()});
 window.addEventListener('online',()=>void sync());
 window.addEventListener('ppms-account-permissions-changed',()=>{changed();void sync()});
 window.addEventListener('ppms-language-changed',()=>changed(true));
 window.addEventListener('storage',event=>{if([CACHE,OUTBOX].includes(event.key)){cache=read(CACHE,{});jobs=read(OUTBOX,[]);changed()}});
 const start=()=>{void bindRemote();void sync()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.PPMSProductionLines={selection,filter,assignment,visibleSection,controlsMarkup,suffix,label,open,saveAssignments,sync,record,key,sectionKey,personKey,get pending(){return jobs.slice()}};
})();
