<div align="center">

<img src="public/images/logo.png" alt="Kilas Logo" width="120" height="120">

# Kilas - WhatsApp Gateway API

### 🚀 Modern, Fast & Reliable WhatsApp Gateway Built with Baileys

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity-blueviolet)](https://github.com/google-deepmind)

**Powerful WhatsApp Gateway with beautiful dashboard, multi-session support, and comprehensive REST API**

[Features](#-features) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Docker](#-docker-deployment) • [Contributing](#-contributing)

</div>

---

## ⚠️ Disclaimer

**This is an unofficial WhatsApp API implementation.** This project is not affiliated with, authorized, maintained, sponsored or endorsed by WhatsApp or any of its affiliates or subsidiaries. This is an independent and unofficial software. Use at your own risk.

**Important Notes:**
- Using this software may violate WhatsApp's Terms of Service
- Your WhatsApp account could be banned for using unofficial clients
- This project is for educational and development purposes only
- The developers are not responsible for any misuse or damage caused by this software

---

## ✨ Features

### 🎨 Beautiful Dashboard
- **Modern UI/UX** with vibrant gradients and glassmorphism effects
- **Real-time monitoring** via WebSocket connections
- **Multi-session management** - Handle multiple WhatsApp accounts
- **Live event logging** - See all activities in real-time
- **Built-in API Tester** - Test all endpoints directly from dashboard
- **QR Code Scanner** - Easy WhatsApp authentication

### 🔌 Comprehensive API
- ✅ **17+ REST API Endpoints** for complete WhatsApp automation
- ✅ **Send Messages** - Text, images, documents, locations, and more
- ✅ **Quote/Reply Messages** - Reply to specific messages in groups or private chats
- ✅ **Typing Indicator** - Show/hide typing status programmatically
- ✅ **Group Management** - Create groups, manage participants
- ✅ **Contact Management** - Fetch and manage contacts
- ✅ **Status Updates** - Post WhatsApp status programmatically
- ✅ **Webhook Support** - Receive real-time events with selective filtering
- ✅ **File Upload & Base64** - Flexible media handling

### 🛡️ Enterprise Ready
- 🔒 **Optional API Key Authentication** - Secure your endpoints
- 🌐 **CORS Configuration** - Flexible cross-origin settings
- 💾 **Auto-Save Media** - Automatically save incoming media files
- 📊 **Session Persistence** - Sessions survive server restarts
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 📝 **Comprehensive Logging** - Track all activities with Pino logger

---

## 📸 Screenshots

### Login Page
<div align="center">
  <img src="ss/login.png" alt="Kilas Login Page" width="800">
  <p><em>Modern login interface with gradient design</em></p>
</div>

### Live Events & Logs
<div align="center">
  <img src="ss/logs.png" alt="Live Events & Logs" width="800">
  <p><em>Real-time event logging with WebSocket connection</em></p>
</div>

### Device Management
<div align="center">
  <img src="ss/devices.png" alt="Device Management" width="800">
  <p><em>Multi-session WhatsApp device management with QR code scanner</em></p>
</div>

### API Playground
<div align="center">
  <img src="ss/api_playground.png" alt="API Playground" width="800">
  <p><em>Built-in API tester to test all endpoints directly from dashboard</em></p>
</div>

### Webhook Configuration
<div align="center">
  <img src="ss/webhook.png" alt="Webhook Configuration" width="800">
  <p><em>Configure webhooks with selective event filtering</em></p>
</div>

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

#### Option 1: Manual Installation

```bash
# Clone the repository
git clone https://github.com/dickyermawan/kilas.git
cd kilas

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your preferred settings

# Start the server
npm start
```

#### Option 2: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/dickyermawan/kilas.git
cd kilas

# Create .env file
cp .env.example .env
# Edit .env with your preferred settings

# Start with Docker Compose
docker compose up -d

# View logs
docker compose logs -f
```

### First Steps

1. **Access Dashboard**: Open http://localhost:3000/dashboard
2. **Login**: Use credentials from `.env` (default: admin/admin123)
3. **Create Session**: Click "New Session" and scan QR code with WhatsApp
4. **Start Using**: Your WhatsApp is now connected! 🎉

---

## 🐳 Docker Deployment

### Option 1: Using Pre-built Image from Docker Hub (Recommended)

The fastest way to deploy Kilas is using the pre-built image from Docker Hub:

**1. Create `docker-compose.yml`:**

```yaml
services:
  kilas:
    image: dickyermawan/kilas:latest
    container_name: kilas-gateway
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin123
      - API_KEY=admin123
      - CORS_ORIGIN=*
    volumes:
      # Named volumes for automatic permission handling
      - sessions_data:/app/sessions
      - media_data:/app/media

volumes:
  sessions_data:
    driver: local
  media_data:
    driver: local
```

**2. Start the container:**

```bash
# Pull and start
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

**3. Access the dashboard:**

Open http://localhost:3001/dashboard in your browser.

**Default credentials:**
- Username: `admin`
- Password: `admin123`

> **⚠️ IMPORTANT**: Change `ADMIN_PASSWORD` and `API_KEY` in docker-compose.yml for production!

---

### Option 2: Build from Source

If you want to build the image yourself:

```bash
# Clone the repository
git clone https://github.com/dickyermawan/kilas.git
cd kilas

# Create .env file
cp .env.example .env
# Edit .env with your settings (PORT=3001 by default)

# Build and start
docker compose up -d --build

# View logs
docker compose logs -f
```

---

### Configuration

All settings are configured via `.env` file:

```bash
# Server Configuration
PORT=3001  # Default port for both host and container

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# API Authentication
API_KEY=admin123

# CORS Configuration
CORS_ORIGIN=*
```

**To change port**: Edit `PORT` in `.env` and restart:
```bash
docker compose down
docker compose up -d
```

---

### Data Persistence

Session and media data are stored in **named volumes**:
- `sessions_data`: WhatsApp session files
- `media_data`: Uploaded media files

**Benefits**:
- ✅ Automatic permission handling (no manual `chown` needed)
- ✅ Data persists across container restarts
- ✅ Data persists even if container is removed
- ✅ Works on all platforms (Windows, Linux, Mac)

**Data is safe during**:
```bash
docker compose restart  # ✅ Data preserved
docker compose down && docker compose up -d  # ✅ Data preserved
docker compose pull && docker compose up -d  # ✅ Data preserved
```

**Data will be lost if**:
```bash
docker compose down -v  # ❌ Removes volumes (don't use -v flag!)
docker volume rm kilas_sessions_data  # ❌ Manually deletes volume
```

---

### Backup & Restore

**Backup sessions:**
```bash
docker run --rm -v kilas_sessions_data:/data -v $(pwd):/backup alpine tar czf /backup/sessions-backup.tar.gz -C /data .
```

**Restore sessions:**
```bash
docker run --rm -v kilas_sessions_data:/data -v $(pwd):/backup alpine tar xzf /backup/sessions-backup.tar.gz -C /data
```

---

### Docker Commands

```bash
# Start containers
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down

# Restart containers
docker compose restart

# Update to latest image
docker compose pull
docker compose up -d

# Access container shell
docker exec -it kilas-gateway sh

# Remove all data (CAUTION: deletes sessions!)
docker compose down -v
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ADMIN_USERNAME` | Dashboard login username | `admin` |
| `ADMIN_PASSWORD` | Dashboard login password | `admin123` |
| `API_KEY` | API authentication key (leave empty to disable) | `admin123` |
| `CORS_ORIGIN` | CORS allowed origins (* for all, or comma-separated domains) | `*` |
| `SESSION_DIR` | Directory for session data | `./sessions` |
| `MEDIA_DIR` | Directory for media files | `./media` |

---

## 📚 API Documentation

### Authentication

All API endpoints (except `/api/auth/login`) require authentication via API key in the header:

```http
x-api-key: your_secret_api_key
```

To disable authentication, set `API_KEY=` (empty) in `.env`.

---

### 📨 Messages API

#### Send Text Message

**Endpoint:** `POST /api/messages/send-text`

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',  // or '628123456789@s.whatsapp.net'
    'text' => 'Hello from Kilas! 🚀'
];

$ch = curl_init('http://localhost:3000/api/messages/send-text');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);
?>
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent"
}
```

---

#### Send Quote/Reply Message

**Endpoint:** `POST /api/messages/send-text`

Reply to a specific message by providing the `quotedMessageId`.

**Request Body:**
```json
{
  "sessionId": "MySession",
  "chatId": "628123456789",
  "text": "This is a reply to your message",
  "quotedMessageId": "3EB0123456789ABCDEF"
}
```

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'text' => 'This is a reply!',
    'quotedMessageId' => '3EB0123456789ABCDEF'  // Message ID to quote
];

$ch = curl_init('http://localhost:3001/api/messages/send-text');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent"
}
```

