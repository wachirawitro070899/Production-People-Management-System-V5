/* V666: Section Organization Chart document header, effective date and approvals. */
(()=>{'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const section=()=>String(sessionStorage.getItem('chartSec')||document.querySelector('#sectionSelect')?.value||'').trim();
const storageKey=()=>`ppms_org_effective_date_${section().toLowerCase().replace(/\s+/g,'_')}`;
const effectiveDate=()=>localStorage.getItem(storageKey())||today();
const employeeId=value=>String(value||'').normalize('NFKC').trim().toUpperCase();
function employeeMeta(){let list=[];try{const raw=JSON.parse(localStorage.getItem('ppms_v3_employees')||'[]');list=Array.isArray(raw)?raw:Object.values(raw||{})}catch(_){}return new Map(list.filter(Boolean).map(item=>[employeeId(item.id),item]))}
const employmentRank=item=>String(item?.contractType||'').trim().toLowerCase()==='permanent'?0:1;
const startTime=item=>{const time=Date.parse(item?.startDate||'');return Number.isFinite(time)?time:Number.MAX_SAFE_INTEGER};
const rankOf=node=>{const text=node.textContent||'';if(/supervisor/i.test(text))return['supervisor','Supervisor'];if(/leader|หัวหน้าทีม/i.test(text))return['leader','Leader'];if(/technician/i.test(text))return['technician','Technician'];if(/operator/i.test(text))return['operator','Operator'];return['other','Other']};
function stampingHierarchy(report,footer){
 let extra=report.querySelector('.stamping-standard-hierarchy');
 if(!/^stamping\s*section$/i.test(section())){extra?.remove();return}
 const unique=new Map();report.querySelectorAll('[data-edit]').forEach(node=>{const id=String(node.dataset.edit||'').trim();if(id&&!node.closest('.stamping-standard-hierarchy')&&!unique.has(id))unique.set(id,node)});
 const meta=employeeMeta(),groups=new Map();for(const [id,node]of unique){const [rank,label]=rankOf(node);if(!groups.has(rank))groups.set(rank,{label,items:[]});groups.get(rank).items.push({id,node,meta:meta.get(employeeId(id))||null})}for(const group of groups.values())group.items.sort((a,b)=>employmentRank(a.meta)-employmentRank(b.meta)||startTime(a.meta)-startTime(b.meta)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
 const order=['manager','engineer','supervisor','leader','technician','operator','other'];
 const levels=order.filter(rank=>groups.has(rank)).map(rank=>{const group=groups.get(rank);const people=group.items.map(({id,node,meta})=>{const visual=node.querySelector('img,.avatar')?.cloneNode(true);const photo=visual?visual.outerHTML:'<div class="avatar">?</div>';const name=meta?.name||node.querySelector('strong')?.textContent||'';const position=meta?.position||group.label;return`<div class="person ${rank} stamping-person-card" data-edit="${esc(id)}" data-contract="${employmentRank(meta)===0?'permanent':'subcontractor'}"><div class="stamping-card-photo">${photo}</div><strong class="stamping-card-name">${esc(name)}</strong><small class="stamping-card-id">${esc(id)}</small><small class="stamping-card-position">${esc(position)}</small></div>`}).join('');return`<div class="level level-${rank}"><h4>${group.label}</h4><div class="people">${people}</div></div>`}).join('');
 const html=`<div class="panel hierarchy">${levels||'<div class="empty">ไม่มีข้อมูลพนักงาน</div>'}</div>`;
 if(!extra){extra=document.createElement('section');extra.className='stamping-standard-hierarchy';report.insertBefore(extra,footer)}
 if(extra.innerHTML!==html)extra.innerHTML=html;
}
function stampingPrintPage(report,header,footer){
 let page=report.querySelector('.stamping-print-page');if(!/^stamping\s*section$/i.test(section())){page?.remove();return}
 const chart=report.querySelector('.stamping-standard-hierarchy');if(!chart)return;const html=`${header.outerHTML}${chart.outerHTML}${footer.outerHTML}`;
 if(!page){page=document.createElement('section');page.className='stamping-print-page unified-section-page';report.append(page)}if(page.innerHTML!==html)page.innerHTML=html;
}
function sortAllPeople(report){
 const meta=employeeMeta();report.querySelectorAll('.people').forEach(container=>{if(container.closest('.sorting-print-pages,.stamping-print-page'))return;const nodes=[...container.children].filter(node=>node.matches?.('[data-edit]'));if(!nodes.length)return;const indexed=nodes.map((node,index)=>({node,index,id:String(node.dataset.edit||''),meta:meta.get(employeeId(node.dataset.edit))||null}));const sorted=[...indexed].sort((a,b)=>employmentRank(a.meta)-employmentRank(b.meta)||startTime(a.meta)-startTime(b.meta)||(a.meta&&b.meta?String(a.id).localeCompare(String(b.id),undefined,{numeric:true}):a.index-b.index));if(sorted.some((item,index)=>item.node!==nodes[index]))sorted.forEach(item=>container.append(item.node));container.classList.toggle('people-multi',nodes.length>9);container.classList.toggle('people-wrapped',nodes.length>18)})
}
function sortingPrintPages(report,header,footer){
 let pages=report.querySelector('.sorting-print-pages');
 if(!/^sorting\s*section$/i.test(section())){pages?.remove();return}
 const teams=[...report.querySelectorAll('.sorting-split>.sorting-team')];if(!teams.length)return;
 const meta=employeeMeta();const html=teams.slice(0,2).map((team,index)=>{const clone=team.cloneNode(true);clone.querySelectorAll('[data-edit]').forEach(card=>{const id=String(card.dataset.edit||''),item=meta.get(employeeId(id))||null,visual=card.querySelector('img,.avatar')?.cloneNode(true),photo=visual?visual.outerHTML:'<div class="avatar">?</div>',name=item?.name||card.querySelector('b,strong')?.textContent||'',position=item?.position||card.closest('.level')?.querySelector('h4')?.textContent||'';card.className='person sorting-person-card '+(String(position).toLowerCase().includes('leader')?'leader':'operator');card.innerHTML=`<div class="sorting-card-photo">${photo}</div><strong class="sorting-card-name">${esc(name)}</strong><small class="sorting-card-id">${esc(id)}</small><small class="sorting-card-position">${esc(position)}</small>`});const head=header.cloneNode(true),group='Sorting '+(index+1),title=head.querySelector('h1'),subtitle=head.querySelector('p');if(title)title.textContent='SECTION ORGANIZATION CHART — '+group;if(subtitle)subtitle.textContent='Production People Management System · Section: '+group;const levels=[...clone.querySelectorAll(':scope>.level')].map(level=>level.outerHTML).join('');return`<section class="sorting-print-page unified-section-page">${head.outerHTML}<div class="panel hierarchy unified-section-hierarchy">${levels}</div>${footer.outerHTML}</section>`}).join('');
 if(!pages){pages=document.createElement('div');pages.className='sorting-print-pages';report.append(pages)}
 if(pages.innerHTML!==html)pages.innerHTML=html;
}
function render(){
 const report=document.querySelector('.section-org-report');
 if(!report)return;
 const sec=section();if(!sec)return;
 document.body.classList.toggle('org-stamping',/^stamping\s*section$/i.test(sec));document.body.classList.toggle('org-sorting',/^sorting\s*section$/i.test(sec));
 document.querySelectorAll('.top-action-toolbar button[data-action="printSettings"]').forEach(button=>button.remove());
 const toolbar=document.querySelector('.top-action-toolbar');if(toolbar)toolbar.remove();
 let header=report.querySelector('.org-document-header');
 if(!header){header=document.createElement('section');header.className='org-document-header';report.prepend(header)}
 const logo=document.querySelector('header .logo img')?.src||'';const headerHtml=`<div class="org-document-logo">${logo?`<img src="${esc(logo)}" alt="JR">`:'<b>JR</b>'}</div><div class="org-document-title"><h1>SECTION ORGANIZATION CHART — ${esc(sec)}</h1><p>Production People Management System · Section: ${esc(sec)}</p></div><dl><div><dt>Revision</dt><dd>00</dd></div><div><dt>Effective Date / วันที่เริ่มใช้งาน</dt><dd>${esc(effectiveDate())}</dd></div></dl>`;if(header.innerHTML!==headerHtml)header.innerHTML=headerHtml;
 let footer=report.querySelector('.org-document-approval');
 if(!footer){footer=document.createElement('section');footer.className='org-document-approval';report.append(footer)}
 const footerHtml='<div><b>Prepared by / จัดทำโดย</b><span></span><small>Signature / Date</small></div><div><b>Reviewed by / ตรวจสอบโดย</b><span></span><small>Signature / Date</small></div><div><b>Approved by / อนุมัติโดย</b><span></span><small>Signature / Date</small></div>';if(footer.innerHTML!==footerHtml)footer.innerHTML=footerHtml;
 stampingHierarchy(report,footer);
 sortAllPeople(report);
 stampingPrintPage(report,header,footer);
 sortingPrintPages(report,header,footer);
 const panel=document.querySelector('#sectionSelect')?.closest('.panel');
 if(panel&&!panel.querySelector('#orgEffectiveDate')){const label=document.createElement('label');label.className='org-effective-control';label.innerHTML='<span>วันที่เริ่มใช้งาน / Effective Date</span><input id="orgEffectiveDate" type="date">';panel.append(label);const input=label.querySelector('input');input.value=effectiveDate();input.addEventListener('change',()=>{if(input.value)localStorage.setItem(storageKey(),input.value);render()});const paper=document.createElement('label');paper.className='org-paper-control';paper.innerHTML='<span>ขนาดกระดาษ / Paper Size</span><select id="orgPaperSize"><option value="A4">A4 แนวนอน</option><option value="A3">A3 แนวนอน</option></select>';panel.append(paper);paper.querySelector('select').value=localStorage.getItem('ppms_org_paper_size')||'A4';paper.querySelector('select').addEventListener('change',event=>localStorage.setItem('ppms_org_paper_size',event.target.value));const print=document.createElement('button');print.type='button';print.className='org-compact-print';print.dataset.action='orgChartPrint';print.textContent='พิมพ์';panel.append(print)}
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target?.id==='sectionSelect')setTimeout(schedule,0)});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="orgChartPrint"]'))return;event.preventDefault();const size=document.getElementById('orgPaperSize')?.value==='A3'?'A3':'A4';localStorage.setItem('ppms_org_paper_size',size);document.body.classList.remove('org-paper-a3','org-paper-a4');document.body.classList.add('print-section-org','org-paper-'+size.toLowerCase());let style=document.getElementById('orgDynamicPageSize');if(!style){style=document.createElement('style');style.id='orgDynamicPageSize';document.head.append(style)}style.textContent=`@media print{@page{size:${size} landscape;margin:7mm}}`;window.print()},true);
window.addEventListener('afterprint',()=>{document.body.classList.remove('print-section-org','org-paper-a3','org-paper-a4');document.getElementById('orgDynamicPageSize')?.remove()});
document.addEventListener('DOMContentLoaded',schedule);
})();
