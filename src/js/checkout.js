(function () {
    var settingsCache = null;
    var deliveryMap = null;
    var userMarker = null;
    var userLocation = { lat: null, lng: null, accuracy: null };
    var currentConfirmation = null;

    async function loadSettings() {
        var defaults = {
            deliveryThreshold: 500,
            deliveryCentral: 60,
            deliveryNorth: 85,
            deliverySouth: 60,
            wireAcctName: '',
            wireBank: '',
            wireAcctNum: '',
            wireAcctType: '',
            paymentInstructions: '',
            paymentProofEmail: 'darren.kowlessar6@gmail.com',
            email: 'darren.kowlessar6@gmail.com'
        };
        try {
            if (window.StoreSettings) { settingsCache = await StoreSettings.load(); configureCheckoutFromSettings(); return; }
            if (typeof db !== 'undefined' && db) {
                var doc = await db.collection('settings').doc('global').get();
                if (doc.exists) { settingsCache = Object.assign({}, defaults, doc.data()); return; }
            }
        } catch (e) { console.warn('Checkout settings load failed:', e); }
        settingsCache = defaults;
    }

    function getDeliveryRates() {
        if (settingsCache && Array.isArray(settingsCache.deliveryRegions)) return settingsCache.deliveryRegions.filter(function(r){return r.enabled !== false}).reduce(function(map,r){map[r.id]=Number(r.fee)||0;return map},{});
        if (!settingsCache) return { central: 60, north: 85, south: 60 };
        return {
            central: settingsCache.deliveryCentral || 60,
            north: settingsCache.deliveryNorth || 85,
            south: settingsCache.deliverySouth || 60
        };
    }

    function getFreeThreshold() { return settingsCache && settingsCache.freeDeliveryEnabled === false ? Infinity : Number((settingsCache && settingsCache.deliveryThreshold) || 500); }

    function calcDeliveryFee(subtotal, option, region) {
        if (option !== "delivery") return 0;
        if (subtotal >= getFreeThreshold()) return 0;
        var rates = getDeliveryRates();
        return region && Object.prototype.hasOwnProperty.call(rates, region) ? rates[region] : 0;
    }

    function configureCheckoutFromSettings() {
        var region = document.getElementById('region');
        if (region && Array.isArray(settingsCache.deliveryRegions)) region.innerHTML = '<option value="">Select region</option>' + settingsCache.deliveryRegions.filter(function(r){return r.enabled !== false}).map(function(r){return '<option value="'+escapeHtml(r.id)+'">'+escapeHtml(r.name)+'</option>'}).join('');
        var deliveryOption = document.getElementById('deliveryOption');
        if (deliveryOption && settingsCache.pickupEnabled === false) deliveryOption.querySelector('option[value="pickup"]')?.remove();
        var methods = settingsCache.paymentMethods || {cash:true,bankTransfer:true};
        document.querySelector('[name="payment"][value="cash"]')?.closest('.payment-option')?.toggleAttribute('hidden', methods.cash === false);
        document.querySelector('[name="payment"][value="bank_transfer"]')?.closest('.payment-option')?.toggleAttribute('hidden', methods.bankTransfer === false);
        var selected=document.querySelector('[name="payment"]:checked'); if(selected&&selected.closest('.payment-option')?.hidden){selected.checked=false;document.querySelector('.payment-option:not([hidden]) input')?.click();}
    }

    function populateWireDetails() {
        if (!settingsCache) return;
        var id = function(id) { return document.getElementById(id); };
        var configured = !!(settingsCache.wireAcctName && settingsCache.wireBank && (settingsCache.paymentInstructions || settingsCache.wireAcctNum));
        if (id('wireAcctName')) id('wireAcctName').textContent = settingsCache.wireAcctName || 'To be confirmed';
        if (id('wireBank')) id('wireBank').textContent = settingsCache.wireBank || 'To be confirmed';
        if (id('wireAcctNum')) id('wireAcctNum').textContent = settingsCache.wireAcctNum || 'Provided after order review';
        if (id('wireAcctType')) id('wireAcctType').textContent = settingsCache.wireAcctType || 'To be confirmed';
        if (id('wireEmail')) id('wireEmail').textContent = settingsCache.paymentProofEmail || settingsCache.email || 'darren.kowlessar6@gmail.com';
        if (id('wireConfiguredDetails')) id('wireConfiguredDetails').hidden = !configured;
        if (id('wireProofNote')) id('wireProofNote').hidden = !configured;
        if (id('wireConfigWarning')) id('wireConfigWarning').hidden = configured;
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

        document.querySelectorAll('.payment-option').forEach(function(option) { option.classList.toggle('selected', !!option.querySelector('input:checked')); });
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

    async function reverseGeocode(lat, lng) {
        var errorEl = document.getElementById('geolocationError');
        try {
            var response = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng), { headers: { 'Accept': 'application/json' } });
            if (!response.ok) throw new Error('Address lookup failed');
            var result = await response.json(), address = result.address || {};
            document.getElementById('address').value = address.road || address.pedestrian || address.neighbourhood || result.display_name || '';
            document.getElementById('city').value = address.city || address.town || address.village || address.suburb || '';
            var regionName = String(address.state || address.region || address.county || '').toLowerCase();
            var region = regionName.includes('north') || regionName.includes('port of spain') || regionName.includes('diego martin') ? 'north' : (regionName.includes('south') || regionName.includes('princes town') || regionName.includes('penal') || regionName.includes('siparia') ? 'south' : 'central');
            document.getElementById('region').value = region;
            if (errorEl) { errorEl.textContent = 'Location selected ✓ Address found: ' + (result.display_name || 'Please review the address fields.'); errorEl.classList.add('success-message'); errorEl.style.display = 'block'; }
            var cart = await getCheckoutCart(); updateSummary(cart);
        } catch (error) {
            if (errorEl) { errorEl.textContent = 'Location selected ✓ We could not resolve the street address. Please enter or correct it manually.'; errorEl.style.display = 'block'; }
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
        reverseGeocode(lat, lng);
        
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
                        message = "We couldn't access your current location. You can enter your address manually or choose your location on the map.";
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
        cart.forEach(function(item) { subtotal += Number(item.lineTotal || 0); });
        var discount = cart.reduce(function(sum, item) { return sum + (Number(item.basePrice || item.unitPrice || 0) - Number(item.unitPrice || 0)) * Number(item.quantity || 1); }, 0);

        var option = deliveryOption ? deliveryOption.value : "";
        var region = regionSelect ? regionSelect.value : "";
        var fee = calcDeliveryFee(subtotal, option, region);
        var total = subtotal + fee;

        if (subtotalEl) subtotalEl.textContent = 'TTD $' + subtotal.toFixed(2);
        var discountRow = document.getElementById('checkoutDiscountRow');
        if (discountRow) { discountRow.style.display = discount > 0 ? 'flex' : 'none'; document.getElementById('checkoutDiscount').textContent = '-TTD $' + discount.toFixed(2); }
        var savingsMessage = document.getElementById('checkoutSavingsMessage');
        if (savingsMessage) {
            savingsMessage.hidden = !(discount > 0);
            document.getElementById('checkoutSavingsValue').textContent = 'TTD $' + discount.toFixed(2);
        }
        if (deliveryEl) {
            deliveryEl.textContent = option !== "delivery" ? 'TTD $0.00' : (fee === 0 ? 'Free' : 'TTD $' + fee.toFixed(2));
        }
        if (totalEl) totalEl.textContent = 'TTD $' + total.toFixed(2);
    }

    function renderCheckoutItem(item) {
        var price = item.discount ? '<span class="checkout-old-price">TTD $' + item.basePrice.toFixed(2) + '</span><strong>TTD $' + item.unitPrice.toFixed(2) + '</strong>' : '<strong>TTD $' + item.unitPrice.toFixed(2) + '</strong>';
        return '<div class="checkout-item"><div class="checkout-item-img"><img src="' + (item.image || 'img/' + item.id + '.jpg') + '" alt="' + item.name + '" onerror="this.style.display=\'none\'"></div><div class="checkout-item-info"><h4>' + item.name + '</h4><p>' + (item.category || item.product && item.product.category || 'Plant') + ' · Qty ' + item.quantity + '<br>' + price + '</p></div><div class="checkout-item-price">TTD $' + item.lineTotal.toFixed(2) + '</div></div>';
    }

    function escapeHtml(value) {
        var div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML;
    }

    function showCheckoutError(message, title) {
        var box = document.getElementById('checkoutError');
        document.getElementById('checkoutErrorTitle').textContent = title || 'We couldn’t place your order';
        document.getElementById('checkoutErrorMessage').textContent = message || 'Please review your cart and try again.';
        box.hidden = false;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showConfirmation(data) {
        currentConfirmation = data;
        document.querySelectorAll('.checkout-step').forEach(function(step) { step.classList.add('checkout-step--complete'); step.classList.remove('checkout-step--active'); });
        document.getElementById('orderIdDisplay').textContent = data.orderNumber;
        document.getElementById('confirmationInvoiceStatus').textContent = 'Sending your invoice to ' + data.customer.email + '…';
        var items = data.items.map(function(item) { return '<div class="checkout-item"><div class="checkout-item-info"><h4>' + escapeHtml(item.name) + '</h4><p>Qty ' + item.quantity + ' · TTD $' + item.unitPrice.toFixed(2) + '</p></div><div class="checkout-item-price">TTD $' + item.lineTotal.toFixed(2) + '</div></div>'; }).join('');
        document.getElementById('confirmationDetails').innerHTML = '<div class="confirmation-card confirmation-items"><h3>Order summary</h3>' + items + '<p><strong>Total: TTD $' + data.total.toFixed(2) + '</strong></p></div><div class="confirmation-card"><h3>Customer & delivery</h3><p><strong>' + escapeHtml(data.customer.name) + '</strong></p><p>' + escapeHtml(data.customer.email) + '</p><p>' + escapeHtml(data.customer.phone) + '</p><p>' + escapeHtml(data.delivery.method === 'delivery' ? [data.delivery.address,data.delivery.city,data.delivery.region].filter(Boolean).join(', ') : 'Farm pickup') + '</p><p><strong>Payment:</strong> ' + escapeHtml(data.paymentMethod === 'bank_transfer' ? 'Bank transfer · Awaiting payment' : 'Cash · Pending') + '</p></div>';
        var paymentStep = document.getElementById('confirmationPaymentStep');
        paymentStep.hidden = data.paymentMethod !== 'bank_transfer';
        if (!paymentStep.hidden) paymentStep.innerHTML = '<strong>Next step:</strong> Use <strong>' + escapeHtml(data.orderNumber) + '</strong> as your payment reference. Email a screenshot or payment receipt to <strong>' + escapeHtml(settingsCache.paymentProofEmail || settingsCache.email || 'darren.kowlessar6@gmail.com') + '</strong>. Your payment will remain awaiting confirmation until reviewed.';
    }

    function downloadInvoice() {
        if (!currentConfirmation) return;
        window.location.href = '/api/orders/invoice?orderId=' + encodeURIComponent(currentConfirmation.orderId) + '&token=' + encodeURIComponent(currentConfirmation.invoiceAccessToken);
    }

    async function sendAutomaticInvoice(data) {
        var status = document.getElementById('confirmationInvoiceStatus');
        try {
            var response = await fetch('/api/orders/invoice-email', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({orderId:data.orderId,token:data.invoiceAccessToken}) });
            var result = await response.json().catch(function(){ return {}; });
            if (!response.ok || result.status !== 'sent') throw new Error(result.code || 'DELIVERY_FAILED');
            status.className = 'confirmation-invoice-status success';
            status.textContent = 'We’ve sent your invoice to: ' + data.customer.email;
        } catch (error) {
            status.className = 'confirmation-invoice-status failed';
            status.textContent = 'We couldn’t email your invoice right now, but your order was placed successfully. You can download it below.';
        }
    }

    async function getCheckoutCart() {
        var result = await commerce.resolveCart();
        return result.items;
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
            var selectedBank = paymentMethod === 'bank_transfer' ? (settingsCache.wireBank || null) : null;
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

            var cartResult = await commerce.resolveCart();
            var cart = cartResult.items;
            if (!cart.length) return;
            if (cartResult.issues.length) {
                showCheckoutError('Availability changed while you were shopping. ' + cartResult.issues.map(function(issue){ return issue.message; }).join(' '), 'Please review your cart');
                return;
            }

            var subtotal = 0;
            cart.forEach(function(item) { subtotal += item.lineTotal; });
            var deliveryFee = calcDeliveryFee(subtotal, delivery, region);
            var total = subtotal + deliveryFee;

            // Disable form during submission
            form.style.opacity = "0.6";
            form.style.pointerEvents = "none";
            document.getElementById('checkoutError').hidden = true;
            if (placeOrderBtn) { placeOrderBtn.disabled = true; placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing your order…'; }

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
                var savedOrder = await fbSaveOrder({
                    customerName: name,
                    customerEmail: email,
                    customerPhone: phone,
                    items: cart.map(function(item) { return { productId:item.id, firestoreId:item.product.firestoreId, quantity:item.quantity }; }),
                    subtotal: subtotal,
                    deliveryFee: deliveryFee,
                    total: total,
                    deliveryOption: delivery,
                    paymentMethod: paymentMethod,
                    bank: selectedBank,
                    region: region,
                    address: address,
                    city: city,
                    notes: notes,
                    location: locationData
                });

                // Log activity
                await fbLogActivity("purchase", {
                    orderId: savedOrder.orderId,
                    orderNumber: savedOrder.orderNumber,
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
                
                var discount = cart.reduce(function(sum,item){ return sum + (Number(item.basePrice||item.unitPrice)-Number(item.unitPrice))*Number(item.quantity); },0);
                var confirmation = { orderId:savedOrder.orderId, orderNumber:savedOrder.orderNumber, invoiceAccessToken:savedOrder.invoiceAccessToken, items:cart, customer:{name:name,email:email,phone:phone}, delivery:{method:delivery,address:address,city:city,region:region}, subtotal:subtotal, discount:discount, deliveryFee:deliveryFee, total:total, paymentMethod:paymentMethod };
                showConfirmation(confirmation);
                await sendAutomaticInvoice(confirmation);

                window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (error) {
                console.error("Checkout error:", error);
                form.style.opacity = "1";
                form.style.pointerEvents = "auto";
                if (placeOrderBtn) { placeOrderBtn.disabled = false; placeOrderBtn.innerHTML = '<span>Place order</span><i class="fas fa-arrow-right"></i>'; }
                showCheckoutError((error.message || 'We could not place your order.') + ' Your cart has been kept.', 'Order not placed');
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
        document.getElementById('downloadInvoiceBtn')?.addEventListener('click', downloadInvoice);
    });
})();
