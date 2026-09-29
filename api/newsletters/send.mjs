import { fromHeader, isAdmin, json, transporter, withUnsubscribe } from './_email.mjs';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    if (!isAdmin(request)) return json({ error: 'Unauthorized.' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
    const recipients = Array.from(new Set((Array.isArray(body.recipients) ? body.recipients : [])
      .map((value) => String(value).trim().toLowerCase())
      .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))));
    if (!recipients.length) return json({ error: 'There are no active subscribers to email.' }, 400);
    if (recipients.length > 100) return json({ error: 'Gmail campaigns are limited to 100 recipients per send for safety.' }, 400);
    const subject = String(body.subject || '').trim().slice(0, 180);
    const html = String(body.html || '').trim();
    if (!subject || !html) return json({ error: 'Subject and newsletter content are required.' }, 400);
    const mailer = transporter();
    const results = [];
    for (const recipient of recipients) {
      try {
        const sent = await mailer.sendMail({ from: fromHeader(), to: recipient, subject, html: withUnsubscribe(html, recipient, request) });
        results.push({ email: recipient, status: 'sent', messageId: sent.messageId });
      } catch (error) {
        console.error(`Newsletter send failed for ${recipient}:`, error.message);
        results.push({ email: recipient, status: 'failed' });
      }
    }
    const sent = results.filter((item) => item.status === 'sent').length;
    return json({ ok: sent === results.length, sent, failed: results.length - sent, results }, sent ? 200 : 502);
  }
};
