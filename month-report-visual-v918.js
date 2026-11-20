/* SVG charts and an isolated A4 report, using the existing scoped report models. */
(() => {
 'use strict';
 const t=(th,en)=>window.PPMSLanguage?.language==='en'?en:th;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors=['#168559','#d34949','#2877bd'];
 const cssURL=new URL('month-report-visual-v918.css?v=973',document.currentScript?.src||location.href).href;
 const link=document.createElement('link');link.rel='stylesheet';link.href=cssURL;document.head.append(link);
 let last=null,busy=false,includeDetails=false,openedForPrint=[];
 const number=n=>Number(n||0).toLocaleString('en-US');
 function svg(title,body,height=175){return '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="'+height+'" viewBox="0 0 440 '+height+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+body+'</svg>'}
 function legend(){return '<div class="mr-legend"><span><i style="background:'+colors[0]+'"></i>'+t('เข้าใหม่','New hires')+'</span><span><i style="background:'+colors[1]+'"></i>'+t('ลาออก','Resignations')+'</span></div>'}
 function trend(data){
  const max=Math.max(1,...data.flatMap(r=>[r.joined,r.left])),top=Math.ceil(max/4)*4;
  let body='';
  for(let i=0;i<=4;i++){const y=143-i*28;body+='<line x1="32" x2="433" y1="'+y+'" y2="'+y+'" stroke="#e2e8f0"/><text x="25" y="'+(y+4)+'" text-anchor="end">'+number(top*i/4)+'</text>'}
  data.forEach((r,i)=>{const x=48+i*65;[r.joined,r.left].forEach((n,j)=>{const h=n/top*112;body+='<rect x="'+(x+j*23)+'" y="'+(143-h)+'" width="19" height="'+h+'" rx="2" fill="'+colors[j]+'"/><text x="'+(x+j*23+9.5)+'" y="'+(137-h)+'" text-anchor="middle">'+number(n)+'</text>'});body+='<text x="'+(x+20)+'" y="165" text-anchor="middle">'+esc(r.month.slice(5)+'/'+r.month.slice(2,4))+'</text>'});
  return svg(t('จำนวนพนักงานเข้าใหม่และลาออกย้อนหลัง 6 เดือน หน่วยคน','New hires and resignations over six months, people'),body);
 }
 function progress(label,value,total,color){const percent=total?Math.round(value/total*100):0;return '<div class="mr-progress"><div><span>'+label+'</span><b>'+number(value)+' / '+number(total)+' '+(total?'('+percent+'%)':'')+'</b></div><div class="mr-track"><i style="width:'+percent+'%;background:'+color+'"></i></div></div>'}
 function trainingChart(m){const max=Math.max(1,m.planned,m.done);return '<div class="mr-training-bars">'+[[t('แผนอบรม','Planned sessions'),m.planned,'#2877bd'],[t('อบรมแล้ว','Completed sessions'),m.done,'#168559']].map(([name,n,color])=>'<div><span>'+name+'</span><div class="mr-bar-line"><i style="width:'+n/max*80+'%;background:'+color+'"></i><b>'+number(n)+'</b></div></div>').join('')+'</div><p class="mr-chart-note">'+t('หน่วย: หัวข้อ • ผู้เข้าอบรมแล้ว ','Unit: sessions • Trained people: ')+number(m.trainedPeople)+t(' คน (ไม่ซ้ำ)',' (unique)')+'</p><p class="mr-chart-note">'+t('แผนนับตามวันกำหนดอบรม ผลนับตามวันอบรมจริง จึงอาจเป็นคนละหัวข้อ','Plans and completions follow their respective dates and may refer to different sessions.')+'</p>'}
 function summary({ctx,history,people,pref,data,monthTitle,archive}){
  const learning=window.PPMSMonthDevelopment?.model(ctx,history,pref.month,pref.section);
  const months=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(Number(pref.month.slice(0,4)),Number(pref.month.slice(5))-6+i,1)),month=d.toISOString().slice(0,7),m=window.PPMSMonthReport.model(people,history,ctx,month,pref.section);return {month,joined:m.joined.length,left:m.left.length}});
  const hasMovement=!!(data.joined.length||data.left.length);
  const section=pref.section?window.PPMSMonthReport.departmentLabel(pref.section,ctx):t('ทุกแผนก','All departments');
  const card=(label,value,color)=>'<div class="mr-kpi" style="border-color:'+color+'"><span>'+label+'</span><strong style="color:'+color+'">'+value+'</strong></div>';
  const panels=[];
  const panel=(kind,title,body,extra='')=>panels.push({kind,title,body,extra});
  const warnings=[archive.loading?t('กำลังโหลดประวัติลาออก','Loading resignation history'):archive.error||(!archive.loadedAt?t('ประวัติลาออกยังไม่ได้ยืนยันข้อมูลล่าสุด','Resignation history is not yet verified'):''),window.PPMSMonthDevelopment?.reportState?.().loading?t('กำลังโหลดแผนอบรม','Loading training plans'):window.PPMSMonthDevelopment?.reportState?.().error||(!window.PPMSMonthDevelopment?.reportState?.().loadedAt?t('แผนอบรมยังไม่ได้ยืนยันข้อมูลล่าสุด','Training plans are not yet verified'):''),data.pending?t('ลาออกรอซิงก์ ไม่รวมในยอด: ','Pending exits excluded: ')+data.pending:'',data.undated?t('ประวัติไม่มีวันที่ลาออก: ','History without exit date: ')+data.undated:''].filter(Boolean);

  if(months.some(row=>row.joined||row.left))panel('trend',t('เข้า–ลาออกย้อนหลัง 6 เดือน (คน)','Six-month movement trend (people)'),trend(months),legend());
  if(hasMovement)panel('departments',t('เข้าใหม่–ลาออกตามแผนก (คน)','Movements by department (people)'),window.PPMSMonthReport.movementTable(data,ctx));
  panel('training',t('แผนและผลการอบรม','Training plans and results'),learning?trainingChart(learning):'<div class="mr-empty">'+t('ไม่มีข้อมูลการอบรม','Training data unavailable')+'</div>');
  panel('exams',t('ความคืบหน้าการสอบอัปสกิล','Upskill examination progress'),learning?'<p class="mr-chart-note">'+esc(learning.q+' · '+learning.start+' – '+learning.end)+'</p>'+progress(t('สอบรายไตรมาสแล้ว (คน)','Quarterly examined (people)'),learning.quarterly.length,learning.roster.length,colors[2])+'<p class="mr-chart-note">'+t('ยังไม่สอบรอบนี้: ','Outstanding this quarter: ')+number(learning.missing.length)+t(' คน',' people')+'</p><div class="mr-exam-stats"><span>'+t('สอบในเดือน','Examined in month')+'<b>'+number(learning.examPeople)+'</b></span><span>'+t('ผ่านเกณฑ์','Passed')+'<b>'+number(learning.passed)+'</b></span><span>'+t('รออนุมัติ','Pending approval')+'<b>'+number(learning.pendingApproval)+'</b></span></div><p class="mr-chart-note">'+t('หน่วย: คนไม่ซ้ำ • ผ่าน ≥80% และไม่มีผลรออนุมัติ/ไม่อนุมัติ','Unique people • Pass ≥80%, excluding pending/rejected results')+'</p>':'<div class="mr-empty">'+t('ไม่มีข้อมูลการสอบ','Exam data unavailable')+'</div>');
  const kpis=hasMovement?'<div class="mr-kpis">'+card(t('พนักงานเข้าใหม่ (คน)','New hires (people)'),number(data.joined.length),colors[0])+card(t('พนักงานลาออก (คน)','Resignations (people)'),number(data.left.length),colors[1])+card(t('เปลี่ยนแปลงสุทธิ (คน)','Net change (people)'),(data.net>0?'+':'')+number(data.net),colors[2])+'</div>':'';
  const charts=panels.map((item,i)=>'<section class="mr-chart" data-month-chart="'+item.kind+'"><h3>'+String(i+1).padStart(2,'0')+' · '+item.title+'</h3>'+item.extra+item.body+'</section>').join('');
  const footnotes=(hasMovement||panels.some(item=>item.kind==='trend')?'<p>'+t('เข้าใหม่อ้างอิงวันที่เริ่มงาน • ลาออกอ้างอิงวันที่ลาออก • แผนกอ้างอิงข้อมูลที่เก็บไว้','Hires use start dates • Resignations use exit dates • Departments follow stored records')+'</p>':'')+(learning?'<p>'+t('สถานะการสอบ ณ ','Exam progress as of ')+esc(learning.asOf)+' · '+({upcoming:t('ยังไม่ถึงรอบสอบ','Upcoming'),open:t('อยู่ในรอบสอบ','Exam window open'),closed:t('สิ้นสุดรอบสอบแล้ว','Exam window closed')}[learning.status])+'</p>':'')+(warnings.length?'<p class="mr-warning">'+warnings.map(esc).join(' · ')+'</p>':'');
  return '<article class="mr-sheet'+(data.sections.length>10?' mr-expanded':'')+'" data-month-summary data-month-movements="'+hasMovement+'"><div class="mr-title"><div><div class="mr-company">JINRONG ELECTRONICS TECHNOLOGY (THAILAND) CO., LTD.</div><h2>MONTH REPORT <span>'+esc(monthTitle)+'</span></h2><p>'+esc(ctx.scope.division)+' · '+esc(ctx.scope.plant)+' · '+esc(section)+'</p></div><div class="mr-badge">PPMS<br><b>A4</b></div></div>'+kpis+'<div class="mr-chart-grid">'+charts+'</div><div class="mr-footnotes">'+footnotes+'</div><footer>'+t('รายงานกำลังคน การอบรม และการสอบประจำเดือน','Monthly workforce, training and examination report')+'<span>'+t('จัดทำเมื่อ ','Generated ')+esc(new Date().toLocaleString(t('th-TH','en-GB'),{timeZone:'Asia/Bangkok'}))+'</span></footer></article>';
 }
 function paint(state){
  last=state;const {root}=state,host=root.querySelector('[data-month-report-content]'),status=host.querySelector('[data-month-report-status]');
  const details=document.createElement('details');details.className='mr-appendix';details.open=true;details.innerHTML='<summary>'+t('รายละเอียดพนักงาน การอบรม และผลสอบ','Employee, training and examination details')+'</summary><div class="mr-detail-body"></div>';
  const body=details.lastElementChild;let next=status.nextElementSibling;while(next){const current=next;next=next.nextElementSibling;body.append(current)}
  status.insertAdjacentHTML('afterend',summary(state));host.append(details);
  const controls=root.querySelector('.month-report-controls'),button=controls.querySelector('[data-month-report-print]');button.textContent=t('พิมพ์ A4','Print A4');
  controls.insertAdjacentHTML('beforeend','<button type="button" data-month-report-pdf>'+t('บันทึก PDF (A4)','Save PDF (A4)')+'</button><label class="mr-details-option"><input type="checkbox" data-month-report-include-details '+(includeDetails?'checked':'')+'>'+t('แนบรายละเอียดตอนพิมพ์ / บันทึก','Include details when printing / saving')+'</label><small class="mr-print-hint">'+t('สรุปรายงาน A4 แนวตั้ง • แสดงเฉพาะแผนกที่มีรายการ • รายละเอียดต่อหน้าถัดไป','A4 portrait summary • Only departments with movements • Details continue on following pages')+'</small>');
 }
 async function frame(){
  if(!last||!document.getElementById('monthReport')||!window.PPMS_RUNTIME?.monthReportContext?.().allowed)throw Error(t('กรุณาเปิด Month Report ใหม่','Reopen Month Report'));
  const summaryNode=document.querySelector('[data-month-summary]');if(!summaryNode)throw Error(t('ไม่พบรายงาน','Report unavailable'));
  const iframe=document.createElement('iframe');iframe.className='mr-export-frame';iframe.title='Month Report A4';iframe.style.cssText='position:fixed;left:-12000px;top:0;width:210mm;height:297mm;border:0;';document.body.append(iframe);
  const doc=iframe.contentDocument;doc.open();doc.write('<!doctype html><html lang="'+t('th','en')+'"><head><meta charset="utf-8"><title>Month_Report_'+esc(last.pref.month)+'</title></head><body class="mr-print-document"></body></html>');doc.close();
  const css=doc.createElement('link');css.rel='stylesheet';css.href=cssURL;doc.head.append(css);const paper=doc.createElement('style');paper.textContent='@page{size:A4 portrait;margin:8mm}';doc.head.append(paper);
  doc.body.append(summaryNode.cloneNode(true));
  if(includeDetails){const appendix=document.querySelector('.mr-detail-body').cloneNode(true);appendix.className='mr-print-appendix';appendix.querySelectorAll('.no-print,button').forEach(n=>n.remove());appendix.querySelectorAll('details').forEach(n=>n.open=true);doc.body.append(appendix)}
  try{await new Promise((resolve,reject)=>{if(css.sheet)return resolve();const timer=setTimeout(()=>reject(Error(t('โหลดรูปแบบรายงานไม่สำเร็จ กรุณาลองใหม่','Report styles did not load. Retry.'))),10000);css.onload=()=>{clearTimeout(timer);resolve()};css.onerror=()=>{clearTimeout(timer);reject(Error(t('โหลดรูปแบบรายงานไม่สำเร็จ','Report styles could not be loaded')))}});await doc.fonts?.ready;await new Promise(resolve=>iframe.contentWindow.requestAnimationFrame(()=>iframe.contentWindow.requestAnimationFrame(resolve)));return iframe}catch(error){iframe.remove();throw error}
 }
 async function printReport(){if(busy)return;busy=true;let iframe;try{iframe=await frame();const win=iframe.contentWindow;win.addEventListener('afterprint',()=>{iframe.remove();busy=false},{once:true});win.focus();win.print();busy=false;setTimeout(()=>iframe?.remove(),60000)}catch(error){iframe?.remove();busy=false;alert(error.message)}}
 async function savePDF(){
  if(busy)return;
  if(includeDetails||!window.html2canvas||!window.jspdf?.jsPDF){await printReport();return}
  busy=true;const button=document.querySelector('[data-month-report-pdf]');if(button){button.disabled=true;button.textContent=t('กำลังสร้าง PDF…','Creating PDF…')}
  let iframe;
  try{iframe=await frame();const sheet=iframe.contentDocument.querySelector('.mr-sheet'),canvas=await window.html2canvas(sheet,{scale:2,backgroundColor:'#ffffff',logging:false});const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});const ratio=Math.min(194/canvas.width,281/canvas.height);pdf.addImage(canvas.toDataURL('image/png'),'PNG',8,8,canvas.width*ratio,canvas.height*ratio);pdf.save(iframe.contentDocument.title+'.pdf')}
  catch(error){alert(t('บันทึก PDF ไม่สำเร็จ กรุณาใช้ปุ่มพิมพ์ A4 แล้วเลือก Save as PDF','PDF export failed. Use Print A4 and choose Save as PDF.'))}
  finally{iframe?.remove();busy=false;if(button?.isConnected){button.disabled=false;button.textContent=t('บันทึก PDF (A4)','Save PDF (A4)')}}
 }
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-month-report-pdf]'))void savePDF()});
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-month-report-include-details]'))includeDetails=e.target.checked});
 // Install the page rule only while this report is being printed.
 window.addEventListener('beforeprint',()=>{if(document.getElementById('monthReport')){document.body.classList.add('mr-print-active');document.body.classList.toggle('mr-print-details',includeDetails);if(includeDetails){openedForPrint=[...document.querySelectorAll('.mr-appendix,.mr-appendix details')].filter(n=>!n.open);openedForPrint.forEach(n=>n.open=true)}const paper=document.createElement('style');paper.id='monthReportPaperStyle';paper.textContent='@page{size:A4 portrait;margin:8mm}';document.getElementById(paper.id)?.remove();document.head.append(paper)}});
 window.addEventListener('afterprint',()=>{document.body.classList.remove('mr-print-active','mr-print-details');document.getElementById('monthReportPaperStyle')?.remove();openedForPrint.forEach(n=>n.open=false);openedForPrint=[]});
 window.PPMSMonthVisual={paint,summary,print:printReport,savePDF,frame};
})();
