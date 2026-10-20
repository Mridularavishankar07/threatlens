# ThreatLens - Login Issue Troubleshooting Guide

## Quick Fix Checklist

Follow these steps in order:

### ✅ Step 1: Run Diagnostics
```bash
cd threatlens
node diagnose.js
```

This will check:
- Node.js and npm installation
- MongoDB installation and connection
- Project dependencies
- Environment configuration
- Server status

### ✅ Step 2: Ensure MongoDB is Running

**Windows:**
```bash
# Check if MongoDB service exists
sc query MongoDB

# Start MongoDB service (Run as Administrator)
net start MongoDB

# Verify it's running
sc query MongoDB
```

**If MongoDB is not installed:**
- Download: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### ✅ Step 3: Seed the Database
```bash
cd threatlens/server
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing data
👤 Created user: admin@threatlens.io
...
🎉 Database seeded successfully!
```

### ✅ Step 4: Test Authentication
```bash
cd threatlens/server
node test-auth.js
```

This script will:
- Connect to MongoDB
- Check if users exist
- Test password hashing/verification
- Simulate the login flow
- Show exactly what's wrong

### ✅ Step 5: Start the Servers

**Option A: Using start.bat**
```bash
cd threatlens
start.bat
```

**Option B: Manual start (recommended for debugging)**

Terminal 1 - Backend:
```bash
cd threatlens/server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd threatlens/client
npm run dev
```

Watch the backend terminal for errors during login attempts.

## Common Error Messages & Solutions

### Error: "Login failed. Please try again."

#### Cause 1: MongoDB Not Running
**Symptoms:**
- Backend shows: `MongoServerError: connect ECONNREFUSED`
- No database connection

**Solution:**
```bash
# Windows (as Administrator)
net start MongoDB

# Check status
sc query MongoDB
```

#### Cause 2: Database Not Seeded
**Symptoms:**
- Backend shows: `User not found`
- Login returns 401 Unauthorized

**Solution:**
```bash
cd threatlens/server
npm run seed
```

#### Cause 3: Wrong Password Format
**Symptoms:**
- Using wrong credentials
- Case sensitivity issues

**Solution:**
Use exact credentials:
- Email: `arjun@student.college.edu` (lowercase)
- Password: `User@123` (capital U)

Or:
- Email: `admin@threatlens.io`
- Password: `Admin@123` (capital A)

#### Cause 4: Backend Server Not Running
**Symptoms:**
- Browser shows: `Network Error` or `ERR_CONNECTION_REFUSED`
- Cannot reach http://localhost:5000

**Solution:**
```bash
# Start backend
cd threatlens/server
npm run dev

# Should see:
# 🚀 ThreatLens Server running on port 5000
# ✅ MongoDB connected
```

#### Cause 5: CORS Issues
**Symptoms:**
- Browser console shows CORS error
- Backend is running but frontend can't connect

**Solution:**
- Ensure backend is on port 5000
- Ensure frontend is on port 3000
- Check Vite proxy configuration

### Error: "MongoDB connection failed"

**Possible solutions:**

1. **MongoDB not installed**
   ```bash
   # Check if installed
   mongod --version
   
   # If not installed, download from:
   # https://www.mongodb.com/try/download/community
   ```

2. **MongoDB service not started**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   ```

3. **Wrong connection string**
   - Check `threatlens/server/.env`
   - Should be: `MONGO_URI=mongodb://localhost:27017/threatlens`

4. **Port 27017 in use by another process**
   ```bash
   # Check what's using port 27017
   netstat -ano | findstr :27017
   ```

5. **Use MongoDB Atlas instead**
   - Create free cluster at: https://www.mongodb.com/cloud/atlas
   - Get connection string
   - Update `.env` with your connection string

### Error: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Error: "npm not found" or "node not found"

**Solution:**
1. Download Node.js: https://nodejs.org (LTS version)
2. Install with default settings
3. Restart your terminal/command prompt
4. Verify: `node --version` and `npm --version`

### Error: Token Expired or Invalid

**Solution:**
```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

## Debugging Tips

### 1. Check Backend Logs
When you try to login, watch the backend terminal. You should see:
```
POST /api/auth/login 200
```

If you see:
```
POST /api/auth/login 401
```
The credentials are wrong or user doesn't exist.

### 2. Check Browser Console
Press F12 → Console tab. Look for:
- Network errors (red text)
- Failed API calls
- CORS errors

### 3. Check Network Tab
Press F12 → Network tab → Try to login:
- Look for `/api/auth/login` request
- Check Status Code (should be 200)
- Check Response body for error messages

### 4. Test Backend Directly
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"arjun@student.college.edu\",\"password\":\"User@123\"}"
```

### 5. Check Database Directly
```bash
# Connect to MongoDB
mongosh

# Switch to database
use threatlens

# Check if users exist
db.users.find().pretty()

# Check specific user
db.users.findOne({ email: "arjun@student.college.edu" })

# Count users
db.users.countDocuments()
```

## Step-by-Step Login Flow Debug

1. **Frontend sends login request**
   - Open DevTools → Network tab
   - Try to login
   - Look for `login` request
   - Check Request Headers and Payload

2. **Backend receives request**
   - Check backend terminal
   - Should log: `POST /api/auth/login`

3. **Backend queries database**
   - Check if MongoDB is connected
   - Check if user exists in database

4. **Backend compares password**
   - Uses bcrypt to compare hashed password
   - If wrong: returns 401

5. **Backend generates JWT token**
   - Creates token with user ID
   - Returns token + user data

6. **Frontend stores token**
   - Saves to localStorage
   - Sets Authorization header
   - Redirects to dashboard

## Complete Reset Procedure

If nothing works, do a complete reset:

```bash
# 1. Stop all servers (Ctrl+C in both terminals)

# 2. Clear MongoDB
mongosh
use threatlens
db.dropDatabase()
exit

# 3. Re-seed database
cd threatlens/server
npm run seed

# 4. Clear browser data
# Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();

# 5. Restart servers
cd threatlens/server
npm run dev

# In new terminal:
cd threatlens/client
npm run dev

# 6. Try logging in again
```

## Still Having Issues?

Run the diagnostic and test scripts:

```bash
# System diagnostic
cd threatlens
node diagnose.js

# Authentication test
cd threatlens/server
node test-auth.js
```

These scripts will pinpoint the exact issue and provide specific solutions.

## Contact & Support

If you've tried everything and still can't login:

1. Run `node diagnose.js` and save the output
2. Run `node test-auth.js` and save the output
3. Check backend terminal logs during login attempt
4. Check browser console (F12) during login attempt
5. Share all of the above for debugging assistance
