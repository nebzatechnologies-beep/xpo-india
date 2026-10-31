import {
  parsePhoneNumberFromString,
  getCountries,
  type CountryCode,
} from 'libphonenumber-js';

export interface PhoneNormalizationResult {
  isValid: boolean;
  phoneE164?: string;
  countryIso2?: CountryCode;
  countryCallingCode?: string;
  hadFormattingInconsistencies: boolean;
  errorReason?:
    | 'empty_phone'
    | 'missing_country_code'
    | 'unsupported_country'
    | 'invalid_phone_number';
}

const COUNTRY_NAME_TO_ISO2: Record<string, CountryCode> = {
  india: 'IN',
  in: 'IN',
  'united states': 'US',
  usa: 'US',
  us: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  gb: 'GB',
  uae: 'AE',
  'united arab emirates': 'AE',
  ae: 'AE',
  singapore: 'SG',
  sg: 'SG',
  canada: 'CA',
  ca: 'CA',
  australia: 'AU',
  au: 'AU',
  germany: 'DE',
  de: 'DE',
  saudi: 'SA',
  'saudi arabia': 'SA',
  sa: 'SA',
  qatar: 'QA',
  qa: 'QA',
};

const VALID_ISO2_SET = new Set<string>(getCountries());

export function resolveCountryIso2(countryInput?: string | null): CountryCode | undefined {
  if (!countryInput) return undefined;
  const cleaned = countryInput.trim();
  if (!cleaned) return undefined;
  const upper = cleaned.toUpperCase();
  if (VALID_ISO2_SET.has(upper)) {
    return upper as CountryCode;
  }
  return COUNTRY_NAME_TO_ISO2[cleaned.toLowerCase()];
}

/**
 * Normalizes a raw phone/WhatsApp string to canonical E.164 format.
 *
 * Strictly enforces Report 1 Section 10.4:
 * - Never assumes `+91` unless explicit country confirmation (`confirmedCountry`) is supplied
 *   or the raw number already carries an international prefix (`+` or `00`).
 * - Flags formatting inconsistencies (spaces, hyphens, brackets, `00` prefix, scientific notation).
 */
export function normalizePhoneE164(
  rawInput: unknown,
  confirmedCountry?: string | null
): PhoneNormalizationResult {
  if (rawInput === null || rawInput === undefined) {
    return {
      isValid: false,
      hadFormattingInconsistencies: false,
      errorReason: 'empty_phone',
    };
  }

  let raw = String(rawInput).trim();
  if (!raw) {
    return {
      isValid: false,
      hadFormattingInconsistencies: false,
      errorReason: 'empty_phone',
    };
  }

  // Handle Excel numeric scientific notation e.g. 9.1987654321E+11
  if (/^\d+\.\d+e\+\d+$/i.test(raw)) {
    const expanded = Number(raw);
    if (Number.isFinite(expanded)) {
      raw = Math.round(expanded).toString();
    }
  }

  const hadFormattingInconsistencies = !/^\+\d{7,15}$/.test(raw);

  // Convert international `00` prefix to `+`
  let normalizedCandidate = raw.replace(/[\s\-().]/g, '');
  if (normalizedCandidate.startsWith('00')) {
    normalizedCandidate = `+${normalizedCandidate.slice(2)}`;
  }

  const explicitIso2 = resolveCountryIso2(confirmedCountry);

  if (!normalizedCandidate.startsWith('+')) {
    if (!explicitIso2) {
      return {
        isValid: false,
        hadFormattingInconsistencies: true,
        errorReason: 'missing_country_code',
      };
    }
  }

  const parsed = normalizedCandidate.startsWith('+')
    ? parsePhoneNumberFromString(normalizedCandidate)
    : parsePhoneNumberFromString(normalizedCandidate, explicitIso2);

  if (!parsed || !parsed.isValid()) {
    return {
      isValid: false,
      hadFormattingInconsistencies,
      errorReason: 'invalid_phone_number',
    };
  }

  return {
    isValid: true,
    phoneE164: parsed.number,
    countryIso2: parsed.country || explicitIso2,
    countryCallingCode: `+${parsed.countryCallingCode}`,
    hadFormattingInconsistencies,
  };
}
