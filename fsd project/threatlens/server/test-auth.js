/**
 * Authentication Test Script
 * Tests login functionality directly
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const { generateToken } = require('./middleware/auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/threatlens';

async function testAuth() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test credentials
    const testCredentials = [
      { email: 'admin@threatlens.io', password: 'Admin@123' },
      { email: 'arjun@student.college.edu', password: 'User@123' }
    ];

    for (const cred of testCredentials) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing login: ${cred.email}`);
      console.log('='.repeat(60));

      // Find user
      const user = await User.findOne({ email: cred.email.toLowerCase() }).select('+password');
      
      if (!user) {
        console.log('❌ User not found in database');
        console.log('💡 Suggestion: Run database seeder - npm run seed');
        continue;
      }

      console.log('✅ User found in database');
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);

      // Check if account is active
      if (!user.isActive) {
        console.log('❌ Account is deactivated');
        continue;
      }

      // Test password
      console.log(`\n🔐 Testing password: "${cred.password}"`);
      const isMatch = await user.comparePassword(cred.password);
      
      if (!isMatch) {
        console.log('❌ Password does NOT match');
        console.log('🔍 Debug Info:');
        console.log(`   Stored hash: ${user.password.substring(0, 20)}...`);
        
        // Try manual bcrypt compare
        const manualCheck = await bcrypt.compare(cred.password, user.password);
        console.log(`   Manual bcrypt check: ${manualCheck ? '✅ PASS' : '❌ FAIL'}`);
        
        continue;
      }

      console.log('✅ Password matches!');

      // Generate token
      const token = generateToken(user._id);
      console.log('\n🎫 JWT Token generated:');
      console.log(`   ${token.substring(0, 50)}...`);

      // Prepare response data
      const responseUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        securityScore: user.securityScore,
        trainingCompleted: user.trainingCompleted,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      };

      console.log('\n✅ Login would succeed! Response data:');
      console.log(JSON.stringify(responseUser, null, 2));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Summary');
    console.log('='.repeat(60));

    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  Database is empty!');
      console.log('💡 Run: npm run seed');
    } else {
      console.log('\n✅ Database has users');
      const allUsers = await User.find().select('email role isActive');
      console.log('\n📋 All users:');
      allUsers.forEach(u => {
        console.log(`   • ${u.email} (${u.role}) - ${u.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('\n✅ Authentication test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB is not running. Solutions:');
      console.log('   1. Start MongoDB service: net start MongoDB (as Administrator)');
      console.log('   2. Or use MongoDB Atlas (cloud)');
      console.log('   3. Check connection string in .env file');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║         ThreatLens Authentication Test                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

testAuth();
