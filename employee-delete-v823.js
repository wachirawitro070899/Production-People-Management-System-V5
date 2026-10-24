// Employee deletion uses small HTTP conditional writes, independently of the
// realtime socket and the large attendance/master transaction.
(()=>{'use strict';
const running=new Map();
async function request(path,options={},prefix='ppms/'){
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
 if(!base)throw Error('ไม่พบการตั้งค่า Firebase');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(base+'/'+prefix+path+'.json',{...options,signal:controller.signal,cache:'no-store'});
  if(!response.ok&&response.status!==412)throw Error('Firebase ไม่ยืนยันการบันทึก ('+response.status+')');
  // Keep the deadline active until the body has also finished downloading.
  const value=await response.json();
  return {status:response.status,etag:response.headers.get('etag'),value};
 }catch(error){if(error.name==='AbortError')throw Error('เชื่อมต่อ Firebase หมดเวลา • เก็บรายการรอลบไว้แล้ว');throw error}
 finally{clearTimeout(timer)}
}
async function change(path,update,prefix='ppms/'){
 for(let attempt=0;attempt<5;attempt++){
  const read=await request(path,{headers:{'X-Firebase-ETag':'true'}},prefix);
  if(!read.etag)throw Error('Firebase ไม่ส่งข้อมูลยืนยันเวอร์ชัน');
  const next=update(read.value);
  if(JSON.stringify(next)===JSON.stringify(read.value))return read.value;
  const saved=await request(path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':read.etag},body:JSON.stringify(next)},prefix);
  if(saved.status!==412)return saved.value;
 }
 throw Error('มีการแก้รายชื่อพร้อมกัน • ระบบจะส่งรายการรอลบซ้ำ');
}
function records(value){return (Array.isArray(value)?value:Object.values(value||{})).filter(e=>e&&e.id!=null)}
async function remove(id,snapshot=null){
 id=String(id);
 const initial=await request('employees');
 const remoteLeaving=records(initial.value).find(e=>String(e.id)===id),leaving=remoteLeaving||snapshot;
 if(leaving){
  const encodedKey=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  const key=encodeURIComponent(encodedKey),ngKey=encodeURIComponent(id.replace(/[.#$\[\]\/]/g,'_'));
  const requested=snapshot||{},now=new Date().toISOString(),previous=(await request('formerEmployees/'+key)).value;
  if(previous?.id&&!previous.resignationEventId)await change('formerEmployeeHistory/'+encodeURIComponent('legacy_'+encodedKey),old=>old||previous);
  const eventId=requested.resignationEventId||('legacy_'+encodedKey),archive={...leaving,
   resignationEventId:eventId,resignedAt:requested.resignedAt||now,resignationDate:requested.resignationDate||now.slice(0,10),
   resignationReason:requested.resignationReason||'',resignationNote:requested.resignationNote||'',recordedBy:requested.recordedBy||'',
   organizationDivision:requested.organizationDivision||leaving.organizationDivision||'Production Division',organizationPlant:requested.organizationPlant||leaving.organizationPlant||'โรง 1',
   employmentRecords:requested.employmentRecords||{},_positionSlot:requested._positionSlot||leaving._positionSlot||null,employmentStatus:'resigned',archived:true,archiveReason:'resigned'};
  const saved=await change('formerEmployeeHistory/'+encodeURIComponent(eventId),old=>remoteLeaving?archive:(old||archive));
  if(String(saved?.id)!==id)throw Error('ไม่สามารถยืนยันประวัติลาออกได้');
  await change('formerEmployees/'+key,old=>String(old?.resignedAt||'')>String(saved.resignedAt)?old:saved);
  snapshot=saved;
  if(Array.isArray(leaving.ngHistory)&&leaving.ngHistory.length)await change('ngHistoryArchive/'+ngKey,old=>({...leaving,...(old||{}),employmentStatus:'resigned',archived:true,archivedAt:old?.archivedAt||new Date().toISOString()}));
 }
 if(leaving&&window.PPMSPositionSlots){
  const retained={...leaving,organizationDivision:snapshot?.organizationDivision||leaving.organizationDivision,organizationPlant:snapshot?.organizationPlant||leaving.organizationPlant,_positionSlot:snapshot?._positionSlot};
  const master=await change('settings/organizationMaster',value=>{const next=window.PPMSPositionSlots.preserve(value||window.PPMSOrganizationScope.master(),retained,records(initial.value));return {...next,_updatedAt:Date.now()}},'');
  window.PPMSPositionSlots.apply(master);
 }
 // Publish the tombstone first so other devices cannot merge a cached employee
 // back into the roster, even if the connection fails during the next step.
 await change('deletedEmployeeIds',value=>[...new Set([...(Array.isArray(value)?value:Object.values(value||{})).map(String),id])]);
 await change('employees',value=>{
  const existing=records(value).find(e=>String(e.id)===id);
  if(existing&&JSON.stringify(existing)!==JSON.stringify(remoteLeaving))throw Error('ข้อมูลพนักงานเปลี่ยนระหว่างบันทึกลาออก • ระบบจะเก็บข้อมูลล่าสุดก่อนลองใหม่');
  if(Array.isArray(value))return value.filter(e=>!e||String(e.id)!==id);
  const next={...(value||{})};for(const [key,e] of Object.entries(next))if(e&&String(e.id)===id)delete next[key];return next;
 });
 const [roster,deleted]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 if(records(roster.value).some(e=>String(e.id)===id)||!Object.values(deleted.value||{}).map(String).includes(id))throw Error('Firebase ยังไม่ยืนยันการลบ • เก็บรายการรอลบไว้แล้ว');
 return {employees:roster.value,deletedEmployeeIds:Object.values(deleted.value||{}).map(String),formerEmployee:snapshot};
}
// Save the employee collection independently of the large ppms root socket.
async function upsert(data,originalId='',options={}){
 const id=String(data.id),oldId=String(originalId||''),patchFields=Array.isArray(options.patchFields)?options.patchFields.filter(field=>['stampingShift','organizationTeam','updatedAt','skillLevels','currentSkillLevel','skillUpdatedAt','skillRevisionAt','skillQuarter','skillEvaluator','skillHistory'].includes(field)):null;
 const deleted=await request('deletedEmployeeIds');
 if(oldId===id&&Object.values(deleted.value||{}).map(String).includes(id)){const error=Error('พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่');if(patchFields)error.code='employee-missing';throw error}
 await change('employees',value=>{
  const existing=records(value).find(e=>String(e.id)===id);
  if(options.createOnly&&existing){const error=Error('รหัสพนักงานนี้มีอยู่แล้ว');error.code='employee-exists';error.existing=existing;throw error}
  if(patchFields){
   if(!existing){const error=Error('พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่');error.code='employee-missing';throw error}
   if(options.expectedSection&&existing.section!==options.expectedSection){const error=Error('แผนกพนักงานเปลี่ยนแล้ว กรุณาโหลดรายชื่อใหม่');error.code='employee-section-changed';error.existing=existing;throw error}
   if(Object.hasOwn(options,'expectedSortingGroup')&&String(existing.sortingGroup||'')!==options.expectedSortingGroup){const error=Error('กลุ่ม Sorting ของพนักงานเปลี่ยนแล้ว กรุณาโหลดรายชื่อใหม่');error.code='employee-section-changed';error.existing=existing;throw error}
   let patched={...existing,...Object.fromEntries(patchFields.map(field=>[field,data[field]]))};
   const record=patchFields.includes('skillHistory')&&data.skillHistory?.[0];
   if(record?.source==='Admin Bulk Skill Update'&&record.batchId){
    const history=Array.isArray(existing.skillHistory)?existing.skillHistory:[];
    if(history.some(h=>h.batchId===record.batchId))patched=existing;
    else{
     const key=s=>!String(s).startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(s)?String(s):'__ppmskey__'+encodeURIComponent(s).replace(/\./g,'%2E');
     const before={...existing.skillLevels};
     for(const k of Object.keys(record.before||{}))before[k]=Number(existing.skillLevels?.[k]||existing.currentSkillLevel||1);
     const after={...before},changed=[];
     for(const topic of record.selectedSkills||[]){const k=key(topic),value=Number(record.after?.[k]);if(!Number.isInteger(value)||value<1||value>5)throw Error('ระดับ Skill ต้องเป็นเลข 1–5');after[k]=value;if(before[k]!==value)changed.push(topic)}
     patched={...patched,skillLevels:after,currentSkillLevel:Math.max(...Object.values(after)),skillRevisionAt:new Date().toISOString(),skillHistory:[{...record,before,after,changed},...history].slice(0,100)};
    }
   }
   if(Array.isArray(value))return value.map(e=>e&&String(e.id)===id?patched:e);
   return Object.fromEntries(Object.entries(value).map(([key,e])=>[key,e&&String(e.id)===id?patched:e]));
  }
  if(Array.isArray(value)||value==null){
   const next=records(value).filter(e=>String(e.id)!==id&&(!oldId||String(e.id)!==oldId));
   return [...next,data];
  }
  const next={...value};
  for(const [key,e] of Object.entries(next))if(e&&(String(e.id)===id||(oldId&&String(e.id)===oldId)))delete next[key];
  const key=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  next[key]=data;return next;
 });
 if(!patchFields)await change('deletedEmployeeIds',value=>{
  const ids=new Set(Object.values(value||{}).map(String));
  ids.delete(id);if(oldId&&oldId!==id)ids.add(oldId);return [...ids];
 });
 const [roster,tombstones]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 const saved=records(roster.value).find(e=>String(e.id)===id);
 const bulkRecord=patchFields?.includes('skillHistory')&&data.skillHistory?.[0],bulkConfirmed=bulkRecord?.source==='Admin Bulk Skill Update'&&bulkRecord.batchId&&saved?.skillHistory?.some(h=>h.batchId===bulkRecord.batchId);
 if(!saved||(!bulkConfirmed&&saved.updatedAt!==data.updatedAt)||Object.values(tombstones.value||{}).map(String).includes(id))throw Error('Firebase ยังไม่ยืนยันรายชื่อใหม่ • เก็บรายการรอส่งไว้แล้ว');
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
window.PPMS_EMPLOYEE_DELETE_SERVICE={remove(id,snapshot){id=String(id);if(running.has(id))return running.get(id);const job=remove(id,snapshot).finally(()=>running.delete(id));running.set(id,job);return job}};
})();
