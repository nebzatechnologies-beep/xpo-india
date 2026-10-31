import { getFirebaseAdmin, requireFirestore } from '../lib/firebase/admin';
import { getPlatformSettings } from '../lib/services/platform-settings';
import { ensureInitialTaxonomySeeded } from '../lib/services/taxonomy';
import { ensureTemplatesInitialized } from '../lib/whatsapp/meta-client';
import { ensureAuthenticatedUser } from '../lib/services/users';

async function main() {
  console.log('--- Initializing XPO India Platform Baseline Data ---');

  const { isConfigured, db } = getFirebaseAdmin();
  if (!isConfigured || !db) {
    console.error('Firebase Admin is not configured. Check environment variables.');
    process.exit(1);
  }

  // 1. Seed Platform Settings
  console.log('1. Checking Platform Settings...');
  const settings = await getPlatformSettings();
  console.log('   Platform Settings active:', {
    roles: settings.roles,
    partnersPerRound: settings.leadDistribution.partnersPerRound,
    responseWindowSec: settings.leadDistribution.responseWindowSeconds,
    partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
    partnerPriceInr: settings.subscriptions.partnerInrMonthlyPrice,
  });

  // 2. Seed Baseline 4-Tier Taxonomy
  console.log('2. Checking 4-Tier Taxonomy (Sectors, Categories, Subcategories, Tags)...');
  await ensureInitialTaxonomySeeded();
  const secSnap = await db.collection('taxonomy_sectors').get();
  const catSnap = await db.collection('taxonomy_categories').get();
  console.log(`   Taxonomy initialized: ${secSnap.size} sectors, ${catSnap.size} categories.`);

  // 3. Seed Meta WhatsApp Message Templates
  console.log('3. Checking Meta WhatsApp Message Templates...');
  const templates = await ensureTemplatesInitialized();
  console.log(`   WhatsApp Templates initialized: ${templates.length} registered templates.`);

  console.log('--- XPO India Platform Baseline Seeding Complete! (No dummy accounts seeded) ---');
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
