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

// ============ ORDER MANAGEMENT ============
async function fbSaveOrder(orderData) {
  try {
    const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const order = {
      orderId,
      sessionId: getSessionId(),
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      deliveryOption: orderData.deliveryOption,
      paymentMethod: orderData.paymentMethod,
      region: orderData.region || null,
      address: orderData.address || null,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection("orders").doc(orderId).set(order);
    console.log("Order saved:", orderId);
    return orderId;
  } catch (e) {
    console.error("Firebase order save failed:", e);
    throw e;
  }
}

async function fbGetOrders() {
  try {
    const snapshot = await db.collection("orders")
      .where("sessionId", "==", getSessionId())
      .orderBy("createdAt", "desc")
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    console.error("Firebase get orders failed:", e);
    return [];
  }
}

async function fbGetOrderById(orderId) {
  try {
    const doc = await db.collection("orders").doc(orderId).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error("Firebase get order failed:", e);
    return null;
  }
}

async function fbUpdateOrderStatus(orderId, status) {
  try {
    await db.collection("orders").doc(orderId).update({
      status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Order status updated:", orderId, status);
  } catch (e) {
    console.error("Firebase update order status failed:", e);
  }
}

// ============ CUSTOMER DATA ============
async function fbSaveCustomer(customerData) {
  try {
    await db.collection("customers").doc(getSessionId()).set({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("Firebase save customer failed:", e);
  }
}

async function fbGetCustomer() {
  try {
    const doc = await db.collection("customers").doc(getSessionId()).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error("Firebase get customer failed:", e);
    return null;
  }
}

// ============ ANALYTICS ============
async function fbLogActivity(action, data) {
  try {
    await db.collection("analytics").add({
      sessionId: getSessionId(),
      action,
      data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("Firebase analytics log failed:", e);
  }
}

// ============ WINDOW EXPORTS ============
window.fbSaveOrder = fbSaveOrder;
window.fbGetOrders = fbGetOrders;
window.fbGetOrderById = fbGetOrderById;
window.fbUpdateOrderStatus = fbUpdateOrderStatus;
window.fbSaveCustomer = fbSaveCustomer;
window.fbGetCustomer = fbGetCustomer;
window.fbLogActivity = fbLogActivity;
