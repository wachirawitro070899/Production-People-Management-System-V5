/* V694: Factory organization settings managed from the web. */
(async()=>{'use strict';
if(window.ppmsErrorGuard?.ready)await window.ppmsErrorGuard.ready;
const MK='ppms_organization_master_v1',EK='ppms_employee_organization_v1';
const FACTORY_PAGE=/factory-organization\.html$/i.test(location.pathname);
const DEF={plants:['โรง 1','โรง 2','โรง 3'],divisions:['Production Division','Quality Division','Warehouse Division','Corporate Administration Division','Business Operations Division'],sections:['Stamping Section','Welding Section','Sorting Section','CNC Section','Tapping Section','Bending Section','Engineering Support','Support Production','Machine Maintenance','Tooling Maintenance'],positions:['Manager','Engineer','Supervisor','Leader','Technician','Operator']};
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||JSON.parse(JSON.stringify(d))}catch{return JSON.parse(JSON.stringify(d))}};
const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SECTION_OUTBOX='ppms_organization_section_outbox_v872',POSITION_OUTBOX='ppms_organization_reporting_outbox_v870';
const sectionQueue=()=>{const value=read(SECTION_OUTBOX,[]);return Array.isArray(value)?value.filter(job=>job&&job.id&&typeof job.name==='string'&&typeof job.division==='string'&&typeof job.plant==='string'):[]};
let sectionJobs=sectionQueue(),sectionSyncing=false,sectionSyncTimer=null,sectionSyncFailures=0,sectionSyncNotice='',sectionDeleteRunning=false;
let master=read(MK,DEF),emap=read(EK,{});for(const k of Object.keys(DEF))if(!Array.isArray(master[k]))master[k]=[...DEF[k]];
if(!master.sectionMap){master.sectionMap={};master.sectionMap['Production Division::โรง 1']=[...master.sections];for(const p of master.plants.slice(1))master.sectionMap['Production Division::'+p]=[];for(const d of master.divisions.filter(x=>x!=='Production Division'))master.sectionMap[d+'::CENTRAL']=[];localStorage.setItem(MK,JSON.stringify(master))}
if(!master.positionMap){master.positionMap={};for(const d of master.divisions)master.positionMap[d]=d==='Production Division'?[...master.positions]:[];localStorage.setItem(MK,JSON.stringify(master))}
if(!master.sectionPositions)master.sectionPositions={};
function normalizeMaps(){if(!master.sectionMap)master.sectionMap={};if(!master.positionMap)master.positionMap={};if(!master.sectionPositions)master.sectionPositions={};for(const d of master.divisions)if(!Array.isArray(master.positionMap[d]))master.positionMap[d]=d==='Production Division'?[...master.positions]:[]}
function mergeCorporateAdministration(){if(master.corporateAdministrationV784)return;const target='Corporate Administration Division',old=['HR Division','Safety Division','Accounting Division'],oldSet=new Set(old),original=[...(master.divisions||[])],first=original.findIndex(x=>oldSet.has(x)),divisions=original.filter(x=>!oldSet.has(x)&&x!==target);divisions.splice(first>=0?first:Math.min(3,divisions.length),0,target);master.divisions=[...new Set(divisions)];const defaults=['Human Resources Section','Safety Section','Accounting Section'],sections=[];for(const [key,list] of Object.entries(master.sectionMap||{})){const division=key.split('::')[0];if((oldSet.has(division)||division===target)&&Array.isArray(list))sections.push(...list)}master.sectionMap[target+'::รวม']=[...new Set([...sections,...defaults])];const positions=[];for(const division of [...old,target])if(Array.isArray(master.positionMap?.[division]))positions.push(...master.positionMap[division]);master.positionMap[target]=[...new Set(positions)];for(const division of old){delete master.positionMap[division];for(const key of Object.keys(master.sectionMap||{}))if(key.startsWith(division+'::'))delete master.sectionMap[key]}for(const [key,list] of Object.entries({...master.sectionPositions})){const parts=key.split('::'),division=parts[0],section=parts[parts.length-1];if(!oldSet.has(division))continue;const next=target+'::รวม::'+section;master.sectionPositions[next]=[...new Set([...(master.sectionPositions[next]||[]),...(Array.isArray(list)?list:[])])];delete master.sectionPositions[key]}for(const value of Object.values(emap)){if(!value||!oldSet.has(value.division))continue;const previous=value.division;value.division=target;value.plant='รวม';if(!value.section)value.section=previous==='HR Division'?'Human Resources Section':previous==='Safety Division'?'Safety Section':'Accounting Section'}master.corporateAdministrationV784=true;master._updatedAt=Date.now();localStorage.setItem(MK,JSON.stringify(master));localStorage.setItem(EK,JSON.stringify(emap));db()?.ref('settings/organizationMaster').set(master).catch(console.warn);db()?.ref('employeeOrganization').set(emap).catch(console.warn)}
function mergeBusinessOperations(){if(master.businessOperationsV785)return;const target='Business Operations Division',old=['Planning Division','Purchasing Division','Marketing Division','จัดซื้อ Division','การตลาด Division'],oldSet=new Set(old),original=[...(master.divisions||[])],first=original.findIndex(x=>oldSet.has(x)),divisions=original.filter(x=>!oldSet.has(x)&&x!==target);divisions.splice(first>=0?first:divisions.length,0,target);master.divisions=[...new Set(divisions)];const defaults=['Planning Section','Purchasing Section','Marketing Section'],sections=[];for(const [key,list] of Object.entries(master.sectionMap||{})){const division=key.split('::')[0];if((oldSet.has(division)||division===target)&&Array.isArray(list))sections.push(...list)}master.sectionMap[target+'::รวม']=[...new Set([...sections,...defaults])];const positions=[];for(const division of [...old,target])if(Array.isArray(master.positionMap?.[division]))positions.push(...master.positionMap[division]);master.positionMap[target]=[...new Set(positions)];for(const division of old){delete master.positionMap[division];for(const key of Object.keys(master.sectionMap||{}))if(key.startsWith(division+'::'))delete master.sectionMap[key]}for(const [key,list] of Object.entries({...master.sectionPositions})){const parts=key.split('::'),division=parts[0],section=parts[parts.length-1];if(!oldSet.has(division))continue;const next=target+'::รวม::'+section;master.sectionPositions[next]=[...new Set([...(master.sectionPositions[next]||[]),...(Array.isArray(list)?list:[])])];delete master.sectionPositions[key]}for(const value of Object.values(emap)){if(!value||!oldSet.has(value.division))continue;const previous=value.division;value.division=target;value.plant='รวม';if(!value.section)value.section=previous==='Planning Division'?'Planning Section':/Purchasing|จัดซื้อ/.test(previous)?'Purchasing Section':'Marketing Section'}master.businessOperationsV785=true;master._updatedAt=Date.now();localStorage.setItem(MK,JSON.stringify(master));localStorage.setItem(EK,JSON.stringify(emap));db()?.ref('settings/organizationMaster').set(master).catch(console.warn);db()?.ref('employeeOrganization').set(emap).catch(console.warn)}
function expandDivisionNames(){if(master.fullDivisionNamesV787)return;const names={'QC Division':'Quality Division','Quality Control Division':'Quality Division','WH Division':'Warehouse Division'};master.divisions=[...new Set((master.divisions||[]).map(x=>names[x]||x))];for(const [oldName,newName] of Object.entries(names)){master.positionMap[newName]=[...new Set([...(master.positionMap[newName]||[]),...(master.positionMap[oldName]||[])])];delete master.positionMap[oldName];for(const [key,list] of Object.entries({...master.sectionMap})){if(!key.startsWith(oldName+'::'))continue;const next=newName+key.slice(oldName.length);master.sectionMap[next]=[...new Set([...(master.sectionMap[next]||[]),...(Array.isArray(list)?list:[])])];delete master.sectionMap[key]}for(const [key,list] of Object.entries({...master.sectionPositions})){if(!key.startsWith(oldName+'::'))continue;const next=newName+key.slice(oldName.length);master.sectionPositions[next]=[...new Set([...(master.sectionPositions[next]||[]),...(Array.isArray(list)?list:[])])];delete master.sectionPositions[key]}}for(const value of Object.values(emap))if(value&&names[value.division]){value.division=names[value.division];value.plant='รวม'}const selected=sessionStorage.getItem('ppms_scope_division');if(names[selected])sessionStorage.setItem('ppms_scope_division',names[selected]);master.fullDivisionNamesV787=true;master._updatedAt=Date.now();localStorage.setItem(MK,JSON.stringify(master));localStorage.setItem(EK,JSON.stringify(emap));db()?.ref('settings/organizationMaster').set(master).catch(console.warn);db()?.ref('employeeOrganization').set(emap).catch(console.warn)}
function unifyOrganization(){if(master.productionPlantsV751)return;const rename=x=>x==='จัดซื้อ Division'?'Purchasing Division':x==='การตลาด Division'?'Marketing Division':x,divisions=[...new Set((Array.isArray(master.divisions)?master.divisions:DEF.divisions).map(rename))],sourceMap=master.sectionMap||{},sourcePositions=master.sectionPositions||{},sectionMap={},sectionPositions={};for(const division of divisions){const sources=Object.entries(sourceMap).filter(([key])=>rename(key.split('::')[0])===division),sections=[...new Set(sources.flatMap(([,list])=>Array.isArray(list)?list:[]))];if(division==='Production Division')for(const section of DEF.sections)if(!sections.includes(section))sections.push(section);const plants=division==='Production Division'?DEF.plants:['รวม'];for(const plant of plants){sectionMap[division+'::'+plant]=[...sections];for(const section of sections){const values=[...new Set(Object.entries(sourcePositions).filter(([key])=>rename(key.split('::')[0])===division&&key.endsWith('::'+section)).flatMap(([,list])=>Array.isArray(list)?list:[]))];if(values.length)sectionPositions[division+'::'+plant+'::'+section]=values}}}const positionMap={};for(const [division,list]of Object.entries(master.positionMap||{})){const name=rename(division);positionMap[name]=[...new Set([...(positionMap[name]||[]),...(Array.isArray(list)?list:[])])]}master={...master,plants:[...DEF.plants],divisions,sectionMap,sectionPositions,positionMap,productionPlantsV751:true,_updatedAt:Date.now()};for(const value of Object.values(emap)){if(!value||typeof value!=='object')continue;value.division=rename(value.division||'Production Division');value.plant=value.division==='Production Division'&&DEF.plants.includes(value.plant)?value.plant:(value.division==='Production Division'?'โรง 1':'รวม')}sessionStorage.setItem('ppms_scope_plant','โรง 1');localStorage.setItem(MK,JSON.stringify(master));localStorage.setItem(EK,JSON.stringify(emap));db()?.ref('settings/organizationMaster').set(master).catch(console.warn);db()?.ref('employeeOrganization').set(emap).catch(console.warn)}
function expandAllDivisionsToPlants(){if(master.allDivisionsByPlant)return;for(const division of master.divisions){const legacy=master.sectionMap[division+'::CENTRAL'];for(const plant of master.plants){const key=division+'::'+plant;if(!Array.isArray(master.sectionMap[key]))master.sectionMap[key]=plant===master.plants[0]&&Array.isArray(legacy)?[...legacy]:[]}if(Array.isArray(legacy)){for(const section of legacy){const oldKey=division+'::CENTRAL::'+section,newKey=division+'::'+master.plants[0]+'::'+section;if(!master.sectionPositions[newKey]&&master.sectionPositions[oldKey])master.sectionPositions[newKey]=[...master.sectionPositions[oldKey]]}}}master.allDivisionsByPlant=true;saveMaster()}
function mergeSortingSections(){
 const combine=window.PPMSOrganizationScope.combinedSection,unique=values=>[...new Set(values.map(combine))];
 master.sections=unique(master.sections||[]);
 for(const key of Object.keys(master.sectionMap||{}))if(Array.isArray(master.sectionMap[key]))master.sectionMap[key]=unique(master.sectionMap[key]);
 // Presentation normalization only; no employee records or historical keys are rewritten.
 const serialized=JSON.stringify(master);if(localStorage.getItem(MK)!==serialized)localStorage.setItem(MK,serialized);
}
function removeGeneratedVacancies(){if(master.generatedVacanciesRemoved)return;for(const d of master.divisions){const list=Array.isArray(master.positionMap[d])?master.positionMap[d]:[];master.positionMap[d]=list.filter(name=>!DEF.positions.includes(name))}master.generatedVacanciesRemoved=true;saveMaster()}
const sectionKey=(division,plant)=>division+'::'+(plant||master.plants[0]);
const sectionsFor=(division,plant)=>(master.sectionMap&&master.sectionMap[sectionKey(division,plant)])||[];
const positionKey=(division,plant,section)=>sectionKey(division,plant)+'::'+String(section||'');
const db=()=>{try{if(!firebase.apps.length&&window.PPMS_FIREBASE_CONFIG)firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);return firebase.apps.length?firebase.database():null}catch{return null}};
function saveMaster(){if(window.PPMSAccess?.readOnly())return;master._updatedAt=Date.now();localStorage.setItem(MK,JSON.stringify(master));db()?.ref('settings/organizationMaster').set(master).catch(console.warn)}
function pendingMasterPositions(){const value=read(POSITION_OUTBOX,[]);return Array.isArray(value)?value.filter(job=>job?.type==='position'&&job.scope?.division&&job.name):[]}
function hasPendingMasterJobs(){return sectionJobs.length>0||pendingMasterPositions().length>0||window.PPMSPositionSlots?.hasPending()}
function replayPendingMaster(value){
 let next=JSON.parse(JSON.stringify(value||master));
 for(const job of pendingMasterPositions()){next.positions=[...new Set([...(next.positions||[]),job.name])];next.positionMap||={};next.positionMap[job.scope.division]=[...new Set([...(next.positionMap[job.scope.division]||[]),job.name])];}
 for(const job of sectionJobs)next=withNewSection(next,job.division,job.plant,job.name)||next;
 return window.PPMSPositionSlots?.replay(next)||next;
}
function applyOrganizationMaster(value){master=replayPendingMaster(value);localStorage.setItem(MK,JSON.stringify(master));enhance();redrawLiveEmployeeChart();window.dispatchEvent(new Event('ppms-organization-changed'));return master}
function sectionSyncStatus(){
 const text=sectionJobs.length?'บันทึกแผนกในเครื่องแล้ว • รอซิงก์':sectionSyncNotice,bar=document.querySelector('.organization-scope-bar');
 if(!bar||!sectionAdmin())return;
 let node=bar.querySelector('[data-section-sync-status]');if(!text){node?.remove();return}
 if(!node){node=document.createElement('span');node.dataset.sectionSyncStatus='1';node.className='section-sync-status no-print';node.setAttribute('role','status');node.style.cssText='flex-basis:100%;font-size:13px;color:#164d84';bar.append(node)}
 if(node.dataset.sectionSyncText!==text){node.dataset.sectionSyncText=text;node.textContent=text}
}
async function sectionCloudRequest(path,options={}){
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)throw Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await fetch(base+'/'+path+'.json',{...options,cache:'no-store',signal:controller.signal});if(!response.ok&&response.status!==412)throw Error('ฐานข้อมูลไม่ยืนยันการบันทึก ('+response.status+')');return {status:response.status,etag:response.headers.get('etag'),value:await response.json()}}
 finally{clearTimeout(timer)}
}
async function sectionMasterRequest(options={}){return sectionCloudRequest('settings/organizationMaster',options)}
async function commitSection(job){
 for(let attempt=0;attempt<5;attempt++){
  const existing=await sectionMasterRequest({headers:{'X-Firebase-ETag':'true'}}),source=existing.value||master,added=withNewSection(source,job.division,job.plant,job.name);
  if(existing.value&&!added)return source; // A retry or another editor already added this Section.
  const next=added||{...source,_updatedAt:Date.now()};
  if(!existing.etag)throw Error('ฐานข้อมูลยังไม่ยืนยันเวอร์ชัน');
  const result=await sectionMasterRequest({method:'PUT',headers:{'Content-Type':'application/json','if-match':existing.etag},body:JSON.stringify(next)});
  if(result.status===412)continue;
  if(!result.value||typeof result.value!=='object')throw Error('ฐานข้อมูลยังไม่ยืนยันการบันทึก');
  return result.value;
 }
 throw Error('มีการแก้ไขพร้อมกัน ระบบจะลองซิงก์อีกครั้ง');
}
async function syncSections(){
 if(sectionSyncing||sectionDeleteRunning||navigator.onLine===false||!sectionAdmin()||!sectionJobs.length)return;
 clearTimeout(sectionSyncTimer);sectionSyncTimer=null;sectionSyncing=true;
 try{
  while(sectionJobs.length&&!sectionDeleteRunning&&navigator.onLine!==false&&sectionAdmin()){
   const job=sectionJobs[0];
   try{
    const confirmed=await commitSection(job),remaining=sectionQueue().filter(value=>value.id!==job.id);
    localStorage.setItem(SECTION_OUTBOX,JSON.stringify(remaining));sectionJobs=remaining;sectionSyncFailures=0;sectionSyncNotice='เพิ่มแผนกและซิงก์เรียบร้อยแล้ว';applyOrganizationMaster(confirmed);
   }catch(error){
    sectionSyncFailures++;sectionSyncNotice='บันทึกแผนกในเครื่องแล้ว • รอซิงก์';sectionSyncStatus();
    sectionSyncTimer=setTimeout(()=>{sectionSyncTimer=null;void syncSections()},Math.min(60000,5000*Math.pow(2,Math.min(sectionSyncFailures-1,4))));break;
   }
  }
 }finally{sectionSyncing=false;sectionSyncStatus()}
}
function addSection(name,division,plant){
 if(!sectionAdmin())throw Error('กรุณาเข้าสู่ระบบ Admin');name=sectionName(name);plant=division==='Production Division'?plant:'รวม';
 if(!name||name.length>100||!master.divisions.includes(division)||(division==='Production Division'&&!master.plants.includes(plant)))throw Error('กรุณาระบุชื่อ Section และ Division ให้ถูกต้อง');
 sectionJobs=sectionQueue();const next=withNewSection(replayPendingMaster(master),division,plant,name);if(!next)throw Error('มีชื่อ Section นี้แล้วใน Division / โรงงานที่เลือก');
 const job={id:crypto.randomUUID?.()||String(Date.now())+'_'+Math.random(),division,plant,name,createdAt:new Date().toISOString()},queued=[...sectionJobs,job];
 localStorage.setItem(SECTION_OUTBOX,JSON.stringify(queued));sectionJobs=queued;sectionSyncNotice='บันทึกแผนกในเครื่องแล้ว • รอซิงก์';applyOrganizationMaster(next);void syncSections();return {name,pending:true};
}
window.PPMSOrganizationManager={...(window.PPMSOrganizationManager||{}),applyMaster:applyOrganizationMaster,addSection,renameSection,syncSections,pendingSections:()=>sectionJobs.map(job=>({...job}))};
function applyEmployeeScope(employee){
 if(!employee?.id||!employee.organizationDivision)return;
 const id=String(employee.id),division=employee.organizationDivision,plant=division==='Production Division'?(master.plants.includes(employee.organizationPlant)?employee.organizationPlant:master.plants[0]):'รวม';
 emap=read(EK,{});emap[id]={...(emap[id]||{}),division,plant};localStorage.setItem(EK,JSON.stringify(emap));
}
window.PPMSOrganizationManager.applyEmployeeScope=applyEmployeeScope;
function addStyle(){if(document.getElementById('orgManagerCss'))return;const s=document.createElement('style');s.id='orgManagerCss';s.textContent='.factory-summary{margin:12px 0;padding:16px;border:1px solid #b8c9dc;border-radius:14px;background:#f8fbff}.factory-plants{display:grid;grid-template-columns:repeat(3,minmax(280px,1fr));gap:12px;margin:14px 0}.factory-plant{border:2px solid #2563eb;border-radius:12px;background:#fff;overflow:hidden}.factory-plant h3{margin:0;padding:12px;background:#164d84;color:#fff}.factory-plant-count{display:block;padding:8px 12px;color:#475569}.factory-section-list{display:grid;gap:6px;padding:10px}.factory-section-slot{border:1px dashed #93a9c2;border-radius:8px;padding:8px;background:#f8fafc}.factory-central{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px}.factory-card{padding:11px;border:1px solid #d8e3ee;border-radius:10px;background:#fff}.factory-card b,.factory-card span{display:block}.factory-card span{font-size:12px;color:#64748b}.org-config{position:fixed;inset:0;z-index:10020;background:#0f172acc;display:grid;place-items:center;padding:16px}.org-config>section{width:min(1050px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:20px}.org-config-head{display:flex;justify-content:space-between;gap:10px}.org-config-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.org-config-box{border:1px solid #d7e2ed;border-radius:12px;padding:12px}.org-config-row,.org-config-add{display:flex;gap:8px;align-items:center;padding:6px 0}.org-config-row span,.org-config-add input{flex:1}@media(max-width:1000px){.factory-plants{grid-template-columns:1fr}}@media(max-width:700px){.org-config-grid{grid-template-columns:1fr}}';document.head.append(s)}
const labels={divisions:'Division',sections:'Section',positions:'ตำแหน่ง'};
function openConfig(){document.getElementById('orgConfig')?.remove();const m=document.createElement('div');m.id='orgConfig';m.className='org-config';let boxes='';for(const type of Object.keys(labels)){let rows='';master[type].forEach((x,i)=>rows+='<div class="org-config-row"><span>'+esc(x)+'</span><button type="button" class="secondary compact" data-org-remove="'+type+'" data-index="'+i+'">ลบ</button></div>');boxes+='<div class="org-config-box"><h3>'+labels[type]+'</h3>'+rows+'<form class="org-config-add" data-org-add="'+type+'"><input name="name" required placeholder="เพิ่ม'+labels[type]+'"><button>เพิ่ม</button></form></div>'}m.innerHTML='<section><div class="org-config-head"><div><h2>ตั้งค่า Factory Organization</h2><p>เพิ่มรายการจากหน้าเว็บได้ทันที ไม่ต้องแก้หลังบ้าน</p></div><button type="button" class="secondary" data-org-close>ปิด</button></div><div class="org-config-grid">'+boxes+'</div></section>';document.body.append(m)}
function sectionManager(){const root=document.querySelector('#orgConfig>section');if(!root||root.querySelector('#plantSectionManager'))return;const box=document.createElement('div');box.id='plantSectionManager';box.className='org-config-box';box.style.marginTop='14px';box.innerHTML='<h3>Section แยกตามโรงงาน / Division</h3><div class="org-config-add"><select id="sectionDivision">'+master.divisions.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select><select id="sectionPlant">'+master.plants.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></div><div id="plantSectionList"></div><form class="org-config-add"><input name="name" required placeholder="ชื่อ Section"><button>เพิ่ม Section</button></form>';root.append(box);const d=box.querySelector('#sectionDivision'),p=box.querySelector('#sectionPlant'),list=box.querySelector('#plantSectionList');const draw=()=>{const values=sectionsFor(d.value,p.value);list.innerHTML=values.length?values.map((x,i)=>'<div class="org-config-row"><span>'+esc(x)+'</span><button type="button" class="secondary compact" data-i="'+i+'">ลบ</button></div>').join(''):'<p>ยังไม่มี Section</p>'};d.onchange=draw;p.onchange=draw;box.querySelector('form').onsubmit=e=>{e.preventDefault();const name=String(new FormData(e.target).get('name')||'').trim(),key=sectionKey(d.value,p.value);if(name){try{addSection(name,d.value,p.value);e.target.reset();draw()}catch(error){alert(error.message)}}};list.onclick=e=>{const b=e.target.closest('[data-i]');if(b){master.sectionMap[sectionKey(d.value,p.value)].splice(Number(b.dataset.i),1);saveMaster();draw()}};draw()}
function overview(){const host=document.querySelector('.division-org');if(!host||document.querySelector('.factory-summary'))return;let people=[];try{people=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]')}catch{}let plants='',central='';for(const plant of master.plants){const assigned=people.filter(e=>{const x=emap[String(e.id)]||{division:'Production Division',plant:'โรง 1'};return x.division==='Production Division'&&x.plant===plant});let slots='';for(const section of master.sections){const n=assigned.filter(e=>String(e.section||'')===section).length;slots+='<div class="factory-section-slot"><b>'+esc(section)+'</b><span>'+n+' คน'+(n?'':' · ยังไม่เพิ่มพนักงาน')+'</span></div>'}plants+='<section class="factory-plant"><h3>Production Division — '+esc(plant)+'</h3><span class="factory-plant-count">'+assigned.length+' คน</span><div class="factory-section-list">'+slots+'</div></section>'}for(const div of master.divisions.filter(x=>x!=='Production Division')){const n=people.filter(e=>(emap[String(e.id)]||{}).division===div).length;central+='<div class="factory-card"><b>'+esc(div)+'</b><span>'+n+' คน · Division ส่วนกลาง</span></div>'}const box=document.createElement('section');box.className='factory-summary';box.innerHTML='<div class="org-config-head"><div><h2>FACTORY ORGANIZATION</h2><span>โครงสร้าง Production ทั้ง 3 โรงงาน และ Division ส่วนกลาง</span></div><button type="button" data-org-settings>ตั้งค่า Organization</button></div><div class="factory-plants">'+plants+'</div><h3>Central Divisions / Division ส่วนกลาง</h3><div class="factory-central">'+central+'</div>';host.before(box)}
function positionOptions(division,plant){const people=window.PPMSOrganizationScope.employees(chartPeople(),{division,plant});return [...new Set([...(master.positionMap?.[division]||[]),...people.map(e=>e.position),...(division==='Production Division'?['Specialist']:[])].filter(Boolean))].filter(position=>division==='Production Division'||!window.PPMSProductionHierarchy?.isSupervisor(position))}
function employeeFields(){const f=document.getElementById('employeeForm');if(!f||f.elements.organizationDivision)return;const id=String(f.elements.id?.value||''),person=chartPeople().find(e=>String(e.id)===id),saved={division:person?.organizationDivision||'Production Division',plant:person?.organizationPlant||master.plants[0],...(emap[id]||{})},x={...saved,plant:saved.division==='Production Division'&&master.plants.includes(saved.plant)?saved.plant:(saved.division==='Production Division'?master.plants[0]:'รวม')},anchor=f.elements.section?.closest('label');if(!anchor)return;const d=document.createElement('label');d.innerHTML='Division<select name="organizationDivision">'+master.divisions.map(v=>'<option '+(v===x.division?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>';const p=document.createElement('label');p.dataset.organizationPlantField='1';p.innerHTML='โรงงาน (เฉพาะ Production)<select name="organizationPlant">'+master.plants.map(v=>'<option '+(v===x.plant?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>';anchor.before(d,p);const pos=f.elements.position;if(pos){let dl=document.createElement('datalist');dl.id='orgPositions';dl.innerHTML=positionOptions(x.division,x.plant).map(v=>'<option value="'+esc(v)+'">').join('');f.append(dl);pos.setAttribute('list','orgPositions')}}
function sectionOptions(){
 const f=document.getElementById('employeeForm'),select=f?.elements.section,d=f?.elements.organizationDivision,p=f?.elements.organizationPlant,position=f?.elements.position;
 if(!select||!d||!p||!position)return;
 const hierarchy=window.PPMSProductionHierarchy,supervisor=hierarchy?.isSupervisor(position.value);
 if(!position.dataset.organizationRoleBound){position.dataset.organizationRoleBound='1';position.addEventListener('input',sectionOptions);position.addEventListener('change',sectionOptions)}
 if(!d.dataset.sectionBound){d.dataset.sectionBound='1';d.onchange=sectionOptions;p.onchange=sectionOptions}
 let previous=select.value;
 if(supervisor){
  if(!f.dataset.supervisorScopeLocked)f.dataset.beforeSupervisorScope=JSON.stringify({division:d.value,plant:p.value,section:previous});
  f.dataset.supervisorScopeLocked='1';d.value='Production Division';d.disabled=true;select.disabled=true;
  select.innerHTML='<option value="'+esc(hierarchy.supervisorSection)+'">Production Division — supervises production sections</option>';
  select.value=hierarchy.supervisorSection;
  let note=f.querySelector('[data-supervisor-scope-note]');if(!note){note=document.createElement('small');note.dataset.supervisorScopeNote='1';note.className='modal-note';select.closest('label').append(note)}
  note.textContent='Stamping, Bending, Tapping, Welding, CNC, Sorting';
 }else{
  if(f.dataset.supervisorScopeLocked){try{const before=JSON.parse(f.dataset.beforeSupervisorScope||'{}');d.value=before.division||'Production Division';p.value=before.plant||master.plants[0];previous=before.section||''}catch{}delete f.dataset.supervisorScopeLocked;delete f.dataset.beforeSupervisorScope}
  d.disabled=false;select.disabled=false;f.querySelector('[data-supervisor-scope-note]')?.remove();
  const division=d.value,plant=division==='Production Division'?(master.plants.includes(p.value)?p.value:master.plants[0]):'รวม',allowed=window.PPMSOrganizationScope.sections(chartPeople(),{division,plant});
  select.innerHTML=allowed.map(x=>'<option>'+esc(x)+'</option>').join('')||'<option value="">ยังไม่มี Section</option>';if(allowed.includes(previous))select.value=previous;
 }
 for(const name of ['stampingShift','stampingGroup','stampingRole','stampingMachines','sortingGroup']){const field=f.elements[name],label=field?.closest('label');if(!field||!label)continue;if(supervisor){if(!field.dataset.supervisorLocked){field.dataset.beforeSupervisorDisabled=field.disabled?'1':'0';label.dataset.beforeSupervisorHidden=label.hidden?'1':'0';label.dataset.beforeSupervisorDisplay=label.style.display}field.dataset.supervisorLocked='1';field.disabled=true;label.hidden=true;label.style.display='none'}else if(field.dataset.supervisorLocked){field.disabled=field.dataset.beforeSupervisorDisabled==='1';label.hidden=label.dataset.beforeSupervisorHidden==='1';label.style.display=label.dataset.beforeSupervisorDisplay||'';delete label.dataset.beforeSupervisorDisplay;delete field.dataset.supervisorLocked;delete field.dataset.beforeSupervisorDisabled;delete label.dataset.beforeSupervisorHidden}}
 for(const note of select.closest('label').querySelectorAll('small:not([data-supervisor-scope-note])')){if(supervisor){if(!note.dataset.supervisorLocked)note.dataset.beforeSupervisorHidden=note.hidden?'1':'0';note.dataset.supervisorLocked='1';note.hidden=true}else if(note.dataset.supervisorLocked){note.hidden=note.dataset.beforeSupervisorHidden==='1';delete note.dataset.supervisorLocked;delete note.dataset.beforeSupervisorHidden}}
 const production=d.value==='Production Division',plant=production&&master.plants.includes(p.value)?p.value:(production?master.plants[0]:'รวม');
 p.closest('label').style.display=production?'':'none';p.disabled=!production;
 const list=f.querySelector('#orgPositions');if(list)list.innerHTML=positionOptions(d.value,plant).map(v=>'<option value="'+esc(v)+'">').join('');
}

function chartStyle(){if(document.getElementById('orgChartPickerCss'))return;const s=document.createElement('style');s.id='orgChartPickerCss';s.textContent='.factory-chart-picker{margin-top:18px;padding-top:16px;border-top:2px solid #164d84}.factory-chart-picker select{min-width:190px}.factory-chart-title{text-align:center;margin:16px 0;color:#164d84}.factory-manager{display:flex;justify-content:center;margin:18px 0 45px;position:relative}.factory-manager:after{content:"";position:absolute;left:8%;right:8%;bottom:-25px;border-top:2px solid #9fb4ca}.factory-org-sections{display:flex;gap:12px;overflow-x:auto;align-items:flex-start;padding:8px 0 18px}.factory-org-section{flex:0 0 330px;border:1px solid #bdd0e3;border-radius:12px;background:#f8fbff;overflow:hidden}.factory-org-section>h4{margin:0;padding:12px;text-align:center;background:#e9f1f8;color:#164d84}.factory-org-meta{text-align:center;padding:5px;color:#64748b;font-size:12px}.factory-role{border-top:1px solid #cbd5e1;padding:9px}.factory-role>strong{display:block;text-align:center;background:#fff;border:1px solid #cbd5e1;border-radius:18px;padding:4px;color:#164d84}.factory-shift{border-top:1px solid #b9e6ca;padding:7px}.factory-shift>em{display:block;color:#166534;font-size:12px;font-style:normal;font-weight:700}.factory-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:7px}.factory-chart-person{position:relative;text-align:center;border:2px solid #22c55e;border-radius:9px;padding:8px 5px;background:#ecfdf5;min-height:118px;cursor:pointer}.factory-chart-person.status-absent{border-color:#ef4444;background:#fff1f2}.factory-chart-person.status-leave{border-color:#f59e0b;background:#fffbeb}.factory-chart-person.status-waiting{border-color:#94a3b8;background:#f8fafc}.factory-chart-person img,.factory-chart-person .avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;margin:auto}.factory-chart-person b,.factory-chart-person small{display:block;word-break:break-word}.factory-chart-person small{font-size:10px;color:#64748b}.factory-status{font-size:9px;color:#166534;margin-bottom:4px}.factory-chart-empty{padding:18px;text-align:center;color:#94a3b8;border:1px dashed #94a3b8;border-radius:8px}.factory-section-empty{padding:20px;text-align:center;color:#94a3b8}@media(max-width:700px){.factory-org-section{flex-basis:88vw}.factory-people{grid-template-columns:1fr}}';document.head.append(s)}
let chartRosterRaw=null,chartRoster=[];
function chartPeople(){try{const raw=localStorage.getItem('ppms_v3_employees')||'[]';if(raw!==chartRosterRaw){const x=JSON.parse(raw);chartRoster=Array.isArray(x)?x:[];chartRosterRaw=raw}return chartRoster}catch{return []}}
let attendanceRaw='',attendanceToday='',attendanceIndex=new Map();
function attendanceState(e){const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());try{const raw=localStorage.getItem('ppms_v3_attendance')||'[]';if(raw!==attendanceRaw||today!==attendanceToday){attendanceRaw=raw;attendanceToday=today;attendanceIndex=new Map((JSON.parse(raw)||[]).filter(x=>String(x.date)===today).map(x=>[String(x.employeeId),x]))}}catch{attendanceIndex=new Map()}const r=attendanceIndex.get(String(e.id)),status=String(r?.exception?.type||r?.status||r?.type||'').toLowerCase(),leaveType=String(r?.exception?.leaveType||r?.leaveType||'').toLowerCase();if(r?.checkIn||r?.time||/present|check/.test(status))return{key:'working',label:'● ทำงาน / เช็คชื่อแล้ว'};if(status==='leave'||/leave|sick|business|personal/.test(status+' '+leaveType))return{key:'leave',label:r?.exception?.leaveType==='sick'?'● ลาป่วย':'● ลากิจ'};if(/absent/.test(status))return{key:'absent',label:'● ขาดงาน'};return{key:'waiting',label:'● รอเช็คชื่อ'}}
function personCard(e){const photo=window.PPMSEmployeePhotos?.displaySource(e)||e.photoData||e.photoUrl||'';return '<div class="factory-chart-person" data-edit="'+esc(e.id)+'" role="button" tabindex="0">'+(photo?'<img src="'+esc(photo)+'" alt="">':'<span class="avatar">?</span>')+'<b>'+esc(e.name||e.thaiName||e.id)+'</b><small>'+esc(e.id)+'</small><small data-i18n-ignore data-employee-position-id="'+esc(e.id)+'">'+esc(window.PPMSCardPositionTitle?window.PPMSCardPositionTitle({...e,division:emap[String(e.id)]?.division||e.organizationDivision||'Production Division'}):(e.position||'ไม่ระบุตำแหน่ง'))+'</small></div>'}
function divisionOf(e){const saved=emap[String(e.id)]||{},legacy=String(saved.division||e?.organizationDivision||'Production Division'),division=legacy==='จัดซื้อ Division'?'Purchasing Division':legacy==='การตลาด Division'?'Marketing Division':legacy,rawPlant=String(saved.plant||e?.organizationPlant||'โรง 1'),plant=division==='Production Division'&&master.plants.includes(rawPlant)?rawPlant:(division==='Production Division'?master.plants[0]:'รวม');return{division,plant}}
function seniorityCompare(a,b){
 const type=e=>/^(permanent|พนักงานประจำ)$/i.test(String(e?.contractType||'').trim())?0:1;
 const start=e=>{const t=Date.parse(String((type(e)===0?e?.permanentStartDate:'')||e?.startDate||''));return Number.isFinite(t)?t:Number.MAX_SAFE_INTEGER};
 return type(a)-type(b)||start(a)-start(b)||String(a?.id||'').localeCompare(String(b?.id||''),undefined,{numeric:true,sensitivity:'base'});
}
function positionRank(name){const x=String(name||'').toLowerCase();if(window.PPMSProductionHierarchy?.isHead(name))return -2;if(/specialist/.test(x))return -1;if(/leader/.test(x))return 0;if(/supervisor/.test(x))return 1;if(/engineer/.test(x))return 2;if(/technician/.test(x))return 3;if(/\b(?:operator|opeartor|operater)\b|^op(?:\b|\d)|พนักงานทั่วไป|พนักงานผลิต/.test(x.trim()))return 5;return 4}
function positionClass(name){const x=String(name||'').toLowerCase();if(window.PPMSProductionHierarchy?.isHead(name))return'head';if(/specialist/.test(x))return'specialist';if(/leader/.test(x))return'leader';if(/supervisor/.test(x))return'supervisor';if(/engineer/.test(x))return'engineer';if(/technician/.test(x))return'technician';if(/\b(?:operator|opeartor|operater)\b|^op(?:\b|\d)|พนักงานทั่วไป|พนักงานผลิต/.test(x.trim()))return'operator';return'other'}
function renderDivisionChart(select,detail){
 const division=select.value,plant=division==='Production Division'?(document.getElementById('factoryPlantChart')?.value||master.plants[0]):'รวม',hierarchy=window.PPMSProductionHierarchy;
 const scopedMembers=chartPeople().filter(e=>{const x=divisionOf(e);return x.division===division&&(division!=='Production Division'||x.plant===plant)});
 const members=window.PPMSProductionLines?.filter(scopedMembers,{division,plant})||scopedMembers;
 const managers=members.filter(e=>/manager/i.test(String(e.position||''))),supervisors=division==='Production Division'&&hierarchy?members.filter(e=>hierarchy.isSupervisor(e.position)).sort(seniorityCompare):[];
 const heads=division==='Production Division'&&hierarchy?members.filter(e=>hierarchy.isHead(e.position)).sort(seniorityCompare):[];
 const castingSpecialists=division==='Production Division'&&hierarchy?members.filter(e=>hierarchy.isCastingSpecialist(e.position)).sort(seniorityCompare):[];
 const workers=members.filter(e=>!managers.includes(e)&&!supervisors.includes(e)&&!heads.includes(e)&&!castingSpecialists.includes(e));
 const names=[...new Set([...sectionsFor(division,plant),...workers.map(e=>String(e.section||'')).filter(Boolean)])];
 const canonical=window.PPMSOrganizationScope.sectionGroupKey;
 const sections=[...new Set(names.map(window.PPMSOrganizationScope.combinedSection))].filter((name,index,values)=>values.findIndex(value=>canonical(value)===canonical(name))===index).map(section=>({section,title:section,sortingGroup:''})).filter(item=>!(master.removedSections?.[sectionKey(division,plant)]||[]).some(name=>canonical(name)===canonical(item.title))||workers.some(e=>canonical(e.section)===canonical(item.section)));
 const front=['Engineering Support','Support Production','Machine Maintenance','Tooling Maintenance'];
 sections.sort((a,b)=>{const rank=value=>{const index=front.indexOf(value.replace(/\s+Section$/i,''));return index<0?front.length:index};return rank(a.title)-rank(b.title)});
 const chart=sections.filter(item=>window.PPMSProductionLines?.visibleSection(item.section,members,{division,plant})!==false).map(item=>{
  const section=item.section,sectionMembers=workers.filter(e=>canonical(e.section)===canonical(section)&&(!item.sortingGroup||e.sortingGroup===item.sortingGroup));
  const specialist=hierarchy?.hasSpecialist(section,division)&&!sectionMembers.some(e=>positionClass(e.position)==='specialist')?['Specialist']:[];
  const vacancies=hierarchy?.positionVacancies?.(item.sortingGroup||section,{division,plant})||[],saved=Object.entries(master.sectionPositions).filter(([key])=>key.startsWith(sectionKey(division,plant)+'::')&&canonical(key.split('::').at(-1))===canonical(section)).flatMap(([,values])=>values),positions=[...new Set([...saved,...specialist,...vacancies.map(target=>target.position),...sectionMembers.map(e=>String(e.position||'')).filter(Boolean)].map(value=>positionClass(value)==='operator'?'Operator':value))].sort((a,b)=>positionRank(a)-positionRank(b)||String(a).localeCompare(String(b)));
  let roles='';for(const position of positions){const group=sectionMembers.filter(e=>position==='Operator'?positionClass(e.position)==='operator':String(e.position||'')===position).sort(seniorityCompare),roleClass=positionClass(position),slots=vacancies.filter(target=>positionClass(position)==='operator'?positionClass(target.position)==='operator':target.position===position).map(target=>hierarchy.positionVacancyMarkup(target)).join('');roles+='<div class="factory-role factory-role-'+roleClass+'"><strong>'+esc(position)+'</strong>'+(group.length||slots?'<div class="factory-people">'+group.map(personCard).join('')+slots+'</div>':(roleClass==='specialist'&&hierarchy?.hasSpecialist(section,division)?'<div class="factory-people">'+hierarchy.specialistVacancyMarkup()+'</div>':''))+'</div>'}
  return {...item,html:'<section class="factory-org-section" data-org-section="'+esc(item.title)+'"><h4>'+esc(item.title)+'</h4><div class="factory-org-meta">'+sectionMembers.length+' Employees</div><button type="button" class="section-position-add" data-add-section-position data-section="'+esc(item.sortingGroup||section)+'">+ เพิ่มตำแหน่งใน Section</button>'+(roles||'<div class="factory-section-empty">ยังไม่มีตำแหน่ง</div>')+'</section>'};
 });
 const managerHtml=managers.length?'<div class="factory-manager"><div class="factory-people">'+managers.map(personCard).join('')+'</div></div>':'';
 const organization=division==='Production Division'&&hierarchy?hierarchy.chartMarkup(chart,supervisors.map(personCard).join(''),{factory:true,heads:heads.map(personCard).join(''),castingSpecialists:castingSpecialists.map(personCard).join('')}):'<div class="factory-org-sections">'+(chart.map(item=>item.html).join('')||'<div class="factory-chart-empty">ยังไม่มี Section — กด “+ เพิ่ม Section”</div>')+'</div>';
 const lineChart=window.PPMSProductionLines?.isLineView({division,plant})?window.PPMSProductionLines.chartMarkup(members,sections,personCard,(item,list)=>{const order={head:0,engineer:1,supervisor:2,specialist:3,leader:4,technician:5,other:6,operator:7},positions=[...new Set(list.map(e=>e.position))].sort((a,b)=>order[positionClass(a)]-order[positionClass(b)]||String(a).localeCompare(String(b)));return '<section class="factory-org-section" data-org-section="'+esc(item.title)+'"><h4>'+esc(item.title)+'</h4><div class="factory-org-meta">'+list.length+' Employees</div>'+positions.map(position=>'<div class="factory-role factory-role-'+positionClass(position)+'"><strong>'+esc(position)+'</strong><div class="factory-people">'+list.filter(e=>e.position===position).sort(seniorityCompare).map(personCard).join('')+'</div></div>').join('')+'</section>'},{division,plant}):null;
 detail.innerHTML=(window.PPMSProductionLines?.controlsMarkup({division,plant})||'')+(window.PPMSPositionSlots?.summaryMarkup({division,plant})||'')+'<div class="org-config-head"><h3 class="factory-chart-title">'+esc(division)+(division==='Production Division'?' — '+esc(plant):'')+'</h3><button type="button" data-add-factory-section>+ เพิ่ม Section</button></div>'+(lineChart??(managerHtml+organization));
 deleteSectionControls();scopeTitle();
}
function chartPicker(){const box=document.querySelector('.factory-summary');if(!box||box.querySelector('.factory-chart-picker'))return;chartStyle();const area=document.createElement('section');area.className='factory-chart-picker';area.innerHTML='<div class="org-config-add"><label>Division<select id="factoryDivisionChart">'+master.divisions.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label><label id="factoryPlantChartLabel">โรงงาน<select id="factoryPlantChart">'+master.plants.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label></div><div id="factoryDivisionChartDetail"></div>';box.append(area);const select=area.querySelector('#factoryDivisionChart'),plant=area.querySelector('#factoryPlantChart'),plantLabel=area.querySelector('#factoryPlantChartLabel'),detail=area.querySelector('#factoryDivisionChartDetail');select.value=sessionStorage.getItem('ppms_scope_division')||master.divisions[0];if(!master.divisions.includes(select.value))select.selectedIndex=0;plant.value=master.plants.includes(sessionStorage.getItem('ppms_scope_plant'))?sessionStorage.getItem('ppms_scope_plant'):master.plants[0];const draw=()=>{plantLabel.style.display=select.value==='Production Division'?'':'none';renderDivisionChart(select,detail)};select.addEventListener('change',()=>{window.PPMSOrganizationScope.activate({division:select.value,plant:plant.value});draw();scopeTitle()});plant.addEventListener('change',()=>{window.PPMSOrganizationScope.activate({division:select.value,plant:plant.value});draw();scopeTitle()});draw()}
function simplifyOrganization(){const box=document.querySelector('.factory-summary');if(!box)return;box.querySelector('[data-org-settings]')?.remove();box.querySelector('.factory-plants')?.remove();box.querySelector('.factory-central')?.remove();[...box.children].filter(x=>x.tagName==='H3').forEach(x=>x.remove());document.querySelector('.division-org')?.remove();document.querySelector('.org-current-shift-banner')?.remove();document.querySelector('.org-attendance-legend')?.remove();document.querySelector('#app>.cards')?.remove();const title=document.querySelector('#app>.page-head h2');if(title)title.textContent='Factory Organization Chart'}
function scopeStyle(){if(document.getElementById('orgScopeCss'))return;const s=document.createElement('style');s.id='orgScopeCss';s.textContent='.organization-scope-bar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;background:#eaf3ff;border:1px solid #9fc1e8;border-radius:12px;padding:10px 14px;margin:0 0 12px}.organization-scope-bar label{min-width:190px}.organization-scope-bar b{padding:10px;color:#164d84}';document.head.append(s)}
function scopeTitle(){window.PPMSOrganizationScope?.applyTitles()}
function neutralFactoryStyle(){if(document.getElementById('neutralFactoryCss'))return;const s=document.createElement('style');s.id='neutralFactoryCss';s.textContent='.factory-chart-person,.factory-chart-person.status-absent,.factory-chart-person.status-waiting{border-color:#9fb8cf;background:#fff}.factory-chart-person.status-leave{border-color:#eab308!important;background:#fef9c3!important;box-shadow:0 0 0 3px rgba(234,179,8,.16)}.factory-status,.factory-shift{display:none}.factory-status-leave{display:block!important;color:#854d0e;font-weight:800;margin-bottom:5px}';document.head.append(s)}
function sectionPositionStyle(){if(document.getElementById('sectionPositionCss'))return;const s=document.createElement('style');s.id='sectionPositionCss';s.textContent='.section-position-add{display:block;margin:7px auto;padding:6px 10px;font-size:12px}.factory-role:has(.factory-people){padding-bottom:10px}.factory-role{border-top-width:3px}.factory-role>strong{color:#fff;border-color:transparent}.factory-role-leader{border-top-color:#164d84;background:#eef6ff}.factory-role-leader>strong{background:#164d84}.factory-role-supervisor{border-top-color:#7c3aed;background:#f5f3ff}.factory-role-supervisor>strong{background:#7c3aed}.factory-role-specialist,.factory-role-engineer{border-top-color:#0284c7;background:#f0f9ff}.factory-role-specialist>strong,.factory-role-engineer>strong{background:#0284c7}.factory-role-technician{border-top-color:#d97706;background:#fffbeb}.factory-role-technician>strong{background:#d97706}.factory-role-operator{border-top-color:#059669;background:#ecfdf5}.factory-role-operator>strong{background:#059669}.factory-role-other{border-top-color:#64748b;background:#f8fafc}.factory-role-other>strong{background:#64748b}';document.head.append(s)}
function defaultFormScope(){const f=document.getElementById('employeeForm');if(!f||f.elements.originalId?.value||f.dataset.orgDefaulted)return;f.dataset.orgDefaulted='1';const division=sessionStorage.getItem('ppms_scope_division'),plant=sessionStorage.getItem('ppms_scope_plant');if(division&&master.divisions.includes(division))f.elements.organizationDivision.value=division;if(plant&&master.plants.includes(plant))f.elements.organizationPlant.value=plant}
function redrawLiveEmployeeChart(){
 const select=document.getElementById('factoryDivisionChart'),detail=document.getElementById('factoryDivisionChartDetail');
 if(select&&detail)renderDivisionChart(select,detail);
}
window.addEventListener('ppms-employees-changed',redrawLiveEmployeeChart);
window.addEventListener('ppms-production-lines-changed',redrawLiveEmployeeChart);
window.addEventListener('storage',event=>{if(event.key==='ppms_v3_employees'||event.key==='ppms_v3_deleted_employee_ids')redrawLiveEmployeeChart()});
// The separate Factory Organization page does not load the main app runtime.
let factoryRosterLoading=false;
async function refreshFactoryRoster(){
 if(!FACTORY_PAGE||sessionStorage.getItem('ppms_admin')!=='1'||factoryRosterLoading||navigator.onLine===false)return;
 const base=String(window.PPMS_FIREBASE_CONFIG?.databaseURL||'').replace(/\/$/,'');if(!base)return;
 factoryRosterLoading=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const values=await Promise.all(['employees','deletedEmployeeIds'].map(async path=>{
   const response=await fetch(base+'/ppms/'+path+'.json',{signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw Error('โหลดรายชื่อไม่สำเร็จ');return response.json();
  }));
  const deleted=new Set(Object.values(values[1]||{}).map(String));
  const rows=Object.values(values[0]||{}).filter(e=>e&&e.id!=null&&!deleted.has(String(e.id)));
  const encoded=JSON.stringify(rows);
  if(encoded!==localStorage.getItem('ppms_v3_employees')){localStorage.setItem('ppms_v3_employees',encoded);localStorage.setItem('ppms_v3_deleted_employee_ids',JSON.stringify([...deleted]));redrawLiveEmployeeChart()}
 }catch(_){/* Keep the last confirmed roster if a network read fails. */}
 finally{clearTimeout(timer);factoryRosterLoading=false}
}
if(FACTORY_PAGE){setInterval(refreshFactoryRoster,10000);window.addEventListener('online',refreshFactoryRoster);window.addEventListener('focus',refreshFactoryRoster);setTimeout(refreshFactoryRoster,500)}
function factoryLink(){document.querySelector('#nav [data-factory-organization]')?.remove()}

// V836: Create a Section from the main system and share it through the organization master.
function sectionAdmin(){return sessionStorage.getItem('ppms_admin')==='1'&&window.PPMSAccess?.canEdit()!==false}
function sectionControls(){
 document.querySelectorAll('#employeeForm [data-create-section]').forEach(button=>button.remove());
 if(!sectionAdmin())return;
 const bar=document.querySelector('.organization-scope-bar');
 const organizationPage=Boolean(document.querySelector('.division-org,.factory-summary'));
 if(!organizationPage){bar?.querySelector('[data-create-section]')?.remove();return}
 if(bar&&!bar.querySelector('[data-create-section]')){const b=document.createElement('button');b.type='button';b.dataset.createSection='1';b.textContent='+ เพิ่ม Section';bar.append(b)}
 sectionSyncStatus();
}

function sectionIdentity(value){return window.PPMSOrganizationScope?.sectionKey(value)||sectionName(value).toLowerCase().replace(/^แผนก\s*/,'').replace(/\s+section$/i,'')}
function sectionMembers(people,organization,division,plant,name,deleted=[]){
 const gone=new Set(deleted.map(String)),target=sectionIdentity(name);
 return people.filter(e=>{
  if(!e||e.id==null||gone.has(String(e.id)))return false;
  const actual=sectionIdentity(e.section),group=sectionIdentity(e.sortingGroup);
  const matches=actual===target||(actual==='sorting'&&['sorting1','sorting2'].includes(target)&&group===target)||(target==='sorting'&&['sorting1','sorting2'].includes(actual));
  if(!matches)return false;
  const org=organization[String(e.id)]||{};
  return (org.division||e.organizationDivision||'Production Division')===division&&
   (division!=='Production Division'||(org.plant||e.organizationPlant||master.plants[0])===plant);
 });
}
function managedSectionNames(division,plant){
 const key=sectionKey(division,plant),gone=Object.values(read('ppms_v3_deleted_employee_ids',[])).map(String),people=chartPeople().filter(e=>!gone.includes(String(e.id))&&e.employmentStatus!=='resigned'),scoped=people.filter(e=>{const x=window.PPMSOrganizationScope.employeeScope(e);return x.division===division&&x.plant===plant});
 const positions=Object.keys(master.sectionPositions||{}).filter(value=>value.startsWith(key+'::')).map(value=>value.slice(key.length+2)),vacancies=Object.values(master.positionVacancies||{}).filter(t=>t&&t.division===division&&t.plant===plant).map(t=>t.section),labels=(master.sectionLabels?.[key]||[]).map(t=>t.section);
 const names=[...sectionsFor(division,plant),...scoped.map(e=>e.section),...positions,...vacancies,...labels].filter(Boolean).map(window.PPMSOrganizationScope.combinedSection),removed=master.removedSections?.[key]||[];
 return names.filter((name,index)=>names.findIndex(value=>sectionIdentity(value)===sectionIdentity(name))===index&&(!removed.some(value=>sectionIdentity(value)===sectionIdentity(name))||sectionMembers(scoped,emap,division,plant,name,gone).length));
}
function withoutSection(source,division,plant,name){
 if(!source)return undefined;
 const next=JSON.parse(JSON.stringify(source)),key=sectionKey(division,plant),values=next.sectionMap?.[key]||[],identity=sectionIdentity(name);
 const aliases=values.filter(value=>sectionIdentity(value)===identity);
 next.sectionMap||={};
 next.sectionMap[key]=values.filter(value=>sectionIdentity(value)!==identity);
 if(Array.isArray(next.sectionLabels?.[key]))next.sectionLabels[key]=next.sectionLabels[key].filter(item=>sectionIdentity(item.section)!==identity);
 for(const position of Object.keys(next.sectionPositions||{}))if(position.startsWith(key+'::')&&sectionIdentity(position.slice(key.length+2))===identity)delete next.sectionPositions[position];
 if(!Object.values(next.sectionMap).some(list=>Array.isArray(list)&&list.some(value=>sectionIdentity(value)===identity)))next.sections=(next.sections||[]).filter(value=>sectionIdentity(value)!==identity);
 if(next.positionVacancies)next.positionVacancies=Object.values(next.positionVacancies).filter(t=>!t||t.division!==division||t.plant!==plant||sectionIdentity(t.section)!==identity);
 next.removedSections||={};next.removedSections[key]=[...new Set([...(next.removedSections[key]||[]),...aliases,name])];
 next._updatedAt=Date.now();return next;
}
async function sectionDeletionMembers(division,plant,name){
 const snapshots=await Promise.all(['ppms/employees','employeeOrganization','ppms/deletedEmployeeIds'].map(path=>sectionCloudRequest(path)));
 const people=Object.values(snapshots[0].value||{}),organization=snapshots[1].value||{},deleted=Object.values(snapshots[2].value||{}).map(String);
 // Only unsent employee saves supplement the server roster; stale local rows cannot block deletion.
 const pending=Object.values(read('ppms_v3_pending_employee_saves',{})).filter(job=>job?.data&&!job.patchFields).map(job=>job.data);
 const members=[...sectionMembers(people,organization,division,plant,name,deleted),...sectionMembers(pending,emap,division,plant,name,deleted)];
 return [...new Map(members.map(person=>[String(person.id),person])).values()];
}
async function deleteSection(division,plant,name,button){
 if(!sectionAdmin())return;
 if(navigator.onLine===false){alert('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนลบ Section');return}
 if(sectionSyncing||sectionDeleteRunning){alert('กำลังซิงก์แผนก กรุณารอสักครู่แล้วลองลบอีกครั้ง');return}
 sectionDeleteRunning=true;const label=button.textContent;button.disabled=true;button.textContent='กำลังตรวจสอบ Section...';
 try{
  let members=await sectionDeletionMembers(division,plant,name);
  if(members.length){alert('Section นี้ยังมีพนักงาน '+members.length+' คน กรุณาย้ายพนักงานไป Section ที่ถูกต้องก่อนลบ');return}
  if(!confirm('ลบ Section '+name+' ใน '+division+' หรือไม่?'))return;
  button.textContent='กำลังลบ Section...';let confirmed=null;
  for(let attempt=0;attempt<5;attempt++){
   const existing=await sectionMasterRequest({headers:{'X-Firebase-ETag':'true'}});if(!existing.etag)throw Error('ฐานข้อมูลยังไม่ยืนยันเวอร์ชัน กรุณาลองใหม่');
   let source=existing.value;const pending=sectionQueue().some(job=>job.division===division&&job.plant===plant&&sectionIdentity(job.name)===sectionIdentity(name));
   if(pending&&source&&!source.sectionMap?.[sectionKey(division,plant)]?.some(value=>sectionIdentity(value)===sectionIdentity(name))){source=JSON.parse(JSON.stringify(source));source.sectionMap||={};const key=sectionKey(division,plant);source.sectionMap[key]=[...(source.sectionMap[key]||[]),name]}
   const next=withoutSection(source,division,plant,name);if(!next)throw Error('ไม่พบ Section ในรายการล่าสุด กรุณาเปิดรายการใหม่');
   members=await sectionDeletionMembers(division,plant,name);if(members.length)throw Error('Section นี้มีพนักงาน '+members.length+' คนแล้ว กรุณาย้ายพนักงานก่อนลบ');
   const saved=await sectionMasterRequest({method:'PUT',headers:{'Content-Type':'application/json','if-match':existing.etag},body:JSON.stringify(next)});
   if(saved.status===412)continue;
   if(!saved.value||!saved.value.removedSections?.[sectionKey(division,plant)]?.some(value=>sectionIdentity(value)===sectionIdentity(name))||saved.value.sectionMap?.[sectionKey(division,plant)]?.some(value=>sectionIdentity(value)===sectionIdentity(name)))throw Error('ฐานข้อมูลยังไม่ยืนยันการลบ กรุณาลองใหม่');
   confirmed=saved.value;break;
  }
  if(!confirmed)throw Error('มีการแก้ไขแผนกพร้อมกัน กรุณาลองลบอีกครั้ง');
  const remaining=sectionQueue().filter(job=>!(job.division===division&&job.plant===plant&&sectionIdentity(job.name)===sectionIdentity(name)));
  localStorage.setItem(SECTION_OUTBOX,JSON.stringify(remaining));sectionJobs=remaining;sectionSyncNotice='ลบ Section และซิงก์เรียบร้อยแล้ว';
  window.PPMSPositionSlots?.discardSection?.(division,plant,name);document.getElementById('deleteSectionDialog')?.remove();applyOrganizationMaster(confirmed);alert('ลบ Section เรียบร้อยแล้ว');
 }catch(error){alert('ลบ Section ไม่สำเร็จ: '+(error.name==='AbortError'?'การเชื่อมต่อหมดเวลา กรุณาลองใหม่':error.message))}
 finally{sectionDeleteRunning=false;button.disabled=false;button.textContent=label;void syncSections()}
}
function sectionDisplayName(name,division,plant,source=master){return window.PPMSOrganizationScope?.sectionLabel(name,{division,plant},source)||name}
function renamedSection(source,division,plant,section,name,expectedName){
 const key=sectionKey(division,plant),identity=sectionIdentity(section);let names=source?.sectionMap?.[key]||[];
 if(!names.some(value=>sectionIdentity(value)===identity)){
  if(!source||!managedSectionNames(division,plant).some(value=>sectionIdentity(value)===identity))throw Error('ไม่พบ Section ในรายการล่าสุด กรุณาเปิดรายการใหม่');
  source=JSON.parse(JSON.stringify(source));source.sectionMap||={};source.sectionMap[key]=names=[...names,section];
 }
 if(names.some(value=>sectionIdentity(value)!==identity&&[value,sectionDisplayName(value,division,plant,source)].some(label=>sectionIdentity(label)===sectionIdentity(name))))throw Error('มีชื่อ Section นี้แล้วใน Division / โรงงานที่เลือก');
 const current=sectionDisplayName(section,division,plant,source);if(current===name)return source;
 if(expectedName!==undefined&&current!==expectedName)throw Error('ชื่อ Section ถูกแก้ไขจากเครื่องอื่น กรุณาเปิดรายการใหม่');
 const next=JSON.parse(JSON.stringify(source));next.sectionLabels||={};
 const labels=Array.isArray(next.sectionLabels[key])?next.sectionLabels[key]:[];
 next.sectionLabels[key]=[...labels.filter(item=>sectionIdentity(item.section)!==identity),{section:names.find(value=>sectionIdentity(value)===identity),name}];
 next._updatedAt=Math.max(Date.now(),Number(source._updatedAt||0)+1);return next;
}
async function renameSection(division,plant,section,name,expectedName){
 if(!sectionAdmin())throw Error('กรุณาเข้าสู่ระบบ Admin');
 if(navigator.onLine===false)throw Error('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนแก้ไขชื่อ Section');
 if(sectionSyncing||sectionDeleteRunning)throw Error('กำลังซิงก์แผนก กรุณารอสักครู่แล้วลองอีกครั้ง');
 name=sectionName(name);plant=division==='Production Division'?plant:'รวม';
 if(!name||name.length>100||!sectionIdentity(name)||!master.divisions.includes(division)||(division==='Production Division'&&!master.plants.includes(plant)))throw Error('กรุณาระบุชื่อ Section ให้ถูกต้อง (ไม่เกิน 100 ตัวอักษร)');
 sectionDeleteRunning=true;
 try{
  for(let attempt=0;attempt<5;attempt++){
   const existing=await sectionMasterRequest({headers:{'X-Firebase-ETag':'true'}});if(!existing.etag)throw Error('ฐานข้อมูลยังไม่ยืนยันเวอร์ชัน กรุณาลองใหม่');
   const next=renamedSection(existing.value,division,plant,section,name,expectedName);
   if(next===existing.value){applyOrganizationMaster(next);return name}
   const saved=await sectionMasterRequest({method:'PUT',headers:{'Content-Type':'application/json','if-match':existing.etag},body:JSON.stringify(next)});
   if(saved.status===412)continue;
   if(sectionDisplayName(section,division,plant,saved.value||{})!==name)throw Error('ฐานข้อมูลยังไม่ยืนยันการแก้ไข กรุณาลองใหม่');
   applyOrganizationMaster(saved.value);sectionSyncNotice='แก้ไขชื่อ Section เรียบร้อยแล้ว';sectionSyncStatus();return name;
  }
  throw Error('มีการแก้ไขพร้อมกัน กรุณาลองอีกครั้ง');
 }finally{sectionDeleteRunning=false;void syncSections()}
}
function renameSectionControls(){
 if(!sectionAdmin())return;
 const scope=window.PPMSOrganizationScope?.current()||{division:master.divisions[0],plant:master.plants[0]},names=managedSectionNames(scope.division,scope.plant);
 document.querySelectorAll('.division-org:not(.employee-history-report) .division-section[data-org-section],.factory-org-section[data-org-section]').forEach(card=>{
  if(card.querySelector('[data-rename-section]'))return;
  const name=names.find(value=>sectionIdentity(value)===sectionIdentity(card.dataset.orgSection));if(!name)return;
  const button=document.createElement('button');button.type='button';button.className='secondary section-position-add no-print';button.dataset.renameSection=name;button.textContent='แก้ไขชื่อ Section';
  (card.querySelector('.division-section-head')||card.querySelector('h4'))?.after(button);
 });
 const bar=document.querySelector('.organization-scope-bar');if(bar&&!bar.querySelector('[data-rename-section-picker]')){
  const button=document.createElement('button');button.type='button';button.className='secondary no-print';button.dataset.renameSectionPicker='1';button.textContent='แก้ไขชื่อ Section';bar.append(button);
 }
}
function openRenameSectionPicker(selected){
 if(!sectionAdmin())return;document.getElementById('renameSectionDialog')?.remove();
 const scope=window.PPMSOrganizationScope.current(),{division,plant}=scope,names=managedSectionNames(division,plant);
 if(!names.length){alert('ยังไม่มี Section');return}
 const dialog=document.createElement('div');dialog.id='renameSectionDialog';dialog.className='org-config';
 dialog.innerHTML='<section style="max-width:580px" role="dialog" aria-modal="true" aria-labelledby="renameSectionTitle"><h2 id="renameSectionTitle">แก้ไขชื่อ Section</h2><p>'+esc(division)+(division==='Production Division'?' · '+esc(plant):'')+'</p><form><label>Section<select name="section">'+names.map(name=>'<option value="'+esc(name)+'">'+esc(sectionDisplayName(name,division,plant))+'</option>').join('')+'</select></label><label>ชื่อ Section ใหม่<input name="name" maxlength="100" required autocomplete="off"></label><p>รายชื่อพนักงานและเครื่องจักรที่จัดไว้จะอยู่ใน Section เดิม</p><p role="status" data-rename-message></p><div class="actions"><button type="submit">บันทึกชื่อ Section</button><button type="button" class="secondary" data-rename-cancel>ยกเลิก</button></div></form></section>';
 document.body.append(dialog);const form=dialog.querySelector('form'),message=form.querySelector('[data-rename-message]');let expectedName='';
 const choose=()=>{expectedName=sectionDisplayName(form.elements.section.value,division,plant);form.elements.name.value=expectedName;message.textContent=''};
 if(selected&&names.includes(selected))form.elements.section.value=selected;choose();form.elements.section.onchange=choose;
 const cancel=()=>{if(!form.querySelector('[type="submit"]').disabled)dialog.remove()};dialog.querySelector('[data-rename-cancel]').onclick=cancel;dialog.onkeydown=e=>{if(e.key==='Escape')cancel()};
 form.onsubmit=async e=>{e.preventDefault();const controls=[...form.querySelectorAll('button,input,select')];controls.forEach(node=>node.disabled=true);message.textContent='กำลังบันทึกชื่อ Section...';
  try{await renameSection(division,plant,form.elements.section.value,form.elements.name.value,expectedName);dialog.remove();alert('แก้ไขชื่อ Section เรียบร้อยแล้ว')}
  catch(error){message.textContent='แก้ไขชื่อ Section ไม่สำเร็จ: '+(error.name==='AbortError'?'การเชื่อมต่อหมดเวลา กรุณาลองใหม่':error.message);controls.forEach(node=>node.disabled=false)}
 };form.elements.name.focus();form.elements.name.select();
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-rename-section],[data-rename-section-picker]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();openRenameSectionPicker(button.dataset.renameSection)},true);
function deleteSectionControls(){
 if(!sectionAdmin())return;renameSectionControls();
 const division=document.getElementById('factoryDivisionChart')?.value||document.getElementById('globalOrganizationDivision')?.value||sessionStorage.getItem('ppms_scope_division')||master.divisions[0],
 plant=division==='Production Division'?(document.getElementById('factoryPlantChart')?.value||sessionStorage.getItem('ppms_scope_plant')||master.plants[0]):'รวม';
 const names=managedSectionNames(division,plant);
 document.querySelectorAll('.division-org:not(.employee-history-report) .division-section[data-org-section],.factory-org-section[data-org-section]').forEach(card=>{
  if(card.querySelector('[data-delete-section]'))return;
  const identity=sectionIdentity(card.dataset.orgSection),name=names.find(value=>sectionIdentity(value)===identity);if(!name)return;
  const button=document.createElement('button');button.type='button';button.className='secondary section-position-add no-print';button.dataset.deleteSection=name;button.dataset.division=division;button.dataset.plant=plant;button.textContent='ลบ Section';(card.querySelector('.division-section-head')||card.querySelector('h4'))?.after(button);
 });
 const bar=document.querySelector('.organization-scope-bar');
 if(bar&&!bar.querySelector('[data-delete-section-picker]')){
  const button=document.createElement('button');button.type='button';button.className='secondary no-print';button.dataset.deleteSectionPicker='1';button.textContent='ลบ Section';bar.append(button);
 }
}
function openDeleteSectionPicker(selected){
 if(!sectionAdmin())return;
 document.getElementById('deleteSectionDialog')?.remove();
 const division=document.getElementById('factoryDivisionChart')?.value||document.getElementById('globalOrganizationDivision')?.value||sessionStorage.getItem('ppms_scope_division')||master.divisions[0],
 plant=division==='Production Division'?(document.getElementById('factoryPlantChart')?.value||sessionStorage.getItem('ppms_scope_plant')||master.plants[0]):'รวม';
 const names=managedSectionNames(division,plant);if(!names.length){alert('ยังไม่มี Section');return}
 const dialog=document.createElement('div');dialog.id='deleteSectionDialog';dialog.className='org-config';
 dialog.innerHTML='<section style="max-width:580px" role="dialog" aria-modal="true"><h2>ลบ Section</h2><p>'+esc(division)+'</p><p>ลบได้เฉพาะ Section ที่ไม่มีพนักงาน กรุณาย้ายพนักงานก่อนลบแผนกที่ยังมีคน</p><label>Section<select>'+names.map(name=>'<option value="'+esc(name)+'">'+esc(sectionDisplayName(name,division,plant))+'</option>').join('')+'</select></label><p role="status" data-delete-member-count></p><div class="actions"><button type="button" data-delete-confirm>ลบ Section</button><button type="button" class="secondary" data-delete-cancel>ยกเลิก</button></div></section>';
 document.body.append(dialog);const select=dialog.querySelector('select');if(selected)select.value=selected;
 const describe=()=>{const count=sectionMembers(chartPeople(),emap,division,plant,select.value,Object.values(read('ppms_v3_deleted_employee_ids',[])).map(String)).length;dialog.querySelector('[data-delete-member-count]').textContent=count?'Section นี้ยังมีพนักงาน '+count+' คน กรุณาย้ายพนักงานไป Section ที่ถูกต้องก่อนลบ':'ไม่มีพนักงานในสำเนาปัจจุบัน · ระบบจะตรวจข้อมูลล่าสุดก่อนลบ'};select.onchange=describe;describe();dialog.querySelector('[data-delete-cancel]').onclick=()=>dialog.remove();
 dialog.querySelector('[data-delete-confirm]').onclick=e=>deleteSection(division,plant,dialog.querySelector('select').value,e.currentTarget);
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-delete-section],[data-delete-section-picker]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(button.hasAttribute('data-delete-section-picker'))openDeleteSectionPicker();
 else openDeleteSectionPicker(button.dataset.deleteSection);
},true);

