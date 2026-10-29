const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ExcelJS=require('../vendor/exceljs-4.4.0.min.js');
const document={readyState:'loading',addEventListener(){},querySelector(){return null},getElementById(){return null}};
const window={ExcelJS,PPMSOrganizationScope:{combinedSection:s=>s}};
const ctx={window,document,ExcelJS,Intl,Date,console,setTimeout,clearTimeout,URL,Blob};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('skill-matrix-renderer-v752.js','utf8').split('/* V761:')[0],ctx);
vm.runInContext(fs.readFileSync('matrix-layout-v924.js','utf8'),ctx);
const api=window.PPMSMatrixReport,skills=['Safety','Operation','Quality','Inspection','5S','OEE','Training'];
const starts=['2026-10-20','2026-09-29','2026-08-29','2026-06-29','2026-04-29','2025-10-29',''];
const rows=starts.map((startDate,i)=>({no:i+1,id:'DEMO-'+i,name:'SAMPLE '+i,position:'Operator',updated:'2026-10-29',levels:[1,2,3,4,1,2,3],score:16,level:2,person:{id:'DEMO-'+i,name:'SAMPLE '+i,position:'Operator',section:'Stamping Section',startDate}}));
const model={title:'Stamping Section',section:'Stamping Section',skills,date:'2026-10-29',documentNo:'TEST',revision:'00',ranges:api.ranges(7),rows};
const html=api.pageHTML(model,rows,1,1);
assert.equal((html.match(/data-tenure-band=/g)||[]).length,7);assert(html.includes('matrix-tenure-legend'));assert(html.includes('1–&lt;2 เดือน'));
(async()=>{
 const book=await api.workbook(model,api.options('A4','landscape')),sheet=book.worksheets[0];
 for(let i=0;i<rows.length;i++){
  const expected='FF'+window.PPMSSkillTenure.forEmployee(rows[i].person,model.date).tint.slice(1);
  for(let col=1;col<=13;col++)assert.equal(sheet.getCell(i+4,col).fill.fgColor.argb,expected,'Entire row including skills and rank');
 }
 assert(sheet.conditionalFormattings.every(c=>c.rules.every(r=>!r.style.fill)),'Skill edits preserve the tenure row background');
 const saved=new ExcelJS.Workbook();await saved.xlsx.load(await book.xlsx.writeBuffer());assert.equal(saved.worksheets[0].getCell('A5').fill.fgColor.argb,'FFffebeb');
 assert.equal(sheet.getCell('A11').value,'อายุงาน < 1 เดือน');assert.equal(sheet.getCell('K11').value,'อายุงาน 1 ปีขึ้นไป');
 console.log('PASS: full employee rows, matching document legends, complete native XLSX row fills, retained colors after skill edits and XLSX round-trip.');
})().catch(e=>{console.error(e);process.exitCode=1});
