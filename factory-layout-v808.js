/* Factory floor map: independent cloud document; never rewrites employee master. */
(() => {
  'use strict';
  const PATH = 'ppmsFactoryLayout/v1', CACHE = 'ppms_factory_layout_v1';
  const PREVIEW = 'data:image/png;base64,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';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => 'm_' + (crypto.randomUUID?.() || Date.now() + '_' + Math.random().toString(36).slice(2));
  const employeeKey = id => 'e_' + Array.from(String(id)).map(c => c.codePointAt(0).toString(16)).join('_');
  const colors = {manager:'#174f82',engineer:'#2563eb',supervisor:'#7c3aed',leader:'#ea580c',technician:'#0891b2',operator:'#16a34a',other:'#64748b'};
  const rank = e => Object.keys(colors).find(k => k !== 'other' && String(e.position || '').toLowerCase().includes(k)) || 'other';
  const positioned = m => Number.isFinite(m.x) && Number.isFinite(m.y) && m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100;
  function normalize(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    return {...d, machines:d.machines && typeof d.machines === 'object' ? d.machines : {}, image:d.image || null};
  }
  let data = normalize(null), ready = false, busy = false, root = null, subscription = null, rosterTimer = null;
  let remotePending = false;
  const editingControl = () => root?.contains(document.activeElement) && document.activeElement?.matches('input,select,textarea');
  let selected = '', placing = false, zoom = 1, section = '', query = '', rosterSignature = '', statusText = '';
  function roster() { return window.PPMS_RUNTIME?.factoryLayoutEmployees?.() || []; }
  function admin() { return window.PPMS_RUNTIME?.factoryLayoutIsAdmin?.() === true; }
  function base() {
    const url = String(window.PPMS_FIREBASE_CONFIG?.databaseURL || '').replace(/\/$/, '');
    if (!url) throw Error('ไม่พบการตั้งค่าฐานข้อมูล');
    return url;
  }
  async function request(options = {}) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try {
      const r = await fetch(base() + '/' + PATH + '.json', {...options, signal:controller.signal, cache:'no-store'});
      if (!r.ok && r.status !== 412) throw Error(r.status === 401 || r.status === 403 ? 'ฐานข้อมูลไม่อนุญาตให้เปิดหรือบันทึก Layout' : 'เชื่อมต่อ Layout ไม่สำเร็จ (' + r.status + ')');
      return r;
    } catch (e) { if (e.name === 'AbortError') throw Error('เชื่อมต่อ Layout หมดเวลา กรุณาลองอีกครั้ง'); throw e; }
    finally { clearTimeout(timer); }
  }
  function remember() { try { localStorage.setItem(CACHE, JSON.stringify(data)); } catch (_) {} }
  function note(text) { statusText = text; const e = root?.querySelector('[data-layout-status]'); if (e) e.textContent = text; }
  async function save(update, success = 'บันทึกสำเร็จ · ข้อมูลกลางอัปเดตแล้ว') {
    if (busy) return false;
    if (!admin()) { note('กรุณาเข้าสู่ระบบ Admin'); return false; }
    if (!ready) { note('ต้องเชื่อมต่อข้อมูลล่าสุดก่อนบันทึก'); return false; }
    busy = true; controls(); note('กำลังบันทึก...');
    try {
      let confirmed = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (!admin()) throw Error('สิทธิ์ Admin หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
        const read = await request({headers:{'X-Firebase-ETag':'true'}}), etag = read.headers.get('etag');
        if (!etag) throw Error('ฐานข้อมูลไม่ส่งเวอร์ชันยืนยัน กรุณาลองอีกครั้ง');
        const next = normalize(await read.json());
        update(next);
        next.updatedAt = new Date().toISOString();
        next.updatedBy = sessionStorage.getItem('ppms_admin_user') || 'admin';
        const write = await request({method:'PUT', headers:{'Content-Type':'application/json','if-match':etag}, body:JSON.stringify(next)});
        if (write.status === 412) continue;
        data = normalize(await write.json()); remember(); confirmed = true; break;
      }
      if (!confirmed) throw Error('มีการแก้ไขพร้อมกัน กรุณาลองบันทึกอีกครั้ง');
      note(success); return true;
    } catch (e) { note('ยังไม่บันทึก: ' + e.message); return false; }
    finally { busy = false; refresh(); }
  }
  function entries() { return Object.entries(data.machines).filter(([,m]) => m && typeof m === 'object').map(([id,m]) => ({...m,id})); }
  function assigned(m) { const ids = new Set(Object.values(m.assignments || {}).map(a => String(a?.employeeId || ''))); return roster().filter(e => ids.has(String(e.id))); }
  function match(m) {
    if (section && m.section !== section) return false;
    const people = assigned(m);
    return !query || [m.name,m.section,...people.flatMap(e => [e.id,e.name,e.position])].join(' ').toLowerCase().includes(query.toLowerCase());
  }
  function person(e, removable = false) {
    return `<div class="fl-person" style="--person-color:${colors[rank(e)]}"><div><b>${esc(e.name)}</b><small>${esc(e.id)} · ${esc(e.position)} · ${esc(e.section)}</small></div>${removable ? `<button type="button" data-fl-remove="${esc(e.id)}" class="secondary" aria-label="ยกเลิก ${esc(e.name)} ประจำเครื่อง">ยกเลิก</button>` : ''}</div>`;
  }
  function controls() {
    root?.querySelectorAll('[data-fl-write], [data-fl-remove], #flAddMachine, #flAssign, #flUpload').forEach(e => { e.disabled = busy || !ready || !admin(); });
  }
  function refresh() {
    if (!root?.isConnected) return;
    const all = entries(), list = all.filter(match), m = data.machines[selected];
    const img = root.querySelector('#flImage'), src = data.image?.src || PREVIEW;
    if (img.getAttribute('src') !== src) img.src = src;
    root.querySelector('#flCanvas').style.width = (zoom * 100) + '%';
    root.querySelector('#flZoomLabel').textContent = Math.round(zoom * 100) + '%';
    root.querySelector('#flImageNote').textContent = data.image ? (data.image.name || 'ผังโรงงาน') : 'ภาพตัวอย่างจาก General layout_A0_V5 · 256 × 101 px · กรุณาเปลี่ยนเป็นภาพผังชัดเจนก่อนวางตำแหน่งจริง';
    const placed = list.filter(positioned);
    root.querySelector('#flPins').innerHTML = placed.map(x => {
      const people = assigned(x), color = people.length ? colors[rank(people[0])] : '#64748b';
      return `<button class="fl-pin ${x.id === selected ? 'selected' : ''}" style="left:${x.x}%;top:${x.y}%;--pin-color:${color}" data-fl-select="${esc(x.id)}" title="${esc(x.name)} · ${people.map(e => esc(e.name)).join(', ') || 'ยังไม่มีพนักงาน'}"><b>${esc(x.name)}</b><small>${people.length ? people.map(e => esc(e.name)).join(' / ') : 'ยังไม่มีพนักงาน'}</small></button>`;
    }).join('');
    root.querySelector('#flMachineList').innerHTML = list.map(x => `<button type="button" class="fl-machine ${x.id === selected ? 'selected' : ''}" data-fl-select="${esc(x.id)}"><b>${esc(x.name)}</b><small>${esc(x.section)} · ${positioned(x) ? 'วางบนผังแล้ว' : 'ยังไม่วางตำแหน่ง'} · ${assigned(x).length} คน</small></button>`).join('') || '<p class="fl-empty">ไม่พบเครื่องจักร · เพิ่มเครื่องจักรหรือเปลี่ยนตัวกรอง</p>';
    root.querySelector('#flCounts').textContent = `${all.length} เครื่อง/จุดงาน · วางบนผัง ${all.filter(positioned).length} จุด · แสดง ${list.length} จุด`;
    root.querySelector('#flDetail').innerHTML = m ? `<h3>${esc(m.name)}</h3><p>${esc(m.section || 'ไม่ระบุ Section')}</p><div class="fl-actions"><button data-fl-write data-fl-place>${placing ? 'ยกเลิกวางตำแหน่ง' : positioned(m) ? 'ย้ายจุดบนผัง' : 'วางจุดบนผัง'}</button><button class="secondary" data-fl-write data-fl-edit>แก้ไขชื่อ/Section</button><button class="secondary" data-fl-write data-fl-delete>ลบเครื่อง/จุดงาน</button></div>${placing ? '<p class="fl-hint">กดตำแหน่งจริงบนผังเพื่อบันทึกจุดเครื่อง</p>' : ''}<h4>พนักงานประจำเครื่อง/จุดงาน</h4>${assigned(m).map(e => person(e,true)).join('') || '<p class="fl-empty">ยังไม่ได้กำหนดพนักงาน</p>'}<form id="flAssign"><label>ค้นหาชื่อหรือรหัสพนักงาน<input id="flEmployeeSearch" placeholder="พิมพ์ชื่อหรือรหัสพนักงาน" autocomplete="off"></label><label>เลือกพนักงาน<select id="flEmployee" required></select></label><button type="submit" data-fl-write>เพิ่มพนักงานประจำเครื่อง</button><p class="fl-muted">กำหนดเป็นผู้รับผิดชอบประจำจุด · พนักงานหนึ่งคนดูแลได้หลายเครื่อง</p></form>` : '<h3>รายละเอียดเครื่องจักร</h3><p class="fl-empty">เลือกเครื่องจากผังหรือรายการด้านซ้าย เพื่อดูและกำหนดพนักงาน</p>';
    fillEmployeeOptions();
    root.querySelector('#flAssign')?.addEventListener('submit', assign);
    root.querySelector('#flEmployeeSearch')?.addEventListener('input', fillEmployeeOptions);
    root.querySelector('#flCanvas').classList.toggle('placing', placing);
    const assignedIds = new Set(all.flatMap(x => Object.values(x.assignments || {}).map(a => String(a?.employeeId || ''))));
    root.querySelector('#flUnassigned').innerHTML = roster().filter(e => (!section || e.section === section) && (!query || [e.name,e.id].join(' ').toLowerCase().includes(query.toLowerCase())) && !assignedIds.has(String(e.id))).map(e => person(e)).join('') || '<p class="fl-empty">ไม่มีพนักงานที่ยังไม่กำหนดจุดตามตัวกรองนี้</p>';
    const select = root.querySelector('#flSection'), value = section;
    const sections = [...new Set([...roster().map(e => e.section),...all.map(x => x.section)].filter(Boolean))].sort();
    select.innerHTML = '<option value="">ทุก Section</option>' + sections.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join(''); select.value = value;
    note(statusText); controls();
  }
  function fillEmployeeOptions() {
    const select = root?.querySelector('#flEmployee'); if (!select) return;
    const q = root.querySelector('#flEmployeeSearch').value.toLowerCase(), m = data.machines[selected];
    const ids = new Set(Object.values(m?.assignments || {}).map(a => String(a?.employeeId || '')));
    select.innerHTML = '<option value="">— เลือกพนักงาน —</option>' + roster().filter(e => !ids.has(String(e.id)) && (!m?.section || e.section === m.section) && [e.name,e.id].join(' ').toLowerCase().includes(q)).map(e => `<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.name)} · ${esc(e.position)}</option>`).join('');
  }
  async function assign(event) {
    event.preventDefault(); const id = root.querySelector('#flEmployee').value, machine = selected;
    if (!id || !roster().some(e => String(e.id) === id)) return note('กรุณาเลือกพนักงานจากรายชื่อ PPMS');
    await save(d => { const m = d.machines[machine]; if (!m) throw Error('เครื่องนี้ถูกลบแล้ว'); const e = roster().find(e => String(e.id) === id); if (!e || (m.section && e.section !== m.section)) throw Error('Section พนักงานไม่ตรงกับเครื่อง'); m.assignments ||= {}; m.assignments[employeeKey(id)] = {employeeId:id,assignedAt:new Date().toISOString()}; });
  }
  function editMachine(id = '') {
    if (!admin() || busy || !ready) return;
    const old = data.machines[id] || {}, dlg = document.createElement('dialog'); dlg.className = 'fl-dialog';
    const sections = [...new Set(roster().map(e => e.section).filter(Boolean))].sort();
    dlg.innerHTML = `<form><h3>${id ? 'แก้ไขเครื่อง/จุดงาน' : 'เพิ่มเครื่อง/จุดงาน'}</h3><label>ชื่อ/หมายเลขเครื่อง<input name="machineName" maxlength="80" value="${esc(old.name || '')}" required></label><label>Section<input name="machineSection" list="flSections" maxlength="100" value="${esc(old.section || section)}" required></label><datalist id="flSections">${sections.map(s => `<option value="${esc(s)}">`).join('')}</datalist><div class="fl-actions"><button type="submit">บันทึก</button><button type="button" data-fl-cancel class="secondary">ยกเลิก</button></div><p role="status"></p></form>`;
    document.body.append(dlg); dlg.showModal();
    dlg.querySelector('[data-fl-cancel]').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove();
    dlg.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const fd = new FormData(event.target), name = String(fd.get('machineName') || '').trim(), sec = String(fd.get('machineSection') || '').trim();
      if (!name || !sec) return;
      const mid = id || uid(), buttons = dlg.querySelectorAll('button'); buttons.forEach(b => b.disabled = true);
      const ok = await save(d => {
        if (id && !d.machines[id]) throw Error('เครื่องนี้ถูกลบแล้ว');
        if (Object.entries(d.machines).some(([k,m]) => k !== mid && m.name?.toLowerCase() === name.toLowerCase() && m.section === sec)) throw Error('ชื่อเครื่องนี้มีอยู่แล้วใน Section');
        const prior = d.machines[mid] || {};
        if (prior.section && prior.section !== sec && Object.keys(prior.assignments || {}).length) throw Error('ยกเลิกพนักงานประจำเครื่องก่อนเปลี่ยน Section');
        d.machines[mid] = {...prior,name,section:sec,assignments:prior.assignments || {}};
      });
      if (ok) { selected = mid; placing = !positioned(data.machines[mid]); dlg.close(); refresh(); }
      else { dlg.querySelector('[role=status]').textContent = statusText; buttons.forEach(b => b.disabled = false); }
    };
  }
  async function upload(file) {
    if (!file || busy || !ready || !admin()) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) return note('เลือกไฟล์ PNG/JPG/WebP ไม่เกิน 15 MB');
    note('กำลังเตรียมภาพผัง...');
    try {
      const bitmap = await createImageBitmap(file), canvas = document.createElement('canvas'), scale = Math.min(1,3200 / Math.max(bitmap.width,bitmap.height));
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
      const src = canvas.toDataURL('image/jpeg',0.88);
      if (src.length > 4 * 1024 * 1024) throw Error('ภาพมีขนาดใหญ่เกินไป กรุณาลดความละเอียดแล้วเลือกใหม่');
      if (data.image && entries().some(positioned) && !confirm('เปลี่ยนผังโรงงาน? จุดเครื่องเดิมจะกลับเป็น “ยังไม่วางตำแหน่ง” เพื่อให้กำหนดจุดบนผังใหม่อย่างถูกต้อง')) return;
      await save(d => { d.image = {src,name:file.name,width:canvas.width,height:canvas.height}; Object.values(d.machines).forEach(m => {delete m.x; delete m.y;}); placing = false; }, 'บันทึกผังใหม่แล้ว · กรุณาวางตำแหน่งเครื่องบนผัง');
    } catch (e) { note('เปลี่ยนผังไม่สำเร็จ: ' + e.message); }
  }
  async function load() {
    ready = false; controls(); note('กำลังโหลด Layout จากข้อมูลกลาง...');
    try {
      const r = await request(); data = normalize(await r.json()); ready = true; remember(); note('เชื่อมต่อข้อมูลกลางแล้ว'); refresh();
      if (window.firebase?.apps?.length && !subscription) {
        subscription = firebase.database().ref(PATH);
        subscription.on('value', snapshot => {
          data = normalize(snapshot.val()); remember();
          remotePending = true;
          if (!busy && !editingControl()) { remotePending = false; refresh(); }
        }, () => { note('การอัปเดตสดขาดการเชื่อมต่อ · กดโหลดข้อมูลล่าสุด'); });
      }
    } catch (e) { note(e.message + ' · แสดงข้อมูลสำรองและยังบันทึกไม่ได้'); refresh(); }
  }
  function mount() {
    const next = document.getElementById('factoryLayoutPage');
    if (next === root) return;
    if (subscription) { subscription.off(); subscription = null; }
    clearInterval(rosterTimer); root = next;
    if (!root) return;
    selected = ''; placing = false;
    try { data = normalize(JSON.parse(localStorage.getItem(CACHE) || 'null')); } catch (_) { data = normalize(null); }
    root.querySelector('#flSearch').value = query;
    root.addEventListener('click', async event => {
      const b = event.target.closest('button');
      if (b?.dataset.flSelect) { selected = b.dataset.flSelect; placing = false; refresh(); return; }
      if (b?.hasAttribute('data-fl-place')) { if (!busy && ready) { placing = !placing; refresh(); } return; }
      if (b?.hasAttribute('data-fl-edit')) { editMachine(selected); return; }
      if (b?.hasAttribute('data-fl-delete')) {
        const machine = selected;
        if (!data.machines[machine] || !confirm('ลบเครื่อง/จุดงานนี้และรายการพนักงานประจำจุด? ข้อมูลพนักงานใน PPMS จะยังอยู่')) return;
        if (await save(d => { delete d.machines[machine]; })) { selected = ''; placing = false; refresh(); } return;
      }
      if (b?.dataset.flRemove) { const id = b.dataset.flRemove, machine = selected; await save(d => { if (!d.machines[machine]) throw Error('เครื่องนี้ถูกลบแล้ว'); delete (d.machines[machine].assignments || {})[employeeKey(id)]; }); return; }
      if (event.target.closest('#flCanvas') && placing && selected && !busy && ready) {
        const rect = root.querySelector('#flCanvas').getBoundingClientRect(), x = Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)), y = Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100)), machine = selected;
        if (await save(d => { if (!d.machines[machine]) throw Error('เครื่องนี้ถูกลบแล้ว'); d.machines[machine].x = x; d.machines[machine].y = y; })) { placing = false; refresh(); }
      }
    });
    root.querySelector('#flAddMachine').onclick = () => editMachine();
    root.querySelector('#flSeedStamping').onclick = () => save(d => { for (let n = 1; n <= 13; n++) { const name = 'Stamping ' + n + '#'; if (!Object.values(d.machines).some(m => m.name === name && m.section === 'Stamping Section')) d.machines['stamping_' + n] ||= {name,section:'Stamping Section',assignments:{}}; } }, 'เพิ่มรายการ Stamping 1#–13# แล้ว · กรุณาวางจุดตามตำแหน่งจริง');
    root.querySelector('#flReload').onclick = load;
    root.querySelector('#flSearch').oninput = event => { query = event.target.value; refresh(); };
    root.querySelector('#flSection').onchange = event => { section = event.target.value; refresh(); };
    root.querySelector('#flUpload').onchange = event => { void upload(event.target.files[0]); event.target.value = ''; };
    for (const [id,change] of [['flZoomIn',.25],['flZoomOut',-.25]]) root.querySelector('#' + id).onclick = () => { zoom = Math.max(1,Math.min(4,zoom+change)); refresh(); };
    root.querySelector('#flFit').onclick = () => { zoom = 1; refresh(); };
    root.addEventListener('focusout', () => setTimeout(() => { if (root?.isConnected && !editingControl() && !busy && remotePending) { remotePending = false; refresh(); }; },100));
    rosterSignature = JSON.stringify(roster());
    rosterTimer = setInterval(() => { const sig = JSON.stringify(roster()); if (sig !== rosterSignature) { rosterSignature = sig; remotePending = true; if (!editingControl() && !busy) { remotePending = false; refresh(); } } },3000);
    refresh(); void load();
  }
  window.PPMS_FACTORY_LAYOUT = {
    page: () => `<section id="factoryLayoutPage"><div class="page-head"><div><h2>Layout โรงงาน · พนักงานประจำเครื่อง</h2><p>เลือกเครื่องเพื่อดูผู้รับผิดชอบ · ค้นหาพนักงานเพื่อดูตำแหน่งบนผัง</p></div></div><div class="fl-toolbar"><label>Section<select id="flSection"></select></label><label>ค้นหาเครื่อง / ชื่อ / รหัสพนักงาน<input id="flSearch" placeholder="ค้นหาตำแหน่งพนักงานหรือเครื่องจักร"></label><button id="flAddMachine">เพิ่มเครื่อง/จุดงาน</button><button id="flSeedStamping" data-fl-write class="secondary">เพิ่ม Stamping 1#–13#</button><button id="flReload" class="secondary">โหลดข้อมูลล่าสุด</button><label class="fl-upload">เปลี่ยนภาพผัง PNG/JPG<input type="file" id="flUpload" accept="image/png,image/jpeg,image/webp"></label></div><div class="fl-status" data-layout-status role="status"></div><p id="flCounts"></p><div class="fl-grid"><aside class="fl-panel"><h3>เครื่องจักร / จุดงาน</h3><div id="flMachineList"></div></aside><section class="fl-panel fl-map"><div class="fl-actions"><button id="flZoomOut" class="secondary" aria-label="ย่อผัง">−</button><span id="flZoomLabel"></span><button id="flZoomIn" class="secondary" aria-label="ขยายผัง">+</button><button id="flFit" class="secondary">พอดีจอ</button></div><p id="flImageNote" class="fl-hint"></p><div class="fl-viewport"><div id="flCanvas"><img id="flImage" alt="ผังโรงงาน General layout_A0_V5" draggable="false"><div id="flPins"></div></div></div><p class="fl-muted">ขยายแล้วเลื่อนผังซ้าย–ขวา/ขึ้น–ลงได้ · จุดที่ยังไม่วางแสดงในรายการเครื่องจักร</p><div class="fl-legend">${Object.entries(colors).map(([k,c]) => `<span><i style="background:${c}"></i>${k}</span>`).join('')}</div></section><aside class="fl-panel" id="flDetail"></aside></div><details class="fl-panel fl-pool"><summary>พนักงานที่ยังไม่กำหนดเครื่อง/จุดงานใน Layout</summary><div id="flUnassigned"></div></details></section>`,
    mount
  };
  const style = document.createElement('style');
  style.textContent = `#factoryLayoutPage{color:#20364b}.fl-toolbar,.fl-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fl-toolbar label{display:grid;gap:4px;font-size:12px}.fl-toolbar input,.fl-toolbar select,.fl-dialog input,#flDetail input,#flDetail select{padding:9px;border:1px solid #b9cadb;border-radius:7px;min-width:0}.fl-toolbar input{width:240px}.fl-status{padding:10px 12px;background:#edf5ff;border-left:4px solid #2563eb;margin:12px 0;min-height:40px}.fl-grid{display:grid;grid-template-columns:210px minmax(0,1fr) 300px;gap:14px}.fl-panel{background:#fff;border:1px solid #ccdbe8;border-radius:12px;padding:14px;min-width:0}.fl-panel h3{font-size:16px;margin:0 0 12px}.fl-machine{display:block;width:100%;text-align:left;padding:10px;margin:7px 0;background:#f7fafc!important;color:#20364b!important;border:1px solid #cbd5e1!important}.fl-machine.selected{border:2px solid #2563eb!important;background:#eaf3ff!important}.fl-machine small,.fl-person small{display:block;font-size:11px;margin-top:4px;overflow-wrap:anywhere}.fl-viewport{width:100%;height:520px;overflow:auto;background:#edf2f7;border:1px solid #cbd5e1;border-radius:8px}.fl-map{overflow:hidden}#flCanvas{position:relative;min-width:100%;line-height:0}#flCanvas.placing{cursor:crosshair}#flImage{display:block;width:100%;height:auto;user-select:none}#flPins{position:absolute;inset:0;pointer-events:none}.fl-pin{position:absolute;pointer-events:auto;transform:translate(-50%,-50%);background:white!important;color:#20364b!important;border:2px solid var(--pin-color)!important;box-shadow:0 2px 8px #0003;border-radius:8px;padding:5px 8px;max-width:190px;font-size:11px;line-height:1.3}.fl-pin small{display:block;font-size:10px;max-height:65px;overflow:auto}.fl-pin.selected{outline:3px solid #fbbf24;z-index:2}.fl-person{border-left:4px solid var(--person-color);padding:9px;background:#f7fafc;border-radius:6px;margin:8px 0;display:flex;gap:6px;justify-content:space-between;align-items:center}.fl-person b{font-size:13px}.fl-person button{font-size:11px}.fl-hint{padding:8px;background:#fffbeb;color:#785823;font-size:12px}.fl-muted,.fl-empty{color:#64748b;font-size:12px}.fl-legend{display:flex;flex-wrap:wrap;gap:8px;font-size:11px}.fl-legend i{width:10px;height:10px;display:inline-block;margin-right:4px;border-radius:2px}.fl-pool{margin-top:14px}.fl-pool summary{cursor:pointer;font-weight:700}.fl-pool>div{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}.fl-dialog{border:1px solid #cbd5e1;border-radius:12px;padding:22px;width:min(450px,90vw)}.fl-dialog::backdrop{background:#1238}.fl-dialog label,#flAssign label{display:grid;gap:5px;margin:12px 0}.fl-dialog input,#flAssign input,#flAssign select{width:100%;box-sizing:border-box}.fl-upload input{max-width:210px;font-size:11px}.fl-toolbar button,.fl-actions button{font-size:12px}#flMachineList{max-height:560px;overflow:auto}@media(max-width:1150px){.fl-grid{grid-template-columns:180px minmax(0,1fr)}#flDetail{grid-column:1/-1}.fl-viewport{height:450px}}@media(max-width:600px){.fl-grid{grid-template-columns:1fr}#flDetail{grid-column:auto}#flMachineList{max-height:180px}.fl-viewport{height:320px}.fl-toolbar{align-items:stretch}.fl-toolbar label{width:100%}.fl-toolbar input{width:100%;box-sizing:border-box}}`;
  document.head.append(style);
})();
