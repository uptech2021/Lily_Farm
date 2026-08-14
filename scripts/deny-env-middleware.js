module.exports = function denyEnvironmentFiles(req, res, next) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.statusCode = 400;
    res.end("Bad Request");
    return;
  }

  if (/(^|\/)\.env(?:\.|$)/i.test(pathname)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not Found");
    return;
  }

  next();
};
