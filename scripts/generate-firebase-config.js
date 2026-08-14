const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const outputPath = path.join(root, "src", "js", "firebase-config.js");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env file. Copy .env.example to .env and add your Firebase values.");
  process.exit(1);
}

const env = {};
for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;

  const separator = line.indexOf("=");
  if (separator === -1) continue;

  const key = line.slice(0, separator).trim();
  let value = line.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const mapping = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID",
  measurementId: "FIREBASE_MEASUREMENT_ID"
};

const missing = Object.values(mapping).filter(key => !env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const config = Object.fromEntries(
  Object.entries(mapping).map(([property, key]) => [property, env[key]])
);

const source = `// Generated from .env. Do not edit or commit this file.\nwindow.__FB_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(outputPath, source, "utf8");
console.log("Generated src/js/firebase-config.js");
