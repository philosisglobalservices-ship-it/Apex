import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from './components/AppShell';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_AUDIT_FEED,
  INITIAL_NOTIFICATIONS,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import { auth, googleAuthProvider } from './lib/firebase';
import { AdminScreen } from './screens/AdminScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DepositSuccessScreen } from './screens/DepositSuccessScreen';
import { FundWalletScreen } from './screens/FundWalletScreen';
import { KycDocsScreen } from './screens/KycDocsScreen';
import { KycLivenessScreen } from './screens/KycLivenessScreen';
import { KycSuccessScreen } from './screens/KycSuccessScreen';
import { MarketScreen } from './screens/MarketScreen';
import { SignUpOnboardingInput, SignUpScreen } from './screens/SignUpScreen';
import { TransferDispatchPayload, TransfersScreen } from './screens/TransfersScreen';
import { WalletScreen } from './screens/WalletScreen';
import { TransferReceiptPayload, apexApi } from './services/api';
import {
  adminCreateManagedAccount,
  adminRecordAudit,
  adminResolveAml,
  adminToggleFreezeAccount,
  adminUpdateAccountRole,
  completeFirestoreKyc,
  ensureUserWorkspaceInitialized,
  executeFirestoreDeposit,
  executeFirestoreTransfer,
  markFirestoreNotificationsRead,
  OnboardingProfileOverrides,
  subscribeUserWorkspace,
  toggleFirestoreCardFreeze,
} from './services/firestoreDb';
import {
  AdminUser,
  AuditEntry,
  DepositReceiptData,
  NotificationItem,
  ScreenId,
  TransactionItem,
  UserProfile,
} from './types';

