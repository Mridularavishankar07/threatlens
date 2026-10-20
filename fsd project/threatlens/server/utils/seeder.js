const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Scan = require('../models/Scan');
const Simulation = require('../models/Simulation');
const TrainingAttempt = require('../models/TrainingAttempt');
const Email = require('../models/Email');
const AuditLog = require('../models/AuditLog');
const BlocklistEntry = require('../models/BlocklistEntry');
const SecurityPolicy = require('../models/SecurityPolicy');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/threatlens';

const users = [
  {
    name: 'Admin User',
    email: 'admin@threatlens.io',
    password: 'Admin@123',
    role: 'admin',
    securityScore: 95
  },
  {
    name: 'Arjun Sharma',
    email: 'arjun@student.college.edu',
    password: 'User@123',
    role: 'user',
    securityScore: 72
  },
  {
    name: 'Priya Mehta',
    email: 'priya.mehta@gmail.com',
    password: 'User@123',
    role: 'user',
    securityScore: 85
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@company.in',
    password: 'User@123',
    role: 'user',
    securityScore: 58
  },
  {
    name: 'Sneha Pillai',
    email: 'sneha.pillai@outlook.com',
    password: 'User@123',
    role: 'user',
    securityScore: 91
  }
];

const simulations = [
  {
    title: 'SBI Bank Account Suspension Alert',
    category: 'banking-scam',
    difficulty: 'beginner',
    emailContent: {
      sender: 'security-alert@sbi-banking-secure.tk',
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
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the verification link immediately', action: 'open-link' },
      { key: 'B', label: 'Report this email as phishing', action: 'report' },
      { key: 'C', label: 'Reply asking for more details', action: 'reply' },
      { key: 'D', label: 'Ignore it and do nothing', action: 'ignore' }
    ],
    warningSigns: [
      'Sender domain ".tk" is a high-risk free domain',
      'Real banks never ask for OTP/password via email',
      'Creates artificial urgency with 24-hour deadline',
      'Asks for debit card details over email',
      'Domain "sbi-banking-secure.tk" is NOT an official SBI domain'
    ],
    explanation: 'This is a classic bank impersonation phishing attack. The email creates urgency by threatening account closure. Real SBI (or any bank) will NEVER ask for your password, OTP, or card details via email. The sender domain ".tk" is a known free hosting domain frequently used by scammers. Always verify directly with your bank by calling their official number.',
    points: 15
  },
  {
    title: 'Fake Job Offer - Work From Home',
    category: 'fake-job-offer',
    difficulty: 'beginner',
    emailContent: {
      sender: 'hr-recruitment@jobs-global-hiring.xyz',
      subject: 'Congratulations! You have been selected for a ₹50,000/month WFH position',
      body: `Dear Candidate,

Congratulations! After reviewing thousands of applications, you have been selected for an exciting Work From Home opportunity.

Position: Data Entry Specialist
Salary: ₹50,000 per month
Working Hours: 2-3 hours per day

To secure your position, you need to:
1. Pay a refundable registration fee of ₹2,999
2. Provide your Aadhaar and PAN card details for verification
3. Complete the joining formalities within 48 hours

Send payment to: UPI ID: hiring@scam (This position has limited seats!)

Reply immediately to confirm your selection!

HR Team
Global Hiring Solutions`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Pay the registration fee to secure the job', action: 'open-link' },
      { key: 'B', label: 'Report this as a scam immediately', action: 'report' },
      { key: 'C', label: 'Reply to get more information', action: 'reply' },
      { key: 'D', label: 'Ignore and delete', action: 'ignore' }
    ],
    warningSigns: [
      'No application was submitted to this company',
      'Asks for registration fee — legitimate jobs never charge candidates',
      'Unrealistic salary (₹50,000/month for 2-3 hours)',
      'Requests Aadhaar and PAN for "verification" — identity theft risk',
      'Creates urgency with "limited seats"'
    ],
    explanation: 'This is an advance-fee fraud / fake job scam. Legitimate employers NEVER ask candidates to pay registration, processing, or security fees. Requests for Aadhaar and PAN combined with fee payment is a classic identity theft + financial fraud combination.',
    points: 15
  },
  {
    title: 'Google Account Password Reset',
    category: 'password-reset',
    difficulty: 'intermediate',
    emailContent: {
      sender: 'no-reply@google-accounts-security.com',
      subject: 'Action Required: Verify your Google Account password',
      body: `Hi there,

We received a request to reset the password for your Google Account. If you made this request, click the button below to proceed.

If you didn't make this request, your account may be compromised. Click the link below to secure your account immediately:

http://google-accounts-security.com/reset?token=xR7yK9mN2pQ

This link expires in 15 minutes.

If you did not request a password reset, we recommend you verify your account to prevent unauthorized access.

Security Team
Google`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the link to secure my account', action: 'open-link' },
      { key: 'B', label: 'Mark as phishing and report to Google', action: 'report' },
      { key: 'C', label: 'Reply to confirm I didn\'t request it', action: 'reply' },
      { key: 'D', label: 'Ignore for now', action: 'ignore' }
    ],
    warningSigns: [
      'Sender domain is "google-accounts-security.com" NOT "google.com"',
      'Real Google emails come from "@google.com" or "@accounts.google.com"',
      'Creates urgency with 15-minute expiry',
      'The reset link domain does not match Google\'s official domain',
      'If you didn\'t request it, do not click anything'
    ],
    explanation: 'This is a credential phishing attack disguised as a Google security email. The key red flag is the sender domain: "google-accounts-security.com" is NOT Google. Legitimate Google security emails come from "@google.com" or "@accounts.google.com". If you receive such an email, go directly to myaccount.google.com without clicking any email link.',
    points: 20
  },
  {
    title: 'Package Delivery Failed - FedEx',
    category: 'delivery-scam',
    difficulty: 'beginner',
    emailContent: {
      sender: 'notifications@fedex-tracking-update.com',
      subject: 'Your package could not be delivered — Action Required',
      body: `Dear Customer,

Our delivery partner attempted to deliver your package today but was unable to complete the delivery.

Tracking Number: FDX-IN-2024-847392

To reschedule your delivery, please update your delivery preferences and pay a small redelivery fee of ₹99 using the link below:

Reschedule Delivery: http://bit.ly/fedex-redelivery-india

Please complete this within 3 days or your package will be returned to sender.

FedEx Customer Service`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the link to reschedule and pay ₹99', action: 'open-link' },
      { key: 'B', label: 'Report as phishing', action: 'report' },
      { key: 'C', label: 'Track the package on the official FedEx website directly', action: 'ignore' },
      { key: 'D', label: 'Call FedEx customer care', action: 'ignore' }
    ],
    warningSigns: [
      'Sender domain is NOT fedex.com',
      'Uses URL shortener (bit.ly) to hide actual destination',
      'Charges a small fee — real delivery failures don\'t require payment',
      'Creates urgency with 3-day deadline',
      'No order confirmation referenced'
    ],
    explanation: 'Smishing/phishing via fake delivery notifications is one of the most common scams. FedEx and other couriers do NOT ask for payment via email links. If you expect a package, always track it directly on the official website (fedex.com) by typing the URL yourself. Never click tracking links in unsolicited emails.',
    points: 10
  },
  {
    title: 'College Scholarship Application Scam',
    category: 'scholarship-scam',
    difficulty: 'intermediate',
    emailContent: {
      sender: 'scholarships@national-scholarship-board.in',
      subject: 'You have been awarded ₹1,00,000 National Merit Scholarship',
      body: `Dear Student,

Congratulations! Based on your academic performance, you have been selected to receive the National Merit Scholarship of ₹1,00,000.

To claim your scholarship, you must:
1. Submit your bank account details for direct transfer
2. Pay a processing fee of ₹500 (refundable)
3. Upload scanned copies of Aadhaar, PAN, and marksheets

Claim your scholarship: http://national-scholarship-claim.xyz/apply

This offer expires in 72 hours. Act now!

National Scholarship Board
Ministry of Education, India`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the link and submit details to claim scholarship', action: 'open-link' },
      { key: 'B', label: 'Report this as scholarship fraud', action: 'report' },
      { key: 'C', label: 'Verify on the official NSP portal (scholarships.gov.in)', action: 'ignore' },
      { key: 'D', label: 'Share with friends who might benefit', action: 'reply' }
    ],
    warningSigns: [
      'Government scholarships are applied through official portals (scholarships.gov.in)',
      'Legitimate scholarships never ask for processing fees',
      'Suspicious domain ".xyz" is not a government domain (.gov.in)',
      'Requests sensitive documents + bank details together',
      'Unsolicited notification — you didn\'t apply for this'
    ],
    explanation: 'Scholarship fraud targets students with fake government scholarship offers. Real Indian government scholarships are only available through the National Scholarship Portal (scholarships.gov.in). They never charge fees. Any scholarship asking for bank details, Aadhaar, and a processing fee simultaneously is a scam designed to steal money and identity.',
    points: 20
  },
  {
    title: 'Netflix Account Suspended',
    category: 'account-suspension',
    difficulty: 'beginner',
    emailContent: {
      sender: 'billing@netflix-account-services.com',
      subject: 'Your Netflix account has been suspended due to payment failure',
      body: `Hi Netflix Member,

We were unable to process your latest payment and your account has been temporarily suspended.

To restore access to your account, please update your payment information:

Update Payment: https://netflix-account-services.com/billing/update

If you don't update within 24 hours, your subscription will be cancelled and your viewing history and settings will be deleted.

Netflix Support`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the link to update payment immediately', action: 'open-link' },
      { key: 'B', label: 'Report as phishing', action: 'report' },
      { key: 'C', label: 'Log in directly on netflix.com to check account status', action: 'ignore' },
      { key: 'D', label: 'Reply to ask Netflix to fix it', action: 'reply' }
    ],
    warningSigns: [
      'Sender domain is NOT netflix.com',
      'Real Netflix emails come from @netflix.com only',
      'Creates fear of data loss to pressure victim',
      'Contains 24-hour deadline creating panic',
      'Always check Netflix directly — never through email links'
    ],
    explanation: 'This is a classic streaming service phishing attack. Netflix communications always come from @netflix.com. If your account has a billing issue, you\'ll see it when you try to log in directly at netflix.com. Never enter credit card details by clicking email links.',
    points: 10
  },
  {
    title: 'IT Department - Password Expiry',
    category: 'password-reset',
    difficulty: 'advanced',
    emailContent: {
      sender: 'it-helpdesk@company-support-helpdesk.com',
      subject: 'Action Required: Your company password expires in 24 hours',
      body: `Dear Employee,

Your corporate network password is set to expire in 24 hours. Please reset your password immediately to avoid losing access to all company systems.

Click here to reset your password: https://company-support-helpdesk.com/reset-password

You will need your Employee ID and current password.

If you have questions, contact IT Support at helpdesk@company.com

IT Security Team`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Click the link and enter Employee ID + current password', action: 'open-link' },
      { key: 'B', label: 'Report to your actual IT Security team', action: 'report' },
      { key: 'C', label: 'Use only the internal company IT portal to change password', action: 'ignore' },
      { key: 'D', label: 'Reply asking for verification', action: 'reply' }
    ],
    warningSigns: [
      'Domain "company-support-helpdesk.com" is not your company\'s real domain',
      'Asks you to enter your current password — IT never needs this',
      'Password reset should always be done through internal systems',
      'The contact email given is @company.com but the link goes elsewhere',
      'Creating urgency around account lockout is a social engineering tactic'
    ],
    explanation: 'Corporate spear-phishing targeting employees to steal VPN and internal network credentials. Legitimate IT departments use internal systems for password resets and will NEVER ask for your current password. Always use your company\'s internal IT portal or contact IT directly through official channels.',
    points: 25
  },
  {
    title: 'Amazon Order Confirmation Fraud',
    category: 'payment-request',
    difficulty: 'intermediate',
    emailContent: {
      sender: 'orders@amazon-customer-service.net',
      subject: 'Order Confirmed: iPhone 15 Pro - ₹1,24,999 charged to your account',
      body: `Hello,

Thank you for your order on Amazon.in

Order #402-8834721-2948271
Item: Apple iPhone 15 Pro (256GB, Natural Titanium)
Amount: ₹1,24,999

Payment has been charged to your card ending in **4521.

If you did not place this order, please call our Fraud Prevention line immediately: +91-8800-AMAZON or click below to cancel:

Cancel Order: http://amazon-customer-service.net/cancel?order=402-8834721

Act within 2 hours to cancel and receive a full refund.

Amazon Customer Service`,
      hasAttachment: false
    },
    correctAction: 'report',
    options: [
      { key: 'A', label: 'Call the number provided and click cancel link', action: 'open-link' },
      { key: 'B', label: 'Report as phishing', action: 'report' },
      { key: 'C', label: 'Check Amazon.in directly for any unauthorized orders', action: 'ignore' },
      { key: 'D', label: 'Ignore it', action: 'ignore' }
    ],
    warningSigns: [
      'Amazon emails come from @amazon.in or @amazon.com — NOT @amazon-customer-service.net',
      'Fake order for large amount creates panic',
      'Fake phone number provided to intercept the call',
      'Cancel link goes to unofficial domain',
      'Designed to make victim call scammers who pose as Amazon support'
    ],
    explanation: 'This is a fake order scam designed to panic victims into calling a fake Amazon number. The scammers then impersonate Amazon support and guide victims into sharing OTPs, bank details, or installing remote access tools. Always verify orders only by logging into Amazon.in directly.',
    points: 20
  }
];

