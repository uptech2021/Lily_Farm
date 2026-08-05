window.products = {};
window.PRODUCTS_LOADED = false;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function loadProducts() {
  try {
    const snap = await db.collection('products').orderBy('name').get();
    window.products = {};
    snap.forEach(doc => {
      const data = doc.data();
      const key = data.slug || doc.id;
      window.products[key] = { ...data, firestoreId: doc.id };
    });
    window.PRODUCTS_LOADED = true;
    document.dispatchEvent(new Event('productsLoaded'));
  } catch (e) {
    console.error('Failed to load products:', e);
  }
}

function getProductBySlug(slug) {
  return window.products[slug] || null;
}

function getProductsByCategory(category) {
  return Object.values(window.products).filter(p => p.category === category);
}

function getFeaturedProducts() {
  return Object.values(window.products).filter(p => p.featured);
}

async function addProduct(data) {
  const slug = slugify(data.name);
  const existing = Object.values(window.products).find(p => p.slug === slug);
  if (existing) throw new Error('A product with this name already exists.');
  const docRef = await db.collection('products').add({
    ...data,
    slug,
    price: Number(data.price),
    inStock: data.inStock !== false,
    featured: !!data.featured,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { ...data, slug, firestoreId: docRef.id };
}

async function updateProduct(firestoreId, data) {
  const update = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (update.name) update.slug = slugify(update.name);
  if (update.price) update.price = Number(update.price);
  await db.collection('products').doc(firestoreId).update(update);
}

async function deleteProduct(firestoreId) {
  await db.collection('products').doc(firestoreId).delete();
}

window.slugify = slugify;
window.loadProducts = loadProducts;
window.getProductBySlug = getProductBySlug;
window.getProductsByCategory = getProductsByCategory;
window.getFeaturedProducts = getFeaturedProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;

loadProducts();
