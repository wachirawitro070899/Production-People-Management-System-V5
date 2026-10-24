/* Employee paper exams: read the displayed question set, export answer-free A4 pages. */
(() => {
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={quarterly:'ข้อสอบรายไตรมาส',upskill:'ข้อสอบอัปสกิล',sub_regular:'ข้อสอบปรับบรรจุ',sub_permanent:'ข้อสอบปรับบรรจุ',new_employee:'ข้อสอบพนักงานเริ่มงานใหม่'};
 let busy=false;
 const allowed=()=>sessionStorage.getItem('ppms_admin')==='1'&&window.PPMS_RUNTIME?.monthReportContext?.().isAdmin===true;
 function writtenPrompts(skill){return [
  `อธิบายมาตรฐานงานที่สำคัญที่สุดของ ${skill} และเหตุผลที่ต้องควบคุม`,
  `ยกตัวอย่างความผิดปกติในหัวข้อ ${skill} พร้อมวิธีหยุด ควบคุม และป้องกันการเกิดซ้ำ`,
  `อธิบายวิธีตรวจสอบคุณภาพก่อนเริ่มงาน ระหว่างงาน และหลังจบงาน สำหรับ ${skill}`,
  `หากผลตรวจไม่เป็นไปตามมาตรฐานในหัวข้อ ${skill} คุณจะตัดสินใจและรายงานอย่างไร`,
  `อธิบายความเสี่ยงด้านความปลอดภัยที่เกี่ยวข้องกับ ${skill} และวิธีควบคุม`,
  'อธิบายขั้นตอนการแก้ปัญหาเมื่อเครื่องมือ เครื่องจักร หรือกระบวนการผิดปกติ โดยไม่ข้ามมาตรฐาน',
  'อธิบายวิธีสอนพนักงานใหม่ให้ทำงานตามมาตรฐานและวิธีตรวจยืนยันความเข้าใจ',
  'หากพบของเสียซ้ำ คุณจะวิเคราะห์สาเหตุ เก็บหลักฐาน และติดตามผลอย่างไร',
  'อธิบายตัวอย่างการปรับปรุงงานที่ช่วยลดความเสี่ยง ลดของเสีย หรือเพิ่มประสิทธิภาพ โดยไม่กระทบคุณภาพ',
  `ในฐานะ Level 5 คุณจะควบคุมมาตรฐานของ ${skill} และรับผิดชอบเมื่อเกิดปัญหาอย่างไร`
 ]}
 function read(){
  if(!allowed())throw Error('กรุณาเข้าสู่ระบบ Admin และเปิดหน้าเช็ค / แก้ไขข้อสอบ');
  const form=document.getElementById('examBankForm');if(!form)throw Error('กรุณาเลือกชุดในหน้าเช็ค / แก้ไขข้อสอบ');
  const value=id=>document.getElementById(id)?.value||'',examType=value('examCheckType'),section=value('examCheckSection'),focusSkill=value('examCheckSkill'),quarter=value('examCheckQuarter'),level=Number(value('examCheckLevel')),setName=value('examCheckSet');
  if(!labels[examType]||!section||!focusSkill||!/^Q[1-4]$/.test(quarter)||!['A','B','C'].includes(setName)||!Number.isInteger(level)||level<1||level>4)throw Error('ข้อมูลชุดข้อสอบไม่ครบ กรุณาเลือกชุดข้อสอบใหม่');
  // Whitelist text and options. Correct answers, explanations and editor HTML never enter the document.
  const questions=[...form.querySelectorAll('.exam-editor-card')].map((card,i)=>({text:String(form.elements['qtext'+i]?.value||'').trim(),options:[0,1,2,3].map(j=>String(form.elements['opt'+i+'_'+j]?.value||'').trim())}));
  const expected=level===5||examType==='quarterly'?20:40;
  if(questions.length!==expected||questions.some(q=>!q.text||q.options.some(option=>!option)))throw Error('กรุณากรอกคำถามและตัวเลือกให้ครบก่อนดาวน์โหลด');
  return {examType,typeLabel:labels[examType],section,focusSkill,quarter,level,setName,questions,written:level===5&&!['sub_regular','sub_permanent'].includes(examType)?writtenPrompts(focusSkill):[]};
 }
 const css=`
 @page{size:A4 portrait;margin:0}
 *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172b3a;font:15px/1.55 Tahoma,Arial,sans-serif}
 .paper-page{width:210mm;height:297mm;padding:12mm 14mm;display:flex;flex-direction:column;break-after:page;page-break-after:always;background:#fff;overflow:hidden}
 .paper-page:last-child{break-after:auto;page-break-after:auto}.paper-heading{flex-shrink:0;margin-bottom:5mm}.paper-company{font-size:10px;color:#425b70;letter-spacing:.2px}.paper-heading h1{font-size:22px;margin:5px 0 8px;color:#173f63}.paper-meta{font-size:12px;line-height:1.7;overflow-wrap:anywhere}.paper-person{font-size:13px;margin:12px 0 8px;line-height:2.2}.paper-guide{font-size:12px;border:1px solid #b7cadb;border-radius:3px;padding:7px 10px;margin:8px 0 0}.paper-compact{font-size:12px;line-height:1.7}.paper-heading.compact{margin-bottom:4mm}
 .paper-questions{flex:1;min-height:0}.paper-question{margin:0 0 4mm;break-inside:avoid;page-break-inside:avoid;overflow-wrap:anywhere}.paper-question h2{font-size:15px;line-height:1.55;font-weight:700;margin:0 0 5px}.paper-option{display:flex;gap:8px;align-items:baseline;margin:2px 0 2px 4mm}.paper-choice{flex-shrink:0;width:16px;height:16px;border:1px solid #52697b;display:inline-block;align-self:flex-start;margin-top:3px}.paper-option-text{min-width:0}.paper-written-title{font-size:17px;color:#173f63;margin:0 0 4mm}.paper-answer-line{height:8mm;border-bottom:1px dotted #8296a7}.paper-footer{flex-shrink:0;margin-top:4mm;padding-top:2mm;border-top:1px solid #c8d5df;display:flex;justify-content:space-between;gap:12px;font-size:10px;color:#52697b}.paper-total{font-size:11px;margin-top:5px}
 @media print{html,body{width:210mm}.paper-page{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
 `;
 const identity=data=>data.section+' · '+(data.examType==='quarterly'?data.quarter+' · ':'')+'Level '+data.level+' · ชุด '+data.setName;
 function heading(data,first){return first?'<header class="paper-heading"><div class="paper-company">JINRONG ELECTRONICS TECHNOLOGY (THAILAND) CO., LTD.</div><h1>แบบทดสอบพนักงาน</h1><div class="paper-meta"><b>'+esc(data.typeLabel)+'</b><br>'+esc(identity(data))+'<br>หัวข้อทักษะ: '+esc(data.focusSkill)+'</div><div class="paper-person">ชื่อ–นามสกุล ........................................................................ รหัสพนักงาน ................................<br>วันที่สอบ ..................................... กะ ................................ ผู้คุมสอบ .....................................</div><div class="paper-guide"><b>คำชี้แจง:</b> ทำเครื่องหมาย X ในช่องหน้าตัวเลือกที่ถูกที่สุดเพียงข้อเดียว ข้อละ 1 คะแนน<br>ข้อเลือกตอบ '+data.questions.length+' ข้อ'+(data.written.length?' และข้อเขียน '+data.written.length+' ข้อ':'')+' · เกณฑ์ผ่านข้อเลือกตอบ 80% ('+Math.ceil(data.questions.length*.8)+'/'+data.questions.length+' คะแนน)'+(data.written.length?'<br>ข้อเขียนประเมินแยกโดยผู้ตรวจ':'')+'</div></header>':'<header class="paper-heading compact"><div class="paper-compact"><b>แบบทดสอบพนักงาน · '+esc(data.typeLabel)+'</b><br>'+esc(identity(data))+'<br>ชื่อ / รหัสพนักงาน ..........................................................................................</div></header>'}
 function questionMarkup(q,i){return '<section class="paper-question" data-question-number="'+(i+1)+'"><h2>'+esc(i+1)+'. '+esc(q.text)+'</h2>'+q.options.map((option,j)=>'<div class="paper-option"><span class="paper-choice" aria-hidden="true"></span><span class="paper-option-text">'+String.fromCharCode(65+j)+'. '+esc(option)+'</span></div>').join('')+'</section>'}
 function writtenMarkup(prompt,i){return '<section class="paper-question paper-written" data-written-number="'+(i+1)+'">'+(!i?'<h3 class="paper-written-title">ส่วนที่ 2 · ข้อเขียน</h3>':'')+'<h2>'+esc(i+1)+'. '+esc(prompt)+'</h2>'+Array.from({length:4},()=>'<div class="paper-answer-line"></div>').join('')+'</section>'}
 function filename(data){return ('PPMS_Exam_'+data.section+'_'+data.examType+'_'+(data.examType==='quarterly'?data.quarter+'_':'')+'L'+data.level+'_'+data.setName).replace(/[^A-Za-z0-9ก-๙._-]+/g,'_')+'.pdf'}
 async function frame(data=read()){
  if(!allowed())throw Error('กรุณาเข้าสู่ระบบ Admin');
  const iframe=document.createElement('iframe');iframe.className='paper-exam-frame';iframe.title='ข้อสอบพนักงาน A4';iframe.style.cssText='position:fixed;left:-12000px;top:0;width:210mm;height:297mm;border:0;';document.body.append(iframe);
  const doc=iframe.contentDocument;doc.open();doc.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(filename(data).replace(/\.pdf$/,''))+'</title><style>'+css+'</style></head><body></body></html>');doc.close();
  try{
   await doc.fonts?.ready;
   let page,body;
   const nextPage=()=>{page=doc.createElement('article');page.className='paper-page';page.innerHTML=heading(data,!doc.querySelector('.paper-page'))+'<main class="paper-questions"></main><footer class="paper-footer"><span>ชุด '+esc(data.setName)+' · Level '+data.level+'</span><span data-page-number></span></footer>';doc.body.append(page);body=page.querySelector('.paper-questions')};
   nextPage();
   const append=markup=>{const holder=doc.createElement('div');holder.innerHTML=markup;const block=holder.firstElementChild;body.append(block);if(body.scrollHeight>body.clientHeight+1){block.remove();if(body.children.length){nextPage();body.append(block)}else{body.append(block);throw Error('คำถามยาวเกินหนึ่งหน้า A4 กรุณาย่อข้อความคำถามและตัวเลือกก่อนดาวน์โหลด')}if(body.scrollHeight>body.clientHeight+1)throw Error('คำถามยาวเกินหนึ่งหน้า A4 กรุณาย่อข้อความคำถามและตัวเลือกก่อนดาวน์โหลด')}};
   data.questions.forEach((q,i)=>append(questionMarkup(q,i)));
   if(data.written.length){nextPage();data.written.forEach((q,i)=>append(writtenMarkup(q,i)))}
   const pages=[...doc.querySelectorAll('.paper-page')];pages.forEach((p,i)=>p.querySelector('[data-page-number]').textContent='หน้า '+(i+1)+' / '+pages.length);
   await doc.fonts?.ready;await new Promise(resolve=>iframe.contentWindow.requestAnimationFrame(()=>iframe.contentWindow.requestAnimationFrame(resolve)));
   return iframe;
  }catch(error){iframe.remove();throw error}
 }
 function message(text){const node=document.querySelector('[data-paper-exam-status]');if(node)node.textContent=text}
 async function print(data){const iframe=await frame(data);const win=iframe.contentWindow;win.addEventListener('afterprint',()=>iframe.remove(),{once:true});win.focus();win.print();setTimeout(()=>iframe.remove(),60000)}
 async function exportPaper(kind){
  if(busy)return;busy=true;const buttons=[...document.querySelectorAll('[data-paper-exam-action]')];buttons.forEach(b=>b.disabled=true);let iframe;
  try{const data=read();message('กำลังจัดหน้าข้อสอบ…');
   if(kind==='print'){await print(data);message('เปิดหน้าพิมพ์ข้อสอบแล้ว เลือก Save as PDF เพื่อบันทึกไฟล์ได้');return}
   if(!window.html2canvas||!window.jspdf?.jsPDF){await print(data);message('เลือก Save as PDF ในหน้าพิมพ์เพื่อบันทึกไฟล์ข้อสอบ');return}
   iframe=await frame(data);const pages=[...iframe.contentDocument.querySelectorAll('.paper-page')],pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
   for(let i=0;i<pages.length;i++){message('กำลังสร้าง PDF หน้า '+(i+1)+' / '+pages.length+'…');const canvas=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#fff',logging:false});if(i)pdf.addPage('a4','portrait');pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',0,0,210,297)}
   pdf.save(filename(data));message('ดาวน์โหลดข้อสอบ '+data.questions.length+' ข้อ'+(data.written.length?' และข้อเขียน '+data.written.length+' ข้อ':'')+' · '+pages.length+' หน้า A4 แล้ว');
  }catch(error){message('สร้างข้อสอบไม่สำเร็จ: '+String(error.message||error))}
  finally{iframe?.remove();busy=false;buttons.forEach(b=>{if(b.isConnected)b.disabled=false})}
 }
 function mount(){
  if(!allowed())return;
  const plan=document.getElementById('examPlanSection');
  if(plan&&!document.querySelector('[data-paper-exam-open]')){const button=document.createElement('button');button.type='button';button.className='secondary';button.setAttribute('data-paper-exam-open','');button.textContent='เลือกชุด / ดาวน์โหลดข้อสอบ A4';plan.closest('.exam-plan-controls')?.append(button)}
  const form=document.getElementById('examBankForm');if(!form||document.querySelector('[data-paper-exam-toolbar]'))return;
  const panel=document.createElement('section');panel.className='panel no-print paper-exam-toolbar';panel.setAttribute('data-paper-exam-toolbar','');panel.setAttribute('data-i18n-ignore','');panel.style.cssText='margin:14px 0;padding:16px;border:1px solid #c4d7e8';
  panel.innerHTML='<h3 style="margin:0 0 6px">ดาวน์โหลดข้อสอบสำหรับพนักงาน</h3><p style="margin:0 0 12px;font-size:13px">ใช้ชุดและข้อความข้อสอบที่แสดงด้านล่าง พร้อมช่องชื่อ รหัสพนักงาน วันที่ และช่องทำคำตอบ จัดหน้า A4 อัตโนมัติ</p><div class="actions"><button type="button" data-paper-exam-action="pdf">ดาวน์โหลดข้อสอบ PDF (A4)</button><button type="button" class="secondary" data-paper-exam-action="print">พิมพ์ข้อสอบ / Save as PDF</button></div><p data-paper-exam-status role="status" aria-live="polite" style="margin:8px 0 0;font-size:12px;color:#375b77">ไฟล์แจกพนักงานแสดงเฉพาะคำถามและตัวเลือก • ผลจากข้อสอบกระดาษให้ผู้ตรวจประเมินแยก</p>';
  form.before(panel);
 }
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-paper-exam-open]')&&allowed()){const section=document.getElementById('examPlanSection')?.value;if(section){sessionStorage.setItem('examCheckSection',section);sessionStorage.removeItem('examCheckSkill')}document.querySelector('#nav [data-page="examCheck"]')?.click();return}const button=event.target.closest?.('[data-paper-exam-action]');if(button){event.preventDefault();void exportPaper(button.dataset.paperExamAction)}});
 const init=()=>{const root=document.getElementById('app');if(root){new MutationObserver(mount).observe(root,{childList:true});mount()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.PPMSPaperExam={read,frame,export:exportPaper,filename,writtenPrompts};
})();

