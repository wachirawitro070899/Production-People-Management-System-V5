/* Live production KPI beside documents in the employee Attendance history. */
(() => {
  'use strict';
  const endpoint = 'https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
  const cache = new Map(), pending = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => Number(value || 0).toLocaleString('th-TH', {maximumFractionDigits:1});
  function prepare() {
    // The PPMS renderer is scoped inside its app; attach to its actual detail table.
    const code = document.querySelector('#employeeForm input[name="id"]')?.value?.trim();
    if (!code) return;
    for (const panel of document.querySelectorAll('.employee-attendance-history')) {
      if (!panel.dataset.productionEmployee) panel.dataset.productionEmployee = code;
      const table = panel.querySelector('table');
      const header = table?.querySelector('thead tr');
      if (!header) continue;
      if (!header.querySelector('[data-production-heading]')) {
        const th = document.createElement('th');
        th.dataset.productionHeading = 'true'; th.textContent = 'KPI การผลิต';
        th.style.minWidth = '220px'; header.append(th);
      }
      for (const row of table.querySelectorAll('tbody tr')) {
        if (row.querySelector('[data-production-date]')) continue;
        const date = row.cells[0]?.textContent?.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
          if (row.cells.length === 1) row.cells[0].colSpan = 6;
          continue;
        }
        const cell = row.insertCell();
        cell.dataset.productionDate = date;
        delete panel.dataset.productionAt;
        cell.textContent = 'กำลังดึง KPI...';
        cell.style.minWidth = '220px';
      }
    }
  }
  function display(panel, data, error) {
    const history = Array.isArray(data?.history) ? data.history : [];
    for (const cell of panel.querySelectorAll('[data-production-date]')) {
      if (!data) { cell.textContent = error || 'กำลังดึง KPI...'; continue; }
      const seen = new Set();
      const rows = history.filter(row => {
        if (row.workDate !== cell.dataset.productionDate) return false;
        const key = row.workDate+'|'+row.shift+'|'+row.machine;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      if (!rows.length) { cell.textContent = error ? 'ยังเชื่อม KPI ไม่ได้' : '—'; cell.title = error || 'ยังไม่มีการสแกนเครื่องในวันที่ตรงกับแถว Attendance นี้'; continue; }
      cell.title = '';
      cell.innerHTML = rows.map(row => `<div style="margin:4px 0 8px"><b>${escape(row.machine)}</b> · ${escape(row.shift)}<small style="display:block">${escape((row.parts || []).join(', '))}</small><div>ผลิตดี ${number(row.good)} ชิ้น</div><div>ทำได้ <b>${row.rate == null ? '—' : number(row.rate)+'%'}</b> · เป้า ${number(row.targetPercent ?? data.employee?.targetPercent ?? 85)}%</div><b style="color:${row.passed ? '#16734a' : '#995200'}">${escape(row.status)}</b>${row.pendingParts?.length ? `<small style="display:block">${escape(row.pendingParts.join(', '))}</small>` : ''}</div>`).join('') + (error ? `<small>${escape(error)} · ข้อมูลล่าสุดที่อ่านได้</small>` : '');
    }
  }
  async function read(code) {
    if (pending.has(code)) return pending.get(code);
    const request = (async () => {
      const response = await fetch(endpoint+'?code='+encodeURIComponent(code), {cache:'no-store', signal:AbortSignal.timeout(60000)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ยังเชื่อม KPI การผลิตไม่ได้');
      cache.set(code, {data, at:Date.now()});
      return data;
    })().finally(() => pending.delete(code));
    pending.set(code, request);
    return request;
  }
  function update() {
    if (document.visibilityState !== 'visible') return;
    prepare();
    for (const panel of document.querySelectorAll('.employee-attendance-history[data-production-employee]')) {
      const code = panel.dataset.productionEmployee;
      const saved = cache.get(code);
      if (saved && panel.dataset.productionAt !== String(saved.at)) {
        display(panel, saved.data, saved.error); panel.dataset.productionAt = String(saved.at);
      }
      if ((saved && Date.now()-saved.at < 15000) || pending.has(code)) continue;
      void read(code).then(data => {
        if (panel.isConnected) { display(panel, data); panel.dataset.productionAt = String(cache.get(code).at); }
      }).catch(error => {
        cache.set(code, {data:saved?.data, error:error.message, at:Date.now()});
        if (panel.isConnected) { display(panel, saved?.data, error.message); panel.dataset.productionAt = String(cache.get(code).at); }
      });
    }
  }
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; update(); });
  }).observe(document.body, {childList:true, subtree:true});
  document.addEventListener('visibilitychange', update);
  setInterval(update, 15000);
  update();
})();
