const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './media/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper to get session socket
const getSocket = async (req, sessionId) => {
    const session = await req.sessionManager.getSession(sessionId);
    if (!session || !session.socket) {
        throw new Error('Session not found or not connected');
    }
    return session.socket;
};

// Send Text Message
router.post('/send-text', async (req, res) => {
    const { sessionId, chatId, text, quotedMessageId } = req.body;

    try {
        const socket = await getSocket(req, sessionId);
        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        const messageOptions = {};

        // Add quoted message if provided
        if (quotedMessageId) {
            messageOptions.quoted = {
                key: {
                    remoteJid: jid,
                    id: quotedMessageId,
                    fromMe: false
                }
            };
        }

        await socket.sendMessage(jid, { text }, messageOptions);
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send Image
router.post('/send-image', upload.single('image'), async (req, res) => {
    try {
        const { sessionId, chatId, caption } = req.body;

        if (!sessionId || !chatId) {
            return res.status(400).json({ success: false, message: 'sessionId and chatId required' });
        }

        const session = await req.sessionManager.getSession(sessionId);
        if (!session || !session.socket) {
            return res.status(404).json({ success: false, message: 'Session not found or not connected' });
        }

        let imageSource;

        // Check if file was uploaded
        if (req.file) {
            imageSource = { url: req.file.path };
        }
        // Check if base64 image provided
        else if (req.body.image) {
            // Support both data URL and raw base64
            const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
            imageSource = Buffer.from(base64Data, 'base64');
        } else {
            return res.status(400).json({ success: false, message: 'No image provided (file or base64)' });
        }

        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        await session.socket.sendMessage(jid, {
            image: imageSource,
            caption: caption || ''
        });

        // Cleanup file after sending if it was an uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ success: true, message: 'Image sent' });
    } catch (err) {
        // Ensure uploaded file is cleaned up even on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        req.logger.error('Error sending image:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Send Document
router.post('/send-document', upload.single('document'), async (req, res) => {
    try {
        const { sessionId, chatId, filename, mimetype, caption } = req.body;

        if (!sessionId || !chatId) {
            return res.status(400).json({ success: false, message: 'sessionId and chatId required' });
        }

        const session = await req.sessionManager.getSession(sessionId);
        if (!session || !session.socket) {
            return res.status(404).json({ success: false, message: 'Session not found or not connected' });
        }

        let documentBuffer;
        let docFilename;
        let docMimetype;

        // Check if file was uploaded
        if (req.file) {
            documentBuffer = fs.readFileSync(req.file.path); // Read file from disk into buffer
            docFilename = req.file.originalname;
            docMimetype = req.file.mimetype;
        }
        // Check if base64 document provided
        else if (req.body.document) {
            // Support data URL or raw base64
            const base64Data = req.body.document.replace(/^data:.+;base64,/, '');
            documentBuffer = Buffer.from(base64Data, 'base64');
            docFilename = filename || 'document.pdf'; // Use provided filename or default
            docMimetype = mimetype || 'application/pdf'; // Use provided mimetype or default
        } else {
            return res.status(400).json({ success: false, message: 'No document provided (file or base64)' });
        }

        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        const messageContent = {
            document: documentBuffer,
            mimetype: docMimetype,
            fileName: docFilename
        };

        // Add caption if provided
        if (caption) {
            messageContent.caption = caption;
        }

        await session.socket.sendMessage(jid, messageContent);

        // Cleanup uploaded file from disk if it was a file upload
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ success: true, message: 'Document sent' });
    } catch (err) {
        // Ensure uploaded file is cleaned up even on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        req.logger.error('Error sending document:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Send Location
router.post('/send-location', async (req, res) => {
    const { sessionId, chatId, latitude, longitude, address } = req.body;

    try {
        const socket = await getSocket(req, sessionId);
        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        await socket.sendMessage(jid, {
            location: { degreesLatitude: latitude, degreesLongitude: longitude, address: address }
        });
        res.json({ success: true, message: 'Location sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start Typing Indicator
router.post('/typing/start', async (req, res) => {
    const { sessionId, chatId } = req.body;

    try {
        const socket = await getSocket(req, sessionId);
        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        await socket.sendPresenceUpdate('composing', jid);
        res.json({ success: true, message: 'Typing indicator started' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Stop Typing Indicator
router.post('/typing/stop', async (req, res) => {
    const { sessionId, chatId } = req.body;

    try {
        const socket = await getSocket(req, sessionId);
        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;

        await socket.sendPresenceUpdate('paused', jid);
        res.json({ success: true, message: 'Typing indicator stopped' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
