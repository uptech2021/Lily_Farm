import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { readSession } from '../../server/admin/_auth.mjs';

export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export function isAdmin(request) {
  const localSecret = process.env.LILY_LOCAL_API_SECRET || '';
  const localHeader = request.headers.get('x-lily-local-api') || '';
  return Boolean(readSession(request) || (localSecret && localHeader === localSecret));
}

export function smtpConfig() {
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true';
  const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_APP_PASSWORD', 'EMAIL_FROM_ADDRESS']
    .filter((key) => !String(process.env[key] || '').trim());
  return {
    ready: missing.length === 0,
    missing,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    user: process.env.SMTP_USER || '',
    password: String(process.env.SMTP_APP_PASSWORD || '').replace(/\s+/g, ''),
    fromName: process.env.EMAIL_FROM_NAME || "Rishi's Lily Farm",
    fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || ''
  };
}

export function transporter() {
  const config = smtpConfig();
  if (!config.ready) throw new Error(`Email is not configured: ${config.missing.join(', ')}`);
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });
}

export function fromHeader() {
  const config = smtpConfig();
  return { name: config.fromName, address: config.fromAddress };
}

export function publicOrigin(request) {
  const url = new URL(request.url);
  return url.origin;
}

function tokenSecret() {
  return process.env.EMAIL_TOKEN_SECRET || '';
}

export function unsubscribeToken(email) {
  if (!tokenSecret()) throw new Error('EMAIL_TOKEN_SECRET is not configured.');
  const normalized = String(email || '').trim().toLowerCase();
  const payload = Buffer.from(JSON.stringify({ email: normalized, issuedAt: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readUnsubscribeToken(token) {
  if (!tokenSecret() || !token || !token.includes('.')) return null;
  const separator = token.lastIndexOf('.');
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email || '') ? value : null;
  } catch { return null; }
}

export function withUnsubscribe(html, email, request) {
  const token = unsubscribeToken(email);
  const link = `${publicOrigin(request)}/api/newsletters/unsubscribe?token=${encodeURIComponent(token)}`;
  return `${html}<div style="margin:32px auto 0;padding:20px;border-top:1px solid #dfe7df;text-align:center;color:#718078;font:12px Arial,sans-serif;line-height:1.6">You received this because you subscribed to Rishi's Lily Farm updates.<br><a href="${link}" style="color:#2f7f51">Unsubscribe</a></div>`;
}
