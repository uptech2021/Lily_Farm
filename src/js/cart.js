(function () {
    const CART_KEY = "lilyFarmCart";

    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function loadProducts() {
        const stored = localStorage.getItem("lilyFarmProducts");
        if (stored) {
            try { return JSON.parse(stored); } catch { return []; }
        }
        const defaults = [
            { id: "purple-blue-day-bloomer", name: "Purple Blue Day Bloomer", price: 150, image: "img/purple-blue-day-bloomer.jpg", category: "Water Lilies" },
            { id: "light-yellow-day-bloomer", name: "Light Yellow Day Bloomer", price: 150, image: "img/light-yellow-day-bloomer.jpg", category: "Water Lilies" },
            { id: "white-night-bloomer", name: "White Night Bloomer", price: 180, image: "img/white-night-bloomer.jpg", category: "Water Lilies" },
            { id: "light-pink-night-bloomer", name: "Light Pink Night Bloomer", price: 180, image: "img/light-pink-night-bloomer.jpg", category: "Water Lilies" },
            { id: "variegated-purple-day-bloomer", name: "Variegated Purple Day Bloomer", price: 200, image: "img/variegated-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "light-purple-day-bloomer", name: "Light Purple Day Bloomer", price: 150, image: "img/light-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "dark-purple-day-bloomer", name: "Dark Purple Day Bloomer", price: 150, image: "img/dark-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "pink-indian-lotus", name: "Pink Indian Lotus", price: 250, image: "img/pink-indian-lotus.jpg", category: "Water Lilies" },
            { id: "dark-yellow-day-bloomer", name: "Dark Yellow Day Bloomer", price: 150, image: "img/dark-yellow-day-bloomer.jpg", category: "Water Lilies" },
            { id: "white-purple-day-bloomer", name: "White Purple Day Bloomer", price: 150, image: "img/white-purple-day-bloomer.jpg", category: "Water Lilies" },
            { id: "golden-champaca", name: "Golden Champaca", price: 120, image: "img/golden-champaca.jpg", category: "Exotic Plants" },
            { id: "amaryllis", name: "Amaryllis", price: 100, image: "img/amaryllis.jpg", category: "Exotic Plants" },
            { id: "red-amaryllis", name: "Red Amaryllis", price: 100, image: "img/red-amaryllis.jpg", category: "Exotic Plants" },
            { id: "rangoon-creeper", name: "Rangoon Creeper", price: 130, image: "img/rangoon-creeper.jpg", category: "Exotic Plants" },
            { id: "parrots-beak-heliconia", name: "Parrot's Beak Heliconia", price: 140, image: "img/parrot's-beak-heliconia.jpg", category: "Exotic Plants" }
        ];
        return defaults;
    }

    function getRecommended() {
        const products = loadProducts();
        const picks = [
            "pink-indian-lotus",
            "purple-blue-day-bloomer",
            "golden-champaca",
            "white-night-bloomer"
        ];
        return picks.map(id => products.find(p => p.id === id)).filter(Boolean);
    }

    function renderRecommended() {
        const grid = document.getElementById("recommendedGrid");
        if (!grid) return;
        const items = getRecommended();
        grid.innerHTML = items.map(prod => `
            <div class="rec-card" data-id="${prod.id}">
                <div class="rec-card-img">
                    <img src="${prod.image}" alt="${prod.name}" loading="lazy" onerror="cartImgError(this)">
                </div>
                <div class="rec-card-body">
                    <h4>${prod.name}</h4>
                    <div class="rec-category">${prod.category}</div>
                    <div class="rec-price">$${prod.price.toFixed(2)}</div>
                    <button class="rec-add-btn" data-action="recommended-add" data-id="${prod.id}"><i class="fas fa-plus"></i> Add to Cart</button>
                </div>
            </div>
        `).join("");
    }

    function renderCart() {
        const cart = getCart();
        const emptyEl = document.getElementById("emptyCart");
        const contentEl = document.getElementById("cartContent");
        const recEl = document.getElementById("recommendedSection");
        const itemsEl = document.getElementById("cartItems");
        const subtotalEl = document.getElementById("subtotal");
        const totalEl = document.getElementById("total");

        if (!cart.length) {
            emptyEl.style.display = "block";
            contentEl.style.display = "none";
            if (recEl) recEl.style.display = "block";
            renderRecommended();
            return;
        }

        emptyEl.style.display = "none";
        contentEl.style.display = "block";
        if (recEl) recEl.style.display = "none";

        const products = loadProducts();
        let html = "";
        let subtotal = 0;

        cart.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (!prod) return;
            const lineTotal = prod.price * item.qty;
            subtotal += lineTotal;
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${prod.image}" alt="${prod.name}" onerror="cartImgError(this)">
                    </div>
                    <div class="cart-item-info">
                        <h4>${prod.name}</h4>
                        <p>${prod.category}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="cart-item-price">$${lineTotal.toFixed(2)}</div>
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

        itemsEl.innerHTML = html;
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        totalEl.textContent = `$${subtotal.toFixed(2)}`;
    }

    function addToCart(productId) {
        const products = loadProducts();
        if (!products.find(p => p.id === productId)) return;
        let cart = getCart();
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id: productId, qty: 1 });
        }
        saveCart(cart);
        renderCart();
    }

    function updateQty(productId, delta) {
        let cart = getCart();
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart(cart);
        renderCart();
    }

    function removeItem(productId) {
        let cart = getCart().filter(i => i.id !== productId);
        saveCart(cart);
        renderCart();
    }

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

    window.addEventListener("storage", function (e) {
        if (e.key === CART_KEY) renderCart();
    });

    window.cartAdd = addToCart;
    window.cartImgError = function (img) {
        img.style.display = "none";
        img.parentElement.innerHTML = '<i class="fas fa-seedling"></i>';
    };

    renderCart();
})();
