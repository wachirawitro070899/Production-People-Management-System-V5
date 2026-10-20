/* V848: keep individual JD actions in employee editing and skill cards. */
(()=>{
'use strict';
const CACHE='ppms_job_descriptions_v1',MASTER='ppms_organization_master_v1',ORG='ppms_employee_organization_v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
const admin=()=>sessionStorage.getItem('ppms_admin')==='1';
const normalize=value=>String(value||'').trim().replace(/\s+/g,' ');
const url=value=>{if(!String(value||'').trim())return '';try{const parsed=new URL(String(value).trim());return ['https:','http:'].includes(parsed.protocol)?parsed.href:null}catch{return null}};
let activeViewerId=null,viewerRevision='';
let records=read(CACHE,{}),subscribed=false,connected=false,loadError='',lastFocus=null,filters=null;
let remoteRecords={...records},offlineBound=false;
function database(){try{if(!window.firebase)return null;if(!firebase.apps.length&&window.PPMS_FIREBASE_CONFIG)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);return firebase.apps.length?firebase.database():null}catch{return null}}
function master(){return read(MASTER,{plants:['โรง 1'],divisions:['Production Division'],sectionMap:{},sectionPositions:{},positions:['Manager','Engineer','Supervisor','Leader','Technician','Operator']})}
function roster(){return read('ppms_v3_employees',[])}
function scope(){const form=document.getElementById('employeeForm'),m=master(),division=form?.elements.organizationDivision?.value||document.getElementById('factoryDivisionChart')?.value||sessionStorage.getItem('ppms_scope_division')||m.divisions[0],plant=division==='Production Division'?(form?.elements.organizationPlant?.value||document.getElementById('factoryPlantChart')?.value||sessionStorage.getItem('ppms_scope_plant')||m.plants[0]):'รวม';return {division,plant,section:form?.elements.section?.value||document.getElementById('sectionSelect')?.value||'',position:form?.elements.position?.value||'',employeeId:String(form?.elements.originalId?.value||form?.elements.id?.value||'')}}
function sectionList(division,plant){const map=read(ORG,{});return [...new Set([...(master().sectionMap?.[division+'::'+plant]||[]),...roster().filter(e=>{const org=map[String(e.id)]||{};return (org.division||e.organizationDivision||'Production Division')===division&&(division!=='Production Division'||(org.plant||e.organizationPlant||'โรง 1')===plant)}).map(e=>e.section),...Object.values(records).filter(r=>r.division===division&&r.plant===plant).map(r=>r.section)].filter(Boolean))].filter(section=>!(master().removedSections?.[division+'::'+plant]||[]).includes(section))}
function positionList(division,plant,section){return [...new Set([...(master().sectionPositions?.[division+'::'+plant+'::'+section]||[]),...(master().positions||[]),...roster().filter(e=>e.section===section).map(e=>e.position)].filter(Boolean))]}
function employeeList(division,plant,section=''){
 const map=read(ORG,{}),deleted=new Set(read('ppms_v3_deleted_employee_ids',[]).map(String));
 return roster().filter(e=>{
  if(!e||e.id==null||deleted.has(String(e.id)))return false;
  const org=map[String(e.id)]||{};
  return (org.division||e.organizationDivision||'Production Division')===division&&(division!=='Production Division'||(org.plant||e.organizationPlant||'โรง 1')===plant)&&(!section||e.section===section);
 }).sort((a,b)=>String(a.name||a.thaiName||a.id).localeCompare(String(b.name||b.thaiName||b.id),'th'));
}
const employeeName=e=>String(e?.name||e?.thaiName||e?.id||'');
const employeeOptions=(values,current)=>values.map(e=>'<option value="'+esc(e.id)+'" '+(String(e.id)===String(current)?'selected':'')+'>'+esc(e.id)+' · '+esc(employeeName(e))+'</option>').join('');
async function recordKey(record){
 // The employee ID stays stable when a person changes Section or position.
 const values=record.employeeId?['employee',String(record.employeeId).trim()]:[record.division,record.plant,record.section,record.position].map(x=>normalize(x).toLowerCase());
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(values)));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
function validateRecord(record,legacy=false){
 if(!legacy&&(!String(record.employeeId||'').trim()||!String(record.employeeName||'').trim()))throw Error('กรุณาเลือกพนักงานที่ต้องการจัดทำ JD รายบุคคล');
 for(const key of ['division','plant','section','position'])if(!normalize(record[key])||record[key].length>150)throw Error('กรุณาระบุ Division, Section และตำแหน่งให้ครบ');
 if(!String(record.responsibilities||'').trim())throw Error('กรุณากรอกหน้าที่และความรับผิดชอบ');
 if(String(record.responsibilities).length>20000||String(record.qualifications||'').length>10000)throw Error('รายละเอียดงานยาวเกินกำหนด');
 if(url(record.documentUrl)===null)throw Error('ลิงก์เอกสารต้องเป็น URL แบบ https:// หรือ http://');
 return {...record,documentUrl:url(record.documentUrl)};
}
function nextRevision(current,draft,expected){if(Number(current?.version||0)!==expected)return undefined;return {...draft,version:expected+1,createdAt:current?.createdAt||draft.updatedAt}}
function installStyle(){if(document.getElementById('jdManagerStyle'))return;const style=document.createElement('style');style.id='jdManagerStyle';style.textContent=`
.ppms-jd-person-button{display:block;margin:8px auto 0;padding:6px 10px;font-size:12px;border-radius:7px}.ppms-jd-card-toolbar{grid-column:1/-1;text-align:left;margin:8px 0}.ppms-jd-card-toolbar .ppms-jd-person-button{margin:0}@media print{.ppms-jd-person-button,.ppms-jd-card-toolbar{display:none!important}}
.ppms-jd-overlay{position:fixed;inset:0;background:#0f172acc;z-index:10040;display:grid;place-items:center;padding:16px}.ppms-jd-dialog{width:min(1000px,96vw);max-height:92vh;overflow:auto;background:white;border-radius:16px;padding:22px;color:#17334f}.ppms-jd-dialog h2{margin:0 0 6px}.ppms-jd-heading{display:flex;justify-content:space-between;align-items:start;gap:12px}.ppms-jd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.ppms-jd-dialog label{display:flex;flex-direction:column;gap:5px;font-weight:600}.ppms-jd-dialog input,.ppms-jd-dialog select,.ppms-jd-dialog textarea{width:100%;font:inherit;padding:9px;border:1px solid #a8bfd3;border-radius:8px;color:#17334f;background:#fff}.ppms-jd-dialog textarea{resize:vertical;line-height:1.6}.ppms-jd-full{grid-column:1/-1}.ppms-jd-dialog table{width:100%;border-collapse:collapse}.ppms-jd-dialog th,.ppms-jd-dialog td{border-bottom:1px solid #dbe6ef;padding:10px;text-align:left}.ppms-jd-table{overflow:auto}.ppms-jd-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.ppms-jd-message{color:#9a3412;white-space:pre-wrap}.ppms-jd-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}.ppms-jd-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:14px;background:#eef5fb;border-radius:10px;margin:18px 0}.ppms-jd-document{overflow-wrap:anywhere}.ppms-jd-role{display:block;margin:7px auto;font-size:12px}.ppms-jd-hint{font-size:13px;color:#526c82}@media(max-width:650px){.ppms-jd-grid,.ppms-jd-meta{grid-template-columns:1fr}.ppms-jd-dialog{padding:16px}}@media print{body.ppms-jd-print> *:not(#jdDialog){display:none!important}body.ppms-jd-print #jdDialog{position:static;display:block;padding:0;background:white}body.ppms-jd-print .ppms-jd-dialog{width:100%;max-height:none;overflow:visible;border-radius:0;padding:0}body.ppms-jd-print .ppms-jd-no-print{display:none!important}body.ppms-jd-print .ppms-jd-text{orphans:3;widows:3}body.ppms-jd-print h3{break-after:avoid}}
`;document.head.append(style)}
function close(){activeViewerId=null;viewerRevision='';document.getElementById('jdDialog')?.remove();document.body.classList.remove('ppms-jd-print');lastFocus?.focus?.()}
function shell(title){if(!admin())return null;const existing=document.getElementById('jdDialog');if(!existing)lastFocus=document.activeElement;existing?.remove();installStyle();const overlay=document.createElement('div');overlay.id='jdDialog';overlay.className='ppms-jd-overlay';overlay.innerHTML='<section class="ppms-jd-dialog" role="dialog" aria-modal="true" aria-labelledby="jdTitle"><div class="ppms-jd-heading"><div><h2 id="jdTitle">'+esc(title)+'</h2><p class="ppms-jd-hint">Job Description · รายละเอียดงานรายบุคคล</p></div><button type="button" class="secondary ppms-jd-no-print" data-jd-close>ปิด</button></div><div data-jd-content></div></section>';document.body.append(overlay);overlay.querySelector('[data-jd-close]').onclick=close;overlay.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const items=[...overlay.querySelectorAll('button,input,textarea,select,a[href]')].filter(x=>!x.disabled&&!x.closest('[hidden]')),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};overlay.querySelector('[data-jd-close]').focus();return overlay.querySelector('[data-jd-content]')}
const options=(values,current)=>values.map(x=>'<option '+(x===current?'selected':'')+'>'+esc(x)+'</option>').join('');

