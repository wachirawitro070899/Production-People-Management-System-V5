# PPMS V591 — Background Push (ไม่ต้องผูกบัตร)

ระบบนี้ใช้ Firebase Cloud Messaging ฟรีร่วมกับ Cloudflare Workers Free เพื่อตรวจแผนทุก 1 นาที
และส่งแจ้งเตือนก่อนเวลาลูกค้า/Audit 1 ชั่วโมง แม้พนักงานปิดหน้าเว็บ

## 1. สร้าง Cloudflare Worker

1. สมัคร/เข้าสู่ Cloudflare และเลือก Workers & Pages
2. Create application > Worker > Deploy
3. นำไฟล์ `cloudflare-worker/src/worker.js` ไปวาง แล้ว Deploy
4. Settings > Bindings > Add > KV Namespace
5. สร้าง Namespace ชื่อ `PPMS_PUSH_TOKENS` และตั้ง Variable name เป็น `PUSH_TOKENS`
6. Settings > Triggers > Cron Triggers เพิ่ม `* * * * *`

Push Token ของพนักงานเก็บใน Cloudflare KV แบบไม่มีหน้า API สำหรับอ่านกลับ ไม่เก็บใน Firebase สาธารณะ

## 2. ใส่ Secrets (ห้ามใส่ใน GitHub)

Firebase Console > Project settings > Service accounts > Generate new private key
จากไฟล์ JSON ให้นำค่าต่อไปนี้ไปใส่ที่ Worker > Settings > Variables and Secrets:

- `FIREBASE_CLIENT_EMAIL` = ค่า `client_email`
- `FIREBASE_PRIVATE_KEY` = ค่า `private_key` (เลือก Encrypt)
- `CRON_SECRET` = ตั้งข้อความสุ่มยาวอย่างน้อย 32 ตัวอักษร (เลือก Encrypt)

ห้ามส่งไฟล์ JSON หรือ Private Key ทาง LINE/แชต และห้ามอัปโหลดเข้า GitHub

## 3. เชื่อม URL กลับมายังหน้าเว็บ

หลัง Deploy ให้คัดลอก URL เช่น `https://ppms-background-push.xxxxx.workers.dev`
แล้วใส่ในไฟล์ `firebase-config.js`:

```js
window.PPMS_PUSH_WORKER_URL = "https://ppms-background-push.xxxxx.workers.dev";
```

เปิด `https://YOUR-WORKER.workers.dev/health` ต้องเห็น `{"ok":true}`

## 4. ทดสอบพนักงาน

1. Android: เปิดเว็บด้วย Chrome > กดปุ่ม “เปิดแจ้งเตือน”
2. iPhone: เปิดด้วย Safari > Share > Add to Home Screen > เปิดจากไอคอน > กด “เปิดแจ้งเตือน”
3. Admin สร้างแผนเวลาเข้าพื้นที่ เช่น 10:00 ระบบกำหนดส่ง 09:00
4. ปิดเว็บแล้วรอรับ Notification

พนักงานแต่ละเครื่องต้องอนุญาต Notification หนึ่งครั้ง และ iPhone ต้องเปิดจากไอคอนบน Home Screen
