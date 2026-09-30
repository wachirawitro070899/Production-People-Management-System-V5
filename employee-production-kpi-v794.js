/* Date-linked production KPI and monthly qualifying days. */
(() => {
  'use strict';
  const endpoint = 'https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
  const cache = new Map(), pending = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => Number(value || 0).toLocaleString('th-TH', {maximumFractionDigits:1});
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const confirmed = row => Number.isFinite(row.rate) && ['ถึงเกณฑ์','ต่ำกว่าเกณฑ์','ไม่ถึงเกณฑ์'].includes(row.status);
  const status = row => !confirmed(row) ? 'รอตรวจ' : row.passed ? 'ถึงเกณฑ์' : 'ไม่ถึงเกณฑ์';
  function unique(history) {
    const rows = new Map();
    for (const row of history || []) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.workDate || '') || row.workDate > today()) continue;
      const key = row.workDate+'|'+row.shift+'|'+row.machine;
      if (!rows.has(key)) rows.set(key,row);
    }
    return [...rows.values()];
  }
  function attendanceDates(panel) {
    const dates = new Set(), normalize = value => String(value ?? '').normalize('NFKC').trim().toLowerCase();
    try {
      const records = JSON.parse(localStorage.getItem('ppms_v3_attendance') || 'null');
      if (Array.isArray(records)) for (const row of records) {
        if (normalize(row.employeeId) === normalize(panel.dataset.productionEmployee) && row.checkIn) dates.add(String(row.date));
      }
    } catch {}
    // The currently displayed reconciled Attendance rows take precedence.
    for (const row of panel.querySelector('table').querySelectorAll('tbody tr')) {
      const date = row.cells[0]?.textContent?.trim(), checkIn = row.cells[1]?.textContent?.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
        if (/\d{1,2}:\d{2}/.test(checkIn || '')) dates.add(date); else dates.delete(date);
      }
    }
    return dates;
  }
  function daily(rows, checkedIn, online) {
    if (!online || !checkedIn || rows.some(row => !confirmed(row))) return 'รอตรวจ';
    return rows.length && rows.every(row => row.passed) ? 'ถึงเกณฑ์' : 'ไม่ถึงเกณฑ์';
  }
  function resultMarkup(row) {
    const label = status(row);
    return `<div style="margin:3px 0 6px"><b>${escape(row.machine)}</b> · <b>${Number.isFinite(row.rate) ? number(row.rate)+'%' : '—'}</b> · <span style="color:${label === 'ถึงเกณฑ์' ? '#16734a' : label === 'รอตรวจ' ? '#775f24' : '#a12c2c'}">${label}</span></div>`;
  }
  function prepare() {
    const code = document.querySelector('#employeeForm input[name="id"]')?.value?.trim();
    if (!code) return;
    for (const panel of document.querySelectorAll('.employee-attendance-history')) {
      panel.dataset.productionEmployee ||= code;
      const table = panel.querySelector('table'), header = table?.querySelector('thead tr');
      if (!header) continue;
      if (!header.querySelector('[data-production-heading]')) {
        const th = document.createElement('th');
        th.dataset.productionHeading = 'true'; th.textContent = 'KPI การผลิต';
        th.style.minWidth = '200px'; header.append(th);
      }
      for (const row of table.querySelectorAll('tbody tr')) {
        if (row.querySelector('[data-production-date]')) continue;
        const date = row.cells[0]?.textContent?.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
          if (row.cells.length === 1) row.cells[0].colSpan = 6;
          continue;
        }
        const cell = row.insertCell();
        cell.dataset.productionDate = date; delete panel.dataset.productionAt;
        cell.textContent = 'กำลังดึง KPI...'; cell.style.minWidth = '200px';
      }
      if (!panel.querySelector('[data-production-monthly]')) {
        const section = document.createElement('section');
        section.dataset.productionMonthly = 'true'; section.style.marginTop = '16px';
        section.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3 style="margin:0">สรุป KPI การผลิตรายเดือน</h3><label>เดือน <input type="month" data-production-month value="${today().slice(0,7)}" aria-label="เดือนสรุป KPI การผลิต"></label></div><p class="modal-note">นับวันละ 1 วัน เมื่อมีสแกนนิ้วและทุกเครื่องถึงเกณฑ์ · วันที่รอตรวจยังไม่นับเป็นวันผ่าน</p><div data-production-month-results>กำลังดึงข้อมูล...</div>`;
        section.querySelector('[data-production-month]').addEventListener('change', () => {
          const saved = cache.get(panel.dataset.productionEmployee);
          renderMonth(panel,saved?.data,saved?.error);
        });
        panel.append(section); delete panel.dataset.productionAt;
      }
    }
  }
  function renderMonth(panel,data,error) {
    const content = panel.querySelector('[data-production-month-results]');
    if (!content) return;
    if (!data) { content.textContent = error || 'กำลังดึงข้อมูล...'; return; }
    const month = panel.querySelector('[data-production-month]').value;
    if (!/^\d{4}-\d{2}$/.test(month)) {content.textContent = 'กรุณาเลือกเดือน';return;}
    const byDate = new Map(), attendance = attendanceDates(panel);
    for (const row of unique(data.history).filter(row=>row.workDate.startsWith(month+'-'))) {
      byDate.set(row.workDate,[...(byDate.get(row.workDate)||[]),row]);
    }
    const days = [...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>({date,rows,checkedIn:attendance.has(date),status:daily(rows,attendance.has(date),data.online !== false && !error)}));
    const passed = days.filter(day=>day.status === 'ถึงเกณฑ์'), failed = days.filter(day=>day.status === 'ไม่ถึงเกณฑ์'), waiting = days.filter(day=>day.status === 'รอตรวจ');
    content.innerHTML = `<div class="cards" style="margin:10px 0"><div class="card metric">วันถึงเกณฑ์ KPI<b style="color:#16734a">${passed.length} วัน</b></div><div class="card metric">วันไม่ถึงเกณฑ์<b>${failed.length} วัน</b></div><div class="card metric">วันรอตรวจ<b>${waiting.length} วัน</b></div></div><p><b>วันที่ถึงเกณฑ์:</b> ${passed.length ? passed.map(day=>escape(day.date)).join(', ') : '—'}</p><div class="table-wrap"><table><thead><tr><th>วันที่ผลิต</th><th>เครื่อง · ทำได้ · ผล KPI</th><th>ผลรายวัน</th></tr></thead><tbody>${days.map(day=>`<tr><td>${escape(day.date)}</td><td>${day.rows.map(resultMarkup).join('')}</td><td><b>${day.status}</b>${!day.checkedIn ? '<small style="display:block">ยังไม่พบสแกนนิ้ววันเดียวกัน</small>' : ''}</td></tr>`).join('') || '<tr><td colspan="3">ยังไม่มีรายการผลิตที่เชื่อมกับพนักงานในเดือนนี้</td></tr>'}</tbody></table></div>${error ? `<p class="modal-note">${escape(error)} · รอตรวจข้อมูลล่าสุดก่อนนับวันผ่าน</p>` : ''}`;
  }
  function display(panel,data,error) {
    const history = unique(data?.history);
    for (const cell of panel.querySelectorAll('[data-production-date]')) {
      if (!data) { cell.textContent = error || 'กำลังดึง KPI...'; continue; }
      const rows = history.filter(row=>row.workDate === cell.dataset.productionDate);
      if (!rows.length) { cell.textContent = error ? 'ยังเชื่อม KPI ไม่ได้' : '—'; continue; }
      cell.innerHTML = rows.map(resultMarkup).join('');
    }
    renderMonth(panel,data,error);
  }
  async function read(code) {
    if (pending.has(code)) return pending.get(code);
    const request = (async () => {
      const response = await fetch(endpoint+'?code='+encodeURIComponent(code), {cache:'no-store',signal:AbortSignal.timeout(60000)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ยังเชื่อม KPI การผลิตไม่ได้');
      cache.set(code,{data,at:Date.now()}); return data;
    })().finally(()=>pending.delete(code));
    pending.set(code,request); return request;
  }
  function update() {
    if (document.visibilityState !== 'visible') return;
    prepare();
    for (const panel of document.querySelectorAll('.employee-attendance-history[data-production-employee]')) {
      const code = panel.dataset.productionEmployee, saved = cache.get(code);
      if (saved && panel.dataset.productionAt !== String(saved.at)) {
        display(panel,saved.data,saved.error); panel.dataset.productionAt = String(saved.at);
      }
      if ((saved && Date.now()-saved.at < 15000) || pending.has(code)) continue;
      void read(code).then(data=>{
        if (panel.isConnected) {display(panel,data);panel.dataset.productionAt = String(cache.get(code).at);}
      }).catch(error=>{
        cache.set(code,{data:saved?.data,error:error.message,at:Date.now()});
        if (panel.isConnected) {display(panel,saved?.data,error.message);panel.dataset.productionAt = String(cache.get(code).at);}
      });
    }
  }
  let queued = false;
  new MutationObserver(()=>{
    if (queued) return; queued = true;
    queueMicrotask(()=>{queued = false;update();});
  }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',update);
  setInterval(update,15000);update();
})();
