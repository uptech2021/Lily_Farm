window.products = {};
window.PRODUCTS_LOADED = false;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Fallback local product data
const localProducts = [
  { id: "amaryllis", slug: "amaryllis", name: "Amaryllis", price: 45, category: "Lily", inStock: true, description: "A stunning water lily with vibrant, graceful petals. Perfect for pond gardens and outdoor water features. Easy to grow and blooms prolifically throughout the season." },
  { id: "light-yellow-day-bloomer", slug: "light-yellow-day-bloomer", name: "Light Yellow Day Bloomer", price: 50, category: "Lily", inStock: true, description: "Cheerful light yellow blooms that open during the day and close at night. Creates a bright, sunny appearance in water gardens. Hardy variety ideal for tropical climates." },
  { id: "pink-indian-lotus", slug: "pink-indian-lotus", name: "Pink Indian Lotus", price: 55, category: "Lily", inStock: true, description: "Elegant pink lotus with sacred spiritual significance. Large, fragrant blooms on tall stems. Requires warm water and full sunlight. A majestic centerpiece for any water garden." },
  { id: "dark-yellow-day-bloomer", slug: "dark-yellow-day-bloomer", name: "Dark Yellow Day Bloomer", price: 52, category: "Lily", inStock: true, description: "Rich, deep golden-yellow petals that create dramatic color contrast in water gardens. Day-blooming variety with excellent hardiness. Perfect for warm water environments." },
  { id: "golden-champaca", slug: "golden-champaca", name: "Golden Champaca", price: 48, category: "Lily", inStock: true, description: "Named for its champagne-colored golden blooms. Highly fragrant with delicate, silky petals. Thrives in warm, tropical waters and produces multiple blooms per season." },
  { id: "purple-blue-day-bloomer", slug: "purple-blue-day-bloomer", name: "Purple Blue Day Bloomer", price: 58, category: "Lily", inStock: true, description: "Rare purple-blue hybrid with exceptional ornamental value. Diurnal blooming pattern from dawn to dusk. Adds sophisticated color to any aquatic garden collection." },
  { id: "white-night-bloomer", slug: "white-night-bloomer", name: "White Night Bloomer", price: 60, category: "Lily", inStock: true, description: "Pure white petals that bloom only at night and close at dawn. Highly fragrant, perfect for evening garden enjoyment. Night-blooming varieties create magical nocturnal displays." },
  { id: "whitebloomer", slug: "whitebloomer", name: "Whitebloomer", price: 56, category: "Lily", inStock: true, description: "Classic white water lily with pristine petals and golden stamens. Reliable bloomer throughout warm seasons. Ideal for creating elegant, serene water garden aesthetics." },
  { id: "rangoon-creeper", slug: "rangoon-creeper", name: "Rangoon Creeper", price: 44, category: "Lily", inStock: true, description: "Tropical climbing plant with fragrant flowers that change color from white to pink to red as they mature. Highly ornamental foliage. Perfect for trellises and water garden edges." },
  { id: "dark-purple-day-bloomer", slug: "dark-purple-day-bloomer", name: "Dark Purple Day Bloomer", price: 59, category: "Lily", inStock: true, description: "Deep, regal purple blooms that open during daylight hours. Striking focal point for water gardens. Vigorous grower with prolific flowering and excellent hardiness." },
  { id: "dark-pink-night-bloomer", slug: "dark-pink-night-bloomer", name: "Dark Pink Night Bloomer", price: 62, category: "Lily", inStock: true, description: "Romantic deep pink flowers that open exclusively at night with intoxicating fragrance. Rare night-blooming variety. Creates enchanting moonlit water garden scenes." },
  { id: "light-pink-night-bloomer", slug: "light-pink-night-bloomer", name: "Light Pink Night Bloomer", price: 61, category: "Lily", inStock: true, description: "Soft, delicate pink petals that bloom under moonlight. Sweetly scented night flowers add mystique to evening gardens. Thrives in warm tropical and subtropical waters." },
  { id: "light-purple-day-bloomer", slug: "light-purple-day-bloomer", name: "Light Purple Day Bloomer", price: 57, category: "Lily", inStock: true, description: "Pale lavender blooms with graceful form, opening during daylight. Elegant variety for formal water gardens. Produces multiple flowers throughout the warm season." },
  { id: "variegated-purple-day-bloomer", slug: "variegated-purple-day-bloomer", name: "Variegated Purple Day Bloomer", price: 200, image: "img/variegated-purple-day-bloomer.jpg", category: "Exotic", inStock: true, description: "Exquisite hybrid with variegated purple and white striped petals. Premium day-blooming rare variety. Ultra-hardy with exceptional ornamental qualities and prolific flowering habit." },
  { id: "white-purple-day-bloomer", slug: "white-purple-day-bloomer", name: "White Purple Day Bloomer", price: 150, image: "img/white-purple-day-bloomer.jpg", category: "Exotic", inStock: true, description: "Stunning bicolor lily with white petals accented by deep purple edges and centers. Rare hybrid combining the elegance of two complementary colors. Premium collector's variety." },
  { id: "red-amaryllis", slug: "red-amaryllis", name: "Red Amaryllis", price: 100, image: "img/red-amaryllis.jpg", category: "Exotic", inStock: true, description: "Spectacular deep crimson-red water lily with bold, dramatic impact. Premium exotic variety with superior blooming performance. Creates stunning visual focal points in luxury water gardens." },
  { id: "parrots-beak-heliconia", slug: "parrots-beak-heliconia", name: "Parrot's Beak Heliconia", price: 140, image: "img/parrot's-beak-heliconia.jpg", category: "Exotic", inStock: true, description: "Exotic tropical plant with distinctive parrot-like red and yellow flower bracts. Stunning architectural foliage and vibrant plumage-like blooms. Premium ornamental plant for collectors." }
];

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
    console.error('Failed to load products from Firebase:', e);
    // Fallback to local products
    window.products = {};
    localProducts.forEach(p => {
      window.products[p.slug] = p;
    });
    window.PRODUCTS_LOADED = true;
    document.dispatchEvent(new Event('productsLoaded'));
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

// ============ ANALYTICS FUNCTIONS ============
async function trackProductClick(productId, productName) {
  try {
    await fbLogActivity("product_click", {
      productId,
      productName,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to track product click:", e);
  }
}

async function trackSearch(searchTerm, resultsCount) {
  try {
    await fbLogActivity("search", {
      searchTerm,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to track search:", e);
  }
}

async function trackAddToCart(productId, productName, quantity) {
  try {
    await fbLogActivity("add_to_cart", {
      productId,
      productName,
      quantity,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to track add to cart:", e);
  }
}

// ============ EXPORT FUNCTIONS ============
window.slugify = slugify;
window.loadProducts = loadProducts;
window.getProductBySlug = getProductBySlug;
window.getProductsByCategory = getProductsByCategory;
window.getFeaturedProducts = getFeaturedProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.trackProductClick = trackProductClick;
window.trackSearch = trackSearch;
window.trackAddToCart = trackAddToCart;

loadProducts();
