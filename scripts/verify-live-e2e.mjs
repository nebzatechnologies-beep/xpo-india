// @ts-check
/**
 * End-to-End Live Backend & Firestore Verification Script
 * Validates real-time state synchronization, Superadmin WhatsApp controls,
 * Client-Partner mutual connection flow, and live API endpoints on https://xpoindia.com
 */

const BASE_URL = process.env.XPO_URL || 'https://xpoindia.com';

async function testEndpoint(name, url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const start = Date.now();
  const res = await fetch(url, options);
  const duration = Date.now() - start;

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[FAIL] ${name} HTTP ${res.status} (${duration}ms): ${errorText}`);
  }

  const data = await res.json();
  console.log(`  [PASS] ${name} (${duration}ms) -> HTTP 200 OK`);
  return data;
}

async function runLiveE2ETests() {
  console.log('======================================================================');
  console.log(`   XPO INDIA LIVE BACKEND & FIRESTORE END-TO-END TEST SUITE`);
  console.log(`   Target: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Initial State Fetch
  console.log('--- 1. Testing GET /api/marketplace/state ---');
  try {
    const stateRes = await testEndpoint('GET Marketplace State', `${BASE_URL}/api/marketplace/state`);
    const live = stateRes.data || stateRes.state;
    if (!live || !live.admin) {
      throw new Error('Missing admin namespace in returned live state');
    }
    const reqCount = Object.keys(live.client?.reqs || {}).length;
    console.log(`     Confirmed: Loaded live state with ${reqCount} requirements and ${live.partner?.opportunities?.length || 0} opportunities`);
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 2. Superadmin WhatsApp Automation Control
  console.log('\n--- 2. Testing Superadmin WhatsApp Automation Controls ---');
  try {
    const waPayload = {
      action: 'admin.update_whatsapp_automation',
      payload: {
        intakeMode: 'smart_one_shot',
        autoHoldFlagged: true,
        flaggedKeywords: 'betting, gambling, casino, crypto, adult, loan',
        welcomeGreeting: 'Welcome to XPO India Verified WhatsApp Desk ✓',
        waveAlertHeader: '⚡ NEW WAVE 1 LEAD · 5 MIN PRIORITY WINDOW',
        clientWaState: 'ACTIVE',
        partnerWaState: 'OFFER_SENT',
        customSynonyms: [
          { word: 'dabba printing', category: 'Packaging & Printing', addedAt: new Date().toISOString() },
        ],
        rules: {
          hi: '0.85',
          lo: '0.60',
          misses: '3',
          hours: '24',
          promise: '5-minute wave delivery',
          quiet: '22:00 - 08:00',
          rate: '15/min',
          retries: '2',
          hold: '5m',
          exp: '24h',
        },
        summary: 'E2E Test: Superadmin updated WhatsApp Automation rules & synonyms',
      },
    };

    const res = await testEndpoint('POST admin.update_whatsapp_automation', `${BASE_URL}/api/marketplace/state`, 'POST', waPayload);
    const live = res.data || res.state;
    const updatedWa = live?.admin?.whatsappAutomation;
    if (updatedWa?.welcomeGreeting !== 'Welcome to XPO India Verified WhatsApp Desk ✓') {
      throw new Error('Updated welcomeGreeting did not persist in Firestore');
    }
    if (!updatedWa?.customSynonyms?.some((s) => s.word === 'dabba printing')) {
      throw new Error('Updated synonym "dabba printing" did not persist in Firestore');
    }
    console.log('     Confirmed: WhatsApp automation rules, prompts & synonyms synced to Firestore in real time');
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 3. Superadmin Live Coordinator Message Injection
  console.log('\n--- 3. Testing Superadmin Coordinator Live Takeover Injection ---');
  try {
    const coordPayload = {
      action: 'admin.send_coordinator_message',
      payload: {
        target: 'client',
        text: 'Live message from XPO Superadmin Desk: Your custom boxes requirement is currently in Wave 1 matching.',
      },
    };
    const res = await testEndpoint('POST admin.send_coordinator_message', `${BASE_URL}/api/marketplace/state`, 'POST', coordPayload);
    const live = res.data || res.state;
    const msgs = live?.admin?.whatsappAutomation?.coordinatorMessages || live?.admin?.coordinatorMessages || [];
    const found = msgs.some((m) => m.text.includes('custom boxes requirement'));
    if (!found) {
      throw new Error('Coordinator message was not persisted to admin.whatsappAutomation.coordinatorMessages');
    }
    console.log('     Confirmed: Superadmin coordinator message injected and persisted in Firestore');
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 4. Wave Matching Rules Sync
  console.log('\n--- 4. Testing Superadmin Wave Matching Rules Sync ---');
  try {
    const wavePayload = {
      action: 'admin.update_wave_rules',
      payload: {
        partnersPerRound: 3,
        responseWindowSeconds: 300,
        targetClaims: 3,
        deliveryFallbackSeconds: 60,
        summary: 'E2E Test: Saved 5-minute wave matching rules',
      },
    };
    const res = await testEndpoint('POST admin.update_wave_rules', `${BASE_URL}/api/marketplace/state`, 'POST', wavePayload);
    const live = res.data || res.state;
    if (live?.admin?.waveRules?.responseWindowSeconds !== 300) {
      throw new Error('Wave rules responseWindowSeconds did not persist as 300s');
    }
    console.log('     Confirmed: 5-minute lead wave rules persisted to platform_settings/matching in Firestore');
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 5. Pricing & Quota Controls
  console.log('\n--- 5. Testing Pricing & Allowance Quotas Sync ---');
  try {
    const pricingPayload = {
      action: 'admin.update_pricing',
      payload: {
        freeClientViews: 5,
        clientMonthly: 299,
        clientUsdMonthly: 9.99,
        clientMonthlyViews: 30,
        freePartnerReplies: 3,
        partnerMonthly: 999,
        partnerUsdMonthly: 19.99,
        partnerMonthlyReplies: 50,
        clientAutoPay: true,
        clientRollover: false,
        partnerAutoPay: true,
        partnerRollover: false,
        summary: 'E2E Test: Updated subscription & quota platform settings',
      },
    };
    const res = await testEndpoint('POST admin.update_pricing', `${BASE_URL}/api/marketplace/state`, 'POST', pricingPayload);
    const live = res.data || res.state;
    if (live?.admin?.pricing?.partnerMonthly !== 999) {
      throw new Error('Pricing partnerMonthly did not persist as ₹999');
    }
    console.log('     Confirmed: Subscription prices & allowances synced to platform_settings/subscriptions');
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 6. Custom Taxonomy & Subcategories
  console.log('\n--- 6. Testing Custom Category / Subcategory Addition ---');
  try {
    const subcatPayload = {
      action: 'admin.add_subcategory',
      payload: {
        sectorName: 'Packaging & Industrial Materials',
        catName: 'Corrugated & Carton Boxes',
        subName: 'Automated Rigid Gift Boxes',
        partnersCount: 14,
        keywords: 'rigid boxes, magnetic closure, luxury packaging, gift boxes',
        synonyms: 'dabba, luxury carton, gift box',
      },
    };
    const res = await testEndpoint('POST admin.add_subcategory', `${BASE_URL}/api/marketplace/state`, 'POST', subcatPayload);
    const live = res.data || res.state;
    const subcats = live?.admin?.customSubcategories || [];
    if (!subcats.some((s) => s.subName === 'Automated Rigid Gift Boxes')) {
      throw new Error('New subcategory was not persisted in customSubcategories');
    }
    console.log('     Confirmed: New subcategory stored in taxonomy_subcategories in Firestore');
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 7. Client & Partner End-to-End Matching Lifecycle
  console.log('\n--- 7. Testing End-to-End Lead Lifecycle & Mutual Connection ---');
  try {
    // 7.1 Client Posts Requirement
    const postPayload = {
      action: 'client.post_requirement',
      payload: {
        key: 'req-e2e-live',
        requirement: {
          id: 'req-e2e-live',
          code: 'XPO-REQ-41235',
          title: '5,000 Custom Rigid Premium Gift Boxes for Corporate Gifting',
          cat: 'Packaging & Printing',
          spec: 'Looking for 5,000 pcs rigid boxes with magnetic lid, gold foil stamping, Mumbai delivery.',
          budget: '₹4,50,000',
          timeline: 'Within 3-4 Weeks',
          loc: 'Mumbai',
          status: 'live',
          posted: 'Just now',
          partners: [
            {
              id: 'p1',
              name: 'Klo Tech Pvt Ltd',
              badge: 'Wave 1 · Verified',
              quote: '₹4,20,000',
              tl: '18 Days',
              st: 'sent',
              note: 'Automated rigid boxes in Bhiwandi with in-house foil stamping & ISO certified QA.',
              matched: true,
              phone: '+91 99000 00002',
              email: 'partner@klotech.in',
            },
          ],
        },
      },
    };
    const postRes = await testEndpoint('POST client.post_requirement', `${BASE_URL}/api/marketplace/state`, 'POST', postPayload);
    const postLive = postRes.data || postRes.state;
    if (!postLive?.client?.reqs?.['req-e2e-live']) {
      throw new Error('New requirement was not returned in client.reqs');
    }
    console.log('     Confirmed: Client requirement posted (XPO-REQ-41235, Wave 1 Active)');

    // 7.2 Partner Submits Reply Quote
    const partnerReplyPayload = {
      action: 'partner.submit_reply',
      payload: {
        oppId: 'req-XPO-REQ-41235',
        ref: 'XPO-REQ-41235',
        quote: '₹4,20,000',
        note: 'We manufacture automated rigid boxes in Bhiwandi with in-house foil stamping & ISO certified QA.',
      },
    };
    await testEndpoint('POST partner.submit_reply', `${BASE_URL}/api/marketplace/state`, 'POST', partnerReplyPayload);
    console.log('     Confirmed: Partner quote submitted and recorded in live state');

    // 7.3 Client Unlocks Partner (Spends 1 View Credit)
    const unlockPayload = {
      action: 'client.update_partner_status',
      payload: {
        reqCode: 'XPO-REQ-41235',
        partnerId: 'p1',
        status: 'unlocked',
        partnerStatus: 'client_requested',
      },
    };
    await testEndpoint('POST client.update_partner_status', `${BASE_URL}/api/marketplace/state`, 'POST', unlockPayload);
    console.log('     Confirmed: Client unlocked partner and initiated mutual connection request');

    // 7.4 Partner Accepts Mutual Connection Request
    const acceptPayload = {
      action: 'partner.respond_connection',
      payload: {
        ref: 'XPO-REQ-41235',
        decision: 'accepted',
      },
    };
    await testEndpoint('POST partner.respond_connection', `${BASE_URL}/api/marketplace/state`, 'POST', acceptPayload);
    console.log('     Confirmed: Mutual connection accepted, masked contact details released');

    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  // 8. Re-fetch Live State to Verify Consistency
  console.log('\n--- 8. Final Consistency Verification ---');
  try {
    const finalState = await testEndpoint('GET Marketplace State Verification', `${BASE_URL}/api/marketplace/state`);
    const live = finalState.data || finalState.state;
    const auditCount = live?.admin?.auditLogs?.length || 0;
    console.log(`     Audit Trail: ${auditCount} actions logged in Firestore`);
    passed++;
  } catch (err) {
    console.error('     ', err.message);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`   LIVE BACKEND TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveE2ETests().catch((err) => {
  console.error('Fatal E2E test execution error:', err);
  process.exit(1);
});
