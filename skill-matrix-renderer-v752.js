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
 const levelFor=(employee,skill)=>Math.max(1,Math.min(4,Number((employee.skillLevels||{})[skill]||employee.currentSkillLevel||1)));
 const scoreFor=(employee,skills)=>skills.reduce((sum,skill)=>sum+levelFor(employee,skill),0);
 function rankFor(score,count){const average=score/Math.max(1,count);if(average>=3.5)return{level:4,label:'Advanced'};if(average>=2.5)return{level:3,label:'Qualified'};if(average>=1.5)return{level:2,label:'Developing'};return{level:1,label:'Beginner'}}
 function datesFor(employee){const last=String(employee.skillUpdatedAt||new Date().toISOString().slice(0,10)).slice(0,10),date=new Date(last);if(Number.isNaN(date.getTime()))return{last:'-',next:'-'};date.setMonth(date.getMonth()+3);return{last,next:date.toISOString().slice(0,10)}}
 function logoSrc(){return document.querySelector('header .logo img')?.src||document.querySelector('.brand .logo img')?.src||''}
 function employeeAvatar(employee){
  if(window.PPMSEmployeePhotos)return window.PPMSEmployeePhotos.markup(employee,true);
  const name=html(employee.name||employee.id||'Employee');
  // Admin and Leader uploads use photoData; photo is the legacy field.
  const sources=[...new Set([employee.photoData,employee.photoUrl,employee.photo].filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()))];
  const initials=String(employee.name||employee.id||'?').replace(/^(?:MR|MS|MRS)\.?\s+/i,'').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'?';
  if(!sources.length)return `<span class="avatar avatar-lg avatar-fallback" aria-label="${name}">${html(initials)}</span>`;
  // Keep fallback handling on the image so it also works in the isolated print window.
  return `<img class="avatar avatar-lg" src="${html(sources[0])}" alt="${name}" data-photo-sources="${html(JSON.stringify(sources.slice(1)))}" data-initials="${html(initials)}" onerror="var sources=JSON.parse(this.dataset.photoSources||'[]');if(sources.length){this.dataset.photoSources=JSON.stringify(sources.slice(1));this.src=sources[0]}else{this.onerror=null;var fallback=this.ownerDocument.createElement('span');fallback.className='avatar avatar-lg avatar-fallback';fallback.setAttribute('aria-label',this.alt);fallback.textContent=this.dataset.initials;this.replaceWith(fallback)}">`;
 }
 function examUrl(employee){try{const url=new URL(location.href);url.searchParams.set('exam','1');url.searchParams.set('employee',String(employee.id||''));url.hash='examination';return url.toString()}catch{return location.href}}
 window.skillReportLogoSrc=logoSrc;
 const supervisionLevels=[
  'เริ่มเรียนรู้ · ต้องมีผู้ควบคุมตลอดเวลา',
  'ทำได้บางส่วน · ต้องมีผู้ควบคุมใกล้ชิด',
  'ทำงานได้เอง · แจ้งหัวหน้าเมื่อผิดปกติ',
  'ชำนาญ · ทำงานเอง แก้ปัญหาและฝึกสอนผู้อื่น (สูงสุด)'
 ];
 function supervisionLegend(){return '<div class="wallet-back-footer wallet-supervision-legend" role="list" aria-label="ความสามารถและการควบคุมดูแล ระดับ 1–4">'+supervisionLevels.map((description,index)=>`<div class="wallet-supervision-level" role="listitem"><b class="level-${index+1}">${index+1}</b><span>${html(description)}</span></div>`).join('')+'</div>'}
 window.walletCardMarkup=function walletCardMarkup(employee,side='front'){
  if(!employee||typeof employee!=='object')return '<div class="panel">ไม่พบข้อมูลพนักงาน</div>';
  const skills=skillsFor(employee.section),values=skills.map(skill=>levelFor(employee,skill)),score=scoreFor(employee,skills),rank=rankFor(score,skills.length),dates=datesFor(employee),logo=logoSrc(),logoHtml=logo?`<img src="${html(logo)}" alt="JR">`:'';
  if(side==='back'){const rows=skills.map((skill,index)=>`<div class="wallet-skill-row"><span>${html(skill)}</span><b class="level-box level-${values[index]}">${values[index]}</b></div>`).join('');return `<section class="employee-skill-card wallet-card wallet-back wallet-back-supervision" data-employee-id="${html(employee.id)}"><div class="wallet-banner"><div class="wallet-logo">${logoHtml}</div><div><strong>SKILL LEVEL</strong><small>${html(employee.id)} · ${html(employee.name)}</small></div></div><div class="wallet-skills">${rows}</div>${supervisionLegend()}</section>`}
  return `<section class="employee-skill-card wallet-card wallet-front" data-employee-id="${html(employee.id)}"><div class="wallet-banner"><div class="wallet-logo">${logoHtml}</div><div><strong>EMPLOYEE COMPETENCY CARD</strong><small>Production Division</small></div><span>LEVEL ${rank.level}</span></div><div class="wallet-main">${employeeAvatar(employee)}<div class="wallet-person"><h2>${html(employee.name)}</h2><p>${html(employee.thaiName||'')}</p><dl><dt>Emp.ID</dt><dd>${html(employee.id)}</dd><dt>Position</dt><dd>${html(employee.position)}</dd><dt>Section</dt><dd>${html(employee.section)}</dd><dt>Updated</dt><dd>${html(dates.last)}</dd></dl></div><div class="wallet-side"><div class="wallet-score"><small>SCORE</small><b>${score}</b><span>/${skills.length*4}</span></div><div class="wallet-qr" data-qr="${html(examUrl(employee))}" title="Scan to open Employee Examination"></div></div></div><div class="wallet-footer"><b>${rank.label}</b><span>Next: ${html(dates.next)}</span></div></section>`;
 };
})();

