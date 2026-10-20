/**
 * ThreatLens Analysis Engine
 * Modular NLP/Rule-based phishing detection engine
 * This is the core intelligence layer of ThreatLens
 */

const { analyzeEmail: analyzeWithAI, getProviderStatus, isGeminiConfigured } = require('./aiService');

// ============================================================
// CONFIGURATION - Adjust weights and thresholds here
// ============================================================
const CONFIG = {
  weights: {
    sender: parseInt(process.env.WEIGHT_SENDER) || 20,
    url: parseInt(process.env.WEIGHT_URL) || 25,
    content: parseInt(process.env.WEIGHT_CONTENT) || 25,
    socialEngineering: parseInt(process.env.WEIGHT_SOCIAL_ENGINEERING) || 15,
    credentialFinancial: parseInt(process.env.WEIGHT_CREDENTIAL_FINANCIAL) || 15
  },
  thresholds: {
    safe: parseInt(process.env.SAFE_THRESHOLD) || 29,
    suspicious: parseInt(process.env.SUSPICIOUS_THRESHOLD) || 59
  }
};

// ============================================================
// PATTERN DATABASES
// ============================================================

const URGENCY_PATTERNS = [
  /urgent/i, /immediately/i, /action required/i, /act now/i,
  /limited time/i, /expires soon/i, /expires in \d+/i, /within \d+ hours?/i, /in \d+ hours?/i,
  /within 24 hours/i, /within 48 hours/i,
  /last chance/i, /final notice/i, /deadline/i, /do not delay/i,
  /respond immediately/i, /time sensitive/i, /before it.?s too late/i,
  /account will be (suspended|closed|terminated|disabled)/i,
  /verify now/i, /update now/i, /confirm now/i, /hurry/i, /click (here|now)/i,
  /claim (now|immediately|today)/i
];

const FEAR_PATTERNS = [
  /account (has been|will be|is being) (suspended|disabled|terminated|blocked|locked)/i,
  /unauthorized access/i, /security breach/i, /suspicious activity/i,
  /unusual login/i, /account compromised/i, /illegal activity/i,
  /legal action/i, /fraud detected/i, /identity theft/i,
  /your account is at risk/i, /immediate attention required/i,
  /failure to (comply|respond|verify)/i
];

const CREDENTIAL_PATTERNS = [
  /enter (your )?(password|username|credentials|login)/i,
  /verify (your )?(identity|account|credentials|email|password|information)/i,
  /confirm (your )?(password|account|credentials|identity)/i,
  /update (your )?(password|credentials|account details)/i,
  /reset (your )?(password)/i,
  /login to (verify|confirm|access|update)/i,
  /sign in (to|and) (verify|confirm|access|update)/i,
  /provide (your )?(password|credentials|account details|bank details)/i,
  /click (here|the link|below) (to )?(login|sign in|verify|confirm)/i,
  /(send|provide|submit|share|reply with) (your )?(full name|name|bank account|bank details|account details|banking details|card details|ssn|aadhaar|pan|telephone number)/i,
  /bank account (details|number|information)/i,
  /personal (details|information|identification)/i,
  /unlock (your )?account/i,
  /credit card (and delivery details|information|details)/i
];

const FINANCIAL_PATTERNS = [
  /bank (account|details|transfer|number)/i,
  /credit card/i, /debit card/i, /card number/i, /cvv/i,
  /payment (required|pending|failed|due)/i,
  /invoice (attached|enclosed|pending)/i,
  /refund (process|available|approved)/i,
  /prize (money|winner|won)/i, /lottery/i, /jackpot/i,
  /wire transfer/i, /bitcoin/i, /cryptocurrency/i,
  /send money/i, /transaction (failed|pending)/i,
  /billing (information|details|update)/i,
  /(processing|claim|registration|clearance|administrative|courier|transfer|advance|delivery|customs|shipping|redelivery) fee/i,
  /(won|win|receive|claim|awarded) (\$\d+|[0-9,]+\s*(dollars|usd|inr|rupees))/i,
  /lucky winner/i, /randomly selected/i, /international lottery/i,
  /claim (your )?(prize|reward|winnings|funds|money)/i,
  /(confidential|secret|urgent) wire transfer/i,
  /external vendor account/i,
  /dormant (bank )?assets|beneficiary funds|next of kin/i,
  /work from home opportunity|remote assistant|earn \$\d+.*(week|month|day)/i,
  /\$\d+|\€\d+|£\d+/
];

const BRAND_IMPERSONATION = [
  'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook', 'instagram',
  'netflix', 'bank of america', 'chase', 'wells fargo', 'citibank', 'hdfc',
  'sbi', 'icici', 'axis bank', 'paytm', 'phonepe', 'gpay', 'airtel',
  'jio', 'vodafone', 'dropbox', 'linkedin', 'twitter', 'whatsapp',
  'ebay', 'alibaba', 'flipkart', 'myntra', 'irs', 'income tax',
  'social security', 'fedex', 'ups', 'dhl', 'usps', 'india post'
];

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'aol.com', 'protonmail.com', 'icloud.com', 'mail.com', 'zoho.com',
  'yandex.com', 'gmx.com', 'inbox.com', 'rediffmail.com', 'fastmail.com'
];

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.loan',
  '.work', '.party', '.win', '.review', '.science', '.webcam', '.date',
  '.faith', '.racing', '.accountant', '.bid', '.download', '.stream'
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'buff.ly',
  'adf.ly', 'short.link', 'shorte.st', 'lnkd.in', 'rb.gy', 'cutt.ly',
  'is.gd', 'clck.ru', 'v.gd', 'bl.ink'
];

const LEGITIMATE_URGENCY_CONTEXTS = [
  /library (membership|card|book|portal) (renewed|renew|expir)/i,
  /assignment (due|deadline|submission)/i,
  /meeting (reminder|scheduled|invite|invitation|notes)/i,
  /class (cancel|reschedule|schedule|timetable)/i,
  /semester timetable|exam schedule|lecture hall|classes for.*will be held|faculty advisor/i,
  /project (sync|status|review|standup|kickoff|planning|backlog|jira)/i,
  /google meet|zoom meeting|sprint backlog|meeting tomorrow/i,
  /order confirmation|shipping update|tracking number|out for delivery|delivered|has shipped|order containing/i,
  /receipt for your|invoice for your payment|payment confirmation|ride receipt|total paid: \$\d+/i,
  /weekly digest|newsletter|unsubscribe|techweekly/i,
  /lunch tomorrow|coffee|are you free/i
];

// ============================================================
// URL EXTRACTION
// ============================================================

function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)].slice(0, 20); // deduplicate, limit to 20
}

// ============================================================
// MODULE 1: SENDER ANALYSIS
// ============================================================

