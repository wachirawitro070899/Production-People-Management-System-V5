/* Manpower targets and assignments share the existing factory-layout cloud document. */
(()=>{
 'use strict';
 const PATH='ppmsFactoryLayout/v1', CACHE='ppms_factory_layout_v1';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rt=()=>window.PPMS_RUNTIME, admin=()=>rt()?.factoryLayoutIsAdmin?.()===true;
 const inScope=m=>!window.PPMSOrganizationScope||window.PPMSOrganizationScope.contains(m);
 const normalize=d=>({...d,machines:d?.machines&&typeof d.machines==='object'?d.machines:{},manpowerGroups:d?.manpowerGroups&&typeof d.manpowerGroups==='object'?d.manpowerGroups:{}});
 const shiftOf=a=>a?.shift==='night'?'night':'day';
 const label=s=>s==='night'?'กะดึก':'กะเช้า';
 const target=(m,s)=>Number.isInteger(m.manpower?.[s])&&m.manpower[s]>=0?m.manpower[s]:null;
 const roster=()=>{const gone=new Set((rt()?.factoryLayoutDeletedEmployeeIds?.()||[]).map(String));return (rt()?.factoryLayoutEmployees?.()||[]).filter(e=>e?.id!=null&&!gone.has(String(e.id)))};
 const machines=(d=data)=>Object.entries(d.machines).filter(([,m])=>m&&inScope(m)).map(([id,m])=>({...m,id}));
 function workpoints(d=data){
  const all=machines(d),byId=new Map(all.map(m=>[m.id,m])),claimed=new Set(),result=[];
  for(const [id,g]of Object.entries(d.manpowerGroups||{})){
   if(!g||!inScope(g)||!Array.isArray(g.machineIds))continue;
   const members=[...new Set(g.machineIds)].map(key=>byId.get(key)).filter(m=>m&&m.section===g.section&&!claimed.has(m.id));if(!members.length)continue;
   const assignments={};for(const m of members){claimed.add(m.id);for(const [key,a]of Object.entries(m.assignments||{}))assignments[m.id+'::'+key]=a}
   result.push({...g,id,isGroup:true,members,machineIds:members.map(m=>m.id),assignments});
  }
  return [...result,...all.filter(m=>!claimed.has(m.id))].sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),'th',{numeric:true}));
 }
 function validPoint(d,id){const p=workpoints(d).find(p=>p.id===id);if(!p)throw Error('ไม่พบเครื่องหรือกลุ่มเครื่อง กรุณาโหลดข้อมูลใหม่');return p}
 function renamePoint(d,id,name,expectedName){
  const point=validPoint(d,id),value=String(name||'').trim();
  if(!value||value.length>100)throw Error('ระบุชื่อเครื่อง / จุดงาน 1–100 ตัวอักษร');
  if((point.name||'')!==expectedName)throw Error('ชื่อถูกแก้ไขจากเครื่องอื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนแก้ไขอีกครั้ง');
  const key=v=>String(v||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  const others=[...machines(d),...Object.entries(d.manpowerGroups||{}).filter(([,g])=>g&&inScope(g)).map(([id,g])=>({...g,id}))];
  if(others.some(m=>m.id!==id&&m.section===point.section&&key(m.name)===key(value)))throw Error('ชื่อนี้มีอยู่แล้วใน Section เดียวกัน กรุณาใช้ชื่ออื่น');
  const record=point.isGroup?d.manpowerGroups[id]:d.machines[id];record.name=value;
 }
 function renameForm(m){
  const draft=nameDrafts.get(m.id);
  return `<details class="mp-name-settings no-print" ${draft?'open':''}><summary>แก้ไขชื่อ</summary><form data-mp-rename="${esc(m.id)}" data-previous-name="${esc(draft?.previousName??m.name??'')}"><label>ชื่อเครื่อง / จุดงาน / กลุ่มเครื่อง<input name="pointName" required maxlength="100" value="${esc(draft?.name??m.name??'')}" aria-label="ชื่อใหม่ของ ${esc(m.name||m.id)}"></label><button>บันทึกชื่อ</button><button type="button" class="secondary" data-mp-name-cancel>ยกเลิก</button></form></details>`;
 }
 function saveGroup(d,id,sec,name,ids,required){
  const unique=[...new Set(ids)],all=machines(d),byId=new Map(all.map(m=>[m.id,m]));
  if(unique.length<2)throw Error('เลือกเครื่องอย่างน้อย 2 เครื่อง');
  if(!String(name||'').trim()||String(name).trim().length>100)throw Error('ระบุชื่อกลุ่มเครื่องไม่เกิน 100 ตัวอักษร');
  if(!(required===null||(Number.isInteger(required)&&required>=0&&required<=999)))throw Error('จำนวนคนต้องเป็นจำนวนเต็ม 0–999');
  if(id&&(!d.manpowerGroups?.[id]||!inScope(d.manpowerGroups[id])||d.manpowerGroups[id].section!==sec))throw Error('ไม่พบกลุ่มเครื่องใน Section ที่เลือก');
  for(const key of unique){const m=byId.get(key);if(!m||m.section!==sec)throw Error('รวมได้เฉพาะเครื่องใน Section เดียวกัน');if(m.kind==='support')throw Error('จุด Support ต้องแยกจากกลุ่มเครื่อง');for(const [other,g]of Object.entries(d.manpowerGroups||{}))if(other!==id&&Array.isArray(g?.machineIds)&&g.machineIds.includes(key))throw Error('มีเครื่องที่ถูกจัดเข้ากลุ่มอื่นแล้ว กรุณาโหลดข้อมูลใหม่')}
  const first=byId.get(unique[0]),scope=rt()?.organizationScope?.()||{},groupId=id||'grp_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));
  if(d.machines[groupId])throw Error('รหัสกลุ่มซ้ำ กรุณาลองใหม่');
  d.manpowerGroups||={};const old=d.manpowerGroups[groupId]||{};
  d.manpowerGroups[groupId]={...old,name:String(name).trim(),section:sec,division:first.division||first.organizationDivision||scope.division||'Production Division',plant:first.plant||first.organizationPlant||scope.plant||'โรง 1',machineIds:unique,manpower:{...old.manpower,total:required},updatedAt:new Date().toISOString()};return groupId;
 }
 function dissolveGroup(d,id){const g=d.manpowerGroups?.[id];if(!g||!inScope(g))throw Error('ไม่พบกลุ่มเครื่อง');delete d.manpowerGroups[id]}
 function setPointTotal(d,id,value,basis){
  const point=validPoint(d,id);if(!point.isGroup)return setTotal(d,id,value,basis);
  if(!(value===null||(Number.isInteger(value)&&value>=0&&value<=999)))throw Error('จำนวนคนต้องเป็นจำนวนเต็ม 0–999');
  const g=d.manpowerGroups[id];g.manpower={...g.manpower,total:value,basis:String(basis||'').trim().slice(0,300)};
 }
 function moveToPoint(d,id,employeeId,source){
  const point=validPoint(d,id);let actualSource=source;
  if(source){const from=validPoint(d,source);if(from.isGroup){actualSource=from.members.find(m=>Object.values(m.assignments||{}).some(a=>String(a?.employeeId)===String(employeeId)))?.id;if(!actualSource)throw Error('ตำแหน่งพนักงานเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่')}}
  return moveCombined(d,point.isGroup?point.machineIds[0]:point.id,employeeId,actualSource);
 }
 function unassignPoint(d,id,employeeId,check=false){
  const point=validPoint(d,id);if(!point.isGroup)return unassignCombined(d,id,employeeId,check);
  const found=point.members.some(m=>Object.values(m.assignments||{}).some(a=>String(a?.employeeId)===String(employeeId)));if(check&&!found)throw Error('ตำแหน่งพนักงานเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่');
  for(const m of point.members)unassignCombined(d,m.id,employeeId);
 }
 function availableGroupMachines(sec,id=''){
  const used=new Set(Object.entries(data.manpowerGroups||{}).filter(([key])=>key!==id).flatMap(([,g])=>Array.isArray(g?.machineIds)?g.machineIds:[]));
  return machines().filter(m=>m.section===sec&&m.kind!=='support'&&!used.has(m.id)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'th',{numeric:true}));
 }
 function groupForm(sec,g=null){
  const available=availableGroupMachines(sec,g?.id),chosen=new Set(g?.machineIds||[]);
  if(available.length<2&&!g)return '';
  return `<details class="mp-group-settings no-print"><summary>${g?'แก้ไขเครื่องในกลุ่ม':'รวมเครื่องเป็นกลุ่ม'}</summary><form data-mp-group="${esc(g?.id||'')}" data-section="${esc(sec)}"><label>ชื่อกลุ่มเครื่อง<input name="groupName" required maxlength="100" value="${esc(g?.name||'')}" placeholder="เช่น เครื่องเล็ก 1–6"></label><label>จำนวนคนที่ใช้ร่วมกัน<input name="required" type="number" min="0" max="999" step="1" value="${g?combinedTarget(g)??'':3}" placeholder="ยังไม่กำหนด"></label><fieldset><legend>เลือกเครื่องที่ใช้คนร่วมกัน</legend><div class="mp-group-choices">${available.map(m=>`<label><input type="checkbox" name="machineIds" value="${esc(m.id)}" ${chosen.has(m.id)?'checked':''}>${esc(m.name||m.id)}</label>`).join('')}</div></fieldset><button>บันทึกกลุ่มเครื่อง</button>${g?`<button type="button" class="secondary" data-mp-dissolve="${esc(g.id)}">ยกเลิกการรวมเครื่อง</button>`:''}</form></details>`;
 }
 function smallMachineIds(sec){
  if(!/stamping|ปั๊ม|ปั้ม/i.test(sec))return [];
  const byNumber=new Map();for(const m of availableGroupMachines(sec)){const match=String(m.name||'').match(/(?:^|[^0-9])([1-6])(?:[^0-9]|$)/);if(match&&!byNumber.has(Number(match[1])))byNumber.set(Number(match[1]),m.id)}
  return [1,2,3,4,5,6].every(n=>byNumber.has(n))?[1,2,3,4,5,6].map(n=>byNumber.get(n)):[];
 }
 function assigned(m,s,people=roster()) {const ids=new Set(Object.values(m.assignments||{}).filter(a=>shiftOf(a)===s).map(a=>String(a?.employeeId)));return people.filter(e=>e.section===m.section&&ids.has(String(e.id)))}
 function summary(ms,people,shifts) {
  let required=0,unknown=0,shortage=0,excess=0;const placed=new Set(), occurrences=new Map();
  for(const m of ms)for(const s of shifts){const need=target(m,s),list=assigned(m,s,people);if(need===null)unknown++;else{required+=need;shortage+=Math.max(0,need-list.length);excess+=Math.max(0,list.length-need)}for(const e of list){const id=String(e.id);placed.add(id);occurrences.set(id,(occurrences.get(id)||0)+1)}}
  return {required,unknown,shortage,excess,placed:placed.size,duplicates:[...occurrences].filter(([,n])=>n>1).map(([id])=>id),unassigned:people.filter(e=>!placed.has(String(e.id)))};
 }
 const drafts=new Map(),nameDrafts=new Map(),employeeOptions=new Map();let localTeamFilter='all';
 const teamFilter=()=>window.PPMS_WORKPLACE_TEAMS?.filter()||localTeamFilter;
 const visiblePeople=people=>window.PPMS_WORKPLACE_TEAMS?.filterPeople(people)||people.filter(e=>teamFilter()==='all'||(teamFilter()==='none'?!employeeTeam(e):employeeTeam(e)===teamFilter()));
 let dragState=null,picked=null,pointer=null,ghost=null,suppressClickUntil=0;
 let data=normalize(null),root=null,section='',ready=false,busy=false,message='กำลังโหลดข้อมูล...',timer=null,loading=false,generation=0,refreshPending=false;
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
 function employeeTeam(e){
  const parse=v=>{const key=String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'');return ['teama','ทีมa','a'].includes(key)?'A':['teamb','ทีมb','b'].includes(key)?'B':''};
  if(e.section==='Stamping Section'&&Object.hasOwn(e,'stampingShift'))return parse(e.stampingShift);
  if(Object.hasOwn(e,'organizationTeam'))return parse(e.organizationTeam);
  return [e.team,e.shiftTeam,e.shift].map(parse).find(Boolean)||'';
 }
 function combinedTarget(m){
  if(Object.hasOwn(m.manpower||{},'total'))return Number.isInteger(m.manpower.total)&&m.manpower.total>=0?m.manpower.total:null;
  const day=target(m,'day'),night=target(m,'night');return day!==null&&night!==null?day+night:null;
 }
 function combinedPeople(m,people=roster()){
  const ids=new Set(Object.values(m.assignments||{}).map(a=>String(a?.employeeId)));return people.filter(e=>e.section===m.section&&ids.has(String(e.id)));
 }
 function combinedSummary(ms,people){
  let required=0,unknown=0,shortage=0,excess=0;const placed=new Set(),occurrences=new Map();
  for(const m of ms){const need=combinedTarget(m),list=combinedPeople(m,people);if(need===null)unknown++;else{required+=need;shortage+=Math.max(0,need-list.length);excess+=Math.max(0,list.length-need)}for(const e of list){const id=String(e.id);placed.add(id);occurrences.set(id,(occurrences.get(id)||0)+1)}}
  return {required,unknown,shortage,excess,placed:placed.size,duplicates:[...occurrences].filter(([,n])=>n>1).map(([id])=>id),unassigned:people.filter(e=>!placed.has(String(e.id)))};
 }
 function setTotal(d,id,value,basis){
  const m=validMachine(d,id);if(!(value===null||(Number.isInteger(value)&&value>=0&&value<=999)))throw Error('จำนวนคนต้องเป็นจำนวนเต็ม 0–999');
  m.manpower={...m.manpower,total:value,basis:String(basis||'').trim().slice(0,300)};
 }
 function moveCombined(d,id,employeeId,source){
  const m=validMachine(d,id),e=roster().find(e=>String(e.id)===String(employeeId));if(!e||e.section!==m.section)throw Error('ย้ายได้เฉพาะเครื่องใน Section เดียวกับพนักงาน');
  const all=machines(d),matches=[];
  for(const other of all)for(const a of Object.values(other.assignments||{}))if(String(a?.employeeId)===String(e.id))matches.push({machine:other.id,assignment:a});
  if(source!==undefined){
   if(source&&!matches.some(x=>x.machine===source))throw Error('ตำแหน่งพนักงานเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่');
   if(!source&&matches.length)throw Error('พนักงานถูกจัดเข้าเครื่องแล้ว กรุณาโหลดข้อมูลใหม่');
  }
  const records=new Map();
  for(const row of matches){const value=shiftOf(row.assignment);if(!records.has(value)||row.machine===source)records.set(value,{...row.assignment})}
  if(!records.size)records.set('day',{employeeId:String(e.id),shift:'day',assignedAt:new Date().toISOString()});
  // Keep existing Layout shift records and employee teams while moving their workplace.
  if(m.kind==='support')for(const value of records.keys())if(assigned(m,value).some(x=>String(x.id)!==String(e.id)))throw Error('จุด Support นี้มีคนครบแล้ว');
  for(const other of all)for(const [key,a] of Object.entries(other.assignments||{}))if(String(a?.employeeId)===String(e.id))delete d.machines[other.id].assignments[key];
  m.assignments||={};const now=new Date().toISOString();
  for(const [value,a]of records){delete a.x;delete a.y;delete a.mapId;const key=value+'_e_'+Array.from(String(e.id)).map(c=>c.codePointAt(0).toString(16)).join('_');m.assignments[key]={...a,employeeId:String(e.id),shift:value,movedAt:now,...(source?{movedFrom:source}:{})}}
 }
 function unassignCombined(d,id,employeeId,check=false){const m=validMachine(d,id);if(check&&!Object.values(m.assignments||{}).some(a=>String(a?.employeeId)===String(employeeId)))throw Error('ตำแหน่งพนักงานเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่');for(const [key,a]of Object.entries(m.assignments||{}))if(String(a?.employeeId)===String(employeeId))delete m.assignments[key]}
 function badge(need,count){return need===null?'<span class="mp-tag">ยังไม่กำหนดอัตรา</span>':need>count?`<span class="mp-tag mp-red">ขาด ${need-count} คน</span>`:need<count?`<span class="mp-tag mp-amber">เกินอัตรา ${count-need} คน</span>`:'<span class="mp-tag mp-green">ครบอัตรา</span>'}
 function person(e,m=null){
  const id=String(e.id),src=String(e.photoData||e.photoUrl||e.photo||''),team=employeeTeam(e),photo=/^(https?:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(src)?`<img src="${esc(src)}" alt="" loading="lazy" draggable="false">`:'<span class="mp-avatar">'+esc(String(e.name||'?')[0])+'</span>';
  return `<div class="mp-person${picked?.id===id?' mp-picked':''}" data-mp-person="${esc(id)}" data-mp-source="${esc(m?.id||'')}" data-section="${esc(e.section)}" draggable="${admin()&&ready&&!busy}" tabindex="0" aria-label="ย้าย ${esc(e.thaiName||e.name)}${team?' '+team:''}">${photo}<span><b>${esc(e.thaiName||e.name)}${window.PPMS_WORKPLACE_TEAMS?.control(e)||(team?' <span class="mp-team" data-mp-team="'+team+'">'+team+'</span>':'')}</b><small>${esc(e.id)} · ${esc(e.position||'')}</small></span><span class="mp-person-actions no-print"><button type="button" data-mp-pick aria-label="ลากหรือเลือกย้าย ${esc(e.name)}">ย้าย</button>${m?`<button type="button" class="secondary" data-mp-remove="${esc(e.id)}" data-machine="${esc(m.id)}" aria-label="ยกเลิกประจำเครื่อง ${esc(e.name)}">ยกเลิก</button>`:''}</span></div>`;
 }
 function prepareEmployeeOptions(people,ms){
  employeeOptions.clear();const byId=new Map(people.map(e=>[String(e.id),e])),locations=new Map();
  for(const m of ms)for(const a of Object.values(m.assignments||{})){
   const id=String(a?.employeeId||''),e=byId.get(id);if(!e||e.section!==m.section)continue;
   if(!locations.has(id))locations.set(id,new Set());locations.get(id).add(m.name);
  }
  for(const e of visiblePeople(people)){const existing=[...(locations.get(String(e.id))||[])],team=employeeTeam(e),html=`<option value="${esc(e.id)}">${esc(e.id+' · '+(e.thaiName||e.name)+(team?' '+team:'')+(existing.length?' ['+existing.join(', ')+']':''))}</option>`;employeeOptions.set(e.section,(employeeOptions.get(e.section)||'')+html)}
 }
 function populateEmployeeSelect(event){
  const select=event.target.closest?.('[data-mp-assign] select');if(!select||select.dataset.mpLoaded)return;
  const m=workpoints().find(p=>p.id===select.closest('form').dataset.mpAssign);if(!m)return;
  select.insertAdjacentHTML('beforeend',employeeOptions.get(m.section)||'');select.dataset.mpLoaded='1';
 }
 function machineCard(m,people){
  const list=combinedPeople(m,people),visible=visiblePeople(list),need=combinedTarget(m),draft=drafts.get(m.id+'::total');
  return `<article class="mp-machine${m.isGroup?' mp-machine-group':''}" tabindex="0" data-mp-drop="${esc(m.id)}" data-section="${esc(m.section)}"><h4>${esc(m.name||m.id)} <small>${esc(m.isGroup?'กลุ่มเครื่อง · '+m.members.length+' เครื่อง':m.kind==='support'?'Support':'เครื่อง / จุดงาน')}</small></h4>${renameForm(m)}${m.isGroup?'<div class="mp-group-members">'+m.members.map(x=>'<span>'+esc(x.name||x.id)+'</span>').join('')+'</div>':''}<div class="mp-combined"><div class="mp-row"><p>ต้องใช้ <strong>${need??'—'}</strong> · จัดแล้ว <strong>${list.length}</strong> คน</p>${badge(need,list.length)}</div><div class="mp-people">${teamFilter()!=='all'?'<p class="mp-filter-count">แสดง '+visible.length+' คน · '+(teamFilter()==='none'?'ยังไม่ระบุทีม':'ทีม '+teamFilter())+'</p>':''}${visible.map(e=>person(e,m)).join('')||(list.length?'<p class="mp-drop-empty">ไม่มีพนักงานตรงกับทีมที่เลือก</p>':'<p class="mp-drop-empty">ลากพนักงานมาวางที่เครื่องนี้</p>')}</div><details class="mp-settings no-print"><summary>กำหนดอัตรา / เลือกพนักงาน</summary><form data-mp-target="${esc(m.id)}" data-shift="total" class="mp-target"><label>อัตรารวมที่ต้องใช้ (คน)<input name="required" type="number" min="0" max="999" step="1" value="${esc(draft?.required??need??'')}" placeholder="ยังไม่กำหนด"></label><label>เกณฑ์ / ปริมาณงาน<input name="basis" maxlength="300" value="${esc(draft?.basis??m.manpower?.basis??'')}" placeholder="เช่น จำนวนคนรวมทีม A และ B"></label><button>บันทึกอัตรา</button></form><form data-mp-assign="${esc(m.id)}" class="mp-assign"><label>พนักงานเข้าเครื่อง<select name="employee" required><option value="">เลือกชื่อ / รหัสพนักงาน</option></select></label><button>จัดคน / ย้ายมาเครื่องนี้</button></form></details>${m.isGroup?groupForm(m.section,m):''}</div>${m.manpower?.basis?'<p class="mp-muted">เกณฑ์: '+esc(m.manpower.basis)+'</p>':''}</article>`;
 }
 function drawSafe(){if(dragState||pointer||root?.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea')){refreshPending=true;return}draw()}
 function lock(){
  root?.querySelectorAll('form input,form select,form button,[data-mp-remove],[data-mp-pick],[data-mp-small-group]').forEach(el=>el.disabled=busy||!ready||!admin());
  root?.querySelectorAll('[data-mp-person]').forEach(el=>el.draggable=admin()&&ready&&!busy);
 }
 function draw(){
  if(!root?.isConnected)return;refreshPending=false;const people=roster(),ms=workpoints(),names=sectionNames(people,ms);if(section&&!names.includes(section))section='';
  const chosen=section?[section]:names;prepareEmployeeOptions(people,ms);
  root.innerHTML=`<div class="page-head"><div><h2>ผังกำลังคนแยก Section</h2><p>ลากพนักงานระหว่างเครื่องได้ทันที · แสดงทีม A / B หลังชื่อ</p></div></div><div class="mp-toolbar no-print"><label>Section<select id="mpSection"><option value="">ทุก Section</option>${names.map(s=>`<option value="${esc(s)}" ${s===section?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label>ทีม<select id="mpTeam">${window.PPMS_WORKPLACE_TEAMS?.options()||'<option value="all">รวมทีม</option><option value="A">ทีม A</option><option value="B">ทีม B</option><option value="none">ยังไม่ระบุทีม</option>'}</select></label><button id="mpReload" class="secondary">โหลดข้อมูลล่าสุด</button><button id="mpPrint" class="secondary">พิมพ์ผังกำลังคน</button><button id="mpExport" class="secondary">ส่งออก CSV</button><button id="mpLayout" class="secondary">เปิด Layout โรงงาน</button></div><p class="mp-status" role="status" data-mp-status>${esc(message)}</p><p class="mp-muted">ลากการ์ดชื่อไปวางบนเครื่องปลายทาง หรือลากกลับพื้นที่ยังไม่ประจำเครื่อง · มือถือแตะ “ย้าย” แล้วแตะเครื่องปลายทาง · เปลี่ยน A/B ที่ชื่อเพื่อแก้ทีมใน Layout ด้วย · ตัวกรองทีมใช้แสดงรายชื่อ ยอดกำลังคนเป็นยอดรวม</p><div class="mp-scroll"><table class="mp-summary"><caption>สรุปอัตรากำลังรวม</caption><thead><tr><th>Section</th><th>คนใน Section</th><th>ต้องใช้</th><th>จัดแล้ว<br>คนไม่ซ้ำ</th><th>ขาดที่จุดงาน</th><th>เกินที่จุดงาน</th><th>ทบทวนกำลังคนทั้ง Section</th></tr></thead><tbody>${chosen.map(s=>{
   const p=people.filter(e=>e.section===s),m=ms.filter(m=>m.section===s),a=combinedSummary(m,p),review=!m.length||a.unknown?'กำหนดอัตรารวมให้ครบ':a.duplicates.length?'ตรวจคนประจำหลายเครื่อง':a.required>p.length?'พิจารณาเพิ่ม '+(a.required-p.length)+' คน':a.required<p.length?'ทบทวนย้าย / ลดอัตรา '+(p.length-a.required)+' คน':'จำนวนรวมสมดุล';
   return `<tr><th><button class="secondary" data-mp-section="${esc(s)}">${esc(s)}</button></th><td>${p.length}</td><td>${!m.length?'—':a.required+(a.unknown?' + ?':'')}</td><td>${a.placed}</td><td class="mp-red">${a.shortage}</td><td class="mp-amber">${a.excess}</td><td>${esc(review)}${a.unknown?'<small>ยังไม่กำหนด '+a.unknown+' จุดงาน</small>':''}</td></tr>`
  }).join('')}</tbody></table></div><p class="mp-muted">อัตราว่าง = ยังไม่ประเมิน · 0 = ไม่ใช้คน · กลุ่มเครื่องคิดอัตรากำลังร่วมกันเพียงครั้งเดียว · ทบทวนภาระงาน ทักษะ และคนทดแทนก่อนเพิ่มหรือลดคน</p><div class="mp-sections">${chosen.map(s=>{
   const p=people.filter(e=>e.section===s),m=ms.filter(m=>m.section===s),a=combinedSummary(m,p);
   return `<section class="mp-section"><header class="mp-section-head"><div><h3>${esc(s)}</h3><p>พนักงานทั้งหมด ${p.length} คน · ยังไม่ประจำเครื่อง ${a.unassigned.length} คน</p></div></header>${a.duplicates.length?'<p class="mp-alert">พบคนประจำหลายเครื่อง '+a.duplicates.map(esc).join(', ')+' — ลากไปเครื่องที่รับผิดชอบเพื่อรวมรายการ</p>':''}<div class="mp-section-actions no-print"><button type="button" data-mp-new-person="${esc(s)}">เพิ่มพนักงานใน Section นี้</button></div><div class="mp-group-tools no-print">${smallMachineIds(s).length?'<button type="button" data-mp-small-group="'+esc(s)+'">รวมเครื่อง 1–6 · ใช้ 3 คน</button>':''}${groupForm(s)}</div><div class="mp-branch"></div><div class="mp-grid">${m.map(x=>machineCard(x,p)).join('')||'<p class="mp-empty">ยังไม่มีเครื่องหรือจุดงาน เพิ่มเครื่อง / งานสนับสนุนด้านล่าง แล้วกำหนดอัตราที่ต้องใช้</p>'}</div><section class="mp-pool" tabindex="0" data-mp-pool data-section="${esc(s)}"><h4>ยังไม่ประจำเครื่อง (${visiblePeople(a.unassigned).length}${teamFilter()!=='all'?' / รวม '+a.unassigned.length:''} คน)</h4><p class="mp-muted">ลากชื่อไปวางบนเครื่อง หรือลากกลับมาพักไว้ที่นี่</p><div>${visiblePeople(a.unassigned).map(e=>person(e)).join('')||(a.unassigned.length?'<p class="mp-drop-empty">ไม่มีพนักงานตรงกับทีมที่เลือก</p>':'<p class="mp-drop-empty">จัดครบแล้ว · ลากคนกลับมาพักไว้ที่นี่ได้</p>')}</div></section><form class="mp-add no-print" data-mp-add="${esc(s)}"><label>เพิ่มเครื่อง / จุดงาน<input name="name" required maxlength="100" placeholder="เช่น CNC-01 / หัวหน้า / ช่างซ่อม"></label><button>เพิ่มจุดงาน</button></form></section>`
  }).join('')}</div>${!chosen.length?'<p class="mp-empty">ยังไม่มี Section ใน Division ที่เลือก กรุณาเพิ่ม Section หรือพนักงานในหน้าผังโรงงาน</p>':''}`;
  root.querySelector('#mpTeam').value=teamFilter();root.querySelector('#mpTeam').onchange=e=>{localTeamFilter=e.target.value;picked=null;if(window.PPMS_WORKPLACE_TEAMS)window.PPMS_WORKPLACE_TEAMS.setFilter(localTeamFilter);else draw()};
  root.querySelector('#mpSection').onchange=e=>{picked=null;section=e.target.value;rememberSection();draw()};root.querySelector('#mpReload').onclick=()=>void load();root.querySelector('#mpPrint').onclick=()=>window.print();root.querySelector('#mpExport').onclick=exportCsv;root.querySelector('#mpLayout').onclick=()=>document.querySelector('#nav [data-page="factoryLayout"]')?.click();lock();
 }
 function exportCsv(){
  const rows=[['Section','เครื่อง/จุดงาน','อัตรารวมที่ต้องใช้','จำนวนจัดแล้ว','ขาด','เกิน','รหัสพนักงาน','ชื่อพนักงาน','ทีม','ตำแหน่ง','เกณฑ์']];
  for(const m of workpoints().filter(m=>!section||m.section===section)){const list=combinedPeople(m),visible=visiblePeople(list),n=combinedTarget(m);for(const e of visible.length?visible:teamFilter()==='all'?[{}]:[])rows.push([window.PPMSOrganizationScope?.sectionLabel(m.section)||m.section,m.name+(m.isGroup?' ['+m.members.map(x=>x.name||x.id).join(', ')+']':''),n??'',list.length,n===null?'':Math.max(0,n-list.length),n===null?'':Math.max(0,list.length-n),e.id||'',e.thaiName||e.name||'',employeeTeam(e),e.position||'',m.manpower?.basis||''])}
  const safe=v=>{const text=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"'};
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Manpower_Section_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function scopeKey(){return JSON.stringify(rt()?.organizationScope?.()||{})}
 const sectionPreferenceKey=()=>"ppms_manpower_section_v906::"+scopeKey();
 function rememberSection(){sessionStorage.setItem(sectionPreferenceKey(),section)}
 function valueFromCard(card){return card?{id:card.dataset.mpPerson,source:card.dataset.mpSource||'',section:card.dataset.section,scope:scopeKey()}:null}
 function clearTargets(){root?.querySelectorAll('.mp-drop-active').forEach(el=>el.classList.remove('mp-drop-active'))}
 function pickCard(card){
  if(!admin()||!ready||busy||!card)return;picked=valueFromCard(card);
  root.querySelectorAll('[data-mp-person]').forEach(el=>el.classList.toggle('mp-picked',el===card));note('เลือกเครื่องปลายทาง หรือพื้นที่ยังไม่ประจำเครื่อง');
 }
 function dropTarget(el){const target=el?.closest?.('[data-mp-drop],[data-mp-pool]');return root?.contains(target)?target:null}
 async function dropPerson(value,target){
  clearTargets();if(!value||!target||!admin()||!ready||busy)return;
  if(value.scope!==scopeKey()||value.section!==target.dataset.section){note('ย้ายได้เฉพาะเครื่องใน Section เดียวกัน');return}
  const id=target.dataset.mpDrop||'';picked=null;
  if(!id&&!value.source){drawSafe();return}
  // Dropping onto the same machine also consolidates legacy duplicate placements.
  await save(d=>id?moveToPoint(d,id,value.id,value.source):unassignPoint(d,value.source,value.id,true));
 }
 function bindMoving(){
  root.addEventListener('dragstart',event=>{
   const card=event.target.closest('[data-mp-person]');if(!card)return;
   if(!admin()||!ready||busy||event.target.closest('button,select,input')){event.preventDefault();return}
   dragState=valueFromCard(card);picked=null;event.dataTransfer?.setData('application/x-ppms-manpower',dragState.id);event.dataTransfer?.setData('text/plain',dragState.id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';card.classList.add('mp-dragging');
  });
  root.addEventListener('dragover',event=>{const target=dropTarget(event.target);if(!dragState||!target||target.dataset.section!==dragState.section)return;event.preventDefault();clearTargets();target.classList.add('mp-drop-active');if(event.dataTransfer)event.dataTransfer.dropEffect='move'});
  root.addEventListener('drop',event=>{const target=dropTarget(event.target);if(!dragState||!target)return;event.preventDefault();event.stopPropagation();const value=dragState;dragState=null;suppressClickUntil=Date.now()+400;void dropPerson(value,target)});
  root.addEventListener('dragend',()=>{dragState=null;clearTargets();root?.querySelectorAll('.mp-dragging').forEach(el=>el.classList.remove('mp-dragging'));if(refreshPending)drawSafe()});
  root.addEventListener('keydown',event=>{const card=event.target.closest('[data-mp-person]');if(card&&['Enter',' '].includes(event.key)&&(!event.target.closest('button,select,input')||event.target.closest('[data-mp-pick]'))){event.preventDefault();pickCard(card)}if(!card&&picked&&['Enter',' '].includes(event.key)){const target=dropTarget(event.target);if(target){event.preventDefault();void dropPerson(picked,target)}}if(event.key==='Escape'){picked=null;drawSafe()}});
  root.addEventListener('pointerdown',event=>{
   if(!['touch','pen'].includes(event.pointerType)||!event.target.closest('[data-mp-pick]')||!admin()||!ready||busy)return;
   const card=event.target.closest('[data-mp-person]'),button=event.target.closest('button');event.preventDefault();pointer={...valueFromCard(card),card,button,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false,target:null};try{button.setPointerCapture(event.pointerId)}catch{}
  });
  root.addEventListener('pointermove',event=>{
   if(!pointer||pointer.pointerId!==event.pointerId)return;event.preventDefault();if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8)pointer.moved=true;if(!pointer.moved)return;
   if(!ghost){ghost=document.createElement('div');ghost.className='mp-drag-ghost';ghost.textContent=pointer.card.querySelector('b').textContent;document.body.append(ghost)}ghost.style.left=(event.clientX+12)+'px';ghost.style.top=(event.clientY+12)+'px';pointer.target=dropTarget(document.elementFromPoint?.(event.clientX,event.clientY));clearTargets();if(pointer.target?.dataset.section===pointer.section)pointer.target.classList.add('mp-drop-active');
  },{passive:false});
  root.addEventListener('pointerup',event=>{if(!pointer||pointer.pointerId!==event.pointerId)return;event.preventDefault();const value=pointer;endPointer();suppressClickUntil=Date.now()+500;if(value.moved&&value.target)void dropPerson(value,value.target);else if(!value.moved)pickCard(value.card)});
  root.addEventListener('pointercancel',endPointer);
 }
 function endPointer(){if(pointer)try{pointer.button.releasePointerCapture(pointer.pointerId)}catch{}pointer=null;ghost?.remove();ghost=null;clearTargets()}
 function mount(){
  const next=document.getElementById('manpowerPlanningPage');if(root===next)return;clearInterval(timer);endPointer();dragState=null;picked=null;root=next;generation++;if(!root)return;
  section=sessionStorage.getItem(sectionPreferenceKey())||'';ready=false;try{data=normalize(JSON.parse(localStorage.getItem(CACHE)||'null'))}catch{data=normalize(null)}message='กำลังโหลดข้อมูลกลาง...';
  root.addEventListener('focusin',populateEmployeeSelect);root.addEventListener('pointerdown',populateEmployeeSelect,true);root.addEventListener('mousedown',populateEmployeeSelect,true);
  root.addEventListener('input',e=>{const rename=e.target.closest('[data-mp-rename]');if(rename)nameDrafts.set(rename.dataset.mpRename,{name:rename.elements.pointName.value,previousName:rename.dataset.previousName});const f=e.target.closest('[data-mp-target]');if(f)drafts.set(f.dataset.mpTarget+'::'+f.dataset.shift,{required:f.elements.required.value,basis:f.elements.basis.value})});
  root.addEventListener('submit',async e=>{
   const f=e.target;if(!f.matches('form'))return;e.preventDefault();if(busy)return;
   if(f.hasAttribute('data-mp-rename')){const id=f.dataset.mpRename,name=f.elements.pointName.value,previousName=f.dataset.previousName;nameDrafts.set(id,{name,previousName});if(await save(d=>renamePoint(d,id,name,previousName))){nameDrafts.delete(id);draw()}return}
   if(f.hasAttribute('data-mp-target')){const raw=f.elements.required.value,n=raw===''?null:Number(raw),basis=f.elements.basis.value,id=f.dataset.mpTarget;if(await save(d=>setPointTotal(d,id,n,basis))){drafts.delete(id+'::total');draw()}}
   if(f.hasAttribute('data-mp-assign')){const id=f.dataset.mpAssign,employee=f.elements.employee.value;if(employee)await save(d=>moveToPoint(d,id,employee))}
   if(f.hasAttribute('data-mp-group')){const id=f.dataset.mpGroup,sec=f.dataset.section,name=f.elements.groupName.value,ids=[...f.querySelectorAll('[name="machineIds"]:checked')].map(el=>el.value),raw=f.elements.required.value,required=raw===''?null:Number(raw);await save(d=>saveGroup(d,id,sec,name,ids,required))}
   if(f.hasAttribute('data-mp-add')){const name=f.elements.name.value.trim(),sec=f.dataset.mpAdd,scope={...rt().organizationScope()},id='mp_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));if(name)await save(d=>{if(!sectionNames().includes(sec))throw Error('ไม่พบ Section');d.machines[id]={name,section:sec,...scope,kind:'workstation',assignments:{}}})}
  });
  bindMoving();
  root.addEventListener('click',async e=>{
   if(Date.now()<suppressClickUntil)return;
   const cancel=e.target.closest('[data-mp-name-cancel]');if(cancel&&!busy){const form=cancel.closest('form');nameDrafts.delete(form.dataset.mpRename);const latest=workpoints().find(m=>m.id===form.dataset.mpRename)?.name||'';form.elements.pointName.value=latest;form.dataset.previousName=latest;form.closest('details').open=false;return}
   const card=e.target.closest('[data-mp-person]');if(e.target.closest('[data-mp-pick]')||card&&!e.target.closest('button,select,input')){pickCard(card);return}
   const destination=dropTarget(e.target);if(picked&&destination&&!e.target.closest('button,input,select,textarea,summary')){await dropPerson(picked,destination);return}
   const dissolve=e.target.closest('[data-mp-dissolve]'),quick=e.target.closest('[data-mp-small-group]');if(dissolve){const id=dissolve.dataset.mpDissolve;await save(d=>dissolveGroup(d,id));return}if(quick){const sec=quick.dataset.mpSmallGroup,ids=smallMachineIds(sec);await save(d=>saveGroup(d,'',sec,'เครื่องเล็ก 1–6',ids,3));return}
   const remove=e.target.closest('[data-mp-remove]'),choice=e.target.closest('[data-mp-section]'),person=e.target.closest('[data-mp-new-person]');if(person&&!busy&&admin())rt()?.openManpowerEmployeeForm?.(person.dataset.mpNewPerson);if(remove){const {machine,mpRemove:id}=remove.dataset;await save(d=>unassignPoint(d,machine,id))}if(choice){section=choice.dataset.mpSection;rememberSection();draw()}});
  root.addEventListener('focusout',()=>setTimeout(()=>{if(refreshPending)drawSafe()},0));draw();void load();timer=setInterval(()=>void load(),15000);
 }
 window.addEventListener('ppms-workplace-team-filter-changed',()=>{picked=null;draw()});window.addEventListener('ppms-workplace-team-status',e=>note(e.detail.text));
 window.addEventListener('ppms-employees-changed',drawSafe);window.addEventListener('ppms-organization-scope-changed',()=>{section=sessionStorage.getItem(sectionPreferenceKey())||'';endPointer();dragState=null;picked=null;drawSafe()});
 window.addEventListener('storage',e=>{if(e.key===CACHE)void load()});
 document.addEventListener('click',event=>{if(event.target.closest?.('#nav [data-page="manpower"]'))document.activeElement?.blur?.()},true);
 window.PPMS_MANPOWER={page:()=>'<section id="manpowerPlanningPage"></section>',mount,summary,setTarget,move,unassign,employeeTeam,combinedTarget,combinedPeople,combinedSummary,setTotal,moveCombined,unassignCombined,workpoints,saveGroup,dissolveGroup,moveToPoint,unassignPoint,setPointTotal,renamePoint};
 // A late asset load can follow the main bundle's temporary loading page.
 document.querySelector('#nav [data-page="manpower"].active')?.click();
})();
