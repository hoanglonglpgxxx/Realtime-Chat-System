# Realtime Chat System - File Map & Directory Structure

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Core Applications](#core-applications)
4. [Directory Descriptions](#directory-descriptions)
5. [Key Files Reference](#key-files-reference)
6. [Important Notes](#important-notes)

---

## Project Overview

**Project Name:** Realtime Chat System  
**Type:** Distributed Microservices Architecture  
**Tech Stack:** Node.js, Express.js, Next.js, Socket.IO, Redis, MongoDB, Docker  
**Deployment:** Google Cloud Platform (GCP) - 2 VMs  
**Last Updated:** February 20, 2026

### Architecture: Defense-in-Depth Security

```
Internet
    ↓
┌─────────────────────────────────┐
│ VM1: chat-system-app (Public)   │
│ • Nginx Reverse Proxy           │
│ • Next.js Frontend              │
│ • Express Backend               │
│ • HttpOnly Cookies (Layer 2)    │
│ • HMAC Signing (Layer 3)        │
└─────────────────────────────────┘
    ↓ (Internal Network)
┌─────────────────────────────────┐
│ VM2: tracker-n-chat-infra (Private) │
│ • Socket.IO Bridge              │
│ • Redis (Pub/Sub, Nonce Store)  │
│ • MongoDB                       │
│ • Network Isolation (Layer 1)   │
│ • HMAC Verification (Layer 3)   │
└─────────────────────────────────┘
```

---

## Directory Structure

```
Realtime-Chat-System/
│
├── 📄 Root Configuration Files
│   ├── package.json                 # Root workspace dependencies
│   ├── package-lock.json            # Dependency lock file
│   ├── .env                         # Root environment variables
│   ├── .gitignore                   # Git ignore rules
│   └── .git/                        # Git repository metadata
│
├── 📄 Documentation Files
│   ├── README.md                    # Project overview & setup guide
│   ├── GUIDE.md                     # Project guide & architecture
│   ├── FILE_MAP.md                  # This file (deprecated - see FILEMAP.md)
│   ├── FILEMAP.md                   # Standard filemap (you are here)
│   ├── Dataflow.md                  # Data flow documentation
│   ├── DOLATER.md                   # Future tasks & TODOs
│   └── FEATURES.md                  # Feature specifications
│
├── 🔧 CI/CD & Automation
│   └── .github/
│       └── workflows/
│           ├── deploy.yml           # Original CI/CD workflow
│           └── deploy-with-lb.yml   # Load Balancer CI/CD (optional)
│
├── 📦 Application Monorepo
│   └── apps/
│       ├── docker-compose.yml       # Docker services orchestration
│       ├── .env.example             # Environment template
│       │
│       ├── 🔙 backend/              # Express.js Backend API Server
│       │   ├── Dockerfile           # Backend container image
│       │   ├── package.json         # Backend npm dependencies
│       │   ├── server.js            # Main entry point
│       │   │
│       │   ├── config/
│       │   │   ├── auth.config.js       # JWT & authentication settings
│       │   │   ├── db.config.js         # MongoDB connection
│       │   │   ├── redis.config.js      # Redis connection & nonce tracking
│       │   │   └── socket.config.js     # Socket.IO redis adapter
│       │   │
│       │   ├── controllers/
│       │   │   ├── auth.controller.js   # Login/signup logic
│       │   │   ├── message.controller.js # Message handling + HMAC signing
│       │   │   ├── room.controller.js   # Room operations
│       │   │   └── user.controller.js   # User management
│       │   │
│       │   ├── middlewares/
│       │   │   ├── index.js             # Middleware exports
│       │   │   ├── auth.middleware.js   # JWT verification
│       │   │   └── verifySignup.middleware.js # Signup validation
│       │   │
│       │   ├── models/
│       │   │   ├── index.js             # Model aggregator
│       │   │   ├── user.model.js        # User schema
│       │   │   ├── message.model.js     # Message schema
│       │   │   ├── room.model.js        # Chat room schema
│       │   │   ├── roomType.model.js    # Room type schema
│       │   │   └── role.model.js        # User role schema
│       │   │
│       │   ├── routes/
│       │   │   ├── auth.routes.js       # /api/auth/* endpoints
│       │   │   ├── message.routes.js    # /api/messages/* endpoints
│       │   │   ├── room.routes.js       # /api/rooms/* endpoints
│       │   │   └── user.routes.js       # /api/users/* endpoints
│       │   │
│       │   ├── utils/
│       │   │   └── hmac.util.js         # HMAC signing & verification (🔐 Security)
│       │   │
│       │   └── test/
│       │       └── seeding.test.js      # Database seeding tests
│       │
│       ├── 🎨 frontend/               # Next.js 13+ Frontend
│       │   ├── package.json            # Frontend npm dependencies
│       │   ├── Dockerfile              # Frontend container image
│       │   ├── README.md               # Frontend specific docs
│       │   ├── next.config.mjs         # Next.js configuration
│       │   ├── jsconfig.json           # JavaScript config
│       │   ├── middleware.js           # Next.js middleware
│       │   ├── eslint.config.mjs       # ESLint rules
│       │   ├── postcss.config.js       # PostCSS setup
│       │   ├── tailwind.config.js      # Tailwind CSS config
│       │   ├── .gitignore              # Frontend git ignore
│       │   │
│       │   ├── .next/                  # Next.js build output (ignored)
│       │   ├── node_modules/           # Node dependencies (ignored)
│       │   │
│       │   ├── app/                    # Next.js 13+ App Router
│       │   │   ├── layout.js           # Root layout wrapper
│       │   │   ├── page.js             # Home page (/)
│       │   │   ├── page.module.css     # Home page styles
│       │   │   ├── globals.css         # Global styles
│       │   │   │
│       │   │   ├── (auth)/             # Route group: Authentication
│       │   │   │   ├── login/
│       │   │   │   │   └── page.js     # Login page (/login)
│       │   │   │   └── register/
│       │   │   │       └── page.js     # Register page (/register)
│       │   │   │
│       │   │   ├── api/                # Next.js API Routes
│       │   │   │   └── proxy/
│       │   │   │       ├── login/
│       │   │   │       │   └── route.js    # POST /api/proxy/login
│       │   │   │       ├── logout/
│       │   │   │       │   └── route.js    # POST /api/proxy/logout
│       │   │   │       ├── message/
│       │   │   │       │   └── send/
│       │   │   │       │       └── route.js # POST /api/proxy/message/send
│       │   │   │       ├── messages/
│       │   │   │       │   └── [roomId]/
│       │   │   │       │       └── route.js # GET /api/proxy/messages/:roomId
│       │   │   │       ├── rooms/
│       │   │   │       │   ├── find-or-create/
│       │   │   │       │   │   └── route.js # POST /api/proxy/rooms/find-or-create
│       │   │   │       │   └── my-rooms/
│       │   │   │       │       └── route.js # GET /api/proxy/rooms/my-rooms
│       │   │   │       └── users/
│       │   │   │           └── route.js     # GET /api/proxy/users
│       │   │   │
│       │   │   ├── chat/               # Chat interface
│       │   │   │   └── page.js         # Chat page (/chat)
│       │   │   │
│       │   │   └── dashboard/          # Dashboard interface
│       │   │       └── page.js         # Dashboard page (/dashboard)
│       │   │
│       │   ├── components/             # React components (reusable)
│       │   │   ├── auth/
│       │   │   │   └── LoginForm.jsx   # Login form component
│       │   │   ├── chat/               # Chat-specific components
│       │   │   ├── ui/                 # Generic UI components
│       │   │   │   ├── Button.jsx      # Button component
│       │   │   │   └── Input.jsx       # Input component
│       │   │   └── user/               # User-specific components
│       │   │       ├── NavBar.jsx      # Navigation bar
│       │   │       └── UserInfo.jsx    # User info display
│       │   │
│       │   ├── hooks/                  # Custom React hooks
│       │   │   └── useAuth.js          # Authentication hook
│       │   │
│       │   ├── public/                 # Static assets
│       │   │   └── styles/
│       │   │       └── Navbar.css      # Navbar styles
│       │   │
│       │   └── services/               # Frontend services
│       │       ├── auth.services.js    # Authentication API calls
│       │       └── socket.service.js   # WebSocket service (🔐 Security)
│       │
│       ├── 🌉 socket-bridge/          # Socket.IO Bridge Service
│       │   ├── Dockerfile              # Socket bridge container
│       │   ├── package.json            # Socket bridge dependencies
│       │   ├── index.js                # Entry point & server init
│       │   ├── config.js               # Socket configuration
│       │   ├── connection.js           # Socket connection handler
│       │   ├── listener.js             # Socket event listeners
│       │   ├── utils.js                # Utility functions
│       │   │
│       │   └── handlers/               # Socket event handlers
│       │       ├── chat.handler.js     # Chat message handling
│       │       ├── event.handler.js    # Event verification (🔐 HMAC check)
│       │       ├── room.handler.js     # Room operations
│       │       └── user.handler.js     # User presence & typing
│       │
│       └── 🐳 nginx/                  # Nginx Reverse Proxy (VM1)
│           └── conf.d/
│               └── default.conf        # Nginx configuration
│
├── 🏗️ Infrastructure
│   ├── docker-compose.yml             # Infrastructure services (Redis, MongoDB)
│   ├── redis.conf                     # Redis server configuration
│   ├── users.acl                      # Redis ACL users
│   └── nginx-lb/                      # Load Balancer config (optional)
│       ├── nginx.conf                 # Nginx LB configuration
│       └── README.md                  # LB setup guide
│
├── 📚 Documentation & Notes
│   ├── notes/
│   │   ├── DEFENSE_IN_DEPTH_DEMO.md   # ⭐ Security demo guide (4 scenarios)
│   │   ├── QUICK_START_DEMO.md        # Quick reference for demo
│   │   ├── REPLAY_ATTACK_DEFENSE.md   # Replay attack deep dive
│   │   ├── MIGRATION_GUIDE.md         # Safe migration to LB (7 phases)
│   │   ├── MIGRATION_QUICKREF.md      # Migration quick commands
│   │   ├── MIGRATION_SUMMARY.md       # Migration overview
│   │   ├── OPTION1_DEDICATED_LB.md    # LB setup option
│   │   ├── OPTION2_CURRENT_SETUP.md   # Current setup enhancement
│   │   ├── THESIS_RECOMMENDATION.md   # Academic analysis
│   │   ├── QUICK_DECISION.md          # Decision matrix
│   │   ├── HandleDBImage.md           # MongoDB setup notes
│   │   ├── HandleRedisImage.md        # Redis setup notes
│   │   ├── LOAD_BALANCER_SCALING_GUIDE.md # Scaling guide
│   │   ├── REDIS_MONITORING_GUIDE.md  # Redis monitoring
│   │   ├── NGINX_CONFIG_FOR_VM1.conf  # Nginx template
│   │   ├── FIX_INVALID_NAMESPACE.md   # Bugfix notes
│   │   ├── generate-hmac-key.js       # HMAC key generation
│   │   └── (many more thesis-related files)
│   │
│   └── 🧪 tests/                      # Testing suite
│       ├── README.md                  # Test documentation
│       ├── package.json               # Test dependencies
│       ├── setup-demo.sh              # Demo setup script
│       ├── run-all-scenarios.sh       # ⭐ Master test script
│       ├── scenario1-network-isolation.sh  # Network test
│       ├── scenario2-httponly-cookie.sh    # Cookie test
│       ├── replay-attack-demo.js      # ⭐ Replay attack test (Node.js)
│       └── .env                       # Test configuration
│
└── 📋 Deployment Files (at root)
    ├── deploy-bk.md                   # Deployment backup notes
    ├── Dataflow.md                    # System data flow diagram
    └── (CI/CD workflows in .github/)

```

---

## Core Applications

### 1️⃣ Backend (apps/backend/)

**Purpose:** REST API server for data management  
**Technology:** Node.js + Express.js  
**Database:** MongoDB  
**Key Features:**

- JWT authentication
- User & room management
- Message handling with HMAC signing
- Redis pub/sub for real-time events

**Important Files:**

- `server.js` - Entry point
- `utils/hmac.util.js` - 🔐 HMAC signing & verification
- `controllers/message.controller.js` - Message publishing
- `config/redis.config.js` - Redis nonce tracking

---

### 2️⃣ Frontend (apps/frontend/)

**Purpose:** User interface for chat  
**Technology:** Next.js 13+ with App Router, React  
**Styling:** Tailwind CSS  
**Key Features:**

- Server-side rendering
- Authentication pages (login/register)
- Chat interface with real-time updates
- HttpOnly cookie for session management

**Important Files:**

- `app/api/proxy/login/route.js` - Login proxy with 🔐 HttpOnly cookie
- `services/socket.service.js` - WebSocket client
- `hooks/useAuth.js` - Auth hook

---

### 3️⃣ Socket Bridge (apps/socket-bridge/)

**Purpose:** Real-time WebSocket server  
**Technology:** Node.js + Socket.IO  
**Connection:** Redis Pub/Sub adapter  
**Key Features:**

- WebSocket connection handling
- Message broadcast via Redis
- Event verification with HMAC
- Room & user presence tracking

**Important Files:**

- `handlers/event.handler.js` - 🔐 HMAC verification
- `handlers/chat.handler.js` - Chat events
- `listener.js` - Socket event listeners
- `config.js` - Socket configuration

---

### 4️⃣ Nginx Reverse Proxy (apps/nginx/)

**Purpose:** HTTP server & routing  
**Technology:** Nginx  
**Key Features:**

- Frontend & Backend routing
- WebSocket proxy support
- Rate limiting (optional)
- SSL/TLS termination (optional)

---

## Directory Descriptions

### Root Level (`/`)

Central configuration and documentation for the monorepo project.

- **package.json**: Workspace root dependencies
- **README.md**: Main project documentation
- **GUIDE.md**: Architecture and setup guide
- **FILEMAP.md**: This directory structure reference

### Applications (`/apps/`)

Monorepo containing all microservices and frontend.

#### Backend (`/apps/backend/`)

Express.js REST API server

- Handles all database operations
- User authentication & authorization
- Message creation & storage
- Publishes events to Redis for Socket Bridge

**Key Security Features:**

- HMAC SHA256 signatures on messages
- Nonce generation for replay prevention
- Timestamp validation (±60s window)
- JWT token verification

#### Frontend (`/apps/frontend/`)

Next.js 13+ user interface

- Server component rendering
- Authentication pages
- Chat interface with real-time messaging
- User dashboard

**Key Security Features:**

- HttpOnly cookies (prevent XSS token theft)
- Session management with JWT
- CSRF protection via Next.js middleware
- Frontend input validation

#### Socket Bridge (`/apps/socket-bridge/`)

Dedicated Socket.IO service for real-time communication

- Handles WebSocket connections
- Redis Pub/Sub for message distribution
- Event broadcasting to chat rooms
- User presence tracking

**Key Security Features:**

- HMAC signature verification on received messages
- Nonce deduplication (replay attack prevention)
- Timestamp freshness checks
- Event whitelist validation

#### Nginx (`/apps/nginx/`)

Reverse proxy server

- Routes requests to backend
- Proxies WebSocket connections
- Optional rate limiting
- Optional SSL/TLS termination

### Infrastructure (`/infrastructure/`)

Production infrastructure configuration

- **docker-compose.yml**: Services orchestration (Redis, MongoDB)
- **redis.conf**: Redis server settings
- **users.acl**: Redis access control
- **nginx-lb/**: Load balancer configuration (optional)

**Services:**

- Redis: Caching, Pub/Sub, Nonce tracking
- MongoDB: User, message, and room storage

### Notes & Testing (`/notes/` & `/tests/`)

#### Documentation (`/notes/`)

Project notes and guides

- **DEFENSE_IN_DEPTH_DEMO.md**: Security testing scenarios
- **REPLAY_ATTACK_DEFENSE.md**: Replay attack prevention guide
- **MIGRATION_GUIDE.md**: Safe setup/scaling procedure
- **THESIS_RECOMMENDATION.md**: Academic analysis

#### Testing (`/tests/`)

Automated security testing suite

- **scenario1-network-isolation.sh**: Firewall & network tests
- **scenario2-httponly-cookie.sh**: Session security tests
- **replay-attack-demo.js**: Automated replay attack demo
- **run-all-scenarios.sh**: Master test script

---

## Key Files Reference

### 🔐 Security Critical Files

| File                                           | Purpose                           | Security Layer              |
| ---------------------------------------------- | --------------------------------- | --------------------------- |
| `apps/backend/utils/hmac.util.js`              | HMAC signing & verification       | Layer 3: Message Integrity  |
| `apps/socket-bridge/handlers/event.handler.js` | HMAC verification, nonce tracking | Layer 3: Replay Prevention  |
| `apps/frontend/app/api/proxy/login/route.js`   | HttpOnly cookie setting           | Layer 2: Session Protection |
| `apps/backend/config/redis.config.js`          | Nonce storage & tracking          | Layer 3: Nonce Management   |

### 🏗️ Configuration Files

| File                                | Purpose                       |
| ----------------------------------- | ----------------------------- |
| `apps/docker-compose.yml`           | Service orchestration         |
| `infrastructure/docker-compose.yml` | Infrastructure services       |
| `apps/frontend/next.config.mjs`     | Next.js configuration         |
| `apps/backend/config/*.js`          | Database, Redis, Auth configs |

### 📝 Documentation Files

| File                             | Contains                        |
| -------------------------------- | ------------------------------- |
| `README.md`                      | Project overview & quick start  |
| `GUIDE.md`                       | Architecture & detailed guide   |
| `FILEMAP.md`                     | Directory structure (this file) |
| `Dataflow.md`                    | Data flow diagrams              |
| `notes/DEFENSE_IN_DEPTH_DEMO.md` | Security testing guide          |

---

## Important Notes

### Environment Variables

Each application has `.env` configuration:

- **Root**: `.env` (general settings)
- **Apps**: `apps/.env` (monorepo settings)
- **Backend**: `HMAC_SECRET_KEY`, `MONGODB_URI`, `REDIS_URL`, etc.
- **Frontend**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

### Security Architecture

```
Layer 1: Network Isolation (Firewall, Private Subnet)
Layer 2: Session Security (HttpOnly Cookie, JWT)
Layer 3: Message Integrity (HMAC + Nonce + Timestamp)
Layer 4: Monitoring (SIEM - Wazuh)
```

### Deployment

**Current:** 2 VMs (simple, effective)

- **VM1** (chat-system-app): Frontend + Backend + Nginx (Public IP)
- **VM2** (tracker-n-chat-infrastructure): Socket Bridge + Redis + MongoDB (Private)

**Optional:** Add Load Balancer VM (see notes/MIGRATION_GUIDE.md)

### Key Technologies

- **Frontend:** Next.js 13+, React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Real-time:** Socket.IO
- **Databases:** MongoDB (data), Redis (cache/pub-sub)
- **Infrastructure:** Docker, Docker Compose
- **Deployment:** Google Cloud Platform (GCP)

---

## Getting Started

1. **Read First:** `README.md` → `GUIDE.md`
2. **Setup:** Follow `README.md` instructions
3. **Understanding:** Check `FILEMAP.md` (this file)
4. **Data Flow:** Review `Dataflow.md`
5. **Security:** See `notes/DEFENSE_IN_DEPTH_DEMO.md`
6. **Testing:** Run `tests/run-all-scenarios.sh`

---

**Generated:** February 20, 2026  
**Last Updated:** February 20, 2026  
**Format:** Standard Project File Map  
**Version:** 2.0 (Standardized)
