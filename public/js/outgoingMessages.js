/**
 * Outgoing Messages Manager
 * Handles display and management of outgoing messages
 */

class OutgoingMessagesManager {
    constructor() {
        this.messages = [];
        this.currentPage = 0;
        // Load page size from localStorage or default to 50
        this.pageSize = parseInt(localStorage.getItem('outgoing_page_size')) || 50;
        this.totalRecords = 0;
        this.tableBody = document.getElementById('outgoingMessagesTable');
        this.isLoading = false;
        this.initialized = false;
    }

    /**
     * Initialize the manager
     */
    init() {
        if (this.initialized) {
            // Only reload data if already initialized
            this.loadMessages();
            return;
        }

        this.bindEvents();
        this.initPageSizeDropdown();
        this.loadMessages();
        this.initialized = true;
    }

    /**
     * Initialize page size dropdown
     */
    initPageSizeDropdown() {
        const dropdown = document.getElementById('outgoingPageSize');
        if (dropdown) {
            dropdown.value = this.pageSize === Infinity ? 'all' : this.pageSize.toString();
        }
    }

    /**
     * Change page size and save to localStorage
     */
    changePageSize(size) {
        if (size === 'all') {
            this.pageSize = Infinity;
            localStorage.setItem('outgoing_page_size', 'all');
        } else {
            this.pageSize = parseInt(size);
            localStorage.setItem('outgoing_page_size', size);
        }
        this.loadMessages();
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Page size dropdown
        const pageSizeDropdown = document.getElementById('outgoingPageSize');
        if (pageSizeDropdown) {
            pageSizeDropdown.addEventListener('change', (e) => this.changePageSize(e.target.value));
        }

        // Refresh button
        const refreshBtn = document.getElementById('btnRefreshOutgoing');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMessages());
        }

        // Clear button
        const clearBtn = document.getElementById('btnClearOutgoing');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMessages());
        }

        // Load more on scroll
        const container = document.getElementById('outgoingMessagesContainer');
        if (container) {
            container.addEventListener('scroll', () => {
                if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
                    this.loadMore();
                }
            });
        }

        // Modal close handlers
        const modal = document.getElementById('outgoingDetailModal');
        if (modal) {
            modal.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // Listen for new outgoing messages via WebSocket (lightweight - only update if visible)
        if (window.socket) {
            window.socket.on('outgoing:message', (data) => {
                this.addMessage(data);
            });

            // Real-time status update (efficient - only update single row)
            window.socket.on('message:status', (data) => {
                this.updateStatusEfficient(data.messageId, data.status);
            });
        }
    }

    /**
     * Load messages from API with pagination
     */
    async loadMessages(page = 0) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            this.showLoading();

            const limit = this.pageSize === Infinity ? 10000 : this.pageSize;
            const offset = page * limit;
            const res = await window.app.apiCall(`/api/logs/outgoing?limit=${limit}&offset=${offset}`);

            if (res && res.success) {
                this.messages = res.data || [];
                this.totalRecords = res.pagination?.total || 0;
                this.currentPage = page;
                this.renderTable();
                this.updatePager();
            }
        } catch (err) {
            console.error('Failed to load outgoing messages:', err);
            this.showError('Failed to load messages');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get total pages
     */
    getTotalPages() {
        if (this.pageSize === Infinity) return 1;
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;
        this.loadMessages(page);
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
        const pager = document.getElementById('outgoingPager');
        if (!pager) return;

        const totalPages = this.getTotalPages();
        const currentPage = this.currentPage + 1;
        const isFirstPage = this.currentPage === 0;
        const isLastPage = this.currentPage >= totalPages - 1;

        pager.innerHTML = `
            <button class="btn btn-sm" ${isFirstPage ? 'disabled' : ''} onclick="window.outgoingMessagesManager.goFirst()">
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="btn btn-sm" ${isFirstPage ? 'disabled' : ''} onclick="window.outgoingMessagesManager.goPrev()">
                <i class="fas fa-angle-left"></i>
            </button>
            <span class="pager-info">Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-sm" ${isLastPage ? 'disabled' : ''} onclick="window.outgoingMessagesManager.goNext()">
                <i class="fas fa-angle-right"></i>
            </button>
            <button class="btn btn-sm" ${isLastPage ? 'disabled' : ''} onclick="window.outgoingMessagesManager.goLast()">
                <i class="fas fa-angle-double-right"></i>
            </button>
            <span class="pager-total">(${this.totalRecords} total)</span>
        `;
    }

    /**
     * Load more messages (deprecated - use pager instead)
     */
    async loadMore() {
        // Deprecated - now using pager navigation
    }

    /**
     * Clear all messages
     */
    async clearMessages() {
        if (!confirm('Are you sure you want to clear all outgoing messages?')) {
            return;
        }

        try {
            const res = await window.app.apiCall('/api/logs/outgoing', 'DELETE');

            if (res && res.success) {
                this.messages = [];
                this.totalRecords = 0;
                this.renderTable();
                Toast.success('Messages cleared');
            }
        } catch (err) {
            console.error('Failed to clear messages:', err);
            Toast.error('Failed to clear messages');
        }
    }

    /**
     * Add new message to the list (real-time)
     */
    addMessage(data) {
        this.messages.unshift(data);
        this.totalRecords++;

        // Keep only pageSize * 2 in memory
        if (this.messages.length > this.pageSize * 2) {
            this.messages = this.messages.slice(0, this.pageSize * 2);
        }

        this.renderTable();
    }

    /**
     * Efficient status update - only update the specific row, not entire table
     */
    updateStatusEfficient(messageId, status) {
        const message = this.messages.find(m => m.message_id === messageId);
        if (message) {
            message.status = status;

            // Find and update only the specific row's status cell
            const row = document.querySelector(`tr[data-message-id="${messageId}"]`);
            if (row) {
                const statusCell = row.querySelector('.cell-status');
                if (statusCell) {
                    statusCell.innerHTML = this.getStatusBadge(status, message.api_status);
                }
            }
        }
    }

    /**
     * Render the messages table
     */
    renderTable() {
        if (!this.tableBody) return;

        if (this.messages.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-inbox"></i><br>
                        No outgoing messages yet. Messages will appear here when you send them.
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = this.messages.map((msg, index) => this.createTableRow(msg, index)).join('');
    }

    /**
     * Create table row for a message
     */
    createTableRow(msg, index) {
        const statusBadge = this.getStatusBadge(msg.status, msg.api_status);
        const typeBadge = this.getTypeBadgeClickable(msg, index);
        const time = this.formatTimeLocal(msg.created_at);
        const recipient = this.formatRecipient(msg.recipient);
        const apiStatus = msg.api_status ? `HTTP ${msg.api_status}` : '-';

        return `
            <tr data-message-id="${msg.message_id || ''}">
                <td class="cell-session">${msg.session_id || '-'}</td>
                <td class="cell-recipient" title="${msg.recipient}">${recipient}</td>
                <td class="cell-type">${typeBadge}</td>
                <td class="cell-endpoint" title="${msg.api_endpoint}">${msg.api_endpoint || '-'}</td>
                <td class="cell-response">${apiStatus}</td>
                <td class="cell-status">${statusBadge}</td>
                <td class="cell-time">${time}</td>
            </tr>
        `;
    }

    /**
     * Get clickable type badge
     */
    getTypeBadgeClickable(msg, index) {
        const typeMap = {
            'text': { icon: 'comment', color: '#10b981' },
            'image': { icon: 'image', color: '#6366f1' },
            'document': { icon: 'file-alt', color: '#f59e0b' },
            'location': { icon: 'map-marker-alt', color: '#ef4444' }
        };

        const type = msg.message_type || 'text';
        const info = typeMap[type] || { icon: 'comment', color: '#6b7280' };

        return `<span class="msg-type-badge clickable" style="color: ${info.color}; cursor: pointer;" onclick="outgoingMessagesManager.showDetail(${index})" title="Click to view detail">
            <i class="fas fa-${info.icon}"></i> ${type}
        </span>`;
    }

    /**
     * Get status badge HTML
     */
    getStatusBadge(status, apiStatus) {
        const statusMap = {
            'pending': { class: 'status-pending', icon: 'clock', label: 'Pending' },
            'sent': { class: 'status-sent', icon: 'check', label: 'Sent' },
            'delivered': { class: 'status-delivered', icon: 'check-double', label: 'Delivered' },
            'read': { class: 'status-read', icon: 'eye', label: 'Read' },
            'failed': { class: 'status-failed', icon: 'times', label: 'Failed' }
        };

        // Determine status
        let actualStatus = status || 'pending';
        if (apiStatus && apiStatus >= 400) {
            actualStatus = 'failed';
        } else if (apiStatus && apiStatus < 300) {
            actualStatus = actualStatus === 'pending' ? 'sent' : actualStatus;
        }

        const info = statusMap[actualStatus] || statusMap['pending'];
        return `<span class="msg-status-badge ${info.class}"><i class="fas fa-${info.icon}"></i> ${info.label}</span>`;
    }

    /**
     * Format timestamp to LOCAL timezone
     */
    formatTimeLocal(timestamp) {
        if (!timestamp) return '-';

        // SQLite stores as UTC, convert to local
        let date;
        if (typeof timestamp === 'string' && !timestamp.includes('T') && !timestamp.includes('Z')) {
            // SQLite format: "YYYY-MM-DD HH:MM:SS" - treat as UTC
            date = new Date(timestamp.replace(' ', 'T') + 'Z');
        } else {
            date = new Date(timestamp);
        }

        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Format recipient (remove @s.whatsapp.net)
     */
    formatRecipient(recipient) {
        if (!recipient) return '-';
        return recipient.replace('@s.whatsapp.net', '').replace('@g.us', ' (group)');
    }

    /**
     * Show message detail modal
     */
    showDetail(index) {
        const msg = this.messages[index];
        if (!msg) return;

        // Populate modal
        document.getElementById('outDetailSession').textContent = msg.session_id || '-';
        document.getElementById('outDetailMessageId').textContent = msg.message_id || '-';
        document.getElementById('outDetailRecipient').textContent = msg.recipient || '-';
        document.getElementById('outDetailType').textContent = msg.message_type || 'text';
        document.getElementById('outDetailEndpoint').textContent = msg.api_endpoint || '-';
        document.getElementById('outDetailStatus').textContent = msg.status || 'pending';
        document.getElementById('outDetailApiStatus').textContent = msg.api_status ? `HTTP ${msg.api_status}` : '-';
        document.getElementById('outDetailTime').textContent = this.formatTimeLocal(msg.created_at);

        // Message content
        const contentEl = document.getElementById('outDetailContent');
        if (msg.content) {
            contentEl.textContent = msg.content;
        } else {
            contentEl.textContent = '[No content]';
        }

        // Error if any
        const errorEl = document.getElementById('outDetailError');
        if (msg.error) {
            errorEl.textContent = msg.error;
            errorEl.parentElement.style.display = 'block';
        } else {
            errorEl.parentElement.style.display = 'none';
        }

        // Show modal
        document.getElementById('outgoingDetailModal').classList.add('visible');
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('outgoingDetailModal').classList.remove('visible');
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                </td>
            </tr>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </td>
            </tr>
        `;
    }
}

// Initialize when DOM is ready - use window global so websocket.js can access
window.outgoingMessagesManager = null;

function initOutgoingMessages() {
    if (!window.outgoingMessagesManager) {
        window.outgoingMessagesManager = new OutgoingMessagesManager();
    }
    window.outgoingMessagesManager.init();
}

// Export for global access
if (typeof window !== 'undefined') {
    window.OutgoingMessagesManager = OutgoingMessagesManager;
    window.initOutgoingMessages = initOutgoingMessages;
}
