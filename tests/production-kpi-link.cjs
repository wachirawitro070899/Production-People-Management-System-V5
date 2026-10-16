const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const client=fs.readFileSync('production-kpi-client-v874.js','utf8');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function row(machine,rate,date='2026-10-13',extra={}){return {workDate:date,shift:'Night',machine,scannedAt:date+'T14:03:00.000Z',rate,targetPercent:85,status:rate>=85?'ถึงเกณฑ์':'ต่ำกว่าเกณฑ์',passed:rate>=85,...extra}}
const histories={
 '69085':[row('Bending #2',107.50750750750751),row('Bending #2',96,'2026-09-29'),row('Bending #2',80,'2026-08-29')],
 '69005':[row('Bending #1',104.97076023391814)],
 '69008':[row('Sorting 1',100,'2026-10-13',{source:'sorting_oee',scannedAt:null,scanCount:0,workDateVerified:true})]
};
function transport(calls){return async(url,options)=>{
 const parsed=new URL(url),month=parsed.searchParams.get('month'),codes=parsed.searchParams.get('codes').split(',');
 calls.push({url:parsed,options,codes,month});
 assert.equal(parsed.pathname,'/api/ppms/employee-kpi','The protected dashboard endpoint is never called');
 assert.equal(options.credentials,'omit','PPMS does not depend on third-party session cookies');
 return {ok:true,json:async()=>({month,online:true,asOf:'2026-10-14T10:02:22.162Z',histories:codes.map(employeeCode=>({employeeCode,online:true,history:(histories[employeeCode]||[]).filter(row=>row.workDate.startsWith(month+'-'))}))})};
}}
(async()=>{
 const calls=[],ctx={window:{},fetch:transport(calls),URLSearchParams,AbortController,setTimeout,clearTimeout,Intl,Date,console};vm.createContext(ctx);vm.runInContext(client,ctx);const service=ctx.window.PPMS_PRODUCTION_KPI;
 const [all,one]=await Promise.all([service.read(['69085','69005'],'2026-10'),service.read(['69085'],'2026-10')]);
 assert.equal(calls.length,1,'Overlapping employee/Section reads share one request');
 assert.equal(one.histories[0].history[0].rate,107.50750750750751);assert.equal(all.histories[1].history[0].passed,true);
 await service.read(['69005'],'2026-10');assert.equal(calls.length,1,'Recently confirmed results are reused');
 await service.read(['69085'],'2026-09');assert.equal(calls.at(-1).month,'2026-09','Historical months use their own API scope');
 const before=calls.length;await service.read(Array.from({length:115},(_,i)=>'EMP-'+i),'2026-10');assert.equal(calls.length-before,1,'A 115-person Section report uses a batch instead of 115 OEE reads');
 const pass=row('A',100),pending=row('B',null,'2026-10-12',{status:'รอตรวจ Cap / เวลา',passed:false});
 let summary=service.summarize([pass,pass,pending],'2026-10');assert.equal(summary.passed,1);assert.equal(summary.waiting,1,'Duplicate scans count once and pending dates stay pending');
 summary=service.summarize([pass,row('B',84)],'2026-10');assert.equal(summary.failed,1,'Every machine must pass for the day to pass');
 summary=service.summarize([pass,row('B',null,'2026-10-13',{status:'รอตรวจ Cap / เวลา',passed:false})],'2026-10');assert.equal(summary.waiting,1);
 assert.equal(service.summarize([pass],'2026-10',false).passed,0,'Unconfirmed/offline results never count as paid KPI days');
 assert.equal(service.summarize([row('A',100,'2026-10-13',{scannedAt:'2026-10-12T14:00:00Z'})],'2026-10').waiting,1,'Scan dates use Bangkok time');
 assert.equal(service.summarize([row('A',100,'2099-10-13')],'2099-10').days.length,0,'Future production dates are excluded');
 const paper=row('Sorting 1',100,'2026-10-13',{source:'sorting_oee',scannedAt:null,workDateVerified:true});
 assert.equal(service.summarize([paper,paper],'2026-10').passed,1,'Paper Sorting counts one passed day without a QR scan');
 assert.equal(service.summarize([paper,{...paper,machine:'Sorting 2',rate:80,status:'ต่ำกว่าเกณฑ์',passed:false}],'2026-10').failed,1);
 assert.equal(service.summarize([{...paper,workDateVerified:false}],'2026-10').waiting,1);
 assert.equal(service.summarize([{...paper,rate:null,status:'รอซิงก์ OEE/Cap',passed:false}],'2026-10').waiting,1);
 assert.equal(service.summarize([paper],'2026-10',false).passed,0);
 assert.equal(service.summarize([{...paper,workDate:'2099-10-13'}],'2099-10').days.length,0);
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM('<body><nav id="nav"><button data-page="attendanceAdmin">Attendance</button></nav><main id="app"></main><form id="employeeForm"><input name="id" value="69085"></form><div class="employee-attendance-history"><table><thead><tr><th>วันที่</th></tr></thead><tbody><tr><td>2026-10-13</td></tr><tr><td>2026-09-29</td></tr></tbody></table></div></body>',{url:'https://wachirawitro070899.github.io/Production-People-Management-System-V5/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,requests=[],intervals=[];let fail=false;
 w.fetch=(...args)=>fail?Promise.reject(Error('KPI unavailable')):transport(requests)(...args);
 w.setInterval=fn=>{intervals.push(fn);return intervals.length};
 w.PPMS_RUNTIME={factoryLayoutEmployees:()=>[{id:'69085',name:'WORKER A',section:'Bending Section'},{id:'69005',name:'WORKER B',section:'Bending Section'},{id:'69008',name:'SORTING WORKER',section:'Sorting1'}],factoryLayoutDeletedEmployeeIds:()=>[]};
 try{
  w.eval(client);w.eval(fs.readFileSync('employee-production-kpi-v794.js','utf8'));w.eval(fs.readFileSync('section-production-kpi-v802.js','utf8'));await wait(40);
  let panel=w.document.querySelector('.employee-attendance-history');assert(panel.querySelector('[data-production-date="2026-10-13"]').textContent.includes('107.5%'));
  assert(panel.querySelector('[data-production-date="2026-09-29"]').textContent.includes('96%'),'Attendance rows can read a different month from the selected summary');
  const counts=()=>[...panel.querySelectorAll('[data-production-month-results] .metric b')].map(node=>node.textContent);
  assert.deepEqual(counts(),['1 วัน','0 วัน','0 วัน']);
  const month=panel.querySelector('[data-production-month]');month.value='2026-08';month.dispatchEvent(new w.Event('change'));await wait(40);
  assert(requests.some(request=>request.month==='2026-08'));assert.deepEqual(counts(),['0 วัน','1 วัน','0 วัน'],'Changing months fetches and renders that month');
  w.document.querySelector('#nav [data-page="sectionProductionKpi"]').click();await wait(40);
  let rows=[...w.document.querySelectorAll('#sectionKpiResults tbody tr')];assert.equal(rows.length,3);for(const row of rows)assert.equal(row.cells[2].textContent,'1','Both employees from the screenshot count as passed');
  const oldNow=w.Date.now;w.Date.now=()=>oldNow()+31000;const refreshed=requests.length;for(const fn of intervals)fn();await wait(50);
  assert(requests.length>refreshed,'A visible Section report automatically refreshes results when the roster is unchanged');
  fail=true;w.document.getElementById('sectionKpiRefresh').click();await wait(40);
  rows=[...w.document.querySelectorAll('#sectionKpiResults tbody tr')];for(const row of rows){assert.equal(row.cells[2].textContent,'0');assert.equal(row.cells[4].textContent,'1','A failed refresh marks cached results pending');}
  assert(w.document.getElementById('sectionKpiStatus').textContent.includes('ยังไม่นับข้อมูลนี้เป็นวันผ่าน'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close()}
 console.log('Passed: PPMS integration API/CORS contract, shared batched reads, both reported pass results, monthly card and Section views, date/duplicate/all-machine rules, historical months, automatic refresh and honest failure status.');
})().catch(error=>{console.error(error);process.exitCode=1});

