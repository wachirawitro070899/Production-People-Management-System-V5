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
