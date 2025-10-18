// Form validation and interaction utilities
document.addEventListener('DOMContentLoaded', function() {
    initializeForms();
});

function initializeForms() {
    initializeValidation();
    initializeDirtyState();
    initializeFileUploads();
    initializeSwitches();
    initializeFormFields();
}

// Form Validation
function initializeValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    });
}

function handleFormSubmit(e) {
    const form = e.target;
    const isValid = validateForm(form);
    
    if (!isValid) {
        e.preventDefault();
        showToast('Please fix the errors below', 'error', 'Validation Error');
        
        // Focus first invalid field
        const firstError = form.querySelector('.is-invalid');
        if (firstError) {
            firstError.focus();
        }
    }
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    // Clear previous errors
    clearFieldError(e);
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }
    
    // Password validation
    if (type === 'password' && value && !isValidPassword(value)) {
        isValid = false;
        errorMessage = 'Password must be at least 8 characters with letters and numbers';
    }
    
    // Number validation
    if (type === 'number' && value) {
        const num = parseFloat(value);
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (isNaN(num)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
        } else if (min && num < parseFloat(min)) {
            isValid = false;
            errorMessage = `Value must be at least ${min}`;
        } else if (max && num > parseFloat(max)) {
            isValid = false;
            errorMessage = `Value must be no more than ${max}`;
        }
    }
    
    // URL validation
    if (type === 'url' && value && !isValidUrl(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid URL';
    }
    
    // Custom validation
    const customValidator = field.getAttribute('data-validate');
    if (customValidator && value) {
        const customResult = validateCustom(field, customValidator);
        if (!customResult.isValid) {
            isValid = false;
            errorMessage = customResult.message;
        }
    }
    
    // Show/hide error
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('is-invalid');
    
    const errorElement = field.parentNode.querySelector('.invalid-feedback');
    if (errorElement) {
        errorElement.remove();
    }
}

// Initialize form fields to prevent default validation styling
function initializeFormFields() {
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        // Remove any default invalid styling on page load
        control.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
    });
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

// Validation helpers
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validateCustom(field, validator) {
    switch (validator) {
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return {
                isValid: phoneRegex.test(field.value),
                message: 'Please enter a valid phone number'
            };
        case 'sku':
            const skuRegex = /^[A-Z0-9-]+$/;
            return {
                isValid: skuRegex.test(field.value),
                message: 'SKU must contain only uppercase letters, numbers, and hyphens'
            };
        case 'slug':
            const slugRegex = /^[a-z0-9-]+$/;
            return {
                isValid: slugRegex.test(field.value),
                message: 'Slug must contain only lowercase letters, numbers, and hyphens'
            };
        default:
            return { isValid: true, message: '' };
    }
}

// Dirty State Management
function initializeDirtyState() {
    const forms = document.querySelectorAll('form[data-dirty-state]');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isDirty = false;
        
        inputs.forEach(input => {
            const originalValue = input.value;
            
            input.addEventListener('input', function() {
                const currentValue = this.value;
                isDirty = currentValue !== originalValue;
                updateDirtyState(form, isDirty);
            });
        });
        
        // Reset dirty state on form reset
        form.addEventListener('reset', function() {
            isDirty = false;
            updateDirtyState(form, false);
        });
    });
}

function updateDirtyState(form, isDirty) {
    const saveButton = form.querySelector('[data-save-button]');
    const cancelButton = form.querySelector('[data-cancel-button]');
    
    if (saveButton) {
        saveButton.disabled = !isDirty;
        saveButton.classList.toggle('btn-primary', isDirty);
        saveButton.classList.toggle('btn-secondary', !isDirty);
    }
    
    if (cancelButton) {
        cancelButton.style.display = isDirty ? 'inline-flex' : 'none';
    }
    
    // Show unsaved changes warning
    if (isDirty) {
        window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
}

function handleBeforeUnload(e) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    return e.returnValue;
}

// File Upload Handling
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileUpload);
    });
    
    // Drag and drop zones
    const dropZones = document.querySelectorAll('[data-drop-zone]');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleFileUpload(e) {
    const input = e.target;
    const files = Array.from(input.files);
    const preview = input.parentNode.querySelector('.file-preview');
    
    if (preview) {
        preview.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = createFilePreview(file);
            preview.appendChild(fileItem);
        });
    }
    
    // Update file count
    const fileCount = input.parentNode.querySelector('.file-count');
    if (fileCount) {
        fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''} selected`;
    }
}

function createFilePreview(file) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const icon = getFileIcon(file.type);
    const size = formatFileSize(file.size);
    
    item.innerHTML = `
        <div class="file-icon">${icon}</div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${size}</div>
        </div>
        <button type="button" class="file-remove" data-file-name="${file.name}">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 4 8 8m0-8-8 8"/>
            </svg>
        </button>
    `;
    
    // Remove file functionality
    const removeBtn = item.querySelector('.file-remove');
    removeBtn.addEventListener('click', function() {
        item.remove();
        updateFileInput();
    });
    
    return item;
}

function getFileIcon(type) {
    if (type.startsWith('image/')) {
        return '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>';
    } else if (type.includes('pdf')) {
        return '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>';
    } else {
        return '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const input = e.currentTarget.querySelector('input[type="file"]');
    
    if (input) {
        // Create a new FileList-like object
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
        
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function updateFileInput() {
    // This would typically update the actual file input
    // For now, we'll just update the UI
    const previews = document.querySelectorAll('.file-preview');
    previews.forEach(preview => {
        const items = preview.querySelectorAll('.file-item');
        const fileCount = preview.parentNode.querySelector('.file-count');
        if (fileCount) {
            fileCount.textContent = `${items.length} file${items.length !== 1 ? 's' : ''} selected`;
        }
    });
}

// Switch/Toggle Handling
function initializeSwitches() {
    const switches = document.querySelectorAll('.switch input[type="checkbox"]');
    switches.forEach(switchEl => {
        switchEl.addEventListener('change', handleSwitchChange);
    });
}

function handleSwitchChange(e) {
    const switchEl = e.target;
    const isChecked = switchEl.checked;
    const label = switchEl.closest('.form-group').querySelector('label');
    
    // Update label text if data attributes are present
    if (label) {
        const onText = switchEl.getAttribute('data-on-text');
        const offText = switchEl.getAttribute('data-off-text');
        
        if (onText && offText) {
            label.textContent = isChecked ? onText : offText;
        }
    }
    
    // Trigger custom event
    switchEl.dispatchEvent(new CustomEvent('switch-change', {
        detail: { checked: isChecked },
        bubbles: true
    }));
}

// Form Reset
function resetForm(form) {
    if (typeof form === 'string') {
        form = document.querySelector(form);
    }
    
    if (form) {
        form.reset();
        
        // Clear validation errors
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        const errorMessages = form.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(error => {
            error.remove();
        });
        
        // Reset dirty state
        updateDirtyState(form, false);
        
        // Clear file previews
        const filePreviews = form.querySelectorAll('.file-preview');
        filePreviews.forEach(preview => {
            preview.innerHTML = '';
        });
        
        const fileCounts = form.querySelectorAll('.file-count');
        fileCounts.forEach(count => {
            count.textContent = 'No files selected';
        });
    }
}

// Export functions for global access
window.formUtils = {
    validateForm,
    validateField,
    resetForm,
    updateDirtyState,
    formatFileSize
};
