// Main Dashboard Logic
window.app = {
    apiKey: localStorage.getItem('apiKey'),

    init: function () {
        if (!this.apiKey) {
            window.location.href = '/';
            return;
        }

        // Initialize stats manager
        this.statsManager.init();

        this.bindEvents();
        this.loadSessions();

        // Populate stats periodically
        setInterval(this.updateStats.bind(this), 5000);
        this.updateStats();
    },

    // Statistics Manager for real-time dashboard stats
    statsManager: {
        messagesCount: 0,
        webhookSuccess: 0,
        webhookTotal: 0,
        lastWebhookTime: null,

        init: function () {
            this.loadFromStorage();
            this.startTimeUpdater();
        },

        loadFromStorage: function () {
            // Load messages count (check if same day)
            const stored = localStorage.getItem('stats_messages_today');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    const today = new Date().toDateString();
                    if (data.date === today) {
                        this.messagesCount = data.count || 0;
                    }
                } catch (e) {
                    console.error('Failed to load messages stats:', e);
                }
            }

            // Load webhook stats
            const webhookStored = localStorage.getItem('stats_webhook');
            if (webhookStored) {
                try {
                    const data = JSON.parse(webhookStored);
                    this.webhookSuccess = data.success || 0;
                    this.webhookTotal = data.total || 0;
                    if (data.lastTime) {
                        this.lastWebhookTime = new Date(data.lastTime);
                    }
                } catch (e) {
                    console.error('Failed to load webhook stats:', e);
                }
            }

            this.updateUI();
        },

        saveMessagesToStorage: function () {
            const data = {
                date: new Date().toDateString(),
                count: this.messagesCount
            };
            localStorage.setItem('stats_messages_today', JSON.stringify(data));
        },

        saveWebhookToStorage: function () {
            const data = {
                success: this.webhookSuccess,
                total: this.webhookTotal,
                lastTime: this.lastWebhookTime ? this.lastWebhookTime.toISOString() : null
            };
            localStorage.setItem('stats_webhook', JSON.stringify(data));
        },

        incrementMessages: function () {
            this.messagesCount++;
            this.saveMessagesToStorage();
            this.updateUI();
        },

        updateWebhook: function (success) {
            this.webhookTotal++;
            if (success) this.webhookSuccess++;
            this.lastWebhookTime = new Date();
            this.saveWebhookToStorage();
            this.updateUI();
        },

        updateUI: function () {
            // Update Messages Today
            const msgEl = document.getElementById('statMessagesToday');
            if (msgEl) msgEl.textContent = this.messagesCount;

            // Update Webhook Success with highlighted primary number
            const webhookEl = document.getElementById('statWebhookSuccess');
            if (webhookEl) {
                webhookEl.innerHTML = `<span style="font-size: 2rem; font-weight: 700;">${this.webhookSuccess}</span> <span style="font-size: 1.2rem; opacity: 0.6;">/ ${this.webhookTotal}</span>`;
            }

            // Update Last Webhook
            this.updateLastWebhookTime();
        },

        updateLastWebhookTime: function () {
            const el = document.getElementById('statLastWebhook');
            if (!el) return;

            if (!this.lastWebhookTime) {
                el.textContent = 'Never';
                return;
            }

            const now = new Date();
            const diff = Math.floor((now - this.lastWebhookTime) / 1000);

            if (diff < 60) {
                el.textContent = 'Just now';
            } else if (diff < 3600) {
                el.textContent = `${Math.floor(diff / 60)} min ago`;
            } else if (diff < 86400) {
                el.textContent = `${Math.floor(diff / 3600)}h ago`;
            } else {
                el.textContent = 'Yesterday';
            }
        },

        startTimeUpdater: function () {
            // Update relative time every minute
            setInterval(() => this.updateLastWebhookTime(), 60000);
        }
    },

    bindEvents: function () {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('apiKey');
            window.location.href = '/';
        });

        // New Session
        document.getElementById('btnNewSession').addEventListener('click', () => {
            this.showNewSessionModal();
        });

        // Tabs (API Tester / Quick Send / Webhook)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                // Only handle left column tabs (api-tester, quick-send, webhook)
                if (tab === 'api-tester' || tab === 'quick-send' || tab === 'webhook') {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        if (b.dataset.tab === 'api-tester' || b.dataset.tab === 'quick-send' || b.dataset.tab === 'webhook') {
                            b.classList.remove('active');
                        }
                    });
                    document.querySelectorAll('.tab-content').forEach(c => {
                        if (c.id === 'api-tester' || c.id === 'quick-send' || c.id === 'webhook') {
                            c.classList.remove('active');
                        }
                    });
                    btn.classList.add('active');
                    document.getElementById(tab).classList.add('active');
                }
            });
        });

        // Events Tabs (Live Events / Live Webhook Events)
        document.querySelectorAll('.events-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.eventsTab;
                document.querySelectorAll('.events-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.events-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });

        // Modal Close
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('qrModal').classList.remove('visible');
        });

        // Clear Logs - works with active tab
        const btnClearLog = document.getElementById('btnClearCurrentLog');
        if (btnClearLog) {
            btnClearLog.addEventListener('click', () => {
                const activeTab = document.querySelector('.events-tab-content.active');
                if (activeTab.id === 'live-events') {
                    document.getElementById('monitorEventLog').innerHTML = '';
                    sessionStorage.removeItem('kirimkan_events');
                } else if (activeTab.id === 'live-webhook') {
                    document.getElementById('webhookLog').innerHTML = '';
                    sessionStorage.removeItem('kirimkan_webhook_logs');
                }
            });
        }

        // Quick Send
        const quickSendForm = document.getElementById('quickSendForm');
        if (quickSendForm) {
            quickSendForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const sessionId = document.getElementById('qsSession').value;
                const chatId = document.getElementById('qsPhone').value;
                const text = document.getElementById('qsMessage').value;

                if (!sessionId) return alert('Please select a session');

                try {
                    const btn = e.target.querySelector('button');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                    btn.disabled = true;

                    const res = await this.apiCall('/api/messages/send-text', 'POST', { sessionId, chatId, text });

                    if (res.success) {
                        this.showAlert('Message sent successfully!', 'success');
                        document.getElementById('qsMessage').value = '';
                    } else {
                        this.showAlert('Failed: ' + res.message, 'error');
                    }

                    btn.innerHTML = originalText;
                    btn.disabled = false;
                } catch (err) {
                    this.showAlert('Error sending message: ' + err.message, 'error');
                }
            });
        }

        // Enter key support for new session modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newSessionModal = document.getElementById('newSessionModal');
                if (newSessionModal.classList.contains('visible')) {
                    this.confirmNewSession();
                }
            }
            if (e.key === 'Escape') {
                this.closeNewSessionModal();
                this.closeDeleteModal();
            }
        });
    },

    apiCall: async function (url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/';
            return;
        }
        return await res.json();
    },

    loadSessions: async function () {
        const res = await this.apiCall('/api/sessions');
        if (res && res.success) {
            const list = document.getElementById('devicesGrid');
            const qsSelect = document.getElementById('qsSession');
            const apiSessionSelect = document.getElementById('apiSession');

            if (res.data.length === 0) {
                list.innerHTML = '<div class="empty-state">No sessions created yet.</div>';
                qsSelect.innerHTML = '<option value="">Select session...</option>';
                apiSessionSelect.innerHTML = '<option value="">Select session...</option>';
                return;
            }

            // Build Sessions List with new device-card structure
            list.innerHTML = res.data.map(session => `
                <div class="device-card" data-id="${session.id}">
                    <div class="device-header">
                        <div class="device-avatar">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div class="device-info">
                            <div class="device-name">${session.id}</div>
                            <div class="device-id">${session.user ? session.user.id.split(':')[0] : 'Not connected'}</div>
                        </div>
                    </div>
                    <div class="device-status-row">
                        <span>Status</span>
                        <span class="device-status-badge ${session.status}">${session.status.toUpperCase()}</span>
                    </div>
                    <div class="device-status-row" style="border: none;">
                        <span>Uptime</span>
                        <span class="device-uptime">-</span>
                    </div>
                    <div class="device-actions">
                        <button class="btn btn-${session.status === 'connected' ? 'secondary' : 'success'} btn-sm" onclick="window.app.showQR('${session.id}')" style="flex: 1;">
                            ${session.status === 'connected' ? 'Reconnect' : 'Scan QR Code'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.app.deleteSession('${session.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Build Quick Send Select (only connected sessions)
            const connected = res.data.filter(s => s.status === 'connected');
            if (qsSelect) {
                qsSelect.innerHTML = '<option value="">Select session...</option>' +
                    connected.map(s => `<option value="${s.id}">${s.id}</option>`).join('');
            }

            // Build API Tester Session Select (only connected sessions)
            if (apiSessionSelect) {
                apiSessionSelect.innerHTML = '<option value="">Select session...</option>' +
                    connected.map(s => `<option value="${s.id}">${s.id}</option>`).join('');
            }

            // Build Webhook Session Select (only connected sessions)
            if (window.WebhookManager && typeof window.WebhookManager.populateSessions === 'function') {
                window.WebhookManager.populateSessions(res.data);
            }

            this.updateStatsData(res.data);
        }
    },

    createSession: async function (sessionId) {
        try {
            await this.apiCall('/api/sessions/create', 'POST', { sessionId });
            this.loadSessions();
            this.logEvent('info', 'System', `Session ${sessionId} created`);
            // Show QR modal after creating session
            setTimeout(() => {
                this.showQR(sessionId);
            }, 500);
        } catch (err) {
            alert('Failed to create session: ' + err.message);
        }
    },

    deleteSession: function (sessionId) {
        this.sessionToDelete = sessionId;
        document.getElementById('deleteSessionName').textContent = sessionId;
        document.getElementById('deleteModal').classList.add('visible');
    },

    confirmDelete: async function () {
        const sessionId = this.sessionToDelete;
        this.closeDeleteModal();

        try {
            const res = await this.apiCall(`/api/sessions/${sessionId}`, 'DELETE');
            if (res.success) {
                this.loadSessions();
                this.logEvent('info', 'System', `Session ${sessionId} deleted`);
            } else {
                this.showAlert('Failed to delete session: ' + res.message, 'error');
            }
        } catch (err) {
            this.showAlert('Error deleting session: ' + err.message, 'error');
        }
    },

    closeDeleteModal: function () {
        document.getElementById('deleteModal').classList.remove('visible');
        this.sessionToDelete = null;
    },

    showNewSessionModal: function () {
        document.getElementById('newSessionModal').classList.add('visible');
        setTimeout(() => {
            document.getElementById('newSessionInput').focus();
        }, 100);
    },

    closeNewSessionModal: function () {
        document.getElementById('newSessionModal').classList.remove('visible');
        document.getElementById('newSessionInput').value = '';
    },

    confirmNewSession: function () {
        const sessionId = document.getElementById('newSessionInput').value.trim();
        if (!sessionId) {
            this.showAlert('Please enter a session name', 'warning');
            return;
        }
        this.closeNewSessionModal();
        this.createSession(sessionId);
    },

    showAlert: function (message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? 'var(--accent-danger)' : type === 'warning' ? 'var(--accent-warning)' : 'var(--accent-success)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showQR: async function (sessionId) {
        const modal = document.getElementById('qrModal');
        modal.classList.add('visible');
        modal.dataset.session = sessionId;

        const qrImg = document.getElementById('qrImage');
        const spinner = document.getElementById('qrSpinner');

        qrImg.style.display = 'none';
        qrImg.src = '';
        spinner.style.display = 'block';

        // Subscribe to this session's events via WebSocket
        if (window.socket) {
            window.socket.emit('subscribe:session', sessionId);
        }

        // Trigger session creation/reconnection which will emit QR
        try {
            await this.apiCall('/api/sessions/create', 'POST', { sessionId });
            this.logEvent('info', sessionId, 'Waiting for QR code...');
        } catch (err) {
            console.error('Error creating session:', err);
            spinner.style.display = 'none';
            alert('Failed to create session. Check console for details.');
        }
    },

    updateStats: async function () {
        // Stats updated via loadSessions
    },

    updateStatsData: function (sessions) {
        // Update Active Sessions stat with highlighted primary number
        const statActiveSessions = document.getElementById('statActiveSessions');
        if (statActiveSessions) {
            const connected = sessions.filter(s => s.status === 'connected').length;
            const total = sessions.length;
            statActiveSessions.innerHTML = `<span style="font-size: 2rem; font-weight: 700;">${connected}</span> <span style="font-size: 1.2rem; opacity: 0.6;">/ ${total}</span>`;
        }
    },

    logEvent: function (type, source, message) {
        const log = document.getElementById('monitorEventLog');

        // Remove empty state if it exists
        const emptyState = log.querySelector('div[style*="text-align: center"]');
        if (emptyState && !emptyState.classList.contains('log-entry')) {
            emptyState.remove();
        }

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-type type-${type}">${type}</span>
            <span class="log-message"><strong>[${source}]</strong> ${message}</span>
        `;
        log.prepend(entry);

        // Keep only last 100 entries in DOM
        while (log.children.length > 100) {
            log.removeChild(log.lastChild);
        }

        // Save to sessionStorage
        this.saveEventsToStorage();
    },

    saveEventsToStorage: function () {
        const log = document.getElementById('monitorEventLog');
        const events = [];
        Array.from(log.children).slice(0, 100).forEach(entry => {
            events.push(entry.outerHTML);
        });
        sessionStorage.setItem('kirimkan_events', JSON.stringify(events));
    },

    loadEventsFromStorage: function () {
        const stored = sessionStorage.getItem('kirimkan_events');
        if (stored) {
            try {
                const events = JSON.parse(stored);
                const log = document.getElementById('monitorEventLog');
                log.innerHTML = events.join('');
            } catch (e) {
                console.error('Failed to load events from storage:', e);
            }
        }
    },

    // Webhook functions
    loadWebhookConfig: async function () {
        const sessionSelect = document.getElementById('webhookSession');
        const webhookUrlInput = document.getElementById('webhookUrl');

        if (!sessionSelect || !webhookUrlInput) return;

        // Session change - load webhook config and selected events
        sessionSelect.addEventListener('change', async (e) => {
            const sessionId = e.target.value;
            if (!sessionId) {
                webhookUrlInput.value = '';
                // Uncheck all events
                document.querySelectorAll('input[name="webhookEvent"]').forEach(cb => cb.checked = false);
                this.updateCheckAllState();
                return;
            }

            try {
                const res = await this.apiCall(`/api/webhook/${sessionId}`);
                if (res.success && res.webhookUrl) {
                    webhookUrlInput.value = res.webhookUrl;

                    // Load selected events
                    const selectedEvents = res.events || [];
                    document.querySelectorAll('input[name="webhookEvent"]').forEach(checkbox => {
                        checkbox.checked = selectedEvents.includes(checkbox.value);
                    });
                    this.updateCheckAllState();
                } else {
                    webhookUrlInput.value = '';
                    // Uncheck all events
                    document.querySelectorAll('input[name="webhookEvent"]').forEach(cb => cb.checked = false);
                    this.updateCheckAllState();
                }
            } catch (err) {
                console.error('Failed to load webhook config:', err);
            }
        });

        // Check All Events
        document.getElementById('checkAllEvents').addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('input[name="webhookEvent"]').forEach(checkbox => {
                checkbox.checked = checked;
            });
        });

        // Individual checkboxes - update Check All state
        document.querySelectorAll('input[name="webhookEvent"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateCheckAllState();
            });
        });

        // Save webhook
        document.getElementById('btnSaveWebhook').addEventListener('click', async () => {
            const sessionId = sessionSelect.value;
            const webhookUrl = webhookUrlInput.value.trim();

            if (!sessionId) {
                this.showAlert('Please select a session', 'warning');
                return;
            }
            if (!webhookUrl) {
                this.showAlert('Please enter a webhook URL', 'warning');
                return;
            }

            // Get selected events
            const selectedEvents = Array.from(document.querySelectorAll('input[name="webhookEvent"]:checked'))
                .map(cb => cb.value);

            try {
                const res = await this.apiCall(`/api/webhook/${sessionId}`, 'POST', {
                    webhookUrl,
                    events: selectedEvents
                });
                if (res.success) {
                    this.showAlert(`Webhook saved with ${selectedEvents.length} events!`, 'success');
                    this.logEvent('info', 'Webhook', `Configured for ${sessionId} with ${selectedEvents.length} events`);
                } else {
                    this.showAlert('Failed to save webhook: ' + res.message, 'error');
                }
            } catch (err) {
                this.showAlert('Error saving webhook: ' + err.message, 'error');
            }
        });

        // Test webhook
        document.getElementById('btnTestWebhook').addEventListener('click', async () => {
            const sessionId = sessionSelect.value;
            if (!sessionId) {
                this.showAlert('Please select a session', 'warning');
                return;
            }

            try {
                const res = await this.apiCall(`/api/webhook/${sessionId}/test`, 'POST');
                if (res.success) {
                    this.showAlert('Test webhook sent! Check your webhook receiver.', 'success');
                    this.logEvent('info', 'Webhook', `Test sent for ${sessionId}`);
                } else {
                    this.showAlert('Failed to test webhook: ' + res.message, 'error');
                }
            } catch (err) {
                this.showAlert('Error testing webhook: ' + err.message, 'error');
            }
        });

        // Remove webhook
        document.getElementById('btnRemoveWebhook').addEventListener('click', async () => {
            const sessionId = sessionSelect.value;
            if (!sessionId) {
                this.showAlert('Please select a session', 'warning');
                return;
            }

            if (confirm('Remove webhook configuration for this session?')) {
                try {
                    const res = await this.apiCall(`/api/webhook/${sessionId}`, 'DELETE');
                    if (res.success) {
                        webhookUrlInput.value = '';
                        // Uncheck all events
                        document.querySelectorAll('input[name="webhookEvent"]').forEach(cb => cb.checked = false);
                        this.updateCheckAllState();
                        this.showAlert('Webhook removed successfully!', 'success');
                        this.logEvent('info', 'Webhook', `Removed for ${sessionId}`);
                    } else {
                        this.showAlert('Failed to remove webhook: ' + res.message, 'error');
                    }
                } catch (err) {
                    this.showAlert('Error removing webhook: ' + err.message, 'error');
                }
            }
        });
    },

    updateCheckAllState: function () {
        const allCheckboxes = document.querySelectorAll('input[name="webhookEvent"]');
        const checkedCheckboxes = document.querySelectorAll('input[name="webhookEvent"]:checked');
        const checkAllCheckbox = document.getElementById('checkAllEvents');

        if (!checkAllCheckbox) return;

        if (checkedCheckboxes.length === 0) {
            checkAllCheckbox.checked = false;
            checkAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            checkAllCheckbox.checked = true;
            checkAllCheckbox.indeterminate = false;
        } else {
            checkAllCheckbox.checked = false;
            checkAllCheckbox.indeterminate = true;
        }
    },

    populateWebhookSessions: function () {
        const webhookSelect = document.getElementById('webhookSession');
        const apiSessionSelect = document.getElementById('apiSession');

        if (webhookSelect && apiSessionSelect) {
            // Copy options from API session select
            webhookSelect.innerHTML = apiSessionSelect.innerHTML;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
    window.app.loadEventsFromStorage();
    window.app.loadWebhookConfig();

    // Populate webhook sessions after sessions load
    setTimeout(() => {
        window.app.populateWebhookSessions();
    }, 1000);
});
