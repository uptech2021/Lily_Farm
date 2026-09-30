import fs from 'node:fs/promises';
import path from 'node:path';
import { readSession } from './_auth.mjs';

const allowedPages = new Set([
  'login.html',
  'dashboard.html', 'faqs.html', 'gallery.html', 'orders.html',
  'pricing-availability.html', 'products.html', 'profile.html',
  'reviews.html', 'settings.html', 'newsletters.html'
]);

export default {
  async fetch(request) {
    const page = new URL(request.url).searchParams.get('file') || '';
    if (page !== 'login.html' && !readSession(request)) {
      return Response.redirect(new URL('/src/admin/login.html', request.url), 302);
    }
    if (!allowedPages.has(page)) return new Response('Not Found', { status: 404 });
    try {
      const html = await fs.readFile(path.join(process.cwd(), 'src', 'admin', page), 'utf8');
      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' }
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
};
