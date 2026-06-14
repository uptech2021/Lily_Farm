(function () {
    const CART_KEY = "lilyFarmCart";

    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    const products = [
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

    const deliveryRates = {
        central: 60,
        north: 85,
        south: 60
    };

    function calcDeliveryFee(subtotal, option, region) {
        if (option !== "delivery") return 0;
        if (subtotal >= 500) return 0;
        if (region && deliveryRates[region]) return deliveryRates[region];
        return 60;
    }

    function updateSummary() {
        const cart = getCart();
        const deliveryOption = document.getElementById("deliveryOption");
        const regionSelect = document.getElementById("region");
        const subtotalEl = document.getElementById("checkoutSubtotal");
        const deliveryEl = document.getElementById("checkoutDelivery");
        const totalEl = document.getElementById("checkoutTotal");

        let subtotal = 0;
        cart.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (prod) subtotal += prod.price * item.qty;
        });

        const option = deliveryOption ? deliveryOption.value : "";
        const region = regionSelect ? regionSelect.value : "";
        const fee = calcDeliveryFee(subtotal, option, region);
        const total = subtotal + fee;

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (deliveryEl) {
            deliveryEl.textContent = option !== "delivery" ? "$0.00" : (fee === 0 ? "Free" : `$${fee.toFixed(2)}`);
        }
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    function renderCheckout() {
        const cart = getCart();
        const emptyEl = document.getElementById("emptyCart");
        const contentEl = document.getElementById("checkoutContent");
        const itemsEl = document.getElementById("checkoutItems");

        if (!cart.length) {
            if (emptyEl) emptyEl.style.display = "block";
            if (contentEl) contentEl.style.display = "none";
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";
        if (contentEl) contentEl.style.display = "grid";

        let html = "";

        cart.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (!prod) return;
            const lineTotal = prod.price * item.qty;
            html += `
                <div class="checkout-item">
                    <div class="checkout-item-img">
                        <img src="${prod.image}" alt="${prod.name}" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-seedling\\'></i>'">
                    </div>
                    <div class="checkout-item-info">
                        <h4>${prod.name}</h4>
                        <p>${prod.category}</p>
                    </div>
                    <div class="checkout-item-qty">x${item.qty}</div>
                    <div class="checkout-item-price">$${lineTotal.toFixed(2)}</div>
                </div>
            `;
        });

        itemsEl.innerHTML = html;
        updateSummary();
    }

    function handleDeliveryToggle() {
        const select = document.getElementById("deliveryOption");
        const fields = document.getElementById("deliveryFields");
        const region = document.getElementById("region");
        if (!select || !fields) return;

        if (region) {
            region.addEventListener("change", updateSummary);
        }

        function syncDelivery() {
            const isDelivery = select.value === "delivery";
            fields.style.display = isDelivery ? "block" : "none";
            updateSummary();
        }

        select.addEventListener("change", syncDelivery);
        syncDelivery();
    }

    function handleFormSubmit() {
        const form = document.getElementById("checkoutForm");
        if (!form) return;

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const name = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const delivery = document.getElementById("deliveryOption").value;

            if (!name || !email || !phone || !delivery) {
                const firstInvalid = form.querySelector(":invalid") || form.querySelector("#fullName");
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const cart = getCart();
            if (!cart.length) return;

            saveCart([]);

            document.getElementById("checkoutContent").style.display = "none";
            document.getElementById("orderSuccess").style.display = "block";

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderCheckout();
        handleDeliveryToggle();
        handleFormSubmit();
    });
})();
