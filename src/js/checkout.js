(function () {
    var settingsCache = null;

    async function loadSettings() {
        var defaults = {
            deliveryThreshold: 500,
            deliveryCentral: 60,
            deliveryNorth: 85,
            deliverySouth: 60,
            wireAcctName: "Rishi's Lily Farm & Exotic Plants",
            wireBank: 'Scotiabank Couva',
            wireAcctNum: '2416939',
            wireAcctType: 'Chequing',
            email: 'darren.kowlessar6@gmail.com'
        };
        try {
            if (typeof db !== 'undefined' && db) {
                var doc = await db.collection('settings').doc('global').get();
                if (doc.exists) { settingsCache = Object.assign({}, defaults, doc.data()); return; }
            }
        } catch (e) { console.warn('Checkout settings load failed:', e); }
        settingsCache = defaults;
    }

    function getDeliveryRates() {
        if (!settingsCache) return { central: 60, north: 85, south: 60 };
        return {
            central: settingsCache.deliveryCentral || 60,
            north: settingsCache.deliveryNorth || 85,
            south: settingsCache.deliverySouth || 60
        };
    }

    function getFreeThreshold() { return (settingsCache && settingsCache.deliveryThreshold) || 500; }

    function calcDeliveryFee(subtotal, option, region) {
        if (option !== "delivery") return 0;
        if (subtotal >= getFreeThreshold()) return 0;
        var rates = getDeliveryRates();
        return (region && rates[region]) ? rates[region] : 60;
    }

    function populateWireDetails() {
        if (!settingsCache) return;
        var id = function(id) { return document.getElementById(id); };
        if (id('wireAcctName')) id('wireAcctName').textContent = settingsCache.wireAcctName || "Rishi's Lily Farm & Exotic Plants";
        if (id('wireBank')) id('wireBank').textContent = settingsCache.wireBank || 'Scotiabank Couva';
        if (id('wireAcctNum')) id('wireAcctNum').textContent = settingsCache.wireAcctNum || '2416939';
        if (id('wireAcctType')) id('wireAcctType').textContent = settingsCache.wireAcctType || 'Chequing';
        if (id('wireEmail')) id('wireEmail').textContent = settingsCache.email || 'darren.kowlessar6@gmail.com';
    }

    function togglePaymentDetails() {
        var el = document.getElementById('wireDetails');
        if (!el) return;
        el.style.display = document.querySelector('[name="payment"]:checked')?.value === 'wire' ? 'block' : 'none';
    }
    window.togglePaymentDetails = togglePaymentDetails;

    function updateSummary(cart) {
        var deliveryOption = document.getElementById("deliveryOption");
        var regionSelect = document.getElementById("region");
        var subtotalEl = document.getElementById("checkoutSubtotal");
        var deliveryEl = document.getElementById("checkoutDelivery");
        var totalEl = document.getElementById("checkoutTotal");

        var subtotal = 0;
        cart.forEach(function(item) {
            var prod = window.products ? window.products[item.id] : null;
            if (prod) subtotal += Number(prod.price) * item.qty;
        });

        var option = deliveryOption ? deliveryOption.value : "";
        var region = regionSelect ? regionSelect.value : "";
        var fee = calcDeliveryFee(subtotal, option, region);
        var total = subtotal + fee;

        if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
        if (deliveryEl) {
            deliveryEl.textContent = option !== "delivery" ? '$0.00' : (fee === 0 ? 'Free' : '$' + fee.toFixed(2));
        }
        if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    }

    function renderCheckoutItem(item) {
        var prod = window.products ? window.products[item.id] : null;
        if (!prod) {
            var staticProducts = {
                "purple-blue-day-bloomer": { name: "Purple Blue Day Bloomer", price: 150, image: "img/purple-blue-day-bloomer.jpg", category: "Water Lilies" },
                "light-yellow-day-bloomer": { name: "Light Yellow Day Bloomer", price: 150, image: "img/light-yellow-day-bloomer.jpg", category: "Water Lilies" },
                "white-night-bloomer": { name: "White Night Bloomer", price: 180, image: "img/white-night-bloomer.jpg", category: "Water Lilies" },
                "light-pink-night-bloomer": { name: "Light Pink Night Bloomer", price: 180, image: "img/light-pink-night-bloomer.jpg", category: "Water Lilies" },
                "variegated-purple-day-bloomer": { name: "Variegated Purple Day Bloomer", price: 200, image: "img/variegated-purple-day-bloomer.jpg", category: "Water Lilies" },
                "light-purple-day-bloomer": { name: "Light Purple Day Bloomer", price: 150, image: "img/light-purple-day-bloomer.jpg", category: "Water Lilies" },
                "dark-purple-day-bloomer": { name: "Dark Purple Day Bloomer", price: 150, image: "img/dark-purple-day-bloomer.jpg", category: "Water Lilies" },
                "pink-indian-lotus": { name: "Pink Indian Lotus", price: 250, image: "img/pink-indian-lotus.jpg", category: "Water Lilies" },
                "dark-yellow-day-bloomer": { name: "Dark Yellow Day Bloomer", price: 150, image: "img/dark-yellow-day-bloomer.jpg", category: "Water Lilies" },
                "white-purple-day-bloomer": { name: "White Purple Day Bloomer", price: 150, image: "img/white-purple-day-bloomer.jpg", category: "Water Lilies" },
                "golden-champaca": { name: "Golden Champaca", price: 120, image: "img/golden-champaca.jpg", category: "Exotic Plants" },
                "amaryllis": { name: "Amaryllis", price: 100, image: "img/amaryllis.jpg", category: "Exotic Plants" },
                "red-amaryllis": { name: "Red Amaryllis", price: 100, image: "img/red-amaryllis.jpg", category: "Exotic Plants" },
                "rangoon-creeper": { name: "Rangoon Creeper", price: 130, image: "img/rangoon-creeper.jpg", category: "Exotic Plants" },
                "parrots-beak-heliconia": { name: "Parrot's Beak Heliconia", price: 140, image: "img/parrot-s-beak-heliconia.jpg", category: "Exotic Plants" }
            };
            prod = staticProducts[item.id];
            if (!prod) return '';
        }
        var lineTotal = Number(prod.price) * item.qty;
        return '<div class="checkout-item"><div class="checkout-item-img"><img src="' + (prod.image || '') + '" alt="' + (prod.name || '') + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<i class=\\\'fas fa-seedling\\\'></i>\'"></div><div class="checkout-item-info"><h4>' + (prod.name || '') + '</h4><p>' + (prod.category || '') + '</p></div><div class="checkout-item-qty">x' + item.qty + '</div><div class="checkout-item-price">$' + lineTotal.toFixed(2) + '</div></div>';
    }

    async function renderCheckout() {
        var cart = await fbGetCart();
        var emptyEl = document.getElementById("emptyCart");
        var contentEl = document.getElementById("checkoutContent");
        var itemsEl = document.getElementById("checkoutItems");

        if (!cart.length) {
            if (emptyEl) emptyEl.style.display = "block";
            if (contentEl) contentEl.style.display = "none";
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";
        if (contentEl) contentEl.style.display = "grid";

        var html = '';
        cart.forEach(function(item) { html += renderCheckoutItem(item); });
        itemsEl.innerHTML = html;
        updateSummary(cart);
    }

    function handleDeliveryToggle() {
        var select = document.getElementById("deliveryOption");
        var fields = document.getElementById("deliveryFields");
        var region = document.getElementById("region");
        if (!select || !fields) return;

        if (region) {
            region.addEventListener("change", async function () {
                var cart = await fbGetCart();
                updateSummary(cart);
            });
        }

        function syncDelivery() {
            fields.style.display = select.value === "delivery" ? "block" : "none";
        }

        select.addEventListener("change", async function () {
            syncDelivery();
            var cart = await fbGetCart();
            updateSummary(cart);
        });

        syncDelivery();
    }

    function handleFormSubmit() {
        var form = document.getElementById("checkoutForm");
        if (!form) return;

        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            var name = document.getElementById("fullName").value.trim();
            var email = document.getElementById("email").value.trim();
            var phone = document.getElementById("phone").value.trim();
            var delivery = document.getElementById("deliveryOption").value;

            if (!name || !email || !phone || !delivery) {
                var firstInvalid = form.querySelector(":invalid") || form.querySelector("#fullName");
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            var cart = await fbGetCart();
            if (!cart.length) return;

            await fbClearCart();

            document.getElementById("checkoutContent").style.display = "none";
            document.getElementById("orderSuccess").style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    document.addEventListener("DOMContentLoaded", async function () {
        await loadSettings();
        populateWireDetails();
        togglePaymentDetails();
        renderCheckout();
        handleDeliveryToggle();
        handleFormSubmit();
    });
})();