const operatorPosition=position=>/\b(?:operator|opeartor|operater)\b|^op(?:\b|\d)|พนักงานทั่วไป|พนักงานผลิต|พนักงานปฏิบัติการ/i.test(String(position||'').trim());
const jdRank=position=>{const p=String(position||'').toLowerCase();return /manager|ผู้จัดการ/.test(p)?0:/engineer|วิศวกร/.test(p)?1:/supervisor|หัวหน้าแผนก/.test(p)?2:/leader|หัวหน้าทีม/.test(p)?3:/technician|ช่าง/.test(p)?4:operatorPosition(p)?6:5};
function manager(initial){
 activeViewerId=null;viewerRevision='';
 if(!admin())return;filters={...(initial||filters||scope())};const content=shell('JD รายบุคคล / ตามตำแหน่ง');if(!content)return;const m=master();
 content.innerHTML='<div class="ppms-jd-grid ppms-jd-no-print"><label>Division<select data-jd-division>'+options(m.divisions,filters.division)+'</select></label><label data-jd-plant-label>โรงงาน<select data-jd-plant>'+options(m.plants,filters.plant)+'</select></label><label>Section<select data-jd-section></select></label><label>พนักงาน<select data-jd-employee></select></label><div class="ppms-jd-actions"><button type="button" data-jd-new>+ เพิ่ม JD รายบุคคล</button></div></div><p data-jd-status class="ppms-jd-hint"></p><div data-jd-list></div>';
 const division=content.querySelector('[data-jd-division]'),plant=content.querySelector('[data-jd-plant]'),section=content.querySelector('[data-jd-section]'),employee=content.querySelector('[data-jd-employee]');
 const people=(reset=false)=>{
  const values=employeeList(filters.division,filters.plant,filters.section).sort((a,b)=>jdRank(a.position)-jdRank(b.position)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true})),ids=new Set(values.map(e=>String(e.id)));
  for(const r of Object.values(records))if(r?.employeeId&&r.division===filters.division&&r.plant===filters.plant&&(!filters.section||r.section===filters.section)&&!ids.has(String(r.employeeId))){values.push({id:r.employeeId,name:r.employeeName});ids.add(String(r.employeeId))}
  if(reset||!ids.has(String(filters.employeeId)))filters.employeeId='';
  employee.innerHTML='<option value="">ทุกคน / JD ตามตำแหน่ง</option>'+employeeOptions(values,filters.employeeId);employee.value=filters.employeeId||'';drawList();
 };
 const changed=(reset=false)=>{filters.division=division.value;const production=division.value==='Production Division';content.querySelector('[data-jd-plant-label]').hidden=!production;filters.plant=production?plant.value:'รวม';const values=sectionList(filters.division,filters.plant),previous=reset?'':filters.section;section.innerHTML='<option value="">ทุก Section</option>'+options(values,previous);filters.section=values.includes(previous)?previous:'';section.value=filters.section;people(reset)};
 division.onchange=()=>changed(true);plant.onchange=()=>changed(true);section.onchange=()=>{filters.section=section.value;people(true)};employee.onchange=()=>{filters.employeeId=employee.value;drawList()};content.querySelector('[data-jd-new]').onclick=()=>editor(null,{...filters});changed();subscribe();
}


function canonicalPosition(value){
 const text=normalize(value),key=text.toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
 const aliases={
  'stoer':'Store','stroe':'Store','store':'Store','store keeper':'Store','storekeeper':'Store','store staff':'Store','พนักงานห้องเบิกจ่ายของ':'Store',
  'production planning':'Production Planning','production planner':'Production Planning','วางแผนการผลิต':'Production Planning','เจ้าหน้าที่วางแผนการผลิต':'Production Planning','การผลิต วางแผน':'Production Planning',
  'document control':'Document Control','document controller':'Document Control','เจ้าหน้าที่ควบคุมเอกสาร':'Document Control','เอกสาร ควบคุม':'Document Control',
  'opeartor':'Operator','operater':'Operator','assistant leader':'Assistant Leader',
  'pe':'Production Engineer','production engineer':'Production Engineer','production manager':'Production Manager'
 };
 return aliases[key]||text;
}

