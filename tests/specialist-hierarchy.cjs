const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(const [id,position] of [['SPECIALIST','Metal ปั๊ม Specialist - ปั๊ม'],['LEADER','Leader'],['OTHER','Document Control']])employees.push({id,name:'TEST '+id,section:'Stamping Section',position,contractType:'Permanent',startDate:'2020-01-01',skillLevels:{},currentSkillLevel:1,stampingShift:'Team A'});
function above(w,root,first,second){
 const a=root.querySelector('[data-edit="'+first+'"]'),b=root.querySelector('[data-edit="'+second+'"]');
 assert(a&&b,first+' and '+second+' appear');
 assert(a.compareDocumentPosition(b)&w.Node.DOCUMENT_POSITION_FOLLOWING,first+' appears above '+second);
}
(async()=>{
 for(const entry of ['index.html','404.html','factory-organization.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const factory=entry==='factory-organization.html',root=w.document.querySelector(factory?'.factory-org-section[data-org-section="Stamping Section"]':'.division-section[data-org-section="Stamping Section"]');
   above(w,root,'SPECIALIST','LEADER');above(w,root,'LEADER','OTHER');
   assert(root.querySelector(factory?'.factory-role-specialist':'.rank-level-specialist'));
   if(!factory){
    const roster=w.PPMS_RUNTIME.factoryLayoutEmployees(),scope=w.PPMS_RUNTIME.organizationScope(),model=w.PPMSOrganizationEditor.model({parents:{}},roster,scope);
    assert.equal(model.parents.get('LEADER'),'SPECIALIST','Automatic reporting places Leader under Specialist');
    assert.equal(model.parents.get('SPECIALIST'),'SUP');
    w.document.querySelector('#nav [data-page="sectionChart"]').click();await wait(240);
    const select=w.document.querySelector('#sectionSelect');select.value='Stamping Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(300);
    const report=w.document.querySelector('.section-org-report .stamping-standard-hierarchy');assert(report,'Printable Stamping hierarchy appears');
    above(w,report,'SPECIALIST','LEADER');assert(report.querySelector('.level-specialist'));
    const team=w.document.querySelector('[data-section-chart-team="Team A"]');above(w,team,'SPECIALIST','LEADER');
   }
   assert.deepEqual(errors,[]);
  }finally{dom.window.close()}
 }
 console.log('Passed: Specialist above Leader in dashboard, 404 entry, Section/team chart, printable Stamping chart, factory organization, and automatic reporting relationships; other positions retained.');
})().catch(error=>{console.error(error);process.exitCode=1});
