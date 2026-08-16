# Payment Activation Guide

## Quick Start - Payment Flow Activation ✅

### Current Status
✅ **All components implemented and ready to use**

- Payment form with Cash & Wire Transfer options
- Delivery options (Farm Pickup + Home Delivery)
- Interactive geolocation with Leaflet.js map
- Real-time Firebase data saving
- Form validation for all payment scenarios
- Responsive design for mobile/desktop

---

## How to Test the Payment Flow

### **Step 1: Add Items to Cart**
1. Go to **Products Page** (`products.html`)
2. Click **"Add to Cart"** on any product
3. See cart badge update in navbar
4. Add 2-3 items to build up a good total

### **Step 2: Go to Cart**
1. Click **cart icon** in navbar or go to `cart.html`
2. Review items and quantities
3. Modify quantities if needed using +/- buttons
4. See **"Proceed to Checkout"** button (green button)

### **Step 3: Click Checkout**
1. Click **"Proceed to Checkout"** button
2. You'll be taken to `checkout.html`
3. See order summary with items

### **Step 4: Fill Checkout Form**
**Contact Information:**
- Full Name: (required)
- Email: (required)
- Phone: (required)

**Payment Method:** (select one)
- ☑️ Cash (instant)
- ⬜ Wire Transfer (shows bank details)

**Delivery Option:** (select one)
- ☑️ Farm Pickup (Free) - Hides delivery fields
- ⬜ Delivery - Shows delivery fields and map

---

## Payment Scenarios

### Scenario A: Farm Pickup (Free)
1. Select **"Farm Pickup (Free)"**
2. Delivery fields disappear
3. Select **"Cash"** or **"Wire"** payment
4. Click **"Place Order"**
5. ✅ Order saved with $0 delivery fee

### Scenario B: Home Delivery with Geolocation
1. Select **"Delivery"**
2. Delivery fields appear with interactive map
3. Fill:
   - Street Address (e.g., "123 Main St")
   - City/Town (e.g., "Chaguanas")
   - Region (e.g., "Central Trinidad")
4. **Click "Use My Location" button:**
   - Browser asks for permission
   - If allowed → Location captured and shown on map
   - If denied → Click on map to manually select location
5. See coordinates displayed:
   - Latitude: 10.512345
   - Longitude: -61.412345
   - Accuracy: ±25 meters
6. Delivery fee auto-calculates based on region:
   - Central: $60 (or free if order $500+)
   - North: $85 (or free if order $500+)
   - South: $60 (or free if order $500+)
7. Click **"Place Order"**
8. ✅ Order saved with location data in real-time

---

## What Happens on Submit

### When "Place Order" is clicked:

**1. Form Validation** ✓
- Checks all required fields
- If delivery selected: Requires address + city + location
- Shows error if missing

**2. Customer Data Saved** 📝
- **Collection:** `customers`
- **Data:** Name, Email, Phone
- **Real-time:** Saved immediately to Firestore

**3. Order Record Created** 📦
- **Collection:** `orders`
- **Data includes:**
  - Order ID (unique timestamp)
  - Customer info
  - Cart items with prices
  - Subtotal + delivery fee
  - Total amount
  - Delivery option (pickup/delivery)
  - Payment method (cash/wire)
  - Region selected
  - Delivery address
  - **Location coordinates** (if delivery):
    - Latitude
    - Longitude
    - Accuracy radius
  - Order status: "pending"
  - Timestamps (created/updated)

**4. Activity Logged** 📊
- **Collection:** `analytics`
- **Data:** Purchase event with order ID, total, item count
- Used for tracking and reporting

**5. Cart Cleared** 🧹
- Items removed from localStorage
- Cart badge becomes empty
- Ready for next purchase

**6. Success Message** 🎉
- Shows "Order Placed Successfully!"
- Displays order ID
- Provides next steps

---

## Testing The Payment Flow

### **Quick Test - Use Payment Activation Tester**

Go to: `payment-activation-tester.html`

Features:
- ✅ Add test items in one click
- ✅ Test each step individually
- ✅ Test geolocation
- ✅ Check Firebase data
- ✅ Run full flow test

---

## Data Saved to Firebase

### Orders Collection Structure
```
orders/
├── order_1692345678_abc123/
│   ├── orderId: "order_1692345678_abc123"
│   ├── sessionId: "session_1692345600_def456"
│   ├── customerName: "John Doe"
│   ├── customerEmail: "john@example.com"
│   ├── customerPhone: "+18687104296"
│   ├── items: [
│   │   { id: "purple-blue-day-bloomer", name: "Purple Blue Day Bloomer", qty: 2, price: 150 },
│   │   { id: "golden-champaca", name: "Golden Champaca", qty: 1, price: 120 }
│   │ ]
│   ├── subtotal: 420
│   ├── deliveryFee: 60
│   ├── total: 480
│   ├── deliveryOption: "delivery"
│   ├── paymentMethod: "cash"
│   ├── region: "central"
│   ├── address: "123 Main Street"
│   ├── city: "Chaguanas"
│   ├── notes: "Please ring doorbell"
│   ├── location: {
│   │   latitude: 10.512345,
│   │   longitude: -61.412345,
│   │   accuracy: 25.5,
│   │   address: "123 Main Street",
│   │   city: "Chaguanas"
│   │ }
│   ├── status: "pending"
│   ├── createdAt: "2024-08-14T15:30:45.123Z"
│   └── updatedAt: "2024-08-14T15:30:45.123Z"
```