> **Note**: Get message ID from webhook events or message logs.

---

#### Start Typing Indicator

**Endpoint:** `POST /api/messages/typing/start`

Show "typing..." indicator in the chat.

**Request Body:**
```json
{
  "sessionId": "MySession",
  "chatId": "628123456789"
}
```

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789'
];

$ch = curl_init('http://localhost:3001/api/messages/typing/start');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Response:**
```json
{
  "success": true,
  "message": "Typing indicator started"
}
```

---

#### Stop Typing Indicator

**Endpoint:** `POST /api/messages/typing/stop`

Stop "typing..." indicator in the chat.

**Request Body:**
```json
{
  "sessionId": "MySession",
  "chatId": "628123456789"
}
```

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789'
];

$ch = curl_init('http://localhost:3001/api/messages/typing/stop');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Response:**
```json
{
  "success": true,
  "message": "Typing indicator stopped"
}
```

> **Note**: Typing indicator auto-stops after ~30 seconds if not manually stopped.

---

#### Send Image

**Endpoint:** `POST /api/messages/send-image`

**Method 1: File Upload (Multipart)**

**PHP Example:**
```php
<?php
$ch = curl_init('http://localhost:3000/api/messages/send-image');

$postData = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'caption' => 'Check out this image!',
    'image' => new CURLFile('/path/to/image.jpg', 'image/jpeg', 'image.jpg')
];

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Method 2: Base64 (JSON)**

**PHP Example:**
```php
<?php
$imageData = file_get_contents('/path/to/image.jpg');
$base64Image = base64_encode($imageData);

