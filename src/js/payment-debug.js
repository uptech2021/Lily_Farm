// Payment Flow Debug Console - Add this to checkout.html for testing
// This script helps verify that all payment features are working correctly

(function() {
    'use strict';

    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'paymentDebugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        max-height: 400px;
        background: white;
        border: 2px solid #2e7d32;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        font-family: monospace;
        font-size: 11px;
        overflow: hidden;
        display: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: #2e7d32;
        color: white;
        padding: 10px 12px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    `;
    header.innerHTML = '<span>💰 Payment Debug</span><button id="closeDebugBtn" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">&times;</button>';

    const content = document.createElement('div');
    content.id = 'debugContent';
    content.style.cssText = `
        overflow-y: auto;
        max-height: 360px;
        padding: 12px;
        background: #f9f9f9;
    `;

    debugPanel.appendChild(header);
    debugPanel.appendChild(content);
    document.body.appendChild(debugPanel);

    // Debug log function
    window.paymentDebugLog = function(action, data) {
        const timestamp = new Date().toLocaleTimeString();
        const log = document.createElement('div');
        log.style.cssText = `
            padding: 6px;
            margin-bottom: 6px;
            background: white;
            border-left: 3px solid #2e7d32;
            border-radius: 3px;
        `;
        
        let color = '#2e7d32';
        let icon = '✓';
        
        if (data && data.error) {
            color = '#c62828';
            icon = '✗';
        } else if (data && data.warning) {
            color = '#e65100';
            icon = '⚠';
        }
        
        log.innerHTML = `<span style="color:${color};font-weight:bold;">${icon}</span> <span style="color:#999;">[${timestamp}]</span> <strong>${action}</strong>${data ? '<br/>' + JSON.stringify(data, null, 2) : ''}`;
        
        const debugContent = document.getElementById('debugContent');
        if (debugContent) {
            debugContent.insertBefore(log, debugContent.firstChild);
            // Keep only last 20 logs
            while (debugContent.children.length > 20) {
                debugContent.removeChild(debugContent.lastChild);
            }
        }
    };

    // Toggle debug panel
    header.addEventListener('click', function() {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('closeDebugBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        debugPanel.style.display = 'none';
    });

    // Show debug panel button in top right
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggleDebugBtn';
    toggleBtn.innerHTML = '💰 Debug';
    toggleBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2e7d32;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        z-index: 9998;
    `;
    toggleBtn.onclick = function() {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        toggleBtn.style.display = 'none';
    };

    document.body.appendChild(toggleBtn);

    header.addEventListener('click', function() {
        if (debugPanel.style.display !== 'none') {
            toggleBtn.style.display = 'none';
        }
    });

    // Intercept form submission
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('checkoutForm');
        if (form) {
            const originalSubmit = form.onsubmit;
            
            form.addEventListener('submit', function(e) {
                paymentDebugLog('FORM_SUBMIT', {
                    name: document.getElementById('fullName')?.value,
                    email: document.getElementById('email')?.value,
                    phone: document.getElementById('phone')?.value,
                    delivery: document.getElementById('deliveryOption')?.value,
                    payment: document.querySelector('[name="payment"]:checked')?.value
                });
            });
        }

        // Monitor delivery toggle
        const deliverySelect = document.getElementById('deliveryOption');
        if (deliverySelect) {
            deliverySelect.addEventListener('change', function() {
                paymentDebugLog('DELIVERY_SELECTED', { option: this.value });
                
                if (this.value === 'delivery') {
                    setTimeout(() => {
                        paymentDebugLog('DELIVERY_MAP_INIT', { status: window.deliveryMap ? 'Map Ready' : 'Initializing' });
                    }, 500);
                }
            });
        }

        // Monitor geolocation button
        const geoBtn = document.getElementById('useMyLocationBtn');
        if (geoBtn) {
            geoBtn.addEventListener('click', function() {
                paymentDebugLog('GEO_REQUEST', { status: 'Requesting location...' });
            });
        }
    });

    // Override fbSaveOrder to log
    if (window.fbSaveOrder) {
        const originalSaveOrder = window.fbSaveOrder;
        window.fbSaveOrder = async function(orderData) {
            paymentDebugLog('FIREBASE_SAVE_ORDER', { 
                customer: orderData.customerName,
                total: orderData.total,
                location: orderData.location ? 'YES' : 'NO'
            });
            try {
                const result = await originalSaveOrder(orderData);
                paymentDebugLog('FIREBASE_SAVE_SUCCESS', { orderId: result });
                return result;
            } catch (e) {
                paymentDebugLog('FIREBASE_SAVE_ERROR', { error: e.message });
                throw e;
            }
        };
    }

    // Initial message
    paymentDebugLog('DEBUG_READY', { info: 'Payment flow monitoring active' });
})();
