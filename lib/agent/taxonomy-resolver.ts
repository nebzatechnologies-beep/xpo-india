import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import type {
  TaxonomyCategory,
  TaxonomySector,
  TaxonomySubcategory,
} from '@/lib/types/domain';

export interface ResolvedTaxonomyMatch {
  sector: TaxonomySector;
  category: TaxonomyCategory;
  subcategory: TaxonomySubcategory | null;
  skillTagIds: string[];
  matchedSkillNames: string[];
  confidence: 'high' | 'medium' | 'low';
}

const DOMAIN_SYNONYMS: Array<{
  keywords: string[];
  categoryCodeHint: string;
}> = [
  {
    keywords: [
      'website',
      'web app',
      'webapp',
      'e-commerce',
      'ecommerce',
      'shopify',
      'react',
      'next.js',
      'nextjs',
      'node',
      'mobile app',
      'android',
      'ios',
      'flutter',
      'saas',
      'portal',
      'software developer',
    ],
    categoryCodeHint: 'CAT-WEB-APP',
  },
  {
    keywords: [
      'ai',
      'chatbot',
      'whatsapp bot',
      'automation',
      'erp',
      'crm',
      'odoo',
      'sap',
      'salesforce',
      'cloud',
      'aws',
      'gcp',
      'devops',
      'llm',
      'data pipeline',
    ],
    categoryCodeHint: 'CAT-ERP-AI',
  },
  {
    keywords: [
      'cnc',
      'machining',
      'lathe',
      'vmc',
      'milling',
      'turning',
      'fabrication',
      'sheet metal',
      'laser cutting',
      'welding',
      'oem',
      'precision',
      'tooling',
    ],
    categoryCodeHint: 'CAT-CNC-FAB',
  },
  {
    keywords: [
      'packaging',
      'corrugated',
      'carton',
      'boxes',
      'bopp',
      'pouch',
      'labels',
      'pallet',
      'raw material',
    ],
    categoryCodeHint: 'CAT-PACK-RAW',
  },
  {
    keywords: [
      'ui',
      'ux',
      'ui/ux',
      'figma',
      'branding',
      'logo',
      'brand identity',
      'graphic design',
      'design system',
      'pitch deck',
    ],
    categoryCodeHint: 'CAT-UIUX-BRAND',
  },
  {
    keywords: [
      'marketing',
      'seo',
      'google ads',
      'meta ads',
      'facebook ads',
      'lead generation',
      'digital marketing',
      'social media',
      'performance marketing',
    ],
    categoryCodeHint: 'CAT-PERF-MKT',
  },
  {
    keywords: [
      'interior',
      'interiors',
      'fit-out',
      'fitout',
      'office renovation',
      'modular workstation',
      'hvac',
      'civil',
      'mep',
      'architecture',
      'turnkey office',
    ],
    categoryCodeHint: 'CAT-COMM-INT',
  },
  {
    keywords: [
      'solar',
      'rooftop',
      'epc',
      'electrical panel',
      'lt panel',
      'ht panel',
      'net metering',
      'inverter',
      'energy audit',
    ],
    categoryCodeHint: 'CAT-SOLAR-EPC',
  },
  {
    keywords: [
      'gst',
      'tax',
      'audit',
      'chartered accountant',
      'accounting',
      'bookkeeping',
      'virtual cfo',
      'roc',
      'compliance',
      'legal',
      'fema',
      'payroll',
    ],
    categoryCodeHint: 'CAT-FIN-TAX',
  },
];

