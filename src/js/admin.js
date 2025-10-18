// Admin UI JavaScript - Static interactions only
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    initializeSidebar();
    initializeModals();
    initializeDrawers();
    initializeToasts();
    initializeTabs();
    initializeDropdowns();
}

// Sidebar Toggle
function initializeSidebar() {
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            if (overlay) {
                overlay.classList.toggle('show');
            }
        });
    }
    
    // Close sidebar when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.add('collapsed');
            overlay.classList.remove('show');
        });
    }
    
    // Close sidebar on mobile when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                if (overlay) {
                    overlay.classList.remove('show');
                }
            }
        });
    });
}

// Modal Management
function initializeModals() {
    // Open modals
    document.addEventListener('click', function(e) {
        const trigger = e.target.closest('[data-modal-target]');
        if (trigger) {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-target');
            openModal(modalId);
        }
    });
    
    // Close modals
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop') || 
            e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            closeModal(e.target.closest('.modal-backdrop'));
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-backdrop:not(.d-none)');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.add('d-none');
        document.body.style.overflow = '';
    }
}

// Drawer Management
function initializeDrawers() {
    // Open drawers
    document.addEventListener('click', function(e) {
        const trigger = e.target.closest('[data-drawer-target]');
        if (trigger) {
            e.preventDefault();
            const drawerId = trigger.getAttribute('data-drawer-target');
            openDrawer(drawerId);
        }
    });
    
    // Close drawers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('drawer-close') ||
            e.target.closest('.drawer-close')) {
            closeDrawer(e.target.closest('.drawer'));
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openDrawer = document.querySelector('.drawer.open');
            if (openDrawer) {
                closeDrawer(openDrawer);
            }
        }
    });
}

function openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = drawer.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeDrawer(drawer) {
    if (drawer) {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Toast Management
function initializeToasts() {
    // Auto-hide toasts after 5 seconds
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        if (toast.classList.contains('show')) {
            setTimeout(() => {
                hideToast(toast);
            }, 5000);
        }
    });
    
    // Close toast buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toast-close') ||
            e.target.closest('.toast-close')) {
            const toast = e.target.closest('.toast');
            hideToast(toast);
        }
    });
}

function showToast(message, type = 'info', title = '') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 4 8 8m0-8-8 8"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Trigger show animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
}

function hideToast(toast) {
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    return icons[type] || icons.info;
}

// Tab Management
function initializeTabs() {
    document.addEventListener('click', function(e) {
        const tabLink = e.target.closest('.tab-link');
        if (tabLink) {
            e.preventDefault();
            const tabId = tabLink.getAttribute('href') || tabLink.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabLink, tabId);
            }
        }
    });
}

function switchTab(activeLink, targetId) {
    const tabContainer = activeLink.closest('.tabs').parentElement;
    const tabList = activeLink.closest('.tab-list');
    
    // Update active tab link
    tabList.querySelectorAll('.tab-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
    
    // Show target tab content
    const tabContents = tabContainer.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('d-none');
    });
    
    const targetContent = document.querySelector(targetId);
    if (targetContent) {
        targetContent.classList.remove('d-none');
    }
}

// Dropdown Management
function initializeDropdowns() {
    document.addEventListener('click', function(e) {
        const dropdownToggle = e.target.closest('[data-dropdown-toggle]');
        if (dropdownToggle) {
            e.preventDefault();
            const dropdown = dropdownToggle.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                toggleDropdown(dropdown);
            }
        }
        
        // Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
    });
}

function toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
        dropdown.classList.add('show');
    }
}

function closeAllDropdowns() {
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-TT', {
        style: 'currency',
        currency: 'TTD'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-TT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Enhanced Button Actions
function initializeButtonActions() {
    // Wire up action buttons to show toasts
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (action) {
            handleButtonAction(action, e.target);
        }
    });
}

function handleButtonAction(action, button) {
    switch (action) {
        case 'save-matrix':
            showToast('Pricing matrix saved successfully', 'success', 'Matrix Updated');
            break;
        case 'schedule-promo':
            showToast('Promotion scheduled successfully', 'success', 'Promo Scheduled');
            break;
        case 'mark-fulfilled':
            showToast('Order marked as fulfilled', 'success', 'Order Updated');
            break;
        case 'refund-order':
            showToast('Refund processed successfully', 'success', 'Refund Processed');
            break;
        case 'print-invoice':
            showToast('Invoice sent to printer', 'info', 'Print Job');
            break;
        case 'approve-review':
            showToast('Review approved and published', 'success', 'Review Approved');
            break;
        case 'hide-review':
            showToast('Review hidden from public view', 'info', 'Review Hidden');
            break;
        case 'feature-review':
            showToast('Review featured on homepage', 'success', 'Review Featured');
            break;
        case 'save-gallery':
            showToast('Gallery changes saved', 'success', 'Gallery Updated');
            break;
        case 'reorder-images':
            showToast('Image order updated', 'success', 'Order Saved');
            break;
        case 'save-faq':
            showToast('FAQ saved successfully', 'success', 'FAQ Saved');
            break;
        case 'sync-site':
            showToast('FAQs synced with website', 'success', 'Sync Complete');
            break;
        case 'publish-settings':
            showToast('Settings published successfully', 'success', 'Settings Updated');
            break;
        case 'view-order':
            const orderId = button.getAttribute('data-order-id');
            openDrawer('order-details-drawer');
            showToast(`Viewing order ${orderId}`, 'info', 'Order Details');
            break;
        case 'edit-faq':
        case 'delete-faq':
        case 'edit-caption':
        case 'delete-image':
            showToast('Action completed', 'info', 'Action');
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// Enhanced initialization
function initializeAdmin() {
    initializeSidebar();
    initializeModals();
    initializeDrawers();
    initializeToasts();
    initializeTabs();
    initializeDropdowns();
    initializeButtonActions(); // Add this new function
}

// Export functions for global access
window.adminUI = {
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    showToast,
    hideToast,
    switchTab,
    formatCurrency,
    formatDate,
    handleButtonAction
};