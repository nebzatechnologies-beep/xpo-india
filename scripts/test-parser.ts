/**
 * Focused unit tests for the deterministic intake parser.
 * Pure function — no Firestore — so it runs standalone: `npx tsx scripts/test-parser.ts`.
 */
import { extractRequirementEntitiesDeterministically } from '../lib/agent/taxonomy-resolver';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${msg}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${msg}`);
  }
}

console.log('--- Intake parser: city / budget / timeline extraction ---');

// 1. Explicit city in the text beats the client's saved city (the core bug).
const r1 = extractRequirementEntitiesDeterministically(
  'Need 5000 custom printed t-shirts in Tirupur within 3 weeks, budget around 3 lakh',
  'Hyderabad'
);
assert(r1.workLocation === 'Tirupur', `Explicit city wins over defaultCity (got "${r1.workLocation}")`);
assert(/3\s*lakh/i.test(r1.estimatedBudget || ''), `Budget "3 lakh" extracted (got "${r1.estimatedBudget}")`);
assert(/within 3 weeks/i.test(r1.timeline), `Timeline "within 3 weeks" extracted (got "${r1.timeline}")`);

// 2. No city in the text → fall back to the client's saved city.
const r2 = extractRequirementEntitiesDeterministically('Need a logo designer, budget 20k', 'Pune');
assert(r2.workLocation === 'Pune', `Falls back to defaultCity when text names none (got "${r2.workLocation}")`);

// 3. Known-city variant canonicalization.
const r3 = extractRequirementEntitiesDeterministically('Looking for a CA in Bangalore', 'Mumbai');
assert(r3.workLocation === 'Bengaluru', `Bangalore canonicalizes to Bengaluru (got "${r3.workLocation}")`);

const r4 = extractRequirementEntitiesDeterministically('packaging supplier in Tiruppur', undefined);
assert(r4.workLocation === 'Tirupur', `Tiruppur canonicalizes to Tirupur (got "${r4.workLocation}")`);

// 4. No city and no default → Pan India.
const r5 = extractRequirementEntitiesDeterministically('Need 200 safety helmets', undefined);
assert(r5.workLocation === 'Pan India', `No city, no default → Pan India (got "${r5.workLocation}")`);

// 5. Noise after a preposition must not be read as a city.
const r6 = extractRequirementEntitiesDeterministically('Need 1000 units available in Bulk', undefined);
assert(r6.workLocation === 'Pan India', `"in Bulk" is not a city (got "${r6.workLocation}")`);

// 6. Rupee-formatted budget.
const r7 = extractRequirementEntitiesDeterministically('10,000 corrugated boxes in Pune, budget ₹1,80,000', 'Delhi');
assert(r7.workLocation === 'Pune', `Known city Pune extracted (got "${r7.workLocation}")`);
assert(/1,80,000/.test(r7.estimatedBudget || ''), `Rupee budget extracted (got "${r7.estimatedBudget}")`);

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
