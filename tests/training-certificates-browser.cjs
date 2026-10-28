const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const employee=(id,name,position,division='Production Division')=>({id,name,position,section:division==='Production Division'?'Welding Section':'Warehouse Section',organizationDivision:division,organizationPlant:division==='Production Division'?'โรง 1':'รวม',startDate:'2021-01-01',contractType:'Permanent',skillLevels:{Safety:3},currentSkillLevel:3});
const employees=[employee('S1','SUPERVISOR EXAMPLE','Leader'),employee('E1','ENGINEER EXAMPLE','Welding Engineer'),employee('E2','UNASSIGNED ENGINEER','Welding Engineer'),employee('W1','WAREHOUSE EXAMPLE','Store','Warehouse Division')];
const master={plants:['โรง 1'],divisions:['Production Division','Warehouse Division'],sections:['Welding Section','Warehouse Section'],positions:['Leader','Welding Engineer','Store'],positionMap:{'Production Division':['Leader','Welding Engineer'],'Warehouse Division':['Store']},sectionMap:{'Production Division::โรง 1':['Welding Section'],'Warehouse Division::รวม':['Warehouse Section']},sectionPositions:{},productionPlantsV751:true,corporateAdministrationV784:true,businessOperationsV785:true,fullDivisionNamesV787:true,generatedVacanciesRemoved:true};
(async()=>{
 const db={ppms:{employees:structuredClone(employees),deletedEmployeeIds:[]},settings:{organizationMaster:master},employeeOrganization:Object.fromEntries(employees.map(e=>[e.id,{division:e.organizationDivision,plant:e.organizationPlant}]))},errors=[],alerts=[];
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.accept()});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='ppms.test'){const file=path.resolve(root,decodeURIComponent(url.pathname.slice(1)||'index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'})}
   if(!url.pathname.endsWith('.json'))return route.fulfill({body:'',contentType:'text/javascript'});
   const keys=decodeURIComponent(url.pathname.slice(1).replace(/\.json$/,'')).split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||={};let value=parent[keys.at(-1)];
   if(url.href.includes('adminAccounts'))value=[{username:'tester',passwordHash:'test',active:true,owner:false}];
   if(route.request().method()==='PUT'){value=JSON.parse(route.request().postData());parent[keys.at(-1)]=value}
   return route.fulfill({json:value??null,headers:{etag:'"test-version"','Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'etag','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET, PUT, OPTIONS'}});
  });
  await page.addInitScript(({employees,master})=>{
   if(sessionStorage.getItem('certTestSeeded'))return;sessionStorage.setItem('certTestSeeded','1');
   localStorage.setItem('ppms_v3_employees',JSON.stringify(employees));localStorage.setItem('ppms_organization_master_v1',JSON.stringify(master));localStorage.setItem('ppms_employee_organization_v1',JSON.stringify(Object.fromEntries(employees.map(e=>[e.id,{division:e.organizationDivision,plant:e.organizationPlant}]))));localStorage.setItem('ppms_v768_admin_device_id','test-device');
   for(const [k,v]of Object.entries({ppms_device_lock_verified:'test-device',ppms_admin:'1',ppms_admin_user:'tester',ppms_scope_division:'Production Division',ppms_scope_plant:'โรง 1'}))sessionStorage.setItem(k,v);
  },{employees,master});
  const form=()=>page.locator('#certificateForm');
  const open=async id=>{await page.locator('#certificatePage [data-cert-add]').click();await form().locator('[name="employeeIds"][value="'+id+'"]').check()};
  const save=async()=>{await form().locator('[type="submit"]').click();await page.locator('#certificateDialog').waitFor({state:'detached'})};
  await page.goto('https://ppms.test/');await page.locator('#nav [data-page="training"]').click();await page.locator('#certificatePage').waitFor();
  const qaFont=async()=>{if(process.env.PPMS_QA_FONT)await page.addStyleTag({content:'@font-face{font-family:QAThai;src:url(data:font/woff2;base64,'+fs.readFileSync(process.env.PPMS_QA_FONT).toString('base64')+')}body,button,input,select,textarea{font-family:QAThai,Arial,sans-serif!important}'})};
  await qaFont();
  await open('E1');assert.equal(await form().locator('[name="employeeIds"][value="W1"]').count(),0,'Another division is excluded');
  await form().locator('[name="employeeIds"][value="S1"]').check();await form().locator('[data-cert-person-number="S1"]').fill('CQI-15-S1');await form().locator('[name="course"]').fill('CQI-15');await form().locator('[name="provider"]').fill('Training Institute');await form().locator('[name="date"]').fill('2026-09-15');await form().locator('[name="expiryDate"]').fill('2027-09-15');await form().locator('[name="certificateNumber"]').fill('CQI-15-001');
  await form().locator('[name="certificateFile"]').setInputFiles({name:'certificate.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic certificate\n%%EOF')});await save();
  let saved=db.ppms.employees.find(e=>e.id==='E1');assert.equal(saved.certifications[0].course,'CQI-15');assert(saved.certifications[0].attachment.data.startsWith('data:application/pdf;base64,'));assert.equal(saved.currentSkillLevel,3);assert.equal(db.ppms.employees.find(e=>e.id==='E2').certifications,undefined,'No automatic course assignment');
  assert.equal(db.ppms.employees.find(e=>e.id==='S1').certifications[0].certificateNumber,'CQI-15-S1');assert.equal(await page.locator('[data-cert-total]').innerText(),'2');assert.equal(await page.locator('[data-cert-valid]').innerText(),'2');
  const download=page.waitForEvent('download');await page.locator('[data-cert-owner="E1"] [data-cert-download]').click();assert.equal((await download).suggestedFilename(),'certificate.pdf');
  await page.reload();await qaFont();await page.locator('#certificatePage').waitFor();await page.locator('[data-cert-owner="E1"]').waitFor();assert((await page.locator('#certTable').innerText()).includes('CQI-15-001'),'Reload preserves the confirmed certificate');
  await page.locator('[data-cert-owner="E1"] [data-cert-edit]').click();await form().locator('[name="note"]').fill('Reviewed evidence');await save();assert.equal(db.ppms.employees.find(e=>e.id==='E1').certifications.length,1);
  await open('S1');await form().locator('[name="course"]').fill('Customer Auditor Training');await form().locator('[name="status"]').selectOption('completed');await form().locator('[name="date"]').fill('2026-09-01');await save();
  assert.equal(await page.locator('[data-cert-row]').count(),3);await page.locator('#certCourseFilter').selectOption('CQI-15');assert.equal(await page.locator('[data-cert-row]').count(),2);await page.locator('#certCourseFilter').selectOption('');
  const csv=page.waitForEvent('download');await page.locator('[data-cert-export]').click();assert.equal((await csv).suggestedFilename(),'Training_Certificates.csv');
  if(process.env.PPMS_QA_DIR){fs.mkdirSync(process.env.PPMS_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PPMS_QA_DIR,'training-certificates-desktop.png'),fullPage:true})}
  await page.locator('#nav [data-page="matrix"]').click();await page.locator('#matrixSection').selectOption('Welding Section');await page.locator('.cert-course-matrix').waitFor();
  assert((await page.locator('.cert-course-matrix').innerText()).includes('CQI-15'));assert((await page.locator('.cert-course-matrix').innerText()).includes('Customer Auditor Training'));assert.equal(await page.locator('[data-course-matrix-employee="E2"] [data-course-key="cqi-15"]').innerText(),'—');
  const matrix=await page.evaluate(()=>{const model=window.PPMSMatrixReport.snapshot();return {scores:model.rows.map(r=>r.score),pages:window.PPMSMatrixReport.makePages(model,window.PPMSMatrixReport.options('A4','landscape'))}});assert(matrix.scores.every(score=>score===21));assert(matrix.pages.includes('Training &amp;')||matrix.pages.includes('Training & Certificate Matrix'));assert(matrix.pages.includes('CQI-15'));
  const xlsx=page.waitForEvent('download');await page.locator('[data-action="matrixExcel"]').click();const matrixFile=await xlsx;const matrixPath=await matrixFile.path();const ExcelJS=require('../vendor/exceljs-4.4.0.min.js'),matrixBook=new ExcelJS.Workbook();await matrixBook.xlsx.load(fs.readFileSync(matrixPath));assert(matrixBook.getWorksheet('Training Certificates'));assert(matrixBook.getWorksheet('Training Certificates').getRow(1).values.includes('CQI-15'));
  if(process.env.PPMS_QA_DIR)await page.screenshot({path:path.join(process.env.PPMS_QA_DIR,'course-matrix.png'),fullPage:true});
  await page.locator('#nav [data-page="cards"]').click();await page.locator('#cardSection').selectOption('Welding Section');await page.locator('#cardEmployee').selectOption('E1');await page.locator('.wallet-card-sheet [data-course-card="E1"]').waitFor();assert((await page.locator('.wallet-card-sheet .wallet-front').innerText()).includes('CQI-15'));
  const boundsCard=await page.locator('.wallet-card-sheet .wallet-front').boundingBox();assert(Math.abs(boundsCard.height-53.98*96/25.4)<2,'Course strip retains the CR80 card size');
  if(process.env.PPMS_QA_DIR)await page.locator('.wallet-card-sheet').screenshot({path:path.join(process.env.PPMS_QA_DIR,'course-skill-card.png')});
  const cardXlsx=page.waitForEvent('download');await page.locator('[data-action="pageExcel"]').click();const cardBook=new ExcelJS.Workbook();await cardBook.xlsx.load(fs.readFileSync(await (await cardXlsx).path()));assert.equal(cardBook.getWorksheet('Training Certificates').getCell('C2').value,'CQI-15');
  await page.locator('#nav [data-page="training"]').click();
  await page.setViewportSize({width:390,height:844});await open('E2');
  const bounds=await page.locator('#certificateDialog .modal-card').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=390,'The mobile form fits the viewport');
  await form().locator('[name="course"]').fill('Mobile planned course');await form().locator('[name="status"]').selectOption('planned');
  await form().locator('[name="certificateFile"]').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('<html>invalid evidence</html>')});await form().locator('[type="submit"]').click();await page.locator('#certificateStatus').filter({hasText:'รองรับไฟล์'}).waitFor();assert.equal(db.ppms.employees.find(e=>e.id==='E2').certifications,undefined);
  await form().locator('[name="certificateFile"]').setInputFiles([]);
  if(process.env.PPMS_QA_DIR)await page.screenshot({path:path.join(process.env.PPMS_QA_DIR,'training-certificates-mobile.png'),fullPage:true});
  await context.setOffline(true);await save();assert(alerts.at(-1).includes('รอซิงก์'));assert.equal(db.ppms.employees.find(e=>e.id==='E2').certifications,undefined);await page.reload();await page.locator('#certificatePage').waitFor();assert((await page.locator('#certTable').innerText()).includes('Mobile planned course'),'Offline reload keeps the pending course');
  await context.setOffline(false);await page.evaluate(()=>window.PPMSCertificates.sync());assert.equal(db.ppms.employees.find(e=>e.id==='E2').certifications[0].status,'planned');
  await page.setViewportSize({width:1440,height:1000});await page.locator('#globalOrganizationDivision').selectOption('Warehouse Division');await page.locator('#certificatePage').waitFor();assert.equal(await page.locator('[data-cert-row]').count(),0,'Training view respects organization scope');
  await open('W1');assert.equal(await form().locator('[name="employeeIds"][value="E1"]').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS batch course creation and per-person numbers; PDF evidence; reload/edit; course matrices and card artwork; XLSX training sheets; mobile layout; offline retry; scope isolation and unchanged scores.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
