/* V733: provisional Absent -10 at work-start +30 minutes.
   A temporary Firebase connection failure must not prevent Absent -10 from
   appearing. Pending rows remain queued and sync when Firebase reconnects. */
(()=>{
 if(typeof reconcileAutomaticAbsences!=='function')return;
 const primaryAttendanceIsTrialDate=attendanceIsTrialDate;
 // A cleanup made earlier today must not disable today's real attendance for
 // the rest of the shift. Historical trial dates remain protected.
 attendanceIsTrialDate=function(date,section=''){
  const start=String(attendanceConfig()?.kpiStartDate||'');
  if(String(date||'')===thaiDateKey())return false;
  return primaryAttendanceIsTrialDate.apply(this,arguments);
 };
 const absenceCutoffFor=(emp,workDate)=>{
  const sh=shiftConfig(emp,workDate),start=timeMinutes(sh.workStart),cutoff=(start+30)%(24*60);
  return `${String(Math.floor(cutoff/60)).padStart(2,'0')}:${String(cutoff%60).padStart(2,'0')}`;
 };
 // Mark Absent exactly 30 minutes after each shift starts.
 absenceDeadlinePassed=function(emp,workDate,now=new Date()){
  const cutoff=absenceCutoffFor(emp,workDate);
  return now>=new Date(`${workDate}T${cutoff}:00+07:00`);
 };
 reconcileAutomaticAbsences=function(){
  const date=thaiDateKey(),now=new Date(),nowIso=now.toISOString(),created=[];
  for(const emp of employees){
   if(isHoliday(date)||attendanceIsAbsenceExcluded(emp.id,date)||!employeeEligibleOnDate(emp,date)||!absenceDeadlinePassed(emp,date,now))continue;
   let rec=attendanceFor(emp.id,date);if(rec?.checkIn||rec?.exception?.type==='leave'||rec?.exception?.type==='absent')continue;
   rec=rec||{employeeId:String(emp.id),date,section:emp.section,name:emp.name,createdAt:nowIso};
   rec.shift=employeeShiftKey(emp,date);const cutoff=absenceCutoffFor(emp,date);rec.exception={type:'absent',reason:`ไม่มีเช็คชื่อภายใน ${cutoff} น.`,auto:true,provisionalUntilCheckIn:true,finalizedAt:nowIso,deadline:new Date(`${date}T${cutoff}:00+07:00`).toISOString()};rec.autoAbsent=true;touchAttendance(rec);if(!attendance.includes(rec))attendance.push(rec);created.push(rec);
  }
  if(created.length){localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));created.forEach(rec=>syncAttendanceRecordCloud(rec).catch(()=>{rec.pendingCloudSync=true;localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance))}))}
  return created.length;
 };
 currentAbsentEmployees=function(){
  const date=thaiDateKey(),now=new Date();
  return employees.filter(emp=>{
   if(isHoliday(date)||attendanceIsTrialDate(date,emp.section)||attendanceIsAbsenceExcluded(emp.id,date)||!employeeEligibleOnDate(emp,date)||!absenceDeadlinePassed(emp,date,now))return false;
   const rec=attendanceFor(emp.id,date);
   return !(rec?.checkIn||rec?.exception?.type==='leave');
  });
 };
 const reconcileNow=()=>{
  const changed=reconcileAutomaticAbsences(thaiYear());
  if(changed&&current==='attendanceAdmin'&&isAdmin)setTimeout(()=>render(),0);
  return changed;
 };
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(reconcileNow,200)});
 window.addEventListener('online',()=>setTimeout(reconcileNow,200));
 setInterval(reconcileNow,60000);
 // Remove only the accidental historical backfill created today by V730. It
 // was too large for Firebase; legitimate older records remain untouched.
 const today=thaiDateKey(),before=attendance.length;
 attendance=attendance.filter(rec=>!(rec?.autoAbsent===true&&String(rec.date||'')<today&&String(rec.createdAt||'').slice(0,10)===today));
 if(attendance.length!==before){localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));localStorage.setItem(CLOUD_DIRTY_KEY,'0')}
 setTimeout(reconcileNow,1000);
})();
