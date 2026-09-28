window.promotions = {};
window.PROMOTIONS_LOADED = false;

async function loadPromotions() {
  try {
    var snap = await db.collection('promotions').orderBy('createdAt', 'desc').get();
    window.promotions = {};
    snap.forEach(function(doc) {
      window.promotions[doc.id] = Object.assign({ firestoreId: doc.id }, doc.data());
    });
    window.PROMOTIONS_LOADED = true;
    document.dispatchEvent(new Event('promotionsLoaded'));
  } catch (e) {
    window.promotions = {};
    window.PROMOTIONS_LOADED = true;
    document.dispatchEvent(new Event('promotionsLoaded'));
    console.warn('Using local promotion data:', e.message);
  }
}

function getPromotionStatus(promo) {
  if (!promo) return 'ended';
  var now = new Date();
  var start = new Date(promo.startDate);
  var end = new Date(promo.endDate);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

function getActivePromotions() {
  return Object.values(window.promotions).filter(function(p) { return getPromotionStatus(p) === 'active'; });
}

function getUpcomingPromotions() {
  return Object.values(window.promotions).filter(function(p) { return getPromotionStatus(p) === 'upcoming'; });
}

function getPromotionsForCategory(category) {
  if (!category) return { active: [], upcoming: [] };
  var all = Object.values(window.promotions);
  var active = [], upcoming = [];
  all.forEach(function(p) {
    var cats = p.categories || [];
    if (cats.length > 0 && cats.indexOf(category) === -1) return;
    var status = getPromotionStatus(p);
    if (status === 'active') active.push(p);
    else if (status === 'upcoming') upcoming.push(p);
  });
  return { active: active, upcoming: upcoming };
}

function getCoveredCategories(type) {
  var list = type === 'upcoming' ? getUpcomingPromotions() : getActivePromotions();
  var cats = new Set();
  var allCats = false;
  list.forEach(function(p) {
    var pc = p.categories || [];
    if (pc.length === 0) { allCats = true; }
    else { pc.forEach(function(c) { cats.add(c); }); }
  });
  if (allCats) return 'all';
  return Array.from(cats).sort();
}

function getDiscountedPrice(originalPrice, category) {
  var promos = getActivePromotions();
  for (var i = 0; i < promos.length; i++) {
    var p = promos[i];
    var cats = p.categories || [];
    if (cats.length > 0 && cats.indexOf(category) === -1) continue;
    var discount = Number(p.discount) || 0;
    return { original: Number(originalPrice), discounted: Number(originalPrice) * (1 - discount / 100), discount: discount, promo: p };
  }
  return null;
}

async function addPromotion(data) {
  var docRef = await db.collection('promotions').add(Object.assign({}, data, {
    discount: Number(data.discount),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }));
  return Object.assign({}, data, { firestoreId: docRef.id });
}

async function updatePromotion(id, data) {
  var updateData = {};
  for (var key in data) { updateData[key] = data[key]; }
  if (updateData.discount) updateData.discount = Number(updateData.discount);
  await db.collection('promotions').doc(id).update(updateData);
}

async function deletePromotion(id) {
  await db.collection('promotions').doc(id).delete();
}

async function queuePromotionCampaign(promotionId, promotion, options) {
  options = options || {};
  var categories = promotion.categories && promotion.categories.length ? promotion.categories.join(', ') : 'all plants';
  var subject = options.emailSubject || (promotion.name + ' — ' + promotion.discount + '% off');
  var emailBody = options.emailBody || ('A fresh offer is blooming at Rishi\'s Lily Farm! Save ' + promotion.discount + '% on ' + categories + '. ' + (promotion.bannerText || '') + ' Shop before ' + new Date(promotion.endDate).toLocaleDateString() + '.');
  var socialCopy = options.socialCopy || ('🌸 ' + promotion.name + ': save ' + promotion.discount + '% on ' + categories + '! ' + (promotion.bannerText || '') + ' Offer ends ' + new Date(promotion.endDate).toLocaleDateString() + '. #RishisLilyFarm #TrinidadPlants');
  var batch = db.batch();
  if (options.queueEmail) {
    var emailRef = db.collection('emailCampaigns').doc();
    batch.set(emailRef, { promotionId: promotionId, subject: subject, body: emailBody, audience: 'active-newsletter-subscribers', status: 'queued', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
  if (options.queueSocial) {
    var socialRef = db.collection('socialPosts').doc();
    batch.set(socialRef, { promotionId: promotionId, copy: socialCopy, channels: options.channels || ['facebook', 'instagram'], status: 'queued', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
  await batch.commit();
}

window.loadPromotions = loadPromotions;
window.getPromotionStatus = getPromotionStatus;
window.getActivePromotions = getActivePromotions;
window.getUpcomingPromotions = getUpcomingPromotions;
window.getPromotionsForCategory = getPromotionsForCategory;
window.getCoveredCategories = getCoveredCategories;
window.getDiscountedPrice = getDiscountedPrice;
window.addPromotion = addPromotion;
window.updatePromotion = updatePromotion;
window.deletePromotion = deletePromotion;
window.queuePromotionCampaign = queuePromotionCampaign;

loadPromotions();
