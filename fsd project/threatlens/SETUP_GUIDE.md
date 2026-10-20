# ThreatLens Setup Guide

## Prerequisites Installation

### 1. Install Node.js
- Download and install Node.js (v18 or higher) from: https://nodejs.org
- Verify installation: `node --version` and `npm --version`

### 2. Install MongoDB

#### Option A: MongoDB Community Server (Recommended)
1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Run the installer and follow these steps:
   - Choose "Complete" installation
   - Install MongoDB as a service
   - Install MongoDB Compass (optional GUI)
3. Verify installation:
   ```bash
   mongod --version
   ```

#### Option B: MongoDB Atlas (Cloud - No local install needed)
1. Create a free account at: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `.env` file with your connection string:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/threatlens
   ```

### 3. Start MongoDB Service

#### Windows:
```bash
# Start MongoDB service (run as Administrator)
net start MongoDB
```

#### Check if MongoDB is running:
```bash
# PowerShell
Get-Service -Name MongoDB

# Or check the connection
mongosh
```

## Project Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd threatlens

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Make sure `threatlens/server/.env` has correct settings:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/threatlens
JWT_SECRET=threatlens_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Seed the Database

```bash
cd threatlens/server
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing data
👤 Created user: admin@threatlens.io
👤 Created user: arjun@student.college.edu
...
🎉 Database seeded successfully!
```

### 4. Start the Application

#### Option A: Use the start script (Windows)
```bash
cd threatlens
start.bat
```

#### Option B: Manual start (works on all platforms)

**Terminal 1 - Backend:**
```bash
cd threatlens/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd threatlens/client
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## Demo Credentials

### Regular User
- Email: `arjun@student.college.edu`
- Password: `User@123`

### Admin User
- Email: `admin@threatlens.io`
- Password: `Admin@123`

## Troubleshooting

### Issue: "Login failed. Please try again."

**Possible Causes:**

1. **MongoDB not running**
   ```bash
   # Check MongoDB status
   net start MongoDB
   
   # Or check if port 27017 is listening
   netstat -ano | findstr :27017
   ```

2. **Database not seeded**
   ```bash
   cd threatlens/server
   npm run seed
   ```

3. **Wrong credentials**
   - Make sure you're using exact credentials (case-sensitive)
   - Default passwords: `User@123` or `Admin@123`

4. **Backend server not running**
   ```bash
   # Check if backend is running on port 5000
   netstat -ano | findstr :5000
   ```

### Issue: MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
- Start MongoDB service: `net start MongoDB`
- Check if MongoDB is installed: `mongod --version`
- Verify connection string in `.env`
- Try using MongoDB Atlas (cloud) instead

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: npm not found

**Solution:**
- Reinstall Node.js from https://nodejs.org
- Make sure to restart your terminal after installation
- Verify: `node --version` and `npm --version`

## API Health Check

Test if the backend is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Common Login Issues & Fixes

### 1. 401 Unauthorized
- **Cause:** Wrong email or password
- **Fix:** Double-check credentials, ensure database is seeded

### 2. 500 Internal Server Error
- **Cause:** MongoDB connection issue or server crash
- **Fix:** Check server logs, ensure MongoDB is running

### 3. Network Error / CORS
- **Cause:** Backend server not running or proxy misconfigured
- **Fix:** Ensure backend is running on port 5000, check Vite proxy config

### 4. Token Issues
- **Cause:** Invalid JWT secret or expired tokens
- **Fix:** Clear localStorage and try again
  ```javascript
  // In browser console
  localStorage.clear();
  location.reload();
  ```

## Development Tips

### View Server Logs
The backend server logs all requests. Watch for:
- `POST /api/auth/login` - Login attempts
- `GET /api/auth/me` - User profile fetches
- Look for error messages in red

### Check MongoDB Data
```bash
# Connect to MongoDB shell
mongosh

# Switch to threatlens database
use threatlens

# View users
db.users.find().pretty()

# Count users
db.users.countDocuments()

# Check specific user
db.users.findOne({ email: "arjun@student.college.edu" })
```

### Reset Everything
If things get broken, reset the database:
```bash
# Re-seed the database
cd threatlens/server
npm run seed
```

## Support

If you're still experiencing issues:
1. Check the server terminal for error messages
2. Open browser DevTools (F12) → Console and Network tabs
3. Verify MongoDB is running: `mongosh` should connect
4. Ensure all dependencies are installed: `npm install` in both server and client folders
