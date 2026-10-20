/* One employee team source for the manpower chart, Section chart and floor Layout. */
(()=>{
 'use strict';
 const jobs=new Set(),KEY='ppms_workplace_team_filter',esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const runtime=()=>window.PPMS_RUNTIME;
 const team=e=>runtime()?.workplaceEmployeeTeam?.(e)||(()=>{const raw=e?.section==='Stamping Section'&&Object.hasOwn(e,'stampingShift')?e.stampingShift:Object.hasOwn(e||{},'organizationTeam')?e.organizationTeam:e?.team||e?.shiftTeam||e?.shift||'',key=String(raw).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'');return ['a','teama','ทีมa'].includes(key)?'Team A':['b','teamb','ทีมb'].includes(key)?'Team B':['morningfloatingteam','ทีมลอยเช้า','ลอยเช้า'].includes(key)?'Morning Floating Team':''})();
 const filter=()=>{const value=sessionStorage.getItem(KEY)||'all';return ['all','A','B','none'].includes(value)?value:'all'};
 const matches=(e,value=filter())=>value==='all'||(value==='none'?!team(e):team(e)==='Team '+value);
 const filterPeople=people=>people.filter(e=>matches(e));
 const options=()=>'<option value="all">รวมทีม</option><option value="A">ทีม A</option><option value="B">ทีม B</option><option value="none">ยังไม่ระบุทีม</option>';
 const canEdit=()=>runtime()?.factoryLayoutIsAdmin?.()===true;
 function control(e){const value=team(e);return `<select class="workplace-team-control no-print" data-workplace-team-employee="${esc(e.id)}" data-workplace-team-section="${esc(e.section)}" aria-label="ทีมของ ${esc(e.thaiName||e.name)}" ${!canEdit()||jobs.has(String(e.id))?'disabled':''}><option value="" ${!value?'selected':''}>—</option><option value="Team A" ${value==='Team A'?'selected':''}>A</option><option value="Team B" ${value==='Team B'?'selected':''}>B</option><option value="Morning Floating Team" ${value==='Morning Floating Team'?'selected':''}>ลอย</option></select><span class="workplace-team-print">${value==='Team A'?'A':value==='Team B'?'B':value==='Morning Floating Team'?'ลอย':''}</span>`}
 function badge(e){const value=team(e),text=value==='Team A'?'A':value==='Team B'?'B':value==='Morning Floating Team'?'ลอย':'';return text?' <span class="workplace-team-badge">'+text+'</span>':''}
 function status(id,text,pending=false){window.dispatchEvent(new CustomEvent('ppms-workplace-team-status',{detail:{id,text,pending}}))}
 document.addEventListener('change',async event=>{
  const select=event.target.closest?.('[data-workplace-team-employee]');if(!select)return;
  const id=select.dataset.workplaceTeamEmployee,value=select.value,employee=runtime()?.factoryLayoutEmployees?.().find(e=>String(e.id)===id);
  if(!employee||jobs.has(id)||!canEdit()){if(employee)select.value=team(employee);return}
  const before=team(employee),context={...runtime().organizationScope(),section:employee.section,sortingGroup:employee.sortingGroup||'',targetSortingGroup:employee.sortingGroup||''};
  jobs.add(id);select.disabled=true;select.blur();status(id,'กำลังบันทึกทีมพนักงาน...');
  try{const result=await runtime().assignSectionChartTeam(id,value,context);status(id,result.pending?'เปลี่ยนทีมในเครื่องแล้ว · รอซิงก์ข้อมูลกลาง':'บันทึกทีมพนักงานแล้ว · ผังกำลังคนและ Layout ใช้ทีมเดียวกัน',!!result.pending)}
  catch(error){select.value=before;status(id,'เปลี่ยนทีมไม่สำเร็จ: '+error.message)}
  finally{jobs.delete(id);const current=runtime()?.factoryLayoutEmployees?.().find(e=>String(e.id)===id);for(const el of document.querySelectorAll('[data-workplace-team-employee]'))if(el.dataset.workplaceTeamEmployee===id){el.disabled=!canEdit();if(current)el.value=team(current)}}
 },true);
 window.PPMS_WORKPLACE_TEAMS={team,badge,control,filter,matches,filterPeople,options,setFilter(value){if(!['all','A','B','none'].includes(value))return;sessionStorage.setItem(KEY,value);window.dispatchEvent(new Event('ppms-workplace-team-filter-changed'))}};
 const style=document.createElement('style');style.textContent='.workplace-team-control{display:inline-block!important;width:58px!important;min-width:0!important;padding:3px!important;margin-left:5px!important;font:12px Arial,Tahoma,sans-serif!important;background:#eaf2ff!important;border:1px solid #bdd1e8!important;border-radius:4px!important;color:#194c8a!important;vertical-align:middle}.workplace-team-badge{display:inline-block;margin-left:4px;padding:2px 5px;background:#eaf2ff;color:#194c8a;border-radius:4px;font-size:11px}.workplace-team-print{display:none}@media print{.workplace-team-print{display:inline!important;margin-left:5px}.workplace-team-control{display:none!important}}';document.head.append(style);
})();
