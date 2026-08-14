// WhatsApp Button Component
(function() {
  const PHONE_NUMBER = '+18687104296'; // (868) 710-4296
  const BUSINESS_NAME = "Rishi's Lily Farm & Exotic Plants";
  
  function initWhatsAppButton() {
    // Check if button already exists
    if (document.getElementById('whatsapp-button')) return;
    
    // Create button HTML
    const buttonHTML = `
      <a id="whatsapp-button" href="#" class="whatsapp-button" title="Message us on WhatsApp">
        <div class="whatsapp-button-inner">
          <i class="fab fa-whatsapp"></i>
        </div>
        <span class="whatsapp-tooltip">Chat with us!</span>
      </a>
    `;
    
    // Insert button at end of body
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    
    // Add click handler
    const button = document.getElementById('whatsapp-button');
    button.addEventListener('click', function(e) {
      e.preventDefault();
      openWhatsApp();
    });
  }

  function openWhatsApp() {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${PHONE_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
  }

  function generateWhatsAppMessage() {
    const currentPage = window.location.pathname.split('/').pop() || 'website';
    const timestamp = new Date().toLocaleString();
    
    const message = `Hello ${BUSINESS_NAME}! 👋\n\nI'm interested in learning more about your exotic lilies and plants. Could you help me with information about your products and services?\n\n📱 I'm reaching out from: ${currentPage}\n⏰ Time: ${timestamp}`;
    
    return message;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsAppButton);
  } else {
    initWhatsAppButton();
  }
})();
