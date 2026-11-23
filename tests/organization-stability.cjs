const assert=require('node:assert/strict'),{setup,employees}=require('./app-pages.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const base=employees.slice();for(let i=0;i<320;i++)employees.push({...base[i%base.length],id:'LOAD-'+i,name:'Load employee '+i});
async function close(dom){dom.window.requestAnimationFrame=()=>0;await wait(150);dom.window.close()}
(async()=>{
 const main=await setup();try{
  const {w,errors}=main;await wait(450);const app=w.document.getElementById('app'),chart=app.querySelector('.division-org'),card=chart.querySelector('.person[data-edit]'),button=card.querySelector('[data-jd-employee-id]');assert(button);
  for(let i=0;i<5;i++)w.PPMS_RUNTIME.refreshOrganizationChart(true);
  await wait(250);assert.equal(app.querySelector('.division-org'),chart,'Identical background renders retain the whole organization');assert.equal(chart.querySelector('.person[data-edit]'),card);assert.equal(card.querySelector('[data-jd-employee-id]'),button);
  button.click();const form=w.document.getElementById('jdForm');form.elements.responsibilities.value='Unsaved typing stays here';form.elements.responsibilities.focus();form.elements.responsibilities.setSelectionRange(7,7);
  for(let i=0;i<5;i++)w.dispatchEvent(new w.Event('ppms-employees-changed'));
  await wait(500);assert.equal(w.document.getElementById('jdForm'),form);assert.equal(form.elements.responsibilities.value,'Unsaved typing stays here');assert.equal(form.elements.responsibilities.selectionStart,7);assert.equal(w.document.activeElement,form.elements.responsibilities);
  assert.deepEqual(errors,[]);console.log('PASS 400-person main chart: repeated unchanged renders preserve all cards, JD buttons, typing, focus and caret.');
 }finally{await close(main.dom)}
 const factory=await setup(true,'factory-organization.html');try{
  const {w,errors}=factory;await wait(600);/* Hydrate position titles after the late JD formatter loads. */w.dispatchEvent(new w.Event('ppms-employees-changed'));await wait(250);const detail=w.document.getElementById('factoryDivisionChartDetail'),card=detail.querySelector('.factory-chart-person[data-edit]'),button=card.querySelector('[data-jd-employee-id]');assert(button);
  let replacements=0;const observer=new w.MutationObserver(rows=>{for(const r of rows)if(r.target===detail&&r.removedNodes.length)replacements++});observer.observe(detail,{childList:true});
  for(let i=0;i<10;i++)w.dispatchEvent(new w.Event('ppms-employees-changed'));
  await wait(350);assert.equal(detail.querySelector('.factory-chart-person[data-edit]'),card);assert.equal(card.querySelector('[data-jd-employee-id]'),button);assert.equal(replacements,0,'Repeated snapshots do not replace the factory chart');
  // Real roster changes must still reach the chart.
  const roster=JSON.parse(w.localStorage.getItem('ppms_v3_employees')),person=roster.find(e=>e.id===card.dataset.edit);person.name='UPDATED EMPLOYEE NAME';w.localStorage.setItem('ppms_v3_employees',JSON.stringify(roster));w.dispatchEvent(new w.Event('ppms-employees-changed'));await wait(350);
  assert(detail.textContent.includes('UPDATED EMPLOYEE NAME'));assert.equal(replacements,1,'A real change replaces the chart once');observer.disconnect();assert.deepEqual(errors,[]);console.log('PASS 400-person factory chart: 10 repeated snapshots cause zero replacements; a real name change updates once.');
 }finally{await close(factory.dom)}
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
