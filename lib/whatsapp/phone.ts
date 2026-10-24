// ============================================================================
// XPO — International E.164 Phone Number Validator & Normalizer (Module 7)
// Does NOT assume all phone numbers belong to India. Preserves original values.
// ============================================================================

export interface NormalizedPhoneResult {
  valid: boolean;
  e164: string;
  countryCode: string;
  countryIso: string;
  nationalNumber: string;
  originalRaw: string;
  error?: string;
}

interface CountryDialRule {
  code: string;
  iso: string;
  minNationalLength: number;
  maxNationalLength: number;
}

const COUNTRY_RULES: CountryDialRule[] = [
  { code: '91', iso: 'IN', minNationalLength: 10, maxNationalLength: 10 },
  { code: '1', iso: 'US/CA', minNationalLength: 10, maxNationalLength: 10 },
  { code: '44', iso: 'GB', minNationalLength: 9, maxNationalLength: 10 },
  { code: '971', iso: 'AE', minNationalLength: 8, maxNationalLength: 9 },
  { code: '65', iso: 'SG', minNationalLength: 8, maxNationalLength: 8 },
  { code: '61', iso: 'AU', minNationalLength: 9, maxNationalLength: 9 },
  { code: '49', iso: 'DE', minNationalLength: 9, maxNationalLength: 11 },
  { code: '33', iso: 'FR', minNationalLength: 9, maxNationalLength: 9 },
  { code: '358', iso: 'FI', minNationalLength: 7, maxNationalLength: 10 },
  { code: '81', iso: 'JP', minNationalLength: 9, maxNationalLength: 10 },
  { code: '966', iso: 'SA', minNationalLength: 9, maxNationalLength: 9 },
  { code: '974', iso: 'QA', minNationalLength: 8, maxNationalLength: 8 },
  { code: '60', iso: 'MY', minNationalLength: 8, maxNationalLength: 10 },
  { code: '27', iso: 'ZA', minNationalLength: 9, maxNationalLength: 9 },
];

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  india: '91',
  in: '91',
  usa: '1',
  'united states': '1',
  us: '1',
  canada: '1',
  ca: '1',
  uk: '44',
  'united kingdom': '44',
  gb: '44',
  uae: '971',
  'united arab emirates': '971',
  dubai: '971',
  ae: '971',
  singapore: '65',
  sg: '65',
  australia: '61',
  au: '61',
  germany: '49',
  de: '49',
  france: '33',
  fr: '33',
  finland: '358',
  fi: '358',
  japan: '81',
  jp: '81',
  'saudi arabia': '966',
  sa: '966',
  qatar: '974',
  qa: '974',
  malaysia: '60',
  my: '60',
  'south africa': '27',
  za: '27',
};

