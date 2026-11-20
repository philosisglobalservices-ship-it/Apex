import React, { useState } from 'react';
import { ScreenId } from '../types';

interface AuthScreenProps {
  roleMode: 'client' | 'admin';
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  activeUserEmail?: string;
  activeUserName?: string;
  onChangeRoleMode: (mode: 'client' | 'admin') => void;
  onGoogleSignIn: (targetRole: 'client' | 'admin') => Promise<void>;
  onSignOut: () => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  roleMode,
  isAuthenticated,
  isAdminAuthenticated,
  activeUserEmail,
  activeUserName,
  onChangeRoleMode,
  onGoogleSignIn,
  onSignOut,
  onNavigate,
  onShowToast,
}) => {
  const [bioState, setBioState] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleRoleSwitch = (role: 'client' | 'admin') => {
    onChangeRoleMode(role);
    setAuthError(null);
  };

  const handleGoogleAuth = async () => {
    if (submitting) return;
    setAuthError(null);
    setSubmitting(true);
    try {
      await onGoogleSignIn(roleMode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In could not be completed';
      setAuthError(msg);
      onShowToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const simulateBiometricAuth = () => {
    if (bioState !== 'idle') return;
    if (!isAuthenticated) {
      void handleGoogleAuth();
      return;
    }
    setBioState('scanning');
    window.setTimeout(() => {
      setBioState('verified');
      onShowToast('Verified Google & Passkey session active');
      window.setTimeout(() => {
        setBioState('idle');
        onNavigate(roleMode === 'admin' && isAdminAuthenticated ? 'admin-console' : 'home-wallet');
      }, 600);
    }, 550);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10">
      <div className="relative w-full overflow-hidden mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[19px]">verified_user</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-primary uppercase tracking-widest block">
                CBN / NDPR RBAC 2.0
              </span>
              <h1 className="text-xl font-semibold text-on-surface tracking-tight">
                Nigeria Secure Gateway
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[10px]">Lagos Node</span>
          </div>
        </div>
      </div>

      {/* Sign In / Sign Up Switch */}
      <div className="w-full max-w-md bg-surface-container-lowest p-1 rounded-full flex relative shadow-inner mb-3">
        <button
          type="button"
          className="flex-1 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-md flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">login</span>
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('sign-up')}
          className="flex-1 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>New User Sign Up</span>
        </button>
      </div>

      {/* Role Selector Switch */}
      <div className="w-full max-w-lg bg-surface-container-lowest p-1 rounded-full flex relative shadow-inner mb-5">
        <button
          type="button"
          onClick={() => handleRoleSwitch('client')}
          className={`flex-1 py-2.5 rounded-full text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            roleMode === 'client'
              ? 'bg-primary text-on-primary font-semibold shadow-md'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-base">account_circle</span>
          <span>Client Portfolio</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleSwitch('admin')}
          className={`flex-1 py-2.5 rounded-full text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            roleMode === 'admin'
              ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-md'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-base">shield_person</span>
          <span>Compliance &amp; Admin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4">
          {roleMode === 'client' ? (
            <div className="bg-surface-container rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <span className="text-sm font-semibold text-on-surface">
                    CBN Tier 3 KYC (BVN &amp; NIN)
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  66% Verified
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-primary w-full" />
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    <span className="font-mono text-[10px] truncate">1. BVN Linked</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-primary/30 w-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-2/3 bg-primary rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 text-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[13px]">pending</span>
                    <span className="font-mono text-[10px] truncate">2. NIN / ID</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-surface-container-highest w-full" />
                  <div className="flex items-center gap-1 text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    <span className="font-mono text-[10px] truncate">3. Liveness</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('kyc-docs')}
                className="mt-4 w-full py-2.5 rounded-full bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Resume BVN / NIN Tier 3 Verification</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-high rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary-container/20 text-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">gavel</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-secondary-fixed">
                      CBN &amp; NFIU Governance
                    </span>
                    <span className="font-mono text-[10px] text-secondary-fixed uppercase tracking-wider bg-secondary-container/40 px-2 py-0.5 rounded">
                      RBAC ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Sign in with an authorized administrator Google account to manage compliance
                    freezes, AML clearances, and immutable audit trails.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="w-full bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <button
              type="button"
              onClick={simulateBiometricAuth}
              className="group relative w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg mb-3 cursor-pointer"
            >
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
              <span
                className={`material-symbols-outlined text-3xl text-primary transition-transform ${
                  bioState === 'scanning' ? 'animate-spin' : 'group-hover:scale-110'
                }`}
              >
                {bioState === 'scanning'
                  ? 'sync'
                  : bioState === 'verified'
                    ? 'check_circle'
                    : 'fingerprint'}
              </span>
            </button>
            <h3 className="text-base font-semibold text-on-surface mb-0.5">
              {bioState === 'scanning'
                ? 'Verifying Session...'
                : bioState === 'verified'
                  ? 'Identity Confirmed'
                  : 'Passkey & Biometrics'}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-[240px]">
              {bioState === 'scanning'
                ? 'Verifying hardware token and active account session'
                : bioState === 'verified'
                  ? 'Challenge verified. Redirecting...'
                  : 'Tap icon to authenticate via Google or resume your active session'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container-highest" />
            <span className="font-mono text-on-surface-variant/70 uppercase tracking-widest text-[10px]">
              {roleMode === 'admin' ? 'Admin Identity Verification' : 'Verified Google Identity'}
            </span>
            <div className="flex-1 h-px bg-surface-container-highest" />
          </div>

          {isAuthenticated && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    Active Authenticated Session
                  </span>
                  {isAdminAuthenticated && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container uppercase">
                      CBN Admin
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-on-surface block truncate mt-0.5">
                  {activeUserName || 'Verified User'}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant truncate block">
                  {activeUserEmail}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(roleMode === 'admin' && isAdminAuthenticated ? 'admin-console' : 'home-wallet')
                  }
                  className="px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                >
                  Open Vault
                </button>
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-surface-container-lowest p-5 space-y-4 shadow-inner">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-on-surface">
                {roleMode === 'admin'
                  ? 'Sign In to CBN Compliance & Admin Hub'
                  : 'Sign In to Your Apex Vault'}
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {roleMode === 'admin'
                  ? 'Authenticate with your verified Google account to access compliance records, account freezes, and real-time audit logs.'
                  : 'Connect securely with your verified Google account to synchronize your multi-currency wallet, NIBSS transfers, and KYC status.'}
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-error-container/35 border border-error/40 text-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGoogleAuth()}
              className="w-full py-3.5 px-5 rounded-full bg-primary hover:bg-primary-fixed text-on-primary text-sm font-semibold flex items-center justify-center gap-2.5 shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span>
                    {roleMode === 'admin'
                      ? 'Continue with Google (Admin Access)'
                      : 'Continue with Google'}
                  </span>
                </>
              )}
            </button>

            <div className="bg-surface-container rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">phonelink_lock</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">
                    Encrypted Cloud Persistence
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    Real-Time Multi-Collection Sync Active
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-sm">shield_spark</span>
                <span className="font-mono text-[11px] font-semibold">Protected</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center gap-4 w-full flex-wrap">
              <button
                type="button"
                onClick={() => onNavigate('sign-up')}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Configure Account Profile / Sign Up</span>
              </button>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant/60 max-w-xs leading-relaxed">
              Licensed &amp; regulated in the Federal Republic of Nigeria (CBN / NDIC / NDPR).
              Encrypted with TLS 1.3 &amp; AES-GCM-256.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
