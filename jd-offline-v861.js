/* Persist JD edits before attempting Firebase; keep unsent drafts across reloads. */
(()=>{'use strict';
 const FALLBACK='ppms_jd_pending_v1',DB_NAME='ppms_jd_offline_v1',STORE='pending';
 const jobs=new Map(),listeners=new Set();let dbPromise=null,syncPromise=null,loaded=false;
 const copy=value=>JSON.parse(JSON.stringify(value));
 const fallback=()=>{try{const value=JSON.parse(localStorage.getItem(FALLBACK)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}};
 function writeFallback(values){localStorage.setItem(FALLBACK,JSON.stringify(values));if(window.ppmsErrorGuard?.pendingStorageKeys?.().includes(FALLBACK))throw Error('พื้นที่เก็บข้อมูลในเครื่องไม่เพียงพอ กรุณาเก็บข้อความไว้ก่อนแล้วลองอีกครั้ง')}
 function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   if(!window.indexedDB){reject(Error('IndexedDB unavailable'));return}
   let settled=false;const request=indexedDB.open(DB_NAME,1),timer=setTimeout(()=>finish(Error('เปิดพื้นที่เก็บข้อมูลในเครื่องไม่สำเร็จ')),2500);
   function finish(error,db){if(settled){db?.close();return}settled=true;clearTimeout(timer);if(error)reject(error);else resolve(db)}
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};
   request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();dbPromise=null};finish(null,request.result)};
   request.onerror=()=>finish(request.error||Error('พื้นที่เก็บข้อมูลไม่พร้อม'));request.onblocked=()=>finish(Error('พื้นที่เก็บข้อมูลถูกใช้งานจากอีกหน้าต่าง'));
  }).catch(error=>{dbPromise=null;throw error});return dbPromise;
 }
 async function stored(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();let values=[];request.onsuccess=()=>{values=request.result||[]};tx.oncomplete=()=>resolve(values);tx.onerror=tx.onabort=()=>reject(tx.error||Error('อ่าน JD ในเครื่องไม่สำเร็จ'))})}
 async function put(job,expectedOperation){
  try{
   const db=await open();await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.get(job.key);let conflict=false;
    request.onsuccess=()=>{const old=request.result,cleared=fallback()[job.key];if(old&&old.operationId!==expectedOperation&&old.operationId!==job.operationId&&!(cleared?.status==='synced'&&cleared.clearedOperations?.includes(old.operationId))){conflict=true;tx.abort();return}store.put(copy(job))};
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Object.assign(Error(conflict?'JD ในเครื่องถูกแก้ไขจากอีกหน้าต่าง กรุณาเปิดฉบับล่าสุดก่อนบันทึก':'บันทึก JD ในเครื่องไม่สำเร็จ'),{localConflict:conflict}));
   });
   const cache=fallback();if(cache[job.key]&&(cache[job.key].operationId===expectedOperation||cache[job.key].status==='synced')){delete cache[job.key];try{writeFallback(cache)}catch{}}
  }catch(error){if(error.localConflict)throw error;const cache=fallback(),old=cache[job.key];if(old&&old.status!=='synced'&&old.operationId!==expectedOperation&&old.operationId!==job.operationId)throw Error('JD ในเครื่องถูกแก้ไขจากอีกหน้าต่าง กรุณาเปิดฉบับล่าสุดก่อนบันทึก');cache[job.key]=copy(job);writeFallback(cache)}
 }
 async function remove(key,operationId,ancestors=[]){
  let removed=false;try{const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),r=store.get(key);r.onsuccess=()=>{if(r.result?.operationId===operationId||ancestors.includes(r.result?.operationId))store.delete(key)};tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('ปรับรายการรอซิงก์ไม่สำเร็จ'))});removed=true}catch(error){if(!fallback()[key])throw error}
  const cache=fallback();if(cache[key]?.operationId===operationId){if(removed)delete cache[key];else cache[key]={key,operationId,record:null,status:'synced',queuedAt:new Date().toISOString(),clearedOperations:[...ancestors,operationId]};writeFallback(cache)}
 }
 function emit(event={type:'loaded'}){for(const listener of listeners)try{listener(event)}catch(error){console.warn('JD offline update:',error)}}
 const ready=(async()=>{
  const values=Object.values(fallback());try{values.push(...await stored())}catch{}
  const latest=new Map();
  for(const job of values){
   if(!job?.key||!job.operationId)continue;const old=latest.get(job.key);
   if(old?.status==='synced'&&old.clearedOperations?.includes(job.operationId))continue;
   if(!old||job.status==='synced'&&job.clearedOperations?.includes(old.operationId)||job.ancestors?.includes(old.operationId)||!old.ancestors?.includes(job.operationId)&&String(job.queuedAt||'')>=String(old.queuedAt||''))latest.set(job.key,job);
  }
  for(const job of latest.values())if(job.record&&job.status!=='synced')jobs.set(job.key,job);loaded=true;emit();
 })();
 async function save(key,record,expectedVersion){
  await ready;const prior=jobs.get(key),operationId=crypto.randomUUID?.()||'jd-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const job={key,record:{...copy(record),createdAt:prior?.record.createdAt||record.createdAt||record.updatedAt},expectedVersion:prior?.expectedVersion??Number(expectedVersion||0),operationId,ancestors:[...new Set([...(prior?.ancestors||[]),prior?.operationId].filter(Boolean))],queuedAt:new Date().toISOString(),status:'pending',error:''};
  await put(job,prior?.operationId);jobs.set(key,job);emit({type:'saved',key});return overlayRecord(job);
 }
 function overlayRecord(job){return {...job.record,version:job.expectedVersion+1,_ppmsOfflineOperationId:job.operationId}}
 function overlay(records){const result={...records};for(const [key,job]of jobs)result[key]=overlayRecord(job);return result}
 function status(key){const job=jobs.get(key);return job?{status:job.status,error:job.error||'',operationId:job.operationId}:null}
 async function resolveConflict(key){
  await ready;const old=jobs.get(key);if(old?.status!=='conflict')throw Error('ไม่พบ JD ที่ต้องตรวจสอบก่อนซิงก์');
  const job={...old,record:{...old.record,updatedAt:new Date().toISOString()},expectedVersion:Number(old.conflictRecord?.version||0),operationId:crypto.randomUUID?.()||'jd-'+Date.now()+'-'+Math.random().toString(36).slice(2),ancestors:[],queuedAt:new Date().toISOString(),status:'pending',error:''};
  await put(job,old.operationId);jobs.set(key,job);emit({type:'saved',key});return overlayRecord(job);
 }
 async function performSync(database){
  await ready;for(const job of [...jobs.values()]){
   if(navigator.onLine===false)break;if(job.status==='conflict'||jobs.get(job.key)?.operationId!==job.operationId)continue;
   try{
    const result=await database.ref('settings/jobDescriptions/'+job.key).transaction(current=>{
     if(jobs.get(job.key)?.operationId!==job.operationId||current?._ppmsOfflineOperationId===job.operationId)return undefined;
     const version=Number(current?.version||0),sameChain=job.ancestors.includes(current?._ppmsOfflineOperationId);
     if(version!==job.expectedVersion&&!sameChain)return undefined;
     return {...job.record,version:version+1,createdAt:current?.createdAt||job.record.createdAt,_ppmsOfflineOperationId:job.operationId};
    },undefined,false);
    if(jobs.get(job.key)?.operationId!==job.operationId)continue;
    const record=result.snapshot.val();
    if(!result.committed&&record?._ppmsOfflineOperationId!==job.operationId){const conflict={...job,status:'conflict',conflictRecord:record,error:'JD ส่วนกลางถูกแก้ไขจากเครื่องอื่นแล้ว ฉบับที่บันทึกในเครื่องยังเก็บไว้'};await put(conflict,job.operationId);jobs.set(job.key,conflict);emit({type:'conflict',key:job.key});continue}
    await remove(job.key,job.operationId,job.ancestors);if(jobs.get(job.key)?.operationId===job.operationId){jobs.delete(job.key);emit({type:'synced',key:job.key,record})}
   }catch(error){if(jobs.get(job.key)?.operationId!==job.operationId)continue;emit({type:'retry',key:job.key,error:String(error.message||error)})}
  }
  return jobs.size===0;
 }
 function sync(database){if(syncPromise)return syncPromise;if(!database||navigator.onLine===false)return Promise.resolve(false);syncPromise=performSync(database).finally(()=>{syncPromise=null});return syncPromise}
 window.PPMS_JD_OFFLINE={ready,get loaded(){return loaded},save,overlay,status,resolveConflict,conflictRecord:key=>copy(jobs.get(key)?.conflictRecord||null),count:()=>jobs.size,sync,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}};
})();
