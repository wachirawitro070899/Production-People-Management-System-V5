const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
(async()=>{
 const dom=new JSDOM('<html><head></head><body><main id="app"></main></body></html>',{url:'https://matrix.test',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.getBoundingClientRect=function(){const min=Number(this.style.minHeight.replace('mm',''))||0;const rows=[...this.querySelectorAll('[data-matrix-doc-employee]')];const height=Math.max(min,80+rows.reduce((sum,row)=>sum+(row.textContent.includes('LONG ROW')?25:12.5),0));return {height:height*96/25.4,width:1000,top:0,left:0,right:1000,bottom:height*96/25.4}};
 w.eval(fs.readFileSync('matrix-layout-v924.js','utf8'));const api=w.PPMSMatrixReport;
 const model=count=>({title:'Sorting Section · Sorting 2',documentNo:'TEST',revision:'00',date:'2026-10-29',skills:['Safety'],ranges:api.ranges(1),rows:Array.from({length:count},(_,i)=>({no:i+1,id:'EMP'+i,name:'Employee '+i,position:'Operator',updated:'2026-10-29',levels:[3],score:3,level:3,person:{}}))});
 for(const size of ['A4','A3'])for(const orientation of ['landscape','portrait'])for(const count of [0,1,9,10,11,17,25,51]){
  const m=model(count),opt=api.options(size,orientation);await api.resolvePages(m,opt);assert.equal(m.pages.flat().length,count);assert.deepEqual(Array.from(m.pages).flat().map(r=>r.id),m.rows.map(r=>r.id));
  for(let i=0;i<m.pages.length-1;i++){const height=80+m.pages[i].length*12.5;assert(height<=opt.h-11.7);assert(height+12.5>opt.h-11.7,'A nonfinal page must have no room for the next row')}
  if(count===11&&size==='A4'&&orientation==='landscape')assert.deepEqual(Array.from(m.pages,rows=>rows.length),[9,2],'Screenshot regression: never average 11 staff into 6 and 5');
  assert.equal(w.document.querySelectorAll('.matrix-document-render').length,0);
 }
 const m=model(22);m.rows[2].name='LONG ROW';await api.resolvePages(m,api.options('A4','landscape'));assert.deepEqual(Array.from(m.pages,rows=>rows.length),[8,9,5],'Only the page with a taller row loses capacity; later pages still fill completely');
 w.close();console.log('PASS measured pagination fills earlier pages, preserves every row/order, handles variable row heights and cleans up measuring nodes for A4/A3 in both orientations.');
})().catch(e=>{console.error(e);process.exitCode=1});
