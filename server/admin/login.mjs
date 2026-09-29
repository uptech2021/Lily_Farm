import { createSession, json, safeEqual, sessionCookie } from './_auth.mjs';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { allow: 'POST' });
    const adminEmail = process.env.ADMIN_EMAIL || '';
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (!adminEmail || !adminPassword || !process.env.ADMIN_SESSION_SECRET) {
      return json({ error: 'Admin login is not configured on the server.' }, 503);
    }
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid request.' }, 400); }
    const valid = safeEqual(String(body.email || '').trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
      safeEqual(body.password || '', adminPassword);
    if (!valid) return json({ error: 'Email or password is incorrect.' }, 401);
    const maxAge = body.remember ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
    const token = createSession(adminEmail, maxAge);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token, maxAge) });
  }
};
