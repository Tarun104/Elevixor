require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Contact = require('../models/Contact');
const Quote = require('../models/QuoteRequest');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');

const base = process.env.BASE_URL || 'http://localhost:3000';

const report = { passed: [], failed: [], warnings: [] };

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run(){
  // connect to DB for verification
  const uri = process.env.MONGO_URI;
  if (!uri) {
    report.warnings.push('MONGO_URI not set; tests that verify DB writes will fail.');
  } else {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  try {
    // 1. Contact Form
    const contactEmail = `smoke+contact${Date.now()}@example.com`;
    let res = await fetch(`${base}/contact`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name:'Smoke Test', email:contactEmail, phone:'000', message:'Hello from smoke test' }) });
    const body = await res.json().catch(()=>null);
    if (res.ok) report.passed.push('Contact API returned success'); else report.failed.push('Contact API did not return success');
    // verify DB
    if (uri) {
      await wait(200);
      const c = await Contact.findOne({ email: contactEmail }).lean();
      if (c) report.passed.push('Contact saved to DB'); else report.failed.push('Contact not found in DB');
    }
    if (!process.env.EMAIL_USER) report.warnings.push('EMAIL_USER not set; email sending could not be verified for contact.');

    // 2. Quote Request
    const quoteEmail = `smoke+quote${Date.now()}@example.com`;
    res = await fetch(`${base}/request-quote`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ clientName:'Smoke Client', email:quoteEmail, phone:'000', company:'SmokeCo', projectType:'Website', budget:'$1000', timeline:'1 month', requirements:'Test' }) });
    if (res.ok) report.passed.push('Quote API returned success'); else report.failed.push('Quote API did not return success');
    if (uri) {
      await wait(200);
      const q = await Quote.findOne({ email: quoteEmail }).lean();
      if (q && q.projectType === 'Website') report.passed.push('Quote stored correctly in DB'); else report.failed.push('Quote not stored or incorrect in DB');
    }
    if (!process.env.EMAIL_USER) report.warnings.push('EMAIL_USER not set; email sending could not be verified for quote.');

    // 3. Newsletter
    const subEmail = `smoke+news${Date.now()}@example.com`;
    res = await fetch(`${base}/subscribe`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: subEmail }) });
    const sbody = await res.json().catch(()=>null);
    if (res.ok) report.passed.push('Newsletter subscribe returned success'); else report.failed.push('Newsletter subscribe failed');
    if (uri) {
      await wait(200);
      const sub = await Subscriber.findOne({ email: subEmail }).lean();
      if (sub) report.passed.push('Subscriber saved in DB'); else report.failed.push('Subscriber not saved in DB');
      // duplicate
      res = await fetch(`${base}/subscribe`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: subEmail }) });
      const dup = await res.json().catch(()=>null);
      if (dup && (dup.message === 'Already subscribed' || dup.success)) report.passed.push('Duplicate subscription prevented/handled'); else report.failed.push('Duplicate subscription not handled');
    }

    // 4. Registration
    const userEmail = `smoke+user${Date.now()}@example.com`;
    const plain = 'Aa1!smoke';
    res = await fetch(`${base}/register`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, password: plain, name: 'Smoke User' }) });
    const reg = await res.json().catch(()=>null);
    if (res.ok) report.passed.push('Registration returned success'); else report.failed.push('Registration failed');
    if (uri) {
      await wait(200);
      const u = await User.findOne({ email: userEmail }).lean();
      if (u) {
        report.passed.push('User stored in DB');
        if (u.password && u.password !== plain) {
          const match = await bcrypt.compare(plain, u.password);
          if (match) report.passed.push('Password hashed correctly'); else report.failed.push('Password hash does not match plaintext');
        } else {
          report.failed.push('Password stored in plaintext or missing');
        }
      } else report.failed.push('User not found in DB after registration');
    }

    // 5. Login
    res = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, password: plain }) });
    const loginBody = await res.json().catch(()=>null);
    if (res.ok && loginBody && (loginBody.token || loginBody.success || loginBody.message)) {
      report.passed.push('Login returned success');
    } else report.failed.push('Login failed');
    const token = loginBody && (loginBody.token || loginBody.token)

    // 6. Protected routes
    // attempt without token
    res = await fetch(`${base}/api/dashboard/profile`, { method: 'GET' });
    if (res.status === 401) report.passed.push('Protected route denies anonymous access'); else report.failed.push('Protected route allowed anonymous access');
    // with token
    if (loginBody && loginBody.token) {
      res = await fetch(`${base}/api/dashboard/profile`, { method: 'GET', headers: { Authorization: `Bearer ${loginBody.token}` } });
      if (res.ok) report.passed.push('Protected route accessible with valid JWT'); else report.failed.push('Protected route not accessible with valid JWT');
    } else {
      report.warnings.push('No token from login — cannot fully test protected route with auth');
    }

    // 7. Validation tests
    res = await fetch(`${base}/contact`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name:'', email:'not-an-email', message:'' }) });
    if (res.status === 400) report.passed.push('Contact validation rejects bad input'); else report.failed.push('Contact validation did not reject bad input');

    res = await fetch(`${base}/request-quote`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ clientName:'', email:'bad', projectType:'' }) });
    if (res.status === 400) report.passed.push('Quote validation rejects bad input'); else report.failed.push('Quote validation did not reject bad input');

    // 8. Error handling: malformed JSON
    try {
      const badRes = await fetch(`${base}/contact`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: '{bad json' });
      const text = await badRes.text().catch(()=>null);
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = null; }
      if (badRes.status === 400 && parsed && parsed.message === 'Invalid JSON format') {
        report.passed.push('Server returns structured 400 for malformed JSON');
      } else {
        report.failed.push(`Malformed JSON handling unexpected: status=${badRes.status}, body=${text}`);
      }
    } catch (e) {
      report.failed.push('Error when sending malformed JSON: ' + e.message);
    }

  } catch (err) {
    report.failed.push('Test runner encountered error: ' + err.message);
    console.error(err && err.stack ? err.stack : err);
  } finally {
    if (uri) await mongoose.disconnect();
    // Print report
    console.log('\nSMOKE TEST REPORT');
    console.log('Passed tests:'); report.passed.forEach(p=>console.log(' -',p));
    if (report.failed.length) { console.log('\nFailed tests:'); report.failed.forEach(p=>console.log(' -',p)); }
    if (report.warnings.length) { console.log('\nWarnings:'); report.warnings.forEach(p=>console.log(' -',p)); }
    // exit code
    const code = report.failed.length ? 2 : 0;
    process.exit(code);
  }
}

run();
