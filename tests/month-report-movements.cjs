const assert=require('node:assert/strict'),{setup}=require('./app-pages.cjs');
(async()=>{
 const app=await setup(true,'index.html',{beforeScripts(w){w.HTMLCanvasElement.prototype.getContext=()=>null;}}),w=app.w;
 try{
  const api=w.PPMSMonthReport,scope={division:'Production Division',plant:'โรง 1'};
  const person=(id,section,startDate,extra={})=>({id,name:'Test '+id,section,startDate,organizationDivision:scope.division,organizationPlant:scope.plant,...extra});
  let employees=[person('A','Stamping Section','2026-10-01'),person('B','Stamping Section','2026-10-02'),person('C','Welding Section','2026-10-03'),person('OLD','No movements Section','2020-01-01'),person('WH','WH','2026-10-01',{organizationDivision:'Warehouse Division',organizationPlant:'รวม'}),person('PLANT2','Wrong plant Section','2026-10-01',{organizationPlant:'โรง 2'})];
  const exit=person('LEFT','Stamping Section','2020-01-01',{resignationDate:'2026-10-04'});
  let history=[exit,{...exit},person('CNC1','CNC Section','2020-01-01',{resignationDate:'2026-10-05'}),person('CNC2','CNC Section','2020-01-01',{resignationDate:'2026-10-06'})];
  let ctx={...w.PPMS_RUNTIME.monthReportContext(),allowed:true,allSections:true,isAdmin:true,scope};
  w.PPMS_RUNTIME.monthReportContext=()=>({...ctx,employees,training:[],examResults:[]});
  w.PPMSResignations.reportState=()=>({records:history,loadedAt:Date.now()});
  w.PPMSMonthDevelopment.reportState=()=>({loadedAt:Date.now()});
  w.document.querySelector('#nav [data-page="monthReport"]').click();
  function paint(month,section=''){
   w.sessionStorage.setItem('ppms_month_report_v917::Production Division::โรง 1::'+(ctx.allSections?'ALL':ctx.section),JSON.stringify({month,section}));api.paint();
   return w.document.querySelector('[data-month-summary]');
  }
  function rows(sheet){return [...sheet.querySelectorAll('[data-month-department]')].map(row=>({name:row.dataset.monthDepartment,values:[...row.cells].map(cell=>cell.textContent)}));}
  let sheet=paint('2026-10');
  assert.equal(sheet.dataset.monthMovements,'true','Equal hires and exits still show movement');
  assert.deepEqual(rows(sheet).map(r=>r.name).sort(),['CNC Section','Stamping Section','Welding Section']);
  assert.deepEqual(rows(sheet).find(r=>r.name==='Stamping Section').values,['Stamping','2','1','+1']);
  assert.deepEqual(rows(sheet).find(r=>r.name==='CNC Section').values,['CNC','0','2','-2']);
  assert.equal(sheet.querySelector('.mr-movement-table tfoot').textContent,'รวม330');
  assert.equal(sheet.querySelectorAll('[data-month-chart]').length,4);
  assert(!sheet.textContent.includes('No movements'));
  assert(!sheet.querySelector('[data-month-chart="departments"]').textContent.includes('Section'));
  assert.equal(w.document.querySelectorAll('[data-month-details]').length,2);
  sheet=paint('2026-10','Stamping Section');assert.equal(rows(sheet).length,1);assert.equal(rows(sheet)[0].values[1],'2');
  sheet=paint('2026-11');assert.equal(sheet.querySelectorAll('.mr-kpi,[data-month-chart="departments"]').length,0);assert(sheet.querySelector('[data-month-chart="trend"]'),'Keep historical trend when previous months have movements');assert.equal(w.document.querySelectorAll('[data-month-movement-summary],[data-month-details],[data-month-count]').length,0);
  assert.deepEqual([...sheet.querySelectorAll('h3')].map(node=>node.textContent.slice(0,2)),['01','02','03']);
  sheet=paint('2027-06');assert.equal(sheet.querySelectorAll('.mr-kpi,[data-month-chart="departments"],[data-month-chart="trend"]').length,0);assert.equal(sheet.querySelectorAll('[data-month-chart]').length,2,'Training and exams remain available');
  // Every active department is named, including more than the former top-six limit.
  employees=Array.from({length:14},(_,i)=>person('M'+i,'Department '+i+' Section','2026-10-01'));history=[];
  sheet=paint('2026-10');assert.equal(rows(sheet).length,14);assert(sheet.classList.contains('mr-expanded'));assert(!sheet.textContent.includes('อื่น ๆ'));assert.equal(w.document.querySelector('[data-month-details="left"]'),null);assert(w.document.querySelector('[data-month-details="joined"]'));
  employees=[person('SAFE','<img src=x onerror=alert(1)> Section','2026-10-01')];sheet=paint('2026-10');assert.equal(sheet.querySelectorAll('img,[onerror]').length,0);assert(rows(sheet)[0].values[0].includes('<img'));
  employees=[person('OWN','Stamping Section','2026-10-01'),person('OTHER','Welding Section','2026-10-01')];ctx={...ctx,allSections:false,isAdmin:false,section:'Stamping Section'};sheet=paint('2026-10','Stamping Section');assert.deepEqual(rows(sheet).map(r=>r.name),['Stamping Section']);
  w.PPMSLanguage.setLanguage('en');sheet=w.document.querySelector('[data-month-summary]');assert(sheet.textContent.includes('Movements by department'));assert.equal(sheet.querySelector('.mr-movement-table th').textContent,'Department');
  assert.deepEqual(app.errors,[]);console.log('PASS named department counts and totals, no zero rows or empty movement blocks, historical trend, sequential headings, month/department filters, all departments, escaping, role scope and English.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await new Promise(r=>setTimeout(r,200));w.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
