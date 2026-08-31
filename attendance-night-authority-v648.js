/* V648: enforce today's authoritative night rule before check-in */
(()=>{
  function thaiNow(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const get=type=>parts.find(x=>x.type===type)?.value||'';
    return {date:get('year')+'-'+get('month')+'-'+get('day'),minutes:Number(get('hour'))*60+Number(get('minute'))};
  }
  function compact(value){return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
  function numeric(value){const x=compact(value).replace(/^[A-Z]+/,'');return x?String(Number(x)):''}
  function employeeList(raw){
    if(Array.isArray(raw))return raw.filter(Boolean);
    if(!raw||typeof raw!=='object')return[];
    return Object.entries(raw).map(([key,value])=>value&&typeof value==='object'?{...value,id:value.id||key}:null).filter(Boolean);
  }
  function findEmployee(list,id){
    const key=compact(id),num=numeric(id);
    return list.find(e=>compact(e.id)===key)||list.find(e=>num&&numeric(e.id)===num)||null;
  }
  function safeKey(value){return String(value).replace(/[.#$\[\]\/]/g,'_')}

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-attendance-stamp="in"]');
    if(!button)return;
    if(button.dataset.v648Bypass==='1'){
      delete button.dataset.v648Bypass;
      return;
    }

    const now=thaiNow();
    if(now.minutes<19*60)return;

    const input=document.querySelector('#attendanceEmployeeId');
    const entered=String(input?.value||'').trim();
    if(!entered)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled=true;
    const oldText=button.textContent;
    button.textContent='กำลังตรวจสอบกะดึกล่าสุด...';

    try{
      if(!window.firebase)throw Error('Firebase ยังไม่พร้อม');
      if(!firebase.apps.length){
        if(!window.PPMS_FIREBASE_CONFIG)throw Error('ไม่พบการตั้งค่า Firebase');
        firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
      }
      const db=firebase.database();
      const employeeSnap=await db.ref('ppms/employees').once('value');
      const employee=findEmployee(employeeList(employeeSnap.val()),entered);
      if(!employee)throw Error('ไม่พบรหัสพนักงานในข้อมูลกลาง');

      const id=String(employee.id);
      const section=String(employee.section||'');
      if(!section)throw Error('พนักงานยังไม่ได้กำหนด Section');

      const ruleKey='attendance-night-'+safeKey(id)+'-'+now.date;
      const rule={
        id:ruleKey,
        scope:'employee',
        employeeId:id,
        section,
        startDate:now.date,
        endDate:now.date,
        shift:'night',
        source:'V648 attendance night-window correction',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      await db.ref('ppms/shiftSchedules/'+safeKey(ruleKey)).set(rule);
      await new Promise(resolve=>setTimeout(resolve,1200));

      const currentButton=document.querySelector('[data-attendance-stamp="in"]');
      if(!currentButton)throw Error('หน้าจอถูกเปลี่ยน กรุณากดเช็กชื่ออีกครั้ง');
      currentButton.disabled=false;
      currentButton.dataset.v648Bypass='1';
      currentButton.click();
    }catch(error){
      console.error('V648 night shift preparation failed',error);
      alert('ตรวจสอบกะดึกไม่สำเร็จ: '+(error?.message||error)+' กรุณาลองใหม่');
      if(document.body.contains(button)){
        button.disabled=false;
        button.textContent=oldText;
      }
    }
  },true);
})();
