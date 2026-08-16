const firebaseConfig = window.__FB_CONFIG;

let db;

// Try to initialize Firebase, but provide mock data as fallback
if (firebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } catch (e) {
    console.warn("Firebase initialization failed, using mock data:", e);
    db = createMockDatabase();
  }
} else {
  console.warn("Firebase config not found, using mock data for testing");
  db = createMockDatabase();
}

function createMockDatabase() {
  // Mock FAQ data for testing/demo purposes
  const mockFAQs = [
    {
      id: '1',
      section: 'General Questions',
      sectionIcon: 'fa-question-circle',
      question: 'Are you the only place in Trinidad to get these lilies?',
      answer: 'Yes! Rishi\'s Lily Farm is uniquely positioned as the only dedicated lily and exotic plant nursery in Trinidad. We specialize in rare varieties that you won\'t find elsewhere on the island. Our collection includes over 50 varieties of lilies and lotus species, along with exotic ornamentals from around the world.',
      order: 1,
      status: 'published'
    },
    {
      id: '2',
      section: 'General Questions',
      sectionIcon: 'fa-question-circle',
      question: 'Can I visit the farm to see the plants?',
      answer: 'Yes, we welcome visitors to our farm! You can see our full collection of lilies and exotic plants in their natural growing environment. Please contact us in advance to schedule a visit, especially during peak growing seasons.',
      order: 2,
      status: 'published'
    },
    {
      id: '3',
      section: 'General Questions',
      sectionIcon: 'fa-question-circle',
      question: 'Do you offer planting services or consultations?',
      answer: 'Yes! We offer professional planting services and expert consultations to help you choose the right plants for your garden and ensure they thrive in Trinidad\'s climate.',
      order: 3,
      status: 'published'
    },
    {
      id: '4',
      section: 'General Questions',
      sectionIcon: 'fa-question-circle',
      question: 'What makes your plants unique?',
      answer: 'Our plants are carefully selected and cultivated for Trinidad\'s tropical climate. We focus on rare varieties and exotic ornamentals that bring uniqueness and beauty to any garden.',
      order: 4,
      status: 'published'
    },
    {
      id: '5',
      section: 'Payment & Delivery',
      sectionIcon: 'fa-credit-card',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods for your convenience: Cash, Debit/Credit Cards, Online Bank Transfer, Mobile Wallets (WiPay, etc.). For online orders, you can send a screenshot to payments: darren.kowlessar6@gmail.com',
      order: 1,
      status: 'published'
    },
    {
      id: '6',
      section: 'Payment & Delivery',
      sectionIcon: 'fa-credit-card',
      question: 'Do you offer delivery? What are the charges?',
      answer: 'Yes, we offer delivery services throughout Trinidad. Delivery charges vary based on location and order size. Please contact us for a custom quote for your specific delivery area.',
      order: 2,
      status: 'published'
    },
    {
      id: '7',
      section: 'Payment & Delivery',
      sectionIcon: 'fa-credit-card',
      question: 'How long does delivery take?',
      answer: 'Delivery times depend on the location. Most deliveries within the greater Port of Spain area take 2-3 business days. Remote locations may take longer. We\'ll provide a specific timeframe when you place your order.',
      order: 3,
      status: 'published'
    },
    {
      id: '8',
      section: 'Payment & Delivery',
      sectionIcon: 'fa-credit-card',
      question: 'What is your return/exchange policy?',
      answer: 'We want you to be completely satisfied with your plants. If a plant arrives damaged or doesn\'t match the description, we\'ll replace it at no extra cost within 7 days of delivery.',
      order: 4,
      status: 'published'
    },
    {
      id: '9',
      section: 'Plant Care & Maintenance',
      sectionIcon: 'fa-leaf',
      question: 'How do I care for lilies in Trinidad\'s climate?',
      answer: 'Lilies thrive in Trinidad\'s tropical climate but need proper care. Plant them in well-draining soil with partial sunlight (4-6 hours daily). Water regularly but avoid waterlogging. In rainy seasons, reduce watering frequency. Apply organic fertilizer every 4-6 weeks during growing season.',
      order: 1,
      status: 'published'
    },
    {
      id: '10',
      section: 'Plant Care & Maintenance',
      sectionIcon: 'fa-leaf',
      question: 'What\'s the best way to plant lotus species?',
      answer: 'Lotus species are best planted in water containers, ponds, or water-logged soil. They need good sunlight (minimum 6 hours daily), however they thrive really well in direct sun. Use nutrient-rich soil and regular fertilization. Apply organic fertilizer every 4-6 weeks during growing season.',
      order: 2,
      status: 'published'
    },
    {
      id: '11',
      section: 'Plant Care & Maintenance',
      sectionIcon: 'fa-leaf',
      question: 'How often should I water exotic ornamental plants?',
      answer: 'Watering frequency depends on the specific plant type and season. In general, water when the top inch of soil feels dry. During rainy seasons in Trinidad, reduce watering frequency to prevent root rot. Always ensure proper drainage.',
      order: 3,
      status: 'published'
    },
    {
      id: '12',
      section: 'Plant Care & Maintenance',
      sectionIcon: 'fa-leaf',
      question: 'When should I apply fertilizer?',
      answer: 'Apply organic fertilizer every 4-6 weeks during the growing season (typically March-October in Trinidad). Reduce or stop fertilizing during the dry season. Use a balanced fertilizer or one specifically formulated for ornamental plants.',
      order: 4,
      status: 'published'
    }
  ];

  return {
    collection: (name) => {
      if (name === 'faqs') {
        return {
          where: () => ({
            orderBy: () => ({
              get: async () => ({
                forEach: (callback) => {
                  mockFAQs.forEach(faq => {
                    callback({ id: faq.id, data: () => faq });
                  });
                }
              })
            })
          })
        };
      }
      // Return empty collection for other collections
      return {
        where: () => ({
          orderBy: () => ({
            get: async () => ({
              forEach: () => {}
            })
          })
        }),
        doc: () => ({
          get: async () => ({ exists: false })
        })
      };
    },
    doc: () => ({
      collection: (name) => ({
        where: () => ({
          get: async () => ({
            forEach: () => {}
          })
        })
      }),
      get: async () => ({ exists: false }),
      set: async () => {},
      update: async () => {}
    })
  };
}