const KNOWN_CITIES = [
  'Bengaluru',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'New Delhi',
  'Gurugram',
  'Gurgaon',
  'Noida',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Ahmedabad',
  'Kolkata',
  'Surat',
  'Coimbatore',
  'Jaipur',
  'Indore',
  'Kochi',
  'Chandigarh',
  'Vadodara',
  'Nagpur',
  'Ludhiana',
  'Rajkot',
  'Nashik',
  'Visakhapatnam',
  'Remote',
  'Pan India',
  'Dubai',
  'Singapore',
  'London',
  'New York',
];

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export async function resolveTaxonomyFromNaturalLanguage(
  text: string
): Promise<ResolvedTaxonomyMatch> {
  const tree = await getFullTaxonomyTree();
  const lower = text.toLowerCase();
  const tokens = new Set(tokenize(text));

  let bestCat: TaxonomyCategory = tree.categories[0]!;
  let bestScore = -1;

  for (const cat of tree.categories) {
    let score = 0;
    const catLower = cat.name.toLowerCase();
    if (lower.includes(catLower)) score += 25;

    for (const word of tokenize(cat.name)) {
      if (tokens.has(word)) score += 5;
    }

    const synGroup = DOMAIN_SYNONYMS.find((s) => s.categoryCodeHint === cat.code);
    if (synGroup) {
      for (const kw of synGroup.keywords) {
        if (lower.includes(kw)) score += 10;
      }
    }

    const childSubs = tree.subcategories.filter((s) => s.categoryId === cat.id);
    for (const sub of childSubs) {
      if (lower.includes(sub.name.toLowerCase())) score += 15;
      for (const word of tokenize(sub.name)) {
        if (tokens.has(word)) score += 3;
      }
      const subTags = tree.tags.filter((t) => sub.tagIds.includes(t.id));
      for (const tag of subTags) {
        if (lower.includes(tag.name.toLowerCase())) score += 8;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  const sector =
    tree.sectors.find((s) => s.id === bestCat.sectorId) || tree.sectors[0]!;

  const candidateSubs = tree.subcategories.filter((s) => s.categoryId === bestCat.id);
  let bestSub: TaxonomySubcategory | null = candidateSubs[0] || null;
  let bestSubScore = -1;

  for (const sub of candidateSubs) {
    let subScore = 0;
    if (lower.includes(sub.name.toLowerCase())) subScore += 20;
    for (const word of tokenize(sub.name)) {
      if (tokens.has(word)) subScore += 4;
    }
    for (const tagId of sub.tagIds) {
      const tag = tree.tags.find((t) => t.id === tagId);
      if (tag && lower.includes(tag.name.toLowerCase())) subScore += 8;
    }
    if (subScore > bestSubScore) {
      bestSubScore = subScore;
      bestSub = sub;
    }
  }

  const matchedTags = tree.tags.filter((t) => lower.includes(t.name.toLowerCase()));
  const fallbackSubTagIds = bestSub?.tagIds || [];
  const combinedTagIds = Array.from(
    new Set([...matchedTags.map((t) => t.id), ...fallbackSubTagIds])
  ).slice(0, 8);

  const matchedSkillNames = combinedTagIds
    .map((id) => tree.tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  return {
    sector,
    category: bestCat,
    subcategory: bestSub,
    skillTagIds: combinedTagIds,
    matchedSkillNames,
    confidence: bestScore >= 12 ? 'high' : bestScore >= 4 ? 'medium' : 'low',
  };
}

export function extractRequirementEntitiesDeterministically(
  text: string,
  defaultCity?: string
): {
  title: string;
  workLocation: string;
  timeline: string;
  estimatedBudget: string | null;
} {
  const clean = text.replace(/\s+/g, ' ').trim();

  // Extract location
  let workLocation = defaultCity?.trim() || '';
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(clean)) {
      workLocation = city === 'Bangalore' ? 'Bengaluru' : city === 'Gurgaon' ? 'Gurugram' : city;
      break;
    }
  }
  if (!workLocation) {
    const locMatch = clean.match(/\b(?:in|at|for|location[:\s]+)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    if (locMatch?.[1]) {
      workLocation = locMatch[1].trim();
    }
  }

  // Extract budget
  let estimatedBudget: string | null = null;
  const budgetMatch =
    clean.match(/(?:₹|rs\.?|inr|\$|usd)\s*[\d,.]+\s*(?:k|lakh|lakhs|cr|crore|m)?(?:\s*-\s*(?:₹|rs\.?|inr|\$|usd)?\s*[\d,.]+\s*(?:k|lakh|lakhs|cr|crore|m)?)?/i) ||
    clean.match(/\b\d+(?:\.\d+)?\s*(?:lakh|lakhs|crore|cr)\b/i);
  if (budgetMatch?.[0]) {
    estimatedBudget = budgetMatch[0].trim();
  }

  // Extract timeline
  let timeline = 'Within 2-4 weeks';
  const timelineMatch =
    clean.match(/\b(?:within|in|next)\s+\d+\s*(?:days?|weeks?|months?)\b/i) ||
    clean.match(/\b(?:immediate|urgent|asap|this week|this month|\d+\s*(?:days?|weeks?|months?))\b/i);
  if (timelineMatch?.[0]) {
    const rawTl = timelineMatch[0].trim();
    timeline = rawTl.charAt(0).toUpperCase() + rawTl.slice(1);
  }

  // Build concise requirement title
  const firstSentence = clean.split(/[.!?\n]/)[0]?.trim() || clean;
  const strippedPrefix = firstSentence
    .replace(/^(?:i\s+need|we\s+need|looking\s+for|require|want\s+to\s+hire|need\s+a|need\s+an|need)\s+/i, '')
    .trim();
  const rawTitle = strippedPrefix.length >= 6 ? strippedPrefix : clean;
  const title =
    rawTitle.length > 76
      ? `${rawTitle.slice(0, 73).trim()}...`
      : rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  return {
    title: title || 'Business Service Requirement',
    workLocation: workLocation || 'Pan India',
    timeline,
    estimatedBudget,
  };
}
