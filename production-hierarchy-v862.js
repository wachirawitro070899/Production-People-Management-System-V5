/* Production Manager -> four direct sections and Sup Production -> seven production sections. */
(()=>{
 'use strict';
 const position='Supervisor Production',supervisorSection='Production Division';
 const headPosition='Head of Forming & Tooling',headSections=['Bending Section','Stamping Section','Tapping Section','Tooling Maintenance Section'];
 const sectionOrder=['stamping','bending','tapping','welding','cnc','sorting1','sorting2'];
 const sectionKey=value=>window.PPMSOrganizationScope?.sectionKey(value)||String(value||'').trim().toLowerCase().replace(/\s+section$/,'').replace(/\s+/g,'').replace(/^taping$/,'tapping');
 function isHead(value){return /^(?:Head of Forming & Tooling|หัวหน้างานขึ้นรูปโลหะและแม่พิมพ์)$/i.test(String(value||'').trim())}
 function headOwns(section){return headSections.some(name=>sectionKey(name)===sectionKey(section))}
 function headTitle(language=window.PPMSLanguage?.language||'th'){return language==='en'?headPosition:'หัวหน้างานขึ้นรูปโลหะและแม่พิมพ์'}
 function scopedHeads(){try{const people=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]');return window.PPMSOrganizationScope.employees(Array.isArray(people)?people:Object.values(people||{})).filter(e=>isHead(e.position))}catch{return []}}
 function hasSpecialist(section,division='Production Division'){
  const key=sectionKey(section).replace(/[-_]/g,'');return division==='Production Division'&&['cnc','diecasting','welding','stamping'].includes(key)&&!(key==='stamping'&&scopedHeads().length);
 }
 function specialistVacancyMarkup(){return '<div class="person specialist organization-position-vacancy" data-vacant-position="specialist"><div class="avatar">—</div><b>ว่าง</b><small>Specialist</small></div>'}
 function isSupervisor(value){return /^(?:sup\.?\s+production|production\s+(?:sup\.?|supervisor)|supervisor\s+production|หัวหน้างานฝ่ายผลิต)$/i.test(String(value||'').trim())}
 function reportsToSupervisor(section){return sectionOrder.includes(sectionKey(section))||sectionKey(section)==='sorting'}
 function withPosition(source){
  const positions=Array.isArray(source.positions)?source.positions:[],divisionPositions=source.positionMap?.['Production Division']||[];
  if(positions.includes(position)&&divisionPositions.includes(position))return source;
  return {...source,positions:[...new Set([...positions,position])],positionMap:{...source.positionMap,'Production Division':[...new Set([...divisionPositions,position])]}};
 }
 function chartMarkup(sections,supervisors,options={}){
  const hasHead=Boolean(options.heads),owned=hasHead?sections.filter(item=>headOwns(item.title)):[];
  const direct=sections.filter(item=>!reportsToSupervisor(item.title)&&!owned.includes(item)),production=sections.filter(item=>reportsToSupervisor(item.title)||owned.includes(item));
  production.sort((a,b)=>sectionOrder.indexOf(sectionKey(a.title))-sectionOrder.indexOf(sectionKey(b.title)));
  owned.sort((a,b)=>headSections.findIndex(name=>sectionKey(name)===sectionKey(a.title))-headSections.findIndex(name=>sectionKey(name)===sectionKey(b.title)));
  const sectionClass=options.factory?'factory-org-sections':'division-sections',peopleClass=options.factory?'factory-people':'people';
  const head=hasHead?'<section class="production-head-branch" data-reports-to="Head of Forming &amp; Tooling"><div class="production-head-top"><h4>Head of Forming &amp; Tooling</h4><div class="'+peopleClass+'">'+options.heads+'</div><small>Bending · Stamping · Tapping · Tooling Maintenance</small></div><div class="'+sectionClass+' production-head-sections">'+owned.map(item=>item.html).join('')+'</div></section>':'';
  const remaining=production.filter(item=>!owned.includes(item)),content=hasHead?'<div class="production-supervised-content">'+head+(remaining.length?'<div class="'+sectionClass+' production-other-sections">'+remaining.map(item=>item.html).join('')+'</div>':'')+'</div>':'<div class="'+sectionClass+'">'+production.map(item=>item.html).join('')+'</div>';
  return '<div class="production-reporting-tree'+(hasHead?' has-forming-tooling-head':'')+'">'+
   (direct.length?'<section class="production-reporting-branch production-direct-sections" data-reports-to="Manager"><div class="production-branch-heading"><small>'+direct.length+' แผนก</small></div><div class="'+sectionClass+'">'+direct.map(item=>item.html).join('')+'</div></section>':'')+
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
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'หัวหน้างานฝ่ายผลิต / Supervisor Production',jobPurpose:'บริหารงานขึ้นรูปโลหะและแม่พิมพ์ ครอบคลุม Bending, Stamping, Tapping และ Tooling Maintenance\nLead forming and tooling across Bending, Stamping, Tapping, and Tooling Maintenance.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้กระบวนการพับ ปั๊ม ต๊าป การซ่อมบำรุงแม่พิมพ์ และการบริหารทีม\nKnowledge of bending, stamping, tapping, tooling maintenance, and team leadership.',documentUrl:'',status:'draft',templateSource:'PPMS Forming & Tooling Head V897',templateVersion:1,version:1};
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
   duties[0]=['กำกับดูแล Stamping, Bending, Tapping, Tooling Maintenance, Welding, CNC, Sorting 1 และ Sorting 2 ผ่าน Head และหัวหน้าแผนกตามสายบังคับบัญชา','Supervise Stamping, Bending, Tapping, Tooling Maintenance, Welding, CNC, Sorting 1, and Sorting 2 through the Head and section leaders.'];
   for(const pair of duties)for(let i=0;i<pair.length;i++)pair[i]=pair[i].replace(/7 แผนก/g,'8 แผนก').replace(/\bseven\b/g,'eight');
  }
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'ผู้จัดการฝ่ายผลิต / Production Manager',jobPurpose:headMode?'กำกับดูแลการผลิตของ 8 แผนกผ่าน Head และหัวหน้าแผนก\nSupervise the eight production sections through the Head and section leaders.':'กำกับดูแลการผลิตของ 7 แผนกให้เป็นไปตามแผน คุณภาพ การส่งมอบ และความปลอดภัย\nSupervise the seven production sections against production, quality, delivery, and safety targets.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้กระบวนการผลิต การวางแผนกำลังคน การวิเคราะห์ KPI และการบริหารทีม\nKnowledge of manufacturing processes, manpower planning, KPI analysis, and team supervision.',documentUrl:'',status:'draft',templateSource:'PPMS Supervisor Production V862',templateVersion:5,version:1};
 }
 window.PPMSProductionHierarchy={position,headPosition,headSections,isHead,headOwns,headTitle,headJD,supervisorSection,sectionKey,hasSpecialist,specialistVacancyMarkup,isSupervisor,reportsToSupervisor,withPosition,chartMarkup,supervisorJD};
})();
