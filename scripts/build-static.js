const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");

const pages = [
  "index.html",
  "products.html",
  "product-detail.html",
  "cart.html",
  "checkout.html",
  "contact.html",
  "faq.html",
  "gallery.html"
];

const directories = [
  ["img", "img"],
  ["src/css", "src/css"],
  ["src/js", "src/js"],
  ["src/components", "src/components"],
  ["src/assets", "src/assets"]
];

function copy(relativeSource, relativeDestination = relativeSource) {
  const source = path.join(root, relativeSource);
  const destination = path.join(output, relativeDestination);

  if (!fs.existsSync(source)) {
    throw new Error(`Required build input is missing: ${relativeSource}`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const configResult = spawnSync(
  process.execPath,
  [path.join(__dirname, "generate-firebase-config.js")],
  { cwd: root, env: process.env, stdio: "inherit" }
);

if (configResult.status !== 0) {
  process.exit(configResult.status || 1);
}

for (const page of pages) copy(page);
for (const [source, destination] of directories) copy(source, destination);

// Admin HTML is deliberately excluded from static output. It is bundled into
// api/admin/page.mjs and is only returned after session validation.
fs.rmSync(path.join(output, "src", "admin"), {
  recursive: true,
  force: true
});

const generatedConfig = path.join(output, "src", "js", "firebase-config.js");
if (!fs.existsSync(generatedConfig)) {
  throw new Error("Firebase configuration was not included in the build output");
}

const missingAssets = [];
for (const page of pages) {
  const html = fs.readFileSync(path.join(output, page), "utf8");
  const references = html.matchAll(/(?:src|href)=["']([^"']+)["']/g);

  for (const [, rawReference] of references) {
    const reference = rawReference.split(/[?#]/)[0];
    if (
      !reference ||
      /^(?:https?:|mailto:|tel:|javascript:|#)/i.test(reference) ||
      /^\/(?:api|admin)(?:\/|$)/.test(reference)
    ) {
      continue;
    }

    const decoded = decodeURIComponent(reference).replace(/^\//, "");
    const assetPath = path.resolve(output, path.dirname(page), decoded);
    if (!assetPath.startsWith(output) || !fs.existsSync(assetPath)) {
      missingAssets.push(`${page}: ${rawReference}`);
    }
  }
}

if (missingAssets.length) {
  throw new Error(`Missing static assets:\n${missingAssets.join("\n")}`);
}

console.log(`Static site built in ${path.relative(root, output)} (${pages.length} pages)`);
