# 🐳 Docker Explained - Simple Guide

## What is Docker?

Think of Docker like **shipping containers** for your application:

- **Traditional way**: You ship your code and hope the server has the right Node.js version, PostgreSQL, etc.
- **Docker way**: You package EVERYTHING (code + Node.js + dependencies + database) into containers that work anywhere

## Why Use Docker?

### 1. **"Works on My Machine" Problem - SOLVED**
```
Developer: "It works on my machine!"
Docker: "Cool, let's ship your machine then!" 🚢
```

### 2. **New Developer Onboarding**

**Without Docker:**
```bash
1. Install Node.js (hope it's the right version)
2. Install PostgreSQL
3. Install Liquibase
4. Configure everything
5. Debug why it doesn't work
6. 2 hours later... maybe it works?
```

**With Docker:**
```bash
1. Install Docker
2. Run: npm run docker:up
3. Done! ✅ (2 minutes)
```

### 3. **Deployment is Easy**
```bash
# Your laptop
docker build -t myapp .

# Production server
docker run myapp

# It works EXACTLY the same!
```

## What You Created

### Files Created:

1. **Dockerfile** - Recipe for building your app container
2. **docker-compose.yml** - Orchestrates multiple containers (app + database)
3. **.dockerignore** - What to exclude from Docker builds
4. **DOCKER.md** - Complete usage guide

### What Each Does:

#### Dockerfile (The Recipe)
```dockerfile
# Stage 1: Build your app
- Install dependencies
- Compile TypeScript
- Generate Prisma Client

# Stage 2: Production image
- Copy only what's needed
- Install Liquibase
- Make it secure (non-root user)
- Add health check
```

**Result**: A ~250MB container with everything your app needs

#### docker-compose.yml (The Orchestrator)
```yaml
Services:
1. postgres:
   - PostgreSQL database
   - Automatic setup
   - Data persists in volume

2. api (production):
   - Your NestJS app
   - Runs migrations automatically
   - Connects to postgres

3. api-dev (development):
   - Hot reload enabled
   - Your code synced in real-time
   - Perfect for development
```

## How to Use

### For Development

**Quick Start:**
```bash
# Start everything
npm run docker:up

# Your app is now at: http://localhost:3000/api
# PostgreSQL is at: localhost:5432
```

**Development Mode (with hot reload):**
```bash
npm run docker:dev

# Now at: http://localhost:3001/api
# Changes to src/ reload automatically!
```

**View what's happening:**
```bash
npm run docker:logs
```

**Stop everything:**
```bash
npm run docker:down
```

### For Production

**Build and deploy:**
```bash
# Build the Docker image
docker build -t nestjs-starter:1.0 .

# Run it anywhere
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=... \
  nestjs-starter:1.0
```

## Real-World Examples

### Example 1: Local Development

```bash
# Monday morning
npm run docker:up          # Start work

# Make code changes...
# They auto-reload in dev mode!

# Friday evening
npm run docker:down        # Go home
```

### Example 2: Team Collaboration

```bash
# New team member joins
git clone <your-repo>
npm install
npm run docker:up

# They're productive in 5 minutes!
# No "install PostgreSQL" tutorials
# No "which Node version?" questions
```

### Example 3: Deploying to Production

```bash
# Build image
docker build -t myapp .

# Push to Docker Hub
docker push yourusername/myapp

# On production server
docker pull yourusername/myapp
docker run myapp

# Exact same as your laptop!
```

## What Happens When You Run Commands

### `npm run docker:up`

```
1. Docker reads docker-compose.yml
2. Starts PostgreSQL container
   - Creates database
   - Waits until healthy
3. Starts API container
   - Runs Liquibase migrations
   - Generates Prisma Client
   - Starts your app
4. Both containers talk to each other
5. You can access http://localhost:3000/api
```

### `npm run docker:dev`

```
1. Starts in development mode
2. Mounts your src/ folder into container
3. Watches for changes
4. Automatically restarts on changes
5. You can edit code normally!
```

## Common Use Cases

### 1. Testing Production Build Locally
```bash
# Run production build on your laptop
npm run docker:up

# Test it like it's in production
curl http://localhost:3000/api/health

# If it works here, it works in production!
```

### 2. Multiple Projects
```bash
# Project A (on port 3000)
cd project-a && npm run docker:up

# Project B (on port 3001)
cd project-b && npm run docker:up

# Both running, isolated from each other!
```

### 3. Quick Database Reset
```bash
# Destroy everything and start fresh
npm run docker:down -v  # -v deletes volumes (data)
npm run docker:up        # Fresh start!
```

## Understanding the Concepts

### Containers vs Virtual Machines

**Virtual Machine:**
- Entire operating system
- Heavy (GB of RAM)
- Slow to start (minutes)

**Docker Container:**
- Just your app + dependencies
- Lightweight (MB of RAM)
- Fast to start (seconds)

### Images vs Containers

**Image** = Recipe (Dockerfile)
- Read-only
- Like a class in OOP

**Container** = Running instance
- Writable
- Like an object in OOP

```bash
# Image is the blueprint
docker build -t myapp .

# Container is the running instance
docker run myapp         # Instance 1
docker run myapp         # Instance 2
```

### Volumes (Data Persistence)

Without volumes:
```bash
npm run docker:down
# ☠️ All database data is GONE!
```

With volumes (what you have):
```bash
npm run docker:down
npm run docker:up
# ✅ Data is still there!
```

## Benefits for Your Starter Template

### For Template Users:
1. **Easy setup** - `npm run docker:up` and they're running
2. **No conflicts** - Works even if they have different Node/Postgres versions
3. **Consistent** - Same environment for everyone
4. **Production-ready** - Can deploy the same container

### For You (Template Creator):
1. **Professional** - Shows you understand modern deployment
2. **Lower support** - Fewer "it doesn't work" issues
3. **Cloud-ready** - Easy to deploy to AWS, GCP, Azure, etc.

## Next Steps

1. **Try it out:**
   ```bash
   npm run docker:up
   npm run docker:logs
   ```

2. **Read full guide:** [DOCKER.md](DOCKER.md)

3. **Deploy:** Follow deployment section in DOCKER.md

## Quick Reference

| What you want | Command |
|---------------|---------|
| Start everything | `npm run docker:up` |
| Stop everything | `npm run docker:down` |
| View logs | `npm run docker:logs` |
| Development mode | `npm run docker:dev` |
| Rebuild after changes | `npm run docker:build` |
| Delete all data | `npm run docker:down -v` |

## Troubleshooting

**Port already in use?**
- Edit `docker-compose.yml`, change `"3000:3000"` to `"3001:3000"`

**Database not connecting?**
- Wait a few seconds for postgres to start
- Check logs: `npm run docker:logs postgres`

**Changes not reflecting?**
- Use dev mode: `npm run docker:dev`
- Or rebuild: `npm run docker:build`

## Resources

- Full guide: [DOCKER.md](DOCKER.md)
- Main README: [README.md](README.md)
- Docker docs: https://docs.docker.com/

---

**Remember**: Docker is just a tool to make your life easier. You don't need to be an expert - just run the commands and it works! 🚀