function analyzeSender(sender, emailBody, subject) {
  let score = 0;
  const findings = [];
  let suspicious = false;

  if (!sender || sender.trim() === '' || sender.trim() === 'unknown@unverified.email') {
    return {
      score: 0,
      status: 'unavailable',
      findings: ['No sender address provided for verification'],
      suspicious: false,
      domain: '',
      isFreeProvider: false,
      explanation: 'Sender information was not provided and could not be evaluated.'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sender)) {
    score += 60;
    findings.push('Invalid email format detected');
    suspicious = true;
    return { score: Math.min(score, 100), findings, suspicious };
  }

  const domain = sender.split('@')[1]?.toLowerCase() || '';
  const localPart = sender.split('@')[0]?.toLowerCase() || '';

  // Check for suspicious characters in local part
  if (/[^a-z0-9._+\-]/.test(localPart)) {
    score += 25;
    findings.push('Suspicious characters in sender address');
    suspicious = true;
  }

  // Check for free email provider used with brand impersonation
  const isFreeProvider = FREE_EMAIL_PROVIDERS.includes(domain);
  const bodyLower = (emailBody + ' ' + subject).toLowerCase();

  for (const brand of BRAND_IMPERSONATION) {
    const brandRegex = new RegExp('\\b' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (brandRegex.test(bodyLower) && isFreeProvider) {
      score += 45;
      findings.push(`Brand impersonation: "${brand}" claimed but sender uses free email provider (${domain})`);
      suspicious = true;
      break;
    }
  }

  // Check domain mismatch - brand in subject/body vs sender domain
  for (const brand of BRAND_IMPERSONATION) {
    const brandFirstWord = brand.split(' ')[0];
    const brandFirstWordRegex = new RegExp('\\b' + brandFirstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (
      (brandFirstWordRegex.test(subject) || brandFirstWordRegex.test(emailBody)) &&
      !domain.includes(brandFirstWord) &&
      !findings.some(f => f.includes('impersonation'))
    ) {
      score += 30;
      findings.push(`Domain mismatch: Email references "${brand}" but sender domain is "${domain}"`);
      suspicious = true;
      break;
    }
  }

  // Suspicious domain patterns
  if (/\d{4,}/.test(domain)) {
    score += 20;
    findings.push('Sender domain contains suspicious numeric sequence');
    suspicious = true;
  }

  // Typosquatting patterns (common substitutions)
  const typosquatPatterns = [
    { original: 'paypal', typos: ['paypa1', 'paypaI', 'paypai', 'ppaypal', 'pay-pal'] },
    { original: 'amazon', typos: ['arnazon', 'amaz0n', 'amazn', 'amason'] },
    { original: 'microsoft', typos: ['m1crosoft', 'rnicrosof', 'micro-soft'] },
    { original: 'google', typos: ['g00gle', 'go0gle', 'googIe', 'googlle'] },
    { original: 'apple', typos: ['app1e', 'aple', 'applle'] }
  ];

  for (const pattern of typosquatPatterns) {
    for (const typo of pattern.typos) {
      if (domain.includes(typo)) {
        score += 40;
        findings.push(`Possible typosquatting: domain resembles "${pattern.original}"`);
        suspicious = true;
        break;
      }
    }
  }

  // Suspicious TLDs
  for (const tld of SUSPICIOUS_TLDS) {
    if (domain.endsWith(tld)) {
      score += 30;
      findings.push(`High-risk TLD detected: "${tld}"`);
      suspicious = true;
      break;
    }
  }

  // Multiple subdomains (sign of domain spoofing)
  const subdomainCount = domain.split('.').length - 2;
  if (subdomainCount >= 2) {
    score += 15;
    findings.push(`Excessive subdomains in sender domain (${subdomainCount} subdomains)`);
    suspicious = true;
  }

  if (findings.length === 0) {
    findings.push('Sender domain appears legitimate');
  }

  return {
    score: Math.min(Math.round(score), 100),
    status: 'evaluated',
    findings,
    suspicious,
    domain,
    isFreeProvider,
    explanation: findings.join('; ')
  };
}

// ============================================================
// MODULE 2: URL ANALYSIS
// ============================================================

function analyzeUrls(emailBody, additionalUrls = []) {
  const extractedUrls = extractUrls(emailBody);
  const allUrls = [...new Set([...extractedUrls, ...additionalUrls])];

  let score = 0;
  const findings = [];
  const suspiciousUrls = [];
  let suspicious = false;

  if (allUrls.length === 0) {
    return {
      score: 0,
      status: 'unavailable',
      findings: ['No URLs found in email (text-only message)'],
      urls: [],
      suspiciousUrls: [],
      suspicious: false,
      explanation: 'No links were found in the email content. Threat evaluation focused on linguistic and social engineering vectors.'
    };
  }

  // Many URLs is suspicious
  if (allUrls.length > 5) {
    score += 20;
    findings.push(`High number of URLs detected (${allUrls.length})`);
    suspicious = true;
  }

  for (const url of allUrls) {
    const urlLower = url.toLowerCase();
    let urlScore = 0;
    const urlFindings = [];

    // HTTP (not HTTPS)
    if (url.startsWith('http://')) {
      urlScore += 20;
      urlFindings.push('Non-secure HTTP link');
    }

    // IP-based URL
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      urlScore += 50;
      urlFindings.push('IP-based URL (hides real domain)');
      suspiciousUrls.push(url);
      suspicious = true;
    }

    // URL shortener
    const isShortener = URL_SHORTENERS.some(s => urlLower.includes(s));
    if (isShortener) {
      urlScore += 30;
      urlFindings.push('URL shortener detected (hides destination)');
      suspiciousUrls.push(url);
      suspicious = true;
    }

    // Suspicious TLD
    const urlDomain = url.replace(/https?:\/\//, '').split('/')[0].split('?')[0];
    for (const tld of SUSPICIOUS_TLDS) {
      if (urlDomain.endsWith(tld)) {
        urlScore += 35;
        urlFindings.push(`Suspicious TLD in URL: "${tld}"`);
        suspiciousUrls.push(url);
        suspicious = true;
        break;
      }
    }

    // Brand impersonation in URL
    for (const brand of BRAND_IMPERSONATION) {
      const brandFirstWord = brand.split(' ')[0];
      if (urlLower.includes(brandFirstWord) && !urlLower.includes(`.${brandFirstWord}.com`)) {
        // Domain contains brand name but it's not the actual brand domain
        const domainParts = urlDomain.split('.');
        const mainDomain = domainParts.slice(-2).join('.');
        if (!mainDomain.startsWith(brandFirstWord)) {
          urlScore += 40;
          urlFindings.push(`URL contains "${brand}" brand name but may not be official domain`);
          suspiciousUrls.push(url);
          suspicious = true;
          break;
        }
      }
    }

    // Suspicious keywords in URL
    const suspiciousUrlKeywords = ['login', 'signin', 'verify', 'secure', 'account', 'update', 'confirm', 'validate', 'password', 'credential'];
    const foundKeywords = suspiciousUrlKeywords.filter(k => urlLower.includes(k));
    if (foundKeywords.length >= 2) {
      urlScore += 25;
      urlFindings.push(`Multiple suspicious keywords in URL: ${foundKeywords.join(', ')}`);
      suspicious = true;
    }

    // Excessive URL length
    if (url.length > 100) {
      urlScore += 10;
      urlFindings.push('Unusually long URL (may obfuscate true destination)');
    }

    // Unusual characters in URL
    if (/%[0-9a-f]{2}/i.test(url) && url.split('%').length > 5) {
      urlScore += 20;
      urlFindings.push('Excessive URL encoding detected');
      suspicious = true;
    }

    if (urlFindings.length > 0) {
      findings.push(...urlFindings.map(f => `[URL] ${f}`));
    }

    score = Math.max(score, urlScore);
  }

  if (findings.length === 0) {
    findings.push('URLs appear safe');
  }

  return {
    score: Math.min(Math.round(score), 100),
    status: 'evaluated',
    findings,
    urls: allUrls,
    suspiciousUrls: [...new Set(suspiciousUrls)],
    suspicious,
    explanation: findings.join('; ')
  };
}

// ============================================================
// MODULE 3: CONTENT ANALYSIS
// ============================================================

function analyzeContent(subject, emailBody) {
  let score = 0;
  const findings = [];
  const urgencyWords = [];
  const fearWords = [];
  let suspicious = false;

  const fullText = `${subject} ${emailBody}`;

  // Check for legitimate context first
  const isLegitimate = LEGITIMATE_URGENCY_CONTEXTS.some(p => p.test(fullText));

  // Urgency patterns
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(fullText)) {
      const match = fullText.match(pattern);
      if (match) {
        urgencyWords.push(match[0]);
        score += isLegitimate ? 3 : 12;
        suspicious = !isLegitimate;
      }
    }
  }

  if (urgencyWords.length > 0) {
    findings.push(`Urgency language detected: "${urgencyWords.slice(0, 3).join('", "')}"`);
  }

  // Fear/threat patterns
  for (const pattern of FEAR_PATTERNS) {
    if (pattern.test(fullText)) {
      const match = fullText.match(pattern);
      if (match) {
        fearWords.push(match[0]);
        score += isLegitimate ? 5 : 18;
        suspicious = !isLegitimate;
      }
    }
  }

  if (fearWords.length > 0) {
    findings.push(`Fear/threat language detected: "${fearWords.slice(0, 2).join('", "')}"`);
  }

  // ALL CAPS subject (aggressive tone)
  if (subject && subject === subject.toUpperCase() && subject.length > 5) {
    score += 15;
    findings.push('Subject line in ALL CAPS (aggressive tone)');
    suspicious = true;
  }

  // Excessive exclamation marks
  const exclamationCount = (fullText.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    score += 10;
    findings.push(`Excessive exclamation marks (${exclamationCount})`);
  }

  // Grammar/spelling indicators (simple check)
  const textWords = emailBody.split(/\s+/).length;
  if (textWords > 20) {
    // Check for common phishing phrases
    const phishingPhrases = [
      'dear valued customer',
      'dear account holder',
      'dear user',
      'dear lucky winner',
      'lucky winner',
      'congratulations you have been selected',
      'randomly selected',
      'international lottery',
      'claim your prize',
      'claim your reward',
      'processing fee',
      'registration fee',
      'click here now',
      'expires in 24 hours',
      'your account will be suspended',
      'verify your account to avoid',
      'failure to verify',
      'click the link below to',
      'do not ignore this',
      'this is your final warning'
    ];

    for (const phrase of phishingPhrases) {
      if (fullText.toLowerCase().includes(phrase)) {
        score += 20;
        findings.push(`Phishing phrase detected: "${phrase}"`);
        suspicious = true;
      }
    }
  }

  // Check for brand impersonation in content
  for (const brand of BRAND_IMPERSONATION) {
    const brandRegex = new RegExp('\\b' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (brandRegex.test(fullText)) {
      findings.push(`Brand reference: "${brand}" mentioned in email`);
      break;
    }
  }

  if (findings.length === 0) {
    findings.push('Email content appears normal');
  }

  const hasContent = Boolean((subject && subject.trim()) || (emailBody && emailBody.trim()));

  return {
    score: Math.min(Math.round(score), 100),
    status: hasContent ? 'evaluated' : 'unavailable',
    findings,
    indicators: findings,
    urgencyWords: [...new Set(urgencyWords)],
    fearWords: [...new Set(fearWords)],
    suspicious,
    explanation: findings.join('; ')
  };
}

// ============================================================
// MODULE 4: SOCIAL ENGINEERING ANALYSIS
// ============================================================

function analyzeSocialEngineering(subject, emailBody) {
  let score = 0;
  const findings = [];
  let suspicious = false;

  const fullText = `${subject} ${emailBody}`;
  const lowerText = fullText.toLowerCase();

  // Authority impersonation
  const authorityKeywords = [
    'ceo', 'manager', 'director', 'support team', 'security team',
    'it department', 'helpdesk', 'customer service', 'administrator',
    'government', 'irs', 'income tax', 'police', 'fbi', 'interpol',
    'rbi', 'sebi', 'enforcement directorate'
  ];

  for (const keyword of authorityKeywords) {
    if (lowerText.includes(keyword)) {
      score += 15;
      findings.push(`Authority impersonation attempt: "${keyword}"`);
      suspicious = true;
      break;
    }
  }

  // Scarcity/Exclusivity manipulation
  const scarcityPatterns = [
    /only \d+ (spots?|seats?|positions?|offers?) (left|available|remaining)/i,
    /exclusive offer/i, /selected (few|customers?|users?)/i,
    /you have been chosen/i, /you are one of/i,
    /special invitation/i, /vip access/i
  ];

  for (const pattern of scarcityPatterns) {
    if (pattern.test(fullText)) {
      score += 20;
      findings.push('Scarcity/exclusivity manipulation detected');
      suspicious = true;
      break;
    }
  }

  // Reciprocity manipulation
  const reciprocityPatterns = [
    /free (gift|reward|prize|bonus)/i,
    /claim your (free|reward|gift|prize)/i,
    /you have won/i, /winner announcement/i,
    /congratulations.{0,50}(won|selected|chosen)/i
  ];

  for (const pattern of reciprocityPatterns) {
    if (pattern.test(fullText)) {
      score += 25;
      findings.push('False reward/reciprocity manipulation detected');
      suspicious = true;
      break;
    }
  }

  // Lottery / Advance fee fraud lures
  const lotteryPatterns = [
    /international lottery/i,
    /lucky winner/i,
    /randomly selected/i,
    /claim (your )?(prize|reward|funds|winnings)/i,
    /you don'?t need to purchase/i,
    /claims department/i
  ];

  for (const pattern of lotteryPatterns) {
    if (pattern.test(fullText)) {
      score += 35;
      findings.push('Unsolicited lottery/prize claim manipulation detected (advance-fee fraud tactic)');
      suspicious = true;
      break;
    }
  }

  // Pretexting - false scenario creation
  const pretextPatterns = [
    /our records (show|indicate|suggest)/i,
    /we have noticed/i, /we detected/i,
    /system (update|upgrade|maintenance)/i,
    /policy update/i, /terms.{0,20}updated/i,
    /security protocol/i
  ];

  for (const pattern of pretextPatterns) {
    if (pattern.test(fullText)) {
      score += 15;
      findings.push('False pretext/scenario creation detected');
      suspicious = true;
      break;
    }
  }

  // Executive / BEC impersonation
  const becPatterns = [
    /(ceo|cfo|executive|director|board of directors).{0,50}(wire transfer|urgent payment|confidential request)/i,
    /(confidential|secret|discrete).{0,50}(transfer|payment|transaction|wire)/i,
    /do not (discuss|mention|share).{0,30}(with anyone|in the office|colleagues)/i,
    /offsite meeting|board meeting.{0,50}(reception|available by email only)/i,
    /strict nda|under nda/i
  ];
  for (const pattern of becPatterns) {
    if (pattern.test(fullText)) {
      score += 35;
      findings.push('Executive impersonation / BEC (Business Email Compromise) tactic detected');
      suspicious = true;
      break;
    }
  }

  // Fake job offer patterns
  const jobPatterns = [
    /work from home.{0,50}earn \$\d+/i,
    /earn \$\d+ (per|a) week/i,
    /no experience (necessary|needed|required).{0,50}earn/i,
    /selected for (a |the )?(remote|position|role).{0,50}earn/i
  ];
  for (const pattern of jobPatterns) {
    if (pattern.test(fullText)) {
      score += 30;
      findings.push('Unrealistic employment / fake job offer manipulation detected');
      suspicious = true;
      break;
    }
  }

  // 419 / Inheritance / Dormant assets
  const inheritancePatterns = [
    /dormant (bank )?assets|beneficiary funds/i,
    /deceased client|next of kin/i,
    /share the same (surname|last name)/i,
    /percentage of the (total )?funds|40% of the/i
  ];
  for (const pattern of inheritancePatterns) {
    if (pattern.test(fullText)) {
      score += 35;
      findings.push('Advance-fee inheritance / dormant fund lure detected');
      suspicious = true;
      break;
    }
  }

  // "Do not share" reverse psychology
  if (/do not share (this|your|the) (otp|password|pin|code)/i.test(fullText)) {
    score += 10;
    findings.push('OTP/password harvesting pattern detected');
    suspicious = true;
  }

  if (findings.length === 0) {
    findings.push('No social engineering patterns detected');
  }

  const hasContent = Boolean((subject && subject.trim()) || (emailBody && emailBody.trim()));

  return {
    score: Math.min(Math.round(score), 100),
    status: hasContent ? 'evaluated' : 'unavailable',
    findings,
    indicators: findings,
    suspicious,
    explanation: findings.join('; ')
  };
}

// ============================================================
// MODULE 5: CREDENTIAL & FINANCIAL INDICATOR ANALYSIS
// ============================================================

function analyzeCredentialFinancial(subject, emailBody, urls) {
  let score = 0;
  const findings = [];
  let suspicious = false;

  const fullText = `${subject} ${emailBody}`;

  // Credential patterns
  const credentialMatches = [];
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(fullText)) {
      const match = fullText.match(pattern);
      if (match) credentialMatches.push(match[0]);
    }
  }

  if (credentialMatches.length > 0) {
    score += Math.min(credentialMatches.length * 20, 60);
    findings.push(`Credential harvesting indicators: "${credentialMatches.slice(0, 2).join('", "')}"`);
    suspicious = true;
  }

  // Financial patterns
  const financialMatches = [];
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.test(fullText)) {
      const match = fullText.match(pattern);
      if (match) financialMatches.push(match[0]);
    }
  }

  if (financialMatches.length > 0) {
    score += Math.min(financialMatches.length * 15, 50);
    findings.push(`Financial bait indicators: "${financialMatches.slice(0, 2).join('", "')}"`);
    suspicious = true;
  }

  // Direct banking credentials solicitation check
  const isBankHarvester = /(send|provide|submit|share|reply with).{0,50}(bank account|banking details|account details|password|pin|otp|card details)/i.test(fullText);
  if (isBankHarvester) {
    score += 45;
    findings.push('Direct solicitation of sensitive banking or account credentials');
    suspicious = true;
  }

  // Advance-fee fraud detection (demanding fee to release prize/funds)
  const isAdvanceFee = /(processing|registration|clearance|courier|delivery|advance|administrative) fee/i.test(fullText) &&
    /(won|win|prize|reward|lottery|million|\$)/i.test(fullText);
  if (isAdvanceFee) {
    score += 50;
    findings.push('Advance-fee fraud indicator: upfront fee requested to release prize or funds');
    suspicious = true;
  }

  // Delivery fee extortion check
  const isDeliveryFeeScam = /(package|shipment|parcel|customs|courier|delivery).{0,80}(clearance fee|delivery fee|customs fee|unpaid fee|processing fee)/i.test(fullText);
  if (isDeliveryFeeScam) {
    score += 45;
    findings.push('Delivery/customs fee extortion lure detected');
    suspicious = true;
  }

  // BEC wire transfer check
  const isBECWire = /(confidential|urgent|secret|discrete).{0,50}(wire transfer|transfer \$|send \$|vendor account)/i.test(fullText);
  if (isBECWire) {
    score += 45;
    findings.push('Urgent confidential wire transfer solicitation (BEC indicator)');
    suspicious = true;
  }

  // Job registration fee check
  const isJobFee = /(registration|onboarding|equipment|refundable).{0,30}fee/i.test(fullText) &&
    /(job|role|position|earn|work from home|remote)/i.test(fullText);
  if (isJobFee) {
    score += 45;
    findings.push('Advance-fee job scam: upfront fee requested to secure employment');
    suspicious = true;
  }

  // Attachment indicators
  const attachmentPatterns = [/attach(ed|ment)/i, /enclosed (file|document|invoice|pdf)/i, /open (the )?attachment/i];
  const hasAttachmentRef = attachmentPatterns.some(p => p.test(fullText));
  if (hasAttachmentRef && (credentialMatches.length > 0 || financialMatches.length > 0)) {
    score += 20;
    findings.push('Attached file referenced alongside transaction request');
    suspicious = true;
  }

  if (findings.length === 0) {
    findings.push('No credential or financial indicators found');
  }

  const hasContent = Boolean((subject && subject.trim()) || (emailBody && emailBody.trim()));

  return {
    score: Math.min(Math.round(score), 100),
    status: hasContent ? 'evaluated' : 'unavailable',
    findings,
    indicators: findings,
    suspicious,
    explanation: findings.join('; ')
  };
}

