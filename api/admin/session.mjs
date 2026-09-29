import { json, readSession } from './_auth.mjs';

export default {
  fetch(request) {
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, { allow: 'GET' });
    return json({ authenticated: Boolean(readSession(request)) });
  }
};
