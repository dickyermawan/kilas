const endpoints = {
    // ===== MESSAGES =====
    'POST /api/messages/send-text': {
        method: 'POST',
        body: {
            "sessionId": "",
            "chatId": "628123456789",
            "text": "Hello from Kilas Gateway!"
        }
    },
    'POST /api/messages/send-image': {
        method: 'POST',
        supportsFile: true,
        body: {
            "sessionId": "",
            "chatId": "628123456789",
            "caption": "Check out this image"
        }
    },
    'POST /api/messages/send-document': {
        method: 'POST',
        supportsFile: true,
        body: {
            "sessionId": "",
            "chatId": "628123456789",
            "caption": "Document caption (optional)"
        }
    },
    'POST /api/messages/send-location': {
        method: 'POST',
        body: {
            "sessionId": "",
            "chatId": "628123456789",
            "latitude": -6.200000,
            "longitude": 106.816666,
            "address": "Jakarta, Indonesia"
        }
    },
    'GET /api/messages/status/:messageId': {
        method: 'GET',
        urlParams: true,
        body: {
            "messageId": "3EB0XXXXX..."
        }
    },

    // ===== GROUPS =====
    'GET /api/groups/:sessionId': {
        method: 'GET',
        urlParams: true,
        body: { "sessionId": "" }
    },
    'POST /api/groups/create': {
        method: 'POST',
        body: {
            "sessionId": "",
            "subject": "My New Group",
            "participants": ["628123456789", "628987654321"]
        }
    },

    // ===== SESSIONS =====
    'GET /api/sessions': {
        method: 'GET'
    },
    'GET /api/sessions/:id': {
        method: 'GET',
        urlParams: true,
        body: { "sessionId": "" }
    },
    'POST /api/sessions/create': {
        method: 'POST',
        body: {
            "sessionId": "NewSession123"
        }
    },
    'DELETE /api/sessions/:id': {
        method: 'DELETE',
        urlParams: true,
        body: { "sessionId": "" }
    },

    // ===== CONTACTS =====
    'GET /api/contacts/:sessionId': {
        method: 'GET',
        urlParams: true,
        body: { "sessionId": "" }
    },
    'GET /api/contacts/:sessionId/:number': {
        method: 'GET',
        urlParams: true,
        body: {
            "sessionId": "",
            "number": "628123456789"
        }
    },

    // ===== STATUS =====
    'POST /api/status/post/text': {
        method: 'POST',
        body: {
            "sessionId": "",
            "text": "My Status Update 🚀",
            "backgroundColor": 0xff1a1f3a,
            "font": 1
        }
    }
};

const select = document.getElementById('apiEndpoint');
const sessionSelect = document.getElementById('apiSession');
const bodyEditor = document.getElementById('apiBody');
const responsePre = document.getElementById('apiResponse');
const responseContainer = document.getElementById('apiResponseContainer');
const uploadMethodGroup = document.getElementById('uploadMethodGroup');
const fileUploadGroup = document.getElementById('fileUploadGroup');
const base64InputGroup = document.getElementById('base64InputGroup');
const fileInput = document.getElementById('apiFile');
const base64Input = document.getElementById('apiBase64');

// Populate Endpoint Select
Object.keys(endpoints).forEach(ep => {
    const opt = document.createElement('option');
    opt.value = ep;
    opt.textContent = ep;
    select.appendChild(opt);
});

// When session is selected, update all request bodies
sessionSelect.addEventListener('change', (e) => {
    const selectedSession = e.target.value;
    const currentEndpoint = select.value;

    if (currentEndpoint && endpoints[currentEndpoint]) {
        const ep = endpoints[currentEndpoint];
        if (ep.body) {
            const updatedBody = { ...ep.body, sessionId: selectedSession };
            bodyEditor.value = JSON.stringify(updatedBody, null, 4);
        }
    }
});

// When endpoint is selected
select.addEventListener('change', (e) => {
    const ep = endpoints[e.target.value];
    const selectedSession = sessionSelect.value;

    if (ep && ep.body) {
        const updatedBody = { ...ep.body };
        if (selectedSession) {
            updatedBody.sessionId = selectedSession;
        }
        bodyEditor.value = JSON.stringify(updatedBody, null, 4);
    } else {
        bodyEditor.value = '{}';
    }

    // Show/hide upload method selector and inputs based on endpoint
    if (ep && ep.supportsFile) {
        uploadMethodGroup.style.display = 'block';

        // Check which method is selected
        const selectedMethod = document.querySelector('input[name="uploadMethod"]:checked').value;

        // Update request body based on method
        updateRequestBodyForMethod(e.target.value, selectedMethod, selectedSession);

        if (selectedMethod === 'file') {
            fileUploadGroup.style.display = 'block';
            base64InputGroup.style.display = 'none';
        } else {
            fileUploadGroup.style.display = 'none';
            base64InputGroup.style.display = 'block';
        }
    } else {
        uploadMethodGroup.style.display = 'none';
        fileUploadGroup.style.display = 'none';
        base64InputGroup.style.display = 'none';
        fileInput.value = '';
        base64Input.value = '';
    }

    responseContainer.classList.add('hidden');
    responsePre.textContent = '';
});

