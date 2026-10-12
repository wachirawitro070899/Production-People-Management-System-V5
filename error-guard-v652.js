(()=>{
'use strict';
const LOG_KEY='ppms_error_log_v652';
let lastMessage='',lastAt=0;
const ATTENDANCE_KEY='ppms_v3_attendance';
const nativeStorageSetItem=Storage.prototype.setItem;
const nativeStorageGetItem=Storage.prototype.getItem,nativeStorageRemoveItem=Storage.prototype.removeItem,nativeStorageClear=Storage.prototype.clear;
const memoryStorage=new WeakMap();
const memory=storage=>{let map=memoryStorage.get(storage);if(!map){map=new Map();memoryStorage.set(storage,map)}return map};
const isQuotaError=error=>!!error&&(/quota/i.test(String(error.name||''))||/quota|exceeded.*storage|storage.*full/i.test(String(error.message||error)));
const storageUnavailable=error=>isQuotaError(error)||error?.name==='SecurityError';
function clearDisposableCaches(storage){
 ['ppms_v3_auto_backup','ppms_v3_auto_backup_time','ppms_error_log_v652'].forEach(key=>{try{storage.removeItem(key)}catch(_){}});
}
function compactAttendance(value){
 let rows;try{rows=JSON.parse(String(value||'[]'))}catch(_){return'[]'}
 if(!Array.isArray(rows))return'[]';
 const stamp=row=>String(row?.date||row?.attendanceDate||row?.checkInAt||row?.createdAt||row?.updatedAt||'');
 const pending=rows.filter(row=>row&&(row.pendingCloudSync||row.cloudVerified!==true&&row.canonicalVerified!==true));
 const recent=rows.slice().sort((a,b)=>stamp(b).localeCompare(stamp(a))).slice(0,800);
 const seen=new Set(),kept=[...pending,...recent].filter(row=>{const key=String(row?.id||row?.recordId||row?.firebaseKey||JSON.stringify([row?.employeeId,row?.date,row?.checkIn,row?.type]));if(seen.has(key))return false;seen.add(key);return true});
 return JSON.stringify(kept);
}
Storage.prototype.getItem=function(key){const map=memory(this),k=String(key);if(map.has(k))return map.get(k);try{return nativeStorageGetItem.call(this,k)}catch(error){if(!storageUnavailable(error))throw error;return null}};
Storage.prototype.removeItem=function(key){memory(this).delete(String(key));try{return nativeStorageRemoveItem.call(this,key)}catch(error){if(!storageUnavailable(error))throw error}};
Storage.prototype.clear=function(){memory(this).clear();try{return nativeStorageClear.call(this)}catch(error){if(!storageUnavailable(error))throw error}};
Storage.prototype.setItem=function(key,value){
 const k=String(key),v=String(value),map=memory(this);
 try{const result=nativeStorageSetItem.call(this,k,v);map.delete(k);return result}catch(error){
  if(!storageUnavailable(error))throw error;
  if(error.name==='SecurityError'){map.set(k,v);storageNotice();return}
  clearDisposableCaches(this);
  try{const result=nativeStorageSetItem.call(this,k,v);map.delete(k);return result}catch(second){
   if(!storageUnavailable(second))throw second;
   if(k===ATTENDANCE_KEY){
    try{nativeStorageSetItem.call(this,k,compactAttendance(v));map.set(k,v);return}catch(_){}
   }
   // Never delete attendance or unsent edits to make room for an unrelated cache.
   map.set(k,v);storageNotice();
  }
 }
};
function storageNotice(){
 if(!document.body){document.addEventListener('DOMContentLoaded',storageNotice,{once:true});return}
 if(document.getElementById('ppmsStorageNotice'))return;
 const bar=document.createElement('div');bar.id='ppmsStorageNotice';bar.setAttribute('role','status');bar.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:100001;background:#92400e;color:white;padding:12px;border-radius:9px;font:13px system-ui';bar.textContent='พื้นที่เก็บข้อมูลในเครื่องไม่พร้อม ข้อมูลใหม่อยู่ในหน้านี้ กรุณารอให้ซิงก์ Firebase สำเร็จก่อนปิดหรือรีเฟรช';document.body.append(bar);
}
const messageOf=value=>String(value&&((value.message)||(value.code))||value||'Unknown error').replace(/^Error:\s*/,'').slice(0,300);
const transient=value=>/network|offline|disconnected|timeout|timed out|failed to fetch|load failed|abort|cancel|firebase.*unavailable|database\/network-error|permission_denied|quota.*exceeded/i.test(messageOf(value));
function remember(kind,value){
 try{const log=JSON.parse(localStorage.getItem(LOG_KEY)||'[]'),entry={at:new Date().toISOString(),kind,message:messageOf(value),page:location.hash||location.pathname,online:navigator.onLine};localStorage.setItem(LOG_KEY,JSON.stringify([entry,...(Array.isArray(log)?log:[])].slice(0,20)))}catch(_){}
}
function notify(value){
 const message=messageOf(value),now=Date.now();if(message===lastMessage&&now-lastAt<10000)return;lastMessage=message;lastAt=now;
 let bar=document.getElementById('ppmsErrorGuard');if(!bar){bar=document.createElement('div');bar.id='ppmsErrorGuard';bar.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:100000;background:#991b1b;color:#fff;padding:11px 14px;border-radius:9px;font:600 13px system-ui;box-shadow:0 8px 24px #0004';document.body.appendChild(bar)}
 bar.textContent='ระบบพบข้อผิดพลาด: '+message+' • หน้าปัจจุบันยังใช้งานได้ กรุณาลองอีกครั้ง';clearTimeout(notify.timer);notify.timer=setTimeout(()=>bar.remove(),7000);
}
window.addEventListener('unhandledrejection',event=>{remember('promise',event.reason);event.preventDefault();event.stopImmediatePropagation();if(!transient(event.reason))notify(event.reason)},true);
window.addEventListener('error',event=>{const source=String(event.filename||'');if(source.startsWith('chrome-extension://')){event.stopImmediatePropagation();return}const reason=event.error||event.message||'Resource load error';remember('javascript',reason);event.stopImmediatePropagation();if(!transient(reason))notify(reason)},true);
window.addEventListener('online',()=>{const bar=document.getElementById('ppmsErrorGuard');if(bar)bar.remove()});
window.ppmsErrorGuard={version:'859',logs:()=>{try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(_){return[]}},clear:()=>localStorage.removeItem(LOG_KEY),pendingStorageKeys:()=>[...memory(localStorage).keys()],retryStorage:()=>{for(const [key,value]of [...memory(localStorage)])localStorage.setItem(key,value);if(!memory(localStorage).size)document.getElementById('ppmsStorageNotice')?.remove();return memory(localStorage).size===0}};
window.addEventListener('online',()=>window.ppmsErrorGuard.retryStorage());
})();

