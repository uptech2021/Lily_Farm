import { readSession } from './_auth.mjs';

export default {
  fetch(request) {
    const destination = readSession(request)
      ? '/src/admin/dashboard.html'
      : '/src/admin/login.html';
    return Response.redirect(new URL(destination, request.url), 302);
  }
};
