// Synthetic browser regression. All network traffic is intercepted locally.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const leader={id:'JR101',name:'Synthetic Leader',position:'Leader',section:'Stamping Section',startDate:'2020-01-01'};
const initial=[leader,{...leader,id:'JR102',name:'Synthetic Operator',position:'Operator'},{...leader,id:'OTHER103',section:'CNC Section',position:'Operator'}];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu'],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try{
  const page=await browser.newPage(),errors=[],alerts=[],db={ppms:{employees:structuredClone(initial),deletedEmployeeIds:[]},settings:{organizationMaster:null}};
  page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{alerts.push(d.message());if(process.env.PPMS_QA_DEBUG)console.log('Dialog:',d.message());await d.accept()});
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.hostname==='ppms.test'){
    const file=path.join(root,url.pathname.slice(1)||'index.html');
    return route.fulfill({body:fs.existsSync(file)?fs.readFileSync(file):'',contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
   }
   if(url.hostname.endsWith('firebasedatabase.app')){
    const keys=decodeURIComponent(url.pathname.slice(1).replace(/\.json$/,'')).split('/');let parent=db;
    for(const key of keys.slice(0,-1))parent=parent[key]||={};
    if(request.method()==='PUT')parent[keys.at(-1)]=request.postDataJSON();
    return route.fulfill({json:parent[keys.at(-1)]??null,headers:{etag:'"test-version"','access-control-allow-origin':'*','access-control-expose-headers':'etag','access-control-allow-headers':'*','access-control-allow-methods':'GET,PUT,OPTIONS'}});
   }
   return route.fulfill({body:'',contentType:'text/javascript'});
  });
  await page.addInitScript(rows=>{localStorage.setItem('ppms_v3_employees',JSON.stringify(rows));sessionStorage.setItem('ppms_leader_id',rows[0].id)},initial);
  await page.goto('https://ppms.test/');
  await page.locator('[data-action="leaderOpenShift"]').waitFor();
  await page.evaluate(rows=>{window.firebase={apps:[{}],database:()=>({ref:p=>({once:async()=>({val:()=>p==='ppms/employees'?rows:p==='ppms/deletedEmployeeIds'?[]:{}})})})}},initial);
  // This employee exists only on the server until the Leader dialog refreshes.
  db.ppms.employees.push({...initial[1],id:'REMOTE104'});
  await page.locator('[data-action="leaderOpenShift"]').click();await page.locator('[data-leader-menu="employees"]').click();
  await page.locator('[data-leader-remove="REMOTE104"]').click();
  await page.locator('[data-leader-remove="REMOTE104"]').waitFor({state:'detached'});
  await page.locator('#leaderAddEmployee').waitFor();
  assert(!db.ppms.employees.some(e=>e.id==='REMOTE104'));assert(Object.values(db.ppms.formerEmployeeHistory).some(e=>e.id==='REMOTE104'));
  assert.equal(await page.locator('#leaderAddEmployee').evaluate(f=>typeof f.id),'object','Real Chromium reproduces named form.id shadowing');
  await page.locator('#leaderAddEmployee [name="id"]').fill('NCN101');
  await page.locator('#leaderAddEmployee [name="name"]').fill('Synthetic new employee');
  await page.locator('#leaderAddEmployee [name="startDate"]').fill('2026-10-01');
  await page.locator('#leaderAddEmployee [type="submit"]').click();
  await page.locator('[data-leader-remove="NCN101"]').waitFor();
  assert(db.ppms.employees.some(e=>e.id==='NCN101'));assert(!await page.locator('[data-leader-remove="JR101"]').count());assert(!await page.locator('[data-leader-remove="OTHER103"]').count());
  await page.locator('[data-leader-remove="NCN101"]').click();await page.locator('[data-leader-remove="NCN101"]').waitFor({state:'detached'});
  assert(!db.ppms.employees.some(e=>e.id==='NCN101'));assert(Object.values(db.ppms.formerEmployeeHistory).some(e=>e.id==='NCN101'));
  assert(alerts.some(s=>s.includes('เพิ่มพนักงาน NCN101')&&s.includes('สำเร็จ')));assert.deepEqual(errors,[]);
  console.log('PASSED Chromium: real form.id shadowing, add with shared numeric suffix, fresh-roster deletion, stale SDK, archived history and Section/self guards.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
