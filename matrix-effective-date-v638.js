/* V638: Effective Date / วันที่เริ่มใช้ for Section Skill Matrix */
(()=>{
  const STORAGE_KEY='ppms_matrix_effective_dates_v638';

  function readDates(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}
  }
  function sectionName(report){
    const title=report?.querySelector('.matrix-print-header h2')?.textContent||'';
    return title.replace(/^SECTION SKILL MATRIX\s*[—-]\s*/i,'').trim()||'General';
  }
  function defaultDate(){
    return new Date().toISOString().slice(0,10);
  }
  function apply(){
    const report=document.querySelector('.matrix-report');
    const filter=document.querySelector('.matrix-filter');
    if(!report||!filter)return;

    const section=sectionName(report);
    const dates=readDates();
    const value=String(dates[section]||defaultDate());

    let field=filter.querySelector('#matrixEffectiveDate');
    if(!field){
      const label=document.createElement('label');
      label.className='matrix-effective-date-field';
      label.innerHTML='<span>วันที่เริ่มใช้ / Effective Date</span><input id="matrixEffectiveDate" type="date">';
      const guidance=filter.querySelector('.matrix-guidance');
      filter.insertBefore(label,guidance||null);
      field=label.querySelector('input');
      field.addEventListener('change',()=>{
        const currentSection=sectionName(document.querySelector('.matrix-report'));
        const next=readDates();
        next[currentSection]=field.value||defaultDate();
        localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
        updateHeader(field.value||defaultDate());
      });
    }
    if(field.value!==value)field.value=value;
    updateHeader(value);
  }

  function updateHeader(value){
    const box=document.querySelector('.matrix-report .doc-box');
    if(!box)return;
    let row=box.querySelector('.matrix-effective-date');
    if(!row){
      row=document.createElement('div');
      row.className='matrix-effective-date';
      box.appendChild(row);
    }
    const nextValue=String(value||defaultDate());
    if(row.dataset.value===nextValue)return;
    row.dataset.value=nextValue;
    row.innerHTML='<b>วันที่เริ่มใช้ / Effective Date:</b> '+nextValue;
  }

  const style=document.createElement('style');
  style.textContent=`
    .matrix-effective-date-field{min-width:210px}
    .matrix-effective-date-field span{display:block;font-weight:700;margin-bottom:5px}
    .matrix-report .doc-box .matrix-effective-date{margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,.35)}
    @media print{
      .matrix-report .doc-box{min-width:175px!important}
      .matrix-report .doc-box .matrix-effective-date{white-space:nowrap}
    }`;
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>apply());
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
