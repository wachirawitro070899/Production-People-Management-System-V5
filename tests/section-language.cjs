const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('(async()=>{')[0];
const {setup,master,employees}=new Function('require',prefix+'\nreturn {setup,master,employees};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),scope='Production Division::โรง 1';
const sections=[
 ['Die-Casting Mold Maintenance Section','แผนกซ่อมบำรุงแม่พิมพ์หล่ออลูมิเนียม','Die-Casting Mold Maintenance Section'],
 ['หลอมอลูมิเนียม','หลอมอลูมิเนียม','Die casting'],
 ['คัดครีบ-พ่นทราย-X-Ray','คัดครีบ-พ่นทราย-X-Ray','Polishing / Shot Blasting / X-Ray']
];
master.sectionMap[scope].push(...sections.map(x=>x[0]));master.sections.push(...sections.map(x=>x[0]));
master.sectionLabels={[scope]:[{section:sections[1][0],name:'Die casting'},{section:sections[2][0],name:sections[2][2]}]};
for(const [i,[section]]of sections.entries())employees.push({id:'CAST-'+i,name:'TEST CAST-'+i,position:'Operator',section,startDate:'2020-01-01',contractType:'Permanent'});
(async()=>{
 for(const entry of ['index.html','factory-organization.html','404.html']){
  const {dom,w,errors}=await setup(entry);
  try{
   const api=w.PPMSLanguage,roster=w.localStorage.getItem('ppms_v3_employees'),settings=w.localStorage.getItem('ppms_organization_master_v1');
   for(let round=0;round<3;round++)for(const [lang,index]of [['th',1],['en',2]]){
    api.setLanguage(lang);await wait(40);
    for(const [section,th,en]of sections){
     const card=w.document.querySelector('[data-org-section="'+section+'"]');assert(card,section);
     assert.equal(card.querySelector('h3,h4').textContent,lang==='th'?th:en);
    }
    const copy=w.document.implementation.createHTMLDocument('Print');copy.body.innerHTML=w.document.querySelector('.production-reporting-tree').outerHTML;
    api.translateDocument(copy);for(const row of sections)assert.equal(copy.querySelector('[data-org-section="'+row[0]+'"] h3,[data-org-section="'+row[0]+'"] h4').textContent,row[index]);
   }
   if(entry!=='factory-organization.html'){
    w.document.querySelector('[data-page="sectionChart"]').click();await wait(250);
    for(const [section,th,en]of sections){
     const select=w.document.querySelector('#sectionSelect');select.value=section;select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(200);
     for(const [lang,expected]of [['th',th],['en',en],['th',th]]){
      api.setLanguage(lang);await wait(40);const field=w.document.querySelector('#sectionSelect');
      assert.equal(field.value,section);assert.equal(field.selectedOptions[0].textContent,expected);assert(w.document.querySelector('[data-edit="CAST-'+sections.findIndex(r=>r[0]===section)+'"]'));
     }
    }
   }
   for(const [en,th]of [['Human Resources Section','แผนกทรัพยากรบุคคล'],['Safety Section','แผนกความปลอดภัย'],['Accounting Section','แผนกบัญชี'],['Planning Section','แผนกวางแผน'],['Purchasing Section','แผนกจัดซื้อ'],['Marketing Section','แผนกการตลาด']]){assert.equal(api.translate(en,'th'),th);assert.equal(api.translate(th,'en'),en)}
   assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster);assert.equal(w.localStorage.getItem('ppms_organization_master_v1'),settings);assert.deepEqual(errors,[]);
   await wait(80);console.log('Passed Section TH/EN headings, scoped renamed labels, stable selections and roster, print copies:',entry);
  }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(150);dom.window.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
