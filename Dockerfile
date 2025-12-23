# Tahap 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependensi build untuk modul native (seperti sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    sqlite-dev

COPY package*.json ./

# Seringkali sqlite3 butuh build dari source, jangan pakai --production di tahap ini
# agar library pendukung kompilasi tetap ada.
RUN npm install --network-timeout=100000

# Copy seluruh kode untuk build jika diperlukan (misal ada proses transpile)
COPY . .

# Tahap 2: Production
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies yang diperlukan oleh sqlite
RUN apk add --no-cache dumb-init sqlite-libs

# Salin hanya node_modules dan file aplikasi dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./ 

# Pengaturan User dan Folder
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p sessions media media/uploads public/images && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check (disesuaikan agar lebih ringan)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/sessions', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]