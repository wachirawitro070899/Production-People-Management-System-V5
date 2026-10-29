const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.PPMS_QA_DIR||'/tmp/ppms-matrix-quality';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.context().route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='matrix.test')return route.abort();const file=url.pathname==='/qa-font.woff2'?process.env.PPMS_QA_FONT:path.resolve(root,url.pathname==='/matrix-layout-preview.html'?'tests/matrix-layout-preview.html':decodeURIComponent(url.pathname.slice(1)));if(!file||(!file.startsWith(root+path.sep)&&url.pathname!=='/qa-font.woff2'))return route.abort();return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.woff2')?'font/woff2':'text/html'})});
  await page.addInitScript(()=>{window.print=()=>{window.parent.matrixPrintedHTML=document.documentElement.outerHTML}});
  await page.goto('https://matrix.test/matrix-layout-preview.html');await page.waitForFunction(()=>window.PPMSMatrixReport&&window.html2canvas);
  // Reproduce the application's sticky header rules in the PDF capture container.
  await page.addStyleTag({content:'header{position:sticky;top:0;z-index:20}th{position:sticky;top:0}'});
  if(process.env.PPMS_QA_FONT)await page.addStyleTag({content:'@font-face{font-family:Tahoma;src:url("/qa-font.woff2")}'});
  await page.evaluate(()=>{window.captures=[];const original=window.html2canvas;window.html2canvas=async(node,options)=>{const head=node.querySelector('.matrix-doc-header'),th=node.querySelector('th');window.captures.push({scale:options.scale,headerPosition:getComputedStyle(head).position,tablePosition:getComputedStyle(th).position,headerBottom:head.getBoundingClientRect().bottom,tableTop:th.getBoundingClientRect().top,rows:node.querySelectorAll('[data-matrix-doc-employee]').length});const canvas=await original(node,options);Object.assign(captures.at(-1),{width:canvas.width,height:canvas.height});return canvas}});
  fs.mkdirSync(out,{recursive:true});
  for(const [size,count]of [['A4',5],['A4',17],['A3',17]]){
   await page.evaluate(count=>{const table=document.querySelector('.skill-matrix-table tbody');while(table.rows.length>count)table.deleteRow(table.rows.length-1)},count);
   if(count===17)await page.reload();
   // Instrumentation and font styles need to survive the fresh 17-person fixture.
   if(count===17){await page.addStyleTag({content:'header{position:sticky;top:0;z-index:20}th{position:sticky;top:0}'+(process.env.PPMS_QA_FONT?'@font-face{font-family:Tahoma;src:url("/qa-font.woff2")}':'')});await page.evaluate(()=>{window.captures=[];const original=window.html2canvas;window.html2canvas=async(node,options)=>{const canvas=await original(node,options);captures.push({scale:options.scale,headerPosition:getComputedStyle(node.querySelector('.matrix-doc-header')).position,tablePosition:getComputedStyle(node.querySelector('th')).position,width:canvas.width,height:canvas.height,rows:node.querySelectorAll('[data-matrix-doc-employee]').length});return canvas}})}
   const downloading=page.waitForEvent('download');await page.evaluate(size=>PPMSMatrixReport.run('pdf',PPMSMatrixReport.options(size,'landscape')),size);const download=await downloading;const filename=path.join(out,size+'-'+count+'.pdf');await download.saveAs(filename);
   const captures=await page.evaluate(()=>captures),pdf=fs.readFileSync(filename).toString('latin1');assert(captures.length);assert.equal(captures.reduce((n,c)=>n+c.rows,0),count);for(const c of captures){assert.equal(c.scale,300/96);assert.equal(c.headerPosition,'static');assert.equal(c.tablePosition,'static');assert(c.width>=(size==='A3'?4800:3300))}assert(!pdf.includes('/DCTDecode'),'Text is stored with lossless PNG compression');assert.equal(await page.locator('.matrix-document-render').count(),0);console.log('PASS',size,count,'employees;',captures.length,'pages;',captures.map(c=>c.width+'x'+c.height).join(', '));
  }
  await page.evaluate(()=>PPMSMatrixReport.run('print',PPMSMatrixReport.options('A4','landscape')));await page.waitForFunction(()=>window.matrixPrintedHTML);
  const printHTML=await page.evaluate(()=>matrixPrintedHTML);assert(printHTML.includes('matrix-layout-v924.css?v=947'));assert(!printHTML.includes('<canvas'),'Print keeps live text and table elements');
  const print=await browser.newPage();await print.setContent(printHTML);if(process.env.PPMS_QA_FONT)await print.addStyleTag({content:'@font-face{font-family:Tahoma;src:url("https://matrix.test/qa-font.woff2")}'});await print.evaluate(()=>document.fonts.ready);const native=await print.pdf({preferCSSPageSize:true,printBackground:true});assert(native.toString('latin1').includes('/Font'),'Native print retains PDF font objects');fs.writeFileSync(path.join(out,'native-print.pdf'),native);console.log('PASS native text printing and PDF fonts');
  await page.evaluate(()=>{const m=PPMSMatrixReport.snapshot();m.rows=m.rows.slice(0,5);document.querySelector('.matrix-preview-pages').innerHTML=PPMSMatrixReport.makePages(m,PPMSMatrixReport.options('A4','landscape'))});await page.locator('.matrix-preview-pages .matrix-document-page').first().screenshot({path:path.join(out,'matrix-preview.png')});assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
