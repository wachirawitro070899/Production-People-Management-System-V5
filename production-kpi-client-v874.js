/* Shared read-only KPI integration for employee cards and monthly Section reports. */
(()=>{
 'use strict';
 const endpoint='https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/ppms/employee-kpi';
 const cache=new Map(),pending=new Map(),ttl=15000;
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const key=(code,month)=>JSON.stringify([month,code]);
 const confirmed=row=>Number.isFinite(row?.rate)&&['ถึงเกณฑ์','ต่ำกว่าเกณฑ์','ไม่ถึงเกณฑ์'].includes(row.status);
 const scanOnDate=row=>{
  if(row?.source==='sorting_oee')return row.workDateVerified===true&&/^\d{4}-\d{2}-\d{2}$/.test(row.workDate||'')&&row.workDate<=today();
  const stamp=new Date(row.scannedAt);
  return !Number.isNaN(stamp.getTime())&&new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(stamp)===row.workDate;
 };
 function unique(history){
  const rows=new Map();
  for(const row of history||[]){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(row?.workDate||'')||row.workDate>today())continue;
   const id=JSON.stringify([row.workDate,row.shift,row.machine,row.source||'machine_scan']);if(!rows.has(id))rows.set(id,row);
  }
  return [...rows.values()];
 }
 function summarize(history,month,online=true){
  const dates=new Map();
  for(const row of unique(history).filter(row=>row.workDate.startsWith(month+'-'))){const rows=dates.get(row.workDate)||[];rows.push(row);dates.set(row.workDate,rows);}
  const days=[...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>{
   const scan=rows.every(scanOnDate),status=!online||!scan||rows.some(row=>!confirmed(row))?'รอตรวจ':rows.every(row=>row.passed===true)?'ถึงเกณฑ์':'ไม่ถึงเกณฑ์';
   return {date,rows,scan,checkedIn:scan,status};
  });
  return {days,passed:days.filter(day=>day.status==='ถึงเกณฑ์').length,failed:days.filter(day=>day.status==='ไม่ถึงเกณฑ์').length,waiting:days.filter(day=>day.status==='รอตรวจ').length};
 }
 async function request(codes,month){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
  try{
   const query=new URLSearchParams({month,codes:codes.join(',')});
   // The browser supplies Origin; the feed explicitly permits the PPMS origin.
   const response=await fetch(endpoint+'?'+query,{cache:'no-store',credentials:'omit',signal:controller.signal});
   const payload=await response.json();
   if(!response.ok)throw Error(payload?.error||'ยังเชื่อม KPI การผลิตไม่ได้');
   if(payload?.month!==month||!Array.isArray(payload.histories))throw Error('รูปแบบข้อมูล KPI ไม่ครบ กรุณาลองอีกครั้ง');
   const histories=new Map(payload.histories.map(item=>[String(item.employeeCode),item]));
   if(codes.some(code=>!Array.isArray(histories.get(code)?.history)))throw Error('ผล KPI ของพนักงานไม่ครบ กรุณาลองอีกครั้ง');
   for(const code of codes){const item=histories.get(code);cache.set(key(code,month),{...item,online:payload.online!==false&&item.online!==false,asOf:payload.asOf||'',at:Date.now()});}
  }catch(error){if(error.name==='AbortError')throw Error('เชื่อม KPI หมดเวลา กรุณากดอัปเดตข้อมูลอีกครั้ง');throw error;}
  finally{clearTimeout(timer);}
 }
 async function read(values,month,{force=false}={}){
  const codes=[...new Set(values.map(value=>String(value).trim()).filter(Boolean))];
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||codes.some(code=>code.length>64))throw Error('ระบุเดือนและรหัสพนักงานให้ถูกต้อง');
  const missing=codes.filter(code=>{const saved=cache.get(key(code,month));return force||!saved||Date.now()-saved.at>=ttl;});
  const needed=missing.filter(code=>!pending.has(key(code,month)));
  for(let i=0;i<needed.length;i+=500){
   const batch=needed.slice(i,i+500);
   const job=request(batch,month).finally(()=>{for(const code of batch)if(pending.get(key(code,month))===job)pending.delete(key(code,month));});
   for(const code of batch)pending.set(key(code,month),job);
  }
  await Promise.all([...new Set(missing.map(code=>pending.get(key(code,month))).filter(Boolean))]);
  const histories=codes.map(code=>cache.get(key(code,month)));
  return {month,histories,online:!histories.length||histories.some(item=>item?.online!==false),asOf:histories.map(item=>item.asOf).filter(Boolean).sort()[0]||''};
 }
 window.PPMS_PRODUCTION_KPI={read,summarize,unique,confirmed,scanOnDate,today};
})();

