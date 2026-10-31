/* Production line views share one assignment model across organization charts. */
(()=>{
 'use strict';
 const CACHE='ppms_production_lines_v950',OUTBOX='ppms_production_lines_outbox_v950';
 const values=(value=scope())=>[...lineIds(value),'shared','unassigned'];
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
 function lineIds(value=scope(),data=record(value)){return [...new Set(['1','2','3',...Object.keys(data.lines||{})])].filter(id=>/^[1-9]\d*$/.test(id)&&!data.lines?.[id]?.deleted).sort((a,b)=>Number(a)-Number(b))}
 const viewKey=value=>'ppms_org_tree_view::scope_'+encodeURIComponent(JSON.stringify([value.division,value.plant])).replace(/\./g,'%2E');
 function isLineView(value=scope()){return value.division==='Production Division'&&sessionStorage.getItem(viewKey(value))==='lines'}
 function label(value,language=lang(),valueScope=scope()){
  const en=language==='en';
  return /^[1-9]\d*$/.test(value)?(record(valueScope).lines?.[value]?.name||(en?'Line ':'ไลน์ ')+value):({all:en?'All lines':'รวมทุกไลน์',shared:en?'Shared across lines':'ดูแลทุกไลน์',unassigned:en?'Unassigned':'ยังไม่จัดไลน์',inherit:en?'Use default':'ตามค่าเริ่มต้น'}[value]||value);
 }
 function selection(value=scope()){const saved=sessionStorage.getItem('ppms_org_line::'+key(value));return value.division==='Production Division'&&[...lineIds(value),'unassigned'].includes(saved)?saved:'all'}
 function patchRecord(record,patch){
  const next={...record,sections:{...(record?.sections||{})},employees:{...(record?.employees||{})},lines:{...(record?.lines||{})}};
  for(const [path,value]of Object.entries(patch)){const [group,id]=path.split('/');if(!['sections','employees','lines'].includes(group)||!id)continue;if(value===null)delete next[group][id];else next[group][id]=value}
  return next;
 }
 function record(value=scope()){let result=cache[key(value)]||{};for(const job of jobs)if(key(job.scope)===key(value))result=patchRecord(result,job.patch);return result}
 function assignment(employee,value=scope(),data=record(value)){
  const own=data.employees?.[personKey(employee.id)];if(values(value).includes(own))return own;
  if(/manager|ผู้จัดการ/i.test(String(employee.position||'')))return 'shared';
  const inherited=data.sections?.[sectionKey(employee.section)];return values(value).includes(inherited)?inherited:'unassigned';
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
 function suffix(value=scope(),language=lang()){const selected=selection(value);return selected==='all'?'':' — '+label(selected,language,value)}
 function controlsMarkup(value=scope()){
  if(value.division!=='Production Division')return '';
  return `<div class="production-line-controls no-print" data-i18n-ignore><label>${text('เลือกไลน์','Select line')}<select data-org-line-select>${['all',...lineIds(value),'unassigned'].map(id=>`<option value="${id}" ${selection(value)===id?'selected':''}>${esc(label(id,lang(),value))}</option>`).join('')}</select></label><button type="button" class="${isLineView(value)?'':'secondary'}" data-org-line-view aria-pressed="${isLineView(value)}">${text('จัดผังตามไลน์','Layout by line')}</button>${admin()?`<button type="button" class="secondary" data-org-line-manage>${text('เพิ่ม / ตั้งชื่อไลน์','Add / name lines')}</button><button type="button" class="secondary" data-org-line-settings>${text('จัดไลน์ / กำหนดพนักงาน','Assign sections / employees')}</button>`:''}<small>${text('เพิ่มไลน์ได้ตามต้องการ · พนักงานดูแลทุกไลน์แสดงแยกด้านบน','Add as many lines as needed · Shared staff appear above the lines')}</small><span role="status" data-org-line-status>${esc(notice|| (jobs.length?text('บันทึกในเครื่องแล้ว รอซิงก์','Saved locally, awaiting sync'):''))}</span></div>`;
 }
 function chartMarkup(list,descriptors,person,department,value=scope()){
  const data=record(value),selected=selection(value),groups=new Map();
  for(const employee of list){const id=assignment(employee,value,data);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(employee)}
  const render=id=>{
   const members=groups.get(id)||[],managers=members.filter(e=>/manager|ผู้จัดการ/i.test(String(e.position||''))),workers=members.filter(e=>!managers.includes(e));
   const groupDescriptors=[...descriptors];
   for(const employee of workers)if(!groupDescriptors.some(d=>sectionKey(d.section)===sectionKey(employee.section)))groupDescriptors.push({section:employee.section||'',title:employee.section||text('ไม่ระบุแผนก','No section'),sortingGroup:''});
   const sections=groupDescriptors.filter(d=>workers.some(e=>sectionKey(e.section)===sectionKey(d.section))||data.sections?.[sectionKey(d.section)]===id).map(d=>department(d,workers.filter(e=>sectionKey(e.section)===sectionKey(d.section)))).join('');
   return `<section class="production-line-branch" data-production-line="${esc(id)}" data-i18n-ignore><div class="production-line-heading"><h3>${esc(label(id,lang(),value))}</h3><b data-line-headcount="${esc(id)}">${members.length} ${text('คน','employees')}</b></div>${managers.length?`<div class="production-line-managers people factory-people">${managers.map(person).join('')}</div>`:''}<div class="production-line-sections">${sections||(managers.length?'':`<p class="production-line-empty">${text('ยังไม่มีพนักงานในไลน์นี้ — กดจัดไลน์ / กำหนดพนักงาน','No employees assigned — use Assign sections / employees')}</p>`)}</div></section>`;
  };
  const ids=selected==='all'?lineIds(value):[selected];
  return `<div class="production-lines-chart">${groups.has('shared')?`<div class="production-lines-shared">${render('shared')}</div>`:''}<div class="production-lines-grid">${ids.map(render).join('')}</div>${selected==='all'&&groups.has('unassigned')?render('unassigned'):''}</div>`;
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
  const next=patchRecord(record(value),patch),allowed=[...lineIds(value,next),'shared','unassigned'];
  for(const [path,line]of Object.entries(patch)){
   if(/^lines\/[1-9]\d*$/.test(path)){
    if(!line||typeof line!=='object'||(line.deleted!==true&&(typeof line.name!=='string'||!line.name.trim()||line.name.length>80))||Object.keys(line).some(k=>!['name','deleted'].includes(k)))throw Error('Invalid line name');
   }else if(!/^(sections\/section_|employees\/person_)/.test(path)||path.split('/').length!==2||line!==null&&!allowed.includes(line))throw Error('Invalid line assignment');
  }
  if(!lineIds(value,next).length)throw Error(text('ต้องมีอย่างน้อย 1 ไลน์','Keep at least one line'));
  const removed=lineIds(value).filter(id=>!allowed.includes(id));
  if(removed.some(id=>Object.values(next.sections||{}).includes(id)||Object.values(next.employees||{}).includes(id)))throw Error(text('ไลน์นี้ยังมีแผนกหรือพนักงานอยู่ กรุณาย้ายออกก่อนลบ','Move all section and employee assignments before deleting this line'));
  if(!Object.keys(patch).length)return;
  const job={id:crypto.randomUUID?.()||Date.now()+'_'+Math.random(),scope:{...value},patch};
  const queued=[...jobs,job];localStorage.setItem(OUTBOX,JSON.stringify(queued));jobs=queued;notice='';changed(true);void sync();
 }
 function manage(){
  if(!admin())return;
  const captured={...scope()},data=record(captured);let nextId=Math.max(3,...Object.keys(data.lines||{}).map(Number).filter(Number.isFinite))+1;
  document.getElementById('productionLineNamesDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='productionLineNamesDialog';dialog.className='production-line-dialog';dialog.setAttribute('data-i18n-ignore','');
  const row=(id,name)=>`<div class="production-line-name-row" data-line-name-row="${id}"><label>${text('ไลน์','Line')} ${id}<input data-line-name="${id}" value="${esc(name)}" maxlength="80" required></label><button type="button" class="secondary" data-line-remove="${id}">${text('ลบ','Delete')}</button></div>`;
  dialog.innerHTML=`<form><header><h2>${text('เพิ่ม / ตั้งชื่อไลน์ — ','Add / name lines — ')}${esc(captured.plant)}</h2></header><p>${text('เพิ่มไลน์ได้ตามจำนวนที่ใช้งาน ตั้งชื่อให้ตรงกับหน้างาน การลบไลน์ต้องย้ายแผนกและพนักงานออกก่อน','Add lines and name them to match your factory. Move all assignments out of a line before deleting it.')}</p><div data-line-names>${lineIds(captured).map(id=>row(id,data.lines?.[id]?.name||'')).join('')}</div><button type="button" class="secondary" data-line-add>+ ${text('เพิ่มไลน์','Add line')}</button><p role="status" data-line-name-status></p><footer><button type="submit">${text('บันทึก','Save')}</button><button type="button" class="secondary" data-line-close>${text('ยกเลิก','Cancel')}</button></footer></form>`;
  dialog.querySelectorAll('[data-line-name]').forEach(input=>{if(!input.value)input.value=label(input.dataset.lineName,lang(),captured)});
  const removed=new Set();
  dialog.onclick=event=>{const button=event.target.closest('[data-line-remove]');if(button){removed.add(button.dataset.lineRemove);button.closest('[data-line-name-row]').remove()}if(event.target.closest('[data-line-add]')){const id=String(nextId++);dialog.querySelector('[data-line-names]').insertAdjacentHTML('beforeend',row(id,text('ไลน์ ','Line ')+id));dialog.querySelector(`[data-line-name="${id}"]`).focus()}if(event.target.closest('[data-line-close]'))dialog.remove()};
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();try{const patch={};for(const input of dialog.querySelectorAll('[data-line-name]')){const name=input.value.trim();if(!name||name.length>80)throw Error(text('กรุณาระบุชื่อไลน์','Enter a line name'));if(name!==(data.lines?.[input.dataset.lineName]?.name||label(input.dataset.lineName,lang(),captured)))patch['lines/'+input.dataset.lineName]={name};else if(!lineIds(captured).includes(input.dataset.lineName))patch['lines/'+input.dataset.lineName]={name}}for(const id of removed)if(lineIds(captured).includes(id))patch['lines/'+id]={deleted:true};saveAssignments(patch,captured);dialog.remove()}catch(error){dialog.querySelector('[data-line-name-status]').textContent=error.message}};
  dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 function open(){
  if(!admin())return;
  const captured={...scope()},people=roster(captured).sort((a,b)=>String(a.section).localeCompare(String(b.section))||String(a.id).localeCompare(String(b.id),undefined,{numeric:true})),data=record(captured);
  const sections=window.PPMSOrganizationScope.sections(people,captured,window.PPMSOrganizationScope.master().sections||[]);
  const options=(selected,inherit=false)=>(inherit?['inherit',...values(captured)]:values(captured)).map(id=>`<option value="${id}" ${selected===id?'selected':''}>${esc(label(id))}</option>`).join('');
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
 document.addEventListener('change',event=>{if(!event.target.matches?.('[data-org-line-select]'))return;const value=event.target.value;if(!['all',...lineIds(),'unassigned'].includes(value))return;sessionStorage.setItem('ppms_org_line::'+key(scope()),value);document.activeElement?.blur();changed(true)});
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-org-line-settings]'))open();if(event.target.closest?.('[data-org-line-manage]'))manage();if(event.target.closest?.('[data-org-line-view]')){sessionStorage.setItem(viewKey(scope()),isLineView()?'departments':'lines');document.activeElement?.blur();changed(true)}});
 window.addEventListener('ppms-organization-scope-changed',()=>{document.getElementById('productionLineDialog')?.remove();document.getElementById('productionLineNamesDialog')?.remove();void bindRemote()});
 window.addEventListener('online',()=>void sync());
 window.addEventListener('ppms-account-permissions-changed',()=>{changed();void sync()});
 window.addEventListener('ppms-language-changed',()=>changed(true));
 window.addEventListener('storage',event=>{if([CACHE,OUTBOX].includes(event.key)){cache=read(CACHE,{});jobs=read(OUTBOX,[]);changed()}});
 const start=()=>{void bindRemote();void sync()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.PPMSProductionLines={selection,filter,assignment,visibleSection,controlsMarkup,suffix,label,open,manage,lineIds,isLineView,chartMarkup,saveAssignments,sync,record,key,sectionKey,personKey,get pending(){return jobs.slice()}};
})();
