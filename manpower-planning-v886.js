/* Manpower targets and assignments share the existing factory-layout cloud document. */
(()=>{
 'use strict';
 const PATH='ppmsFactoryLayout/v1', CACHE='ppms_factory_layout_v1';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rt=()=>window.PPMS_RUNTIME, admin=()=>rt()?.factoryLayoutIsAdmin?.()===true;
 const inScope=m=>!window.PPMSOrganizationScope||window.PPMSOrganizationScope.contains(m);
 const normalize=d=>({...d,machines:d?.machines&&typeof d.machines==='object'?d.machines:{}});
 const shiftOf=a=>a?.shift==='night'?'night':'day';
 const label=s=>s==='night'?'กะดึก':'กะเช้า';
 const target=(m,s)=>Number.isInteger(m.manpower?.[s])&&m.manpower[s]>=0?m.manpower[s]:null;
 const roster=()=>{const gone=new Set((rt()?.factoryLayoutDeletedEmployeeIds?.()||[]).map(String));return (rt()?.factoryLayoutEmployees?.()||[]).filter(e=>e?.id!=null&&!gone.has(String(e.id)))};
 const machines=(d=data)=>Object.entries(d.machines).filter(([,m])=>m&&inScope(m)).map(([id,m])=>({...m,id}));
 function assigned(m,s,people=roster()) {const ids=new Set(Object.values(m.assignments||{}).filter(a=>shiftOf(a)===s).map(a=>String(a?.employeeId)));return people.filter(e=>e.section===m.section&&ids.has(String(e.id)))}
 function summary(ms,people,shifts) {
  let required=0,unknown=0,shortage=0,excess=0;const placed=new Set(), occurrences=new Map();
  for(const m of ms)for(const s of shifts){const need=target(m,s),list=assigned(m,s,people);if(need===null)unknown++;else{required+=need;shortage+=Math.max(0,need-list.length);excess+=Math.max(0,list.length-need)}for(const e of list){const id=String(e.id);placed.add(id);occurrences.set(id,(occurrences.get(id)||0)+1)}}
  return {required,unknown,shortage,excess,placed:placed.size,duplicates:[...occurrences].filter(([,n])=>n>1).map(([id])=>id),unassigned:people.filter(e=>!placed.has(String(e.id)))};
 }
 const drafts=new Map(),employeeOptions=new Map();
 let data=normalize(null),root=null,section='',shift='day',ready=false,busy=false,message='กำลังโหลดข้อมูล...',timer=null,loading=false,generation=0,refreshPending=false;
 const sectionNames=(people=roster(),ms=machines())=>[...new Set([...(rt()?.organizationSections?.()||[]),...people.map(e=>e.section),...ms.map(m=>m.section)].filter(Boolean))];
 function note(text){message=text;const n=root?.querySelector('[data-mp-status]');if(n)n.textContent=text}
 async function request(options={}){
  const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error('ไม่พบการตั้งค่าฐานข้อมูล');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch(base+'/'+PATH+'.json',{...options,signal:controller.signal,cache:'no-store'});if(!r.ok&&r.status!==412)throw Error('เชื่อมต่อข้อมูลไม่สำเร็จ ('+r.status+')');return r}finally{clearTimeout(timeout)}
 }
 function remember(){try{localStorage.setItem(CACHE,JSON.stringify(data))}catch{}}
 async function load(){
  if(loading||busy||!root?.isConnected)return;loading=true;const token=generation;
  try{const r=await request(),next=normalize(await r.json());if(token!==generation||busy)return;const changed=!ready||JSON.stringify(data)!==JSON.stringify(next);data=next;ready=true;remember();note('ข้อมูลกลางล่าสุด'+(data.updatedAt?' · '+new Date(data.updatedAt).toLocaleString('th-TH'):''));if(changed)drawSafe()}
  catch(e){if(token===generation){ready=false;note('โหลดข้อมูลไม่สำเร็จ · แสดงสำเนาที่เคยเปิด กรุณากดโหลดใหม่ก่อนแก้ไข');drawSafe()}}
  finally{loading=false}
 }
 async function save(change){
  if(busy)return false;if(!admin()||!ready){note('กรุณา Login Admin และโหลดข้อมูลกลางให้สำเร็จก่อนบันทึก');return false}
  busy=true;generation++;note('กำลังบันทึก...');lock();
  try{
   for(let attempt=0;attempt<4;attempt++){
    if(!admin())throw Error('สิทธิ์ Admin หมดอายุ');
    const read=await request({headers:{'X-Firebase-ETag':'true'}}),etag=read.headers.get('etag');if(!etag)throw Error('ไม่พบเวอร์ชันข้อมูล กรุณาโหลดใหม่');
    const next=normalize(await read.json());change(next);next.updatedAt=new Date().toISOString();next.updatedBy=sessionStorage.getItem('ppms_admin_user')||'admin';
    const write=await request({method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(next)});if(write.status===412)continue;
    data=normalize(await write.json());remember();note('บันทึกข้อมูลกลางเรียบร้อยแล้ว · ใช้ร่วมกับ Layout โรงงาน');return true;
   }throw Error('มีผู้อื่นแก้ไขพร้อมกัน กรุณาลองอีกครั้ง');
  }catch(e){note('ยังไม่บันทึก: '+(e.name==='AbortError'?'เชื่อมต่อหมดเวลา กรุณาโหลดใหม่':e.message));return false}
  finally{busy=false;draw()}
 }
 function validMachine(d,id){const m=d.machines[id];if(!m||!inScope(m))throw Error('ไม่พบเครื่องใน Division ที่เลือก');return m}
 function setTarget(d,id,s,value,basis){const m=validMachine(d,id);if(!['day','night'].includes(s)||!(value===null||(Number.isInteger(value)&&value>=0&&value<=999)))throw Error('จำนวนคนต้องเป็นจำนวนเต็ม 0–999');if(m.kind==='support'&&value>1)throw Error('จุด Support รองรับ 1 คนต่อกะ ให้เพิ่มจุดงานสำหรับคนถัดไป');m.manpower={...m.manpower,[s]:value,basis:String(basis||'').trim().slice(0,300)}}
 function move(d,id,s,employeeId){
  if(!['day','night'].includes(s))throw Error('กะไม่ถูกต้อง');const m=validMachine(d,id),e=roster().find(e=>String(e.id)===String(employeeId));if(!e||e.section!==m.section)throw Error('ต้องเลือกพนักงานใน Section เดียวกับเครื่อง');
  for(const other of machines(d))if(Object.values(other.assignments||{}).some(a=>String(a?.employeeId)===String(e.id)&&shiftOf(a)!==s))throw Error('พนักงานอยู่ในอีกกะแล้ว กรุณายกเลิกการจัดกะเดิมก่อน');
  if(m.kind==='support'&&assigned(m,s).some(x=>String(x.id)!==String(e.id)))throw Error('จุด Support นี้มีคนครบแล้ว');
  for(const other of machines(d))for(const [key,a] of Object.entries(other.assignments||{}))if(String(a?.employeeId)===String(e.id)&&shiftOf(a)===s)delete d.machines[other.id].assignments[key];
  m.assignments||={};const key=s+'_e_'+Array.from(String(e.id)).map(c=>c.codePointAt(0).toString(16)).join('_');m.assignments[key]={employeeId:String(e.id),shift:s,assignedAt:new Date().toISOString()};
 }
 function unassign(d,id,s,employeeId){const m=validMachine(d,id);for(const [key,a]of Object.entries(m.assignments||{}))if(String(a?.employeeId)===String(employeeId)&&shiftOf(a)===s)delete m.assignments[key]}
 const shownShifts=()=>shift==='all'?['day','night']:[shift];
 function badge(need,count){return need===null?'<span class="mp-tag">ยังไม่กำหนดอัตรา</span>':need>count?`<span class="mp-tag mp-red">ขาด ${need-count} คน</span>`:need<count?`<span class="mp-tag mp-amber">เกินอัตรา ${count-need} คน</span>`:'<span class="mp-tag mp-green">ครบอัตรา</span>'}
 function person(e,m,s){const src=String(e.photoData||e.photoUrl||e.photo||''),photo=/^(https?:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(src)?`<img src="${esc(src)}" alt="" loading="lazy">`:'<span class="mp-avatar">'+esc(String(e.name||'?')[0])+'</span>';return `<div class="mp-person">${photo}<span><b>${esc(e.thaiName||e.name)}</b><small>${esc(e.id)} · ${esc(e.position||'')}</small></span><button type="button" class="secondary no-print" data-mp-remove="${esc(e.id)}" data-machine="${esc(m.id)}" data-shift="${s}" aria-label="ยกเลิกประจำเครื่อง ${esc(e.name)}">ยกเลิก</button></div>`}
 function prepareEmployeeOptions(people,ms){
  employeeOptions.clear();const byId=new Map(people.map(e=>[String(e.id),e])),locations=new Map();
  for(const m of ms)for(const a of Object.values(m.assignments||{})){
   const id=String(a?.employeeId||''),e=byId.get(id);if(!e||e.section!==m.section)continue;
   if(!locations.has(id))locations.set(id,new Set());locations.get(id).add(label(shiftOf(a))+' '+m.name);
  }
  for(const e of people){const existing=[...(locations.get(String(e.id))||[])],html=`<option value="${esc(e.id)}">${esc(e.id+' · '+(e.thaiName||e.name)+(existing.length?' ['+existing.join(', ')+']':''))}</option>`;employeeOptions.set(e.section,(employeeOptions.get(e.section)||'')+html)}
 }
 function populateEmployeeSelect(event){
  const select=event.target.closest?.('[data-mp-assign] select');if(!select||select.dataset.mpLoaded)return;
  const m=data.machines[select.closest('form').dataset.mpAssign];if(!m)return;
  select.insertAdjacentHTML('beforeend',employeeOptions.get(m.section)||'');select.dataset.mpLoaded='1';
 }
 function machineCard(m,people){return `<article class="mp-machine"><h4>${esc(m.name||m.id)} <small>${esc(m.kind==='support'?'Support':'เครื่อง / จุดงาน')}</small></h4>${shownShifts().map(s=>{const list=assigned(m,s,people),need=target(m,s),draft=drafts.get(m.id+'::'+s);return `<div class="mp-shift"><div class="mp-row"><b>${label(s)}</b>${badge(need,list.length)}</div><p>ต้องใช้ <strong>${need??'—'}</strong> · จัดแล้ว <strong>${list.length}</strong> คน</p><form data-mp-target="${esc(m.id)}" data-shift="${s}" class="mp-target no-print"><label>อัตราที่ต้องใช้ (คน)<input name="required" type="number" min="0" max="999" step="1" value="${esc(draft?.required??need??'')}" placeholder="ยังไม่กำหนด"></label><label>เกณฑ์ / ปริมาณงาน<input name="basis" maxlength="300" value="${esc(draft?.basis??m.manpower?.basis??'')}" placeholder="เช่น 1 คน/เครื่อง ตาม WI"></label><button>บันทึกอัตรา</button></form><div class="mp-people">${list.map(e=>person(e,m,s)).join('')||'<p class="mp-muted">ยังไม่มีผู้รับผิดชอบ</p>'}</div><form data-mp-assign="${esc(m.id)}" data-shift="${s}" class="mp-assign no-print"><label>พนักงานเข้าเครื่อง<select name="employee" required><option value="">เลือกชื่อ / รหัสพนักงาน</option></select></label><button>จัดคน / ย้ายมาเครื่องนี้</button></form></div>`}).join('')}${m.manpower?.basis?'<p class="mp-muted">เกณฑ์: '+esc(m.manpower.basis)+'</p>':''}</article>`}
 function drawSafe(){if(root?.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea')){refreshPending=true;return}draw()}
 function lock(){root?.querySelectorAll('form input,form select,form button,[data-mp-remove]').forEach(el=>el.disabled=busy||!ready||!admin())}
 function draw(){
  if(!root?.isConnected)return;refreshPending=false;const people=roster(),ms=machines(),names=sectionNames(people,ms);if(section&&!names.includes(section))section='';
  const ss=shownShifts(),chosen=section?[section]:names;prepareEmployeeOptions(people,ms);
  root.innerHTML=`<div class="page-head"><div><h2>ผังกำลังคนแยก Section</h2><p>กำหนดอัตราต่อเครื่องและจุดงาน · จัดคนเข้าเครื่อง · ทบทวนการเพิ่มคนหรือย้ายกำลังคน</p></div></div><div class="mp-toolbar no-print"><label>Section<select id="mpSection"><option value="">ทุก Section</option>${names.map(s=>`<option value="${esc(s)}" ${s===section?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label>กะ<select id="mpShift"><option value="day" ${shift==='day'?'selected':''}>กะเช้า</option><option value="night" ${shift==='night'?'selected':''}>กะดึก</option><option value="all" ${shift==='all'?'selected':''}>ทั้งสองกะ</option></select></label><button id="mpReload" class="secondary">โหลดข้อมูลล่าสุด</button><button id="mpPrint" class="secondary">พิมพ์ผังกำลังคน</button><button id="mpExport" class="secondary">ส่งออก CSV</button><button id="mpLayout" class="secondary">เปิด Layout โรงงาน</button></div><p class="mp-status" role="status" data-mp-status>${esc(message)}</p><p class="mp-muted">อัตราว่าง = ยังไม่ประเมิน · 0 = ไม่ใช้คนในกะนี้ · เพิ่มจุดงานหัวหน้า / ช่าง / Support ให้ครบก่อนเทียบกับจำนวนคนทั้ง Section · ตัวเลขนี้เป็นแผนจัดคน ไม่ใช่ผลเช็คชื่อ</p><div class="mp-scroll"><table class="mp-summary"><caption>สรุปอัตรากำลัง ${shift==='all'?'ทั้งสองกะ':label(shift)}</caption><thead><tr><th>Section</th><th>คนใน Section<br>ทุกกะ</th><th>ต้องใช้</th><th>จัดแล้ว<br>คนไม่ซ้ำ</th><th>ขาดที่จุดงาน</th><th>เกินที่จุดงาน</th><th>ทบทวนกำลังคนทั้ง Section</th></tr></thead><tbody>${chosen.map(s=>{const p=people.filter(e=>e.section===s),m=ms.filter(m=>m.section===s),a=summary(m,p,ss),whole=summary(m,p,['day','night']);const review=!m.length||whole.unknown?'กำหนดอัตราทั้งสองกะให้ครบ':whole.duplicates.length?'ตรวจคนประจำหลายเครื่อง / หลายกะ':whole.required>p.length?'พิจารณาเพิ่ม '+(whole.required-p.length)+' คน':whole.required<p.length?'ทบทวนย้าย / ลดอัตรา '+(p.length-whole.required)+' คน':'จำนวนรวมสมดุล';return `<tr><th><button class="secondary" data-mp-section="${esc(s)}">${esc(s)}</button></th><td>${p.length}</td><td>${!m.length?'—':a.required+(a.unknown?' + ?':'')}</td><td>${a.placed}</td><td class="mp-red">${a.shortage}</td><td class="mp-amber">${a.excess}</td><td>${esc(review)}${a.unknown?'<small>ยังไม่กำหนด '+a.unknown+' จุด/กะ</small>':''}</td></tr>`}).join('')}</tbody></table></div><p class="mp-muted">คนขาดที่จุดงานอาจจัดจากคนว่างหรือจุดที่เกินได้ก่อนเพิ่มคน · ข้อเสนอเทียบอัตราเช้า + ดึกกับรายชื่อทั้งหมด ต้องทบทวนภาระงาน ทักษะ วันหยุด และคนทดแทนก่อนตัดสินใจ</p><div class="mp-sections">${chosen.map(s=>{const p=people.filter(e=>e.section===s),m=ms.filter(m=>m.section===s),a=summary(m,p,['day','night']);return `<section class="mp-section"><header class="mp-section-head"><div><h3>${esc(s)}</h3><p>พนักงานทั้งหมด ${p.length} คน · ยังไม่จัดทั้งสองกะ ${a.unassigned.length} คน</p></div></header>${a.duplicates.length?'<p class="mp-alert">พบคนประจำหลายเครื่อง / หลายกะ '+a.duplicates.map(esc).join(', ')+' — ตรวจสอบการแบ่งเวลาทำงานก่อนสรุปอัตรา</p>':''}<div class="mp-section-actions no-print"><button type="button" data-mp-new-person="${esc(s)}">เพิ่มพนักงานใน Section นี้</button></div><div class="mp-branch"></div><div class="mp-grid">${m.map(x=>machineCard(x,p)).join('')||'<p class="mp-empty">ยังไม่มีเครื่องหรือจุดงาน เพิ่มเครื่อง / งานสนับสนุนด้านล่าง แล้วกำหนดอัตราของแต่ละกะ</p>'}</div><details class="mp-pool"><summary>รายชื่อที่ยังไม่จัดทั้งสองกะ (${a.unassigned.length} คน)</summary><div>${a.unassigned.map(e=>`<span>${esc(e.id)} · ${esc(e.thaiName||e.name)} <small>${esc(e.position||'')}</small></span>`).join('')||'จัดครบแล้ว'}</div></details><form class="mp-add no-print" data-mp-add="${esc(s)}"><label>เพิ่มเครื่อง / จุดงาน<input name="name" required maxlength="100" placeholder="เช่น CNC-01 / หัวหน้า / ช่างซ่อม"></label><button>เพิ่มจุดงาน</button></form></section>`}).join('')}</div>${!chosen.length?'<p class="mp-empty">ยังไม่มี Section ใน Division ที่เลือก กรุณาเพิ่ม Section หรือพนักงานในหน้าผังโรงงาน</p>':''}`;
  root.querySelector('#mpSection').onchange=e=>{section=e.target.value;draw()};root.querySelector('#mpShift').onchange=e=>{shift=e.target.value;draw()};root.querySelector('#mpReload').onclick=()=>void load();root.querySelector('#mpPrint').onclick=()=>window.print();root.querySelector('#mpExport').onclick=exportCsv;root.querySelector('#mpLayout').onclick=()=>document.querySelector('#nav [data-page="factoryLayout"]')?.click();lock();
 }
 function exportCsv(){
  const rows=[['Section','เครื่อง/จุดงาน','กะ','อัตราที่ต้องใช้','จำนวนจัดแล้ว','ขาด','เกิน','รหัสพนักงาน','ชื่อพนักงาน','ตำแหน่ง','เกณฑ์']];
  for(const m of machines().filter(m=>!section||m.section===section))for(const s of shownShifts()){const list=assigned(m,s),n=target(m,s);for(const e of list.length?list:[{}])rows.push([m.section,m.name,label(s),n??'',list.length,n===null?'':Math.max(0,n-list.length),n===null?'':Math.max(0,list.length-n),e.id||'',e.thaiName||e.name||'',e.position||'',m.manpower?.basis||''])}
  const safe=v=>{const text=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"'};
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Manpower_Section_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function mount(){
  const next=document.getElementById('manpowerPlanningPage');if(root===next)return;clearInterval(timer);root=next;generation++;if(!root)return;
  ready=false;try{data=normalize(JSON.parse(localStorage.getItem(CACHE)||'null'))}catch{data=normalize(null)}message='กำลังโหลดข้อมูลกลาง...';
  root.addEventListener('focusin',populateEmployeeSelect);root.addEventListener('pointerdown',populateEmployeeSelect,true);root.addEventListener('mousedown',populateEmployeeSelect,true);
  root.addEventListener('input',e=>{const f=e.target.closest('[data-mp-target]');if(f)drafts.set(f.dataset.mpTarget+'::'+f.dataset.shift,{required:f.elements.required.value,basis:f.elements.basis.value})});
  root.addEventListener('submit',async e=>{
   const f=e.target;if(!f.matches('form'))return;e.preventDefault();if(busy)return;
   if(f.hasAttribute('data-mp-target')){const raw=f.elements.required.value,n=raw===''?null:Number(raw),basis=f.elements.basis.value,id=f.dataset.mpTarget,s=f.dataset.shift;if(await save(d=>setTarget(d,id,s,n,basis))){drafts.delete(id+'::'+s);draw()}}
   if(f.hasAttribute('data-mp-assign')){const id=f.dataset.mpAssign,s=f.dataset.shift,employee=f.elements.employee.value;if(employee)await save(d=>move(d,id,s,employee))}
   if(f.hasAttribute('data-mp-add')){const name=f.elements.name.value.trim(),sec=f.dataset.mpAdd,scope={...rt().organizationScope()},id='mp_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));if(name)await save(d=>{if(!sectionNames().includes(sec))throw Error('ไม่พบ Section');d.machines[id]={name,section:sec,...scope,kind:'workstation',assignments:{}}})}
  });
  root.addEventListener('click',async e=>{const remove=e.target.closest('[data-mp-remove]'),choice=e.target.closest('[data-mp-section]'),person=e.target.closest('[data-mp-new-person]');if(person&&!busy&&admin())rt()?.openManpowerEmployeeForm?.(person.dataset.mpNewPerson);if(remove){const {machine,shift:s,mpRemove:id}=remove.dataset;await save(d=>unassign(d,machine,s,id))}if(choice){section=choice.dataset.mpSection;draw()}});
  root.addEventListener('focusout',()=>setTimeout(()=>{if(refreshPending)drawSafe()},0));draw();void load();timer=setInterval(()=>void load(),15000);
 }
 window.addEventListener('ppms-employees-changed',drawSafe);window.addEventListener('ppms-organization-scope-changed',drawSafe);
 window.addEventListener('storage',e=>{if(e.key===CACHE)void load()});
 document.addEventListener('click',event=>{if(event.target.closest?.('#nav [data-page="manpower"]'))document.activeElement?.blur?.()},true);
 window.PPMS_MANPOWER={page:()=>'<section id="manpowerPlanningPage"></section>',mount,summary,setTarget,move,unassign};
 // A late asset load can follow the main bundle's temporary loading page.
 document.querySelector('#nav [data-page="manpower"].active')?.click();
})();