### Customers Collection
```
customers/
└── session_1692345600_def456/
    ├── name: "John Doe"
    ├── email: "john@example.com"
    ├── phone: "+18687104296"
    └── updatedAt: "2024-08-14T15:30:45.123Z"
```

### Analytics Collection
```
analytics/
├── doc1: { sessionId: "...", action: "purchase", data: {...}, timestamp: "..." }
├── doc2: { sessionId: "...", action: "purchase", data: {...}, timestamp: "..." }
└── ...
```

---

## Delivery Fee Calculation

| Region | Base Fee | Free If $500+ | Example |
|--------|----------|---------------|---------|
| **Central** | $60 TTD | ✓ Yes | $0 for $500+ orders |
| **North** | $85 TTD | ✓ Yes | $0 for $500+ orders |
| **South** | $60 TTD | ✓ Yes | $0 for $500+ orders |
| **Farm Pickup** | $0 TTD | Always Free | No extra charge |

**Example:**
- Item 1: 2x Purple Bloomer @ $150 = $300
- Item 2: 1x Golden Champaca @ $120 = $120
- **Subtotal: $420**
- **Region: Central Trinidad**
- **Delivery Fee: $60** (order < $500)
- **Total: $480**

---

## Payment Methods

### Cash Payment
- Selected by default
- No additional info needed
- Customer pays upon delivery or pickup

### Wire Transfer
- Shows bank details when selected:
  - Account holder name
  - Bank name
  - Account number
  - Account type
- Customer sends screenshot after payment
- Note: Email address shown for confirmation

**Current Wire Transfer Details:**
```
Pay to: Rishi's Lily Farm & Exotic Plants
Bank: Scotiabank Couva
Account #: 2416939 (Chequing)
Email: darren.kowlessar6@gmail.com
```

---

## Troubleshooting

### Issue: Form won't submit
**Solution:** 
- Check all required fields are filled (name, email, phone)
- If delivery selected: must have address, city, AND location
- See error message for which field is missing

### Issue: Geolocation not working
**Solution:**
- Check browser allows location permission
- Check HTTPS (required in production, OK on localhost)
- Fall back to clicking map to manually select location
- Verify browser geolocation is enabled in settings

### Issue: Map not appearing
**Solution:**
- Make sure "Delivery" option is selected
- Wait a moment for map to load
- Check browser console for errors (F12 → Console)
- Refresh page if needed

### Issue: Order not saving to Firebase
**Solution:**
- Check Firebase config is correct (`firebase-config.js`)
- Check Firestore has proper security rules
- Check browser console for error messages
- Verify internet connection is active

### Issue: Delivery fee not calculating
**Solution:**
- Make sure region is selected
- Check if order total is $500+ (should be free)
- Refresh page and try again
- Check console for calculation errors

---

## Browser Requirements

✅ **Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

**Important:** Geolocation requires:
- HTTPS (except localhost)
- User permission grant
- Browser geolocation enabled

---

## Files Involved

| File | Purpose |
|------|---------|
| `checkout.html` | Payment form, map container, geolocation section |
| `src/css/checkout.css` | Styling for form, map, geolocation features |
| `src/js/checkout.js` | Form logic, geolocation, map initialization |
| `src/js/firebase.js` | Firebase order saving, customer data, analytics |
| `src/js/cart.js` | Cart management, checkout button link |
| `cart.html` | Shopping cart with checkout button |
| `payment-activation-tester.html` | Testing page for payment flow |

---

## Next Steps After Payment

1. **Order Confirmation Page** (Optional)
   - Show order details
   - Display tracking info
   - Send email confirmation

2. **Admin Dashboard** (Optional)
   - View all orders
   - See customer locations on map
   - Update order status
   - Assign delivery driver

3. **Customer Account** (Optional)
   - Save delivery addresses
   - View order history
   - Track orders in real-time

4. **Email Notifications** (Optional)
   - Order confirmation
   - Delivery status updates
   - Estimated arrival time

---

## Support

For issues or questions:
- **Email:** darren.kowlessar6@gmail.com
- **Phone:** (868) 710-4296

---

**Last Updated:** August 14, 2024  
**Status:** ✅ Ready for Production
