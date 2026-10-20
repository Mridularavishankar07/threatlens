# 🛡️ ThreatLens - AI-Powered Phishing Detection Platform

ThreatLens is an intelligent email security platform that helps users identify and protect themselves from phishing attacks through AI-powered analysis and interactive training.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+) - [Download here](https://nodejs.org)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)

### Option 1: Automated Setup (Recommended)

```bash
cd threatlens
start-with-checks.bat
```

This script will:
- ✅ Check all system requirements
- ✅ Install dependencies automatically
- ✅ Start MongoDB service
- ✅ Seed the database
- ✅ Start both servers

### Option 2: Manual Setup

1. **Install dependencies**
   ```bash
   cd threatlens/server
   npm install
   
   cd ../client
   npm install
   ```

2. **Start MongoDB**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   ```

3. **Seed the database**
   ```bash
   cd threatlens/server
   npm run seed
   ```

4. **Start the servers**
   
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

5. **Access the application**
   - Open http://localhost:3000

## 🔐 Demo Credentials

### Regular User
- **Email:** `arjun@student.college.edu`
- **Password:** `User@123`

### Admin User
- **Email:** `admin@threatlens.io`
- **Password:** `Admin@123`

## ❗ Login Issues? Run This!

If you're experiencing "Login failed" errors:

```bash
cd threatlens
fix-login.bat
```

This will:
1. Check MongoDB status
2. Re-seed the database
3. Test authentication
4. Provide specific fix instructions

## 🔧 Troubleshooting Tools

### 1. System Diagnostics
```bash
cd threatlens
node diagnose.js
```

Checks:
- Node.js and npm installation
- MongoDB installation and connection
- Project dependencies
- Environment configuration
- Port availability

### 2. Authentication Test
```bash
cd threatlens/server
node test-auth.js
```

Tests:
- Database connection
- User existence
- Password verification
- Token generation
- Complete login flow

### 3. Detailed Troubleshooting
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions to common issues.

### 4. Setup Guide
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed installation and configuration instructions.

## 📁 Project Structure

```
threatlens/
├── server/                 # Backend (Express.js + MongoDB)
│   ├── controllers/       # Route handlers
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation
│   ├── services/         # Business logic
│   └── utils/            # Helper functions, seeder
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context (Auth, Toast)
│   │   └── services/     # API client
│   └── public/
├── diagnose.js           # System diagnostic tool
├── fix-login.bat         # Login issue fixer
├── start-with-checks.bat # Smart startup script
└── start.bat             # Simple startup script
```

## 🌟 Features

### For Users
- 📧 **Email Scanning** - Analyze emails for phishing threats
- 🎯 **Risk Scoring** - Get detailed risk assessments (0-100)
- 🔍 **Threat Indicators** - Identify specific phishing patterns
- 🏋️ **Training Simulations** - Interactive phishing awareness training
- 📊 **Security Score** - Track your security awareness progress
- 📈 **Scan History** - View all past email analyses

### For Admins
- 👥 **User Management** - Manage user accounts and roles
- 📊 **Analytics Dashboard** - View system-wide statistics
- 🔒 **Audit Logs** - Track all system activities
- 🚫 **Blocklist Management** - Maintain domain/email blocklists
- 📝 **Report Management** - Handle user-reported threats
- ⚙️ **Security Policies** - Configure detection parameters

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **bcrypt** password hashing
- **express-validator** input validation

### Frontend
- **React** + **Vite**
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide Icons**

## 🔒 Security Features

- **JWT-based authentication**
- **Password hashing with bcrypt**
- **Rate limiting** on API endpoints
- **Input validation** with express-validator
- **CORS configuration**
- **Helmet.js** security headers
- **Audit logging** for all actions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Scans
- `POST /api/scans` - Analyze email
- `GET /api/scans` - Get scan history
- `GET /api/scans/:id` - Get specific scan

### Training
- `GET /api/training/simulations` - Get training modules
- `POST /api/training/attempt` - Submit training attempt
- `GET /api/training/attempts` - Get training history

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/audit-logs` - Get audit logs
- And more...

## 🧪 Testing

### Test Backend Health
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

### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"arjun@student.college.edu\",\"password\":\"User@123\"}"
```

## 📝 Environment Variables

Create `server/.env` with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/threatlens
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Login failed" | Run `fix-login.bat` or see TROUBLESHOOTING.md |
| MongoDB connection error | Start MongoDB: `net start MongoDB` (as Admin) |
| Port 5000 in use | Kill process or change PORT in .env |
| npm not found | Install Node.js from nodejs.org |
| Dependencies error | Run `npm install` in server and client folders |

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed installation guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Comprehensive troubleshooting
- **[API Documentation](#api-endpoints)** - API endpoint reference

## 🤝 Getting Help

1. Run diagnostic: `node diagnose.js`
2. Check troubleshooting guide: `TROUBLESHOOTING.md`
3. Test authentication: `node server/test-auth.js`
4. Check server logs in the backend terminal
5. Check browser console (F12) for frontend errors

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

Built with modern web technologies to demonstrate secure authentication, risk analysis, and interactive security training.

---

**Need help?** Run `node diagnose.js` for system diagnostics or see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.