// ============================================================
// PHISHING DNA GENERATOR
// ============================================================

function generatePhishingDNA(senderAnalysis, urlAnalysis, contentAnalysis, socialEngineering, credentialFinancial) {
  const normalize = (val, max = 100) => Math.min(Math.round((val / max) * 100), 100);

  return {
    impersonation: normalize(
      (senderAnalysis.score * 0.4) +
      (socialEngineering.score * 0.4) +
      (contentAnalysis.score * 0.2)
    ),
    credentialTheft: normalize(
      (credentialFinancial.score * 0.7) +
      (urlAnalysis.score * 0.3)
    ),
    maliciousURL: normalize(urlAnalysis.score),
    urgency: normalize(
      contentAnalysis.urgencyWords?.length > 0
        ? (contentAnalysis.urgencyWords.length * 25) + (contentAnalysis.score * 0.5)
        : contentAnalysis.score * 0.3
    ),
    financialBait: normalize(
      credentialFinancial.score * 0.5 +
      (contentAnalysis.fearWords?.length > 0 ? contentAnalysis.fearWords.length * 15 : 0)
    ),
    attachmentRisk: normalize(
      credentialFinancial.findings.some(f => f.includes('attachment')) ? 70 : 10
    ),
    socialEngineering: normalize(socialEngineering.score)
  };
}

