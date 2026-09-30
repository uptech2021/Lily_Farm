import entry from '../../server/admin/entry.mjs';
import login from '../../server/admin/login.mjs';
import logout from '../../server/admin/logout.mjs';
import page from '../../server/admin/page.mjs';
import session from '../../server/admin/session.mjs';

const handlers = { entry, login, logout, page, session };

export default {
  fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const segment = pathname.split('/').filter(Boolean).at(-1);
    // Vercel rewrites preserve the public /admin URL in the Request object.
    // Treat that route as the entry action instead of returning a false 404.
    const action = url.searchParams.has('file') ? 'page' : segment === 'admin' ? 'entry' : segment;
    const handler = handlers[action];

    if (!handler) {
      return new Response('Not Found', { status: 404 });
    }

    return handler.fetch(request);
  }
};
