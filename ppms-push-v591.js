(function () {
  'use strict';
  const VAPID_KEY = 'BIqOn0asCDx-ilQGLGeqJuQ6v3NfuT2AvJ5JAw9Tl3LL_rPsfQbp5Pe3BK_EcjSXqd0RWGEDAzSy8ZWZn28EaHM';

  function supported() {
    return 'serviceWorker' in navigator && 'Notification' in window && typeof firebase !== 'undefined' && firebase.messaging;
  }
  function currentShift() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? 'day' : 'night';
  }
  function employeeCode() {
    const keys = ['ppms_employee_code', 'employeeCode', 'attendanceEmployeeCode'];
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) return String(value).trim();
    }
    const input = document.querySelector('input[id*="employee"][id*="code"],#attendanceEmployeeId,#employeeCode');
    return input?.value?.trim() || sessionStorage.getItem('attendanceEmp') || '';
  }
  function normalized(value) {
    return String(value || '').trim().toUpperCase().replace(/[\s._\-/]+/g, '');
  }
  function bangkokDateKey(value) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(value || Date.now()));
    const get = type => parts.find(part => part.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function employeeShift(code, value) {
    try {
      const list = JSON.parse(localStorage.getItem('ppms_v3_employees') || '[]');
      const schedules = JSON.parse(localStorage.getItem('ppms_v3_shift_schedules') || '{}');
      const key = normalized(code);
      const emp = Array.isArray(list) ? list.find(item => normalized(item?.id) === key) : null;
      const date = bangkokDateKey(value);
      const rules = Object.values(schedules || {}).filter(rule => {
        if (!rule || rule.deleted || normalized(rule.section) !== normalized(emp?.section)) return false;
        if (date < String(rule.startDate || '') || date > String(rule.endDate || '')) return false;
        if (rule.scope === 'employee') return normalized(rule.employeeId) === key;
        return rule.scope === 'team' && normalized(rule.team) === normalized(emp?.team);
      }).sort((a, b) => {
        const priority = rule => rule.scope === 'employee' ? 2 : 1;
        return priority(b) - priority(a) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
      });
      const assigned = String(rules[0]?.shift || emp?.attendanceShift || emp?.attShift || emp?.shift || '').toLowerCase();
      if (/night|กลางคืน|ดึก/.test(assigned)) return 'night';
      if (/day|กลางวัน|เช้า/.test(assigned)) return 'day';
    } catch (_) {}
    return currentShift();
  }
  function iosStandaloneRequired() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.matchMedia('(display-mode: standalone)').matches &&
      !navigator.standalone;
  }
  async function enable() {
    if (!supported()) throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Push');
    if (iosStandaloneRequired()) {
      throw new Error('iPhone: กรุณาเปิดด้วย Safari แล้วกด Share > Add to Home Screen ก่อน');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('ยังไม่ได้อนุญาต Notification');
    if (!firebase.apps.length) firebase.initializeApp(window.PPMS_FIREBASE_CONFIG);
    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) throw new Error('ไม่สามารถสร้างโทเคนแจ้งเตือนได้');
    const workerUrl = String(window.PPMS_PUSH_WORKER_URL || '').replace(/\/$/, '');
    if (!workerUrl) throw new Error('ระบบ Push ยังไม่ได้ใส่ Cloudflare Worker URL');
    const code=employeeCode(),shift=employeeShift(code);if(code)localStorage.setItem('ppms_employee_code',code);localStorage.setItem('ppms_employee_shift',shift);
    const response = await fetch(workerUrl + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        employeeCode: code,
        shift
      })
    });
    if (!response.ok) throw new Error('ลงทะเบียนเครื่องกับ Push Server ไม่สำเร็จ (' + response.status + ')');
    localStorage.setItem('ppms_push_enabled', '1');
    return true;
  }
  async function refresh() {
    if (Notification.permission !== 'granted' || localStorage.getItem('ppms_push_enabled') !== '1') return false;
    try { return await enable(); } catch (error) { console.warn('PPMS push refresh failed', error); return false; }
  }
  window.PPMSPush = { enable, refresh, supported };
  document.addEventListener('change',event=>{if(!event.target?.matches?.('#attendanceEmployeeId,#employeeCode,input[id*="employee"][id*="code"]'))return;const code=String(event.target.value||'').trim();if(!code)return;localStorage.setItem('ppms_employee_code',code);localStorage.setItem('ppms_employee_shift',employeeShift(code));setTimeout(refresh,500)});
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refresh, 2500);
    setInterval(refresh, 10 * 60 * 1000);
  });
})();
