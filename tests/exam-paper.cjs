const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),modules=process.env.PPMS_PDF_TEST_MODULES;
const pdfPages=pdf=>(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext(),errors=[],writes=[];
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());if(!['GET','HEAD'].includes(request.method()))writes.push(request.url());
   if(modules&&url.href.includes('html2canvas.min.js'))return route.fulfill({body:fs.readFileSync(path.join(modules,'html2canvas/dist/html2canvas.min.js')),contentType:'text/javascript'});
   if(modules&&url.href.includes('jspdf.umd.min.js'))return route.fulfill({body:fs.readFileSync(path.join(modules,'jspdf/dist/jspdf.umd.min.js')),contentType:'text/javascript'});
   if(url.hostname==='ppms.test'){
    const file=path.join(root,url.pathname.slice(1)||'index.html');return route.fulfill({body:fs.existsSync(file)?fs.readFileSync(file):'',contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
   }
   if(url.href.includes('adminAccounts'))return route.fulfill({json:[{username:'tester',passwordHash:'test',active:true,owner:false}]});
   return route.fulfill(url.pathname.endsWith('.json')?{json:null}:{body:'',contentType:'text/javascript'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{sessionStorage.setItem('ppms_admin','1');sessionStorage.setItem('ppms_admin_user','tester');sessionStorage.setItem('ppms_device_lock_verified','test-device');localStorage.setItem('ppms_v768_admin_device_id','test-device')});
  await page.goto('https://ppms.test/');await page.locator('#nav [data-page="examPlan"]').click();await page.locator('[data-paper-exam-open]').click();await page.locator('[data-paper-exam-toolbar]').waitFor();
  const initial=await page.evaluate(()=>PPMSPaperExam.read());assert.equal(initial.questions.length,20);assert.equal(initial.written.length,0);assert(!JSON.stringify(initial).includes('"correct"'));assert(initial.questions.every(q=>q.options.length===4));
  const countWrites=writes.length;
  await page.locator('[name="qtext0"]').fill('คำถามสำหรับพิมพ์ <script>window.BAD_EXPORT=1</script> & การตรวจสอบ');
  const exportDoc=await page.evaluate(async()=>{const frame=await PPMSPaperExam.frame();const doc=frame.contentDocument,pages=[...doc.querySelectorAll('.paper-page')];const result={html:doc.documentElement.outerHTML,pages:pages.length,questions:doc.querySelectorAll('[data-question-number]').length,scripts:doc.querySelectorAll('script').length,correct:doc.querySelectorAll('.exam-correct-answer,select,input,textarea').length,first:doc.querySelector('[data-question-number="1"] h2').textContent,fits:pages.every(p=>{const b=p.querySelector('.paper-questions');return b.scrollHeight<=b.clientHeight+1}),footer:pages.at(-1).querySelector('[data-page-number]').textContent};frame.remove();return result});
  assert.equal(exportDoc.questions,20);assert.equal(exportDoc.scripts,0);assert.equal(exportDoc.correct,0);assert.match(exportDoc.first,/<script>/);assert(exportDoc.fits);assert.equal(exportDoc.footer,'หน้า '+exportDoc.pages+' / '+exportDoc.pages);
  const print=await context.newPage();await print.setContent(exportDoc.html);await print.evaluate(()=>document.fonts.ready);const pdf=await print.pdf({preferCSSPageSize:true,printBackground:true});assert.equal(pdfPages(pdf),exportDoc.pages,'Print has no additional or blank pages');assert.match(pdf.toString('latin1'),/\/MediaBox\s*\[0 0 594\.\d+ 841\.\d+\]/);
  if(process.env.PPMS_QA_DIR){fs.mkdirSync(process.env.PPMS_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PPMS_QA_DIR,'paper-exam-print.pdf'),pdf);await print.locator('.paper-page').first().screenshot({path:path.join(process.env.PPMS_QA_DIR,'paper-exam-first.png')})}
  if(modules){const download=page.waitForEvent('download',{timeout:90000});await page.locator('[data-paper-exam-action="pdf"]').click();const file=await download,buffer=fs.readFileSync(await file.path());assert(file.suggestedFilename().endsWith('.pdf'));assert.equal(pdfPages(buffer),exportDoc.pages);if(process.env.PPMS_QA_DIR)fs.writeFileSync(path.join(process.env.PPMS_QA_DIR,'paper-exam-download.pdf'),buffer)}
  await page.locator('#examCheckType').selectOption('upskill');await page.locator('[data-paper-exam-toolbar]').waitFor();assert.equal(await page.evaluate(()=>PPMSPaperExam.read().questions.length),40);
  await page.locator('#examCheckSet').selectOption('B');await page.locator('#examCheckLevel').selectOption('5');
  const level5=await page.evaluate(async()=>{const data=PPMSPaperExam.read(),frame=await PPMSPaperExam.frame(data),doc=frame.contentDocument;const result={level:data.level,setName:data.setName,questions:data.questions.length,written:data.written.length,rendered:doc.querySelectorAll('[data-written-number]').length,lines:doc.querySelectorAll('.paper-answer-line').length,pages:doc.querySelectorAll('.paper-page').length,html:doc.documentElement.outerHTML,valid:[...doc.querySelectorAll('.paper-questions')].every(b=>b.scrollHeight<=b.clientHeight+1)};frame.remove();return result});assert.equal(level5.questions,20);assert.equal(level5.written,10);assert.equal(level5.rendered,10);assert.equal(level5.lines,40);assert.equal(level5.setName,'B');assert(level5.valid);
  await print.setContent(level5.html);assert.equal(pdfPages(await print.pdf({preferCSSPageSize:true})),level5.pages);
  if(process.env.PPMS_QA_DIR)fs.writeFileSync(path.join(process.env.PPMS_QA_DIR,'paper-exam-level5.pdf'),await print.pdf({preferCSSPageSize:true}));
  await page.locator('#examCheckType').selectOption('sub_permanent');assert.equal(await page.evaluate(()=>PPMSPaperExam.read().written.length),0,'Conversion exam keeps its existing multiple-choice-only behavior');
  await page.locator('[name="opt0_0"]').fill('');await assert.rejects(page.evaluate(()=>PPMSPaperExam.read()),/ตัวเลือก/);
  const publicPage=await context.newPage();await publicPage.goto('https://ppms.test/');assert.equal(await publicPage.locator('[data-paper-exam-toolbar]').count(),0);await assert.rejects(publicPage.evaluate(()=>PPMSPaperExam.read()),/Admin/);
  assert.equal(writes.length,countWrites,'Paper exports do not save exams, results or employee skills');assert.deepEqual(errors,[]);
  console.log('Passed selected/edited questions, employee A4 pagination, escaped text, answer-free exports, PDF download, 20/40 questions, Level 5 writing space, validation, public exclusion and no data writes.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
