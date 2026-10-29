/* One document model for the current Section's screen, print, PDF and editable XLSX. */
(()=>{
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors=['F1F3F5','D9EDFF','D9F7E9','FFF0C7'],ink=['495057','0B5793','14784B','9A6500'];
 const descriptions=['เริ่มเรียนรู้ ต้องมีผู้ควบคุมใกล้ชิด','ทำงานพื้นฐานได้ ยังต้องมีคำแนะนำ','ทำงานได้เองตามมาตรฐาน','ชำนาญ แก้ปัญหาและฝึกสอนได้ (สูงสุด)'];
 const examNote='การสอบปรับระดับ: ผ่านตั้งแต่ 80% จึงปรับขึ้นทีละ 1 ระดับ เฉพาะหัวข้อที่สอบ สูงสุด Level 4 (ครั้งละไม่เกิน 3 หัวข้อระดับต่ำสุด)';
 let busy=false,loading;
 const status=message=>{let node=document.getElementById('matrixDocumentStatus');if(!node){node=document.createElement('p');node.id='matrixDocumentStatus';node.className='no-print';node.setAttribute('role','status');document.querySelector('.matrix-filter')?.append(node)}if(node)node.textContent=message};
 function options(size,orientation){size=['A4','A3'].includes(size)?size:'A4';orientation=orientation==='portrait'?'portrait':'landscape';const paper=size==='A3'?[297,420]:[210,297];return {size,orientation,w:paper[orientation==='portrait'?0:1],h:paper[orientation==='portrait'?1:0]}}
 function ranges(n){return [n,Math.ceil(n*1.5),Math.ceil(n*2.5),Math.ceil(n*3.5)].map((min,i,a)=>({level:i+1,min,max:i===3?4*n:a[i+1]-1}))}
 function rank(score,n){return score/n>=3.5?4:score/n>=2.5?3:score/n>=1.5?2:1}
 function snapshot(){
  const ctx=window.PPMS_RUNTIME?.monthReportContext?.();if(!ctx?.allowed)throw Error('กรุณาเข้าสู่ระบบก่อนดาวน์โหลด');
  const report=document.querySelector('#app .matrix-report'),table=report?.querySelector('.skill-matrix-table');if(!table)throw Error('กรุณาเปิดหน้า Skill Matrix ก่อน');
  const heads=[...table.tHead.rows].filter(r=>r.cells.length>1).at(-1);if(!heads)throw Error('ไม่พบหัวตารางทักษะ');
  const skills=[...heads.cells].slice(4,-2).map(c=>c.textContent.trim()),people=new Map(ctx.employees.map(e=>[String(e.id),e]));
  const rows=[...table.tBodies[0].rows].filter(r=>r.cells.length===skills.length+6).map((r,i)=>{
   const cells=[...r.cells],id=cells[2].textContent.trim(),person=people.get(id);if(!person)throw Error('รายชื่อพนักงานเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่');
   const levels=cells.slice(4,-2).map(c=>Number(c.textContent.trim()));if(levels.some(n=>!Number.isInteger(n)||n<1||n>4))throw Error('ระดับสกิลไม่ถูกต้อง: '+id);
   const score=levels.reduce((a,b)=>a+b,0),image=cells[1].querySelector('img');
   return {no:i+1,id,name:cells[3].querySelector('b')?.textContent.trim()||person.name||'',position:cells[3].querySelector('small:not(.skill-updated):not(.cert-matrix-summary)')?.textContent.trim()||person.position||'',updated:cells[3].querySelector('.skill-updated')?.getAttribute('data-skill-updated-date')||cells[3].querySelector('.skill-updated')?.textContent.replace(/^Update:\s*/,'').trim()||'',levels,score,level:rank(score,skills.length),photo:image?.currentSrc||image?.src||'',person:{...person},courseSummary:window.PPMSCertificates?.names(person)||'',failed:false};
  });
  const section=document.getElementById('matrixSection')?.value||'',groupValue=document.getElementById('matrixSortingGroup')?.value||'',group=groupValue==='__UNASSIGNED__'?'ยังไม่ระบุ Sorting 1 / 2':groupValue;
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return {section,group,title:section+(group?' · '+group:''),skills,rows,date,documentNo:'JR-HR-SM-001',revision:'00',logo:document.querySelector('header .logo img')?.src||'',ranges:ranges(skills.length)};
 }
 function paginate(rows,opt){
  const capacity=Math.max(1,Math.floor((opt.h-12-76)/13)),count=Math.max(1,Math.ceil(rows.length/capacity)),pages=[];
  let cursor=0;for(let p=0;p<count;p++){const length=Math.ceil((rows.length-cursor)/(count-p));pages.push(rows.slice(cursor,cursor+length));cursor+=length}return pages;
 }
 function weights(model){return [.65,1.05,1.25,3.4,...model.skills.map(()=>1),.9,1.15]}
 function columns(model){const values=weights(model),sum=values.reduce((a,b)=>a+b,0);return '<colgroup>'+values.map(w=>'<col style="width:'+(w*100/sum)+'%">').join('')+'</colgroup>'}
 function photo(row){return row.photo?'<img src="'+esc(row.photo)+'" alt="'+esc(row.name)+'" decoding="sync">':'<span class="matrix-doc-initials">'+esc(row.failed?'รูปโหลดไม่ได้':row.name.split(/\s+/).map(s=>s[0]||'').slice(0,2).join(''))+'</span>'}
 function pageHTML(model,rows,index,total){
  const title='<header class="matrix-doc-header">'+(model.logo?'<img src="'+esc(model.logo)+'" alt="JR">':'<strong>JR</strong>')+'<div><small>JINRONG ELECTRONICS TECHNOLOGY (THAILAND) CO., LTD.</small><h2>SECTION SKILL MATRIX</h2><p>'+esc(model.title)+'</p></div><aside>Document No. '+esc(model.documentNo)+'<br>Revision '+esc(model.revision)+'<br>Effective Date '+esc(model.date)+'</aside></header>';
  const head=['No.','Photo','Emp.ID','Employee / Position',...model.skills,'Score','Level'];
  const table='<table class="matrix-doc-table">'+columns(model)+'<thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr data-matrix-doc-employee="'+esc(r.id)+'"><td>'+r.no+'</td><td class="matrix-doc-photo">'+photo(r)+'</td><td class="matrix-doc-id">'+esc(r.id)+'</td><td class="matrix-doc-name"><b>'+esc(r.name)+'</b><span>'+esc(r.position)+'</span><small class="matrix-doc-update"><span class="skill-update-date">Update: '+esc(r.updated||'—')+'</span>'+(r.courseSummary?' <span class="cert-matrix-summary" title="'+esc(r.courseSummary)+'"><span>·</span>'+window.PPMSCertificates.previewMarkup(r.person)+'</span>':'')+'</small>'+'</td>'+r.levels.map((v,i)=>'<td><button type="button" data-skill-edit="'+esc(r.id)+'" data-skill-name="'+esc(model.skills[i])+'" class="matrix-doc-level level-'+v+'">'+v+'</button></td>').join('')+'<td><b>'+r.score+'</b></td><td><b class="matrix-doc-rank level-'+r.level+'">Level '+r.level+'</b></td></tr>').join('')+(rows.length?'':'<tr><td colspan="'+head.length+'">ไม่มีข้อมูลพนักงานตามตัวกรองนี้</td></tr>')+'</tbody></table>';
  const criteria='<section class="matrix-doc-footer"><div class="matrix-doc-criteria">'+model.ranges.map(r=>'<div class="level-'+r.level+'"><b>Level '+r.level+' · '+r.min+'–'+r.max+' คะแนน</b><span>'+descriptions[r.level-1]+'</span><small>'+ (r.level===1?'เริ่มต้น / Baseline':'สอบปรับเป็น Level '+r.level+' ผ่าน ≥80%')+'</small></div>').join('')+'</div><p class="matrix-doc-note">'+esc(examNote)+'<br>'+model.skills.length+' หัวข้อ · คะแนนรวมเต็ม '+model.skills.length*4+' · คะแนนรวมเป็นผลรวมระดับทักษะ ไม่ใช่เปอร์เซ็นต์คะแนนสอบ</p><div class="matrix-doc-signatures">'+['Prepared by / ผู้จัดทำ','Checked by / ผู้ตรวจสอบ','Approved by / ผู้อนุมัติ'].map(s=>'<div><b>'+s+'</b><span></span><small>Signature / Date</small></div>').join('')+'</div><p class="matrix-doc-number">'+esc(model.title)+' · '+model.rows.length+' คน <span>Page '+index+' / '+total+'</span></p></section>';
  return title+table+criteria;
 }
 async function loadScript(src,key){if(window[key])return;await new Promise((resolve,reject)=>{const s=document.createElement('script'),timer=setTimeout(()=>reject(Error('โหลดระบบส่งออกไม่สำเร็จ')),20000);s.src=src;s.onload=()=>{clearTimeout(timer);window[key]?resolve():reject(Error('โหลดระบบส่งออกไม่ครบ'))};s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('โหลดระบบส่งออกไม่ได้'))};document.head.append(s)})}
 async function excelDependency(){if(!loading)loading=loadScript('vendor/exceljs-4.4.0.min.js','ExcelJS').catch(e=>{loading=null;throw e});return loading}
 async function preparePhotos(model){
  let cursor=0,done=0;await Promise.all(Array.from({length:Math.min(4,model.rows.length)},async()=>{while(cursor<model.rows.length){const row=model.rows[cursor++];let result;
   try{result=await window.PPMSOrganizationExcel.portrait({...row.person,photoUrl:row.photo||row.person.photoUrl})}catch{result={failed:!!row.photo}}
   row.photo=result?.data||'';row.failed=!!result?.failed;status('กำลังเตรียมรูปพนักงาน '+(++done)+' / '+model.rows.length);
  }}));return model;
 }
 function makePages(model,opt){
  const groups=model.pages||paginate(model.rows,opt),courses=window.PPMSCertificates?.matrixPages(model.rows.map(r=>r.person),model.title)||[],total=groups.length+courses.length;
  const page=(content,i)=>'<section class="matrix-document-page" style="width:'+(opt.w-12)+'mm;min-height:'+(opt.h-12)+'mm" data-page="'+(i+1)+'">'+content+'</section>';
  return groups.map((rows,i)=>page(pageHTML(model,rows,i+1,total),i)).join('')+courses.map((content,i)=>page(content+'<p class="matrix-doc-number">Page '+(groups.length+i+1)+' / '+total+'</p>',groups.length+i)).join('');
 }
 async function resolvePages(model,opt){
  const holder=document.createElement('div');holder.className='matrix-document-render';holder.style.cssText='position:absolute;left:-15000px;top:0';document.body.append(holder);
  try{let count=paginate(model.rows,opt).length;
   while(true){let cursor=0;model.pages=Array.from({length:count},(_,i)=>{const n=Math.ceil((model.rows.length-cursor)/(count-i)),chunk=model.rows.slice(cursor,cursor+n);cursor+=n;return chunk});holder.innerHTML=makePages(model,opt);await document.fonts?.ready;
    await Promise.all([...holder.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})||Promise.resolve()));
    if([...holder.children].every(page=>page.getBoundingClientRect().height*25.4/96<=opt.h-11.7))return;
    if(count>=Math.max(1,model.rows.length))throw Error('ข้อความในแถวหนึ่งยาวเกินหน้ากระดาษ กรุณาเลือก A3');count++;
   }
  }finally{holder.remove()}
 }
 async function printFrame(model,opt){
  const frame=document.createElement('iframe');frame.title='Section Skill Matrix';frame.style.cssText='position:fixed;left:-15000px;top:0;width:1200px;height:900px;border:0';document.body.append(frame);
  const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>Skill Matrix '+esc(model.title)+'</title><link rel="stylesheet" href="'+new URL('matrix-layout-v924.css?v=937',location.href).href+'"><link rel="stylesheet" href="'+new URL('training-certificates-v936.css?v=942',location.href).href+'"><style>@page{size:'+opt.size+' '+opt.orientation+';margin:6mm}body{margin:0}.matrix-document-page{margin:0!important;box-shadow:none!important;border:0!important;break-after:page}.matrix-document-page:last-child{break-after:auto}</style></head><body>'+makePages(model,opt)+'</body></html>');doc.close();
  await Promise.race([new Promise(resolve=>{if(doc.readyState==='complete')resolve();else frame.onload=resolve}),new Promise(resolve=>setTimeout(resolve,5000))]);
  await doc.fonts?.ready;await Promise.all([...doc.images].map(img=>img.decode?.().catch(()=>{})||Promise.resolve()));return frame;
 }
 function save(buffer,name,type){const url=URL.createObjectURL(new Blob([buffer],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
 function safeName(model){return (model.title||'Section').replace(/[^A-Za-z0-9ก-๙_-]+/g,'_')}
 async function workbook(model,opt){
  await excelDependency();const book=new ExcelJS.Workbook();book.creator='Jinrong';book.created=new Date();
  const sheet=book.addWorksheet('Skill Matrix',{views:[{showGridLines:false,zoomScale:85}],pageSetup:{paperSize:opt.size==='A3'?8:9,orientation:opt.orientation,fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.24,right:.24,top:.24,bottom:.24,header:0,footer:0}}});
  const values=weights(model),sum=values.reduce((a,b)=>a+b,0),last=values.length,scoreCol=last-1;
  values.forEach((w,i)=>sheet.getColumn(i+1).width=w/sum*148);
  const line={style:'thin',color:{argb:'FFD3E1EF'}},groups=model.pages||paginate(model.rows,opt);let row=1;
  const fmt=(cell,{fill='FFFFFF',color='173C63',bold=false,size=9,align='center'}={})=>{cell.font={name:'Tahoma',size,bold,color:{argb:'FF'+color}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+fill}};cell.alignment={horizontal:align,vertical:'middle',wrapText:true};cell.border={top:line,bottom:line,left:line,right:line}};
  const merge=(r,c,endR,endC,text,style)=>{sheet.mergeCells(r,c,endR,endC);const cell=sheet.getCell(r,c);cell.value=text;fmt(cell,style);return cell};
  const imageCache=new Map();function addImage(data,col,r,width=36,height=36){if(!data?.startsWith('data:image/'))return;let id=imageCache.get(data);if(id===undefined){id=book.addImage({base64:data,extension:data.startsWith('data:image/jpeg')?'jpeg':'png'});imageCache.set(data,id)}sheet.addImage(id,{tl:{col:col-1+.12,row:r-1+.1},ext:{width,height},editAs:'oneCell'})}
  groups.forEach((staff,page)=>{
   if(page)sheet.getRow(row-1).addPageBreak();const start=row;
   merge(row,1,row+1,2,model.logo?'':'JR',{fill:'194E82',color:'FFFFFF',bold:true,size:15});addImage(model.logo,1,row,44,44);
   merge(row,3,row+1,last-3,'JINRONG ELECTRONICS TECHNOLOGY (THAILAND) CO., LTD.\nSECTION SKILL MATRIX\n'+model.title,{fill:'194E82',color:'FFFFFF',bold:true,size:11,align:'left'});
   merge(row,last-2,row+1,last,'Document No. '+model.documentNo+'\nRevision '+model.revision+'\nEffective Date '+model.date,{fill:'194E82',color:'FFFFFF',size:8,align:'left'});
   sheet.getRow(row).height=24;sheet.getRow(row+1).height=24;row+=2;
   ['No.','Photo','Emp.ID','Employee / Position',...model.skills,'Score','Level'].forEach((h,i)=>{const c=sheet.getCell(row,i+1);c.value=h;fmt(c,{fill:'DAE9F7',bold:true,size:8})});sheet.getRow(row++).height=29;
   const rowHeight=Math.min(36,((opt.h-12)*72/25.4-220)/Math.max(1,...groups.map(g=>g.length)));
   staff.forEach(person=>{
    const data=[person.no,person.photo?'':person.failed?'รูปโหลดไม่ได้':'ไม่มีรูป',String(person.id),person.name+'\n'+person.position+'\nUpdate: '+(person.updated||'—'),...person.levels,person.score,'Level '+person.level];
    data.forEach((value,i)=>{const c=sheet.getCell(row,i+1);c.value=value;fmt(c,{align:i===3?'left':'center',bold:i===3||i===last-2,size:i===3?8:9});if(i===2)c.numFmt='@';if(i>=4&&i<last-2){fmt(c,{fill:colors[value-1],color:ink[value-1],bold:true})}});
    sheet.getRow(row).height=rowHeight;const nameCell=sheet.getCell(row,4);nameCell.value={richText:[{font:{name:'Tahoma',size:8,bold:true},text:person.name+'\n'},{font:{name:'Tahoma',size:6.5},text:person.position+'\n'},{font:{name:'Tahoma',size:6},text:'Update: '+(person.updated||'—')+(person.courseSummary?' · '+person.courseSummary:'')}]};addImage(person.photo,2,row,32,32);
    const score=sheet.getCell(row,scoreCol),level=sheet.getCell(row,last);score.value={formula:'SUM(E'+row+':'+sheet.getColumn(scoreCol-1).letter+row+')',result:person.score};
    fmt(level,{fill:colors[person.level-1],color:ink[person.level-1],bold:true});const ref=score.address;level.value={formula:'IF('+ref+'>='+model.ranges[3].min+',"Level 4",IF('+ref+'>='+model.ranges[2].min+',"Level 3",IF('+ref+'>='+model.ranges[1].min+',"Level 2","Level 1")))',result:'Level '+person.level};
    // Native conditional formatting follows edits to the numeric skill cells.
    const skillStart='E'+row,skillEnd=sheet.getColumn(scoreCol-1).letter+row;
    sheet.addConditionalFormatting({ref:skillStart+':'+skillEnd,rules:[1,2,3,4].map(n=>({type:'cellIs',operator:'equal',formulae:[String(n)],style:{fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF'+colors[n-1]}},font:{bold:true,color:{argb:'FF'+ink[n-1]}}}}))});
    sheet.addConditionalFormatting({ref:level.address,rules:[1,2,3,4].map(n=>({type:'expression',formulae:[level.address+'="Level '+n+'"'],style:{fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF'+colors[n-1]}},font:{bold:true,color:{argb:'FF'+ink[n-1]}}}}))});row++;
   });
   for(let n=0;n<4;n++){const c=Math.floor(n*last/4)+1,end=Math.floor((n+1)*last/4),r=model.ranges[n];merge(row,c,row+1,end,'Level '+(n+1)+' · '+r.min+'–'+r.max+' คะแนน\n'+descriptions[n]+'\n'+(n?'สอบปรับระดับ ผ่าน ≥80%':'เริ่มต้น / Baseline'),{fill:colors[n],color:ink[n],bold:true,size:8})}
   sheet.getRow(row).height=22;sheet.getRow(row+1).height=22;row+=2;
   merge(row,1,row+1,last,examNote+'\n'+model.skills.length+' หัวข้อ · คะแนนเต็ม '+model.skills.length*4+' · คะแนนรวมเป็นผลรวมระดับทักษะ ไม่ใช่เปอร์เซ็นต์คะแนนสอบ',{fill:'F4F8FC',size:8,align:'left'});sheet.getRow(row).height=14;sheet.getRow(row+1).height=14;row+=2;
   ['Prepared by / ผู้จัดทำ','Checked by / ผู้ตรวจสอบ','Approved by / ผู้อนุมัติ'].forEach((text,n)=>merge(row,Math.floor(n*last/3)+1,row+1,Math.floor((n+1)*last/3),text+'\n\nSignature / Date ......................................',{bold:true,size:8}));sheet.getRow(row).height=20;sheet.getRow(row+1).height=20;row+=2;
   merge(row,1,row,last,model.title+' · '+model.rows.length+' คน     Page '+(page+1)+' / '+groups.length,{size:8,align:'right'});sheet.getRow(row++).height=14;
   if(start===1)sheet.views=[{showGridLines:false,state:'frozen',ySplit:3,zoomScale:85}];
  });
  sheet.pageSetup.printArea='A1:'+sheet.getColumn(last).letter+(row-1);
  const courses=window.PPMSCertificates?.matrixModel(model.rows.map(r=>r.person));
  if(courses?.courses.length){
   const training=book.addWorksheet('Training Certificates',{views:[{state:'frozen',ySplit:1,xSplit:2,showGridLines:false}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:1'}});
   training.addRow(['Emp.ID','Employee / Position',...courses.courses.map(c=>c.name)]);training.getColumn(1).width=18;training.getColumn(2).width=35;courses.courses.forEach((c,i)=>training.getColumn(i+3).width=28);
   courses.rows.forEach(({employee,entries})=>{const row=training.addRow([String(employee.id),employee.name+'\n'+employee.position,...courses.courses.map(c=>{const r=entries.get(c.key);return r?window.PPMSCertificates.label(r)+(r.date?'\n'+r.date:'')+(r.expiryDate?'\nExp. '+r.expiryDate:''):'—'})]);row.height=48;row.eachCell(cell=>fmt(cell,{align:cell.col===2?'left':'center',size:9}));row.getCell(1).numFmt='@'});
   training.getRow(1).height=44;training.getRow(1).eachCell(cell=>fmt(cell,{fill:'DAE9F7',bold:true,size:9}));training.autoFilter={from:{row:1,column:1},to:{row:training.rowCount,column:courses.courses.length+2}};
  }
  book.calcProperties.fullCalcOnLoad=true;return book;
 }
 // Print-resolution output is independent of the monitor's device pixel ratio.
 const PDF_DPI=300;
 function captureOptions(page){
  const bounds=page.getBoundingClientRect();
  return {scale:PDF_DPI/96,backgroundColor:'#ffffff',useCORS:true,logging:false,
   width:Math.ceil(bounds.width),height:Math.ceil(bounds.height),scrollX:0,scrollY:0,
   onclone(doc){doc.querySelectorAll('.matrix-doc-header,.matrix-doc-table th').forEach(node=>{node.style.setProperty('position','static','important');node.style.setProperty('top','auto','important')})}};
 }
 async function addPdfPage(pdf,page,opt,addPage=false){
  let canvas;
  try{
   canvas=await window.html2canvas(page,captureOptions(page));
   const imageH=canvas.height*(opt.w-12)/canvas.width;
   if(imageH>opt.h-11)throw Error('เนื้อหาบางแถวยาวเกินหน้า กรุณาเลือก A3');
   if(addPage)pdf.addPage(opt.size.toLowerCase(),opt.orientation);
   // PNG keeps small Thai text and table lines free of JPEG compression artifacts.
   pdf.addImage(canvas.toDataURL('image/png'),'PNG',6,6,opt.w-12,imageH,undefined,'FAST');
  }finally{if(canvas)canvas.width=canvas.height=1}
 }
 async function run(kind,opt){
  if(busy)return;busy=true;let frame,holder;
  try{
   status('กำลังจัดหน้ารายงาน…');const model=await preparePhotos(snapshot());await resolvePages(model,opt);
   if(kind==='excel'){const book=await workbook(model,opt);save(await book.xlsx.writeBuffer(),'Skill_Matrix_'+safeName(model)+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
   else if(kind==='pdf'){
    if(!window.html2canvas||!window.jspdf)throw Error('โหลดระบบ PDF ไม่สำเร็จ กรุณาลองใหม่');
    holder=document.createElement('div');holder.className='matrix-document-render';holder.style.cssText='position:absolute;left:-15000px;top:0';holder.innerHTML=makePages(model,opt);document.body.append(holder);await document.fonts?.ready;
    await Promise.all([...holder.querySelectorAll('img')].map(i=>i.decode?.().catch(()=>{})||Promise.resolve()));
    const pdf=new window.jspdf.jsPDF({unit:'mm',format:opt.size.toLowerCase(),orientation:opt.orientation,compress:true});let i=0;
    for(const page of holder.children)await addPdfPage(pdf,page,opt,i++>0);
    pdf.save('Skill_Matrix_'+safeName(model)+'_'+opt.size+'.pdf');
   }else{frame=await printFrame(model,opt);frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();setTimeout(()=>frame?.remove(),60000)}
   const failed=model.rows.filter(r=>r.failed).length;status((kind==='print'?'เปิดหน้าพิมพ์แล้ว':'ดาวน์โหลด '+(kind==='excel'?'Excel (.xlsx)':'PDF')+' แล้ว')+(failed?' · รูปโหลดไม่ได้ '+failed+' คน (ระบุไว้ในรายงาน)':''));
  }catch(error){frame?.remove();status('ส่งออกไม่สำเร็จ: '+error.message);console.error(error)}finally{holder?.remove();busy=false}
 }
 function mount(){
  const report=document.querySelector('#app .matrix-report');if(!report)return;report.classList.add('matrix-document-screen');
  const table=report.querySelector('.skill-matrix-table');if(!table||table.querySelector('colgroup[data-matrix-columns]'))return;
  let model;try{model=snapshot()}catch{return}
  const group=document.createElement('colgroup');group.dataset.matrixColumns='1';const w=weights(model),sum=w.reduce((a,b)=>a+b,0);w.forEach(n=>{const c=document.createElement('col');c.style.width=n*100/sum+'%';group.append(c)});table.prepend(group);
 }
 document.addEventListener('click',event=>{
  if(!document.querySelector('#app .matrix-report'))return;
  const b=event.target.closest('button');if(!b)return;const action=b.dataset.action;
  if(action==='matrixExcel'){event.preventDefault();event.stopImmediatePropagation();void run('excel',options(sessionStorage.getItem('matrixPaperSize')||'A4','landscape'))}
  else if(b.id==='createMatrixPdf'){event.preventDefault();event.stopImmediatePropagation();const size=document.getElementById('matrixPdfPaper')?.value||'A4';sessionStorage.setItem('matrixPaperSize',size);document.querySelector('#modal [data-action="close"]')?.click();void run('pdf',options(size,'landscape'))}
  else if(b.id==='doPrint'){event.preventDefault();event.stopImmediatePropagation();const size=document.getElementById('paperSize')?.value||'A4',orientation=document.getElementById('paperOrientation')?.value||'landscape';sessionStorage.setItem('matrixPaperSize',size);document.querySelector('#modal [data-action="close"]')?.click();void run('print',options(size,orientation))}
 },true);
 const init=()=>{const app=document.getElementById('app');if(app)new MutationObserver(mount).observe(app,{childList:true,subtree:true});mount()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.PPMSMatrixReport={snapshot,options,ranges,rank,paginate,pageHTML,makePages,workbook,run};
})();