async function seed(exitOnComplete = true) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Clear existing data
    await User.deleteMany({});
    await Scan.deleteMany({});
    await Simulation.deleteMany({});
    await TrainingAttempt.deleteMany({});
    await Email.deleteMany({});
    await AuditLog.deleteMany({});
    await BlocklistEntry.deleteMany({});
    await SecurityPolicy.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.email}`);
    }

    const adminUser = createdUsers[0];
    const regularUsers = createdUsers.slice(1);

    // Create simulations
    const createdSimulations = [];
    for (const simData of simulations) {
      const sim = await Simulation.create({ ...simData, createdBy: adminUser._id });
      createdSimulations.push(sim);
      console.log(`🎯 Created simulation: ${sim.title}`);
    }

    // Create sample scans for regular users
    const { analyzeEmail } = require('../services/analysisEngine');

    const sampleEmails = [
      // SAFE emails
      {
        sender: 'library@university.edu',
        subject: 'Library Membership Renewal Confirmation',
        emailBody: 'Dear Student, Your college library membership has been successfully renewed for the academic year 2024-25. Your new membership ID is LIB-2024-4872. You can now access all digital and physical resources. Visit the library during working hours. Contact library@university.edu for assistance.',
        urls: []
      },
      {
        sender: 'admin@internship.company.com',
        subject: 'Internship Start Date Reminder',
        emailBody: 'Hi Arjun, This is a reminder that your internship starts on Monday, October 2nd at 9:00 AM. Please bring your offer letter, ID proof, and laptop. The HR team will guide you through the onboarding process. Looking forward to having you on board!',
        urls: []
      },
      {
        sender: 'noreply@coursera.org',
        subject: 'Certificate of Completion - Machine Learning Course',
        emailBody: 'Congratulations! You have successfully completed the Machine Learning Specialization. Your certificate is now available in your dashboard at coursera.org. You can add it to your LinkedIn profile. Thank you for learning with Coursera.',
        urls: ['https://www.coursera.org/account/accomplishments']
      },
      // SUSPICIOUS emails
      {
        sender: 'support@paypa1-verify.com',
        subject: 'Verify your PayPal account',
        emailBody: 'Your PayPal account needs verification. Please verify within 48 hours to avoid account limitations. Our records show unusual activity. Click the link to verify your account information. This is time-sensitive.',
        urls: ['http://paypa1-verify.com/secure/login']
      },
      {
        sender: 'hr@amazon-jobs-india.net',
        subject: 'Work from Home opportunity - ₹25,000/month',
        emailBody: 'We are hiring data entry specialists to work from home. Earn ₹25,000 per month working 3 hours daily. Limited positions available. Reply with your resume and contact details. Registration details will be provided upon selection.',
        urls: ['http://amazon-jobs-india.net/apply']
      },
      // PHISHING emails
      {
        sender: 'security@sbi-alert-team.tk',
        subject: 'URGENT: Your SBI Account Will Be Suspended',
        emailBody: 'URGENT! Your State Bank of India account has been flagged for suspicious transactions. Your account will be permanently suspended within 24 hours if you do not verify your credentials immediately. Click here to verify: http://sbi-secure.tk/verify?id=8472 — You will need to provide your account number, password, and OTP. Failure to comply will result in legal action and account closure.',
        urls: ['http://sbi-secure.tk/verify']
      },
      {
        sender: 'billing@netflix-securebilling.ml',
        subject: 'Payment Failed - Update Your Netflix Details Now',
        emailBody: 'Dear Netflix Member, We could not process your payment. Your account will be suspended in 24 hours unless you update your billing information. Update your credit card details now: http://netflix-securebilling.ml/update-payment — Provide: Card number, CVV, expiry date, billing address. DO NOT delay or you will lose all your viewing history.',
        urls: ['http://netflix-securebilling.ml/update-payment']
      },
      {
        sender: 'scholarship@national-edu-board.xyz',
        subject: 'You won ₹1,00,000 scholarship - Claim within 72 hours',
        emailBody: 'Congratulations! You have been selected for the National Education Scholarship of ₹1,00,000. To claim your scholarship, pay a refundable processing fee of ₹999 and provide your bank account details and Aadhaar number. Click here to claim: http://bit.ly/nat-scholarship-claim — Offer expires in 72 hours!',
        urls: ['http://bit.ly/nat-scholarship-claim']
      },
      {
        sender: 'verify@google-accounts-security-alert.com',
        subject: 'ALERT: Unauthorized login detected on your Google Account',
        emailBody: 'SECURITY ALERT! We detected a login from an unknown device in Russia. Your Google Account may be compromised. Verify your account immediately to prevent unauthorized access: http://google-accounts-security-alert.com/verify — Enter your email and password to confirm your identity. Act within 15 minutes.',
        urls: ['http://google-accounts-security-alert.com/verify']
      },
      {
        sender: 'customs@irs-taxrefund-india.tk',
        subject: 'Income Tax Refund of ₹24,500 pending - Verify account',
        emailBody: 'Dear Taxpayer, The Income Tax Department has processed your refund of ₹24,500. To receive your refund, verify your bank account: http://irs-taxrefund-india.tk/claim-refund — Provide PAN card, Aadhaar number, bank account number, IFSC code. Claim within 48 hours or the refund will be cancelled.',
        urls: ['http://irs-taxrefund-india.tk/claim-refund']
      }
    ];

    for (let i = 0; i < sampleEmails.length; i++) {
      const emailData = sampleEmails[i];
      const user = regularUsers[i % regularUsers.length];

      try {
        const analysis = await analyzeEmail(emailData);
        const scan = await Scan.create({
          userId: user._id,
          ...emailData,
          classification: analysis.classification,
          riskScore: analysis.riskScore,
          riskLevel: analysis.riskLevel,
          threatIndicators: analysis.threatIndicators,
          phishingDNA: analysis.phishingDNA,
          explanation: analysis.explanation,
          detailedAnalysis: analysis.detailedAnalysis,
          recommendations: analysis.recommendations,
          analysisMethod: analysis.analysisMethod
        });
        console.log(`📧 Created scan: "${emailData.subject}" → ${analysis.classification.toUpperCase()} (${analysis.riskScore}/100)`);
      } catch (err) {
        console.error(`Failed to create scan: ${err.message}`);
      }
    }

    // Create some training attempts
    const sim1 = createdSimulations[0];
    const sim2 = createdSimulations[1];
    const sim3 = createdSimulations[2];

    await TrainingAttempt.create([
      { userId: regularUsers[0]._id, simulationId: sim1._id, selectedAction: 'report', correct: true, score: 15, timeSpent: 45 },
      { userId: regularUsers[0]._id, simulationId: sim2._id, selectedAction: 'report', correct: true, score: 15, timeSpent: 60 },
      { userId: regularUsers[1]._id, simulationId: sim1._id, selectedAction: 'open-link', correct: false, score: 3, timeSpent: 20 },
      { userId: regularUsers[1]._id, simulationId: sim3._id, selectedAction: 'report', correct: true, score: 20, timeSpent: 90 },
      { userId: regularUsers[2]._id, simulationId: sim1._id, selectedAction: 'report', correct: true, score: 15, timeSpent: 35 },
      { userId: regularUsers[2]._id, simulationId: sim2._id, selectedAction: 'report', correct: true, score: 15, timeSpent: 55 },
      { userId: regularUsers[2]._id, simulationId: sim3._id, selectedAction: 'report', correct: true, score: 20, timeSpent: 70 },
      { userId: regularUsers[3]._id, simulationId: sim1._id, selectedAction: 'open-link', correct: false, score: 3, timeSpent: 15 }
    ]);

    // Update trainingCompleted for users who got correct answers
    await User.findByIdAndUpdate(regularUsers[0]._id, { $addToSet: { trainingCompleted: { $each: [sim1._id, sim2._id] } } });
    await User.findByIdAndUpdate(regularUsers[1]._id, { $addToSet: { trainingCompleted: sim3._id } });
    await User.findByIdAndUpdate(regularUsers[2]._id, { $addToSet: { trainingCompleted: { $each: [sim1._id, sim2._id, sim3._id] } } });

    console.log('✅ Training attempts created');

    // Seed default security policy
    await SecurityPolicy.create({ updatedBy: adminUser._id });
    console.log('✅ Default security policy created');

    // Seed some blocklist entries
    await BlocklistEntry.insertMany([
      { type: 'domain', value: 'sbi-banking-secure.tk', listType: 'blocklist', reason: 'Known SBI phishing domain', addedBy: adminUser._id },
      { type: 'domain', value: 'netflix-account-services.com', listType: 'blocklist', reason: 'Netflix impersonation phishing', addedBy: adminUser._id },
      { type: 'domain', value: 'google-accounts-security.com', listType: 'blocklist', reason: 'Google credential phishing', addedBy: adminUser._id },
      { type: 'domain', value: 'amazon-customer-service.net', listType: 'blocklist', reason: 'Amazon impersonation fraud', addedBy: adminUser._id },
      { type: 'domain', value: 'national-scholarship-claim.xyz', listType: 'blocklist', reason: 'Scholarship scam domain', addedBy: adminUser._id },
      { type: 'domain', value: 'university.edu', listType: 'allowlist', reason: 'Verified educational institution', addedBy: adminUser._id },
      { type: 'domain', value: 'coursera.org', listType: 'allowlist', reason: 'Verified learning platform', addedBy: adminUser._id },
    ]);
    console.log('✅ Blocklist entries created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@threatlens.io / Admin@123');
    console.log('   User:  arjun@student.college.edu / User@123');
    console.log('   User:  priya.mehta@gmail.com / User@123');

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    if (exitOnComplete) {
      process.exit(1);
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = { seed };