function positionTitle(record){
 const language=window.PPMSLanguage?.language||'th',p=canonicalPosition(record.position),lower=p.toLowerCase();
 const translate=value=>window.PPMSLanguage?.translate(String(value||''),language)||String(value||'');
 const section=normalize(record.section).replace(/\s+Section$/i,'');
 const division=normalize(record.division).replace(/\s+Division$/i,'');
 const known={'Production':['การผลิต','Production'],'Stamping':['ปั๊ม','Stamping'],'Welding':['เชื่อม','Welding'],'Bending':['พับ','Bending'],'Tapping':['ต๊าป','Tapping'],'Taping':['ต๊าป','Taping'],'CNC':['ซีเอ็นซี','CNC'],'Tooling':['แม่พิมพ์','Tooling'],'Sorting1':['คัดแยก 1','Sorting 1'],'Sorting2':['คัดแยก 2','Sorting 2'],'QC':['ควบคุมคุณภาพ','Quality Control'],'WH':['คลังสินค้า','Warehouse'],'HR':['บุคคล','Human Resources']};
 const subject=value=>known[value]?.[language==='en'?1:0]||translate(value);
 const roles=[[/assistant\s+leader|ผู้ช่วยหัวหน้าทีม/i,'ผู้ช่วยหัวหน้าทีม','Assistant Leader'],[/manager|ผู้จัดการ/i,'ผู้จัดการ','Manager'],[/engineer|วิศวกร|^pe$/i,'วิศวกร','Engineer'],[/supervisor|หัวหน้างาน|หัวหน้าแผนก/i,'หัวหน้างาน','Supervisor'],[/leader|หัวหน้าทีม/i,'หัวหน้าทีม','Leader'],[/technician|ช่างเทคนิค/i,'ช่างเทคนิค','Technician'],[/operator|opeartor|operater|^op(?:\b|\d)|พนักงานทั่วไป|พนักงานผลิต|พนักงานปฏิบัติการ/i,'พนักงาน','Operator']];
 const special={'Store':['พนักงานห้องเบิกจ่ายของ','Store'],'Production Planning':['เจ้าหน้าที่วางแผนการผลิต','Production Planning'],'Document Control':['เจ้าหน้าที่ควบคุมเอกสาร','Document Control']};
 if(window.PPMSProductionHierarchy?.isCastingSpecialist(p))return language==='en'?'Die Casting Specialist':'ผู้เชี่ยวชาญงานหล่ออลูมิเนียม';
 if(window.PPMSProductionHierarchy?.isHead(p))return window.PPMSProductionHierarchy.headTitle(language);
 if(window.PPMSProductionHierarchy?.isSupervisor(p))return language==='en'?'Supervisor Production':'หัวหน้างานฝ่ายผลิต';
  if(special[p])return special[p][language==='en'?1:0];
 const role=roles.find(([pattern])=>pattern.test(p));
 if(!role)return translate(p)+(section?' · '+subject(section):'');
 let area=section||division;
 if(role[2]==='Manager')area=division||section;
 if(role[2]==='Engineer'){
  if(/production|การผลิต|^pe$/.test(lower))area='Production';
  else if(/tooling|แม่พิมพ์/.test(lower))area='Tooling';
  else if(/welding|เชื่อม/.test(lower))area='Welding';
 }
 if(!area)return role[language==='en'?2:1];
 if(language==='en')return subject(area)+' '+role[2];
 if(role[2]==='Manager')return role[1]+'ฝ่าย'+subject(area).replace(/^การ/,'').replace(/^ฝ่าย/,'');
 if(role[2]==='Engineer')return role[1]+(area==='Welding'?'การเชื่อม':subject(area));
 return role[1]+'แผนก'+subject(area).replace(/^แผนก/,'');
}
function refreshPositionTitles(){
 document.querySelectorAll('[data-employee-position-id]').forEach(el=>{
  const employee=roster().find(e=>String(e.id)===el.dataset.employeePositionId);
  if(employee){const next=positionTitle({...employee,...employeeJDContext(employee.id)});if(el.textContent!==next)el.textContent=next;}
 });
 document.querySelectorAll('#jdDialog [data-jd-position-title]').forEach(el=>{
  const record=records[el.dataset.jdPositionTitle];if(record){const next=positionTitle(record);if(el.textContent!==next)el.textContent=next;}
 });
 const form=document.querySelector('#jdForm');
 if(form){
  const label=form.querySelector('[data-jd-position-preview]');
  if(label){const next=positionTitle({position:form.elements.position.value,section:form.elements.section.value,division:form.elements.division.value});if(label.textContent!==next)label.textContent=next;}
 }
}

