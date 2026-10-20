const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,master,employees,checkHierarchy}=new Function('require',prefix+'\nreturn {setup,master,employees,checkHierarchy};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
master.sectionLabels={'Production Division::โรง 1':[{section:'Stamping Section',name:'แผนกปั๊มใหม่'},{section:'Sorting 1',name:'คัดงานหน้า'},{section:'Sorting 2',name:'คัดงานหลัง'}]};
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   checkHierarchy(w,entry==='factory-organization.html');w.PPMSLanguage.refresh();
   const card=w.document.querySelector('[data-org-section="Stamping Section"]'),heading=card.querySelector('h3,h4');assert.equal(heading.textContent,'แผนกปั๊มใหม่');assert(card.querySelector('[data-rename-section]'),'Each Section has a direct rename action');assert.equal(card.querySelectorAll('[data-edit="STAMP-DAY"]').length,1);assert.equal(card.querySelectorAll('[data-edit="STAMP-NIGHT"]').length,1);
   card.querySelector('[data-rename-section]').click();const dialog=w.document.querySelector('#renameSectionDialog'),f=dialog.querySelector('form');assert.equal(f.elements.section.value,'Stamping Section');assert.equal(f.elements.name.value,'แผนกปั๊มใหม่');dialog.querySelector('[data-rename-cancel]').click();assert(!dialog.isConnected);
   if(entry==='index.html'){
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(260);let select=w.document.querySelector('#sectionSelect');select.value='Stamping Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(260);w.PPMSLanguage.refresh();assert.equal(w.document.querySelector('#sectionSelect').selectedOptions[0].textContent,'แผนกปั๊มใหม่');assert(w.document.querySelector('.section-org-report [data-edit="STAMP-DAY"]'));
    w.document.querySelector('[data-page="dashboard"]').click();await wait(260);w.document.querySelector('[data-org-section="Stamping Section"] [data-edit="STAMP-DAY"]').click();await wait(200);let form=w.document.querySelector('#employeeForm');assert(form);w.PPMSLanguage.refresh();assert.equal(form.elements.section.value,'Stamping Section');assert.equal(form.elements.section.selectedOptions[0].textContent,'แผนกปั๊มใหม่');
    w.document.querySelector('#closeModal').click();await wait(50);w.document.activeElement?.blur();w.document.querySelector('[data-page="factoryLayout"]').click();await wait(250);w.HTMLElement.prototype.scrollTo=()=>{};
    let cloud={machines:{one:{name:'Press 1',section:'Stamping Section',division:'Production Division',plant:'โรง 1',assignments:{a:{employeeId:'STAMP-DAY',shift:'day'}}}}},writes=0;
    w.fetch=async(url,options={})=>{const response=value=>({ok:true,status:200,headers:{get:()=> '"layout-version"'},json:async()=>structuredClone(value)});if(String(url).includes('/ppmsFactoryLayout/v1.json')){if(options.method==='PUT'){writes++;cloud=JSON.parse(options.body)}return response(cloud)}return response(null)};
    w.document.querySelector('#flReload').click();await wait(180);w.PPMSLanguage.refresh();select=w.document.querySelector('#flSection');select.value='Stamping Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(80);w.PPMSLanguage.refresh();assert.equal(select.selectedOptions[0].textContent,'แผนกปั๊มใหม่');
    w.document.querySelector('[data-fl-machine="one"]')?.click();await wait(30);const machinePicker=w.document.querySelector('#flMachinePicker');machinePicker.value='one';machinePicker.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(30);
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
    w.document.querySelector('[data-fl-edit]').click();form=w.document.querySelector('.fl-dialog form');assert.equal(form.elements.machineSection.value,'แผนกปั๊มใหม่');form.elements.machineName.value='Press renamed';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(100);assert.equal(cloud.machines.one.name,'Press renamed');assert.equal(cloud.machines.one.section,'Stamping Section');assert.equal(cloud.machines.one.assignments.a.employeeId,'STAMP-DAY');assert.equal(writes,1,'Editing a machine with a renamed Section preserves existing people assignments');
    w.document.querySelector('[data-page="manpower"]').click();await wait(150);w.PPMSLanguage.refresh();assert([...w.document.querySelectorAll('#mpSection option')].some(option=>option.value==='Stamping Section'&&option.textContent==='แผนกปั๊มใหม่'));assert(w.document.querySelector('[data-mp-person="STAMP-DAY"],[data-employee="STAMP-DAY"],[data-employee-id="STAMP-DAY"]')||w.document.querySelector('#manpowerPlanningPage').textContent.includes('TEST STAMP-DAY'));
   }
   assert.deepEqual(errors,[]);console.log('Passed renamed Section integration:',entry);
  }finally{dom.window.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
