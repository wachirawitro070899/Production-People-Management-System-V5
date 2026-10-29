const fs=require('node:fs'),assert=require('node:assert/strict');
const {setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const {dom,w,errors}=await setup(true);
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.alert=()=>{};
 const records=[{username:'tester',passwordHash:'owner-hash',active:true,owner:true},{username:'observer',passwordHash:'view-hash',active:true,permission:'view'},{username:'editor',passwordHash:'edit-hash',active:true,permission:'edit'}];
 const setAccount=user=>{w.sessionStorage.setItem('ppms_admin_user',user);w.PPMS_RUNTIME.syncAdminAccounts(records)};
 try{
  setAccount('observer');await wait(80);assert.equal(w.PPMSAccess.permission(),'view');assert.equal(w.PPMS_RUNTIME.factoryLayoutIsAdmin(),false);assert.equal(w.PPMS_RUNTIME.certificateContext().isAdmin,false);assert.equal(w.PPMS_RUNTIME.monthReportContext().allowed,true);
  assert(w.document.querySelector('#nav [data-page="add"]').disabled);
  w.document.querySelector('#nav [data-page="matrix"]').click();await wait(120);assert(w.document.querySelector('[data-action="bulkSkills"]').disabled);assert(w.document.querySelector('[data-action="baselineSkills"]').disabled);assert(!w.document.querySelector('[data-action="matrixExcel"]').disabled);assert(!w.document.querySelector('#matrixSection').disabled);assert(w.PPMSMatrixReport.snapshot().rows.length>0);
  const before=w.localStorage.getItem('ppms_v3_employees');await assert.rejects(w.PPMS_RUNTIME.deleteEmployeeNow('TEST-4-2'),e=>e.code==='read-only');assert.equal(w.localStorage.getItem('ppms_v3_employees'),before);
  await assert.rejects(w.fetch(w.PPMS_FIREBASE_CONFIG.databaseURL+'/ppms/employees.json',{method:'PUT',body:'[]'}),e=>e.code==='read-only');
  const form=w.document.createElement('form');form.id='attemptedEdit';w.document.body.append(form);assert.equal(form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})),false);form.remove();
  w.document.querySelector('[data-action="bulkSkills"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));assert(!w.document.querySelector('#bulkSkillForm'));
  w.document.querySelector('#nav [data-page="training"]').click();await wait(80);assert(w.document.querySelector('#certificatePage'));const add=w.document.querySelector('[data-cert-add]');assert(!add||add.disabled);
  w.PPMSLanguage.setLanguage('en');await wait(80);assert.equal(w.document.getElementById('modeBadge').textContent,'View only');w.PPMSLanguage.setLanguage('th');
  setAccount('editor');await wait(80);assert.equal(w.PPMSAccess.permission(),'edit');assert(w.PPMS_RUNTIME.factoryLayoutIsAdmin());w.document.querySelector('#nav [data-page="matrix"]').click();await wait(100);assert(!w.document.querySelector('[data-action="bulkSkills"]').disabled);
  setAccount('tester');let remote=structuredClone(records),writes=0;
  w.fetch=async(url,options={})=>{
   if(String(url).includes('/adminDeviceLocks/'))return {ok:true,status:200,json:async()=>({deviceId:'test-device'}),headers:{get:()=>null}};
   if(String(url).includes('/adminAccounts')){if(options.method==='PUT'){writes++;remote=JSON.parse(options.body)}return {ok:true,status:200,json:async()=>structuredClone(remote),headers:{get:name=>name.toLowerCase()==='etag'?'"v1"':null}}}
   return {ok:true,status:200,json:async()=>null,headers:{get:()=>null}};
  };
  w.document.querySelector('#nav [data-page="accounts"]').click();await wait(80);
  assert.equal(w.document.querySelector('#adminAccountForm [name="permission"]').value,'view','New accounts default to read only');assert(w.document.querySelector('[data-account-permission="tester"]').disabled);
  await w.PPMS_RUNTIME.changeAdminAccount('observer',{permission:'edit'});assert.equal(Object.values(remote).find(a=>a.username==='observer').permission,'edit');assert.equal(Object.values(remote).find(a=>a.username==='observer').passwordHash,'view-hash');assert.equal(writes,1);
  await assert.rejects(w.PPMS_RUNTIME.changeAdminAccount('tester',{permission:'view'}));assert.equal(writes,1,'Owner access cannot be downgraded');
  setAccount('observer');await assert.rejects(w.PPMS_RUNTIME.changeAdminAccount('editor',{permission:'view'}));assert.equal(writes,1,'Viewers cannot change permissions');
  setAccount('tester');w.document.querySelector('#nav [data-page="accounts"]').click();await wait(80);const create=w.document.querySelector('#adminAccountForm');create.elements.username.value='newviewer';create.elements.password.value='test-password';create.elements.confirmPassword.value='test-password';create.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(180);assert.equal(Object.values(remote).find(a=>a?.username==='newviewer')?.permission,'view');assert.equal(Object.values(remote).filter(Boolean).length,4);
  assert.deepEqual(errors.filter(e=>!e.includes('HTMLCanvasElement.prototype.getContext')),[]);console.log('PASS: read-only navigation/filters/exports; blocked edits, submission and REST writes; full editor restored; owner-controlled creation and role changes; owner protected; old accounts retained.');
 }finally{w.requestAnimationFrame=()=>0;w.queueMicrotask=()=>{};await wait(80);dom.window.close()}
 const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');const sdk=new JSDOM('<html><body></body></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),v=sdk.window;let writes=0;
 class Reference{set(){writes++;return Promise.resolve()}update(){writes++;return Promise.resolve()}remove(){writes++;return Promise.resolve()}transaction(){writes++;return Promise.resolve()}push(){writes++;return Promise.resolve()}}
 v.firebase={database:{Reference}};v.fetch=async()=>({ok:true});v.sessionStorage.setItem('ppms_admin','1');v.sessionStorage.setItem('ppms_admin_user','observer');v.localStorage.setItem('ppms_v3_admin_accounts',JSON.stringify(records));v.eval(fs.readFileSync('account-access-v945.js','utf8'));
 for(const method of ['set','update','remove','transaction','push'])await assert.rejects(new Reference()[method]({}),e=>e.code==='read-only');assert.equal(writes,0,'Readonly SDK operations never reach the write transport');sdk.window.close();
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
