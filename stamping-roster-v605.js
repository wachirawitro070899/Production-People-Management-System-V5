// V605: Simple Stamping roster — same list style as other sections, with shift and machine assignment.
(()=>{'use strict';
const STYLE=`
.stamping-v605{margin:12px 0}.stamping-v605-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.stamping-v605-list{display:grid;gap:8px}.stamping-v605-row{display:grid;grid-template-columns:minmax(240px,1.5fr) repeat(5,minmax(115px,.7fr)) auto;gap:8px;align-items:end;padding:10px;border:1px solid #cbd5e1;border-radius:12px;background:#fff}
.stamping-v605-person{display:flex;gap:10px;align-items:center}.stamping-v605-person img,.stamping-v605-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #1976d2}.stamping-v605-avatar{display:grid;place-items:center;background:#eff6ff;color:#1d4ed8;font-weight:800}
.stamping-v605-person b,.stamping-v605-person small{display:block}.stamping-v605 label{font-size:11px;color:#475569}.stamping-v605 select{width:100%;min-height:38px;margin-top:3px}.stamping-v605 button{min-height:38px}
.stamping-v605-fixed{grid-column:2/-1;color:#64748b;align-self:center}.stamping-infographic{display:none!important}
@media(max-width:1050px){.stamping-v605-row{grid-template-columns:1fr 1fr 1fr}.stamping-v605-person{grid-column:1/-1}.stamping-v605-fixed{grid-column:1/-1}}
@media(max-width:620px){.stamping-v605-row{grid-template-columns:1fr 1fr}.stamping-v605-person{grid-column:1/-1}.stamping-v605-row button{grid-column:1/-1}}
`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=v=>Array.isArray(v)?v.filter(Boolean):v&&typeof v==='object'?Object.values(v).filter(Boolean):[];
const rank=p=>{p=String(p||'').toLowerCase();if(p.includes('manager'))return 0;if(p.includes('engineer'))return 1;if(p.includes('supervisor'))return 2;if(p.includes('leader'))return 3;if(p.includes('technician'))return 4;if(p.includes('operator'))return 5;return 6};
const editable=p=>!/(manager|engineer|supervisor|leader)/i.test(String(p||''));
const opt=(value,current,label=value)=>`<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;
const field=(label,name,options)=>`<label>${label}<select data-field="${name}">${options}</select></label>`;
function machineOptions(current){
 const values=['','No.1# & No.2#','No.3# & No.4#','No.5# & No.6#',...Array.from({length:13},(_,i)=>'No.'+(i+1)+'#')];
 if(current&&!values.includes(current))values.push(current);
 return values.map(v=>opt(v,current,v||'ยังไม่กำหนด')).join('');
}
async function employees(){
 if(!window.firebase)return[];if(!firebase.apps.length)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG||{});
 const snap=await firebase.database().ref('ppms/employees').once('value');return list(snap.val()).filter(e=>String(e.section)==='Stamping Section');
}
function person(e){
 const photo=e.photo||e.photoUrl||'',avatar=photo?`<img src="${esc(photo)}" alt="">`:`<span class="stamping-v605-avatar">?</span>`;
 if(!editable(e.position))return `<div class="stamping-v605-row"><div class="stamping-v605-person">${avatar}<div><b>${esc(e.name)}</b><small>${esc(e.id)} · ${esc(e.position)}</small></div></div><div class="stamping-v605-fixed">ตำแหน่งบริหารประจำแผนก — ไม่เปลี่ยนตามกะเครื่องจักร</div></div>`;
 return `<div class="stamping-v605-row" data-id="${esc(e.id)}"><div class="stamping-v605-person">${avatar}<div><b>${esc(e.name)}</b><small>${esc(e.id)} · ${esc(e.position)} · เริ่มงาน ${esc(e.startDate||'-')}</small></div></div>
 ${field('กะทำงาน', 'attendanceShift',opt('day',e.attendanceShift||e.attShift||'day','Day')+opt('night',e.attendanceShift||e.attShift||'day','Night'))}
 ${field('ทีม', 'stampingShift',opt('',e.stampingShift,'ยังไม่กำหนด')+opt('Team A',e.stampingShift)+opt('Team B',e.stampingShift))}
 ${field('Group', 'stampingGroup',opt('',e.stampingGroup,'ยังไม่กำหนด')+['A','B','C'].map(x=>opt(x,e.stampingGroup,'Group '+x)).join(''))}
 ${field('หน้าที่', 'stampingRole',['','Operator 1','Operator 2','Operator 3','Operator 4','Operator 5','Operator 6','Operator 7','Operator 8','Operator 9','Operator 10','Spare','Support'].map(x=>opt(x,e.stampingRole,x||'ยังไม่กำหนด')).join(''))}
 ${field('เครื่องจักร', 'stampingMachines',machineOptions(e.stampingMachines||''))}
 <button type="button" data-save>บันทึก</button></div>`;
}
async function saveRow(row){
 const id=row.dataset.id,values={};row.querySelectorAll('[data-field]').forEach(x=>values[x.dataset.field]=x.value);
 const button=row.querySelector('[data-save]');button.disabled=true;button.textContent='กำลังบันทึก...';
 try{
  const ref=firebase.database().ref('ppms/employees');await ref.transaction(raw=>{
   if(!raw)return raw;const rows=Array.isArray(raw)?raw:Object.values(raw);const emp=rows.find(x=>String(x?.id)===String(id));if(!emp)return;
   Object.assign(emp,values,{attShift:values.attendanceShift,updatedAt:new Date().toISOString()});return raw;
  });button.textContent='บันทึกแล้ว';setTimeout(()=>button.textContent='บันทึก',1200);
 }catch(err){button.disabled=false;button.textContent='บันทึก';alert('บันทึกไม่สำเร็จ: '+err.message)}
}
let rendering=false,lastHost=null;
async function mount(){
 const old=document.querySelector('.stamping-infographic');if(!old||rendering)return;
 const host=old.parentElement;if(host.querySelector('.stamping-v605'))return;rendering=true;
 try{
  const rows=(await employees()).sort((a,b)=>rank(a.position)-rank(b.position)||String(a.startDate||'9999').localeCompare(String(b.startDate||'9999'))||String(a.id).localeCompare(String(b.id)));
  const root=document.createElement('section');root.className='panel stamping-v605';root.innerHTML=`<div class="stamping-v605-head"><div><h3>Stamping Employee & Machine Assignment</h3><small>เรียงตามตำแหน่ง → วันที่เริ่มงาน → รหัสพนักงาน · แก้กะ ทีม Group หน้าที่ และเครื่องจักรได้ในแถวเดียว</small></div><b>${rows.length} คน</b></div><div class="stamping-v605-list">${rows.map(person).join('')}</div>`;
  root.addEventListener('click',e=>{const b=e.target.closest('[data-save]');if(b)saveRow(b.closest('[data-id]'))});host.insertBefore(root,old);lastHost=host;
 }finally{rendering=false}
}
if(!document.getElementById('stampingV605Style')){const s=document.createElement('style');s.id='stampingV605Style';s.textContent=STYLE;document.head.appendChild(s)}
new MutationObserver(()=>{if(lastHost&&!document.body.contains(lastHost))lastHost=null;mount()}).observe(document.body,{childList:true,subtree:true});
mount();
})();