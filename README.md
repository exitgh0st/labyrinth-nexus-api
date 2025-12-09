# Labyrinth Nexus API

A production-ready NestJS application featuring JWT authentication, OAuth integration, role-based access control, and comprehensive security features.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Google OAuth 2.0 integration
  - Role-Based Access Control (RBAC)
  - Session management with revocation support
  - Password reset functionality (ready to implement email)

- **Security**
  - HTTP-only cookies for refresh tokens
  - Rate limiting and throttling on sensitive endpoints
  - Security headers (HSTS, CSP, XSS Protection)
  - Bcrypt password hashing
  - Account lockout after failed login attempts

- **Developer Experience**
  - TypeScript with strict type checking
  - Liquibase for database migrations and version control
  - Prisma ORM for type-safe database access
  - Winston logger integration
  - ESLint + Prettier for code quality
  - Comprehensive error handling
  - Global exception filters

- **API Features**
  - Pagination support with `take=0` for unlimited results
  - Consistent `{data, total}` response format
  - Query parameter validation and transformation
  - Structured error responses

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Liquibase** (for database migrations)
  - Install: https://www.liquibase.org/download
  - Or use Docker: `docker pull liquibase/liquibase`
- **Git**

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/labyrinth-nexus-api.git
cd labyrinth-nexus-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
# Copy the example file
cp .env.example .env.development.local

# Edit the file with your values
# At minimum, update:
# - DATABASE_URL
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (if using OAuth)
```

### 4. Set up the database

This project uses **Liquibase** for database migrations and seeding, and **Prisma** as the ORM.

```bash
# Create PostgreSQL database
createdb your_database_name

# Run Liquibase migrations (creates tables and seeds initial data)
# Development:
npm run liquibase:update-dev

# Production:
npm run liquibase:update-prod

# Generate Prisma Client (for type-safe database access in code)
npm run prisma:generate

# Optional: Pull latest schema from database to Prisma
npm run prisma:db-pull
```

**Note:** Liquibase migrations include:
- User, Role, Session, and UserRole table creation
- Initial ADMIN and USER role seeding
- Sample admin user creation

### 5. Start the application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

### Alternative: Quick Start with Docker 🐳

If you have Docker installed, you can get started even faster:

```bash
# Start PostgreSQL + NestJS API
npm run docker:up

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Set authorized redirect URI: `http://localhost:3000/api/auth/oauth/google/callback`
7. Copy the Client ID and Client Secret to your `.env.development.local`

### Generating a Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Default Roles

The system comes with two predefined roles (created via Liquibase seed scripts):
- **ADMIN** - Full access to all endpoints
- **USER** - Standard user access

## 📁 Project Structure

```
├── db/                       # Liquibase database migrations
│   ├── migration-scripts/    # Individual migration XML files
│   │   ├── 001-create-user-table.xml
│   │   ├── 002-create-role-table.xml
│   │   ├── 003-create-session-table.xml
│   │   ├── 004-seed-role-data.xml
│   │   └── ...
│   ├── db.changelog-master.xml  # Main changelog file
│   ├── liquibase-update.js      # Migration runner script
│   └── liquibase-rollback.js    # Rollback script
├── prisma/
│   └── schema.prisma         # Prisma ORM schema (synced from DB)
├── src/
│   ├── auth/                 # Authentication & Authorization
│   │   ├── decorators/       # Custom decorators (Public, Roles, CurrentUser)
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── guards/           # Auth guards (JWT, Roles, Throttle)
│   │   ├── strategies/       # Passport strategies (JWT, Google)
│   │   └── tasks/            # Scheduled tasks (session cleanup)
│   ├── user/                 # User management
│   │   ├── dto/              # User DTOs
│   │   ├── selects/          # Prisma select queries
│   │   └── utils/            # User transformation utilities
│   ├── role/                 # Role management
│   ├── session/              # Session management
│   ├── shared/               # Shared utilities
│   │   ├── configs/          # Winston logger config
│   │   ├── dto/              # Shared DTOs (Pagination)
│   │   ├── filters/          # Exception filters (Prisma)
│   │   ├── interceptors/     # Logging interceptor
│   │   ├── middlewares/      # Security middleware
│   │   └── services/         # Prisma service
│   └── main.ts               # Application entry point
└── generated/
    └── prisma/               # Auto-generated Prisma Client
```

