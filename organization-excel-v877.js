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
  const departmentCount=target.querySelectorAll('.division-section').length;
  const holder=document.createElement('div');holder.style.cssText='position:absolute;left:-100000px;top:0;width:'+Math.max(1400,target.scrollWidth,departmentCount*400+100)+'px;background:white;pointer-events:none';
  const clone=target.cloneNode(true);clone.removeAttribute('id');
  clone.querySelectorAll('.no-print,.stamping-print-page,.sorting-print-pages,.stamping-role-source,button').forEach(node=>node.remove());
  // The layout clone must not start another request for every Google portrait.
  clone.querySelectorAll('img').forEach(img=>{img.removeAttribute('src');img.removeAttribute('srcset');img.removeAttribute('onerror')});
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
  const image=new Image(),timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('photo timeout'))},5000);
  image.referrerPolicy='no-referrer';
  image.crossOrigin='anonymous';image.onload=()=>{clearTimeout(timer);try{
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,160,160);
   const side=Math.min(image.naturalWidth,image.naturalHeight);if(!side)throw Error('empty photo');ctx.drawImage(image,(image.naturalWidth-side)/2,0,side,side,0,0,160,160);resolve(canvas.toDataURL('image/png'));
  }catch(error){reject(error)}};image.onerror=()=>{clearTimeout(timer);reject(Error('photo unavailable'))};image.src=source;
 })}
 async function portrait(employee){
  const sources=window.PPMSEmployeePhotos?.sources(employee)||[...new Set([employee.photoData,employee.photoUrl,employee.photo].filter(v=>typeof v==='string'&&v.trim()))];
  for(const source of sources)try{return {data:await imageData(source),failed:false}}catch(_){}
  return {data:null,failed:sources.length>0};
 }
 const paragraph=(text,size=900,bold=false)=>`<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="th-TH" sz="${size}" b="${bold?1:0}"><a:solidFill><a:srgbClr val="173C63"/></a:solidFill><a:latin typeface="Tahoma"/><a:ea typeface="Tahoma"/><a:cs typeface="Tahoma"/></a:rPr><a:t>${xml(text)}</a:t></a:r><a:endParaRPr lang="th-TH" sz="${size}"/></a:p>`;
 const transform=(x,y,w,h)=>`<a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>`;
 function textShape(id,text,x,y,w,h){return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:sp><xdr:nvSpPr><xdr:cNvPr id="${id}" name="${xml(text)}"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr><xdr:spPr>${transform(x,y,w,h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr><xdr:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>${paragraph(text,1100,true)}</xdr:txBody></xdr:sp><xdr:clientData/></xdr:absoluteAnchor>`}
 function cardShape(node,index,hasPhoto){
  const {employee:e,x,y,w,h}=node,id=100+index*10,pw=Math.min(64,w-12),ph=64,photoX=(w-pw)/2;
  const jdLink=`<a:hlinkClick r:id="orgJD${index}" tooltip="${xml('เปิด JD / View JD: '+(e.name||e.id))}"/>`;
  const color=/manager|ผู้จัดการ/i.test(e.position)?'DBEAFE':/engineer|วิศวกร/i.test(e.position)?'D1FAE5':/supervisor|หัวหน้างาน/i.test(e.position)?'EDE9FE':/leader|หัวหน้าทีม/i.test(e.position)?'FEF3C7':'F1F5F9';
  const picture=hasPhoto?`<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id+2}" name="Photo ${xml(e.id)}">${jdLink}</xdr:cNvPr><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="orgPhoto${index}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr>${transform(photoX,8,pw,ph)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>`:'';
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:grpSp><xdr:nvGrpSpPr><xdr:cNvPr id="${id}" name="Employee ${xml(e.id)}">${jdLink}</xdr:cNvPr><xdr:cNvGrpSpPr/></xdr:nvGrpSpPr><xdr:grpSpPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/><a:chOff x="0" y="0"/><a:chExt cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm></xdr:grpSpPr><xdr:sp><xdr:nvSpPr><xdr:cNvPr id="${id+1}" name="${xml(e.name||e.id)}">${jdLink}</xdr:cNvPr><xdr:cNvSpPr/></xdr:nvSpPr><xdr:spPr>${transform(0,0,w,h)}<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="5177A0"/></a:solidFill></a:ln></xdr:spPr><xdr:txBody><a:bodyPr wrap="square" lIns="38100" tIns="${emu(hasPhoto?78:16)}" rIns="38100" bIns="19050" anchor="t"/><a:lstStyle/>${paragraph(e.name||e.thaiName||e.id,850,true)}${paragraph(e.id,800)}${paragraph(e.position||'',800)}${node.responsibility?paragraph(node.responsibility,800):''}</xdr:txBody></xdr:sp>${picture}</xdr:grpSp><xdr:clientData/></xdr:absoluteAnchor>`;
 }
 function connector(from,to,index,fromIndex,toIndex,points){
  if(points){
   const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(1,...points.map(p=>p.x-x)),h=Math.max(1,...points.map(p=>p.y-y));
   const path=points.map((p,i)=>`<a:${i?'lnTo':'moveTo'}><a:pt x="${emu(p.x-x)}" y="${emu(p.y-y)}"/></a:${i?'lnTo':'moveTo'}>`).join('');
   return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:sp><xdr:nvSpPr><xdr:cNvPr id="${100000+index}" name="Reporting line ${index}"/><xdr:cNvSpPr/></xdr:nvSpPr><xdr:spPr>${transform(x,y,w,h)}<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${emu(w)}" h="${emu(h)}" fill="none" stroke="1">${path}</a:path></a:pathLst></a:custGeom><a:ln w="12700"><a:solidFill><a:srgbClr val="7891AC"/></a:solidFill><a:round/></a:ln></xdr:spPr></xdr:sp><xdr:clientData/></xdr:absoluteAnchor>`;
  }
  const x1=from.x+from.w/2,y1=from.y+from.h,x2=to.x+to.w/2,y2=to.y,x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(1,Math.abs(x2-x1)),h=Math.max(1,Math.abs(y2-y1));
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/><xdr:cxnSp><xdr:nvCxnSpPr><xdr:cNvPr id="${100000+index}" name="Reporting line ${index}"/><xdr:cNvCxnSpPr><a:stCxn id="${101+fromIndex*10}" idx="2"/><a:endCxn id="${101+toIndex*10}" idx="0"/></xdr:cNvCxnSpPr></xdr:nvCxnSpPr><xdr:spPr><a:xfrm flipH="${x1>x2?1:0}" flipV="${y1>y2?1:0}"><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="bentConnector3"><a:avLst/></a:prstGeom><a:ln w="15240"><a:solidFill><a:srgbClr val="5177A0"/></a:solidFill></a:ln></xdr:spPr></xdr:cxnSp><xdr:clientData/></xdr:absoluteAnchor>`;
 }
 function jobDescriptions(book,model,records){
  const used=new Set(book.worksheets.map(sheet=>sheet.name.toLowerCase()));
  return model.nodes.map((node,index)=>{
   const e=node.employee,jd=records[index];
   const base=('JD_'+String(e.id||index+1).replace(/[\x00-\x1f\\/?*\[\]:']/g,'_')).slice(0,31);let name=base,number=1;
   while(used.has(name.toLowerCase())){const suffix='_'+(++number);name=base.slice(0,31-suffix.length)+suffix}used.add(name.toLowerCase());
   const sheet=book.addWorksheet(name,{views:[{showGridLines:false,state:'frozen',ySplit:8,zoomScale:90}],pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:8',margins:{left:0.3,right:0.3,top:0.35,bottom:0.35,header:0.15,footer:0.15}}});
   sheet.properties.tabColor={argb:'FF164D84'};
   [3,15,15,15,15,15,15,3].forEach((width,i)=>sheet.getColumn(i+1).width=width);
   let row=2;
   function band(value,{fill='FFFFFF',color='173C63',size=11,bold=false,height=26,span=1}={}){
    const start=row;sheet.mergeCells(row,2,row+span-1,7);const cell=sheet.getCell(row,2);cell.value=String(value??'');cell.font={name:'Tahoma',size,bold,color:{argb:'FF'+color}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+fill}};cell.alignment={vertical:'middle',wrapText:true,indent:1};
    for(let i=0;i<span;i++)sheet.getRow(row+i).height=height/span;row+=span;return {cell,start};
   }
   function pieces(value,limit=180){
    const result=[];
    for(let line of String(value??'').replace(/\r\n?/g,'\n').split('\n')){
     while(line.length>limit){let cut=line.lastIndexOf(' ',limit);if(cut<limit/2)cut=limit;else cut++;result.push(line.slice(0,cut));line=line.slice(cut)}result.push(line);
    }return result;
   }
   function field(label,value){
    const lines=pieces(value||'—',140);lines.forEach((text,i)=>{
     sheet.mergeCells(row,2,row,3);sheet.mergeCells(row,4,row,7);
     const labelCell=sheet.getCell(row,2),valueCell=sheet.getCell(row,4);labelCell.value=i?'':label;valueCell.value=text;
     labelCell.font={name:'Tahoma',size:10,bold:true,color:{argb:'FF173C63'}};labelCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF1F5F9'}};
     valueCell.font={name:'Tahoma',size:11,color:{argb:'FF173C63'}};
     for(const cell of [labelCell,valueCell])cell.alignment={vertical:'top',wrapText:true,indent:1};
     sheet.getRow(row).height=Math.max(32,Math.ceil(text.length/48)*16+8,Math.ceil((i?0:label.length)/25)*15+8);row++;
    });
   }
   function section(label,value){
    band(label,{fill:'E8F1FA',bold:true,height:27});
    for(const text of pieces(value||'—'))band(text,{height:text?Math.max(27,Math.ceil(text.length/80)*16+8):9});
   }
   band('JOB DESCRIPTION / รายละเอียดงาน',{fill:'164D84',color:'FFFFFF',bold:true,size:16,height:42,span:2});
   const back=band('กลับผังองค์กร / Back to Organization Chart',{height:24}).cell;back.value={text:back.value,hyperlink:"#'Organization Chart'!A1"};back.font={name:'Tahoma',size:10,color:{argb:'FF0563C1'},underline:true};
   band('JD ของพนักงาน / Employee Job Description',{fill:'E8F1FA',bold:true,height:25});
   band(e.name||e.thaiName||e.id,{fill:'164D84',color:'FFFFFF',bold:true,size:15,height:42,span:2});
   band('รหัสพนักงาน / Emp.ID: '+e.id+'    ตำแหน่ง / Position: '+(e.position||'—'),{fill:'E8F1FA',bold:true,height:34});
   field('แผนก / Section',e.sortingGroup||e.section);
   if(!jd)section('สถานะ JD / JD status','ไม่พบ JD ที่บันทึกไว้ หรือไม่มีสิทธิ์ส่งออก / No saved JD available for export');
   else{
    field('JD No. / Revision',[jd.documentNo||'—',jd.revision||'—'].join(' / '));
    field('วันที่มีผล / Effective date',jd.effectiveDate);
    field('Division / โรงงาน',String(jd.division||'—')+' / '+String(jd.plant||'—'));
    field('รายงานต่อ / Reports to',jd.reportsTo);
    field('ประเภท JD / JD source',jd.exportSource);
    if(jd.draft)field('สถานะเอกสาร / Status','ฉบับร่าง / Draft');
    if(jd.jobPurpose)section('วัตถุประสงค์ / Job purpose',jd.jobPurpose);
    section('หน้าที่และความรับผิดชอบ / Responsibilities',jd.responsibilities);
    section('คุณสมบัติและทักษะ / Qualifications and skills',jd.qualifications);
    if(jd.documentUrl)field('เอกสารแนบ / Document URL',jd.documentUrl);
    field('อัปเดต / Updated',[jd.updatedAt,jd.updatedBy].filter(Boolean).join(' / '));
   }
   band('สิ้นสุด JD / End of JD: '+(e.name||e.thaiName||e.id)+' · '+e.id,{fill:'E8F1FA',bold:true,height:30});
   // A visible frame encloses one employee only, including the identity header.
   const last=row-1,edge={style:'medium',color:{argb:'FF164D84'}},line={style:'hair',color:{argb:'FFD7E2EE'}};
   for(let r=2;r<=last;r++)for(let col=2;col<=7;col++){
    const cell=sheet.getCell(r,col);cell.style={...cell.style,border:{top:r===2?edge:line,bottom:r===last?edge:line,left:col===2?edge:undefined,right:col===7?edge:undefined}};
   }
   sheet.pageSetup.printArea='B2:G'+last;
   sheet.headerFooter.oddHeader='&CJD '+String(e.id).replace(/&/g,'&&');sheet.headerFooter.oddFooter='&CPage &P / &N';
   return "#'"+name+"'!B2";
  });
 }
 async function workbook(model,photos){
  const book=new ExcelJS.Workbook();book.creator='Jinrong';book.created=new Date();
  const chart=book.addWorksheet('Organization Chart',{views:[{showGridLines:false,zoomScale:75}],pageSetup:{paperSize:model.manpowerRows?9:8,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:model.manpowerRows?1:0}});
  chart.getColumn(1).width=25;chart.getCell('A1').value=model.title;chart.getCell('A1').font={name:'Tahoma',size:16,bold:true,color:{argb:'FF173C63'}};
  chart.getCell('A2').value='คลิกการ์ดหรือรูปเพื่อเปิดชีต JD ของพนักงาน · คลิกกล่องเพื่อย้าย · ดับเบิลคลิกข้อความเพื่อแก้ไข · คลิกขวา > Group > Ungroup เพื่อเปลี่ยนรูป';chart.getCell('A2').font={name:'Tahoma',size:10};
  // Establish the worksheet drawing relationship; replace the seed with native shapes below.
  const seed=book.addImage({base64:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQMAdTpGCrIngcVnSU9DOfe74s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfWAgAjlqSohoAAAAAElFTkSuQmCC',extension:'png'});chart.addImage(seed,{tl:{col:0,row:3},ext:{width:1,height:1}});
  const lastCol=Math.min(16384,Math.ceil(model.width/64)),lastRow=Math.min(1048576,Math.ceil(model.height/20));
  chart.pageSetup.printArea=`A1:${chart.getColumn(lastCol).letter}${lastRow}`;
  const jdRecords=await window.PPMSJDExport?.snapshot(model.nodes.map(n=>n.employee))||model.nodes.map(()=>null);
  const roster=book.addWorksheet('Employees',{views:[{state:'frozen',ySplit:1}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  const headers=['Photo','Emp.ID','Name','Position','Section','Team','Reports to','Start Date','JD'];
  roster.addRow(headers);[14,18,40,28,32,25,20,18,22].forEach((width,i)=>roster.getColumn(i+1).width=width);
  roster.getRow(1).height=26;roster.getRow(1).eachCell(cell=>{cell.font={name:'Tahoma',bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF164D84'}}});
  const jdAnchors=jobDescriptions(book,model,jdRecords);
  model.nodes.forEach((node,i)=>{
   const e=node.employee,row=roster.addRow([photos[i].failed?'โหลดรูปไม่สำเร็จ':photos[i].data?'':'ไม่มีรูป',String(e.id),e.name||e.thaiName||'',e.position||'',e.sortingGroup||e.section||'',e.organizationTeam||e.stampingShift||e.team||e.shift||'',node.parent,e.startDate||'']);row.height=60;
   row.eachCell(cell=>{cell.font={name:'Tahoma',size:10};cell.alignment={vertical:'middle',wrapText:true}});roster.getCell(row.number,2).numFmt='@';
   const jdCell=roster.getCell(row.number,9);jdCell.value={text:'เปิด JD / View JD',hyperlink:jdAnchors[i]};jdCell.font={name:'Tahoma',size:10,color:{argb:'FF0563C1'},underline:true};
   if(photos[i].data){const image=book.addImage({base64:photos[i].data,extension:'png'});roster.addImage(image,{tl:{col:0.15,row:row.number-0.9},ext:{width:64,height:64},editAs:'oneCell',hyperlinks:{hyperlink:jdAnchors[i],tooltip:'เปิด JD / View JD'}})}
  });roster.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,roster.rowCount),column:9}};
  if(model.manpowerRows){const detail=book.addWorksheet('Manpower',{views:[{state:'frozen',ySplit:1}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});detail.addRow(['Section','Team','PD / WH','Category','Coverage','Workpoint','Machines','Required total A/B','Assigned total A/B','Emp.ID','Name','Position','Home Section','Duties']);for(const row of model.manpowerRows){detail.addRow([row.section,row.team,row.department,row.category,row.coverage,row.pointName,row.machines,row.required??'',row.assigned,row.employee?String(row.employee.id):'',row.employee?.thaiName||row.employee?.name||'ว่าง',row.employee?.position||'',row.employee?.section||'',row.duty])}detail.columns.forEach(c=>c.width=24);detail.getRow(1).font={name:'Tahoma',bold:true};detail.eachRow((row,i)=>{row.height=i===1?28:52;row.eachCell(cell=>{cell.alignment={wrapText:true,vertical:'middle'};if(typeof cell.value==='string'&&/^[=+@-]/.test(cell.value))cell.numFmt='@'})});detail.autoFilter='A1:N'+detail.rowCount;}
  const zip=await JSZip.loadAsync(await book.xlsx.writeBuffer()),relations=[],shapes=[],indices=new Map(model.nodes.map((n,i)=>[String(n.employee.id),i])),routes=window.PPMSOrganizationLines?.route(model);
  model.nodes.forEach((node,i)=>{const p=indices.get(node.parent);if(p!==undefined)shapes.push(connector(model.nodes[p],node,i,p,i,routes?.get(i)))});
  model.labels.forEach((label,i)=>shapes.push(textShape(200000+i,label.text,label.x,label.y,label.w,Math.max(28,label.h))));
  model.nodes.forEach((node,i)=>{
   relations.push(`<Relationship Id="orgJD${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(jdAnchors[i])}" TargetMode="External"/>`);
   shapes.push(cardShape(node,i,!!photos[i].data));if(!photos[i].data)return;
   zip.file(`xl/media/org-photo-${i}.png`,photos[i].data.split(',')[1],{base64:true});relations.push(`<Relationship Id="orgPhoto${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/org-photo-${i}.png"/>`);
  });
  zip.file('xl/drawings/drawing1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="${NS}/spreadsheetDrawing" xmlns:a="${NS}/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${shapes.join('')}</xdr:wsDr>`);
  zip.file('xl/drawings/_rels/drawing1.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relations.join('')}</Relationships>`);
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 async function download(options){
  if(busy)return;busy=true;const notify=options.notify||(()=>{});
  let panel;
  try{
   const model=options.model||snapshot(options);notify('กำลังสร้างผังองค์กร Excel พร้อมรูป...');
   document.getElementById('organizationExcelProgress')?.remove();panel=document.createElement('section');panel.id='organizationExcelProgress';panel.className='no-print';panel.setAttribute('role','status');panel.style.cssText='position:fixed;bottom:18px;right:18px;max-width:420px;padding:18px;background:#fff;border:2px solid #164d84;border-radius:12px;box-shadow:0 3px 20px #0003;z-index:100001';panel.innerHTML='<b>กำลังเตรียม Excel...</b><br><progress style="width:100%;margin-top:8px" max="100" value="0"></progress>';document.body.append(panel);
   const label=panel.querySelector('b'),progress=panel.querySelector('progress');await dependencies();
   const photos=new Array(model.nodes.length);let cursor=0,completed=0;
   await Promise.all(Array.from({length:Math.min(8,model.nodes.length)},async()=>{while(cursor<model.nodes.length){const i=cursor++;photos[i]=await portrait(model.nodes[i].employee);completed++;label.textContent=`กำลังโหลดรูป ${completed}/${model.nodes.length} คน`;progress.value=completed/Math.max(1,model.nodes.length)*90}}));
   label.textContent='กำลังบันทึกไฟล์ Excel...';const buffer=await workbook(model,photos),url=URL.createObjectURL(new Blob([buffer],{type:MIME})),link=document.createElement('a');link.href=url;link.download=model.title.replace(/[^A-Za-z0-9ก-๙_-]+/g,'_')+'.xlsx';link.textContent='ดาวน์โหลด Excel';link.className='button';link.style.cssText='display:inline-block;margin-top:10px;padding:10px 18px;background:#164d84;color:#fff;border-radius:6px';label.textContent='ไฟล์ Excel พร้อมแล้ว';progress.value=100;panel.append(link);link.click();
   const close=document.createElement('button');close.type='button';close.textContent='ปิด';close.style.marginLeft='10px';close.onclick=()=>{URL.revokeObjectURL(url);panel.remove()};panel.append(close);
   // Keep a real download link available if the browser blocks an automatic download.
   setTimeout(()=>{URL.revokeObjectURL(url);panel.remove()},15*60*1000);
   const failed=photos.filter(p=>p.failed).length;notify(failed?`ดาวน์โหลด Excel แล้ว · โหลดรูปไม่ได้ ${failed} คน กรุณาตรวจสอบรูปในรายชื่อ`:'ดาวน์โหลดผังองค์กร Excel พร้อมรูปแล้ว',failed?'error':'ok');
  }catch(error){panel?.remove();notify('สร้างผังองค์กร Excel ไม่สำเร็จ: '+error.message,'error');alert('สร้างผังองค์กร Excel ไม่สำเร็จ: '+error.message)}finally{busy=false}
 }
 window.PPMSOrganizationExcel={download,snapshot,workbook,portrait};
})();