function drawList(){const content=document.querySelector('#jdDialog [data-jd-content]'),list=content?.querySelector('[data-jd-list]');if(!list)return;const entries=Object.entries(records).filter(([,r])=>r&&(filters.employeeId?String(r.employeeId)===String(filters.employeeId):r.division===filters.division&&r.plant===filters.plant&&(!filters.section||r.section===filters.section))).sort((a,b)=>String(a[1].section).localeCompare(String(b[1].section))||jdRank(a[1].position)-jdRank(b[1].position)||String(a[1].position).localeCompare(String(b[1].position)));
 content.querySelector('[data-jd-status]').textContent=loadError||((!connected?'บันทึก JD ในเครื่องได้ · จะซิงก์เมื่อเชื่อมต่อ':entries.length+' รายการ · ซิงค์ฐานข้อมูลกลาง')+(window.PPMS_JD_OFFLINE?.count()?' · '+window.PPMS_JD_OFFLINE.count()+' รายการรอซิงก์':''));
 list.innerHTML=entries.length?'<div class="ppms-jd-table"><table><thead><tr><th>รหัส / ชื่อพนักงาน</th><th>Section</th><th>ตำแหน่ง</th><th>JD No. / Rev.</th><th>วันที่มีผล</th><th>จัดการ</th></tr></thead><tbody>'+entries.map(([id,r])=>'<tr><td>'+(r.employeeId?esc(r.employeeId)+' · '+esc(r.employeeName):'JD ตามตำแหน่ง')+'</td><td>'+esc(r.section)+'</td><td data-i18n-ignore data-jd-position-title="'+esc(id)+'">'+esc(positionTitle(r))+'</td><td>'+esc(r.documentNo||'—')+' / '+esc(r.revision||'—')+'</td><td>'+esc(r.effectiveDate||'—')+'</td><td><button type="button" data-jd-view="'+esc(id)+'">ดู JD</button> <button type="button" class="secondary" data-jd-edit="'+esc(id)+'">แก้ไข</button></td></tr>').join('')+'</tbody></table></div>':'<p>ยังไม่มี JD ใน Section ที่เลือก กด “+ เพิ่ม JD รายบุคคล” เพื่อเพิ่มรายละเอียดงาน</p>';
 list.querySelectorAll('[data-jd-view]').forEach(b=>b.onclick=()=>viewer(b.dataset.jdView));list.querySelectorAll('[data-jd-edit]').forEach(b=>b.onclick=()=>editor(b.dataset.jdEdit));
}
function editor(id,initial){activeViewerId=null;viewerRevision='';if(!admin())return;const existing=id?records[id]:null;if(id&&!existing)return;const draft=existing||{...scope(),...initial},content=shell(existing&&!existing.employeeId?'JD ตามตำแหน่ง':existing?'แก้ไข JD รายบุคคล':'เพิ่ม JD รายบุคคล');if(!content)return;const m=master();content.innerHTML='<form id="jdForm"><div class="ppms-jd-grid"><label>Division<select name="division" '+(existing?'disabled':'')+'>'+options(m.divisions,draft.division)+'</select></label><label data-jd-plant-label>โรงงาน<select name="plant" '+(existing?'disabled':'')+'>'+options(m.plants,draft.plant)+'</select></label><label>Section<select name="section" required '+(existing?'disabled':'')+'></select></label><label class="ppms-jd-full">พนักงาน / รหัสพนักงาน<select name="employeeId" '+(existing?'disabled':'required')+'></select></label><label>ตำแหน่ง<input name="position" readonly list="jdPositions" maxlength="150" required value="'+esc(draft.position||'')+'" '+(existing?'readonly':'')+' hidden><span data-i18n-ignore data-jd-position-preview></span><datalist id="jdPositions"></datalist></label><label>เลขที่เอกสาร JD<input name="documentNo" maxlength="100" value="'+esc(draft.documentNo||'')+'"></label><label>Revision<input name="revision" maxlength="30" value="'+esc(draft.revision||'')+'"></label><label>วันที่มีผล<input name="effectiveDate" type="date" value="'+esc(draft.effectiveDate||'')+'"></label><label>รายงานต่อ / ผู้บังคับบัญชา<input name="reportsTo" maxlength="150" value="'+esc(draft.reportsTo||'')+'"></label><label class="ppms-jd-full">หน้าที่และความรับผิดชอบ<textarea name="responsibilities" rows="8" maxlength="20000" required placeholder="กรอกหน้าที่งาน แยกแต่ละข้อคนละบรรทัด">'+esc(draft.responsibilities||'')+'</textarea></label><label class="ppms-jd-full">คุณสมบัติ / ทักษะที่จำเป็น<textarea name="qualifications" rows="4" maxlength="10000">'+esc(draft.qualifications||'')+'</textarea></label><label class="ppms-jd-full">ลิงก์ไฟล์ JD (ถ้ามี)<input name="documentUrl" type="url" maxlength="2000" placeholder="https://..." value="'+esc(draft.documentUrl||'')+'"><small class="ppms-jd-hint">ใส่ลิงก์ PDF, Word หรือเอกสารที่ผู้ใช้งานมีสิทธิ์เปิดดู</small></label></div><p data-jd-message class="ppms-jd-message" role="status"></p><div class="ppms-jd-actions"><button type="submit">บันทึก JD</button><button type="button" class="secondary" data-jd-back>กลับรายการ JD</button></div></form>';
 const f=content.querySelector('form'),message=f.querySelector('[data-jd-message]'),expected=Number(existing?.version||0);let previousSection=draft.section||employeeList(draft.division,draft.plant).find(e=>String(e.id)===String(draft.employeeId))?.section||'';
 const syncEmployee=()=>{
  if(existing)return;
  const employee=employeeList(f.elements.division.value,f.elements.division.value==='Production Division'?f.elements.plant.value:'รวม',f.elements.section.value).find(e=>String(e.id)===f.elements.employeeId.value);
  f.elements.position.value=employee?String(employee.position||''):'';
  if(employee&&window.PPMSJDTemplates){
   const context={division:f.elements.division.value,plant:f.elements.division.value==='Production Division'?f.elements.plant.value:'รวม',section:f.elements.section.value,position:employee.position||''};
   const saved=Object.values(records).find(r=>!r.employeeId&&r.division===context.division&&r.plant===context.plant&&r.section===context.section&&normalize(r.position).toLowerCase()===normalize(context.position).toLowerCase());
   const defaults=saved||window.PPMSJDTemplates.draft(context);
   for(const name of ['responsibilities','qualifications','reportsTo','revision']){const field=f.elements[name];if(!field.value||field.dataset.jdAutoTemplate==='1'){field.value=defaults[name]||'';field.dataset.jdAutoTemplate='1';field.addEventListener('input',()=>delete field.dataset.jdAutoTemplate,{once:true})}}
  }
 };
 const sync=()=>{
  const division=f.elements.division.value,production=division==='Production Division',plant=production?f.elements.plant.value:'รวม';f.querySelector('[data-jd-plant-label]').hidden=!production;if(!existing)f.elements.plant.disabled=!production;
  const values=sectionList(division,plant);if(existing&&!values.includes(existing.section))values.push(existing.section);f.elements.section.innerHTML=options(values,previousSection);previousSection=f.elements.section.value;
  const selected=f.elements.employeeId.value||(!f.dataset.employeeInitialized?draft.employeeId:''),people=employeeList(division,plant,previousSection).sort((a,b)=>jdRank(a.position)-jdRank(b.position));
  if(existing&&existing.employeeId&&!people.some(e=>String(e.id)===String(existing.employeeId)))people.push({id:existing.employeeId,name:existing.employeeName});
  f.elements.employeeId.innerHTML=existing&&!existing.employeeId?'<option value="">JD ตามตำแหน่ง</option>':'<option value="">เลือกพนักงาน</option>'+employeeOptions(people,selected);
  f.dataset.employeeInitialized='1';syncEmployee();refreshPositionTitles();
 };
 f.elements.division.onchange=()=>{previousSection='';f.elements.employeeId.value='';sync()};f.elements.plant.onchange=()=>{previousSection='';f.elements.employeeId.value='';sync()};f.elements.section.onchange=()=>{previousSection=f.elements.section.value;f.elements.employeeId.value='';sync()};f.elements.employeeId.onchange=()=>{syncEmployee();refreshPositionTitles()};sync();f.querySelector('[data-jd-back]').onclick=()=>manager(filters);(existing?f.elements.responsibilities:f.elements.employeeId).focus();
 f.onsubmit=async e=>{e.preventDefault();if(!admin())return;if(f.querySelector('[type="submit"]')?.disabled)return;
 const button=f.querySelector('[type="submit"]');let record;
 try{const person=existing?null:employeeList(f.elements.division.value,f.elements.division.value==='Production Division'?f.elements.plant.value:'รวม',f.elements.section.value).find(e=>String(e.id)===f.elements.employeeId.value);if(!existing&&!person)throw Error('ไม่พบพนักงานใน Section ที่เลือก กรุณาตรวจสอบรายชื่ออีกครั้ง');record=validateRecord({...existing,templateVersion:5,employeeId:existing?.employeeId||String(person?.id||''),employeeName:existing?.employeeName||employeeName(person),division:f.elements.division.value,plant:f.elements.division.value==='Production Division'?f.elements.plant.value:'รวม',section:f.elements.section.value,position:normalize(f.elements.position.value),documentNo:f.elements.documentNo.value.trim(),revision:f.elements.revision.value.trim(),effectiveDate:f.elements.effectiveDate.value,reportsTo:f.elements.reportsTo.value.trim(),responsibilities:f.elements.responsibilities.value.trim(),qualifications:f.elements.qualifications.value.trim(),documentUrl:f.elements.documentUrl.value.trim(),updatedAt:new Date().toISOString(),updatedBy:sessionStorage.getItem('ppms_admin_user')||'Admin'},Boolean(existing&&!existing.employeeId));
 button.disabled=true;message.textContent='กำลังบันทึก JD ในเครื่อง...';const key=id||await recordKey(record);if(!window.PPMS_JD_OFFLINE)throw Error('โหลดระบบบันทึก JD ไม่สำเร็จ กรุณาเปิดหน้าใหม่');await window.PPMS_JD_OFFLINE.save(key,record,expected);applyOfflineRecords();viewer(key);flushJDQueue();
 }catch(error){message.textContent='บันทึกไม่สำเร็จ: '+error.message;button.disabled=false}
 };
}
function viewRevision(record,id=''){return JSON.stringify([window.PPMS_JD_OFFLINE?.status(id),record?.version,record?.updatedAt,record?.position,record?.section,record?.responsibilities,record?.qualifications,record?.reportsTo,record?.jobPurpose])}
function refreshActiveViewer(){if(activeViewerId&&records[activeViewerId]&&viewRevision(records[activeViewerId],activeViewerId)!==viewerRevision)viewer(activeViewerId)}
function viewer(id){const record=records[id];if(!record||!admin())return;activeViewerId=id;viewerRevision=viewRevision(record,id);const content=shell('JOB DESCRIPTION / JD รายบุคคล');if(!content)return;const link=url(record.documentUrl);content.innerHTML=offlineJDNotice(id)+'<article>'+(record.employeeId?'<h3>'+esc(record.employeeName)+' · '+esc(record.employeeId)+'</h3>':'<p>JD ตามตำแหน่ง</p>')+'<h3 data-i18n-ignore data-jd-position-title="'+esc(id)+'">'+esc(positionTitle(record))+'</h3>'+(record.jobPurpose?'<h3>วัตถุประสงค์ของตำแหน่ง</h3><div class="ppms-jd-text">'+esc(record.jobPurpose)+'</div>':'')+'<div class="ppms-jd-meta"><span><b>Division:</b> '+esc(record.division)+'</span><span><b>Section:</b> '+esc(record.section)+'</span><span><b>โรงงาน:</b> '+esc(record.plant)+'</span><span><b>รายงานต่อ:</b> '+esc(record.reportsTo||'—')+'</span><span><b>JD No.:</b> '+esc(record.documentNo||'—')+'</span><span><b>Revision:</b> '+esc(record.revision||'—')+'</span><span><b>วันที่มีผล:</b> '+esc(record.effectiveDate||'—')+'</span></div>'+(Number(record.templateVersion||0)>=5?'<p class="ppms-jd-hint">JD ฉบับปรับปรุงล่าสุด</p>':'')+'<h3>หน้าที่และความรับผิดชอบ</h3><div class="ppms-jd-text">'+esc(record.responsibilities)+'</div><h3>คุณสมบัติ / ทักษะที่จำเป็น</h3><div class="ppms-jd-text">'+esc(record.qualifications||'—')+'</div>'+(link?'<p class="ppms-jd-document"><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">เปิดไฟล์ JD ที่แนบลิงก์</a></p>':'')+'<p class="ppms-jd-hint">อัปเดต: '+esc(record.updatedAt||'')+' · '+esc(record.updatedBy||'')+'</p></article><div class="ppms-jd-actions ppms-jd-no-print"><button type="button" data-jd-edit>แก้ไข JD</button><button type="button" data-jd-print>พิมพ์ / บันทึก PDF</button><button type="button" class="secondary" data-jd-back>กลับรายการ JD</button></div>';
 content.querySelector('[data-jd-edit]').onclick=()=>editor(id);const review=content.querySelector('[data-jd-review-conflict]');if(review)review.onclick=()=>reviewJDConflict(id);content.querySelector('[data-jd-back]').onclick=()=>manager(filters);content.querySelector('[data-jd-print]').onclick=()=>{document.body.classList.add('ppms-jd-print');window.print()};
}
// Starter drafts are created only for missing individual JDs; existing records win.
function starterJD(person,context){
 if(typeof window!=='undefined'&&window.PPMSJDTemplates){const template=window.PPMSJDTemplates.draft(context);return {...template,...context,employeeName:employeeName(person),draft:true,templateVersion:template.templateVersion};}
 const role=String(context.position||'').toLowerCase();
 const pair=(th,en)=>th+' / '+en;
 let duties,skills,reportsTo='';
 if(/manager|ผู้จัดการ/.test(role)){
 duties=[pair('กำหนดเป้าหมายและแผนงานของหน่วยงาน','Set department objectives and operating plans'),pair('บริหารกำลังคน งบประมาณ และทรัพยากร','Manage staffing, budget and resources'),pair('ติดตาม KPI คุณภาพ ต้นทุน การส่งมอบ และความปลอดภัย','Review quality, cost, delivery and safety KPIs'),pair('พัฒนาทีมและติดตามการแก้ไขปัญหาข้ามหน่วยงาน','Develop the team and follow up cross-functional corrective actions')];skills=pair('ทักษะบริหารทีม วางแผน วิเคราะห์ข้อมูล และตัดสินใจ','Team management, planning, data analysis and decision-making');
 }else if(/supervisor|หัวหน้าแผนก/.test(role)){
 reportsTo='Manager';duties=[pair('ควบคุมการปฏิบัติงานให้เป็นไปตามแผนของหน่วยงาน','Supervise operations against the department plan'),pair('จัดสรรกำลังคนและติดตามผลแต่ละกะ','Allocate staff and monitor each shift'),pair('ตรวจติดตามมาตรฐานงานและแก้ไขปัญหาหน้างาน','Verify work standards and resolve operational issues'),pair('ประเมินทักษะและวางแผนฝึกอบรมพนักงาน','Assess skills and plan employee training')];skills=pair('ทักษะควบคุมงาน บริหารคน และวิเคราะห์ปัญหา','Supervision, people management and problem analysis');
 }else if(/engineer|วิศวกร/.test(role)){
 reportsTo='Manager / Supervisor';duties=[pair('วิเคราะห์และปรับปรุงกระบวนการในหน่วยงาน','Analyze and improve department processes'),pair('จัดทำและทบทวนมาตรฐานงานและข้อมูลทางเทคนิค','Prepare and review work standards and technical data'),pair('วิเคราะห์สาเหตุปัญหาและยืนยันผลการแก้ไข','Analyze root causes and verify corrective actions'),pair('สนับสนุนการทดลองงาน การเปลี่ยนแปลง และฝึกอบรม','Support trials, changes and technical training')];skills=pair('ความรู้ทางวิศวกรรมที่เกี่ยวข้อง การวิเคราะห์ข้อมูล และการแก้ไขปัญหา','Relevant engineering knowledge, data analysis and problem-solving');
 }else if(/leader|หัวหน้าทีม|หัวหน้างาน/.test(role)){
 reportsTo='Supervisor';duties=[pair('มอบหมายงานและตรวจความพร้อมก่อนเริ่มกะ','Assign work and verify shift readiness'),pair('ติดตามผลผลิต คุณภาพ และความผิดปกติระหว่างกะ','Monitor output, quality and abnormalities during the shift'),pair('สอนงานและตรวจการปฏิบัติตาม WI','Coach employees and verify WI compliance'),pair('ส่งมอบงานระหว่างกะและรายงานปัญหาต่อผู้บังคับบัญชา','Complete shift handover and escalate issues')];skills=pair('ทักษะหน้างาน การสอนงาน และการประสานงาน','Operational skills, coaching and coordination');
 }else if(/technician|ช่าง/.test(role)){
 reportsTo='Leader / Supervisor';duties=[pair('ตรวจเช็ค ตั้งค่า และดูแลอุปกรณ์ตามงานที่ได้รับมอบหมาย','Inspect, set up and maintain assigned equipment'),pair('วิเคราะห์และแก้ไขความผิดปกติตามขอบเขตที่ได้รับอนุญาต','Diagnose and correct faults within authorized scope'),pair('บันทึกการซ่อม การตั้งค่า และผลการตรวจสอบ','Record repairs, settings and inspection results'),pair('ตรวจยืนยันความพร้อมและความปลอดภัยก่อนส่งมอบ','Verify readiness and safety before handover')];skills=pair('ทักษะเครื่องมือ งานเทคนิค และความปลอดภัยของอุปกรณ์','Tool use, technical work and equipment safety');
 }else{
 reportsTo='Leader / Supervisor';duties=[pair('ปฏิบัติงานตามหน้าที่ที่ได้รับมอบหมายและมาตรฐานที่อนุมัติ','Perform assigned duties according to approved standards'),pair('ตรวจความพร้อมของงาน อุปกรณ์ และเอกสารก่อนเริ่มงาน','Check work, equipment and document readiness'),pair('ตรวจสอบและบันทึกผลการทำงานให้ครบถ้วน','Check and accurately record work results'),pair('รายงานความผิดปกติและปฏิบัติตามขั้นตอนการแก้ไข','Report abnormalities and follow the response procedure')];skills=pair('ความรู้ในงานที่รับผิดชอบ การใช้เครื่องมือ และการบันทึกข้อมูล','Job knowledge, tool use and accurate recordkeeping');
 }
 const section=String(context.section||'');
 const tasks=[[/stamping|ปั๊ม/i,'ตรวจชิ้นงานปั๊ม แม่พิมพ์ และอุปกรณ์ป้องกันตาม WI','Check stamped parts, dies and safeguards per WI'],[/welding|เชื่อม/i,'ควบคุมงานเชื่อม จิ๊ก และตรวจแนวเชื่อมตามมาตรฐาน','Control welding work, fixtures and weld inspection'],[/cnc/i,'ตรวจโปรแกรม เครื่องมือตัด และขนาดชิ้นงานตามมาตรฐาน','Verify programs, cutting tools and part dimensions'],[/tapping|taping|ต๊าป/i,'ตรวจเครื่องมือต๊าปและคุณภาพเกลียวตามมาตรฐาน','Check tapping tools and thread quality'],[/bending|ดัด|พับ/i,'ตรวจการตั้งงาน มุมพับ และขนาดชิ้นงาน','Check bending setup, angles and dimensions'],[/sorting|qc|quality|คุณภาพ|คัด/i,'ตรวจและคัดแยกชิ้นงานตามเกณฑ์ พร้อมระบุและแยกงาน NG','Inspect and sort parts against criteria; identify and segregate NG parts'],[/maintenance|ซ่อม/i,'ดำเนินงานบำรุงรักษาตามแผนและบันทึกประวัติอุปกรณ์','Perform planned maintenance and record equipment history'],[/warehouse|คลัง/i,'ตรวจรับ จัดเก็บ และเบิกจ่ายโดยรักษาการสอบกลับของสินค้า','Receive, store and issue goods with traceability'],[/planning|วางแผน/i,'ติดตามแผนงาน กำลังการผลิต และความพร้อมของวัสดุ','Track schedules, capacity and material availability'],[/purchasing|จัดซื้อ/i,'ติดตามความต้องการจัดซื้อและกำหนดส่งมอบกับผู้ขาย','Track purchase requirements and supplier delivery dates'],[/hr|human|บุคคล/i,'ดูแลข้อมูลบุคลากรและประสานงานตามขั้นตอนของหน่วยงาน','Maintain personnel data and coordinate department procedures']];
 const specific=tasks.find(([pattern])=>pattern.test(section+' '+context.division));if(specific)duties.push(pair(specific[1],specific[2]));
 duties.push(pair('ปฏิบัติตามข้อกำหนดความปลอดภัย คุณภาพ และ 5ส ที่เกี่ยวข้อง','Follow applicable safety, quality and 5S requirements'));
 return {...context,employeeName:employeeName(person),reportsTo,responsibilities:pair('ฉบับร่างตั้งต้น โปรดทบทวนให้ตรงกับงานจริงก่อนอนุมัติ','Starter draft: review against actual duties before approval')+'\n'+duties.map((v,i)=>(i+1)+'. '+v).join('\n'),qualifications:skills+'\n'+pair('ระบุวุฒิ ประสบการณ์ และการฝึกอบรมตามความจำเป็นของตำแหน่ง','Specify education, experience and training required for this role'),revision:'Draft',effectiveDate:'',documentNo:'',documentUrl:'',draft:true,templateVersion:1};
}
let seeding=false,jdLoaded=false;
async function seedMissingJDs(){
 if(seeding||!admin()||!connected||!jdLoaded)return;if(typeof window!=='undefined'&&window.PPMS_JD_OFFLINE&&!window.PPMS_JD_OFFLINE.loaded)return;
 const instance=database();if(!instance)return;seeding=true;let created=false;
 try{
  for(const person of roster()){
   if(!admin()||!connected)break;
   const context=employeeJDContext(person.id);
   if(!context||!context.section||!context.position||Object.values(records).some(r=>String(r?.employeeId||'')===String(person.id)))continue;
   const key=await recordKey(context),now=new Date().toISOString();
   const draft={...starterJD(person,context),version:1,createdAt:now,updatedAt:now,updatedBy:'PPMS · JD starter draft'};
   const result=await instance.ref('settings/jobDescriptions/'+key).transaction(current=>current==null?draft:undefined,undefined,false);
   if(result.committed){records[key]=result.snapshot.val();created=true;}
  }
  if(created){localStorage.setItem(CACHE,JSON.stringify(records));drawList();}
 }catch(error){loadError='เพิ่ม JD ตั้งต้นไม่สำเร็จ กรุณาเปิดหน้าใหม่เพื่อลองอีกครั้ง: '+error.message;drawList()}
 finally{seeding=false}
}

