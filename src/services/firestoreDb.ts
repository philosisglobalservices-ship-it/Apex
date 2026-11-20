import type { User } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  APEX_IMAGES,
  INITIAL_ADMIN_USERS,
  INITIAL_AUDIT_FEED,
} from '../data/mockData';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import {
  AdminUser,
  AuditEntry,
  DepositReceiptData,
  NotificationItem,
  ScreenId,
  TransactionItem,
  UserProfile,
} from '../types';
import { TransferReceiptPayload } from './api';
import { NIGERIAN_BANKS } from './nibssService';

export const BOOTSTRAP_ADMIN_EMAIL = 'philosisglobalservices@gmail.com';

export interface FirestoreWalletState {
  usdBalance: number;
  eurBalance: number;
  usdcBalance: number;
  cardFrozen: boolean;
  accountFrozen: boolean;
}

export interface OnboardingProfileOverrides {
  fullName?: string;
  phone?: string;
  accountType?: 'personal' | 'business';
}

function clampStr(value: string, maxLen: number, fallback = ''): string {
  const cleaned = (value || fallback).trim();
  return cleaned.slice(0, maxLen);
}

function sanitizeDocId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || `id-${Date.now()}`;
}

function toMillis(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isBootstrapAdminEmail(user.email) && user.emailVerified) {
    return true;
  }
  const adminDocPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, adminDocPath);
  }
}

