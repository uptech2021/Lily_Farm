import { isAdmin, json, smtpConfig, transporter } from './_email.mjs';

export default {
  async fetch(request) {
    if (!isAdmin(request)) return json({ error: 'Unauthorized.' }, 401);
    const config = smtpConfig();
    if (!config.ready) return json({ configured: false, missing: config.missing });
    try {
      await transporter().verify();
      return json({ configured: true, connected: true, sender: config.fromAddress });
    } catch (error) {
      return json({ configured: true, connected: false, error: 'Gmail SMTP authentication failed. Check the app password and account settings.' });
    }
  }
};
