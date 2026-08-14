# Firebase Setup & E-Commerce System Guide

## Overview
This is a fully functional e-commerce system with complete Firebase integration. The system handles shopping carts, orders, customers, analytics, and inventory management.

---

## 🚀 Quick Start: Firebase Configuration

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project" → Name it "Rishi's Lily Farm"
3. Enable Google Analytics (optional)
4. Wait for project creation to complete

### Step 2: Get Firebase Credentials
1. Go to **Project Settings** (gear icon)
2. Click **General** tab
3. Scroll to "Your apps" section
4. Click **Web** icon (</> icon)
5. Copy all the Firebase config values (apiKey, authDomain, projectId, etc.)

### Step 3: Configure the Application
1. Copy `src/js/firebase-config.example.js` → `src/js/firebase-config.js`
2. Paste your Firebase credentials into `firebase-config.js`:

```javascript
window.__FB_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 4: Enable Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (Start in test mode for development)
4. Select region closest to users (e.g., us-central1)
5. Click **Create**

### Step 5: Set Firestore Security Rules
In **Firestore Rules** tab, use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write carts, orders, customers (demo mode)
    match /{document=**} {
      allow read, write;
    }
  }
}
```

**⚠️ Important:** This is for development only. For production, implement proper authentication.

### Step 6: Create Collections (Optional - Auto-created)
Collections are automatically created when data is written. Expected collections:

