export interface CountryOption {
  iso: string;
  name: string;
  localName: string;
  languageCode: string;
  languageLabel: string;
  dialCode: string;
  examplePrefix: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  stripLeadingZero: boolean;
  startsWith?: string;
}

export const SUPPORTED_COUNTRIES: readonly CountryOption[] = [
  {
    iso: 'BD',
    name: 'Bangladesh',
    localName: 'বাংলাদেশ',
    languageCode: 'bn',
    languageLabel: 'বাংলা',
    dialCode: '880',
    examplePrefix: '+8801',
    placeholder: '1712345678',
    minDigits: 10,
    maxDigits: 10,
    stripLeadingZero: true,
    startsWith: '1',
  },
  {
    iso: 'IN',
    name: 'India',
    localName: 'भारत',
    languageCode: 'hi',
    languageLabel: 'हिन्दी / বাংলা',
    dialCode: '91',
    examplePrefix: '+91',
    placeholder: '9876543210',
    minDigits: 10,
    maxDigits: 10,
    stripLeadingZero: true,
  },
  {
    iso: 'PK',
    name: 'Pakistan',
    localName: 'پاکستان',
    languageCode: 'ur',
    languageLabel: 'اردو',
    dialCode: '92',
    examplePrefix: '+92',
    placeholder: '3001234567',
    minDigits: 10,
    maxDigits: 10,
    stripLeadingZero: true,
  },
  {
    iso: 'SA',
    name: 'Saudi Arabia',
    localName: 'السعودية',
    languageCode: 'ar',
    languageLabel: 'العربية',
    dialCode: '966',
    examplePrefix: '+966',
    placeholder: '501234567',
    minDigits: 9,
    maxDigits: 9,
    stripLeadingZero: true,
  },
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    localName: 'الإمارات',
    languageCode: 'ar',
    languageLabel: 'العربية',
    dialCode: '971',
    examplePrefix: '+971',
    placeholder: '501234567',
    minDigits: 9,
    maxDigits: 9,
    stripLeadingZero: true,
  },
  {
    iso: 'MY',
    name: 'Malaysia',
    localName: 'Malaysia',
    languageCode: 'ms',
    languageLabel: 'Bahasa Melayu',
    dialCode: '60',
    examplePrefix: '+60',
    placeholder: '123456789',
    minDigits: 9,
    maxDigits: 10,
    stripLeadingZero: true,
  },
  {
    iso: 'SG',
    name: 'Singapore',
    localName: 'Singapore',
    languageCode: 'zh',
    languageLabel: 'English / 中文 / தமிழ்',
    dialCode: '65',
    examplePrefix: '+65',
    placeholder: '81234567',
    minDigits: 8,
    maxDigits: 8,
    stripLeadingZero: false,
  },
  {
    iso: 'GB',
    name: 'United Kingdom',
    localName: 'United Kingdom',
    languageCode: 'en',
    languageLabel: 'English',
    dialCode: '44',
    examplePrefix: '+44',
    placeholder: '7911123456',
    minDigits: 10,
    maxDigits: 10,
    stripLeadingZero: true,
  },
  {
    iso: 'US',
    name: 'United States',
    localName: 'United States',
    languageCode: 'en',
    languageLabel: 'English',
    dialCode: '1',
    examplePrefix: '+1',
    placeholder: '4155550134',
    minDigits: 10,
    maxDigits: 10,
    stripLeadingZero: false,
  },
  {
    iso: 'ID',
    name: 'Indonesia',
    localName: 'Indonesia',
    languageCode: 'id',
    languageLabel: 'Bahasa Indonesia',
    dialCode: '62',
    examplePrefix: '+62',
    placeholder: '81234567890',
    minDigits: 9,
    maxDigits: 12,
    stripLeadingZero: true,
  },
] as const;

export interface PhoneValidationResult {
  valid: boolean;
  country: CountryOption;
  localDigits: string;
  e164Digits: string;
  displayNumber: string;
  error?: string;
}

export function getCountryByIso(iso: string): CountryOption {
  const found = SUPPORTED_COUNTRIES.find((c) => c.iso === iso);
  return found ?? SUPPORTED_COUNTRIES[0];
}

export function normalizePhoneNumber(
  countryIso: string,
  rawInput: string
): PhoneValidationResult {
  const country = getCountryByIso(countryIso);
  let digits = rawInput.replace(/\D/g, '');

  if (!digits) {
    return {
      valid: false,
      country,
      localDigits: '',
      e164Digits: '',
      displayNumber: '',
      error: `Enter a valid WhatsApp number for ${country.name} (+${country.dialCode}).`,
    };
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (
    digits.startsWith(country.dialCode) &&
    digits.length > country.dialCode.length + country.minDigits - 1
  ) {
    digits = digits.slice(country.dialCode.length);
  }

  if (country.stripLeadingZero && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (country.startsWith && !digits.startsWith(country.startsWith)) {
    return {
      valid: false,
      country,
      localDigits: digits,
      e164Digits: '',
      displayNumber: '',
      error: `${country.name} WhatsApp numbers must begin with ${country.examplePrefix} (e.g., ${country.examplePrefix}${country.placeholder.slice(1)}).`,
    };
  }

  if (digits.length < country.minDigits || digits.length > country.maxDigits) {
    const lengthHint =
      country.minDigits === country.maxDigits
        ? `${country.minDigits}`
        : `${country.minDigits}–${country.maxDigits}`;
    return {
      valid: false,
      country,
      localDigits: digits,
      e164Digits: '',
      displayNumber: '',
      error: `${country.name} (+${country.dialCode}) numbers require ${lengthHint} digits after the country code.`,
    };
  }

  const e164Digits = `${country.dialCode}${digits}`;
  const displayNumber = `+${country.dialCode} ${digits}`;

  return {
    valid: true,
    country,
    localDigits: digits,
    e164Digits,
    displayNumber,
  };
}

export function formatPairingCode(rawCode: string): string {
  const clean = rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}
