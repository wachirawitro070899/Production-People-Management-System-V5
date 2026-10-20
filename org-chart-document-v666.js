/* V666: Section Organization Chart document header, effective date and approvals. */
(()=>{'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const section=()=>String(sessionStorage.getItem('chartSec')||document.querySelector('#sectionSelect')?.value||'').trim();
const storageKey=()=>`ppms_org_effective_date_${section().toLowerCase().replace(/\s+/g,'_')}`;
const effectiveDate=()=>localStorage.getItem(storageKey())||today();
const employeeId=value=>String(value||'').normalize('NFKC').trim().toUpperCase();
// Compare generated source, since language/JD enhancements intentionally change the DOM.
const renderedHTML=new WeakMap();
function updateHTML(node,html){if(renderedHTML.get(node)===html)return;renderedHTML.set(node,html);node.innerHTML=html}
function employeeMeta(){let list=[];try{const raw=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]');list=Array.isArray(raw)?raw:Object.values(raw||{})}catch(_){}return new Map(list.filter(Boolean).map(item=>[employeeId(item.id),item]))}
const employmentRank=item=>/^(permanent|พนักงานประจำ)$/i.test(String(item?.contractType||'').trim())?0:1;
const startTime=item=>{const time=Date.parse((employmentRank(item)===0?item?.permanentStartDate:'')||item?.startDate||'');return Number.isFinite(time)?time:Number.MAX_SAFE_INTEGER};
const rankOf=node=>{const text=node.textContent||'';if(/manager|ผู้จัดการ/i.test(text))return['manager','Manager'];if(/engineer|วิศวกร/i.test(text))return['engineer','Engineer'];if(/supervisor/i.test(text))return['supervisor','Supervisor'];if(/specialist/i.test(text))return['specialist','Specialist'];if(/leader|หัวหน้าทีม/i.test(text))return['leader','Leader'];if(/technician/i.test(text))return['technician','Technician'];if(/\b(?:operator|opeartor|operater)\b|\bop\b|พนักงานทั่วไป|พนักงานผลิต/i.test(text))return['operator','Operator'];return['other','Other']};
function weldingCard(id,node,item,rank,position){
 const visual=node.querySelector('img,.avatar')?.cloneNode(true),photo=visual?visual.outerHTML:'<div class="avatar">?</div>',name=item?.name||node.querySelector('b,strong')?.textContent||'';
 return`<div class="person ${rank} person-editable" data-edit="${esc(id)}" role="button" tabindex="0">${photo}<b>${esc(name)}</b><small>${esc(id)}<br>${esc(position)}</small></div>`;
}
function stampingHierarchy(report,footer){
 let extra=report.querySelector('.stamping-standard-hierarchy');
 if(!/stamping/i.test(section())){extra?.remove();return}
 const unique=new Map();report.querySelectorAll('[data-edit]').forEach(node=>{const id=String(node.dataset.edit||'').trim();if(id&&!node.closest('.stamping-standard-hierarchy,.stamping-print-page')&&!unique.has(id))unique.set(id,node)});
 const meta=employeeMeta(),groups=new Map();for(const [id,node]of unique){const person=meta.get(employeeId(id)),position=String(person?.position||'');const [rank,label]=rankOf({textContent:position||node.textContent});if(!groups.has(rank))groups.set(rank,{label,items:[]});groups.get(rank).items.push({id,node,meta:meta.get(employeeId(id))||null})}for(const group of groups.values())group.items.sort((a,b)=>employmentRank(a.meta)-employmentRank(b.meta)||startTime(a.meta)-startTime(b.meta)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
 const order=['manager','engineer','supervisor','specialist','leader','technician','other','operator'];
 const levels=order.filter(rank=>groups.has(rank)).map(rank=>{const group=groups.get(rank);const people=group.items.map(({id,node,meta})=>weldingCard(id,node,meta,rank,meta?.position||group.label)).join('');return`<div class="level level-${rank}"><h4>${group.label}</h4><div class="people">${people}</div></div>`}).join('');
 const html=`<div class="panel hierarchy">${levels||'<div class="empty">ไม่มีข้อมูลพนักงาน</div>'}</div>`;
 if(!extra){extra=document.createElement('section');extra.className='stamping-standard-hierarchy';report.insertBefore(extra,footer)}
 updateHTML(extra,html);
 const source=report.querySelector('.stamping-role-source');if(source){source.hidden=true;source.style.display='none'}
}
function stampingPrintPage(report,header,footer){
 let page=report.querySelector('.stamping-print-page');if(!/stamping/i.test(section())){page?.remove();return}
 const chart=report.querySelector('.stamping-standard-hierarchy');if(!chart)return;const html=`${header.outerHTML}${chart.outerHTML}${footer.outerHTML}`;
 if(!page){page=document.createElement('section');page.className='stamping-print-page unified-section-page';report.append(page)}updateHTML(page,html);
}
function sortAllPeople(report){
 const meta=employeeMeta();report.querySelectorAll('.people').forEach(container=>{if(container.closest('.sorting-print-pages,.stamping-print-page'))return;const nodes=[...container.children].filter(node=>node.matches?.('[data-edit]'));if(!nodes.length)return;const indexed=nodes.map((node,index)=>({node,index,id:String(node.dataset.edit||''),meta:meta.get(employeeId(node.dataset.edit))||null}));const sorted=[...indexed].sort((a,b)=>employmentRank(a.meta)-employmentRank(b.meta)||startTime(a.meta)-startTime(b.meta)||(a.meta&&b.meta?String(a.id).localeCompare(String(b.id),undefined,{numeric:true}):a.index-b.index));if(sorted.some((item,index)=>item.node!==nodes[index]))sorted.forEach(item=>container.append(item.node));container.classList.toggle('people-multi',nodes.length>9);container.classList.toggle('people-wrapped',nodes.length>18)})
}
function sortingPrintPages(report,header,footer){
 let pages=report.querySelector('.sorting-print-pages');
 if(!/^sorting\s*(?:section|[12])$/i.test(section())){pages?.remove();return}
 const teams=[...report.querySelectorAll('.sorting-split>.sorting-team,.sorting-unassigned')];if(!teams.length)return;
 const meta=employeeMeta();const html=teams.map(team=>{const clone=team.cloneNode(true);clone.querySelectorAll('[data-edit]').forEach(card=>{const id=String(card.dataset.edit||''),item=meta.get(employeeId(id))||null,position=item?.position||card.closest('.level')?.querySelector('h4')?.textContent||'',rank=rankOf({textContent:position})[0];card.outerHTML=weldingCard(id,card,item,rank,position)});const head=header.cloneNode(true),group=team.dataset.sortingGroup||'Sorting Section',title=head.querySelector('h1'),subtitle=head.querySelector('p');if(title)title.textContent='SECTION ORGANIZATION CHART — '+group;if(subtitle)subtitle.textContent='Production People Management System · Section: '+group;const levels=[...clone.querySelectorAll(':scope>.level')].map(level=>level.outerHTML).join(''),label=team.dataset.sortingGroup?'':clone.querySelector(':scope>h3')?.outerHTML||'';return`<section class="sorting-print-page unified-section-page" data-sorting-group="${esc(team.dataset.sortingGroup||'')}">${head.outerHTML}<div class="panel hierarchy unified-section-hierarchy">${label}${levels}</div>${footer.outerHTML}</section>`}).join('');
 if(!pages){pages=document.createElement('div');pages.className='sorting-print-pages';report.append(pages)}
 updateHTML(pages,html);
}
function render(){
 const report=document.querySelector('.section-org-report');
 if(!report){document.body.classList.remove('org-section-teams','org-stamping','org-sorting');return}
 const split=report.dataset.sectionTeamMode==='split';document.body.classList.toggle('org-section-teams',split);
 const sec=section();if(!sec)return;
 document.body.classList.toggle('org-stamping',/stamping/i.test(sec));document.body.classList.toggle('org-sorting',/^sorting\s*(?:section|[12])$/i.test(sec));
 document.querySelectorAll('.top-action-toolbar button[data-action="printSettings"]').forEach(button=>button.remove());
 const toolbar=document.querySelector('.top-action-toolbar');if(toolbar)toolbar.remove();
 let header=report.querySelector('.org-document-header');
 if(!header){header=document.createElement('section');header.className='org-document-header';report.prepend(header)}
 const logo=document.querySelector('header .logo img')?.src||'';const headerHtml=`<div class="org-document-logo">${logo?`<img src="${esc(logo)}" alt="JR">`:'<b>JR</b>'}</div><div class="org-document-title"><h1>SECTION ORGANIZATION CHART — ${esc(sec)}</h1><p>Production People Management System · Section: ${esc(sec)}</p></div><dl><div><dt>Revision</dt><dd>00</dd></div><div><dt>Effective Date / วันที่เริ่มใช้งาน</dt><dd>${esc(effectiveDate())}</dd></div></dl>`;updateHTML(header,headerHtml);
 let footer=report.querySelector('.org-document-approval');
 if(!footer){footer=document.createElement('section');footer.className='org-document-approval';report.append(footer)}
 const footerHtml='<div><b>Prepared by / จัดทำโดย</b><span></span><small>Signature / Date</small></div><div><b>Reviewed by / ตรวจสอบโดย</b><span></span><small>Signature / Date</small></div><div><b>Approved by / อนุมัติโดย</b><span></span><small>Signature / Date</small></div>';updateHTML(footer,footerHtml);
 stampingHierarchy(report,footer);
 sortAllPeople(report);
 stampingPrintPage(report,header,footer);
 sortingPrintPages(report,header,footer);
 window.dispatchEvent(new CustomEvent('ppms-section-chart-rendered'));
 const panel=document.querySelector('#sectionSelect')?.closest('.panel');
 if(panel&&!panel.querySelector('#orgEffectiveDate')){const label=document.createElement('label');label.className='org-effective-control';label.innerHTML='<span>วันที่เริ่มใช้งาน / Effective Date</span><input id="orgEffectiveDate" type="date">';panel.append(label);const input=label.querySelector('input');input.value=effectiveDate();input.addEventListener('change',()=>{if(input.value)localStorage.setItem(storageKey(),input.value);render()});const paper=document.createElement('label');paper.className='org-paper-control';paper.innerHTML='<span>ขนาดกระดาษ / Paper Size</span><select id="orgPaperSize"><option value="A4">A4 แนวนอน</option><option value="A3">A3 แนวนอน</option></select>';panel.append(paper);paper.querySelector('select').value=localStorage.getItem('ppms_org_paper_size')||'A4';paper.querySelector('select').addEventListener('change',event=>localStorage.setItem('ppms_org_paper_size',event.target.value));const print=document.createElement('button');print.type='button';print.className='org-compact-print';print.dataset.action='orgChartPrint';print.textContent='พิมพ์';panel.append(print)}
 if(panel&&!panel.querySelector('[data-action="pageExcel"]')){const excel=document.createElement('button');excel.type='button';excel.className='org-compact-print';excel.dataset.action='pageExcel';excel.textContent='ดาวน์โหลด Excel';panel.append(excel)}
}
let queued=false,observerTimer=0;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
const appRoot=document.getElementById('app')||document.body;
new MutationObserver(()=>{clearTimeout(observerTimer);observerTimer=setTimeout(schedule,80)}).observe(appRoot,{childList:true,subtree:false});
document.addEventListener('change',event=>{if(event.target?.id==='sectionSelect')setTimeout(schedule,0)});
function preparePrint(){
 const report=document.querySelector('.section-org-report');if(!report)return;
 if(!report.querySelector('.org-document-header'))render();
 const size=document.getElementById('orgPaperSize')?.value==='A3'?'A3':'A4';localStorage.setItem('ppms_org_paper_size',size);document.body.classList.remove('org-paper-a3','org-paper-a4');document.body.classList.add('print-section-org','org-paper-'+size.toLowerCase());let style=document.getElementById('orgDynamicPageSize');if(!style){style=document.createElement('style');style.id='orgDynamicPageSize';document.head.append(style)}style.textContent=`@media print{@page{size:${size} landscape;margin:7mm}}`;
}
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="orgChartPrint"]'))return;event.preventDefault();preparePrint();window.print()},true);
window.addEventListener('beforeprint',preparePrint);
window.addEventListener('afterprint',()=>{document.body.classList.remove('print-section-org','org-paper-a3','org-paper-a4');document.getElementById('orgDynamicPageSize')?.remove()});
document.addEventListener('DOMContentLoaded',schedule);
})();

