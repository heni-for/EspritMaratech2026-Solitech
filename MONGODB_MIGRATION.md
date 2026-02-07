# 🚀 Asset Manager - PostgreSQL → MongoDB + Docker Migration

## What Changed?

This project has been fully migrated from **PostgreSQL** to **MongoDB** and is now **100% Docker-ready**!

### Database Migration
- ✅ PostgreSQL → MongoDB conversion
- ✅ Schema adapted for MongoDB document model
- ✅ All CRUD operations implemented in MongoDB
- ✅ Fallback to mock storage if MongoDB unavailable

### Docker Implementation
- ✅ Dockerfile with multi-stage builds
- ✅ docker-compose.yml for complete stack
- ✅ MongoDB service with persistent volumes
- ✅ Auto-initialization with demo users
- ✅ Health checks for reliability

## Quick Start (30 seconds)

### Requirements
- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop))

### Windows Users
```bash
# Just double-click this file
docker-start.bat

# Then select option 1 to start
```

### Mac/Linux Users
```bash
chmod +x docker-start.sh
./docker-start.sh

# Then select option 1 to start
```

### Manual Start
```bash
cd Asset-Manager
docker-compose up -d

# Wait 30 seconds for MongoDB to initialize
# Open browser: http://localhost:5000
```

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| trainer1 | trainer123 | Trainer |
| ahmed | student123 | Student |

## File Structure

### New Files Added
```
📁 Asset-Manager/
├── 📄 Dockerfile           # Multi-stage Docker build
├── 📄 docker-compose.yml   # Complete stack orchestration
├── 📄 .dockerignore        # Docker build optimization
├── 📄 init-mongo.js        # MongoDB initialization script
├── 📄 docker-start.bat     # Windows quick start
├── 📄 docker-start.sh      # Mac/Linux quick start
├── 📄 DOCKER_SETUP.md      # Detailed Docker guide
├── 📄 MONGODB_MIGRATION.md # This file
└── server/
    ├── mongo-storage.ts    # MongoDB implementation
    └── storage.ts          # Storage abstraction layer
```

### Modified Files
- `server/index.ts` - Updated session store (MemoryStore)
- `server/storage.ts` - Now initializes MongoDB or mock storage
- `.env` - Updated for MongoDB connection
- `package.json` - Added MongoDB driver

## MongoDB Connection Details

### In Docker (Production)
```
mongodb://admin:admin123@mongodb:27017/asset_manager?authSource=admin
Port: 27017 (internal to Docker network)
```

### Locally (Development)
```
mongodb://localhost:27017/asset_manager
Port: 27017 (exposed on your machine)
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Docker Network (asset-manager-network)    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────┐     ┌──────────────────┐ │
│  │   Node.js Server     │────→│   MongoDB        │ │
│  │  (Port: 5000)        │     │  (Port: 27017)   │ │
│  │                      │     │                  │ │
│  │  ┌────────────────┐  │     │  Database:       │ │
│  │  │ Express API    │  │     │ asset_manager    │ │
│  │  │ React Frontend │  │     │                  │ │
│  │  │ Session Store  │  │     │ Collections:     │ │
│  │  └────────────────┘  │     │ • users          │ │
│  └──────────────────────┘     │ • students       │ │
│                               │ • trainings      │ │
│  ↓ localhost                  │ • levels         │ │
│  http://localhost:5000        │ • sessions       │ │
│                               │ • enrollments    │ │
│                               │ • attendance     │ │
│                               │ • certificates   │ │
│                               └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## MongoDB Collections

### users
```javascript
{
  _id: ObjectId(),
  username: String (unique),
  password: String (hashed),
  fullName: String,
  role: "admin" | "trainer" | "student",
  studentId: ObjectId() | null,
  createdAt: Date,
  updatedAt: Date
}
```

### students
```javascript
{
  _id: ObjectId(),
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: String,
  guardianName: String,
  guardianPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### trainings
```javascript
{
  _id: ObjectId(),
  name: String,
  description: String,
  startDate: String,
  status: "active" | "completed" | "archived",
  createdAt: Date,
  updatedAt: Date
}
```

(Similar schemas for levels, sessions, enrollments, attendance, certificates, trainerAssignments)

## Common Operations

### Start the Stack
```bash
docker-compose up -d
```

### Stop the Stack
```bash
docker-compose down
```

### View Application Logs
```bash
docker-compose logs -f app
```

### View MongoDB Logs
```bash
docker-compose logs -f mongodb
```

### Access MongoDB Shell
```bash
docker-compose exec mongodb mongosh -u admin -p admin123 asset_manager
```

### Reset Everything (Delete All Data)
```bash
docker-compose down -v
docker-compose up -d --build
```

### Rebuild Images
```bash
docker-compose up -d --build
```

## Troubleshooting

### Port 5000 Already in Use
Edit `docker-compose.yml`:
```yaml
app:
  ports:
    - "8080:5000"  # Changed from 5000:5000
```

### MongoDB Connection Refused
```bash
# Check if MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Rebuild everything
docker-compose down -v
docker-compose up -d --build
```

### "Cannot connect to MongoDB" Error
- Wait 30-40 seconds for MongoDB to fully start
- Check `.env` file has correct DATABASE_URL
- Verify MongoDB container is healthy: `docker-compose ps`

### Session Data Lost After Container Restart
This is normal! Sessions are stored in MemoryStore (in-app memory). For persistence, add session storage:

```bash
# To add Redis for persistent sessions:
# 1. Add Redis to docker-compose.yml
# 2. Update server/index.ts to use RedisStore
```

## Development without Docker

If you prefer local development:

```bash
# 1. Install MongoDB locally
# 2. Update .env
DATABASE_URL=mongodb://localhost:27017/asset_manager

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

## Production Deployment

### Using Docker
```bash
# Build image
docker build -t asset-manager:1.0 .

# Run with your MongoDB
docker run -p 5000:5000 \
  -e DATABASE_URL=mongodb://your-mongodb:27017/asset_manager \
  -e NODE_ENV=production \
  asset-manager:1.0
```

### Using Docker Compose on Server
```bash
# Update docker-compose.yml with your MongoDB URL
# Then run
docker-compose -f docker-compose.yml up -d
```

## Security Notes

⚠️ **For Production**:
1. Change `SESSION_SECRET` in `.env`
2. Change MongoDB credentials (admin:admin123)
3. Use strong password for DATABASE_URL
4. Enable SSL/TLS for MongoDB connection
5. Use environment-specific `.env` files
6. Keep Docker images updated

## Performance

- MongoDB is optimized for flexible schemas
- All queries use proper indexing
- Health checks ensure service reliability
- Multi-stage Docker builds minimize image size (~200MB)

## Future Improvements

- [ ] Add Redis for persistent session storage
- [ ] Implement MongoDB transactions for complex operations
- [ ] Add MongoDB backup/restore scripts
- [ ] Kubernetes deployment configs
- [ ] Database migration versioning
- [ ] Performance monitoring with MongoDB Atlas

## Support

For issues or questions:
1. Check `DOCKER_SETUP.md` for detailed Docker guide
2. Review logs: `docker-compose logs -f`
3. Ensure Docker Desktop is updated
4. Try resetting: `docker-compose down -v && docker-compose up -d --build`

---

**Happy Coding! 🎉**

Made with ❤️ for Asset Manager
