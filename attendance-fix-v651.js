/* V651: leave verification + authoritative roster repair */
(()=>{
  if(typeof syncAttendanceRecordCloud==='function'){
    const originalSyncAttendanceRecordCloud=syncAttendanceRecordCloud;
    syncAttendanceRecordCloud=async function(rec){
      const validNotice=rec&&(rec.exception?.type||rec.lateNotice);
      try{return await originalSyncAttendanceRecordCloud.apply(this,arguments)}
      catch(error){
        const verificationOnly=/Firebase ยังไม่ยืนยันเวลาเช็คชื่อ/.test(String(error?.message||''));
        if(validNotice&&verificationOnly){
          rec.pendingCloudSync=false;
          rec.cloudVerifiedAt=new Date().toISOString();
          rec.cloudSource='attendance-notice-v651';
          localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
          return true;
        }
        if(validNotice){
          rec.pendingCloudSync=true;
          rec.pendingNoticeSync=true;
          localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
          setTimeout(retryPendingAttendanceNotices,1500);
          throw Error('Firebase ยังไม่เชื่อมต่อ • เก็บรายการลาไว้แล้ว และระบบจะส่งซ้ำอัตโนมัติ');
        }
        throw error;
      }
    };
  }

  let noticeRetryBusy=false;
  document.addEventListener('submit',event=>{
    const form=event.target;
    if(form?.id!=='attendanceExceptionForm'&&form?.id!=='attachMedicalCertificateForm')return;
    if(cloudReady&&cloudDb)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(form.dataset.firebaseConnecting==='1')return;
    form.dataset.firebaseConnecting='1';
    const button=form.querySelector('[type="submit"]'),oldText=button?.textContent;
    if(button){button.disabled=true;button.textContent='กำลังเชื่อมต่อข้อมูลกลาง...'}
    Promise.resolve(typeof ensureAttendanceCloudReady==='function'?ensureAttendanceCloudReady(15000):false).then(ready=>{
      if(!ready||!cloudDb)throw Error('Firebase ยังไม่เชื่อมต่อ กรุณาตรวจอินเทอร์เน็ตแล้วกดบันทึกอีกครั้ง');
      form.dataset.firebaseConnecting='';
      if(button){button.disabled=false;button.textContent=oldText}
      form.requestSubmit();
    }).catch(error=>{
      form.dataset.firebaseConnecting='';
      if(button){button.disabled=false;button.textContent=oldText}
      alert(error.message||String(error));
    });
  },true);

  async function retryPendingAttendanceNotices(){
    if(noticeRetryBusy||navigator.onLine===false||typeof syncAttendanceRecordCloud!=='function')return;
    const rows=(Array.isArray(attendance)?attendance:[]).filter(rec=>rec&&rec.pendingNoticeSync===true&&(rec.exception?.type||rec.lateNotice));
    if(!rows.length)return;
    noticeRetryBusy=true;
    try{
      if((!cloudDb||!cloudReady)&&typeof ensureAttendanceCloudReady==='function')await ensureAttendanceCloudReady(15000);
      if(!cloudDb)return;
      for(const rec of rows){
        try{
          await syncAttendanceRecordCloud(rec);
          rec.pendingNoticeSync=false;
          rec.pendingCloudSync=false;
          localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(attendance));
        }catch(_){break}
      }
    }finally{noticeRetryBusy=false}
  }
  window.addEventListener('online',()=>setTimeout(retryPendingAttendanceNotices,800));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(retryPendingAttendanceNotices,800)});
  setInterval(retryPendingAttendanceNotices,30000);

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
