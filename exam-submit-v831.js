// Send only this submission; do not wait for the master roster socket or array.
(()=>{'use strict';
async function submit(key,record,recover=false){
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');
 if(!base)throw Error('ไม่พบการตั้งค่า Firebase');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 async function request(path,options={}){
  const response=await fetch(base+'/ppms'+(path?'/'+path:'')+'.json',{...options,signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw Error('Firebase ไม่ยืนยันผลสอบ ('+response.status+')');
  return await response.json();
 }
 try{
  if(recover){
   const existing=await request('examResultsByKey/'+encodeURIComponent(key));
   if(existing){
    if(String(existing.employeeId)!==String(record.employeeId)||existing.createdAt!==record.createdAt)throw Error('ข้อมูลยืนยันผลสอบไม่ตรงกัน');
    return existing;
   }
  }
  const receivedAt=new Date().toISOString();
  const notifications={};
  if((record.examType||'quarterly')==='quarterly'&&/^Q[1-4]$/.test(record.quarter||'')){
   const safe=value=>btoa(unescape(encodeURIComponent(String(value)))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
   const division=record.organizationDivision||'Production Division',plant=record.organizationPlant||'โรง 1',section=String(record.section||''),year=Number(record.trainingPlan?.year||String(record.date||record.createdAt).slice(0,4));
   if(section&&Number.isInteger(year)&&year>=2020&&year<=2100){
    const sectionKey=division==='Production Division'&&plant==='โรง 1'?safe(section):'scope_'+safe(division+'::'+plant+'::'+section);
    notifications['trainingExamNotifications/'+year+'/'+sectionKey+'/'+record.quarter+'/'+safe(record.employeeId)]={employeeId:String(record.employeeId),employeeName:record.employeeName||'',section,year,quarter:record.quarter,examType:'quarterly',organizationDivision:division,organizationPlant:plant,score:Number(record.score),result:record.result||'',approvalStatus:record.approvalStatus||'',forcedExit:!!record.forcedExit,date:record.date||'',createdAt:record.createdAt,resultId:record.createdAt,recordKey:record.examRecordKey||key,trainingPlanRevision:record.trainingPlan?.revision||'',receivedAt};
   }
  }
  await request('',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   ['examResultsByKey/'+key]:{...record,canonicalReceivedAt:receivedAt,canonicalVersion:'V831'},
   ['examResultInbox/'+key]:{...record,inboxReceivedAt:receivedAt,inboxVersion:'V831'},
   ...notifications
  })});
  const confirmed=await request('examResultsByKey/'+encodeURIComponent(key));
  if(!confirmed||String(confirmed.employeeId)!==String(record.employeeId)||confirmed.createdAt!==record.createdAt||Number(confirmed.score)!==Number(record.score))throw Error('Firebase ยังไม่ยืนยันผลสอบที่ส่ง');
  return confirmed;
 }catch(error){if(error.name==='AbortError')throw Error('ส่งผลสอบหมดเวลา • เก็บผลสอบไว้และจะส่งซ้ำอัตโนมัติ');throw error}
 finally{clearTimeout(timer)}
}
window.PPMS_EXAM_SUBMIT_SERVICE={submit};
})();
