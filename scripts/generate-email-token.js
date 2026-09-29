const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64url');

console.log('Generated EMAIL_TOKEN_SECRET (store this privately in .env and Vercel):');
console.log(secret);
console.log('\nDo not commit or share this value.');
