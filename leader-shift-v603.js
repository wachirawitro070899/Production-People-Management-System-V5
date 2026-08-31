// V603: Leader login must wait for Firebase employee master before validating an ID.
(()=>{'use strict';
function isLeader(position){const text=String(position||'').trim();return /\bleader\b/i.test(text)||text.includes('หัวหน้าทีม')}
function employeeList(value){if(Array.isArray(value))return value.filter(Boolean);if(value&&typeof value==='object')return Object.values(value).filter(Boolean);return[]}
async function leaderLogin(){
 const id=String(prompt('กรอกรหัสพนักงาน Leader เพื่อจัดกะ')||'').trim();if(!id)return;
 const button=document.getElementById('leaderLoginBtn');
 if(button){button.disabled=true;button.textContent='กำลังตรวจสอบ...'}
 try{
  if(!window.firebase)throw Error('โหลด Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต');
  const config=window.PPMS_FIREBASE_CONFIG||{};
  if(!firebase.apps.length)firebase.initializeApp(config);
  const snap=await firebase.database().ref('ppms/employees').once('value');
  const emp=employeeList(snap.val()).find(x=>String(x?.id||'').trim()===id);
  if(!emp)throw Error('ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบรหัสแล้วลองอีกครั้ง');
  if(!isLeader(emp.position))throw Error('รหัสนี้ไม่มีสิทธิ์ Leader สำหรับจัดกะ');
  if(!String(emp.section||'').trim())throw Error('Leader คนนี้ยังไม่ได้กำหนด Section กรุณาให้ Admin แก้ไขข้อมูลพนักงานก่อน');
  sessionStorage.removeItem('ppms_admin');
  sessionStorage.setItem('ppms_leader_id',String(emp.id));
  sessionStorage.setItem('shiftRosterSection',String(emp.section));
  location.reload();
 }catch(err){
  alert(err?.message||'เข้าสู่ระบบ Leader ไม่สำเร็จ');
  if(button){button.disabled=false;button.textContent='Leader Login / จัดกะ'}
 }
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('#leaderLoginBtn');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();leaderLogin();
},true);
})();