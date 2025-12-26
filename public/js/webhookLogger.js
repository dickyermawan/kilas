/**
 * Webhook Logger
 * Manages webhook history display in table format and detail modal
 */

class WebhookLogger {
    constructor() {
        this.history = []; // Store webhook events
        this.currentPage = 0;
        // Load page size from localStorage or default to 50
        this.pageSize = localStorage.getItem('webhook_page_size') || '50';
        this.maxHistory = this.pageSize === 'all' ? 10000 : parseInt(this.pageSize) * 10;
        this.storageKey = 'kirimkan_webhook_history';
        this.tableBody = document.getElementById('webhookHistoryTable');

        // Load history from localStorage on init
        this.loadFromStorage();
        this.initPageSizeDropdown();
        this.bindEvents();
    }

    /**
     * Initialize page size dropdown
     */
    initPageSizeDropdown() {
        const dropdown = document.getElementById('webhookPageSize');
        if (dropdown) {
            dropdown.value = this.pageSize;
        }
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        const dropdown = document.getElementById('webhookPageSize');
        if (dropdown) {
            dropdown.addEventListener('change', (e) => this.changePageSize(e.target.value));
        }
    }

    /**
     * Change page size and save to localStorage
     */
    changePageSize(size) {
        this.pageSize = size;
        this.maxHistory = size === 'all' ? 10000 : parseInt(size) * 10;
        localStorage.setItem('webhook_page_size', size);
        this.currentPage = 0;
        this.updateTable();
    }

    /**
     * Get total pages
     */
    getTotalPages() {
        if (this.pageSize === 'all') return 1;
        return Math.max(1, Math.ceil(this.history.length / parseInt(this.pageSize)));
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;
        this.currentPage = page;
        this.updateTable();
    }

    /**
     * Go to first page
     */
    goFirst() {
        this.goToPage(0);
    }

    /**
     * Go to last page
     */
    goLast() {
        this.goToPage(this.getTotalPages() - 1);
    }

