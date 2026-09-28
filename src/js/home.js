(function () {
  function esc(value) { var el = document.createElement('div'); el.textContent = value == null ? '' : String(value); return el.innerHTML; }
  function reveal() {
    var elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { elements.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .12 });
    elements.forEach(function (el) { observer.observe(el); });
  }
  function renderFeatured() {
    var grid = document.getElementById('featuredGrid'); if (!grid || typeof getFeaturedProducts !== 'function') return;
    var items = getFeaturedProducts().slice(0, 4);
    if (!items.length) { grid.innerHTML = '<p class="product-empty">Our next collection is taking root. Check back soon.</p>'; return; }
    grid.innerHTML = items.map(function (p) {
      var name = esc(p.name), slug = esc(p.slug || ''), category = esc(p.category || 'Specialty plant'), stock = p.inStock !== false;
      var image = p.image ? '<img src="' + esc(p.image) + '" alt="' + name + '" loading="lazy" onerror="this.closest(\'.product-card__media\').classList.add(\'is-missing\');this.remove()">' : '';
      return '<article class="product-card reveal"><a class="product-card__media" href="product-detail.html?id=' + slug + '">' + image + '<span class="product-card__fallback"><i class="fas fa-seedling"></i></span><span class="product-card__status ' + (stock ? 'is-in' : 'is-out') + '">' + (stock ? 'In stock' : 'Out of stock') + '</span></a><div class="product-card__body"><p class="product-card__category">' + category + '</p><h3><a href="product-detail.html?id=' + slug + '">' + name + '</a></h3><div class="product-card__foot"><strong>TTD $' + Number(p.price || 0).toFixed(2) + '</strong><a href="product-detail.html?id=' + slug + '" aria-label="View ' + name + '"><i class="fas fa-arrow-right"></i></a></div></div></article>';
    }).join(''); reveal();
  }
  function renderPromotion() {
    var banner = document.getElementById('heroPromoBanner'); if (!banner || typeof getActivePromotions !== 'function') return;
    var items = getActivePromotions(); if (!items.length) return; var p = items[0]; banner.hidden = false;
    banner.innerHTML = '<i class="fas fa-bolt"></i><strong>' + esc(p.bannerText || 'Seasonal offer') + '</strong><span>' + Number(p.discount || 0) + '% off</span>';
  }
  function initMap() { if (typeof window.initFarmMap === 'function') window.initFarmMap('mapContainer'); }
  function initNewsletter() {
    var form = document.getElementById('newsletterForm'); if (!form) return;
    form.addEventListener('submit', async function (event) { event.preventDefault(); var input = document.getElementById('email-input'), status = document.getElementById('newsletterStatus'), button = form.querySelector('button');
      if (!input.checkValidity()) { status.textContent = 'Please enter a valid email address.'; input.focus(); return; }
      button.disabled = true; button.textContent = 'Joining…'; try { await fbSubscribeToNewsletter(input.value.trim().toLowerCase()); status.textContent = 'Welcome to the garden — you’re on the list.'; input.value = ''; } catch (error) { status.textContent = 'We couldn’t save your email. Please try again.'; } finally { button.disabled = false; button.textContent = 'Join the garden'; }
    });
  }
  function loadNavbar() { fetch('src/components/navbar.html?v=20260927').then(function (r) { return r.text(); }).then(function (html) {
    document.getElementById('navbar').innerHTML = html;
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof initializeMobileMenu === 'function') initializeMobileMenu();
    var link = document.querySelector('#navbar a[href="index.html"]'); if (link) link.classList.add('active');
  }); }
  document.addEventListener('DOMContentLoaded', function () { loadNavbar(); initMap(); initNewsletter(); reveal(); if (window.PRODUCTS_LOADED) renderFeatured(); if (window.PROMOTIONS_LOADED) renderPromotion(); });
  document.addEventListener('productsLoaded', renderFeatured); document.addEventListener('promotionsLoaded', renderPromotion);
})();
