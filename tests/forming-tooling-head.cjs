const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const title='Head of Forming & Tooling',head={id:'HEAD',name:'TEST HEAD',section:'Stamping Section',position:title,startDate:'2020-01-01',contractType:'Permanent',skillLevels:{},currentSkillLevel:1,stampingShift:'Team A'};
employees.push(head,{...head,id:'LEADER',name:'TEST LEADER',position:'Leader'});
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const factory=entry==='factory-organization.html',card=factory?'.factory-org-section':'.division-section',root=w.document.querySelector('.production-reporting-tree'),branch=root.querySelector('.production-head-branch');assert(branch,'Head branch exists');
   const owned=[...branch.querySelectorAll(card)].map(node=>w.PPMSProductionHierarchy.sectionKey(node.dataset.orgSection));assert.deepEqual(owned,['bending','stamping','tapping','toolingmaintenance']);
   assert.equal(root.querySelectorAll('[data-edit="HEAD"]').length,1,'The head appears once for all four Sections');assert(branch.querySelector('.production-head-top [data-edit="HEAD"]'));assert(!root.querySelector('.production-direct-sections [data-org-section="Tooling Maintenance Section"],.production-direct-sections [data-org-section="Tooling Maintenance"]'));
   const stamping=branch.querySelector('[data-org-section="Stamping Section"]');assert(stamping.querySelector('[data-edit="LEADER"]'));assert(!stamping.querySelector('[data-vacant-position="specialist"]'),'A vacant Stamping Specialist is not recreated after replacement by Head');
   for(const section of ['Welding Section','CNC Section','Sorting 1','Sorting 2'])assert(!branch.querySelector('[data-org-section="'+section+'"]'),'Only the requested four Sections report to this Head');
   for(const person of employees.filter(e=>!['MANAGER','SUP-OTHER-PLANT','QC'].includes(e.id)))assert.equal(root.querySelectorAll('[data-edit="'+person.id+'"]').length,1,person.id+' remains once');
   assert.equal(w.PPMSPositionTitle({...head,division:'Production Division'}),'หัวหน้างานขึ้นรูปโลหะและแม่พิมพ์');w.PPMSLanguage.setLanguage('en');assert.equal(w.PPMSPositionTitle({...head,division:'Production Division'}),title);w.PPMSLanguage.setLanguage('th');
   const jd=w.PPMSJDTemplates.draft({...head,division:'Production Division'});for(const name of ['Bending','Stamping','Tapping','Tooling Maintenance'])assert(jd.responsibilities.includes(name));assert(jd.reportsTo.includes('Supervisor Production'));assert(w.PPMSProductionHierarchy.supervisorJD({position:'Supervisor Production'}).jobPurpose.includes('8 แผนก'));
   if(!factory){
    const roster=w.PPMS_RUNTIME.factoryLayoutEmployees(),scope=w.PPMS_RUNTIME.organizationScope(),model=w.PPMSOrganizationEditor.model({parents:{}},roster,scope);assert.equal(model.parents.get('HEAD'),'SUP');assert.equal(model.parents.get('LEADER'),'HEAD');assert.equal(model.parents.get('OP1'),'HEAD');assert.equal(model.parents.get('OP2'),'HEAD');assert.equal(model.parents.get('DIRECT3'),'HEAD');assert.equal(model.parents.get('WELD-SUP'),'SUP');assert.equal(model.parents.get('DIRECT0'),'MANAGER');
    const custom=w.PPMSOrganizationEditor.model({parents:{person_OP1:'MANAGER'}},roster,scope);assert.equal(custom.parents.get('OP1'),'MANAGER','A saved manual reporting relationship remains explicit');
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(250);const select=w.document.querySelector('#sectionSelect');select.value='Stamping Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(300);const report=w.document.querySelector('.section-org-report .stamping-standard-hierarchy'),h=report.querySelector('.level-head [data-edit="HEAD"]'),leader=report.querySelector('.level-leader [data-edit="LEADER"]');assert(h&&leader);assert(h.compareDocumentPosition(leader)&w.Node.DOCUMENT_POSITION_FOLLOWING,'Head stays above Leader in the printable chart');assert(!report.querySelector('[data-vacant-position="specialist"]'));
   }
   assert.deepEqual(errors,[]);console.log('PASSED Forming/Tooling Head:',entry);
  }finally{dom.window.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
