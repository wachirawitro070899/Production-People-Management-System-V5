/* V666: Section Organization Chart document header, effective date and approvals. */
(()=>{'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const section=()=>String(sessionStorage.getItem('chartSec')||document.querySelector('#sectionSelect')?.value||'').trim();
const storageKey=()=>`ppms_org_effective_date_${section().toLowerCase().replace(/\s+/g,'_')}`;
const effectiveDate=()=>localStorage.getItem(storageKey())||today();
function render(){
 const report=document.querySelector('.section-org-report');
 if(!report)return;
 const sec=section();if(!sec)return;
 document.querySelectorAll('.top-action-toolbar button[data-action="printSettings"]').forEach(button=>button.remove());
 const toolbar=document.querySelector('.top-action-toolbar');if(toolbar&&!toolbar.querySelector('button'))toolbar.remove();
 let header=report.querySelector('.org-document-header');
 if(!header){header=document.createElement('section');header.className='org-document-header';report.prepend(header)}
 header.innerHTML=`<div><h1>SECTION ORGANIZATION CHART</h1><p>Production People Management System</p></div><dl><div><dt>Section</dt><dd>${esc(sec)}</dd></div><div><dt>Effective Date / วันที่เริ่มใช้งาน</dt><dd>${esc(effectiveDate())}</dd></div><div><dt>Revision</dt><dd>00</dd></div></dl>`;
 let footer=report.querySelector('.org-document-approval');
 if(!footer){footer=document.createElement('section');footer.className='org-document-approval';report.append(footer)}
 footer.innerHTML='<div><b>Prepared by / จัดทำโดย</b><span></span><small>Signature / Date</small></div><div><b>Reviewed by / ตรวจสอบโดย</b><span></span><small>Signature / Date</small></div><div><b>Approved by / อนุมัติโดย</b><span></span><small>Signature / Date</small></div>';
 const panel=document.querySelector('#sectionSelect')?.closest('.panel');
 if(panel&&!panel.querySelector('#orgEffectiveDate')){const label=document.createElement('label');label.className='org-effective-control';label.innerHTML='<span>วันที่เริ่มใช้งาน / Effective Date</span><input id="orgEffectiveDate" type="date">';panel.append(label);const input=label.querySelector('input');input.value=effectiveDate();input.addEventListener('change',()=>{if(input.value)localStorage.setItem(storageKey(),input.value);render()})}
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target?.id==='sectionSelect')setTimeout(schedule,0)});
document.addEventListener('DOMContentLoaded',schedule);
})();
