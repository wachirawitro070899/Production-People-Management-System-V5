/* Date-linked production KPI and monthly qualifying days. */
(()=>{
 'use strict';
 const service=window.PPMS_PRODUCTION_KPI,cache=new Map(),pending=new Map();
 const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const number=value=>Number(value||0).toLocaleString('th-TH',{maximumFractionDigits:1});
 const key=(code,month)=>JSON.stringify([code,month]);
 let revision=0;
 function resultMarkup(row,online){
  const label=!online||!service.confirmed(row)?'รอตรวจ':row.passed===true?'ถึงเกณฑ์':'ไม่ถึงเกณฑ์';
  return `<div style="margin:3px 0 6px"><b>${escape(row.machine)}</b> · <b>${Number.isFinite(row.rate)?number(row.rate)+'%':'—'}</b> · <span style="color:${label==='ถึงเกณฑ์'?'#16734a':label==='รอตรวจ'?'#775f24':'#a12c2c'}">${label}</span></div>`;
 }
 function prepare(){
  const code=document.querySelector('#employeeForm input[name="id"]')?.value?.trim();if(!code)return;
  for(const panel of document.querySelectorAll('.employee-attendance-history')){
   panel.dataset.productionEmployee||=code;
   const table=panel.querySelector('table'),header=table?.querySelector('thead tr');if(!header)continue;
   if(!header.querySelector('[data-production-heading]')){const th=document.createElement('th');th.dataset.productionHeading='true';th.textContent='KPI การผลิต';th.style.minWidth='200px';header.append(th);}
   for(const row of table.querySelectorAll('tbody tr')){
    if(row.querySelector('[data-production-date]'))continue;
    const date=row.cells[0]?.textContent?.trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')){if(row.cells.length===1)row.cells[0].colSpan=6;continue;}
    const cell=row.insertCell();cell.dataset.productionDate=date;delete panel.dataset.productionAt;cell.textContent='กำลังดึง KPI...';cell.style.minWidth='200px';
   }
   if(!panel.querySelector('[data-production-monthly]')){
    const section=document.createElement('section');section.dataset.productionMonthly='true';section.style.marginTop='16px';
    section.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3 style="margin:0">สรุป KPI การผลิตรายเดือน</h3><label>เดือน <input type="month" data-production-month value="${service.today().slice(0,7)}" aria-label="เดือนสรุป KPI การผลิต"></label><button type="button" class="secondary" data-production-refresh>อัปเดตข้อมูล</button></div><p class="modal-note">นับวันละ 1 วัน เมื่อมีสแกน QR หน้าเครื่องและทุกเครื่องถึงเกณฑ์ · วันที่รอตรวจยังไม่นับเป็นวันผ่าน</p><div data-production-month-results>กำลังดึงข้อมูล...</div>`;
    section.querySelector('[data-production-month]').addEventListener('change',()=>{delete panel.dataset.productionAt;update();});
    section.querySelector('[data-production-refresh]').onclick=()=>refresh(panel,true);
    panel.append(section);delete panel.dataset.productionAt;
   }
  }
 }
 function monthsFor(panel){return [...new Set([panel.querySelector('[data-production-month]')?.value,...[...panel.querySelectorAll('[data-production-date]')].map(cell=>cell.dataset.productionDate.slice(0,7))])].filter(month=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''));}
 function renderMonth(panel){
  const content=panel.querySelector('[data-production-month-results]');if(!content)return;
  const month=panel.querySelector('[data-production-month]').value;
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){content.textContent='กรุณาเลือกเดือน';return;}
  const saved=cache.get(key(panel.dataset.productionEmployee,month)),data=saved?.data,error=saved?.error;
  if(!data){content.textContent=error||'กำลังดึงข้อมูล...';return;}
  const online=data.online!==false&&!error,summary=service.summarize(data.history,month,online),passed=summary.days.filter(day=>day.status==='ถึงเกณฑ์');
  content.innerHTML=`<div class="cards" style="margin:10px 0"><div class="card metric">วันถึงเกณฑ์ KPI<b style="color:#16734a">${summary.passed} วัน</b></div><div class="card metric">วันไม่ถึงเกณฑ์<b>${summary.failed} วัน</b></div><div class="card metric">วันรอตรวจ<b>${summary.waiting} วัน</b></div></div><p><b>วันที่ถึงเกณฑ์:</b> ${passed.length?passed.map(day=>escape(day.date)).join(', '):'—'}</p><div class="table-wrap"><table><thead><tr><th>วันที่ผลิต</th><th>เครื่อง · ทำได้ · ผล KPI</th><th>ผลรายวัน</th></tr></thead><tbody>${summary.days.map(day=>`<tr><td>${escape(day.date)}</td><td>${day.rows.map(row=>resultMarkup(row,online)).join('')}</td><td><b>${day.status}</b>${!day.scan?'<small style="display:block">วันที่สแกน QR ไม่ตรงกับวันที่ผลิต</small>':''}</td></tr>`).join('')||'<tr><td colspan="3">ไม่มีการผลิต</td></tr>'}</tbody></table></div>${error?`<p class="modal-note">${escape(error)} · รอตรวจข้อมูลล่าสุดก่อนนับวันผ่าน</p>`:''}`;
 }
 function display(panel){
  for(const cell of panel.querySelectorAll('[data-production-date]')){
   const saved=cache.get(key(panel.dataset.productionEmployee,cell.dataset.productionDate.slice(0,7))),data=saved?.data,error=saved?.error;
   if(!data){cell.textContent=error||'กำลังดึง KPI...';continue;}
   const rows=service.unique(data.history).filter(row=>row.workDate===cell.dataset.productionDate);
   cell.innerHTML=rows.length?rows.map(row=>resultMarkup(row,data.online!==false&&!error)).join(''):error?'ยังเชื่อม KPI ไม่ได้':'—';
  }
  renderMonth(panel);
 }
 async function read(code,month,force=false){
  const id=key(code,month);if(pending.has(id))return pending.get(id);
  const job=(async()=>{
   try{const payload=await service.read([code],month,{force}),data=payload.histories.find(item=>item.employeeCode===code);cache.set(id,{data,at:Date.now(),revision:++revision});}
   catch(error){cache.set(id,{data:cache.get(id)?.data,error:error.message,at:Date.now(),revision:++revision});}
   finally{pending.delete(id);update();}
  })();pending.set(id,job);return job;
 }
 function refresh(panel,force=false){for(const month of monthsFor(panel)){const code=panel.dataset.productionEmployee,saved=cache.get(key(code,month));if(force||!saved||Date.now()-saved.at>=15000)void read(code,month,force);}}
 function update(){
  if(!service||document.visibilityState!=='visible')return;
  prepare();
  for(const panel of document.querySelectorAll('.employee-attendance-history[data-production-employee]')){
   const months=monthsFor(panel),stamp=JSON.stringify([panel.querySelector('[data-production-month]')?.value,...months.map(month=>cache.get(key(panel.dataset.productionEmployee,month))?.revision||0)]);
   if(panel.dataset.productionAt!==stamp){panel.dataset.productionAt=stamp;display(panel);}
   refresh(panel);
  }
 }
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;update();});}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',update);window.addEventListener('online',update);setInterval(update,15000);update();
})();