## 📦 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/refresh` | Refresh access token | No (requires refresh token cookie) |
| POST | `/api/auth/logout` | Logout and invalidate session | Yes |
| POST | `/api/auth/logout-all` | Logout from all devices | Yes |
| GET | `/api/auth/oauth/google` | Initiate Google OAuth | No |
| GET | `/api/auth/oauth/google/callback` | Google OAuth callback | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/users` | Get all users with pagination | Yes | ADMIN, USER |
| GET | `/api/users/:id` | Get user by ID | Yes | ADMIN, USER |
| PATCH | `/api/users/:id` | Update user | Yes | ADMIN, or own profile |
| PATCH | `/api/users/:id/password` | Update password | Yes | ADMIN, or own password |
| DELETE | `/api/users/:id` | Delete user | Yes | ADMIN |

**Query Parameters for GET /api/users:**
- `skip` (number): Number of records to skip (default: 0)
- `take` (number): Number of records to return (default: 10, max: 100, 0 = all)
- `role` (string): Filter by role name
- `isActive` (boolean): Filter by active status

### Role Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/roles` | Get all roles | Yes | ADMIN |
| GET | `/api/roles/:id` | Get role by ID | Yes | ADMIN |
| POST | `/api/roles` | Create new role | Yes | ADMIN |
| PATCH | `/api/roles/:id` | Update role | Yes | ADMIN |
| DELETE | `/api/roles/:id` | Delete role | Yes | ADMIN |

### Session Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/sessions` | Get all sessions | Yes | ADMIN |
| PATCH | `/api/sessions/:id/revoke` | Revoke a session | Yes | ADMIN |
| PATCH | `/api/sessions/user/:userId/revoke-all` | Revoke all user sessions | Yes | ADMIN |
| DELETE | `/api/sessions/:id` | Delete a session | Yes | ADMIN |
| DELETE | `/api/sessions/cleanup/expired` | Cleanup expired sessions | Yes | ADMIN |
| DELETE | `/api/sessions/cleanup/revoked` | Cleanup old revoked sessions | Yes | ADMIN |

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔧 Configuration

### Environment Variables

The application uses environment-specific `.env` files:
- `.env.development.local` - Development environment
- `.env.production.local` - Production environment
- `.env.example` - Template with all required variables

See `.env.example` for a complete list of configuration options.

### Database Configuration

This project uses a **dual approach** for database management:

#### Liquibase (Migrations & Seeding)
- **Purpose**: Database schema creation, migrations, and data seeding
- **Location**: `db/` directory
- **Changelog**: `db/db.changelog-master.xml`
- **Migration Scripts**: `db/migration-scripts/`

**Liquibase Commands:**

```bash
# Run all migrations (development)
npm run liquibase:update-dev

# Run all migrations (production)
npm run liquibase:update-prod

# Rollback last changeset (development)
npm run liquibase:rollback-dev

# Rollback last changeset (production)
npm run liquibase:rollback-prod
```

**Creating New Migrations:**
1. Create new XML file in `db/migration-scripts/` (e.g., `009-your-migration.xml`)
2. Add reference in `db/db.changelog-master.xml`
3. Run `npm run liquibase:update-dev`

#### Prisma (ORM)
- **Purpose**: Type-safe database access in application code
- **Location**: `prisma/schema.prisma`
- **Generated Client**: `generated/prisma/`

**Prisma Commands:**

```bash
# Generate Prisma Client (after Liquibase migrations)
npm run prisma:generate

# Pull schema from database to Prisma schema file
npm run prisma:db-pull

# Open Prisma Studio (database GUI)
npx prisma studio
```

**Important Notes:**
- Use **Liquibase** to create/modify database schema
- Use **Prisma** for querying data in your application code
- After running Liquibase migrations, run `prisma:db-pull` to sync Prisma schema
- Always generate Prisma Client after schema changes

#### Database Workflow

**When making schema changes:**

1. **Create Liquibase Migration**
   ```bash
   # Create new migration file in db/migration-scripts/
   # Example: 009-add-user-phone-field.xml
   ```

