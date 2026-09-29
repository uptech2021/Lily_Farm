import { initializeApp, getApps } from 'firebase/app';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { readUnsubscribeToken } from './_email.mjs';

function htmlPage(title, message, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#f6f4ec;color:#173c2b;font:16px Arial,sans-serif"><main style="max-width:560px;margin:10vh auto;padding:36px;border:1px solid #dce4d9;border-radius:18px;background:#fff;text-align:center"><div style="font-size:32px">🌿</div><h1 style="font:36px Georgia,serif">${title}</h1><p style="color:#5f6e65;line-height:1.7">${message}</p><a href="/" style="display:inline-block;margin-top:12px;padding:12px 20px;border-radius:99px;background:#2f9b60;color:#fff;text-decoration:none;font-weight:700">Return to the farm</a></main></body></html>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function firestore() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  if (!config.apiKey || !config.projectId) throw new Error('Firebase server configuration is incomplete.');
  return getFirestore(getApps()[0] || initializeApp(config));
}

export default {
  async fetch(request) {
    const token = new URL(request.url).searchParams.get('token') || '';
    const payload = readUnsubscribeToken(token);
    if (!payload) return htmlPage('Invalid unsubscribe link', 'This link is invalid or has been changed. Please contact the farm if you still need help.', 400);
    try {
      const subscriberId = encodeURIComponent(payload.email).replace(/\./g, '%2E');
      await setDoc(doc(firestore(), 'newsletterSubscribers', subscriberId), {
        email: payload.email,
        status: 'unsubscribed',
        unsubscribedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return htmlPage('You are unsubscribed', 'You will no longer receive promotional newsletters from Rishi\'s Lily Farm. You can join again from the website at any time.');
    } catch (error) {
      console.error('Unsubscribe failed:', error.message);
      return htmlPage('We could not update your subscription', 'Please try again shortly or contact Rishi\'s Lily Farm for help.', 500);
    }
  }
};