/* V761: Show OEE / Capacity KPI in each employee's daily attendance history, not the Skill Card. */
(function(){
 'use strict';
 const API='https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
 const CLASS_NAME='ppms-daily-production-kpi';
 const STYLE_ID='ppms-daily-production-kpi-style';
 let activeCode='',history=[],requestNo=0,debounce=0,timer=0;

 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const fmt=value=>Number(value||0).toLocaleString('th-TH',{maximumFractionDigits:1});

 function addStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=
   '.'+CLASS_NAME+'{margin-top:6px;padding:7px 9px;text-align:left;border-left:3px solid #d97706;border-radius:6px;background:#fffbeb;line-height:1.35;font-size:12px}'+
   '.'+CLASS_NAME+'.pass{border-left-color:#16a34a;background:#f0fdf4}.'+CLASS_NAME+'.fail{border-left-color:#dc2626;background:#fef2f2}'+
   '.'+CLASS_NAME+' b,.'+CLASS_NAME+' span,.'+CLASS_NAME+' small{display:block}.'+CLASS_NAME+' span{margin:2px 0}.'+CLASS_NAME+' small{color:#475569}'+
   '@media print{.'+CLASS_NAME+'{break-inside:avoid}}';
  document.head.appendChild(style);
 }

 function monthlyCard(){
  return document.querySelector('.attendance-checksheet:not(.attendance-checksheet-group) table.monthly-checksheet-table')?.closest('.attendance-checksheet')||null;
 }

 function employeeCode(card){
  const selected=String(document.getElementById('attendanceKpiEmployee')?.value||'').trim();
  if(selected)return selected;
  const label=String(card?.querySelector('.checksheet-head p b')?.textContent||'').trim();
  return label.split('·')[0].trim();
 }

 function monthAndYear(){
  const now=new Date();
  return {
   year:String(document.getElementById('attendanceYear')?.value||new Intl.DateTimeFormat('en',{timeZone:'Asia/Bangkok',year:'numeric'}).format(now)),
   month:String(document.getElementById('attendanceMonth')?.value||new Intl.DateTimeFormat('en',{timeZone:'Asia/Bangkok',month:'numeric'}).format(now)).padStart(2,'0')
  };
 }

 function statusClass(item){
  if(item?.passed)return 'pass';
  return item?.status==='ต่ำกว่าเกณฑ์'?'fail':'pending';
 }

 function markup(item){
  const parts=Array.isArray(item?.parts)&&item.parts.length?item.parts.join(', '):'รอรายการ OEE';
  const pending=Array.isArray(item?.pendingParts)&&item.pendingParts.length?item.pendingParts.join(', '):'';
  const qty=item?.good==null?'—':fmt(item.good)+' ชิ้นดี';
  const rate=item?.rate==null?'รอตรวจ Cap':fmt(item.rate)+'%';
  const outcome=item?.rate==null?(pending?'รอตรวจ Cap: '+pending:'ยังคำนวณ KPI ไม่ได้'):(String(item.status||'รอตรวจ')+' · เป้า '+fmt(item.targetPercent)+'%');
  return '<div class="'+CLASS_NAME+' '+statusClass(item)+'">'+
   '<b>ผลผลิต '+esc(item.machine||'—')+' · '+esc(item.shift||'')+'</b>'+
   '<span>Part: '+esc(parts)+'</span>'+
   '<span>OEE '+esc(qty)+' · เทียบ Cap '+esc(rate)+'</span>'+
   '<small>'+esc(outcome)+'</small></div>';
 }

 function render(card){
  const table=card?.querySelector('table.monthly-checksheet-table');
  if(!table)return;
  const {year,month}=monthAndYear();
  for(const row of [...(table.tBodies[0]?.rows||[])]){
   const day=String(row.cells[0]?.textContent||'').trim();
   if(!/^\d{1,2}$/.test(day))continue;
   const date=year+'-'+month+'-'+day.padStart(2,'0');
   const items=history.filter(item=>String(item?.workDate||'')===date);
   const cell=row.cells[9];
   if(!cell)continue;
   const wanted=items.map(markup).join('');
   const existing=[...cell.querySelectorAll('.'+CLASS_NAME)];
   const current=existing.map(node=>node.outerHTML).join('');
   if(current===wanted)continue;
   existing.forEach(node=>node.remove());
   if(wanted)cell.insertAdjacentHTML('beforeend',wanted);
  }
 }

 async function loadHistory(code){
  const current=++requestNo;
  try{
   const response=await fetch(API+'?code='+encodeURIComponent(code),{cache:'no-store',mode:'cors'});
   const data=await response.json();
   if(!response.ok)throw new Error(data?.error||'โหลดผล KPI ไม่สำเร็จ');
   const card=monthlyCard();
   if(current!==requestNo||!card||employeeCode(card)!==code)return;
   activeCode=code;
   history=Array.isArray(data?.history)?data.history:[];
   render(card);
  }catch(error){
   console.warn('PPMS daily production KPI:',error);
  }
 }

 function sync(){
  const card=monthlyCard();
  if(!card){activeCode='';history=[];return}
  const code=employeeCode(card);
  if(!code){activeCode='';history=[];return}
  if(code!==activeCode)loadHistory(code);
  else render(card);
 }

 function schedule(){
  clearTimeout(debounce);
  debounce=setTimeout(sync,200);
 }

 addStyles();
 document.addEventListener('DOMContentLoaded',()=>{
  schedule();
  const app=document.getElementById('app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  document.addEventListener('change',event=>{
   if(['attendanceKpiEmployee','attendanceYear','attendanceMonth'].includes(event.target?.id)){
    activeCode='';history=[];schedule();
   }
  });
  clearInterval(timer);
  timer=setInterval(()=>{
   const card=monthlyCard(),code=employeeCode(card);
   if(document.visibilityState==='visible'&&card&&code)loadHistory(code);
  },60000);
 });
 window.PPMS_ATTENDANCE_OEE_VERSION='V761';
})();

