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

export async function fetchNigerianBanks(signal?: AbortSignal): Promise<NigerianBank[]> {
  const response = await fetch('/api/nibss/banks', { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch NIBSS bank directory (${response.status})`);
  }
  const data = (await response.json()) as { banks?: NigerianBank[] };
  return Array.isArray(data.banks) && data.banks.length > 0 ? data.banks : NIGERIAN_BANKS;
}

export async function lookupNibssAccountName(
  accountNumber: string,
  bankCode: string,
  signal?: AbortSignal
): Promise<NibssEnquiryResult> {
  const cleaned = accountNumber.replace(/\D/g, '');
  const response = await fetch('/api/nibss/name-enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountNumber: cleaned, bankCode }),
    signal,
  });

  const data = (await response.json()) as NibssEnquiryResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'NIBSS Name Enquiry failed');
  }
  return data;
}
