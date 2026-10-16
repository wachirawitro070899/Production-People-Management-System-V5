/* Native Excel organization charts: editable grouped cards, portraits and connectors. */
(()=>{
 'use strict';
 const PX=9525,NS='http://schemas.openxmlformats.org/drawingml/2006',
  MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
 const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 const emu=n=>Math.round(n*PX);
 let loading,busy=false;
 function dependencies(){
  if(window.ExcelJS&&window.JSZip)return Promise.resolve();
  if(loading)return loading;
  const load=(src,key)=>window[key]?Promise.resolve():new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=src;
   const timer=setTimeout(()=>{script.remove();reject(Error('โหลดระบบ Excel ไม่สำเร็จ กรุณาลองอีกครั้ง'))},25000);
   script.onload=()=>{clearTimeout(timer);window[key]?resolve():reject(Error('โหลดระบบ Excel ไม่ครบ'))};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('โหลดระบบ Excel ไม่สำเร็จ'))};document.head.append(script);
  });
  loading=Promise.all([load('vendor/exceljs-4.4.0.min.js','ExcelJS'),load('vendor/jszip-3.10.1.min.js','JSZip')]).catch(error=>{loading=null;throw error});return loading;
 }
 function snapshot({target,list,title}){
  if(!target)throw Error('ไม่พบผังองค์กร');
  const holder=document.createElement('div');holder.style.cssText='position:absolute;left:-100000px;top:0;width:'+Math.max(1400,target.scrollWidth)+'px;background:white;pointer-events:none';
  const clone=target.cloneNode(true);clone.removeAttribute('id');
  clone.querySelectorAll('.no-print,.stamping-print-page,.sorting-print-pages,.stamping-role-source,button').forEach(node=>node.remove());
  clone.querySelectorAll('.person[data-edit]').forEach(card=>{
   for(const [key,value]of Object.entries({width:'160px','min-width':'160px','max-width':'160px',flex:'0 0 160px',height:'auto','min-height':'180px','max-height':'none',transform:'none'}))card.style.setProperty(key,value,'important');
  });
  clone.querySelectorAll('.people').forEach(row=>{for(const [key,value]of Object.entries({display:'flex','flex-wrap':'wrap',gap:'16px','justify-content':'center'}))row.style.setProperty(key,value,'important')});
  holder.append(clone);document.body.append(holder);
  try{
   const base=clone.getBoundingClientRect(),byId=new Map(list.map(e=>[String(e.id),{...e}])),seen=new Set(),nodes=[];
   for(const card of clone.querySelectorAll('.person[data-edit]')){
    const id=String(card.dataset.edit),employee=byId.get(id);if(!employee||seen.has(id))continue;
    const rect=card.getBoundingClientRect();if(!rect.width||!rect.height||getComputedStyle(card).display==='none')continue;
    seen.add(id);nodes.push({employee,x:rect.left-base.left+20,y:rect.top-base.top+70,w:rect.width,h:Math.max(rect.height,164),parent:''});
   }
   // A hidden/empty view must never silently export employees from another view.
   if(!nodes.length&&list.length)throw Error('ผังยังแสดงไม่ครบ กรุณารอให้ผังโหลดแล้วลองอีกครั้ง');
   const ids=new Set(nodes.map(n=>String(n.employee.id)));
   if(clone.dataset.organizationMode==='tree'){
    for(const node of nodes){const card=[...clone.querySelectorAll('.person[data-edit]')].find(c=>c.dataset.edit===String(node.employee.id));node.parent=card?.closest('[data-org-node]')?.parentElement?.closest('[data-org-node]')?.dataset.orgNode||''}
   }else if(window.PPMSOrganizationEditor){
    const parents=window.PPMSOrganizationEditor.model({parents:{}},nodes.map(n=>n.employee)).parents;
    for(const node of nodes)node.parent=ids.has(parents.get(String(node.employee.id)))?parents.get(String(node.employee.id)):'';
   }
   const labels=[...clone.querySelectorAll('.division-section-head h3,.production-supervised-title,.level>h4,.org-document-title h1,.sorting-team>h3')].map(label=>{
    const r=label.getBoundingClientRect();return {text:label.textContent.trim(),x:r.left-base.left+20,y:r.top-base.top+70,w:r.width,h:r.height};
   }).filter(label=>label.w&&label.h&&label.text);
   return {title,nodes,labels,width:Math.max(800,...nodes.map(n=>n.x+n.w+20),...labels.map(n=>n.x+n.w+20)),height:Math.max(260,...nodes.map(n=>n.y+n.h+20))};
  }finally{holder.remove()}
 }
 function imageData(source){return new Promise((resolve,reject)=>{
  const image=new Image(),timer=setTimeout(()=>{image.src='';reject(Error('photo timeout'))},10000);
  image.crossOrigin='anonymous';image.onload=()=>{clearTimeout(timer);try{
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,160,160);
   const side=Math.min(image.naturalWidth,image.naturalHeight);if(!side)throw Error('empty photo');ctx.drawImage(image,(image.naturalWidth-side)/2,0,side,side,0,0,160,160);resolve(canvas.toDataURL('image/png'));
  }catch(error){reject(error)}};image.onerror=()=>{clearTimeout(timer);reject(Error('photo unavailable'))};image.src=source;
 })}
 async function portrait(employee){
  const sources=[...new Set([employee.photoData,employee.photoUrl,employee.photo].filter(v=>typeof v==='string'&&v.trim()))];
  for(const source of sources)try{return {data:await imageData(source),failed:false}}catch(_){}
  return {data:null,failed:sources.length>0};
 }
 const paragraph=(text,size=900,bold=false)=>`<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="th-TH" sz="${size}" b="${bold?1:0}"><a:solidFill><a:srgbClr val="173C63"/></a:solidFill><a:latin typeface="Tahoma"/><a:ea typeface="Tahoma"/><a:cs typeface="Tahoma"/></a:rPr><a:t>${xml(text)}</a:t></a:r><a:endParaRPr lang="th-TH" sz="${size}"/></a:p>`;
 const transform=(x,y,w,h)=>`<a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>`;
 function textShape(id,text,x,y,w,h){return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:sp><xdr:nvSpPr><xdr:cNvPr id="${id}" name="${xml(text)}"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr><xdr:spPr>${transform(x,y,w,h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr><xdr:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>${paragraph(text,1100,true)}</xdr:txBody></xdr:sp><xdr:clientData/></xdr:absoluteAnchor>`}
 function cardShape(node,index,hasPhoto){
  const {employee:e,x,y,w,h}=node,id=100+index*10,pw=Math.min(64,w-12),ph=64,photoX=(w-pw)/2;
  const color=/manager|ผู้จัดการ/i.test(e.position)?'DBEAFE':/engineer|วิศวกร/i.test(e.position)?'D1FAE5':/supervisor|หัวหน้างาน/i.test(e.position)?'EDE9FE':/leader|หัวหน้าทีม/i.test(e.position)?'FEF3C7':'F1F5F9';
  const picture=hasPhoto?`<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id+2}" name="Photo ${xml(e.id)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="orgPhoto${index}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr>${transform(photoX,8,pw,ph)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>`:'';
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:grpSp><xdr:nvGrpSpPr><xdr:cNvPr id="${id}" name="Employee ${xml(e.id)}"/><xdr:cNvGrpSpPr/></xdr:nvGrpSpPr><xdr:grpSpPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/><a:chOff x="0" y="0"/><a:chExt cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm></xdr:grpSpPr><xdr:sp><xdr:nvSpPr><xdr:cNvPr id="${id+1}" name="${xml(e.name||e.id)}"/><xdr:cNvSpPr/></xdr:nvSpPr><xdr:spPr>${transform(0,0,w,h)}<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="5177A0"/></a:solidFill></a:ln></xdr:spPr><xdr:txBody><a:bodyPr wrap="square" lIns="38100" tIns="${emu(hasPhoto?78:16)}" rIns="38100" bIns="19050" anchor="t"/><a:lstStyle/>${paragraph(e.name||e.thaiName||e.id,850,true)}${paragraph(e.id,800)}${paragraph(e.position||'',800)}</xdr:txBody></xdr:sp>${picture}</xdr:grpSp><xdr:clientData/></xdr:absoluteAnchor>`;
 }
 function connector(from,to,index,fromIndex,toIndex){
  const x1=from.x+from.w/2,y1=from.y+from.h,x2=to.x+to.w/2,y2=to.y,x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(1,Math.abs(x2-x1)),h=Math.max(1,Math.abs(y2-y1));
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:cxnSp><xdr:nvCxnSpPr><xdr:cNvPr id="${100000+index}" name="Reporting line ${index}"/><xdr:cNvCxnSpPr><a:stCxn id="${101+fromIndex*10}" idx="2"/><a:endCxn id="${101+toIndex*10}" idx="0"/></xdr:cNvCxnSpPr></xdr:nvCxnSpPr><xdr:spPr><a:xfrm flipH="${x1>x2?1:0}" flipV="${y1>y2?1:0}"><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="bentConnector3"><a:avLst/></a:prstGeom><a:ln w="15240"><a:solidFill><a:srgbClr val="5177A0"/></a:solidFill></a:ln></xdr:spPr></xdr:cxnSp><xdr:clientData/></xdr:absoluteAnchor>`;
 }
 async function workbook(model,photos){
  const book=new ExcelJS.Workbook();book.creator='Jinrong';book.created=new Date();
  const chart=book.addWorksheet('Organization Chart',{views:[{showGridLines:false,zoomScale:75}],pageSetup:{paperSize:8,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  chart.getColumn(1).width=25;chart.getCell('A1').value=model.title;chart.getCell('A1').font={name:'Tahoma',size:16,bold:true,color:{argb:'FF173C63'}};
  chart.getCell('A2').value='คลิกกล่องเพื่อย้าย · ดับเบิลคลิกข้อความเพื่อแก้ไข · คลิกขวา > Group > Ungroup เพื่อเปลี่ยนรูป';chart.getCell('A2').font={name:'Tahoma',size:10};
  // Establish the worksheet drawing relationship; replace the seed with native shapes below.
  const seed=book.addImage({base64:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQMAdTpGCrIngcVnSU9DOfe74s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfWAgAjlqSohoAAAAAElFTkSuQmCC',extension:'png'});chart.addImage(seed,{tl:{col:0,row:3},ext:{width:1,height:1}});
  const lastCol=Math.min(16384,Math.ceil(model.width/64)),lastRow=Math.min(1048576,Math.ceil(model.height/20));
  chart.pageSetup.printArea=`A1:${chart.getColumn(lastCol).letter}${lastRow}`;
  const roster=book.addWorksheet('Employees',{views:[{state:'frozen',ySplit:1}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  const headers=['Photo','Emp.ID','Name','Position','Section','Team','Reports to','Start Date'];
  roster.addRow(headers);[14,18,40,28,32,25,20,18].forEach((width,i)=>roster.getColumn(i+1).width=width);
  roster.getRow(1).height=26;roster.getRow(1).eachCell(cell=>{cell.font={name:'Tahoma',bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF164D84'}}});
  model.nodes.forEach((node,i)=>{
   const e=node.employee,row=roster.addRow([photos[i].failed?'โหลดรูปไม่สำเร็จ':photos[i].data?'':'ไม่มีรูป',String(e.id),e.name||e.thaiName||'',e.position||'',e.sortingGroup||e.section||'',e.organizationTeam||e.stampingShift||e.team||e.shift||'',node.parent,e.startDate||'']);row.height=60;
   row.eachCell(cell=>{cell.font={name:'Tahoma',size:10};cell.alignment={vertical:'middle',wrapText:true}});roster.getCell(row.number,2).numFmt='@';
   if(photos[i].data){const image=book.addImage({base64:photos[i].data,extension:'png'});roster.addImage(image,{tl:{col:0.15,row:row.number-0.9},ext:{width:64,height:64},editAs:'oneCell'})}
  });roster.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,roster.rowCount),column:8}};
  const zip=await JSZip.loadAsync(await book.xlsx.writeBuffer()),relations=[],shapes=[],indices=new Map(model.nodes.map((n,i)=>[String(n.employee.id),i]));
  model.nodes.forEach((node,i)=>{const p=indices.get(node.parent);if(p!==undefined)shapes.push(connector(model.nodes[p],node,i,p,i))});
  model.labels.forEach((label,i)=>shapes.push(textShape(200000+i,label.text,label.x,label.y,label.w,Math.max(28,label.h))));
  model.nodes.forEach((node,i)=>{
   shapes.push(cardShape(node,i,!!photos[i].data));if(!photos[i].data)return;
   zip.file(`xl/media/org-photo-${i}.png`,photos[i].data.split(',')[1],{base64:true});relations.push(`<Relationship Id="orgPhoto${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/org-photo-${i}.png"/>`);
  });
  zip.file('xl/drawings/drawing1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="${NS}/spreadsheetDrawing" xmlns:a="${NS}/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${shapes.join('')}</xdr:wsDr>`);
  zip.file('xl/drawings/_rels/drawing1.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relations.join('')}</Relationships>`);
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 async function download(options){
  if(busy)return;busy=true;const notify=options.notify||(()=>{});
  try{
   const model=snapshot(options);notify('กำลังสร้างผังองค์กร Excel พร้อมรูป...');await dependencies();
   const photos=new Array(model.nodes.length);let cursor=0;
   await Promise.all(Array.from({length:Math.min(6,model.nodes.length)},async()=>{while(cursor<model.nodes.length){const i=cursor++;photos[i]=await portrait(model.nodes[i].employee)}}));
   const buffer=await workbook(model,photos),url=URL.createObjectURL(new Blob([buffer],{type:MIME})),link=document.createElement('a');link.href=url;link.download=model.title.replace(/[^A-Za-z0-9ก-๙_-]+/g,'_')+'.xlsx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   const failed=photos.filter(p=>p.failed).length;notify(failed?`ดาวน์โหลด Excel แล้ว · โหลดรูปไม่ได้ ${failed} คน กรุณาตรวจสอบรูปในรายชื่อ`:'ดาวน์โหลดผังองค์กร Excel พร้อมรูปแล้ว',failed?'error':'ok');
  }catch(error){notify('สร้างผังองค์กร Excel ไม่สำเร็จ: '+error.message,'error');alert('สร้างผังองค์กร Excel ไม่สำเร็จ: '+error.message)}finally{busy=false}
 }
 window.PPMSOrganizationExcel={download,snapshot,workbook,portrait};
})();
