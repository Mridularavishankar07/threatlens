const Email = require('../models/Email');
const Scan = require('../models/Scan');
const { analyzeEmail } = require('../services/analysisEngine');
const { createAuditLog } = require('../utils/auditHelper');

// Demo emails injected into every new user's inbox on first load
const DEMO_EMAILS = [
  {
    fromName: 'SBI Security Team',
    fromAddress: 'security-alert@sbi-banking-secure.tk',
    subject: 'URGENT: Your SBI Account Has Been Suspended',
    body: `Dear Valued Customer,

We have detected suspicious activity on your State Bank of India account. To protect your funds, we have temporarily suspended your account.

To reactivate your account immediately, please click the link below and verify your credentials within 24 hours or your account will be permanently closed.

VERIFY ACCOUNT NOW: http://sbi-secure-verify.tk/login

You will need to provide:
- Account number
- Password
- OTP
- Debit card details

Failure to respond within 24 hours will result in permanent account closure.

Regards,
SBI Security Team`,
    urls: ['http://sbi-secure-verify.tk/login'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'Google Security',
    fromAddress: 'no-reply@google-accounts-security.com',
    subject: 'Action Required: Verify your Google Account',
    body: `Hi there,

We received a request to reset the password for your Google Account. If you made this request, click the button below to proceed.

If you didn't make this request, your account may be compromised. Click the link below to secure your account immediately:

http://google-accounts-security.com/reset?token=xR7yK9mN2pQ

This link expires in 15 minutes.

Security Team
Google`,
    urls: ['http://google-accounts-security.com/reset'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'HR Department',
    fromAddress: 'hr-recruitment@jobs-global-hiring.xyz',
    subject: 'Congratulations! ₹50,000/month WFH Position Confirmed',
    body: `Dear Candidate,

Congratulations! After reviewing thousands of applications, you have been selected for an exciting Work From Home opportunity.

Position: Data Entry Specialist
Salary: ₹50,000 per month
Working Hours: 2-3 hours per day

To secure your position, you need to pay a refundable registration fee of ₹2,999 and provide your Aadhaar and PAN card details.

Send payment to UPI ID: hiring@scam within 48 hours.

HR Team, Global Hiring Solutions`,
    urls: [],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'College Library',
    fromAddress: 'library@university.edu',
    subject: 'Library Membership Renewed for 2024-25',
    body: `Dear Student,

Your college library membership has been successfully renewed for the academic year 2024-25.

Membership ID: LIB-2024-4872
Valid until: May 31, 2025

You can now access all digital and physical resources during library hours (9 AM – 8 PM, Mon–Sat).

For assistance, contact library@university.edu or visit the library desk.

Best regards,
Library Administration`,
    urls: ['https://library.university.edu/portal'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'Netflix Billing',
    fromAddress: 'billing@netflix-account-services.com',
    subject: 'Your Netflix account has been suspended — Update payment now',
    body: `Hi Netflix Member,

We were unable to process your latest payment and your account has been temporarily suspended.

To restore access to your account, please update your payment information:
https://netflix-account-services.com/billing/update

If you don't update within 24 hours, your subscription will be cancelled and your viewing history will be deleted permanently.

Netflix Support`,
    urls: ['https://netflix-account-services.com/billing/update'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'Coursera',
    fromAddress: 'noreply@coursera.org',
    subject: 'Certificate Ready: Machine Learning Specialization',
    body: `Congratulations!

You have successfully completed the Machine Learning Specialization on Coursera.

Your certificate is now available in your dashboard. You can share it directly to LinkedIn or download the PDF.

Course: Machine Learning Specialization
Instructor: Andrew Ng
Completed: With Distinction

View your certificate at: https://www.coursera.org/account/accomplishments

Keep learning!
The Coursera Team`,
    urls: ['https://www.coursera.org/account/accomplishments'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'Amazon Fraud Prevention',
    fromAddress: 'orders@amazon-customer-service.net',
    subject: 'Order Confirmed: iPhone 15 Pro — ₹1,24,999 charged',
    body: `Hello,

Thank you for your order on Amazon.in

Order #402-8834721-2948271
Item: Apple iPhone 15 Pro (256GB, Natural Titanium)
Amount: ₹1,24,999

Payment charged to card ending in **4521.

If you did NOT place this order, call our Fraud Prevention line immediately: +91-8800-AMAZON or click below to cancel:

Cancel Order: http://amazon-customer-service.net/cancel?order=402-8834721

Act within 2 hours for a full refund.

Amazon Customer Service`,
    urls: ['http://amazon-customer-service.net/cancel'],
    attachments: [],
    isDemo: true
  },
  {
    fromName: 'National Scholarship Board',
    fromAddress: 'scholarship@national-edu-board.xyz',
    subject: 'You have been awarded ₹1,00,000 National Merit Scholarship',
    body: `Dear Student,

Congratulations! Based on your academic performance, you have been selected to receive the National Merit Scholarship of ₹1,00,000.

To claim your scholarship you must:
1. Pay a processing fee of ₹500 (refundable)
2. Submit your bank account details for direct transfer
3. Upload scanned copies of Aadhaar and PAN

Claim here: http://national-scholarship-claim.xyz/apply

Offer expires in 72 hours.

National Scholarship Board`,
    urls: ['http://national-scholarship-claim.xyz/apply'],
    attachments: [],
    isDemo: true
  }
];

// GET /api/emails - Get user's inbox
const getInbox = async (req, res) => {
  try {
    const { folder = 'inbox', page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Seed demo emails on first visit
    const count = await Email.countDocuments({ userId });
    if (count === 0) {
      const demoEmailDocs = DEMO_EMAILS.map((e, i) => ({
        ...e,
        userId,
        receivedAt: new Date(Date.now() - i * 3600000 * 2) // stagger by 2 hours
      }));
      await Email.insertMany(demoEmailDocs);
    }

    const query = { userId, folder };
    const total = await Email.countDocuments(query);
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-body -htmlBody'); // body excluded from list view

    const unreadCount = await Email.countDocuments({ userId, folder: 'inbox', isRead: false });

    res.json({
      emails,
      unreadCount,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (err) {
    console.error('getInbox error:', err);
    res.status(500).json({ error: 'Failed to fetch inbox.' });
  }
};

// GET /api/emails/:id - Get single email (marks as read)
const getEmail = async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('scanId');

    if (!email) return res.status(404).json({ error: 'Email not found.' });

    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json({ email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email.' });
  }
};

// POST /api/emails/:id/scan - Scan an inbox email
const scanInboxEmail = async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user._id });
    if (!email) return res.status(404).json({ error: 'Email not found.' });

    // Run analysis
    const analysisResult = await analyzeEmail({
      sender: email.fromAddress,
      subject: email.subject,
      emailBody: email.body,
      urls: email.urls || [],
      attachmentName: email.attachments?.[0]?.name || ''
    });

    // Save scan
    const scan = await Scan.create({
      userId: req.user._id,
      sender: email.fromAddress,
      subject: email.subject,
      emailBody: email.body,
      urls: email.urls || [],
      attachmentName: email.attachments?.[0]?.name || '',
      classification: analysisResult.classification,
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      threatIndicators: analysisResult.threatIndicators,
      phishingDNA: analysisResult.phishingDNA,
      explanation: analysisResult.explanation,
      detailedAnalysis: analysisResult.detailedAnalysis,
      recommendations: analysisResult.recommendations,
      analysisMethod: analysisResult.analysisMethod
    });

    // Link scan to email
    email.scanId = scan._id;
    email.scanStatus = analysisResult.classification;
    // Auto-quarantine high-risk emails
    if (analysisResult.classification === 'phishing' && analysisResult.riskScore >= 70) {
      email.folder = 'quarantine';
      scan.isQuarantined = true;
      scan.userAction = 'quarantined';
      await scan.save();
    }
    await email.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'SCAN_CREATED',
      category: 'scan',
      description: `Scanned inbox email: "${email.subject}" — Result: ${analysisResult.classification.toUpperCase()} (${analysisResult.riskScore}/100)`,
      metadata: { scanId: scan._id, classification: analysisResult.classification, riskScore: analysisResult.riskScore },
      req
    });

    res.status(201).json({ message: 'Email scanned successfully', scan, email });
  } catch (err) {
    console.error('scanInboxEmail error:', err);
    res.status(500).json({ error: 'Failed to scan email.' });
  }
};

// PATCH /api/emails/:id/action - Quarantine, mark safe, move to trash
const emailAction = async (req, res) => {
  try {
    const { action } = req.body;
    const email = await Email.findOne({ _id: req.params.id, userId: req.user._id });
    if (!email) return res.status(404).json({ error: 'Email not found.' });

    if (action === 'quarantine') {
      email.folder = 'quarantine';
      if (email.scanId) {
        await Scan.findByIdAndUpdate(email.scanId, { isQuarantined: true, userAction: 'quarantined' });
      }
    } else if (action === 'mark_safe') {
      email.folder = 'inbox';
      email.scanStatus = 'safe';
      if (email.scanId) {
        await Scan.findByIdAndUpdate(email.scanId, { isQuarantined: false, userAction: 'marked_safe' });
      }
    } else if (action === 'trash') {
      email.folder = 'trash';
    } else if (action === 'restore') {
      email.folder = 'inbox';
    } else if (action === 'star') {
      email.isStarred = !email.isStarred;
    } else {
      return res.status(400).json({ error: 'Invalid action.' });
    }

    await email.save();
    res.json({ message: 'Action applied successfully.', email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply action.' });
  }
};

// DELETE /api/emails/:id - Permanently delete
const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!email) return res.status(404).json({ error: 'Email not found.' });
    res.json({ message: 'Email deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete email.' });
  }
};

// POST /api/emails - Compose/submit a new email for ingestion
const submitEmail = async (req, res) => {
  try {
    const { fromName, fromAddress, subject, body, urls, attachments } = req.body;

    const email = await Email.create({
      userId: req.user._id,
      fromName: fromName || '',
      fromAddress,
      subject,
      body,
      urls: urls || [],
      attachments: attachments || [],
      isDemo: false,
      folder: 'inbox'
    });

    res.status(201).json({ message: 'Email added to inbox.', email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add email.' });
  }
};

module.exports = { getInbox, getEmail, scanInboxEmail, emailAction, deleteEmail, submitEmail };
