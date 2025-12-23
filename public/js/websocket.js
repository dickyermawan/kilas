// WebSocket Handling
const socket = io();
window.socket = socket; // Make socket globally accessible

const updateStatus = (connected) => {
    const el = document.getElementById('wsStatus');
    const dot = el.querySelector('.dot');
    if (connected) {
        dot.style.backgroundColor = '#4ade80';
        dot.style.boxShadow = '0 0 10px #4ade80';
        el.innerHTML = '<span class="dot" style="background-color: #4ade80; box-shadow: 0 0 10px #4ade80;"></span> WebSocket Connected';
    } else {
        dot.style.backgroundColor = '#ef4444';
        dot.style.boxShadow = 'none';
        el.innerHTML = '<span class="dot" style="background-color: #ef4444;"></span> WebSocket Disconnected';
    }
};

socket.on('connect', () => {
    console.log('Connected to WebSocket');
    updateStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
    updateStatus(false);
});

// Session Updates
socket.on('session:created', (data) => {
    if (window.app && window.app.loadSessions) {
        window.app.loadSessions();
    }
    window.app.logEvent('info', 'System', `New session created: ${data.sessionId}`);
});

socket.on('session:deleted', (data) => {
    if (window.app && window.app.loadSessions) {
        window.app.loadSessions();
    }
    window.app.logEvent('warning', 'System', `Session deleted: ${data.sessionId}`);
});

// Session Status Updates (Real-time)
socket.on('session:status', (data) => {
    if (window.app) {
        // Update session status in real-time
        const sessionRow = document.querySelector(`.session-row[data-id="${data.sessionId}"]`);
        if (sessionRow) {
            const statusBadge = sessionRow.querySelector('.session-status');
            if (statusBadge) {
                // Remove all status classes
                statusBadge.className = 'session-status';
                // Add new status class
                statusBadge.classList.add(`status-${data.status}`);
                statusBadge.textContent = data.status;
            }
        }

        // Reload sessions to update stats and selects
        window.app.loadSessions();
    }
});

// QR Code
socket.on('session:qr', (data) => {
    const modal = document.getElementById('qrModal');
    if (modal && modal.classList.contains('visible') && modal.dataset.session === data.sessionId) {
        const qrImg = document.getElementById('qrImage');
        const spinner = document.getElementById('qrSpinner');

        qrImg.src = data.qr;
        qrImg.style.display = 'block';
        spinner.style.display = 'none';
    }
    window.app.logEvent('info', data.sessionId, 'QR Code received');
});

socket.on('session:ready', (data) => {
    // Close modal if open
    const modal = document.getElementById('qrModal');
    if (modal.classList.contains('visible') && modal.dataset.session === data.sessionId) {
        modal.classList.remove('visible');
        alert(`${data.sessionId} Connected!`);
    }
    window.app.loadSessions();
});

// Webhook events
socket.on('webhook:sent', (data) => {
    if (window.webhookLogger) {
        window.webhookLogger.addLog(data);
    }
    // Update statistics
    if (window.app && window.app.statsManager) {
        window.app.statsManager.updateWebhook(data.success);
    }
});

// Event Logging
socket.on('event:log', (data) => {
    if (window.app) {
        window.app.logEvent(data.type || 'info', data.sessionId, data.text);
    }
});