// Position templates also cover vacant roles configured in the organization master.
function positionJDContexts(){
 const m=master(),contexts=new Map();
 const add=c=>{if(c?.division&&c.plant&&c.section&&c.position){const clean={division:c.division,plant:c.plant,section:c.section,position:normalize(c.position)};const key=JSON.stringify(Object.values(clean).map(x=>normalize(x).toLowerCase()));if(!contexts.has(key))contexts.set(key,clean)}};
 for(const [key,positions] of Object.entries(m.sectionPositions||{})){
  const [division,plant,...section]=key.split('::');
  for(const position of Array.isArray(positions)?positions:[])add({division,plant,section:section.join('::'),position});
 }
 for(const person of roster())add(employeeJDContext(person.id));
 for(const [key,sections] of Object.entries(m.sectionMap||{})){
  const [division,plant]=key.split('::');
  for(const section of Array.isArray(sections)?sections:[])for(const position of m.positionMap?.[division]||[])add({division,plant,section,position});
 }
 return [...contexts.values()];
}
let seedingPositions=false;
async function seedPositionJDs(){
 if(seedingPositions||!admin()||!connected||!jdLoaded||!window.PPMSJDTemplates)return;if(typeof window!=='undefined'&&window.PPMS_JD_OFFLINE&&!window.PPMS_JD_OFFLINE.loaded)return;
 const instance=database();if(!instance)return;seedingPositions=true;let created=false;
 try{
  for(const context of positionJDContexts()){
   if(!admin()||!connected)break;
   if(Object.values(records).some(r=>r&&!r.employeeId&&['division','plant','section','position'].every(k=>normalize(r[k]).toLowerCase()===normalize(context[k]).toLowerCase())))continue;
   const key=await recordKey(context),now=new Date().toISOString();
   const draft={...window.PPMSJDTemplates.draft(context),draft:true,createdAt:now,updatedAt:now,updatedBy:'PPMS · Position JD draft'};
   const result=await instance.ref('settings/jobDescriptions/'+key).transaction(current=>current==null?draft:undefined,undefined,false);
   if(result.committed){records[key]=result.snapshot.val();created=true}
  }
  if(created){localStorage.setItem(CACHE,JSON.stringify(records));drawList()}
 }catch(error){loadError='เพิ่ม JD ตั้งต้นไม่สำเร็จ กรุณาเปิดหน้าใหม่เพื่อลองอีกครั้ง: '+error.message;drawList()}
 finally{seedingPositions=false}
}