// ============================================================
// THREAT INDICATOR BUILDER
// ============================================================

function buildThreatIndicators(senderAnalysis, urlAnalysis, contentAnalysis, socialEngineering, credentialFinancial) {
  const indicators = [];

  if (senderAnalysis.score > 20) {
    indicators.push({
      name: 'Sender Analysis',
      severity: senderAnalysis.score > 60 ? 'critical' : senderAnalysis.score > 40 ? 'high' : 'medium',
      score: senderAnalysis.score,
      description: senderAnalysis.findings[0] || 'Suspicious sender detected'
    });
  }

  if (urlAnalysis.score > 20) {
    indicators.push({
      name: 'Malicious URL',
      severity: urlAnalysis.score > 60 ? 'critical' : urlAnalysis.score > 40 ? 'high' : 'medium',
      score: urlAnalysis.score,
      description: urlAnalysis.findings[0] || 'Suspicious URL detected'
    });
  }

  if (contentAnalysis.urgencyWords?.length > 0) {
    indicators.push({
      name: 'Urgency Language',
      severity: contentAnalysis.urgencyWords.length > 2 ? 'high' : 'medium',
      score: Math.min(contentAnalysis.urgencyWords.length * 25, 80),
      description: `Urgency manipulation: "${contentAnalysis.urgencyWords[0]}"`
    });
  }

  if (contentAnalysis.fearWords?.length > 0) {
    indicators.push({
      name: 'Fear/Threat Language',
      severity: 'high',
      score: Math.min(contentAnalysis.fearWords.length * 30, 85),
      description: `Threat language: "${contentAnalysis.fearWords[0]}"`
    });
  }

  if (socialEngineering.score > 15) {
    indicators.push({
      name: 'Social Engineering',
      severity: socialEngineering.score > 50 ? 'high' : 'medium',
      score: socialEngineering.score,
      description: socialEngineering.findings[0] || 'Social engineering attempt'
    });
  }

  if (credentialFinancial.score > 20) {
    const isCredential = credentialFinancial.findings.some(f =>
      f.toLowerCase().includes('credential harvesting') ||
      f.toLowerCase().includes('banking') ||
      f.toLowerCase().includes('password') ||
      f.toLowerCase().includes('solicitation')
    );
    const isFinancial = credentialFinancial.findings.some(f =>
      f.toLowerCase().includes('financial bait') ||
      f.toLowerCase().includes('advance-fee') ||
      f.toLowerCase().includes('fee') ||
      f.toLowerCase().includes('wire transfer') ||
      f.toLowerCase().includes('lottery')
    );

    if (isCredential) {
      indicators.push({
        name: 'Credential Theft',
        severity: credentialFinancial.score > 50 ? 'critical' : 'high',
        score: credentialFinancial.score,
        description: 'Email attempts to harvest login credentials'
      });
    }
    if (isFinancial) {
      indicators.push({
        name: 'Financial Fraud',
        severity: credentialFinancial.score > 50 ? 'high' : 'medium',
        score: credentialFinancial.score,
        description: 'Email contains financial manipulation indicators'
      });
    }
  }

  return indicators;
}

