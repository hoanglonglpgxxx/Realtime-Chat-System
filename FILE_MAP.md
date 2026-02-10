# Realtime Chat System - File Map

## Project Structure

```
Realtime Chat System/
│
├── .env                              # Root environment variables
├── .gitignore                        # Git ignore configuration
├── package.json                      # Root package dependencies
├── package-lock.json                 # Root dependency lock file
├── README.md                         # Project documentation
├── Dataflow.md                       # Data flow documentation
├── DOLATER.md                        # Future tasks/TODOs
├── FEATURES.md                       # Feature specifications
├── GUIDE.md                          # Project guide
├── FILE_MAP.md                       # This file - project structure map
│
├── .git/                             # Git repository metadata
│
├── .github/                          # GitHub specific files
│   └── workflows/
│       └── deploy.yml                # CI/CD deployment workflow
│
├── node_modules/                     # Root level dependencies
│
├── apps/                             # Application monorepo
│   ├── .env                          # Apps environment variables
│   ├── .gitkeep                      # Keep empty directory in git
│   ├── docker-compose.yml            # Docker compose for apps
│   │
│   ├── backend/                      # Backend Node.js application
│   │   ├── Dockerfile                # Backend container configuration
│   │   ├── package.json              # Backend dependencies
│   │   ├── server.js                 # Main server entry point
│   │   │
│   │   ├── config/                   # Configuration files
│   │   │   ├── auth.config.js        # Authentication configuration
│   │   │   ├── db.config.js          # Database configuration
│   │   │   ├── redis.config.js       # Redis configuration
│   │   │   └── socket.config.js      # Socket.IO configuration
│   │   │
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js    # Authentication logic
│   │   │   └── user.controller.js    # User management logic
│   │   │
│   │   ├── middlewares/              # Express middlewares
│   │   │   ├── index.js              # Middleware exports
│   │   │   ├── auth.middleware.js    # Auth verification middleware
│   │   │   └── verifySignup.middleware.js  # Signup validation
│   │   │
│   │   ├── models/                   # Database models (Sequelize/Mongoose)
│   │   │   ├── index.js              # Model aggregator
│   │   │   ├── role.model.js         # Role model
│   │   │   ├── room.model.js         # Chat room model
│   │   │   ├── roomType.model.js     # Room type model
│   │   │   └── user.model.js         # User model
│   │   │
│   │   ├── routes/                   # API routes
│   │   │   ├── auth.routes.js        # Authentication endpoints
│   │   │   └── user.routes.js        # User endpoints
│   │   │
│   │   └── test/                     # Test files
│   │       └── seeding.test.js       # Database seeding tests
│   │
│   ├── frontend/                     # Next.js frontend application
│   │   ├── .gitignore                # Frontend specific git ignore
│   │   ├── Dockerfile                # Frontend container configuration
│   │   ├── package.json              # Frontend dependencies
│   │   ├── README.md                 # Frontend documentation
│   │   ├── next.config.mjs           # Next.js configuration
│   │   ├── jsconfig.json             # JavaScript configuration
│   │   ├── middleware.js             # Next.js middleware
│   │   ├── eslint.config.mjs         # ESLint configuration
│   │   ├── postcss.config.js         # PostCSS configuration
│   │   ├── tailwind.config.js        # Tailwind CSS configuration
│   │   │
│   │   ├── .next/                    # Next.js build output
│   │   ├── node_modules/             # Frontend dependencies
│   │   │
│   │   ├── app/                      # Next.js 13+ app directory
│   │   │   ├── favicon.ico           # Site favicon
│   │   │   ├── globals.css           # Global styles
│   │   │   ├── layout.js             # Root layout component
│   │   │   ├── page.js               # Home page
│   │   │   ├── page.module.css       # Home page styles
│   │   │   │
│   │   │   ├── (auth)/               # Authentication route group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.js       # Login page
│   │   │   │   └── register/
│   │   │   │       └── page.js       # Registration page
│   │   │   │
│   │   │   ├── api/                  # API routes
│   │   │   │   └── proxy/
│   │   │   │       └── login/
│   │   │   │           └── route.js  # Login proxy endpoint
│   │   │   │
│   │   │   ├── chat/                 # Chat interface
│   │   │   │   └── page.js           # Chat page
│   │   │   │
│   │   │   └── dashboard/            # Dashboard interface
│   │   │       └── page.js           # Dashboard page
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── auth/                 # Authentication components
│   │   │   │   └── LoginForm.jsx     # Login form component
│   │   │   │
│   │   │   ├── chat/                 # Chat components (empty)
│   │   │   │
│   │   │   ├── ui/                   # UI components
│   │   │   │   ├── Button.jsx        # Button component
│   │   │   │   └── Input.jsx         # Input component
│   │   │   │
│   │   │   └── user/                 # User components
│   │   │       ├── NavBar.jsx        # Navigation bar component
│   │   │       └── UserInfo.jsx      # User info display
│   │   │
│   │   ├── public/                   # Static assets
│   │   │   └── styles/
│   │   │       └── Navbar.css        # Navbar styles
│   │   │
│   │   └── services/                 # Frontend services
│   │       └── auth.services.js      # Authentication service
│   │
│   └── socket-bridge/                # Socket.IO bridge service
│       ├── Dockerfile                # Socket bridge container configuration
│       ├── package.json              # Socket bridge dependencies
│       ├── index.js                 # Socket bridge entry point
│       ├── config.js                # Socket bridge configuration
│       ├── connection.js            # Socket connection handler
│       ├── listener.js              # Socket event listeners
│       ├── utils.js                 # Socket utilities
│       │
│       └── handlers/                 # Socket event handlers
│           ├── chat.handler.js       # Chat message handling
│           ├── event.handler.js      # General event handling
│           ├── room.handler.js       # Room operations handling
│           └── user.handler.js       # User presence handling
│
├── infrastructure/                   # Infrastructure configuration
│   ├── .env                          # Infrastructure environment vars
│   ├── docker-compose.yml            # Infrastructure services
│   ├── redis.conf                    # Redis configuration
│   └── users.acl                     # Redis ACL users
│
├── notes/                            # Development notes
│   ├── HandleDBImage.md              # Database setup notes
│   └── HandleRedisImage.md           # Redis setup notes
│
└── packages/                         # Shared packages
    ├── test                          # Test utilities (file)
    └── shared/                       # Shared code (empty)

```