function canUpgradeJD(record){
 const required=5;
 return record&&Number(record.templateVersion||0)<required&&Boolean(record.section&&record.position);
}
let upgradingJDs=false;
async function upgradeSectionJDs(){
 if(upgradingJDs||!admin()||!connected||!jdLoaded||!window.PPMSJDTemplates)return;if(typeof window!=='undefined'&&window.PPMS_JD_OFFLINE&&!window.PPMS_JD_OFFLINE.loaded)return;
 const instance=database();if(!instance)return;upgradingJDs=true;let changed=false;
 try{
  for(const [id,record] of Object.entries(records)){
   if(!admin()||!connected)break;if(!canUpgradeJD(record))continue;
   const context=record.employeeId?(employeeJDContext(record.employeeId)||record):record;
   const template=window.PPMSJDTemplates.draft(context),now=new Date().toISOString();
   const result=await instance.ref('settings/jobDescriptions/'+id).transaction(current=>{
    if(!canUpgradeJD(current)||Number(current.version||0)!==Number(record.version||0)||current.updatedAt!==record.updatedAt)return undefined;
    // A concurrent change to the scope or content must not be overwritten.
    if(['division','plant','section','position','responsibilities','qualifications'].some(k=>current[k]!==record[k]))return undefined;
    return {...current,...context,draft:true,status:'draft',jobPurpose:template.jobPurpose,previousResponsibilities:current.previousResponsibilities||current.responsibilities||'',previousQualifications:current.previousQualifications||current.qualifications||'',responsibilities:template.responsibilities,qualifications:template.qualifications,previousReportsTo:current.previousReportsTo||current.reportsTo||'',reportsTo:template.reportsTo,templateVersion:template.templateVersion,templateSource:template.templateSource,version:Number(current.version||0)+1,updatedAt:now,updatedBy:'PPMS · Detailed Section JD'};
   },undefined,false);
   if(result.committed){records[id]=result.snapshot.val();changed=true}
  }
  if(changed){localStorage.setItem(CACHE,JSON.stringify(records));drawList()}
 }catch(error){loadError='อัปเดตรายละเอียด JD ไม่สำเร็จ: '+error.message;drawList()}
 finally{upgradingJDs=false}
}

