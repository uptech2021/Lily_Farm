(function (global) {
  'use strict';

  var weekdays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  var defaults = {
    storeName: "Rishi's Lily Farm", tagline: 'Rare blooms, grown in Trinidad',
    description: 'The only place in Trinidad to find these exclusive lilies and exotic plants. Family-owned since 2019.',
    phone: '(868) 710-4296', email: 'darren.kowlessar6@gmail.com',
    address: '#6 Kowlessar Street, Dalloo Road, Gasparillo, Trinidad and Tobago 570543',
    hours: 'Mon-Sat: 8am-5pm | Sun: Closed',
    operatingHours: {
      monday:{open:true,start:'08:00',end:'17:00'}, tuesday:{open:true,start:'08:00',end:'17:00'},
      wednesday:{open:true,start:'08:00',end:'17:00'}, thursday:{open:true,start:'08:00',end:'17:00'},
      friday:{open:true,start:'08:00',end:'17:00'}, saturday:{open:true,start:'09:00',end:'15:00'},
      sunday:{open:false,start:'08:00',end:'17:00'}
    },
    paymentMethods:{cash:true,bankTransfer:true}, paymentProofMethod:'email',
    wireAcctName:'', wireBank:'', wireAcctNum:'', wireAcctType:'', paymentInstructions:'',
    paymentProofEmail:'darren.kowlessar6@gmail.com',
    deliveryThreshold:500, freeDeliveryEnabled:true, pickupEnabled:true, pickupFee:0,
    deliveryRegions:[
      {id:'central',name:'Central Trinidad',fee:60,enabled:true},
      {id:'north',name:'North Trinidad',fee:85,enabled:true},
      {id:'south',name:'South Trinidad',fee:60,enabled:true}
    ],
    farmLatitude:10.325615, farmLongitude:-61.415639,
    invoiceBusinessName:"Rishi's Lily Farm", invoiceAddress:'', invoicePhone:'', invoiceEmail:'', invoicePrefix:'RLF',
    invoiceFooter:'Thank you for supporting a locally grown Trinidad & Tobago business.',
    autoEmailInvoice:true, customerInvoiceDownload:true, adminInvoiceDownload:true,
    inventory:{lowStock:5,criticalStock:3,outOfStock:0,showExactQuantity:true,preventInsufficientCheckout:true,adminNotifications:false},
    notificationRecipients:{orders:'',paymentProof:'',contact:'',reviews:'',newsletterReplies:''},
    notificationToggles:{orderConfirmation:true,invoiceEmail:true,newsletter:true,adminOrders:false,reviewAlerts:false,contactAdmin:true,contactConfirmation:true,postPurchaseReviewRequest:false},
    facebookUrl:'', instagramUrl:'', youtubeUrl:'', whatsappNumber:'18687104296',
    whatsappMessage:"Hi Rishi's Lily Farm, I have a question about...",
    storefront:{announcementEnabled:true,announcementSource:'promotion',bannerMessage:'Fresh savings from the farm — 12% off selected products',buttonLabel:'Shop the Sale',buttonDestination:'promotion',customDestination:'',featuredReviewsEnabled:true,featuredReviewCount:3,newsletterEnabled:true,whatsappEnabled:true,popularProductsEnabled:true},
    newsletter:{enabled:true,heading:'Join the garden',description:'Fresh arrivals, growing tips and seasonal offers.',senderName:"Rishi's Lily Farm",replyTo:'',doubleOptIn:false}
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function merge(base, value) {
    var result = clone(base), source = value && typeof value === 'object' ? value : {};
    Object.keys(source).forEach(function (key) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) result[key] = merge(result[key], source[key]);
      else result[key] = source[key];
    });
    return result;
  }
  function normalize(raw) {
    var settings = merge(defaults, raw || {});
    if (!Array.isArray(raw && raw.deliveryRegions)) settings.deliveryRegions = [
      {id:'central',name:'Central Trinidad',fee:Number(settings.deliveryCentral || 60),enabled:true},
      {id:'north',name:'North Trinidad',fee:Number(settings.deliveryNorth || 85),enabled:true},
      {id:'south',name:'South Trinidad',fee:Number(settings.deliverySouth || 60),enabled:true}
    ];
    settings.deliveryRegions = settings.deliveryRegions.map(function (region, index) { return {id:String(region.id || ('region-'+index)),name:String(region.name || 'Delivery region'),fee:Math.max(0,Number(region.fee)||0),enabled:region.enabled !== false}; });
    settings.invoiceAddress = settings.invoiceAddress || settings.address;
    settings.invoicePhone = settings.invoicePhone || settings.phone;
    settings.invoiceEmail = settings.invoiceEmail || settings.email;
    Object.keys(settings.notificationRecipients).forEach(function(key){ if (!settings.notificationRecipients[key]) settings.notificationRecipients[key] = settings.email; });
    settings.newsletter.replyTo = settings.newsletter.replyTo || settings.email;
    return settings;
  }
  function hoursText(hours) {
    return weekdays.map(function(day){var h=hours[day];return day.slice(0,3).replace(/^./,function(c){return c.toUpperCase();})+': '+(h.open ? h.start+'–'+h.end : 'Closed');}).join(' · ');
  }
  function whatsappUrl(settings) { var number=String(settings.whatsappNumber||'').replace(/\D/g,''); return number ? 'https://wa.me/'+number+'?text='+encodeURIComponent(settings.whatsappMessage||'') : ''; }
  async function load(force) {
    if (!force && global.__storeSettingsPromise) return global.__storeSettingsPromise;
    global.__storeSettingsPromise = (async function(){
      try { if (global.db) { var doc=await global.db.collection('settings').doc('global').get(); return normalize(doc.exists ? doc.data() : {}); } } catch(error){ console.warn('Store settings unavailable:',error); }
      return normalize({});
    })();
    return global.__storeSettingsPromise;
  }
  global.StoreSettings = { defaults:defaults, normalize:normalize, load:load, hoursText:hoursText, whatsappUrl:whatsappUrl, weekdays:weekdays };
})(window);