## Directory Descriptions

### Root Level

- Configuration files for the monorepo
- Documentation files (README, GUIDE, FEATURES, etc.)
- CI/CD workflows in `.github/`
- FILE_MAP.md - This project structure reference

### `/apps/backend/`

Node.js backend with Express.js

- RESTful API endpoints
- Authentication & authorization
- Database models
- No longer contains Socket.IO (moved to socket-bridge)

### `/apps/frontend/`

Next.js 13+ frontend with App Router

- Server-side rendering
- Authentication pages
- Chat interface
- Dashboard
- Reusable components

### `/apps/socket-bridge/`

Dedicated Socket.IO service

- Real-time socket communication
- Event handling for chat, rooms, and users
- Separate from backend for scalability
- Handles WebSocket connections

### `/infrastructure/`

Docker and service configurations

- Redis for caching/pub-sub
- Docker Compose setups
- Environment configurations

### `/packages/`

Shared code and utilities (monorepo pattern)

- Shared types/interfaces
- Common utilities
- Shared configurations

---

**Generated on:** February 10, 2026
**Project Type:** Realtime Chat System (Monorepo)
**Tech Stack:** Node.js, Express, Socket.IO, Next.js, Redis, Docker
**Architecture:** Microservices (Backend API + Socket Bridge + Frontend)
