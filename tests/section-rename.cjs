const fs=require('node:fs'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('tests/section-offline-save.cjs','utf8').split('(async()=>{')[0];
const {setup,fixture}=new Function('require',prefix+'\nreturn {setup,fixture};')(require);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),key='Production Division::โรง 1',other='Production Division::โรง 2';
const MK='ppms_organization_master_v1';
const response=(status,value,etag)=>({ok:status>=200&&status<300,status,headers:{get:name=>name.toLowerCase()==='etag'?etag:null},json:async()=>structuredClone(value)});
async function state(options={}){
 const s=await setup({},false),{w}=s;w.firebase=undefined;Object.defineProperty(w.navigator,'onLine',{value:options.offline!==true,configurable:true});
 let server=structuredClone(fixture.master),version=1,puts=0,conflict=options.conflict,loseResponse=options.loseResponse;
 w.fetch=async(url,request={})=>{
  assert(String(url).endsWith('/settings/organizationMaster.json'),'Only organization name metadata may be written');
  if(options.failRead)throw Error('network unavailable');
  if(request.method!=='PUT')return response(200,server,'"v'+version+'"');
  puts++;assert.equal(request.headers['if-match'],'"v'+version+'"');
  if(conflict){conflict=false;server.unknownSetting={keep:true};server.sectionMap[key].push('Concurrent Section');version++;return response(412,server)}
  server=JSON.parse(request.body);version++;if(loseResponse){loseResponse=false;throw Error('response lost')}return response(200,server);
 };
 return {...s,server:()=>server,puts:()=>puts,setServer:value=>{server=value;version++}};
}
async function rename(w,section,name){
 w.document.querySelector('[data-rename-section-picker]').click();const dialog=w.document.querySelector('#renameSectionDialog'),form=dialog.querySelector('form');
 form.elements.section.value=section;assert.equal(form.elements.section.value,section);form.elements.section.dispatchEvent(new w.Event('change'));form.elements.name.value=name;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));for(let i=0;i<80&&dialog.isConnected&&form.querySelector('[type="submit"]').disabled;i++)await wait(5);return dialog;
}
(async()=>{
 let s=await state({conflict:true});
 try{
  const {w}=s,originalRoster=w.localStorage.getItem('ppms_v3_employees'),layout={machines:{one:{section:'Stamping Section',assignments:{one:{employeeId:'OP1'}}}}};w.localStorage.setItem('ppms_factory_layout_v1',JSON.stringify(layout));
  const display=w.document.createElement('div');display.id='renameDisplays';display.innerHTML='<h3>Stamping Section</h3><select><option>Stamping Section</option><option>Sorting 1</option><option>Sorting 2</option></select><p>Stamping Section · 3 เครื่อง</p><span>Support Production Section</span>';w.document.body.append(display);
  await rename(w,'Stamping Section','  ปั๊มโลหะ  ใหม่  ');assert(!w.document.querySelector('#renameSectionDialog'));assert(s.alerts.at(-1).includes('เรียบร้อย'));assert.equal(s.puts(),2);
  assert.deepEqual(s.server().sectionMap[other],fixture.master.sectionMap[other]);assert(s.server().unknownSetting.keep);assert(s.server().sectionMap[key].includes('Concurrent Section'));
  assert.deepEqual(s.server().sectionPositions,fixture.master.sectionPositions);assert(s.server().sectionMap[key].includes('Stamping Section'),'Stable keys survive a display rename');assert.equal(w.PPMSOrganizationScope.sectionLabel('Stamping Section'),'ปั๊มโลหะ ใหม่');assert.equal(w.PPMSOrganizationScope.sectionLabel('Stamping Section',{division:'Production Division',plant:'โรง 2'}),'Stamping Section');
  assert.equal(w.localStorage.getItem('ppms_v3_employees'),originalRoster);assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_factory_layout_v1')),layout);assert.equal(s.sdkWrites.length,0);
  w.PPMSLanguage.refresh();assert.equal(display.querySelector('h3').textContent,'ปั๊มโลหะ ใหม่');assert.equal(display.querySelector('select').options[0].value,'Stamping Section');assert.equal(display.querySelector('select').options[0].textContent,'ปั๊มโลหะ ใหม่');assert(display.querySelector('p').textContent.includes('ปั๊มโลหะ ใหม่'));assert.equal(w.PPMSLanguage.sourceText(display.querySelector('h3')),'Stamping Section');
  w.PPMSLanguage.setLanguage('en');assert.equal(w.document.querySelector('[data-rename-section-picker]').textContent,'Rename Section');assert.equal(display.querySelector('h3').textContent,'ปั๊มโลหะ ใหม่','A custom Section name remains as entered in either language');w.PPMSLanguage.setLanguage('th');
  assert.equal(w.PPMSOrganizationScope.resolveSection('ปั๊มโลหะ ใหม่'),'Stamping Section');assert.throws(()=>w.PPMSOrganizationManager.addSection('ปั๊มโลหะ ใหม่','Production Division','โรง 1'),/มีชื่อ Section/);
  await rename(w,'Support Production','ธุรการและสนับสนุน');w.PPMSLanguage.refresh();assert.equal(display.querySelector('span').textContent,'ธุรการและสนับสนุน','Existing employee spelling aliases resolve to the same name');
  await rename(w,'Sorting 1','คัดงานหน้า');assert.equal(w.PPMSOrganizationScope.sectionLabel('Sorting 1'),'คัดงานหน้า');assert.equal(w.PPMSOrganizationScope.sectionLabel('Sorting 2'),'Sorting 2');assert.equal(w.PPMSOrganizationScope.sectionKey('Sorting 1'),'sorting1');assert.equal(w.PPMSOrganizationScope.sectionKey('Sorting 2'),'sorting2');
  const count=s.puts();let dialog=await rename(w,'Sorting 2','คัดงานหน้า');assert(dialog.isConnected);assert(w.PPMSLanguage.sourceText(dialog.querySelector('[data-rename-message]')).includes('มีชื่อ Section'),dialog.querySelector('[data-rename-message]').textContent);assert.equal(s.puts(),count);dialog.remove();
  dialog=await rename(w,'Sorting 2','แผนกคัดงาน1');assert(dialog.isConnected);assert(w.PPMSLanguage.sourceText(dialog.querySelector('[data-rename-message]')).includes('มีชื่อ Section'),dialog.querySelector('[data-rename-message]').textContent);assert.equal(s.puts(),count);dialog.remove();
  // A new browser loads the same metadata and immediately sees renamed labels.
  const fresh=await setup({[MK]:JSON.stringify(s.server())},false);try{assert.equal(fresh.w.PPMSOrganizationScope.sectionLabel('Stamping Section'),'ปั๊มโลหะ ใหม่');assert.equal(fresh.w.PPMSOrganizationScope.resolveSection('ธุรการและสนับสนุน'),'Support Production')}finally{fresh.dom.window.close()}
  // Switching scope restores that plant's labels, then restores the custom name.
  w.PPMSOrganizationScope.activate({plant:'โรง 2'});w.PPMSLanguage.refresh();assert.notEqual(display.querySelector('h3').textContent,'ปั๊มโลหะ ใหม่');w.PPMSOrganizationScope.activate({plant:'โรง 1'});w.PPMSLanguage.refresh();assert.equal(display.querySelector('h3').textContent,'ปั๊มโลหะ ใหม่');
  // Occupied Sections can be renamed without moving or editing employee records.
  assert(fixture.employees.some(e=>e.section==='Stamping Section'));assert.equal(w.localStorage.getItem('ppms_v3_employees'),originalRoster);assert.deepEqual(s.errors,[]);
 }finally{s.dom.window.close()}
 for(const options of [{offline:true},{failRead:true}]){s=await state(options);try{const before=s.w.localStorage.getItem(MK),dialog=await rename(s.w,'Stamping Section','Name failed');assert(dialog.isConnected);assert(dialog.querySelector('[data-rename-message]').textContent.includes('ไม่สำเร็จ'));assert.equal(s.puts(),0);assert.equal(s.w.localStorage.getItem(MK),before);assert(!dialog.querySelector('[type="submit"]').disabled);assert.deepEqual(s.errors,[])}finally{s.dom.window.close()}}
 s=await state({loseResponse:true});try{let dialog=await rename(s.w,'Stamping Section','Saved after lost response');assert(dialog.isConnected);assert.equal(s.puts(),1);assert.equal(s.w.PPMSOrganizationScope.sectionLabel('Stamping Section'),'Stamping Section');dialog.querySelector('form').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));await wait(35);assert(!dialog.isConnected);assert.equal(s.puts(),1,'Retry confirms a saved name without writing twice');assert.equal(s.w.PPMSOrganizationScope.sectionLabel('Stamping Section'),'Saved after lost response')}finally{s.dom.window.close()}
 s=await state();try{const {w}=s;w.document.querySelector('[data-rename-section-picker]').click();const f=w.document.querySelector('#renameSectionDialog form'),remote=structuredClone(s.server());remote.sectionLabels={[key]:[{section:'Stamping Section',name:'Another editor'}]};s.setServer(remote);f.elements.name.value='Overwrite';f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(35);assert(f.querySelector('[data-rename-message]').textContent.includes('เครื่องอื่น'));assert.equal(s.puts(),0)}finally{s.dom.window.close()}
 console.log('Passed: Section rename UI, occupied Sections, durable scoped labels, TH/EN display and stable select values, roster/Layout/positions preserved, numbered Sorting separation, canonical and display duplicate guards, conditional conflict merge, cross-device names, offline/read failures, idempotent lost-response retry, and competing rename protection.');
})().catch(error=>{console.error(error);process.exitCode=1});
