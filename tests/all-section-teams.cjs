const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/section-chart-teams.cjs','utf8').split('\n(async()=>{')[0];
const {setup,employees,nav,section,mode,organizationCards,organizationSnapshot,extra}=new Function('require',prefix+'\nreturn {setup,employees,nav,section,mode,organizationCards,organizationSnapshot,extra};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
employees.push(extra('STAMP-FLOAT','Stamping Section','Operator',{stampingShift:'ทีมลอยเช้า'}),extra('QC-FLOAT','Inspection Section','Operator',{organizationDivision:'Quality Division',organizationTeam:'Morning Floating Team'}));
function drag(w,card,team,group=''){
 const target=w.document.querySelector('[data-section-team-target="'+team+'"][data-section-team-group="'+group+'"]');assert(target);assert(card.draggable);
 const dataTransfer={setData(){},getData(){return card.dataset.edit}};
 for(const [node,type]of [[card,'dragstart'],[target,'dragover'],[target,'drop']]){const event=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:dataTransfer});node.dispatchEvent(event)}
}
function countsLabel(w,key){return w.document.querySelector('[data-employment-count="'+key+'"]').parentElement.firstChild.textContent}
(async()=>{
 const {dom,w,errors}=await setup('index.html');
 try{
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  const before=JSON.parse(w.localStorage.getItem('ppms_v3_employees')),master=w.localStorage.getItem('ppms_organization_master_v1');
  // Old hidden-team preferences must not leave other Sections unable to assign teams after this update.
  w.sessionStorage.setItem('ppms_section_chart_team_view::Production Division::โรง 1::Bending Section','combined');
  await nav(w,'sectionChart');const options=Array.from(w.document.querySelector('#sectionSelect').options,o=>o.value),visited=[];
  for(const value of options){
   await section(w,value);assert.equal(w.document.querySelector('#sectionChartTeamView').value,'split',value+' opens team assignment');
   const cards=organizationCards(w),fixed=organizationSnapshot(w),card=cards.find(e=>e.dataset.edit!=='STAMP-FLOAT')||cards[0];
   for(const board of w.document.querySelectorAll('.section-chart-team-group'))assert.equal(board.querySelectorAll('[data-section-chart-team]').length,3,value+' has three team destinations');
   if(!card)continue;
   const id=card.dataset.edit,group=card.closest('[data-sorting-group]')?.dataset.sortingGroup||'';visited.push(value);
   for(const team of ['Team A','Team B','Morning Floating Team']){
    drag(w,organizationCards(w).find(e=>e.dataset.edit===id),team,group);await wait(180);
    assert(w.document.querySelector('[data-section-team-group="'+group+'"][data-section-chart-team="'+team+'"] [data-edit="'+id+'"]'),value+' accepts '+team);
    assert.deepEqual(organizationSnapshot(w),fixed,value+' keeps its complete organization chart');
   }
   const row=JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id===id),queued=JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves'))[id];
   assert.equal(row[row.section==='Stamping Section'?'stampingShift':'organizationTeam'],'Morning Floating Team');assert.equal(queued.expectedSection,row.section);
   w.dispatchEvent(new w.Event('beforeprint'));assert(!w.document.querySelector('.section-org-report [data-section-chart-team]'));assert(w.document.querySelector('.section-team-assignment').classList.contains('no-print'));w.dispatchEvent(new w.Event('afterprint'));
   drag(w,organizationCards(w).find(e=>e.dataset.edit===id),'',group);await wait(180);assert(!w.document.querySelector('.section-team-assignment [data-edit="'+id+'"]'));assert.deepEqual(organizationSnapshot(w),fixed);
  }
  for(const value of ['Stamping Section','Bending Section','Tapping Section','Welding Section','CNC Section','Sorting Section','Engineering Support Section','Support Production Section','Machine Maintenance Section','Tooling Maintenance Section'])assert(visited.includes(value),value+' was tested');
  await section(w,'Stamping Section');assert(w.document.querySelector('[data-section-chart-team="Morning Floating Team"] [data-edit="STAMP-FLOAT"]'),'Existing Thai morning team values are recognized');assert.equal(w.document.querySelectorAll('.stamping-print-page [data-edit="STAMP-FLOAT"]').length,1,'Morning float employee stays on the complete print document');
  assert.equal(countsLabel(w,'permanent'),'พนักงานประจำ');assert.equal(countsLabel(w,'subcontractor'),'พนักงานซัพคอนแทรค');
  w.PPMSLanguage.setLanguage('en');await wait(70);assert.equal(w.document.querySelector('[data-section-chart-team="Morning Floating Team"] h3').textContent,'Morning Floating Team');assert.equal(countsLabel(w,'subcontractor'),'Subcontractor employees');w.PPMSLanguage.setLanguage('th');await wait(70);assert.equal(w.document.querySelector('[data-section-chart-team="Morning Floating Team"] h3').textContent,'ทีมลอยเช้า');
  await mode(w,'combined');assert(!w.document.querySelector('.section-team-assignment'));await section(w,'Bending Section');assert(w.document.querySelector('.section-team-assignment'));await section(w,'Stamping Section');assert.equal(w.document.querySelector('#sectionChartTeamView').value,'combined','Explicit view preferences still persist independently');await mode(w,'split');
  w.PPMSOrganizationScope.activate({division:'Quality Division'});await wait(240);assert.equal(w.document.querySelector('#sectionChartTeamView').value,'split');assert(w.document.querySelector('[data-section-chart-team="Morning Floating Team"] [data-edit="QC-FLOAT"]'));const qc=organizationCards(w).find(e=>e.dataset.edit==='QC-A');assert(qc);drag(w,qc,'Morning Floating Team');await wait(180);assert(w.document.querySelector('[data-section-chart-team="Morning Floating Team"] [data-edit="QC-A"]'));
  const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));assert.equal(saved.length,before.length);for(const row of saved){const prior=before.find(e=>e.id===row.id);for(const field of ['name','section','position','sortingGroup','organizationDivision','contractType','startDate'])assert.equal(row[field],prior[field],row.id+' preserves '+field)}
  assert.equal(w.localStorage.getItem('ppms_organization_master_v1'),master);assert.deepEqual(errors,[]);
  console.log('PASSED every Production and Quality Section: default team availability, Team A/B/morning float drag and unassign, durable minimal patches, Thai aliases, preserved print/source rosters, summary labels and bilingual UI');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
