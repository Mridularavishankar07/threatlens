const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(resData);
        } catch {
          parsed = resData;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Comprehensive API Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /api/health');

    // 2. Auth Invalid
    const badLogin = await request('POST', '/api/auth/login', { email: 'bad@test.com', password: 'wrong' });
    assert(badLogin.status === 401, 'POST /api/auth/login (Invalid credentials -> 401)');

    // 3. Auth User Login
    const userLogin = await request('POST', '/api/auth/login', { email: 'arjun@student.college.edu', password: 'User@123' });
    assert(userLogin.status === 200 && userLogin.body.token, 'POST /api/auth/login (User valid)', JSON.stringify(userLogin.body));
    const userToken = userLogin.body.token;

    // 4. Auth Admin Login
    const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@threatlens.io', password: 'Admin@123' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'POST /api/auth/login (Admin valid)', JSON.stringify(adminLogin.body));
    const adminToken = adminLogin.body.token;

    // 5. Auth Me
    const me = await request('GET', '/api/auth/me', null, userToken);
    assert(me.status === 200 && me.body.user && me.body.user.email === 'arjun@student.college.edu', 'GET /api/auth/me');

    // 6. Scans stats
    const scanStats = await request('GET', '/api/scans/stats', null, userToken);
    assert(scanStats.status === 200, 'GET /api/scans/stats', JSON.stringify(scanStats.body));

    // 7. Scans list
    const scansList = await request('GET', '/api/scans', null, userToken);
    assert(scansList.status === 200 && Array.isArray(scansList.body.scans), 'GET /api/scans', JSON.stringify(scansList.body));

    // 8. Create scan
    const newScan = await request('POST', '/api/scans', {
      sender: 'service@paypal-account-security.tk',
      subject: 'Urgent: Account locked immediately',
      emailBody: 'Dear user, your account will be locked in 12 hours. Click here to verify your banking card: http://paypal-fake.tk/login',
      urls: ['http://paypal-fake.tk/login']
    }, userToken);
    assert(newScan.status === 201 && newScan.body.scan && newScan.body.scan._id, 'POST /api/scans (Create Scan)', JSON.stringify(newScan.body));
    const createdScanId = newScan.body?.scan?._id;

    // 9. Get created scan
    if (createdScanId) {
      const getScanRes = await request('GET', `/api/scans/${createdScanId}`, null, userToken);
      assert(getScanRes.status === 200 && getScanRes.body.scan, `GET /api/scans/${createdScanId}`);

      // 10. Scan Action
      const scanActionRes = await request('PATCH', `/api/scans/${createdScanId}/action`, { action: 'quarantine' }, userToken);
      assert(scanActionRes.status === 200 && scanActionRes.body.scan.userAction === 'quarantined', `PATCH /api/scans/${createdScanId}/action`);

      // 11. Create report on scan
      const reportRes = await request('POST', '/api/reports', { scanId: createdScanId, reason: 'False positive check' }, userToken);
      assert(reportRes.status === 201, 'POST /api/reports', JSON.stringify(reportRes.body));
    }

    // 12. Training simulations
    const simList = await request('GET', '/api/training', null, userToken);
    assert(simList.status === 200 && Array.isArray(simList.body.simulations), 'GET /api/training', JSON.stringify(simList.body));

    // 13. Training progress
    const trainProgress = await request('GET', '/api/training/progress', null, userToken);
    assert(trainProgress.status === 200, 'GET /api/training/progress', JSON.stringify(trainProgress.body));

    // 14. Training attempt
    if (simList.body?.simulations?.length > 0) {
      const simId = simList.body.simulations[0]._id;
      const attemptRes = await request('POST', `/api/training/${simId}/attempt`, { selectedAction: 'report', timeSpent: 30 }, userToken);
      assert(attemptRes.status === 200 && typeof attemptRes.body.correct === 'boolean', `POST /api/training/${simId}/attempt`);
    }

    // 15. Emails Inbox
    const inbox = await request('GET', '/api/emails', null, userToken);
    assert(inbox.status === 200, 'GET /api/emails', JSON.stringify(inbox.body));

    // 16. Reports list
    const reportsList = await request('GET', '/api/reports', null, userToken);
    assert(reportsList.status === 200, 'GET /api/reports', JSON.stringify(reportsList.body));

    // 17. Admin access control (user should be rejected with 403)
    const forbiddenAdmin = await request('GET', '/api/admin/dashboard', null, userToken);
    assert(forbiddenAdmin.status === 403, 'GET /api/admin/dashboard (Forbidden for normal user)');

    // 18. Admin dashboard
    const adminDash = await request('GET', '/api/admin/dashboard', null, adminToken);
    assert(adminDash.status === 200, 'GET /api/admin/dashboard (Admin authorized)', JSON.stringify(adminDash.body));

    // 19. Admin analytics
    const adminAnalytics = await request('GET', '/api/admin/analytics', null, adminToken);
    assert(adminAnalytics.status === 200, 'GET /api/admin/analytics', JSON.stringify(adminAnalytics.body));

    // 20. Admin users
    const adminUsers = await request('GET', '/api/admin/users', null, adminToken);
    assert(adminUsers.status === 200 && Array.isArray(adminUsers.body.users), 'GET /api/admin/users');

    // 21. Admin scans
    const adminScans = await request('GET', '/api/admin/scans', null, adminToken);
    assert(adminScans.status === 200 && Array.isArray(adminScans.body.scans), 'GET /api/admin/scans');

    // 22. Admin simulations
    const adminSims = await request('GET', '/api/admin/simulations', null, adminToken);
    assert(adminSims.status === 200 && Array.isArray(adminSims.body.simulations), 'GET /api/admin/simulations');

    // 23. Admin reports
    const adminReports = await request('GET', '/api/admin/reports', null, adminToken);
    assert(adminReports.status === 200 && Array.isArray(adminReports.body.reports), 'GET /api/admin/reports');

    // 24. Admin audit logs
    const auditLogs = await request('GET', '/api/admin/audit-logs', null, adminToken);
    assert(auditLogs.status === 200 && Array.isArray(auditLogs.body.logs), 'GET /api/admin/audit-logs');

    // 25. Admin blocklist
    const blocklist = await request('GET', '/api/admin/blocklist', null, adminToken);
    assert(blocklist.status === 200 && Array.isArray(blocklist.body.entries), 'GET /api/admin/blocklist');

    // 26. Admin policy
    const policy = await request('GET', '/api/admin/policy', null, adminToken);
    assert(policy.status === 200 && policy.body.policy, 'GET /api/admin/policy');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);

  } catch (err) {
    console.error('Fatal error running tests:', err);
  }
}

runTests();
