const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(const [id,position,section] of [['ADMIN','Production Administrator','Support Production Section'],['LEADER','Leader','Bending Section'],['SPECIALIST','CNC Specialist','CNC Section']])employees.push({id,name:'TEST '+id,section,position,startDate:'2020-01-01',contractType:'Permanent',skillLevels:{},currentSkillLevel:1});
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const roster=w.localStorage.getItem('ppms_v3_employees');
   for(const language of ['th','en','th']){
    w.PPMSLanguage.setLanguage(language);await wait(60);
    for(const id of ['ADMIN','LEADER','SPECIALIST']){const e=employees.find(e=>e.id===id),card=w.document.querySelector('[data-edit="'+id+'"]'),position=card.querySelector('[data-employee-position-id]');assert(position,id+' position exists');assert.equal(position.textContent,w.PPMSCardPositionTitle({...e,division:'Production Division'}));assert(!position.textContent.includes(' · '),'Cards must not append a Section');}
    const leader=employees.find(e=>e.id==='LEADER');assert.equal(w.PPMSCardPositionTitle(leader),language==='en'?'Leader':'หัวหน้าทีม');assert.notEqual(w.PPMSPositionTitle(leader),w.PPMSCardPositionTitle(leader),'The full Section-specific job title remains available to JD views');
    assert.equal(w.PPMSCardPositionTitle({position:'Production Engineer',section:'CNC Section'}),language==='en'?'Production Engineer':'วิศวกรการผลิต');assert.equal(w.PPMSCardPositionTitle({position:'Stamping Specialist',section:'Stamping Section'}),language==='en'?'Stamping Specialist':'ผู้เชี่ยวชาญงานปั๊มโลหะ');
   }
   if(entry!=='factory-organization.html'){
    const model=w.PPMSOrganizationEditor.chartMarkup(w.PPMS_RUNTIME.factoryLayoutEmployees(),e=>'<div class="person" data-edit="'+e.id+'">'+e.name+'</div>');assert(!model.includes('org-tree-section'),'Reporting cards do not add a Section badge');
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(240);const select=w.document.querySelector('#sectionSelect');select.value='Support Production Section';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(240);const card=w.document.querySelector('.section-org-report [data-edit="ADMIN"]');assert(card);assert.equal(card.querySelector('[data-employee-position-id]').textContent,w.PPMSCardPositionTitle(employees.find(e=>e.id==='ADMIN')));
   }
   assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster,'Card formatting does not edit employee data');assert.deepEqual(errors,[]);console.log('PASSED employee card positions without Section:',entry);
  }finally{dom.window.close()}
 }
 const layout=fs.readFileSync('factory-layout-v808.js','utf8'),start=layout.indexOf('  function person('),end=layout.indexOf('  function controls()',start),render=new Function('esc','pendingEmployee','admin','colors','rank','photo','teamControl',layout.slice(start,end)+'\nreturn person;')(x=>String(x),'',()=>false,{},()=>'',()=>'',()=>''),html=render({id:'TEST',name:'Test Name',position:'Leader',section:'Must not appear'});assert(!html.includes('Must not appear'));assert(html.includes('TEST · Leader'));
})().catch(error=>{console.error(error);process.exitCode=1});
