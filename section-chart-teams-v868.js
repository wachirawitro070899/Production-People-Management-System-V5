/* Team assignment controls are confined to the optional Section chart view. */
(()=>{
 'use strict';
 let source=null,selected=null,pointer=null,ghost=null,suppressClickUntil=0,notice=null;
 const pending=new Set();
 const root=()=>document.querySelector('.section-chart-workspace[data-section-team-mode="split"]');
 const admin=()=>window.PPMS_RUNTIME?.factoryLayoutIsAdmin?.()===true;
 const context=()=>({...window.PPMS_RUNTIME?.organizationScope?.(),section:document.querySelector('#sectionSelect')?.value||''});
 const same=(a,b)=>a&&b&&a.division===b.division&&a.plant===b.plant&&a.section===b.section;
 const employeeCard=target=>{const card=target?.closest?.('.section-chart-workspace[data-section-team-mode="split"] .person[data-edit]');return card&&!card.closest('.stamping-role-source,.stamping-print-page,.sorting-print-pages')?card:null};
 function clearTargets(){document.querySelectorAll('.section-team-drop-active').forEach(node=>node.classList.remove('section-team-drop-active'))}
 function showStatus(text,error=false,scope=context()){
  notice={text,error,scope};const node=root()?.querySelector('[data-section-team-status]');
  if(node&&same(scope,context())){node.textContent=text;node.classList.toggle('section-team-error',error)}
 }
 function mount(){
  const report=root();if(!report){selected=null;return}
  if(selected&&!same(selected.context,context()))selected=null;
  for(const card of report.querySelectorAll('.person[data-edit]')){
   if(!employeeCard(card))continue;
   card.draggable=admin()&&!pending.has(card.dataset.edit);
   card.classList.toggle('section-team-picked',card.dataset.edit===selected?.id);
   let button=card.querySelector('[data-section-team-pick]');
   if(admin()&&!button){button=document.createElement('button');button.type='button';button.className='secondary section-team-move no-print';button.dataset.sectionTeamPick=card.dataset.edit;button.textContent='ย้ายทีม';card.append(button)}
   if(button)button.disabled=pending.has(card.dataset.edit);
  }
  if(notice&&same(notice.scope,context())){if(notice.pendingId&&!window.PPMS_RUNTIME?.sectionChartTeamPending?.(notice.pendingId)){notice.text='ย้ายทีมและบันทึกเรียบร้อยแล้ว';delete notice.pendingId}const node=report.querySelector('[data-section-team-status]');if(node){node.textContent=notice.text;node.classList.toggle('section-team-error',notice.error)}}
 }
 function pick(card){
  const id=card?.dataset.edit;if(!id||pending.has(id)||!admin())return;
  selected={id,context:context()};mount();showStatus('เลือกทีม A หรือทีม B ที่ต้องการย้าย');
 }
 async function move(value,target){
  if(!value||!target||!root()?.contains(target)||!same(value.context,context())||!admin()||pending.has(value.id))return;
  const team=target.dataset.sectionTeamTarget;if(!['Team A','Team B',''].includes(team))return;
  pending.add(value.id);selected=null;clearTargets();showStatus('กำลังบันทึกทีม...',false,value.context);mount();
  try{
   const task=window.PPMS_RUNTIME.assignSectionChartTeam(value.id,team,value.context);mount();
   const result=await task;
   showStatus(result.pending?'บันทึกทีมในเครื่องแล้ว • รอซิงก์ Firebase':result.changed?'ย้ายทีมและบันทึกเรียบร้อยแล้ว':'พนักงานอยู่ในทีมนี้แล้ว',false,value.context);if(result.pending&&notice)notice.pendingId=value.id;
  }catch(error){showStatus(String(error.message||error),true,value.context)}
  finally{pending.delete(value.id);mount()}
 }
 window.addEventListener('dragstart',event=>{
  const card=employeeCard(event.target);if(!card)return;
  if(!admin()||pending.has(card.dataset.edit)){event.preventDefault();return}
  source={id:card.dataset.edit,context:context(),copy:!!card.closest('.section-org-report')};selected=null;
  event.dataTransfer?.setData('application/x-ppms-section-team',source.id);
  event.dataTransfer?.setData('text/plain',source.id);
  if(event.dataTransfer)event.dataTransfer.effectAllowed=source.copy?'copy':'move';card.classList.add('section-team-dragging');
 },true);
 window.addEventListener('dragover',event=>{
  const target=event.target.closest?.('[data-section-team-target]');
  if(!source||!root()?.contains(target)||!same(source.context,context()))return;
  event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect=source.copy?'copy':'move';clearTargets();target.classList.add('section-team-drop-active');
 },true);
 window.addEventListener('drop',event=>{
  const target=event.target.closest?.('[data-section-team-target]');if(!source||!root()?.contains(target))return;
  event.preventDefault();event.stopImmediatePropagation();const value=source;source=null;suppressClickUntil=Date.now()+500;clearTargets();void move(value,target);
 },true);
 window.addEventListener('dragend',()=>{source=null;clearTargets();document.querySelectorAll('.section-team-dragging').forEach(node=>node.classList.remove('section-team-dragging'));suppressClickUntil=Date.now()+400},true);
 window.addEventListener('click',event=>{
  const report=root();if(!report?.contains(event.target)){selected=null;return}
  if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();return}
  const button=event.target.closest?.('[data-section-team-pick]');
  if(button){event.preventDefault();event.stopImmediatePropagation();pick(employeeCard(button));return}
  const target=event.target.closest?.('[data-section-team-target]');
  if(selected&&target){event.preventDefault();event.stopImmediatePropagation();void move(selected,target)}
 },true);
 window.addEventListener('keydown',event=>{
  const button=event.target.closest?.('[data-section-team-pick]');if(!button||!['Enter',' '].includes(event.key))return;
  event.preventDefault();event.stopImmediatePropagation();pick(employeeCard(button));
 },true);
 function finishPointer(cancel=false){
  const value=pointer;pointer=null;ghost?.remove();ghost=null;clearTargets();
  if(!value)return;try{value.button.releasePointerCapture(value.pointerId)}catch{}
  suppressClickUntil=Date.now()+500;
  if(!cancel){if(value.moved&&value.target)void move(value,value.target);else if(!value.moved)pick(value.card)}
 }
 window.addEventListener('pointerdown',event=>{
  if(!['touch','pen'].includes(event.pointerType))return;
  const button=event.target.closest?.('[data-section-team-pick]'),card=employeeCard(button);if(!button||!card||!admin()||pending.has(card.dataset.edit))return;
  event.preventDefault();event.stopImmediatePropagation();pointer={id:card.dataset.edit,context:context(),card,button,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false,target:null};
  try{button.setPointerCapture(event.pointerId)}catch{}
 },true);
 window.addEventListener('pointermove',event=>{
  if(!pointer||pointer.pointerId!==event.pointerId)return;
  if(!same(pointer.context,context())){finishPointer(true);return}
  event.preventDefault();
  if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8)pointer.moved=true;
  if(!pointer.moved)return;
  if(!ghost){ghost=document.createElement('div');ghost.className='section-team-drag-ghost';ghost.textContent=pointer.card.querySelector('b')?.textContent||pointer.id;document.body.append(ghost)}
  ghost.style.left=(event.clientX+12)+'px';ghost.style.top=(event.clientY+12)+'px';
  pointer.target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-section-team-target]')||null;clearTargets();if(root()?.contains(pointer.target))pointer.target.classList.add('section-team-drop-active');
 },{capture:true,passive:false});
 window.addEventListener('pointerup',event=>{if(pointer&&pointer.pointerId===event.pointerId){event.preventDefault();event.stopImmediatePropagation();finishPointer()}},true);
 window.addEventListener('pointercancel',()=>finishPointer(true),true);
 window.addEventListener('ppms-organization-scope-changed',()=>{finishPointer(true);selected=null;source=null});
 new MutationObserver(mount).observe(document.getElementById('app')||document.body,{childList:true,subtree:false});
 window.addEventListener('ppms-employees-changed',mount);
 window.addEventListener('ppms-section-chart-rendered',mount);
 window.addEventListener('ppms-section-team-error',event=>{if(notice?.pendingId===event.detail.id&&notice.scope.section===event.detail.section)showStatus(event.detail.message,true,notice.scope)});
 document.addEventListener('DOMContentLoaded',mount);
 window.PPMSSectionTeams={mount,get dragging(){return !!source||!!pointer}};
 mount();
})();
