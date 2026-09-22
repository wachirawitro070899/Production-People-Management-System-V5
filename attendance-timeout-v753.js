/* V753: Bound Attendance Firebase requests so mobile check-in never spins forever. */
(()=>{
 'use strict';
 if(!window.firebase?.database)return;
 const timeoutError=(label,ms)=>Error(label+' ใช้เวลานานเกิน '+Math.ceil(ms/1000)+' วินาที • ระบบจะเก็บเวลาในเครื่องและส่งซ้ำอัตโนมัติ');
 const withTimeout=(promise,ms,label)=>{let timer;return Promise.race([
  Promise.resolve(promise).finally(()=>clearTimeout(timer)),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(timeoutError(label,ms)),ms)})
 ])};
 let sample;
 try{if(!firebase.apps.length){if(!window.PPMS_FIREBASE_CONFIG)return;firebase.initializeApp(window.PPMS_FIREBASE_CONFIG)}sample=firebase.database().ref()}catch(_){return}
 const proto=Object.getPrototypeOf(sample);
 if(!proto||proto.__ppmsAttendanceTimeoutV753)return;
 const attendancePath=ref=>{
  try{return /(?:ppmsAttendance|ppmsArchive|attendanceRecords|attendanceDevices|shiftSchedules|\/employees)(?:\/|$)/i.test(String(ref.toString()))}
  catch(_){return false}
 };
 const wrap=(name,ms,label)=>{
  const original=proto[name];
  if(typeof original!=='function')return;
  proto[name]=function(...args){
   const result=original.apply(this,args);
   // Preserve callback-style Firebase calls and non-Attendance operations.
   if(args.some(x=>typeof x==='function')||!attendancePath(this)||!result?.then)return result;
   return withTimeout(result,ms,label);
  };
 };
 wrap('once',4500,'อ่านข้อมูล Attendance');
 wrap('set',6000,'ส่งข้อมูล Attendance');
 wrap('update',6000,'อัปเดตข้อมูล Attendance');
 wrap('remove',6000,'ลบข้อมูล Attendance');
 wrap('transaction',7000,'ยืนยันข้อมูล Attendance');
 Object.defineProperty(proto,'__ppmsAttendanceTimeoutV753',{value:true});
 window.PPMS_ATTENDANCE_TIMEOUT_VERSION='V753';
})();

