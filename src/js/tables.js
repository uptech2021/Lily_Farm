// Table interaction utilities
document.addEventListener('DOMContentLoaded', function() {
    initializeTables();
});

function initializeTables() {
    initializeSorting();
    initializeBulkSelection();
    initializeRowActions();
    initializePagination();
}

// Table Sorting
function initializeSorting() {
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', handleSort);
        
        // Add sort indicator
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        indicator.innerHTML = '↕';
        header.appendChild(indicator);
    });
}

function handleSort(e) {
    const header = e.currentTarget;
    const table = header.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const column = header.getAttribute('data-sort');
    const currentOrder = header.getAttribute('data-sort-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    
    // Clear other sort indicators
    const allHeaders = table.querySelectorAll('th[data-sort]');
    allHeaders.forEach(h => {
        h.removeAttribute('data-sort-order');
        const indicator = h.querySelector('.sort-indicator');
        if (indicator) {
            indicator.innerHTML = '↕';
        }
    });
    
    // Set new sort order
    header.setAttribute('data-sort-order', newOrder);
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
        indicator.innerHTML = newOrder === 'asc' ? '↑' : '↓';
    }
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);
        
        // Handle different data types
        if (isNumeric(aValue) && isNumeric(bValue)) {
            return newOrder === 'asc' 
                ? parseFloat(aValue) - parseFloat(bValue)
                : parseFloat(bValue) - parseFloat(aValue);
        }
        
        if (isDate(aValue) && isDate(bValue)) {
            return newOrder === 'asc'
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
        }
        
        // String comparison
        const aStr = aValue.toString().toLowerCase();
        const bStr = bValue.toString().toLowerCase();
        
        if (newOrder === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

function getCellValue(row, column) {
    const cellIndex = getColumnIndex(row.closest('table'), column);
    const cell = row.children[cellIndex];
    
    if (!cell) return '';
    
    // Get value from data attribute or text content
    return cell.getAttribute('data-value') || cell.textContent.trim();
}

function getColumnIndex(table, column) {
    const headers = table.querySelectorAll('th');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].getAttribute('data-sort') === column) {
            return i;
        }
    }
    return 0;
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function isDate(value) {
    return !isNaN(Date.parse(value));
}

// Bulk Selection
function initializeBulkSelection() {
    const tables = document.querySelectorAll('table[data-bulk-select]');
    tables.forEach(table => {
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        // Add select all checkbox to header
        const selectAllCell = thead.querySelector('th:first-child');
        if (selectAllCell && !selectAllCell.querySelector('input[type="checkbox"]')) {
            const selectAllCheckbox = document.createElement('input');
            selectAllCheckbox.type = 'checkbox';
            selectAllCheckbox.className = 'bulk-select-all';
            selectAllCheckbox.addEventListener('change', handleSelectAll);
            selectAllCell.appendChild(selectAllCheckbox);
        }
        
        // Add individual checkboxes to rows
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell && !firstCell.querySelector('input[type="checkbox"]')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'row-select';
                checkbox.addEventListener('change', handleRowSelect);
                firstCell.appendChild(checkbox);
            }
        });
        
        // Add bulk actions toolbar
        addBulkActionsToolbar(table);
    });
}

function handleSelectAll(e) {
    const selectAll = e.target;
    const table = selectAll.closest('table');
    const rowCheckboxes = table.querySelectorAll('.row-select');
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    updateBulkActions(table);
}

function handleRowSelect(e) {
    const table = e.target.closest('table');
    updateBulkActions(table);
    updateSelectAllState(table);
}

function updateSelectAllState(table) {
    const selectAll = table.querySelector('.bulk-select-all');
    const rowCheckboxes = table.querySelectorAll('.row-select');
    const checkedRows = table.querySelectorAll('.row-select:checked');
    
    if (selectAll) {
        selectAll.checked = checkedRows.length === rowCheckboxes.length;
        selectAll.indeterminate = checkedRows.length > 0 && checkedRows.length < rowCheckboxes.length;
    }
}

function updateBulkActions(table) {
    const checkedRows = table.querySelectorAll('.row-select:checked');
    const bulkToolbar = table.querySelector('.bulk-actions-toolbar');
    
    if (bulkToolbar) {
        bulkToolbar.style.display = checkedRows.length > 0 ? 'flex' : 'none';
        
        const countElement = bulkToolbar.querySelector('.selected-count');
        if (countElement) {
            countElement.textContent = checkedRows.length;
        }
    }
}

