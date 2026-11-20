/* Printable signing sheet follows the user's supplied JRTL-FM-PD-001 Excel form. */
(()=>{
 'use strict';
 const TEMPLATE='templates/training-signature-template.xlsx';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const filename=value=>String(value??'').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'-').replace(/\s+/g,' ').trim();
 const nowParts=now=>{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',calendar:'gregory',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const value=type=>parts.find(part=>part.type===type)?.value||'';
  return {date:value('day')+'/'+value('month')+'/'+value('year'),time:value('hour')+':'+value('minute'),iso:value('year')+'-'+value('month')+'-'+value('day')};
 };
 function wrapLines(value,max=80){
  const output=[];
  for(const paragraph of String(value||'').replace(/\r/g,'').split('\n')){
   let chars=Array.from(paragraph.trim());if(!chars.length)continue;
   while(chars.length>max){let cut=max;for(let i=max;i>max*.65;i--)if(/\s/.test(chars[i])){cut=i;break;}output.push(chars.slice(0,cut).join('').trim());chars=chars.slice(cut);}
   if(chars.length)output.push(chars.join('').trim());
  }
  return output;
 }
 function model(input,record={},now=new Date()){
  if(!input?.item?.title||!input.ctx?.section)throw Error('ไม่พบหัวข้อหรือ Section ที่ต้องการพิมพ์');
  const stamp=nowParts(now);
  return {topic:input.item.title,detail:input.item.detail&&input.item.detail!==input.item.title?input.item.detail:'',section:input.ctx.section,quarter:input.q||'',year:input.ctx.year||'',date:stamp.date,printTime:stamp.time,dateISO:stamp.iso,
   trainingTime:record.trainingTime||'',place:record.trainingPlace||'',trainer:record.trainer||input.quarter?.trainer||'',unit:record.trainingUnit||'JRTL / '+input.ctx.section,planned:record.planned==='no'?'no':'yes',effect:record.effect||''};
 }
 const PRINT_CSS=`@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Calibri,Tahoma,Arial,sans-serif}.ts-sheet{width:194mm;min-height:274mm;margin:0 auto;break-after:page;page-break-after:always}.ts-sheet:last-child{break-after:auto;page-break-after:auto}.ts-sheet h1{height:14mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:17pt;line-height:1.25;margin:0;font-weight:700;letter-spacing:-.25pt}.ts-grid{width:100%;border-collapse:collapse;table-layout:fixed;border:1.5pt solid #000;font-size:10.5pt;line-height:1.35}.ts-grid td{border:.6pt solid #000;padding:1.2mm 1.6mm;vertical-align:middle;overflow-wrap:anywhere;white-space:pre-wrap}.ts-label{text-align:center}.ts-program{height:10.2mm}.ts-program-value{font-weight:700;font-size:11pt}.ts-details-row{height:10.15mm}.ts-details-row td{padding:.7mm 1.6mm;font-size:9.5pt;line-height:1.25}.ts-number{text-align:center}.ts-information{height:15.2mm}.ts-unit{font-size:11pt;text-align:center}.ts-signatures{height:61mm;vertical-align:top!important;padding:3mm 1.5mm!important}.ts-signatures p{margin:0;font-size:11pt}.ts-planned{height:15.2mm;padding-left:3mm!important;font-family:'Times New Roman',Tahoma,serif}.ts-choice{display:inline-flex;gap:2.5mm;align-items:center;margin-left:10mm;white-space:nowrap}.ts-checkbox{display:inline-block;vertical-align:middle;width:3.4mm;height:3.4mm;border:.6pt solid #000;font:10pt/3mm Arial;text-align:center}.ts-effect{height:35.5mm;vertical-align:top!important;padding:3mm 1.5mm!important}.ts-effect b{font-weight:400}.ts-effect p{font-size:10pt;line-height:1.45;margin:2.5mm 0 0;white-space:pre-wrap}.ts-footer{display:flex;justify-content:space-between;gap:3mm;font-size:8pt;line-height:1.4;margin-top:2mm}.ts-footer span{overflow-wrap:anywhere}.ts-footer b{font-weight:400;white-space:nowrap}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
 function sheetsHtml(data){
  const details=wrapLines(data.detail),effects=wrapLines(data.effect,50),count=Math.max(1,Math.ceil(details.length/10),Math.ceil(effects.length/4));
  return Array.from({length:count},(_,page)=>{
   const rows=details.slice(page*10,page*10+10),effect=effects.slice(page*4,page*4+4).join('\n');
   return '<section class="ts-sheet" data-signature-page="'+(page+1)+'"><h1>Training implementation effect record sheet.</h1><table class="ts-grid"><colgroup>'+[9.37,9.37,8.02,9.37,9.37,9.37,9.75,16.66,9.75,9.37].map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup><tbody><tr class="ts-program"><td colspan="2" class="ts-label">Training program</td><td colspan="8" class="ts-program-value" data-form-topic>'+esc(data.topic)+'</td></tr>'+Array.from({length:10},(_,i)=>'<tr class="ts-details-row">'+(i===0?'<td colspan="2" rowspan="10"></td>':'')+'<td class="ts-number">'+(rows[i]?page*10+i+1:'')+'</td><td colspan="7" data-form-detail>'+esc(rows[i]||'')+'</td></tr>').join('')+
    '<tr class="ts-information"><td colspan="2" class="ts-label">Training Date (date, hour)</td><td colspan="3" class="ts-label" data-form-date>'+esc(data.date)+(data.trainingTime?'\n'+esc(data.trainingTime):'')+'</td><td colspan="2" class="ts-label">Training place</td><td colspan="3">'+esc(data.place)+'</td></tr>'+
    '<tr class="ts-information"><td colspan="2" class="ts-label">Training and implementation unit</td><td colspan="3" class="ts-unit">'+esc(data.unit)+'</td><td colspan="2" class="ts-label">Trainer</td><td colspan="3">'+esc(data.trainer)+'</td></tr>'+
    '<tr><td colspan="10" class="ts-signatures" data-signature-space><p>Signature :</p></td></tr><tr><td colspan="10" class="ts-planned">Planned training?：<span class="ts-choice"><span class="ts-checkbox">'+(data.planned==='yes'?'✓':'')+'</span> Yes</span><span class="ts-choice"><span class="ts-checkbox">'+(data.planned==='no'?'✓':'')+'</span> No, But recorded</span></td></tr><tr><td colspan="10" class="ts-effect"><b>Training implementation effect:</b><p>'+esc(effect)+'</p></td></tr></tbody></table><footer class="ts-footer"><span>'+esc(data.section)+' · '+esc(data.quarter)+' / '+esc(data.year)+' · วันที่พิมพ์ '+esc(data.date)+' '+esc(data.printTime)+(count>1?' · '+(page+1)+' / '+count:'')+'</span><b>JRTL-FM-PD-001</b></footer></section>';
  }).join('');
 }
 const printName=data=>['ใบลงชื่ออบรม',data.topic,data.section,data.quarter,data.dateISO].map(filename).filter(Boolean).join('_');
 function printMarkup(data){return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(printName(data))+'</title><style>'+PRINT_CSS+'</style></head><body>'+sheetsHtml(data)+'</body></html>';}
 let active=null;
 function open(input,trigger=document.activeElement){
  if(active&&active.close()===false)return active;
  const record=input.record||{},base=model(input,record),overlay=document.createElement('div');overlay.className='training-signature-overlay';overlay.setAttribute('data-i18n-ignore','');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','tsDialogTitle');
  overlay.innerHTML='<section class="ts-shell"><header><div><h2 id="tsDialogTitle">ใบลงชื่ออบรม</h2><p>'+esc(base.topic)+' · '+esc(base.section)+' · '+esc(base.quarter)+' / '+esc(base.year)+'</p></div><button type="button" data-ts-close>ปิด</button></header><div class="ts-actions"><button type="button" data-ts-print>พิมพ์ / บันทึก PDF</button><a href="'+TEMPLATE+'" download="เทรนนิ่ง.xlsx">ดาวน์โหลดต้นฉบับ Excel</a><span data-ts-status role="status">เติมวันที่พิมพ์ให้อัตโนมัติ · เว้นพื้นที่ให้พนักงานเซ็นชื่อ</span></div><form class="ts-controls"><label>เวลาอบรม<input name="trainingTime" maxlength="100" value="'+esc(base.trainingTime)+'" placeholder="เช่น 09:00–10:00"></label><label>สถานที่อบรม<input name="place" maxlength="180" value="'+esc(base.place)+'"></label><label>ผู้ฝึกอบรม<input name="trainer" maxlength="180" value="'+esc(base.trainer)+'"></label><label>หน่วยงานที่อบรม<input name="unit" maxlength="180" value="'+esc(base.unit)+'"></label></form><div class="ts-preview" tabindex="0" aria-label="ตัวอย่างใบลงชื่อ"><style>'+PRINT_CSS.replace(/html,body/g,'.ts-preview')+'</style><div data-ts-pages>'+sheetsHtml(base)+'</div></div></section>';
  let printing=false,frame=null,cleanupPrint=null;
  const status=overlay.querySelector('[data-ts-status]'),button=overlay.querySelector('[data-ts-print]'),form=overlay.querySelector('form'),pages=overlay.querySelector('[data-ts-pages]');
  function values(){const data=model(input,record);for(const field of ['trainingTime','place','trainer','unit'])data[field]=form.elements[field].value;return data;}
  form.onsubmit=event=>event.preventDefault();form.oninput=()=>{pages.innerHTML=sheetsHtml(values());};
  async function print(){
   if(printing)return;printing=true;button.disabled=true;
   const data=values(),title=printName(data),originalTitle=document.title,root=document.documentElement,prior=root.getAttribute('data-ppms-print-title');
   pages.innerHTML=sheetsHtml(data);
   frame=document.createElement('iframe');frame.title=title;frame.className='ts-print-frame';frame.style.cssText='position:fixed;left:-15000px;top:0;width:210mm;height:297mm;border:0';
   let printWindow=null,done=false;
   const cleanup=()=>{if(done)return;done=true;window.removeEventListener('afterprint',cleanup);printWindow?.removeEventListener('afterprint',cleanup);if(root.getAttribute('data-ppms-print-title')===title){if(prior===null)root.removeAttribute('data-ppms-print-title');else root.setAttribute('data-ppms-print-title',prior);document.title=originalTitle;}frame?.remove();frame=null;printing=false;button.disabled=false;cleanupPrint=null;};
   cleanupPrint=cleanup;
   try{
    document.body.append(frame);printWindow=frame.contentWindow;const doc=frame.contentDocument;doc.open();doc.write(printMarkup(data));doc.close();await doc.fonts?.ready;await new Promise(resolve=>printWindow.requestAnimationFrame(resolve));
    root.setAttribute('data-ppms-print-title',title);document.title=title;window.addEventListener('afterprint',cleanup);printWindow.addEventListener('afterprint',cleanup);printWindow.focus();printWindow.print();status.textContent='วันที่พิมพ์ '+data.date+' '+data.printTime+' · เลือก Save as PDF เพื่อบันทึก '+title+'.pdf';
   }catch(error){cleanup();status.textContent='เปิดหน้าพิมพ์ไม่สำเร็จ: '+error.message;}
  }
  function close(){if(printing){status.textContent='กรุณาปิดหน้าพิมพ์ก่อนปิดใบลงชื่อ';return false;}cleanupPrint?.();overlay.remove();document.removeEventListener('keydown',keyboard,true);if(trigger?.isConnected)trigger.focus();if(active?.overlay===overlay)active=null;return true;}
  function keyboard(event){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}if(event.key==='Tab'){const fields=[...overlay.querySelectorAll('button:not([disabled]),a[href],input,.ts-preview')],first=fields[0],last=fields.at(-1);if(!overlay.contains(document.activeElement)){event.preventDefault();first.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
  button.onclick=()=>void print();overlay.querySelector('[data-ts-close]').onclick=close;overlay.onclick=event=>{if(event.target===overlay)close();};document.body.append(overlay);document.addEventListener('keydown',keyboard,true);active={overlay,close};overlay.querySelector('[data-ts-close]').focus();return active;
 }
 window.PPMSTrainingSignatureForm={open,model,printMarkup,sheetsHtml,template:TEMPLATE,close:()=>active?.close()};
})();
