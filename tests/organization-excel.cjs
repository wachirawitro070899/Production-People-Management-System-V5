/* Real app entrypoints and native XLSX contents; all service traffic is mocked. */
const fs=require('node:fs'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
const prefix=fs.readFileSync('tests/section-chart-teams.cjs','utf8').split('\n(async()=>{')[0];
const {setup,nav,section}=new Function('require',prefix+'\nreturn {setup,nav,section};')(require);
const ExcelJS=require('../vendor/exceljs-4.4.0.min.js'),JSZip=require('../vendor/jszip-3.10.1.min.js');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQMAdTpGCrIngcVnSU9DOfe74s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfWAgAjlqSohoAAAAAElFTkSuQmCC';
(async()=>{
 const {dom,w,errors}=await setup('index.html');
 try{
  w.ExcelJS=ExcelJS;w.JSZip=JSZip;
  // JSDOM does not lay out elements. Give fixture cards distinct positions.
  w.HTMLElement.prototype.getBoundingClientRect=function(){const cards=[...this.parentElement?.querySelectorAll('.person[data-edit]')||[]],i=Math.max(0,cards.indexOf(this));return {left:20+(i%4)*180,top:30+Math.floor(i/4)*220,width:this.matches('.person')?160:1400,height:this.matches('.person')?180:800}};
  let captured=[];const exporter=w.PPMSOrganizationExcel,original=exporter.download;
  exporter.download=options=>{captured.push(exporter.snapshot(options));return Promise.resolve()};
  await nav(w,'dashboard');const stored=w.localStorage.getItem('ppms_v3_employees');w.document.querySelector('[data-action="pageExcel"]').click();
  let model=captured.at(-1);assert(model.nodes.length>10);assert(!model.nodes.some(n=>n.employee.id==='QC'||n.employee.id==='SUP-OTHER-PLANT'));assert.equal(new Set(model.nodes.map(n=>n.employee.id)).size,model.nodes.length);
  const tree=w.document.querySelector('#organizationStructureView');tree.value='tree';tree.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));w.document.querySelector('[data-action="pageExcel"]').click();
  model=captured.at(-1);assert.equal(model.nodes.find(n=>n.employee.id==='SUP').parent,'MANAGER');
  await nav(w,'sectionChart');await section(w,'Stamping Section');w.document.querySelector('[data-action="pageExcel"]').click();model=captured.at(-1);assert(model.nodes.every(n=>n.employee.section==='Stamping Section'));assert.equal(new Set(model.nodes.map(n=>n.employee.id)).size,model.nodes.length,'Print copies are not duplicated');
  await section(w,'Sorting 1');w.document.querySelector('[data-action="pageExcel"]').click();assert(captured.at(-1).nodes.every(n=>n.employee.sortingGroup==='Sorting 1'||n.employee.section==='Sorting 1'));
  w.PPMSOrganizationScope.activate({division:'Quality Division'});await new Promise(r=>setTimeout(r,100));await nav(w,'dashboard');w.document.querySelector('[data-action="pageExcel"]').click();assert(captured.at(-1).nodes.every(n=>n.employee.organizationDivision==='Quality Division'));assert.equal(w.localStorage.getItem('ppms_v3_employees'),stored);
  exporter.download=original;
  const native={title:'Organization Chart',nodes:[{employee:{id:'001',name:'นาย ทดสอบ & <QA>',position:'Manager',section:'Production'},parent:'',x:240,y:100,w:180,h:180},{employee:{id:'002',name:'TEST ENGINEER',position:'Engineer',section:'Welding'},parent:'001',x:100,y:360,w:180,h:180},{employee:{id:'003',name:'=1+2',position:'Leader',section:'Stamping'},parent:'001',x:380,y:360,w:180,h:180}],labels:[],width:600,height:600};
  // Saved personal JD wins over position JD; offline changes must be exported too.
  const jdBase={division:'Production Division',plant:'โรง 1',section:'Stamping Section',position:'Operator',responsibilities:'ROLE DUTIES',qualifications:'ROLE SKILLS',revision:'01'};
  const records={wrong:{...jdBase,plant:'โรง 2',responsibilities:'WRONG PLANT'},role:jdBase,personal:{...jdBase,employeeId:'STAMP-DAY',responsibilities:'PERSONAL DUTIES'}};
  w.localStorage.setItem('ppms_job_descriptions_v1',JSON.stringify(records));w.dispatchEvent(new w.StorageEvent('storage',{key:'ppms_job_descriptions_v1'}));
  let resolved=await w.PPMSJDExport.snapshot([{id:'STAMP-DAY'},{id:'STAMP-NIGHT'},{id:'QC'}]);assert.equal(resolved[0].responsibilities,'PERSONAL DUTIES');assert.equal(resolved[1].responsibilities,'ROLE DUTIES');assert.equal(resolved[2],null);
  await w.PPMS_JD_OFFLINE.save('personal',{...records.personal,responsibilities:'OFFLINE DUTIES'},0);
  resolved=await w.PPMSJDExport.snapshot([{id:'STAMP-DAY'}]);assert.equal(resolved[0].responsibilities,'OFFLINE DUTIES');
  w.sessionStorage.removeItem('ppms_admin');assert((await w.PPMSJDExport.snapshot([{id:'STAMP-DAY'}])).every(x=>x===null));w.sessionStorage.setItem('ppms_admin','1');
  const exportedJDs=[{...jdBase,employeeId:'001',responsibilities:'=1+2\nหน้าที่ & <QA> '+ 'ทดสอบ'.repeat(500),jobPurpose:'PURPOSE',documentNo:'JD-001',revision:'02',effectiveDate:'2026-10-17',reportsTo:'DIRECTOR',exportSource:'Individual JD'},null,{...jdBase,exportSource:'Position JD',draft:true}];
  const nativeExporter=new Function('ExcelJS','JSZip','window',fs.readFileSync('organization-excel-v877.js','utf8')+';return window.PPMSOrganizationExcel;')(ExcelJS,JSZip,{PPMSJDExport:{snapshot:async people=>{assert.deepEqual(people.map(e=>e.id),['001','002','003']);return exportedJDs}}});
  const bytes=Buffer.from(await nativeExporter.workbook(native,[{data:png},{data:png},{data:null,failed:true}])),zip=await JSZip.loadAsync(bytes),drawing=new w.DOMParser().parseFromString(await zip.file('xl/drawings/drawing1.xml').async('string'),'application/xml');
  assert.equal(drawing.querySelector('parsererror'),null);assert.equal(drawing.getElementsByTagNameNS('*','grpSp').length,3);assert.equal(drawing.getElementsByTagNameNS('*','pic').length,2);assert.equal(drawing.getElementsByTagNameNS('*','cxnSp').length,2);assert(drawing.documentElement.textContent.includes('นาย ทดสอบ & <QA>'));
  for(const link of drawing.querySelectorAll('stCxn,endCxn'))assert(drawing.querySelector('cNvPr[id="'+link.getAttribute('id')+'"]'),'Connectors reference existing employee shapes');
  const rels=await zip.file('xl/drawings/_rels/drawing1.xml.rels').async('string');assert(rels.includes('orgJD0')); for(let i=0;i<2;i++)assert(zip.file('xl/media/org-photo-'+i+'.png'));
  const reopened=new ExcelJS.Workbook();await reopened.xlsx.load(bytes);assert.equal(reopened.worksheets.length,3);const roster=reopened.getWorksheet('Employees');assert.equal(roster.getCell('B2').value,'001');assert.equal(roster.getCell('C4').value,'=1+2');assert.equal(roster.getCell('A4').value,'โหลดรูปไม่สำเร็จ');assert.equal(roster.getImages().length,2);
  const jdSheet=reopened.getWorksheet('Job Descriptions'),jdText=[];jdSheet.eachRow(row=>jdText.push(row.getCell(1).text));
  assert(jdText.includes('=1+2'));assert(jdText.includes('PURPOSE'));assert(jdText.includes('JD-001 / 02 / 2026-10-17'));assert(jdText.some(t=>t.includes('No saved JD')));assert(jdText.some(t=>t.includes('Draft')));assert(jdText.join('').includes('ทดสอบ'.repeat(500)),'Long JD content is preserved');
  const relationDoc=new w.DOMParser().parseFromString(rels,'application/xml');
  for(let i=0;i<3;i++){
   const target=relationDoc.querySelector('[Id="orgJD'+i+'"]').getAttribute('Target');assert.equal(roster.getCell(i+2,9).hyperlink,target);
   const anchor=Number(target.match(/!A(\d+)$/)[1]);assert(jdSheet.getCell(anchor,1).text.endsWith(' · '+native.nodes[i].employee.id));assert.equal(jdSheet.getCell(anchor+1,1).hyperlink,"#'Organization Chart'!A1");
   const group=drawing.querySelector('grpSp cNvPr[id="'+(100+i*10)+'"]');assert(group.querySelector('hlinkClick'));if(i<2)assert(drawing.querySelector('cNvPr[name="Photo '+native.nodes[i].employee.id+'"] hlinkClick'));
  }
  const rosterDrawing=new w.DOMParser().parseFromString(await zip.file('xl/drawings/drawing2.xml').async('string'),'application/xml');assert.equal(rosterDrawing.querySelectorAll('hlinkClick').length,2);
  const rosterRels=await zip.file('xl/drawings/_rels/drawing2.xml.rels').async('string');assert(rosterRels.includes('Job Descriptions'));
  const out=path.join(os.tmpdir(),'ppms-native-organization-test.xlsx');fs.writeFileSync(out,bytes);
  assert.deepEqual(errors,[]);console.log('PASS actual Excel button routing; department/plant/Sorting scoping; deduplicated Section print copies; hierarchy parents; native grouped editable text/cards/photos/connectors; embedded images; text IDs; safe literal names; failed-photo labels; correct photo/card/roster JD links and return links; personal/position/plant JD selection; offline edits; admin permissions; long JD fields; workbook reopen. Fixture:',out);
 }finally{dom.window.close()}
 // Existing app timers can run after JSDOM teardown; this script owns its process.
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
