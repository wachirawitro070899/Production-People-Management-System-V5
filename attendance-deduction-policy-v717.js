/* V726: canonical Attendance/KPI deduction policy for every screen/export. */
(()=>{
 const truthy=value=>value===true||value===1||String(value||'').trim().toLowerCase()==='true';
 const exceptionTypeOf=rec=>{
  const raw=String(rec?.exception?.type||rec?.status||'').trim().toLowerCase();
  if(['absent','absence','ขาด','ขาดงาน'].includes(raw))return'absent';
  if(['leave','ลา','sick','personal','business','ลาป่วย','ลากิจ'].includes(raw)||rec?.exception?.leaveType||rec?.leaveType)return'leave';
  if(['late','มาสาย','สาย'].includes(raw))return'late';
  return raw;
 };
 const leaveTypeOf=rec=>{
  const raw=String(rec?.exception?.leaveType||rec?.leaveType||'').trim().toLowerCase();
  if(['sick','ลาป่วย'].includes(raw))return'sick';
  if(['personal','business','ลากิจ'].includes(raw))return'personal';
  return raw;
 };
 attendanceDeduction=function(rec){
  if(!rec||isHoliday(rec.date))return 0;
  const exception=rec.exception||{},exceptionType=exceptionTypeOf(rec);
  if(!rec.checkIn&&exceptionType==='absent')return 10;
  if(exceptionType==='leave'){
   const type=leaveTypeOf(rec),retro=Math.max(0,Number(exception.retroDays||0));
   if(type==='personal'){
    if(truthy(exception.convertedFromSickRetroOver3))return 4;
    return retro>0?4:1;
   }
   if(type==='sick'){
    if(retro>3)return 4;
    if(retro>0)return 2;
    if(truthy(exception.medicalCertificate))return 0;
    return daysSinceThaiDate(rec.date)>3?2:1;
   }
  }
  if(rec.checkIn&&(attendanceStatus(rec)==='Late'||exceptionType==='late')){
   const minutes=Math.max(1,attendanceLateMinutes(rec));
   return minutes<=15?1:minutes<=30?2:3;
  }
  if(exceptionType==='late'){
   const minutes=Math.max(1,Number(exception.lateMinutes||rec.lateMinutes||attendanceLateMinutes(rec)||1));
   return minutes<=15?1:minutes<=30?2:3;
  }
  return 0;
 };
 attendanceDeductionLabel=function(rec){
  if(!rec)return'-';
  if(isHoliday(rec.date))return'วันหยุด 0';
  const exception=rec.exception||{},exceptionType=exceptionTypeOf(rec),points=attendanceDeduction(rec);
  if(!rec.checkIn&&exceptionType==='absent')return'ขาดงาน -10';
  if(exceptionType==='leave'){
   const type=leaveTypeOf(rec),retro=Math.max(0,Number(exception.retroDays||0));
   const advance=exception.advanceSameDay===true||exception.advanceFuture===true||Number(exception.advanceDays||0)>0;
   if(type==='personal'){
    if(truthy(exception.convertedFromSickRetroOver3))return'ลาป่วยย้อนหลังเกิน 3 วัน → ลากิจย้อนหลัง -4';
    return retro>0?'ลากิจย้อนหลัง -4':'ลากิจล่วงหน้า/วันเดียวกัน -1';
   }
   if(type==='sick'){
    if(retro>3)return'ลาป่วยย้อนหลังเกิน 3 วัน → ลากิจย้อนหลัง -4';
    if(retro>0)return'ลาป่วยย้อนหลัง -2';
    if(truthy(exception.medicalCertificate))return'ลาป่วยพร้อมใบรับรอง 0';
    return daysSinceThaiDate(rec.date)>3?'ลาป่วยไม่มีใบรับรองเกิน 3 วัน -2':'ลาป่วยไม่มีใบรับรอง -1';
   }
  }
  if(rec.checkIn&&(attendanceStatus(rec)==='Late'||exceptionType==='late'))return'มาสาย '+attendanceLateMinutes(rec)+' นาที -'+points;
  if(exceptionType==='late')return'มาสาย -'+points;
  return points?'-'+points:'0';
 };
})();
