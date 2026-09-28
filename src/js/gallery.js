(function () {
  var grid = document.getElementById('gallery-grid');
  var count = document.getElementById('galleryCount');
  var lightbox = document.getElementById('galleryLightbox');

  function escapeHtml(value) {
    var element = document.createElement('div');
    element.textContent = value == null ? '' : String(value);
    return element.innerHTML;
  }

  function render(items) {
    count.textContent = items.length + ' photo' + (items.length === 1 ? '' : 's');

    if (!items.length) {
      grid.innerHTML = '<div class="gallery-empty"><i class="far fa-images" aria-hidden="true"></i><h3>Our gallery is taking root.</h3><p>New farm photos will appear here as soon as they are published.</p></div>';
      return;
    }

    grid.innerHTML = items.map(function (item, index) {
      var caption = escapeHtml(item.caption || "A moment from Rishi's Lily Farm");
      var size = index % 7 === 4 ? ' gallery-card--wide' : index % 6 === 1 ? ' gallery-card--tall' : '';
      return '<article class="gallery-card' + size + '">' +
        '<button type="button" class="gallery-card__button" data-image="' + escapeHtml(item.imageUrl) + '" data-caption="' + caption + '">' +
          '<div class="gallery-card__media">' +
            '<img src="' + escapeHtml(item.imageUrl) + '" alt="' + caption + '" loading="lazy">' +
            '<span>View photo <i class="fas fa-expand" aria-hidden="true"></i></span>' +
          '</div>' +
          '<div class="gallery-card__copy"><h3>' + caption + '</h3></div>' +
        '</button>' +
      '</article>';
    }).join('');

    grid.querySelectorAll('.gallery-card__button').forEach(function (button) {
      button.addEventListener('click', function () {
        var image = lightbox.querySelector('img');
        image.src = button.dataset.image;
        image.alt = button.dataset.caption;
        document.getElementById('lightboxCaption').textContent = button.dataset.caption;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        lightbox.querySelector('.gallery-lightbox__close').focus();
      });
    });
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    lightbox.querySelector('img').src = '';
  }

  lightbox.querySelector('.gallery-lightbox__close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  db.collection('gallery').where('published', '==', true).get().then(function (snapshot) {
    var items = [];
    snapshot.forEach(function (doc) {
      items.push(Object.assign({ id: doc.id }, doc.data()));
    });
    items.sort(function (a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
    render(items.filter(function (item) { return item.imageUrl; }));
  }).catch(function (error) {
    console.error('Failed to load gallery:', error);
    grid.innerHTML = '<div class="gallery-empty"><h3>Unable to load the gallery right now.</h3><p>Please refresh the page and try again.</p></div>';
    count.textContent = 'Unavailable';
  });

  fetch('src/components/navbar.html?v=20260927').then(function (response) {
    return response.text();
  }).then(function (html) {
    document.getElementById('navbar').innerHTML = html;
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof initializeMobileMenu === 'function') initializeMobileMenu();
    var active = document.querySelector('#navbar a[href="gallery.html"]');
    if (active) active.classList.add('active');
  });
})();
