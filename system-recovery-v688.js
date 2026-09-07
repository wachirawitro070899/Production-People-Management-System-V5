/* V688: recover Attendance and shift planning if the large ppms bootstrap fails. */
(()=>{'use strict';
let starting=false;
async function recover(){
 if(starting||!window.firebase||!window.PPMS_FIREBASE_CONFIG)return false;
 const runtime=window.PPMS_RUNTIME;if(!runtime||typeof runtime.recoverRealtime!=='function')return false;
 const health=typeof runtime.health==='function'?runtime.health():{};
 if(health.cloudReady&&health.attendanceCloudReady&&window.__ppmsAttendanceCanonicalBound)return true;
 starting=true;
 try{
  return await runtime.recoverRealtime();
 }catch(error){console.warn('V688 realtime recovery pending',error);return false}finally{starting=false}
}
window.ppmsRecoverRealtimeFeatures=recover;
window.addEventListener('online',()=>setTimeout(recover,300));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recover()});
setTimeout(recover,500);setInterval(recover,60000);
})();
