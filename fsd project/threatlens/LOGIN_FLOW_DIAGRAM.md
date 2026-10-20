# ThreatLens Login Flow - Visual Diagram

## 🔄 Normal Login Flow (Success)

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. User enters credentials
       │    Email: arjun@student.college.edu
       │    Password: User@123
       ↓
┌──────────────────────────────────────────┐
│  LoginPage.jsx                           │
│  • Validates form                        │
│  • Calls login() from AuthContext       │
└──────┬───────────────────────────────────┘
       │
       │ 2. POST /api/auth/login
       │    { email, password }
       ↓
┌──────────────────────────────────────────┐
│  Vite Proxy (port 3000 → 5000)          │
│  Forwards to backend                     │
└──────┬───────────────────────────────────┘
       │
       │ 3. HTTP Request
       ↓
┌──────────────────────────────────────────┐
│  Express Server (port 5000)              │
│  • CORS middleware                       │
│  • Body parser                           │
│  • Routes to /api/auth                   │
└──────┬───────────────────────────────────┘
       │
       │ 4. Route matched: POST /api/auth/login
       ↓
┌──────────────────────────────────────────┐
│  Validation Middleware                   │
│  • Checks email format                   │
│  • Checks password present               │
└──────┬───────────────────────────────────┘
       │
       │ 5. Validation passed
       ↓
┌──────────────────────────────────────────┐
│  authController.login()                  │
│  • Normalizes email to lowercase         │
│  • Queries MongoDB                       │
└──────┬───────────────────────────────────┘
       │
       │ 6. Database query
       ↓
┌──────────────────────────────────────────┐
│  MongoDB (port 27017)                    │
│  Database: threatlens                    │
│  Collection: users                       │
└──────┬───────────────────────────────────┘
       │
       │ 7. User document found
       │    { _id, name, email, password (hash), role, ... }
       ↓
┌──────────────────────────────────────────┐
│  User Model                              │
│  • comparePassword() method              │
│  • bcrypt.compare(input, hash)          │
└──────┬───────────────────────────────────┘
       │
       │ 8. Password matches ✅
       ↓
┌──────────────────────────────────────────┐
│  Generate JWT Token                      │
│  • jwt.sign({ id: user._id })           │
│  • Secret: JWT_SECRET from .env         │
│  • Expiry: 7 days                       │
└──────┬───────────────────────────────────┘
       │
       │ 9. Return response
       │    { token, user: { id, name, email, role, ... } }
       ↓
┌──────────────────────────────────────────┐
│  Frontend receives response              │
│  • Stores token in localStorage         │
│  • Sets Authorization header            │
│  • Updates AuthContext                  │
└──────┬───────────────────────────────────┘
       │
       │ 10. Navigate to dashboard
       ↓
┌──────────────────────────────────────────┐
│  Success! User logged in                 │
│  Redirects to /dashboard or /admin      │
└──────────────────────────────────────────┘
```

---

## ❌ Failed Login Flow (What's Happening Now)

### Scenario 1: MongoDB Not Running

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       ↓
┌──────────────────────┐
│  Express Server      │
└──────┬───────────────┘
       │
       │ Query MongoDB
       ↓
┌──────────────────────┐
│  MongoDB             │
│  ❌ ECONNREFUSED     │ ← CONNECTION REFUSED
│  Service not running │
└──────┬───────────────┘
       │
       │ Error thrown
       ↓
┌──────────────────────────────────────┐
│  catch block in authController       │
│  res.status(500).json({              │
│    error: "Login failed..."          │ ← GENERIC ERROR
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Frontend shows:                     │
│  "Login failed. Please try again."   │ ← USER SEES THIS
└──────────────────────────────────────┘

FIX: net start MongoDB (as Administrator)
```

---

### Scenario 2: Database Empty (Not Seeded)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       ↓
┌──────────────────────┐
│  Express Server      │
└──────┬───────────────┘
       │
       │ Query MongoDB
       ↓
┌──────────────────────────────────────┐
│  MongoDB                             │
│  ✅ Connected                        │
│  ❌ User.findOne() returns null      │ ← NO USER FOUND
└──────┬───────────────────────────────┘
       │
       │ user = null
       ↓
