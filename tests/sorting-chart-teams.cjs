const fs=require('node:fs'),assert=require('node:assert/strict');
let prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
prefix=prefix.replace('w.alert=()=>{};', 'w.HTMLCanvasElement.prototype.getContext=()=>null;w.alert=()=>{};');
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const extra=(id,section,fields={})=>({id,name:'TEST '+id,section,position:'Operator',contractType:'Permanent',startDate:'2020-01-01',currentSkillLevel:1,skillLevels:{Safety:3},...fields});
employees.push(extra('SORT-DIRECT-1','Sorting 1'),extra('SORT-DIRECT-2','Sorting 2 Section'),extra('SORT-THAI','คัดแยก ๒'),extra('SORT-UNGROUPED','Sorting Section'),extra('SORT-LEADER','Sorting Section',{position:'Leader',sortingGroup:'Sorting 1'}),extra('SORT-OTHER-PLANT','Sorting Section',{organizationPlant:'โรง 2'}));
const ids=['OP5','OP6','SORT-DIRECT-1','SORT-DIRECT-2','SORT-THAI','SORT-UNGROUPED','SORT-LEADER'];
async function nav(w,page){w.document.querySelector('#nav [data-page="'+page+'"]').click();await wait(240)}
async function select(w,id,value){const node=w.document.getElementById(id);assert(node,id);node.value=value;node.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(300)}
(async()=>{
 for(const entry of ['index.html','404.html','factory-organization.html']){
  const {w,errors}=await setup(entry),factory=entry==='factory-organization.html';
  const selector=factory?'.factory-org-section':'.division-section';
  const charts=[...w.document.querySelectorAll(selector)].filter(node=>/sorting/i.test(node.dataset.orgSection));assert.equal(charts.length,1,entry+' has one Sorting section');assert.equal(charts[0].dataset.orgSection,'Sorting Section');
  for(const id of ids)assert.equal(charts[0].querySelectorAll('[data-edit="'+id+'"]').length,1,id+' appears exactly once');assert(!charts[0].querySelector('[data-edit="SORT-OTHER-PLANT"]'));
  const api=w.PPMSOrganizationScope;for(const alias of ['Sorting','Sorting 1','Sorting 2 Section','คัดแยก ๒'])assert.equal(api.combinedSection(alias),'Sorting Section');
  assert.equal(api.sectionKey('Sorting 1'),'sorting1','Historical section keys remain stable');
  assert.equal(api.sections(employees).filter(api.isSorting).length,1);
  if(!factory){
   w.sessionStorage.setItem('chartSec','Sorting 2');await nav(w,'sectionChart');
   assert.equal(w.document.querySelector('#sectionSelect').value,'Sorting Section','Old selection opens combined chart');
   assert.equal([...w.document.querySelector('#sectionSelect').options].filter(o=>api.isSorting(o.value)).length,1);
   const source=w.document.querySelector('.sorting-combined');assert(source);for(const id of ids)assert(source.querySelector('[data-edit="'+id+'"]'));
   assert.equal(w.document.querySelectorAll('.sorting-print-page').length,1,'One unified printable chart');for(const id of ids)assert(w.document.querySelector('.sorting-print-page [data-edit="'+id+'"]'));
   assert.equal(w.document.querySelector('[data-employment-count="permanent"]').textContent,String(ids.length));
   await select(w,'sectionChartTeamView','split');assert.equal(w.document.querySelectorAll('[data-section-chart-team="Team A"]').length,1,'One shared Team A');
   Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
   const before=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));
   await w.PPMS_RUNTIME.assignSectionChartTeam('SORT-DIRECT-2','Team B',{...w.PPMS_RUNTIME.organizationScope(),section:'Sorting Section',sortingGroup:'',targetSortingGroup:''});await wait(220);
   assert(w.document.querySelector('[data-section-chart-team="Team B"] [data-edit="SORT-DIRECT-2"]'));
   const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees')),old=before.find(e=>e.id==='SORT-DIRECT-2'),current=saved.find(e=>e.id==='SORT-DIRECT-2');assert.equal(current.section,old.section);assert.deepEqual(current.skillLevels,old.skillLevels);assert.equal(saved.length,before.length);
   await w.PPMS_RUNTIME.assignSectionChartTeam('SORT-UNGROUPED','Team A',{...w.PPMS_RUNTIME.organizationScope(),section:'Sorting Section',sortingGroup:'',targetSortingGroup:''});
   await nav(w,'matrix');w.sessionStorage.setItem('matrixSortingGroup','Sorting 1');await select(w,'matrixSection','Sorting Section');
   assert.equal(w.document.querySelector('#matrixSortingGroup'),null,'No legacy group filter');for(const id of ids)assert([...w.document.querySelectorAll('.skill-matrix-table tbody tr')].some(row=>row.textContent.includes(id)),id+' included in combined matrix');
   w.document.querySelector('[data-action="bulkSkills"]').click();for(const id of ids)assert(w.document.querySelector('[name="bulkEmployee"][value="'+id+'"]'));w.document.querySelector('[data-action="close"]').click();
   await nav(w,'cards');await select(w,'cardSection','Sorting Section');for(const id of ids)assert([...w.document.querySelector('#cardEmployee').options].some(o=>o.value===id));
   await nav(w,'sectionChart');assert.equal(w.document.querySelector('#sectionSelect').value,'Sorting Section');
   const leader=employees.find(e=>e.id==='SORT-LEADER');assert(w.PPMSSectionAccess.sameSection(leader,employees.find(e=>e.id==='SORT-DIRECT-2')));assert(!w.PPMSSectionAccess.sameSection(leader,employees.find(e=>e.id==='SORT-OTHER-PLANT')));
  }
  assert.deepEqual(errors,[],entry+' errors');console.log('PASS',entry,'merged Sorting, complete roster, scoped counts'+(factory?'':', unified print, teams, skills and cards'));
 }
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
