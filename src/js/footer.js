(function() {
  var defaults = {
    storeName: "Rishi's Lily Farm",
    description: 'The only place in Trinidad to find these exclusive lilies and exotic plants. Family-owned since 2019.',
    phone: '(868) 710-4296',
    email: 'darren.kowlessar6@gmail.com',
    address: '#6 Kowlessar Street, Dalloo Road, Gasparillo, Trinidad and Tobago 570543',
    hours: 'Mon-Sat: 8am-5pm | Sun: Closed',
    facebookUrl: '#',
    instagramUrl: '#',
    whatsappUrl: '#',
    youtubeUrl: '#'
  };

  function esc(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function socialLink(url, icon, label) {
    if (!url || url === '#') return '';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + label + '"><i class="' + icon + '" aria-hidden="true"></i></a>';
  }

  function render(settings) {
    var el = document.getElementById('footer');
    if (!el) return;
    el.innerHTML =
      '<div class="footer-content footer-content--modern">' +
        '<div class="footer-column footer-brand">' +
          '<div class="footer-brand__mark"><i class="fas fa-seedling" aria-hidden="true"></i></div>' +
          '<h4>' + esc(settings.storeName) + '</h4>' +
          '<p>' + esc(settings.description) + '</p>' +
          '<div class="social-icons">' +
            socialLink(settings.facebookUrl, 'fab fa-facebook-f', 'Facebook') +
            socialLink(settings.instagramUrl, 'fab fa-instagram', 'Instagram') +
            socialLink(settings.whatsappUrl, 'fab fa-whatsapp', 'WhatsApp') +
            socialLink(settings.youtubeUrl, 'fab fa-youtube', 'YouTube') +
          '</div>' +
        '</div>' +
        '<div class="footer-column"><h4>Shop</h4>' +
          '<a href="products.html?category=lily">Lilies</a><a href="products.html?category=exotic">Exotic Plants</a><a href="products.html?category=fertilizer">Fertilizers</a><a href="products.html">All Products</a>' +
        '</div>' +
        '<div class="footer-column"><h4>Help</h4>' +
          '<a href="faq.html">FAQ &amp; Plant Care</a><a href="faq.html">Delivery</a><a href="contact.html">Contact</a>' +
        '</div>' +
        '<div class="footer-column footer-contact"><h4>Contact</h4>' +
          '<p><i class="fas fa-phone"></i> <a href="tel:' + esc(String(settings.phone||'').replace(/[^+\d]/g,'')) + '">' + esc(settings.phone) + '</a></p>' +
          '<p><i class="fas fa-envelope"></i> <a href="mailto:' + esc(settings.email) + '">' + esc(settings.email) + '</a></p>' +
          '<p><i class="fas fa-clock"></i> ' + esc(settings.hours) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="payment-badges-wrapper" aria-label="Accepted payment methods">' +
        '<span class="payment-label">Secure payments accepted</span><div class="payment-badge visa-badge"><span>VISA</span></div><div class="payment-badge mastercard-badge"><span>Mastercard</span></div>' +
      '</div>' +
      '<div class="copyright">' +
        '<p>&copy; ' + new Date().getFullYear() + ' ' + esc(settings.storeName) + '. All rights reserved.</p><div><a href="#">Privacy Policy</a><a href="#">Terms</a></div>' +
      '</div>';
  }

  if (document.getElementById('footer')) {
    if (window.StoreSettings) {
      StoreSettings.load().then(render).catch(function(){ render(defaults); });
    } else if (typeof db !== 'undefined' && db) {
      db.collection('settings').doc('global').get().then(function(doc) {
        render(doc.exists ? Object.assign({}, defaults, doc.data()) : defaults);
      }).catch(function() {
        render(defaults);
      });
    } else {
      render(defaults);
    }
  }
})();
