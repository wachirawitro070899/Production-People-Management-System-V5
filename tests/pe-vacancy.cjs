const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,master,employees}=new Function('require',prefix+'\nreturn {setup,master,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),section='Engineering Support Section';
master.positionVacancies=[{id:'additional-pe',division:'Production Division',plant:'โรง 1',section,position:'Production Engineer',required:2}];
const pe={id:'PE',name:'TEST PE',section,position:'Production Engineer',contractType:'Permanent',startDate:'2020-01-01',skillLevels:{},currentSkillLevel:1};employees.push(pe,{...pe,id:'TOOLING',name:'TOOLING',position:'Tooling Engineer'},{...pe,id:'OTHER-PLANT-PE',name:'OTHER PE',organizationPlant:'โรง 2'});
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const root=w.document.querySelector('[data-org-section="Engineering Support Section"],[data-org-section="Engineering Support"]'),card=root.querySelector('[data-position-vacancy-id="additional-pe"]');assert(card,'Additional PE vacancy appears beside current engineers');assert.equal(root.querySelectorAll('[data-position-vacancy-id]').length,1);assert(card.textContent.includes('ว่าง'));assert(card.textContent.includes('(PE)'));assert(!card.matches('[data-edit],[data-employee-id]'));assert(!card.querySelector('[data-open-jd],[data-jd-employee-id]'));assert(root.querySelector('[data-edit="PE"]'));assert(root.querySelector('[data-edit="TOOLING"]'));
   const roster=w.localStorage.getItem('ppms_v3_employees');w.PPMSLanguage.setLanguage('en');await wait(50);assert(card.textContent.includes('Production Engineer (PE)'));w.PPMSLanguage.setLanguage('th');await wait(50);assert(card.textContent.includes('วิศวกรการผลิต (PE)'));assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster);
   assert.equal(w.PPMSProductionHierarchy.positionVacancies(section,{division:'Production Division',plant:'โรง 2'}).length,0);assert.equal(w.PPMSProductionHierarchy.positionVacancies(section,{division:'Quality Division',plant:'รวม'}).length,0);assert.equal(w.PPMSProductionHierarchy.positionVacancies('Tooling Maintenance Section').length,0);
   if(entry!=='factory-organization.html'){
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(220);const select=w.document.querySelector('#sectionSelect');select.value=section;select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(250);assert.equal(w.document.querySelectorAll('.section-org-report [data-position-vacancy-id="additional-pe"]').length,1);assert.equal(w.document.querySelectorAll('.section-team-assignment [data-position-vacancy-id]').length,0,'A vacancy is not repeated for each team');w.print();
    w.document.querySelector('[data-page="ngDashboard"]').click();await wait(250);assert(!w.document.querySelector('.employee-history-report [data-position-vacancy-id]'),'Vacancies are not employee history cards');
   }
   const source=JSON.parse(roster),filled=[...source,{...pe,id:'NEW-PE',position:'PE'}];w.localStorage.setItem('ppms_v3_employees',JSON.stringify(filled));assert.equal(w.PPMSProductionHierarchy.positionVacancies(section).length,0,'Hiring another PE fills the planned second slot');assert.equal(source.length,employees.length);
   assert.deepEqual(errors,[]);console.log('PASSED additional PE vacancy:',entry);
  }finally{dom.window.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
