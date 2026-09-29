import entry from '../../server/admin/entry.mjs';
import login from '../../server/admin/login.mjs';
import logout from '../../server/admin/logout.mjs';
import page from '../../server/admin/page.mjs';
import session from '../../server/admin/session.mjs';

const handlers = { entry, login, logout, page, session };

export default {
  fetch(request) {
    const action = new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
    const handler = handlers[action];

    if (!handler) {
      return new Response('Not Found', { status: 404 });
    }

    return handler.fetch(request);
  }
};
