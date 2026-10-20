const fs=require('node:fs'),assert=require('node:assert/strict');const {setup}=require('./app-pages.cjs');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const {dom,w,errors}=await setup();w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};try{
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  const rows=JSON.parse(w.localStorage.getItem('ppms_v3_employees'));
  const stamp=rows.filter(e=>e.section==='Stamping Section'),cnc=rows.find(e=>e.section==='CNC Section');stamp[0].stampingShift='Team A';stamp[1].stampingShift='Team B';stamp[2].stampingShift='';cnc.organizationTeam='Team A';
  w.PPMS_RUNTIME.applyEmployeeRosterSnapshot({employees:rows,deletedEmployeeIds:[]},w.PPMS_RUNTIME.employeeRosterRevision());
  const layout={machines:{press:{name:'ปั๊ม 1#',section:'Stamping Section',mapId:'stamping_1_8',x:10,y:10,manpower:{total:3},assignments:Object.fromEntries(stamp.slice(0,3).map((e,i)=>['e'+i,{employeeId:e.id,shift:'day',assignedAt:'original'}]))}}},original=JSON.stringify(layout);
  const oldFetch=w.fetch;w.fetch=async(u,o)=>String(u).includes('ppmsFactoryLayout/v1.json')?{ok:true,status:200,json:async()=>structuredClone(layout),headers:{get:()=>'1'}}:oldFetch(u,o);
  const nav=async page=>{w.document.querySelector('#nav [data-page="'+page+'"]').click();await wait(150)};
  const change=(el,value)=>{el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
  await nav('manpower');assert(w.document.querySelector('#mpTeam'));
  w.document.querySelector('#mpTeam').focus();change(w.document.querySelector('#mpTeam'),'A');assert.deepEqual([...w.document.querySelectorAll('#manpowerPlanningPage [data-mp-person]')].map(e=>e.dataset.mpPerson).sort(),[stamp[0].id,cnc.id].sort(),'Team A across all Sections');
  change(w.document.querySelector('#mpSection'),'Stamping Section');assert.deepEqual([...w.document.querySelectorAll('#manpowerPlanningPage [data-mp-person]')].map(e=>e.dataset.mpPerson),[stamp[0].id]);
  change(w.document.querySelector('#mpTeam'),'B');assert.deepEqual([...w.document.querySelectorAll('#manpowerPlanningPage [data-mp-person]')].map(e=>e.dataset.mpPerson),[stamp[1].id]);
  change(w.document.querySelector('#mpTeam'),'all');assert(w.document.querySelector('[data-mp-person="'+stamp[0].id+'"]'));assert(w.document.querySelector('[data-mp-person="'+stamp[1].id+'"]'));
  let control=w.document.querySelector('[data-workplace-team-employee="'+stamp[2].id+'"]');assert(control);change(control,'Team B');await wait(100);
  let stored=JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id===stamp[2].id);assert.equal(stored.stampingShift,'Team B');assert.equal(stored.name,stamp[2].name);assert.equal(stored.section,stamp[2].section);const pending=JSON.parse(w.localStorage.getItem('ppms_v3_pending_employee_saves'))[stamp[2].id];assert.deepEqual(Array.from(pending.patchFields),['stampingShift','updatedAt']);assert.equal(JSON.stringify(layout),original);
  await nav('factoryLayout');change(w.document.querySelector('#flSection'),'Stamping Section');await wait(80);change(w.document.querySelector('#flTeam'),'B');change(w.document.querySelector('#flMachinePicker'),'press');await wait(80);
  const visible=[...w.document.querySelectorAll('#flDetail [data-workplace-team-employee]')].map(e=>e.dataset.workplaceTeamEmployee);assert(visible.includes(stamp[1].id));assert(visible.includes(stamp[2].id));assert(!visible.includes(stamp[0].id));
  control=w.document.querySelector('#flDetail [data-workplace-team-employee="'+stamp[2].id+'"]');assert.equal(control.value,'Team B','Layout sees the team edited in the manpower chart');change(control,'Team A');await wait(120);assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id===stamp[2].id).stampingShift,'Team A');assert.equal(JSON.stringify(layout),original,'Editing a team never moves machines, map coordinates, or attendance shifts');
  await nav('manpower');assert.equal(w.document.querySelector('#mpTeam').value,'B','Filter follows the user between views');change(w.document.querySelector('#mpTeam'),'A');assert(w.document.querySelector('[data-mp-person="'+stamp[2].id+'"]'),'Team edited in Layout is visible in manpower');
  await nav('dashboard');await assert.rejects(w.PPMS_RUNTIME.assignSectionChartTeam(stamp[0].id,'Team B',{...w.PPMS_RUNTIME.organizationScope(),section:'Stamping Section'}));
  assert.deepEqual(errors,[],errors.join('\n'));console.log('Passed Team A/B/all filtering across all or one Section, missing-team inline edit, employee-only patch persistence, shared Layout team display/edit, preserved assignments and scope guards.');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exit(1)});
