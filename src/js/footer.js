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

  function render(settings) {
    var el = document.getElementById('footer');
    if (!el) return;
    el.innerHTML =
      '<div class="footer-content">' +
        '<div class="footer-column">' +
          '<h4>' + esc(settings.storeName) + '</h4>' +
          '<p>' + esc(settings.description) + '</p>' +
          '<div class="social-icons">' +
            '<a href="' + esc(settings.facebookUrl) + '" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>' +
            '<a href="' + esc(settings.instagramUrl) + '" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>' +
            '<a href="' + esc(settings.whatsappUrl) + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i></a>' +
            '<a href="' + esc(settings.youtubeUrl) + '" target="_blank" rel="noopener"><i class="fab fa-youtube"></i></a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-column">' +
          '<h4>Contact Info</h4>' +
          '<p><i class="fas fa-map-marker-alt"></i> ' + esc(settings.address) + '</p>' +
          '<p><i class="fas fa-phone"></i> ' + esc(settings.phone) + '</p>' +
          '<p><i class="fas fa-envelope"></i> ' + esc(settings.email) + '</p>' +
          '<p><i class="fas fa-clock"></i> ' + esc(settings.hours) + '</p>' +
        '</div>' +
        '<div class="footer-column">' +
          '<h4>Quick Links</h4>' +
          '<a href="index.html">Home</a>' +
          '<a href="products.html">Products & Fertilizers</a>' +
          '<a href="faq.html">FAQ & Plant Care</a>' +
          '<a href="contact.html">Contact Us</a>' +
        '</div>' +
      '</div>' +
      '<div class="payment-badges-wrapper" aria-label="Accepted payment methods">' +
        '<div class="payment-badge visa-badge"><span>VISA</span></div>' +
        '<div class="payment-badge mastercard-badge"><span>MasterCard</span></div>' +
      '</div>' +
      '<div class="copyright">' +
        '<p>&copy; ' + new Date().getFullYear() + ' ' + esc(settings.storeName) + '. All rights reserved.</p>' +
      '</div>';
  }

  if (document.getElementById('footer')) {
    if (typeof db !== 'undefined' && db) {
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
