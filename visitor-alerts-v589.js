(function(){
  'use strict';
  const ROOT='ppmsAlerts';
  const SEEN_KEY='ppms_seen_alerts_v589';
  const enabled=()=>typeof firebase!=='undefined'&&window.PPMS_FIREBASE_CONFIG;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isAdmin=()=>sessionStorage.getItem('ppms_admin')==='1';
  const currentShift=()=>{const h=new Date().getHours();return h>=7&&h<19?'day':'night'};
  const shiftLabel=s=>s==='day'?'กะกลางวัน':s==='night'?'กะกลางคืน':'ทุกกะ';
  const seen=()=>{try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'[]')}catch(_){return[]}};
  const markSeen=id=>localStorage.setItem(SEEN_KEY,JSON.stringify([...new Set([...seen(),id])].slice(-100)));
  const css=`
    #ppmsAlertAdmin,#ppmsAlertEnable{position:fixed;right:16px;z-index:10020;border:0;border-radius:999px;padding:11px 16px;font-weight:800;box-shadow:0 6px 22px #0004;cursor:pointer}
    #ppmsAlertAdmin{bottom:18px;background:#b91c1c;color:#fff}#ppmsAlertEnable{bottom:18px;background:#f59e0b;color:#111827}
    .ppms-alert-overlay{position:fixed;inset:0;z-index:10050;background:#7f1d1ddd;display:flex;align-items:center;justify-content:center;padding:18px;animation:ppmsPulse 1s infinite alternate}
    .ppms-alert-card{width:min(560px,100%);background:#fff;border:6px solid #ef4444;border-radius:22px;padding:26px;text-align:center;box-shadow:0 24px 70px #0008}
    .ppms-alert-icon{font-size:64px}.ppms-alert-card h2{margin:5px 0;color:#991b1b;font-size:clamp(25px,6vw,38px)}.ppms-alert-card p{font-size:20px;white-space:pre-wrap}.ppms-alert-card button{font-size:18px;padding:12px 24px}
    .ppms-alert-form label{display:block;margin:12px 0;text-align:left}.ppms-alert-form select,.ppms-alert-form textarea{width:100%;box-sizing:border-box;padding:10px;font-size:16px}.ppms-alert-form textarea{min-height:100px}
    @keyframes ppmsPulse{from{background:#7f1d1ddd}to{background:#dc2626e8}}
  `;
  function addStyle(){const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}
  function beep(){try{const C=window.AudioContext||window.webkitAudioContext,a=new C(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.16;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},650)}catch(_){}}
  function showAlert(data,id){
    if(!data||seen().includes(id))return;
    if(data.shift!=='all'&&data.shift!==currentShift())return;
    const created=Number(data.createdAt||0),expires=Number(data.expiresAt||created+8*3600000);
    if(!created||Date.now()>expires)return;
    markSeen(id);beep();
    const old=document.querySelector('.ppms-alert-overlay');if(old)old.remove();
    const el=document.createElement('div');el.className='ppms-alert-overlay';
    el.innerHTML=`<div class="ppms-alert-card"><div class="ppms-alert-icon">${data.type==='audit'?'📋':'👥'}</div><h2>${data.type==='audit'?'แจ้งเตือน: มี Audit':'แจ้งเตือน: มีผู้เยี่ยมชม'}</h2><p>${esc(data.message||'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน')}</p><small>${esc(shiftLabel(data.shift))} • ${new Date(created).toLocaleString('th-TH')}</small><div style="margin-top:18px"><button type="button">รับทราบ</button></div></div>`;
    el.querySelector('button').onclick=()=>el.remove();document.body.appendChild(el);
    if(document.hidden&&Notification.permission==='granted'){
      const n=new Notification(data.type==='audit'?'มี Audit เข้าพื้นที่':'มีผู้เยี่ยมชมเข้าพื้นที่',{body:data.message||'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน',tag:'ppms-'+id,requireInteraction:true});
      n.onclick=()=>{window.focus();n.close()};
    }
  }
  function openAdminForm(){
    const wrap=document.createElement('div');wrap.className='ppms-alert-overlay';wrap.style.animation='none';wrap.style.background='#0f172acc';
    wrap.innerHTML=`<div class="ppms-alert-card ppms-alert-form"><h2>ส่งประกาศด่วน</h2><label>ประเภท<select id="paType"><option value="visitor">มีผู้เยี่ยมชม</option><option value="audit">มี Audit</option></select></label><label>ส่งไปยังกะ<select id="paShift"><option value="${currentShift()}">${shiftLabel(currentShift())} (กะปัจจุบัน)</option><option value="day">กะกลางวัน</option><option value="night">กะกลางคืน</option><option value="all">ทุกกะ</option></select></label><label>ข้อความ<textarea id="paMessage">กรุณาจัดเตรียมพื้นที่ รักษาความสะอาด 5S และปฏิบัติตามมาตรฐานความปลอดภัย</textarea></label><div><button id="paSend" type="button">ส่งแจ้งเตือนทันที</button> <button id="paCancel" class="secondary" type="button">ยกเลิก</button></div></div>`;
    wrap.querySelector('#paCancel').onclick=()=>wrap.remove();
    wrap.querySelector('#paSend').onclick=async()=>{const b=wrap.querySelector('#paSend');b.disabled=true;try{if(!enabled())throw Error('Firebase ไม่พร้อม');if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);const now=Date.now(),payload={type:wrap.querySelector('#paType').value,shift:wrap.querySelector('#paShift').value,message:wrap.querySelector('#paMessage').value.trim(),createdAt:now,expiresAt:now+8*3600000,createdBy:'admin'};await firebase.database().ref(ROOT).push(payload);wrap.remove();alert('ส่งแจ้งเตือนไปยัง '+shiftLabel(payload.shift)+' เรียบร้อยแล้ว')}catch(e){b.disabled=false;alert('ส่งไม่สำเร็จ: '+e.message)}};
    document.body.appendChild(wrap);
  }
  async function requestPermission(){if(!('Notification'in window))return alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');const p=await Notification.requestPermission();alert(p==='granted'?'เปิดการแจ้งเตือนเรียบร้อยแล้ว':'ยังไม่ได้อนุญาตการแจ้งเตือน กรุณาเปิดสิทธิ์ Notification ในการตั้งค่าเบราว์เซอร์');refreshButtons()}
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
    try{if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);firebase.database().ref(ROOT).limitToLast(20).on('child_added',s=>showAlert(s.val(),s.key));}catch(e){console.warn('PPMS alert connection failed',e);setTimeout(connect,3000)}
  }
  document.addEventListener('DOMContentLoaded',()=>{addStyle();refreshButtons();connect();setInterval(refreshButtons,2000)});
})();