const SESSION_KEY = "lilyFarmSession";

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter(item => item && item.id)
    .map(item => ({
      id: item.id,
      qty: Number(item.qty || item.quantity || 1),
      quantity: Number(item.qty || item.quantity || 1),
      name: item.name || "Product",
      price: Number(item.price || 0),
      image: item.image || "",
      category: item.category || "Lilies"
    }))
    .filter(item => item.qty > 0);
}

function getLocalCart() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeCartItems(parsed);
  } catch (error) {
    console.warn("Unable to read local cart:", error);
    return [];
  }
}

async function fbGetCart() {
  try {
    const localCart = getLocalCart();

    if (!db || !db.collection || typeof db.collection !== "function") {
      return localCart;
    }

    const doc = await db.collection("carts").doc(getSessionId()).get();
    if (doc && doc.exists && Array.isArray(doc.data().items)) {
      const firebaseItems = normalizeCartItems(doc.data().items);
      if (firebaseItems.length) {
        return firebaseItems;
      }
    }

    return localCart.length ? localCart : [];
  } catch (error) {
    console.warn("Firebase cart read failed, falling back to local cart:", error);
    return getLocalCart();
  }
}

async function fbSaveCart(items) {
  const normalizedItems = normalizeCartItems(items);

  try {
    localStorage.setItem("cart", JSON.stringify(normalizedItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      qty: item.qty,
      image: item.image,
      category: item.category
    }))));
  } catch (error) {
    console.warn("Local cart save failed:", error);
  }

  try {
    if (db && db.collection && typeof db.collection === "function") {
      await db.collection("carts").doc(getSessionId()).set({
        items: normalizedItems,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
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
      bank: orderData.bank || null,
      card: orderData.card || null,
      cardDetails: orderData.cardDetails || null,
      region: orderData.region || null,
      address: orderData.address || null,
      city: orderData.city || null,
      notes: orderData.notes || null,
      location: orderData.location || null,
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
