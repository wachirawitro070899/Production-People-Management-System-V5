/* Factory floor map: independent cloud document; never rewrites employee master. */
(() => {
  'use strict';
  const PATH = 'ppmsFactoryLayout/v1', CACHE = 'ppms_factory_layout_v1';
  const MAPS = {
    stamping_1_8:{src:'stamping-layout-1-8.png?v=813',name:'Stamping · เครื่อง 1#–8#',section:'Stamping Section'},
    bending:{src:'bending-layout.png?v=813',name:'Bending Section',section:'Bending Section'},
    stamping_9_13:{src:'stamping-layout-9-13.png?v=813',name:'Stamping · เครื่อง 9#–13#',section:'Stamping Section'}
  };
  let activeMap = 'stamping_1_8';
  let uploading = false;
  const imageCache = new Map(), imageRequests = new Map();
  function maps() {
    const result = {...MAPS};
    for (const [id,m] of Object.entries(data.sectionMaps || {})) {
      if (id !== 'factory' && m && typeof m.section === 'string' && m.section.trim() && /^[a-zA-Z0-9_-]+$/.test(id)) result[id] = {...(MAPS[id] || {}),...m,name:m.name || MAPS[id]?.name || m.section};
    }
    return result;
  }
  const mapInfo = id => maps()[id];
  const machineMap = m => mapInfo(m.mapId) ? m.mapId : '';
  const visiblePosition = m => !!activeMap && positioned(m) && machineMap(m) === activeMap;
  function switchMap(id) {
    if (!mapInfo(id)) return;
    activeMap = id; section = mapInfo(id).section; selected = ''; placing = false; selectingArea = false; pendingZoom = null; pendingFocus = false; zoom = 1;
    drawArea(null); refresh(); root.querySelector('.fl-viewport').scrollTo(0,0);
    note(mapInfo(id).name + ' · ลากพนักงานลงป้ายเครื่องเพื่อบันทึก');
  }

  function selectSection(value) {
    section = String(value || '');
    activeMap = Object.keys(maps()).find(id => mapInfo(id).section === section) || '';
    query = ''; selected = ''; placing = false; selectingArea = false; pendingEmployee = ''; pendingFocus = false; pendingZoom = null; zoom = 1;
    root.querySelector('#flSearch').value = ''; drawArea(null); refresh(); root.querySelector('.fl-viewport').scrollTo(0,0);
    if (activeMap) zoomSection();
    else note(section ? section + ' · ยังไม่มีภาพผัง กรุณาอัปโหลดผังของ Section นี้' : 'เลือก Section เพื่อเปิดเฉพาะผัง เครื่องจักร และพนักงานในแผนกนั้น');
  }

  function selectEmployee(id) {
    const employee = roster().find(e => String(e.id) === String(id) && e.section === section);
    pendingEmployee = employee ? String(employee.id) : '';
    refresh();
    if (employee) note('เลือก ' + employee.name + ' · ลากรูปลงเครื่องหรือเลือกป้ายเครื่องเพื่อกำหนดผู้รับผิดชอบ');
  }

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
  let selected = '', placing = false, zoom = 1, section = 'Stamping Section', query = '', rosterSignature = '', statusText = '';
  let selectingArea = false, areaStart = null, areaPointer = null, pendingFocus = false, pendingEmployee = '', pendingZoom = null;
  const areaKey = s => employeeKey(s) + '_' + activeMap;
  function sectionBounds() {
    if (!section) return null;
    const a = data.areas?.[areaKey(section)];
    if (!a && activeMap) return {x:0,y:0,width:100,height:100};
    if (a && [a.x,a.y,a.width,a.height].every(Number.isFinite) && a.width > 0 && a.height > 0 && a.x >= 0 && a.y >= 0 && a.x + a.width <= 100.001 && a.y + a.height <= 100.001) return a;
    const points = entries().filter(m => m.section === section && visiblePosition(m));
    if (!points.length) return null;
    const xs = points.map(m => m.x), ys = points.map(m => m.y);
    const cx = (Math.min(...xs)+Math.max(...xs))/2, cy = (Math.min(...ys)+Math.max(...ys))/2;
    const width = Math.min(100,Math.max(12,Math.max(...xs)-Math.min(...xs)+8));
    const height = Math.min(100,Math.max(12,Math.max(...ys)-Math.min(...ys)+8));
    return {x:Math.max(0,Math.min(100-width,cx-width/2)),y:Math.max(0,Math.min(100-height,cy-height/2)),width,height};
  }
  function zoomSection() {
    if (!activeMap) { note('แผนกนี้ยังไม่มีผัง กรุณาอัปโหลดผังแผนกก่อน'); return; }
    if (!section) { zoom = 1; refresh(); const v = root.querySelector('.fl-viewport'); v.scrollTo(0,0); return; }
    const a = sectionBounds();
    if (!a) { note('ยังไม่ได้กำหนดพื้นที่ ' + section + ' · กด “กำหนดพื้นที่แผนก” แล้วลากกรอบบนผัง'); return; }
    zoomBounds(a,'ซูมแผนก: ' + section);
  }
  function zoomBounds(a,label) {
    const viewport = root.querySelector('.fl-viewport'), img = root.querySelector('#flImage');
    if (!img.complete || !img.naturalWidth || !viewport.clientWidth) { pendingFocus = true; pendingZoom = {bounds:a,label}; return; }
    pendingFocus = false; pendingZoom = null;
    const baseWidth = viewport.clientWidth, baseHeight = baseWidth * img.naturalHeight / img.naturalWidth;
    zoom = Math.max(1,Math.min(16,Math.min(viewport.clientWidth/(baseWidth*a.width/100),viewport.clientHeight/(baseHeight*a.height/100))*.88));
    refresh();
    requestAnimationFrame(() => { if (!root?.isConnected) return; const c = root.querySelector('#flCanvas'); viewport.scrollTo({left:Math.max(0,c.clientWidth*(a.x+a.width/2)/100-viewport.clientWidth/2),top:Math.max(0,c.clientHeight*(a.y+a.height/2)/100-viewport.clientHeight/2)}); });
    note(label);
  }
  function zoomMachine(id = selected) {
    const m = data.machines[id];
    if (!m) return;
    const nextMap = machineMap(m);
    if (nextMap !== activeMap) { activeMap = nextMap; section = mapInfo(nextMap)?.section || m.section; pendingZoom = null; pendingFocus = false; refresh(); }
    if (!nextMap || !positioned(m)) { note('ยังไม่ได้วางจุด ' + m.name + ' · กด “วางจุดบนผัง” แล้วเลือกตำแหน่งเครื่องจริง'); return; }
    zoomBounds({x:Math.max(0,Math.min(92,m.x-4)),y:Math.max(0,Math.min(92,m.y-4)),width:8,height:8},'เครื่อง: ' + m.name + ' · ' + assigned(m).map(e => e.name).join(' / '));
  }
  function setZoom(value) {
    const v = root.querySelector('.fl-viewport'), c = root.querySelector('#flCanvas');
    const center = {x:(v.scrollLeft + v.clientWidth/2)/c.clientWidth,y:(v.scrollTop + v.clientHeight/2)/c.clientHeight};
    zoom = Math.max(1,Math.min(16,value)); refresh();
    requestAnimationFrame(() => { if (root?.isConnected) v.scrollTo({left:Math.max(0,c.clientWidth*center.x-v.clientWidth/2),top:Math.max(0,c.clientHeight*center.y-v.clientHeight/2)}); });
  }
  function dropTarget(target) {
    const pin = target.closest('[data-fl-select]');
    if (pin) return {machine:pin.dataset.flSelect,place:false};
    if (target.closest('#flCanvas') && activeMap && selected && data.machines[selected] && (!positioned(data.machines[selected]) || placing)) return {machine:selected,place:true};
    return null;
  }
  function photo(e) {
    const raw = String(e.photoData || e.photoUrl || e.photo || ''), safe = /^(https?:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(raw) ? raw : '';
    const initial = String(e.name || '?').replace(/^(MR\.|MS\.|MRS\.)/i,'').trim()[0] || '?';
    return `<span class="fl-photo-wrap">${safe ? `<img class="fl-photo" src="${esc(safe)}" alt="${esc(e.name)}" loading="lazy" draggable="false">` : ''}<span class="fl-photo-fallback" ${safe ? 'hidden' : ''}>${esc(initial)}</span></span>`;
  }
  async function assignEmployee(id,machine,point = null) {
    id = String(id || '');
    const mapId = activeMap, relocating = placing;
    if (!id || !roster().some(e => String(e.id) === id)) { note('กรุณาเลือกพนักงานจากรายชื่อ PPMS'); return false; }
    const ok = await save(d => { const m = d.machines[machine]; if (!m) throw Error('เครื่องนี้ถูกลบแล้ว'); const e = roster().find(e => String(e.id) === id); if (!e || (m.section && e.section !== m.section)) throw Error('Section พนักงานไม่ตรงกับเครื่อง'); if (point) { if (![point.x,point.y].every(v => Number.isFinite(v) && v >= 0 && v <= 100)) throw Error('ตำแหน่งไม่ถูกต้อง'); if (!positioned(m) || relocating) { m.x = point.x; m.y = point.y; m.mapId = mapId; } else throw Error('เครื่องนี้มีตำแหน่งแล้ว กรุณาวางรูปที่ป้ายเครื่อง'); } m.assignments ||= {}; m.assignments[employeeKey(id)] = {employeeId:id,assignedAt:new Date().toISOString()}; },'บันทึกพนักงานประจำเครื่องแล้ว');
    if (ok) { pendingEmployee = ''; placing = false; refresh(); }
    return ok;
  }
  function areaPoint(event) {
    const r = root.querySelector('#flCanvas').getBoundingClientRect();
    return {x:Math.max(0,Math.min(100,(event.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(event.clientY-r.top)/r.height*100))};
  }
  function drawArea(a) {
    const box = root.querySelector('#flAreaSelection'); box.hidden = !a;
    if (a) Object.assign(box.style,{left:a.x+'%',top:a.y+'%',width:a.width+'%',height:a.height+'%'});
  }
  const rectangle = (a,b) => ({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)});
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
    if (!section) return false;
    if (activeMap && machineMap(m) !== activeMap && !(m.section === section && !machineMap(m))) return false;
    if (section && m.section !== section) return false;
    const people = assigned(m);
    return !query || [m.name,m.section,...people.flatMap(e => [e.id,e.name,e.position])].join(' ').toLowerCase().includes(query.toLowerCase());
  }
  function person(e, removable = false) {
    return `<div class="fl-person ${String(e.id) === pendingEmployee ? 'fl-person-selected' : ''}" data-fl-employee="${esc(e.id)}" draggable="${admin()}" tabindex="0" role="button" title="ลากรูปหรือแตะพนักงานแล้วเลือกเครื่องจักร" style="--person-color:${colors[rank(e)]}">${photo(e)}<div><b>${esc(e.name)}</b><small>${esc(e.id)} · ${esc(e.position)} · ${esc(e.section)}</small></div>${removable ? `<button type="button" data-fl-remove="${esc(e.id)}" class="secondary" aria-label="ยกเลิก ${esc(e.name)} ประจำเครื่อง">ยกเลิก</button>` : ''}</div>`;
  }
  function controls() {
    root?.querySelectorAll('[data-fl-write], [data-fl-remove], #flAddMachine, #flAssign, #flUploadSection').forEach(e => { e.disabled = busy || uploading || !ready || !admin(); });
    const areaButton = root?.querySelector('#flSetArea'); if (areaButton) areaButton.disabled = !activeMap || !section || busy || !ready || !admin();
  }
  function refresh() {
    if (!root?.isConnected) return;
    const all = entries(), list = all.filter(match), m = data.machines[selected];
    const img = root.querySelector('#flImage'), map = mapInfo(activeMap);
    const pickerMap = root.querySelector('#flMapPicker');
    const sectionMaps = Object.entries(maps()).filter(([,m]) => m.section === section);
    pickerMap.innerHTML = sectionMaps.map(([id,m]) => `<option value="${esc(id)}">${esc(m.name)}</option>`).join('') || '<option value="">ยังไม่มีผังสำหรับ Section นี้</option>'; pickerMap.value = activeMap;
    root.querySelector('#flMapChoice').hidden = sectionMaps.length <= 1;
    showMapImage(img,map);
    root.querySelector('#flCanvas').style.width = (zoom * 100) + '%';
    root.querySelector('#flZoomLabel').textContent = Math.round(zoom * 100) + '%';
    root.querySelector('#flZoomPreset').value = [1,2,4,6,8,10,16].includes(zoom) ? String(zoom) : '';
    root.querySelector('#flImageNote').textContent = (map?.name || section || 'เลือกแผนก') + ' · เลือกเครื่องแล้วลากพนักงานลงตำแหน่งจริงเพื่อวางจุดและบันทึกทันที · จุดที่วางแล้วให้ลากลงป้ายเครื่อง · ภาพ PNG อาจเห็นพิกเซลเมื่อขยายมาก แต่ป้ายชื่อยังคมชัด';
    const placed = list.filter(visiblePosition);
    root.querySelector('#flPins').innerHTML = placed.map(x => {
      const people = assigned(x), color = people.length ? colors[rank(people[0])] : '#64748b';
      return `<button class="fl-pin ${x.id === selected ? 'selected' : ''}" style="left:${x.x}%;top:${x.y}%;--pin-color:${color}" data-fl-select="${esc(x.id)}" title="${esc(x.name)} · ${people.map(e => esc(e.name)).join(', ') || 'ยังไม่มีพนักงาน'}"><b>${esc(x.name)}</b><span class="fl-pin-people">${people.length ? people.map(e => `<span class="fl-pin-person">${photo(e)}<span>${esc(e.name)}</span></span>`).join('') : '<small>ยังไม่มีพนักงาน</small>'}</span></button>`;
    }).join('');
    root.querySelector('#flMachineList').innerHTML = list.map(x => `<button type="button" class="fl-machine ${x.id === selected ? 'selected' : ''}" data-fl-select="${esc(x.id)}"><b>${esc(x.name)}</b><small>${esc(x.section)} · ${positioned(x) ? 'วางบนผังแล้ว' : 'ยังไม่วางตำแหน่ง'} · ${assigned(x).length} คน</small></button>`).join('') || '<p class="fl-empty">ไม่พบเครื่องจักร · เพิ่มเครื่องจักรหรือเปลี่ยนตัวกรอง</p>';
    const picker = root.querySelector('#flMachinePicker');
    picker.innerHTML = '<option value="">— เลือกเครื่องจักร —</option>' + list.map(x => `<option value="${esc(x.id)}">${esc(x.name)} · ${esc(x.section)}</option>`).join(''); picker.value = selected;
    root.querySelector('#flZoomMachine').disabled = !m || !positioned(m);
    root.querySelector('#flCounts').textContent = section ? `${section} · ${all.filter(x => x.section === section).length} เครื่อง/จุดงาน · พื้นที่นี้แสดง ${list.length} เครื่อง` : 'เลือก Section เพื่อแสดงพื้นที่ของแผนก';
    root.querySelector('#flDetail').innerHTML = m ? `<h3>${esc(m.name)}</h3><p>${esc(m.section || 'ไม่ระบุ Section')}</p><div class="fl-actions"><button data-fl-write data-fl-place>${placing ? 'ยกเลิกวางตำแหน่ง' : positioned(m) ? 'ย้ายจุดบนผัง' : 'วางจุดบนผัง'}</button><button class="secondary" data-fl-write data-fl-edit>แก้ไขชื่อ/Section</button><button class="secondary" data-fl-write data-fl-delete>ลบเครื่อง/จุดงาน</button></div>${placing ? '<p class="fl-hint">กดตำแหน่งจริงบนผังเพื่อบันทึกจุดเครื่อง</p>' : ''}<h4>พนักงานประจำเครื่อง/จุดงาน</h4>${assigned(m).map(e => person(e,true)).join('') || '<p class="fl-empty">ยังไม่ได้กำหนดพนักงาน</p>'}<form id="flAssign"><label>ค้นหาชื่อหรือรหัสพนักงาน<input id="flEmployeeSearch" placeholder="พิมพ์ชื่อหรือรหัสพนักงาน" autocomplete="off"></label><label>เลือกพนักงาน<select id="flEmployee" required></select></label><button type="submit" data-fl-write>เพิ่มพนักงานประจำเครื่อง</button><p class="fl-muted">กำหนดเป็นผู้รับผิดชอบประจำจุด · พนักงานหนึ่งคนดูแลได้หลายเครื่อง</p></form>` : '<h3>รายละเอียดเครื่องจักร</h3><p class="fl-empty">เลือกเครื่องจากผังหรือรายการด้านซ้าย เพื่อดูและกำหนดพนักงาน</p>';
    fillEmployeeOptions();
    root.querySelector('#flAssign')?.addEventListener('submit', assign);
    root.querySelector('#flEmployeeSearch')?.addEventListener('input', fillEmployeeOptions);
    root.querySelector('#flCanvas').classList.toggle('placing', placing);
    root.querySelector('#flCanvas').classList.toggle('selecting-area', selectingArea);
    const areaButton = root.querySelector('#flSetArea');
    areaButton.textContent = selectingArea ? 'ยกเลิกกำหนดพื้นที่' : 'กำหนดพื้นที่แผนก';
    areaButton.disabled = !activeMap || !section || busy || !ready || !admin();
    root.querySelector('#flZoomSection').disabled = !activeMap || !section;
    const savedArea = sectionBounds(), outline = root.querySelector('#flSavedArea');
    outline.hidden = !savedArea;
    if (savedArea) Object.assign(outline.style,{left:savedArea.x+'%',top:savedArea.y+'%',width:savedArea.width+'%',height:savedArea.height+'%'});
    
    const departmentPeople = section ? roster().filter(e => e.section === section).sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''),'th')) : [];
    const employeePicker = root.querySelector('#flRosterPicker');
    employeePicker.innerHTML = '<option value="">— เลือกพนักงาน —</option>' + departmentPeople.map(e => `<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.name)} · ${esc(e.position || '')}</option>`).join('');
    employeePicker.value = pendingEmployee; employeePicker.disabled = !section || !departmentPeople.length;
    root.querySelector('#flRosterCount').textContent = section ? `${section} · ${departmentPeople.length} คน` : 'เลือก Section ก่อน';
    const pickedPerson = departmentPeople.find(e => String(e.id) === pendingEmployee);
    root.querySelector('#flUnassigned').innerHTML = pickedPerson ? person(pickedPerson) : `<p class="fl-empty">${departmentPeople.length ? 'เลือกพนักงานจาก Dropdown เพื่อแสดงรูปสำหรับลากลงเครื่อง' : 'ไม่มีพนักงานใน Section นี้'}</p>`;

    const select = root.querySelector('#flSection'), value = section;
    const sections = [...new Set([...roster().map(e => e.section),...all.map(x => x.section),...Object.values(maps()).map(m => m.section)].filter(Boolean))].sort();
    select.innerHTML = '<option value="">— เลือก Section —</option>' + sections.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join(''); select.value = value;
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
    await assignEmployee(id,machine);
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
        d.machines[mid] = {...prior,name,section:sec,mapId:prior.mapId || activeMap,assignments:prior.assignments || {}};
      });
      if (ok) { selected = mid; placing = !positioned(data.machines[mid]); dlg.close(); refresh(); }
      else { dlg.querySelector('[role=status]').textContent = statusText; buttons.forEach(b => b.disabled = false); }
    };
  }
  async function imageRequest(path,options = {}) {
    if (!/^ppmsFactoryLayoutImages\/v1\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(path)) throw Error('ที่อยู่ภาพผังไม่ถูกต้อง');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(),30000);
    try {
      const response = await fetch(base() + '/' + path + '.json',{...options,signal:controller.signal,cache:'no-store'});
      if (!response.ok) throw Error('โหลดหรือบันทึกภาพผังไม่สำเร็จ (' + response.status + ')');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function showMapImage(img,map) {
    const path = map?.imagePath;
    let src = path ? imageCache.get(path) : map?.src;
    img.hidden = !src;
    if (!src) {
      img.removeAttribute('src');
      root.querySelector('#flNoMap').hidden = false;
      root.querySelector('#flNoMap').textContent = map ? 'กำลังโหลดภาพผังแผนก...' : section ? 'Section นี้ยังไม่มีภาพผัง · กดอัปโหลดผังแผนก' : 'เลือก Section จาก Dropdown ด้านบน';
      if (path && !imageRequests.has(path)) {
        imageRequests.set(path,true);
        imageRequest(path).then(record => {
          if (!/^data:image\/(png|jpeg|webp);base64,/i.test(record?.src || '')) throw Error('ไฟล์ภาพผังไม่ถูกต้อง');
          imageCache.set(path,record.src);
          if (root?.isConnected && mapInfo(activeMap)?.imagePath === path) refresh();
        }).catch(e => { if (root?.isConnected && mapInfo(activeMap)?.imagePath === path) { root.querySelector('#flNoMap').textContent = 'โหลดภาพไม่ได้ · กดโหลดข้อมูลล่าสุดเพื่อลองใหม่'; note(e.message); } });
      }
      return;
    }
    root.querySelector('#flNoMap').hidden = true;
    if (img.getAttribute('src') !== src) img.src = src;
  }
  function uploadSection() {
    if (!admin() || !ready || busy || uploading) return;
    const dlg = document.createElement('dialog'); dlg.className = 'fl-dialog';
    const departments = [...new Set([...roster().map(e=>e.section),...entries().map(m=>m.section),...Object.values(maps()).map(m=>m.section)].filter(Boolean))].sort();
    dlg.innerHTML = `<form><h3>อัปโหลดผังแยกแผนก</h3><label>แผนก / Section<select name="department" required>${departments.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label>ผังที่จะอัปโหลด<select name="target"></select></label><label>ชื่อผัง<input name="mapName" maxlength="100" required></label><label>ภาพผัง<input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" required></label><p class="fl-muted">PNG / JPG / WebP ไม่เกิน 10 MB · เก็บความละเอียดต้นฉบับ</p><label class="fl-keep"><input name="keepPositions" type="checkbox">คงจุดเครื่องเดิมเมื่อภาพใหม่มีตำแหน่งตรงกับเดิม</label><p class="fl-hint">เมื่อเปลี่ยนภาพ จุดเครื่องในผังนี้จะต้องวางใหม่ เว้นแต่เลือกคงจุดเดิม · รายชื่อพนักงานประจำเครื่องยังอยู่</p><div class="fl-actions"><button type="submit">อัปโหลดและบันทึก</button><button type="button" class="secondary" data-cancel>ยกเลิก</button></div><p role="status"></p></form>`;
    document.body.append(dlg); dlg.showModal();
    const form = dlg.querySelector('form'), department = form.elements.department, target = form.elements.target, name = form.elements.mapName;
    department.value = section || departments[0] || '';
    const chooseName = () => { name.value = mapInfo(target.value)?.name || department.value; };
    const fillTargets = () => { target.innerHTML = '<option value="new">เพิ่มผังใหม่ในแผนกนี้</option>' + Object.entries(maps()).filter(([,m])=>m.section===department.value).map(([id,m])=>`<option value="${esc(id)}">แทนภาพ: ${esc(m.name)}</option>`).join(''); if (mapInfo(activeMap)?.section === department.value) target.value = activeMap; chooseName(); };
    department.onchange = fillTargets; target.onchange = chooseName; fillTargets();
    dlg.querySelector('[data-cancel]').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove();
    form.onsubmit = async event => {
      event.preventDefault();
      if (!admin() || busy || uploading || !ready) return;
      const file = form.elements.imageFile.files[0], sec = department.value, title = name.value.trim(), existing = target.value !== 'new', id = existing ? target.value : 'map_' + employeeKey(sec) + '_' + Date.now().toString(36), keep = form.elements.keepPositions.checked;
      const status = dlg.querySelector('[role=status]');
      if (!file || !title || !sec) return;
      if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10*1024*1024) { status.textContent = 'เลือก PNG / JPG / WebP ขนาดไม่เกิน 10 MB'; return; }
      uploading = true; controls(); dlg.querySelectorAll('button,input,select').forEach(e=>e.disabled=true); status.textContent = 'กำลังอัปโหลดภาพต้นฉบับ...';
      try {
        const src = await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(Error('อ่านไฟล์ภาพไม่ได้')); reader.readAsDataURL(file); });
        const dimensions = await new Promise((resolve,reject)=>{ const image=new Image(); image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight}); image.onerror=()=>reject(Error('เปิดไฟล์ภาพไม่ได้')); image.src=src; });
        if (!dimensions.width || !dimensions.height) throw Error('ภาพไม่มีขนาดที่ถูกต้อง');
        const version = 'img_' + (crypto.randomUUID?.() || Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)), path = 'ppmsFactoryLayoutImages/v1/' + id + '/' + version;
        if (!admin()) throw Error('สิทธิ์ Admin หมดอายุ');
        await imageRequest(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({src,...dimensions,fileName:file.name})});
        const ok = await save(d => {
          d.sectionMaps ||= {};
          if (existing && !MAPS[id] && !d.sectionMaps[id]) throw Error('ผังนี้ถูกลบแล้ว');
          if (existing && (d.sectionMaps[id]?.section || MAPS[id]?.section) !== sec) throw Error('แผนกของผังเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด');
          if (existing) {
            d.layoutHistory ||= {}; d.layoutHistory[version] = {mapId:id,map:d.sectionMaps[id] || MAPS[id],positions:{}};
            if (!keep) { for (const [mid,m] of Object.entries(d.machines)) if (m.mapId === id) { d.layoutHistory[version].positions[mid] = {x:m.x ?? null,y:m.y ?? null}; delete m.x; delete m.y; } }
          }
          d.sectionMaps[id] = {name:title,section:sec,imagePath:path,...dimensions,revision:version};
          delete d.areas?.[employeeKey(sec)+'_'+id];
        },'อัปโหลดผังแผนกแล้ว');
        if (!ok) throw Error(statusText);
        imageCache.set(path,src); switchMap(id); dlg.close();
      } catch (e) { status.textContent = e.message; }
      finally { uploading=false; controls(); if (dlg.isConnected) dlg.querySelectorAll('button,input,select').forEach(e=>e.disabled=false); }
    };
  }

  async function load() {
    ready = false; controls(); note('กำลังโหลด Layout จากข้อมูลกลาง...');
    try {
      const r = await request(); data = normalize(await r.json()); ready = true; remember(); note('เชื่อมต่อข้อมูลกลางแล้ว'); refresh(); if (section) zoomSection();
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
    selected = ''; placing = false; selectingArea = false; areaStart = null; areaPointer = null; pendingEmployee = '';
    try { data = normalize(JSON.parse(localStorage.getItem(CACHE) || 'null')); } catch (_) { data = normalize(null); }
    root.querySelector('#flSearch').value = query;
    root.addEventListener('click', async event => {
      const b = event.target.closest('button');
      if (selectingArea && event.target.closest('#flCanvas')) return;
      if (b?.dataset.flSelect) { selected = b.dataset.flSelect; placing = false; if (pendingEmployee) { await assignEmployee(pendingEmployee,selected); } else { refresh(); zoomMachine(); } return; }
      if (b?.hasAttribute('data-fl-place')) { if (!busy && ready) { selectingArea = false; drawArea(null); placing = !placing; refresh(); } return; }
      if (b?.hasAttribute('data-fl-edit')) { editMachine(selected); return; }
      if (b?.hasAttribute('data-fl-delete')) {
        const machine = selected;
        if (!data.machines[machine] || !confirm('ลบเครื่อง/จุดงานนี้และรายการพนักงานประจำจุด? ข้อมูลพนักงานใน PPMS จะยังอยู่')) return;
        if (await save(d => { delete d.machines[machine]; })) { selected = ''; placing = false; refresh(); } return;
      }
      if (b?.dataset.flRemove) { const id = b.dataset.flRemove, machine = selected; await save(d => { if (!d.machines[machine]) throw Error('เครื่องนี้ถูกลบแล้ว'); delete (d.machines[machine].assignments || {})[employeeKey(id)]; }); return; }
      const personCard = event.target.closest('[data-fl-employee]');
      if (personCard && !b && admin() && !busy && ready) { pendingEmployee = personCard.dataset.flEmployee; refresh(); note('เลือกเครื่องที่จะให้ ' + (roster().find(e => String(e.id) === pendingEmployee)?.name || pendingEmployee) + ' ประจำ'); return; }
      if (event.target.closest('#flCanvas') && activeMap && placing && selected && !busy && ready) {
        const rect = root.querySelector('#flCanvas').getBoundingClientRect(), x = Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)), y = Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100)), machine = selected, mapId = activeMap;
        if (await save(d => { if (!d.machines[machine]) throw Error('เครื่องนี้ถูกลบแล้ว'); d.machines[machine].x = x; d.machines[machine].y = y; d.machines[machine].mapId = mapId; })) { placing = false; refresh(); }
      }
    });
    root.querySelector('#flAddMachine').onclick = () => editMachine();
    root.querySelector('#flSeedStamping').onclick = () => save(d => { for (let n = 1; n <= 13; n++) { const name = 'Stamping ' + n + '#'; if (!Object.values(d.machines).some(m => m.name === name && m.section === 'Stamping Section')) d.machines['stamping_' + n] ||= {name,section:'Stamping Section',assignments:{}}; } }, 'เพิ่มรายการ Stamping 1#–13# แล้ว · กรุณาวางจุดตามตำแหน่งจริง');
    root.querySelector('#flReload').onclick = () => { imageRequests.clear(); load(); };
    root.querySelector('#flUploadSection').onclick = uploadSection;
    root.querySelector('#flZoomMachine').onclick = () => zoomMachine();
    root.querySelector('#flMachinePicker').onchange = async event => { selected = event.target.value; placing = false; if (pendingEmployee && selected) await assignEmployee(pendingEmployee,selected); refresh(); if (selected) zoomMachine(); };
    root.addEventListener('error', event => { const img = event.target; if (!img?.classList?.contains('fl-photo')) return; img.hidden = true; const fallback = img.parentElement.querySelector('.fl-photo-fallback'); if (fallback) fallback.hidden = false; },true);
    root.addEventListener('keydown', event => { if (!['Enter',' '].includes(event.key) || !event.target.matches('[data-fl-employee]')) return; event.preventDefault(); event.target.click(); });
    root.addEventListener('dragstart', event => { const card = event.target.closest('[data-fl-employee]'); if (!card || !admin() || busy || !ready) return; event.dataTransfer.setData('application/x-ppms-employee',card.dataset.flEmployee); event.dataTransfer.effectAllowed = 'copy'; });
    root.addEventListener('dragover', event => {
      if (!admin() || busy || !ready || !Array.from(event.dataTransfer.types).includes('application/x-ppms-employee')) return;
      const viewport = event.target.closest('.fl-viewport');
      if (viewport) { const r = viewport.getBoundingClientRect(), edge = 48; viewport.scrollBy(event.clientX < r.left+edge ? -24 : event.clientX > r.right-edge ? 24 : 0,event.clientY < r.top+edge ? -24 : event.clientY > r.bottom-edge ? 24 : 0); }
      root.querySelectorAll('.fl-drop-target').forEach(e => e.classList.remove('fl-drop-target'));
      const target = dropTarget(event.target); if (!target) return;
      event.preventDefault(); event.dataTransfer.dropEffect = 'copy';
      event.target.closest('[data-fl-select],#flCanvas')?.classList.add('fl-drop-target');
    });
    const clearDrop = () => root.querySelectorAll('.fl-drop-target').forEach(e => e.classList.remove('fl-drop-target'));
    root.addEventListener('dragend',clearDrop);
    root.addEventListener('dragleave',event => { if (!root.contains(event.relatedTarget)) clearDrop(); });
    root.addEventListener('drop', async event => {
      const target = dropTarget(event.target), id = event.dataTransfer.getData('application/x-ppms-employee'); clearDrop();
      if (!id || !admin() || busy || !ready) return;
      event.preventDefault();
      if (!target) { note('เลือกเครื่องที่ยังไม่วางจุดก่อนลากลงผัง หรือวางรูปลงป้ายเครื่องที่มีอยู่'); return; }
      const point = target.place ? areaPoint(event) : null; selected = target.machine;
      await assignEmployee(id,selected,point);
    });
    root.querySelector('#flSearch').oninput = event => { query = event.target.value; refresh(); };
    root.querySelector('#flRosterPicker').onchange = event => selectEmployee(event.target.value);
    root.querySelector('#flMapPicker').onchange = event => switchMap(event.target.value);
    root.querySelector('#flSection').onchange = event => selectSection(event.target.value);
    for (const [id,change] of [['flZoomIn',.25],['flZoomOut',-.25]]) root.querySelector('#' + id).onclick = () => { setZoom(zoom+change); };
    root.querySelector('#flZoomPreset').onchange = event => { if (event.target.value) setZoom(Number(event.target.value)); };
    root.querySelector('#flFit').onclick = () => { query = ''; selected = ''; placing = false; selectingArea = false; zoom = 1; root.querySelector('#flSearch').value = ''; drawArea(null); refresh(); root.querySelector('.fl-viewport').scrollTo(0,0); note('แสดงผังแผนกเต็มภาพ'); };
    root.querySelector('#flZoomSection').onclick = zoomSection;
    root.querySelector('#flSetArea').onclick = () => { if (!activeMap || !section || !ready || busy || !admin()) return; selectingArea = !selectingArea; placing = false; areaStart = null; drawArea(null); refresh(); note(selectingArea ? 'ลากกรอบคลุมพื้นที่จริงของ ' + section + ' บนผัง แล้วปล่อยเพื่อบันทึก' : 'ยกเลิกกำหนดพื้นที่'); };
    root.querySelector('#flImage').onload = () => { if (pendingFocus && pendingZoom) zoomBounds(pendingZoom.bounds,pendingZoom.label); };
    const canvas = root.querySelector('#flCanvas');
    canvas.addEventListener('pointerdown', event => {
      if (!selectingArea || busy || !ready || event.button !== 0) return;
      event.preventDefault(); areaPointer = event.pointerId; areaStart = areaPoint(event); canvas.setPointerCapture(event.pointerId); drawArea(rectangle(areaStart,areaStart));
    });
    canvas.addEventListener('pointermove', event => { if (selectingArea && areaStart && event.pointerId === areaPointer) { event.preventDefault(); drawArea(rectangle(areaStart,areaPoint(event))); } });
    canvas.addEventListener('pointerup', async event => {
      if (!selectingArea || !areaStart || event.pointerId !== areaPointer) return;
      event.preventDefault(); const bounds = rectangle(areaStart,areaPoint(event)), sec = section, key = areaKey(section);
      areaStart = null; areaPointer = null; selectingArea = false; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); drawArea(null);
      if (bounds.width < 1 || bounds.height < 1) { refresh(); note('กรุณาลากกรอบให้มีความกว้างและความสูงอย่างน้อย 1% ของผัง'); return; }
      const ok = await save(d => { d.areas ||= {}; d.areas[key] = {...bounds,section:sec}; }, 'บันทึกพื้นที่แผนกแล้ว');
      if (ok && root?.isConnected && section === sec) zoomSection();
    });
    canvas.addEventListener('pointercancel', () => { areaStart = null; areaPointer = null; drawArea(null); });
    root.addEventListener('focusout', () => setTimeout(() => { if (root?.isConnected && !editingControl() && !busy && remotePending) { remotePending = false; refresh(); }; },100));
    rosterSignature = JSON.stringify(roster());
    rosterTimer = setInterval(() => { const sig = JSON.stringify(roster()); if (sig !== rosterSignature) { rosterSignature = sig; remotePending = true; if (!editingControl() && !busy) { remotePending = false; refresh(); } } },3000);
    refresh(); void load();
  }
  window.PPMS_FACTORY_LAYOUT = {
    page: () => `<section id="factoryLayoutPage"><div class="page-head"><div><h2>Layout แยกแผนก · พนักงานประจำเครื่อง</h2><p>เลือก Section จาก Dropdown เพื่อเปิดพื้นที่ของแผนกนั้น · ลากรูปพนักงานไปวางที่เครื่องเพื่อกำหนดผู้รับผิดชอบ</p></div></div><div class="fl-toolbar"><label class="fl-section-choice">เลือก Section<select id="flSection" aria-label="เลือก Section เพื่อดูเฉพาะพื้นที่แผนก"></select></label><label id="flMapChoice" hidden>พื้นที่ใน Section<select id="flMapPicker"></select></label><label>เครื่องจักร<select id="flMachinePicker"></select></label><label>ค้นหาเครื่อง / ชื่อ / รหัสพนักงาน<input id="flSearch" placeholder="ค้นหาตำแหน่งพนักงานหรือเครื่องจักร"></label><button id="flUploadSection" data-fl-write>อัปโหลดผังแผนก</button><button id="flAddMachine">เพิ่มเครื่อง/จุดงาน</button><button id="flSeedStamping" data-fl-write class="secondary">เพิ่ม Stamping 1#–13#</button><button id="flReload" class="secondary">โหลดข้อมูลล่าสุด</button></div><div class="fl-status" data-layout-status role="status"></div><p id="flCounts"></p><div class="fl-grid"><aside class="fl-panel fl-sidebar"><details><summary>เครื่องจักร / จุดงาน</summary><div id="flMachineList"></div></details><h3>เลือกพนักงานใน Section</h3><label class="fl-roster-choice">พนักงาน<select id="flRosterPicker" aria-label="เลือกพนักงานเฉพาะ Section นี้"></select></label><p id="flRosterCount" class="fl-muted"></p><div id="flUnassigned"></div></aside><section class="fl-panel fl-map"><div class="fl-actions"><button id="flZoomOut" class="secondary" aria-label="ย่อผัง">−</button><span id="flZoomLabel" aria-live="polite"></span><select id="flZoomPreset" aria-label="ระดับซูม"><option value="">กำหนดเอง</option><option value="1">100%</option><option value="2">200%</option><option value="4">400%</option><option value="6">600%</option><option value="8">800%</option><option value="10">1000%</option><option value="16">1600%</option></select><button id="flZoomIn" class="secondary" aria-label="ขยายผัง">+</button><button id="flZoomSection">ซูมแผนก</button><button id="flZoomMachine">ซูมเครื่อง</button><button id="flSetArea" data-fl-write class="secondary">กำหนดพื้นที่แผนก</button><button id="flFit" class="secondary">เต็มผังแผนก</button></div><p id="flImageNote" class="fl-hint"></p><div class="fl-viewport"><p id="flNoMap" class="fl-empty" hidden></p><div id="flCanvas"><img id="flImage" alt="ผังเครื่องจักรโรงงาน" draggable="false"><div id="flSavedArea" class="fl-area-outline" hidden></div><div id="flAreaSelection" class="fl-area-selection" hidden></div><div id="flPins"></div></div></div><p class="fl-muted">เลือกรูปพนักงานแล้วเลือกเครื่อง หรือใช้วิธีลากรูปไปวางที่จุดเครื่อง · กดเครื่องเพื่อดูผู้รับผิดชอบ</p><div class="fl-legend">${Object.entries(colors).map(([k,c]) => `<span><i style="background:${c}"></i>${k}</span>`).join('')}</div></section><aside class="fl-panel" id="flDetail"></aside></div></section>`,
    mount
  };
  const style = document.createElement('style');
  style.textContent = `.fl-roster-choice{display:grid;gap:6px;font-size:12px}.fl-roster-choice select{width:100%;min-width:0;padding:9px;border:1px solid #b9cadb;border-radius:7px;font-size:12px}.fl-toolbar label[hidden]{display:none}.fl-section-choice select{min-width:220px;border:2px solid #2563eb!important;background:#eff6ff;font-weight:700}.fl-dialog select{padding:9px;border:1px solid #b9cadb;border-radius:7px;width:100%}.fl-dialog label.fl-keep{display:flex;align-items:center}.fl-dialog .fl-keep input{width:auto}#flNoMap{padding:24px;font-size:14px}#flImage[hidden]{display:none}.fl-sidebar{align-self:start;position:sticky;top:12px}.fl-sidebar summary{cursor:pointer;font-weight:700;margin-bottom:12px}.fl-sidebar h3{margin-top:14px}#flUnassigned{max-height:60vh;overflow:auto;overscroll-behavior:contain}#flZoomPreset{padding:8px;border:1px solid #b9cadb;border-radius:6px}.fl-drop-target{outline:3px solid #16a34a!important;outline-offset:-3px}.fl-sidebar #flMachineList{max-height:190px}@media(max-width:600px){.fl-sidebar{position:static}#flUnassigned{max-height:180px}}#factoryLayoutPage{color:#20364b}.fl-toolbar,.fl-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fl-toolbar label{display:grid;gap:4px;font-size:12px}.fl-toolbar input,.fl-toolbar select,.fl-dialog input,#flDetail input,#flDetail select{padding:9px;border:1px solid #b9cadb;border-radius:7px;min-width:0}.fl-toolbar input{width:240px}.fl-status{padding:10px 12px;background:#edf5ff;border-left:4px solid #2563eb;margin:12px 0;min-height:40px}.fl-grid{display:grid;grid-template-columns:240px minmax(0,1fr) 260px;gap:14px}.fl-panel{background:#fff;border:1px solid #ccdbe8;border-radius:12px;padding:14px;min-width:0}.fl-panel h3{font-size:16px;margin:0 0 12px}.fl-machine{display:block;width:100%;text-align:left;padding:10px;margin:7px 0;background:#f7fafc!important;color:#20364b!important;border:1px solid #cbd5e1!important}.fl-machine.selected{border:2px solid #2563eb!important;background:#eaf3ff!important}.fl-machine small,.fl-person small{display:block;font-size:11px;margin-top:4px;overflow-wrap:anywhere}.fl-viewport{width:100%;height:65vh;min-height:420px;overflow:auto;background:#edf2f7;border:1px solid #cbd5e1;border-radius:8px}.fl-map{overflow:hidden}#flCanvas{position:relative;min-width:100%;line-height:0}#flCanvas.placing{cursor:crosshair}#flCanvas.selecting-area{cursor:crosshair;touch-action:none}.fl-area-outline,.fl-area-selection{position:absolute;pointer-events:none;box-sizing:border-box;z-index:1}.fl-area-outline{border:2px dashed #0ea5e9;background:#0ea5e90c}.fl-area-selection{border:3px solid #f59e0b;background:#f59e0b33}.fl-area-outline[hidden],.fl-area-selection[hidden]{display:none}#flImage{display:block;width:100%;height:auto;user-select:none}#flPins{position:absolute;inset:0;pointer-events:none}.fl-pin{position:absolute;pointer-events:auto;transform:translate(-50%,-50%);background:white!important;color:#20364b!important;border:2px solid var(--pin-color)!important;box-shadow:0 2px 8px #0003;border-radius:8px;padding:5px 8px;max-width:190px;font-size:11px;line-height:1.3}.fl-pin small{display:block;font-size:10px;max-height:65px;overflow:auto}.fl-pin.selected{outline:3px solid #fbbf24;z-index:2}.fl-person{border-left:4px solid var(--person-color);padding:9px;background:#f7fafc;border-radius:6px;margin:8px 0;display:flex;gap:6px;justify-content:space-between;align-items:center}.fl-person b{font-size:13px}.fl-person[draggable="true"]{cursor:grab}.fl-person-selected{outline:3px solid #f59e0b}.fl-photo-wrap{width:42px;height:42px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;position:relative;border:2px solid var(--person-color,#2563eb);border-radius:50%;overflow:hidden;background:#e2e8f0;color:#334155}.fl-photo{width:100%;height:100%;object-fit:cover}.fl-photo[hidden],.fl-photo-fallback[hidden]{display:none}.fl-photo-fallback{font-size:16px;font-weight:800}.fl-pin-people{display:grid;gap:4px;margin-top:5px}.fl-pin-person{display:flex;align-items:center;gap:5px;text-align:left;line-height:1.2}.fl-pin-person .fl-photo-wrap{width:30px;height:30px;border-width:1px}.fl-pin-person>span:last-child{font-size:10px;white-space:normal}.fl-person>div{flex:1;min-width:0}.fl-person button{font-size:11px}.fl-hint{padding:8px;background:#fffbeb;color:#785823;font-size:12px}.fl-muted,.fl-empty{color:#64748b;font-size:12px}.fl-legend{display:flex;flex-wrap:wrap;gap:8px;font-size:11px}.fl-legend i{width:10px;height:10px;display:inline-block;margin-right:4px;border-radius:2px}.fl-pool{margin-top:14px}.fl-pool summary{cursor:pointer;font-weight:700}.fl-pool>div{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}.fl-dialog{border:1px solid #cbd5e1;border-radius:12px;padding:22px;width:min(450px,90vw)}.fl-dialog::backdrop{background:#1238}.fl-dialog label,#flAssign label{display:grid;gap:5px;margin:12px 0}.fl-dialog input,#flAssign input,#flAssign select{width:100%;box-sizing:border-box}.fl-upload input{max-width:210px;font-size:11px}.fl-toolbar button,.fl-actions button{font-size:12px}#flMachineList{max-height:560px;overflow:auto}@media(max-width:1150px){.fl-grid{grid-template-columns:220px minmax(0,1fr)}#flDetail{grid-column:1/-1}.fl-viewport{height:450px}}@media(max-width:600px){.fl-grid{grid-template-columns:1fr}#flDetail{grid-column:auto}#flMachineList{max-height:180px}.fl-viewport{height:320px}.fl-toolbar{align-items:stretch}.fl-toolbar label{width:100%}.fl-toolbar input{width:100%;box-sizing:border-box}}`;
  document.head.append(style);
})();