$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'caption' => 'Image from base64',
    'image' => 'data:image/jpeg;base64,' . $base64Image
];

$ch = curl_init('http://localhost:3000/api/messages/send-image');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

#### Send Document

**Endpoint:** `POST /api/messages/send-document`

**Method 1: File Upload**

**PHP Example:**
```php
<?php
$ch = curl_init('http://localhost:3000/api/messages/send-document');

$postData = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'caption' => 'Important document',
    'document' => new CURLFile('/path/to/document.pdf', 'application/pdf', 'document.pdf')
];

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Method 2: Base64**

**PHP Example:**
```php
<?php
$documentData = file_get_contents('/path/to/document.pdf');
$base64Document = base64_encode($documentData);

$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'caption' => 'Document from base64',
    'filename' => 'invoice.pdf',
    'mimetype' => 'application/pdf',
    'document' => 'data:application/pdf;base64,' . $base64Document
];

$ch = curl_init('http://localhost:3000/api/messages/send-document');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

#### Send Location

**Endpoint:** `POST /api/messages/send-location`

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'chatId' => '628123456789',
    'latitude' => -6.200000,
    'longitude' => 106.816666,
    'address' => 'Jakarta, Indonesia'
];

$ch = curl_init('http://localhost:3000/api/messages/send-location');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

### 👥 Sessions API

#### Get All Sessions

**Endpoint:** `GET /api/sessions`

**PHP Example:**
```php
<?php
$ch = curl_init('http://localhost:3000/api/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

$sessions = json_decode($response, true);
print_r($sessions);
?>
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "MySession",
      "status": "connected",
      "user": {
        "id": "628123456789",
        "name": "My WhatsApp"
      }
    }
  ]
}
```

---

#### Create New Session

**Endpoint:** `POST /api/sessions/create`

**PHP Example:**
```php
<?php
$data = ['sessionId' => 'NewSession'];

$ch = curl_init('http://localhost:3000/api/sessions/create');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

#### Delete Session

**Endpoint:** `DELETE /api/sessions/:id`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/sessions/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

### 👨‍👩‍👧‍👦 Groups API

#### Get All Groups

**Endpoint:** `GET /api/groups/:sessionId`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/groups/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

$groups = json_decode($response, true);
print_r($groups);
?>
```

---

#### Create Group

**Endpoint:** `POST /api/groups/create`

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'subject' => 'My New Group',
    'participants' => ['628123456789', '628987654321']
];

$ch = curl_init('http://localhost:3000/api/groups/create');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

### 📇 Contacts API

#### Get All Contacts

**Endpoint:** `GET /api/contacts/:sessionId`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/contacts/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

$contacts = json_decode($response, true);
print_r($contacts);
?>
```

---

### 📢 Status API

#### Post Status Update

**Endpoint:** `POST /api/status/post/text`

**PHP Example:**
```php
<?php
$data = [
    'sessionId' => 'MySession',
    'text' => 'My Status Update 🚀',
    'backgroundColor' => 0xff1a1f3a,
    'font' => 1
];

$ch = curl_init('http://localhost:3000/api/status/post/text');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

### 🔔 Webhook API

#### Configure Webhook

**Endpoint:** `POST /api/webhook/:sessionId`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$data = [
    'webhookUrl' => 'https://your-webhook-url.com/endpoint',
    'events' => [
        'connection.update',
        'messages.upsert',
        'messages.update'
    ]
];

