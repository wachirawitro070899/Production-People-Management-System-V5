/* Production Manager -> four direct sections and Sup Production -> seven production sections. */
(()=>{
 'use strict';
 const position='Supervisor Production',supervisorSection='Production Division';
 const sectionOrder=['stamping','bending','tapping','welding','cnc','sorting1','sorting2'];
 const sectionKey=value=>String(value||'').trim().toLowerCase().replace(/\s+section$/,'').replace(/\s+/g,'').replace(/^taping$/,'tapping');
 function hasSpecialist(section,division='Production Division'){return division==='Production Division'&&['cnc','diecasting','welding','stamping'].includes(sectionKey(section).replace(/[-_]/g,''))}
 function specialistVacancyMarkup(){return '<div class="person specialist organization-position-vacancy" data-vacant-position="specialist"><div class="avatar">—</div><b>ว่าง</b><small>Specialist</small></div>'}
 function isSupervisor(value){return /^(?:sup\.?\s+production|production\s+(?:sup\.?|supervisor)|supervisor\s+production|หัวหน้างานฝ่ายผลิต)$/i.test(String(value||'').trim())}
 function reportsToSupervisor(section){return sectionOrder.includes(sectionKey(section))||sectionKey(section)==='sorting'}
 function withPosition(source){
  const positions=Array.isArray(source.positions)?source.positions:[],divisionPositions=source.positionMap?.['Production Division']||[];
  if(positions.includes(position)&&divisionPositions.includes(position))return source;
  return {...source,positions:[...new Set([...positions,position])],positionMap:{...source.positionMap,'Production Division':[...new Set([...divisionPositions,position])]}};
 }
 function chartMarkup(sections,supervisors,options={}){
  const direct=sections.filter(item=>!reportsToSupervisor(item.title)),production=sections.filter(item=>reportsToSupervisor(item.title));
  production.sort((a,b)=>sectionOrder.indexOf(sectionKey(a.title))-sectionOrder.indexOf(sectionKey(b.title)));
  const sectionClass=options.factory?'factory-org-sections':'division-sections',peopleClass=options.factory?'factory-people':'people';
  return '<div class="production-reporting-tree">'+
   (direct.length?'<section class="production-reporting-branch production-direct-sections" data-reports-to="Manager"><div class="production-branch-heading"><small>'+direct.length+' แผนก</small></div><div class="'+sectionClass+'">'+direct.map(item=>item.html).join('')+'</div></section>':'')+
   '<section class="production-reporting-branch production-supervised-sections" data-reports-to="Supervisor Production"><div class="production-supervisor-top"><h4>Supervisor Production</h4><div class="'+peopleClass+'">'+(supervisors||'<div class="production-supervisor-empty">ยังไม่มีพนักงานในตำแหน่งนี้</div>')+'</div><small>ดูแลแผนกผลิต · '+production.length+' แผนก</small>'+(options.assign?'<button type="button" class="secondary compact no-print" data-assign-production-supervisor>กำหนดพนักงาน</button>':'')+'</div><div class="'+sectionClass+'">'+production.map(item=>item.html).join('')+'</div></section></div>';
 }
 function supervisorJD(scope){
  const duties=[
   ['กำกับดูแล Stamping, Bending, Tapping, Welding, CNC, Sorting 1 และ Sorting 2 ตามสายบังคับบัญชาของฝ่ายผลิต','Supervise Stamping, Bending, Tapping, Welding, CNC, Sorting 1, and Sorting 2 under the Production Division.'],
   ['รับแผนผลิตจาก Manager และจัดสรรกำลังคน เครื่องจักร และเป้าหมายร่วมกับหัวหน้าแผนกทั้ง 7 แผนก','Translate the Manager’s production plan into manpower, machine, and target allocations with the seven section leaders.'],
   ['ติดตามผลผลิต คุณภาพ การส่งมอบ และความปลอดภัย พร้อมสรุปผลต่อ Manager','Monitor output, quality, delivery, and safety and report results to the Manager.'],
   ['ประสาน Engineering Support, Support Production, Machine Maintenance และ Tooling Maintenance เพื่อแก้ปัญหาที่กระทบการผลิต','Coordinate with Engineering Support, Support Production, Machine Maintenance, and Tooling Maintenance to resolve production issues.'],
   ['ควบคุมการปฏิบัติตาม WI และแผนควบคุม ติดตามการแก้ไขปัญหาและยืนยันประสิทธิผล','Verify WI and control-plan compliance, follow up corrective actions, and confirm effectiveness.'],
   ['ประเมินความสามารถและพัฒนาหัวหน้าทีมกับพนักงานใน 7 แผนกที่รับผิดชอบ','Assess competence and develop leaders and employees in the seven supervised sections.']
  ];
  return {...scope,employeeId:'',employeeName:'',documentNo:'',revision:'DRAFT',effectiveDate:'',reportsTo:'ผู้จัดการฝ่ายผลิต / Production Manager',jobPurpose:'กำกับดูแลการผลิตของ 7 แผนกให้เป็นไปตามแผน คุณภาพ การส่งมอบ และความปลอดภัย\nSupervise the seven production sections against production, quality, delivery, and safety targets.',responsibilities:duties.map((item,index)=>(index+1)+'. '+item.join('\n   ')).join('\n'),qualifications:'มีความรู้กระบวนการผลิต การวางแผนกำลังคน การวิเคราะห์ KPI และการบริหารทีม\nKnowledge of manufacturing processes, manpower planning, KPI analysis, and team supervision.',documentUrl:'',status:'draft',templateSource:'PPMS Supervisor Production V862',templateVersion:5,version:1};
 }
 window.PPMSProductionHierarchy={position,supervisorSection,sectionKey,hasSpecialist,specialistVacancyMarkup,isSupervisor,reportsToSupervisor,withPosition,chartMarkup,supervisorJD};
})();
