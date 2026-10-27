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
  let model=captured.at(-1);assert.equal(model.summary.cards.length,6);assert.equal(model.summary.cards[0].value,model.nodes.length);assert(model.summary.cards.every(card=>card.y>Math.max(...model.nodes.map(n=>n.y+n.h))));assert.equal(model.height,model.summary.bottom);assert(model.nodes.length>10);assert(!model.nodes.some(n=>n.employee.id==='QC'||n.employee.id==='SUP-OTHER-PLANT'));assert.equal(new Set(model.nodes.map(n=>n.employee.id)).size,model.nodes.length);
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
  const summaryItems=[{key:'total',label:'Total employees',value:3},{key:'sections',label:'Sections',value:3},{key:'permanent',label:'Permanent employees',value:3},{key:'subcontractor',label:'Subcontract employees',value:0},{key:'thai',label:'Thai subcontractors',value:0},{key:'myanmar',label:'Myanmar subcontractors',value:0}];
  for(const width of [800,6000,20000]){const footer=nativeExporter.summaryLayout(width,600,summaryItems,'Employee headcount');assert.equal(footer.cards.length,6);assert(footer.cards.every(card=>card.x>=0&&card.x+card.w<=width&&card.y+card.h<footer.bottom));assert(footer.labelSize/100*404/(width*25.4/96)>=8.5,'Summary labels remain readable when fitting a wide chart to A3');assert(footer.valueSize>footer.labelSize*1.8,'Counts are visibly larger than their labels');}
  native.summary=nativeExporter.summaryLayout(native.width,native.height,summaryItems,'Employee headcount');native.height=native.summary.bottom;
  const bytes=Buffer.from(await nativeExporter.workbook(native,[{data:png},{data:png},{data:null,failed:true}])),zip=await JSZip.loadAsync(bytes),drawing=new w.DOMParser().parseFromString(await zip.file('xl/drawings/drawing1.xml').async('string'),'application/xml');
  assert.equal(drawing.querySelector('parsererror'),null);assert.equal(drawing.getElementsByTagNameNS('*','grpSp').length,3);assert.equal(drawing.getElementsByTagNameNS('*','pic').length,2);assert.equal(drawing.getElementsByTagNameNS('*','cxnSp').length,2);assert(drawing.documentElement.textContent.includes('นาย ทดสอบ & <QA>'));
  const summaryCard=drawing.querySelector('cNvPr[name="Headcount total"]').parentNode.parentNode;assert.equal(summaryCard.getElementsByTagNameNS('*','t').length,2);assert(summaryCard.textContent.includes('Total employees3'));assert(summaryCard.getElementsByTagNameNS('*','noAutofit').length);assert([...summaryCard.getElementsByTagNameNS('*','rPr')].every(node=>Number(node.getAttribute('sz'))>=1800));
  for(const link of drawing.querySelectorAll('stCxn,endCxn'))assert(drawing.querySelector('cNvPr[id="'+link.getAttribute('id')+'"]'),'Connectors reference existing employee shapes');
  const rels=await zip.file('xl/drawings/_rels/drawing1.xml.rels').async('string');assert(rels.includes('orgJD0')); for(let i=0;i<2;i++)assert(zip.file('xl/media/org-photo-'+i+'.png'));
  const reopened=new ExcelJS.Workbook();await reopened.xlsx.load(bytes);assert.equal(reopened.worksheets.length,native.nodes.length+2);const roster=reopened.getWorksheet('Employees');assert.equal(roster.getCell('B2').value,'001');assert.equal(roster.getCell('C4').value,'=1+2');assert.equal(roster.getCell('A4').value,'โหลดรูปไม่สำเร็จ');assert.equal(roster.getImages().length,2);
  assert.equal(reopened.getWorksheet('Job Descriptions'),undefined,'No combined JD sheet mixing employees');
  const relationDoc=new w.DOMParser().parseFromString(rels,'application/xml'),jdSheets=[];
  for(let i=0;i<3;i++){
   const target=relationDoc.querySelector('[Id="orgJD'+i+'"]').getAttribute('Target');assert.equal(roster.getCell(i+2,9).hyperlink,target);
   const match=target.match(/^#'([^']+)'!B2$/);assert(match,'Card links to the top of a dedicated JD form');
   const sheet=reopened.getWorksheet(match[1]);assert(sheet);jdSheets.push(sheet);
   assert.equal(sheet.getCell('B6').value,native.nodes[i].employee.name);assert(sheet.getCell('B8').text.includes('Emp.ID: '+native.nodes[i].employee.id));assert(sheet.getCell('B8').text.includes(native.nodes[i].employee.position));
   assert.equal(sheet.getCell('B4').hyperlink,"#'Organization Chart'!A1");assert.equal(sheet.views[0].ySplit,8,'Employee identity stays visible while scrolling');
   assert.equal(sheet.getCell('B2').border.left.style,'medium');assert.equal(sheet.getCell('G2').border.right.style,'medium');assert.equal(sheet.getCell(sheet.rowCount,2).border.bottom.style,'medium');
   const text=[];sheet.eachRow(row=>{for(const cell of [row.getCell(2),row.getCell(4)])if(cell.type!==ExcelJS.ValueType.Merge)text.push(cell.text)});
   if(i===0){assert(text.includes('=1+2'));assert(text.includes('PURPOSE'));assert(text.includes('JD-001 / 02'));assert(text.includes('2026-10-17'));assert(text.join('').includes('ทดสอบ'.repeat(500)),'Full long JD is preserved')}
   if(i===1)assert(text.some(t=>t.includes('No saved JD')));if(i===2)assert(text.some(t=>t.includes('Draft')));
   for(let j=0;j<3;j++)if(j!==i)assert(!text.some(t=>t.includes('Emp.ID: '+native.nodes[j].employee.id)),'No other employee JD shares this form');
   const group=[...drawing.getElementsByTagNameNS('*','cNvPr')].find(node=>node.getAttribute('id')===String(100+i*10));assert(group);assert(group.getElementsByTagNameNS('*','hlinkClick').length);if(i<2){const photo=[...drawing.getElementsByTagNameNS('*','cNvPr')].find(node=>node.getAttribute('name')==='Photo '+native.nodes[i].employee.id);assert(photo);assert(photo.getElementsByTagNameNS('*','hlinkClick').length)}
  }
  const rosterDrawing=new w.DOMParser().parseFromString(await zip.file('xl/drawings/drawing2.xml').async('string'),'application/xml');assert.equal(rosterDrawing.getElementsByTagNameNS('*','hlinkClick').length,2);
  const rosterRels=await zip.file('xl/drawings/_rels/drawing2.xml.rels').async('string');assert(rosterRels.includes('JD_001')&&rosterRels.includes('JD_002'));
  assert(!Object.keys(zip.files).some(name=>/comments|vmlDrawing|vbaProject/i.test(name)),'No comments, Notes, or macros remain');
  const chart=reopened.getWorksheet('Organization Chart');assert.equal(chart.getColumn(1).width,25,'Restore the original lightweight chart grid');
  for(const link of drawing.getElementsByTagNameNS('*','hlinkClick'))assert(!link.getAttribute('tooltip').includes('ชี้ช่อง JD'),'Remove the JD hover preview');
  for(const sheet of reopened.worksheets)sheet.eachRow(row=>row.eachCell(cell=>assert.equal(cell.note,undefined)));
  const out=path.join(os.tmpdir(),'ppms-native-organization-test.xlsx');fs.writeFileSync(out,bytes);
  assert.deepEqual(errors,[]);console.log('PASS actual Excel button routing; department/plant/Sorting scoping; deduplicated Section print copies; hierarchy parents; native grouped editable text/cards/photos/connectors; embedded images; text IDs; safe literal names; failed-photo labels; correct photo/card/roster JD links and return links; personal/position/plant JD selection; offline edits; admin permissions; long JD fields; no Notes or JD hover previews; distinct framed JD sheets with persistent employee identity; workbook reopen. Fixture:',out);
 }finally{dom.window.close()}
 // Existing app timers can run after JSDOM teardown; this script owns its process.
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
