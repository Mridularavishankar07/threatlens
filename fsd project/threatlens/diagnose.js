#!/usr/bin/env node

/**
 * ThreatLens Diagnostic Tool
 * Checks system requirements and identifies issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║      ThreatLens System Diagnostic Tool                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const checks = [];

// Helper functions
function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    checks.push({ status: '✅', description, details: output.trim().split('\n')[0] });
    return true;
  } catch (error) {
    checks.push({ status: '❌', description, details: 'Not found or error' });
    return false;
  }
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    checks.push({ status: '✅', description, details: 'Found' });
    return true;
  } else {
    checks.push({ status: '❌', description, details: 'Missing' });
    return false;
  }
}

function checkPort(port, description) {
  try {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    checks.push({ status: '✅', description, details: `Port ${port} is active (running)` });
    return true;
  } catch (error) {
    checks.push({ status: 'ℹ️', description, details: `Port ${port} is available` });
    return false;
  }
}

// Run checks
console.log('Running diagnostics...\n');

// 1. Check Node.js
runCommand('node --version', 'Node.js installed');

// 2. Check npm
runCommand('npm --version', 'npm installed');

// 3. Check MongoDB installation
let mongoInstalled = false;
try {
  const output = execSync('mongod --version', { encoding: 'utf8', stdio: 'pipe' });
  checks.push({ status: '✅', description: 'MongoDB installed', details: output.trim().split('\n')[0] });
  mongoInstalled = true;
} catch {
  let found = false;
  if (process.platform === 'win32') {
    try {
      const scOutput = execSync('sc query MongoDB', { encoding: 'utf8', stdio: 'pipe' });
      if (scOutput.includes('SERVICE_NAME: MongoDB')) {
        checks.push({ status: '✅', description: 'MongoDB installed', details: 'Windows Service (MongoDB) detected' });
        found = true;
        mongoInstalled = true;
      }
    } catch {}
    if (!found) {
      const defaultPath = 'C:\\Program Files\\MongoDB\\Server';
      if (fs.existsSync(defaultPath)) {
        checks.push({ status: '✅', description: 'MongoDB installed', details: `Found in ${defaultPath}` });
        found = true;
        mongoInstalled = true;
      }
    }
  }
  if (!found) {
    checks.push({ status: '❌', description: 'MongoDB installed', details: 'Not found in PATH or Windows services' });
  }
}

// 4. Check MongoDB connection
let mongoConnected = false;
try {
  execSync('node -e "const net = require(\'net\'); const s = net.createConnection(27017, \'127.0.0.1\', () => { s.destroy(); process.exit(0); }); s.on(\'error\', () => process.exit(1)); setTimeout(() => process.exit(1), 2000);"', { stdio: 'pipe' });
  checks.push({ status: '✅', description: 'MongoDB connection', details: 'Connected successfully (port 27017 active)' });
  mongoConnected = true;
} catch {
  try {
    execSync('mongosh --eval "db.version()" --quiet', { encoding: 'utf8', stdio: 'pipe' });
    checks.push({ status: '✅', description: 'MongoDB connection', details: 'Connected successfully' });
    mongoConnected = true;
  } catch {
    checks.push({ status: '❌', description: 'MongoDB connection', details: 'Cannot connect to port 27017 - service may not be running' });
  }
}

// 5. Check server dependencies
const serverDepsExist = checkFile('server/node_modules', 'Server dependencies');

// 6. Check client dependencies
checkFile('client/node_modules', 'Client dependencies');

// 7. Check .env file
const envExists = checkFile('server/.env', 'Server .env file');

// 8. Check if .env has required variables
if (envExists) {
  const envPath = path.join(__dirname, 'server/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['MONGO_URI', 'PORT'];
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName + '=')) {
      allVarsPresent = false;
      checks.push({ status: '❌', description: `Environment variable ${varName}`, details: 'Missing' });
    }
  }

  // JWT_SECRET is optional because the backend includes an automatic secure fallback
  if (envContent.includes('JWT_SECRET=')) {
    checks.push({ status: '✅', description: 'Environment variable JWT_SECRET', details: 'Configured in .env' });
  } else {
    checks.push({ status: 'ℹ️', description: 'Environment variable JWT_SECRET', details: 'Using built-in fallback key (no manual setup or external key required)' });
  }
  
  if (allVarsPresent) {
    checks.push({ status: '✅', description: 'Required environment variables', details: 'All present' });
  }
}

// 9. Check if database is seeded
if (mongoConnected && serverDepsExist) {
  try {
    const seedCheckCmd = `node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/threatlens').then(async () => { const count = await mongoose.connection.collection('users').countDocuments(); console.log(count); await mongoose.connection.close(); process.exit(0); }).catch(() => process.exit(1));"`;
    const userCountStr = execSync(seedCheckCmd, { cwd: path.join(__dirname, 'server'), encoding: 'utf8', stdio: 'pipe', timeout: 5000 }).trim();
    const userCount = parseInt(userCountStr, 10);
    if (userCount > 0) {
      checks.push({ status: '✅', description: 'Database seeded with demo users', details: `${userCount} users found in database` });
    } else {
      checks.push({ status: '❌', description: 'Database seeded with demo users', details: 'Database is empty (run: cd server && npm run seed)' });
    }
  } catch (err) {
    checks.push({ status: '⚠️', description: 'Database user check', details: 'Could not query users collection' });
  }
}

// 10. Check server ports
checkPort(5000, 'Backend server (port 5000)');
checkPort(3000, 'Frontend server (port 3000)');

// Display results
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║                 Diagnostic Results                       ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

checks.forEach(check => {
  console.log(`${check.status} ${check.description}`);
  if (check.details) {
    console.log(`   └─ ${check.details}`);
  }
});

// Summary and recommendations
const failed = checks.filter(c => c.status === '❌').length;
const warnings = checks.filter(c => c.status === '⚠️').length;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║                     Summary                              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

if (failed === 0 && warnings === 0) {
  console.log('✅ All checks passed! Your system is ready.');
  console.log('\nNext steps:');
  console.log('1. Start MongoDB: net start MongoDB (as Administrator)');
  console.log('2. Seed database: cd server && npm run seed');
  console.log('3. Start servers: Use start.bat or run manually');
} else {
  console.log(`⚠️  Issues found: ${failed} critical, ${warnings} warnings\n`);
  
  // Provide specific recommendations
  if (checks.some(c => c.description === 'MongoDB installed' && c.status === '❌')) {
    console.log('📥 MongoDB is not installed:');
    console.log('   • Download from: https://www.mongodb.com/try/download/community');
    console.log('   • Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas\n');
  }
  
  if (checks.some(c => c.description === 'MongoDB connection' && c.status === '❌')) {
    console.log('🔌 MongoDB is not running:');
    console.log('   • Start service: net start MongoDB (as Administrator)');
    console.log('   • Or check service status in Windows Services\n');
  }
  
  if (checks.some(c => c.description.includes('dependencies') && c.status === '❌')) {
    console.log('📦 Dependencies not installed:');
    console.log('   • Run: cd server && npm install');
    console.log('   • Run: cd client && npm install\n');
  }
  
  if (checks.some(c => c.description === 'Node.js installed' && c.status === '❌')) {
    console.log('📥 Node.js is not installed:');
    console.log('   • Download from: https://nodejs.org\n');
  }
}

console.log('\n💡 For detailed help, see SETUP_GUIDE.md');
console.log('🐛 For login issues specifically, check the "Troubleshooting" section\n');

process.exit(failed > 0 ? 1 : 0);
