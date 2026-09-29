const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator < 1) return;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  });
}

loadEnv(path.join(root, ".env"));

const port = Number(process.env.PORT || 3000);
const adminEmail = process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessions = new Map();
const attempts = new Map();
const SESSION_COOKIE = "lily_admin_session";
const types = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp"
};

function json(res, status, payload, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
  }));
}

function sessionFor(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function safeEqual(actual, expected) {
  const left = Buffer.from(String(actual));
  const right = Buffer.from(String(expected));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function readJson(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 16384) req.destroy();
  });
  req.on("end", () => {
    try { callback(null, JSON.parse(body || "{}")); } catch (error) { callback(error); }
  });
}

function handleApi(req, res, pathname) {
  if (pathname === "/api/admin/session" && req.method === "GET") {
    json(res, 200, { authenticated: Boolean(sessionFor(req)) });
    return true;
  }
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const client = req.socket.remoteAddress || "local";
    const recent = (attempts.get(client) || []).filter((time) => Date.now() - time < 15 * 60 * 1000);
    if (recent.length >= 5) {
      json(res, 429, { error: "Too many attempts. Please try again later." });
      return true;
    }
    readJson(req, (error, body) => {
      if (error) return json(res, 400, { error: "Invalid request." });
      const valid = adminEmail && adminPassword && safeEqual(String(body.email || "").trim().toLowerCase(), adminEmail.trim().toLowerCase()) && safeEqual(body.password || "", adminPassword);
      if (!valid) {
        attempts.set(client, [...recent, Date.now()]);
        return json(res, 401, { error: "Email or password is incorrect." });
      }
      attempts.delete(client);
      const token = crypto.randomBytes(32).toString("base64url");
      const maxAge = body.remember ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
      sessions.set(token, { email: adminEmail, expiresAt: Date.now() + maxAge * 1000 });
      json(res, 200, { ok: true }, { "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}` });
    });
    return true;
  }
  if (pathname === "/api/admin/logout" && req.method === "POST") {
    const session = sessionFor(req);
    if (session) sessions.delete(session.token);
    json(res, 200, { ok: true }, { "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
    return true;
  }
  return false;
}

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end("Bad Request"); return; }

  if (handleApi(req, res, pathname)) return;
  if (/(^|\/)\./.test(pathname)) { res.writeHead(404).end("Not Found"); return; }

  if (pathname === "/admin" || pathname === "/admin/") {
    const destination = sessionFor(req) ? "/src/admin/dashboard.html" : "/src/admin/login.html";
    res.writeHead(302, { Location: destination, "Cache-Control": "no-store" }).end();
    return;
  }

  const isAdminPage = pathname.startsWith("/src/admin/") && pathname.endsWith(".html");
  const isLoginPage = pathname === "/src/admin/login.html";
  const session = sessionFor(req);
  if (isAdminPage && !isLoginPage && !session) {
    res.writeHead(302, { Location: "/src/admin/login.html", "Cache-Control": "no-store" }).end();
    return;
  }
  if (isLoginPage && session) {
    sessions.delete(session.token);
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end("Not Found"); return; }

  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) { res.writeHead(404).end("Not Found"); return; }
    const headers = { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" };
    if (isAdminPage) headers["Cache-Control"] = "no-store";
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, "127.0.0.1", () => {
  if (!adminEmail || !adminPassword) console.warn("Admin login is disabled until ADMIN_EMAIL and ADMIN_PASSWORD are set in .env");
  console.log(`Lily Farm is live at http://127.0.0.1:${port}`);
});
