# B2B Marketplace Platform

A production-ready B2B marketplace connecting suppliers with retail shops, featuring real-time negotiations, purchase intent management, and comprehensive admin tools.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0%2B-blue.svg)

## 🚀 Features

### For Suppliers
- **Company Verification**: Submit business documents for admin verification
- **Product Catalog**: Manage products with bulk pricing tiers, specifications, and media
- **Negotiation Management**: Respond to shop inquiries with real-time messaging
- **Purchase Intent Handling**: Accept, reject, or negotiate purchase requests
- **Performance Analytics**: Track response times, conversion rates, and ratings

### For Retail Shops
- **Supplier Discovery**: Search and filter suppliers by category, location, and ratings
- **Product Browsing**: Browse catalogs with advanced filtering and comparison
- **Negotiation Initiation**: Start negotiations with price/quantity requests
- **Purchase Intent Creation**: Create formal purchase requests from agreed terms
- **Order Tracking**: Monitor intent lifecycle from draft to agreement

### For Administrators
- **Supplier Verification**: Review and approve/reject supplier applications
- **Content Moderation**: Manage categories, products, and disputes
- **User Management**: Suspend/ban users, handle reports
- **Platform Analytics**: Dashboard with key metrics and system health
- **Audit Logs**: Complete trail of all administrative actions

### Technical Features
- **Real-time Messaging**: WebSocket-based negotiation chat
- **State Machine**: Purchase intent lifecycle with automatic expiration
- **Full-text Search**: PostgreSQL GIN indexes for fast product/supplier search
- **Background Jobs**: Automated expiration handling and notifications
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Role-based Access**: Fine-grained permissions for different user types

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│     TypeScript │ TailwindCSS │ React Query │ WebSocket Client    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Nginx)                         │
│              Load Balancer │ SSL Termination │ Rate Limiting     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   REST API       │  │  WebSocket       │  │  Background      │
│   (Express)      │  │  Server          │  │  Jobs            │
│                  │  │  (Socket.IO)     │  │  (node-cron)     │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └──────────────────┬──┴─────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │     Redis        │  │   S3/MinIO       │
│   (Primary DB)   │  │   (Cache/Queue)  │  │   (File Storage) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v6 or higher (for caching and pub/sub)
- **Docker & Docker Compose**: For containerized deployment

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/b2b-marketplace.git
   cd b2b-marketplace
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Configure environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Setup database**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

### Docker Deployment

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/b2b_marketplace
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=B2B Marketplace <noreply@example.com>

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
# For S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List suppliers (with filters) |
| GET | `/api/suppliers/:id` | Get supplier details |
| POST | `/api/suppliers` | Create supplier profile |
| PUT | `/api/suppliers/:id` | Update supplier profile |
| POST | `/api/suppliers/:id/verify` | Submit for verification |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete product |

### Negotiations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/negotiations` | List negotiations |
| GET | `/api/negotiations/:id` | Get negotiation details |
| POST | `/api/negotiations` | Start negotiation |
| PUT | `/api/negotiations/:id/status` | Update status |
| GET | `/api/negotiations/:id/messages` | Get messages |
| POST | `/api/negotiations/:id/messages` | Send message |

### Purchase Intents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-intents` | List intents |
| GET | `/api/purchase-intents/:id` | Get intent details |
| POST | `/api/purchase-intents` | Create intent |
| PUT | `/api/purchase-intents/:id` | Update intent |
| POST | `/api/purchase-intents/:id/submit` | Submit to supplier |
| POST | `/api/purchase-intents/:id/accept` | Supplier accepts |
| POST | `/api/purchase-intents/:id/reject` | Supplier rejects |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories (tree) |
| GET | `/api/categories/:id` | Get category details |
| POST | `/api/categories` | Create category (admin) |
| PUT | `/api/categories/:id` | Update category (admin) |

See full API documentation at `/api/docs` when running the server.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `JWT_SECRET`
- [ ] Set up PostgreSQL with SSL
- [ ] Configure Redis for caching
- [ ] Set up S3/MinIO for file storage
- [ ] Configure SMTP for emails
- [ ] Set up SSL certificates
- [ ] Configure Nginx reverse proxy
- [ ] Set up monitoring (health checks)
- [ ] Configure log aggregation
- [ ] Set up database backups

### Docker Production

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Kubernetes

Helm charts available in `/kubernetes` directory.

```bash
helm install b2b-marketplace ./kubernetes/helm
```

## 📊 Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (DB, Redis)
- `GET /health/live` - Liveness check

### Metrics
Prometheus metrics available at `/metrics` endpoint.

## 🔐 Security

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Password hashing with bcrypt (cost 12)
- **Input Validation**: Zod schema validation
- **SQL Injection**: Parameterized queries via Prisma
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: SameSite cookies
- **Rate Limiting**: Per-IP and per-user limits
- **Audit Logging**: All admin actions logged

## 📁 Project Structure

```
b2b-marketplace/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Prisma schema & types
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── jobs/           # Background jobs
│   │   ├── websocket/      # WebSocket handlers
│   │   └── index.ts        # Entry point
│   ├── tests/              # Test files
│   ├── migrations/         # Database migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   └── package.json
├── docker/                 # Docker configurations
├── scripts/                # Utility scripts
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Development compose
├── docker-compose.prod.yml # Production compose
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/), [React](https://react.dev/), [PostgreSQL](https://www.postgresql.org/)
- UI components with [TailwindCSS](https://tailwindcss.com/)
- Real-time features with [Socket.IO](https://socket.io/)
- Type safety with [TypeScript](https://www.typescriptlang.org/)
