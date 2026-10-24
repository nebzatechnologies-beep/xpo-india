const http = require('http');

const endpoints = [
  '/api/taxonomy/tree',
  '/api/taxonomy/lead-types',
  '/api/taxonomy/sectors',
  '/api/taxonomy/categories',
  '/api/taxonomy/subcategories',
  '/api/taxonomy/tags',
  '/api/taxonomy/form-builder?classificationCode=manufacturing-industrial',
  '/api/taxonomy/import',
  '/api/crm/contacts',
  '/api/whatsapp/connect',
  '/api/whatsapp/campaigns',
  '/api/whatsapp/templates',
  '/api/whatsapp/inbox',
  '/api/whatsapp/automations',
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ path, status: res.statusCode, success: json.success });
        } catch {
          resolve({ path, status: res.statusCode, success: false, data: data.slice(0, 50) });
        }
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing V4 API Endpoints...\n');
  let allOk = true;
  for (const ep of endpoints) {
    const res = await testEndpoint(ep);
    const ok = res.status === 200 && res.success === true;
    console.log(`${ok ? '✓ PASS' : '✗ FAIL'} [${res.status}] ${ep}`);
    if (!ok) allOk = false;
  }

  // Also test a POST to /api/whatsapp/connect for the test handshake
  const postTest = await new Promise((resolve) => {
    const req = http.request('http://localhost:3000/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve({ status: res.statusCode, message: json.message, success: json.success });
      });
    });
    req.write(JSON.stringify({ action: 'test' }));
    req.end();
  });
  console.log(`${postTest.success ? '✓ PASS' : '✗ FAIL'} [${postTest.status}] POST /api/whatsapp/connect (Handshake: ${postTest.message})`);

  console.log(`\nAll V4 Endpoints Tested. Status: ${allOk ? '100% OPERATIONAL' : 'FAILURES DETECTED'}`);
}

run();
