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
  async function renderPromotion() {
    var section = document.getElementById('homePromotionSection'); if (!section || typeof getActivePromotions !== 'function') return;
    var settings=window.StoreSettings?await StoreSettings.load():null;if(settings&&settings.storefront&&settings.storefront.announcementEnabled===false){section.hidden=true;return;}
    var items = getActivePromotions(); if (!items.length) { section.hidden = true; return; } var p = items[0], cats = p.categories || [];
    var scope = cats.length ? cats.join(' & ') : 'all plants';
    document.getElementById('homePromotionTitle').textContent = p.bannerText || p.name || 'Fresh savings from the farm';
    document.getElementById('homePromotionCopy').textContent = Number(p.discount || 0) + '% off ' + scope + (items.length > 1 ? ' — plus more offers in the shop.' : ' for a limited time.');
    document.getElementById('homePromotionLink').href = 'products.html'; section.hidden = false; reveal();
  }
  function initMap() { if (typeof window.initFarmMap === 'function') window.initFarmMap('mapContainer'); }
  function initNewsletter() {
    var form = document.getElementById('newsletterForm'); if (!form) return;
    if(window.StoreSettings)StoreSettings.load().then(function(s){var enabled=(!s.storefront||s.storefront.newsletterEnabled!==false)&&(!s.newsletter||s.newsletter.enabled!==false);if(!enabled){var section=form.closest('section');if(section)section.hidden=true;}else{var h=form.closest('section')?.querySelector('h2');var p=form.closest('section')?.querySelector('p');if(h&&s.newsletter?.heading)h.textContent=s.newsletter.heading;if(p&&s.newsletter?.description)p.textContent=s.newsletter.description;}});
    form.addEventListener('submit', async function (event) { event.preventDefault(); var input = document.getElementById('email-input'), status = document.getElementById('newsletterStatus'), button = form.querySelector('button');
      if (!input.checkValidity()) { status.textContent = 'Please enter a valid email address.'; input.focus(); return; }
      button.disabled = true; button.textContent = 'Joining…'; try { await fbSubscribeToNewsletter(input.value.trim().toLowerCase()); status.textContent = 'Welcome to the garden — you’re on the list.'; input.value = ''; } catch (error) { status.textContent = 'We couldn’t save your email. Please try again.'; } finally { button.disabled = false; button.textContent = 'Join the garden'; }
    });
  }
  async function renderFeaturedReviews(){var section=document.getElementById('featuredReviewsSection'),grid=document.getElementById('featuredReviewsGrid');if(!section||!window.db)return;try{var snap=await db.collection('reviews').where('status','==','published').get(),items=[];snap.forEach(function(d){var r=d.data();if(r.featured)items.push(r)});items.sort(function(a,b){var ad=a.createdAt&&a.createdAt.toDate?a.createdAt.toDate():new Date(a.createdAt||0),bd=b.createdAt&&b.createdAt.toDate?b.createdAt.toDate():new Date(b.createdAt||0);return bd-ad});items=items.slice(0,3);if(!items.length){section.hidden=true;return}grid.innerHTML=items.map(function(r){return '<article class="public-review"><div><span class="review-stars">'+[1,2,3,4,5].map(function(i){return'<span class="'+(i<=Number(r.rating)?'on':'')+'">★</span>'}).join('')+'</span></div><p>“'+esc(r.reviewText)+'”</p><div class="public-review__meta"><strong>'+esc(r.customerName)+'</strong>'+(r.verifiedPurchase?'<span>✓ Verified Purchase</span>':'')+'</div></article>'}).join('');section.hidden=false;reveal()}catch(error){section.hidden=true}}
  function loadNavbar() { fetch('src/components/navbar.html?v=20260927').then(function (r) { return r.text(); }).then(function (html) {
    document.getElementById('navbar').innerHTML = html;
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof initializeMobileMenu === 'function') initializeMobileMenu();
    var link = document.querySelector('#navbar a[href="index.html"]'); if (link) link.classList.add('active');
  }); }
  document.addEventListener('DOMContentLoaded', function () { loadNavbar(); initMap(); initNewsletter(); renderFeaturedReviews(); reveal(); if (window.PRODUCTS_LOADED) renderFeatured(); if (window.PROMOTIONS_LOADED) renderPromotion(); });
  document.addEventListener('productsLoaded', renderFeatured); document.addEventListener('promotionsLoaded', renderPromotion);
})();
