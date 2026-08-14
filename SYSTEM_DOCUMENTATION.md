# Complete E-Commerce System Documentation

## System Overview

This is a production-ready e-commerce platform for Rishi's Lily Farm with complete Firebase integration. The system manages:
- 🛒 Shopping cart management
- 📦 Order processing & tracking
- 👥 Customer data management
- 📊 Analytics & activity tracking
- 💰 Payment methods (Card, Bank Transfer, Cash)
- 🚚 Delivery options & regional pricing
- 📱 Responsive mobile-first design

---

## Architecture & Components

### Frontend Files

#### HTML Pages
```
index.html              - Home page with featured products
products.html           - Product catalog with search/filter
gallery.html            - Gallery with color filter buttons
product-detail.html     - Individual product details
cart.html               - Shopping cart with recommendations
checkout.html           - Checkout form & order summary
contact.html            - Contact form with location
faq.html                - FAQ accordion
```

#### Stylesheets
```
src/css/
├── styles.css           - Global styles & navbar
├── home.css             - Home page styles
├── products.css         - Products page styles
├── gallery.css          - Gallery page styles
├── cart.css             - Cart & checkout styles
├── contact.css          - Contact page styles
├── admin.css            - Admin panel styles
└── admin.tokens.css     - Admin token colors
```

#### JavaScript Modules
```
src/js/
├── firebase-config.js        - Firebase credentials (create from example)
├── firebase.js               - Firebase core functions
├── utils.js                  - Utility & helper functions
├── cart.js                   - Cart page functionality
├── checkout.js               - Checkout page functionality
├── products.js               - Product management & tracking
├── promotions.js             - Promotion/discount logic
├── app.js                    - Global app logic
├── footer.js                 - Footer component
├── forms.js                  - Form handling
└── tables.js                 - Admin table management
```

#### Components
```
src/components/
├── navbar.html               - Navigation bar (shared)
├── footer.html               - Footer (shared)
├── admin-nav.html            - Admin navigation
└── admin-topbar.html         - Admin top bar
```

---

## 🔐 Authentication & Sessions

### Session Management
```javascript
// Each user gets a unique session ID
const sessionId = getSessionId();
// Format: "session_1692345600000_xyz789"
// Stored in: localStorage['lilyFarmSession']
// Used for: Cart, Orders, Customer data, Analytics
```

### Session Tracking
- Persists across browser sessions
- Tied to localStorage (survives page refreshes)
- Cleared only on localStorage clear or new browser
- Enables order history per customer

---

## 🛍️ Shopping Cart System

### Cart Data Structure
```javascript
{
  items: [
    { id: "product-id", qty: 1 },
    { id: "another-product", qty: 2 }
  ],
  updatedAt: firebase.firestore.Timestamp,
  createdAt: firebase.firestore.Timestamp
}
```

### Cart Operations
```javascript
// Add item (qty+1 if exists)
await fbAddToCart("product-id");

// Update quantity
await fbUpdateQty("product-id", 1);   // Increase
await fbUpdateQty("product-id", -1);  // Decrease

// Remove item completely
await fbRemoveItem("product-id");

// Get current cart
const cart = await fbGetCart();

// Clear cart
await fbClearCart();

// Update badge display
updateCartBadge();
```

### Badge System
- Shows total item count in cart
- Updates in real-time
- Visible in navbar on all pages
- Red circular badge with white number

---

## 💳 Checkout & Orders

### Checkout Flow
```
1. User navigates to /checkout.html
2. Form displays cart items & summary
3. User enters:
   - Name, Email, Phone
   - Delivery Option (Delivery/Pickup)
   - Region (if Delivery selected)
   - Address (optional)
   - Payment Method (Card/Wire/Cash)
4. Form validates on submit
5. Order created in Firestore
6. Cart cleared
7. Confirmation displayed
```

### Order Processing
```javascript
// Complete order submission
const orderId = await fbSaveOrder({
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "+1 (868) 710-4296",
  items: cartItems,
  subtotal: 250.00,
  deliveryFee: 60.00,
  total: 310.00,
  deliveryOption: "delivery",
  paymentMethod: "card",
  region: "central",
  address: "123 Main St, Port of Spain"
});
```

### Delivery Options
```javascript
// Free delivery over threshold
deliveryThreshold: 500  // $500 TTD

// Regional rates
Central: $60
North: $85
South: $60

// Pickup option
Free with order confirmation
```

