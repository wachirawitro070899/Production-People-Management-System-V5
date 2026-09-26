/* V754: standalone Employee Skill Card renderer. */
(function(){
 'use strict';
 const SECTION_SKILLS={
  'Engineering Support Section':['Safety','Quality System','Process Improvement','Drawing / Specification','Problem Solving','Training & Coaching','Project Management'],
  'Support Production Section':['Safety','Document Control','Production Planning','Material Control','ERP / Record','5S','Communication'],
  'Machine Maintenance Section':['Safety','Preventive Maintenance','Breakdown Repair','Electrical','Mechanical','Spare Part Control','5S'],
  'Tooling Maintenance Section':['Safety','Die Maintenance','Grinding','Tool Assembly','Drawing Reading','Troubleshooting','5S'],
  'Sorting Section':['Safety','Visual Inspection','Defect Criteria','Measurement','Traceability','Packing','5S'],
  'Stamping Section':['Safety','Machine Operation','Die Setup','First Piece Inspection','Quality Check','OEE Record','5S'],
  'Welding Section':['Safety','Welding Operation','Jig Setup','Parameter Check','Visual Inspection','Poka-Yoke','5S'],
  'CNC Section':['Safety','Machine Operation','Program Selection','Tool Offset','Measurement','Quality Check','5S'],
  'Tapping Section':['Safety','Machine Operation','Tool Setup','Thread Inspection','Measurement','Quality Check','5S'],
  'Bending Section':['Safety','Machine Operation','Die Setup','Angle Inspection','Measurement','Quality Check','5S']
 };
 const fallbackSkills=['Safety','Quality','Machine Operation','Inspection','Problem Solving','5S','Training'];
 const html=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const skillsFor=section=>SECTION_SKILLS[section]||fallbackSkills;
 const levelFor=(employee,skill)=>Math.max(1,Math.min(5,Number((employee.skillLevels||{})[skill]||employee.currentSkillLevel||1)));
 const scoreFor=(employee,skills)=>skills.reduce((sum,skill)=>sum+levelFor(employee,skill),0);
 function rankFor(score,count){const average=score/Math.max(1,count);if(average>=4.5)return{level:5,label:'Expert'};if(average>=3.5)return{level:4,label:'Advanced'};if(average>=2.5)return{level:3,label:'Qualified'};if(average>=1.5)return{level:2,label:'Developing'};return{level:1,label:'Beginner'}}
 function datesFor(employee){const last=String(employee.skillUpdatedAt||new Date().toISOString().slice(0,10)).slice(0,10),date=new Date(last);if(Number.isNaN(date.getTime()))return{last:'-',next:'-'};date.setMonth(date.getMonth()+3);return{last,next:date.toISOString().slice(0,10)}}
 function logoSrc(){return document.querySelector('header .logo img')?.src||document.querySelector('.brand .logo img')?.src||''}
 function employeeAvatar(employee){const name=html(employee.name||employee.id||'Employee');if(employee.photo)return `<img class="avatar" src="${html(employee.photo)}" alt="${name}">`;const initials=String(employee.name||employee.id||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase();return `<span class="avatar avatar-fallback" aria-label="${name}">${html(initials||'?')}</span>`}
 function examUrl(employee){try{const url=new URL(location.href);url.searchParams.set('exam','1');url.searchParams.set('employee',String(employee.id||''));url.hash='examination';return url.toString()}catch{return location.href}}
 window.skillReportLogoSrc=logoSrc;
 window.walletCardMarkup=function walletCardMarkup(employee,side='front'){
  if(!employee||typeof employee!=='object')return '<div class="panel">ไม่พบข้อมูลพนักงาน</div>';
  const skills=skillsFor(employee.section),values=skills.map(skill=>levelFor(employee,skill)),score=scoreFor(employee,skills),rank=rankFor(score,skills.length),dates=datesFor(employee),logo=logoSrc(),logoHtml=logo?`<img src="${html(logo)}" alt="JR">`:'';
  if(side==='back'){const rows=skills.map((skill,index)=>`<div class="wallet-skill-row"><span>${html(skill)}</span><b class="level-box level-${values[index]}">${values[index]}</b></div>`).join('');return `<section class="employee-skill-card wallet-card wallet-back" data-employee-id="${html(employee.id)}"><div class="wallet-banner"><div class="wallet-logo">${logoHtml}</div><div><strong>SKILL LEVEL</strong><small>${html(employee.id)} · ${html(employee.name)}</small></div></div><div class="wallet-skills">${rows}</div><div class="wallet-back-footer"><span>1 Basic</span><span>2 Operation</span><span>3 Independent</span><span>4 Advanced</span><span>5 Trainer</span></div></section>`}
  return `<section class="employee-skill-card wallet-card wallet-front" data-employee-id="${html(employee.id)}"><div class="wallet-banner"><div class="wallet-logo">${logoHtml}</div><div><strong>EMPLOYEE COMPETENCY CARD</strong><small>Production Division</small></div><span>LEVEL ${rank.level}</span></div><div class="wallet-main">${employeeAvatar(employee)}<div class="wallet-person"><h2>${html(employee.name)}</h2><p>${html(employee.thaiName||'')}</p><dl><dt>Emp.ID</dt><dd>${html(employee.id)}</dd><dt>Position</dt><dd>${html(employee.position)}</dd><dt>Section</dt><dd>${html(employee.section)}</dd><dt>Updated</dt><dd>${html(dates.last)}</dd></dl></div><div class="wallet-side"><div class="wallet-score"><small>SCORE</small><b>${score}</b><span>/${skills.length*5}</span></div><div class="wallet-qr" data-qr="${html(examUrl(employee))}" title="Scan to open Employee Examination"></div></div></div><div class="wallet-footer"><b>${rank.label}</b><span>Next: ${html(dates.next)}</span></div></section>`;
 };
})();


/* V759: Employee machine/OEE/Capacity work history under the individual Skill Card. */
(function(){
 'use strict';
 const API='https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
 const PANEL_ID='employee-work-history-panel';
 const STYLE_ID='employee-work-history-style';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const fmt=value=>Number(value||0).toLocaleString('th-TH',{maximumFractionDigits:1});
 let timer=0,debounce=0,activeCode='',requestNo=0;

 function addStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=
   '.employee-work-history{margin:22px 0;padding:20px;background:#fff;border:1px solid #e5e7eb;border-top:4px solid #b91c1c;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.08)}'+
   '.employee-work-history__head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.employee-work-history h3{margin:0;color:#991b1b}.employee-work-history p{margin:5px 0 0;color:#64748b}'+
   '.employee-work-history__refresh{border:1px solid #b91c1c;background:#fff;color:#991b1b;border-radius:9px;padding:8px 12px;cursor:pointer;font-weight:700}.employee-work-history__refresh:disabled{opacity:.55;cursor:wait}'+
   '.employee-work-history__summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.employee-work-history__summary span{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;color:#475569}.employee-work-history__summary b{display:block;color:#0f172a;font-size:18px}'+
   '.employee-work-history__table{overflow:auto;border:1px solid #e2e8f0;border-radius:10px}.employee-work-history table{width:100%;border-collapse:collapse;min-width:900px}.employee-work-history th,.employee-work-history td{padding:11px 12px;border-bottom:1px solid #e2e8f0;text-align:center;vertical-align:top}.employee-work-history th{background:#f1f5f9;color:#334155;white-space:nowrap}.employee-work-history td strong,.employee-work-history td small{display:block}.employee-work-history td small{margin-top:4px;color:#64748b}'+
   '.employee-work-history__status{display:inline-block;padding:4px 9px;border-radius:999px;font-weight:800}.employee-work-history__status.pass{background:#dcfce7;color:#15803d}.employee-work-history__status.pending{background:#fef3c7;color:#b45309}.employee-work-history__status.fail{background:#fee2e2;color:#b91c1c}'+
   '.employee-work-history__message{text-align:center;padding:24px;color:#64748b}.employee-work-history__message.error{color:#b91c1c}'+
   '@media(max-width:760px){.employee-work-history{padding:14px}.employee-work-history__head{display:block}.employee-work-history__refresh{margin-top:10px}.employee-work-history__summary{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
   '@media print{.employee-work-history{display:none!important}}';
  document.head.appendChild(style);
 }

 function visibleSkillCode(){
  const app=document.getElementById('app');
  if(!app)return '';
  const cards=[...app.querySelectorAll('.employee-skill-card[data-employee-id]')];
  const codes=[...new Set(cards.map(card=>String(card.getAttribute('data-employee-id')||'').trim()).filter(Boolean))];
  return codes.length===1?codes[0]:'';
 }

 function panelFor(code){
  const app=document.getElementById('app');
  if(!app)return null;
  let panel=document.getElementById(PANEL_ID);
  if(panel&&panel.dataset.employeeCode!==code){panel.remove();panel=null}
  if(panel)return panel;
  panel=document.createElement('section');
  panel.id=PANEL_ID;
  panel.className='employee-work-history no-print';
  panel.dataset.employeeCode=code;
  panel.innerHTML='<div class="employee-work-history__message">กำลังโหลดประวัติการทำงาน...</div>';
  app.appendChild(panel);
  return panel;
 }

 function statusClass(row){
  if(row?.passed)return 'pass';
  return row?.status==='ต่ำกว่าเกณฑ์'?'fail':'pending';
 }

 function render(panel,data){
  const rows=Array.isArray(data?.history)?data.history:[];
  const scored=rows.filter(row=>Number.isFinite(Number(row.rate)));
  const passed=rows.filter(row=>row.passed).length;
  const pending=rows.filter(row=>!row.passed&&row.status!=='ต่ำกว่าเกณฑ์').length;
  const average=scored.length?scored.reduce((sum,row)=>sum+Number(row.rate),0)/scored.length:null;
  const body=rows.map(row=>{
   const time=row.scannedAt?new Date(row.scannedAt).toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'}):'—';
   const parts=(row.parts||[]).join(', ')||'รอรายการ OEE';
   const pendingParts=(row.pendingParts||[]).join(', ');
   const result=row.rate==null?'—':fmt(row.rate)+'%';
   return '<tr>'+
    '<td>'+esc(row.workDate)+'<small>'+esc(row.shift)+'</small></td>'+
    '<td><strong>'+esc(row.machine)+'</strong><small>'+esc(parts)+'</small></td>'+
    '<td>'+esc(time)+' น.<small>สแกน '+esc(row.scanCount)+' ครั้ง</small></td>'+
    '<td><strong>'+(row.good?fmt(row.good)+' ชิ้นดี':'—')+'</strong>'+(row.pendingGood?'<small>มี Cap '+fmt(row.verifiedGood)+' · รอตรวจ '+fmt(row.pendingGood)+'</small>':'')+'</td>'+
    '<td><span class="employee-work-history__status '+statusClass(row)+'">'+esc(row.status)+'</span>'+(row.rate==null?'':'<small>ทำได้ '+esc(result)+' · เป้า '+fmt(row.targetPercent)+'%</small>')+(pendingParts?'<small>รอตรวจ: '+esc(pendingParts)+' · ยังไม่สรุปผ่านทั้งกะ</small>':'')+'</td>'+
   '</tr>';
  }).join('');
  panel.innerHTML=
   '<div class="employee-work-history__head"><div><h3>ประวัติการทำงานจาก OEE / Employee Work History</h3><p>รหัส '+esc(data?.employee?.code||panel.dataset.employeeCode)+' · เชื่อมจากการสแกนหน้าเครื่องและคำนวณกับ Cap ของเครื่อง–Part–Step</p></div><button type="button" class="employee-work-history__refresh">อัปเดตข้อมูล</button></div>'+
   '<div class="employee-work-history__summary"><span><b>'+fmt(rows.length)+'</b>กะที่สแกน</span><span><b>'+fmt(passed)+'</b>ถึงเกณฑ์</span><span><b>'+fmt(pending)+'</b>รอตรวจ</span><span><b>'+(average==null?'—':fmt(average)+'%')+'</b>ค่าเฉลี่ยที่คำนวณได้</span></div>'+
   '<div class="employee-work-history__table"><table><thead><tr><th>วัน / กะ</th><th>เครื่อง / Part</th><th>เวลาสแกน</th><th>ผลผลิต OEE</th><th>ผลเทียบ Cap</th></tr></thead><tbody>'+(body||'<tr><td colspan="5"><div class="employee-work-history__message">ยังไม่มีประวัติการสแกนเครื่องของพนักงานคนนี้</div></td></tr>')+'</tbody></table></div>';
  panel.querySelector('.employee-work-history__refresh')?.addEventListener('click',()=>load(panel.dataset.employeeCode||'',true));
 }

 async function load(code,manual=false){
  const panel=panelFor(code);
  if(!panel)return;
  const refresh=panel.querySelector('.employee-work-history__refresh');
  if(refresh)refresh.disabled=true;
  const current=++requestNo;
  try{
   const response=await fetch(API+'?code='+encodeURIComponent(code),{cache:'no-store',mode:'cors'});
   const data=await response.json();
   if(!response.ok)throw new Error(data?.error||'โหลดประวัติการทำงานไม่สำเร็จ');
   if(current!==requestNo||panel.dataset.employeeCode!==code)return;
   render(panel,data);
  }catch(error){
   if(current!==requestNo)return;
   panel.innerHTML='<div class="employee-work-history__message error">'+esc(error?.message||'ไม่สามารถเชื่อมข้อมูลประวัติการทำงานได้')+'<br><button type="button" class="employee-work-history__refresh">ลองใหม่</button></div>';
   panel.querySelector('.employee-work-history__refresh')?.addEventListener('click',()=>load(code,true));
  }finally{
   const button=panel.querySelector('.employee-work-history__refresh');
   if(button)button.disabled=false;
   if(manual)panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
 }

 function sync(){
  const code=visibleSkillCode();
  const old=document.getElementById(PANEL_ID);
  if(!code){
   activeCode='';
   if(old)old.remove();
   return;
  }
  if(code===activeCode&&old)return;
  activeCode=code;
  load(code);
 }

 function schedule(){
  clearTimeout(debounce);
  debounce=setTimeout(sync,180);
 }

 addStyles();
 document.addEventListener('DOMContentLoaded',()=>{
  schedule();
  const app=document.getElementById('app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-employee-id']});
  clearInterval(timer);
  timer=setInterval(()=>{if(document.visibilityState==='visible'&&activeCode)load(activeCode)},60000);
 });
 window.PPMSWorkHistory={refresh:()=>activeCode&&load(activeCode,true)};
 window.PPMS_EMPLOYEE_HISTORY_VERSION='V759';
})();
