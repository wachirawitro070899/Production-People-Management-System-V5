(function(){
  'use strict';
  const ROOT='ppmsAlerts';
  const PLANS_ROOT='ppmsAlertPlans';
  const SEEN_KEY='ppms_seen_alerts_v589';
  const enabled=()=>typeof firebase!=='undefined'&&window.PPMS_FIREBASE_CONFIG;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isAdmin=()=>sessionStorage.getItem('ppms_admin')==='1';
  const shiftAt=value=>{const h=new Date(value??Date.now()).getHours();return h>=7&&h<19?'day':'night'};
  const currentShift=()=>shiftAt(Date.now());
  const targetShift=data=>data?.shift==='current'?currentShift():(data?.shift||currentShift());
  const shiftLabel=s=>s==='day'?'กะกลางวัน':s==='night'?'กะกลางคืน':'ทุกกะ';
  const employeeCode=()=>String(localStorage.getItem('ppms_employee_code')||sessionStorage.getItem('attendanceEmp')||document.querySelector('#attendanceEmployeeId')?.value||'').trim();
  const dateKey=value=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value??Date.now())),o={};p.forEach(x=>o[x.type]=x.value);return `${o.year}-${o.month}-${o.day}`};
  const normalized=value=>String(value||'').trim().toUpperCase().replace(/[\s._\-/]+/g,'');
  function assignedShiftAt(code,value=Date.now()){
    try{
      const employees=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]'),schedules=JSON.parse(localStorage.getItem('ppms_v3_shift_schedules')||'{}'),emp=(Array.isArray(employees)?employees:[]).find(x=>normalized(x?.id)===normalized(code));
      if(!emp)return'';const d=dateKey(value),section=normalized(emp.section),id=normalized(emp.id),team=normalized(emp.team);
      const rules=Object.values(schedules||{}).filter(r=>r&&!r.deleted&&normalized(r.section)===section&&String(r.startDate||'')<=d&&String(r.endDate||'')>=d&&((r.scope==='employee'&&normalized(r.employeeId)===id)||(r.scope==='team'&&team&&normalized(r.team)===team))).sort((a,b)=>(b.scope==='employee'?2:1)-(a.scope==='employee'?2:1)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
      const shift=String(rules[0]?.shift||emp.attendanceShift||emp.attShift||'day').toLowerCase();return shift==='night'?'night':'day';
    }catch(_){return''}
  }
  const seen=()=>{try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'[]')}catch(_){return[]}};
  const markSeen=id=>localStorage.setItem(SEEN_KEY,JSON.stringify([...new Set([...seen(),id])].slice(-100)));
  const css=`
    #ppmsAlertAdmin,#ppmsAlertEnable{position:fixed;right:16px;z-index:10020;border:0;border-radius:999px;padding:11px 16px;font-weight:800;box-shadow:0 6px 22px #0004;cursor:pointer}
    #ppmsAlertAdmin{bottom:18px;background:#b91c1c;color:#fff}#ppmsAlertEnable{bottom:18px;background:#f59e0b;color:#111827}
    .ppms-alert-overlay{position:fixed;inset:0;z-index:10050;background:#7f1d1ddd;display:flex;align-items:center;justify-content:center;padding:18px;animation:ppmsPulse 1s infinite alternate}
    .ppms-alert-card{width:min(560px,100%);background:#fff;border:6px solid #ef4444;border-radius:22px;padding:26px;text-align:center;box-shadow:0 24px 70px #0008}
    .ppms-alert-icon{font-size:64px}.ppms-alert-card h2{margin:5px 0;color:#991b1b;font-size:clamp(25px,6vw,38px)}.ppms-alert-card p{font-size:20px;white-space:pre-wrap}.ppms-alert-card button{font-size:18px;padding:12px 24px}
    .ppms-alert-form label{display:block;margin:12px 0;text-align:left}.ppms-alert-form select,.ppms-alert-form textarea,.ppms-alert-form input{width:100%;box-sizing:border-box;padding:10px;font-size:16px}.ppms-alert-form textarea{min-height:90px}.ppms-plan-list{max-height:180px;overflow:auto;margin:14px 0;text-align:left}.ppms-plan-row{border:1px solid #ddd;border-radius:10px;padding:9px;margin:6px 0;font-size:14px}.ppms-plan-row button{float:right;font-size:13px;padding:4px 8px}
    @media print{#ppmsAlertAdmin,#ppmsAlertEnable,.ppms-alert-overlay{display:none!important}}
    @keyframes ppmsPulse{from{background:#7f1d1ddd}to{background:#dc2626e8}}
  `;
  function addStyle(){const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}
  function beep(){try{const C=window.AudioContext||window.webkitAudioContext,a=new C(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.16;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},650)}catch(_){}}
  function showAlert(data,id){
    if(!data||seen().includes(id))return;
    const activeShift=targetShift(data);
    if(activeShift!==currentShift())return;
    const code=employeeCode(),rosterShift=assignedShiftAt(code,Number(data.scheduledAt||data.createdAt||Date.now()));
    if(!isAdmin()&&(!code||!rosterShift||rosterShift!==activeShift))return;
    const created=Number(data.createdAt||0),expires=Number(data.expiresAt||created+8*3600000);
    if(!created||Date.now()>expires)return;
    markSeen(id);beep();
    const old=document.querySelector('.ppms-alert-overlay');if(old)old.remove();
    const el=document.createElement('div');el.className='ppms-alert-overlay';
    el.innerHTML=`<div class="ppms-alert-card"><div class="ppms-alert-icon">${data.type==='audit'?'📋':'👥'}</div><h2>${data.type==='audit'?'แจ้งเตือน: มี Audit':'แจ้งเตือน: มีผู้เยี่ยมชม'}</h2><p>${esc(data.message||'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน')}</p><small>${esc(shiftLabel(activeShift))} • อ้างอิงกะที่จัดในระบบ${code?' • '+esc(code):''} • ${new Date(created).toLocaleString('th-TH')}</small><div style="margin-top:18px"><button type="button">รับทราบ</button></div></div>`;
    el.querySelector('button').onclick=()=>el.remove();document.body.appendChild(el);
    if(document.hidden&&Notification.permission==='granted'){
      const n=new Notification(data.type==='audit'?'มี Audit เข้าพื้นที่':'มีผู้เยี่ยมชมเข้าพื้นที่',{body:data.message||'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน',tag:'ppms-'+id,requireInteraction:true});
      n.onclick=()=>{window.focus();n.close()};
    }
  }
  function openAdminForm(){
    const wrap=document.createElement('div');wrap.className='ppms-alert-overlay';wrap.style.animation='none';wrap.style.background='#0f172acc';
    wrap.innerHTML=`<div class="ppms-alert-card ppms-alert-form"><h2>แผนแจ้งเตือน Audit / ผู้เยี่ยมชม</h2><label>ประเภท<select id="paType"><option value="visitor">มีผู้เยี่ยมชม</option><option value="audit">มี Audit</option></select></label><label>ส่งไปยังกะ<select id="paShift"><option value="${currentShift()}">${shiftLabel(currentShift())} (กะปัจจุบัน)</option><option value="day">กะกลางวัน</option><option value="night">กะกลางคืน</option><option value="all">ทุกกะ</option></select></label><label>วันที่และเวลาที่ลูกค้า / Audit เข้าพื้นที่ <small>(ไม่กรอก = ส่งทันที)</small><input id="paWhen" type="datetime-local"></label><label>แจ้งเตือนล่วงหน้า<select id="paLead"><option value="60" selected>1 ชั่วโมง</option><option value="30">30 นาที</option><option value="15">15 นาที</option><option value="0">ตรงเวลา</option></select></label><label>ข้อความ<textarea id="paMessage">กรุณาจัดเตรียมพื้นที่ รักษาความสะอาด 5S และปฏิบัติตามมาตรฐานความปลอดภัย</textarea></label><div id="paPlanList" class="ppms-plan-list">กำลังโหลดแผน...</div><div><button id="paSend" type="button">บันทึกแผน / ส่งทันที</button> <button id="paCancel" class="secondary" type="button">ยกเลิก</button></div></div>`;
    const list=wrap.querySelector('#paPlanList');
    const db=firebase.database(),plansRef=db.ref(PLANS_ROOT);
    const renderPlans=snap=>{const rows=[];snap.forEach(x=>{const p=x.val()||{};if(Number(p.scheduledAt||0)+8*3600000<Date.now())return;rows.push({id:x.key,...p})});rows.sort((a,b)=>a.scheduledAt-b.scheduledAt);list.innerHTML=rows.length?rows.map(p=>`<div class="ppms-plan-row"><button type="button" data-plan-delete="${esc(p.id)}">ลบ</button><b>${p.type==='audit'?'📋 Audit':'👥 ผู้เยี่ยมชม'}</b> • ${esc(shiftLabel(p.shift))}<br>เข้าพื้นที่: ${new Date(p.eventAt||p.scheduledAt).toLocaleString('th-TH')}<br>แจ้งเตือน: ${new Date(p.scheduledAt).toLocaleString('th-TH')}<br>${esc(p.message)}</div>`).join(''):'ยังไม่มีแผนแจ้งเตือน';list.querySelectorAll('[data-plan-delete]').forEach(b=>b.onclick=async()=>{if(confirm('ลบแผนแจ้งเตือนนี้หรือไม่?'))await plansRef.child(b.dataset.planDelete).remove()})};
    plansRef.on('value',renderPlans);wrap.addEventListener('remove',()=>plansRef.off('value',renderPlans));
    wrap.querySelector('#paCancel').onclick=()=>wrap.remove();
    const shiftSelect=wrap.querySelector('#paShift');
    const refreshTargetShift=()=>{const whenValue=wrap.querySelector('#paWhen').value,lead=Number(wrap.querySelector('#paLead').value||0),targetAt=whenValue?new Date(whenValue).getTime()-lead*60000:Date.now(),shift=shiftAt(targetAt);shiftSelect.innerHTML=`<option value="${shift}">${shiftLabel(shift)} (กะที่กำลังทำงานตอนแจ้ง)</option>`;shiftSelect.value=shift};
    refreshTargetShift();wrap.querySelector('#paWhen').addEventListener('change',refreshTargetShift);wrap.querySelector('#paLead').addEventListener('change',refreshTargetShift);
    wrap.querySelector('#paSend').addEventListener('click',refreshTargetShift,true);
    wrap.querySelector('#paSend').onclick=async()=>{const b=wrap.querySelector('#paSend');b.disabled=true;try{if(!enabled())throw Error('Firebase ไม่พร้อม');const now=Date.now(),whenValue=wrap.querySelector('#paWhen').value,eventAt=whenValue?new Date(whenValue).getTime():now,leadMinutes=Number(wrap.querySelector('#paLead').value||0),scheduledAt=whenValue?eventAt-leadMinutes*60000:now;if(!Number.isFinite(eventAt)||!Number.isFinite(scheduledAt))throw Error('วันที่หรือเวลาไม่ถูกต้อง');if(whenValue&&scheduledAt<=now+30000)throw Error('เวลาส่งแจ้งเตือนผ่านมาแล้ว กรุณากำหนดเวลาเข้าพื้นที่ให้มากกว่าระยะเวลาแจ้งล่วงหน้า');const payload={type:wrap.querySelector('#paType').value,shift:wrap.querySelector('#paShift').value,message:wrap.querySelector('#paMessage').value.trim(),eventAt,leadMinutes,scheduledAt,createdAt:now,expiresAt:eventAt+8*3600000,createdBy:'admin'};if(scheduledAt>now+30000){await plansRef.push(payload);alert('บันทึกแผนเรียบร้อย • เข้าพื้นที่ '+new Date(eventAt).toLocaleString('th-TH')+' • แจ้งเตือน '+new Date(scheduledAt).toLocaleString('th-TH'))}else{payload.createdAt=now;payload.expiresAt=now+8*3600000;await db.ref(ROOT).push(payload);alert('ส่งแจ้งเตือนไปยัง '+shiftLabel(payload.shift)+' เรียบร้อยแล้ว')}wrap.remove()}catch(e){b.disabled=false;alert('บันทึกไม่สำเร็จ: '+e.message)}};
    document.body.appendChild(wrap);
  }
  async function requestPermission(){if(!('Notification'in window))return alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');if(!employeeCode())return alert('กรุณากรอกรหัสพนักงานในหน้าเช็คชื่อก่อน เพื่อให้ระบบดึงกะที่จัดไว้ของพนักงานคนนี้');try{if(window.PPMSPush?.enable)await window.PPMSPush.enable();else{const p=await Notification.requestPermission();if(p!=='granted')throw Error('ยังไม่ได้อนุญาต Notification')}alert('เปิดแจ้งเตือนเรียบร้อย • ระบบจะส่งตามกะที่จัดไว้ในหน้าเว็บของพนักงานคนนี้');refreshButtons()}catch(e){alert('เปิดแจ้งเตือนไม่สำเร็จ: '+e.message)}}
  function refreshButtons(){
    document.querySelectorAll('#ppmsAlertAdmin,#ppmsAlertEnable').forEach(x=>x.remove());
    const b=document.createElement('button');
    if(isAdmin()){b.id='ppmsAlertAdmin';b.textContent='🚨 แจ้ง Audit / ผู้เยี่ยมชม';b.onclick=openAdminForm}
    else if(!('Notification'in window)||Notification.permission!=='granted'){b.id='ppmsAlertEnable';b.textContent='🔔 เปิดแจ้งเตือน Audit';b.onclick=requestPermission}
    else return;
    document.body.appendChild(b);
  }
  function connect(){
    if(!enabled())return setTimeout(connect,1500);
    try{if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);const db=firebase.database();db.ref(ROOT).limitToLast(20).on('child_added',s=>showAlert(s.val(),s.key));let plans={};db.ref(PLANS_ROOT).on('value',snap=>{plans={};snap.forEach(x=>plans[x.key]=x.val())});setInterval(()=>Object.entries(plans).forEach(([id,p])=>{const at=Number(p?.scheduledAt||0);if(at&&Date.now()>=at&&Date.now()<=Number(p.expiresAt||at+8*3600000))showAlert({...p,createdAt:at},'plan-'+id)}),15000);}catch(e){console.warn('PPMS alert connection failed',e);setTimeout(connect,3000)}
  }
  document.addEventListener('DOMContentLoaded',()=>{addStyle();refreshButtons();connect();setInterval(refreshButtons,2000)});
})();
