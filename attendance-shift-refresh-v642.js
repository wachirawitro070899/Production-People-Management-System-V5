/* V642: refresh authoritative employee shift before every attendance check */
(()=>{
  if(typeof getAttendanceEmployeeReady!=='function')return;
  const originalGetAttendanceEmployeeReady=getAttendanceEmployeeReady;


  /* V646 fallback: if no authoritative roster rule reached this phone,
     resolve the active factory shift from the actual check-in window. */
  if(typeof employeeShiftKey==='function'){
    const originalEmployeeShiftKey=employeeShiftKey;
    employeeShiftKey=function(emp,date){
      const workDate=String(date||thaiDateKey());
      const resolved=originalEmployeeShiftKey.apply(this,arguments);
      const now=typeof currentThaiMinutes==='function'?currentThaiMinutes():(new Date().getHours()*60+new Date().getMinutes());
      const today=thaiDateKey();
      const previous=typeof dateOffsetKey==='function'?dateOffsetKey(-1):'';

      // The factory has separate day/night check-in windows. During the night
      // window, never allow a stale cached day rule to apply the 08:05 cutoff.
      if(workDate===today&&now>=19*60)return 'night';
      if(workDate===previous&&now<12*60)return 'night';
      return resolved;
    };
  }

  async function refreshAttendanceShiftMaster(){
    if(!window.firebase)return;
    try{
      if(!firebase.apps.length&&window.PPMS_FIREBASE_CONFIG)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
      const db=cloudDb||firebase.database();
      const snap=await db.ref('ppms/shiftSchedules').once('value');
      const latest=typeof firebaseDecodeData==='function'?firebaseDecodeData(snap.val()):snap.val();
      if(latest&&typeof latest==='object'){
        shiftSchedules=latest;
        localStorage.setItem(SHIFT_SCHEDULE_KEY,JSON.stringify(shiftSchedules));
      }
    }catch(error){
      console.warn('V642 shift schedule refresh failed',error);
    }
  }

  getAttendanceEmployeeReady=async function(){
    const emp=await originalGetAttendanceEmployeeReady.apply(this,arguments);
    if(!emp)return emp;

    await refreshAttendanceShiftMaster();

    let fresh=emp;
    try{
      if(typeof fetchAttendanceEmployeeDirect==='function'){
        fresh=await fetchAttendanceEmployeeDirect(emp.id)||emp;
      }
    }catch(error){
      console.warn('V642 employee shift refresh failed',error);
    }

    const workDate=typeof attendanceDateFor==='function'?attendanceDateFor(fresh,'in'):thaiDateKey();
    const resolved=typeof employeeShiftKey==='function'?employeeShiftKey(fresh,workDate):String(fresh.attendanceShift||'day');
    console.info('V642 attendance shift resolved',{
      employeeId:String(fresh.id),
      workDate,
      shift:resolved
    });
    return fresh;
  };
})();