function sectionName(value){return String(value||'').trim().replace(/\s+/g,' ')}
function withNewSection(source,division,plant,name){
 const next=JSON.parse(JSON.stringify(source));next.sectionMap||={};next.sections||=[];
 const key=sectionKey(division,plant),list=next.sectionMap[key]||[];
 const identity=value=>globalThis.PPMSOrganizationScope?.sectionKey(value)||sectionName(value).toLowerCase().replace(/^แผนก\s*/,'').replace(/\s+section$/i,'');
 if(list.some(x=>[x,globalThis.PPMSOrganizationScope?.sectionLabel?.(x,{division,plant},source)||x].some(value=>identity(value)===identity(name))))return undefined;
 next.sectionMap[key]=[...list,name];if(next.removedSections?.[key])next.removedSections[key]=next.removedSections[key].filter(x=>identity(x)!==identity(name));if(!next.sections.includes(name))next.sections.push(name);
 next._updatedAt=Date.now();return next;
}
function openSectionForm(){
 if(!sectionAdmin())return;
 document.getElementById('newSectionDialog')?.remove();
 const employee=document.getElementById('employeeForm'),d=employee?.elements.organizationDivision?.value||document.getElementById('factoryDivisionChart')?.value||sessionStorage.getItem('ppms_scope_division')||master.divisions[0],p=employee?.elements.organizationPlant?.value||document.getElementById('factoryPlantChart')?.value||sessionStorage.getItem('ppms_scope_plant')||master.plants[0];
 const dialog=document.createElement('div');dialog.id='newSectionDialog';dialog.className='org-config';dialog.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="newSectionTitle" style="max-width:580px"><h2 id="newSectionTitle">เพิ่ม Section ใหม่</h2><form id="newSectionForm"><label>Division<select name="division">'+master.divisions.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label><label data-section-plant>โรงงาน<select name="plant">'+master.plants.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label><label>ชื่อ Section<input name="name" required maxlength="100" placeholder="เช่น Assembly Section" autocomplete="off"></label><p data-section-message role="status"></p><div class="actions"><button type="submit">บันทึก Section</button><button type="button" class="secondary" data-section-cancel>ยกเลิก</button></div></form></section>';
 document.body.append(dialog);const f=dialog.querySelector('form'),message=f.querySelector('[data-section-message]');f.elements.division.value=d;f.elements.plant.value=p;
 const scope=()=>{const production=f.elements.division.value==='Production Division';f.querySelector('[data-section-plant]').hidden=!production;f.elements.plant.disabled=!production};f.elements.division.onchange=scope;scope();f.elements.name.focus();
 dialog.querySelector('[data-section-cancel]').onclick=()=>dialog.remove();dialog.onkeydown=e=>{if(e.key==='Escape')dialog.remove()};
 f.onsubmit=async e=>{
  e.preventDefault();if(!sectionAdmin())return;const name=sectionName(f.elements.name.value),division=f.elements.division.value,plant=division==='Production Division'?f.elements.plant.value:'รวม';
  if(!name||name.length>100||!master.divisions.includes(division)){message.textContent='กรุณาระบุชื่อ Section และ Division ให้ถูกต้อง';return}
  if(!withNewSection(master,division,plant,name)){message.textContent='มีชื่อ Section นี้แล้วใน Division / โรงงานที่เลือก';return}
  const button=f.querySelector('[type="submit"]');button.disabled=true;message.textContent='กำลังบันทึก Section...';
  try{
   addSection(name,division,plant);
   if(employee){employee.elements.organizationDivision.value=division;if(division==='Production Division')employee.elements.organizationPlant.value=plant;sectionOptions();employee.elements.section.value=name;employee.elements.section.dispatchEvent(new Event('change',{bubbles:true}))}
   dialog.remove();alert('เพิ่มแผนกไว้ในเครื่องแล้ว • ระบบจะซิงก์ให้อัตโนมัติ');
  }catch(error){message.textContent='บันทึกไม่สำเร็จ: '+error.message;button.disabled=false}
 };
}
document.addEventListener('click',e=>{if(!e.target.closest('[data-create-section],[data-add-factory-section]'))return;e.preventDefault();e.stopImmediatePropagation();openSectionForm()},true);
window.addEventListener('storage',e=>{if(![MK,SECTION_OUTBOX].includes(e.key))return;sectionJobs=sectionQueue();applyOrganizationMaster(read(MK,DEF));void syncSections()});
window.addEventListener('online',()=>void syncSections());window.addEventListener('focus',()=>void syncSections());

