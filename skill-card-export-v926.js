/* Export the visible card selection, with the same front/back artwork as the web. */
(()=>{
 'use strict';
 let busy=false,loading;
 const MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
 function dependency(){
  if(window.ExcelJS)return Promise.resolve();
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script'),timer=setTimeout(()=>fail(),20000);
   function fail(){clearTimeout(timer);script.remove();loading=null;reject(Error('โหลดระบบ Excel ไม่สำเร็จ กรุณาลองใหม่'))}
   script.src='vendor/exceljs-4.4.0.min.js';script.onerror=fail;
   script.onload=()=>{clearTimeout(timer);if(window.ExcelJS)resolve();else fail()};document.head.append(script);
  });return loading;
 }
 function snapshot(){
  const sheet=document.querySelector('#app .wallet-card-sheet');if(!sheet)throw Error('กรุณาเปิดหน้าบัตรพนักงาน');
  const fronts=[...sheet.querySelectorAll('.wallet-front')],backs=[...sheet.querySelectorAll('.wallet-back')];
  return fronts.map(front=>{
   const id=front.dataset.employeeId,back=backs.find(card=>card.dataset.employeeId===id);if(!back)throw Error('ไม่พบด้านหลังบัตร '+id);
   const fields=[...front.querySelectorAll('.wallet-person dd')].map(n=>n.textContent.trim());
   const skills=[...back.querySelectorAll('.wallet-skill-row')].map(row=>({name:row.querySelector('span').textContent.trim(),level:Number(row.querySelector('b').textContent.trim())}));
   return {id,name:front.querySelector('.wallet-person h2')?.textContent.trim()||'',position:fields[1]||'',section:fields[2]||'',updated:fields[3]||'',next:front.querySelector('.wallet-footer span')?.textContent.replace(/^Next:\s*/,'').trim()||'',score:Number(front.querySelector('.wallet-score b')?.textContent),rank:front.querySelector('.wallet-footer b')?.textContent.trim()||'',skills,front:front.cloneNode(true),back:back.cloneNode(true)};
  });
 }
 async function capture(card){
  const host=document.createElement('div');host.setAttribute('data-i18n-ignore','');host.style.cssText='position:absolute;left:-20000px;top:0;width:85.6mm;background:#fff;pointer-events:none';
  host.append(card);document.body.append(host);
  try{
   // Rebuild QR canvases after cloning; a cloned canvas has no pixel contents.
   for(const qr of card.querySelectorAll('.wallet-qr[data-qr]')){qr.replaceChildren();new window.QRCode(qr,{text:qr.dataset.qr,width:72,height:72,correctLevel:window.QRCode.CorrectLevel.M})}
   for(const img of [...card.querySelectorAll('img.avatar')]){
    const id=card.dataset.employeeId,record=window.PPMS_RUNTIME?.monthReportContext?.().employees?.find(e=>String(e.id)===String(id));
    if(record&&window.PPMSOrganizationExcel?.portrait){const photo=await window.PPMSOrganizationExcel.portrait(record);if(photo?.data){img.removeAttribute('onerror');img.src=photo.data}}
   }
   await document.fonts?.ready;
   await Promise.all([...card.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})||Promise.resolve()));
   const canvas=await window.html2canvas(card,{scale:3,backgroundColor:'#fff',useCORS:true,logging:false});
   const data=canvas.toDataURL('image/png');canvas.width=canvas.height=0;return data;
  }finally{host.remove()}
 }
 async function workbook(records,images){
  await dependency();const book=new window.ExcelJS.Workbook();book.creator='Jinrong';book.created=new Date();
  const cards=book.addWorksheet('Skill Cards',{views:[{showGridLines:false}],pageSetup:{paperSize:9,orientation:'portrait',fitToPage:false,scale:100,horizontalCentered:true,margins:{left:.24,right:.24,top:.24,bottom:.24,header:0,footer:0}}});
  const width=85.6*96/25.4,height=53.98*96/25.4;
  cards.getColumn(1).width=(width-5)/7;cards.getColumn(2).width=2.2;cards.getColumn(3).width=(width-5)/7;
  records.forEach((person,i)=>{
   const row=i*2+1;cards.getRow(row).height=height*.75;cards.getRow(row+1).height=8;
   ['front','back'].forEach((side,n)=>{const id=book.addImage({base64:images[i][side],extension:'png'});cards.addImage(id,{tl:{col:n*2,row:row-1},ext:{width,height},editAs:'oneCell'})});
   if((i+1)%5===0&&i+1<records.length)cards.getRow(row+1).addPageBreak();
  });
  cards.pageSetup.printArea='A1:C'+Math.max(1,records.length*2);
  const data=book.addWorksheet('Employee Skills',{views:[{state:'frozen',ySplit:2,showGridLines:false}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:2'}});
  data.mergeCells('A1:K1');data.getCell('A1').value='ภาพบัตรตรงกับหน้าเว็บ ณ เวลาส่งออก · แก้ไขข้อมูลในชีตนี้ได้ แต่ภาพบัตรไม่เปลี่ยนตาม';data.getRow(1).height=30;data.getCell('A1').alignment={wrapText:true,vertical:'middle'};
  data.addRow(['Emp.ID','Name','Position','Section','Updated','Next Update','Skill','Level','Total Score','Rank','QR URL']);
  [18,34,30,30,16,16,30,10,14,18,55].forEach((w,i)=>data.getColumn(i+1).width=w);
  for(const person of records)for(const skill of person.skills){const row=data.addRow([String(person.id),person.name,person.position,person.section,person.updated,person.next,skill.name,skill.level,person.score,person.rank,person.front.querySelector('.wallet-qr')?.dataset.qr||'']);row.getCell(1).numFmt='@';row.height=30;row.alignment={vertical:'middle',wrapText:true};row.font={name:'Tahoma',size:10}}
  data.getRow(2).eachCell(cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF194E82'}};cell.font={name:'Tahoma',size:10,bold:true,color:{argb:'FFFFFFFF'}}});data.getRow(2).height=26;
  data.autoFilter='A2:K'+Math.max(2,data.rowCount);return book;
 }
 async function download(){
  if(busy)return;busy=true;const button=document.querySelector('[data-action="pageExcel"]');
  const notify=text=>{let node=document.getElementById('skillCardExportStatus');if(!node){node=document.createElement('p');node.id='skillCardExportStatus';node.setAttribute('role','status');node.className='no-print';document.querySelector('.card-filter')?.append(node)}node.textContent=text};
  try{
   if(button)button.disabled=true;const records=snapshot();if(!records.length)throw Error('ไม่พบข้อมูลพนักงาน');
   if(!window.html2canvas||!window.QRCode)throw Error('โหลดระบบสร้างบัตรไม่ครบ กรุณารีเฟรชหน้าเว็บ');
   await dependency();const images=[];
   for(let i=0;i<records.length;i++){notify('กำลังสร้าง Excel บัตร '+(i+1)+' / '+records.length);images.push({front:await capture(records[i].front),back:await capture(records[i].back)})}
   const book=await workbook(records,images),bytes=await book.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([bytes],{type:MIME}));
   const link=document.createElement('a');link.href=url;link.download='Employee_Skill_Cards_'+(records.length===1?records[0].id:records[0].section).replace(/[^A-Za-z0-9ก-๙_-]+/g,'_')+'.xlsx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   notify('ดาวน์โหลด Excel แล้ว · บัตรหน้า–หลัง '+records.length+' คน พร้อมชีตข้อมูล');
  }catch(error){notify('ส่งออกไม่สำเร็จ: '+error.message);console.error(error)}finally{busy=false;if(button)button.disabled=false}
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-action="pageExcel"]')&&document.querySelector('#app .wallet-card-sheet')){event.preventDefault();event.stopImmediatePropagation();void download()}},true);
 window.PPMSSkillCardExport={snapshot,capture,workbook,download};
})();
