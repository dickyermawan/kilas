/**
 * Database.js - Zero-Config SQLite Database Layer
 * Auto-initializes database and tables on startup
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(logger) {
        this.logger = logger || console;
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialize database (call this on server startup)
     */
    async init() {
        if (this.initialized) return;

        // Auto-create data directory
        const dataDir = process.env.DATA_DIR || './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            this.logger.info(`Created data directory: ${dataDir}`);
        }

        // Create database file
        const dbPath = path.join(dataDir, 'kilas.db');

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    this.logger.error('Failed to open database:', err);
                    reject(err);
                    return;
                }

                this.logger.info(`Database opened: ${dbPath}`);
                this.initSchema()
                    .then(() => {
                        this.initialized = true;
                        resolve();
                    })
                    .catch(reject);
            });
        });
    }

    /**
     * Initialize database schema (tables, indexes)
     */
    async initSchema() {
        const queries = [
            // Outgoing Messages Table
            `CREATE TABLE IF NOT EXISTS outgoing_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                recipient TEXT NOT NULL,
                message_type TEXT NOT NULL DEFAULT 'text',
                content TEXT,
                message_id TEXT,
                status TEXT DEFAULT 'pending',
                api_endpoint TEXT,
                api_status INTEGER,
                api_response TEXT,
                error TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Indexes for outgoing_messages
            `CREATE INDEX IF NOT EXISTS idx_outgoing_session ON outgoing_messages(session_id)`,
            `CREATE INDEX IF NOT EXISTS idx_outgoing_created ON outgoing_messages(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_outgoing_status ON outgoing_messages(status)`,
            `CREATE INDEX IF NOT EXISTS idx_outgoing_message_id ON outgoing_messages(message_id)`,

            // Live Events Table
            `CREATE TABLE IF NOT EXISTS live_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Indexes for live_events
            `CREATE INDEX IF NOT EXISTS idx_events_session ON live_events(session_id)`,
            `CREATE INDEX IF NOT EXISTS idx_events_created ON live_events(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_events_type ON live_events(event_type)`,

            // Settings Table
            `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Default settings
            `INSERT OR IGNORE INTO settings (key, value) VALUES ('logging_enabled', 'true')`,
            `INSERT OR IGNORE INTO settings (key, value) VALUES ('retention_days', '30')`,
            `INSERT OR IGNORE INTO settings (key, value) VALUES ('max_records', '10000')`
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                queries.forEach((query) => {
                    this.db.run(query, (err) => {
                        if (err) {
                            this.logger.error('Schema error:', err.message, query);
                        }
                    });
                });

                this.logger.info('✅ Database schema initialized');
                resolve();
            });
        });
    }

    // ==================== OUTGOING MESSAGES ====================

    /**
     * Log outgoing message
     */
    logOutgoingMessage(data) {
        const {
            sessionId,
            recipient,
            messageType = 'text',
            content,
            messageId,
            apiEndpoint,
            apiStatus,
            apiResponse,
            error
        } = data;

        const sql = `INSERT INTO outgoing_messages 
            (session_id, recipient, message_type, content, message_id, api_endpoint, api_status, api_response, error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [
                sessionId,
                recipient,
                messageType,
                content,
                messageId,
                apiEndpoint,
                apiStatus,
                apiResponse ? JSON.stringify(apiResponse) : null,
                error
            ], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    /**
     * Update message status (sent, delivered, read)
     */
    updateMessageStatus(messageId, status) {
        const sql = `UPDATE outgoing_messages 
                     SET status = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE message_id = ?`;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [status, messageId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    /**
     * Get outgoing messages with pagination
     */
    getOutgoingMessages(options = {}) {
        const {
            sessionId,
            limit = 100,
            offset = 0,
            orderBy = 'created_at',
            order = 'DESC'
        } = options;

        let sql = `SELECT * FROM outgoing_messages`;
        const params = [];

        if (sessionId) {
            sql += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get outgoing messages count
     */
    getOutgoingMessagesCount(sessionId = null) {
        let sql = `SELECT COUNT(*) as count FROM outgoing_messages`;
        const params = [];

        if (sessionId) {
            sql += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    /**
     * Clear outgoing messages
     */
    clearOutgoingMessages(sessionId = null) {
        let sql = `DELETE FROM outgoing_messages`;
        const params = [];

        if (sessionId) {
            sql += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deleted: this.changes });
                }
            });
        });
    }

    /**
     * Get message by message_id
     */
    getMessageByMessageId(messageId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM outgoing_messages WHERE message_id = ?`,
                [messageId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    // ==================== LIVE EVENTS ====================

    /**
     * Log live event
     */
    logEvent(data) {
        const { sessionId, eventType, message, eventData } = data;

        const sql = `INSERT INTO live_events (session_id, event_type, message, data)
                     VALUES (?, ?, ?, ?)`;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [
                sessionId,
                eventType,
                message,
                eventData ? JSON.stringify(eventData) : null
            ], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    /**
     * Get live events with pagination
     */
    getLiveEvents(options = {}) {
        const {
            sessionId,
            eventType,
            limit = 100,
            offset = 0,
            orderBy = 'created_at',
            order = 'DESC'
        } = options;

        let sql = `SELECT * FROM live_events`;
        const params = [];
        const conditions = [];

        if (sessionId) {
            conditions.push(`session_id = ?`);
            params.push(sessionId);
        }

        if (eventType) {
            conditions.push(`event_type = ?`);
            params.push(eventType);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get live events count
     */
    getLiveEventsCount(sessionId = null) {
        let sql = `SELECT COUNT(*) as count FROM live_events`;
        const params = [];

        if (sessionId) {
            sql += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    /**
     * Clear live events
     */
    clearLiveEvents(sessionId = null) {
        let sql = `DELETE FROM live_events`;
        const params = [];

        if (sessionId) {
            sql += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deleted: this.changes });
                }
            });
        });
    }

    // ==================== SETTINGS ====================

    /**
     * Get setting value
     */
    getSetting(key) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.value : null);
                }
            });
        });
    }

    /**
     * Set setting value
     */
    setSetting(key, value) {
        const sql = `INSERT OR REPLACE INTO settings (key, value, updated_at) 
                     VALUES (?, ?, CURRENT_TIMESTAMP)`;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [key, value], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    /**
     * Get all settings
     */
    getAllSettings() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM settings`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const settings = {};
                    rows.forEach(row => {
                        settings[row.key] = row.value;
                    });
                    resolve(settings);
                }
            });
        });
    }

    // ==================== CLEANUP ====================

    /**
     * Auto-cleanup old records based on retention policy
     */
    async cleanup() {
        const retentionDays = await this.getSetting('retention_days') || 30;
        const maxRecords = parseInt(await this.getSetting('max_records') || 10000);

        // Delete old records
        const deleteOldSql = `DELETE FROM %TABLE% WHERE created_at < datetime('now', '-${retentionDays} days')`;

        await this.runQuery(deleteOldSql.replace('%TABLE%', 'outgoing_messages'));
        await this.runQuery(deleteOldSql.replace('%TABLE%', 'live_events'));

        // Keep only max records (delete oldest)
        const deleteExcessSql = `DELETE FROM %TABLE% WHERE id NOT IN (
            SELECT id FROM %TABLE% ORDER BY created_at DESC LIMIT ${maxRecords}
        )`;

        await this.runQuery(deleteExcessSql.replace(/%TABLE%/g, 'outgoing_messages'));
        await this.runQuery(deleteExcessSql.replace(/%TABLE%/g, 'live_events'));

        this.logger.info('✅ Database cleanup completed');
    }

    /**
     * Run raw query
     */
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.logger.info('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;
