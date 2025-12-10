# NestJS Starter Template with Authentication & RBAC

A production-ready NestJS starter template featuring JWT authentication, OAuth integration, role-based access control, and comprehensive security features. Perfect for kickstarting your next API project.

## 📖 Using This Starter Template

This is a starter template, not a ready-to-use application. Follow the **Project Setup & Customization** section below to personalize it for your project.

### Quick Start Checklist

- [ ] Update `package.json` with your project name and info
- [ ] Update `docker-compose.yml` container names
- [ ] Create `.env.development.local` from `.env.example`
- [ ] Generate a secure JWT secret
- [ ] Update database credentials
- [ ] (Optional) Set up Google OAuth credentials
- [ ] Run database migrations
- [ ] Start the application

### TL;DR - Get Started in 5 Minutes

```bash
# 1. Clone the repo
git clone https://github.com/exitgh0st/labyrinth-nexus-api.git your-project
cd your-project

# 2. Copy environment file
cp .env.example .env.development.local

# 3. Generate JWT secret and update .env.development.local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Install dependencies
npm install

# 5. Start with Docker (easiest)
npm run docker:up

# Or without Docker:
# - Install PostgreSQL and Liquibase
# - Update DATABASE_URL in .env.development.local
# - Run: npm run liquibase:update-dev && npm run prisma:generate && npm run start:dev
```

**Important:** Don't forget to customize `package.json`, `docker-compose.yml`, and `README.md` with your project details!

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

## 🎯 Project Setup & Customization

Follow these steps to personalize this starter template for your project:

### Quick Reference: Files to Customize

| File | What to Update | Priority |
|------|---------------|----------|
| `package.json` | Project name, description, author, repository URL | **Required** |
| `docker-compose.yml` | Container names (3 places) | **Required** |
| `.env.development.local` | Database credentials, JWT secret, API keys | **Required** |
| `README.md` | Project title, description, and documentation | **Required** |
| `db/migration-scripts/004-seed-role-data.xml` | Default roles | Optional |
| `db/migration-scripts/005-seed-user-data.xml` | Admin user credentials | Optional |
| `db/migration-scripts/007-seed-user-role-data.xml` | User-role assignments | Optional |

### Step 1: Clone or Fork the Repository

```bash
# Option A: Clone directly
git clone https://github.com/exitgh0st/labyrinth-nexus-api.git
cd labyrinth-nexus-api

# Option B: Fork on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/your-project-name.git
cd your-project-name
```

### Step 2: Rename Your Project

Update the following files with your project information:

#### 2.1. Update `package.json`

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "Your project description",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-USERNAME/your-project-name"
  },
  "keywords": [
    "nestjs",
    "your-custom-keywords"
  ]
}
```

#### 2.2. Update `docker-compose.yml`

Replace container names with your project name:

```yaml
services:
  postgres:
    container_name: your-project-db  # Line 7

  api:
    container_name: your-project-api  # Line 29

  api-dev:
    container_name: your-project-api-dev  # Line 68
```

#### 2.3. Update `README.md`

Replace the title and description at the top of this file:

```markdown
# Your Project Name

Your project description goes here.
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.development.local

# Edit with your preferred text editor
# Windows: notepad .env.development.local
# Mac/Linux: nano .env.development.local
```

Update the following critical values:

#### 3.1. Database Configuration

```bash
# Change these to your database name and credentials
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://postgres:your_secure_password_here@localhost:5432/your_database_name
JDBC_DATABASE_URL=jdbc:postgresql://localhost:5432/your_database_name
```

#### 3.2. JWT Secret (CRITICAL!)

Generate a secure JWT secret:

```bash
# Run this command and copy the output
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then paste it in your `.env.development.local`:

```bash
JWT_SECRET=your_generated_secret_here
```

#### 3.3. Frontend URL

```bash
# Update to match your frontend application URL
FRONTEND_URL=http://localhost:4200
# Or for multiple origins (comma-separated):
# FRONTEND_URL=http://localhost:4200,http://localhost:3001
```

#### 3.4. Google OAuth (Optional)

If you want to use Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI: `http://localhost:3000/api/auth/oauth/google/callback`
6. Update your `.env.development.local`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback
```

### Step 4: Initialize Git for Your Project

```bash
# Remove the existing git history (optional)
rm -rf .git  # On Mac/Linux
# Or on Windows:
rmdir /s .git

# Initialize a new git repository
git init
git add .
git commit -m "Initial commit from NestJS starter template"

