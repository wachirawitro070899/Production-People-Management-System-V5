const PROJECT_ID = 'wachirawit-c8582';
const DATABASE_URL = 'https://wachirawit-c8582-default-rtdb.asia-southeast1.firebasedatabase.app';
const APP_URL = 'https://wachirawitro070899.github.io/Production-People-Management-System-V5/';
const ALLOWED_ORIGIN = 'https://wachirawitro070899.github.io';

export default {
  async scheduled(controller, env, ctx) { ctx.waitUntil(processDuePlans(env)); },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (url.pathname === '/health') return cors(Response.json({ ok: true, service: 'PPMS Push V591' }));
    if (url.pathname === '/register' && request.method === 'POST') return registerDevice(request, env);
    if (url.pathname === '/run' && request.headers.get('Authorization') === `Bearer ${env.CRON_SECRET}`) {
      return cors(Response.json(await processDuePlans(env)));
    }
    return cors(new Response('PPMS Push Worker V591'));
  }
};

async function registerDevice(request, env) {
  const origin = request.headers.get('Origin');
  if (origin !== ALLOWED_ORIGIN) return cors(new Response('Origin not allowed', { status: 403 }));
  const body = await request.json();
  if (!body.token || typeof body.token !== 'string' || body.token.length > 4096) {
    return cors(Response.json({ ok: false, error: 'Invalid token' }, { status: 400 }));
  }
  const id = await sha256(body.token);
  await env.PUSH_TOKENS.put(id, JSON.stringify({
    token: body.token,
    employeeCode: String(body.employeeCode || '').slice(0, 40),
    shift: ['day', 'night', 'all'].includes(body.shift) ? body.shift : 'all',
    enabled: true,
    updatedAt: Date.now()
  }));
  return cors(Response.json({ ok: true }));
}

async function processDuePlans(env) {
  const now = Date.now();
  const plansResponse = await fetch(`${DATABASE_URL}/ppmsAlertPlans.json`);
  if (!plansResponse.ok) throw new Error('Cannot read Firebase alert plans');
  const plans = await plansResponse.json() || {};
  const duePlans = Object.entries(plans).filter(([, plan]) => {
    const at = Number(plan?.scheduledAt || 0);
    return at && !plan.pushSentAt && at <= now && now <= at + 3600000;
  });
  if (!duePlans.length) return { ok: true, checkedAt: now, plansSent: 0, devicesSent: 0 };

  const tokenList = await readTokens(env);
  const accessToken = await getGoogleAccessToken(env);
  let plansSent = 0, devicesSent = 0;
  for (const [planId, plan] of duePlans) {
    const targets = tokenList.filter(item =>
      item?.enabled !== false && item?.token && (plan.shift === 'all' || !plan.shift || item.shift === plan.shift)
    );
    const results = await Promise.allSettled(targets.map(item => sendMessage(accessToken, item.token, plan, planId)));
    devicesSent += results.filter(result => result.status === 'fulfilled').length;
    await fetch(`${DATABASE_URL}/ppmsAlertPlans/${encodeURIComponent(planId)}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushSentAt: now, pushDeviceCount: targets.length })
    });
    plansSent++;
  }
  return { ok: true, checkedAt: now, plansSent, devicesSent };
}

async function readTokens(env) {
  const items = [];
  let cursor;
  do {
    const page = await env.PUSH_TOKENS.list({ cursor });
    const values = await Promise.all(page.keys.map(key => env.PUSH_TOKENS.get(key.name, 'json')));
    items.push(...values.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return items;
}

async function sendMessage(accessToken, token, plan, planId) {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      token,
      data: {
        title: plan.type === 'audit' ? 'แจ้งเตือน: มี Audit' : 'แจ้งเตือน: มีผู้เยี่ยมชม',
        body: String(plan.message || 'กรุณาจัดเตรียมพื้นที่และปฏิบัติตามมาตรฐาน'),
        type: String(plan.type || 'visitor'),
        shift: String(plan.shift || 'all'),
        tag: `ppms-plan-${planId}`,
        url: APP_URL
      },
      webpush: { headers: { Urgency: 'high', TTL: '3600' } }
    }})
  });
  if (!response.ok) throw new Error(`FCM ${response.status}: ${await response.text()}`);
}

async function getGoogleAccessToken(env) {
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) throw new Error('Missing Firebase secrets');
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const key = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(env.FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`));
  const assertion = `${header}.${claim}.${base64UrlBytes(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  if (!response.ok) throw new Error(`OAuth ${response.status}: ${await response.text()}`);
  return (await response.json()).access_token;
}

function cors(response) {
  const out = new Response(response.body, response);
  out.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  out.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  out.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  out.headers.set('X-Content-Type-Options', 'nosniff');
  return out;
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function pemToArrayBuffer(pem) {
  const value = pem.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  return Uint8Array.from(atob(value), c => c.charCodeAt(0)).buffer;
}
function base64Url(text) { return base64UrlBytes(new TextEncoder().encode(text)); }
function base64UrlBytes(bytes) {
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
