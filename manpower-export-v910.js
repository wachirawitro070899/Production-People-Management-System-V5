/* Manpower exports use a captured roster; no assignments or personnel records are changed. */
(()=>{
 'use strict';let busy=false;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const teamName=team=>team?'ทีม '+team:'ทีมลอย / ยังไม่ระบุทีม';
 const lane=row=>row.category==='Support'?'Support · '+row.department+' · '+row.coverage:row.category;
 function model(snapshot){
  const nodes=[],labels=[];let y=80;
  for(const sec of snapshot.sections){
   labels.push({text:sec.name,x:20,y,w:1160,h:36});y+=50;const shared=sec.rows.filter(r=>r.category==='หัวหน้า'&&!r.team),working=sec.rows.filter(r=>!shared.includes(r));if(shared.length){labels.push({text:'หัวหน้า Section',x:20,y,w:1160,h:30});y+=40;shared.forEach((row,i)=>{if(row.employee)nodes.push({employee:{...row.employee},parent:'',responsibility:row.machines||row.coverage,x:512,y:y+i*230,w:176,h:215})});y+=shared.length*230+25}const sharedParent=shared.find(r=>r.employee)?.employee.id||'';const teams=[...new Set(working.map(r=>r.team))].sort((a,b)=>(a||'Z').localeCompare(b||'Z'));let end=y;
   for(let t=0;t<teams.length;t++){
    const team=teams[t],x=20+(t%2)*600;let top=y+(t>1?end-y+30:0);labels.push({text:teamName(team),x,y:top,w:560,h:30});top+=40;
    let teamParent=sharedParent;const groups=new Map();for(const row of working.filter(r=>r.team===team)){const key=lane(row)+' · '+row.pointName;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)}
    for(const [title,rows]of groups){labels.push({text:title,x,y:top,w:560,h:50});top+=55;const people=rows.filter(r=>r.employee);if(!people.length){labels.push({text:'ว่าง · รอจัดพนักงาน',x,y:top,w:560,h:28});top+=45;continue}
     const heads=people.every(row=>row.category==='หัวหน้า'),columns=heads?1:3;people.forEach((row,i)=>{nodes.push({employee:{...row.employee,organizationTeam:teamName(row.team)},parent:row.category==='หัวหน้า'?sharedParent:teamParent,responsibility:row.machines||row.coverage,x:x+(heads?192:(i%columns)*188),y:top+Math.floor(i/columns)*230,w:176,h:215});if(row.category==='หัวหน้า'&&teamParent===sharedParent)teamParent=row.employee.id});top+=Math.ceil(people.length/columns)*230;
    }end=Math.max(end,top);
   }y=end+50;
  }
  return {title:snapshot.title,nodes,labels,width:1200,height:Math.max(260,y),manpowerRows:snapshot.sections.flatMap(s=>s.rows)};
 }
 async function excel(snapshot,notify=()=>{}){if(busy)return;busy=true;try{if(!window.PPMSOrganizationExcel)throw Error('ระบบส่งออก Excel ยังโหลดไม่ครบ กรุณาลองใหม่');await window.PPMSOrganizationExcel.download({model:model(snapshot),notify})}catch(e){notify('สร้าง Excel ไม่สำเร็จ: '+e.message)}finally{busy=false}}
 function pages(snapshot){return snapshot.sections.map(sec=>({section:sec.name,rows:sec.rows}))}
 function pageHtml(page,snapshot,index,total,photos){
  const shared=page.rows.map((row,i)=>({row,i})).filter(({row})=>row.category==='หัวหน้า'&&!row.team),working=page.rows.map((row,i)=>({row,i})).filter(({row})=>!shared.some(item=>item.row===row)),teams=[...new Set(working.map(({row})=>row.team))].sort((a,b)=>(a||'Z').localeCompare(b||'Z'));
  const card=({row,i})=>`<article style="${row.category==='หัวหน้า'?'grid-column:1/-1;justify-self:center;width:270px;max-width:100%;':''}border:1px solid #c7d7e6;border-radius:7px;background:#fff;box-sizing:border-box;min-width:0;overflow-wrap:anywhere"><div style="padding:5px 8px;background:${row.department==='WH'?'#176d68':'#173e68'};color:white;font-size:11px;line-height:1.3">${esc(lane(row))}<b style="display:block;margin-top:3px;font-size:12px">${esc(row.pointName)}</b></div><div style="padding:7px 8px">${photos[i]?.data?'<img src="'+esc(photos[i].data)+'" style="width:34px;height:34px;object-fit:cover;border-radius:50%;float:left;margin-right:7px">':''}<b style="font-size:13px;line-height:1.35">${esc(row.employee?.thaiName||row.employee?.name||'ว่าง · รอจัดพนักงาน')}</b><div style="font-size:11px;color:#53677c;margin-top:4px;line-height:1.35">${esc(row.employee?.position||'')}${row.employee?' · '+esc(row.employee.id):''}</div>${row.machines&&row.machines!==row.pointName?'<div style="clear:both;padding-top:5px;font-size:11px;color:#285c8e">'+esc(row.machines)+'</div>':''}${row.duty?'<p style="font-size:10px;line-height:1.35;white-space:pre-wrap;margin:4px 0 0">'+esc(row.duty)+'</p>':''}</div></article>`;
  return `<div style="border-bottom:2px solid #173e68;padding-bottom:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:end"><h1 style="font-size:21px;margin:0">ผังกำลังคน · ${esc(page.section)}</h1><span style="font-size:11px;color:#4d647c">${esc(snapshot.scope.division||'')} · ${esc(snapshot.scope.plant||'')} · ${esc(new Date(snapshot.createdAt).toLocaleDateString('th-TH'))}</span></div>${shared.length?'<div style="display:grid;grid-template-columns:1fr;justify-items:center;gap:7px;margin-bottom:12px">'+shared.map(card).join('')+'</div>':''}<div style="display:grid;grid-template-columns:repeat('+Math.min(2,Math.max(1,teams.length))+',minmax(0,1fr));gap:14px;align-items:start">${teams.map(team=>{const rows=working.filter(({row})=>row.team===team);return '<section style="min-width:0;border:1px solid #d5e1ee;border-radius:8px;padding:9px;background:#f7f9fc;'+(!team?'grid-column:1/-1;':'')+'"><h2 style="margin:0 0 8px;padding:7px;text-align:center;font-size:16px;border-radius:5px;color:white;background:'+(team==='B'?'#176d68':'#173e68')+'">'+esc(teamName(team))+'</h2><div style="display:grid;grid-template-columns:repeat('+(rows.length>24?4:3)+',minmax(0,1fr));gap:7px;align-items:start">'+rows.map(card).join('')+'</div></section>'}).join('')||'<p>ยังไม่มีจุดงานใน Section นี้</p>'}</div><div style="margin-top:9px;font-size:10px;color:#64748b">A4 แนวนอน · ${index+1} / ${total} · PD ฝ่ายผลิต · WH คลังสินค้า</div>`;
 }
 function fitPage(width,height){if(!(width>0&&height>0))throw Error('ไม่พบขนาดผังสำหรับ PDF');const scale=Math.min(285/width,198/height),w=width*scale,h=height*scale;return {x:6+(285-w)/2,y:6+(198-h)/2,width:w,height:h}}
 async function pdf(snapshot,notify=()=>{}){
  if(busy)return;busy=true;let host;
  try{
   if(!window.html2canvas||!window.jspdf?.jsPDF)throw Error('โหลดระบบ PDF ไม่ครบ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่');
   const chunks=pages(snapshot);if(!chunks.length)throw Error('ไม่มี Section สำหรับส่งออก');
   const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
   host=document.createElement('div');host.setAttribute('data-i18n-ignore','');host.style.cssText='position:absolute;left:-100000px;top:0;width:1600px;padding:14px;box-sizing:border-box;background:white;color:#20364c;font:14px Tahoma,Arial,sans-serif;z-index:-1';document.body.append(host);
   for(let n=0;n<chunks.length;n++){
    notify('กำลังสร้าง PDF หน้า '+(n+1)+' / '+chunks.length);
    const page=chunks[n],photos=new Array(page.rows.length);let cursor=0;
    await Promise.all(Array.from({length:Math.min(4,page.rows.length)},async()=>{while(cursor<page.rows.length){const i=cursor++;photos[i]=page.rows[i].employee&&window.PPMSOrganizationExcel?.portrait?await window.PPMSOrganizationExcel.portrait(page.rows[i].employee):null}}));
    host.innerHTML=pageHtml(page,snapshot,n,chunks.length,photos);await document.fonts?.ready;
    const canvas=await window.html2canvas(host,{scale:1.6,backgroundColor:'#ffffff',useCORS:true,logging:false});
    const placement=fitPage(canvas.width,canvas.height);if(n)doc.addPage('a4','landscape');doc.addImage(canvas.toDataURL('image/jpeg',0.96),'JPEG',placement.x,placement.y,placement.width,placement.height,undefined,'FAST');
    canvas.width=canvas.height=0;host.replaceChildren();await new Promise(resolve=>setTimeout(resolve,0));
   }
   doc.save('Manpower_'+new Date(snapshot.createdAt).toISOString().slice(0,10)+'.pdf');notify('ดาวน์โหลด PDF A4 แนวนอน · 1 Section ต่อ 1 หน้าแล้ว');
  }catch(e){notify('สร้าง PDF ไม่สำเร็จ: '+e.message)}finally{host?.remove();busy=false}
 }
 window.PPMSManpowerExport={excel,pdf,model,pages,pageHtml,fitPage};
})();
