const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const prefix=fs.readFileSync('tests/production-hierarchy.cjs','utf8').split('async function setup(')[0];
const fixture=new Function('require',prefix+'\nreturn {master,employees};')(require);
const MK='ppms_organization_master_v1',OUTBOX='ppms_organization_section_outbox_v872',POSITIONS='ppms_organization_reporting_outbox_v870',wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function setup(seed={},online=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<html><head></head><body><header></header><main id="app"><div class="organization-scope-bar"></div><div class="division-org"></div></main></body></html>',{url:'https://example.test/index.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 const listeners=new Map(),sdkWrites=[],alerts=[];w.structuredClone=structuredClone;w.CSS={escape:s=>String(s)};w.alert=text=>alerts.push(text);w.confirm=()=>false;w.prompt=()=>null;
 Object.defineProperty(w.navigator,'onLine',{value:online,configurable:true});w.sessionStorage.setItem('ppms_admin','1');w.sessionStorage.setItem('ppms_scope_division','Production Division');w.sessionStorage.setItem('ppms_scope_plant','โรง 1');
 w.localStorage.setItem(MK,JSON.stringify(fixture.master));w.localStorage.setItem('ppms_v3_employees',JSON.stringify(fixture.employees));for(const [key,value]of Object.entries(seed))w.localStorage.setItem(key,value);
 w.PPMS_FIREBASE_CONFIG={databaseURL:'https://database.test'};
 const snapshot=value=>({exists:()=>value!=null,val:()=>value});
 const database={ref:path=>({on:(type,callback)=>listeners.set(path,callback),once:async()=>snapshot(null),set:async value=>sdkWrites.push({path,value}),transaction:async()=>{throw Error('disconnect')}})};
 w.firebase={apps:[{}],database:()=>database};w.fetch=async()=>{throw Error('disconnect')};
 w.eval(fs.readFileSync('organization-scope-v866.js','utf8'));w.eval(fs.readFileSync('language-v843.js','utf8'));w.eval(fs.readFileSync('organization-manager-v694.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(130);
 return {dom,w,errors,sdkWrites,alerts,emit:(path,value)=>listeners.get(path)?.(snapshot(value))};
}
function submit(w,name,division='Production Division',plant='โรง 1'){
 w.document.querySelector('[data-create-section]').click();const f=w.document.querySelector('#newSectionForm');f.elements.division.value=division;f.elements.division.dispatchEvent(new w.Event('change'));f.elements.plant.value=plant;f.elements.name.value=name;f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));return f;
}
const storage=w=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)]}));
(async()=>{
 let state=await setup();
 try{
  let {w}=state;const roster=w.localStorage.getItem('ppms_v3_employees');submit(w,'  Support   WH  ');assert(!w.document.querySelector('#newSectionDialog'),'Saving offline closes the successful form');
  assert(JSON.parse(w.localStorage.getItem(MK)).sectionMap['Production Division::โรง 1'].includes('Support WH'));assert.equal(JSON.parse(w.localStorage.getItem(OUTBOX)).length,1);assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster);assert.equal(state.sdkWrites.length,0);
  assert(w.document.querySelector('[data-section-sync-status]').textContent.includes('รอซิงก์'));assert(state.alerts.at(-1).includes('ซิงก์'));
  submit(w,'support wh');assert(w.document.querySelector('[data-section-message]').textContent.includes('มีชื่อ Section นี้แล้ว'));assert.equal(JSON.parse(w.localStorage.getItem(OUTBOX)).length,1);w.document.querySelector('[data-section-cancel]').click();
  const seed=storage(w),job=JSON.parse(seed[OUTBOX])[0];state.dom.window.close();state=await setup(seed);w=state.w;assert.equal(w.PPMSOrganizationManager.pendingSections()[0].id,job.id,'The queue survives a reload');
  let server=structuredClone(fixture.master),version=1,conflict=true,putCount=0;server.sectionMap['Production Division::โรง 2'].push('Other Plant Section');server.sectionMap['Production Division::โรง 1'].push('Server Section');
  w.localStorage.setItem(POSITIONS,JSON.stringify([{id:'pending-position',type:'position',name:'Team Coordinator',scope:{division:'Production Division',plant:'โรง 1'}}]));state.emit('settings/organizationMaster',server);
  let cached=JSON.parse(w.localStorage.getItem(MK));assert(cached.sectionMap['Production Division::โรง 1'].includes('Support WH'));assert(cached.sectionMap['Production Division::โรง 1'].includes('Server Section'));assert(cached.positionMap['Production Division'].includes('Team Coordinator'));assert.equal(state.sdkWrites.length,0,'An optimistic master must never be written over newer server settings');
  const response=(status,value,etag)=>({ok:status>=200&&status<300,status,headers:{get:key=>key.toLowerCase()==='etag'?etag:null},json:async()=>structuredClone(value)});
  w.fetch=async(url,options={})=>{
   assert(String(url).endsWith('/settings/organizationMaster.json'));
   if(options.method!=='PUT')return response(200,server,'"v'+version+'"');
   putCount++;assert.equal(options.headers['if-match'],'"v'+version+'"');
   if(conflict){conflict=false;server.sectionMap['Production Division::โรง 1'].push('Concurrent Section');server.positions.push('Concurrent Role');server.unknownSetting={keep:true};version++;return response(412,server,'"v'+version+'"')}
   server=JSON.parse(options.body);version++;state.emit('settings/organizationMaster',server);return response(200,server,'"v'+version+'"');
  };
  Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});await w.PPMSOrganizationManager.syncSections();assert.equal(w.PPMSOrganizationManager.pendingSections().length,0);assert.equal(JSON.parse(w.localStorage.getItem(OUTBOX)).length,0);assert.equal(putCount,2);
  for(const name of ['Support WH','Server Section','Concurrent Section'])assert(server.sectionMap['Production Division::โรง 1'].includes(name));assert(server.sectionMap['Production Division::โรง 2'].includes('Other Plant Section'));assert(server.positions.includes('Concurrent Role'));assert.equal(server.unknownSetting.keep,true);assert.equal(server.sectionMap['Production Division::โรง 1'].filter(n=>n==='Support WH').length,1);
  cached=JSON.parse(w.localStorage.getItem(MK));assert(cached.positionMap['Production Division'].includes('Team Coordinator'),'Pending position additions remain visible when a Section is confirmed');assert.equal(state.sdkWrites.length,0);assert.equal(w.localStorage.getItem('ppms_v3_employees'),roster);assert(w.document.querySelector('[data-section-sync-status]').textContent.includes('เรียบร้อย'));
  w.PPMSLanguage.setLanguage('en');await wait(60);assert.equal(w.document.querySelector('[data-section-sync-status]').textContent,'Section added and synced');w.PPMSLanguage.setLanguage('th');
  // A lost HTTP response after a successful write must remain retryable and idempotent.
  let loseResponse=true,secondPuts=0;w.fetch=async(url,options={})=>{if(options.method!=='PUT')return response(200,server,'"v'+version+'"');secondPuts++;server=JSON.parse(options.body);version++;if(loseResponse){loseResponse=false;throw Error('disconnect')}return response(200,server,'"v'+version+'"')};
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});submit(w,'Quality Support','Quality Division');Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});await w.PPMSOrganizationManager.syncSections();assert.equal(w.PPMSOrganizationManager.pendingSections().length,1);await w.PPMSOrganizationManager.syncSections();assert.equal(w.PPMSOrganizationManager.pendingSections().length,0);assert.equal(secondPuts,1);assert.deepEqual(server.sectionMap['Quality Division::รวม'],['Inspection Section','Quality Support']);
  w.fetch=async()=>{throw Error('disconnect')};submit(w,'Disconnected Section');await wait(30);assert(!w.document.querySelector('#newSectionDialog'));assert.equal(w.PPMSOrganizationManager.pendingSections().length,1);assert(JSON.parse(w.localStorage.getItem(MK)).sectionMap['Production Division::โรง 1'].includes('Disconnected Section'));assert(w.document.querySelector('[data-section-sync-status]').textContent.includes('รอซิงก์'));assert.equal(state.sdkWrites.length,0);
  const fresh=await setup(storage(w));try{let initial=null,initialPuts=0;fresh.w.fetch=async(url,options={})=>{if(options.method!=='PUT')return response(200,initial,'"null_etag"');initialPuts++;initial=JSON.parse(options.body);return response(200,initial,'"initial"')};Object.defineProperty(fresh.w.navigator,'onLine',{value:true,configurable:true});await fresh.w.PPMSOrganizationManager.syncSections();assert.equal(initialPuts,1,'An empty server must be initialized instead of falsely confirming a cached addition');assert(initial.sectionMap['Production Division::โรง 1'].includes('Disconnected Section'));assert.equal(fresh.w.PPMSOrganizationManager.pendingSections().length,0)}finally{fresh.dom.window.close()}
  assert.deepEqual(state.errors,[]);console.log('PASSED Section additions without an SDK connection, durable offline reload, duplicate guard, scoped maps, REST retry after disconnect, ETag conflict merge, idempotent lost-response recovery, pending position preservation, unchanged employee roster and TH/EN sync status');
 }finally{state.dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
