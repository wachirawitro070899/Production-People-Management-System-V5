/* V687: keep check-in working when the separated device path is denied. */
(()=>{
  const denied=error=>/PERMISSION_DENIED|Permission denied/i.test(String(error?.code||'')+' '+String(error?.message||error||''));
  if(typeof assertAndBindAttendanceDeviceCloud!=='function')return;
  const primaryBind=assertAndBindAttendanceDeviceCloud;
  assertAndBindAttendanceDeviceCloud=async function(emp){
    try{return await primaryBind.apply(this,arguments)}
    catch(error){
      if(!denied(error))throw error;
      if(!cloudDb){
        const ready=typeof ensureAttendanceCloudReady==='function'&&await ensureAttendanceCloudReady(12000);
        if(!ready||!cloudDb)throw error;
      }
      const empId=String(emp?.id||'').trim(),token=deviceToken();
      if(!empId||!token)throw error;
      const root=cloudDb.ref('ppms/attendanceDevices');
      let devices={};
      try{devices=firebaseDecodeData((await root.once('value')).val())||{}}catch(_){throw error}
      const other=Object.entries(devices).find(([id,value])=>String(id)!==empId&&value&&String(value.token||'')===token);
      if(other)throw Error(`เครื่องนี้ผูกกับรหัสพนักงาน ${other[0]} แล้ว • หากเป็นข้อมูลเก่าให้ Admin กด Reset Device`);
      const own=devices[empId]||null,now=new Date().toISOString();
      const next={...(own||{}),token,label:deviceLabel(),registeredAt:own?.registeredAt||now,lastSeenAt:now,lockVersion:'V687-legacy-fallback'};
      const ref=root.child(firebaseEncodeKey(empId));
      await ref.set(firebaseEncodeData(next));
      const verify=firebaseDecodeData((await ref.once('value')).val());
      if(!verify||String(verify.token||'')!==token)throw Error('Firebase ยังไม่ยืนยันการลงทะเบียนเครื่อง • กรุณากดเช็คชื่อใหม่');
      attendanceDevices[empId]=verify;
      try{localStorage.setItem(ATTENDANCE_DEVICES_KEY,JSON.stringify(attendanceDevices))}catch(_){}
      return true;
    }
  };
})();
