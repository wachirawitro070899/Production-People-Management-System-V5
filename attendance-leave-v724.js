/* V724: accept leave/late notices locally and retry Firebase automatically. */
(()=>{
 if(typeof syncAttendanceRecordCloud!=='function')return;
 const sendConfirmed=syncAttendanceRecordCloud;
 let retryBusy=false,retryTimer=null;

 const isNotice=rec=>!!(rec&&(rec.exception?.type||rec.lateNotice));
 const persist=()=>localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
 const scheduleRetry=(delay=1500)=>{clearTimeout(retryTimer);retryTimer=setTimeout(retryPendingNotices,delay)};

 syncAttendanceRecordCloud=async function(rec){
  if(!isNotice(rec))return sendConfirmed.apply(this,arguments);
  try{return await sendConfirmed.apply(this,arguments)}
  catch(error){
   rec.pendingCloudSync=true;rec.pendingNoticeSync=true;rec.noticeQueuedAt=rec.noticeQueuedAt||new Date().toISOString();rec.lastNoticeSyncError=String(error?.message||error||'Firebase unavailable');persist();scheduleRetry();
   setCloudStatus('รับรายการลาแล้ว • รอส่ง Firebase อัตโนมัติ');
   return {queued:true};
  }
 };

 async function retryPendingNotices(){
  if(retryBusy||navigator.onLine===false)return;
  const rows=(Array.isArray(attendance)?attendance:[]).filter(rec=>isNotice(rec)&&rec.pendingNoticeSync===true);
  if(!rows.length)return;
  retryBusy=true;
  try{
   if(!cloudDb&&!(await ensureAttendanceCloudReady(6000))){scheduleRetry(10000);return}
   for(const rec of rows){
    try{await sendConfirmed(rec);rec.pendingNoticeSync=false;rec.pendingCloudSync=false;rec.noticeCloudConfirmedAt=new Date().toISOString();delete rec.lastNoticeSyncError;persist()}
    catch(error){rec.lastNoticeSyncError=String(error?.message||error||'Firebase unavailable');persist();scheduleRetry(10000);break}
   }
  }finally{retryBusy=false}
 }

 document.addEventListener('submit',event=>{
  const form=event.target;
  if(form?.id!=='attendanceExceptionForm')return;
  const button=form.querySelector('button[type="submit"]');
  if(button&&!button.disabled)setTimeout(()=>{if(document.body.contains(button)&&form.dataset.submitting==='1')button.textContent='กำลังรับคำขอลา...'},0);
 },true);
 window.addEventListener('online',()=>scheduleRetry(500));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleRetry(500)});
 setInterval(retryPendingNotices,30000);
 scheduleRetry(1000);
})();
