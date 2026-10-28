const fs=require('node:fs'),assert=require('node:assert/strict');
const {setup}=require('./app-pages.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function dispose(dom){dom.window.requestAnimationFrame=()=>0;dom.window.queueMicrotask=()=>{};await wait(150);dom.window.close();await wait(0)}
(async()=>{
 const {dom,w,errors}=await setup(true);
 try{
  const alerts=[];w.alert=s=>alerts.push(s);w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},clearRect(){},drawImage(){},measureText:()=>({width:10})});Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  w.document.querySelector('#nav [data-page="training"]').click();await wait(100);assert(w.document.querySelector('#certificatePage'));
  assert(w.document.querySelector('#certificatePage').textContent.includes('0'));
  w.document.querySelector('[data-cert-add]').click();let form=w.document.querySelector('#certificateForm');
  assert(form.querySelector('option[value="CQI-15"]'),'CQI-15 is an editable course suggestion');
  const attendeeSearch=form.querySelector('#certAttendeeSearch');attendeeSearch.value='TEST-4-';attendeeSearch.dispatchEvent(new w.Event('input',{bubbles:true}));form.querySelector('#certSelectVisible').click();assert.equal(form.querySelectorAll('[name="employeeIds"]:checked').length,8,'Select all respects the attendee search');form.querySelector('#certClearSelection').click();assert.equal(form.querySelectorAll('[name="employeeIds"]:checked').length,0);attendeeSearch.value='';attendeeSearch.dispatchEvent(new w.Event('input',{bubbles:true}));
  form.querySelector('[name="employeeIds"][value="TEST-4-1"]').checked=true;form.elements.course.value='CQI-15';form.elements.provider.value='Training Institute';form.elements.date.value='2026-09-01';form.elements.certificateNumber.value='CERT-123';
  const submit=()=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  form.elements.expiryDate.value='2026-08-01';submit();await wait(50);assert(w.document.querySelector('#certificateStatus').textContent.includes('วันหมดอายุ'));
  form.elements.expiryDate.value='2027-09-01';form.elements.certificateUrl.value='javascript:alert(1)';submit();await wait(50);assert(w.document.querySelector('#certificateStatus').textContent.includes('https://'));
  form.elements.certificateUrl.value='https://example.test/certificate';submit();await wait(150);
  assert(!w.document.querySelector('#certificateDialog'));const pending=JSON.parse(w.localStorage.getItem('ppms_v3_certificate_outbox'));assert.equal(Object.keys(pending).length,1);let job=Object.values(pending)[0];assert.equal(job.employeeId,'TEST-4-1');assert.equal(job.record.course,'CQI-15');assert.equal(job.record.status,'certified');assert(w.document.querySelector('#certTable').textContent.includes('รอซิงก์'));
  // Offline entries do not overwrite the employee profile or assign skills.
  const before=JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id==='TEST-4-1');assert.equal(before.certifications,undefined);assert.equal(before.currentSkillLevel,1);
  w.document.querySelector('[data-cert-edit]').click();form=w.document.querySelector('#certificateForm');assert.equal(form.elements.course.value,'CQI-15');form.elements.course.value='Custom Auditor Course';submit();await wait(150);assert.equal(Object.keys(JSON.parse(w.localStorage.getItem('ppms_v3_certificate_outbox'))).length,1,'Editing an offline record keeps one pending identity');
  const search=w.document.querySelector('#certSearch');search.value='no-match';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.document.querySelectorAll('[data-cert-row]').length,0);search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.document.querySelectorAll('[data-cert-row]').length,1);
  // Network recovery retries the durable record and updates only certificate fields.
  let savedRecord;w.PPMS_EMPLOYEE_SAVE_SERVICE.saveCertificate=async(id,record,expected)=>{assert.equal(id,'TEST-4-1');assert.equal(expected,'');savedRecord=record;return {employees:[{...before,certifications:[record]}],deletedEmployeeIds:[]}};
  Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});await w.PPMSCertificates.sync();assert.equal(savedRecord.course,'Custom Auditor Course');assert.deepEqual(JSON.parse(w.localStorage.getItem('ppms_v3_certificate_outbox')),{});assert(!w.document.querySelector('#certTable').textContent.includes('รอซิงก์'));
  const saved=JSON.parse(w.localStorage.getItem('ppms_v3_employees')).find(e=>e.id==='TEST-4-1');assert.equal(saved.certifications.length,1);assert.equal(saved.name,before.name);assert.equal(saved.currentSkillLevel,before.currentSkillLevel);
  w.document.querySelector('#nav [data-page="search"]').click();await wait(100);w.document.querySelector('[data-edit="TEST-4-1"]').click();await wait(100);assert(w.document.querySelector('[data-cert-panel="TEST-4-1"]').textContent.includes('Custom Auditor Course'),'Employee profile includes the course history');
  assert.equal(w.PPMSCertificates.state({status:'certified',expiryDate:'2020-01-01'}),'expired');assert.equal(w.PPMSCertificates.state({status:'planned',expiryDate:'2020-01-01'}),'planned');assert.equal(w.PPMSCertificates.safeUrl('javascript:alert(1)'),'');
  assert.deepEqual(errors.filter(e=>!e.startsWith('Not implemented: HTMLCanvasElement.prototype.getContext')),[],errors.join('\n'));console.log('PASS course form, CQI-15 suggestion, custom courses, date/URL validation, offline durability/edit, filters, online retry, profile history and unchanged skills.');
 }finally{await dispose(dom)}
 const publicPage=await setup(false);try{assert.equal(publicPage.w.document.querySelector('[data-page="training"]'),null);assert.equal(publicPage.w.PPMSCertificates.panel({id:'TEST-4-1'}),'');assert.deepEqual(publicPage.errors.filter(e=>!e.startsWith('Not implemented: HTMLCanvasElement.prototype.getContext')),[]);console.log('PASS public pages expose no certificate records or editing.')}finally{await dispose(publicPage.dom)}
})().catch(e=>{console.error(e);process.exitCode=1});
