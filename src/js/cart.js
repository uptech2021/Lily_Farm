(function () {
    "use strict";
    
    function loadProducts() {
        return [
            { id: "amaryllis", name: "Amaryllis", price: 45, category: "Lilies" },
            { id: "light-yellow-day-bloomer", name: "Light Yellow Day Bloomer", price: 50, category: "Lilies" },
            { id: "pink-indian-lotus", name: "Pink Indian Lotus", price: 55, category: "Lilies" },
            { id: "dark-yellow-day-bloomer", name: "Dark Yellow Day Bloomer", price: 52, category: "Lilies" },
            { id: "golden-champaca", name: "Golden Champaca", price: 48, category: "Lilies" },
            { id: "purple-blue-day-bloomer", name: "Purple Blue Day Bloomer", price: 58, category: "Lilies" },
            { id: "white-night-bloomer", name: "White Night Bloomer", price: 60, category: "Lilies" },
            { id: "whitebloomer", name: "Whitebloomer", price: 56, category: "Lilies" },
            { id: "rangoon-creeper", name: "Rangoon Creeper", price: 44, category: "Lilies" },
            { id: "dark-purple-day-bloomer", name: "Dark Purple Day Bloomer", price: 59, category: "Lilies" },
            { id: "dark-pink-night-bloomer", name: "Dark Pink Night Bloomer", price: 62, category: "Lilies" },
            { id: "light-pink-night-bloomer", name: "Light Pink Night Bloomer", price: 61, category: "Lilies" },
            { id: "light-purple-day-bloomer", name: "Light Purple Day Bloomer", price: 57, category: "Lilies" },
            { id: "variegated-purple-day-bloomer", name: "Variegated Purple Day Bloomer", price: 200, image: "img/variegated-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "white-purple-day-bloomer", name: "White Purple Day Bloomer", price: 150, image: "img/white-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "red-amaryllis", name: "Red Amaryllis", price: 100, image: "img/red-amaryllis.jpg", category: "Exotic Plants" },
            { id: "parrots-beak-heliconia", name: "Parrot's Beak Heliconia", price: 140, image: "img/parrot's-beak-heliconia.jpg", category: "Exotic Plants" }
        ];
    }

    // Get cart from localStorage
    function getLocalStorageCart() {
        const cart = localStorage.getItem('cart');
        console.log('Raw cart from localStorage:', cart);
        if (!cart) return [];
        try {
            const items = JSON.parse(cart);
            if (!Array.isArray(items)) return [];
            
            const products = loadProducts();
            const normalizedCart = items.map(item => {
                const product = products.find(p => p.id === item.id);
                return {
                    id: item.id,
                    name: item.name || (product ? product.name : 'Unknown Product'),
                    price: Number(item.price) || (product ? product.price : 0),
                    qty: Number(item.quantity || item.qty || 1),
                    category: product ? product.category : 'Lilies',
                    image: item.image || (product ? product.image : getProductImage(item.id))
                };
            });
            console.log('Normalized cart:', normalizedCart);
            return normalizedCart;
        } catch (e) {
            console.error('Error parsing cart:', e);
            return [];
        }
    }

    // Save cart to localStorage
    function saveLocalStorageCart(cart) {
        const cartData = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.qty || item.quantity || 1,
            image: item.image || getProductImage(item.id),
            category: item.category || 'Lilies'
        }));
        localStorage.setItem('cart', JSON.stringify(cartData));
        console.log('Saved cart to localStorage:', cartData);
        updateCartBadge();
    }

    // Update cart badge in navbar
    function updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) {
            console.log('Cart badge element not found');
            return;
        }
        const cart = getLocalStorageCart();
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = total;
        badge.style.display = 'inline-flex';
        console.log('Cart badge updated to:', total);
    }

    function getRecommended() {
        const products = loadProducts();
        const picks = ["pink-indian-lotus", "purple-blue-day-bloomer", "golden-champaca", "white-night-bloomer"];
        return picks.map(id => products.find(p => p.id === id)).filter(Boolean);
    }

    function getProductImage(productId) {
        const imageMap = {
            'amaryllis': 'img/amaryllis.jpg',
            'red-amaryllis': 'img/red-amaryllis.jpg',
            'light-yellow-day-bloomer': 'img/light-yellow-day-bloomer.jpg',
            'dark-yellow-day-bloomer': 'img/dark-yellow-day-bloomer.jpg',
            'purple-blue-day-bloomer': 'img/purple-blue-day-bloomer.jpg',
            'light-purple-day-bloomer': 'img/light-purple-day-bloomer.jpg',
            'dark-purple-day-bloomer': 'img/dark-purple-day-bloomer.jpg',
            'white-night-bloomer': 'img/white-night-bloomer.jpg',
            'light-pink-night-bloomer': 'img/light-pink-night-bloomer.jpg',
            'dark-pink-night-bloomer': 'img/dark-pink-night-bloomer.jpg',
            'pink-indian-lotus': 'img/pink-indian-lotus.jpg',
            'golden-champaca': 'img/golden-champaca.jpg',
            'rangoon-creeper': 'img/rangoon-creeper.jpg',
            'parrots-beak-heliconia': 'img/parrot\'s-beak-heliconia.jpg',
            'variegated-purple-day-bloomer': 'img/variegated-purple-day-bloomer.jpg',
            'white-purple-day-bloomer': 'img/white-purple-day-bloomer.jpg'
        };
        return imageMap[productId] || 'img/lily%20flowers.jpg';
    }

    function renderRecommended() {
        const grid = document.getElementById("recommendedGrid");
        if (!grid) {
            console.log('Recommended grid not found');
            return;
        }
        const items = getRecommended();
        grid.innerHTML = items.map(prod => `
            <div class="rec-card" data-id="${prod.id}">
                <div class="rec-card-img">
                    <img src="${getProductImage(prod.id)}" alt="${prod.name}" loading="lazy" onerror="this.src='img/lily%20flowers.jpg';">
                </div>
                <div class="rec-card-body">
                    <h4>${prod.name}</h4>
                    <div class="rec-category">${prod.category}</div>
                    <div class="rec-price">TTD $${Number(prod.price).toFixed(2)}</div>
                    <button class="rec-add-btn" data-action="recommended-add" data-id="${prod.id}" title="Add ${prod.name} to cart"><i class="fas fa-plus"></i> Add to Cart</button>
                </div>
            </div>
        `).join("");
    }

    function showToast(message) {
        let toast = document.getElementById("cartToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cartToast";
            toast.style.cssText = `
                position: fixed;
                top: 112px;
                right: 32px;
                background: rgba(255,255,255,0.96);
                color: #1f1f1f;
                border: 1px solid rgba(0,0,0,0.12);
                padding: 16px 22px;
                border-radius: 8px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                z-index: 10000;
                font-size: 1rem;
                font-weight: 500;
                letter-spacing: 0.02em;
                display: none;
                min-width: 220px;
                max-width: 320px;
                line-height: 1.4;
            `;
            const style = document.createElement("style");
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(30px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.display = "block";
        toast.style.animation = "slideIn 0.25s ease";
        clearTimeout(toast.timeout);
        toast.timeout = setTimeout(() => {
            toast.style.animation = "slideOut 0.25s ease";
            setTimeout(() => toast.style.display = "none", 250);
        }, 2500);
    }

    function renderCart() {
        console.log('renderCart called');
        const cart = getLocalStorageCart();
        const emptyEl = document.getElementById("emptyCart");
        const contentEl = document.getElementById("cartContent");
        const recEl = document.getElementById("recommendedSection");
        const itemsEl = document.getElementById("cartItems");
        const subtotalEl = document.getElementById("subtotal");
        const totalEl = document.getElementById("total");

        console.log('Cart items:', cart.length);
        console.log('DOM elements found:', {
            emptyEl: !!emptyEl,
            contentEl: !!contentEl,
            recEl: !!recEl,
            itemsEl: !!itemsEl,
            subtotalEl: !!subtotalEl,
            totalEl: !!totalEl
        });

        if (!cart || cart.length === 0) {
            console.log('Cart is empty, showing empty state');
            if (emptyEl) emptyEl.style.display = "block";
            if (contentEl) contentEl.style.display = "none";
            if (recEl) recEl.style.display = "block";
            renderRecommended();
            return;
        }

        console.log('Cart has items, showing cart content');
        if (emptyEl) emptyEl.style.display = "none";
        if (contentEl) contentEl.style.display = "block";
        if (recEl) recEl.style.display = "none";

        let html = "";
        let subtotal = 0;

        cart.forEach(item => {
            const lineTotal = Number(item.price) * item.qty;
            subtotal += lineTotal;
            console.log(`Item: ${item.name}, Price: ${item.price}, Qty: ${item.qty}, Line Total: ${lineTotal}`);
            const itemImage = item.image || getProductImage(item.id);
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${itemImage}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-seedling\' style=\'font-size: 2rem; color: #2e7d32;\'></i>'">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.category}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="cart-item-price">TTD $${lineTotal.toFixed(2)}</div>
                        <div class="qty-controls">
                            <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-btn" data-action="remove" data-id="${item.id}"><i class="fas fa-trash-alt"></i> Remove</button>
                    </div>
                </div>
            `;
        });

        if (itemsEl) {
            itemsEl.innerHTML = html;
            console.log('Cart items HTML set');
        }
        if (subtotalEl) subtotalEl.textContent = `TTD $${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `TTD $${subtotal.toFixed(2)}`;
    }

    function addToCart(productId) {
        const products = loadProducts();
        const product = products.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }
        
        const cart = getLocalStorageCart();
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.qty += 1;
            existingItem.image = existingItem.image || product.image || getProductImage(productId);
        } else {
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                qty: 1,
                category: product.category,
                image: product.image || getProductImage(productId)
            });
        }
        
        saveLocalStorageCart(cart);
        renderCart();
        updateCartBadge();
    }

    function updateQty(productId, delta) {
        const cart = getLocalStorageCart();
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        
        item.qty += delta;
        if (item.qty <= 0) {
            removeItem(productId);
            return;
        }
        
        saveLocalStorageCart(cart);
        renderCart();
        updateCartBadge();
    }

    function removeItem(productId) {
        const cart = getLocalStorageCart();
        const product = cart.find(i => i.id === productId);
        const filteredCart = cart.filter(i => i.id !== productId);
        
        saveLocalStorageCart(filteredCart);
        renderCart();
        updateCartBadge();
        
        if (product) {
            showToast(`✓ ${product.name} removed from cart`);
        }
    }

    function clearCart() {
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartBadge();
        renderCart();
    }

    // Ensure DOM is ready before initializing
    function initializeCart() {
        console.log('Initializing cart');
        renderCart();
        updateCartBadge();
    }

    // Add click event listener
    document.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === "increase") updateQty(id, 1);
        else if (action === "decrease") updateQty(id, -1);
        else if (action === "remove") removeItem(id);
        else if (action === "recommended-add") addToCart(id);
    });

    // Expose functions globally
    window.cartAdd = addToCart;
    window.cartRemove = removeItem;
    window.cartClear = clearCart;
    window.updateCartBadge = updateCartBadge;
    window.getLocalStorageCart = getLocalStorageCart;
    
    window.cartImgError = function (img) {
        img.style.display = "none";
        img.parentElement.innerHTML = '<i class="fas fa-seedling"></i>';
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCart);
    } else {
        initializeCart();
    }
})();