2. **Add to Changelog**
   ```xml
   <!-- db/db.changelog-master.xml -->
   <include file="migration-scripts/009-add-user-phone-field.xml" />
   ```

3. **Run Migration**
   ```bash
   npm run liquibase:update-dev
   ```

4. **Sync Prisma Schema**
   ```bash
   npm run prisma:db-pull
   ```

5. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

6. **Use in Code**
   ```typescript
   // Now you can use the new field with full TypeScript support
   const user = await prisma.user.findUnique({
     where: { id: userId },
     select: { phone: true } // TypeScript knows about 'phone'
   });
   ```

**Why This Approach?**
- **Liquibase**: Version control for database, handles complex migrations, rollbacks
- **Prisma**: Type-safe queries, excellent DX, auto-completion in IDE
- **Best of Both**: Database versioning + developer experience

### Security Configuration

**Rate Limiting:**
- Registration: 3 attempts per minute
- Login: 5 attempts per minute
- Default: 10 requests per 60 seconds

**JWT Configuration:**
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry
- Tokens stored in HTTP-only cookies

**Account Lockout:**
- Locks after 5 failed login attempts
- Lockout duration: configurable via database

## 🚀 Deployment

### Environment Preparation

1. Set `NODE_ENV=production`
2. Create `.env.production.local` with production values
3. Ensure PostgreSQL database is accessible
4. Set secure, random `JWT_SECRET`

### Build and Deploy

```bash
# Install dependencies
npm ci --only=production

# Run Liquibase migrations (creates tables and seeds data)
npm run liquibase:update-prod

# Pull database schema to Prisma
npm run prisma:db-pull

# Generate Prisma Client for type-safe database access
npm run prisma:generate

# Build the application
npm run build

# Start production server
npm run start:prod
```

### Using Docker 🐳 (Recommended)

Docker simplifies deployment and ensures consistency across environments.

```bash
# Production mode
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Rebuild after changes
npm run docker:build
```

**For complete Docker documentation**, including development mode, troubleshooting, and cloud deployment, see [DOCKER.md](DOCKER.md).

### Recommended Production Setup

- Use a process manager like **PM2**
- Set up **NGINX** as reverse proxy
- Enable **HTTPS** with Let's Encrypt
- Configure **PostgreSQL** connection pooling
- Set up log aggregation (e.g., ELK stack)
- Enable monitoring (e.g., Prometheus + Grafana)

## 📝 Common Tasks

### Creating a New User Manually

```typescript
// Use Prisma Studio or SQL
INSERT INTO "user" (email, password_hash, first_name, last_name, is_active)
VALUES ('admin@example.com', '$2b$10$...', 'Admin', 'User', true);

// Assign ADMIN role
INSERT INTO "user_role" (user_id, role_id)
VALUES ('user-uuid', 1); -- Assuming ADMIN role id is 1
```

### Revoking All Sessions for a User

```bash
# Via API (requires ADMIN role)
PATCH /api/sessions/user/:userId/revoke-all
```

### Cleaning Up Old Sessions

Sessions are automatically cleaned up via scheduled tasks, but you can manually trigger cleanup:

```bash
# Via API (requires ADMIN role)
DELETE /api/sessions/cleanup/expired
DELETE /api/sessions/cleanup/revoked?days=30
```

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Keep dependencies updated**: `npm audit fix`
4. **Use strong passwords** for database and admin accounts
5. **Enable CORS** only for trusted origins
6. **Monitor failed login attempts**
7. **Regularly review and revoke old sessions**
8. **Implement rate limiting** on all public endpoints
9. **Use environment variables** for all secrets
10. **Enable database backups**

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Passport](http://www.passportjs.org/) - Authentication middleware

## 📞 Support

For issues and questions:
- Create an issue in this repository
- Check existing issues for solutions
- Review the NestJS and Prisma documentation

## 🗺️ Roadmap

- [ ] Email verification
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Swagger/OpenAPI documentation
- [ ] Docker support
- [ ] CI/CD pipeline
- [ ] Comprehensive test coverage

---

Made with ❤️ using NestJS and Prisma
