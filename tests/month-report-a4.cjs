/* Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..');
const pageCount=pdf=>(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   const testModules=process.env.PPMS_PDF_TEST_MODULES;
   if(testModules&&url.href.includes('html2canvas.min.js'))return route.fulfill({body:fs.readFileSync(path.join(testModules,'html2canvas/dist/html2canvas.min.js')),contentType:'text/javascript'});
   if(testModules&&url.href.includes('jspdf.umd.min.js'))return route.fulfill({body:fs.readFileSync(path.join(testModules,'jspdf/dist/jspdf.umd.min.js')),contentType:'text/javascript'});
   if(url.hostname==='ppms.test'){
    const file=path.join(repo,decodeURIComponent(url.pathname.slice(1)||'index.html'));
    return route.fulfill({body:fs.existsSync(file)?fs.readFileSync(file):'',contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html'});
   }
   if(url.href.includes('adminAccounts'))return route.fulfill({json:[{username:'tester',passwordHash:'test',active:true,owner:false}]});
   return route.fulfill(url.pathname.endsWith('.json')?{json:null}:{body:'',contentType:'text/javascript'});
  });
  await page.addInitScript(()=>{sessionStorage.setItem('ppms_admin','1');sessionStorage.setItem('ppms_admin_user','tester');sessionStorage.setItem('ppms_device_lock_verified','test-device');localStorage.setItem('ppms_v768_admin_device_id','test-device')});
  await page.goto('https://ppms.test/');await page.locator('#nav [data-page="monthReport"]').click();await page.locator('[data-month-summary]').waitFor();
  // Fixed, local fixtures: no production data is read or written.
  await page.evaluate(()=>{
   const scope={division:'Production Division',plant:'โรง 1'},sections=['Stamping Section','Welding Section','CNC Section','Tapping Section','Bending Section','Engineering Support Section','Machine Maintenance Section','Tooling Maintenance Section'];
   const person=(id,section,startDate)=>({id,name:'Test '+id,thaiName:'พนักงานทดสอบ '+id,position:'Operator',section,startDate,organizationDivision:scope.division,organizationPlant:scope.plant});
   const people=sections.map((s,i)=>person('P'+i,s,'2026-10-01'));
   const history=[{...person('E1',sections[0],'2026-10-02'),resignationDate:'2026-10-05'},{...person('E2',sections[1],'2026-09-01'),resignationDate:'2026-10-07'}];
   const old=PPMS_RUNTIME.monthReportContext();
   PPMS_RUNTIME.monthReportContext=()=>({...old,scope,employees:people,training:[{id:'T1',section:sections[0],plannedDate:'2026-10-03',completedDate:'2026-10-04',status:'Completed',participants:[{employeeId:'P0'}],title:'Safety'},{id:'T2',section:sections[1],plannedDate:'2026-10-05',status:'Planned',title:'Quality'}],examResults:[{id:'X1',employeeId:'P0',date:'2026-10-06',examType:'upskill',score:90},{id:'X2',employeeId:'P1',date:'2026-10-07',examType:'upskill',score:95,approvalStatus:'pending'}]});
   PPMSResignations.reportState=()=>({records:history,loadedAt:Date.now()});PPMSMonthDevelopment.reportState=()=>({loadedAt:Date.now()});
   sessionStorage.setItem('ppms_month_report_v917::Production Division::โรง 1::ALL',JSON.stringify({month:'2026-10',section:''}));PPMSMonthReport.paint();
  });
  assert.equal(await page.locator('[data-month-count="joined"]').textContent(),'9');assert.equal(await page.locator('[data-month-count="left"]').textContent(),'2');
  assert.equal(await page.locator('.mr-chart').count(),4);assert.equal(await page.locator('.mr-section-row').count(),7);assert.match(await page.locator('.mr-section-bars').textContent(),/อื่น ๆ รวม 2/);
  const exported=await page.evaluate(async()=>{const frame=await PPMSMonthVisual.frame();const html=frame.contentDocument.documentElement.outerHTML;frame.remove();return html});
  const print=await browser.newPage();await print.route('**/*',r=>r.fulfill({body:fs.readFileSync(path.join(repo,'month-report-visual-v918.css')),contentType:'text/css'}));await print.setContent(exported);await print.evaluate(()=>document.fonts.ready);
  const pdf=await print.pdf({preferCSSPageSize:true,printBackground:true});assert.equal(pageCount(pdf),1,'Summary fits exactly one A4 page');assert.match(pdf.toString('latin1'),/\/MediaBox\s*\[0 0 594\.\d+ 841\.\d+\]/,'Print uses A4 portrait');
  await print.emulateMedia({media:'print'});assert(await print.locator('.mr-chart').evaluateAll(cards=>cards.every(card=>[...card.children].every(child=>child.getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom+1))),'Chart content stays inside its printed card');
  if(process.env.PPMS_QA_DIR){fs.mkdirSync(process.env.PPMS_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PPMS_QA_DIR,'summary.pdf'),pdf);await print.screenshot({path:path.join(process.env.PPMS_QA_DIR,'summary.png'),fullPage:true})}
  if(process.env.PPMS_PDF_TEST_MODULES){const download=page.waitForEvent('download');await page.locator('[data-month-report-pdf]').click();const file=await download;assert.equal(file.suggestedFilename(),'Month_Report_2026-10.pdf');assert.equal(pageCount(fs.readFileSync(await file.path())),1,'Download produces one PDF page')}
  await page.locator('[data-month-report-include-details]').check();
  const full=await page.evaluate(async()=>{const frame=await PPMSMonthVisual.frame();const doc=frame.contentDocument,html=doc.documentElement.outerHTML;const tables=doc.querySelectorAll('.mr-print-appendix table').length,buttons=doc.querySelectorAll('button').length;frame.remove();return {html,tables,buttons}});
  assert(full.tables>0);assert.equal(full.buttons,0);await print.setContent(full.html);const detailPdf=await print.pdf({preferCSSPageSize:true,printBackground:true});assert(pageCount(detailPdf)>1,'Details continue on subsequent A4 pages');
  await page.locator('#monthReportSection').selectOption('Stamping Section');assert.equal(await page.locator('[data-month-count="joined"]').textContent(),'2');assert.equal(await page.locator('[data-month-count="left"]').textContent(),'1');assert.match(await page.locator('.mr-title').textContent(),/Stamping|ปั๊ม/);
  await page.evaluate(()=>PPMSLanguage.setLanguage('en'));await page.locator('.mr-title').filter({hasText:'October'}).waitFor();assert.match(await page.locator('.mr-chart-grid').textContent(),/Training plans and results/);
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile report does not scroll horizontally');
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));assert(await page.locator('#monthReportPaperStyle').count());await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await page.locator('#monthReportPaperStyle').count(),0,'A4 rule is removed for other reports');
  assert.deepEqual(errors,[]);console.log('Passed A4 one-page PDF, full appendices, chart totals, grouped Sections, filters, language, mobile width and isolated print styles.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
