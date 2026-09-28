(function () {
  var grid = document.querySelector('.gallery-grid');
  var upload = document.getElementById('gallery-upload');
  var fileCount = document.querySelector('.file-count');
  var records = [];

  function notify(message, type, title) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info', title || 'Gallery');
    } else {
      console[type === 'error' ? 'error' : 'log'](message);
    }
  }

  function escapeHtml(value) {
    var element = document.createElement('div');
    element.textContent = value == null ? '' : String(value);
    return element.innerHTML;
  }

  function updateCount() {
    fileCount.textContent = records.length + ' photo' + (records.length === 1 ? '' : 's') + ' in gallery';
  }

  function render() {
    updateCount();
    if (!records.length) {
      grid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:42px 24px"><i class="far fa-images" style="font-size:2rem;color:var(--primary);margin-bottom:12px"></i><h3 style="margin:0 0 6px">No gallery photos yet</h3><p style="margin:0;color:var(--light-text)">Choose image files above to publish your first photos.</p></div>';
      return;
    }

    grid.innerHTML = records.map(function (item) {
      return '<div class="gallery-item" data-gallery-id="' + escapeHtml(item.id) + '" data-storage-path="' + escapeHtml(item.storagePath || '') + '">' +
        '<div class="gallery-image"><img src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.caption || 'Gallery photo') + '"></div>' +
        '<div class="gallery-controls"><label class="checkbox-item"><input type="checkbox" class="gallery-select"><span>Select</span></label>' +
        '<div class="gallery-actions"><button class="btn btn-sm btn-secondary" data-action="edit-caption">Edit</button><button class="btn btn-sm btn-danger" data-action="delete-image">Delete</button></div></div>' +
        '<div class="gallery-caption"><input type="text" class="form-control" value="' + escapeHtml(item.caption || '') + '" placeholder="Add caption..."></div>' +
        '<div class="gallery-settings"><label class="switch"><input type="checkbox" class="homepage-toggle"' + (item.showOnHomepage ? ' checked' : '') + '><span class="slider"></span><span class="switch-label">Show on homepage</span></label></div>' +
      '</div>';
    }).join('');
  }

  async function loadGallery() {
    try {
      var snapshot = await db.collection('gallery').get();
      records = [];
      snapshot.forEach(function (doc) {
        records.push(Object.assign({ id: doc.id }, doc.data()));
      });
      records.sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); });
      render();
    } catch (error) {
      console.error('Unable to load gallery:', error);
      grid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:38px"><h3>Gallery could not be loaded</h3><p>Check the Firebase connection and refresh this page.</p></div>';
      fileCount.textContent = 'Unable to load photos';
      notify('The gallery could not be loaded.', 'error', 'Gallery Error');
    }
  }

  async function uploadFiles(files) {
    var images = Array.from(files).filter(function (file) { return file.type.indexOf('image/') === 0; });
    if (!images.length) return;
    if (!firebase.storage) {
      notify('Firebase Storage is not available.', 'error', 'Upload Failed');
      return;
    }

    upload.disabled = true;
    for (var index = 0; index < images.length; index += 1) {
      var file = images[index];
      fileCount.textContent = 'Uploading ' + (index + 1) + ' of ' + images.length + '...';
      try {
        var safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
        var storagePath = 'gallery/' + Date.now() + '-' + index + '-' + safeName;
        var snapshot = await firebase.storage().ref(storagePath).put(file);
        var imageUrl = await snapshot.ref.getDownloadURL();
        await db.collection('gallery').add({
          imageUrl: imageUrl,
          storagePath: storagePath,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          published: true,
          showOnHomepage: false,
          order: Date.now() + index,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Gallery upload failed:', error);
        notify('Could not upload ' + file.name + '.', 'error', 'Upload Failed');
      }
    }
    upload.value = '';
    upload.disabled = false;
    await loadGallery();
    notify(images.length + ' photo' + (images.length === 1 ? '' : 's') + ' added to the gallery.', 'success', 'Upload Complete');
  }

  async function saveCard(card) {
    var id = card.dataset.galleryId;
    var caption = card.querySelector('.gallery-caption input').value.trim();
    var showOnHomepage = card.querySelector('.homepage-toggle').checked;
    await db.collection('gallery').doc(id).update({
      caption: caption,
      showOnHomepage: showOnHomepage,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  upload.addEventListener('change', function () { uploadFiles(upload.files); });

  grid.addEventListener('change', function (event) {
    var card = event.target.closest('[data-gallery-id]');
    if (!card || (!event.target.matches('.gallery-caption input') && !event.target.matches('.homepage-toggle'))) return;
    saveCard(card).then(function () {
      notify('Photo details saved.', 'success', 'Gallery Updated');
    }).catch(function (error) {
      console.error(error);
      notify('Could not save the photo details.', 'error', 'Save Failed');
    });
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.dataset.action;
    if (action !== 'delete-image' && action !== 'edit-caption' && action !== 'save-gallery' && action !== 'reorder-images') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (action === 'edit-caption') {
      button.closest('.gallery-item').querySelector('.gallery-caption input').focus();
      return;
    }

    if (action === 'delete-image') {
      var card = button.closest('[data-gallery-id]');
      if (!card || !window.confirm('Delete this photo from the gallery?')) return;
      var id = card.dataset.galleryId;
      var storagePath = card.dataset.storagePath;
      Promise.resolve(storagePath ? firebase.storage().ref(storagePath).delete().catch(function (error) {
        console.warn('Storage file could not be deleted:', error);
      }) : null).then(function () {
        return db.collection('gallery').doc(id).delete();
      }).then(function () {
        records = records.filter(function (item) { return item.id !== id; });
        render();
        notify('Photo deleted.', 'success', 'Gallery Updated');
      }).catch(function (error) {
        console.error(error);
        notify('The photo could not be deleted.', 'error', 'Delete Failed');
      });
      return;
    }

    var cards = Array.from(grid.querySelectorAll('[data-gallery-id]'));
    Promise.all(cards.map(function (card, index) {
      return db.collection('gallery').doc(card.dataset.galleryId).update({
        caption: card.querySelector('.gallery-caption input').value.trim(),
        showOnHomepage: card.querySelector('.homepage-toggle').checked,
        order: index,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })).then(function () {
      notify('All gallery changes saved.', 'success', 'Gallery Updated');
    }).catch(function (error) {
      console.error(error);
      notify('Some gallery changes could not be saved.', 'error', 'Save Failed');
    });
  }, true);

  grid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:42px">Loading gallery...</div>';
  loadGallery();
})();
