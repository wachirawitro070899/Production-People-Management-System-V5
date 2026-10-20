const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,master,employees}=new Function('require',prefix+'\nreturn {setup,master,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),scope='Production Division::โรง 1',sections=['Die-Casting Mold Maintenance Section','หลอมอลูมิเนียม','คัดครีบ-พ่นทราย-X-Ray'];
master.sectionMap[scope].push(...sections);master.sections.push(...sections);master.sectionLabels={[scope]:[{section:sections[1],name:'Die casting'},{section:sections[2],name:'Polishing / Shot Blasting / X-Ray'}]};
const employee=(id,section,position='Operator',extra={})=>({id,name:'TEST '+id,position,section,startDate:'2020-01-01',contractType:'Permanent',skillLevels:{},currentSkillLevel:1,...extra});
employees.push(employee('CASTING-SPECIALIST',sections[0],'Die casting Specialist'),employee('HEAD','Stamping Section','Head of Forming & Tooling'),...sections.map((section,i)=>employee('CASTING-'+i,section)),employee('CASTING-OTHER-PLANT',sections[0],'Die casting Specialist',{organizationPlant:'โรง 2'}));
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const factory=entry==='factory-organization.html',card=factory?'.factory-org-section':'.division-section',root=w.document.querySelector('.production-reporting-tree'),branch=root.querySelector('.production-casting-branch');assert(branch,'Casting Specialist branch exists');
   assert.deepEqual([...branch.querySelectorAll(card)].map(n=>n.dataset.orgSection),sections,'The three Section identities remain independent');assert.equal(root.querySelectorAll('[data-edit="CASTING-SPECIALIST"]').length,1);assert(branch.querySelector('.production-casting-top [data-edit="CASTING-SPECIALIST"]'));assert(branch.closest('.production-direct-sections'),'The existing Manager reporting branch is preserved');
   assert.equal(root.querySelectorAll('[data-edit="HEAD"]').length,1);assert.equal(root.querySelector('.production-head-branch').querySelectorAll(card).length,4);assert(!branch.querySelector('[data-edit="HEAD"]'));assert(!root.querySelector('[data-edit="CASTING-OTHER-PLANT"]'));
   for(let i=0;i<3;i++)assert(branch.querySelector('[data-org-section="'+sections[i]+'"] [data-edit="CASTING-'+i+'"]'));
   w.PPMSLanguage.refresh();assert(branch.textContent.includes('Polishing / Shot Blasting / X-Ray'));assert.equal(w.PPMSPositionTitle({position:'Die casting Specialist',section:sections[0]}),'ผู้เชี่ยวชาญงานหล่ออลูมิเนียม');w.PPMSLanguage.setLanguage('en');assert.equal(w.PPMSPositionTitle({position:'Die casting Specialist',section:sections[0]}),'Die Casting Specialist');w.PPMSLanguage.setLanguage('th');
   const jd=w.PPMSJDTemplates.draft({position:'Die casting Specialist',section:sections[0]});for(const name of ['Die-Casting Mold Maintenance','Die Casting','Polishing / Shot Blasting / X-Ray'])assert(jd.responsibilities.includes(name));
   if(!factory){const scope=w.PPMS_RUNTIME.organizationScope(),model=w.PPMSOrganizationEditor.model({parents:{}},w.PPMS_RUNTIME.factoryLayoutEmployees(),scope);assert.equal(model.parents.get('CASTING-SPECIALIST'),'MANAGER');for(let i=0;i<3;i++)assert.equal(model.parents.get('CASTING-'+i),'CASTING-SPECIALIST');assert.equal(model.parents.get('HEAD'),'SUP');assert.equal(model.parents.get('WELD-SUP'),'SUP');assert.equal(model.parents.get('DIRECT0'),'MANAGER');
    // A section filter retains the actual specialist employee's editable card.
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(250);const select=w.document.querySelector('#sectionSelect');select.value=sections[0];select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(250);assert(w.document.querySelector('.section-org-report [data-edit="CASTING-SPECIALIST"]'));
   }
   assert.deepEqual(errors,[]);console.log('PASSED three-section Die Casting Specialist:',entry);
  }finally{dom.window.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
