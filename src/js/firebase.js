const firebaseConfig = window.__FB_CONFIG;

if (!firebaseConfig) {
  throw new Error(
    "Firebase config not found. " +
    "Copy src/js/firebase-config.example.js to src/js/firebase-config.js " +
    "and fill in your Firebase project values."
  );
}

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const SESSION_KEY = "lilyFarmSession";

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function fbGetCart() {
  try {
    const doc = await db.collection("carts").doc(getSessionId()).get();
    return doc.exists ? doc.data().items || [] : [];
  } catch {
    return [];
  }
}

async function fbSaveCart(items) {
  try {
    await db.collection("carts").doc(getSessionId()).set({
      items,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("Firebase save failed:", e);
  }
}

async function fbAddToCart(productId) {
  const items = await fbGetCart();
  const existing = items.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ id: productId, qty: 1 });
  }
  await fbSaveCart(items);
  return items;
}

async function fbUpdateQty(productId, delta) {
  let items = await fbGetCart();
  const item = items.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    items = items.filter(i => i.id !== productId);
  }
  await fbSaveCart(items);
  return items;
}

async function fbRemoveItem(productId) {
  const items = (await fbGetCart()).filter(i => i.id !== productId);
  await fbSaveCart(items);
  return items;
}

async function fbClearCart() {
  await fbSaveCart([]);
  return [];
}

window.db = db;
window.fbGetCart = fbGetCart;
window.fbAddToCart = fbAddToCart;
window.fbUpdateQty = fbUpdateQty;
window.fbRemoveItem = fbRemoveItem;
window.fbClearCart = fbClearCart;
