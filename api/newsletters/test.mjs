import { fromHeader, isAdmin, json, smtpConfig, transporter } from './_email.mjs';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    if (!isAdmin(request)) return json({ error: 'Unauthorized.' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
    const config = smtpConfig();
    if (!config.ready) return json({ error: `Missing email configuration: ${config.missing.join(', ')}` }, 503);
    const recipient = String(body.to || config.user).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return json({ error: 'A valid test recipient is required.' }, 400);
    try {
      const result = await transporter().sendMail({
        from: fromHeader(),
        to: recipient,
        subject: String(body.subject || "Rishi's Lily Farm email test").slice(0, 180),
        text: 'Your Gmail SMTP connection is working. This is a test from Rishi\'s Lily Farm.',
        html: String(body.html || '<div style="font:16px Arial,sans-serif;padding:28px"><h2 style="color:#174f36">Your email connection is blooming.</h2><p>Gmail SMTP is connected successfully to Rishi\'s Lily Farm.</p></div>')
      });
      return json({ ok: true, messageId: result.messageId });
    } catch (error) {
      console.error('SMTP test failed:', error.message);
      return json({ error: 'Gmail could not send the test email. Check SMTP_USER and SMTP_APP_PASSWORD.' }, 502);
    }
  }
};
