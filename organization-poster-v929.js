/* Full organization chart: readable poster tiles, A3, and scoped headcounts. */
(()=>{
 'use strict';
 const KEY='ppms_org_export_v929',PX_MM=25.4/96,CARDS='.person[data-edit],.factory-chart-person[data-edit]';
 const labels={th:{title:'บันทึก / พิมพ์ผังองค์กรใหญ่',paper:'ขนาดกระดาษ',mode:'รูปแบบ',poster:'แบ่งหน้าสำหรับต่อผัง',fit:'ย่อให้พอดี 1 หน้า',zoom:'ขยายผัง (%)',note:'พิมพ์ที่ขนาดจริง 100% ตัดขอบตามกรอบ แล้วต่อหน้าตามแถว R และคอลัมน์ C มีระยะซ้อน 5 มม. ข้ามหน้าว่างอัตโนมัติ',fitNote:'ผังทั้งหมดอยู่ในหน้าเดียว หากชื่อเล็กให้เลือกแบ่งหน้าสำหรับต่อผัง',pdf:'ดาวน์โหลด PDF',print:'พิมพ์ / บันทึกเป็น PDF',close:'ปิด',total:'พนักงานทั้งหมด',permanent:'พนักงานประจำ',subcontractor:'พนักงานซัพคอนแทรค',thai:'ซัพคนไทย',myanmar:'ซัพพม่า',sections:'แผนก',summary:'สรุปจำนวนพนักงานในผัง',pages:'หน้า',rows:'แถว',cols:'คอลัมน์',preparing:'กำลังเตรียมผัง',failed:'สร้างผังไม่สำเร็จ',changed:'ข้อมูลผังเปลี่ยนแล้ว กรุณาปิดและเปิดหน้าบันทึกใหม่',empty:'ไม่พบพนักงานในผัง',limit:'จำนวนหน้ามากเกินไป กรุณาลดการขยายหรือเลือกกระดาษ A3',ready:'พร้อมพิมพ์แล้ว',created:'ดาวน์โหลด PDF แล้ว',retry:'โหลดระบบ PDF ไม่ครบ กรุณารีเฟรชแล้วลองใหม่'},en:{title:'Save / Print full organization chart',paper:'Paper size',mode:'Layout',poster:'Poster - assemble multiple pages',fit:'Fit entire chart on one page',zoom:'Chart zoom (%)',note:'Print at actual size (100%). Trim along the frame; assemble by row R and column C. Overlap: 5 mm. Blank pages are skipped.',fitNote:'The entire chart fits one page. Choose Poster if employee names are too small.',pdf:'Download PDF',print:'Print / Save as PDF',close:'Close',total:'Total employees',permanent:'Permanent employees',subcontractor:'Subcontract employees',thai:'Thai subcontractors',myanmar:'Myanmar subcontractors',sections:'Sections',summary:'Employee headcount in this chart',pages:'pages',rows:'rows',cols:'columns',preparing:'Preparing chart',failed:'Could not create chart',changed:'The chart has changed. Close and reopen the export settings.',empty:'No employees in this chart',limit:'Too many pages. Reduce zoom or choose A3 paper.',ready:'Ready to print',created:'PDF downloaded',retry:'PDF tools are unavailable. Refresh and try again.'}};
 const lang=()=>window.PPMSLanguage?.language==='en'?'en':'th',words=()=>labels[lang()];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let busy=false,scheduled=false,loading;
 async function dependencies(){
  if(window.html2canvas&&window.jspdf?.jsPDF)return;
  if(!loading){
   const load=(src,ready)=>ready()?Promise.resolve():new Promise((resolve,reject)=>{const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();reject(Error(words().retry))},25000);script.src=src;script.onload=()=>{clearTimeout(timer);ready()?resolve():reject(Error(words().retry))};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error(words().retry))};document.head.append(script)});
   loading=Promise.all([load('vendor/html2canvas-1.4.1.min.js',()=>window.html2canvas),load('vendor/jspdf-2.5.1.umd.min.js',()=>window.jspdf?.jsPDF)]).catch(e=>{loading=null;throw e});
  }
  await loading;
 }
 function target(){return document.querySelector('.division-org:not(.employee-history-report)')||document.querySelector('#factoryDivisionChartDetail')}
 function context(node=target()){
  if(!node)return null;
  const scope=window.PPMSOrganizationScope?.current()||{},ids=new Set([...node.querySelectorAll(CARDS)].filter(n=>!n.closest('.stamping-print-page,.sorting-print-pages')).map(n=>String(n.dataset.edit)));
  let roster=window.PPMS_RUNTIME?.factoryLayoutEmployees?.();
  if(!roster){try{const value=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]');roster=window.PPMSOrganizationScope?.employees(Array.isArray(value)?value:Object.values(value),scope)||[]}catch{roster=[]}}
  const seen=new Set(),people=roster.filter(e=>{const id=String(e.id);if(!ids.has(id)||seen.has(id))return false;seen.add(id);return true});
  const c=window.PPMSSubcontractSummary?.counts(people)||(()=>{const sub=people.filter(e=>/^(subcontractor|subcontract|ซัพคอนแทรค|พนักงานซัพคอนแทรค|พนักงานรับเหมาช่วง)$/i.test(String(e.contractType||'').trim())),thai=sub.filter(e=>/^NCN/i.test(String(e.id).trim())).length;return {permanent:people.length-sub.length,subcontractor:sub.length,thai,myanmar:sub.length-thai}})();
  return {node,scope,people,counts:{total:people.length,sections:new Set([...node.querySelectorAll('[data-org-section]')].map(n=>n.dataset.orgSection)).size,...c},title:window.PPMSOrganizationScope?.title(lang(),scope)||'Organization Chart',language:lang()};
 }
 function metrics(c,l=lang()){const w=labels[l];return ['total','sections','permanent','subcontractor','thai','myanmar'].map(key=>({label:w[key],value:c[key]||0,key}))}
 function summaryHTML(c,l=lang()){return '<h3>'+esc(labels[l].summary)+'</h3><div class="org-poster-metrics">'+metrics(c,l).map(m=>'<div><span>'+esc(m.label)+'</span><b data-org-total="'+m.key+'">'+m.value+'</b></div>').join('')+'</div>'}
 function refresh(){
  scheduled=false;const data=context();if(!data||busy)return;
  let footer=data.node.querySelector(':scope>.org-poster-summary');
  if(!footer){footer=document.createElement('footer');footer.className='org-poster-summary';footer.setAttribute('data-i18n-ignore','');data.node.append(footer)}
  const html=summaryHTML(data.counts);if(footer.innerHTML!==html)footer.innerHTML=html;
  if(data.node.id==='factoryDivisionChartDetail'&&!data.node.parentElement.querySelector('[data-org-poster-open]')){const button=document.createElement('button');button.className='no-print';button.dataset.orgPosterOpen='';button.textContent=words().title;data.node.before(button)}
  const button=document.querySelector('[data-org-poster-open]');if(button&&button.textContent!==words().title)button.textContent=words().title;
 }
 function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh)}}
 function options(value={}){return {paper:value.paper==='A3'?'A3':'A4',mode:value.mode==='fit'?'fit':'poster',zoom:Math.min(300,Math.max(50,Number(value.zoom)||125))}}
 function dimensions(node){return {width:Math.ceil(Math.max(node.scrollWidth,node.getBoundingClientRect().width,1000)),height:Math.ceil(Math.max(node.scrollHeight,node.getBoundingClientRect().height,100))}}
 function plan(width,height,value={}){
  const o=options(value),paper=o.paper==='A3'?{width:420,height:297}:{width:297,height:210},margin=8,header=12,footer=39,usableW=paper.width-2*margin,usableH=paper.height-2*margin-header-footer;
  if(!(width>0&&height>0))throw Error('Invalid chart dimensions');
  const scale=o.mode==='fit'?Math.min(usableW/width,usableH/height):PX_MM*o.zoom/100,overlap=o.mode==='poster'?5:0,tileW=usableW/scale,tileH=usableH/scale,stepX=(usableW-overlap)/scale,stepY=(usableH-overlap)/scale;
  const cols=Math.max(1,Math.ceil((width-tileW-0.001)/stepX)+1),rows=Math.max(1,Math.ceil((height-tileH-0.001)/stepY)+1),tiles=[];
  if(rows*cols>120)throw Error(words().limit);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=col*stepX,y=row*stepY;tiles.push({row:row+1,col:col+1,x,y,width:Math.min(tileW,width-x),height:Math.min(tileH,height-y)})}
  return {...o,...paper,margin,header,footer,usableW,usableH,scale,overlap,cols,rows,tiles};
 }
 function close(){if(!busy)document.getElementById('orgPosterDialog')?.remove()}
 function open(action='pdf'){
  refresh();const data=context(),w=words();if(!data||!data.people.length){alert(w.empty);return}
  close();let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
  const selected=options(saved),dialog=document.createElement('dialog');dialog.id='orgPosterDialog';dialog.setAttribute('data-i18n-ignore','');dialog.setAttribute('aria-labelledby','orgPosterTitle');
  dialog.innerHTML='<h2 id="orgPosterTitle">'+esc(w.title)+'</h2><p>'+esc(data.title)+'</p><div class="org-poster-options"><label>'+esc(w.paper)+'<select name="paper"><option value="A4">A4 - 297 × 210 mm</option><option value="A3">A3 - 420 × 297 mm</option></select></label><label>'+esc(w.mode)+'<select name="mode"><option value="poster">'+esc(w.poster)+'</option><option value="fit">'+esc(w.fit)+'</option></select></label><label data-org-zoom>'+esc(w.zoom)+'<input name="zoom" type="number" min="50" max="300" step="25"></label></div><p data-org-poster-note></p><div class="org-poster-preview"><b data-org-page-count></b><div data-org-tile-map></div></div><div class="org-poster-summary">'+summaryHTML(data.counts,data.language)+'</div><p role="status" data-org-poster-status></p><div class="org-poster-actions"><button data-org-generate="pdf">'+esc(w.pdf)+'</button><button data-org-generate="print">'+esc(w.print)+'</button><button class="secondary" data-org-close>'+esc(w.close)+'</button></div>';
  document.body.append(dialog);const field=name=>dialog.querySelector('[name="'+name+'"]');for(const [key,value]of Object.entries(selected))field(key).value=value;
  const read=()=>options({paper:field('paper').value,mode:field('mode').value,zoom:field('zoom').value});let measured=dimensions(data.node);
  function preview(){try{const o=read(),p=plan(measured.width,measured.height,o);dialog.querySelector('[data-org-zoom]').hidden=o.mode==='fit';dialog.querySelector('[data-org-poster-note]').textContent=o.mode==='fit'?w.fitNote:w.note;dialog.querySelector('[data-org-page-count]').textContent=(data.language==='en'?'Up to ':'สูงสุด ')+p.tiles.length+' '+w.pages+' · '+p.rows+' '+w.rows+' × '+p.cols+' '+w.cols;const map=dialog.querySelector('[data-org-tile-map]');map.style.gridTemplateColumns='repeat('+p.cols+',minmax(0,1fr))';map.innerHTML=p.tiles.map(t=>'<span>R'+t.row+'-C'+t.col+'</span>').join('');dialog.querySelector('[data-org-poster-status]').textContent=''}catch(e){dialog.querySelector('[data-org-poster-status]').textContent=e.message}}
  dialog.addEventListener('change',preview);dialog.addEventListener('input',preview);dialog.querySelector('[data-org-close]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  dialog.querySelectorAll('[data-org-generate]').forEach(button=>button.onclick=()=>generate(data,read(),button.dataset.orgGenerate,dialog));preview();if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');dialog.querySelector('[data-org-generate="'+action+'"]').focus({preventScroll:true});dialog.scrollTop=0;
  snapshot(data,false).then(capture=>{measured={width:capture.width,height:capture.height};capture.remove();if(dialog.isConnected){preview();dialog.scrollTop=0}}).catch(()=>{});
 }
 async function embeddedImage(img,original){
  const src=original?.currentSrc||original?.src||img.src;if(!src)return;
  img.removeAttribute('srcset');img.removeAttribute('sizes');img.removeAttribute('onerror');
  if(!/^(data:|blob:)/.test(src)){try{const response=await fetch(src,{mode:'cors',credentials:'omit',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('Photo');const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('Photo');img.src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}catch{img.src=src;img.crossOrigin='anonymous'}}else img.src=src;
  await Promise.race([img.decode?.().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,6500))]);
 }
 async function snapshot(data,prepareImages=true){
  const width=Math.max(dimensions(data.node).width,data.counts.sections*360),host=document.createElement('div');host.className='org-poster-capture';host.setAttribute('aria-hidden','true');host.setAttribute('data-i18n-ignore','');host.style.cssText='position:absolute;left:-100000px;top:0;background:#fff;width:'+width+'px;pointer-events:none;';
  const clone=data.node.cloneNode(true);clone.removeAttribute('id');clone.querySelectorAll('button,.no-print,.org-poster-summary,.organization-position-summary,.org-person-controls,.stamping-print-page,.sorting-print-pages').forEach(n=>n.remove());
  for(const prop of ['transform','zoom'])clone.style.setProperty(prop,'none','important');clone.style.setProperty('zoom','1','important');clone.style.setProperty('width',width+'px','important');clone.style.setProperty('max-width','none','important');clone.style.setProperty('height','auto','important');clone.style.setProperty('overflow','visible','important');clone.style.margin='0';
  const footer=document.createElement('footer');footer.className='org-poster-summary';footer.innerHTML=summaryHTML(data.counts,data.language);footer.style.setProperty('--org-summary-label',Math.max(18,width/130)+'px');footer.style.setProperty('--org-summary-value',Math.max(40,width/50)+'px');footer.style.setProperty('--org-summary-title',Math.max(22,width/110)+'px');footer.style.setProperty('--org-summary-space',Math.max(14,width/200)+'px');clone.append(footer);host.append(clone);document.body.append(host);
  try{await document.fonts?.ready;if(prepareImages)await Promise.all([...clone.querySelectorAll('img')].map((img,i)=>embeddedImage(img,data.node.querySelectorAll('img')[i])));await new Promise(resolve=>requestAnimationFrame(resolve));return {node:clone,host,...dimensions(clone),remove:()=>host.remove()}}catch(e){host.remove();throw e}
 }
 function pageCanvas(tileImage,tile,p,data,index){
  const dpi=150,ratio=dpi/25.4,canvas=document.createElement('canvas');canvas.width=Math.round(p.width*ratio);canvas.height=Math.round(p.height*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle='#fff';ctx.fillRect(0,0,p.width,p.height);ctx.fillStyle='#123d67';ctx.font='bold 4px Tahoma,Arial,sans-serif';ctx.fillText(data.title,p.margin,7,p.width-75);ctx.textAlign='right';ctx.font='3px Arial,sans-serif';ctx.fillText('R'+tile.row+'-C'+tile.col+' | '+(index+1)+' / '+p.tiles.length,p.width-p.margin,7);ctx.textAlign='left';
  const x=p.margin,y=p.margin+p.header,iw=tile.width*p.scale,ih=tile.height*p.scale;ctx.drawImage(tileImage,x,y,iw,ih);
  ctx.strokeStyle='#64748b';ctx.lineWidth=.15;ctx.setLineDash([1.5,1]);ctx.strokeRect(x,y,p.usableW,p.usableH);
  if(p.mode==='poster'){ctx.strokeStyle='#199c9b';if(tile.col<p.cols){ctx.beginPath();ctx.moveTo(x+p.usableW-5,y);ctx.lineTo(x+p.usableW-5,y+p.usableH);ctx.stroke()}if(tile.row<p.rows){ctx.beginPath();ctx.moveTo(x,y+p.usableH-5);ctx.lineTo(x+p.usableW,y+p.usableH-5);ctx.stroke()}}
  ctx.setLineDash([]);const cell=p.usableW/3,fy=p.height-p.margin-33;metrics(data.counts,data.language).forEach((m,i)=>{const left=p.margin+(i%3)*cell,top=fy+Math.floor(i/3)*16;ctx.fillStyle='#eff5fb';ctx.fillRect(left,top,cell-1.5,14.5);ctx.fillStyle='#173f68';ctx.font='bold 3.2px Tahoma,Arial,sans-serif';ctx.fillText(m.label,left+2,top+4.2,cell-5);ctx.font='bold 6.5px Arial,sans-serif';ctx.fillText(String(m.value),left+2,top+11.7)});ctx.font='2.4px Arial,sans-serif';ctx.fillText(p.mode==='poster'?'100% print | 5 mm overlap | Row R / Column C':p.paper+' landscape | Fit to one page',p.margin,p.height-5);return canvas;
 }
 function hasInk(canvas,tile,scale){
  const x=Math.floor(tile.x*scale),y=Math.floor(tile.y*scale),width=Math.min(canvas.width-x,Math.ceil(tile.width*scale)),height=Math.min(canvas.height-y,Math.ceil(tile.height*scale));
  const pixels=canvas.getContext('2d',{willReadFrequently:true}).getImageData(x,y,width,height).data;
  for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]&&(pixels[i]<245||pixels[i+1]<245||pixels[i+2]<245))return true;
  return false;
 }
 async function renderPages(data,value,notify=()=>{}){
  await dependencies();let capture;
  let full;
  try{
   capture=await snapshot(data);const p=plan(capture.width,capture.height,value),pages=[],scale=Math.min(2,Math.sqrt(32000000/(capture.width*capture.height)),16000/capture.width,16000/capture.height);
   notify(words().preparing+' · '+p.tiles.length+' '+words().pages);
   full=await window.html2canvas(capture.node,{backgroundColor:'#ffffff',useCORS:true,allowTaint:false,logging:false,scale,width:capture.width,height:capture.height,windowWidth:Math.max(1400,capture.width+50),windowHeight:Math.max(1000,capture.height+50),scrollX:0,scrollY:0});
   if(p.mode==='poster')p.tiles=p.tiles.filter(tile=>hasInk(full,tile,scale));
   if(!p.tiles.length)throw Error(words().empty);
   for(const [index,tile]of p.tiles.entries()){
    notify(words().preparing+' '+(index+1)+' / '+p.tiles.length);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(tile.width*scale);canvas.height=Math.ceil(tile.height*scale);canvas.getContext('2d').drawImage(full,tile.x*scale,tile.y*scale,tile.width*scale,tile.height*scale,0,0,canvas.width,canvas.height);
    const page=pageCanvas(canvas,tile,p,data,index);pages.push(page.toDataURL('image/jpeg',.95));canvas.width=canvas.height=1;page.width=page.height=1;
   }
   return {plan:p,pages,data};
  }finally{if(full)full.width=full.height=1;capture?.remove()}
 }
 async function printFrame(result){
  document.getElementById('orgPosterPrintFrame')?.remove();const frame=document.createElement('iframe');frame.id='orgPosterPrintFrame';frame.title='Organization chart print';frame.style.cssText='position:fixed;left:-10000px;top:0;width:1000px;height:800px;border:0';document.body.append(frame);
  const {plan:p,pages}=result,doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head><title>Organization Chart '+p.paper+'</title><style>@page{size:'+p.paper+' landscape;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}section{width:'+p.width+'mm;height:'+p.height+'mm;overflow:hidden;break-after:page;page-break-after:always}section:last-child{break-after:auto;page-break-after:auto}img{display:block;width:100%;height:100%}@media screen{body{background:#dde4ed}section{margin-bottom:12px}}</style></head><body>'+pages.map((url,i)=>'<section><img alt="Page '+(i+1)+'" src="'+url+'"></section>').join('')+'</body></html>');doc.close();await Promise.all([...doc.images].map(img=>img.decode().catch(()=>{})));return frame;
 }
 async function generate(data,value,action,dialog){
  if(busy)return;const w=labels[data.language],notify=text=>{dialog.querySelector('[data-org-poster-status]').textContent=text};
  if(!data.node.isConnected||data.node!==target()||JSON.stringify(data.scope)!==JSON.stringify(context()?.scope)){notify(w.changed);return}
  busy=true;dialog.querySelectorAll('button,input,select').forEach(n=>n.disabled=true);
  try{
   localStorage.setItem(KEY,JSON.stringify(options(value)));const result=await renderPages(data,value,notify);
   dialog.querySelector('[data-org-page-count]').textContent=result.pages.length+' '+w.pages+' · '+result.plan.rows+' '+w.rows+' × '+result.plan.cols+' '+w.cols;
   const included=new Set(result.plan.tiles.map(t=>'R'+t.row+'-C'+t.col));dialog.querySelectorAll('[data-org-tile-map] span').forEach(n=>n.classList.toggle('org-poster-blank',!included.has(n.textContent)));
   if(action==='pdf'){if(!window.jspdf?.jsPDF)throw Error(w.retry);const p=result.plan,pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:p.paper.toLowerCase(),compress:true});for(const [i,page]of result.pages.entries()){if(i)pdf.addPage(p.paper.toLowerCase(),'landscape');pdf.addImage(page,'JPEG',0,0,p.width,p.height,undefined,'FAST')}pdf.save('Organization_Chart_'+p.paper+'_'+(p.mode==='poster'?'Poster_'+p.rows+'x'+p.cols:'One_Page')+'.pdf');notify(w.created)}
   else{const frame=await printFrame(result);frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();notify(w.ready)}
  }catch(e){console.error(e);notify(w.failed+': '+e.message)}finally{busy=false;dialog.querySelectorAll('button,input,select').forEach(n=>n.disabled=false);queue()}
 }
 window.PPMSOrgPoster={open,context,plan,options,metrics,snapshot,renderPages,printFrame,refresh};
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-org-poster-open]'))open()});
 window.addEventListener('ppms-language-changed',queue);window.addEventListener('ppms-employees-changed',queue);window.addEventListener('ppms-organization-scope-changed',queue);
 const start=()=>{new MutationObserver(queue).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});queue()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