const DEFAULT_GUEST_PROFILE: UserProfile = {
  fullName: 'Alexander Roth',
  email: 'adebayo@apex-capital.ng',
  phone: '+234 803 000 0000',
  accountType: 'personal',
  isRegistered: false,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home-wallet');
  const [transferMode, setTransferMode] = useState<'send' | 'receive'>('send');
  const [roleMode, setRoleMode] = useState<'client' | 'admin'>('client');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [kycTierStatus, setKycTierStatus] = useState('Tier 2 Verified');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_GUEST_PROFILE);

  // Shared financial state (hydrated from Firestore once signed in)
  const [usdBalance, setUsdBalance] = useState<number>(84250.0);
  const [eurBalance, setEurBalance] = useState<number>(42180.0);
  const [usdcBalance, setUsdcBalance] = useState<number>(22490.5);
  const [cardFrozen, setCardFrozen] = useState<boolean>(false);
  const [accountFrozen, setAccountFrozen] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  // Admin state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [auditFeed, setAuditFeed] = useState<AuditEntry[]>(INITIAL_AUDIT_FEED);

  // Notifications & Toast
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const pendingOnboardingRef = useRef<OnboardingProfileOverrides | null>(null);

  // Latest Deposit Receipt
  const [latestReceipt, setLatestReceipt] = useState<DepositReceiptData>({
    amount: 25000,
    previousBalance: 84250,
    newBalance: 109250,
    railName: 'FedNow Instant Clearing',
    referenceId: 'TXN-8942-FEDNOW-01',
    authCode: 'AUTH# 9482-991A-88B',
    enclaveHash: '0x8f3c47e92da014fba36e92bca471092efb12b29e',
    timestamp: 'Just now • Instant Clearing',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Firebase Auth listener + Firestore realtime workspace subscriptions
  useEffect(() => {
    let workspaceUnsub: (() => void) | null = null;
    let cancelled = false;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (workspaceUnsub) {
        workspaceUnsub();
        workspaceUnsub = null;
      }

      if (!user) {
        if (cancelled) return;
        setFirebaseUser(null);
        setIsAdminUser(false);
        setRoleMode('client');
        setUserProfile(DEFAULT_GUEST_PROFILE);
        setKycTierStatus('Tier 2 Verified');
        setUsdBalance(84250.0);
        setEurBalance(42180.0);
        setUsdcBalance(22490.5);
        setCardFrozen(false);
        setAccountFrozen(false);
        setTransactions(INITIAL_TRANSACTIONS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setAdminUsers(INITIAL_ADMIN_USERS);
        setAuditFeed(INITIAL_AUDIT_FEED);
        return;
      }

      setFirebaseUser(user);

      try {
        const overrides = pendingOnboardingRef.current || undefined;
        pendingOnboardingRef.current = null;
        const [{ profile, isAdmin }] = await Promise.all([
          ensureUserWorkspaceInitialized(user, overrides),
          apexApi.verifyBackendSession().catch(() => null),
        ]);
        if (cancelled) return;

        setIsAdminUser(isAdmin);
        setUserProfile({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          accountType: profile.accountType,
          isRegistered: true,
        });
        setKycTierStatus(profile.kycTierStatus);

        workspaceUnsub = subscribeUserWorkspace(user.uid, isAdmin, {
          onProfile: (liveProfile) => {
            setUserProfile({
              fullName: liveProfile.fullName,
              email: liveProfile.email,
              phone: liveProfile.phone,
              accountType: liveProfile.accountType,
              isRegistered: true,
            });
            setKycTierStatus(liveProfile.kycTierStatus);
          },
          onWallet: (wallet) => {
            setUsdBalance(wallet.usdBalance);
            setEurBalance(wallet.eurBalance);
            setUsdcBalance(wallet.usdcBalance);
            setCardFrozen(wallet.cardFrozen);
            setAccountFrozen(wallet.accountFrozen);
          },
          onTransactions: (txs) => setTransactions(txs),
          onNotifications: (notifs) => setNotifications(notifs),
          onAdminUsers: isAdmin ? (users) => setAdminUsers(users) : undefined,
          onAuditLogs: isAdmin ? (logs) => setAuditFeed(logs) : undefined,
        });
      } catch (err) {
        if (!cancelled) {
          showToast(
            err instanceof Error ? err.message : 'Unable to sync database workspace'
          );
        }
      }
    });

    return () => {
      cancelled = true;
      authUnsub();
      if (workspaceUnsub) workspaceUnsub();
    };
  }, [showToast]);

  const handleNavigate = useCallback(
    (screen: ScreenId, options?: { transferMode?: 'send' | 'receive' }) => {
      if (options?.transferMode) {
        setTransferMode(options.transferMode);
      } else if (screen === 'transfers' && activeScreen !== 'transfers') {
        setTransferMode('send');
      }
      setActiveScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeScreen]
  );

  const handleGoogleSignIn = useCallback(
    async (targetRole: 'client' | 'admin') => {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const { profile, isAdmin } = await ensureUserWorkspaceInitialized(result.user);
      setIsAdminUser(isAdmin);

      if (targetRole === 'admin') {
        if (isAdmin) {
          setRoleMode('admin');
          showToast('CBN SuperAdmin session verified');
          handleNavigate('admin-console');
        } else {
          setRoleMode('client');
          showToast(
            `Signed in as ${profile.fullName}. Standard client privileges applied.`
          );
          handleNavigate('home-wallet');
        }
      } else {
        setRoleMode('client');
        showToast(`Welcome back, ${profile.fullName.split(' ')[0]}`);
        handleNavigate('home-wallet');
      }
    },
    [handleNavigate, showToast]
  );

  const handleRegisterWithGoogle = useCallback(
    async (input: SignUpOnboardingInput, destination: 'kyc-docs' | 'home-wallet') => {
      pendingOnboardingRef.current = {
        fullName: input.fullName,
        phone: input.phone,
        accountType: input.accountType,
      };

      const activeUser =
        auth.currentUser ?? (await signInWithPopup(auth, googleAuthProvider)).user;

      const overrides: OnboardingProfileOverrides = {
        fullName: input.fullName,
        phone: input.phone,
        accountType: input.accountType,
      };
      pendingOnboardingRef.current = null;

      const { profile, isAdmin } = await ensureUserWorkspaceInitialized(activeUser, overrides);
      setIsAdminUser(isAdmin);
      setRoleMode('client');
      showToast(
        `Welcome, ${profile.fullName.split(' ')[0]}! Vault ${profile.accountCode} ready.`
      );
      handleNavigate(destination);
    },
    [handleNavigate, showToast]
  );

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    showToast('Signed out securely');
    handleNavigate('home-wallet');
  }, [handleNavigate, showToast]);

  const requireSignedInUser = useCallback(
    (actionLabel: string): User | null => {
      if (firebaseUser) return firebaseUser;
      showToast(`Sign in with Google to ${actionLabel}`);
      handleNavigate('profile-auth');
      return null;
    },
    [firebaseUser, handleNavigate, showToast]
  );

  const requireAdminSession = useCallback((): User | null => {
    if (firebaseUser && isAdminUser) return firebaseUser;
    setRoleMode('admin');
    showToast(
      firebaseUser
        ? 'CBN Administrator privileges required for this action'
        : 'Sign in with an administrator Google account'
    );
    handleNavigate('profile-auth');
    return null;
  }, [firebaseUser, handleNavigate, isAdminUser, showToast]);

  const handleToggleCardFreeze = useCallback(async () => {
    const user = requireSignedInUser('freeze or unfreeze your card');
    if (!user) return;
    try {
      const nextFrozen = await toggleFirestoreCardFreeze(user.uid, cardFrozen);
      showToast(nextFrozen ? 'Black Titanium card frozen' : 'Card active & NFC enabled');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update card state');
    }
  }, [cardFrozen, requireSignedInUser, showToast]);

  const handleExecuteTransfer = useCallback(
    async (payload: TransferDispatchPayload): Promise<TransferReceiptPayload | null> => {
      const user = requireSignedInUser('dispatch transfers');
      if (!user) return null;

      if (payload.rail === 'nibss' && (!payload.bankCode || !payload.accountNumber)) {
        throw new Error('Select a Nigerian bank and enter a valid 10-digit NUBAN.');
      }

      // 1. Authorize transfer & re-verify NIBSS account name on Express backend using Firebase ID token
      const authorized = await apexApi.authorizeTransfer({
        recipientName: payload.recipientName,
        recipientTag: payload.recipientTag,
        amount: payload.amount,
        category: payload.category,
        rail: payload.rail,
        bankCode: payload.bankCode,
        accountNumber: payload.accountNumber,
      });

      // 2. Commit balance deduction, ledger record, and audit entry atomically to Firestore
      const receipt = await executeFirestoreTransfer({
        uid: user.uid,
        actorEmail: user.email || userProfile.email,
        currentBalance: usdBalance,
        accountFrozen,
        recipientName: authorized.recipientName,
        recipientTag: authorized.recipientTag,
        amount: authorized.amount,
        category: authorized.category,
        rail: authorized.rail,
        bankCode: authorized.bankCode,
        accountNumber: authorized.accountNumber,
        nibssSessionId: authorized.nibssSessionId,
        referenceId: authorized.referenceId,
        timestamp: authorized.timestamp,
      });

      showToast(
        `₦${receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} sent to ${receipt.recipientName}`
      );
      return receipt;
    },
    [accountFrozen, requireSignedInUser, showToast, usdBalance, userProfile.email]
  );

  const handleConfirmDeposit = useCallback(
    async (amount: number, railName: string) => {
      const user = requireSignedInUser('fund your wallet');
      if (!user) return;
      try {
        // 1. Generate authoritative enclave signature & authorization code on Express backend
        const depAuth = await apexApi.authorizeDeposit({ amount, railName });

        // 2. Persist settled inflow transaction & update wallet balance atomically in Firestore
        const receipt = await executeFirestoreDeposit({
          uid: user.uid,
          actorEmail: user.email || userProfile.email,
          currentBalance: usdBalance,
          amount: depAuth.amount,
          railName: depAuth.railName,
          referenceId: depAuth.referenceId,
          authCode: depAuth.authCode,
          enclaveHash: depAuth.enclaveHash,
          timestamp: depAuth.timestamp,
        });
        setLatestReceipt(receipt);
        showToast(`+₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} settled`);
        handleNavigate('deposit-success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Deposit failed');
      }
    },
    [handleNavigate, requireSignedInUser, showToast, usdBalance, userProfile.email]
  );

  const handleCompleteKyc = useCallback(async () => {
    if (!firebaseUser) {
      setKycTierStatus('Tier 2 Verified');
      return;
    }
    try {
      await completeFirestoreKyc(
        firebaseUser.uid,
        firebaseUser.email || userProfile.email
      );
      setKycTierStatus('Tier 2 Verified');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update KYC tier');
    }
  }, [firebaseUser, showToast, userProfile.email]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (firebaseUser && unreadIds.length > 0) {
      try {
        await markFirestoreNotificationsRead(unreadIds);
      } catch {
        // Optimistic state kept
      }
    }
    showToast('All alerts marked read');
  }, [firebaseUser, notifications, showToast]);

  const handleAddAuditEntry = useCallback(
    async (event: string) => {
      const admin = requireAdminSession();
      if (!admin) return;
      try {
        await adminRecordAudit({
          event,
          actorEmail: admin.email || userProfile.email,
          actorUid: admin.uid,
        });
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to log audit event');
      }
    },
    [requireAdminSession, showToast, userProfile.email]
  );

  const handleToggleUserFreeze = useCallback(
    async (userId: string) => {
      const admin = requireAdminSession();
      if (!admin) return;
      const target = adminUsers.find((u) => u.id === userId);
      if (!target) return;
      try {
        await adminToggleFreezeAccount({
          accountId: target.id,
          accountCode: target.accountCode,
          currentFrozen: target.frozen,
          actorEmail: admin.email || userProfile.email,
          actorUid: admin.uid,
        });
        showToast(`${target.name} wallet ${target.frozen ? 'unfrozen' : 'frozen'}`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update freeze status');
      }
    },
    [adminUsers, requireAdminSession, showToast, userProfile.email]
  );

  const handleResolveAml = useCallback(
    async (userId: string) => {
      const admin = requireAdminSession();
      if (!admin) return;
      const target = adminUsers.find((u) => u.id === userId);
      if (!target) return;
      try {
        await adminResolveAml({
          accountId: target.id,
          accountCode: target.accountCode,
          actorEmail: admin.email || userProfile.email,
          actorUid: admin.uid,
        });
        showToast(`AML hold cleared for ${target.name}`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to clear AML hold');
      }
    },
    [adminUsers, requireAdminSession, showToast, userProfile.email]
  );

  const handleUpdateUserRole = useCallback(
    async (userId: string, newRole: string) => {
      const admin = requireAdminSession();
      if (!admin) return;
      const target = adminUsers.find((u) => u.id === userId);
      if (!target) return;
      try {
        await adminUpdateAccountRole({
          accountId: target.id,
          accountCode: target.accountCode,
          roleLabel: newRole,
          actorEmail: admin.email || userProfile.email,
          actorUid: admin.uid,
        });
        showToast(`RBAC role updated for ${target.name}`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update role');
      }
    },
    [adminUsers, requireAdminSession, showToast, userProfile.email]
  );

  const handleAddAdminUser = useCallback(
    async (name: string, tier: string, roleLabel: string) => {
      const admin = requireAdminSession();
      if (!admin) return;
      try {
        await adminCreateManagedAccount({
          name,
          tier,
          roleLabel,
          actorEmail: admin.email || userProfile.email,
          actorUid: admin.uid,
        });
        showToast(`${name} provisioned in Firestore`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to provision account');
      }
    },
    [requireAdminSession, showToast, userProfile.email]
  );

  const handleExportCompliance = useCallback(async () => {
    const admin = requireAdminSession();
    if (!admin) return;
    try {
      const signedReport = await apexApi.exportComplianceReport({
        users: adminUsers,
        auditFeed,
      });
      const blob = new Blob([JSON.stringify(signedReport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apex-compliance-export.json';
      a.click();
      URL.revokeObjectURL(url);

      await adminRecordAudit({
        event: `COMPLIANCE_EXPORT • ${signedReport.signatureHash.slice(0, 14)}`,
        actorEmail: admin.email || userProfile.email,
        actorUid: admin.uid,
      });
      showToast('Server-signed compliance snapshot exported');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Compliance export failed');
    }
  }, [adminUsers, auditFeed, requireAdminSession, showToast, userProfile.email]);

  return (
    <AppShell
      activeScreen={activeScreen}
      onNavigate={handleNavigate}
      notifications={notifications}
      onMarkAllRead={handleMarkAllRead}
      toastMessage={toastMessage}
      roleMode={roleMode}
      kycTierStatus={kycTierStatus}
    >
      {activeScreen === 'home-wallet' && (
        <WalletScreen
          usdBalance={usdBalance}
          eurBalance={eurBalance}
          usdcBalance={usdcBalance}
          transactions={transactions}
          cardFrozen={cardFrozen}
          userProfile={userProfile}
          onToggleCardFreeze={handleToggleCardFreeze}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'transfers' && (
        <TransfersScreen
          initialMode={transferMode}
          usdBalance={usdBalance}
          transactions={transactions}
          onExecuteTransfer={handleExecuteTransfer}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'market-public' && <MarketScreen onNavigate={handleNavigate} />}

      {activeScreen === 'admin-console' && (
        <AdminScreen
          users={adminUsers}
          auditFeed={auditFeed}
          isAdminAuthenticated={Boolean(firebaseUser && isAdminUser)}
          onNavigateToAdminLogin={() => {
            setRoleMode('admin');
            handleNavigate('profile-auth');
          }}
          onToggleUserFreeze={handleToggleUserFreeze}
          onResolveAml={handleResolveAml}
          onUpdateUserRole={handleUpdateUserRole}
          onAddAuditEntry={(event) => {
            void handleAddAuditEntry(event);
          }}
          onAddUser={handleAddAdminUser}
          onExportCompliance={handleExportCompliance}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'profile-auth' && (
        <AuthScreen
          roleMode={roleMode}
          isAuthenticated={Boolean(firebaseUser)}
          isAdminAuthenticated={isAdminUser}
          activeUserEmail={firebaseUser?.email || undefined}
          activeUserName={userProfile.fullName}
          onChangeRoleMode={setRoleMode}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'sign-up' && (
        <SignUpScreen
          onRegisterWithGoogle={handleRegisterWithGoogle}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'kyc-docs' && (
        <KycDocsScreen onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {activeScreen === 'kyc-liveness' && (
        <KycLivenessScreen
          onCompleteKyc={() => {
            void handleCompleteKyc();
          }}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'kyc-success' && (
        <KycSuccessScreen onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {activeScreen === 'fund-wallet' && (
        <FundWalletScreen
          usdBalance={usdBalance}
          onConfirmDeposit={handleConfirmDeposit}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {activeScreen === 'deposit-success' && (
        <DepositSuccessScreen
          receipt={latestReceipt}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}
    </AppShell>
  );
}
