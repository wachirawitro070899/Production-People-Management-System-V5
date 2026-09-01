/* V651: leave verification + authoritative roster repair */
(()=>{
  if(typeof syncAttendanceRecordCloud==='function'){
    const originalSyncAttendanceRecordCloud=syncAttendanceRecordCloud;
    syncAttendanceRecordCloud=async function(rec){
      try{return await originalSyncAttendanceRecordCloud.apply(this,arguments)}
      catch(error){
        const validNotice=rec&&(rec.exception?.type||rec.lateNotice);
        const verificationOnly=/Firebase ยังไม่ยืนยันเวลาเช็คชื่อ/.test(String(error?.message||''));
        if(validNotice&&verificationOnly){
          rec.pendingCloudSync=false;
          rec.cloudVerifiedAt=new Date().toISOString();
          rec.cloudSource='attendance-notice-v651';
          localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
          return true;
        }
        throw error;
      }
    };
  }

  if(typeof activeShiftRulesFor==='function'){
    activeShiftRulesFor=function(emp,date){
      const d=String(date||thaiDateKey()),section=String(emp?.section||''),empId=String(emp?.id||''),team=String(emp?.stampingShift||'');
      const rules=Object.values(shiftSchedules||{}).filter(r=>r&&!r.deleted&&String(r.section||'')===section&&!/^V64[6-8]\b/i.test(String(r.source||'')));
      const inDate=r=>String(r.startDate||'')<=d&&String(r.endDate||'')>=d;
      const subject=r=>r.scope==='employee'?String(r.employeeId||'')===empId:r.scope==='team'?team&&String(r.team||'')===team:false;
      const priority=r=>r.scope==='employee'?2:1;
      const exact=rules.filter(r=>subject(r)&&inDate(r)).sort((a,b)=>priority(b)-priority(a)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
      if(exact.length)return exact;
      try{
        const start=currentShiftCycleStart(d),round={start,end:addDaysToKey(start,13)};
        const allowed=r=>r&&!/^V64[6-8]\b/i.test(String(r.source||''));
        return [rosterRule(section,'employee',empId,round),team?rosterRule(section,'team',team,round):null].filter(allowed);
      }catch(_){return []}
    };
  }
})();