    /**
     * Go to previous page
     */
    goPrev() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }

    /**
     * Go to next page  
     */
    goNext() {
        if (this.currentPage < this.getTotalPages() - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    /**
     * Update pager UI
     */
    updatePager() {
        const pager = document.getElementById('webhookPager');
        if (!pager) return;

        const totalPages = this.getTotalPages();
        const currentPage = this.currentPage + 1;
        const isFirstPage = this.currentPage === 0;
        const isLastPage = this.currentPage >= totalPages - 1;

        pager.innerHTML = `
            <button class="btn btn-sm" ${isFirstPage ? 'disabled' : ''} onclick="window.webhookLogger.goFirst()">
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="btn btn-sm" ${isFirstPage ? 'disabled' : ''} onclick="window.webhookLogger.goPrev()">
                <i class="fas fa-angle-left"></i>
            </button>
            <span class="pager-info">Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-sm" ${isLastPage ? 'disabled' : ''} onclick="window.webhookLogger.goNext()">
                <i class="fas fa-angle-right"></i>
            </button>
            <button class="btn btn-sm" ${isLastPage ? 'disabled' : ''} onclick="window.webhookLogger.goLast()">
                <i class="fas fa-angle-double-right"></i>
            </button>
            <span class="pager-total">(${this.history.length} total)</span>
        `;
    }

    /**
     * Load history from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.history = JSON.parse(stored);
                this.updateTable();
            }
        } catch (e) {
            console.error('Failed to load webhook history from storage:', e);
        }
    }

    /**
     * Save history to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save webhook history to storage:', e);
        }
    }

    /**
     * Add new webhook log entry
     */
    addLog(data) {
        // Add timestamp if not present
        if (!data.timestamp) {
            data.timestamp = new Date().toISOString();
        }

        // Debug log to check data
        console.log('WebhookLogger.addLog received:', data);

        // Add to beginning of array
        this.history.unshift(data);

        // Keep only last 50 entries
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        // Save to localStorage
        this.saveToStorage();

        // Update table display
        this.updateTable();
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem(this.storageKey);
        this.updateTable();
    }

    /**
     * Update the webhook history table
     */
    updateTable() {
        if (!this.tableBody) return;

        // Clear existing rows
        this.tableBody.innerHTML = '';

        if (this.history.length === 0) {
            // Show empty state
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-inbox"></i><br>
                        No webhook history yet. Webhooks will appear here in real-time.
                    </td>
                </tr>
            `;
            this.updatePager();
            return;
        }

        // Calculate pagination
        const pageSize = this.pageSize === 'all' ? this.history.length : parseInt(this.pageSize);
        const startIndex = this.currentPage * pageSize;
        const endIndex = Math.min(startIndex + pageSize, this.history.length);
        const itemsToShow = this.history.slice(startIndex, endIndex);

        // Populate with history (respecting current page)
        itemsToShow.forEach((item, index) => {
            const row = this.createTableRow(item, startIndex + index);
            this.tableBody.appendChild(row);
        });

        // Update pager
        this.updatePager();
    }

    /**
     * Create table row for webhook entry
     */
    createTableRow(data, index) {
        const row = document.createElement('tr');

        // Session - check both root level and payload
        const sessionCell = document.createElement('td');
        const sessionId = data.sessionId || data.payload?.sessionId || '-';
        sessionCell.textContent = sessionId;
        sessionCell.style.fontWeight = '600';
        row.appendChild(sessionCell);

        // Event Type
        const eventCell = document.createElement('td');
        const eventBadge = document.createElement('span');
        eventBadge.className = 'event-type-badge';
        eventBadge.textContent = data.event || '-';
        eventCell.appendChild(eventBadge);
        row.appendChild(eventCell);

        // Target URL
        const urlCell = document.createElement('td');
        urlCell.textContent = data.url || '-';
        urlCell.style.maxWidth = '300px';
        urlCell.style.overflow = 'hidden';
        urlCell.style.textOverflow = 'ellipsis';
        urlCell.style.whiteSpace = 'nowrap';
        row.appendChild(urlCell);

        // Status (clickable)
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${data.success ? 'success' : 'error'}`;
        statusBadge.textContent = data.status ? `HTTP ${data.status}` : (data.success ? 'Success' : 'Failed');
        statusBadge.style.cursor = 'pointer';
        statusBadge.title = 'Click to view details';

        // Add click handler
        statusBadge.addEventListener('click', () => {
            this.showDetailModal(data);
        });

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Time (date + time)
        const timeCell = document.createElement('td');
        const timestamp = new Date(data.timestamp || Date.now());
        const timeStr = timestamp.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        timeCell.innerHTML = timeStr;
        row.appendChild(timeCell);

        return row;
    }

    /**
     * Show webhook detail modal
     */
    showDetailModal(data) {
        const modal = document.getElementById('webhookDetailModal');
        if (!modal) return;

        // Add click-outside handler to close modal
        const closeOnClickOutside = (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
                modal.removeEventListener('click', closeOnClickOutside);
            }
        };
        modal.addEventListener('click', closeOnClickOutside);

        // Populate modal fields - check both root and payload for sessionId
        const sessionId = data.sessionId || data.payload?.sessionId || '-';
        document.getElementById('webhookDetailSession').textContent = sessionId;
        document.getElementById('webhookDetailEvent').textContent = data.event || '-';

        const statusEl = document.getElementById('webhookDetailStatus');
        statusEl.textContent = data.status ? `HTTP ${data.status}` : (data.success ? 'Success' : 'Failed');
        statusEl.style.color = data.success ? '#10b981' : '#ef4444';

        const timestamp = new Date(data.timestamp || Date.now());
        document.getElementById('webhookDetailTime').textContent = timestamp.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        document.getElementById('webhookDetailUrl').textContent = data.url || '-';

        // Format JSON payload
        const payload = data.payload || {};
        document.getElementById('webhookDetailPayload').textContent = JSON.stringify(payload, null, 2);

        // Format response - improved handling for various types
        let responseText = '-';
        if (data.error) {
            responseText = `Error: ${data.error}`;
        } else if (data.response !== undefined && data.response !== null) {
            try {
                // Handle different response types
                if (typeof data.response === 'object') {
                    // Already an object or array, stringify it
                    responseText = JSON.stringify(data.response, null, 2);
                } else if (typeof data.response === 'string') {
                    // Try to parse if it's JSON string
                    try {
                        const parsed = JSON.parse(data.response);
                        responseText = JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        // Not JSON, display as is
                        responseText = data.response;
                    }
                } else {
                    // Number, boolean, etc
                    responseText = String(data.response);
                }
            } catch (e) {
                console.error('Error formatting response:', e);
                responseText = String(data.response);
            }
        }
        document.getElementById('webhookDetailResponse').textContent = responseText;

        // Show modal
        modal.classList.add('visible');
    }
}

// Initialize webhook logger when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.webhookLogger = new WebhookLogger();
    });
} else {
    window.webhookLogger = new WebhookLogger();
}
