(function(){
  let drag=null, ghost=null, moved=false, suppressClickUntil=0;
  function slotOf(row){
    const shift=row.closest('.stamp-info-shift'),group=row.closest('.stamp-info-group');
    const role=row.querySelector('.stamp-role-name')?.textContent.trim()||'';
    return {shift:shift?.classList.contains('shift-a')?'Team A':'Team B',group:group?.classList.contains('group-a')?'A':group?.classList.contains('group-b')?'B':'C',role,machines:['Support','Spare'].includes(role)?'':(row.querySelector('.stamp-machine-box b')?.textContent.trim()||'')};
  }
  function employeeIn(slot,exceptId=''){return employees.find(e=>String(e.id)!==String(exceptId)&&e.stampingShift===slot.shift&&e.stampingGroup===slot.group&&e.stampingRole===slot.role)}
  function applySlot(emp,slot){emp.stampingShift=slot.shift;emp.stampingGroup=slot.group;emp.stampingRole=slot.role;emp.stampingMachines=slot.machines}
  function cleanup(){document.querySelectorAll('.stamp-drag-over,.stamp-drag-source').forEach(x=>x.classList.remove('stamp-drag-over','stamp-drag-source'));ghost?.remove();ghost=null;drag=null}
  async function commit(target){
    const sourceEmp=employees.find(e=>String(e.id)===String(drag.id));if(!sourceEmp)return cleanup();
    const from=drag.from,to=slotOf(target);if(from.shift===to.shift&&from.group===to.group&&from.role===to.role)return cleanup();
    const targetEmp=employeeIn(to,sourceEmp.id);applySlot(sourceEmp,to);if(targetEmp)applySlot(targetEmp,from);
    save();const changed=[sourceEmp,targetEmp].filter(Boolean);render();
    try{const ready=await ensureCloudReady(12000);if(!ready)throw Error('Firebase ยังไม่พร้อม');await Promise.all(changed.map(e=>syncEmployeeCloudNow(e,e.id)));status(targetEmp?'สลับตำแหน่งพนักงานและบันทึกแล้ว':'ย้ายพนักงานและบันทึกแล้ว','ok')}
    catch(err){alert('ย้ายในเครื่องแล้ว แต่ Firebase ยังซิงก์ไม่สำเร็จ: '+err.message)}
  }
  function moveGhost(x,y){if(ghost){ghost.style.left=(x+12)+'px';ghost.style.top=(y+12)+'px'}}
  function start(row,ev){
    if(typeof isAdmin!=='undefined'&&!isAdmin){alert('กรุณา Login เป็น Admin ก่อนย้ายตำแหน่ง');return}
    drag={id:row.dataset.edit,from:slotOf(row),x:ev.clientX,y:ev.clientY};moved=false;row.classList.add('stamp-drag-source');
    ghost=row.cloneNode(true);ghost.className='stamp-drag-ghost';document.body.appendChild(ghost);moveGhost(ev.clientX,ev.clientY);
  }
  function targetAt(x,y){return document.elementFromPoint(x,y)?.closest('.stamp-duty-row')||null}
  document.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;const row=ev.target.closest('.stamp-duty-row.assigned-person[data-edit]');if(!row||!row.closest('.stamping-infographic'))return;start(row,ev);if(drag){row.setPointerCapture?.(ev.pointerId);ev.preventDefault()}},true);
  document.addEventListener('pointermove',ev=>{if(!drag)return;if(Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)>5)moved=true;moveGhost(ev.clientX,ev.clientY);document.querySelectorAll('.stamp-drag-over').forEach(x=>x.classList.remove('stamp-drag-over'));const target=targetAt(ev.clientX,ev.clientY);if(target)target.classList.add('stamp-drag-over');ev.preventDefault()},true);
  document.addEventListener('pointerup',ev=>{if(!drag)return;const target=targetAt(ev.clientX,ev.clientY);if(moved&&target){suppressClickUntil=Date.now()+500;commit(target)}else cleanup();ev.preventDefault()},true);
  document.addEventListener('pointercancel',cleanup,true);
  document.addEventListener('click',ev=>{if(Date.now()<suppressClickUntil){ev.preventDefault();ev.stopImmediatePropagation()}},true);
})();