┌──────────────────────────────────────┐
│  if (!user) check                    │
│  res.status(401).json({              │
│    error: "Invalid email or password"│ ← ERROR RETURNED
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Frontend shows:                     │
│  "Login failed. Please try again."   │ ← USER SEES THIS
└──────────────────────────────────────┘

FIX: npm run seed (in server folder)
```

---

### Scenario 3: Wrong Password

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { email: "...", password: "wrong123" }
       ↓
┌──────────────────────┐
│  Express Server      │
└──────┬───────────────┘
       │
       │ Query MongoDB
       ↓
┌──────────────────────┐
│  MongoDB             │
│  ✅ User found       │
└──────┬───────────────┘
       │
       │ Compare passwords
       ↓
┌──────────────────────────────────────┐
│  bcrypt.compare(                     │
│    "wrong123",                       │
│    "$2a$12$hashed_password..."      │
│  )                                   │
│  ❌ Returns false                    │ ← PASSWORD MISMATCH
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  if (!isMatch) check                 │
│  res.status(401).json({              │
│    error: "Invalid email or password"│ ← ERROR RETURNED
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Frontend shows:                     │
│  "Invalid email or password"         │ ← USER SEES THIS
└──────────────────────────────────────┘

FIX: Use correct password: User@123 or Admin@123
```

---

## 🔧 Diagnostic Flow

```
┌─────────────────────┐
│  Run: diagnose.js   │
└──────┬──────────────┘
       │
       ├─→ Check Node.js ──→ ✅ Found / ❌ Not found
       │
       ├─→ Check npm ──→ ✅ Found / ❌ Not found
       │
       ├─→ Check MongoDB ──→ ✅ Found / ❌ Not found
       │
       ├─→ Test MongoDB connection ──→ ✅ Connected / ❌ Cannot connect
       │
       ├─→ Check dependencies ──→ ✅ Installed / ❌ Missing
       │
       ├─→ Check .env file ──→ ✅ Exists / ❌ Missing
       │
       └─→ Check ports ──→ ⚠️ In use / ⚠️ Free
              │
              └─→ Generate Report with Recommendations
```

---

## 🧪 Authentication Test Flow

```
┌─────────────────────────┐
│  Run: test-auth.js      │
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Connect to MongoDB                     │
│  ✅ Success / ❌ ECONNREFUSED           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Query for test users:                  │
│  • admin@threatlens.io                  │
│  • arjun@student.college.edu            │
└──────┬──────────────────────────────────┘
       │
       ├─→ User found? ✅ / ❌ Not in database
       │
       ├─→ Account active? ✅ / ❌ Deactivated
       │
       ├─→ Test password with bcrypt
       │   ✅ Match / ❌ No match
       │
       ├─→ Generate JWT token
       │   ✅ Token created
       │
       └─→ Display detailed results
              │
              └─→ ✅ Login would succeed
                  ❌ Login would fail (with reason)
```

---

## 🛠️ Fix Flow

```
┌─────────────────────┐
│  Run: fix-login.bat │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 1: Check MongoDB Service          │
└──────┬──────────────────────────────────┘
       │
       ├─→ Running? → Continue
       │
       └─→ Not running? → net start MongoDB
              │
              ├─→ Success → Continue
              └─→ Fail → Show install instructions
       ↓
┌─────────────────────────────────────────┐
│  Step 2: Check Dependencies             │
└──────┬──────────────────────────────────┘
       │
       └─→ Missing? → npm install
       ↓
┌─────────────────────────────────────────┐
│  Step 3: Seed Database                  │
│  npm run seed                           │
└──────┬──────────────────────────────────┘
       │
       ├─→ Success → Continue
       └─→ Fail → Show connection help
       ↓
┌─────────────────────────────────────────┐
│  Step 4: Test Authentication            │
│  node test-auth.js                      │
└──────┬──────────────────────────────────┘
       │
       ├─→ Pass → ✅ Ready to login!
       └─→ Fail → Show specific issue
       ↓
┌─────────────────────────────────────────┐
│  Step 5: Instructions                   │
│  • Clear browser cache                  │
│  • Start servers                        │
│  • Login with demo credentials          │
└─────────────────────────────────────────┘
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Browser (http://localhost:3000)                     │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  React Application                             │  │   │
│  │  │  • LoginPage.jsx                              │  │   │
│  │  │  • AuthContext.jsx                            │  │   │
│  │  │  • api.js (Axios)                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │ POST /api/auth/login
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      VITE DEV SERVER                        │
│  Port 3000                                                  │
│  Proxy: /api → http://localhost:5000                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       SERVER SIDE                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express Server (http://localhost:5000)              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Middleware                                    │  │   │
│  │  │  • CORS                                        │  │   │
│  │  │  • Body Parser                                 │  │   │
│  │  │  • Rate Limiting                               │  │   │
│  │  │  • Helmet (Security)                           │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Routes                                        │  │   │
│  │  │  • /api/auth → authController                  │  │   │
│  │  │  • /api/scans → scanController                 │  │   │
│  │  │  • /api/training → trainingController          │  │   │
│  │  │  • /api/admin → adminController                │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Controllers                                   │  │   │
│  │  │  • authController.login()                      │  │   │
│  │  │  • Validates credentials                       │  │   │
│  │  │  • Generates JWT                               │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         │ mongodb://localhost:27017/threatlens
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MongoDB (port 27017)                                │   │
│  │  Database: threatlens                                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Collections                                   │  │   │
│  │  │  • users                                       │  │   │
│  │  │  • scans                                       │  │   │
│  │  │  • simulations                                 │  │   │
│  │  │  • trainingattempts                            │  │   │
│  │  │  • auditlogs                                   │  │   │
│  │  │  • blocklistentries                            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

When login works correctly, you should see:

### Backend Terminal:
```
POST /api/auth/login 200 - 234ms
```

### Browser Network Tab (F12 → Network):
```
Request URL: http://localhost:5000/api/auth/login
Status: 200 OK
Response: { token: "eyJhbG...", user: { ... } }
```

### Browser Console (F12 → Console):
```
No errors
localStorage contains: threatlens_token
```

### Browser Behavior:
```
✅ Redirects to /dashboard or /admin
✅ User name appears in header
✅ Protected routes accessible
```

---

## 🎯 Quick Reference

| Check This | Command | Expected Result |
|------------|---------|-----------------|
| MongoDB running | `sc query MongoDB` | STATUS: RUNNING |
| MongoDB connection | `mongosh` | Successfully connected |
| Users exist | `mongosh` → `use threatlens` → `db.users.count()` | 5 users |
| Backend running | `curl localhost:5000/api/health` | { "status": "ok" } |
| Frontend running | Open `localhost:3000` | App loads |

---

**Use this diagram to understand where the login is failing!**
