/* Shared read scope for organization charts, employee views, layouts, and reports. */
(()=>{
 'use strict';
 const MASTER='ppms_organization_master_v1',MAP='ppms_employee_organization_v1';
 const defaults={plants:['โรง 1'],divisions:['Production Division','Quality Division','Warehouse Division','Corporate Administration Division','Business Operations Division']};
 const cache=new Map();
 function read(key,fallback){try{const raw=localStorage.getItem(key);if(cache.get(key)?.raw===raw)return cache.get(key).value;const value=JSON.parse(raw||'null')||fallback;cache.set(key,{raw,value});return value}catch{return fallback}}
 const master=()=>read(MASTER,defaults);
 const divisionName=value=>({'QC Division':'Quality Division','Quality Control Division':'Quality Division','WH Division':'Warehouse Division','จัดซื้อ Division':'Purchasing Division','การตลาด Division':'Marketing Division'}[value]||value);
 const sectionAliases=new Map(Object.entries({'ปั๊ม':'stamping','ปั้ม':'stamping','เชื่อม':'welding','ซีเอ็นซี':'cnc','ต๊าป':'tapping','ต๊าปเกลียว':'tapping','taping':'tapping','พับ':'bending','สนับสนุนวิศวกรรม':'engineeringsupport','สนับสนุนการผลิต':'supportproduction','ซ่อมบำรุงเครื่องจักร':'machinemaintenance','ซ่อมบำรุงแม่พิมพ์':'toolingmaintenance','คัดแยก':'sorting','คัดงาน':'sorting','คัดแยก1':'sorting1','คัดงาน1':'sorting1','คัดแยก2':'sorting2','คัดงาน2':'sorting2'}).map(([name,key])=>[name.normalize('NFKC'),key]));
 function sectionKey(value){
  const plain=String(value||'').normalize('NFKC').trim().replace(/^(?:แผนก\s*|section\s+)/i,'').replace(/\s+section$/i,'').trim().toLowerCase().replace(/[๐-๙]/g,d=>String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d))).replace(/[\s_-]+/g,'');

  return sectionAliases.get(plain)||plain;
 }
 // Sorting is one department. Keep source employee/history keys for existing records.
 function isSorting(value){return /^sorting[12]?$/.test(sectionKey(value))}
 function combinedSection(value){return isSorting(value)?'Sorting Section':value}
 function sectionGroupKey(value){return sectionKey(combinedSection(value))}
 function sameSection(a,b){return isSorting(a)&&isSorting(b)||a===b}
 // Names are scoped presentation metadata; existing employee, machine and history keys stay stable.
 function sectionLabel(value,scope=current(),m=master()){
  const key=sectionKey(value),labels=m.sectionLabels?.[scope.division+'::'+scope.plant];
  return (Array.isArray(labels)?labels:[]).find(item=>sectionKey(item?.section)===key)?.name||value;
 }
 function sectionDisplayEntries(scope=current(),m=master()){
  const labels=m.sectionLabels?.[scope.division+'::'+scope.plant];if(!Array.isArray(labels))return [];
  const people=read('ppms_v3_employees',[]),names=[...(m.sectionMap?.[scope.division+'::'+scope.plant]||[]),...employees(Array.isArray(people)?people:Object.values(people||{}),scope).map(e=>e.section)];
  return labels.filter(item=>typeof item?.section==='string'&&typeof item?.name==='string').map(item=>({...item,aliases:[...new Set([item.section,item.name,...names.filter(value=>sectionKey(value)===sectionKey(item.section))])]}));
 }
 function resolveSection(value,scope=current()){
  const found=sectionDisplayEntries(scope).find(item=>sectionKey(item.name)===sectionKey(value));return found?.section||value;
 }
 function sectionDisplayScope(element){
  const form=element?.closest?.('#employeeForm'),division=form?.elements.organizationDivision?.value;
  return division?{division,plant:division==='Production Division'?(form.elements.organizationPlant?.value||current().plant):'รวม'}:current();
 }
 function uniqueSections(names,preferred=[]){
  const labels=new Map();for(const name of preferred){const key=sectionKey(name);if(key&&!labels.has(key))labels.set(key,name)}
  const seen=new Set(),out=[];for(const name of names){const key=sectionKey(name);if(!key||seen.has(key))continue;seen.add(key);out.push(labels.get(key)||name)}return out;
 }
 function current(){const m=master(),valid=(m.divisions||defaults.divisions).map(divisionName),saved=divisionName(sessionStorage.getItem('ppms_scope_division')),division=valid.includes(saved)?saved:valid[0]||'Production Division',raw=sessionStorage.getItem('ppms_scope_plant'),plant=division==='Production Division'?(m.plants?.includes(raw)?raw:m.plants?.[0]||'โรง 1'):'รวม';return {division,plant}}
 function employeeScope(employee,m=master(),map=read(MAP,{})){const saved=map[String(employee?.id)]||{},division=divisionName(saved.division||employee?.organizationDivision||'Production Division'),raw=saved.plant||employee?.organizationPlant,plant=division==='Production Division'?(m.plants?.includes(raw)?raw:m.plants?.[0]||'โรง 1'):'รวม';return {division,plant}}
 function employees(list,scope=current()){const m=master(),map=read(MAP,{});return (Array.isArray(list)?list:[]).filter(employee=>{const x=employeeScope(employee,m,map);return x.division===scope.division&&x.plant===scope.plant})}
 function sections(list,scope=current(),fallback=[]){const m=master(),configured=m.sectionMap?.[scope.division+'::'+scope.plant],people=employees(list,scope),occupied=people.filter(e=>!(scope.division==='Production Division'&&window.PPMSProductionHierarchy?.isSupervisor(e.position))).map(e=>e.section).filter(Boolean);const names=Array.isArray(configured)?configured:(scope.division==='Production Division'?fallback:[]),removed=m.removedSections?.[scope.division+'::'+scope.plant]||[];const occupiedKeys=new Set(occupied.map(sectionGroupKey)),removedKeys=new Set(removed.map(sectionKey));return uniqueSections([...names,...occupied].map(combinedSection).filter(name=>occupiedKeys.has(sectionKey(name))||!removedKeys.has(sectionKey(name))),occupied)}
 const preferenceKeys=['chartSec','viewSec','matrixSec','matrixSortingGroup','cardSection','cardEmp','examPlanSection','examCheckSection','examCheckSkill','examEmp','examHistorySection','examHistoryQuery','attendanceSection','attendanceKpiEmployee','shiftRosterSection'];
 function activate(next){const before=current(),m=master(),division=divisionName(next.division||before.division);if(!(m.divisions||defaults.divisions).map(divisionName).includes(division))return;const remembered=next.plant||(before.division==='Production Division'?before.plant:sessionStorage.getItem('ppms_scope_production_plant')),plant=division==='Production Division'?(m.plants?.includes(remembered)?remembered:m.plants?.[0]||'โรง 1'):'รวม';if(division===before.division&&plant===before.plant)return;
  let prefs={};try{prefs=JSON.parse(sessionStorage.getItem('ppms_scope_view_preferences')||'{}')||{}}catch{}if(typeof prefs!=='object'||Array.isArray(prefs))prefs={};prefs[before.division+'::'+before.plant]=Object.fromEntries(preferenceKeys.map(key=>[key,sessionStorage.getItem(key)]));sessionStorage.setItem('ppms_scope_view_preferences',JSON.stringify(prefs));
  if(before.division==='Production Division')sessionStorage.setItem('ppms_scope_production_plant',before.plant);if(division==='Production Division')sessionStorage.setItem('ppms_scope_production_plant',plant);sessionStorage.setItem('ppms_scope_division',division);sessionStorage.setItem('ppms_scope_plant',plant);const values=prefs[division+'::'+plant]||{};for(const key of preferenceKeys){if(values[key]!==null&&values[key]!==undefined)sessionStorage.setItem(key,values[key]);else sessionStorage.removeItem(key)}
  window.dispatchEvent(new CustomEvent('ppms-organization-scope-changed',{detail:{previous:before,current:{division,plant}}}));applyTitles();
 }
 function title(language=window.PPMSLanguage?.language||'th',scope=current()){const translate=value=>window.PPMSLanguage?.translate(String(value),'th')||String(value),base=language==='en'?scope.division+' Organization Chart'+(scope.division==='Production Division'?' — '+scope.plant.replace(/^โรง\s*/,'Plant '):''):'ผัง'+translate(scope.division)+(scope.division==='Production Division'?' — '+scope.plant:'');return base+(window.PPMSProductionLines?.suffix(scope,language)||'')}
 function applyTitles(){const big=document.querySelector('.division-org:not(.employee-history-report),.factory-summary');if(!big)return;const nodes=[document.querySelector('#app>.page-head h2'),...document.querySelectorAll('.factory-summary .factory-chart-title')];if(/factory-organization\.html$/i.test(location.pathname))nodes.push(document.querySelector('header h1'));for(const node of nodes.filter(Boolean)){node.setAttribute('data-i18n-ignore','');node.dataset.organizationChartTitle='1';const value=title();if(node.textContent!==value)node.textContent=value}}
 function contains(item,scope=current()){
  const m=master(),keys=Object.entries(m.sectionMap||{}).filter(([,names])=>Array.isArray(names)&&names.includes(item?.section)).map(([key])=>key.split('::'));
  const divisions=[...new Set(keys.map(([division])=>divisionName(division)))];
  const owner=divisionName(item?.division||item?.organizationDivision||(divisions.length===1?divisions[0]:'Production Division'));
  const plants=[...new Set(keys.filter(([division])=>divisionName(division)===owner).map(([,plant])=>plant))];
  const plant=item?.plant||item?.organizationPlant||(plants.length===1?plants[0]:m.plants?.[0])||'โรง 1';
  return owner===scope.division&&(scope.division!=='Production Division'||plant===scope.plant);
 }
 window.PPMSOrganizationScope={current,master,employeeScope,employees,sectionKey,isSorting,combinedSection,sectionGroupKey,sameSection,sectionLabel,sectionDisplayEntries,sectionDisplayScope,resolveSection,uniqueSections,sections,activate,title,applyTitles,contains};
 window.addEventListener('ppms-language-changed',applyTitles);
})();