// Helper function to update request body based on upload method
function updateRequestBodyForMethod(endpoint, method, sessionId) {
    const ep = endpoints[endpoint];
    if (!ep || !ep.supportsFile) return;

    let bodyObj = { ...ep.body };
    if (sessionId) bodyObj.sessionId = sessionId;

    if (method === 'file') {
        // For file upload, show note about multipart/form-data
        bodyObj._note = "File upload uses multipart/form-data. Fields: sessionId, chatId, caption (optional), and file (image or document)";
    } else {
        // For base64, add the base64 field to body
        if (endpoint.includes('image')) {
            bodyObj.image = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
        } else if (endpoint.includes('document')) {
            bodyObj.document = "data:application/pdf;base64,JVBERi0xLjQK...";
            bodyObj.filename = "document.pdf";
            bodyObj.mimetype = "application/pdf";
        }
    }

    bodyEditor.value = JSON.stringify(bodyObj, null, 4);
}

// Handle upload method toggle
document.querySelectorAll('input[name="uploadMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const currentEndpoint = select.value;
        const selectedSession = sessionSelect.value;

        // Update request body based on method
        updateRequestBodyForMethod(currentEndpoint, e.target.value, selectedSession);

        if (e.target.value === 'file') {
            fileUploadGroup.style.display = 'block';
            base64InputGroup.style.display = 'none';
            base64Input.value = '';
        } else {
            fileUploadGroup.style.display = 'none';
            base64InputGroup.style.display = 'block';
            fileInput.value = '';
        }
    });
});

// Send Request Button
document.getElementById('btnSendRequest').addEventListener('click', async () => {
    const selected = select.value;
    if (!selected) return Toast.warning('Please select an endpoint');

    // Parse URL and Method
    const [method, urlTemplate] = selected.split(' ');
    let url = urlTemplate;

    // Parse Body
    let body = null;
    try {
        body = JSON.parse(bodyEditor.value);
    } catch (e) {
        Toast.error('Invalid JSON in request body');
        return;
    }

    // Handle URL Params
    if (url.includes(':sessionId')) {
        const sid = body.sessionId || sessionSelect.value || prompt('Enter Session ID for URL:');
        if (!sid) return;
        url = url.replace(':sessionId', sid);
    }

    if (url.includes(':id')) {
        const id = body.sessionId || prompt('Enter ID for URL:');
        if (!id) return;
        url = url.replace(':id', id);
    }

    if (url.includes(':number')) {
        const num = body.number || prompt('Enter Phone Number:');
        if (!num) return;
        url = url.replace(':number', num);
    }

    if (url.includes(':messageId')) {
        const msgId = body.messageId || prompt('Enter Message ID:');
        if (!msgId) return;
        url = url.replace(':messageId', msgId);
    }

    try {
        const btn = document.getElementById('btnSendRequest');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        let res;
        const ep = endpoints[selected];

        // Check if file upload or base64 is needed
        if (ep && ep.supportsFile) {
            const selectedMethod = document.querySelector('input[name="uploadMethod"]:checked').value;

            if (selectedMethod === 'file' && fileInput.files.length > 0) {
                // Send as multipart/form-data
                const formData = new FormData();

                // Add file
                if (selected.includes('image')) {
                    formData.append('image', fileInput.files[0]);
                } else if (selected.includes('document')) {
                    formData.append('document', fileInput.files[0]);
                }

                // Add other fields from body
                Object.keys(body).forEach(key => {
                    if (key !== 'sessionId' && key !== 'chatId' && key !== 'caption') {
                        formData.append(key, body[key]);
                    }
                });
                formData.append('sessionId', body.sessionId);
                formData.append('chatId', body.chatId);
                if (body.caption) formData.append('caption', body.caption);

                // Send multipart request
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'x-api-key': window.app.apiKey
                    },
                    body: formData
                });
                res = await response.json();
            } else if (selectedMethod === 'base64' && base64Input.value.trim()) {
                // Send as JSON with base64
                const base64Data = base64Input.value.trim();

                // Add base64 to body
                if (selected.includes('image')) {
                    body.image = base64Data;
                } else if (selected.includes('document')) {
                    body.document = base64Data;
                    // For documents, ensure filename and mimetype are in body
                    if (!body.filename) body.filename = 'document.pdf';
                    if (!body.mimetype) body.mimetype = 'application/pdf';
                }

                // Send as JSON
                res = await window.app.apiCall(url, method, body);
            } else {
                // No file or base64 provided
                Toast.warning('Please provide a file or base64 string');
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                return;
            }
        } else {
            // Send as JSON (non-file endpoints)
            res = await window.app.apiCall(url, method, method === 'GET' ? null : body);
        }

        responsePre.textContent = JSON.stringify(res, null, 4);
        responseContainer.classList.remove('hidden');

        // Show toast notification
        if (res && res.success) {
            Toast.success('Request completed successfully!');

            // Increment Messages Today counter if this was a send message request
            if (selected.includes('/api/messages/send')) {
                if (window.app && window.app.statsManager) {
                    window.app.statsManager.incrementMessages();
                }
            }
        } else if (res && res.success === false) {
            Toast.error(res.message || 'Request failed');
        }

        // Auto-scroll to response for better UX
        responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        btn.innerHTML = originalHTML;
        btn.disabled = false;
    } catch (err) {
        responsePre.textContent = 'Error: ' + err.message;
        responseContainer.classList.remove('hidden');

        // Show error toast
        Toast.error('Request failed: ' + err.message);

        // Auto-scroll to response for better UX
        responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const btn = document.getElementById('btnSendRequest');
        btn.innerHTML = '<i class="fas fa-play"></i> Send Request';
        btn.disabled = false;
    }
});

// Initialize: Select first endpoint on page load
if (select.options.length > 1) {
    select.selectedIndex = 1; // Select first real endpoint (skip "Select endpoint...")
    select.dispatchEvent(new Event('change')); // Trigger change event to update UI
}
