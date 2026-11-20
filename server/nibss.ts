export interface NigerianBank {
  code: string;
  name: string;
  shortName: string;
}

export interface NibssEnquiryResult {
  verified: boolean;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  bvnMatched: boolean;
  kycLevel: string;
  sessionId: string;
  responseCode: string;
  errorMessage?: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { code: '058', name: 'Guaranty Trust Bank (GTBank)', shortName: 'GTBank' },
  { code: '044', name: 'Access Bank Plc', shortName: 'Access Bank' },
  { code: '057', name: 'Zenith Bank Plc', shortName: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)', shortName: 'UBA' },
  { code: '011', name: 'First Bank of Nigeria', shortName: 'First Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank', shortName: 'Kuda MFB' },
  { code: '999992', name: 'OPay Digital Services', shortName: 'OPay' },
  { code: '50515', name: 'Moniepoint Microfinance Bank', shortName: 'Moniepoint' },
  { code: '070', name: 'Fidelity Bank Plc', shortName: 'Fidelity Bank' },
  { code: '221', name: 'Stanbic IBTC Bank', shortName: 'Stanbic IBTC' },
];

const KNOWN_NUBAN_DIRECTORY: Record<string, { name: string; kycLevel: string }> = {
  '0123456789': { name: 'ADEBAYO OLUMIDE JOHNSON', kycLevel: 'Tier 3 • BVN Verified' },
  '0234567890': { name: 'CHIOMA EZEKIEL NWOSU', kycLevel: 'Tier 3 • BVN Verified' },
  '1122334455': { name: 'IBRAHIM MUSA DANJUMA', kycLevel: 'Tier 2 • BVN Verified' },
  '2001002001': { name: 'TECHCORP NIGERIA LIMITED', kycLevel: 'Corporate • CAC & BVN' },
  '9876543210': { name: 'ZAINAB BELLO ABUBAKAR', kycLevel: 'Tier 3 • BVN Verified' },
  '3045678912': { name: 'TOCHUKWU EMMANUEL OKAFOR', kycLevel: 'Tier 3 • BVN Verified' },
};

const FIRST_NAMES = [
  'CHINEDU',
  'OLUWASEUN',
  'FATIMA',
  'TEMITOPE',
  'IFEANYI',
  'AISHA',
  'BABATUNDE',
  'NGOZI',
  'SULEIMAN',
  'FUNMILAYO',
];

const MIDDLE_NAMES = [
  'ADEWALE',
  'CHUKWUMA',
  'UMAR',
  'OLABISI',
  'OBINNA',
  'YUSUF',
  'FOLASHADE',
  'KELECHI',
  'ABDULLAHI',
  'MORENIKE',
];

const LAST_NAMES = [
  'OKAFOR',
  'ADEBAYO',
  'BALARABE',
  'EZE',
  'OGUNLEYE',
  'SANUSI',
  'NWANKWO',
  'ADESINA',
  'GARBA',
  'ONWUKA',
];

function deriveDeterministicName(accountNumber: string, bankCode: string): string {
  const seedStr = `${bankCode}:${accountNumber}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const middle = MIDDLE_NAMES[(hash >> 4) % MIDDLE_NAMES.length];
  const last = LAST_NAMES[(hash >> 8) % LAST_NAMES.length];
  return `${first} ${middle} ${last}`;
}

export async function performNibssNameEnquiry(
  accountNumber: string,
  bankCode: string
): Promise<NibssEnquiryResult> {
  const cleaned = String(accountNumber || '').replace(/\D/g, '');
  const bank = NIGERIAN_BANKS.find((b) => b.code === bankCode);

  if (!bank) {
    return {
      verified: false,
      accountNumber: cleaned,
      bankCode: String(bankCode || ''),
      bankName: 'Unknown Institution',
      accountName: '',
      bvnMatched: false,
      kycLevel: 'Unverified',
      sessionId: '',
      responseCode: '92',
      errorMessage: 'Selected destination bank code is not recognized by NIBSS.',
    };
  }

  // Simulate realistic NIBSS NIP round-trip latency
  const delayMs = 260 + (cleaned.length >= 10 ? (cleaned.charCodeAt(9) % 4) * 55 : 50);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (cleaned.length !== 10) {
    return {
      verified: false,
      accountNumber: cleaned,
      bankCode: bank.code,
      bankName: bank.shortName,
      accountName: '',
      bvnMatched: false,
      kycLevel: 'Unverified',
      sessionId: '',
      responseCode: '16',
      errorMessage: 'NUBAN must be exactly 10 digits.',
    };
  }

  if (cleaned === '0000000000' || cleaned === '9999999999') {
    return {
      verified: false,
      accountNumber: cleaned,
      bankCode: bank.code,
      bankName: bank.shortName,
      accountName: '',
      bvnMatched: false,
      kycLevel: 'Not Found',
      sessionId: `0000${bank.code.slice(0, 3)}${Date.now().toString().slice(-10)}`,
      responseCode: '25',
      errorMessage: `NIBSS NIP (25): Account ${cleaned} could not be located at ${bank.shortName}.`,
    };
  }

  const known = KNOWN_NUBAN_DIRECTORY[cleaned];
  const accountName = known ? known.name : deriveDeterministicName(cleaned, bank.code);
  const kycLevel = known ? known.kycLevel : 'Tier 2 • BVN Verified';

  return {
    verified: true,
    accountNumber: cleaned,
    bankCode: bank.code,
    bankName: bank.shortName,
    accountName,
    bvnMatched: true,
    kycLevel,
    sessionId: `000013${bank.code.padStart(3, '0').slice(0, 3)}${Date.now().toString().slice(-10)}`,
    responseCode: '00',
  };
}