function applyOfflineRecords(){records=window.PPMS_JD_OFFLINE?.overlay(remoteRecords)||{...remoteRecords};localStorage.setItem(CACHE,JSON.stringify(records))}
function offlineJDNotice(id){const state=window.PPMS_JD_OFFLINE?.status(id);return state?'<div class="ppms-jd-message" role="status" data-jd-sync-state="'+esc(state.status)+'"><p>'+esc(state.status==='conflict'?state.error:'บันทึก JD ในเครื่องแล้ว · รอซิงก์เมื่อเชื่อมต่อ')+'</p>'+(state.status==='conflict'?'<button type="button" class="secondary ppms-jd-no-print" data-jd-review-conflict>ตรวจสอบฉบับส่วนกลาง</button>':'')+'</div>':''}
function reviewJDConflict(id){
 const local=records[id],remote=window.PPMS_JD_OFFLINE?.conflictRecord(id),content=shell('เปรียบเทียบ JD ก่อนซิงก์');if(!local||!content)return;activeViewerId=null;viewerRevision='';
 const details=record=>record?'<h3 data-i18n-ignore>'+esc(positionTitle(record))+'</h3><p>'+esc(record.documentNo||'—')+' · '+esc(record.revision||'—')+'</p>'+[['รายงานต่อ / ผู้บังคับบัญชา',record.reportsTo],['วัตถุประสงค์ของตำแหน่ง',record.jobPurpose],['หน้าที่และความรับผิดชอบ',record.responsibilities],['คุณสมบัติ / ทักษะที่จำเป็น',record.qualifications],['ลิงก์ไฟล์ JD (ถ้ามี)',record.documentUrl]].map(([label,value])=>'<h4>'+esc(label)+'</h4><div class="ppms-jd-text">'+esc(value||'—')+'</div>').join('')+'<p>'+esc(record.updatedAt||'')+' · '+esc(record.updatedBy||'')+'</p>':'<p>ไม่พบ JD ส่วนกลาง</p>';
 content.innerHTML='<div class="ppms-jd-grid"><section><h3>ฉบับที่บันทึกในเครื่อง</h3>'+details(local)+'</section><section><h3>ฉบับส่วนกลาง</h3>'+details(remote)+'</section></div><p class="ppms-jd-message" data-jd-conflict-message role="status"></p><div class="ppms-jd-actions"><button type="button" data-jd-resolve>ใช้ฉบับในเครื่องและซิงก์</button><button type="button" class="secondary" data-jd-local-back>กลับ JD ในเครื่อง</button></div>';
 content.querySelector('[data-jd-local-back]').onclick=()=>viewer(id);content.querySelector('[data-jd-resolve]').onclick=async event=>{event.target.disabled=true;try{await window.PPMS_JD_OFFLINE.resolveConflict(id);applyOfflineRecords();viewer(id);flushJDQueue()}catch(error){content.querySelector('[data-jd-conflict-message]').textContent='บันทึกไม่สำเร็จ: '+error.message;event.target.disabled=false}};
}
function flushJDQueue(){if(!admin()||!connected||navigator.onLine===false)return Promise.resolve(false);return (window.PPMS_JD_OFFLINE?.sync(database())||Promise.resolve(false)).catch(error=>{console.warn('JD sync pending:',error);loadError='ยังซิงก์ JD ไม่สำเร็จ ฉบับในเครื่องยังเก็บไว้';drawList();return false})}
function bindOfflineJD(){
 if(offlineBound||!window.PPMS_JD_OFFLINE)return;offlineBound=true;
 window.PPMS_JD_OFFLINE.subscribe(event=>{if(event.type==='synced'&&event.record)remoteRecords[event.key]=event.record;applyOfflineRecords();refreshActiveViewer();drawList();if(event.type==='loaded'||event.type==='saved')flushJDQueue()});
 window.PPMS_JD_OFFLINE.ready.then(()=>{applyOfflineRecords();refreshActiveViewer();drawList();flushJDQueue();seedMissingJDs();seedPositionJDs();upgradeSectionJDs()}).catch(error=>{loadError='โหลด JD ในเครื่องไม่สำเร็จ: '+error.message;drawList()});
}
function subscribe(){if(subscribed)return;const instance=database();if(!instance)return;subscribed=true;instance.ref('.info/connected').on('value',s=>{connected=s.val()===true;drawList();flushJDQueue();seedMissingJDs();seedPositionJDs();upgradeSectionJDs()});instance.ref('settings/jobDescriptions').on('value',s=>{remoteRecords=s.val()||{};jdLoaded=true;loadError='';applyOfflineRecords();refreshActiveViewer();drawList();flushJDQueue();seedMissingJDs();seedPositionJDs();upgradeSectionJDs()},error=>{loadError='โหลด JD ไม่สำเร็จ: '+error.message;drawList()})}
function employeeJDContext(id){
 const key=String(id||'').trim(),deleted=new Set(read('ppms_v3_deleted_employee_ids',[]).map(String));
 const employee=roster().find(e=>String(e.id)===key&&!deleted.has(key));if(!employee)return null;
 const organization=read(ORG,{})[key]||{},division=organization.division||employee.organizationDivision||'Production Division';
 return {employeeId:key,division,plant:division==='Production Division'?(organization.plant||employee.organizationPlant||master().plants[0]):'รวม',section:employee.section||'',position:employee.position||''};
}
function openEmployeeJD(id){
 if(!admin())return;
 const existing=Object.entries(records).find(([,record])=>String(record?.employeeId||'')===String(id));
 const context=employeeJDContext(id);
 if(!context&&!existing){alert('ไม่พบพนักงานคนนี้ กรุณาบันทึกข้อมูลพนักงานก่อนเพิ่ม JD');return}
 filters=context||{...existing[1]};
 if(existing)viewer(existing[0]);else editor(null,filters);
}
function cardControls(){
 document.querySelectorAll('.section-org-report [data-open-jd],.employee-history-report [data-open-jd],#employeeForm [data-open-jd],[data-jd-card-toolbar]').forEach(button=>button.remove());
 const buttonFor=id=>{const b=document.createElement('button');b.type='button';b.dataset.openJd='1';b.dataset.jdEmployeeId=String(id);b.className='ppms-jd-person-button no-print';b.textContent='เพิ่ม / แก้ไข JD';b.title='JD รายบุคคลของรหัส '+id;return b};
 // JD editing is available only on the main factory organization chart.
 document.querySelectorAll('.division-org:not(.employee-history-report) .person[data-edit],.factory-summary .factory-chart-person[data-edit]').forEach(card=>{
  if(!card.querySelector('[data-jd-employee-id]'))card.append(buttonFor(card.dataset.edit));
 });
}
function controls(){if(!admin())return;if(window.PPMSOrganizationEditor?.dragging||window.PPMSSectionTeams?.dragging){clearTimeout(timer);timer=setTimeout(controls,120);return}installStyle();bindOfflineJD();refreshPositionTitles();
 const organizationPage=document.querySelector('.division-org:not(.employee-history-report),.factory-summary');
 if(!organizationPage)document.querySelectorAll('#app [data-jd-page-manager],#app>.ppms-jd-page-toolbar').forEach(button=>button.remove());
 if(organizationPage){
  let toolbar=document.querySelector('#app>.top-action-toolbar .top-action-buttons')||document.querySelector('.factory-summary>.org-config-head')||document.querySelector('#app>.ppms-jd-page-toolbar');
  if(!toolbar){toolbar=document.createElement('div');toolbar.className='ppms-jd-page-toolbar no-print';const heading=document.querySelector('#app>.page-head');if(heading)heading.after(toolbar);else organizationPage.before(toolbar)}
  if(!toolbar.querySelector('[data-jd-page-manager]')){const b=document.createElement('button');b.type='button';b.dataset.openJd='1';b.dataset.jdPageManager='1';b.className='no-print';b.textContent='+ เพิ่ม / จัดการ JD';toolbar.append(b)}
 }
 const bar=document.querySelector('.organization-scope-bar');bar?.querySelector('[data-open-jd]:not([data-jd-employee-id])')?.remove();
 document.querySelectorAll('.factory-summary .factory-org-section').forEach(section=>{if(section.querySelector('[data-open-jd]'))return;const b=document.createElement('button');b.type='button';b.dataset.openJd='1';b.dataset.jdSection=window.PPMSLanguage?.sourceText(section.querySelector('h4'))||section.querySelector('h4')?.textContent||'';b.textContent='JD รายบุคคล';b.className='ppms-jd-role';section.querySelector('h4')?.after(b)});cardControls();subscribe();seedMissingJDs();seedPositionJDs();upgradeSectionJDs()}
