/* Manpower exports use a captured roster; no assignments or personnel records are changed. */
(()=>{
 'use strict';let busy=false;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const teamName=team=>team?'ทีม '+team:'ทีมลอย / ยังไม่ระบุทีม';
 const lane=row=>row.category==='Support'?'Support · '+row.department+' · '+row.coverage:row.category;
 function model(snapshot){
  const nodes=[],labels=[];let y=80;
  for(const sec of snapshot.sections){
   labels.push({text:sec.name,x:20,y,w:1160,h:36});y+=50;const teams=[...new Set(sec.rows.map(r=>r.team))].sort((a,b)=>(a||'Z').localeCompare(b||'Z'));let end=y;
   for(let t=0;t<teams.length;t++){
    const team=teams[t],x=20+(t%2)*600;let top=y+(t>1?end-y+30:0);labels.push({text:teamName(team),x,y:top,w:560,h:30});top+=40;
    const groups=new Map();for(const row of sec.rows.filter(r=>r.team===team)){const key=lane(row)+' · '+row.pointName;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)}
    for(const [title,rows]of groups){labels.push({text:title,x,y:top,w:560,h:50});top+=55;const people=rows.filter(r=>r.employee);if(!people.length){labels.push({text:'ว่าง · รอจัดพนักงาน',x,y:top,w:560,h:28});top+=45;continue}
     people.forEach((row,i)=>nodes.push({employee:{...row.employee,organizationTeam:teamName(row.team)},parent:'',responsibility:row.machines||row.coverage,x:x+(i%3)*188,y:top+Math.floor(i/3)*230,w:176,h:215}));top+=Math.ceil(people.length/3)*230;
    }end=Math.max(end,top);
   }y=end+50;
  }
  return {title:snapshot.title,nodes,labels,width:1200,height:Math.max(260,y),manpowerRows:snapshot.sections.flatMap(s=>s.rows)};
 }
 async function excel(snapshot,notify=()=>{}){if(busy)return;busy=true;try{if(!window.PPMSOrganizationExcel)throw Error('ระบบส่งออก Excel ยังโหลดไม่ครบ กรุณาลองใหม่');await window.PPMSOrganizationExcel.download({model:model(snapshot),notify})}catch(e){notify('สร้าง Excel ไม่สำเร็จ: '+e.message)}finally{busy=false}}
 function pages(snapshot){
  const result=[];
  for(const sec of snapshot.sections){const teams=[...new Set(sec.rows.map(r=>r.team))].sort((a,b)=>(a||'Z').localeCompare(b||'Z'));if(!teams.length)result.push({section:sec.name,team:'',rows:[]});for(const team of teams){const rows=sec.rows.filter(r=>r.team===team);for(let i=0;i<rows.length;i+=12)result.push({section:sec.name,team,rows:rows.slice(i,i+12)})}}
  return result;
 }
 function pageHtml(page,snapshot,index,total,photos){
  return `<div style="border-bottom:3px solid #173e68;padding-bottom:14px;margin-bottom:18px"><h1 style="font-size:24px;margin:0">ผังกำลังคน · ${esc(page.section)}</h1><p style="margin:8px 0 0;color:#4d647c">${esc(teamName(page.team))} · ${esc(snapshot.scope.division||'')} · ${esc(snapshot.scope.plant||'')} · ${esc(new Date(snapshot.createdAt).toLocaleDateString('th-TH'))}</p></div><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px">${page.rows.map((row,i)=>`<article style="border:1px solid #c7d7e6;border-radius:10px;overflow:hidden;min-height:178px;background:#fff"><div style="padding:9px 11px;background:${row.department==='WH'?'#176d68':'#173e68'};color:white;font-size:13px">${esc(lane(row))}<b style="display:block;margin-top:4px">${esc(row.pointName)}</b></div><div style="padding:12px">${photos[i]?.data?'<img src="'+esc(photos[i].data)+'" style="width:44px;height:44px;object-fit:cover;border-radius:50%;float:left;margin-right:9px">':''}<b style="font-size:14px">${esc(row.employee?.thaiName||row.employee?.name||'ว่าง · รอจัดพนักงาน')}</b><div style="font-size:12px;color:#53677c;margin-top:7px">${esc(row.employee?.position||'')}${row.employee?'<br>'+esc(row.employee.id):''}</div><div style="clear:both;padding-top:9px;font-size:12px;color:#285c8e">${esc(row.machines||row.coverage)}</div>${row.duty?'<p style="font-size:11px;white-space:pre-wrap;margin:7px 0 0">'+esc(row.duty)+'</p>':''}</div></article>`).join('')||'<p>ยังไม่มีจุดงานใน Section นี้</p>'}</div><footer style="margin-top:16px;font-size:11px;color:#64748b">${index+1} / ${total} · PD สนับสนุนฝ่ายผลิต · WH ดึงจากรายชื่อคลังสินค้า</footer>`;
 }
 async function pdf(snapshot,notify=()=>{}){
  if(busy)return;busy=true;let host;
  try{
   if(!window.html2canvas||!window.jspdf?.jsPDF)throw Error('โหลดระบบ PDF ไม่ครบ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่');
   const chunks=pages(snapshot);if(!chunks.length)throw Error('ไม่มี Section สำหรับส่งออก');
   const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
   host=document.createElement('div');host.setAttribute('data-i18n-ignore','');host.style.cssText='position:absolute;left:-100000px;top:0;width:1120px;padding:24px;box-sizing:border-box;background:white;color:#20364c;font:14px Tahoma,Arial,sans-serif;z-index:-1';document.body.append(host);
   for(let n=0;n<chunks.length;n++){
    notify('กำลังสร้าง PDF หน้า '+(n+1)+' / '+chunks.length);
    const page=chunks[n],photos=new Array(page.rows.length);let cursor=0;
    await Promise.all(Array.from({length:Math.min(4,page.rows.length)},async()=>{while(cursor<page.rows.length){const i=cursor++;photos[i]=page.rows[i].employee&&window.PPMSOrganizationExcel?.portrait?await window.PPMSOrganizationExcel.portrait(page.rows[i].employee):null}}));
    host.innerHTML=pageHtml(page,snapshot,n,chunks.length,photos);await document.fonts?.ready;
    const canvas=await window.html2canvas(host,{scale:1.6,backgroundColor:'#ffffff',useCORS:true,logging:false});
    // Slice unusually tall responsibility text without truncating it or creating a giant canvas for the whole organization.
    const pageWidth=285,usableHeight=198,scale=canvas.width/pageWidth,slice=Math.max(1,Math.floor(usableHeight*scale));
    for(let y=0;y<canvas.height;y+=slice){const h=Math.min(slice,canvas.height-y),part=document.createElement('canvas');part.width=canvas.width;part.height=h;part.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);if(n||y)doc.addPage();doc.addImage(part.toDataURL('image/jpeg',0.94),'JPEG',6,6,pageWidth,h/scale,undefined,'FAST');part.width=part.height=0}
    canvas.width=canvas.height=0;host.replaceChildren();await new Promise(resolve=>setTimeout(resolve,0));
   }
   doc.save('Manpower_'+new Date(snapshot.createdAt).toISOString().slice(0,10)+'.pdf');notify('ดาวน์โหลดผังกำลังคน PDF แล้ว');
  }catch(e){notify('สร้าง PDF ไม่สำเร็จ: '+e.message)}finally{host?.remove();busy=false}
 }
 window.PPMSManpowerExport={excel,pdf,model,pages,pageHtml};
})();
