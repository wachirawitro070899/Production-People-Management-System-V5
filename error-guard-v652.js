(()=>{
'use strict';
const LOG_KEY='ppms_error_log_v652';
let lastMessage='',lastAt=0;
const ATTENDANCE_KEY='ppms_v3_attendance';
const nativeStorageSetItem=Storage.prototype.setItem;
const isQuotaError=error=>!!error&&(/quota/i.test(String(error.name||''))||/quota|exceeded.*storage|storage.*full/i.test(String(error.message||error)));
function clearDisposableCaches(storage){
 ['ppms_v3_auto_backup','ppms_v3_auto_backup_time','ppms_error_log_v652'].forEach(key=>{try{storage.removeItem(key)}catch(_){}});
}
function compactAttendance(value){
 let rows;try{rows=JSON.parse(String(value||'[]'))}catch(_){return'[]'}
 if(!Array.isArray(rows))return'[]';
 const stamp=row=>String(row?.date||row?.attendanceDate||row?.checkInAt||row?.createdAt||row?.updatedAt||'');
 const pending=rows.filter(row=>row&&(row.pendingCloudSync||row.cloudVerified===false));
 const recent=rows.slice().sort((a,b)=>stamp(b).localeCompare(stamp(a))).slice(0,800);
 const seen=new Set(),kept=[...pending,...recent].filter(row=>{const key=String(row?.id||row?.recordId||row?.firebaseKey||JSON.stringify([row?.employeeId,row?.date,row?.checkIn,row?.type]));if(seen.has(key))return false;seen.add(key);return true});
 return JSON.stringify(kept,(key,item)=>typeof item==='string'&&item.startsWith('data:')?'[stored-in-cloud]':item);
}
Storage.prototype.setItem=function(key,value){
 try{return nativeStorageSetItem.call(this,key,value)}catch(error){
  if(!isQuotaError(error))throw error;
  clearDisposableCaches(this);
  try{return nativeStorageSetItem.call(this,key,value)}catch(second){
   if(String(key)===ATTENDANCE_KEY){
    try{return nativeStorageSetItem.call(this,key,compactAttendance(value))}catch(_){try{this.removeItem(ATTENDANCE_KEY)}catch(__){};return}
   }
   try{this.removeItem(ATTENDANCE_KEY);return nativeStorageSetItem.call(this,key,value)}catch(_){throw second}
  }
 }
};
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
window.ppmsErrorGuard={version:'683',logs:()=>{try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(_){return[]}},clear:()=>localStorage.removeItem(LOG_KEY)};
})();