### Payment Methods
```
1. Card                    - Stripe/Payment integration
2. Bank Transfer           - Scotiabank Account
3. Cash                    - Cash on delivery
```

---

## 📦 Order Management

### Order Tracking
```javascript
// Get all orders for customer
const orders = await fbGetOrders();

// Get specific order
const order = await fbGetOrderById("order_id");

// Update order status
await fbUpdateOrderStatus("order_id", "shipped");
```

### Order Statuses
```
pending    → Order submitted, awaiting confirmation
confirmed  → Order confirmed, processing
shipped    → Order sent out
delivered  → Order delivered
cancelled  → Order cancelled
```

### Order Fields
- orderId: Unique identifier
- customerName, Email, Phone
- items: Product array
- subtotal, deliveryFee, total
- deliveryOption, paymentMethod
- region, address
- status: Current order status
- createdAt, updatedAt: Timestamps

---

## 📊 Analytics System

### Tracked Events
```javascript
// Page visits
page_visit
└── data: { page, referrer, userAgent }

// Product interactions
product_view
└── data: { productId, productName, category, price }

product_click
└── data: { productId, productName }

// Cart operations
add_to_cart
└── data: { productId, productName, quantity }

cart_updated
└── data: { itemCount }

// Searches
search
└── data: { searchTerm, resultsCount }

// Purchases
purchase
└── data: { orderId, total, itemCount }
```

### Analytics Functions
```javascript
// Track page visits (auto on load)
logPageVisit();

// Track product views
trackProductView("product-id", "Product Name");

// Track cart additions
trackAddToCart("product-id", "Product Name", 1);

// Track searches
trackSearch("search term", 5);

// Generic logging
fbLogActivity("custom_action", { data });
```

---

## 🎁 Promotions & Discounts

### Promotion System
```javascript
// Get active promotions
const active = getActivePromotions();

// Get upcoming promotions
const upcoming = getUpcomingPromotions();

// Get promotion for category
const promo = getDiscountedPrice(price, "Water Lilies");
```

### Promotion Structure
```javascript
{
  discount: 15,           // Percentage
  startDate: "2026-08-15",
  endDate: "2026-08-30",
  categories: ["Water Lilies", "Exotic Plants"],
  bannerText: "Summer Sale!"
}
```

---

## 👥 Customer Management

### Customer Data
```javascript
// Save customer info
await fbSaveCustomer({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (868) 710-4296"
});

// Retrieve customer
const customer = await fbGetCustomer();
```

### Customer Collection
```
customers/{sessionId}
├── name: "John Doe"
├── email: "john@example.com"
├── phone: "+1 (868) 710-4296"
└── updatedAt: timestamp
```

---

## 🏪 Product Management

### Product Data
```javascript
{
  name: "Purple Blue Day Bloomer",
  slug: "purple-blue-day-bloomer",      // URL-friendly
  category: "Water Lilies",             // or "Exotic Plants"
  price: 150.00,
  description: "Beautiful purple lily",
  image: "img/purple-blue-day-bloomer.jpg",
  inStock: true,
  featured: false,
  fertilizerInfo: "Use fertilizer X twice monthly"
}
```

### Product Functions
```javascript
// Get all products (auto-loaded)
const allProducts = window.products;

// Get by slug
const product = getProductBySlug("purple-blue-day-bloomer");

// Get by category
const lilies = getProductsByCategory("Water Lilies");

// Get featured only
const featured = getFeaturedProducts();

// Admin: Add product
await addProduct({ name, category, price, image, ... });

// Admin: Update product
await updateProduct("firestore-id", { price: 160, ... });

// Admin: Delete product
await deleteProduct("firestore-id");
```

---

## 🎨 UI Components

### Gallery Page
- Color filter buttons: ALL, PINK, RED, YELLOW, PURPLE, WHITE
- Filter toggles to show/hide plants
- Smooth animations
- Responsive grid layout

### Cart Page
```
Empty State:
├── Welcome message
├── Browse Products button
└── Popular Plants section

With Items:
├── Cart items list
│   ├── Product image
│   ├── Name & category
│   ├── Quantity controls
│   └── Remove button
├── Order Summary
│   ├── Subtotal
│   ├── Delivery fee
│   └── Total
└── Checkout button
```

