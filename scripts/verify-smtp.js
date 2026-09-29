const fs = require('fs');
const path = require('path');

for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const separator = line.indexOf('=');
  if (separator < 1 || /^\s*#/.test(line)) continue;
  const key = line.slice(0, separator).trim();
  const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  if (!(key in process.env)) process.env[key] = value;
}

import('../api/newsletters/_email.mjs').then(async (email) => {
  const config = email.smtpConfig();
  if (!config.ready) throw new Error(`SMTP configuration is incomplete: ${config.missing.join(', ')}`);
  await email.transporter().verify();
  console.log('Gmail SMTP authentication verified.');
}).catch((error) => {
  console.error(`Gmail SMTP verification failed: ${error.message}`);
  process.exitCode = 1;
});
