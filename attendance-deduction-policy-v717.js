/* V717: one canonical Attendance/KPI deduction policy for every screen/export. */
(()=>{
 const leaveTypeOf=rec=>{
  const raw=String(rec?.exception?.leaveType||rec?.leaveType||'').trim().toLowerCase();
  if(['sick','ลาป่วย'].includes(raw))return'sick';
  if(['personal','business','ลากิจ'].includes(raw))return'personal';
  return raw;
 };
 attendanceDeduction=function(rec){
  if(!rec||isHoliday(rec.date))return 0;
  const exception=rec.exception||{};
  if(!rec.checkIn&&exception.type==='absent')return 10;
  if(exception.type==='leave'){
   const type=leaveTypeOf(rec),retro=Math.max(0,Number(exception.retroDays||0));
   const advance=exception.advanceSameDay===true||exception.advanceFuture===true||Number(exception.advanceDays||0)>0;
   if(type==='personal'){
    if(exception.convertedFromSickRetroOver3===true)return 4;
    if(retro>3)return 10;
    return advance?1:4;
   }
   if(type==='sick'){
    if(retro>3)return 4;
    if(retro>0)return exception.medicalCertificate===true?2:10;
    if(exception.medicalCertificate===true)return 0;
    return daysSinceThaiDate(rec.date)>3?2:1;
   }
  }
  if(rec.checkIn&&(attendanceStatus(rec)==='Late'||exception.type==='late')){
   const minutes=Math.max(1,attendanceLateMinutes(rec));
   return minutes<=15?1:minutes<=30?2:3;
  }
  if(exception.type==='late')return 1;
  return 0;
 };
 attendanceDeductionLabel=function(rec){
  if(!rec)return'-';
  if(isHoliday(rec.date))return'วันหยุด 0';
  const exception=rec.exception||{},points=attendanceDeduction(rec);
  if(!rec.checkIn&&exception.type==='absent')return'ขาดงาน -10';
  if(exception.type==='leave'){
   const type=leaveTypeOf(rec),retro=Math.max(0,Number(exception.retroDays||0));
   const advance=exception.advanceSameDay===true||exception.advanceFuture===true||Number(exception.advanceDays||0)>0;
   if(type==='personal'){
    if(exception.convertedFromSickRetroOver3===true)return'ลาป่วยย้อนหลังเกิน 3 วัน → ลากิจย้อนหลัง -4';
    if(retro>3)return'ลากิจย้อนหลังเกิน 3 วัน → ขาดงาน -10';
    return advance?'ลากิจล่วงหน้า/แจ้งก่อนเวลาตัด -1':'ลากิจย้อนหลังหรือแจ้งหลังเวลาตัด -4';
   }
   if(type==='sick'){
    if(retro>3)return'ลาป่วยย้อนหลังเกิน 3 วัน → ลากิจย้อนหลัง -4';
    if(retro>0)return exception.medicalCertificate===true?'ลาป่วยย้อนหลังพร้อมใบรับรอง -2':'ลาป่วยย้อนหลังไม่มีใบรับรอง → ขาดงาน -10';
    if(exception.medicalCertificate===true)return'ลาป่วยพร้อมใบรับรอง 0';
    return daysSinceThaiDate(rec.date)>3?'ลาป่วยไม่มีใบรับรองเกิน 3 วัน -2':'ลาป่วยไม่มีใบรับรอง -1';
   }
  }
  if(rec.checkIn&&(attendanceStatus(rec)==='Late'||exception.type==='late'))return'มาสาย '+attendanceLateMinutes(rec)+' นาที -'+points;
  if(exception.type==='late')return'แจ้งเข้าสาย -1';
  return points?'-'+points:'0';
 };
})();