### Contact Page
```
Left Column:
├── Contact form
│   ├── Full Name
│   ├── Email
│   ├── Phone
│   ├── Subject
│   └── Message

Right Column:
├── Contact Info
│   ├── Phone (clickable)
│   ├── Email (clickable)
│   └── Address
├── Business Hours
└── Map placeholder
```

---

## 🔧 Form Validation

### Validation Functions
```javascript
// Email validation
isValidEmail("john@example.com");  // true

// Phone validation
isValidPhone("+1 (868) 710-4296"); // true

// Checkout form validation
const result = validateCheckoutForm({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (868) 710-4296"
});
// Returns: { valid: true, errors: [] }
```

### Form Validation Rules
```
Name:   ≥ 2 characters
Email:  Valid format (xxx@xxx.xxx)
Phone:  ≥ 7 digits
```

---

## 📱 Responsive Design

### Breakpoints
```
Desktop:  ≥ 1200px   - Full layout
Tablet:   768-1199px - Adjusted grid
Mobile:   < 768px    - Single column, hamburger menu
```

### Mobile Features
- Hamburger menu (3-line button)
- Touch-friendly buttons
- Single-column layout
- Responsive images
- Optimized forms

---

## 🔔 Notifications

### Toast Notifications
```javascript
// Success
showNotification("✓ Item added to cart!", "success");

// Error
showNotification("❌ Error processing order", "error");

// Info
showNotification("ℹ️ Loading...", "info");
```

### Features
- Auto-dismiss after 3 seconds
- Smooth slide animations
- Color-coded (green/red/blue)
- Stacks multiple notifications
- Mobile responsive

---

## 💾 Local Storage

### Stored Data
```
localStorage['lilyFarmSession']  = "session_..."  // Session ID
localStorage['cartItems']       = "..."           // Backup cart
localStorage['customerData']    = "..."           // Customer info
```

### Storage Functions
```javascript
getStorageItem("key");
setStorageItem("key", "value");
```

---

## 🐛 Error Handling

### Try-Catch Pattern
```javascript
try {
  await fbOperation();
} catch (error) {
  console.error("Operation failed:", error);
  showNotification("Error: " + error.message, "error");
}
```

### Common Errors
```
Firebase config not found
  → Check firebase-config.js exists and is configured

Firestore permission denied
  → Check security rules in Firebase Console

Network error
  → Check internet connection and Firebase status

Product not found
  → Check product ID is correct and in Firestore
```

---

## 🚀 Performance Optimization

### Implemented
- Lazy loading images
- Event delegation for buttons
- Local caching of data
- Async/await for non-blocking operations
- Minimal re-renders

### Best Practices
```javascript
// Don't: Reload entire page
location.reload();

// Do: Update specific elements
updateCartBadge();

// Don't: Multiple event listeners
el.addEventListener("click", handler);

// Do: Event delegation
document.addEventListener("click", (e) => {
  if (e.target.matches(".btn")) handler(e);
});
```

---

## 📈 Deployment

### Pre-Deployment Checklist
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] firebase-config.js configured
- [ ] Security rules updated
- [ ] Products added to Firestore
- [ ] Test orders from checkout
- [ ] Verify email sends (if configured)
- [ ] HTTPS enabled
- [ ] Analytics enabled
- [ ] Error tracking setup

### Environment Variables
```
Production:
- Firebase config (production project)
- API keys (production keys)
- Email service (production account)

Development:
- Firebase config (dev project)
- Test data/products
- Local storage enabled
```

---

## 📚 Additional Resources

### Firebase Documentation
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Queries](https://firebase.google.com/docs/firestore/query-data/queries)

### Code Examples
All functions are documented with comments in source files:
- `src/js/firebase.js` - Core Firebase operations
- `src/js/utils.js` - Helper functions
- `src/js/cart.js` - Cart logic

---

## 🎓 Developer Tips

### Debug Mode
```javascript
// Enable console logging
localStorage.setItem('debug', 'true');

// View session ID
console.log(getSessionId());

// View current cart
console.log(await fbGetCart());

// View all products
console.log(window.products);
```

### Test Functions
```javascript
// Test cart
await fbAddToCart("purple-blue-day-bloomer");
const cart = await fbGetCart();
console.log(cart);

// Test orders
const order = await fbGetOrderById("order_id");
console.log(order);

// Test analytics
await fbLogActivity("test", { test: true });
```

---

**Last Updated:** August 13, 2026
**System Version:** 1.0
**Firebase Integration:** Complete
**Status:** Production Ready ✅
