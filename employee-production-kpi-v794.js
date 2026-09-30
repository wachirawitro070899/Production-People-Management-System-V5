/* Live production KPI in the existing employee detail card. */
(() => {
  'use strict';
  const endpoint = 'https://machine-part-kpi.jinrong-tl-1709.chatgpt.site/api/employee-skill-history';
  const cache = new Map(), pending = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => Number(value || 0).toLocaleString('th-TH', {maximumFractionDigits:1});
  const original = typeof employeeAttendanceHistoryPanel === 'function' ? employeeAttendanceHistoryPanel : null;
  if (!original) return;
  employeeAttendanceHistoryPanel = function(employee) {
    return original(employee) + `<section class="panel employee-production-kpi" data-production-employee="${escape(employee.id)}" style="margin:12px 0"><h3>KPI การผลิต · OEE / Capacity</h3><p class="modal-note">ผลผลิตจากเครื่องที่สแกน และเป้า KPI รายคนที่ตั้งไว้</p><div data-production-content role="status">กำลังดึง KPI การผลิต...</div></section>`;
  };
  function display(panel, data, error) {
    const content = panel.querySelector('[data-production-content]');
    if (!content) return;
    if (!data) { content.textContent = error || 'กำลังดึง KPI การผลิต...'; return; }
    const history = Array.isArray(data.history) ? data.history : [];
    const target = data.employee?.targetPercent ?? 85;
    const latest = history[0];
    const note = error ? `<p class="modal-note">${escape(error)} · แสดงข้อมูลล่าสุดที่อ่านได้</p>` : data.online ? '' : '<p class="modal-note">ยังตรวจข้อมูล OEE / Cap ล่าสุดไม่ได้ · รอสรุป KPI</p>';
    const summary = `<div class="cards" style="margin:10px 0"><div class="card metric">เป้า KPI การผลิต<b>${number(target)}%</b></div><div class="card metric">ผลล่าสุด<b>${latest?.rate == null ? '—' : number(latest.rate)+'%'}</b><small>${escape(latest?.status || 'รอการสแกนเครื่อง')}</small></div><div class="card metric">ผลผลิตดีล่าสุด<b>${latest ? number(latest.good)+' ชิ้น' : '—'}</b><small>${escape(latest?.workDate || '')} ${escape(latest?.shift || '')}</small></div></div>`;
    const rows = history.map(row => `<tr><td>${escape(row.workDate)}<small style="display:block">${escape(row.shift)}</small></td><td><b>${escape(row.machine)}</b><small style="display:block">${escape((row.parts || []).join(', '))}</small></td><td>${number(row.good)} ชิ้น${row.pendingGood > 0 ? `<small style="display:block">รอตรวจ ${number(row.pendingGood)} ชิ้น</small>` : ''}</td><td>${row.rate == null ? '—' : number(row.rate)+'%'}</td><td>${number(row.targetPercent ?? target)}%</td><td><b style="color:${row.passed ? '#16734a' : '#995200'}">${escape(row.status)}</b>${row.pendingParts?.length ? `<small style="display:block">${escape(row.pendingParts.join(', '))}</small>` : ''}</td></tr>`).join('');
    content.innerHTML = note + summary + `<div class="table-wrap" style="max-height:360px;overflow:auto"><table><thead><tr><th>วันที่ / กะ</th><th>เครื่อง / Part</th><th>ผลผลิต OEE</th><th>ทำได้เทียบ Cap</th><th>เป้า KPI</th><th>ผล KPI</th></tr></thead><tbody>${rows || '<tr><td colspan="6">ยังไม่มีประวัติสแกนเครื่องของพนักงานคนนี้</td></tr>'}</tbody></table></div>` + (data.asOf ? `<p class="modal-note">ข้อมูล OEE ${escape(new Date(data.asOf).toLocaleString('th-TH', {timeZone:'Asia/Bangkok'}))} · อัปเดตอัตโนมัติขณะเปิดหน้านี้</p>` : '');
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
    for (const panel of document.querySelectorAll('[data-production-employee]')) {
      const code = panel.dataset.productionEmployee;
      if (!code) continue;
      const saved = cache.get(code);
      if (saved && panel.dataset.productionAt !== String(saved.at)) {
        display(panel, saved.data); panel.dataset.productionAt = String(saved.at);
      }
      if (saved && Date.now()-saved.at < 15000 || pending.has(code)) continue;
      void read(code).then(data => {
        if (panel.isConnected) { display(panel, data); panel.dataset.productionAt = String(cache.get(code).at); }
      }).catch(error => {
        cache.set(code, {data:saved?.data, at:Date.now()});
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
