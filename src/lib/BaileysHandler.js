const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const MediaHandler = require('./MediaHandler');

class BaileysHandler {
    constructor(sessionId, io, logger, webhookSender = null) {
        this.sessionId = sessionId;
        this.io = io;
        this.globalLogger = logger;
        this.webhookSender = webhookSender;
        this.status = 'disconnected';
        this.socket = null;
        this.user = null;
        this.qr = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.isReconnecting = false;

        // Setup session directory
        this.sessionDir = path.join(process.env.SESSION_DIR || './sessions', sessionId);
        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir, { recursive: true });
        }

        // Initialize Media Handler
        this.mediaHandler = new MediaHandler(this.globalLogger);
    }

    async start() {
        // Prevent multiple simultaneous start attempts
        if (this.isReconnecting) {
            this.globalLogger.info(`Session ${this.sessionId} is already reconnecting, skipping...`);
            return;
        }

        this.isReconnecting = true;
        this.updateStatus('connecting');

        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
            const { version } = await fetchLatestBaileysVersion();

            this.socket = makeWASocket({
                version,
                logger: pino({ level: 'silent' }), // Suppress internal logs, use our own
                printQRInTerminal: false,
                auth: state,
                browser: ['KirimKan Gateway', 'Chrome', '1.0.0'],
                defaultQueryTimeoutMs: undefined // Keep connection alive
            });

            // Handle Connection Update
            this.socket.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Send webhook for connection update
                if (this.webhookSender) {
                    this.globalLogger.info(`[Webhook] Attempting to send connection.update for ${this.sessionId}`);
                    const result = await this.webhookSender.send(this.sessionId, 'connection.update', update);
                    if (result) {
                        this.globalLogger.info(`[Webhook] Sent connection.update: ${result.success ? 'SUCCESS' : 'FAILED'}`);
                        this.io.emit('webhook:sent', result);
                    } else {
                        this.globalLogger.info(`[Webhook] No result from send (likely no config or event filtered)`);
                    }
                } else {
                    this.globalLogger.warn(`[Webhook] webhookSender is NULL for ${this.sessionId}`);
                }

                if (qr) {
                    this.qr = qr;
                    // Generate QR image
                    try {
                        const qrImage = await QRCode.toDataURL(qr);
                        this.io.to(`session:${this.sessionId}`).emit('session:qr', { sessionId: this.sessionId, qr: qrImage });
                        // Also broadcast generally for dashboard
                        this.io.emit('session:update', { id: this.sessionId, status: 'scan_qr' });
                    } catch (err) {
                        this.globalLogger.error(`Error generating QR: ${err}`);
                    }
                }

                if (connection === 'close') {
                    this.isReconnecting = false;
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    this.globalLogger.info(`Connection closed for ${this.sessionId}. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
                    this.updateStatus('disconnected');

                    if (shouldReconnect && this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000); // Exponential backoff, max 10s
                        this.globalLogger.info(`Reconnecting ${this.sessionId} in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

                        setTimeout(() => {
                            this.start();
                        }, delay);
                    } else if (this.retryCount >= this.maxRetries) {
                        this.globalLogger.error(`Max retries reached for ${this.sessionId}`);
                        this.updateStatus('failed');
                        this.retryCount = 0; // Reset for manual retry
                    } else {
                        this.updateStatus('logged_out');
                        this.retryCount = 0;
                    }
                } else if (connection === 'open') {
                    this.isReconnecting = false;
                    this.retryCount = 0; // Reset retry counter on successful connection
                    this.globalLogger.info(`Session ${this.sessionId} connected`);
                    this.updateStatus('connected');
                    this.user = this.socket.user;
                    this.qr = null; // Clear QR

                    this.io.to(`session:${this.sessionId}`).emit('session:ready', { sessionId: this.sessionId, user: this.socket.user });
                }
            });

            // Handle Creds Update
            this.socket.ev.on('creds.update', saveCreds);

            // Handle Messages Upsert
            this.socket.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        // Determine if message is from group or private chat
                        const isGroup = msg.key.remoteJid.endsWith('@g.us');
                        const chatType = isGroup ? 'group' : 'private';

                        // Send webhook for EACH individual message
                        if (this.webhookSender) {
                            this.globalLogger.info(`[Webhook] Attempting to send messages.upsert for ${this.sessionId}`);
                            const result = await this.webhookSender.send(this.sessionId, 'messages.upsert', {
                                type: m.type,
                                messages: [msg], // Send only this single message
                                isGroup: isGroup,
                                chatType: chatType
                            });
                            if (result) {
                                this.globalLogger.info(`[Webhook] Sent messages.upsert: ${result.success ? 'SUCCESS' : 'FAILED'}`);
                                this.io.emit('webhook:sent', result);
                            } else {
                                this.globalLogger.info(`[Webhook] No result from send (likely no config or event filtered)`);
                            }
                        } else {
                            this.globalLogger.warn(`[Webhook] webhookSender is NULL for ${this.sessionId}`);
                        }

                        if (!msg.key.fromMe) {
                            // Try to save media
                            const mediaPath = await this.mediaHandler.saveMedia(msg);

                            // Emit new message event
                            this.io.to(`session:${this.sessionId}`).emit('message:received', {
                                sessionId: this.sessionId,
                                message: msg,
                                media: mediaPath
                            });

                            // Global event for dashboard log
                            const from = msg.key.remoteJid.split('@')[0];
                            const type = msg.message ? Object.keys(msg.message)[0] : 'unknown';

                            this.io.emit('event:log', {
                                type: 'message',
                                sessionId: this.sessionId,
                                text: `Msg from ${from} (${type}) ${mediaPath ? '[MEDIA SAVED]' : ''}`,
                                timestamp: new Date()
                            });
                        }
                    }
                }
            });

            // Handle Messages Update (read receipts, edits)
            this.socket.ev.on('messages.update', async (updates) => {
                // Emit real-time status updates for UI
                for (const update of updates) {
                    if (update.update?.status) {
                        const statusMap = {
                            1: 'pending',
                            2: 'sent',
                            3: 'delivered',
                            4: 'read'
                        };
                        const status = statusMap[update.update.status] || 'pending';

                        // Emit to frontend for real-time UI update
                        this.io.emit('message:status', {
                            sessionId: this.sessionId,
                            messageId: update.key?.id,
                            status: status,
                            timestamp: Date.now()
                        });
                    }
                }

                // Send webhook as usual
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'messages.update', updates);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Messages Delete
            this.socket.ev.on('messages.delete', async (deletion) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'messages.delete', deletion);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Message Receipt Update (read receipts when recipient has chat open)
            this.socket.ev.on('message-receipt.update', async (receipts) => {
                for (const receipt of receipts) {
                    // Check for read receipt
                    if (receipt.receipt?.readTimestamp || receipt.receipt?.receiptTimestamp) {
                        const messageId = receipt.key?.id;
                        if (messageId) {
                            // Emit read status to frontend
                            this.io.emit('message:status', {
                                sessionId: this.sessionId,
                                messageId: messageId,
                                status: 'read',
                                timestamp: Date.now()
                            });
                        }
                    }
                }

                // Send webhook
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'message-receipt.update', receipts);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Presence Update
            this.socket.ev.on('presence.update', async (presence) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'presence.update', presence);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Chats Upsert
            this.socket.ev.on('chats.upsert', async (chats) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'chats.upsert', chats);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Chats Update
            this.socket.ev.on('chats.update', async (updates) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'chats.update', updates);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Contacts Upsert
            this.socket.ev.on('contacts.upsert', async (contacts) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'contacts.upsert', contacts);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Groups Upsert
            this.socket.ev.on('groups.upsert', async (groups) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'groups.upsert', groups);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Group Participants Update
            this.socket.ev.on('group-participants.update', async (update) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'group-participants.update', update);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });

            // Handle Calls
            this.socket.ev.on('call', async (calls) => {
                if (this.webhookSender) {
                    const result = await this.webhookSender.send(this.sessionId, 'call', calls);
                    if (result) {
                        this.io.emit('webhook:sent', result);
                    }
                }
            });
        } catch (err) {
            this.isReconnecting = false;
            this.globalLogger.error(`Error starting session ${this.sessionId}:`, err);
            this.updateStatus('error');
        }
    }

    updateStatus(status) {
        this.status = status;
        this.io.emit('session:status', { sessionId: this.sessionId, status });
        // Also add to event log
        this.io.emit('event:log', {
            type: 'connection',
            sessionId: this.sessionId,
            text: `Status changed to ${status}`,
            timestamp: new Date()
        });
    }

    async logout() {
        this.isReconnecting = false;
        this.retryCount = 0;

        if (this.socket) {
            try {
                await this.socket.logout();
            } catch (err) {
                // Ignore logout errors
            }
            this.socket.end(undefined);
            this.socket = null;
        }
        this.updateStatus('disconnected');
    }
}

module.exports = BaileysHandler;
