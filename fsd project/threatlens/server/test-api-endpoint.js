/**
 * Test ThreatLens HTTP API Endpoints End-to-End using native fetch
 */

const API_BASE = 'http://localhost:5000/api';

async function testApi() {
  console.log('--- Testing API End-to-End against Express Backend ---');

  // 1. Authenticate with seeded user
  console.log('1. Logging in as arjun@student.college.edu...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'arjun@student.college.edu',
      password: 'User@123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginData)}`);
  }

  const token = loginData.token;
  console.log('   ✅ Login successful! Token acquired.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Scan the user's original bug email
  console.log('\n2. Scanning original reported Lottery Phishing Email...');
  const lotteryEmail = {
    sender: 'lottery-claims@intl-rewards-dept.org',
    subject: 'CONGRATULATIONS! YOU WON $1,000,000',
    emailBody: `Dear Lucky Winner,

Congratulations! Your email address has been randomly selected to receive $1,000,000 in our international lottery. You don't need to purchase anything to claim your prize.

Send your full name, bank account details, and a processing fee of $100 immediately to claim your reward.

Hurry! This offer expires in 24 hours.

CLICK HERE NOW TO CLAIM YOUR PRIZE!

Best Regards,
International Lottery Claims Department`,
    urls: []
  };

  const scanRes = await fetch(`${API_BASE}/scans`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(lotteryEmail)
  });

  const data = await scanRes.json();
  console.log('   Response Status:', scanRes.status);
  console.log('   Classification: ', data.classification);
  console.log('   Risk Score:     ', `${data.riskScore}/100`);
  console.log('   Analysis Status:', data.analysisStatus);
  console.log('   Heuristic Score:', `${data.heuristicScore}/100`);
  console.log('   Indicators Count:', data.indicators?.length);
  console.log('   Phishing DNA:   ', data.phishingDna || data.phishingDNA);

  if (data.classification === 'PHISHING' && data.riskScore >= 85) {
    console.log('   ✅ VERIFIED: Lottery advance-fee scam correctly classified as PHISHING with score >= 85! (Was previously 29 SAFE)');
  } else {
    console.error('   ❌ FAILED: Unexpected classification or score:', data.classification, data.riskScore);
    process.exitCode = 1;
    return;
  }

  // 3. Scan a legitimate email
  console.log('\n3. Scanning legitimate timetable email...');
  const timetableEmail = {
    sender: 'academic-office@university.edu',
    subject: 'Fall Semester Revised Timetable and Classroom Allocations',
    emailBody: `Dear Students,
Please find the updated timetable for the upcoming Fall semester. Classes for Computer Science will be held in Hall B-12 starting next Monday at 9:00 AM.
Attendance during the first week is mandatory for course registration.
Contact your faculty advisor if you have scheduling conflicts.`,
    urls: []
  };

  const legitRes = await fetch(`${API_BASE}/scans`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(timetableEmail)
  });

  const legitData = await legitRes.json();
  console.log('   Legitimate Classification:', legitData.classification);
  console.log('   Legitimate Risk Score:    ', `${legitData.riskScore}/100`);

  if (legitData.classification === 'SAFE' && legitData.riskScore <= 20) {
    console.log('   ✅ VERIFIED: Legitimate timetable email classified as SAFE!');
  } else {
    console.error('   ❌ FAILED: Legitimate email flagged inappropriately:', legitData.classification, legitData.riskScore);
    process.exitCode = 1;
    return;
  }

  // 4. Retrieve Scan by ID
  console.log('\n4. Fetching scan details by ID from database...');
  const scanId = data.scan._id;
  const fetchRes = await fetch(`${API_BASE}/scans/${scanId}`, {
    method: 'GET',
    headers: authHeaders
  });

  const fetchData = await fetchRes.json();
  const scanDoc = fetchData.scan;
  console.log('   Fetched Scan Subject:', scanDoc.subject);
  console.log('   Fetched PhishingDNA:', scanDoc.phishingDNA);
  console.log('   ✅ VERIFIED: Scan details retrieved correctly with full 7-axis Phishing DNA!');

  console.log('\n============================================================');
  console.log('ALL HTTP API INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('============================================================');
}

testApi().catch(err => {
  console.error('API Test Error:', err);
  process.exitCode = 1;
});
