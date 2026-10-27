/* Production Manager -> four direct sections and Sup Production -> seven production sections. */
(()=>{
 'use strict';
 const position='Supervisor Production',supervisorSection='Production Division';
 const headPosition='Stamping Specialist',headSections=['Bending Section','Stamping Section','Tapping Section','Tooling Maintenance Section'];
 const sectionOrder=['stamping','bending','tapping','welding','cnc','sorting'];
 const sectionKey=value=>window.PPMSOrganizationScope?.sectionGroupKey(value)||String(value||'').trim().toLowerCase().replace(/\s+section$/,'').replace(/\s+/g,'').replace(/^taping$/,'tapping');
 function isHead(value){return /^(?:Stamping Specialist|ผู้เชี่ยวชาญงานปั๊มโลหะ|ผู้เชี่ยวชาญงานปั้ม|Head of Forming & Tooling|หัวหน้างานขึ้นรูปโลหะและแม่พิมพ์)$/i.test(String(value||'').trim())}
 function headOwns(section){return headSections.some(name=>sectionKey(name)===sectionKey(section))}
 function headTitle(language=window.PPMSLanguage?.language||'th'){return language==='en'?headPosition:'ผู้เชี่ยวชาญงานปั๊มโลหะ'}
 const castingPosition='Die Casting Specialist',castingSections=[
  ['Die-Casting Mold Maintenance Section','ช่างซ่อมแม่พิมพ์อลูมิเนียม'],
  ['Die casting','Die casting Section','หลอมอลูมิเนียม'],
  ['Polishing / Shot Blasting / X-Ray','คัดครีบ-พ่นทราย-X-Ray','คัดครีบ/พ่นทราย/X-Ray']
 ];
 function isCastingSpecialist(value){return /^die[\s-]*casting\s+specialist$/i.test(String(value||'').trim())}
 function castingSectionIndex(section){const key=sectionKey(section);return castingSections.findIndex(names=>names.some(name=>sectionKey(name)===key))}
 function castingOwns(section){return castingSectionIndex(section)>=0}
 function scopedRoles(test){try{const people=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]');return window.PPMSOrganizationScope.employees(Array.isArray(people)?people:Object.values(people||{})).filter(e=>test(e.position))}catch{return []}}
 const scopedHeads=()=>scopedRoles(isHead);
 function hasSpecialist(section,division='Production Division'){
  const key=sectionKey(section).replace(/[-_]/g,'');return division==='Production Division'&&['cnc','diecasting','welding','stamping'].includes(key)&&!(key==='stamping'&&scopedHeads().length)&&!(key==='diecasting'&&scopedRoles(isCastingSpecialist).length);
 }
 function specialistVacancyMarkup(){return '<div class="person specialist organization-position-vacancy" data-vacant-position="specialist"><div class="avatar">—</div><b>ว่าง</b><small>Specialist</small></div>'}
 // Planned slots are organization settings, not employee records.
 const vacancyPositionKey=value=>window.PPMSPositionSlots?window.PPMSPositionSlots.positionKey(value):/^(?:pe|production\s*engineer|วิศวกรการผลิต)$/i.test(String(value||'').trim())?'productionengineer':String(value||'').trim().toLowerCase();
 function positionVacancies(section,scope=window.PPMSOrganizationScope?.current()){
  if(!section||!scope)return [];
  try{
   if(window.PPMSPositionSlots)return window.PPMSPositionSlots.plans(scope).filter(t=>sectionKey(t.section)===sectionKey(section)&&t.count>0);
   const api=window.PPMSOrganizationScope,master=api.master(),targets=Object.values(master.positionVacancies||{}).filter(target=>target&&target.division===scope.division&&target.plant===scope.plant&&sectionKey(target.section)===sectionKey(section)&&Number.isInteger(target.required)&&target.required>0&&target.required<=100);
   if(!targets.length)return [];
   const raw=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]'),people=api.employees((Array.isArray(raw)?raw:Object.values(raw||{})).filter(Boolean),scope);
   return targets.map(target=>({...target,count:Math.max(0,target.required-people.filter(e=>sectionKey(e.section)===sectionKey(section)&&vacancyPositionKey(e.position)===vacancyPositionKey(target.position)).length)})).filter(target=>target.count>0);
  }catch{return []}
 }
 function positionVacancyMarkup(target){
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),pe=vacancyPositionKey(target.position)==='productionengineer';
  return Array.from({length:target.count},()=>'<div class="person '+(pe?'engineer':'other')+' organization-position-vacancy" data-vacant-position="'+esc(target.position)+'" data-position-vacancy-id="'+esc(target.id)+'"><div class="avatar">—</div><b>ว่าง</b><small>'+esc(target.position)+(pe?' (PE)':'')+'</small><small class="position-recruiting">รอสรรหา / HR</small></div>').join('');
 }
 function isSupervisor(value){return /^(?:sup\.?\s+production|production\s+(?:sup\.?|supervisor)|supervisor\s+production|หัวหน้างานฝ่ายผลิต)$/i.test(String(value||'').trim())}
 function reportsToSupervisor(section){return sectionOrder.includes(sectionKey(section))||sectionKey(section)==='sorting'}
 function withPosition(source){
  const positions=Array.isArray(source.positions)?source.positions:[],divisionPositions=source.positionMap?.['Production Division']||[];
  if(positions.includes(position)&&divisionPositions.includes(position))return source;
  return {...source,positions:[...new Set([...positions,position])],positionMap:{...source.positionMap,'Production Division':[...new Set([...divisionPositions,position])]}};
 }
 function chartMarkup(sections,supervisors,options={}){
  const hasCasting=Boolean(options.castingSpecialists),castingOwned=hasCasting?sections.filter(item=>castingOwns(item.title)).sort((a,b)=>castingSectionIndex(a.title)-castingSectionIndex(b.title)):[];
  const hasHead=Boolean(options.heads),owned=hasHead?sections.filter(item=>headOwns(item.title)):[];
  const direct=sections.filter(item=>!reportsToSupervisor(item.title)&&!owned.includes(item)),production=sections.filter(item=>reportsToSupervisor(item.title)||owned.includes(item));
  production.sort((a,b)=>sectionOrder.indexOf(sectionKey(a.title))-sectionOrder.indexOf(sectionKey(b.title)));
  owned.sort((a,b)=>headSections.findIndex(name=>sectionKey(name)===sectionKey(a.title))-headSections.findIndex(name=>sectionKey(name)===sectionKey(b.title)));
  const sectionClass=options.factory?'factory-org-sections':'division-sections',peopleClass=options.factory?'factory-people':'people';
  const casting=hasCasting?'<section class="production-casting-branch" data-reports-to="Die Casting Specialist"><div class="production-casting-top"><h4>Die Casting Specialist</h4><div class="'+peopleClass+'">'+options.castingSpecialists+'</div><small>Die-Casting Mold Maintenance · Die Casting · Polishing / Shot Blasting / X-Ray</small></div><div class="'+sectionClass+' production-casting-sections">'+castingOwned.map(item=>item.html).join('')+'</div></section>':'';
  const directContent='<div class="'+sectionClass+'">'+direct.filter(item=>!castingOwned.includes(item)).map(item=>item.html).join('')+'</div>'+casting;
  const head=hasHead?'<section class="production-head-branch" data-reports-to="Stamping Specialist"><div class="production-head-top"><h4>Stamping Specialist</h4><div class="'+peopleClass+'">'+options.heads+'</div><small>Bending · Stamping · Tapping · Tooling Maintenance</small></div><div class="'+sectionClass+' production-head-sections">'+owned.map(item=>item.html).join('')+'</div></section>':'';
  const remaining=production.filter(item=>!owned.includes(item)),content=hasHead?'<div class="production-supervised-content">'+head+(remaining.length?'<div class="'+sectionClass+' production-other-sections">'+remaining.map(item=>item.html).join('')+'</div>':'')+'</div>':'<div class="'+sectionClass+'">'+production.map(item=>item.html).join('')+'</div>';
  return '<div class="production-reporting-tree'+(hasHead?' has-forming-tooling-head':'')+(hasCasting?' has-casting-specialist':'')+'">'+
   ((direct.length||hasCasting)?'<section class="production-reporting-branch production-direct-sections" data-reports-to="Manager"><div class="production-branch-heading"><small>'+direct.length+' แผนก</small></div>'+directContent+'</section>':'')+
   '<section class="production-reporting-branch production-supervised-sections" data-reports-to="Supervisor Production"><div class="production-supervisor-top"><h4>Supervisor Production</h4><div class="'+peopleClass+'">'+(supervisors||'<div class="production-supervisor-empty">ยังไม่มีพนักงานในตำแหน่งนี้</div>')+'</div><small>ดูแลแผนกผลิต · '+production.length+' แผนก</small>'+(options.assign?'<button type="button" class="secondary compact no-print" data-assign-production-supervisor>กำหนดพนักงาน</button>':'')+'</div>'+content+'</section></div>';
 }
 function headJD(scope){
  const duties=[
   ['กำกับดูแล Bending, Stamping, Tapping และ Tooling Maintenance ให้เป็นไปตามแผนผลิต คุณภาพ การส่งมอบ และความปลอดภัย','Lead Bending, Stamping, Tapping, and Tooling Maintenance against production, quality, delivery, and safety targets.'],
   ['จัดสรรกำลังคน เครื่องจักร และแม่พิมพ์ร่วมกับหัวหน้าทีมทั้ง 4 แผนก พร้อมติดตามผลเทียบแผน','Allocate people, machines, and dies with the four section leaders and monitor results against the plan.'],
   ['ควบคุมความพร้อมแม่พิมพ์ การตั้งเครื่อง งานซ่อม และการบำรุงรักษาเพื่อป้องกันการหยุดผลิต','Control die readiness, machine setup, repairs, and maintenance to prevent production stoppages.'],
   ['ตรวจการปฏิบัติตาม WI และ Control Plan ประสานวิศวกรรมและคุณภาพเพื่อแก้ไขปัญหากระบวนการ','Verify WI and control-plan compliance and coordinate process issues with Engineering and Quality.'],
   ['พัฒนาหัวหน้าทีมและพนักงานทั้ง 4 แผนก ติดตาม KPI และรายงานผลต่อผู้บังคับบัญชาตามผังองค์กร','Develop the four section teams, monitor KPIs, and report to the supervisor defined in the organization chart.']
  ];
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'หัวหน้างานฝ่ายผลิต / Supervisor Production',jobPurpose:'บริหารงานขึ้นรูปโลหะและแม่พิมพ์ ครอบคลุม Bending, Stamping, Tapping และ Tooling Maintenance\nLead forming and tooling across Bending, Stamping, Tapping, and Tooling Maintenance.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้กระบวนการพับ ปั๊ม ต๊าป การซ่อมบำรุงแม่พิมพ์ และการบริหารทีม\nKnowledge of bending, stamping, tapping, tooling maintenance, and team leadership.',documentUrl:'',status:'draft',templateSource:'PPMS Stamping Specialist four-section lead V899',templateVersion:1,version:1};
 }
 function castingJD(scope){
  const duties=[
   ['กำกับดูแล Die-Casting Mold Maintenance, Die Casting และ Polishing / Shot Blasting / X-Ray ให้ได้ตามเป้าหมายคุณภาพ ผลผลิต และความปลอดภัย','Oversee Die-Casting Mold Maintenance, Die Casting, and Polishing / Shot Blasting / X-Ray against quality, output, and safety targets.'],
   ['ประสานการเตรียมและซ่อมแม่พิมพ์ พารามิเตอร์หล่อ และการตกแต่งผิวกับหัวหน้าทีมทั้ง 3 แผนก','Coordinate die readiness and repairs, casting parameters, and finishing with the three section leaders.'],
   ['วิเคราะห์ข้อบกพร่องจากการหล่อ ผิวงาน และผล X-Ray ร่วมกับคุณภาพ พร้อมยืนยันการแก้ไขก่อนปล่อยผลิต','Analyze casting, surface, and X-Ray defects with Quality and validate corrective actions before production release.'],
   ['วางแผนทรัพยากร ติดตาม KPI พัฒนาทักษะพนักงาน และรายงานปัญหาต่อผู้จัดการฝ่ายผลิต','Plan resources, monitor KPIs, develop staff skills, and report issues to the Production Manager.']
  ];
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'ผู้จัดการฝ่ายผลิต / Production Manager',jobPurpose:'ดูแลกระบวนการแม่พิมพ์ หล่ออลูมิเนียม และตกแต่ง/ตรวจ X-Ray ครอบคลุมทั้ง 3 แผนก\nOversee die maintenance, die casting, and finishing/X-Ray across the three sections.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้ด้านแม่พิมพ์หล่ออลูมิเนียม กระบวนการหล่อ การตกแต่งผิว และการตรวจ X-Ray\nKnowledge of die-casting molds, casting processes, surface finishing, and X-Ray inspection.',documentUrl:'',status:'draft',templateSource:'PPMS Die Casting Specialist V898',templateVersion:1,version:1};
 }
 function supervisorJD(scope){
  const headMode=scopedHeads().length>0;
  const duties=[
   ['กำกับดูแล Stamping, Bending, Tapping, Welding, CNC, Sorting 1 และ Sorting 2 ตามสายบังคับบัญชาของฝ่ายผลิต','Supervise Stamping, Bending, Tapping, Welding, CNC, Sorting 1, and Sorting 2 under the Production Division.'],
   ['รับแผนผลิตจาก Manager และจัดสรรกำลังคน เครื่องจักร และเป้าหมายร่วมกับหัวหน้าแผนกทั้ง 7 แผนก','Translate the Manager’s production plan into manpower, machine, and target allocations with the seven section leaders.'],
   ['ติดตามผลผลิต คุณภาพ การส่งมอบ และความปลอดภัย พร้อมสรุปผลต่อ Manager','Monitor output, quality, delivery, and safety and report results to the Manager.'],
   ['ประสาน Engineering Support, Support Production, Machine Maintenance และ Tooling Maintenance เพื่อแก้ปัญหาที่กระทบการผลิต','Coordinate with Engineering Support, Support Production, Machine Maintenance, and Tooling Maintenance to resolve production issues.'],
   ['ควบคุมการปฏิบัติตาม WI และแผนควบคุม ติดตามการแก้ไขปัญหาและยืนยันประสิทธิผล','Verify WI and control-plan compliance, follow up corrective actions, and confirm effectiveness.'],
   ['ประเมินความสามารถและพัฒนาหัวหน้าทีมกับพนักงานใน 7 แผนกที่รับผิดชอบ','Assess competence and develop leaders and employees in the seven supervised sections.']
  ];
  if(headMode){
   duties[0]=['กำกับดูแล Stamping, Bending, Tapping, Tooling Maintenance, Welding, CNC, Sorting 1 และ Sorting 2 ผ่าน Stamping Specialist และหัวหน้าแผนกตามสายบังคับบัญชา','Supervise Stamping, Bending, Tapping, Tooling Maintenance, Welding, CNC, Sorting 1, and Sorting 2 through the Stamping Specialist and section leaders.'];
   for(const pair of duties)for(let i=0;i<pair.length;i++)pair[i]=pair[i].replace(/7 แผนก/g,'8 แผนก').replace(/\bseven\b/g,'eight');
  }
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'ผู้จัดการฝ่ายผลิต / Production Manager',jobPurpose:headMode?'กำกับดูแลการผลิตของ 8 แผนกผ่าน Stamping Specialist และหัวหน้าแผนก\nSupervise the eight production sections through the Stamping Specialist and section leaders.':'กำกับดูแลการผลิตของ 7 แผนกให้เป็นไปตามแผน คุณภาพ การส่งมอบ และความปลอดภัย\nSupervise the seven production sections against production, quality, delivery, and safety targets.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้กระบวนการผลิต การวางแผนกำลังคน การวิเคราะห์ KPI และการบริหารทีม\nKnowledge of manufacturing processes, manpower planning, KPI analysis, and team supervision.',documentUrl:'',status:'draft',templateSource:'PPMS Supervisor Production V862',templateVersion:5,version:1};
 }
 window.PPMSProductionHierarchy={position,castingPosition,castingSections,isCastingSpecialist,castingOwns,castingJD,headPosition,headSections,isHead,headOwns,headTitle,headJD,supervisorSection,sectionKey,hasSpecialist,specialistVacancyMarkup,positionVacancies,positionVacancyMarkup,isSupervisor,reportsToSupervisor,withPosition,chartMarkup,supervisorJD};
})();
