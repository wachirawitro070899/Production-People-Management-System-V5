// Preserve screen typography, colors and level badges when the matrix is printed.
(()=>{'use strict';
 const properties=['display','box-sizing','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-transform','text-decoration','white-space','word-break','overflow-wrap','color','background-color','background-image','background-size','background-position','border-top','border-right','border-bottom','border-left','border-radius','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','width','min-width','max-width','height','min-height','max-height','vertical-align','object-fit','object-position','grid-template-columns','grid-template-rows','gap','align-items','justify-content','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','border-collapse','border-spacing','table-layout','opacity','visibility','box-shadow','text-shadow','filter'];
 const style=document.createElement('style');style.id='matrixWebPrintStyle';document.head.append(style);
 let scheduled=false;
 function capture(){
  scheduled=false;if(window.matchMedia('print').matches)return;
  const report=document.querySelector('#app .matrix-report');if(!report)return;
  const width=Math.ceil(report.getBoundingClientRect().width);if(!width)return;
  const size=document.getElementById('paperSize')?.value||sessionStorage.getItem('matrixPaperSize')||'A4';
  const orientation=document.getElementById('paperOrientation')?.value||'landscape';
  const requested=document.getElementById('paperScale')?.value||sessionStorage.getItem('matrixPaperScale')||'Fit Width';
  const paper=size==='A3'?[297,420]:[210,297];
  const pageWidth=orientation==='portrait'?paper[0]:paper[1];
  const fit=Math.min(1,(pageWidth-10)*96/25.4/width);
  const scale=requested==='Fit Width'?fit:Math.max(.1,Math.min(1,Number(requested)/100||fit));
  const rules=[];
  for(const [i,node] of [report,...report.querySelectorAll('*')].entries()){
   const computed=getComputedStyle(node);node.dataset.webPrint=String(i);
   const values=properties.map(p=>p+':'+computed.getPropertyValue(p)+'!important;').join('');
   rules.push('#app .matrix-report[data-web-print="'+i+'"],#app .matrix-report [data-web-print="'+i+'"]{'+values+'}');
  }
  // Freeze appearance, then apply only one overall scale. Rows remain intact
  // across pages, and the old forced break after row 14 is removed.
  style.textContent='@media print{@page{size:'+size+' '+orientation+';margin:5mm}'+rules.join('')+
   '#app .matrix-report{width:'+width+'px!important;min-width:'+width+'px!important;max-width:'+width+'px!important;margin:0!important;zoom:'+scale+'!important;transform:none!important;overflow:visible!important;break-inside:auto!important}'+
   '#app .matrix-report .table-wrap{overflow:visible!important;max-height:none!important}'+
   '#app .matrix-report,#app .matrix-report *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
   '#app .matrix-report .skill-matrix-table thead{display:table-header-group!important}'+
   '#app .matrix-report .skill-matrix-table tbody tr{break-before:auto!important;page-break-before:auto!important;break-inside:avoid!important;page-break-inside:avoid!important}'+
   '#app .matrix-report .matrix-proficiency,#app .matrix-report .matrix-approval{break-inside:avoid!important;page-break-inside:avoid!important}}';
 }
 function schedule(){if(scheduled||window.matchMedia('print').matches)return;scheduled=true;requestAnimationFrame(capture)}
 const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 // Capture while screen styles still apply, before the existing print handler
 // switches body classes and opens the native print dialog.
 document.addEventListener('click',event=>{if(event.target.closest('#doPrint')&&document.querySelector('#app .matrix-report'))capture()},true);
 window.addEventListener('resize',schedule);window.addEventListener('afterprint',schedule);
 document.fonts?.ready.then(schedule);schedule();
})();