// ============================================================
// EXPLANATION GENERATOR
// ============================================================

function generateExplanation(classification, riskScore, senderAnalysis, urlAnalysis, contentAnalysis, socialEngineering, credentialFinancial) {
  if (classification === 'safe') {
    return `This email appears to be safe with a low risk score of ${riskScore}/100. The sender address looks legitimate, no suspicious URLs were detected, and the content does not contain manipulation tactics commonly used in phishing attacks.`;
  }

  const reasons = [];

  if (senderAnalysis.score > 30) {
    reasons.push(senderAnalysis.findings[0]?.toLowerCase() || 'sender address anomalies were detected');
  }
  if (urlAnalysis.score > 30) {
    reasons.push('suspicious URLs were found that may redirect to malicious sites');
  }
  if (contentAnalysis.urgencyWords?.length > 0) {
    reasons.push('the email creates a false sense of urgency to pressure the recipient');
  }
  if (contentAnalysis.fearWords?.length > 0) {
    reasons.push('fear-inducing language is used to manipulate the recipient into action');
  }
  if (credentialFinancial.score > 20) {
    if (credentialFinancial.findings.some(f => f.toLowerCase().includes('credential'))) {
      reasons.push('the email attempts to harvest login credentials');
    }
    if (credentialFinancial.findings.some(f => f.toLowerCase().includes('financial'))) {
      reasons.push('financial fraud indicators are present');
    }
  }
  if (socialEngineering.score > 20) {
    reasons.push(socialEngineering.findings[0]?.toLowerCase() || 'social engineering tactics were detected');
  }

  if (reasons.length === 0) {
    return `This email has a risk score of ${riskScore}/100 and is classified as ${classification}. Multiple subtle indicators suggest this could be a phishing attempt.`;
  }

  const intro = classification === 'phishing'
    ? `This email was flagged as a HIGH RISK phishing attempt (score: ${riskScore}/100) because `
    : `This email appears suspicious (score: ${riskScore}/100) because `;

  return intro + reasons.slice(0, 3).join(', and ') + '.';
}

// ============================================================
// RECOMMENDATIONS GENERATOR
// ============================================================

