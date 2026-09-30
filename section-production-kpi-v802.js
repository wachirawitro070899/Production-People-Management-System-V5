/* Monthly production KPI by Section, using the same daily rule as employee cards. */
(() => {
  'use strict';
  const endpoint='https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
  const page='sectionProductionKpi', rootId='sectionProductionKpiPage';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=value=>String(value??'').normalize('NFKC').trim().toLowerCase();
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  let active=false, month=today().slice(0,7), section='', data=null, error='', loading=false, requestNumber=0, results=[];
  const style=document.createElement('style');
  style.textContent=`body.section-production-kpi-view #app{display:none!important}#${rootId}{max-width:1500px;margin:auto;padding:24px}#${rootId} .kpi-section-controls{display:flex;align-items:end;flex-wrap:wrap;gap:12px;margin:16px 0}#${rootId} .kpi-section-controls label{display:grid;gap:6px;font-size:14px}#${rootId} input,#${rootId} select{min-height:40px}#${rootId} .kpi-section-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px}#${rootId} .kpi-section-head h3{margin:0}#${rootId} .kpi-pass{color:#16734a;font-weight:800}#${rootId} .kpi-pending{color:#876114}#${rootId} .kpi-section-detail{font-size:13px;line-height:1.7;white-space:normal;max-width:420px}#${rootId} .kpi-section-detail summary{cursor:pointer}#${rootId} td,#${rootId} th{padding:10px;vertical-align:top}#${rootId} .panel{margin-bottom:18px}#${rootId} .kpi-summary-note{font-size:14px;color:#526171}#${rootId} .table-wrap{overflow:auto}@media(max-width:700px){#${rootId}{padding:16px}#${rootId} table{min-width:680px}}`;
  document.head.append(style);
  function employees(){
    const deleted=new Set(read('ppms_v3_deleted_employee_ids',[]).map(norm));
    const list=read('ppms_v3_employees',[]), seen=new Set();
    return (Array.isArray(list)?list:[]).filter(e=>{const code=norm(e.id);if(!code||seen.has(code)||deleted.has(code))return false;seen.add(code);return true}).map(e=>({code:String(e.id),name:e.thaiName||e.name||'',section:String(e.section||'ไม่ระบุ Section')}));
  }
  function summarize(roster,payload,attendance,selectedMonth,isOnline){
    const checked=new Set((Array.isArray(attendance)?attendance:[]).filter(a=>a.checkIn).map(a=>norm(a.employeeId)+'|'+a.date));
    const histories=new Map((payload?.histories||[]).map(item=>[norm(item.employeeCode),item.history||[]]));
    const confirmed=row=>Number.isFinite(row.rate)&&['ถึงเกณฑ์','ต่ำกว่าเกณฑ์','ไม่ถึงเกณฑ์'].includes(row.status);
    return roster.map(employee=>{
      const unique=new Map();
      for(const row of histories.get(norm(employee.code))||[]){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(row.workDate||'')||!row.workDate.startsWith(selectedMonth+'-')||row.workDate>today())continue;
        const key=JSON.stringify([row.workDate,row.shift,row.machine]);if(!unique.has(key))unique.set(key,row);
      }
      const groups=new Map();for(const row of unique.values()){const list=groups.get(row.workDate)||[];list.push(row);groups.set(row.workDate,list)}
      const days=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>{
        const scan=checked.has(norm(employee.code)+'|'+date);
        const status=!isOnline||!scan||rows.some(row=>!confirmed(row))?'รอตรวจ':rows.every(row=>row.passed)?'ถึงเกณฑ์':'ไม่ถึงเกณฑ์';
        return {date,rows,scan,status};
      });
      return {...employee,days,passed:days.filter(d=>d.status==='ถึงเกณฑ์').length,failed:days.filter(d=>d.status==='ไม่ถึงเกณฑ์').length,waiting:days.filter(d=>d.status==='รอตรวจ').length};
    });
  }
  function shell(){
    let root=document.getElementById(rootId);
    if(!root){root=document.createElement('main');root.id=rootId;document.getElementById('app').after(root)}
    root.hidden=!active;if(!active)return;
    root.innerHTML=`<div class="page-head"><h2>สรุป KPI การผลิตรายเดือน / Section</h2></div><div class="kpi-section-controls"><label>เดือน<input type="month" id="sectionKpiMonth" value="${month}"></label><label>Section<select id="sectionKpiFilter"><option value="">ทุก Section</option></select></label><button type="button" id="sectionKpiRefresh">อัปเดตข้อมูล</button><button type="button" class="secondary" id="sectionKpiCsv">ดาวน์โหลด CSV</button></div><p class="kpi-summary-note">นับวันละ 1 วัน เมื่อมีสแกนนิ้วและทุกเครื่องที่ทำในวันนั้นถึงเกณฑ์ · วันที่รอตรวจยังไม่นับเป็นวันผ่าน</p><div id="sectionKpiStatus" role="status"></div><div id="sectionKpiResults"></div>`;
    root.querySelector('#sectionKpiMonth').onchange=e=>{month=e.target.value;data=null;error='';void load()};
    root.querySelector('#sectionKpiFilter').onchange=e=>{section=e.target.value;renderResults()};
    root.querySelector('#sectionKpiRefresh').onclick=()=>void load();
    root.querySelector('#sectionKpiCsv').onclick=exportCsv;
    renderResults();
  }
  function renderResults(){
    if(!active)return;
    const root=document.getElementById(rootId);if(!root)return;
    const roster=employees(), sections=[...new Set(roster.map(e=>e.section))].sort((a,b)=>a.localeCompare(b,'th'));
    if(section&&!sections.includes(section))section='';
    const filter=root.querySelector('#sectionKpiFilter');
    const options='<option value="">ทุก Section</option>'+sections.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    if(filter.innerHTML!==options)filter.innerHTML=options;filter.value=section;
    results=summarize(roster,data,read('ppms_v3_attendance',[]),month,!!data&&data.online!==false&&!error&&!loading);
    root.querySelector('#sectionKpiRefresh').disabled=loading;
    root.querySelector('#sectionKpiCsv').disabled=!data||loading||!!error;
    root.querySelector('#sectionKpiStatus').textContent=loading?'กำลังดึง KPI ล่าสุด...':error?error+' · ยังไม่นับข้อมูลนี้เป็นวันผ่าน':data?`เดือน ${month} · ${roster.length} คน${data.asOf?' · ข้อมูล OEE '+data.asOf:''}`:'กรุณาเลือกเดือน';
    const container=root.querySelector('#sectionKpiResults');
    if(!data){container.textContent=loading?'กำลังเตรียมสรุป...':'ยังไม่มีข้อมูลสรุป';return;}
    const shown=results.filter(e=>!section||e.section===section);
    container.innerHTML=sections.filter(s=>!section||s===section).map(s=>{
      const rows=shown.filter(e=>e.section===s).sort((a,b)=>a.name.localeCompare(b.name,'th')||a.code.localeCompare(b.code));
      return `<section class="panel"><div class="kpi-section-head"><h3>${esc(s)}</h3><span>${rows.length} คน · วันถึงเกณฑ์รวม ${rows.reduce((sum,e)=>sum+e.passed,0)} คน-วัน</span></div><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อพนักงาน</th><th>ถึงเกณฑ์ (วัน)</th><th>ไม่ถึงเกณฑ์ (วัน)</th><th>รอตรวจ (วัน)</th><th>วันที่ถึงเกณฑ์ / รายละเอียด</th></tr></thead><tbody>${rows.map(e=>`<tr><td>${esc(e.code)}</td><td>${esc(e.name)}</td><td class="kpi-pass">${e.passed}</td><td>${e.failed}</td><td class="kpi-pending">${e.waiting}</td><td>${e.days.length?`<details class="kpi-section-detail"><summary>${e.days.filter(d=>d.status==='ถึงเกณฑ์').map(d=>d.date.slice(-2)).join(', ')||'ยังไม่มีวันถึงเกณฑ์'} · ดูรายวัน</summary>${e.days.map(d=>`<div><b>${esc(d.date)} · ${d.status}</b>${!d.scan?' · ยังไม่พบสแกนนิ้ววันเดียวกัน':''}<br>${d.rows.map(r=>`${esc(r.machine)} · ${Number.isFinite(r.rate)?Number(r.rate).toLocaleString('th-TH',{maximumFractionDigits:1})+'%':'—'} · ${esc(r.status)}`).join('<br>')}</div>`).join('')}</details>`:'ยังไม่มีรายการผลิตที่เชื่อมในเดือนนี้'}</td></tr>`).join('')}</tbody></table></div></section>`;
    }).join('')||'<p>ยังไม่มีพนักงานใน Section นี้</p>';
  }
  async function load(){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){error='กรุณาเลือกเดือน';renderResults();return;}
    const token=++requestNumber,requestedMonth=month;loading=true;error='';renderResults();
    try{
      const roster=employees(), histories=[];let cursor=0,complete=0,online=true,asOf='',failed=0;
      await Promise.all(Array.from({length:Math.min(6,roster.length)},async()=>{
        while(cursor<roster.length){
          const employee=roster[cursor++];if(token!==requestNumber)return;
          try{
            const response=await fetch(endpoint+'?code='+encodeURIComponent(employee.code),{cache:'no-store',signal:AbortSignal.timeout(60000)});
            const payload=await response.json();if(!response.ok||!Array.isArray(payload.history))throw Error('โหลด KPI ไม่สำเร็จ');
            histories.push({employeeCode:employee.code,history:payload.history});if(payload.online===false)online=false;
            if(payload.asOf&&payload.asOf>asOf)asOf=payload.asOf;
          }catch{failed++;online=false;}
          complete++;
          if(active&&token===requestNumber){const status=document.getElementById('sectionKpiStatus');if(status)status.textContent='กำลังดึง KPI ล่าสุด '+complete+' / '+roster.length+' คน';}
        }
      }));
      const payload={month:requestedMonth,histories,online,asOf};
      if(failed&&token===requestNumber)error='เชื่อม KPI ไม่สำเร็จ '+failed+' คน กรุณากดอัปเดตข้อมูลอีกครั้ง';
      if(token===requestNumber)data=payload;
    }catch(e){if(token===requestNumber)error=e.message||'เชื่อม KPI ไม่สำเร็จ';}
    finally{if(token===requestNumber){loading=false;renderResults();}}
  }
  function exportCsv(){
    if(!data||error||loading)return;
    const cell=value=>'"'+String(value??'').replace(/"/g,'""').replace(/^[=+@-]/,"'$&")+'"';
    const rows=[['เดือน','Section','รหัสพนักงาน','ชื่อพนักงาน','ถึงเกณฑ์ (วัน)','ไม่ถึงเกณฑ์ (วัน)','รอตรวจ (วัน)','วันที่ถึงเกณฑ์'],...results.filter(e=>!section||e.section===section).map(e=>[month,e.section,e.code,e.name,e.passed,e.failed,e.waiting,e.days.filter(d=>d.status==='ถึงเกณฑ์').map(d=>d.date).join(', ')])];
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Production_KPI_'+month+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function addButton(){
    const nav=document.getElementById('nav');
    if(!nav?.querySelector('[data-page="attendanceAdmin"]')){
      if(active){active=false;document.body.classList.remove('section-production-kpi-view');document.getElementById(rootId)?.setAttribute('hidden','')}
      return;
    }
    if(!nav.querySelector(`[data-page="${page}"]`)){
      const button=document.createElement('button');button.type='button';button.dataset.page=page;button.textContent='สรุป KPI รายเดือน / Section';
      nav.querySelector('[data-page="attendanceAdmin"]').after(button);
    }
    if(active){nav.querySelectorAll('button.active').forEach(b=>{if(b.dataset.page!==page)b.classList.remove('active')});nav.querySelector(`[data-page="${page}"]`).classList.add('active')}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#nav button[data-page]');if(!button)return;
    if(button.dataset.page===page){
      event.preventDefault();event.stopImmediatePropagation();active=true;
      document.body.classList.remove('org-clean-view');document.body.classList.add('section-production-kpi-view');addButton();shell();void load();
    }else{active=false;document.body.classList.remove('section-production-kpi-view');document.getElementById(rootId)?.setAttribute('hidden','')}
  },true);
  const nav=document.getElementById('nav');if(nav)new MutationObserver(addButton).observe(nav,{childList:true});
  window.addEventListener('storage',()=>{if(active)renderResults()});
  setInterval(()=>{if(active&&!loading)renderResults()},15000);
  addButton();
})();
