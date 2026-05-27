process.env.NODE_ENV = 'test';
import app from '../app.js';
import db from '../Db/db.js';
import redisClient from './redis.js';
import analyticsQueue from './analyticsQueue.js';

// Configuration for tests
const PORT = 3002; 
let server;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting TinyUrl backend test suite...');
  
  // Start server on test port
  server = app.listen(PORT, async () => {
    console.log(`📡 Test server running on http://localhost:${PORT}`);
    
    try {
      // 1. Clear database and cache states if possible
      // In-memory fallbacks or database will handle queries
      console.log('🧹 Preparing test environment...');

      // 2. Test URL Shortening (Success case)
      console.log('\n--- 📝 Test Case 1: Shorten standard URL ---');
      const shortenRes = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/some/deep/path?ref=test'
        })
      });
      
      const rawText = await shortenRes.text();
      let shortenData;
      try {
        shortenData = JSON.parse(rawText);
      } catch (err) {
        console.error('Failed to parse response as JSON. Raw response:', rawText);
        throw err;
      }
      console.log('Status Code:', shortenRes.status);
      console.log('Response Body:', shortenData);
      
      if (shortenRes.status !== 201 || !shortenData.shortCode) {
        throw new Error('Test Case 1 Failed: URL not shortened correctly.');
      }
      const testCode = shortenData.shortCode;

      // 3. Test URL Shortening with Custom Alias
      console.log('\n--- 📝 Test Case 2: Shorten URL with Custom Alias ---');
      const aliasRes = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://google.com',
          alias: 'mygoogle'
        })
      });
      
      const aliasData = await aliasRes.json();
      console.log('Status Code:', aliasRes.status);
      console.log('Response Body:', aliasData);
      
      if (aliasRes.status !== 201 || aliasData.shortCode !== 'mygoogle') {
        throw new Error('Test Case 2 Failed: Custom alias shortening failed.');
      }

      // 4. Test URL Shortening Alias Collision
      console.log('\n--- 📝 Test Case 3: Alias Collision Check ---');
      const collisionRes = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://yahoo.com',
          alias: 'mygoogle'
        })
      });
      
      const collisionData = await collisionRes.json();
      console.log('Status Code:', collisionRes.status);
      console.log('Response Body:', collisionData);
      
      if (collisionRes.status !== 409) {
        throw new Error('Test Case 3 Failed: Should block duplicate alias with 409 Conflict.');
      }

      // 5. Test SSRF Protection
      console.log('\n--- 📝 Test Case 4: SSRF Attack Block Check ---');
      const ssrfRes = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://127.0.0.1:8080/admin'
        })
      });
      
      const ssrfData = await ssrfRes.json();
      console.log('Status Code:', ssrfRes.status);
      console.log('Response Body:', ssrfData);
      
      if (ssrfRes.status !== 400 || !ssrfData.error.includes('SSRF')) {
        throw new Error('Test Case 4 Failed: Should block local IP shortening.');
      }

      // 6. Test Phishing Protection
      console.log('\n--- 📝 Test Case 5: Phishing URL Block Check ---');
      const phishRes = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://fake-bank-login.com/secure/login'
        })
      });
      
      const phishData = await phishRes.json();
      console.log('Status Code:', phishRes.status);
      console.log('Response Body:', phishData);
      
      if (phishRes.status !== 400 || !phishData.error.includes('phishing')) {
        throw new Error('Test Case 5 Failed: Should block phishing URL.');
      }

      // 7. Test URL Redirection & Cache Hit
      console.log('\n--- 📝 Test Case 6: Redirection & Caching ---');
      // Perform initial redirection request
      console.log('Executing first redirect (Cache Miss -> DB load)...');
      const redirectRes1 = await fetch(`http://localhost:${PORT}/api/url/${testCode}`, {
        redirect: 'manual' // Do not follow redirect, just check headers
      });
      console.log('Redirect 1 Status Code:', redirectRes1.status);
      console.log('Redirect 1 Target Location:', redirectRes1.headers.get('location'));
      
      if (redirectRes1.status !== 302 || !redirectRes1.headers.get('location')) {
        throw new Error('Test Case 6 Failed: Redirection did not output 302 target.');
      }

      console.log('Executing second redirect (Cache Hit -> instant load)...');
      const redirectRes2 = await fetch(`http://localhost:${PORT}/api/url/${testCode}`, {
        redirect: 'manual'
      });
      console.log('Redirect 2 Status Code:', redirectRes2.status);
      console.log('Redirect 2 Target Location:', redirectRes2.headers.get('location'));

      // 8. Test Rate Limiter (Token Bucket Daily Limit)
      console.log('\n--- 📝 Test Case 7: Token Bucket Daily Limit Rate limiting ---');
      console.log('Hammering shorten endpoint to trigger rate limiting...');
      let limited = false;
      for (let i = 0; i < 110; i++) {
        const res = await fetch(`http://localhost:${PORT}/api/url/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://example.com/test-${i}` })
        });
        if (res.status === 429) {
          const body = await res.json();
          console.log(`Rate limiter triggered successfully at iteration ${i}!`);
          console.log('Status Code:', res.status);
          console.log('Response Body:', body);
          limited = true;
          break;
        }
      }
      if (!limited) {
        throw new Error('Test Case 7 Failed: Rate limiter did not trigger after 100+ requests.');
      }

      // 9. Test Async Click Analytics Batching Queue
      console.log('\n--- 📝 Test Case 8: Async Click Analytics Queue ---');
      console.log('Simulating multiple clicks...');
      for (let i = 0; i < 5; i++) {
        await fetch(`http://localhost:${PORT}/api/url/mygoogle`, { redirect: 'manual' });
      }

      console.log('Waiting 6 seconds for the analytics queue flush interval to trigger...');
      await sleep(6000);

      // 10. Test Analytics Dashboard Querying
      console.log('\n--- 📝 Test Case 9: Analytics Dashboard ---');
      const analyticsRes = await fetch(`http://localhost:${PORT}/api/url/analytics/mygoogle`);
      const analyticsData = await analyticsRes.json();
      
      console.log('Status Code:', analyticsRes.status);
      console.log('Analytics Response:', {
        shortCode: analyticsData.shortCode,
        originalUrl: analyticsData.originalUrl,
        totalClicks: analyticsData.totalClicks,
        recentClicksCount: analyticsData.recentClicks.length
      });

      if (analyticsRes.status !== 200 || analyticsData.totalClicks < 5) {
        throw new Error('Test Case 9 Failed: Clicks not logged or dashboard returned empty.');
      }

      console.log('\n🌟 ALL TEST CASES PASSED SUCCESSFULLY! 🌟');
      shutdown(0);
    } catch (error) {
      console.error('\n❌ TEST SUITE FAILED:', error.message);
      shutdown(1);
    }
  });
}

function shutdown(code) {
  console.log('🔌 Shutting down test server and queue...');
  analyticsQueue.stopScheduler();
  if (server) {
    server.close(() => {
      console.log('Server stopped.');
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

// Start the tests
runTests();
