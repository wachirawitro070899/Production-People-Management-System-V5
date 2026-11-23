const assert=require('node:assert/strict'),fs=require('node:fs'),{setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const sourcePerson=(id,section,position)=>({id,name:'PRINT TEST '+id,section,position,contractType:'Permanent',startDate:'2020-01-01',currentSkillLevel:1,skillLevels:{}});
employees.splice(0,employees.length,...['Welding Section','Stamping Section','Sorting Section'].flatMap((section,s)=>['Manager','Supervisor','Leader',...Array(26).fill('Operator')].map((position,i)=>({...sourcePerson('PRINT-'+s+'-'+i,section,position),sortingGroup:i%2?'Sorting 1':'Sorting 2'}))));
(async()=>{const {dom,w,errors}=await setup();try{
 w.document.querySelector('#nav [data-page="sectionChart"]').click();await wait(300);
 const stored=w.localStorage.getItem('ppms_v3_employees');
 for(const section of ['Welding Section','Stamping Section','Sorting Section']){
  const select=w.document.querySelector('#sectionSelect');select.value=section;select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(300);
  const report=w.document.querySelector('.section-org-report'),before=JSON.stringify([...report.querySelectorAll('[data-edit]')].map(c=>c.dataset.edit));
  for(const paper of ['A4','A3']){
   w.document.querySelector('#orgPaperSize').value=paper;w.dispatchEvent(new w.Event('beforeprint'));
   const root=w.document.getElementById('orgSingleSheetPrintRoot');assert(root,section+' gets the new print shell');assert(root.hidden,'Print copies stay hidden on screen');assert(root.querySelectorAll('.org-single-sheet').length);
   const cards=[...root.querySelectorAll('[data-org-print-employee-id]')],expected=employees.filter(e=>e.section===section);
   assert.equal(cards.length,expected.length,section+' prints every employee once');
   for(const person of expected){const card=cards.find(c=>c.dataset.orgPrintEmployeeId===person.id);assert(card,person.id);assert(card.textContent.includes(person.name));const original=report.querySelector('[data-edit="'+person.id+'"]');assert.equal(card.querySelector('small').textContent,original.querySelector('small').textContent,person.id+' preserves all displayed personal details');assert(card.querySelector('small span')?.textContent.trim(),person.id+' has its current position');assert(card.querySelector('small br'),'Use the real two-line employee metadata');assert(!card.hasAttribute('data-edit'),'Copies do not become live edit/drag targets')}
   const page=root.firstElementChild;assert.equal(page.firstElementChild.className,'org-document-header');assert(page.lastElementChild.classList.contains('org-document-approval'),'Signatures follow the complete roster');assert.equal(page.dataset.compactPage,paper);
   assert.equal(JSON.stringify([...report.querySelectorAll('[data-edit]')].map(c=>c.dataset.edit)),before,'Print leaves the source roster intact');assert(!report.contains(root),'Print layout stays outside the live employee chart');
   w.dispatchEvent(new w.Event('afterprint'));assert(!w.document.getElementById('orgSingleSheetPrintRoot'));assert(!w.document.getElementById('orgCompactPrintStyle'));assert(!w.document.body.classList.contains('org-compact-print-active'));
  }
 }
 assert.equal(w.localStorage.getItem('ppms_v3_employees'),stored,'Printing never changes employee records');
 w.document.body.classList.add('ppms-jd-print');w.dispatchEvent(new w.Event('beforeprint'));assert(!w.document.getElementById('orgSingleSheetPrintRoot'),'JD printing is not replaced by an organization chart');w.document.body.classList.remove('ppms-jd-print');
 assert.deepEqual(errors,[]);console.log('PASS A4/A3: real normal, Stamping and Sorting cards; all 29 employees and two-line metadata; signatures after roster; source/data unchanged; print cleanup; JD isolation.');
 }finally{dom.window.close()}process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
