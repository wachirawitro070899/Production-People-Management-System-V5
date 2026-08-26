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
    return input?.value?.trim() || '';
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
    const response = await fetch(workerUrl + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        employeeCode: employeeCode(),
        shift: localStorage.getItem('ppms_employee_shift') || currentShift()
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
  document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 2500));
})();