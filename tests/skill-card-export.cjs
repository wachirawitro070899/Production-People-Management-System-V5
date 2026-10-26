const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ExcelJS=require('../vendor/exceljs-4.4.0.min.js');
const root=path.resolve(__dirname,'..'),qa=path.resolve(process.env.PPMS_QA_DIR||'qa');
const photo=fs.readFileSync(path.join(__dirname,'matrix-layout-preview.html'),'utf8').match(/const png='([^']+)'/)[1];
const people=Array.from({length:11},(_,i)=>({id:'TEST-'+String(i+1).padStart(3,'0'),name:'ตัวอย่างพนักงาน '+(i+1),section:'Stamping Section',position:'Operator',organizationDivision:'Production Division',organizationPlant:'โรง 1',startDate:'2020-01-01',contractType:'Permanent',currentSkillLevel:i%4+1,photoData:i?photo:'',skillUpdatedAt:'2026-10-24'}));
people.push({...people[0],id:'HIDDEN',section:'Welding Section'});
(async()=>{
 fs.mkdirSync(qa,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PPMS_CHROMIUM?{executablePath:process.env.PPMS_CHROMIUM}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],writes=[],external=[];
  await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method()))writes.push(url.href);
   if(url.hostname==='ppms.test'){const p=path.join(root,url.pathname.slice(1)||'index.html');return route.fulfill({body:fs.existsSync(p)?fs.readFileSync(p):'',contentType:p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html'})}
   external.push(url.href);if(url.pathname.endsWith('/employees.json'))return route.fulfill({json:people});if(url.href.includes('adminAccounts'))return route.fulfill({json:[{username:'tester',passwordHash:'test',active:true,owner:false}]});return route.fulfill(url.pathname.endsWith('.json')?{json:null}:{body:'',contentType:'text/javascript'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{errors.push(d.message());await d.dismiss()});
  await page.addInitScript(({people})=>{if(window.top!==window)return;sessionStorage.setItem('ppms_admin','1');sessionStorage.setItem('ppms_admin_user','tester');sessionStorage.setItem('ppms_device_lock_verified','test-device');localStorage.setItem('ppms_v768_admin_device_id','test-device');localStorage.setItem('ppms_v3_employees',JSON.stringify(people));sessionStorage.setItem('cardSection','Stamping Section');sessionStorage.setItem('cardEmp','__ALL__')},{people});
  await page.goto('https://ppms.test/');await page.locator('#nav [data-page="cards"]').click();await page.locator('.wallet-card-sheet .wallet-front').first().waitFor();
  assert.equal(await page.locator('.wallet-card-sheet .wallet-front').count(),11);
  const before=await page.evaluate(()=>localStorage.getItem('ppms_v3_employees')),writeCount=writes.length;
  assert.equal(await page.locator('.wallet-card-sheet .wallet-qr canvas').count(),11,'QR dependency renders real codes');
  await page.locator('.wallet-employee-pair').first().screenshot({path:path.join(qa,'skill-card-web.png')});
  let download=page.waitForEvent('download',{timeout:120000});await page.locator('[data-action="pageExcel"]').click();let file=await download;assert(file.suggestedFilename().endsWith('.xlsx'));await file.saveAs(path.join(qa,'skill-cards.xlsx'));
  const book=new ExcelJS.Workbook();await book.xlsx.load(fs.readFileSync(path.join(qa,'skill-cards.xlsx')));const cards=book.getWorksheet('Skill Cards'),data=book.getWorksheet('Employee Skills');
  assert.equal(cards.getImages().length,22);const zip=await require('../vendor/jszip-3.10.1.min.js').loadAsync(fs.readFileSync(path.join(qa,'skill-cards.xlsx')));assert.equal(((await zip.file('xl/worksheets/sheet1.xml').async('string')).match(/<brk /g)||[]).length,2);assert.equal(cards.pageSetup.scale,100);assert.equal(cards.pageSetup.paperSize,9);assert.equal(data.rowCount,79);assert.equal(data.getCell('A3').numFmt,'@');assert.equal(data.getCell('A3').value,'TEST-001');assert(!data.getColumn(1).values.includes('HIDDEN'));
  fs.writeFileSync(path.join(qa,'skill-card-excel-front.png'),book.model.media[0].buffer);fs.writeFileSync(path.join(qa,'skill-card-excel-back.png'),book.model.media[1].buffer);
  download=page.waitForEvent('download',{timeout:120000});await page.locator('[data-action="cardsA4Pdf"]').click();file=await download;await file.saveAs(path.join(qa,'skill-cards-a4.pdf'));
  await page.locator('#cardEmployee').selectOption('TEST-003');await page.locator('.wallet-card-sheet .wallet-front').waitFor();
  download=page.waitForEvent('download',{timeout:120000});await page.locator('[data-action="pageExcel"]').click();file=await download;await file.saveAs(path.join(qa,'skill-card-single.xlsx'));const single=new ExcelJS.Workbook();await single.xlsx.load(fs.readFileSync(path.join(qa,'skill-card-single.xlsx')));assert.equal(single.getWorksheet('Skill Cards').getImages().length,2);assert.equal(single.getWorksheet('Employee Skills').getCell('A3').value,'TEST-003');assert.equal(single.getWorksheet('Employee Skills').rowCount,9);
  download=page.waitForEvent('download',{timeout:120000});await page.locator('[data-action="pagePdf"]').click();file=await download;assert.equal(file.suggestedFilename(),'Employee_Skill_Card_TEST-003.pdf');await file.saveAs(path.join(qa,'skill-card-single.pdf'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('ppms_v3_employees')),before);assert.equal(writes.length,writeCount);assert.deepEqual(errors,[]);assert(!external.some(url=>/html2canvas|jspdf|qrcode|exceljs/.test(url)),'Export tools use same-origin assets even when external scripts are unavailable');
  assert.equal(await page.locator('[data-action="pageExcel"]').isEnabled(),true);assert.equal(await page.locator('[data-i18n-ignore] .wallet-card').count(),0);
  console.log('PASS: real all-section and individual PDF/XLSX downloads; QR canvases; 22 matching card images; A4 page breaks; text IDs; filtered editable data; no data writes; no external export libraries; clean UI.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