function generateRecommendations(classification, senderAnalysis, urlAnalysis, credentialFinancial) {
  if (classification === 'safe') {
    return [
      'This email appears safe, but always stay vigilant',
      'Verify the sender if you have any doubts',
      'Never share sensitive information over email unless absolutely necessary'
    ];
  }

  const recommendations = [];

  if (urlAnalysis.suspiciousUrls?.length > 0) {
    recommendations.push('Do NOT click any links in this email');
    recommendations.push('If you need to visit the site, type the URL directly in your browser');
  }

  if (credentialFinancial.score > 20) {
    recommendations.push('Do NOT enter your password, OTP, or any credentials');
    recommendations.push('Contact the organization directly through their official website or phone number');
  }

  recommendations.push('Mark this email as spam and delete it');
  recommendations.push('Report the email to your IT security team or email provider');

  if (credentialFinancial.findings.some(f => f.toLowerCase().includes('credential'))) {
    recommendations.push('If you already entered credentials, change your password immediately and enable 2FA');
  }

  if (classification === 'phishing') {
    recommendations.push('Warn colleagues and family members about this type of attack');
  }

  return recommendations;
}

// ============================================================
// CLASSIFICATION ENGINE
// ============================================================

function classify(score) {
  const { safe, suspicious } = CONFIG.thresholds;
  if (score <= safe) return 'safe';
  if (score <= suspicious) return 'suspicious';
  return 'phishing';
}

function getRiskLevel(score) {
  if (score <= 29) return 'low';
  if (score <= 59) return 'medium';
  if (score <= 79) return 'high';
  return 'critical';
}

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

