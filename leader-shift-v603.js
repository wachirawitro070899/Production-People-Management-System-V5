// V603: Leader login must wait for Firebase employee master before validating an ID.
(()=>{'use strict';
function isLeader(position){const text=String(position||'').trim();return /\bleader\b/i.test(text)||text.includes('หัวหน้าทีม')}
function employeeList(value){
 const decoded=typeof firebaseDecodeData==='function'?firebaseDecodeData(value):value;
 const source=decoded&&typeof decoded==='object'&&Object.prototype.hasOwnProperty.call(decoded,'employees')?decoded.employees:decoded;
 if(Array.isArray(source))return source.filter(Boolean);
 if(source&&typeof source==='object')return Object.entries(source).map(([key,item])=>item&&typeof item==='object'?{...item,id:String(item.id||'').trim()||key}:null).filter(Boolean);
 return[];
}
function employeeKey(value){return String(value||'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().toUpperCase().replace(/[\s._\-/]+/g,'')}
function numericTail(value){const match=employeeKey(value).match(/(\d+)$/);return match?String(Number(match[1])):''}
function findEmployee(list,value){
 const key=employeeKey(value);let found=list.find(item=>employeeKey(item?.id)===key);if(found)return found;
 const tail=numericTail(value);if(!tail)return null;
 const matches=list.filter(item=>numericTail(item?.id)===tail);
 return matches.length===1?matches[0]:null;
}
async function loadLeaderEmployee(id){
 if(!window.firebase)throw Error('โหลด Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต');
 if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG||{});
 const db=firebase.database();
 let snap=await db.ref('ppms/employees').once('value'),list=employeeList(snap.val()),emp=findEmployee(list,id);
 if(!emp){snap=await db.ref('ppms').once('value');list=employeeList(snap.val());emp=findEmployee(list,id)}
 if(!emp)return null;
 try{
  const deletedSnap=await db.ref('ppms/deletedEmployeeIds').once('value');
  const decoded=typeof firebaseDecodeData==='function'?firebaseDecodeData(deletedSnap.val()):deletedSnap.val();
  const rows=Array.isArray(decoded)?decoded:Object.values(decoded||{}),cleaned=rows.filter(value=>employeeKey(value)!==employeeKey(emp.id));
  if(cleaned.length!==rows.length)await db.ref('ppms/deletedEmployeeIds').set(typeof firebaseEncodeData==='function'?firebaseEncodeData(cleaned):cleaned);
 }catch(error){console.warn('Leader deletion marker cleanup failed',error)}
 return emp;
}
async function leaderLogin(){
 const id=String(prompt('กรอกรหัสพนักงาน Leader เพื่อจัดกะ')||'').trim();if(!id)return;
 const button=document.getElementById('leaderLoginBtn');
 if(button){button.disabled=true;button.textContent='กำลังตรวจสอบ...'}
 try{
  const emp=await loadLeaderEmployee(id);
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

if(typeof publishShiftSchedulesAuthoritative==='function'){
 const originalPublishShiftSchedules=publishShiftSchedulesAuthoritative;
 publishShiftSchedulesAuthoritative=async function(source,reason){
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
   try{
    if(typeof ensureCloudReady==='function'&&!(await ensureCloudReady(15000)))throw Error('Firebase ยังไม่พร้อม');
    await originalPublishShiftSchedules.call(this,source,reason);
    const db=cloudDb||firebase.database(),snap=await db.ref('ppms/shiftSchedules').once('value');
    const remote=typeof firebaseDecodeData==='function'?firebaseDecodeData(snap.val()):snap.val(),expected=source&&typeof source==='object'?source:{};
    const missing=Object.entries(expected).find(([id,rule])=>{
      const saved=remote?.[id];
      return !saved||String(saved.updatedAt||'')!==String(rule.updatedAt||'')||String(saved.shift||'')!==String(rule.shift||'')||Boolean(saved.deleted)!==Boolean(rule.deleted);
    });
    if(missing)throw Error('Firebase อ่านกลับแล้วข้อมูลกะยังไม่ครบ');
    return true;
   }catch(error){
    lastError=error;
    if(attempt<3)await new Promise(resolve=>setTimeout(resolve,800*attempt));
   }
  }
  localStorage.setItem('ppms_v3_shift_cloud_dirty','1');
  throw lastError||Error('ยืนยันข้อมูลกะจาก Firebase ไม่สำเร็จ');
 };
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('#leaderLoginBtn');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();leaderLogin();
},true);
})();
