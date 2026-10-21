/* Authorized staffing is separate from the active employee roster. */
(()=>{
 'use strict';
 const MASTER='ppms_organization_master_v1',OUTBOX='ppms_position_slots_outbox_v903',HISTORY='ppms_resignation_history_v885';
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=()=>window.PPMSOrganizationScope,scope=()=>api().current();
 const admin=()=>sessionStorage.getItem('ppms_admin')==='1'&&(!window.PPMS_RUNTIME||window.PPMS_RUNTIME.factoryLayoutIsAdmin?.()===true);
 const sectionKey=v=>api().sectionKey(v);
 function positionKey(value){
  const key=String(value||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'');
  if(['pe','productionengineer','วิศวกรการผลิต'].includes(key))return 'productionengineer';
  if(['op','operator','opeartor','operater','พนักงานปฏิบัติการ','พนักงานผลิต','พนักงานทั่วไป'].includes(key))return 'operator';
  return key;
 }
 const staffSection=e=>sectionKey(e.section)==='sorting'&&/^sorting\s*[12]$/i.test(e.sortingGroup||'')?e.sortingGroup:e.section;
 const allPeople=()=>{const raw=read('ppms_v3_employees',[]),gone=new Set((window.PPMS_RUNTIME?.factoryLayoutDeletedEmployeeIds?.()||[]).map(String));return (Array.isArray(raw)?raw:Object.values(raw)).filter(e=>e?.id!=null&&!gone.has(String(e.id))&&e.employmentStatus!=='resigned')};
 const records=m=>Object.values(m?.positionVacancies||{}).filter(Boolean);
 function availableSections(captured=scope(),master=api().master()){
  const values=api().sections(allPeople(),captured,master.sections||[]).flatMap(s=>sectionKey(s)==='sorting'?['Sorting 1','Sorting 2']:s),removed=master.removedSections?.[captured.division+'::'+captured.plant]||[];
  return values.filter((s,i)=>values.findIndex(v=>sectionKey(v)===sectionKey(s))===i&&(!removed.some(v=>sectionKey(v)===sectionKey(s))||api().employees(allPeople(),captured).some(e=>sectionKey(staffSection(e))===sectionKey(s))));
 }

 const same=(a,b)=>a.division===b.division&&a.plant===b.plant&&sectionKey(a.section)===sectionKey(b.section)&&positionKey(a.position)===positionKey(b.position);
 const occupied=(plan,people=allPeople())=>people.filter(e=>{const s=api().employeeScope(e);return same(plan,{...s,section:staffSection(e),position:e.position})}).length;
 const newId=()=>crypto.randomUUID?.()||Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
 function configure(next,plan){
  next.positions=[...new Set([...(next.positions||[]),plan.position])];next.positionMap||={};next.positionMap[plan.division]=[...new Set([...(next.positionMap[plan.division]||[]),plan.position])];
  const key=plan.division+'::'+plan.plant;next.sectionMap||={};next.sectionMap[key]||=[];
  if(!next.sectionMap[key].some(s=>sectionKey(s)===sectionKey(plan.section)))next.sectionMap[key].push(plan.section);
  next.sectionPositions||={};const pkey=key+'::'+plan.section;next.sectionPositions[pkey]=[...new Set([...(next.sectionPositions[pkey]||[]),plan.position])];
 }
 function withPlan(value,plan,addition=0,jobId=''){
  const next=JSON.parse(JSON.stringify(value||api().master())),targets=records(next),matches=targets.filter(t=>same(t,plan)),target=matches[0]||{id:'slot_'+(jobId||newId()),division:plan.division,plant:plan.plant,section:plan.section,position:plan.position,required:0};
  const applied=Object.assign({},...matches.map(t=>t.slotChanges||{}));
  target.required=Math.max(plan.required||0,...matches.map(t=>Number(t.required)||0),0);
  if(addition&&!applied[jobId]){target.required+=addition;applied[jobId]=true}
  if(target.required>9999)throw Error('จำนวนอัตรารวมเกิน 9,999 คน');
  if(Object.keys(applied).length)target.slotChanges=applied;
  target.updatedAt=new Date().toISOString();next.positionVacancies=[...targets.filter(t=>!same(t,plan)),target];configure(next,target);return next;
 }
 function planFor(employee,people=allPeople(),master=api().master()){
  if(!employee?.position||!employee.section)return null;
  const plan={...api().employeeScope(employee),section:staffSection(employee),position:employee.position};
  plan.required=Math.max(1,occupied(plan,people),...records(master).filter(t=>same(t,plan)).map(t=>Number(t.required)||0));return plan;
 }
 function preserve(value,employee,people){
  const plan=planFor(employee,people,value);if(!plan)return value;
  if(employee._positionSlot&&same(employee._positionSlot,plan))plan.required=Math.max(plan.required,employee._positionSlot.required||0);
  return withPlan(value,plan);
 }
 const jobs=()=>{const value=read(OUTBOX,[]);return Array.isArray(value)?value:[]};
 const pendingExits=()=>Object.values(read(HISTORY,{})).filter(row=>row?.pending&&row.employee?._positionSlot).map(row=>row.employee._positionSlot);
 function replay(value){let next=value;for(const job of jobs())next=withPlan(next,job.plan,job.amount,job.id);for(const plan of pendingExits())next=withPlan(next,plan);return next}
 function apply(value){
  const next=replay(value);localStorage.setItem(MASTER,JSON.stringify(next));
  if(window.PPMSOrganizationManager?.applyMaster)window.PPMSOrganizationManager.applyMaster(next);else window.dispatchEvent(new Event('ppms-organization-changed'));
  return next;
 }
 let syncing=false,notice='',retry=null;
 async function request(options={}){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(base+'/settings/organizationMaster.json',{...options,signal:controller.signal,cache:'no-store'});if(!r.ok&&r.status!==412)throw Error('ฐานข้อมูลไม่ยืนยันการบันทึก ('+r.status+')');return {status:r.status,etag:r.headers.get('etag'),value:await r.json()}}finally{clearTimeout(timer)}
 }
 async function sync(){
  if(syncing||!admin()||navigator.onLine===false||!jobs().length)return;
  syncing=true;clearTimeout(retry);
  try{
   while(jobs().length&&admin()){
    const job=jobs()[0];let confirmed=null;
    for(let n=0;n<5;n++){
     const remote=await request({headers:{'X-Firebase-ETag':'true'}});if(!remote.etag)throw Error('ฐานข้อมูลยังไม่ยืนยันเวอร์ชัน');
     const next=withPlan(remote.value||api().master(),job.plan,job.amount,job.id);next._updatedAt=Date.now();
     const result=await request({method:'PUT',headers:{'Content-Type':'application/json','if-match':remote.etag},body:JSON.stringify(next)});if(result.status===412)continue;
     if(!records(result.value).some(t=>t.slotChanges?.[job.id]))throw Error('ฐานข้อมูลยังไม่ยืนยันอัตราตำแหน่ง');confirmed=result.value;break;
    }
    if(!confirmed)throw Error('มีผู้แก้ไขพร้อมกัน กรุณาลองใหม่');
    localStorage.setItem(OUTBOX,JSON.stringify(jobs().filter(j=>j.id!==job.id)));notice='บันทึกอัตราตำแหน่งเรียบร้อยแล้ว';apply(confirmed);
   }
  }catch(error){notice='บันทึกในเครื่องแล้ว · รอซิงก์อัตราตำแหน่ง: '+error.message;retry=setTimeout(()=>void sync(),15000)}
  finally{syncing=false;window.PPMS_RUNTIME?.refreshOrganizationChart?.()}
 }
 async function add(name,section,amount=1,captured=scope()){
  if(!admin())throw Error('กรุณาเข้าสู่ระบบ Admin');if(captured.division!==scope().division||captured.plant!==scope().plant)throw Error('ฝ่ายหรือโรงงานเปลี่ยนแล้ว กรุณาเลือกใหม่');
  name=String(name||'').trim().replace(/\s+/g,' ');section=String(section||'').trim();amount=Number(amount);
  if(!name||name.length>100||!section||!Number.isInteger(amount)||amount<1||amount>999)throw Error('ระบุแผนก ชื่อตำแหน่ง และจำนวนตำแหน่งว่าง 1–999 อัตรา');
  const master=api().master(),sections=availableSections(captured,master);
  if(!sections.some(s=>sectionKey(s)===sectionKey(section)))throw Error('ไม่พบแผนกในฝ่ายที่เลือก');
  if(captured.division!=='Production Division'&&window.PPMSProductionHierarchy?.isSupervisor(name))throw Error('ตำแหน่ง Supervisor Production ใช้ในฝ่ายผลิตเท่านั้น');
  const existing=allPeople().find(e=>same({...api().employeeScope(e),section:staffSection(e),position:e.position},{...captured,section,position:name}));
  const plan={...captured,section,position:existing?.position||name};plan.required=occupied(plan);
  const job={id:newId(),plan,amount},next=withPlan(master,plan,amount,job.id);
  localStorage.setItem(OUTBOX,JSON.stringify([...jobs(),job]));notice='เพิ่มตำแหน่งว่างแล้ว · รอซิงก์';apply(next);window.PPMS_RUNTIME?.refreshOrganizationChart?.(true);void sync();return {pending:true,name:plan.position};
 }
 function plans(captured=scope()){
  return records(replay(api().master())).filter(t=>t.division===captured.division&&t.plant===captured.plant&&Number.isInteger(t.required)&&t.required>0).map(t=>{const filled=occupied(t);return {...t,filled,count:Math.max(0,t.required-filled)}});
 }
 function summaryMarkup(captured=scope()){
  const list=plans(captured).filter(t=>t.count>0),count=list.reduce((n,t)=>n+t.count,0);if(!count&&!jobs().length)return '';
  return `<details class="position-slot-summary"><summary><span>ตำแหน่งว่าง / สรรหา HR</span> · <b>${count}</b> <span>อัตรา</span></summary>${jobs().length?'<p role="status">บันทึกในเครื่องแล้ว · รอซิงก์อัตราตำแหน่ง</p>':''}<div class="table-wrap"><table><thead><tr><th>แผนก</th><th>ตำแหน่ง</th><th>อัตรารวม</th><th>มีพนักงาน</th><th>ว่าง / ต้องสรรหา</th></tr></thead><tbody>${list.map(t=>`<tr><td>${esc(api().sectionLabel(t.section,captured))}</td><td>${esc(t.position)}</td><td>${t.required}</td><td>${t.filled}</td><td><b>${t.count}</b></td></tr>`).join('')}</tbody></table></div></details>`;
 }
 function vacancyMarkup(captured=scope()){
  return plans(captured).filter(t=>t.count>0).map(t=>`<section class="position-slot-tree"><h4>${esc(api().sectionLabel(t.section,captured))}</h4><div class="people">${window.PPMSProductionHierarchy.positionVacancyMarkup(t)}</div></section>`).join('');
 }
 function openDialog(section='',captured=scope()){
  if(!admin())return;captured={...captured};document.getElementById('positionSlotDialog')?.remove();
  const master=api().master(),sections=availableSections(captured,master),names=[...new Set([...(master.positionMap?.[captured.division]||[]),...api().employees(allPeople(),captured).map(e=>e.position)].filter(Boolean))];
  const host=document.createElement('div');host.id='positionSlotDialog';host.className='position-slot-overlay';host.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="positionSlotTitle"><h2 id="positionSlotTitle">เพิ่มตำแหน่งว่าง</h2><p>ตำแหน่งจะคงอยู่เมื่อพนักงานลาออก และแสดงจำนวนที่ HR ต้องสรรหา</p><form><label>แผนก<select name="section" required>${sections.map(s=>`<option value="${esc(s)}" ${sectionKey(s)===sectionKey(section)?'selected':''}>${esc(api().sectionLabel(s,captured))}</option>`).join('')}</select></label><label>ชื่อตำแหน่ง<input name="name" list="slotPositionNames" required maxlength="100" autocomplete="off"><datalist id="slotPositionNames">${names.map(p=>`<option value="${esc(p)}">`).join('')}</datalist></label><label>จำนวนตำแหน่งว่างที่เพิ่ม<input name="amount" type="number" min="1" max="999" step="1" value="1" required></label><p role="status" data-slot-status></p><div class="actions"><button type="submit">เพิ่มตำแหน่งว่าง</button><button type="button" class="secondary" data-slot-close>ยกเลิก</button></div></form></section>`;
  document.body.append(host);const close=()=>host.remove();host.querySelector('[data-slot-close]').onclick=close;host.onkeydown=e=>{if(e.key==='Escape')close()};host.querySelector('input')?.focus();
  host.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,button=f.querySelector('button');button.disabled=true;try{await add(f.elements.name.value,f.elements.section.value,f.elements.amount.value,captured);close()}catch(error){host.querySelector('[data-slot-status]').textContent=error.message;button.disabled=false}};
 }
 window.PPMSPositionSlots={positionKey,staffSection,occupied,planFor,preserve,withPlan,replay,apply,add,sync,plans,summaryMarkup,vacancyMarkup,openDialog,hasPending:()=>jobs().length>0||pendingExits().length>0};
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-org-add-slot]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openDialog(b.dataset.section||'')},true);
 window.addEventListener('online',()=>void sync());window.addEventListener('focus',()=>void sync());window.addEventListener('ppms-organization-scope-changed',()=>document.getElementById('positionSlotDialog')?.remove());
 window.addEventListener('storage',e=>{if(e.key===OUTBOX){apply(api().master());void sync()}});
 document.addEventListener('DOMContentLoaded',()=>{if(jobs().length){apply(api().master());void sync()}});
 const style=document.createElement('style');style.textContent='.position-slot-overlay{position:fixed;inset:0;z-index:15000;background:#0f172a99;display:grid;place-items:center;padding:18px}.position-slot-overlay>section{background:white;border-radius:14px;padding:24px;width:520px;max-width:100%;max-height:90vh;overflow:auto}.position-slot-overlay label{display:grid;gap:6px;margin:14px 0}.position-slot-overlay .actions{display:flex;gap:10px;flex-wrap:wrap}.position-slot-summary{margin:16px 0;border:1px solid #bdcfe2;border-radius:9px;padding:14px;background:#fff}.position-slot-summary summary{font-weight:bold;color:#194e7f;cursor:pointer}.position-slot-summary table{width:100%;border-collapse:collapse;margin-top:12px}.position-slot-summary th,.position-slot-summary td{padding:10px;border:1px solid #d6e0ea;text-align:left}.position-slot-summary th{background:#eaf3ff}.position-slot-tree{padding:14px;border:1px dashed #91a9c1;margin:14px;border-radius:8px}.position-slot-tree .people{display:flex;gap:10px;flex-wrap:wrap}.position-slot-add{display:block;margin:8px auto;font-size:12px}.organization-position-vacancy .position-recruiting{font-size:10px;color:#8b6012}@media print{.position-slot-overlay{display:none!important}.position-slot-summary{break-inside:avoid}}';document.head.append(style);
})();