function enhance(){normalizeMaps();unifyOrganization();mergeCorporateAdministration();mergeBusinessOperations();expandDivisionNames();mergeSortingSections();removeGeneratedVacancies();const normalized=window.PPMSProductionHierarchy?.withPosition(master);if(normalized&&normalized!==master){master=normalized;localStorage.setItem(MK,JSON.stringify(master))}scopeStyle();neutralFactoryStyle();sectionPositionStyle();addStyle();if(FACTORY_PAGE){overview();chartPicker();simplifyOrganization()}else factoryLink();scopeTitle();employeeFields();defaultFormScope();sectionOptions();sectionControls();deleteSectionControls()}
document.addEventListener('click',e=>{if(e.target.closest('[data-add-factory-section]'))master.sectionMap||={};if(e.target.closest('[data-add-division-position]'))master.positionMap||={}},true);
document.addEventListener('click',e=>{const button=e.target.closest('[data-add-section-position]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const select=document.getElementById('factoryDivisionChart'),detail=document.getElementById('factoryDivisionChartDetail'),division=select?.value||master.divisions[0],plant=division==='Production Division'?(sessionStorage.getItem('ppms_scope_plant')||master.plants[0]):'รวม',section=button.dataset.section;if(window.PPMSPositionSlots){window.PPMSPositionSlots.openDialog(section,{division,plant});return}const name=prompt('ชื่อตำแหน่งใหม่ใน '+section);if(!name?.trim())return;master.sectionPositions||={};const key=positionKey(division,plant,section);master.sectionPositions[key]||=[];if(!master.sectionPositions[key].includes(name.trim()))master.sectionPositions[key].push(name.trim());saveMaster();if(select&&detail)renderDivisionChart(select,detail)},true);
document.addEventListener('click',e=>{const select=document.getElementById('factoryDivisionChart'),detail=document.getElementById('factoryDivisionChartDetail'),division=select?.value||master.divisions[0],plant=sessionStorage.getItem('ppms_scope_plant')||master.plants[0];if(e.target.closest('[data-add-factory-section]')){const name=prompt('ชื่อ Section ใหม่ใน '+division+' · '+plant);if(name?.trim()){const key=sectionKey(division,plant);master.sectionMap[key]||=[];if(!master.sectionMap[key].includes(name.trim()))master.sectionMap[key].push(name.trim());saveMaster();if(select&&detail)renderDivisionChart(select,detail)}return}if(e.target.closest('[data-add-division-position]')){const name=prompt('ชื่อตำแหน่งใหม่ใน '+division);if(name?.trim()){master.positionMap[division]||=[];if(!master.positionMap[division].includes(name.trim()))master.positionMap[division].push(name.trim());saveMaster();if(select&&detail)renderDivisionChart(select,detail)}return}if(e.target.closest('[data-org-settings]'))openConfig();if(e.target.closest('[data-org-close]')||e.target.id==='orgConfig')document.getElementById('orgConfig')?.remove();const b=e.target.closest('[data-org-remove]');if(b){master[b.dataset.orgRemove].splice(Number(b.dataset.index),1);saveMaster();openConfig()}});
document.addEventListener('submit',e=>{const a=e.target.closest('[data-org-add]');if(a){e.preventDefault();const n=String(new FormData(a).get('name')||'').trim();if(n&&!master[a.dataset.orgAdd].includes(n)){master[a.dataset.orgAdd].push(n);saveMaster()}openConfig();return}const f=e.target.closest('#employeeForm');if(f)sectionOptions()},true);
let t=0;const formObserver=new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enhance,80)});formObserver.observe(document.getElementById('app')||document.body,{childList:true,subtree:false});const modalBody=document.getElementById('modalBody');if(modalBody)formObserver.observe(modalBody,{childList:true,subtree:false});
if(FACTORY_PAGE&&sessionStorage.getItem('ppms_admin')!=='1'){document.body.innerHTML='<main style="max-width:680px;margin:60px auto;padding:24px;font-family:Arial,Tahoma,sans-serif"><h2>หน้านี้สำหรับ Admin เท่านั้น</h2><p>กรุณากลับไป Login เป็น Admin ก่อนเข้า Factory Organization</p><a href="index.html">กลับหน้าหลัก</a></main>'}else{db()?.ref('settings/organizationMaster').on('value',s=>{if(s.exists()){const remote=s.val()||{},local=read(MK,DEF),localTime=Number(local._updatedAt||0),remoteTime=Number(remote._updatedAt||0);const pending=hasPendingMasterJobs();master=replayPendingMaster(pending?remote:(localTime>=remoteTime?local:remote));localStorage.setItem(MK,JSON.stringify(master));if(!pending&&localTime>remoteTime)db()?.ref('settings/organizationMaster').set(master).catch(console.warn);enhance();redrawLiveEmployeeChart();window.dispatchEvent(new Event('ppms-organization-changed'));void syncSections()}else if(hasPendingMasterJobs()){applyOrganizationMaster(master);void syncSections()}else saveMaster()},()=>{});db()?.ref('employeeOrganization').once('value').then(s=>{if(s.exists()){emap=s.val()||{};localStorage.setItem(EK,JSON.stringify(emap));for(const job of Object.values(read('ppms_v3_pending_employee_saves',{})))if(job?.organizationScopeUpdate)applyEmployeeScope(job.data);enhance()}}).catch(()=>{});document.addEventListener('DOMContentLoaded',enhance);if(hasPendingMasterJobs()){master=replayPendingMaster(master);localStorage.setItem(MK,JSON.stringify(master))}enhance();setTimeout(()=>void syncSections(),100);try{db()?.ref('.info/connected').on('value',snapshot=>{if(snapshot.val()===true)void syncSections()},()=>{})}catch{}}
})();
