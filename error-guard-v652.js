(()=>{
'use strict';
if(window.ppmsErrorGuard?.version==='873')return;
const LOG_KEY='ppms_error_log_v652';
let lastMessage='',lastAt=0;
// Large PPMS caches and pending edits use IndexedDB when Web Storage is full.
// Keep synchronous reads in memory, but only report a durable save after commit.
const nativeStorageSetItem=Storage.prototype.setItem;
const nativeStorageGetItem=Storage.prototype.getItem,nativeStorageRemoveItem=Storage.prototype.removeItem,nativeStorageClear=Storage.prototype.clear;
const memoryStorage=new WeakMap(),durableKeys=new Set(),touchedKeys=new Set();
const memory=storage=>{let map=memoryStorage.get(storage);if(!map){map=new Map();memoryStorage.set(storage,map)}return map};
const isQuotaError=error=>!!error&&(/quota/i.test(String(error.name||''))||/quota|exceeded.*storage|storage.*full/i.test(String(error.message||error)));
const storageUnavailable=error=>isQuotaError(error)||error?.name==='SecurityError';
const MARKER='__ppms_indexeddb_v873__',LARGE_VALUE=256*1024;
let localStore=null,db=null,ready=null,clearedBeforeReady=false,io=Promise.resolve();
try{localStore=window.localStorage}catch(_){}
const persistent=(storage,key)=>storage===localStore&&key.startsWith('ppms_v3_');
const nativeValue=key=>{try{return nativeStorageGetItem.call(localStore,key)}catch(_){return null}};
const unsavedKeys=()=>localStore?[...memory(localStore).keys()].filter(key=>!durableKeys.has(key)):[];
function refreshStorageNotice(){if(!unsavedKeys().length)document.getElementById('ppmsStorageNotice')?.remove()}
function transaction(action){return new Promise((resolve,reject)=>{
 const tx=db.transaction('values','readwrite');
 tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Cannot save device data'));
 action(tx.objectStore('values'));
})}
try{
 if(localStore&&window.indexedDB)ready=new Promise(resolve=>{
  let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value)};
  const timer=setTimeout(()=>finish(false),4000);
  const request=window.indexedDB.open('ppms-device-storage-v873',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('values',{keyPath:'key'});
  request.onerror=request.onblocked=()=>finish(false);
  request.onsuccess=()=>{
   if(done){request.result.close();return}
   db=request.result;db.onversionchange=()=>{db.close();db=null};
   const tx=db.transaction('values','readonly'),read=tx.objectStore('values').getAll();
   read.onsuccess=()=>{
    if(done)return;
    for(const entry of read.result||[]){
     if(clearedBeforeReady||!persistent(localStore,entry.key)||touchedKeys.has(entry.key))continue;
     const current=nativeValue(entry.key);
     // A later native write/removal supersedes an older overflow copy.
     if(current!==MARKER&&current!==entry.baseValue)continue;
     memory(localStore).set(entry.key,entry.value);durableKeys.add(entry.key);
    }
   };
   tx.oncomplete=()=>finish(true);tx.onerror=tx.onabort=()=>{db.close();db=null;finish(false)};
  };
 });
}catch(_){ready=null}
function enqueue(key,value,remove=false){
 if(!ready)return;
 const baseValue=nativeValue(key);
 io=io.then(async()=>{
  if(!await ready||!db)throw Error('Device storage unavailable');
  if(remove){await transaction(store=>store.delete(key));return}
  if(memory(localStore).get(key)!==value)return;
  await transaction(store=>store.put({key,value,baseValue}));
  if(memory(localStore).get(key)===value){
   durableKeys.add(key);
   // Replace the large redundant Web Storage copy only after IndexedDB commits.
   try{nativeStorageSetItem.call(localStore,key,MARKER)}catch(_){}
   refreshStorageNotice();
  }
 }).catch(()=>{if(!remove&&memory(localStore).get(key)===value)storageNotice()});
}
function clearDisposableCaches(storage){
 ['ppms_v3_auto_backup','ppms_v3_auto_backup_time','ppms_error_log_v652'].forEach(key=>{try{nativeStorageRemoveItem.call(storage,key)}catch(_){}});
}
Storage.prototype.getItem=function(key){const map=memory(this),k=String(key);if(map.has(k))return map.get(k);try{const value=nativeStorageGetItem.call(this,k);return value===MARKER?null:value}catch(error){if(!storageUnavailable(error))throw error;return null}};
Storage.prototype.removeItem=function(key){const k=String(key);memory(this).delete(k);if(persistent(this,k)){touchedKeys.add(k);durableKeys.delete(k);enqueue(k,null,true)}try{nativeStorageRemoveItem.call(this,k)}catch(error){if(!storageUnavailable(error))throw error}refreshStorageNotice()};
Storage.prototype.clear=function(){
 if(this===localStore)clearedBeforeReady=true;
 memory(this).clear();if(this===localStore){durableKeys.clear();if(ready)io=io.then(async()=>{if(await ready&&db)await transaction(store=>store.clear())}).catch(()=>{})}
 try{nativeStorageClear.call(this)}catch(error){if(!storageUnavailable(error))throw error}refreshStorageNotice();
};
Storage.prototype.setItem=function(key,value){
 const k=String(key),v=String(value),map=memory(this),canPersist=persistent(this,k);
 if(canPersist&&map.get(k)===v&&durableKeys.has(k))return;
 if(canPersist){touchedKeys.add(k);durableKeys.delete(k)}
 // This automatic snapshot duplicates all photos, exam questions and attendance.
 // The individual records/outboxes below remain intact and are the recovery source.
 if(k==='ppms_v3_auto_backup'&&v.length>LARGE_VALUE){clearDisposableCaches(this);return}
 if(canPersist&&ready&&v.length>LARGE_VALUE){map.set(k,v);enqueue(k,v);return}
 try{nativeStorageSetItem.call(this,k,v);map.delete(k);if(canPersist&&ready)enqueue(k,null,true);refreshStorageNotice();return}catch(error){
  if(!storageUnavailable(error))throw error;
  clearDisposableCaches(this);
  try{nativeStorageSetItem.call(this,k,v);map.delete(k);if(canPersist&&ready)enqueue(k,null,true);refreshStorageNotice();return}catch(second){
   if(!storageUnavailable(second))throw second;
   // Never delete attendance, attachments or pending edits to make room.
   map.set(k,v);if(canPersist&&ready)enqueue(k,v);else storageNotice();
  }
 }
};
function storageNotice(){
 if(!document.body){document.addEventListener('DOMContentLoaded',()=>{if(unsavedKeys().length)storageNotice()},{once:true});return}
 if(document.getElementById('ppmsStorageNotice'))return;
 const bar=document.createElement('div');bar.id='ppmsStorageNotice';bar.setAttribute('role','status');bar.style.cssText='position:relative;z-index:100001;margin:8px 12px;background:#92400e;color:white;padding:12px;border-radius:9px;font:13px system-ui';bar.textContent='ยังเก็บข้อมูลในเครื่องไม่ได้ กรุณารอให้บันทึกขึ้นระบบสำเร็จก่อนปิดหรือรีเฟรช';document.body.prepend(bar);
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
window.ppmsErrorGuard={version:'873',ready,logs:()=>{try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(_){return[]}},clear:()=>localStorage.removeItem(LOG_KEY),pendingStorageKeys:unsavedKeys,retryStorage:()=>{for(const [key,value]of [...memory(localStorage)])if(!durableKeys.has(key))localStorage.setItem(key,value);refreshStorageNotice();return !unsavedKeys().length},flushStorage:async(keys=null)=>{if(ready)await ready;await io;refreshStorageNotice();return !(keys?unsavedKeys().filter(key=>keys.includes(key)):unsavedKeys()).length}};
window.addEventListener('online',()=>window.ppmsErrorGuard.retryStorage());
})();
