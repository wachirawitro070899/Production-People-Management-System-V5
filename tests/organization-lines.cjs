const fs=require('node:fs'),assert=require('node:assert/strict');
const ExcelJS=require('../vendor/exceljs-4.4.0.min.js'),JSZip=require('../vendor/jszip-3.10.1.min.js');
const window={};new Function('window',fs.readFileSync('organization-lines-v879.js','utf8'))(window);
const node=(id,x,y,parent='',extra={})=>({employee:{id,name:'TEST '+id,position:id==='M'?'Manager':'Operator'},x,y,w:160,h:180,parent,...extra});
const model={title:'Routing regression',width:840,height:1000,nodes:[node('M',330,80),node('A',80,400,'M'),node('B',330,400,'M'),node('C',580,400,'M'),node('D',80,700,'M'),node('E',330,700,'B'),node('F',580,700,'C')],labels:[{text:'Manufacturing',x:305,y:350,w:210,h:20},{text:'Operators',x:50,y:650,w:220,h:20}]};
const routes=window.PPMSOrganizationLines.route(model);assert.equal(routes.size,6);
function crosses(a,b,r){const x=r.x,y=r.y,right=x+r.w,bottom=y+r.h;return a.x===b.x?a.x>x+.1&&a.x<right-.1&&Math.max(Math.min(a.y,b.y),y+.1)<Math.min(Math.max(a.y,b.y),bottom-.1):a.y>y+.1&&a.y<bottom-.1&&Math.max(Math.min(a.x,b.x),x+.1)<Math.min(Math.max(a.x,b.x),right-.1)}
for(const [i,points]of routes){
 const child=model.nodes[i],parent=model.nodes.find(n=>n.employee.id===child.parent);
 assert.deepEqual(points[0],{x:parent.x+parent.w/2,y:parent.y+parent.h});assert.deepEqual(points.at(-1),{x:child.x+child.w/2,y:child.y});
 for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];assert(a.x===b.x||a.y===b.y,'Every segment is horizontal or vertical');for(const card of model.nodes)assert(!crosses(a,b,card),'No reporting line crosses a card');for(const label of [{x:350,y:350,w:120,h:20},{x:120,y:650,w:80,h:20}])assert(!crosses(a,b,label),'No reporting line crosses a heading')}
}
const exporter=new Function('ExcelJS','JSZip','window',fs.readFileSync('organization-excel-v877.js','utf8')+';return window.PPMSOrganizationExcel;')(ExcelJS,JSZip,window);
(async()=>{
 const bytes=await exporter.workbook(model,model.nodes.map(()=>({data:null,failed:false}))),zip=await JSZip.loadAsync(bytes),xml=await zip.file('xl/drawings/drawing1.xml').async('string');
 assert.equal((xml.match(/<a:custGeom>/g)||[]).length,6,'Every route is saved with its exact points');assert.equal((xml.match(/<xdr:grpSp>/g)||[]).length,7,'Employee groups stay editable');assert(!xml.includes('<xdr:cxnSp>'),'Office must not replace the planned routes with automatic elbow connectors');assert(!xml.includes('<a:stCxn'),'Routes are not automatically recalculated on open');
 const reopened=new ExcelJS.Workbook();await reopened.xlsx.load(bytes);assert.equal(reopened.getWorksheet('Employees').rowCount,8);
 console.log('PASS top/bottom ports, shared parent branches, headings and intervening cards, orthogonal line geometry, exact native freeform paths, editable employee groups and workbook reopen.');
})().catch(error=>{console.error(error);process.exitCode=1});