async function analyzeEmail({ sender, subject, emailBody, urls = [], attachmentName = '' }) {
  // Run all modules
  const senderAnalysis = analyzeSender(sender, emailBody, subject);
  const urlAnalysis = analyzeUrls(emailBody, urls);
  const contentAnalysis = analyzeContent(subject, emailBody);
  const socialEngineeringAnalysis = analyzeSocialEngineering(subject, emailBody);
  const credentialFinancialAnalysis = analyzeCredentialFinancial(subject, emailBody, urls);

  // Attachment bonus
  let attachmentScore = 0;
  if (attachmentName) {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.vbs', '.js', '.jar', '.zip', '.rar', '.doc', '.docm', '.xlsm', '.ppt'];
    const hasDangerousExt = dangerousExtensions.some(ext => attachmentName.toLowerCase().endsWith(ext));
    if (hasDangerousExt) {
      attachmentScore = 30;
    }
  }

  // Calculate weighted final score with dynamic rebalancing for missing URL / sender inputs
  const { weights } = CONFIG;
  const hasSender = Boolean(sender && sender.trim() && !senderAnalysis.findings.includes('No sender provided'));
  const hasUrls = Boolean(urlAnalysis.urls && urlAnalysis.urls.length > 0);

  let activeWeights = { ...weights };
  if (!hasUrls && !hasSender) {
    const totalEvaluable = weights.content + weights.socialEngineering + weights.credentialFinancial;
    activeWeights = {
      sender: 0,
      url: 0,
      content: (weights.content / totalEvaluable) * 100,
      socialEngineering: (weights.socialEngineering / totalEvaluable) * 100,
      credentialFinancial: (weights.credentialFinancial / totalEvaluable) * 100
    };
  } else if (!hasUrls) {
    const totalEvaluable = weights.sender + weights.content + weights.socialEngineering + weights.credentialFinancial;
    activeWeights = {
      sender: (weights.sender / totalEvaluable) * 100,
      url: 0,
      content: (weights.content / totalEvaluable) * 100,
      socialEngineering: (weights.socialEngineering / totalEvaluable) * 100,
      credentialFinancial: (weights.credentialFinancial / totalEvaluable) * 100
    };
  } else if (!hasSender) {
    const totalEvaluable = weights.url + weights.content + weights.socialEngineering + weights.credentialFinancial;
    activeWeights = {
      sender: 0,
      url: (weights.url / totalEvaluable) * 100,
      content: (weights.content / totalEvaluable) * 100,
      socialEngineering: (weights.socialEngineering / totalEvaluable) * 100,
      credentialFinancial: (weights.credentialFinancial / totalEvaluable) * 100
    };
  }

  let weightedScore = Math.round(
    (senderAnalysis.score * activeWeights.sender / 100) +
    (urlAnalysis.score * activeWeights.url / 100) +
    (contentAnalysis.score * activeWeights.content / 100) +
    (socialEngineeringAnalysis.score * activeWeights.socialEngineering / 100) +
    (credentialFinancialAnalysis.score * activeWeights.credentialFinancial / 100) +
    (attachmentScore * 0.5)
  );

  // 1. Generate DNA and Threat Indicators first so indicator severities can calibrate overall risk
  const phishingDNA = generatePhishingDNA(
    senderAnalysis, urlAnalysis, contentAnalysis,
    socialEngineeringAnalysis, credentialFinancialAnalysis
  );

  const threatIndicators = buildThreatIndicators(
    senderAnalysis, urlAnalysis, contentAnalysis,
    socialEngineeringAnalysis, credentialFinancialAnalysis
  );

  // 2. Vector Dominance & Peak Compounding Calculation
  // In cybersecurity, a critical threat in one vector cannot be diluted to "safe" by zero scores in other vectors.
  const vectorScores = [
    senderAnalysis.score,
    urlAnalysis.score,
    contentAnalysis.score,
    socialEngineeringAnalysis.score,
    credentialFinancialAnalysis.score
  ];
  const sortedVectorScores = [...vectorScores].sort((a, b) => b - a);
  const [v1 = 0, v2 = 0, v3 = 0] = sortedVectorScores;

  let peakCompoundedScore = 0;
  if (v1 >= 70) {
    // Critical threat detected in at least one vector: peak dominates and secondary vectors compound upward
    peakCompoundedScore = Math.min(100, Math.round(v1 + (v2 * 0.18) + (v3 * 0.10)));
  } else if (v1 >= 45) {
    // Moderate/suspicious threat detected in at least one vector: peak vector sets foundation
    peakCompoundedScore = Math.min(100, Math.round(v1 + (v2 * 0.15)));
  }

  // 3. Indicator Severity Floor
  // If the engine itself flags an indicator as 'critical' or 'high', the overall score must be congruent!
  let indicatorFloor = 0;
  const criticalIndicators = threatIndicators.filter(i => i.severity === 'critical');
  const highIndicators = threatIndicators.filter(i => i.severity === 'high');
  const maxIndicatorScore = threatIndicators.reduce((max, ind) => Math.max(max, ind.score || 0), 0);

  if (criticalIndicators.length > 0) {
    // Critical indicator guarantees PHISHING verdict (>=75) and at least the peak indicator score
    indicatorFloor = Math.max(75, maxIndicatorScore, v1);
  } else if (highIndicators.length >= 2) {
    // Multiple high severity indicators guarantee PHISHING (>=70)
    indicatorFloor = Math.max(70, maxIndicatorScore);
  } else if (highIndicators.length === 1) {
    // Single high severity indicator guarantees SUSPICIOUS (>=45)
    indicatorFloor = Math.max(45, Math.min(maxIndicatorScore, 65));
  }

  // 4. Critical Scam Red Lines & Heuristic Floors
  const fullEmailText = `${subject} ${emailBody}`;
  const isAdvanceFeeScam = /(processing|registration|clearance|claim|courier|delivery|advance|administrative|customs|shipping) fee/i.test(fullEmailText) &&
    /(lottery|won|winner|\$|prize|reward|million|dollars|jackpot)/i.test(fullEmailText);
  const isBankHarvester = /(send|provide|submit|share|reply with).{0,50}(bank account|banking details|account details|password|pin|otp|card details|credit card)/i.test(fullEmailText);
  const isLotteryScam = /(congratulations|lucky winner|randomly selected)/i.test(fullEmailText) &&
    /(won|win|\$|lottery|million|jackpot|prize)/i.test(fullEmailText);
  const isExecutiveBEC = /(wire transfer|transfer \$|send \$|vendor account).{0,60}(confidential|strict nda|board meeting|do not discuss|offsite)/i.test(fullEmailText) ||
    /(confidential|strict nda|board meeting).{0,60}(wire transfer|transfer \$|send \$|vendor account)/i.test(fullEmailText);
  const isFakeJobScam = /(work from home|remote assistant|earn \$\d+).{0,120}(registration fee|onboarding fee|refundable fee|bank account)/i.test(fullEmailText);
  const is419Inheritance = /(dormant (bank )?assets|deceased client|beneficiary funds|next of kin).{0,120}(bank account|reply with|confidential)/i.test(fullEmailText);
  const isDeliveryFeeScam = /(package|shipment|parcel|customs|fedex|dhl|ups).{0,100}(clearance fee|delivery fee|customs fee|unpaid fee).{0,100}(click|link|pay|credit card)/i.test(fullEmailText);
  const isBankPhishAlert = /(unauthorized login|account (has been )?locked|account (has been )?suspended|suspicious activity).{0,120}(verify your (identity|account)|enter your (password|credentials|account details)|unlock your account)/i.test(fullEmailText);

  let baselineFloor = 0;
  if (isAdvanceFeeScam && isBankHarvester) {
    baselineFloor = 92;
  } else if (isAdvanceFeeScam) {
    baselineFloor = 85;
  } else if (isLotteryScam && isBankHarvester) {
    baselineFloor = 85;
  } else if (isExecutiveBEC) {
    baselineFloor = 88;
  } else if (isFakeJobScam) {
    baselineFloor = 85;
  } else if (is419Inheritance) {
    baselineFloor = 88;
  } else if (isDeliveryFeeScam) {
    baselineFloor = 85;
  } else if (isBankPhishAlert) {
    baselineFloor = 90;
  } else if (isLotteryScam) {
    baselineFloor = 75;
  }

  // 5. Final Synthesized Risk Score
  const riskScore = Math.min(
    Math.max(weightedScore, peakCompoundedScore, indicatorFloor, baselineFloor),
    100
  );
  const classification = classify(riskScore);
  const riskLevel = getRiskLevel(riskScore);

  const explanation = generateExplanation(
    classification, riskScore, senderAnalysis, urlAnalysis,
    contentAnalysis, socialEngineeringAnalysis, credentialFinancialAnalysis
  );

  const recommendations = generateRecommendations(
    classification, senderAnalysis, urlAnalysis, credentialFinancialAnalysis
  );

  // Hybrid AI check with Google Gemini
  let finalClassification = classification;
  let finalRiskScore = riskScore;
  let finalRiskLevel = riskLevel;
  let finalPhishingDNA = phishingDNA;
  let finalThreatIndicators = threatIndicators;
  let finalExplanation = explanation;
  let finalRecommendations = recommendations;
  let analysisMethod = 'rule-based';
  let analysisStatus = 'complete';
  let aiAnalysisObj = null;

  const { anyConfigured: anyAIConfigured } = getProviderStatus();
  if (anyAIConfigured) {
    try {
      const heuristicSummary = {
        score: riskScore,
        classification,
        findings: [
          ...senderAnalysis.findings,
          ...urlAnalysis.findings,
          ...contentAnalysis.findings,
          ...socialEngineeringAnalysis.findings,
          ...credentialFinancialAnalysis.findings
        ]
      };

      const aiResult = await analyzeWithAI(
        { sender, subject, emailBody, urls, attachmentName },
        heuristicSummary
      );

      if (aiResult) {
        analysisMethod = 'hybrid';
        analysisStatus = 'complete';

        // Deterministic protection: prevent strong heuristic evidence from being overridden by low AI score
        if (riskScore >= CONFIG.thresholds.phishing) {
          // Deterministic phishing evidence: AI cannot demote below phishing threshold
          finalRiskScore = Math.max(riskScore, aiResult.semanticRiskScore);
        } else if (riskScore > CONFIG.thresholds.safe) {
          // Heuristic suspicious: maintain at least suspicious category
          const blended = Math.round(riskScore * 0.45 + aiResult.semanticRiskScore * 0.55);
          finalRiskScore = Math.max(blended, CONFIG.thresholds.safe + 1);
        } else {
          // Heuristics were safe
          const isLegitimateExempt = LEGITIMATE_URGENCY_CONTEXTS.some(p => p.test(fullEmailText));
          if (isLegitimateExempt) {
            // Recognized legitimate context (receipt, meeting invite, university timetable, shipping update)
            // AI cannot falsely alarm unless it detects a strong, unambiguous threat (>= 75)
            if (aiResult.semanticRiskScore >= 75) {
              finalRiskScore = aiResult.semanticRiskScore;
            } else {
              finalRiskScore = Math.min(riskScore, Math.round(aiResult.semanticRiskScore * 0.2));
            }
          } else if (aiResult.semanticRiskScore >= 65) {
            // High-confidence semantic deception detected that evaded basic keywords
            finalRiskScore = aiResult.semanticRiskScore;
          } else {
            // Blended weighted average for low-to-moderate signals
            finalRiskScore = Math.min(CONFIG.thresholds.safe, Math.round(riskScore * 0.7 + aiResult.semanticRiskScore * 0.3));
          }
        }

        finalClassification = classify(finalRiskScore);
        finalRiskLevel = getRiskLevel(finalRiskScore);

        aiAnalysisObj = {
          status: 'complete',
          classification: (aiResult.semanticRiskScore >= 60 ? 'PHISHING' : aiResult.semanticRiskScore > 29 ? 'SUSPICIOUS' : 'SAFE'),
          provider: aiResult.provider || 'Gemini',
          semanticRiskScore: aiResult.semanticRiskScore,
          aiSummary: aiResult.aiSummary,
          aiReasoning: aiResult.aiReasoning,
          detectedTactics: aiResult.detectedTactics || [],
          recommendations: aiResult.recommendations || []
        };

        // Blend Phishing DNA radar
        finalPhishingDNA = {
          impersonation: Math.round((phishingDNA.impersonation + (aiResult.phishingDNA?.impersonation || 0)) / 2),
          credentialTheft: Math.round((phishingDNA.credentialTheft + (aiResult.phishingDNA?.credentialTheft || 0)) / 2),
          maliciousURL: Math.round((phishingDNA.maliciousURL + (aiResult.phishingDNA?.maliciousURL || 0)) / 2),
          urgency: Math.round((phishingDNA.urgency + (aiResult.phishingDNA?.urgency || 0)) / 2),
          financialBait: Math.round((phishingDNA.financialBait + (aiResult.phishingDNA?.financialBait || 0)) / 2),
          attachmentRisk: Math.round((phishingDNA.attachmentRisk + (aiResult.phishingDNA?.attachmentRisk || 0)) / 2),
          socialEngineering: Math.round((phishingDNA.socialEngineering + (aiResult.phishingDNA?.socialEngineering || 0)) / 2)
        };

        // Prepend AI-detected tactics to threat indicators
        if (aiResult.detectedTactics && aiResult.detectedTactics.length > 0) {
          const aiIndicators = aiResult.detectedTactics.map(t => ({
            name: `[AI] ${t.name}`,
            severity: t.severity || 'high',
            score: t.severity === 'critical' ? 25 : t.severity === 'high' ? 20 : 10,
            description: t.description
          }));
          finalThreatIndicators = [...aiIndicators, ...threatIndicators].slice(0, 10);
        }

        // Incorporate AI's deep cognitive explanation
        const { gemini, openai, claude } = getProviderStatus();
        const activeProvider = gemini ? 'Gemini' : openai ? 'OpenAI' : 'Claude';
        if (aiResult.aiSummary || aiResult.aiReasoning) {
          finalExplanation = `🤖 [${activeProvider} AI Assessment]: ${aiResult.aiSummary}\n\n${aiResult.aiReasoning}\n\n📊 [Technical Heuristic Breakdown]: ${explanation}`;
        }

        if (aiResult.recommendations && aiResult.recommendations.length > 0) {
          finalRecommendations = Array.from(new Set([...aiResult.recommendations, ...recommendations]));
        }
      } else {
        // AI result was null (e.g. cloud models temporarily busy or exhausted)
        analysisStatus = 'degraded';
        aiAnalysisObj = {
          status: 'degraded',
          classification: classification.toUpperCase(),
          error: 'AI service temporarily unavailable or rate limited. Fallback to local heuristic engine applied.'
        };
        finalExplanation = `${explanation}\n\nℹ️ [System Telemetry]: Cloud AI was temporarily busy or experiencing high demand. Scan completed with full 40+ parameter local heuristics engine.`;
      }
    } catch (aiErr) {
      console.warn('Hybrid AI fallback to rule engine:', aiErr.message);
      analysisStatus = 'degraded';
      aiAnalysisObj = {
        status: 'degraded',
        classification: classification.toUpperCase(),
        error: aiErr.message
      };
      finalExplanation = `${explanation}\n\nℹ️ [System Telemetry]: Cloud AI experienced an issue (${aiErr.message}). Fallback to local heuristic engine applied.`;
    }
  } else {
    aiAnalysisObj = {
      status: 'disabled',
      classification: classification.toUpperCase()
    };
  }

  return {
    success: true,
    classification: finalClassification,
    riskScore: finalRiskScore,
    riskLevel: finalRiskLevel,
    analysisStatus,
    heuristicScore: riskScore,
    aiAnalysis: aiAnalysisObj,
    indicators: finalThreatIndicators,
    threatIndicators: finalThreatIndicators,
    phishingDNA: finalPhishingDNA,
    phishingDna: {
      impersonation: finalPhishingDNA.impersonation,
      credentialTheft: finalPhishingDNA.credentialTheft,
      maliciousUrls: finalPhishingDNA.maliciousURL,
      urgencyManipulation: finalPhishingDNA.urgency,
      financialBait: finalPhishingDNA.financialBait,
      attachmentRisk: finalPhishingDNA.attachmentRisk,
      socialEngineering: finalPhishingDNA.socialEngineering
    },
    explanation: finalExplanation,
    recommendations: finalRecommendations,
    analysisMethod,
    detailedAnalysis: {
      senderAnalysis: {
        score: senderAnalysis.score,
        status: senderAnalysis.status,
        findings: senderAnalysis.findings,
        indicators: senderAnalysis.findings,
        suspicious: senderAnalysis.suspicious,
        explanation: senderAnalysis.explanation
      },
      urlAnalysis: {
        score: urlAnalysis.score,
        status: urlAnalysis.status,
        urls: urlAnalysis.urls,
        suspiciousUrls: urlAnalysis.suspiciousUrls,
        findings: urlAnalysis.findings,
        indicators: urlAnalysis.findings,
        suspicious: urlAnalysis.suspicious,
        explanation: urlAnalysis.explanation
      },
      contentAnalysis: {
        score: contentAnalysis.score,
        status: contentAnalysis.status,
        findings: contentAnalysis.findings,
        indicators: contentAnalysis.findings,
        urgencyWords: contentAnalysis.urgencyWords,
        fearWords: contentAnalysis.fearWords,
        suspicious: contentAnalysis.suspicious,
        explanation: contentAnalysis.explanation
      },
      socialEngineering: {
        score: socialEngineeringAnalysis.score,
        status: socialEngineeringAnalysis.status,
        findings: socialEngineeringAnalysis.findings,
        indicators: socialEngineeringAnalysis.findings,
        suspicious: socialEngineeringAnalysis.suspicious,
        explanation: socialEngineeringAnalysis.explanation
      },
      credentialFinancial: {
        score: credentialFinancialAnalysis.score,
        status: credentialFinancialAnalysis.status,
        findings: credentialFinancialAnalysis.findings,
        indicators: credentialFinancialAnalysis.findings,
        suspicious: credentialFinancialAnalysis.suspicious,
        explanation: credentialFinancialAnalysis.explanation
      }
    },
    vectorBreakdown: {
      senderIdentity: {
        score: senderAnalysis.score,
        status: senderAnalysis.status,
        findings: senderAnalysis.findings,
        explanation: senderAnalysis.explanation
      },
      urlStructure: {
        score: urlAnalysis.score,
        status: urlAnalysis.status,
        findings: urlAnalysis.findings,
        explanation: urlAnalysis.explanation
      },
      linguisticUrgency: {
        score: contentAnalysis.score,
        status: contentAnalysis.status,
        findings: contentAnalysis.findings,
        explanation: contentAnalysis.explanation
      },
      socialEngineering: {
        score: socialEngineeringAnalysis.score,
        status: socialEngineeringAnalysis.status,
        findings: socialEngineeringAnalysis.findings,
        explanation: socialEngineeringAnalysis.explanation
      },
      financialCredential: {
        score: credentialFinancialAnalysis.score,
        status: credentialFinancialAnalysis.status,
        findings: credentialFinancialAnalysis.findings,
        explanation: credentialFinancialAnalysis.explanation
      }
    },
    weights: activeWeights
  };
}

module.exports = { analyzeEmail, CONFIG };