# Connect to your remote repository
git remote add origin https://github.com/YOUR-USERNAME/your-project-name.git
git branch -M main
git push -u origin main
```

### Step 5: Customize Database Seeds (Optional)

If you want to customize the initial data:

1. **Roles**: Edit `db/migration-scripts/004-seed-role-data.xml`
2. **Admin User**: Edit `db/migration-scripts/005-seed-user-data.xml`
3. **User Roles**: Edit `db/migration-scripts/007-seed-user-role-data.xml`

### Step 6: Clean Up Template Files (Optional)

Remove template-specific documentation files that you don't need:

```bash
# Remove these files if you don't need them
rm CRITICAL_FIXES_COMPLETED.md
rm STARTER_TEMPLATE_IMPROVEMENTS.md
rm DEVELOPER_GUIDE.md
rm DOCKER_EXPLAINED.md

# Keep DOCKER.md if you plan to use Docker
```

## 🛠️ Installation

Once you've completed the **Project Setup & Customization** steps above, follow these installation steps:

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

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

### 3. Start the application

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

## 🎓 What to Do After Setup

Once your application is running, here are some suggested next steps:

### 1. Test the Authentication

Try registering a new user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Understand the Project Structure

Explore the `src/` directory to understand how modules are organized:
- `auth/` - Authentication and authorization logic
- `user/` - User management endpoints
- `role/` - Role management endpoints
- `session/` - Session management endpoints
- `shared/` - Shared utilities, filters, and middleware

### 3. Add Your First Feature

Create a new module for your domain:

```bash
# Generate a new resource (controller + service + module)
npx nest generate resource products

# Or manually create a module
npx nest generate module products
npx nest generate controller products
npx nest generate service products
```

### 4. Customize the Database

Add new tables by creating Liquibase migration files in `db/migration-scripts/`. See existing files for examples.

### 5. Update the API Endpoints

Modify or add new endpoints based on your application requirements. The existing endpoints serve as examples of best practices.

### 6. Configure for Production

When ready to deploy:
- Create `.env.production.local` with production values
- Set `NODE_ENV=production`
- Use strong, unique secrets
- Enable HTTPS
- Set up proper CORS origins
- Review the **Deployment** section below

## 🔐 Default Roles

The system comes with two predefined roles (created via Liquibase seed scripts):
- **ADMIN** - Full access to all endpoints
- **USER** - Standard user access

You can customize these roles or add new ones by editing the seed data in `db/migration-scripts/004-seed-role-data.xml`

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

## ❓ Troubleshooting

### Common Setup Issues

**Issue: "Database connection failed"**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env.development.local`
- Ensure database exists: `createdb your_database_name`

**Issue: "JWT secret is not defined"**
- Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Add it to `.env.development.local` as `JWT_SECRET=...`

**Issue: "Liquibase migration failed"**
- Ensure JDBC_DATABASE_URL is correct in your `.env` file
- Check that Liquibase is installed: `liquibase --version`
- Try running migrations manually: `cd db && node liquibase-update.js`

**Issue: "Cannot find module '@prisma/client'"**
- Run: `npm run prisma:generate`
- If still failing: `npm install && npm run prisma:generate`

**Issue: "Port 3000 is already in use"**
- Change the PORT in your `.env.development.local`
- Or kill the process using port 3000

**Issue: Docker container won't start**
- Check logs: `npm run docker:logs`
- Ensure ports 3000 and 5432 are not in use
- Try rebuilding: `npm run docker:build`

## 🤝 Contributing

This is a starter template, but contributions to improve the template are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please focus on improvements that benefit all users of the template, such as:
- Bug fixes
- Security improvements
- Better documentation
- Additional useful features
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Passport](http://www.passportjs.org/) - Authentication middleware

## 📞 Support

### For Template Issues

If you encounter issues with the starter template itself:
- Check the **Troubleshooting** section above
- Create an issue in the [original repository](https://github.com/exitgh0st/labyrinth-nexus-api)
- Review existing issues for solutions

### For Your Project

Once you've customized this template for your project:
- Update this section with your own support information
- Add links to your project's issue tracker
- Include your team's contact information

### Learning Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Liquibase Documentation](https://docs.liquibase.com/)
- [Passport.js Documentation](http://www.passportjs.org/)

## 🗺️ Template Roadmap

Planned improvements for this starter template:

- [ ] Email verification system
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Swagger/OpenAPI documentation
- [x] Docker support
- [ ] CI/CD pipeline examples (GitHub Actions, GitLab CI)
- [ ] Comprehensive test examples
- [ ] WebSocket support example
- [ ] File upload example
- [ ] Pagination helper improvements

**Your Project Roadmap**: Replace this section with your own project roadmap after customization.

---

**Built with:** NestJS • Prisma • PostgreSQL • JWT • OAuth 2.0

**Template by:** [exitgh0st](https://github.com/exitgh0st)

**License:** MIT - Free to use for personal and commercial projects
