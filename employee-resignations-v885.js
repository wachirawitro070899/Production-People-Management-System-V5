/* Resignation history: durable local snapshots and a separate, read-only archive. */
(()=>{
 'use strict';
 const KEY='ppms_resignation_history_v885';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t=(th,en)=>window.PPMSLanguage?.language==='en'?en:th;
 const admin=()=>window.PPMS_RUNTIME?.factoryLayoutIsAdmin?.()===true;
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
 let cache=read(),remote=[],loading=false,error='',loadedAt=0,query='',section='',year='';
 if(window.ppmsErrorGuard?.ready)window.ppmsErrorGuard.ready.then(()=>{cache={...read(),...cache};paint()});
 const persist=()=>{localStorage.setItem(KEY,JSON.stringify(cache));window.dispatchEvent(new Event('ppms-resignation-history-changed'))};
 const decode=value=>{if(Array.isArray(value))return value.map(decode);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).map(([key,v])=>{try{if(key.startsWith('__ppmskey__'))key=decodeURIComponent(key.slice(11))}catch{}return[key,decode(v)]}))};
 const name=e=>t(e.thaiName||e.nameTh||e.name,e.englishName||e.nameEn||e.name||e.thaiName)||e.id;
 const date=value=>/^\d{4}-\d{2}-\d{2}/.test(value||'')?String(value).slice(0,10):'—';
 function capture(employee,employmentRecords={},metadata={}){
  const id=String(employee?.id??metadata.id??'');if(!id)throw Error('ไม่พบข้อมูลพนักงานสำหรับเก็บประวัติลาออก');
  const pending=Object.values(cache).find(row=>String(row.employee.id)===id&&row.pending);
  if(pending)return pending.employee;
  if(!employee)throw Error('ไม่พบข้อมูลพนักงานสำหรับเก็บประวัติลาออก');
  const now=new Date().toISOString(),eventId='exit_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),scope=window.PPMSOrganizationScope?.employeeScope(employee)||{};
  const resignationDate=metadata.resignationDate||today();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(resignationDate)||new Date(resignationDate+'T12:00:00Z').toISOString().slice(0,10)!==resignationDate||resignationDate>today())throw Error('กรุณาระบุวันที่ลาออกที่ถูกต้องและไม่เกินวันนี้');
  if(employee.startDate&&resignationDate<employee.startDate)throw Error('วันที่ลาออกต้องไม่ก่อนวันที่เริ่มงาน');
  const snapshot=JSON.parse(JSON.stringify({...employee,organizationDivision:scope.division||employee.organizationDivision,organizationPlant:scope.plant||employee.organizationPlant,
   employmentRecords,resignationEventId:eventId,resignedAt:now,resignationDate,resignationReason:String(metadata.resignationReason||''),resignationNote:String(metadata.resignationNote||''),
   recordedBy:sessionStorage.getItem('ppms_admin_user')||sessionStorage.getItem('ppms_leader_id')||'',employmentStatus:'resigned',archiveReason:'resigned'}));
  const plan=window.PPMSPositionSlots?.planFor(employee);if(plan)snapshot._positionSlot=plan;
  cache[eventId]={employee:snapshot,pending:true};try{persist()}catch(error){delete cache[eventId];throw error}if(plan)window.PPMSPositionSlots.apply(window.PPMSOrganizationScope.master());return snapshot;
 }
 function confirmed(employee){if(!employee?.id)return;const key=employee.resignationEventId;if(key){cache[key]={employee:decode(employee),pending:false};persist()}loadedAt=0;paint()}
 function rows(){
  const all=[...remote,...Object.values(cache).map(row=>({...row.employee,_pending:row.pending}))],unique=new Map();
  for(const e of all){if(!e||e.id==null)continue;const key=e.resignationEventId||('legacy:'+e.id+':'+e.resignedAt);unique.set(key,e)}
  const events=[...unique.values()];
  return events.filter(e=>!(e.resignationEventId==null&&events.some(other=>other.resignationEventId&&String(other.id)===String(e.id)&&other.resignedAt===e.resignedAt)))
   .filter(e=>!window.PPMSOrganizationScope||window.PPMSOrganizationScope.contains(e)).sort((a,b)=>String(b.resignationDate||b.resignedAt||'').localeCompare(String(a.resignationDate||a.resignedAt||''))||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
 }
 async function request(path){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error(t('ยังไม่ได้เชื่อมต่อฐานข้อมูล','Database is not configured'));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(base+'/ppms/'+path+'.json',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);return decode(await response.json())}finally{clearTimeout(timer)}
 }
 async function refresh(){
  if((!admin()&&!window.PPMS_RUNTIME?.monthReportContext?.().allowed)||loading)return;loading=true;error='';paint();
  try{const pending=Object.values(cache).some(row=>row.pending),values=await Promise.all([request('formerEmployees'),request('formerEmployeeHistory'),...(pending?[request('deletedEmployeeIds'),request('employees')]:[])]);remote=values.slice(0,2).flatMap(v=>Object.values(v||{})).filter(e=>e?.id!=null);
   if(pending){const deleted=new Set(Object.values(values[2]||{}).map(String)),active=new Set(Object.values(values[3]||{}).filter(Boolean).map(e=>String(e.id)));for(const e of remote)if(e.resignationEventId&&cache[e.resignationEventId]?.pending&&deleted.has(String(e.id))&&!active.has(String(e.id)))cache[e.resignationEventId]={employee:e,pending:false}}

   for(const e of remote){const key=e.resignationEventId||('legacy:'+e.id+':'+e.resignedAt);if(!cache[key]?.pending)cache[key]={employee:e,pending:false}}persist();loadedAt=Date.now();
  }catch{error=t('เชื่อมต่อไม่สำเร็จ แสดงประวัติที่บันทึกไว้ในเครื่อง','Connection failed. Showing history saved on this device.')}finally{loading=false;paint()}
 }
 function page(){return `<section id="resignationHistory" data-i18n-ignore><div class="page-head"><div><h2>${t('ประวัติพนักงานลาออก','Resignation History')}</h2><p>${t('ลบรายชื่อ = ลาออก · เก็บประวัติไว้ตรวจสอบย้อนหลัง','Removing an employee records a resignation and preserves their history.')}</p></div></div><div class="panel resignation-filters"><input id="resignationQuery" placeholder="${t('ค้นหารหัส ชื่อ หรือเหตุผล','Search ID, name or reason')}" value="${esc(query)}"><select id="resignationSection"></select><select id="resignationYear"></select><button type="button" data-resignation-refresh>${t('โหลดข้อมูลล่าสุด','Refresh')}</button></div><p data-resignation-status role="status"></p><div data-resignation-list></div></section>`}
 function paint(){
  const root=document.getElementById('resignationHistory');if(!root||!admin())return;
  const list=rows(),sections=[...new Set(list.map(e=>e.section).filter(Boolean))].sort(),years=[...new Set(list.map(e=>String(e.resignationDate||e.resignedAt||'').slice(0,4)).filter(Boolean))].sort().reverse();
  const setOptions=(id,items,value,label)=>{const node=root.querySelector(id);if(!node)return;if(value&&!items.includes(value))items=[value,...items];const html=`<option value="">${label}</option>`+items.map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(window.PPMSLanguage?.translate(v)||v)}</option>`).join('');if(node.innerHTML!==html)node.innerHTML=html};
  setOptions('#resignationSection',sections,section,t('ทุกแผนก','All sections'));setOptions('#resignationYear',years,year,t('ทุกปี','All years'));
  const filtered=list.filter(e=>(!section||e.section===section)&&(!year||String(e.resignationDate||e.resignedAt||'').startsWith(year))&&(!query||[e.id,e.name,e.thaiName,e.resignationReason].join(' ').toLowerCase().includes(query.toLowerCase())));
  root.querySelector('[data-resignation-status]').textContent=error||(loading?t('กำลังโหลดประวัติ…','Loading history…'):t('พนักงานลาออก ','Former employees: ')+new Set(filtered.map(e=>String(e.id))).size+t(' คน · ',' · ')+filtered.length+t(' รายการ',' records'));
  root.querySelector('[data-resignation-list]').innerHTML=filtered.length?`<div class="table-wrap"><table><thead><tr>${[t('รูป','Photo'),t('รหัส / ชื่อ','ID / Name'),t('ตำแหน่ง / แผนก','Position / Section'),t('วันที่เริ่มงาน','Start date'),t('วันที่ลาออก','Resignation date'),t('เหตุผล','Reason'),t('สถานะ','Status'),''].map(v=>`<th>${v}</th>`).join('')}</tr></thead><tbody>${filtered.map(e=>`<tr><td>${window.PPMSEmployeePhotos?.markup(e)||''}</td><td><b>${esc(e.id)}</b><br>${esc(name(e))}</td><td>${esc(window.PPMSLanguage?.translate(e.position||'')||e.position)}<br>${esc(window.PPMSLanguage?.translate(e.section||'')||e.section)}</td><td>${date(e.startDate)}</td><td>${date(e.resignationDate||e.resignedAt)}</td><td>${esc(e.resignationReason||'—')}</td><td>${e._pending?t('รอซิงก์','Pending sync'):t('ลาออกแล้ว','Resigned')}</td><td><button type="button" data-resignation-detail="${esc(e.resignationEventId||('legacy:'+e.id+':'+e.resignedAt))}">${t('ดูประวัติ','View history')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t('ยังไม่มีประวัติลาออกที่ตรงกับเงื่อนไข','No matching resignation history.')}</div>`;
 }
 function close(){document.getElementById('resignationDialog')?.remove()}
 function dialog(html){close();const host=document.createElement('div');host.id='resignationDialog';host.className='resignation-overlay';host.setAttribute('data-i18n-ignore','');host.innerHTML=`<section class="resignation-dialog" role="dialog" aria-modal="true" aria-label="${t('ประวัติลาออก','Resignation history')}">${html}</section>`;document.body.append(host);host.querySelector('button,input')?.focus();return host}
 function detail(key){if(!admin())return;const e=rows().find(e=>(e.resignationEventId||('legacy:'+e.id+':'+e.resignedAt))===key);if(!e)return;
  const fields=[[t('รหัสพนักงาน','Employee ID'),e.id],[t('ชื่อภาษาไทย','Thai name'),e.thaiName],[t('ชื่อภาษาอังกฤษ','English name'),e.name],[t('ตำแหน่ง','Position'),window.PPMSLanguage?.translate(e.position||'')||e.position],[t('แผนก','Section'),window.PPMSLanguage?.translate(e.section||'')||e.section],[t('ประเภทพนักงาน','Employment type'),window.PPMSLanguage?.translate(e.contractType||'')||e.contractType],[t('วันที่เริ่มงาน','Start date'),date(e.startDate)],[t('วันที่บรรจุประจำ','Permanent start date'),date(e.permanentStartDate)],[t('วันที่ลาออก','Resignation date'),date(e.resignationDate||e.resignedAt)],[t('เหตุผล','Reason'),e.resignationReason],[t('หมายเหตุ','Notes'),e.resignationNote],[t('ผู้บันทึก','Recorded by'),e.recordedBy],[t('วันที่บันทึก','Recorded at'),e.resignedAt]];
  dialog(`<h2>${t('ประวัติพนักงานลาออก','Resignation History')}</h2><div class="resignation-identity">${window.PPMSEmployeePhotos?.markup(e)||''}<h3>${esc(e.id)} · ${esc(name(e))}</h3></div><dl class="resignation-details">${fields.map(([label,value])=>`<dt>${label}</dt><dd>${esc(value||'—')}</dd>`).join('')}</dl><p>${t('ประวัติทักษะ','Skill history')}: ${Array.isArray(e.skillHistory)?e.skillHistory.length:0} · ${t('ประวัติงานเสีย','Defect history')}: ${Array.isArray(e.ngHistory)?e.ngHistory.length:0}</p><button type="button" data-resignation-close>${t('ปิด','Close')}</button>`);
 }
 function confirmResignation(id){
  if(!admin())return;let list=[];try{list=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]')}catch{}const e=list.find(e=>String(e.id)===String(id));if(!e)return;
  const host=dialog(`<h2>${t('บันทึกพนักงานลาออก','Record resignation')}</h2><p><b>${esc(e.id)} · ${esc(name(e))}</b></p><p>${t('รายชื่อจะออกจากพนักงานปัจจุบัน และเก็บข้อมูลในประวัติลาออก','The employee will leave the active roster and remain in resignation history.')}</p><form id="resignationForm"><label>${t('วันที่ลาออก','Resignation date')}<input type="date" name="resignationDate" value="${today()}" max="${today()}" required></label><label>${t('เหตุผล (ถ้ามี)','Reason (optional)')}<input name="resignationReason" maxlength="300"></label><label>${t('หมายเหตุ (ถ้ามี)','Notes (optional)')}<textarea name="resignationNote" maxlength="2000"></textarea></label><p role="status" data-resignation-save-status></p><div class="actions"><button type="submit" class="danger">${t('ยืนยันลาออกและลบรายชื่อ','Confirm resignation and remove')}</button><button type="button" class="secondary" data-resignation-close>${t('ยกเลิก','Cancel')}</button></div></form>`);
  const editor=document.getElementById('employeeForm'),editing=editor&&String(editor.elements.originalId?.value)===String(id),editorControls=editing?[...editor.querySelectorAll('input,select,textarea,button')].map(node=>[node,node.disabled]):[];
  const discardEditor=()=>{if(!editing||!editor.isConnected)return;const modal=editor.closest('#modal');if(modal){modal.classList.add('hidden');modal.querySelector('#modalBody')?.replaceChildren()}};
  const form=host.querySelector('form');form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;editorControls.forEach(([node])=>node.disabled=true);
   try{await window.PPMS_RUNTIME.deleteEmployeeNow(id,Object.fromEntries(new FormData(form)));discardEditor();close()}
   catch(err){const pending=Object.values(cache).some(row=>String(row.employee.id)===String(id)&&row.pending);if(pending)discardEditor();else editorControls.forEach(([node,disabled])=>node.disabled=disabled);form.querySelector('[data-resignation-save-status]').textContent=pending?t('บันทึกลาออกในเครื่องแล้ว รอเชื่อมต่อเพื่อซิงก์ประวัติและรายชื่อ','Saved on this device. History and roster will sync when connected.'):String(err.message);button.disabled=pending;if(pending)form.querySelector('[data-resignation-close]').textContent=t('ปิด','Close');paint()}
  };
 }
 document.addEventListener('click',event=>{const remove=event.target.closest?.('[data-delete]');if(remove&&admin()){event.preventDefault();event.stopImmediatePropagation();if(remove.closest('#employeeForm')?.querySelector('[type=submit]')?.disabled)return;confirmResignation(remove.dataset.delete);return}
  const button=event.target.closest?.('[data-resignation-close],[data-resignation-detail],[data-resignation-refresh]');if(!button)return;
  if(button.hasAttribute('data-resignation-close'))close();else if(button.hasAttribute('data-resignation-detail'))detail(button.dataset.resignationDetail);else void refresh();
 },true);
 document.addEventListener('input',event=>{if(event.target.id==='resignationQuery'){query=event.target.value;paint()}});
 document.addEventListener('change',event=>{if(event.target.id==='resignationSection'){section=event.target.value;paint()}if(event.target.id==='resignationYear'){year=event.target.value;paint()}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
 function mount(){const root=document.getElementById('resignationHistory');if(!root||root.dataset.mounted)return;root.dataset.mounted='1';paint();if(Date.now()-loadedAt>30000)void refresh()}
 window.addEventListener('ppms-language-changed',()=>{const root=document.getElementById('resignationHistory');if(root){root.outerHTML=page();mount()}});
 window.addEventListener('online',()=>{if(document.getElementById('resignationHistory'))void refresh()});
 const style=document.createElement('style');style.textContent='.resignation-filters{display:flex;gap:10px;flex-wrap:wrap}.resignation-filters input{flex:1;min-width:180px}.resignation-overlay{position:fixed;inset:0;background:#0f172a88;z-index:15000;display:flex;align-items:center;justify-content:center;padding:18px}.resignation-dialog{background:white;border-radius:14px;padding:24px;width:680px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 16px 60px #0004}.resignation-dialog label{display:grid;gap:5px;margin:14px 0}.resignation-identity{border:2px solid #164d84;border-radius:10px;padding:14px;display:flex;gap:14px;align-items:center}.resignation-details{display:grid;grid-template-columns:minmax(110px,1fr) 2fr;gap:10px}.resignation-details dt{font-weight:bold}.resignation-details dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}#resignationHistory td{vertical-align:middle}';document.head.append(style);
 window.PPMSResignations={reportState:()=>({records:Object.values(cache).map(row=>({...row.employee,_pending:!!row.pending})),loading,error,loadedAt}),capture,confirmed,page,mount,refresh,rows,records:()=>Object.fromEntries(Object.entries(cache).map(([key,row])=>[key,row.employee])),pending:id=>Object.values(cache).find(row=>String(row.employee.id)===String(id)&&row.pending)?.employee||null};
})();