$ch = curl_init("http://localhost:3000/api/webhook/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

**Available Events:**
- `connection.update` - Connection status changes
- `messages.upsert` - New messages received
- `messages.update` - Message updates (read receipts, edits)
- `messages.delete` - Deleted messages
- `presence.update` - User presence (online/offline)
- `chats.upsert` - New chats
- `chats.update` - Chat updates
- `contacts.upsert` - Contact updates
- `groups.upsert` - New groups
- `group-participants.update` - Group participant changes
- `call` - Incoming calls

**Webhook Payload Structure:**
```json
{
  "event": "messages.upsert",
  "sessionId": "MySession",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "type": "notify",
    "messages": [{...}],
    "isGroup": false,           // true if message is from a group
    "chatType": "private"       // 'private' or 'group'
  }
}
```

---

#### Get Webhook Configuration

**Endpoint:** `GET /api/webhook/:sessionId`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/webhook/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

#### Test Webhook

**Endpoint:** `POST /api/webhook/:sessionId/test`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/webhook/$sessionId/test");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

#### Delete Webhook

**Endpoint:** `DELETE /api/webhook/:sessionId`

**PHP Example:**
```php
<?php
$sessionId = 'MySession';

$ch = curl_init("http://localhost:3000/api/webhook/$sessionId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: your_secret_api_key'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

## 🏗️ Project Structure

```
kilas/
├── public/                 # Frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Images and logo
│   └── *.html             # HTML pages
├── src/
│   ├── lib/               # Core libraries
│   │   ├── BaileysHandler.js    # WhatsApp connection handler
│   │   ├── SessionManager.js    # Multi-session management
│   │   ├── WebhookSender.js     # Webhook delivery system
│   │   └── MediaHandler.js      # Media file handler
│   ├── middleware/        # Express middleware
│   │   └── auth.js        # API authentication
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── sessions.js    # Session management
│   │   ├── messages.js    # Message sending
│   │   ├── groups.js      # Group management
│   │   ├── contacts.js    # Contact management
│   │   ├── status.js      # Status updates
│   │   └── webhook.js     # Webhook configuration
│   └── websocket/         # WebSocket handlers
│       └── socketHandler.js
├── sessions/              # WhatsApp session data
├── media/                 # Saved media files
├── server.js              # Main server file
├── Dockerfile             # Docker configuration
├── docker compose.yml     # Docker Compose config
├── .env                   # Environment variables
└── package.json           # Dependencies
```

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.IO for real-time communication
- **WhatsApp**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Frontend**: Vanilla JavaScript, Modern CSS with Glassmorphism
- **File Upload**: Multer
- **Logging**: Pino
- **HTTP Client**: Axios (for webhooks)
- **QR Code**: qrcode library

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Report Bugs** - Open an issue with detailed information
2. **Suggest Features** - Share your ideas for improvements
3. **Submit Pull Requests** - Fix bugs or add new features
4. **Improve Documentation** - Help make our docs better
5. **Share Your Experience** - Star the repo and spread the word!

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/dickyermawan/kilas.git
cd kilas

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Pull Request Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Please ensure:**
- Code follows existing style conventions
- All tests pass
- Documentation is updated if needed
- Commit messages are clear and descriptive

---

## 🐛 Troubleshooting

### QR Code Not Appearing
- Wait 30-60 seconds for QR generation
- Check Live Events for "QR Code received" log
- Ensure WebSocket is connected (green indicator in dashboard)

### Session Not Connecting
- Scan QR before it expires (~60 seconds)
- Try deleting and recreating the session
- Check browser console for errors
- Verify WhatsApp app is updated to latest version

### "Request Entity Too Large" Error
- The server supports up to 50MB request body size
- For larger files, consider compressing before sending
- Recommended max file size: 10-15MB for optimal performance

### Docker Container Issues
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Restart container
docker compose restart

# Rebuild from scratch
docker compose down
docker compose up -d --build
```

### API Returns 401 Unauthorized
- Verify `x-api-key` header is included in request
- Check API key matches value in `.env`
- To disable auth, set `API_KEY=` (empty) in `.env`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Dicky Ermawan S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Built with Antigravity

This project was built with the assistance of **[Antigravity](https://github.com/google-deepmind)** - Google DeepMind's advanced agentic coding AI. Antigravity helped accelerate development, improve code quality, and implement best practices throughout the project.

### Special Thanks

- **[@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)** - The amazing WhatsApp Web API library
- **[Socket.IO](https://socket.io/)** - Real-time bidirectional event-based communication
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework for Node.js
- **All Contributors** - Thank you for making this project better!

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/dickyermawan/kilas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dickyermawan/kilas/discussions)
- **Email**: dikywana@gmail.com

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=dickyermawan/kilas&type=Date)](https://star-history.com/#dickyermawan/kilas&Date)

---

<div align="center">

**Made with ❤️ by [Dicky Ermawan S](https://github.com/dickyermawan)**

**Powered by [Antigravity](https://github.com/google-deepmind) 🚀**

[⬆ Back to Top](#kilas---whatsapp-gateway-api)

</div>
