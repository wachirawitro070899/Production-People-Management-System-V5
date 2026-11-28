// Employee deletion uses small HTTP conditional writes, independently of the
// realtime socket and the large attendance/master transaction.
(()=>{'use strict';
const running=new Map();
async function request(path,options={},prefix='ppms/'){
 const {timeoutMs=20000,...fetchOptions}=options;
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
 if(!base)throw Error('ไม่พบการตั้งค่า Firebase');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(base+'/'+prefix+path+'.json',{...fetchOptions,signal:controller.signal,cache:'no-store'});
  if(!response.ok&&response.status!==412)throw Error('Firebase ไม่ยืนยันการบันทึก ('+response.status+')');
  // Keep the deadline active until the body has also finished downloading.
  const value=await response.json();
  return {status:response.status,etag:response.headers.get('etag'),value};
 }catch(error){if(error.name==='AbortError')throw Error('เชื่อมต่อ Firebase หมดเวลา • เก็บรายการรอลบไว้แล้ว');throw error}
 finally{clearTimeout(timer)}
}
async function change(path,update,prefix='ppms/',timeoutMs=20000){
 for(let attempt=0;attempt<5;attempt++){
  const read=await request(path,{headers:{'X-Firebase-ETag':'true'},timeoutMs},prefix);
  if(!read.etag)throw Error('Firebase ไม่ส่งข้อมูลยืนยันเวอร์ชัน');
  const next=update(read.value);
  if(JSON.stringify(next)===JSON.stringify(read.value))return read.value;
  const saved=await request(path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':read.etag},body:JSON.stringify(next),timeoutMs},prefix);
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
 const id=String(data.id),oldId=String(originalId||''),patchFields=Array.isArray(options.patchFields)?options.patchFields.filter(field=>['stampingShift','organizationTeam','updatedAt','skillLevels','currentSkillLevel','skillUpdatedAt','skillRevisionAt','skillQuarter','skillEvaluator','skillHistory',...(options.organizationScopeUpdate?['section','position','organizationDivision','organizationPlant','productionSupervisorPreviousRole']:[])].includes(field)):null;
 if(options.organizationScopeUpdate&&(!data.organizationDivision||!data.organizationPlant))throw Error('กรุณาเลือกฝ่ายและโรงงานก่อนบันทึก');
 const deleted=await request('deletedEmployeeIds');
 if(oldId===id&&Object.values(deleted.value||{}).map(String).includes(id)){const error=Error('พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่');if(patchFields)error.code='employee-missing';throw error}
 await change('employees',value=>{
  const existing=records(value).find(e=>String(e.id)===id);
  if(options.createOnly&&existing){const error=Error('รหัสพนักงานนี้มีอยู่แล้ว');error.code='employee-exists';error.existing=existing;throw error}
  if(patchFields){
   if(existing&&options.organizationScopeUpdate&&existing.updatedAt===data.updatedAt&&patchFields.every(field=>field==='productionSupervisorPreviousRole'?((existing[field]||null)===(data[field]||null)||existing[field]?.section===data[field]?.section&&existing[field]?.position===data[field]?.position):JSON.stringify(existing[field])===JSON.stringify(data[field])))return value;
   if(!existing){const error=Error('พนักงานถูกลบแล้ว กรุณาโหลดรายชื่อใหม่');error.code='employee-missing';throw error}
   if(Object.hasOwn(options,'expectedPosition')&&existing.position!==options.expectedPosition){const error=Error('ตำแหน่งพนักงานเปลี่ยนแล้ว กรุณาโหลดรายชื่อใหม่');error.code='employee-section-changed';error.existing=existing;throw error}
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
   const previous=existing||records(value).find(e=>String(e.id)===oldId);
   return [...next,{...data,...(previous?.certifications?{certifications:previous.certifications}:{})}];
  }
  const next={...value};
  for(const [key,e] of Object.entries(next))if(e&&(String(e.id)===id||(oldId&&String(e.id)===oldId)))delete next[key];
  const key=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  const previous=existing||records(value).find(e=>String(e.id)===oldId);
  next[key]={...data,...(previous?.certifications?{certifications:previous.certifications}:{})};return next;
 });
 if(!patchFields)await change('deletedEmployeeIds',value=>{
  const ids=new Set(Object.values(value||{}).map(String));
  ids.delete(id);if(oldId&&oldId!==id)ids.add(oldId);return [...ids];
 });
 let organizationScope;
 if(options.organizationScopeUpdate){
  const key=!id.startsWith('__ppmskey__')&&!/[.#$\[\]\/]/.test(id)?id:'__ppmskey__'+encodeURIComponent(id).replace(/\./g,'%2E');
  organizationScope=await change('employeeOrganization/'+encodeURIComponent(key),value=>({...value,division:data.organizationDivision,plant:data.organizationPlant}),'');
  if(organizationScope?.division!==data.organizationDivision||organizationScope?.plant!==data.organizationPlant)throw Error('ฐานข้อมูลยังไม่ยืนยันการย้ายฝ่าย • เก็บรายการรอส่งไว้แล้ว');
 }
 const [roster,tombstones]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 const saved=records(roster.value).find(e=>String(e.id)===id);
 const bulkRecord=patchFields?.includes('skillHistory')&&data.skillHistory?.[0],bulkConfirmed=bulkRecord?.source==='Admin Bulk Skill Update'&&bulkRecord.batchId&&saved?.skillHistory?.some(h=>h.batchId===bulkRecord.batchId);
 if(!saved||(!bulkConfirmed&&saved.updatedAt!==data.updatedAt)||Object.values(tombstones.value||{}).map(String).includes(id))throw Error('Firebase ยังไม่ยืนยันรายชื่อใหม่ • เก็บรายการรอส่งไว้แล้ว');
 return {employees:roster.value,deletedEmployeeIds:Object.values(tombstones.value||{}).map(String),...(organizationScope?{organizationScope}:{})};
}
// Certificate edits merge one record against the current roster. Profile edits,
// retries and simultaneous courses must never replace another certificate.
async function saveCertificate(employeeId,record,expectedUpdatedAt=''){
 return saveCertificates([{employeeId,record,expectedUpdatedAt}]);
}
function isPermanent(employee){return /^(permanent|พนักงานประจำ)$/i.test(String(employee?.contractType||'').trim())}
async function saveCertificates(changes){
 if(!Array.isArray(changes)||!changes.length)throw Error('กรุณาเลือกพนักงาน');
 const seen=new Set();
 for(const {employeeId,record} of changes){
  if(employeeId==null||!record?.id||!String(record.course||'').trim()||!record.updatedAt)throw Error('กรุณาระบุหลักสูตร');
  if(!['certified','completed','planned'].includes(record.status))throw Error('สถานะการอบรมไม่ถูกต้อง');
  const key=JSON.stringify([String(employeeId),record.id]);if(seen.has(key))throw Error('รายการพนักงานซ้ำ');seen.add(key);
 }
 const deleted=await request('deletedEmployeeIds');
 const missing=id=>{const error=Error('ไม่พบพนักงาน หรือพนักงานถูกลบแล้ว');error.code='employee-missing';error.employeeId=String(id);return error};
 const deletedIds=new Set(Object.values(deleted.value||{}).map(String));
 for(const change of changes)if(deletedIds.has(String(change.employeeId)))throw missing(change.employeeId);
 await change('employees',value=>{
  const people=new Map(records(value).map(e=>[String(e.id),e])),patched=new Map();
  for(const {employeeId,record,expectedUpdatedAt=''} of changes){
   const id=String(employeeId),employee=patched.get(id)||people.get(id);if(!employee)throw missing(id);
   if(!isPermanent(employee)){const error=Error('หลักสูตรอบรมและใบเซอร์สำหรับพนักงานประจำเท่านั้น');error.code='employee-not-permanent';error.employeeId=id;error.existing=employee;throw error}
   const list=Array.isArray(employee.certifications)?employee.certifications:[],old=list.find(r=>r.id===record.id);
   if(old?.updatedAt===record.updatedAt)continue;
   if((old?.updatedAt||'')!==expectedUpdatedAt){const error=Error('รายการอบรมนี้ถูกแก้ไขจากเครื่องอื่น กรุณาเปิดรายการใหม่');error.code='certificate-conflict';error.existing=employee;error.employeeId=id;throw error}
   patched.set(id,{...employee,certifications:[record,...list.filter(r=>r.id!==record.id)]});
  }
  if(!patched.size)return value;
  return Array.isArray(value)?value.map(e=>e&&patched.get(String(e.id))||e):Object.fromEntries(Object.entries(value).map(([key,e])=>[key,e&&patched.get(String(e.id))||e]));
 },'ppms/',90000);
 const [roster,tombstones]=await Promise.all([request('employees',{timeoutMs:90000}),request('deletedEmployeeIds')]);
 const people=new Map(records(roster.value).map(e=>[String(e.id),e])),gone=new Set(Object.values(tombstones.value||{}).map(String));
 for(const {employeeId,record} of changes){
  if(gone.has(String(employeeId)))throw missing(employeeId);
  if(people.get(String(employeeId))?.certifications?.find(r=>r.id===record.id)?.updatedAt!==record.updatedAt)throw Error('ยังไม่ยืนยันการบันทึกใบเซอร์ กรุณาลองใหม่');
 }
 return {employees:roster.value,deletedEmployeeIds:Object.values(tombstones.value||{}).map(String)};
}
// Import only new people. One conditional roster write keeps a duplicate or a
// concurrent creation from leaving a partially imported file.
async function importNewEmployees(batch){
 if(window.sessionStorage?.getItem('ppms_admin')!=='1'||window.PPMSAccess?.permission?.()!=='edit')throw Error('กรุณาใช้บัญชีที่มีสิทธิ์เพิ่มพนักงาน');
 const validate=window.PPMSEmployeeImport?.validateBatch;
 if(!validate)throw Error('กรุณาโหลดระบบนำเข้าพนักงานใหม่');
 const data=validate(batch),ids=new Set(data.employees.map(e=>String(e.id).toUpperCase()));
 const deleted=await request('deletedEmployeeIds');
 if(Object.values(deleted.value||{}).some(id=>ids.has(String(id).toUpperCase())))throw Error('มีรหัสอยู่ในประวัติการลบ กรุณาตรวจรหัสพนักงานก่อนนำเข้า');
 // A stale organization override must never silently send a new person to a
 // different plant. Read only the selected IDs and leave existing maps intact.
 for(const e of data.employees){
  const key=encodeURIComponent(e.id),override=(await request('employeeOrganization/'+key,{},'')).value;
  if(override&&(override.division!==data.scope.division||override.plant!==data.scope.plant))throw Error('รหัส '+e.id+' มีฝ่ายหรือโรงงานเดิม กรุณาตรวจสอบก่อนนำเข้า');
 }
 await change('employees',value=>{
  const people=records(value),existing=new Map(people.map(e=>[String(e.id).toUpperCase(),e]));
  for(const e of data.employees){
   const old=existing.get(e.id.toUpperCase());
   if(old&&(old.employeeImportKey!==data.key||String(old.id)!==e.id||old.section!==e.section||old.organizationDivision!==data.scope.division||old.organizationPlant!==data.scope.plant))throw Error('รหัสพนักงาน '+e.id+' มีอยู่แล้วหรือข้อมูลเปลี่ยน ไม่ได้ทับรายชื่อเดิม');
  }
  const additions=data.employees.filter(e=>!existing.has(e.id.toUpperCase()));
  if(!additions.length)return value;
  if(Array.isArray(value)||value==null)return [...(value||[]),...additions];
  const next={...value};for(const e of additions){if(Object.hasOwn(next,e.id))throw Error('รหัส '+e.id+' ชนกับข้อมูลเดิม');next[e.id]=e}return next;
 });
 const [roster,tombstones]=await Promise.all([request('employees'),request('deletedEmployeeIds')]);
 const people=new Map(records(roster.value).map(e=>[String(e.id),e]));
 for(const e of data.employees){const saved=people.get(e.id);if(!saved||saved.employeeImportKey!==data.key||saved.section!==data.section||saved.organizationDivision!==data.scope.division||saved.organizationPlant!==data.scope.plant||Object.values(tombstones.value||{}).map(String).includes(e.id))throw Error('ยังยืนยันข้อมูลไม่ครบ กรุณากดนำเข้าซ้ำจากรายการเดิม');if(['name','thaiName','position','startDate','contractType','photoData'].some(field=>String(saved[field]||'')!==String(e[field]||'')))throw Error('ข้อมูลหรือรูปของ '+e.id+' เปลี่ยนแล้ว กรุณาตรวจรายชื่อที่บันทึกก่อนทำรายการต่อ')}
 return {employees:roster.value,deletedEmployeeIds:Object.values(tombstones.value||{}).map(String),importedIds:data.employees.map(e=>e.id)};
}
window.PPMS_EMPLOYEE_SAVE_SERVICE={upsert,saveCertificate,saveCertificates,isPermanent,importNewEmployees};
// A small REST read still reaches other devices when the large root socket stalls.
let deletionPollRunning=false;
function realtimeRosterActive(){const health=window.getAppHealth?.();return health?.cloudReady===true&&health?.cloudConnected===true}
async function pollDeletions(){
 if(document.visibilityState==='hidden'||realtimeRosterActive()||deletionPollRunning||navigator.onLine===false||!window.PPMS_RUNTIME?.applyEmployeeDeletionSnapshot)return;
 deletionPollRunning=true;
 try{const result=await request('deletedEmployeeIds');window.PPMS_RUNTIME.applyEmployeeDeletionSnapshot(Object.values(result.value||{}).map(String))}
 catch(_){/* Retry without replacing confirmed data with an offline cache. */}
 finally{deletionPollRunning=false}
}
let rosterPollRunning=false;
async function pollRoster(){
 if(document.visibilityState==='hidden'||realtimeRosterActive()||rosterPollRunning||navigator.onLine===false||!window.PPMS_RUNTIME?.applyEmployeeRosterSnapshot)return;
 if(document.querySelector('#modal:not(.hidden) #employeeForm,#app #employeeForm,#certificateDialog,#modal:not(.hidden) #bulkSkillForm')||window.PPMSOrganizationEditor?.dragging||window.PPMSSectionTeams?.dragging)return;
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
async function updateLeaderEmployee(oldId,changes,leaderId){
 oldId=String(oldId||'').trim();leaderId=String(leaderId||'').trim();
 const newId=String(changes?.id||'').trim(),contractType=String(changes?.contractType||'').trim(),effectiveDate=String(changes?.permanentStartDate||'').trim();
 if(!oldId||!leaderId||!newId)throw Error('กรุณากรอกรหัสพนักงานให้ครบ');
 if(/[.#$\/\[\]]/.test(newId))throw Error('รหัสพนักงานมีอักขระที่ระบบไม่รองรับ');
 if(!['Permanent','Subcontractor'].includes(contractType))throw Error('กรุณาเลือกประเภทพนักงาน');
 const result=await request('employees'),roster=records(result.value),leader=roster.find(e=>String(e.id)===leaderId),employee=roster.find(e=>String(e.id)===oldId);
 const normalize=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/\b(section|department|dept)\b/g,'').replace(/[\s._\-/]+/g,'');
 if(!leader||!window.PPMSSectionAccess?.eligible({position:leader.position}))throw Error('ไม่พบสิทธิ์ Leader กรุณา Login ใหม่');
 const sameScope=employee&&normalize(employee.section)===normalize(leader.section)&&normalize(employee.organizationDivision||'Production Division')===normalize(leader.organizationDivision||'Production Division')&&normalize(employee.organizationPlant||'โรง 1')===normalize(leader.organizationPlant||'โรง 1');
 if(!sameScope)throw Error('แก้ไขได้เฉพาะพนักงานในแผนกและโรงงานเดียวกัน');
 if(oldId===leaderId)throw Error('ไม่สามารถเปลี่ยนข้อมูลบัญชี Leader ที่ Login อยู่ได้');
 const key=value=>String(value||'').normalize('NFKC').trim().toUpperCase().replace(/[\s._\-/]+/g,'');
 const conflict=roster.find(e=>key(e.id)===key(newId)&&String(e.id)!==oldId);
 if(conflict)throw Error('รหัสพนักงานนี้มีอยู่แล้ว');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(contractType==='Permanent'&&employee.contractType!=='Permanent'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate))throw Error('กรุณาระบุวันที่ปรับเป็นพนักงานประจำ');
  if(effectiveDate>today)throw Error('วันที่ปรับเป็นพนักงานประจำต้องไม่เป็นวันที่ในอนาคต');
  if(employee.startDate&&effectiveDate<employee.startDate)throw Error('วันที่ปรับเป็นพนักงานประจำต้องไม่ก่อนวันที่เริ่มงาน');
 }
 const changedAt=new Date().toISOString(),idChanged=newId!==oldId,statusChanged=contractType!==String(employee.contractType||'Permanent');
 let updated;
 await change('employees',value=>{
  const current=records(value),latest=current.find(e=>String(e.id)===oldId);
  if(!latest)throw Error('ไม่พบพนักงานในรายชื่อล่าสุด กรุณาโหลดใหม่');
  if(normalize(latest.section)!==normalize(leader.section)||normalize(latest.organizationDivision||'Production Division')!==normalize(leader.organizationDivision||'Production Division')||normalize(latest.organizationPlant||'โรง 1')!==normalize(leader.organizationPlant||'โรง 1'))throw Error('แผนกหรือโรงงานพนักงานเปลี่ยนแล้ว กรุณาโหลดรายชื่อใหม่');
  if(current.some(e=>key(e.id)===key(newId)&&String(e.id)!==oldId))throw Error('รหัสพนักงานนี้มีอยู่แล้ว');
  const codeHistory=Array.isArray(latest.employeeCodeHistory)?latest.employeeCodeHistory.slice():[];
  if(idChanged)codeHistory.unshift({from:oldId,to:newId,changedAt,changedBy:leaderId});
  const statusHistory=Array.isArray(latest.employmentStatusHistory)?latest.employmentStatusHistory.slice():[];
  if(statusChanged)statusHistory.unshift({from:String(latest.contractType||'Permanent'),to:contractType,effectiveDate:contractType==='Permanent'?effectiveDate:'',changedAt,changedBy:leaderId});
  updated={...latest,id:newId,contractType,permanentStartDate:contractType==='Permanent'?(effectiveDate||latest.permanentStartDate||''):'',employeeCodeHistory:codeHistory.slice(0,50),employmentStatusHistory:statusHistory.slice(0,50),updatedAt:changedAt};
  if(idChanged)updated.previousEmployeeIds=[...new Set([...(latest.previousEmployeeIds||[]).map(String),oldId])];
  if(Array.isArray(value))return value.map(e=>e&&String(e.id)===oldId?updated:e);
  const next={...(value||{})};for(const [recordKey,e] of Object.entries(next))if(e&&String(e.id)===oldId)delete next[recordKey];
  const safe=!newId.startsWith('__ppmskey__')&&!/[.#$\/\[\]]/.test(newId)?newId:'__ppmskey__'+encodeURIComponent(newId).replace(/\./g,'%2E');
  next[safe]=updated;return next;
 });
 if(idChanged){
  const tombstone=await change('deletedEmployeeIds',value=>{const ids=new Set(Object.values(value||{}).map(String));ids.delete(newId);ids.add(oldId);return [...ids]});
  const oldKey=!oldId.startsWith('__ppmskey__')&&!/[.#$\/\[\]]/.test(oldId)?oldId:'__ppmskey__'+encodeURIComponent(oldId).replace(/\./g,'%2E');
  const newKey=!newId.startsWith('__ppmskey__')&&!/[.#$\/\[\]]/.test(newId)?newId:'__ppmskey__'+encodeURIComponent(newId).replace(/\./g,'%2E');
  await change('employeeOrganization',value=>{const next={...(value||{})};if(next[oldKey]){next[newKey]=next[oldKey];delete next[oldKey]}return next},'');
  if(!Array.isArray(tombstone)||!tombstone.includes(oldId))throw Error('บันทึกประวัติรหัสเดิมไม่สำเร็จ');
 }
 const confirmed=records((await request('employees')).value).find(e=>String(e.id)===newId);
 if(!confirmed||confirmed.updatedAt!==changedAt)throw Error('Firebase ยังไม่ยืนยันการบันทึก กรุณาเปิดหน้าลีดเดอร์ใหม่');
 return confirmed;
}
window.PPMS_EMPLOYEE_DELETE_SERVICE={updateLeaderEmployee,remove(id,snapshot){id=String(id);if(running.has(id))return running.get(id);const job=remove(id,snapshot).finally(()=>running.delete(id));running.set(id,job);return job}};
})();

