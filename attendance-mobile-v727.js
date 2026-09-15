/* V727: bounded mobile GPS and visible employee leave-sync status. */
(()=>{
 'use strict';

 // Always settle promptly. iOS/Samsung can leave watchPosition pending even
 // after the one-shot lookup has already returned a usable location.
 getBestPosition=function({duration=12000,minSamples=1,targetAccuracy=25}={}){
  return new Promise((resolve,reject)=>{
   if(!navigator.geolocation)return reject(Error('อุปกรณ์นี้ไม่รองรับ GPS'));
   let best=null,watchId=null,done=false,lastError=null,softTimer=null;
   const cleanup=()=>{if(watchId!==null)navigator.geolocation.clearWatch(watchId);clearTimeout(hardTimer);clearTimeout(softTimer)};
   const finish=()=>{if(done)return;done=true;cleanup();if(best)return resolve(best);reject(Error(gpsErrorMessage(lastError)))};
   const accept=position=>{
    if(done||!position?.coords)return;
    if(!best||Number(position.coords.accuracy||9999)<Number(best.coords.accuracy||9999))best=position;
    if(Number(position.coords.accuracy||9999)<=targetAccuracy)return finish();
    clearTimeout(softTimer);softTimer=setTimeout(finish,2200);
   };
   const fail=error=>{lastError=error;if(error?.code===1)finish()};
   const hardTimer=setTimeout(finish,Math.min(12000,Math.max(6000,Number(duration)||12000)));
   navigator.geolocation.getCurrentPosition(accept,fail,{enableHighAccuracy:false,timeout:6000,maximumAge:60000});
   watchId=navigator.geolocation.watchPosition(accept,fail,{enableHighAccuracy:true,timeout:10000,maximumAge:15000});
  });
 };

 const employeeId=()=>String(document.querySelector('#attendanceEmployeeId')?.value||sessionStorage.getItem('attendanceEmp')||'').trim();
 const leaveRows=id=>(Array.isArray(attendance)?attendance:[]).filter(row=>row&&sameAttendanceEmployeeId(row.employeeId,id)&&row.exception?.type==='leave').sort((a,b)=>String(b.exception?.submittedAt||b.updatedAt||'').localeCompare(String(a.exception?.submittedAt||a.updatedAt||'')));
 const statusMarkup=row=>{
  const queued=row.pendingNoticeSync===true||row.pendingCloudSync===true;
  const label=row.exception?.leaveType==='sick'?'ลาป่วย':'ลากิจ';
  return `<div class="attendance-leave-status ${queued?'pending':'synced'}"><div><b>${queued?'⏳ รอส่งข้อมูลอัตโนมัติ':'✓ ส่งคำขอลาแล้ว'}</b><small>${esc(row.date||'')} • ${esc(label)} • ${esc(row.exception?.reason||'-')}</small></div><span>${queued?'รอซิงก์':'บันทึกแล้ว'}</span></div>`;
 };
 function renderLeaveStatus(){
  const shell=document.querySelector('.attendance-shell'),id=employeeId();if(!shell)return;
  let panel=document.getElementById('employeeLeaveStatus');
  const rows=id?leaveRows(id).slice(0,3):[];
  if(!rows.length){panel?.remove();return}
  if(!panel){panel=document.createElement('section');panel.id='employeeLeaveStatus';panel.className='panel employee-leave-status-panel';const card=shell.querySelector('.attendance-card');(card||shell).insertAdjacentElement('afterend',panel)}
  const html='<h3>สถานะการลา / Leave Status</h3>'+rows.map(statusMarkup).join('');
  if(panel.innerHTML!==html)panel.innerHTML=html;
 }
 document.addEventListener('input',event=>{if(event.target?.id==='attendanceEmployeeId')setTimeout(renderLeaveStatus,0)},true);
 document.addEventListener('submit',event=>{if(event.target?.id==='attendanceExceptionForm'){setTimeout(renderLeaveStatus,300);setTimeout(renderLeaveStatus,1800)}},true);
 window.addEventListener('online',()=>setTimeout(renderLeaveStatus,2000));
 new MutationObserver(renderLeaveStatus).observe(document.getElementById('app'),{childList:true,subtree:true});
 setInterval(renderLeaveStatus,10000);setTimeout(renderLeaveStatus,0);
})();
