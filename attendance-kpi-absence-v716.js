/* V734: reconcile recent missing workdays and apply provisional Absent -10.
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
 const queueAbsenceSync=records=>{
  window.__ppmsAbsenceSyncQueue=[...(window.__ppmsAbsenceSyncQueue||[]),...records];
  if(window.__ppmsAbsenceSyncRunning)return;window.__ppmsAbsenceSyncRunning=true;
  const next=()=>{const rec=window.__ppmsAbsenceSyncQueue.shift();if(!rec){window.__ppmsAbsenceSyncRunning=false;return}syncAttendanceRecordCloud(rec).catch(()=>{rec.pendingCloudSync=true;localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance))}).finally(()=>setTimeout(next,100))};next();
 };
 reconcileAutomaticAbsences=function(){
  const today=thaiDateKey(),start=dateKeyOffsetFrom(today,-7),now=new Date(),nowIso=now.toISOString(),created=[];
  for(const date of thaiDateRange(start,today))for(const emp of employees){
   if(isHoliday(date)||attendanceIsTrialDate(date,emp.section)||attendanceIsAbsenceExcluded(emp.id,date)||!employeeEligibleOnDate(emp,date)||!absenceDeadlinePassed(emp,date,now))continue;
   let rec=attendanceFor(emp.id,date);if(rec?.checkIn||rec?.exception?.type==='leave'||rec?.exception?.type==='absent')continue;
   rec=rec||{employeeId:String(emp.id),date,section:emp.section,name:emp.name,createdAt:nowIso};
   rec.shift=employeeShiftKey(emp,date);const cutoff=absenceCutoffFor(emp,date);rec.exception={type:'absent',reason:`ไม่มีเช็คชื่อภายใน ${cutoff} น.`,auto:true,provisionalUntilCheckIn:true,finalizedAt:nowIso,deadline:new Date(`${date}T${cutoff}:00+07:00`).toISOString()};rec.autoAbsent=true;touchAttendance(rec);if(!attendance.includes(rec))attendance.push(rec);created.push(rec);
  }
  if(created.length){localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));queueAbsenceSync(created)}
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
 setTimeout(reconcileNow,1000);
})();
