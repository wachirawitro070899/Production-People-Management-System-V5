const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup}=new Function('require',prefix+'\nreturn {setup};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
   const roster=w.localStorage.getItem('ppms_v3_employees'),section='Engineering Support';
   const button=entry==='factory-organization.html'?w.document.querySelector('[data-add-section-position][data-section="Engineering Support"]'):w.document.querySelector('[data-org-add-slot][data-section="Engineering Support"]')||w.document.querySelector('[data-org-add-slot][data-section="Engineering Support Section"]');
   assert(button,'Every section provides an Add vacant position action');button.click();
   const form=w.document.querySelector('#positionSlotDialog form');assert(form,'The staffing form opens');assert(/Engineering Support/.test(form.elements.section.value));form.elements.name.value='Production Engineer';form.elements.amount.value='2';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(250);
   assert(!w.document.querySelector('#positionSlotDialog'));const target=w.PPMSPositionSlots.plans().find(t=>t.position==='Production Engineer');assert.equal(target.required,2);assert.equal(target.count,2);
   const root=w.document.querySelector('[data-org-section="Engineering Support"],[data-org-section="Engineering Support Section"]');assert.equal(root.querySelectorAll('[data-position-vacancy-id="'+target.id+'"]').length,2);assert.equal(root.querySelectorAll('[data-position-vacancy-id] [data-edit]').length,0);assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster);assert(w.document.querySelector('.position-slot-summary').textContent.includes('2'));
   if(entry!=='factory-organization.html'){
    const view=w.document.querySelector('#organizationStructureView');view.value='tree';view.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(150);assert.equal(w.document.querySelectorAll('.organization-reporting-chart [data-position-vacancy-id="'+target.id+'"]').length,2);
    w.PPMSLanguage.setLanguage('en');await wait(80);assert.equal(w.document.querySelector('[data-org-add-slot]').textContent,'Add vacant position');assert(w.document.querySelector('.position-slot-summary').textContent.includes('HR recruitment'));w.PPMSLanguage.setLanguage('th');
   }
   w.PPMSOrganizationManager.applyMaster({...JSON.parse(w.localStorage.getItem('ppms_organization_master_v1')),positionVacancies:[]});assert.equal(w.PPMSPositionSlots.plans().find(t=>t.position==='Production Engineer').count,2,'An incoming master snapshot replays the durable pending staffing request');
   assert.deepEqual(errors,[]);console.log('PASSED staffing form, scoped vacancies, HR summary, original employees, pending replay and chart rendering:',entry);
  }finally{dom.window.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
