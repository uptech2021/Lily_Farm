// Helper functions

// ========== CART BADGE MANAGEMENT ==========
// Update cart badge counter on navbar
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
    const badge = document.getElementById("cartBadge");
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = 'inline-flex';
    }
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

// Initialize cart badge on page load
window.addEventListener("DOMContentLoaded", function() {
  updateCartBadge();
});

// Also update badge when storage changes (from other tabs/windows)
window.addEventListener("storage", function(e) {
  if (e.key === 'cart') {
    updateCartBadge();
  }
});

window.updateCartBadge = updateCartBadge;

// ========== SESSION & TRACKING ==========
// Get or create session ID
function getOrCreateSessionId() {
  const SESSION_KEY = "lilyFarmSession";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Log page visit
async function logPageVisit() {
  try {
    if (window.fbLogActivity) {
      await fbLogActivity("page_visit", {
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      });
    }
  } catch (error) {
    console.error("Error logging page visit:", error);
  }
}

// Track product view
async function trackProductView(productId, productName) {
  try {
    await fbLogActivity("product_view", {
      productId,
      productName
    });
  } catch (error) {
    console.error("Error tracking product view:", error);
  }
}

// ========== NOTIFICATION SYSTEM ==========
// Show notification toast
function showNotification(message, type = "success", duration = 3000) {
  let notificationContainer = document.getElementById("notificationContainer");
  
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    notificationContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement("div");
  const bgColor = type === "success" ? "#2e7d32" : type === "error" ? "#c62828" : "#1976d2";
  
  notification.style.cssText = `
    background: ${bgColor};
    color: white;
    padding: 16px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease;
    font-size: 0.95rem;
  `;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// ========== FORM VALIDATION ==========
// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone format
function isValidPhone(phone) {
  return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, "").length >= 7;
}

// Validate form data
function validateCheckoutForm(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }
  
  if (!isValidEmail(data.email)) {
    errors.push("Please enter a valid email address");
  }
  
  if (!isValidPhone(data.phone)) {
    errors.push("Please enter a valid phone number");
  }
  
  return { valid: errors.length === 0, errors };
}

// ========== PRICE FORMATTING ==========
// Format price for display
function formatPrice(price) {
  return "$" + Number(price).toFixed(2);
}

// Format currency
function formatCurrency(amount, currency = "TTD") {
  return currency + " $" + Number(amount).toFixed(2);
}

// ========== DATE & TIME ==========
// Format date for display
function formatDate(date) {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Format time for display
function formatTime(date) {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ========== STORAGE HELPERS ==========
// Get item from local storage
function getStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Storage access error:", e);
    return null;
  }
}

// Set item in local storage
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Storage write error:", e);
  }
}

// ========== WINDOW EXPORTS ==========
window.getOrCreateSessionId = getOrCreateSessionId;
window.logPageVisit = logPageVisit;
window.trackProductView = trackProductView;
window.showNotification = showNotification;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.validateCheckoutForm = validateCheckoutForm;
window.formatPrice = formatPrice;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.getStorageItem = getStorageItem;
window.setStorageItem = setStorageItem;

// Log initial page visit
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", logPageVisit);
} else {
  logPageVisit();
}
