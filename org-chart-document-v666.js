/* V666: Section Organization Chart document header, effective date and approvals. */
(()=>{'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const section=()=>String(sessionStorage.getItem('chartSec')||document.querySelector('#sectionSelect')?.value||'').trim();
const storageKey=()=>`ppms_org_effective_date_${section().toLowerCase().replace(/\s+/g,'_')}`;
const effectiveDate=()=>localStorage.getItem(storageKey())||today();
const rankOf=node=>{const text=node.textContent||'';if(/supervisor/i.test(text))return['supervisor','Supervisor'];if(/leader|หัวหน้าทีม/i.test(text))return['leader','Leader'];if(/technician/i.test(text))return['technician','Technician'];if(/operator/i.test(text))return['operator','Operator'];return['other','Other']};
function stampingHierarchy(report,footer){
 let extra=report.querySelector('.stamping-standard-hierarchy');
 if(!/^stamping\s*section$/i.test(section())){extra?.remove();return}
 const unique=new Map();report.querySelectorAll('[data-edit]').forEach(node=>{const id=String(node.dataset.edit||'').trim();if(id&&!node.closest('.stamping-standard-hierarchy')&&!unique.has(id))unique.set(id,node)});
 const groups=new Map();for(const [id,node]of unique){const [rank,label]=rankOf(node);if(!groups.has(rank))groups.set(rank,{label,items:[]});groups.get(rank).items.push({id,node})}
 const order=['manager','engineer','supervisor','leader','technician','operator','other'];
 const levels=order.filter(rank=>groups.has(rank)).map(rank=>{const group=groups.get(rank);const people=group.items.map(({node})=>{const clone=node.cloneNode(true);clone.className=`person ${rank}`;clone.querySelectorAll('.org-exam-light,.stamp-machine-box,.stamp-assignee-info .stamp-role-name').forEach(el=>el.remove());return clone.outerHTML}).join('');return`<div class="level"><h4>${group.label}</h4><div class="people">${people}</div></div>`}).join('');
 const html=`<h2>STAMPING SECTION – STANDARD ORGANIZATION CHART</h2><p>โครงสร้างตามลำดับตำแหน่ง / Position Hierarchy</p><div class="panel hierarchy">${levels||'<div class="empty">ไม่มีข้อมูลพนักงาน</div>'}</div>`;
 if(!extra){extra=document.createElement('section');extra.className='stamping-standard-hierarchy';report.insertBefore(extra,footer)}
 if(extra.innerHTML!==html)extra.innerHTML=html;
}
function sortingPrintPages(report,header,footer){
 let pages=report.querySelector('.sorting-print-pages');
 if(!/^sorting\s*section$/i.test(section())){pages?.remove();return}
 const teams=[...report.querySelectorAll('.sorting-split>.sorting-team')];if(!teams.length)return;
 const html=teams.slice(0,2).map((team,index)=>`<section class="sorting-print-page">${header.outerHTML}<div class="sorting-print-title">SORTING ${index+1}</div><div class="sorting-print-team">${team.outerHTML}</div>${footer.outerHTML}</section>`).join('');
 if(!pages){pages=document.createElement('div');pages.className='sorting-print-pages';report.append(pages)}
 if(pages.innerHTML!==html)pages.innerHTML=html;
}
function render(){
 const report=document.querySelector('.section-org-report');
 if(!report)return;
 const sec=section();if(!sec)return;
 document.querySelectorAll('.top-action-toolbar button[data-action="printSettings"]').forEach(button=>button.remove());
 const toolbar=document.querySelector('.top-action-toolbar');if(toolbar)toolbar.remove();
 let header=report.querySelector('.org-document-header');
 if(!header){header=document.createElement('section');header.className='org-document-header';report.prepend(header)}
 const logo=document.querySelector('header .logo img')?.src||'';const headerHtml=`<div class="org-document-logo">${logo?`<img src="${esc(logo)}" alt="JR">`:'<b>JR</b>'}</div><div class="org-document-title"><h1>SECTION ORGANIZATION CHART — ${esc(sec)}</h1><p>Production People Management System · Section: ${esc(sec)}</p></div><dl><div><dt>Revision</dt><dd>00</dd></div><div><dt>Effective Date / วันที่เริ่มใช้งาน</dt><dd>${esc(effectiveDate())}</dd></div></dl>`;if(header.innerHTML!==headerHtml)header.innerHTML=headerHtml;
 let footer=report.querySelector('.org-document-approval');
 if(!footer){footer=document.createElement('section');footer.className='org-document-approval';report.append(footer)}
 const footerHtml='<div><b>Prepared by / จัดทำโดย</b><span></span><small>Signature / Date</small></div><div><b>Reviewed by / ตรวจสอบโดย</b><span></span><small>Signature / Date</small></div><div><b>Approved by / อนุมัติโดย</b><span></span><small>Signature / Date</small></div>';if(footer.innerHTML!==footerHtml)footer.innerHTML=footerHtml;
 stampingHierarchy(report,footer);
 sortingPrintPages(report,header,footer);
 const panel=document.querySelector('#sectionSelect')?.closest('.panel');
 if(panel&&!panel.querySelector('#orgEffectiveDate')){const label=document.createElement('label');label.className='org-effective-control';label.innerHTML='<span>วันที่เริ่มใช้งาน / Effective Date</span><input id="orgEffectiveDate" type="date">';panel.append(label);const input=label.querySelector('input');input.value=effectiveDate();input.addEventListener('change',()=>{if(input.value)localStorage.setItem(storageKey(),input.value);render()});const print=document.createElement('button');print.type='button';print.className='org-compact-print';print.dataset.action='orgChartPrint';print.textContent='พิมพ์';panel.append(print)}
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target?.id==='sectionSelect')setTimeout(schedule,0)});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="orgChartPrint"]'))return;event.preventDefault();document.body.classList.add('print-section-org');window.print();setTimeout(()=>document.body.classList.remove('print-section-org'),500)},true);
document.addEventListener('DOMContentLoaded',schedule);
})();