- **carts/** - Shopping carts per session
- **orders/** - Order history
- **customers/** - Customer information
- **products/** - Product catalog
- **settings/** - Global settings (delivery fees, payment info)
- **analytics/** - Activity logs and user tracking

---

## 📦 System Architecture

### Collections & Data Structure

#### 1. Carts Collection
```
carts/{sessionId}
├── items: [
│   ├── id: "product-id"
│   └── qty: 1
│ ]
├── updatedAt: timestamp
└── createdAt: timestamp
```

#### 2. Orders Collection
```
orders/{orderId}
├── orderId: "order_1692345600000_abc123"
├── sessionId: "session_1692345600000_xyz789"
├── customerName: "John Doe"
├── customerEmail: "john@example.com"
├── customerPhone: "+1 (868) 710-4296"
├── items: [
│   ├── id: "product-id"
│   └── qty: 1
│ ]
├── subtotal: 250.00
├── deliveryFee: 60.00
├── total: 310.00
├── deliveryOption: "delivery" | "pickup"
├── paymentMethod: "card" | "wire" | "cash"
├── region: "central" | "north" | "south"
├── address: "123 Main St, Port of Spain"
├── status: "pending" | "confirmed" | "shipped" | "delivered"
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 3. Customers Collection
```
customers/{sessionId}
├── name: "John Doe"
├── email: "john@example.com"
├── phone: "+1 (868) 710-4296"
├── updatedAt: timestamp
└── createdAt: timestamp
```

#### 4. Products Collection
```
products/{docId}
├── name: "Purple Blue Day Bloomer"
├── slug: "purple-blue-day-bloomer"
├── category: "Water Lilies" | "Exotic Plants"
├── price: 150.00
├── description: "Beautiful purple lily..."
├── image: "img/purple-blue-day-bloomer.jpg"
├── inStock: true | false
├── featured: true | false
├── fertilizerInfo: "Use fertilizer X..."
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 5. Analytics Collection
```
analytics/{docId}
├── sessionId: "session_1692345600000_xyz789"
├── action: "page_visit" | "product_view" | "add_to_cart" | "purchase"
├── data: { ... action-specific data ... }
└── timestamp: timestamp
```

#### 6. Settings Collection
```
settings/global
├── deliveryThreshold: 500 (free delivery over this amount)
├── deliveryCentral: 60
├── deliveryNorth: 85
├── deliverySouth: 60
├── wireAcctName: "Rishi's Lily Farm & Exotic Plants"
├── wireBank: "Scotiabank Couva"
├── wireAcctNum: "2416939"
├── wireAcctType: "Chequing"
└── email: "darren.kowlessar6@gmail.com"
```

---

## 🛠️ API Functions

### Cart Management

```javascript
// Get current cart
const cart = await fbGetCart();

// Add product to cart
await fbAddToCart("product-id");

// Update product quantity
await fbUpdateQty("product-id", 1);  // +1 item
await fbUpdateQty("product-id", -1); // -1 item

// Remove product from cart
await fbRemoveItem("product-id");

// Clear entire cart
await fbClearCart();
```

### Order Management

```javascript
// Save new order
const orderId = await fbSaveOrder({
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "+1 (868) 710-4296",
  items: [{id: "product-id", qty: 1}],
  subtotal: 250.00,
  deliveryFee: 60.00,
  total: 310.00,
  deliveryOption: "delivery",
  paymentMethod: "card",
  region: "central",
  address: "123 Main St"
});

// Get all orders for current session
const orders = await fbGetOrders();

// Get specific order
const order = await fbGetOrderById("order_1692345600000_abc123");

// Update order status
await fbUpdateOrderStatus("order_id", "shipped");
```

### Customer Management

```javascript
// Save customer data
await fbSaveCustomer({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (868) 710-4296"
});

// Get customer data
const customer = await fbGetCustomer();
```

### Analytics & Tracking

```javascript
// Log any activity
await fbLogActivity("purchase", {
  orderId: "order_123",
  total: 310.00,
  itemCount: 2
});

// Predefined tracking functions
await trackProductView("product-id", "Product Name");
await trackAddToCart("product-id", "Product Name", 1);
await trackSearch("search term", 5);
await trackProductClick("product-id", "Product Name");
```

### Product Management

```javascript
// Get all products (auto-loaded)
const allProducts = window.products;

// Get product by slug
const product = getProductBySlug("purple-blue-day-bloomer");

// Get products by category
const lilies = getProductsByCategory("Water Lilies");

// Get featured products
const featured = getFeaturedProducts();

// Add new product (admin)
await addProduct({
  name: "New Lily",
  category: "Water Lilies",
  price: 150,
  description: "Beautiful new lily",
  image: "img/new-lily.jpg",
  inStock: true,
  featured: false
});

// Update product (admin)
await updateProduct("firestore-doc-id", {
  price: 160,
  inStock: false
});

// Delete product (admin)
await deleteProduct("firestore-doc-id");
```

### Utility Functions

```javascript
// Formatting
formatPrice(150.00);           // "$150.00"
formatCurrency(150.00, "TTD"); // "TTD $150.00"
formatDate(new Date());        // "Aug 13, 2026"
formatTime(new Date());        // "2:38 PM"

// Validation
isValidEmail("john@example.com");      // true
isValidPhone("+1 (868) 710-4296");     // true
validateCheckoutForm({name, email, phone}); // {valid: true, errors: []}

// Notifications
showNotification("Item added!", "success");
showNotification("Error!", "error");
showNotification("Loading...", "info");

// Storage
getStorageItem("key");
setStorageItem("key", "value");

// Session
getOrCreateSessionId();
logPageVisit();
```

---

## 📱 User Flow

### Shopping Flow
1. User browses products (tracked: `product_view`)
2. User adds items to cart (tracked: `add_to_cart`)
   - Cart saved in Firebase
   - Badge updates automatically
3. User proceeds to checkout
4. User enters delivery & payment details
5. Order submitted
   - Order saved to Firebase
   - Customer data saved
   - Cart cleared
   - Confirmation email sent (optional)

### Cart Operations
- Cart persists per browser session
- Uses localStorage + Firebase for reliability
- Auto-syncs across browser tabs
- Survives page refreshes

### Order Management
- Orders stored permanently in Firebase
- Each order has unique ID
- Status can be updated (pending → confirmed → shipped → delivered)
- Full audit trail with timestamps

---

## 🔐 Security Considerations

### Current (Development) Setup
- Test mode rules allow full read/write
- Anyone can access data

### Production Recommendations
```
1. Implement Firebase Authentication
2. Use proper security rules by userId
3. Validate all data server-side
4. Implement rate limiting
5. Use HTTPS only
6. Add email verification
7. Implement payment verification
```

---

## 🐛 Testing

### Test the System

1. **Add to Cart**
   - Go to Products or Cart page
   - Click "Add to Cart"
   - Check Firebase → Firestore → carts collection

2. **View Cart**
   - Cart badge shows item count
   - Cart page displays all items
   - Quantities can be adjusted

3. **Checkout**
   - Fill in customer details
   - Submit order
   - Check Firebase → Firestore → orders collection

4. **Analytics**
   - Check Firebase → Firestore → analytics collection
   - See logged activities

---

## 🚨 Troubleshooting

### "Firebase config not found"
- Make sure `src/js/firebase-config.js` exists
- Verify all config values are filled in correctly
- Check browser console for errors

### Orders not saving
- Verify Firestore is enabled
- Check security rules allow write access
- Check browser console for errors
- Verify Firebase config is correct

### Cart not persisting
- Check localStorage is enabled
- Verify Firestore is accessible
- Check Firebase collection permissions

### Missing products
- Products are auto-loaded from Firestore
- If empty, add products via admin panel
- Or use `addProduct()` function

---

## 📊 Monitoring & Admin

### View Data in Firebase Console
1. Go to **Firestore Database**
2. Browse collections:
   - **carts/** - Active shopping carts
   - **orders/** - All orders
   - **customers/** - Customer list
   - **analytics/** - Activity logs
   - **products/** - Product inventory

### Generate Reports
- Filter orders by date range
- Track top-selling products
- Analyze customer behavior
- Monitor cart abandonment

---

## 🔄 Deployment Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] firebase-config.js configured
- [ ] Security rules updated for production
- [ ] Products added to Firestore
- [ ] Settings configured (delivery fees, payment info)
- [ ] Email notifications setup (optional)
- [ ] Domain/SSL configured
- [ ] Test checkout flow
- [ ] Monitor analytics

---

## 📞 Support

For Firebase issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Reference](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com)

For application issues:
- Check browser console (F12 → Console tab)
- Check Firebase logs
- Verify Firestore collections exist
- Test individual functions in console

---

**Last Updated:** August 13, 2026
**Version:** 1.0
