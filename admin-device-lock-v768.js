/* V768 - Admin account may be used on one owner device only. */
(()=>{
  'use strict';
  const DEVICE_KEY='ppms_v768_admin_device_id';
  const VERIFIED_KEY='ppms_device_lock_verified';
  const ACCOUNT_PATH='ppms/adminAccounts';

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=(crypto.randomUUID?.()||('ppms-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  async function hash(username,password){
    const raw=new TextEncoder().encode(`PPMS-V766|${username.trim().toLowerCase()}|${password}`);
    const buf=await crypto.subtle.digest('SHA-256',raw);
    return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  function db(){
    if(!window.firebase?.apps?.length)throw Error('ยังเชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจอินเทอร์เน็ต');
    return firebase.database();
  }

  function normalize(value){
    return (Array.isArray(value)?value:Object.values(value||{})).filter(x=>x&&x.username&&x.passwordHash);
  }

  async function accounts(){
    const snap=await db().ref(ACCOUNT_PATH).once('value');
    let list=normalize(snap.val());
    if(!list.length){
      list=[{username:'admin',passwordHash:await hash('admin','7533'),role:'admin',active:true,owner:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];
    }
    return list;
  }

  function showLogin(){
    const modal=document.getElementById('modal');
    const body=document.getElementById('modalBody');
    if(!modal||!body)return;
    body.innerHTML=`<h2>Admin Login</h2>
      <p class="modal-note">บัญชี Admin ใช้ได้เฉพาะเครื่องเจ้าของ 1 เครื่อง</p>
      <form id="adminDeviceLoginForm">
        <label>Username<input name="username" autocomplete="username" required autofocus></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
        <div id="adminDeviceLoginMessage" class="login-message"></div>
        <div class="actions"><button type="submit">Login / เข้าสู่ระบบ</button><button type="button" class="secondary" data-action="close">ยกเลิก</button></div>
      </form>`;
    modal.classList.remove('hidden');
    const form=document.getElementById('adminDeviceLoginForm');
    form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector('[type="submit"]');
      const message=document.getElementById('adminDeviceLoginMessage');
      const data=new FormData(form);
      const username=String(data.get('username')||'').trim().toLowerCase();
      const password=String(data.get('password')||'');
      button.disabled=true;button.textContent='กำลังตรวจสอบเครื่อง...';message.textContent='';
      try{
        const list=await accounts();
        const passwordHash=await hash(username,password);
        const account=list.find(x=>String(x.username).toLowerCase()===username&&x.active!==false&&x.passwordHash===passwordHash);
        if(!account)throw Error('Username หรือ Password ไม่ถูกต้อง');
        const currentDevice=deviceId();
        if(account.allowedDeviceId&&account.allowedDeviceId!==currentDevice)throw Error('บัญชี Admin ถูกล็อกไว้กับเครื่องเจ้าของแล้ว เครื่องนี้ไม่มีสิทธิ์เข้าใช้งาน');
        if(!account.allowedDeviceId){
          account.allowedDeviceId=currentDevice;
          account.deviceBoundAt=new Date().toISOString();
          account.updatedAt=new Date().toISOString();
          await db().ref(ACCOUNT_PATH).set(list);
        }
        localStorage.setItem('ppms_v3_admin_accounts',JSON.stringify(list));
        sessionStorage.setItem('ppms_admin','1');
        sessionStorage.setItem('ppms_admin_user',account.username);
        sessionStorage.setItem(VERIFIED_KEY,currentDevice);
        sessionStorage.removeItem('ppms_leader_id');
        location.reload();
      }catch(error){
        message.textContent=error.message||String(error);
        button.disabled=false;button.textContent='Login / เข้าสู่ระบบ';
      }
    };
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#loginBtn'))return;
    event.preventDefault();event.stopImmediatePropagation();showLogin();
  },true);

  async function verifyExistingSession(){
    if(sessionStorage.getItem('ppms_admin')!=='1')return;
    const currentDevice=deviceId();
    if(sessionStorage.getItem(VERIFIED_KEY)!==currentDevice){
      sessionStorage.removeItem('ppms_admin');
      sessionStorage.removeItem('ppms_admin_user');
      location.reload();
      return;
    }
    try{
      const username=String(sessionStorage.getItem('ppms_admin_user')||'admin').toLowerCase();
      const account=(await accounts()).find(x=>String(x.username).toLowerCase()===username);
      if(!account||account.active===false||account.allowedDeviceId!==currentDevice)throw Error('device mismatch');
    }catch(error){
      sessionStorage.removeItem('ppms_admin');
      sessionStorage.removeItem('ppms_admin_user');
      sessionStorage.removeItem(VERIFIED_KEY);
      location.reload();
    }
  }

  verifyExistingSession();
})();
