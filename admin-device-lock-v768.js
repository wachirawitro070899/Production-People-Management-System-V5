/* V768 - Admin account may be used on one owner device only. */
(()=>{
  'use strict';
  const DEVICE_KEY='ppms_v768_admin_device_id';
  const VERIFIED_KEY='ppms_device_lock_verified';
  const OWNER_KEY='ppms_v771_admin_device_owner';
  const ACCOUNT_PATH='ppms/adminAccounts';
  const LOCK_PATH='ppms/adminDeviceLocks';

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

  function baseUrl(){
    const url=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
    if(!url)throw Error('ไม่พบการตั้งค่าฐานข้อมูล');
    return url;
  }

  async function rest(path,options={},timeout=7000){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{return await fetch(`${baseUrl()}/${path}.json`,{...options,signal:controller.signal,cache:'no-store'})}
    catch(error){if(error?.name==='AbortError')throw Error('การตรวจสอบใช้เวลานานเกินไป กรุณากด Login อีกครั้ง');throw error}
    finally{clearTimeout(timer)}
  }

  function normalize(value){
    return (Array.isArray(value)?value:Object.values(value||{})).filter(x=>x&&x.username&&x.passwordHash);
  }

  async function accounts(){
    let list=[];
    try{const response=await rest(ACCOUNT_PATH);if(response.ok)list=normalize(await response.json())}catch(error){console.warn('Admin account REST read failed',error)}
    if(!list.length)list=normalize(JSON.parse(localStorage.getItem('ppms_v3_admin_accounts')||'[]'));
    if(!list.length){
      list=[{username:'admin',passwordHash:await hash('admin','7533'),role:'admin',active:true,owner:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];
    }
    return list;
  }

  function lockPath(username){
    return `${LOCK_PATH}/${username.replace(/[^a-z0-9_-]/gi,'_')}`;
  }

  async function claimOwnerDevice(account,currentDevice,ownerName){
    const path=lockPath(String(account.username).toLowerCase());
    const read=await rest(path,{headers:{'X-Firebase-ETag':'true'}});
    if(!read.ok)throw Error('ตรวจสอบสิทธิ์เครื่องไม่ได้ กรุณาลองอีกครั้ง');
    const existing=await read.json();
    const existingId=existing?.deviceId||account.allowedDeviceId||'';
    if(existingId&&existingId!==currentDevice)throw Error('บัญชี Admin ถูกล็อกไว้กับเครื่องเจ้าของแล้ว เครื่องนี้ไม่มีสิทธิ์เข้าใช้งาน');
    if(existingId===currentDevice){
      await rest(path,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ownerName,lastLoginAt:new Date().toISOString()})});
      return {...existing,deviceId:currentDevice,ownerName};
    }
    const saved=await rest(path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':read.headers.get('etag')||'*'},body:JSON.stringify({deviceId:currentDevice,ownerName,boundAt:new Date().toISOString(),lastLoginAt:new Date().toISOString()})});
    if(saved.status===412)return claimOwnerDevice(account,currentDevice,ownerName);
    if(!saved.ok)throw Error('บันทึกเครื่องเจ้าของไม่ได้ กรุณาลองอีกครั้ง');
    const savedData=await saved.json();
    const ownerId=savedData?.deviceId||'';
    if(ownerId!==currentDevice)throw Error('บัญชี Admin ถูกล็อกไว้กับเครื่องเจ้าของแล้ว เครื่องนี้ไม่มีสิทธิ์เข้าใช้งาน');
    return savedData;
  }

  function showLogin(){
    const modal=document.getElementById('modal');
    const body=document.getElementById('modalBody');
    if(!modal||!body)return;
    body.innerHTML=`<h2>Admin Login</h2>
      <p class="modal-note">บัญชี Admin ใช้ได้เฉพาะเครื่องเจ้าของ 1 เครื่อง</p>
      <form id="adminDeviceLoginForm">
        <label>Username<input name="username" autocomplete="username" required autofocus></label>
        <label>Password<div style="display:flex;gap:6px;align-items:center"><input id="adminDevicePassword" type="password" name="password" autocomplete="current-password" required style="flex:1"><button id="toggleAdminPassword" type="button" class="secondary" aria-label="แสดงรหัสผ่าน" title="แสดงรหัสผ่าน" style="min-width:48px;padding:10px">👁</button></div></label>
        <label>เจ้าของเครื่อง / Device Owner<input name="ownerName" value="${String(localStorage.getItem(OWNER_KEY)||'Wachirawit Rongjit').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}" required></label>
        <div id="adminDeviceLoginMessage" class="login-message"></div>
        <div class="actions"><button type="submit">Login / เข้าสู่ระบบ</button><button type="button" class="secondary" data-action="close">ยกเลิก</button></div>
      </form>`;
    modal.classList.remove('hidden');
    const passwordInput=document.getElementById('adminDevicePassword');
    const passwordToggle=document.getElementById('toggleAdminPassword');
    if(passwordInput&&passwordToggle)passwordToggle.onclick=()=>{
      const showing=passwordInput.type==='text';
      passwordInput.type=showing?'password':'text';
      passwordToggle.textContent=showing?'👁':'🙈';
      passwordToggle.setAttribute('aria-label',showing?'แสดงรหัสผ่าน':'ซ่อนรหัสผ่าน');
      passwordToggle.title=showing?'แสดงรหัสผ่าน':'ซ่อนรหัสผ่าน';
    };
    const form=document.getElementById('adminDeviceLoginForm');
    form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector('[type="submit"]');
      const message=document.getElementById('adminDeviceLoginMessage');
      const data=new FormData(form);
      const username=String(data.get('username')||'').trim().toLowerCase();
      const password=String(data.get('password')||'');
      const ownerName=String(data.get('ownerName')||'').trim();
      button.disabled=true;button.textContent='กำลังตรวจสอบเครื่อง...';message.textContent='';
      try{
        const list=await accounts();
        const passwordHash=await hash(username,password);
        const account=list.find(x=>String(x.username).toLowerCase()===username&&x.active!==false&&x.passwordHash===passwordHash);
        if(!account)throw Error('Username หรือ Password ไม่ถูกต้อง');
        if(!ownerName)throw Error('กรุณาระบุชื่อเจ้าของเครื่อง');
        const currentDevice=deviceId();
        await claimOwnerDevice(account,currentDevice,ownerName);
        localStorage.setItem(OWNER_KEY,ownerName);
        localStorage.setItem('ppms_v3_admin_accounts',JSON.stringify(list));
        sessionStorage.setItem('ppms_admin','1');
        sessionStorage.setItem('ppms_admin_user',account.username);
        sessionStorage.setItem(VERIFIED_KEY,currentDevice);
        sessionStorage.setItem('ppms_admin_device_owner',ownerName);
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
      if(!account||account.active===false)throw Error('account disabled');
      const response=await rest(lockPath(username));
      if(!response.ok)throw Error('device check failed');
      const lock=await response.json();
      const ownerId=lock?.deviceId||account.allowedDeviceId||'';
      if(ownerId!==currentDevice)throw Error('device mismatch');
      const ownerName=String(lock?.ownerName||localStorage.getItem(OWNER_KEY)||'').trim();
      if(ownerName){localStorage.setItem(OWNER_KEY,ownerName);sessionStorage.setItem('ppms_admin_device_owner',ownerName)}
    }catch(error){
      sessionStorage.removeItem('ppms_admin');
      sessionStorage.removeItem('ppms_admin_user');
      sessionStorage.removeItem(VERIFIED_KEY);
      location.reload();
    }
  }

  verifyExistingSession();

  function showDeviceOwner(){
    if(sessionStorage.getItem('ppms_admin')!=='1')return;
    const owner=String(sessionStorage.getItem('ppms_admin_device_owner')||localStorage.getItem(OWNER_KEY)||'').trim();
    const badge=document.getElementById('modeBadge');
    if(owner&&badge&&!badge.textContent.includes(owner))badge.textContent=`Admin • เครื่องของ ${owner}`;
  }
  showDeviceOwner();
  new MutationObserver(showDeviceOwner).observe(document.body,{childList:true,subtree:true});
})();
