(function () {
  'use strict';

  var readSuccesses = 0;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }
  function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000);
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function startOfDay(date) {
    var result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  function isSameDay(value, target) {
    var date = toDate(value);
    return date && startOfDay(date).getTime() === startOfDay(target).getTime();
  }
  function currency(value) {
    return new Intl.NumberFormat('en-TT', {
      style: 'currency', currency: 'TTD', maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function relativeTime(value) {
    var date = toDate(value);
    if (!date) return 'Date unavailable';
    var seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 172800) return 'Yesterday';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString('en-TT', { month: 'short', day: 'numeric' });
  }
  function snapshotRows(snapshot) {
    var rows = [];
    if (snapshot && typeof snapshot.forEach === 'function') {
      snapshot.forEach(function (doc) {
        rows.push(Object.assign({ firestoreId: doc.id }, doc.data()));
      });
    }
    return rows;
  }
  async function readCollection(name) {
    try {
      var snapshot = await db.collection(name).get();
      readSuccesses += 1;
      return snapshotRows(snapshot);
    } catch (error) {
      console.warn('Dashboard could not read ' + name + ':', error);
      return [];
    }
  }
  function setChange(id, text, tone) {
    var element = byId(id);
    element.textContent = text;
    element.classList.remove('positive', 'negative');
    if (tone) element.classList.add(tone);
  }

  function renderKpis(orders, products, reviews, promotions) {
    var now = new Date();
    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    var todayOrders = orders.filter(function (order) { return isSameDay(order.createdAt, now); });
    var yesterdayOrders = orders.filter(function (order) { return isSameDay(order.createdAt, yesterday); });
    byId('todayOrders').textContent = todayOrders.length;
    var delta = todayOrders.length - yesterdayOrders.length;
    setChange('ordersChange', delta === 0 ? 'Same as yesterday' : (delta > 0 ? '+' + delta + ' from yesterday' : delta + ' from yesterday'), delta > 0 ? 'positive' : (delta < 0 ? 'negative' : ''));

    var lowStock = products.filter(function (product) {
      var quantity = product.stockQuantity != null ? Number(product.stockQuantity) : (product.stock != null ? Number(product.stock) : null);
      var threshold = Number(product.lowStockThreshold || 5);
      return product.inStock === false || (quantity != null && quantity <= threshold);
    });
    byId('lowStockCount').textContent = lowStock.length;
    setChange('stockChange', lowStock.length ? lowStock.length + ' need attention' : 'Inventory healthy', lowStock.length ? 'negative' : 'positive');

    var pending = reviews.filter(function (review) {
      return String(review.status || review.moderationStatus || 'pending').toLowerCase() === 'pending';
    });
    var newPending = pending.filter(function (review) { return isSameDay(review.createdAt, now); }).length;
    byId('pendingReviews').textContent = pending.length;
    setChange('reviewsChange', newPending ? newPending + ' new today' : 'No new reviews today', newPending ? 'positive' : '');

    var active = promotions.filter(function (promo) {
      var start = toDate(promo.startDate);
      var end = toDate(promo.endDate);
      return start && end && now >= start && now <= end;
    });
    var endingSoon = active.filter(function (promo) {
      return toDate(promo.endDate).getTime() - now.getTime() <= 3 * 86400000;
    }).length;
    byId('activePromos').textContent = active.length;
    setChange('promosChange', endingSoon ? endingSoon + ' ending within 3 days' : 'No promotions ending soon', endingSoon ? 'negative' : 'positive');
  }

  function renderSales(orders) {
    var days = [];
    var today = startOfDay(new Date());
    for (var offset = 6; offset >= 0; offset -= 1) {
      var date = new Date(today);
      date.setDate(date.getDate() - offset);
      days.push({ date: date, total: 0 });
    }
    orders.forEach(function (order) {
      if (String(order.status || '').toLowerCase() === 'cancelled') return;
      var created = toDate(order.createdAt);
      if (!created) return;
      var day = days.find(function (item) { return isSameDay(created, item.date); });
      if (day) day.total += Number(order.total || order.subtotal || 0);
    });
    var maximum = Math.max.apply(null, days.map(function (day) { return day.total; }).concat([1]));
    var label = days[0].date.toLocaleDateString('en-TT', { month: 'short', day: 'numeric' }) + ' to ' + days[6].date.toLocaleDateString('en-TT', { month: 'short', day: 'numeric' });
    byId('salesChart').innerHTML =
      '<div class="chart-bars" aria-label="Sales from ' + escapeHtml(label) + '">' + days.map(function (day) {
        var height = day.total ? Math.max(8, Math.round(day.total / maximum * 100)) : 2;
        var title = day.date.toLocaleDateString('en-TT', { weekday: 'long', month: 'long', day: 'numeric' }) + ': ' + currency(day.total);
        return '<div class="chart-column"><span class="chart-value">' + escapeHtml(currency(day.total)) + '</span><div class="chart-bar' + (day.total ? '' : ' is-empty') + '" style="height:' + height + '%" title="' + escapeHtml(title) + '"></div></div>';
      }).join('') + '</div>' +
      '<div class="chart-labels">' + days.map(function (day) {
        return '<span>' + day.date.toLocaleDateString('en-TT', { weekday: 'short' }) + '<br>' + day.date.toLocaleDateString('en-TT', { month: 'short', day: 'numeric' }) + '</span>';
      }).join('') + '</div>';
  }

  function activityRecord(type, row) {
    var definitions = {
      order: { href: 'orders.html', icon: 'fa-bag-shopping', css: 'product', text: 'Order ' + (row.orderId || row.firestoreId || '') + ' placed for ' + currency(row.total) },
      product: { href: 'products.html', icon: 'fa-seedling', css: 'product', text: 'Product updated: ' + (row.name || 'Unnamed product') },
      promotion: { href: 'pricing-availability.html', icon: 'fa-tags', css: 'promo', text: 'Promotion created: ' + (row.name || 'Untitled promotion') },
      review: { href: 'reviews.html', icon: 'fa-star', css: 'review', text: 'Review received from ' + (row.customerName || row.name || 'a customer') },
      gallery: { href: 'gallery.html', icon: 'fa-image', css: 'gallery', text: 'Gallery item updated: ' + (row.title || row.caption || 'Untitled image') },
      admin: { href: row.href || 'dashboard.html', icon: row.icon || 'fa-pen', css: row.kind || 'price', text: row.message || 'Admin update' }
    };
    var definition = definitions[type];
    return Object.assign(definition, { date: toDate(row.updatedAt || row.createdAt || row.timestamp) });
  }
  function renderActivity(groups) {
    var items = [];
    groups.orders.forEach(function (row) { items.push(activityRecord('order', row)); });
    groups.products.forEach(function (row) { items.push(activityRecord('product', row)); });
    groups.promotions.forEach(function (row) { items.push(activityRecord('promotion', row)); });
    groups.reviews.forEach(function (row) { items.push(activityRecord('review', row)); });
    groups.gallery.forEach(function (row) { items.push(activityRecord('gallery', row)); });
    groups.admin.forEach(function (row) { items.push(activityRecord('admin', row)); });
    items = items.filter(function (item) { return item.date; }).sort(function (a, b) { return b.date - a.date; }).slice(0, 8);
    if (!items.length) {
      byId('activityList').innerHTML = '<div class="dashboard-empty"><i class="fas fa-clock-rotate-left"></i><strong>No recent activity</strong><span>New orders and admin updates will appear here.</span></div>';
      return;
    }
    byId('activityList').innerHTML = items.map(function (item) {
      return '<a class="activity-item activity-link" href="' + escapeHtml(item.href) + '"><div class="activity-icon activity-icon-' + escapeHtml(item.css) + '"><i class="fas ' + escapeHtml(item.icon) + '"></i></div><div class="activity-content"><div class="activity-title">' + escapeHtml(item.text) + '</div><div class="activity-time">' + escapeHtml(relativeTime(item.date)) + '</div></div></a>';
    }).join('');
  }

  async function loadDashboard() {
    readSuccesses = 0;
    var results = await Promise.all([
      readCollection('orders'), readCollection('products'), readCollection('reviews'),
      readCollection('promotions'), readCollection('gallery'), readCollection('dashboardActivity')
    ]);
    var groups = { orders: results[0], products: results[1], reviews: results[2], promotions: results[3], gallery: results[4], admin: results[5] };
    renderKpis(groups.orders, groups.products, groups.reviews, groups.promotions);
    renderSales(groups.orders);
    renderActivity(groups);
    var status = byId('dashboardSyncStatus');
    status.innerHTML = readSuccesses ? '<i class="fas fa-circle-check" aria-hidden="true"></i> Live data' : '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Data unavailable';
    status.classList.toggle('is-error', !readSuccesses);
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.innerHTML = busy ? '<i class="fas fa-spinner fa-spin"></i> Saving&hellip;' : label;
  }
  function closeDashboardModal(button) {
    var backdrop = button.closest('.modal-backdrop');
    if (backdrop) backdrop.classList.add('d-none');
    document.body.style.overflow = '';
  }
  async function logAdminActivity(message, kind, href, icon) {
    try {
      await db.collection('dashboardActivity').add({
        message: message, kind: kind, href: href, icon: icon,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.warn('Could not write dashboard activity:', error);
    }
  }
  async function createPromotion() {
    var button = byId('createPromotionButton');
    var name = byId('promo-name').value.trim();
    var discount = Number(byId('promo-discount').value);
    var startDate = byId('promo-start').value;
    var endDate = byId('promo-end').value;
    if (!name || discount <= 0 || discount > 100 || !startDate || !endDate || new Date(startDate) >= new Date(endDate)) {
      if (window.adminUI) adminUI.showToast('Enter a name, a 1–100% discount, and valid dates.', 'error', 'Check promotion');
      return;
    }
    setBusy(button, true, 'Create Promotion');
    try {
      await db.collection('promotions').add({
        name: name, discount: discount, startDate: startDate, endDate: endDate,
        categories: [], createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await logAdminActivity('Promotion created: ' + name, 'promo', 'pricing-availability.html', 'fa-tags');
      closeDashboardModal(button);
      button.closest('.modal-backdrop').querySelector('form').reset();
      if (window.adminUI) adminUI.showToast('Promotion saved to Firestore.', 'success', 'Promotion created');
      await loadDashboard();
    } catch (error) {
      console.error(error);
      if (window.adminUI) adminUI.showToast('The promotion could not be saved.', 'error', 'Save failed');
    } finally {
      setBusy(button, false, 'Create Promotion');
    }
  }
  async function updatePrices() {
    var button = byId('updatePricesButton');
    var action = byId('price-action').value;
    var value = Number(byId('price-value').value);
    var category = byId('price-category').value;
    if (!(value > 0)) {
      if (window.adminUI) adminUI.showToast('Enter a value greater than zero.', 'error', 'Check price update');
      return;
    }
    setBusy(button, true, 'Update Prices');
    try {
      var snapshot = await db.collection('products').get();
      var batch = db.batch();
      var changed = 0;
      snapshot.forEach(function (doc) {
        var product = doc.data();
        if (category !== 'all' && product.category !== category) return;
        var current = Number(product.price);
        if (!Number.isFinite(current)) return;
        var next = action === 'set' ? value : current * (1 + (action === 'increase' ? value : -value) / 100);
        batch.update(doc.ref, { price: Math.max(0, Math.round(next * 100) / 100), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        changed += 1;
      });
      if (!changed) throw new Error('No matching products found.');
      await batch.commit();
      await logAdminActivity('Bulk price update applied to ' + changed + ' product' + (changed === 1 ? '' : 's'), 'price', 'products.html', 'fa-dollar-sign');
      closeDashboardModal(button);
      button.closest('.modal-backdrop').querySelector('form').reset();
      if (window.adminUI) adminUI.showToast(changed + ' product prices updated.', 'success', 'Prices saved');
      await loadDashboard();
    } catch (error) {
      console.error(error);
      if (window.adminUI) adminUI.showToast(error.message || 'Prices could not be updated.', 'error', 'Update failed');
    } finally {
      setBusy(button, false, 'Update Prices');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    byId('dashboardDate').textContent = new Intl.DateTimeFormat('en-TT', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
    byId('createPromotionButton').addEventListener('click', createPromotion);
    byId('updatePricesButton').addEventListener('click', updatePrices);
    loadDashboard();
  });
}());