window.PPMSNormalizePosition=canonicalPosition;
// Export saved JD records, including pending offline edits, without creating drafts.
window.PPMSJDExport={async snapshot(people){
 if(!admin())return people.map(()=>null);
 await window.PPMS_JD_OFFLINE?.ready;
 const available=Object.values(window.PPMS_JD_OFFLINE?.overlay(records)||records);
 return people.map(person=>{
  const context=employeeJDContext(person.id);if(!context)return null;
  const personal=available.find(r=>r&&String(r.employeeId||'')===String(person.id));
  const role=personal||available.find(r=>r&&!r.employeeId&&['division','plant','section'].every(k=>normalize(r[k]).toLowerCase()===normalize(context[k]).toLowerCase())&&canonicalPosition(r.position).toLowerCase()===canonicalPosition(context.position).toLowerCase());
  return role?JSON.parse(JSON.stringify({...role,exportSource:personal?'JD รายบุคคล / Individual JD':'JD ตามตำแหน่ง / Position JD'})):null;
 });
}};
window.PPMSPositionTitle=record=>positionTitle({...record,division:record.division||record.organizationDivision||'Production Division'});
window.addEventListener('ppms-language-changed',()=>refreshPositionTitles());
// Capture on window before the chart's document handlers that open employee editing.
window.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-open-jd]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!admin())return;
 if(button.dataset.jdEmployeeId){openEmployeeJD(button.dataset.jdEmployeeId);return}
 const initial=scope();if(button.dataset.jdSection)initial.section=button.dataset.jdSection;
 if(initial.employeeId&&!button.dataset.jdSection)openEmployeeJD(initial.employeeId);else manager(initial);
},true);
window.addEventListener('keydown',e=>{
 const button=e.target.closest?.('[data-open-jd]');if(!button||!['Enter',' '].includes(e.key))return;
 e.preventDefault();e.stopImmediatePropagation();button.click();
},true);
window.addEventListener('afterprint',()=>document.body.classList.remove('ppms-jd-print'));
window.addEventListener('storage',e=>{if(e.key===CACHE){remoteRecords=read(CACHE,{});applyOfflineRecords();refreshActiveViewer();drawList()}if(e.key===MASTER)controls()});
window.addEventListener('ppms-organization-changed',controls);
window.addEventListener('ppms-employees-changed',()=>{seedMissingJDs();seedPositionJDs();upgradeSectionJDs();if(document.querySelector('#jdDialog [data-jd-list]'))manager(filters)});
window.addEventListener('online',()=>{subscribe();flushJDQueue()});
setInterval(flushJDQueue,15000);
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(controls,100)}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',controls);else controls();
})();

