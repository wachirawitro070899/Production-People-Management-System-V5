/* V688: recover Attendance and shift planning if the large ppms bootstrap fails. */
(()=>{'use strict';
let starting=false;
async function recover(){
 if(starting||!window.firebase||!window.PPMS_FIREBASE_CONFIG)return false;
 if(cloudReady&&cloudDb&&window.__ppmsAttendanceCanonicalBound)return true;
 starting=true;
 try{
  const ready=typeof ensureAttendanceCloudReady==='function'&&await ensureAttendanceCloudReady(15000);if(!ready||!cloudDb)return false;
  if(typeof bindAttendanceCanonical==='function')bindAttendanceCanonical();
  if(typeof bindAttendanceInboxToday==='function')bindAttendanceInboxToday();
  if(typeof bindAttendanceLiveMirror==='function')bindAttendanceLiveMirror();
  if(typeof bindAttendanceDurableKeyedToday==='function')bindAttendanceDurableKeyedToday();
  await Promise.allSettled([
   typeof mergeTodayAttendanceCanonical==='function'&&mergeTodayAttendanceCanonical(),
   typeof mergeTodayAttendanceInbox==='function'&&mergeTodayAttendanceInbox(),
   typeof mergeTodayAttendanceLiveMirror==='function'&&mergeTodayAttendanceLiveMirror(),
   typeof mergeTodayAttendanceDurableKeyed==='function'&&mergeTodayAttendanceDurableKeyed(),
   typeof retryPendingAttendanceCloud==='function'&&retryPendingAttendanceCloud()
  ]);
  if(typeof setCloudStatus==='function')setCloudStatus('เชื่อมต่อแล้ว • Attendance และแผนกะพร้อมใช้งาน');
  const busy=typeof userInteractionBusy==='function'&&userInteractionBusy();
  const modalOpen=!document.getElementById('modal')?.classList.contains('hidden');
  if(!busy&&!modalOpen&&typeof queueRemoteRender==='function')queueRemoteRender();return true;
 }catch(error){console.warn('V688 realtime recovery pending',error);return false}finally{starting=false}
}
window.ppmsRecoverRealtimeFeatures=recover;
window.addEventListener('online',()=>setTimeout(recover,300));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recover()});
setTimeout(recover,500);setInterval(recover,60000);
})();