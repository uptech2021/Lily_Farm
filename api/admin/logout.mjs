import { clearSessionCookie, json } from './_auth.mjs';

export default {
  fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { allow: 'POST' });
    return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
  }
};
