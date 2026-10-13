const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const {dom,w,errors}=await setup('index.html');
 try{
  w.openEmployeeEditor('OP0');await wait(150);
  const form=w.document.querySelector('#employeeForm'),position=form.elements.position,section=form.elements.section,division=form.elements.organizationDivision,plant=form.elements.organizationPlant;
  const choose=value=>{position.value=value;position.dispatchEvent(new w.Event('input',{bubbles:true}))};
  assert.equal(section.value,'Stamping Section');assert(!section.disabled);
  choose('Supervisor Production');assert(section.disabled,'Section locks immediately');assert(division.disabled,'Division locks to Production');assert(!plant.disabled,'Plant remains selectable');assert.equal(section.options.length,1);assert.equal(section.value,'Production Division');assert.equal(division.value,'Production Division');for(const name of ['stampingShift','stampingGroup','stampingRole','stampingMachines','sortingGroup']){assert(form.elements[name].disabled);assert(form.elements[name].closest('label').hidden)}
  w.PPMSLanguage.setLanguage('th');await wait(40);assert.equal(section.options[0].textContent,'ฝ่ายผลิต — ดูแล 7 แผนก');
  w.PPMSLanguage.setLanguage('en');await wait(40);assert.equal(section.options[0].textContent,'Production Division — supervises 7 sections');
  for(const name of ['Stamping','Bending','Tapping','Welding','CNC','Sorting 1','Sorting 2'])assert(w.document.querySelector('[data-supervisor-scope-note]').textContent.includes(name));w.PPMSLanguage.setLanguage('th');
  choose('Supervisor');assert(!section.disabled);assert(!division.disabled);assert.equal(section.value,'Stamping Section','Ordinary Section Supervisor restores Section');
  division.value='Quality Division';division.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(section.value,'Inspection Section');
  choose('หัวหน้างานฝ่ายผลิต');assert.equal(division.value,'Production Division');assert(section.disabled);plant.value='โรง 2';plant.dispatchEvent(new w.Event('change',{bubbles:true}));assert(section.disabled);assert.equal(section.value,'Production Division');
  choose('Operator');assert.equal(division.value,'Quality Division');assert.equal(section.value,'Inspection Section');assert(!section.disabled);
  choose('Sup Production');plant.value='โรง 2';plant.dispatchEvent(new w.Event('change',{bubbles:true}));
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(300);
  const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees')),person=saved.find(e=>e.id==='OP0');assert.equal(person.section,'Production Division');assert.equal(person.position,'Supervisor Production');assert.equal(person.organizationDivision,'Production Division');assert.equal(person.organizationPlant,'โรง 2');assert.equal(person.startDate,'2020-01-01');assert.equal(saved.length,employees.length);assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_employee_organization_v1')).OP0,{division:'Production Division',plant:'โรง 2'});
  const scoped=w.PPMSOrganizationScope.sections(saved,{division:'Production Division',plant:'โรง 2'});assert(!scoped.includes('Production Division'),'Division role does not create a physical Section');
  w.document.activeElement?.blur();w.PPMSOrganizationScope.activate({division:'Production Division',plant:'โรง 2'});w.document.querySelector('#nav [data-page="dashboard"]').click();await wait(200);assert.equal(w.document.querySelectorAll('.production-supervisor-top [data-edit="OP0"]').length,1);assert.equal(w.document.querySelectorAll('.division-section [data-edit="OP0"]').length,0);
  w.openEmployeeEditor('OP0');await wait(150);const reopened=w.document.querySelector('#employeeForm');assert(reopened.elements.section.disabled);assert.equal(reopened.elements.section.value,'Production Division');assert.equal(reopened.elements.organizationPlant.value,'โรง 2');
  w.document.querySelector('[data-action="close"]').click();w.document.activeElement?.blur();w.PPMSOrganizationScope.activate({division:'Production Division',plant:'โรง 1'});w.openEmployeeEditor('SUP');await wait(150);const legacy=w.document.querySelector('#employeeForm');assert(legacy.elements.section.disabled,'Existing supervisors lock on open');legacy.elements.position.value='Supervisor';legacy.elements.position.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(legacy.elements.section.value,'Bending Section','Legacy Section restores when role changes');assert(!legacy.elements.section.disabled);
  assert.deepEqual(errors,[],errors.join('\n'));console.log('PASSED immediate role lock, Thai/English labels, role aliases, restore on role change, editable plant, disabled-field save, offline persistence, reopen, legacy records and chart placement');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
