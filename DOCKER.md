# 🐳 Docker Setup Guide

This guide explains how to use Docker with this NestJS starter template.

## 📋 What's Included

- **Dockerfile** - Multi-stage build for optimized production images
- **docker-compose.yml** - Orchestrates PostgreSQL + NestJS API
- **.dockerignore** - Excludes unnecessary files from Docker builds

## 🎯 What Docker Does

Docker packages your application with all its dependencies, ensuring:
- ✅ Consistent development environment for all team members
- ✅ Easy deployment to any server
- ✅ Isolation from other applications
- ✅ Quick onboarding for new developers

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Docker Compose (included with Docker Desktop)

### Option 1: Production Mode (Recommended for Testing)

Start the application with PostgreSQL:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

The API will be available at: `http://localhost:3000/api`

### Option 2: Development Mode (with Hot Reload)

For active development with file watching:

```bash
# Start with development profile
docker-compose --profile dev up -d api-dev

# View logs
docker-compose logs -f api-dev

# Stop
docker-compose --profile dev down
```

The development API will be available at: `http://localhost:3001/api`

## 📦 What Gets Built

### Dockerfile Stages

1. **Builder Stage** (`node:18-alpine`)
   - Installs all dependencies
   - Generates Prisma Client
   - Builds TypeScript to JavaScript

2. **Production Stage** (`node:18-alpine`)
   - Installs Liquibase for migrations
   - Copies only production dependencies
   - Runs as non-root user (security)
   - Optimized, minimal image size

## 🔧 Configuration

### Environment Variables

The `docker-compose.yml` includes default environment variables. For production:

1. **IMPORTANT**: Change the following in `docker-compose.yml`:
   ```yaml
   JWT_SECRET: change-this-to-a-secure-random-string-min-64-chars
   ```

2. Or create a `.env` file (recommended):
   ```bash
   # Copy example and edit
   cp .env.example .env

   # Docker Compose will automatically use it
   docker-compose up -d
   ```

### Google OAuth Setup

To use Google OAuth with Docker:

1. Update `GOOGLE_CALLBACK_URL` in docker-compose.yml:
   ```yaml
   GOOGLE_CALLBACK_URL: http://localhost:3000/api/auth/oauth/google/callback
   ```

2. Add your credentials:
   ```yaml
   GOOGLE_CLIENT_ID: your-actual-client-id
   GOOGLE_CLIENT_SECRET: your-actual-client-secret
   ```

## 🗄️ Database Management

### Access PostgreSQL

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U postgres -d starter_db

# Or use your favorite GUI tool:
# Host: localhost
# Port: 5432
# User: postgres
# Password: postgres
# Database: starter_db
```

### Run Migrations Manually

```bash
# Access API container
docker-compose exec api sh

# Run Liquibase migrations
cd db && node liquibase-update.js

# Generate Prisma Client
npx prisma generate
```

### View Data with Prisma Studio

```bash
# From your local machine (not container)
npx prisma studio

# Or from container
docker-compose exec api npx prisma studio
```

## 🛠️ Common Commands

### View Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

### Clean Up Everything
```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes (⚠️ deletes database data)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 or 5432 is already in use:

```yaml
# Edit docker-compose.yml
services:
  api:
    ports:
      - '3001:3000'  # Change left side only
  postgres:
    ports:
      - '5433:5432'  # Change left side only
```

### Database Connection Errors

```bash
# Ensure postgres is healthy
docker-compose ps

# Check logs
docker-compose logs postgres

# Wait for database to be ready
docker-compose up -d postgres
sleep 10
docker-compose up -d api
```

### Liquibase Failures

```bash
# Check if database is accessible
docker-compose exec api nc -zv postgres 5432

# Manual migration
docker-compose exec api sh
cd db && node liquibase-update.js
```

### Permission Errors

```bash
# Linux/Mac: Fix file permissions
sudo chown -R $USER:$USER .

# Or run as root (not recommended)
docker-compose exec -u root api sh
```

## 🚢 Deployment

### Build Production Image

```bash
# Build image
docker build -t nestjs-starter:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret \
  nestjs-starter:latest
```

### Push to Docker Hub

```bash
# Tag image
docker tag nestjs-starter:latest yourusername/nestjs-starter:latest

# Push to Docker Hub
docker push yourusername/nestjs-starter:latest
```

### Deploy to Cloud

The Docker image can be deployed to:
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**
- **Digital Ocean App Platform**
- **Heroku**
- **Railway**
- **Render**

Example for Railway:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 📊 Image Size

The multi-stage build keeps images small:
- **Builder stage**: ~500MB (not shipped)
- **Production stage**: ~250MB (what you deploy)

## 🔒 Security Best Practices

1. **Never commit** `.env` files with real credentials
2. **Change default passwords** in production
3. **Use secrets management** in production (AWS Secrets Manager, etc.)
4. **Run as non-root** (already configured)
5. **Scan images** for vulnerabilities:
   ```bash
   docker scan nestjs-starter:latest
   ```

## 💡 Tips

### Development Workflow

```bash
# Start in background
docker-compose up -d

# Make code changes (hot reload in dev mode)

# View logs in real-time
docker-compose logs -f api-dev

# Rebuild when needed
docker-compose up -d --build
```

### Production Testing

```bash
# Test production build locally
docker-compose -f docker-compose.yml up api

# Ensure migrations run correctly
# Check health endpoint
curl http://localhost:3000/api/health
```

### Database Persistence

Data is stored in a Docker volume named `postgres_data`:
```bash
# Backup data
docker-compose exec postgres pg_dump -U postgres starter_db > backup.sql

# Restore data
docker-compose exec -T postgres psql -U postgres starter_db < backup.sql
```

## 🎓 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## ❓ Need Help?

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify services are running: `docker-compose ps`
3. Test database connection
4. Review this guide's Troubleshooting section

---

**Note**: For local development without Docker, see the main [README.md](README.md) for standard setup instructions.
