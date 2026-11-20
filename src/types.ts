export type ScreenId =
  | 'home-wallet'
  | 'transfers'
  | 'market-public'
  | 'admin-console'
  | 'profile-auth'
  | 'sign-up'
  | 'kyc-docs'
  | 'kyc-liveness'
  | 'kyc-success'
  | 'fund-wallet'
  | 'deposit-success';

export type PrimaryTabId =
  | 'home-wallet'
  | 'transfers'
  | 'market-public'
  | 'admin-console'
  | 'profile-auth';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  accountType: 'personal' | 'business';
  isRegistered: boolean;
}

export interface TransactionItem {
  id: string;
  title: string;
  timestamp: string;
  status: string;
  amount: number;
  currency: string;
  vaultLabel: string;
  type: 'inflow' | 'outflow' | 'yield';
  icon: string;
}

export interface AdminUser {
  id: string;
  accountCode: string;
  name: string;
  tier: string;
  avatar: string;
  balance: number;
  kycStatus: 'KYC Verified' | 'AML Flagged' | 'Verified Entity' | 'Pending KYC';
  roleLabel: string;
  roleCategory: 'Compliance Officer' | 'Institutional' | 'Personal';
  limitLabel: string;
  alertNote?: string;
  frozen: boolean;
}

export interface AuditEntry {
  id: string;
  event: string;
  actor: string;
  timeAgo: string;
}

export interface DepositReceiptData {
  amount: number;
  previousBalance: number;
  newBalance: number;
  railName: string;
  referenceId: string;
  authCode: string;
  enclaveHash: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  targetScreen?: ScreenId;
}
