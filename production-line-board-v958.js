/* Bulk line organizer: one roster, grouped by current line and section. */
(()=>{
 'use strict';
 const api=()=>window.PPMSProductionLines,scope=()=>window.PPMSOrganizationScope.current();
 const editable=()=>sessionStorage.getItem('ppms_admin')==='1'&&window.PPMSAccess?.canEdit()!==false&&window.PPMS_RUNTIME?.factoryLayoutIsAdmin?.()===true;
 const en=()=>window.PPMSLanguage?.language==='en',t=(th,english)=>en()?english:th;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const modeKey='ppms_line_board_view_v958';
 let state=null,drag=null;
 const people=()=>window.PPMS_RUNTIME?.factoryLayoutEmployees?.()||[];
 function current(){const k=api().key(scope());if(state?.scope!==k)state={scope:k,selected:new Set(),query:'',section:'all',source:'all',target:'1',message:'',undo:null};return state}
 function active(){return editable()&&sessionStorage.getItem(modeKey)!=='report'}
 function setMode(mode){sessionStorage.setItem(modeKey,mode==='report'?'report':'board');document.activeElement?.blur();window.PPMS_RUNTIME?.refreshOrganizationChart(true)}
 const lineLabel=id=>api().label(id,undefined,scope());
 const sectionKey=e=>api().sectionKey(e.section);
 const sectionName=e=>window.PPMSOrganizationScope.sectionLabel(window.PPMSOrganizationScope.combinedSection(e.section)||t('ไม่ระบุแผนก','No section'),scope());
 function model(){
  const s=current(),all=people(),data=api().record(scope()),ids=new Set(all.map(e=>String(e.id)));
  for(const id of s.selected)if(!ids.has(id))s.selected.delete(id);
  const lines=['unassigned',...api().lineIds(),'shared'],sections=new Map(),byPerson=new Map(),distribution=new Map();
  for(const e of all){const id=String(e.id),line=api().assignment(e,scope(),data),sec=sectionKey(e);sections.set(sec,sectionName(e));byPerson.set(id,{employee:e,line,section:sec});if(!distribution.has(sec))distribution.set(sec,new Set());if(/^\d+$/.test(line))distribution.get(sec).add(line)}
  if(!lines.includes(s.target))s.target=api().lineIds()[0];
  if(s.section!=='all'&&!sections.has(s.section))s.section='all';
  if(s.source!=='all'&&!lines.includes(s.source))s.source='all';
  const query=s.query.trim().toLowerCase(),visible=[...byPerson.values()].filter(({employee:e,line,section})=>(s.section==='all'||s.section===section)&&(s.source==='all'||s.source===line)&&(!query||[e.id,e.name,e.thaiName,e.position,e.section].join(' ').toLowerCase().includes(query)));
  visible.sort((a,b)=>String(a.employee.section).localeCompare(String(b.employee.section))||String(a.employee.id).localeCompare(String(b.employee.id),undefined,{numeric:true}));
  return {all,lines,sections,byPerson,visible,distribution};
 }
 const options=(ids,selected)=>ids.map(id=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(id==='all'?t('ทุกไลน์','All lines'):lineLabel(id))}</option>`).join('');
 function board(m){
  const s=current();return m.lines.map(line=>{
   const visible=m.visible.filter(e=>e.line===line),total=[...m.byPerson.values()].filter(e=>e.line===line).length,groups=new Map();
   for(const row of visible){if(!groups.has(row.section))groups.set(row.section,[]);groups.get(row.section).push(row)}
   const groupsHTML=[...groups].map(([section,rows])=>{
    const split=m.distribution.get(section).size;
    return `<section class="line-board-section" data-board-section="${esc(section)}"><header><label><input type="checkbox" data-board-group="${esc(section)}" data-board-group-line="${esc(line)}"><b>${esc(m.sections.get(section))}</b><span>${rows.length} ${t('คน','people')}</span></label><span class="line-board-drag" draggable="true" data-board-drag-section="${esc(section)}" data-board-drag-line="${esc(line)}" title="${t('ลากทั้งกลุ่มไปไลน์อื่น หรือใช้ช่องเลือกทั้งกลุ่ม','Drag this group to another line, or select the group checkbox')}">⠿ ${t('ลากกลุ่ม','Drag group')}</span></header>${split>1?`<small class="line-board-split">${t('แผนกนี้แบ่งอยู่','This section spans')} ${split} ${t('ไลน์','lines')}</small>`:''}<div class="line-board-members">${rows.map(({employee:e})=>{
     const id=String(e.id),name=e.thaiName||e.name||id;return `<label class="line-board-person ${s.selected.has(id)?'is-selected':''}" draggable="true" data-board-drag-person="${esc(id)}"><input type="checkbox" data-board-person="${esc(id)}" ${s.selected.has(id)?'checked':''}><span class="line-board-avatar" aria-hidden="true">${esc(Array.from(name.trim())[0]||'?')}</span><span><b>${esc(name)}</b><small>${esc(id)} · ${esc(e.position||'')}</small></span></label>`;
    }).join('')}</div></section>`;
   }).join('');
   return `<article class="line-board-lane" data-board-drop="${esc(line)}"><header class="line-board-lane-head"><div><h3>${esc(lineLabel(line))}</h3><span>${total} ${t('คน','people')}${visible.length!==total?' · '+t('แสดง','showing')+' '+visible.length:''}</span></div>${line!=='shared'?`<button type="button" class="secondary" data-line-matrix="${esc(line)}">Skill Matrix</button>`:''}</header><button type="button" class="line-board-drop-button" data-board-move="${esc(line)}" ${s.selected.size?'':'disabled'}>${t('ย้ายคนที่เลือกมาที่นี่','Move selected here')}</button><div class="line-board-lane-body">${groupsHTML||`<p class="line-board-empty">${total?t('ไม่มีรายชื่อตรงกับตัวกรอง','No people match the filters'):t('ลากพนักงานหรือกลุ่มแผนกมาวางที่นี่','Drop people or a section group here')}</p>`}</div></article>`;
  }).join('');
 }
 function markup(){
  const s=current(),m=model(),unassigned=[...m.byPerson.values()].filter(e=>e.line==='unassigned').length;
  return `<section class="line-organizer" data-line-organizer data-board-scope="${esc(s.scope)}" data-i18n-ignore><div class="line-board-intro"><div><h2>${t('จัดไลน์แบบง่าย','Arrange production lines')}</h2><p>${t('เลือกหลายคนหรือทั้งกลุ่ม แล้วกดย้ายเข้าไลน์ · ลากคนหรือกลุ่มแผนกไปวางในไลน์ได้','Select people or a whole group, then move them to a line · Drag people or section groups between lines')}</p><small>${t('แผนกเดียวแยกได้หลายไลน์ และหนึ่งไลน์รวมได้หลายแผนก','One section can span several lines; one line can include several sections')}</small></div><div class="actions"><button type="button" data-org-line-manage>+ ${t('เพิ่ม / ตั้งชื่อไลน์','Add / name lines')}</button><button type="button" class="secondary" data-line-board-view="report">${t('ดูผัง / พิมพ์รายงาน','View chart / print')}</button><button type="button" class="secondary" data-org-line-settings>${t('ตั้งค่าขั้นสูง','Advanced settings')}</button></div></div><div class="line-board-summary"><span><b>${m.all.length}</b> ${t('พนักงานทั้งหมด','employees')}</span><span><b>${api().lineIds().length}</b> ${t('ไลน์','lines')}</span><span class="line-board-unassigned"><b>${unassigned}</b> ${t('ยังไม่จัดไลน์','unassigned')}</span></div><div class="line-board-filters"><label>${t('แผนก','Section')}<select id="lineBoardSection" data-board-filter="section"><option value="all">${t('ทุกแผนก','All sections')}</option>${[...m.sections].map(([key,name])=>`<option value="${esc(key)}" ${s.section===key?'selected':''}>${esc(name)}</option>`).join('')}</select></label><label>${t('แสดงจากไลน์','Current line')}<select id="lineBoardSource" data-board-filter="source">${options(['all',...m.lines],s.source)}</select></label><label class="line-board-search">${t('ค้นหาชื่อ / รหัสพนักงาน','Search name / employee ID')}<input id="lineBoardSearch" type="search" data-board-search value="${esc(s.query)}" placeholder="${t('พิมพ์ชื่อ รหัส หรือตำแหน่ง','Name, ID or position')}"></label></div><div class="line-board-toolbar"><label><input type="checkbox" data-board-select-visible><b>${t('เลือกทั้งหมดที่แสดง','Select all shown')}</b></label><strong data-board-selected-count></strong><label>${t('ย้ายไป','Move to')}<select id="lineBoardTarget" data-board-target>${options(m.lines,s.target)}</select></label><button type="button" data-board-move="target">${t('ย้ายคนที่เลือก','Move selected')}</button><button type="button" class="secondary" data-board-clear>${t('ล้างการเลือก','Clear selection')}</button><button type="button" class="secondary" data-board-undo ${s.undo?'':'hidden'}>${t('ย้อนกลับการย้ายล่าสุด','Undo last move')}</button></div><p class="line-board-feedback" role="status" data-board-message>${esc(s.message)}</p><div class="line-board-grid" data-board-lanes>${board(m)}</div><p role="status" data-org-line-status></p></section>`;
 }
 function root(){return document.querySelector('[data-line-organizer]')}
 function validRoot(){const el=root();return el&&el.dataset.boardScope===api().key(scope())?el:null}
 function positionToolbar(){
  const el=validRoot();if(!el)return;let bottom=0;
  for(const node of [document.querySelector('body>header'),document.getElementById('nav')])if(node){const style=getComputedStyle(node);if(['sticky','fixed'].includes(style.position))bottom=Math.max(bottom,(parseFloat(style.top)||0)+node.getBoundingClientRect().height)}
  const value=Math.ceil(bottom+8)+'px';if(el.style.getPropertyValue('--line-board-top')!==value)el.style.setProperty('--line-board-top',value);
 }
 function paintSelection(m=model()){
  const el=validRoot();if(!el)return;const s=current(),visibleIds=new Set(m.visible.map(row=>String(row.employee.id))),hidden=[...s.selected].filter(id=>!visibleIds.has(id)).length;
  el.querySelectorAll('[data-board-person]').forEach(input=>{input.checked=s.selected.has(input.dataset.boardPerson);input.closest('.line-board-person').classList.toggle('is-selected',input.checked)});
  for(const box of el.querySelectorAll('[data-board-group],[data-board-select-visible]')){
   const rows=box.hasAttribute('data-board-group')?m.visible.filter(row=>row.section===box.dataset.boardGroup&&row.line===box.dataset.boardGroupLine):m.visible;
   const count=rows.filter(row=>s.selected.has(String(row.employee.id))).length;box.checked=!!rows.length&&count===rows.length;box.indeterminate=count>0&&count<rows.length;box.disabled=!rows.length;
  }
  el.querySelector('[data-board-selected-count]').textContent=t('เลือกแล้ว ','Selected ')+s.selected.size+t(' คน',' people')+(hidden?' · '+t('นอกตัวกรอง ','outside filters ')+hidden:'');
  el.querySelectorAll('[data-board-move]').forEach(b=>b.disabled=!s.selected.size||!editable());
  el.querySelector('[data-board-clear]').disabled=!s.selected.size;
  el.querySelector('[data-board-undo]').hidden=!s.undo;
  el.querySelector('[data-board-message]').textContent=s.message;positionToolbar();
 }
 function paint(){const el=validRoot();if(!el)return;const m=model();el.querySelector('[data-board-lanes]').innerHTML=board(m);paintSelection(m)}
 function move(ids,target){
  const el=validRoot();if(!el||!editable())throw Error(t('กรุณาเปิดหน้าจัดไลน์ใหม่ด้วยสิทธิ์แก้ไข','Reopen the organizer with edit access'));
  const s=current(),m=model();if(!m.lines.includes(target))throw Error(t('ไม่พบไลน์ปลายทาง','Destination line no longer exists'));
  const chosen=[...new Set(ids.map(String))];if(!chosen.length)throw Error(t('กรุณาเลือกพนักงานก่อน','Select people first'));
  if(chosen.some(id=>!m.byPerson.has(id)))throw Error(t('รายชื่อเปลี่ยนแล้ว กรุณาเลือกพนักงานใหม่','The roster changed. Select people again'));
  const data=api().record(scope()),patch={},before={};
  for(const id of chosen)if(m.byPerson.get(id).line!==target){const path='employees/'+api().personKey(id);patch[path]=target;before[path]=data.employees?.[api().personKey(id)]??null}
  const count=Object.keys(patch).length;if(!count){s.message=t('พนักงานที่เลือกอยู่ในไลน์นี้แล้ว','The selected people are already in this line');paintSelection(m);return}
  // Persist before changing selection so storage errors cannot lose the user's work.
  const savedScope={...scope()};api().saveAssignments(patch,savedScope);
  s.undo={scope:savedScope,patch,before};s.selected.clear();s.message=t('ย้ายแล้ว ','Moved ')+count+t(' คน ไป ',' people to ')+lineLabel(target);paint();
 }
 function undo(){
  const s=current(),job=s.undo;if(!job||!validRoot()||!editable())return;
  const data=api().record(scope());if(api().key(job.scope)!==s.scope||Object.entries(job.patch).some(([path,value])=>data.employees?.[path.split('/')[1]]!==value))throw Error(t('มีการจัดไลน์เปลี่ยนไปแล้ว กรุณาตรวจรายชื่อก่อนย้ายอีกครั้ง','Assignments have changed. Check the current roster before moving again'));
  api().saveAssignments(job.before,job.scope);s.undo=null;s.selected.clear();s.message=t('ย้อนกลับการย้ายล่าสุดแล้ว','Last move undone');paint();
 }
 const fail=error=>{current().message=error.message;paintSelection()};
 document.addEventListener('input',event=>{if(event.target.matches?.('[data-board-search]')&&validRoot()){current().query=event.target.value;paint()}});
 document.addEventListener('change',event=>{
  const input=event.target;if(!validRoot()||!editable())return;const s=current();
  if(input.matches('[data-board-filter]')){s[input.dataset.boardFilter]=input.value;paint()}
  if(input.matches('[data-board-target]'))s.target=input.value;
  if(input.matches('[data-board-person]')){input.checked?s.selected.add(input.dataset.boardPerson):s.selected.delete(input.dataset.boardPerson);paintSelection()}
  if(input.matches('[data-board-group],[data-board-select-visible]')){const m=model(),rows=input.hasAttribute('data-board-group')?m.visible.filter(row=>row.section===input.dataset.boardGroup&&row.line===input.dataset.boardGroupLine):m.visible;for(const row of rows)input.checked?s.selected.add(String(row.employee.id)):s.selected.delete(String(row.employee.id));paintSelection(m)}
 });
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('button');if(!button)return;
  if(button.hasAttribute('data-line-board-view')){setMode(button.dataset.lineBoardView);return}
  if(!validRoot())return;
  try{if(button.hasAttribute('data-board-clear')){current().selected.clear();paintSelection()}if(button.hasAttribute('data-board-move'))move([...current().selected],button.dataset.boardMove==='target'?current().target:button.dataset.boardMove);if(button.hasAttribute('data-board-undo'))undo()}catch(error){fail(error)}
 });
 document.addEventListener('dragstart',event=>{
  if(!validRoot()||!editable())return;const person=event.target.closest('[data-board-drag-person]'),group=event.target.closest('[data-board-drag-section]'),s=current();let ids;
  if(person)ids=s.selected.has(person.dataset.boardDragPerson)?[...s.selected]:[person.dataset.boardDragPerson];
  else if(group)ids=model().visible.filter(row=>row.section===group.dataset.boardDragSection&&row.line===group.dataset.boardDragLine).map(row=>String(row.employee.id));else return;
  drag={scope:s.scope,ids};event.dataTransfer?.setData('application/x-ppms-line-board','move');if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
 });
 document.addEventListener('dragover',event=>{const lane=event.target.closest?.('[data-board-drop]');if(lane&&drag&&validRoot()&&editable()){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';lane.classList.add('is-drop-target')}});
 document.addEventListener('dragleave',event=>{const lane=event.target.closest?.('[data-board-drop]');if(lane&&!lane.contains(event.relatedTarget))lane.classList.remove('is-drop-target')});
 document.addEventListener('drop',event=>{const lane=event.target.closest?.('[data-board-drop]');if(!lane||!drag)return;event.preventDefault();const pending=drag;drag=null;lane.classList.remove('is-drop-target');try{if(pending.scope!==api().key(scope()))throw Error(t('โรงงานเปลี่ยนแล้ว กรุณาเลือกใหม่','Plant changed. Select again'));move(pending.ids,lane.dataset.boardDrop)}catch(error){fail(error)}});
 document.addEventListener('dragend',()=>{drag=null;document.querySelectorAll('.is-drop-target').forEach(el=>el.classList.remove('is-drop-target'))});
 window.addEventListener('ppms-organization-scope-changed',()=>{state=null;drag=null});
 const init=()=>{if(window.ResizeObserver){const observer=new ResizeObserver(positionToolbar);for(const el of [document.querySelector('body>header'),document.getElementById('nav')])if(el)observer.observe(el)}window.addEventListener('resize',positionToolbar);const app=document.getElementById('app');if(app)new MutationObserver(()=>{if(root())paintSelection()}).observe(app,{childList:true});if(root())paintSelection()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.PPMSLineBoard={active,markup,setMode,move,undo,mount:paintSelection};
})();
