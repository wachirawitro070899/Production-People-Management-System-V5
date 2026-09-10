/* V714: deterministic Attendance delivery for mobile browsers.
   Write and verify one Firebase route at a time; do not wait for every mirror. */
(()=>{
 if(typeof syncAttendanceRecordCloud!=='function')return;
 const timeout=(promise,ms,label)=>Promise.race([
  promise,
  new Promise((_,reject)=>setTimeout(()=>reject(Error(label+' ใช้เวลานานเกินไป')),ms))
 ]);
 syncAttendanceRecordCloud=async function(rec){
  if(!rec?.employeeId||!rec?.date)return false;
  if(!window.firebase||!window.PPMS_FIREBASE_CONFIG)throw Error('ยังไม่สามารถเชื่อมต่อ Firebase ได้');
  if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
  if(!cloudDb)cloudDb=firebase.database();
  const upload={...rec,pendingCloudSync:false,cloudSyncedAt:new Date().toISOString(),writeVersion:'V714',canonicalVerified:true,cloudSource:'attendance-sequential-v714'};
  const flatKey=attendanceRecordStorageKey(upload.employeeId,upload.date);
  const dayKey=firebaseSafeKey(upload.date),empKey=firebaseSafeKey(attendanceEmployeeKey(upload.employeeId));
  const routes=[
   ['ข้อมูลหลัก',cloudDb.ref('ppms/attendanceRecords/'+flatKey)],
   ['ข้อมูลรายวัน',cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/recordsByKey/'+flatKey)],
   ['กล่องรับข้อมูล',cloudDb.ref(ATTENDANCE_INBOX_ROOT+'/'+dayKey+'/'+empKey)],
   ['ข้อมูลสด',cloudDb.ref(ATTENDANCE_LIVE_ROOT+'/'+dayKey+'/'+empKey)]
  ];
  let confirmed=null,confirmedName='',lastError=null;
  for(const [name,ref] of routes){
   try{
    await timeout(ref.set(firebaseEncodeData(upload)),7000,name);
    const snap=await timeout(ref.once('value'),4000,name+' ตรวจสอบ');
    const row=firebaseDecodeData(snap.val());
    if((row?.checkIn||row?.exception?.type||row?.lateNotice)&&sameAttendanceEmployeeId(row.employeeId,upload.employeeId)&&String(row.date||'')===String(upload.date)){
     confirmed=row;confirmedName=name;break;
    }
   }catch(error){lastError=error;console.warn('V714 Attendance route failed',name,error)}
  }
  if(!confirmed){
   rec.pendingCloudSync=true;
   if(rec.exception?.type||rec.lateNotice)rec.pendingNoticeSync=true;
   localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
   throw lastError||Error('Firebase ยังไม่ยืนยันข้อมูล กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง');
  }
  const canonical=mergeAttendanceRecords([confirmed],[rec])[0]||confirmed;
  Object.assign(rec,canonical,{pendingCloudSync:false,pendingNoticeSync:false,cloudVerifiedAt:new Date().toISOString(),cloudSyncedAt:upload.cloudSyncedAt,canonicalVerified:true,cloudSource:'attendance-sequential-v714',cloudVerifiedPaths:[confirmedName]});
  localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
  setCloudStatus('Attendance ยืนยันแล้ว • '+confirmedName);
  // Additional mirrors are best-effort only and never block the employee screen.
  for(const [name,ref] of routes)if(name!==confirmedName)ref.set(firebaseEncodeData(canonical)).catch(()=>{});
  if(typeof archiveAttendanceRecordCloud==='function')archiveAttendanceRecordCloud(canonical,cloudDb).catch(()=>{});
  return true;
 };
})();
