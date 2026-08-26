/* PPMS V591 Firebase background messaging service worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB4hIpI6bLI7L-CZ9JY0XjFnGrwTmVQ3bE',
  authDomain: 'wachirawit-c8582.firebaseapp.com',
  projectId: 'wachirawit-c8582',
  storageBucket: 'wachirawit-c8582.firebasestorage.app',
  messagingSenderId: '860073002133',
  appId: '1:860073002133:web:65ecba09c0c3cd4702879c'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || (data.type === 'audit' ? 'แจ้งเตือน: มี Audit' : 'แจ้งเตือน: มีผู้เยี่ยมชม');
  return self.registration.showNotification(title, {
    body: data.body || 'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.tag || 'ppms-visitor-alert',
    requireInteraction: true,
    data: { url: data.url || './' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if (client.url.startsWith(self.location.origin)) {
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
