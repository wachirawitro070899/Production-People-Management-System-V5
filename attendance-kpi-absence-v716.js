/* V729: always create the automatic-absence ledger for KPI.
   A temporary Firebase connection failure must not prevent Absent -10 from
   appearing. Pending rows remain queued and sync when Firebase reconnects. */
(()=>{
 if(typeof reconcileAutomaticAbsences!=='function')return;
 const primaryReconcileAutomaticAbsences=reconcileAutomaticAbsences;
 const primaryAttendanceIsTrialDate=attendanceIsTrialDate;
 // A cleanup made earlier today must not disable today's real attendance for
 // the rest of the shift. Historical trial dates remain protected.
 attendanceIsTrialDate=function(date,section=''){
  if(String(date||'')===thaiDateKey())return false;
  return primaryAttendanceIsTrialDate.apply(this,arguments);
 };
 // Finalize both shifts 25 minutes after their normal check-in window.
 absenceDeadlinePassed=function(emp,workDate,now=new Date()){
  const sh=shiftConfig(emp,workDate),cutoff=sh.key==='night'?'20:30':'08:30';
  return now>=new Date(`${workDate}T${cutoff}:00+07:00`);
 };
 reconcileAutomaticAbsences=function(year){
  const previousReady=attendanceCloudReady;
  if(hasFirebaseConfig()&&!attendanceCloudReady)attendanceCloudReady=true;
  try{return primaryReconcileAutomaticAbsences.apply(this,arguments)}
  finally{attendanceCloudReady=previousReady}
 };
 const reconcileNow=()=>{
  const changed=reconcileAutomaticAbsences(thaiYear());
  if(changed&&typeof syncPendingCloudData==='function')setTimeout(()=>syncPendingCloudData(),100);
  if(changed&&current==='attendanceAdmin'&&isAdmin)setTimeout(()=>render(),0);
  return changed;
 };
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(reconcileNow,200)});
 window.addEventListener('online',()=>setTimeout(reconcileNow,200));
 setInterval(reconcileNow,60000);
 setTimeout(reconcileNow,1000);
})();
