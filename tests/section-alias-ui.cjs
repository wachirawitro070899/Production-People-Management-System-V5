const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,employees}=new Function('require',prefix+'\nreturn {setup,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function unique(w,select){const key=w.PPMSOrganizationScope.sectionKey,values=Array.from(select.options,o=>o.value).filter(Boolean),keys=values.map(key);assert.equal(keys.length,new Set(keys).size,'No prefixed/unprefixed alias appears twice');return values}
(async()=>{
 for(const entry of ['index.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   w.document.querySelector('#nav [data-page="sectionChart"]').click();await wait(220);
   const select=w.document.querySelector('#sectionSelect'),values=unique(w,select);
   assert(values.includes('Support Production Section'));assert(!values.includes('Support Production'));
   assert(values.includes('Sorting 1')&&values.includes('Sorting 2'),'Sorting 1 and Sorting 2 stay independent options');
   for(const [section,id,other]of [['Sorting 1','OP5','OP6'],['Sorting 2','OP6','OP5'],['Support Production Section','DIRECT1','DIRECT0']]){
    const field=w.document.querySelector('#sectionSelect');field.value=section;field.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(220);const report=w.document.querySelector('.section-org-report');assert(report.querySelector('[data-edit="'+id+'"]'));assert(!report.querySelector('[data-edit="'+other+'"]'));
   }
   w.document.querySelector('#nav [data-page="add"]').click();await wait(220);unique(w,w.document.querySelector('#employeeForm [name="section"]'));
   assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees')).length,employees.length,'Employee master is retained');assert.deepEqual(errors,[]);
  }finally{dom.window.close()}
 }
 console.log('Passed: Section dropdowns, employee form and 404 entry have no department aliases; existing employees remain accessible; Sorting 1 and Sorting 2 select distinct rosters.');
})().catch(error=>{console.error(error);process.exitCode=1});
