/* V723: bounded Attendance checks for busy shift starts. */
(()=>{
 const wait=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error(label+' ใช้เวลานานเกินไป')),ms))]);
 const decode=snap=>firebaseDecodeData(snap?.val?.());

 refreshAttendanceDeviceBindingsFromCloud=async function(){
  if(!hasFirebaseConfig()||!window.firebase)return false;
  try{
   if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
   if(!cloudDb)cloudDb=firebase.database();
   const token=deviceToken();let snap;
   try{snap=await wait(cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/devices').orderByChild('token').equalTo(token).once('value'),4500,'ตรวจสอบเครื่อง')}
   catch(primaryError){console.warn('V723 primary device lookup unavailable',primaryError);snap=await wait(cloudDb.ref('ppms/attendanceDevices').orderByChild('token').equalTo(token).once('value'),3000,'ตรวจสอบเครื่องสำรอง')}
   const matched=decode(snap)||{};
   for(const [id,value] of Object.entries(matched))attendanceDevices[id]=value;
   localStorage.setItem(ATTENDANCE_DEVICES_KEY,JSON.stringify(attendanceDevices));return true;
  }catch(error){console.warn('V723 device lookup timed out',error);return false}
 };

 assertAndBindAttendanceDeviceCloud=async function(emp){
  const empId=String(emp.id),token=deviceToken();
  if(!cloudDb&&!(await ensureAttendanceCloudReady(6000)))throw Error('ยังเชื่อมต่อ Firebase ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
  let tokenRows={};
  try{tokenRows=decode(await wait(cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/devices').orderByChild('token').equalTo(token).once('value'),4500,'ตรวจสอบการผูกเครื่อง'))||{}}
  catch(error){console.warn('V723 token lookup unavailable',error)}
  const other=Object.entries(tokenRows).find(([id])=>String(id)!==empId);
  if(other)throw Error(`เครื่องนี้ผูกกับรหัสพนักงาน ${other[0]} แล้ว • หากเป็นข้อมูลเก่าให้ Admin กด Reset Device`);
  const ref=cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/devices/'+firebaseEncodeKey(empId));let own=null;
  try{own=decode(await wait(ref.once('value'),3500,'อ่านข้อมูลเครื่อง'))||null}catch(_){own=attendanceDevices[empId]||null}
  const now=new Date().toISOString(),migrating=!!(own&&String(own.token||'')!==token),next={...(own||{}),token,label:deviceLabel(),registeredAt:own?.registeredAt||now,lastSeenAt:now,lockVersion:'V723'};
  if(migrating){next.previousToken=String(own.token||'');next.tokenMigratedAt=now;next.tokenMigrationReason='mobile-token-refresh';next.tokenRefreshCount=Number(own?.tokenRefreshCount||0)+1}
  await wait(ref.set(firebaseEncodeData(next)),5000,'บันทึกข้อมูลเครื่อง');
  const verify=decode(await wait(ref.once('value'),3500,'ยืนยันข้อมูลเครื่อง'));
  if(!verify||String(verify.token||'')!==token)throw Error('Firebase ยังไม่ยืนยันการลงทะเบียนเครื่อง กรุณาลองใหม่');
  attendanceDevices[empId]=verify;localStorage.setItem(ATTENDANCE_DEVICES_KEY,JSON.stringify(attendanceDevices));return true;
 };

 syncAttendanceRecordCloud=async function(rec){
  if(!rec?.employeeId||!rec?.date)return false;
  if(!window.firebase||!window.PPMS_FIREBASE_CONFIG)throw Error('ยังไม่สามารถเชื่อมต่อ Firebase ได้');
  if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);if(!cloudDb)cloudDb=firebase.database();
  const upload={...rec,pendingCloudSync:false,cloudSyncedAt:new Date().toISOString(),writeVersion:'V723',canonicalVerified:true,cloudSource:'attendance-fast-v723'};
  const flatKey=attendanceRecordStorageKey(upload.employeeId,upload.date),dayKey=firebaseSafeKey(upload.date),empKey=firebaseSafeKey(attendanceEmployeeKey(upload.employeeId));
  const primary=[['ข้อมูลหลัก',cloudDb.ref('ppms/attendanceRecords/'+flatKey)],['ข้อมูล Attendance',cloudDb.ref(ATTENDANCE_CLOUD_ROOT+'/recordsByKey/'+flatKey)]];
  const attempt=async([name,ref])=>{await wait(ref.set(firebaseEncodeData(upload)),5000,name);const row=decode(await wait(ref.once('value'),3000,name+' ตรวจสอบ'));if(!(row?.checkIn||row?.exception?.type||row?.lateNotice)||!sameAttendanceEmployeeId(row.employeeId,upload.employeeId)||String(row.date||'')!==String(upload.date))throw Error(name+' ยืนยันข้อมูลไม่ตรง');return{name,ref,row}};
  let confirmed;
  try{confirmed=await Promise.any(primary.map(attempt))}
  catch(_){rec.pendingCloudSync=true;if(rec.exception?.type||rec.lateNotice)rec.pendingNoticeSync=true;localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));throw Error('Firebase ยังไม่ยืนยันข้อมูลภายใน 8 วินาที ระบบเก็บเวลาไว้ในเครื่องและจะส่งซ้ำอัตโนมัติ')}
  const canonical=mergeAttendanceRecords([confirmed.row],[rec])[0]||confirmed.row;
  Object.assign(rec,canonical,{pendingCloudSync:false,pendingNoticeSync:false,cloudVerifiedAt:new Date().toISOString(),cloudSyncedAt:upload.cloudSyncedAt,canonicalVerified:true,cloudSource:'attendance-fast-v723',cloudVerifiedPaths:[confirmed.name]});
  localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));setCloudStatus('Attendance ยืนยันแล้ว • '+confirmed.name);
  const mirrors=[cloudDb.ref(ATTENDANCE_INBOX_ROOT+'/'+dayKey+'/'+empKey),cloudDb.ref(ATTENDANCE_LIVE_ROOT+'/'+dayKey+'/'+empKey),...primary.filter(([,ref])=>ref.toString()!==confirmed.ref.toString()).map(([,ref])=>ref)];
  mirrors.forEach(ref=>ref.set(firebaseEncodeData(canonical)).catch(()=>{}));if(typeof archiveAttendanceRecordCloud==='function')archiveAttendanceRecordCloud(canonical,cloudDb).catch(()=>{});return true;
 };
})();
