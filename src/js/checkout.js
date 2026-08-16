(function () {
    var settingsCache = null;
    var deliveryMap = null;
    var userMarker = null;
    var userLocation = { lat: null, lng: null, accuracy: null };

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
        var selectedPayment = document.querySelector('[name="payment"]:checked')?.value || 'cash';
        var el = document.getElementById('wireDetails');
        var bankOptions = document.getElementById('bankTransferOptions');
        var cardOptions = document.getElementById('cardOptions');
        var cardDetailsBox = document.getElementById('cardDetailsBox');

        if (bankOptions) bankOptions.style.display = selectedPayment === 'bank_transfer' ? 'flex' : 'none';
        if (cardOptions) cardOptions.style.display = selectedPayment === 'card' ? 'flex' : 'none';
        if (cardDetailsBox) cardDetailsBox.style.display = selectedPayment === 'card' ? 'block' : 'none';
        if (el) el.style.display = selectedPayment === 'bank_transfer' ? 'block' : 'none';

        if (selectedPayment === 'bank_transfer') {
            var selectedBank = document.querySelector('[name="bank"]:checked')?.value || 'republic';
            var bankMap = {
                republic: { bank: 'Republic Bank', account: '2416939', type: 'Chequing' },
                scotiabank: { bank: 'Scotiabank', account: '2416939', type: 'Chequing' },
                rcb: { bank: 'Royal Bank', account: '2416939', type: 'Chequing' }
            };
            var info = bankMap[selectedBank] || bankMap.republic;
            var bankEl = document.getElementById('wireBank');
            var acctEl = document.getElementById('wireAcctNum');
            var typeEl = document.getElementById('wireAcctType');
            if (bankEl) bankEl.textContent = info.bank;
            if (acctEl) acctEl.textContent = info.account;
            if (typeEl) typeEl.textContent = info.type;
        }
    }
    window.togglePaymentDetails = togglePaymentDetails;

    function normalizeCardNumber(value) {
        return (value || '').replace(/\D/g, '').slice(0, 16);
    }

    function normalizeExpiry(value) {
        var digits = (value || '').replace(/\D/g, '').slice(0, 4);
        if (digits.length <= 2) return digits;
        return digits.slice(0, 2) + '/' + digits.slice(2);
    }

    function normalizeCvv(value) {
        return (value || '').replace(/\D/g, '').slice(0, 4);
    }

    // ========== GEOLOCATION FUNCTIONS ==========
    function initDeliveryMap() {
        if (deliveryMap) return; // Map already initialized
        
        var mapContainer = document.getElementById('deliveryMap');
        if (!mapContainer) return;
        
        // Default center: Trinidad coordinates (approximate)
        var defaultLat = 10.6918;
        var defaultLng = -61.2225;
        
        try {
            deliveryMap = L.map('deliveryMap').setView([defaultLat, defaultLng], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors',
                className: 'leaflet-tiles'
            }).addTo(deliveryMap);
            
            // Add click listener to map for manual location selection
            deliveryMap.on('click', function(e) {
                var lat = e.latlng.lat;
                var lng = e.latlng.lng;
                updateMapLocation(lat, lng, 'Manual selection');
            });
            
            console.log('Delivery map initialized');
        } catch (e) {
            console.error('Error initializing map:', e);
        }
    }

    function updateMapLocation(lat, lng, accuracy) {
        if (!deliveryMap) return;
        
        // Remove existing marker
        if (userMarker) {
            deliveryMap.removeLayer(userMarker);
        }
        
        // Add new marker
        userMarker = L.marker([lat, lng], {
            title: 'Your Delivery Location'
        }).addTo(deliveryMap);
        
        userMarker.bindPopup('<b>Your Location</b><br/>Lat: ' + lat.toFixed(4) + '<br/>Lng: ' + lng.toFixed(4));
        userMarker.openPopup();
        
        // Pan map to marker
        deliveryMap.setView([lat, lng], 14);
        
        // Update stored location
        userLocation.lat = lat;
        userLocation.lng = lng;
        userLocation.accuracy = accuracy;
        
        // Display location info
        var latEl = document.getElementById('displayLat');
        var lngEl = document.getElementById('displayLng');
        var accEl = document.getElementById('locationAccuracy');
        var infoEl = document.getElementById('locationInfo');
        
        if (latEl) latEl.textContent = lat.toFixed(6);
        if (lngEl) lngEl.textContent = lng.toFixed(6);
        if (accEl) {
            if (accuracy === 'Manual selection') {
                accEl.textContent = 'Manually selected on map';
            } else if (typeof accuracy === 'number') {
                accEl.textContent = 'Accuracy: ±' + Math.round(accuracy) + ' meters';
            } else {
                accEl.textContent = accuracy;
            }
        }
        if (infoEl) infoEl.style.display = 'block';
        
        console.log('Map location updated:', lat, lng, accuracy);
    }

    function requestGeolocation() {
        var btn = document.getElementById('useMyLocationBtn');
        var errorEl = document.getElementById('geolocationError');
        
        if (!navigator.geolocation) {
            if (errorEl) {
                errorEl.textContent = 'Geolocation is not supported by your browser. Please click on the map to select your location.';
                errorEl.style.display = 'block';
            }
            console.warn('Geolocation not supported');
            return;
        }
        
        if (btn) {
            btn.classList.add('loading');
            btn.disabled = true;
        }
        if (errorEl) errorEl.style.display = 'none';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                var accuracy = position.coords.accuracy;
                
                updateMapLocation(lat, lng, accuracy);
                
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
                console.log('Geolocation success:', lat, lng, accuracy);
            },
            function(error) {
                var message = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied. Please enable location access in your browser settings. You can also click on the map to select your location manually.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable. Please click on the map to select your location manually.';
                        break;
                    case error.TIMEOUT:
                        message = 'Geolocation request timed out. Please try again or click on the map to select your location.';
                        break;
                    default:
                        message = 'An error occurred while getting your location. Please click on the map to select your location manually.';
                }
                
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                }
                
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    function setupGeolocationButton() {
        var btn = document.getElementById('useMyLocationBtn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                requestGeolocation();
            });
        }
    }

    function updateSummary(cart) {
        var deliveryOption = document.getElementById("deliveryOption");
        var regionSelect = document.getElementById("region");
        var subtotalEl = document.getElementById("checkoutSubtotal");
        var deliveryEl = document.getElementById("checkoutDelivery");
        var totalEl = document.getElementById("checkoutTotal");

        var subtotal = 0;
        cart.forEach(function(item) {
            var qty = Number(item.qty || item.quantity || 1);
            var prod = window.products ? window.products[item.id] : null;
            var price = Number(item.price || 0);

            if ((!price || price <= 0) && prod) {
                price = Number(prod.price || 0);
            }

            subtotal += price * qty;
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
        var fallbackPrice = Number(item.price || 0);

        if (!prod) {
            var staticProducts = {
                "purple-blue-day-bloomer": { name: "Purple Blue Day Bloomer", price: 58, image: "img/purple-blue-day-bloomer.jpg", category: "Water Lilies" },
                "light-yellow-day-bloomer": { name: "Light Yellow Day Bloomer", price: 50, image: "img/light-yellow-day-bloomer.jpg", category: "Water Lilies" },
                "white-night-bloomer": { name: "White Night Bloomer", price: 60, image: "img/white-night-bloomer.jpg", category: "Water Lilies" },
                "light-pink-night-bloomer": { name: "Light Pink Night Bloomer", price: 61, image: "img/light-pink-night-bloomer.jpg", category: "Water Lilies" },
                "variegated-purple-day-bloomer": { name: "Variegated Purple Day Bloomer", price: 200, image: "img/variegated-purple-day-bloomer.jpg", category: "Water Lilies" },
                "light-purple-day-bloomer": { name: "Light Purple Day Bloomer", price: 57, image: "img/light-purple-day-bloomer.jpg", category: "Water Lilies" },
                "dark-purple-day-bloomer": { name: "Dark Purple Day Bloomer", price: 59, image: "img/dark-purple-day-bloomer.jpg", category: "Water Lilies" },
                "pink-indian-lotus": { name: "Pink Indian Lotus", price: 55, image: "img/pink-indian-lotus.jpg", category: "Water Lilies" },
                "dark-yellow-day-bloomer": { name: "Dark Yellow Day Bloomer", price: 52, image: "img/dark-yellow-day-bloomer.jpg", category: "Water Lilies" },
                "white-purple-day-bloomer": { name: "White Purple Day Bloomer", price: 150, image: "img/white-purple-day-bloomer.jpg", category: "Water Lilies" },
                "golden-champaca": { name: "Golden Champaca", price: 48, image: "img/golden-champaca.jpg", category: "Exotic Plants" },
                "amaryllis": { name: "Amaryllis", price: 45, image: "img/amaryllis.jpg", category: "Exotic Plants" },
                "red-amaryllis": { name: "Red Amaryllis", price: 100, image: "img/red-amaryllis.jpg", category: "Exotic Plants" },
                "rangoon-creeper": { name: "Rangoon Creeper", price: 44, image: "img/rangoon-creeper.jpg", category: "Exotic Plants" },
                "parrots-beak-heliconia": { name: "Parrot's Beak Heliconia", price: 140, image: "img/parrot's-beak-heliconia.jpg", category: "Exotic Plants" }
            };
            prod = staticProducts[item.id];
            if (!prod) return '';
        }

        var effectivePrice = Number(item.price || 0);
        if ((!effectivePrice || effectivePrice <= 0) && prod) {
            effectivePrice = Number(prod.price || 0);
        }
        var lineTotal = effectivePrice * Number(item.qty || item.quantity || 1);
        return '<div class="checkout-item"><div class="checkout-item-img"><img src="' + ((prod && prod.image) || item.image || '') + '" alt="' + ((prod && prod.name) || item.name || '') + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<i class=\\\'fas fa-seedling\\\'></i>\'"></div><div class="checkout-item-info"><h4>' + ((prod && prod.name) || item.name || '') + '</h4><p>' + ((prod && prod.category) || item.category || '') + '</p></div><div class="checkout-item-qty">x' + Number(item.qty || item.quantity || 1) + '</div><div class="checkout-item-price">$' + lineTotal.toFixed(2) + '</div></div>';
    }

    async function getCheckoutCart() {
        try {
            if (typeof fbGetCart === "function") {
                var remoteCart = await fbGetCart();
                if (Array.isArray(remoteCart) && remoteCart.length) {
                    return remoteCart;
                }
            }
        } catch (error) {
            console.warn("Remote cart unavailable, using local cart instead:", error);
        }

        try {
            var storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
            if (Array.isArray(storedCart) && storedCart.length) {
                return storedCart.map(function(item) {
                    return {
                        id: item.id,
                        qty: Number(item.qty || item.quantity || 1),
                        quantity: Number(item.qty || item.quantity || 1),
                        price: Number(item.price || 0),
                        name: item.name || "Product",
                        category: item.category || "Lilies",
                        image: item.image || ""
                    };
                });
            }
        } catch (error) {
            console.warn("Local cart unavailable:", error);
        }

        return [];
    }

    async function renderCheckout() {
        var cart = await getCheckoutCart();
        var normalizedCart = Array.isArray(cart) ? cart : [];
        var emptyEl = document.getElementById("emptyCart");
        var contentEl = document.getElementById("checkoutContent");
        var itemsEl = document.getElementById("checkoutItems");

        if (!normalizedCart.length) {
            if (emptyEl) emptyEl.style.display = "block";
            if (contentEl) contentEl.style.display = "none";
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";
        if (contentEl) contentEl.style.display = "grid";

        var html = '';
        normalizedCart.forEach(function(item) { html += renderCheckoutItem(item); });
        if (itemsEl) itemsEl.innerHTML = html;
        updateSummary(normalizedCart);
    }

    function handleDeliveryToggle() {
        var select = document.getElementById("deliveryOption");
        var fields = document.getElementById("deliveryFields");
        var region = document.getElementById("region");
        if (!select || !fields) return;

        if (region) {
            region.addEventListener("change", async function () {
                var cart = await getCheckoutCart();
                updateSummary(cart);
            });
        }

        function syncDelivery() {
            var isDelivery = select.value === "delivery";
            fields.style.display = isDelivery ? "block" : "none";
            
            // Initialize map when delivery is selected
            if (isDelivery && !deliveryMap) {
                // Add a small delay to ensure the map container is rendered
                setTimeout(function() {
                    initDeliveryMap();
                    setupGeolocationButton();
                }, 100);
            }
        }

        select.addEventListener("change", async function () {
            syncDelivery();
            var cart = await getCheckoutCart();
            updateSummary(cart);
        });

        syncDelivery();
    }

    function handleFormSubmit() {
        var form = document.getElementById("checkoutForm");
        if (!form) return;

        var placeOrderBtn = document.querySelector(".place-order-btn");
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener("click", function (e) {
                e.preventDefault();
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                form.requestSubmit();
            });
        }

        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            var name = document.getElementById("fullName").value.trim();
            var email = document.getElementById("email").value.trim();
            var phone = document.getElementById("phone").value.trim();
            var delivery = document.getElementById("deliveryOption").value;
            var paymentMethod = document.querySelector('[name="payment"]:checked')?.value || "cash";
            var selectedBank = document.querySelector('[name="bank"]:checked')?.value || null;
            var selectedCard = document.querySelector('[name="card"]:checked')?.value || null;
            var cardName = document.getElementById('cardName')?.value?.trim() || null;
            var cardNumber = normalizeCardNumber(document.getElementById('cardNumber')?.value || '');
            var cardExpiry = document.getElementById('cardExpiry')?.value?.trim() || null;
            var cardCvv = normalizeCvv(document.getElementById('cardCvv')?.value || '');
            var region = document.getElementById("region")?.value || null;
            var address = document.getElementById("address")?.value || null;
            var city = document.getElementById("city")?.value || null;
            var notes = document.getElementById("notes")?.value || null;

            // Keep checkout moving without any blocking validation modal.
            if (!name || !email || !phone || !delivery) {
                return;
            }

            if (delivery === "delivery") {
                if (!address || !city) {
                    return;
                }
            }

            var cart = await getCheckoutCart();
            if (!cart.length) return;

            if (paymentMethod === 'card') {
                if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
                    return;
                }
            }

            var subtotal = 0;
            cart.forEach(function(item) {
                var prod = window.products ? window.products[item.id] : null;
                var price = Number(item.price || 0);
                if ((!price || price <= 0) && prod) {
                    price = Number(prod.price || 0);
                }
                subtotal += price * Number(item.qty || item.quantity || 1);
            });
            var deliveryFee = calcDeliveryFee(subtotal, delivery, region);
            var total = subtotal + deliveryFee;

            // Disable form during submission
            form.style.opacity = "0.6";
            form.style.pointerEvents = "none";

            try {
                // Save customer data
                await fbSaveCustomer({ name, email, phone });

                // Prepare location data
                var locationData = null;
                if (delivery === "delivery" && userLocation.lat && userLocation.lng) {
                    locationData = {
                        latitude: userLocation.lat,
                        longitude: userLocation.lng,
                        accuracy: userLocation.accuracy,
                        address: address,
                        city: city
                    };
                }

                // Save order to Firebase with location data
                var orderId = await fbSaveOrder({
                    customerName: name,
                    customerEmail: email,
                    customerPhone: phone,
                    items: cart,
                    subtotal: subtotal,
                    deliveryFee: deliveryFee,
                    total: total,
                    deliveryOption: delivery,
                    paymentMethod: paymentMethod,
                    bank: selectedBank,
                    card: selectedCard,
                    cardDetails: paymentMethod === 'card' ? {
                        name: cardName,
                        number: cardNumber,
                        expiry: cardExpiry,
                        cvv: cardCvv
                    } : null,
                    region: region,
                    address: address,
                    city: city,
                    notes: notes,
                    location: locationData
                });

                // Log activity
                await fbLogActivity("purchase", {
                    orderId: orderId,
                    total: total,
                    itemCount: cart.length,
                    deliveryOption: delivery,
                    hasLocation: !!locationData
                });

                // Clear cart
                await fbClearCart();

                // Show success
                document.getElementById("checkoutContent").style.display = "none";
                document.getElementById("orderSuccess").style.display = "block";
                
                // Display order confirmation details
                var orderIdEl = document.getElementById("orderIdDisplay");
                if (orderIdEl) {
                    orderIdEl.textContent = orderId;
                }
                var orderEmailEl = document.getElementById("orderEmailDisplay");
                if (orderEmailEl) {
                    orderEmailEl.textContent = email;
                }

                window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (error) {
                console.error("Checkout error:", error);
                form.style.opacity = "1";
                form.style.pointerEvents = "auto";
            }
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