// ============ CHECKOUT ACTIVATION ============
// This function is called when user clicks "Proceed to Checkout" button
async function proceedToCheckout(event) {
    event.preventDefault();
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Validate cart is not empty
    if (!cart || cart.length === 0) {
        alert('🛒 Your cart is empty! Please add items before proceeding to checkout.');
        console.warn('Checkout blocked: Cart is empty');
        return false;
    }
    
    // Show loading state
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = '0.6';
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        console.log('🛒 Cart contents:', cart);
        console.log('📦 Total items:', cart.length);
        console.log('💰 Subtotal:', calculateSubtotal(cart));
        
        // Sync cart to Firebase for backup
        if (typeof fbSaveCart !== 'undefined') {
            try {
                await fbSaveCart(cart);
                console.log('✅ Cart synced to Firebase');
            } catch (fbError) {
                console.warn('⚠️ Firebase sync failed, but proceeding with local cart:', fbError);
            }
        }
        
        // Log checkout initiated
        if (typeof fbLogActivity !== 'undefined') {
            try {
                await fbLogActivity('checkout_initiated', {
                    itemCount: cart.length,
                    subtotal: calculateSubtotal(cart),
                    timestamp: new Date().toISOString()
                });
            } catch (logError) {
                console.warn('Analytics log failed:', logError);
            }
        }
        
        console.log('🚀 Redirecting to checkout page...');
        
        // Redirect to checkout
        window.location.href = 'checkout.html';
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        alert('⚠️ An error occurred. Please try again.');
        
        // Restore button state
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
            checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Proceed to Checkout';
        }
        
        return false;
    }
}

// Helper function to calculate subtotal
function calculateSubtotal(cart) {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.qty || item.quantity || 1));
    }, 0);
}
