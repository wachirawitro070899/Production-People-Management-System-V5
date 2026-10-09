// Employee deletion uses small HTTP conditional writes, independently of the
// realtime socket and the large attendance/master transaction.
(()=>{'use strict';
const running=new Map();
async function request(path,options={}){
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
 if(!base)throw Error('ไม่พบการตั้งค่า Firebase');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(base+'/ppms/'+path+'.json',{...options,signal:controller.signal,cache:'no-store'});
  if(!response.ok&&response.status!==412)throw Error('Firebase ไม่ยืนยันการบันทึก ('+response.status+')');
  // Keep the deadline active until the body has also finished downloading.
  const value=await response.json();
  return {status:response.status,etag:response.headers.get('etag'),value};
 }catch(error){if(error.name==='AbortError')throw Error('เชื่อมต่อ Firebase หมดเวลา • เก็บรายการรอลบไว้แล้ว');throw error}
 finally{clearTimeout(timer)}
}
async function change(path,update){
 for(let attempt=0;attempt<5;attempt++){
  const read=await request(path,{headers:{'X-Firebase-ETag':'true'}});
  if(!read.etag)throw Error('Firebase ไม่ส่งข้อมูลยืนยันเวอร์ชัน');
  const next=update(read.value);
  if(JSON.stringify(next)===JSON.stringify(read.value))return read.value;
  const saved=await request(path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':read.etag},body:JSON.stringify(next)});
  if(saved.status!==412)return saved.value;
 }
 throw Error('มีการแก้รายชื่อพร้อมกัน • ระบบจะส่งรายการรอลบซ้ำ');
}
function records(value){return (Array.isArray(value)?value:Object.values(value||{})).filter(e=>e&&e.id!=null)}
async function remove(id){
 id=String(id);
 const initial=await request('employees');
 const leaving=records(initial.value).find(e=>String(e.id)===id);
 if(leaving){
  const encodedKey=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  const key=encodeURIComponent(encodedKey),ngKey=encodeURIComponent(id.replace(/[.#$\[\]\/]/g,'_'));
  await change('formerEmployees/'+key,old=>({...leaving,...(old||{}),resignedAt:old?.resignedAt||new Date().toISOString(),archiveReason:'resigned'}));
  if(Array.isArray(leaving.ngHistory)&&leaving.ngHistory.length)await change('ngHistoryArchive/'+ngKey,old=>({...leaving,...(old||{}),employmentStatus:'resigned',archived:true,archivedAt:old?.archivedAt||new Date().toISOString()}));
 }
 // Publish the tombstone first so other devices cannot merge a cached employee
 // back into the roster, even if the connection fails during the next step.
 await change('deletedEmployeeIds',value=>[...new Set([...(Array.isArray(value)?value:Object.values(value||{})).map(String),id])]);
 await change('employees',value=>{
  if(Array.isArray(value))return value.filter(e=>!e||String(e.id)!==id);
  const next={...(value||{})};for(const [key,e] of Object.entries(next))if(e&&String(e.id)===id)delete next[key];return next;
 });
 const [roster,deleted]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 if(records(roster.value).some(e=>String(e.id)===id)||!Object.values(deleted.value||{}).map(String).includes(id))throw Error('Firebase ยังไม่ยืนยันการลบ • เก็บรายการรอลบไว้แล้ว');
 return {employees:roster.value,deletedEmployeeIds:Object.values(deleted.value||{}).map(String)};
}
// Save the employee collection independently of the large ppms root socket.
async function upsert(data,originalId=''){
 const id=String(data.id),oldId=String(originalId||'');
 const deleted=await request('deletedEmployeeIds');
 if(oldId===id&&Object.values(deleted.value||{}).map(String).includes(id))throw Error('พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่');
 await change('employees',value=>{
  if(Array.isArray(value)||value==null){
   const next=records(value).filter(e=>String(e.id)!==id&&(!oldId||String(e.id)!==oldId));
   return [...next,data];
  }
  const next={...value};
  for(const [key,e] of Object.entries(next))if(e&&(String(e.id)===id||(oldId&&String(e.id)===oldId)))delete next[key];
  const key=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  next[key]=data;return next;
 });
 await change('deletedEmployeeIds',value=>{
  const ids=new Set(Object.values(value||{}).map(String));
  ids.delete(id);if(oldId&&oldId!==id)ids.add(oldId);return [...ids];
 });
 const [roster,tombstones]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 const saved=records(roster.value).find(e=>String(e.id)===id);
 if(!saved||saved.updatedAt!==data.updatedAt||Object.values(tombstones.value||{}).map(String).includes(id))throw Error('Firebase ยังไม่ยืนยันรายชื่อใหม่ • เก็บรายการรอส่งไว้แล้ว');
 return {employees:roster.value,deletedEmployeeIds:Object.values(tombstones.value||{}).map(String)};
}
window.PPMS_EMPLOYEE_SAVE_SERVICE={upsert};
// A small REST read still reaches other devices when the large root socket stalls.
let deletionPollRunning=false;
async function pollDeletions(){
 if(deletionPollRunning||navigator.onLine===false||!window.PPMS_RUNTIME?.applyEmployeeDeletionSnapshot)return;
 deletionPollRunning=true;
 try{const result=await request('deletedEmployeeIds');window.PPMS_RUNTIME.applyEmployeeDeletionSnapshot(Object.values(result.value||{}).map(String))}
 catch(_){/* Retry without replacing confirmed data with an offline cache. */}
 finally{deletionPollRunning=false}
}
let rosterPollRunning=false;
async function pollRoster(){
 if(rosterPollRunning||navigator.onLine===false||!window.PPMS_RUNTIME?.applyEmployeeRosterSnapshot)return;
 rosterPollRunning=true;
 const revision=window.PPMS_RUNTIME.employeeRosterRevision();
 try{const [roster,deleted]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);window.PPMS_RUNTIME.applyEmployeeRosterSnapshot({employees:roster.value,deletedEmployeeIds:Object.values(deleted.value||{}).map(String)},revision)}
 catch(_){/* Keep confirmed and pending local rows when offline. */}
 finally{rosterPollRunning=false}
}
setInterval(pollRoster,20000);
window.addEventListener('online',pollRoster);
window.addEventListener('focus',pollRoster);
window.addEventListener('DOMContentLoaded',pollRoster);
setInterval(pollDeletions,5000);
window.addEventListener('online',pollDeletions);
window.addEventListener('focus',pollDeletions);
window.addEventListener('DOMContentLoaded',pollDeletions);
window.PPMS_EMPLOYEE_DELETE_SERVICE={remove(id){id=String(id);if(running.has(id))return running.get(id);const job=remove(id).finally(()=>running.delete(id));running.set(id,job);return job}};
})();