export async function ensureUserWorkspaceInitialized(
  user: User,
  overrides?: OnboardingProfileOverrides
): Promise<{
  profile: UserProfile & { accountCode: string; kycTierStatus: string };
  isAdmin: boolean;
}> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const walletPath = `wallets/${uid}`;

  let existingUserSnap;
  try {
    existingUserSnap = await getDoc(doc(db, 'users', uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  const isAdmin = await checkUserIsAdmin(user);

  if (!existingUserSnap.exists()) {
    const accountCode = `#APX-${Math.floor(1000 + Math.random() * 8999)}`;
    const safeName = clampStr(
      overrides?.fullName || user.displayName || user.email?.split('@')[0] || 'Apex Client',
      80,
      'Apex Client'
    );
    const safeEmail = clampStr(user.email || `${uid}@apex.ng`, 120);
    const rawPhone = clampStr(overrides?.phone || '+234 803 000 0000', 32);
    const safePhone = rawPhone.length >= 7 ? rawPhone : '+234 803 000 0000';
    const accountType: 'personal' | 'business' =
      overrides?.accountType === 'business' ? 'business' : 'personal';
    const kycTierStatus = isAdmin ? 'CBN SuperAdmin' : 'Tier 1 • Pending KYC';

    const batch = writeBatch(db);
    const nowTs = serverTimestamp();
    const txId = sanitizeDocId(`txn-open-${uid}-${Date.now()}`);
    const notifId = sanitizeDocId(`notif-open-${uid}-${Date.now()}`);
    const managedId = sanitizeDocId(`acct-${uid}`);
    const auditId = sanitizeDocId(`aud-signup-${uid}-${Date.now()}`);

    batch.set(doc(db, 'users', uid), {
      uid,
      accountCode,
      fullName: safeName.length >= 2 ? safeName : 'Apex Client',
      email: safeEmail,
      phone: safePhone,
      accountType,
      kycTierStatus,
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    batch.set(doc(db, 'wallets', uid), {
      userId: uid,
      usdBalance: 84250.0,
      eurBalance: 42180.0,
      usdcBalance: 22490.5,
      cardFrozen: false,
      accountFrozen: false,
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    batch.set(doc(db, 'transactions', txId), {
      userId: uid,
      title: 'Apex Opening Vault Credit',
      timestamp: 'Just now',
      status: 'Settled',
      amount: 84250.0,
      currency: 'USD',
      vaultLabel: 'USD Main Vault',
      type: 'inflow',
      icon: 'account_balance',
      rail: 'deposit',
      referenceId: `OPEN-${accountCode.replace('#', '')}`,
      createdAt: nowTs,
    });

    batch.set(doc(db, 'notifications', notifId), {
      userId: uid,
      title: 'Vault Provisioned in Firestore',
      detail: `Account ${accountCode} linked. Complete NIN/BVN KYC to unlock Tier 2 limits.`,
      time: 'Just now',
      unread: true,
      targetScreen: 'kyc-docs',
      createdAt: nowTs,
    });

    batch.set(doc(db, 'managed_accounts', managedId), {
      accountCode,
      name: safeName.length >= 2 ? safeName : 'Apex Client',
      tier: accountType === 'business' ? 'Business Pro Tier' : 'Personal Standard',
      avatar: APEX_IMAGES.profileAvatar,
      balance: 84250.0,
      kycStatus: 'Pending KYC',
      roleLabel: accountType === 'business' ? 'Corporate Signatory' : 'Standard Account',
      roleCategory: accountType === 'business' ? 'Institutional' : 'Personal',
      limitLabel: 'Tier L1 Limit',
      frozen: false,
      ownerUid: uid,
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    batch.set(doc(db, 'audit_logs', auditId), {
      event: clampStr(`USER_SIGNUP • Acct ${accountCode}`, 160),
      actor: clampStr(`Actor: ${safeEmail}`, 120),
      actorUid: uid,
      timeAgo: 'Just now',
      createdAt: nowTs,
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }

    if (isAdmin) {
      await seedAdminDatabaseCollections(uid, safeEmail);
    }

    return {
      profile: {
        fullName: safeName.length >= 2 ? safeName : 'Apex Client',
        email: safeEmail,
        phone: safePhone,
        accountType,
        isRegistered: true,
        accountCode,
        kycTierStatus,
      },
      isAdmin,
    };
  }

  // Existing user: optionally update onboarding profile fields if supplied on Sign Up screen
  const existingData = existingUserSnap.data();
  if (overrides && (overrides.fullName || overrides.phone || overrides.accountType)) {
    const nextName = clampStr(overrides.fullName || String(existingData.fullName), 80);
    const rawPhone = clampStr(overrides.phone || String(existingData.phone), 32);
    const nextPhone = rawPhone.length >= 7 ? rawPhone : String(existingData.phone);
    const nextType: 'personal' | 'business' =
      overrides.accountType || (existingData.accountType === 'business' ? 'business' : 'personal');
    try {
      await updateDoc(doc(db, 'users', uid), {
        fullName: nextName.length >= 2 ? nextName : String(existingData.fullName),
        phone: nextPhone,
        accountType: nextType,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, userPath);
    }
  }

  // Ensure wallet exists even if partial prior write
  try {
    const walletSnap = await getDoc(doc(db, 'wallets', uid));
    if (!walletSnap.exists()) {
      await setDoc(doc(db, 'wallets', uid), {
        userId: uid,
        usdBalance: 84250.0,
        eurBalance: 42180.0,
        usdcBalance: 22490.5,
        cardFrozen: false,
        accountFrozen: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, walletPath);
  }

  if (isAdmin) {
    await seedAdminDatabaseCollections(uid, String(existingData.email || user.email || BOOTSTRAP_ADMIN_EMAIL));
  }

  return {
    profile: {
      fullName: String(overrides?.fullName || existingData.fullName || 'Apex Client'),
      email: String(existingData.email || user.email || ''),
      phone: String(overrides?.phone || existingData.phone || '+234 803 000 0000'),
      accountType:
        (overrides?.accountType || existingData.accountType) === 'business' ? 'business' : 'personal',
      isRegistered: true,
      accountCode: String(existingData.accountCode || '#APX-8841'),
      kycTierStatus: String(existingData.kycTierStatus || 'Tier 1 • Pending KYC'),
    },
    isAdmin,
  };
}

export async function seedAdminDatabaseCollections(adminUid: string, adminEmail: string): Promise<void> {
  // 1. Register admin record if missing
  try {
    const adminRef = doc(db, 'admins', adminUid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        uid: adminUid,
        email: clampStr(adminEmail, 120),
        role: 'SuperAdmin',
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${adminUid}`);
  }

  // 2. Seed Nigerian Banks table if empty
  try {
    const banksSnap = await getDocs(collection(db, 'nigerian_banks'));
    if (banksSnap.empty) {
      const batch = writeBatch(db);
      for (const bank of NIGERIAN_BANKS) {
        batch.set(doc(db, 'nigerian_banks', bank.code), {
          code: bank.code,
          name: clampStr(bank.name, 80),
          shortName: clampStr(bank.shortName, 30),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'nigerian_banks');
  }

  // 3. Seed Managed Accounts compliance table if empty (beyond user's own doc)
  try {
    const accountsSnap = await getDocs(collection(db, 'managed_accounts'));
    if (accountsSnap.size <= 1) {
      const batch = writeBatch(db);
      for (const item of INITIAL_ADMIN_USERS) {
        const docId = sanitizeDocId(`seed-${item.id}`);
        if (accountsSnap.docs.some((d) => d.id === docId)) continue;
        const payload: Record<string, unknown> = {
          accountCode: clampStr(item.accountCode, 24),
          name: clampStr(item.name, 80),
          tier: clampStr(item.tier, 60),
          avatar: clampStr(item.avatar, 300),
          balance: item.balance,
          kycStatus: item.kycStatus,
          roleLabel: clampStr(item.roleLabel, 60),
          roleCategory: item.roleCategory,
          limitLabel: clampStr(item.limitLabel, 40),
          frozen: item.frozen,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (item.alertNote) {
          payload.alertNote = clampStr(item.alertNote, 200);
        }
        batch.set(doc(db, 'managed_accounts', docId), payload);
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'managed_accounts');
  }

  // 4. Seed Audit Logs table if minimal
  try {
    const auditSnap = await getDocs(collection(db, 'audit_logs'));
    if (auditSnap.size <= 1) {
      const batch = writeBatch(db);
      for (const entry of INITIAL_AUDIT_FEED) {
        const docId = sanitizeDocId(`seed-${entry.id}`);
        if (auditSnap.docs.some((d) => d.id === docId)) continue;
        batch.set(doc(db, 'audit_logs', docId), {
          event: clampStr(entry.event, 160),
          actor: clampStr(entry.actor, 120),
          actorUid: adminUid,
          timeAgo: clampStr(entry.timeAgo, 40),
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'audit_logs');
  }
}

export function subscribeUserWorkspace(
  uid: string,
  isAdmin: boolean,
  callbacks: {
    onProfile: (profile: UserProfile & { accountCode: string; kycTierStatus: string }) => void;
    onWallet: (wallet: FirestoreWalletState) => void;
    onTransactions: (items: TransactionItem[]) => void;
    onNotifications: (items: NotificationItem[]) => void;
    onAdminUsers?: (items: AdminUser[]) => void;
    onAuditLogs?: (items: AuditEntry[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        callbacks.onProfile({
          fullName: String(d.fullName || 'Apex Client'),
          email: String(d.email || ''),
          phone: String(d.phone || '+234 803 000 0000'),
          accountType: d.accountType === 'business' ? 'business' : 'personal',
          isRegistered: true,
          accountCode: String(d.accountCode || '#APX-8841'),
          kycTierStatus: String(d.kycTierStatus || 'Tier 1 • Pending KYC'),
        });
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'wallets', uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        callbacks.onWallet({
          usdBalance: Number(d.usdBalance ?? 0),
          eurBalance: Number(d.eurBalance ?? 0),
          usdcBalance: Number(d.usdcBalance ?? 0),
          cardFrozen: Boolean(d.cardFrozen),
          accountFrozen: Boolean(d.accountFrozen),
        });
      },
      (err) => handleFirestoreError(err, OperationType.GET, `wallets/${uid}`)
    )
  );

  const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
  unsubs.push(
    onSnapshot(
      txQuery,
      (snap) => {
        const sorted = [...snap.docs].sort(
          (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
        );
        const items: TransactionItem[] = sorted.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || 'Transaction'),
            timestamp: String(data.timestamp || 'Just now'),
            status: String(data.status || 'Settled'),
            amount: Number(data.amount ?? 0),
            currency: String(data.currency || 'USD'),
            vaultLabel: String(data.vaultLabel || 'USD Main Vault'),
            type:
              data.type === 'inflow' || data.type === 'yield' ? data.type : 'outflow',
            icon: String(data.icon || 'north_east'),
          };
        });
        callbacks.onTransactions(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    )
  );

  const notifQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
  unsubs.push(
    onSnapshot(
      notifQuery,
      (snap) => {
        const sorted = [...snap.docs].sort(
          (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
        );
        const items: NotificationItem[] = sorted.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || 'Alert'),
            detail: String(data.detail || ''),
            time: String(data.time || 'Just now'),
            unread: Boolean(data.unread),
            targetScreen: data.targetScreen as ScreenId | undefined,
          };
        });
        callbacks.onNotifications(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    )
  );

  if (isAdmin && callbacks.onAdminUsers && callbacks.onAuditLogs) {
    unsubs.push(
      onSnapshot(
        collection(db, 'managed_accounts'),
        (snap) => {
          const sorted = [...snap.docs].sort(
            (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
          );
          const list: AdminUser[] = sorted.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              accountCode: String(data.accountCode || '#APX-0000'),
              name: String(data.name || 'Account'),
              tier: String(data.tier || 'Personal Standard'),
              avatar: String(data.avatar || APEX_IMAGES.profileAvatar),
              balance: Number(data.balance ?? 0),
              kycStatus: (data.kycStatus as AdminUser['kycStatus']) || 'Pending KYC',
              roleLabel: String(data.roleLabel || 'Standard Account'),
              roleCategory:
                (data.roleCategory as AdminUser['roleCategory']) || 'Personal',
              limitLabel: String(data.limitLabel || 'Tier L1 Limit'),
              alertNote: data.alertNote ? String(data.alertNote) : undefined,
              frozen: Boolean(data.frozen),
            };
          });
          callbacks.onAdminUsers?.(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'managed_accounts')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'audit_logs'),
        (snap) => {
          const sorted = [...snap.docs].sort(
            (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
          );
          const logs: AuditEntry[] = sorted.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              event: String(data.event || 'AUDIT_EVENT'),
              actor: String(data.actor || 'System'),
              timeAgo: String(data.timeAgo || 'Just now'),
            };
          });
          callbacks.onAuditLogs?.(logs);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
      )
    );
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function toggleFirestoreCardFreeze(
  uid: string,
  currentFrozen: boolean
): Promise<boolean> {
  const walletPath = `wallets/${uid}`;
  const nextFrozen = !currentFrozen;
  try {
    await updateDoc(doc(db, 'wallets', uid), {
      cardFrozen: nextFrozen,
      updatedAt: serverTimestamp(),
    });
    return nextFrozen;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, walletPath);
  }
}

export async function executeFirestoreTransfer(params: {
  uid: string;
  actorEmail: string;
  currentBalance: number;
  accountFrozen: boolean;
  recipientName: string;
  recipientTag: string;
  amount: number;
  category: string;
  rail: 'contacts' | 'nibss';
  bankCode?: string;
  accountNumber?: string;
  nibssSessionId?: string;
  referenceId?: string;
  timestamp?: string;
}): Promise<TransferReceiptPayload> {
  if (params.accountFrozen) {
    throw new Error('Account is currently frozen by Compliance. Contact support.');
  }
  const amount = Number(params.amount.toFixed(2));
  if (amount <= 0 || amount > params.currentBalance) {
    throw new Error('Insufficient USD Main Vault balance.');
  }

  const remainingBalance = Number((params.currentBalance - amount).toFixed(2));
  const referenceId =
    params.referenceId || `TXN-${Math.floor(100000 + Math.random() * 899999)}`;
  const txId = sanitizeDocId(`txn-out-${params.uid}-${Date.now()}`);
  const auditId = sanitizeDocId(`aud-tx-${params.uid}-${Date.now()}`);

  const batch = writeBatch(db);
  batch.update(doc(db, 'wallets', params.uid), {
    usdBalance: remainingBalance,
    updatedAt: serverTimestamp(),
  });

  const txDoc: Record<string, unknown> = {
    userId: params.uid,
    title: clampStr(`Transfer to ${params.recipientName}`, 140),
    timestamp: 'Just now',
    status: clampStr(params.category, 60),
    amount: -amount,
    currency: 'USD',
    vaultLabel: params.rail === 'nibss' ? 'NIBSS NIP Instant' : 'FedNow Instant',
    type: 'outflow',
    icon: 'north_east',
    rail: params.rail,
    recipientName: clampStr(params.recipientName, 80),
    recipientTag: clampStr(params.recipientTag, 100),
    referenceId: clampStr(referenceId, 64),
    createdAt: serverTimestamp(),
  };

  if (params.bankCode) txDoc.bankCode = clampStr(params.bankCode, 16);
  if (params.accountNumber) txDoc.accountNumber = clampStr(params.accountNumber, 20);
  if (params.nibssSessionId) txDoc.nibssSessionId = clampStr(params.nibssSessionId, 64);

  batch.set(doc(db, 'transactions', txId), txDoc);

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(
      `TRANSFER_DISPATCHED • ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} -> ${params.recipientName}`,
      160
    ),
    actor: clampStr(`Actor: ${params.actorEmail}`, 120),
    actorUid: params.uid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
  }

  return {
    referenceId,
    recipientName: params.recipientName,
    recipientTag: params.recipientTag,
    amount,
    category: params.category,
    currency: 'USD',
    timestamp:
      params.timestamp ||
      (params.rail === 'nibss'
        ? 'Just now • NIBSS NIP Instant Clearing'
        : 'Just now • Instant Clearing'),
    remainingBalance,
    nibssSessionId: params.nibssSessionId,
  };
}

export async function executeFirestoreDeposit(params: {
  uid: string;
  actorEmail: string;
  currentBalance: number;
  amount: number;
  railName: string;
  referenceId?: string;
  authCode?: string;
  enclaveHash?: string;
  timestamp?: string;
}): Promise<DepositReceiptData> {
  const amount = Number(params.amount.toFixed(2));
  if (amount <= 0 || amount > 250000) {
    throw new Error('Deposit amount must be between ₦1.00 and ₦250,000.00.');
  }

  const prevBalance = params.currentBalance;
  const newBalance = Number((prevBalance + amount).toFixed(2));
  const referenceId =
    params.referenceId || `TXN-${Math.floor(1000 + Math.random() * 8999)}-NIBSS-01`;
  const authCode =
    params.authCode || `AUTH# ${Math.floor(1000 + Math.random() * 8999)}-991A-88B`;
  const enclaveHash =
    params.enclaveHash ||
    `0x${referenceId.toLowerCase().replace(/[^a-z0-9]/g, '')}e92da014fba36e92`;
  const txId = sanitizeDocId(`txn-dep-${params.uid}-${Date.now()}`);
  const auditId = sanitizeDocId(`aud-dep-${params.uid}-${Date.now()}`);

  const batch = writeBatch(db);
  batch.update(doc(db, 'wallets', params.uid), {
    usdBalance: newBalance,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'transactions', txId), {
    userId: params.uid,
    title: clampStr(`Deposit via ${params.railName}`, 140),
    timestamp: 'Just now',
    status: 'Settled',
    amount,
    currency: 'USD',
    vaultLabel: 'USD Vault',
    type: 'inflow',
    icon: 'add_card',
    rail: 'deposit',
    referenceId: clampStr(referenceId, 64),
    createdAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(
      `DEPOSIT_SETTLED • +₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${params.railName})`,
      160
    ),
    actor: clampStr(`Actor: ${params.actorEmail}`, 120),
    actorUid: params.uid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
  }

  return {
    amount,
    previousBalance: prevBalance,
    newBalance,
    railName: params.railName,
    referenceId,
    authCode,
    enclaveHash,
    timestamp:
      params.timestamp ||
      new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  };
}

export async function completeFirestoreKyc(uid: string, actorEmail: string): Promise<void> {
  const auditId = sanitizeDocId(`aud-kyc-${uid}-${Date.now()}`);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), {
    kycTierStatus: 'Tier 2 Verified',
    updatedAt: serverTimestamp(),
  });

  const managedId = sanitizeDocId(`acct-${uid}`);
  try {
    const managedSnap = await getDoc(doc(db, 'managed_accounts', managedId));
    if (managedSnap.exists()) {
      batch.update(doc(db, 'managed_accounts', managedId), {
        kycStatus: 'KYC Verified',
        limitLabel: 'Tier L2 Limit',
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Optional managed account sync
  }

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(`KYC_VERIFIED • UID ${uid.slice(0, 12)}`, 160),
    actor: clampStr(`Actor: ${actorEmail}`, 120),
    actorUid: uid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function markFirestoreNotificationsRead(
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) return;
  const batch = writeBatch(db);
  for (const id of notificationIds) {
    batch.update(doc(db, 'notifications', id), { unread: false });
  }
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}

export async function adminCreateManagedAccount(params: {
  name: string;
  tier: string;
  roleLabel: string;
  actorEmail: string;
  actorUid: string;
}): Promise<void> {
  const code = `#APX-${Math.floor(1000 + Math.random() * 8999)}`;
  const docId = sanitizeDocId(`acct-${Date.now()}`);
  const auditId = sanitizeDocId(`aud-create-${Date.now()}`);
  const roleCategory: AdminUser['roleCategory'] =
    params.roleLabel === 'Compliance Officer'
      ? 'Compliance Officer'
      : params.tier.includes('Institutional')
        ? 'Institutional'
        : 'Personal';

  const batch = writeBatch(db);
  batch.set(doc(db, 'managed_accounts', docId), {
    accountCode: code,
    name: clampStr(params.name, 80),
    tier: clampStr(params.tier, 60),
    avatar: APEX_IMAGES.profileAvatar,
    balance: 50000,
    kycStatus: 'Pending KYC',
    roleLabel: clampStr(params.roleLabel, 60),
    roleCategory,
    limitLabel: 'Tier L2 Limit',
    frozen: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(`ACCOUNT_CREATED • Acct ${code}`, 160),
    actor: clampStr(`Actor: ${params.actorEmail} (Admin)`, 120),
    actorUid: params.actorUid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `managed_accounts/${docId}`);
  }
}

export async function adminToggleFreezeAccount(params: {
  accountId: string;
  accountCode: string;
  currentFrozen: boolean;
  actorEmail: string;
  actorUid: string;
}): Promise<void> {
  const nextFrozen = !params.currentFrozen;
  const auditId = sanitizeDocId(`aud-frz-${Date.now()}`);
  const batch = writeBatch(db);

  batch.update(doc(db, 'managed_accounts', params.accountId), {
    frozen: nextFrozen,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(
      `${nextFrozen ? 'WALLET_FROZEN' : 'WALLET_UNFROZEN'} • Acct ${params.accountCode}`,
      160
    ),
    actor: clampStr(`Actor: ${params.actorEmail} (Admin)`, 120),
    actorUid: params.actorUid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `managed_accounts/${params.accountId}`);
  }
}

export async function adminResolveAml(params: {
  accountId: string;
  accountCode: string;
  actorEmail: string;
  actorUid: string;
}): Promise<void> {
  const auditId = sanitizeDocId(`aud-aml-${Date.now()}`);
  const batch = writeBatch(db);

  batch.update(doc(db, 'managed_accounts', params.accountId), {
    kycStatus: 'KYC Verified',
    limitLabel: 'Tier L1 Limit',
    alertNote: deleteField(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(`AML_CLEARED • Acct ${params.accountCode}`, 160),
    actor: clampStr(`Actor: ${params.actorEmail} (Admin)`, 120),
    actorUid: params.actorUid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `managed_accounts/${params.accountId}`);
  }
}

export async function adminUpdateAccountRole(params: {
  accountId: string;
  accountCode: string;
  roleLabel: string;
  actorEmail: string;
  actorUid: string;
}): Promise<void> {
  const auditId = sanitizeDocId(`aud-role-${Date.now()}`);
  const batch = writeBatch(db);

  batch.update(doc(db, 'managed_accounts', params.accountId), {
    roleLabel: clampStr(params.roleLabel, 60),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', auditId), {
    event: clampStr(`ROLE_UPDATED • Acct ${params.accountCode} -> ${params.roleLabel}`, 160),
    actor: clampStr(`Actor: ${params.actorEmail} (Admin)`, 120),
    actorUid: params.actorUid,
    timeAgo: 'Just now',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `managed_accounts/${params.accountId}`);
  }
}

export async function adminRecordAudit(params: {
  event: string;
  actorEmail: string;
  actorUid: string;
}): Promise<void> {
  const auditId = sanitizeDocId(`aud-evt-${Date.now()}`);
  try {
    await setDoc(doc(db, 'audit_logs', auditId), {
      event: clampStr(params.event, 160),
      actor: clampStr(`Actor: ${params.actorEmail} (Admin)`, 120),
      actorUid: params.actorUid,
      timeAgo: 'Just now',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `audit_logs/${auditId}`);
  }
}
