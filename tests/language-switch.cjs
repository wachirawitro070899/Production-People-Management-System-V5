// Run with JSDOM_MODULE pointing to jsdom when it is installed outside this repository.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const dom=new JSDOM('<html><head></head><body><header></header><main><button id="mixed">เพิ่ม Section / Position</button><select id="section"><option>Stamping Section</option></select><p id="code">JR-HR-SM-001</p><p id="person">Quality Leader</p><textarea id="draft">ข้อความที่ผู้ใช้กรอกเอง</textarea><div class="ppms-jd-text" id="jd">1. วางแผนและบริหารกำลังคน เครื่องจักร งบประมาณ และกำลังการผลิต\n   Plan and manage manpower, machines, budget, and production capacity.</div></main></body></html>',{url:'https://example.com',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;let alertText='';w.alert=value=>{alertText=value};w.confirm=()=>false;w.prompt=()=>'';
w.localStorage.setItem('ppms_v3_employees',JSON.stringify([{id:'EMP-1',name:'Quality Leader'}]));
w.eval(fs.readFileSync('language-v843.js','utf8'));w.eval(fs.readFileSync('jd-role-templates-v843.js','utf8'));
const el=id=>w.document.getElementById(id),api=w.PPMSLanguage;
(async()=>{
 for(let i=0;i<3;i++){
  api.setLanguage('th');assert.equal(el('mixed').textContent,'เพิ่ม แผนก / ตำแหน่ง');assert.equal(el('section').value,'Stamping Section');assert.equal(el('section').selectedOptions[0].textContent,'แผนกปั๊ม');assert(!/[A-Za-z]/.test(el('jd').textContent));
  api.setLanguage('en');assert(!/[ก-๙]/.test(el('mixed').textContent));assert(!/[ก-๙]/.test(el('jd').textContent));assert.equal(el('section').value,'Stamping Section');assert.equal(el('code').textContent,'JR-HR-SM-001');assert.equal(el('person').textContent,'Quality Leader');assert.equal(el('draft').value,'ข้อความที่ผู้ใช้กรอกเอง');
 }
 el('mixed').textContent='กรุณาระบุเวลาเข้าจริง';await new Promise(r=>setTimeout(r,60));assert.equal(el('mixed').textContent,'Enter the actual arrival time');
 w.alert('กรุณาระบุเวลาเข้าจริง');assert.equal(alertText,'Enter the actual arrival time');
 for(const position of ['Manager','Engineer','Supervisor','Leader','Technician','Operator','Document','Planning','Warehouse','Other']){const d=w.PPMSJDTemplates.draft({position,section:'Stamping Section'});for(const key of ['responsibilities','qualifications','reportsTo'])assert(!/[ก-๙]/.test(api.translate(d[key],'en')),position+': '+key);}
 // Employee names use saved bilingual fields in cards, text and print copies.
 const roster=[{id:'BILINGUAL',name:'MR.TEST PERSON',thaiName:'นายทดสอบ ระบบ'},{id:'FALLBACK',name:'MR.NO THAI'},{id:'ALIAS',name:'Legacy Name',englishName:'Preferred English',nameTh:'นางสาวทดสอบ ชื่อสำรอง'}];
 w.localStorage.setItem('ppms_v3_employees',JSON.stringify(roster));
 const cards=w.document.createElement('section');cards.innerHTML='<div class="person"><b>MR.TEST PERSON</b></div><div class="factory-chart-person"><b>MR.TEST PERSON</b></div><div class="stamping-card-name">MR.TEST PERSON</div><div class="sorting-card-name">MR.TEST PERSON</div><p id="nameLine">BILINGUAL · MR.TEST PERSON</p><p id="fallback">MR.NO THAI</p><p id="alias">Legacy Name</p><input id="nameEdit" value="MR.TEST PERSON">';w.document.body.append(cards);
 for(let i=0;i<3;i++){
  api.setLanguage('th');for(const node of cards.querySelectorAll('b,.stamping-card-name,.sorting-card-name'))assert.equal(node.textContent,'นายทดสอบ ระบบ');
  assert.equal(el('nameLine').textContent,'BILINGUAL · นายทดสอบ ระบบ');assert.equal(el('fallback').textContent,'MR.NO THAI');assert.equal(el('alias').textContent,'นางสาวทดสอบ ชื่อสำรอง');assert.equal(el('nameEdit').value,'MR.TEST PERSON');
  assert.equal(api.sourceText(cards.querySelector('b')),'MR.TEST PERSON');
  const copy=new JSDOM('<html><body>'+cards.outerHTML+'</body></html>');api.setLanguage('en');api.translateDocument(copy.window.document);assert.equal(copy.window.document.querySelector('b').textContent,'MR.TEST PERSON');copy.window.close();
  assert.equal(cards.querySelector('b').textContent,'MR.TEST PERSON');assert.equal(el('alias').textContent,'Preferred English');
 }
 api.setLanguage('th');roster[0].thaiName='นายแก้ไข ระบบ';w.localStorage.setItem('ppms_v3_employees',JSON.stringify(roster));api.refresh();assert.equal(cards.querySelector('b').textContent,'นายแก้ไข ระบบ');
 assert.equal(JSON.parse(w.localStorage.getItem('ppms_v3_employees'))[0].name,'MR.TEST PERSON');api.setLanguage('en');
 const print=new JSDOM('<html><head><title>Employee Skill Card</title></head><body><p>หน้าที่และความรับผิดชอบ</p><p>JR-HR-SM-001</p></body></html>');api.translateDocument(print.window.document);assert.equal(print.window.document.documentElement.lang,'en');assert(!/[ก-๙]/.test(print.window.document.body.textContent));assert(print.window.document.body.textContent.includes('JR-HR-SM-001'));
 assert.equal(w.localStorage.getItem('ppms_ui_language'),'en');assert.equal(api.sourceText(el('mixed')),'กรุณาระบุเวลาเข้าจริง');
 print.window.close();dom.window.close();console.log('Passed: repeated Thai/English switching, mixed labels, stable option values, protected names and IDs, editable data, dynamic messages, alerts, every JD role, and print document language.');
})().catch(e=>{dom.window.close();throw e});
