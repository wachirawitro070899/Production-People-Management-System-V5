const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees,master}=new Function('require',prefix+'\nreturn {setup,employees,master};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sections=['CNC Section','Die casting','Welding Section','Stamping Section'];
master.sectionMap['Production Division::โรง 1'].push('Die casting');master.sections.push('Die casting');
for(const [index,section]of sections.entries())employees.push({id:'LEAD-'+index,name:'TEST LEADER',section,position:'Leader',contractType:'Permanent',startDate:'2020-01-01',skillLevels:{},currentSkillLevel:1});
function vacancy(w,root,leader){const card=root.querySelector('[data-vacant-position="specialist"]');assert(card);assert(card.textContent.includes('ว่าง'));assert(!card.matches('[data-edit],[data-employee-id]'));if(leader){const chief=root.querySelector('[data-edit="'+leader+'"]');assert(chief);assert(card.compareDocumentPosition(chief)&w.Node.DOCUMENT_POSITION_FOLLOWING)}return card}
(async()=>{
 for(const entry of ['index.html','404.html','factory-organization.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const factory=entry==='factory-organization.html',chart=w.document.querySelector(factory?'#factoryDivisionChartDetail':'.division-org');
   assert.equal(chart.querySelectorAll('[data-vacant-position="specialist"]').length,4);
   const stored=w.localStorage.getItem('ppms_v3_employees'),ids=Array.from(chart.querySelectorAll('[data-edit]'),card=>card.dataset.edit).sort();
   assert.equal(ids.length,new Set(ids).size,'Employee cards remain unique');assert(!ids.includes('specialist'));
   for(const [index,section]of sections.entries()){
    const root=chart.querySelector('[data-org-section="'+section+'"]');vacancy(w,root,'LEAD-'+index);
   }
   assert(!w.PPMSProductionHierarchy.hasSpecialist('Tapping Section'));assert(!w.PPMSProductionHierarchy.hasSpecialist('CNC Section','Quality Division'));assert(w.PPMSProductionHierarchy.hasSpecialist('Die-Casting Section'));
   if(!factory){
    w.document.querySelector('#nav [data-page="sectionChart"]').click();await wait(200);
    for(const [index,section]of sections.entries()){
     const select=w.document.querySelector('#sectionSelect');assert(Array.from(select.options).some(o=>o.value===section));select.value=section;select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(240);
     const report=w.document.querySelector('.section-org-report'),root=section==='Stamping Section'?report.querySelector('.stamping-standard-hierarchy'):report;vacancy(w,root,'LEAD-'+index);
     if(section==='Stamping Section')vacancy(w,report.querySelector('.stamping-print-page'),'LEAD-'+index);
     assert(!w.document.querySelector('.section-team-assignment [data-vacant-position]'),'One section vacancy is not repeated per team');
    }
   }
   assert.equal(w.localStorage.getItem('ppms_v3_employees'),stored,'Vacancies never create employee records');assert.deepEqual(errors,[]);
  }finally{dom.window.close()}
 }
 employees.push({id:'ACTUAL-SPECIALIST',name:'TEST SPECIALIST',section:'CNC Section',position:'CNC Specialist',contractType:'Permanent',startDate:'2020-01-01',skillLevels:{},currentSkillLevel:1});
 for(const entry of ['index.html','factory-organization.html']){const {dom,w}=await setup(entry);try{const root=w.document.querySelector('[data-org-section="CNC Section"]');assert(root.querySelector('[data-edit="ACTUAL-SPECIALIST"]'));assert(!root.querySelector('[data-vacant-position="specialist"]'),'An occupied Specialist position replaces the vacancy')}finally{dom.window.close()}}
 console.log('Passed: Four reserved Specialist vacancies above Leaders; CNC/Die Casting/Welding/Stamping; dashboard, Section, print, 404 and factory chart; no extra employee records/team duplicates; real Specialist replaces vacancy.');
})().catch(error=>{console.error(error);process.exitCode=1});
