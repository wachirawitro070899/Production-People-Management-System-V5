/* V716: always create the local automatic-absence ledger for KPI.
   A temporary Firebase connection failure must not prevent Absent -10 from
   appearing. Pending rows remain queued and sync when Firebase reconnects. */
(()=>{
 if(typeof reconcileAutomaticAbsences!=='function')return;
 const primaryReconcileAutomaticAbsences=reconcileAutomaticAbsences;
 reconcileAutomaticAbsences=function(year){
  const previousReady=attendanceCloudReady;
  if(hasFirebaseConfig()&&!attendanceCloudReady)attendanceCloudReady=true;
  try{return primaryReconcileAutomaticAbsences.apply(this,arguments)}
  finally{attendanceCloudReady=previousReady}
 };
})();
