const projectId = process.env.FIREBASE_PROJECT_ID || 'lilyfarm-91e57';
const apiKey = process.env.FIREBASE_API_KEY || '';
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function url(path) { return `${base}/${path}${apiKey ? `?key=${encodeURIComponent(apiKey)}` : ''}`; }
function decode(v) {
  if (!v) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
function decodeFields(fields) { return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)])); }
function encode(value) {
  if (value == null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)])) } };
}

export async function getDocument(collection, id) {
  const response = await fetch(url(`${collection}/${encodeURIComponent(id)}`), { headers: { accept: 'application/json' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
  const raw = await response.json();
  return { id, ...decodeFields(raw.fields || {}) };
}

export async function updateDocument(collection, id, updates) {
  const masks = Object.keys(updates).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
  const endpoint = `${base}/${collection}/${encodeURIComponent(id)}?${masks}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
  const fields = {};
  Object.entries(updates).forEach(([path, value]) => {
    const parts = path.split('.');
    if (parts.length === 1) fields[path] = encode(value);
    else {
      const [head, tail] = parts;
      const existing = fields[head] || { mapValue: { fields: {} } };
      existing.mapValue.fields[tail] = encode(value);
      fields[head] = existing;
    }
  });
  const response = await fetch(endpoint, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields }) });
  if (!response.ok) throw new Error(`Firestore update failed (${response.status})`);
  return response.json();
}

export async function getSettings() { return (await getDocument('settings', 'global')) || {}; }
