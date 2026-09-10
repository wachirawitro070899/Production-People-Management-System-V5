/* V713: recover a check-in when one Firebase mirror stays pending on mobile Safari. */
(()=>{
 if(typeof syncAttendanceRecordCloud!=='function')return;
 const primarySyncAttendanceRecordCloud=syncAttendanceRecordCloud;
 const wait=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error(label)),ms))]);
 syncAttendanceRecordCloud=async function(rec){
  let primaryError=null;
  try{return await wait(primarySyncAttendanceRecordCloud.apply(this,arguments),9000,'Firebase response timeout')}
  catch(error){primaryError=error}
  if(!rec?.employeeId||!rec?.date||!cloudDb)throw primaryError;
  const flatKey=attendanceRecordStorageKey(rec.employeeId,rec.date);
  const dayKey=firebaseSafeKey(rec.date),empKey=firebaseSafeKey(attendanceEmployeeKey(rec.employeeId));
  const refs=[
   ['ppms/attendanceRecords/'+flatKey,cloudDb.ref('ppms/attendanceRecords/'+flatKey)],
   [ATTENDANCE_CLOUD_ROOT+'/recordsByKey/'+flatKey,cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/recordsByKey/'+flatKey)],
   [ATTENDANCE_INBOX_ROOT+'/'+dayKey+'/'+empKey,cloudDb.ref(ATTENDANCE_INBOX_ROOT+'/'+dayKey+'/'+empKey)],
   [ATTENDANCE_LIVE_ROOT+'/'+dayKey+'/'+empKey,cloudDb.ref(ATTENDANCE_LIVE_ROOT+'/'+dayKey+'/'+empKey)]
  ];
  const verifiedPaths=[];let verified=null;
  for(const [name,ref] of refs){
   try{
    const snap=await wait(ref.once('value'),2500,'verify timeout');
    const row=firebaseDecodeData(snap.val());
    if((row?.checkIn||row?.exception?.type||row?.lateNotice)&&sameAttendanceEmployeeId(row.employeeId,rec.employeeId)&&String(row.date||'')===String(rec.date)){
     verifiedPaths.push(name);verified=mergeAttendanceRecords(verified?[verified]:[],[row])[0]||row;
    }
   }catch(_){}
  }
  if(!verified)throw primaryError;
  const canonical=mergeAttendanceRecords([verified],[rec])[0]||verified;
  Object.assign(rec,canonical,{pendingCloudSync:false,pendingNoticeSync:false,cloudVerifiedAt:new Date().toISOString(),canonicalVerified:true,cloudSource:'attendance-timeout-recovery-v713',cloudVerifiedPaths:verifiedPaths});
  localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
  setCloudStatus('Attendance ยืนยันแล้ว • กู้คืนการตอบกลับ Firebase สำเร็จ');
  return true;
 };
})();
