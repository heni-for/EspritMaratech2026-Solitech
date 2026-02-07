# Asset Manager - MongoDB + Docker Setup

This project has been converted from PostgreSQL to MongoDB and is now 100% Docker-ready!

## Quick Start with Docker

### Prerequisites
- Docker installed ([download here](https://www.docker.com/))
- Docker Compose installed (usually comes with Docker Desktop)

### Running the Application

```bash
# Navigate to the project directory
cd Asset-Manager

# Start the entire stack (MongoDB + Application)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the stack
docker-compose down
```

That's it! The application will be available at **http://localhost:5000**

## What Docker Compose Does

The `docker-compose.yml` file sets up:

1. **MongoDB Service** (`mongodb`)
   - Image: `mongo:7.0-alpine`
   - Username: `admin`
   - Password: `admin123`
   - Database: `asset_manager`
   - Port: `27017` (exposed for local development)
   - Auto-initializes with demo users via `init-mongo.js`

2. **Application Service** (`app`)
   - Builds from the Dockerfile
   - Port: `5000` (exposed on your machine)
   - Connected to MongoDB over Docker network
   - Includes health checks

## Demo Accounts

After starting with Docker Compose, you can log in with these credentials:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| trainer1 | trainer123 | Trainer |
| ahmed | student123 | Student |

## Project Files Changed

### New/Modified Files:
- **Dockerfile** - Multi-stage build for optimized production image
- **docker-compose.yml** - Complete stack orchestration
- **.dockerignore** - Excludes unnecessary files from Docker build
- **init-mongo.js** - MongoDB initialization script with demo users
- **server/mongo-storage.ts** - MongoDB storage implementation
- **.env** - Updated for MongoDB connection string

### Updated Files:
- **server/index.ts** - Uses MemoryStore for sessions instead of PostgreSQL
- **server/storage.ts** - Initializes MongoDB or mock storage
- **package.json** - Added MongoDB dependency

## Development without Docker

If you prefer to run locally without Docker:

```bash
# Install dependencies
npm install

# Local MongoDB connection string in .env
DATABASE_URL=mongodb://localhost:27017/asset_manager

# Run development server
npm run dev
```

## Production Deployment

The Docker setup is optimized for production:
- Uses multi-stage builds to minimize image size
- Health checks for both services
- Proper networking between containers
- Persistent MongoDB volumes
- Environment variable configuration

### Building for Production:

```bash
# Build the Docker image
docker build -t asset-manager:latest .

# Run with your MongoDB instance
docker run -p 5000:5000 \
  -e DATABASE_URL=mongodb://your-mongodb-host:27017/asset_manager \
  -e NODE_ENV=production \
  asset-manager:latest
```

## Troubleshooting

### MongoDB won't connect
```bash
# Check if MongoDB container is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Rebuild the containers
docker-compose down
docker-compose up -d --build
```

### Port 5000 already in use
```bash
# Use a different port in docker-compose.yml
# Change "5000:5000" to "8080:5000" etc.
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d --build
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network Bridge           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────┐  ┌────────────┐  │
│  │  Node.js App     │  │  MongoDB   │  │
│  │  (Port: 5000)    │→ │ (Port: 27017)
│  │                  │  │            │  │
│  │ ─────────────────│  │ asset_mgr  │  │
│  │ Express Server   │  │ database   │  │
│  │ React Frontend   │  │            │  │
│  └──────────────────┘  └────────────┘  │
│                                         │
└─────────────────────────────────────────┘
      ↓                          ↓
   :5000 (localhost)    :27017 (localhost)
```

## Environment Variables

Configure via `.env` or `docker-compose.yml`:

```
DATABASE_URL=mongodb://admin:admin123@mongodb:27017/asset_manager?authSource=admin
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=production
PORT=5000
```

## Features

✅ MongoDB instead of PostgreSQL  
✅ Full Docker containerization  
✅ Docker Compose for easy orchestration  
✅ MongoDB auto-initialization with demo data  
✅ Health checks for reliability  
✅ Multi-stage Docker builds for optimization  
✅ MemoryStore sessions (no external session storage needed)  
✅ Persistent data volumes  

Enjoy! 🚀
