/* Editable reporting relationships for the main Organization Chart. */
(()=>{
 'use strict';
 const CACHE='ppms_organization_reporting_v870',OUTBOX='ppms_organization_reporting_outbox_v870',MASTER='ppms_organization_master_v1';
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
 const scope=()=>window.PPMS_RUNTIME?.organizationScope?.()||window.PPMSOrganizationScope.current();
 const scopeKey=value=>'scope_'+encodeURIComponent(JSON.stringify([value.division,value.plant])).replace(/\./g,'%2E');
 const idKey=id=>'person_'+encodeURIComponent(String(id)).replace(/\./g,'%2E');
 const admin=()=>window.PPMS_RUNTIME?.factoryLayoutIsAdmin?.()===true&&sessionStorage.getItem('ppms_admin')==='1';
 const root=()=>document.querySelector('.division-org:not(.employee-history-report)');
 const viewKey=value=>'ppms_org_tree_view::'+scopeKey(value);
 const editKey=value=>'ppms_org_tree_edit::'+scopeKey(value);
 const editing=()=>admin()&&sessionStorage.getItem(editKey(scope()))==='1';
 let cache=read(CACHE,{}),jobs=read(OUTBOX,[]),syncing=false,drag=null,dragCandidate=null,picked=null,notice=null,subscription=null,initial=false,suppressClickUntil=0;
 const record=value=>cache[scopeKey(value)]||{parents:{}};
 const people=value=>window.PPMSOrganizationScope.employees(read('ppms_v3_employees',[]),value).filter(e=>e&&e.id!=null&&!window.PPMS_RUNTIME?.factoryLayoutDeletedEmployeeIds?.().includes(String(e.id)));
 const currentPeople=()=>people(scope());
 const priority=position=>{const p=String(position||'');return /manager|ผู้จัดการ/i.test(p)?0:/engineer|วิศวกร/i.test(p)?1:/supervisor|หัวหน้างาน|หัวหน้าแผนก/i.test(p)?2:/leader|หัวหน้าทีม/i.test(p)?3:/technician|ช่าง/i.test(p)?4:/operator|opeartor|operater|^op\b|พนักงานทั่วไป|พนักงานผลิต|พนักงานปฏิบัติการ/i.test(p)?6:5};
 const employment=e=>/^(permanent|พนักงานประจำ)$/i.test(String(e.contractType||'Permanent'))?0:1;
 const start=e=>{const n=Date.parse((employment(e)===0?e.permanentStartDate:'')||e.startDate||'');return Number.isFinite(n)?n:Number.MAX_SAFE_INTEGER};
 const seniority=(a,b)=>employment(a)-employment(b)||start(a)-start(b)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true});
 const sectionOf=e=>e.section==='Sorting Section'?e.section+'::'+(e.sortingGroup||''):e.section;
 function assertAcyclic(parents){
  const complete=new Set();
  for(const id of parents.keys()){
   const path=new Set();let cursor=id;
   while(cursor&&parents.has(cursor)&&!complete.has(cursor)){if(path.has(cursor))throw Error('ไม่สามารถจัดลำดับนี้ได้ เพราะสายบังคับบัญชาจะวนกลับหากัน');path.add(cursor);cursor=parents.get(cursor)}
   for(const value of path)complete.add(value);
  }
 }
 function model(value,list,valueScope=scope(),repair=true){
  const sorted=[...list].sort((a,b)=>priority(a.position)-priority(b.position)||seniority(a,b)),byId=new Map(sorted.map(e=>[String(e.id),e]));
  const manager=sorted.find(e=>priority(e.position)===0),supervisor=valueScope.division==='Production Division'?sorted.find(e=>window.PPMSProductionHierarchy?.isSupervisor(e.position)):null,parents=new Map();
  for(const e of sorted){
   const id=String(e.id);let parent='';
   if(priority(e.position)!==0){
    if(window.PPMSProductionHierarchy?.isSupervisor(e.position))parent=manager?String(manager.id):'';
    else{
     const higher=sorted.filter(other=>String(other.id)!==id&&sectionOf(other)===sectionOf(e)&&priority(other.position)<priority(e.position)&&priority(other.position)!==0&&!window.PPMSProductionHierarchy?.isSupervisor(other.position)).sort((a,b)=>priority(b.position)-priority(a.position)||seniority(a,b));
     const chief=higher[0]||(supervisor&&window.PPMSProductionHierarchy.reportsToSupervisor(e.sortingGroup||e.section)?supervisor:manager);
     parent=chief?String(chief.id):'';
    }
   }
   if(Object.hasOwn(value.parents||{},idKey(id)))parent=String(value.parents[idKey(id)]||'');
   parents.set(id,parent!==id&&byId.has(parent)?parent:'');
  }
  if(repair){
   for(const id of parents.keys()){const visited=new Set();let cursor=id;while(cursor&&parents.has(cursor)){if(visited.has(cursor)){parents.set(cursor,'');break}visited.add(cursor);cursor=parents.get(cursor)}}
  }else assertAcyclic(parents);
  return {parents,byId,sorted};
 }
 function moveRecord(value,job,list){
  const original=model(value,list,job.scope,false),source=String(job.sourceId),target=String(job.targetId||'');
  if(!original.byId.has(source)||(!['root','auto'].includes(job.relation)&&!original.byId.has(target)))throw Error('ไม่พบพนักงานในฝ่ายและโรงงานที่เลือก กรุณาโหลดรายชื่อใหม่');
  if(source===target)throw Error('ไม่สามารถให้พนักงานอยู่ใต้หรือเหนือชื่อของตนเอง');
  if(!['under','above','root','auto'].includes(job.relation))throw Error('กรุณาเลือกลำดับผู้บังคับบัญชา');
  const parents={...(value.parents||{})};
  // Preserve the complete branch when its manager moves, including inferred children.
  for(const [id,parent]of original.parents)if(!Object.hasOwn(parents,idKey(id)))parents[idKey(id)]=parent;
  if(job.relation==='under')parents[idKey(source)]=target;
  else if(job.relation==='above'){
   const previous=original.parents.get(target)||'';
   if(previous!==source){parents[idKey(source)]=previous;parents[idKey(target)]=source}
  }else if(job.relation==='root')parents[idKey(source)]='';
  else delete parents[idKey(source)];
  const next={...value,division:job.scope.division,plant:job.scope.plant,parents,updatedAt:new Date().toISOString()};
  model(next,list,job.scope,false);return next;
 }
 function persist(){localStorage.setItem(CACHE,JSON.stringify(cache));localStorage.setItem(OUTBOX,JSON.stringify(jobs))}
 function status(text,error=false,value=scope()){notice={text,error,key:scopeKey(value)};const node=document.querySelector('[data-org-structure-status]');if(node&&notice.key===scopeKey(scope())){node.textContent=text;node.classList.toggle('org-structure-error',error)}}
 const refresh=(immediate=false)=>window.PPMS_RUNTIME?.refreshOrganizationChart?.(immediate);
 function isTreeView(){const selected=sessionStorage.getItem(viewKey(scope()));return selected==='tree'||(!selected&&Object.keys(record(scope()).parents||{}).length>0)}
 function controlsMarkup(){return `<label>รูปแบบผัง<select id="organizationStructureView"><option value="departments" ${!isTreeView()?'selected':''}>ผังตามแผนก</option><option value="tree" ${isTreeView()?'selected':''}>ผังสายบังคับบัญชา</option></select></label>${admin()?`<label class="org-structure-switch"><input type="checkbox" id="organizationStructureEdit" ${editing()?'checked':''}>แก้โครงสร้างผัง</label><button type="button" class="secondary" data-org-add-position>เพิ่มตำแหน่ง</button>`:''}`}
 function chartMarkup(visible,person){
  const full=model(record(scope()),currentPeople()),shown=new Set(visible.map(e=>String(e.id))),children=new Map([['',[]]]);
  for(const e of visible){let parent=full.parents.get(String(e.id))||'',visited=new Set();while(parent&&!shown.has(parent)&&!visited.has(parent)){visited.add(parent);parent=full.parents.get(parent)||''}if(!shown.has(parent))parent='';if(!children.has(parent))children.set(parent,[]);children.get(parent).push(e)}
  for(const list of children.values())list.sort((a,b)=>priority(a.position)-priority(b.position)||seniority(a,b));
  const node=e=>`<article class="org-tree-node" data-org-node="${esc(e.id)}"><div class="org-tree-card">${person(e)}<span class="org-tree-section">${esc(e.sortingGroup||e.section)}</span></div>${children.get(String(e.id))?.length?`<div class="org-tree-children">${children.get(String(e.id)).map(node).join('')}</div>`:''}</article>`;
  return `<div class="organization-reporting-chart"><div class="org-tree-roots">${children.get('').map(node).join('')||'<div class="empty">ไม่มีข้อมูล</div>'}</div></div>`;
 }
 async function request(path,options={}){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(base+'/'+path+'.json',{...options,signal:controller.signal,cache:'no-store'});if(!response.ok&&response.status!==412)throw Error('ฐานข้อมูลไม่ยืนยันการบันทึก ('+response.status+')');return {status:response.status,etag:response.headers.get('etag'),value:await response.json()}}
  finally{clearTimeout(timer)}
 }
 async function change(path,update){
  for(let n=0;n<5;n++){const existing=await request(path,{headers:{'X-Firebase-ETag':'true'}});if(!existing.etag)throw Error('ฐานข้อมูลยังไม่ยืนยันเวอร์ชัน');const next=update(existing.value);const result=await request(path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':existing.etag},body:JSON.stringify(next)});if(result.status!==412)return result.value}
  throw Error('มีการแก้ผังพร้อมกัน ระบบจะส่งรายการรอบถัดไป');
 }
 function withPosition(value,job){
  const next=structuredClone(value||window.PPMSOrganizationScope.master());next.positions=[...new Set([...(next.positions||[]),job.name])];next.positionMap||={};next.positionMap[job.scope.division]=[...new Set([...(next.positionMap[job.scope.division]||[]),job.name])];return next;
 }
 function applyMaster(value){localStorage.setItem(MASTER,JSON.stringify(value));window.PPMSOrganizationManager?.applyMaster?.(value);window.dispatchEvent(new Event('ppms-organization-changed'))}
 function replay(valueScope,value){let next=value;for(const job of jobs.filter(j=>j.type==='move'&&scopeKey(j.scope)===scopeKey(valueScope))){try{next=moveRecord(next,job,people(job.scope))}catch{}}return next}
 async function sync(){
  if(syncing||navigator.onLine===false||!admin()||!jobs.length)return;
  syncing=true;
  try{
   while(jobs.length){
    const job=jobs[0];
    try{
     if(job.type==='move'){
      const path='settings/organizationReporting/'+encodeURIComponent(scopeKey(job.scope)),confirmed=await change(path,value=>moveRecord(value||{parents:{}},job,people(job.scope)));
      jobs=jobs.filter(row=>row.id!==job.id);cache[scopeKey(job.scope)]=replay(job.scope,confirmed);
     }else{
      const confirmed=await change('settings/organizationMaster',value=>({...withPosition(value,job),_updatedAt:Date.now()}));jobs=jobs.filter(row=>row.id!==job.id);applyMaster(confirmed);
     }
     persist();status(jobs.length?'บันทึกในเครื่องแล้ว รอซิงก์':'บันทึกโครงสร้างเรียบร้อยแล้ว',false,job.scope);refresh();
    }catch(error){
     if(/วนกลับ|ไม่พบพนักงาน|ตนเอง|เลือกลำดับ/.test(String(error.message))){jobs=jobs.filter(row=>row.id!==job.id);if(job.type==='move'){const remote=await request('settings/organizationReporting/'+encodeURIComponent(scopeKey(job.scope))).catch(()=>null);cache[scopeKey(job.scope)]=replay(job.scope,remote?.value||{parents:{}})}persist();refresh()}
     status('บันทึกยังไม่สำเร็จ: '+String(error.message||error),true,job.scope);break;
    }
   }
  }finally{syncing=false;mount()}
 }
 async function assign(sourceId,targetId,relation,valueScope=scope()){
  if(!admin())throw Error('กรุณาเข้าสู่ระบบ Admin');if(scopeKey(valueScope)!==scopeKey(scope())||!root())throw Error('ฝ่ายหรือโรงงานเปลี่ยนแล้ว กรุณาเลือกพนักงานใหม่');
  const job={id:crypto.randomUUID?.()||String(Date.now())+'_'+Math.random(),type:'move',scope:{...valueScope},sourceId:String(sourceId),targetId:String(targetId||''),relation};
  const next=moveRecord(record(valueScope),job,people(valueScope));cache[scopeKey(valueScope)]=next;jobs.push(job);persist();sessionStorage.setItem(viewKey(valueScope),'tree');status('บันทึกในเครื่องแล้ว รอซิงก์',false,valueScope);refresh(true);void sync();return {pending:true};
 }
 async function addPosition(name,valueScope=scope()){
  if(!admin())throw Error('กรุณาเข้าสู่ระบบ Admin');name=String(name||'').trim().replace(/\s+/g,' ');if(!name||name.length>100)throw Error('กรุณาระบุชื่อตำแหน่งไม่เกิน 100 ตัวอักษร');
  if(scopeKey(valueScope)!==scopeKey(scope()))throw Error('ฝ่ายหรือโรงงานเปลี่ยนแล้ว กรุณาเลือกใหม่');if(valueScope.division!=='Production Division'&&window.PPMSProductionHierarchy?.isSupervisor(name))throw Error('ตำแหน่ง Supervisor Production ใช้ในฝ่ายผลิตเท่านั้น');
  const master=window.PPMSOrganizationScope.master();if((master.positionMap?.[valueScope.division]||[]).some(value=>value.toLowerCase()===name.toLowerCase()))throw Error('มีชื่อตำแหน่งนี้แล้ว');
  const job={id:crypto.randomUUID?.()||String(Date.now())+'_'+Math.random(),type:'position',scope:{...valueScope},name};jobs.push(job);persist();applyMaster(withPosition(master,job));status('บันทึกในเครื่องแล้ว รอซิงก์',false,valueScope);void sync();return {pending:true,name};
 }
 function dialog(title,html){
  document.getElementById('organizationStructureDialog')?.remove();const overlay=document.createElement('div');overlay.id='organizationStructureDialog';overlay.className='org-structure-overlay';overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="orgStructureTitle"><h2 id="orgStructureTitle">${esc(title)}</h2>${html}</section>`;document.body.append(overlay);overlay.querySelector('[data-org-dialog-close]').onclick=()=>overlay.remove();overlay.onkeydown=event=>{if(event.key==='Escape')overlay.remove();if(event.key==='Tab'){const controls=[...overlay.querySelectorAll('input,select,button')].filter(e=>!e.disabled),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};overlay.querySelector('input,select,button')?.focus();return overlay;
 }
 function relationDialog(id){
  if(!admin())return;const captured={...scope()},list=people(captured),person=list.find(e=>String(e.id)===String(id));if(!person)return;
  const overlay=dialog('จัดลำดับในผังองค์กร',`<p>${esc(person.id)} · ${esc(person.name||person.thaiName)}</p><form><label>จัดลำดับ<select name="relation"><option value="under">อยู่ใต้</option><option value="above">อยู่เหนือ</option><option value="root">ระดับบนสุด</option><option value="auto">ใช้ลำดับตามตำแหน่ง</option></select></label><label data-org-target-label>พนักงาน<select name="targetId">${list.filter(e=>String(e.id)!==String(id)).sort(seniority).map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.name||e.thaiName)} · ${esc(e.position)}</option>`).join('')}</select></label><p data-org-dialog-status role="status"></p><div class="org-structure-dialog-actions"><button type="submit">บันทึก</button><button type="button" class="secondary" data-org-dialog-close>ยกเลิก</button></div></form>`),form=overlay.querySelector('form');
  form.elements.relation.onchange=()=>{const visible=['under','above'].includes(form.elements.relation.value);form.querySelector('[data-org-target-label]').hidden=!visible;form.elements.targetId.disabled=!visible};
  form.onsubmit=async event=>{event.preventDefault();try{await assign(id,form.elements.targetId.disabled?'':form.elements.targetId.value,form.elements.relation.value,captured);overlay.remove()}catch(error){overlay.querySelector('[data-org-dialog-status]').textContent=error.message}};
 }
 function positionDialog(){
  if(!admin())return;const captured={...scope()},list=people(captured).sort(seniority),overlay=dialog('เพิ่มตำแหน่ง',`<form><label>ชื่อตำแหน่ง<input name="name" required maxlength="100" autocomplete="off"></label><label>พนักงาน<select name="employeeId"><option value="">เพิ่มตำแหน่งในรายการ</option>${list.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.name||e.thaiName)}</option>`).join('')}</select></label><p data-org-dialog-status role="status"></p><div class="org-structure-dialog-actions"><button type="submit">บันทึกตำแหน่ง</button><button type="button" class="secondary" data-org-dialog-close>ยกเลิก</button></div></form>`),form=overlay.querySelector('form');
  form.onsubmit=async event=>{event.preventDefault();try{const result=await addPosition(form.elements.name.value,captured),id=form.elements.employeeId.value;overlay.remove();if(id){window.PPMS_RUNTIME.openOrganizationEmployee(id);const input=document.querySelector('#employeeForm [name="position"]');if(input){input.value=result.name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}}else refresh(true)}catch(error){overlay.querySelector('[data-org-dialog-status]').textContent=error.message}};
 }
 function dropDialog(targetId,relation){
  if(!editing())return;const captured={...scope()},list=people(captured).filter(e=>String(e.id)!==String(targetId));
  const title=relation==='root'?'ระดับบนสุด':relation==='above'?'อยู่เหนือ':'อยู่ใต้',overlay=dialog(title,`<form><label>พนักงาน<select name="sourceId">${list.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.name||e.thaiName)}</option>`).join('')}</select></label><p data-org-dialog-status role="status"></p><div class="org-structure-dialog-actions"><button type="submit">บันทึก</button><button type="button" class="secondary" data-org-dialog-close>ยกเลิก</button></div></form>`),form=overlay.querySelector('form');
  form.onsubmit=async event=>{event.preventDefault();try{await assign(form.elements.sourceId.value,targetId,relation,captured);overlay.remove()}catch(error){overlay.querySelector('[data-org-dialog-status]').textContent=error.message}};
 }
 function mount(){
  const chart=root();if(!chart)return;const on=editing();chart.classList.toggle('org-structure-editing',on);
  let instructions=chart.querySelector(':scope>[data-org-structure-toolbar]');
  if(admin()&&!instructions){instructions=document.createElement('div');instructions.dataset.orgStructureToolbar='1';instructions.className='org-structure-toolbar no-print';instructions.innerHTML='<p data-org-structure-status role="status"></p><p data-org-drag-help>ลากพนักงานไปช่องเหนือหรือใต้ของอีกคน หรือกดจัดลำดับ</p><button type="button" class="secondary" data-org-drop="root" data-org-target="">ระดับบนสุด</button>';chart.prepend(instructions)}
  if(instructions){instructions.querySelector('[data-org-drag-help]').hidden=!on;instructions.querySelector('[data-org-drop]').hidden=!on;const message=instructions.querySelector('[data-org-structure-status]');message.textContent=notice?.key===scopeKey(scope())?notice.text:jobs.some(j=>scopeKey(j.scope)===scopeKey(scope()))?'บันทึกในเครื่องแล้ว รอซิงก์':'';message.classList.toggle('org-structure-error',notice?.key===scopeKey(scope())&&notice.error)}
  for(const card of chart.querySelectorAll('.person[data-edit]')){
   card.draggable=on&&!syncing;card.classList.toggle('org-structure-picked',picked?.id===card.dataset.edit);
   let controls=card.querySelector('[data-org-person-controls]');if(on&&!controls){controls=document.createElement('div');controls.className='org-person-controls no-print';controls.dataset.orgPersonControls='1';controls.innerHTML=`<button type="button" class="secondary" data-org-edit-position="${esc(card.dataset.edit)}">แก้ตำแหน่ง</button><button type="button" class="secondary" data-org-order="${esc(card.dataset.edit)}">จัดลำดับ</button><div class="org-person-drop-zones"><button type="button" data-org-drop="above" data-org-target="${esc(card.dataset.edit)}">เหนือ</button><button type="button" data-org-drop="under" data-org-target="${esc(card.dataset.edit)}">ใต้</button></div>`;card.append(controls)}if(controls)controls.hidden=!on;
  }
 }
 const cardOf=target=>target?.closest?.('.division-org:not(.employee-history-report) .person[data-edit]');
 window.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button===0&&editing()&&cardOf(event.target)&&!event.target.closest('button,input,select,a'))dragCandidate={id:cardOf(event.target).dataset.edit,scope:{...scope()}}},true);
 window.addEventListener('pointerup',()=>{dragCandidate=null},true);
 window.addEventListener('pointercancel',()=>{dragCandidate=null},true);
 async function drop(value,target){if(!value||!target||!root()?.contains(target)||scopeKey(value.scope)!==scopeKey(scope()))return;try{await assign(value.id,target.dataset.orgTarget,target.dataset.orgDrop,value.scope)}catch(error){status(error.message,true,value.scope)}finally{picked=null;document.querySelectorAll('.org-structure-drop-active').forEach(e=>e.classList.remove('org-structure-drop-active'));mount()}}
 window.addEventListener('dragstart',event=>{const card=cardOf(event.target);if(!card||!editing())return;if(syncing){dragCandidate=null;event.preventDefault();return}drag={id:card.dataset.edit,scope:{...scope()}};dragCandidate=null;event.dataTransfer?.setData('application/x-ppms-org-structure',drag.id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move'},true);
 window.addEventListener('dragover',event=>{const target=event.target.closest?.('[data-org-drop]');if(!drag||!root()?.contains(target)||target.dataset.orgTarget===drag.id||scopeKey(drag.scope)!==scopeKey(scope()))return;event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';document.querySelectorAll('.org-structure-drop-active').forEach(e=>e.classList.remove('org-structure-drop-active'));target.classList.add('org-structure-drop-active')},true);
 window.addEventListener('drop',event=>{const target=event.target.closest?.('[data-org-drop]');if(!drag||!root()?.contains(target))return;event.preventDefault();event.stopImmediatePropagation();const value=drag;drag=null;suppressClickUntil=Date.now()+500;void drop(value,target)},true);
 window.addEventListener('dragend',()=>{if(drag)suppressClickUntil=Date.now()+400;drag=null;dragCandidate=null;document.querySelectorAll('.org-structure-drop-active').forEach(e=>e.classList.remove('org-structure-drop-active'))},true);
 window.addEventListener('blur',()=>{drag=null;dragCandidate=null;document.querySelectorAll('.org-structure-drop-active').forEach(e=>e.classList.remove('org-structure-drop-active'))});
 window.addEventListener('click',event=>{
  if(Date.now()<suppressClickUntil&&root()?.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();return}
  const position=event.target.closest?.('[data-org-edit-position]'),order=event.target.closest?.('[data-org-order]'),add=event.target.closest?.('[data-org-add-position]');
  if(position||order||add){event.preventDefault();event.stopImmediatePropagation();if(!admin())return;if(position)window.PPMS_RUNTIME.openOrganizationEmployee(position.dataset.orgEditPosition);else if(order)relationDialog(order.dataset.orgOrder);else positionDialog();return}
  const target=event.target.closest?.('[data-org-drop]');if(target){event.preventDefault();event.stopImmediatePropagation();if(picked)void drop(picked,target);else dropDialog(target.dataset.orgTarget,target.dataset.orgDrop)}
 },true);
 window.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const button=event.target.closest?.('[data-org-person-controls] button');if(button){event.preventDefault();event.stopImmediatePropagation();button.click()}},true);
 document.addEventListener('change',event=>{
  if(event.target.id==='organizationStructureView'){sessionStorage.setItem(viewKey(scope()),event.target.value);refresh(true)}
  if(event.target.id==='organizationStructureEdit'){sessionStorage.setItem(editKey(scope()),event.target.checked?'1':'0');if(event.target.checked)sessionStorage.setItem(viewKey(scope()),'tree');refresh(true)}
 });
 function bindRemote(){
  subscription?.();subscription=null;const captured={...scope()},key=scopeKey(captured);
  try{if(window.firebase?.apps?.length){const ref=firebase.database().ref('settings/organizationReporting/'+key),callback=snapshot=>{cache[key]=replay(captured,snapshot.val()||{parents:{}});persist();refresh()};ref.on('value',callback,()=>{});subscription=()=>ref.off('value',callback)}}catch{}
 }
 window.addEventListener('ppms-organization-scope-changed',()=>{drag=null;dragCandidate=null;picked=null;document.getElementById('organizationStructureDialog')?.remove();bindRemote();mount()});
 window.addEventListener('ppms-employees-changed',mount);
 window.addEventListener('online',()=>void sync());
 window.addEventListener('storage',event=>{if([CACHE,OUTBOX].includes(event.key)){cache=read(CACHE,{});jobs=read(OUTBOX,[]);refresh()}});
 new MutationObserver(mount).observe(document.getElementById('app')||document.body,{childList:true,subtree:false});
 window.PPMSOrganizationEditor={isTreeView,controlsMarkup,chartMarkup,assign,addPosition,model,moveRecord,get dragging(){return !!drag||!!dragCandidate},get pending(){return [...jobs]},sync,mount};
 function startModule(){if(initial)return;initial=true;bindRemote();refresh(true);mount();void sync()}
 document.addEventListener('DOMContentLoaded',startModule);if(document.readyState!=='loading')startModule();
})();