export function normalizePhoneE164(
  rawInput: string | number | undefined | null,
  explicitCountryCodeOrCountry?: string | null
): NormalizedPhoneResult {
  const originalRaw = rawInput !== undefined && rawInput !== null ? String(rawInput).trim() : '';
  if (!originalRaw) {
    return {
      valid: false,
      e164: '',
      countryCode: '',
      countryIso: '',
      nationalNumber: '',
      originalRaw,
      error: 'Missing phone number',
    };
  }

  // Strip formatting characters except leading +
  let cleaned = originalRaw.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Resolve explicit country code if provided
  let explicitDialCode = '';
  if (explicitCountryCodeOrCountry) {
    const rawCc = String(explicitCountryCodeOrCountry).trim().toLowerCase();
    const digitsOnly = rawCc.replace(/^\+/, '').replace(/\D/g, '');
    if (digitsOnly && digitsOnly.length <= 4) {
      explicitDialCode = digitsOnly;
    } else if (COUNTRY_NAME_TO_CODE[rawCc]) {
      explicitDialCode = COUNTRY_NAME_TO_CODE[rawCc];
    }
  }

  // Case 1: Starts with '+' (international format)
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d{7,15}$/.test(digits)) {
      return {
        valid: false,
        e164: '',
        countryCode: '',
        countryIso: '',
        nationalNumber: '',
        originalRaw,
        error: `Invalid international E.164 digit length (${digits.length} digits)`,
      };
    }

    // Match longest country dial code first
    const sortedRules = [...COUNTRY_RULES].sort((a, b) => b.code.length - a.code.length);
    for (const rule of sortedRules) {
      if (digits.startsWith(rule.code)) {
        const national = digits.slice(rule.code.length);
        if (national.length >= rule.minNationalLength && national.length <= rule.maxNationalLength) {
          return {
            valid: true,
            e164: `+${rule.code}${national}`,
            countryCode: `+${rule.code}`,
            countryIso: rule.iso,
            nationalNumber: national,
            originalRaw,
          };
        }
      }
    }

    // Generic E.164 fallback for other valid ITU-T countries (8 to 15 total digits)
    if (digits.length >= 8 && digits.length <= 15) {
      const guessedCc = digits.slice(0, digits.length > 11 ? 3 : 2);
      const national = digits.slice(guessedCc.length);
      return {
        valid: true,
        e164: `+${digits}`,
        countryCode: `+${guessedCc}`,
        countryIso: 'INTL',
        nationalNumber: national,
        originalRaw,
      };
    }
  }

  // Case 2: No leading '+' — check digits only
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) {
    return {
      valid: false,
      e164: '',
      countryCode: '',
      countryIso: '',
      nationalNumber: '',
      originalRaw,
      error: 'Phone number contains no digits',
    };
  }

  // Strip single leading trunk '0' if present (e.g., 09820012345 -> 9820012345)
  const withoutTrunkZero = digits.startsWith('0') && digits.length === 11 ? digits.slice(1) : digits;

  // If explicit country code was supplied
  if (explicitDialCode) {
    const national = withoutTrunkZero.startsWith(explicitDialCode) && withoutTrunkZero.length > 10
      ? withoutTrunkZero.slice(explicitDialCode.length)
      : withoutTrunkZero;
    const rule = COUNTRY_RULES.find((r) => r.code === explicitDialCode);
    if (rule) {
      if (national.length < rule.minNationalLength || national.length > rule.maxNationalLength) {
        return {
          valid: false,
          e164: '',
          countryCode: `+${explicitDialCode}`,
          countryIso: rule.iso,
          nationalNumber: national,
          originalRaw,
          error: `Expected ${rule.minNationalLength}-${rule.maxNationalLength} national digits for +${explicitDialCode}`,
        };
      }
      return {
        valid: true,
        e164: `+${explicitDialCode}${national}`,
        countryCode: `+${explicitDialCode}`,
        countryIso: rule.iso,
        nationalNumber: national,
        originalRaw,
      };
    }
    if (national.length >= 7 && national.length <= 12) {
      return {
        valid: true,
        e164: `+${explicitDialCode}${national}`,
        countryCode: `+${explicitDialCode}`,
        countryIso: 'INTL',
        nationalNumber: national,
        originalRaw,
      };
    }
  }

  // If 12 digits starting with 91 and valid Indian mobile first digit [6-9]
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return {
      valid: true,
      e164: `+${digits}`,
      countryCode: '+91',
      countryIso: 'IN',
      nationalNumber: digits.slice(2),
      originalRaw,
    };
  }

  // If 10 digits starting with [6-9] and no conflicting country specified -> valid Indian mobile
  if (withoutTrunkZero.length === 10 && /^[6-9]\d{9}$/.test(withoutTrunkZero)) {
    return {
      valid: true,
      e164: `+91${withoutTrunkZero}`,
      countryCode: '+91',
      countryIso: 'IN',
      nationalNumber: withoutTrunkZero,
      originalRaw,
    };
  }

  // If 11-15 digits that match a known international country prefix without '+'
  const sortedRules = [...COUNTRY_RULES].sort((a, b) => b.code.length - a.code.length);
  for (const rule of sortedRules) {
    if (digits.startsWith(rule.code)) {
      const national = digits.slice(rule.code.length);
      if (national.length >= rule.minNationalLength && national.length <= rule.maxNationalLength) {
        return {
          valid: true,
          e164: `+${rule.code}${national}`,
          countryCode: `+${rule.code}`,
          countryIso: rule.iso,
          nationalNumber: national,
          originalRaw,
        };
      }
    }
  }

  return {
    valid: false,
    e164: '',
    countryCode: '',
    countryIso: '',
    nationalNumber: digits,
    originalRaw,
    error: 'Ambiguous or invalid phone format; include country code (e.g. +91, +1, +44, +971)',
  };
}
