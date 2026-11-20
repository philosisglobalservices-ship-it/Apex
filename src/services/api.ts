import { auth } from '../lib/firebase';
import { AdminUser, AuditEntry } from '../types';

export interface BackendHealthResponse {
  ok: boolean;
  service: string;
  authProvider: string;
  firebaseProjectId: string;
  databaseId: string;
  timestamp: string;
}

export interface MarketOverviewResponse {
  treasuryApy: number;
  fxUsdToEur: number;
  slaUptime: string;
  settlementVelocityMs: number;
  globalVolumeLabel: string;
  updatedAt: string;
}

export interface BackendSessionResponse {
  authenticated: boolean;
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: 'client' | 'admin';
  firebaseProjectId: string;
  databaseId: string;
}

export interface TransferAuthorizationResponse {
  referenceId: string;
  recipientName: string;
  recipientTag: string;
  amount: number;
  category: string;
  rail: 'contacts' | 'nibss';
  bankCode?: string;
  accountNumber?: string;
  nibssSessionId?: string;
  authorizedAt: string;
  timestamp: string;
}

export interface DepositAuthorizationResponse {
  amount: number;
  railName: string;
  referenceId: string;
  authCode: string;
  enclaveHash: string;
  timestamp: string;
}

export interface ComplianceExportResponse {
  exportedAt: string;
  exportedBy: string;
  node: string;
  databaseId: string;
  signatureHash: string;
  usersCount: number;
  auditCount: number;
  users: AdminUser[];
  auditFeed: AuditEntry[];
}

export interface TransferReceiptPayload {
  referenceId: string;
  recipientName: string;
  recipientTag: string;
  amount: number;
  category: string;
  currency: string;
  timestamp: string;
  remainingBalance: number;
  nibssSessionId?: string;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const { requireAuth = false, headers, ...rest } = options;
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (requireAuth) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Sign in with Google to authorize this request.');
    }
    const idToken = await currentUser.getIdToken();
    mergedHeaders.Authorization = `Bearer ${idToken}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    const err = new Error(data.error || `Backend request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  return data;
}

export const apexApi = {
  getHealth: (signal?: AbortSignal) =>
    apiFetch<BackendHealthResponse>('/api/health', { signal }),

  getMarketOverview: (signal?: AbortSignal) =>
    apiFetch<MarketOverviewResponse>('/api/market/overview', { signal }),

  verifyBackendSession: () =>
    apiFetch<BackendSessionResponse>('/api/auth/session', {
      requireAuth: true,
    }),

  authorizeTransfer: (payload: {
    recipientName: string;
    recipientTag: string;
    amount: number;
    category: string;
    rail: 'contacts' | 'nibss';
    bankCode?: string;
    accountNumber?: string;
  }) =>
    apiFetch<TransferAuthorizationResponse>('/api/transfers/authorize', {
      method: 'POST',
      body: JSON.stringify(payload),
      requireAuth: true,
    }),

  authorizeDeposit: (payload: { amount: number; railName: string }) =>
    apiFetch<DepositAuthorizationResponse>('/api/deposits/authorize', {
      method: 'POST',
      body: JSON.stringify(payload),
      requireAuth: true,
    }),

  exportComplianceReport: (payload: { users: AdminUser[]; auditFeed: AuditEntry[] }) =>
    apiFetch<ComplianceExportResponse>('/api/admin/compliance-export', {
      method: 'POST',
      body: JSON.stringify(payload),
      requireAuth: true,
    }),
};