function addBulkActionsToolbar(table) {
    const container = table.closest('.table-container');
    if (!container) return;
    
    const toolbar = document.createElement('div');
    toolbar.className = 'bulk-actions-toolbar';
    toolbar.style.display = 'none';
    toolbar.innerHTML = `
        <div class="selected-count">0</div>
        <span>items selected</span>
        <div class="bulk-actions">
            <button type="button" class="btn btn-sm btn-secondary" data-bulk-action="edit">Edit Selected</button>
            <button type="button" class="btn btn-sm btn-danger" data-bulk-action="delete">Delete Selected</button>
            <button type="button" class="btn btn-sm btn-secondary" data-bulk-action="export">Export Selected</button>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" data-bulk-action="clear">Clear Selection</button>
    `;
    
    container.appendChild(toolbar);
    
    // Handle bulk actions
    toolbar.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-bulk-action');
        if (action) {
            handleBulkAction(table, action);
        }
    });
}

function handleBulkAction(table, action) {
    const checkedRows = table.querySelectorAll('.row-select:checked');
    const selectedIds = Array.from(checkedRows).map(checkbox => {
        return checkbox.closest('tr').getAttribute('data-id');
    }).filter(id => id);
    
    switch (action) {
        case 'edit':
            if (selectedIds.length > 0) {
                showToast(`Editing ${selectedIds.length} items`, 'info', 'Bulk Edit');
            }
            break;
        case 'delete':
            if (selectedIds.length > 0) {
                if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
                    showToast(`Deleted ${selectedIds.length} items`, 'success', 'Bulk Delete');
                    clearSelection(table);
                }
            }
            break;
        case 'export':
            if (selectedIds.length > 0) {
                showToast(`Exporting ${selectedIds.length} items`, 'info', 'Bulk Export');
            }
            break;
        case 'clear':
            clearSelection(table);
            break;
    }
}

function clearSelection(table) {
    const checkboxes = table.querySelectorAll('.row-select, .bulk-select-all');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateBulkActions(table);
}

// Row Actions
function initializeRowActions() {
    const actionButtons = document.querySelectorAll('[data-row-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleRowAction);
    });
}

function handleRowAction(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const action = button.getAttribute('data-row-action');
    const row = button.closest('tr');
    const rowId = row.getAttribute('data-id');
    
    switch (action) {
        case 'edit':
            editRow(row);
            break;
        case 'delete':
            deleteRow(row);
            break;
        case 'duplicate':
            duplicateRow(row);
            break;
        case 'view':
            viewRow(row);
            break;
    }
}

function editRow(row) {
    const rowId = row.getAttribute('data-id');
    showToast(`Editing item ${rowId}`, 'info', 'Edit Item');
}

function deleteRow(row) {
    const rowId = row.getAttribute('data-id');
    if (confirm(`Are you sure you want to delete item ${rowId}?`)) {
        row.style.opacity = '0.5';
        setTimeout(() => {
            row.remove();
            showToast(`Deleted item ${rowId}`, 'success', 'Delete Item');
        }, 300);
    }
}

function duplicateRow(row) {
    const newRow = row.cloneNode(true);
    const newId = Date.now();
    
    // Update ID and clear selection
    newRow.setAttribute('data-id', newId);
    const checkbox = newRow.querySelector('.row-select');
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // Insert after original row
    row.parentNode.insertBefore(newRow, row.nextSibling);
    showToast(`Duplicated item`, 'success', 'Duplicate Item');
}

function viewRow(row) {
    const rowId = row.getAttribute('data-id');
    showToast(`Viewing item ${rowId}`, 'info', 'View Item');
}

// Pagination
function initializePagination() {
    const paginationLinks = document.querySelectorAll('.pagination a');
    paginationLinks.forEach(link => {
        link.addEventListener('click', handlePagination);
    });
}

function handlePagination(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const page = link.getAttribute('data-page');
    
    if (page) {
        showToast(`Loading page ${page}`, 'info', 'Pagination');
        // In a real app, this would load the new page data
    }
}

// Table Search
function initializeTableSearch() {
    const searchInputs = document.querySelectorAll('[data-table-search]');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleTableSearch, 300));
    });
}

function handleTableSearch(e) {
    const input = e.target;
    const tableId = input.getAttribute('data-table-search');
    const table = document.getElementById(tableId);
    const searchTerm = input.value.toLowerCase();
    
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'info', title = '') {
    if (window.adminUI && window.adminUI.showToast) {
        window.adminUI.showToast(message, type, title);
    } else {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
}

// Export functions for global access
window.tableUtils = {
    handleSort,
    clearSelection,
    handleBulkAction,
    handleTableSearch
};

