import React, { useState } from 'react';
import { ScreenId } from '../types';

export interface SignUpOnboardingInput {
  fullName: string;
  phone: string;
  accountType: 'personal' | 'business';
}

interface SignUpScreenProps {
  onRegisterWithGoogle: (
    profile: SignUpOnboardingInput,
    destination: 'kyc-docs' | 'home-wallet'
  ) => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onRegisterWithGoogle,
  onNavigate,
  onShowToast,
}) => {
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+234 803 000 0000');
  const [referralCode, setReferralCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    if (fullName.trim().length < 2) {
      const msg = 'Please enter your full legal name';
      setErrorMsg(msg);
      onShowToast(msg);
      return false;
    }
    if (phone.replace(/[^0-9]/g, '').length < 7) {
      const msg = 'Please enter a valid phone number';
      setErrorMsg(msg);
      onShowToast(msg);
      return false;
    }
    if (!acceptedTerms) {
      const msg = 'Please accept the Terms of Service & NDPR Privacy Policy';
      setErrorMsg(msg);
      onShowToast(msg);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const submitRegistration = async (destination: 'kyc-docs' | 'home-wallet') => {
    if (submitting) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onRegisterWithGoogle(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          accountType,
        },
        destination
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Account registration failed';
      setErrorMsg(msg);
      onShowToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitRegistration('kyc-docs');
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('home-wallet')}
            aria-label="Back to Home"
            className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="min-w-0">
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest block">
              New User Onboarding • Step 1 of 3
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight truncate">
              Create Your Apex Account
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile-auth')}
          className="px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-secondary shrink-0 transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>

      {/* Auth Mode Toggle Banner */}
      <div className="w-full max-w-md bg-surface-container-lowest p-1 rounded-full flex relative shadow-inner mb-6">
        <button
          type="button"
          onClick={() => onNavigate('profile-auth')}
          className="flex-1 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">login</span>
          <span>Existing User Sign In</span>
        </button>
        <button
          type="button"
          className="flex-1 py-2 rounded-full text-xs font-semibold bg-primary text-on-primary shadow-md flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>New User Sign Up</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Onboarding Benefits & Account Tier */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-container p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Select Account Type</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                Instant NUBAN &amp; Vault
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                  accountType === 'personal'
                    ? 'bg-primary/15 ring-1 ring-primary text-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl mb-1.5 block ${
                    accountType === 'personal' ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  person
                </span>
                <span className="text-sm font-semibold block text-on-surface">Personal</span>
                <span className="text-[11px] text-on-surface-variant leading-snug block mt-0.5">
                  Multi-currency wallet, cards &amp; instant transfers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('business')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                  accountType === 'business'
                    ? 'bg-secondary-container/25 ring-1 ring-secondary text-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl mb-1.5 block ${
                    accountType === 'business' ? 'text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  corporate_fare
                </span>
                <span className="text-sm font-semibold block text-on-surface">Business</span>
                <span className="text-[11px] text-on-surface-variant leading-snug block mt-0.5">
                  Corporate treasury, payroll &amp; multi-sig approvals
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 space-y-3 border border-white/[0.04]">
            <h2 className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                verified_user
              </span>
              What You Get Immediately
            </h2>
            <div className="space-y-2.5 text-xs">
              {[
                {
                  icon: 'account_balance_wallet',
                  title: '₦0 Account Setup Fee',
                  desc: 'Open your Naira & global multi-currency vault in under 60 seconds.',
                },
                {
                  icon: 'bolt',
                  title: 'Instant NIBSS NIP & Global Transfers',
                  desc: 'Send money to local bank accounts and @handles with zero delay.',
                },
                {
                  icon: 'credit_card',
                  title: 'Virtual Black Titanium Card',
                  desc: 'Issued immediately after Tier 2 NIN / BVN verification.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface block">{item.title}</span>
                    <span className="text-on-surface-variant leading-relaxed">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Registration Form */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-md">
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                  {accountType === 'business'
                    ? 'Authorized Signatory Full Name'
                    : 'Full Legal Name'}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g. Chinedu Okafor"
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="+234 803 000 0000"
                    className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-xl pl-11 pr-4 py-3 font-mono text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                Referral / Invite Code <span className="text-on-surface-variant/50">(Optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. APEX-NG-2026"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-xl px-4 py-2.5 font-mono text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <span className="text-xs text-on-surface-variant leading-relaxed">
                I agree to the{' '}
                <span className="text-on-surface font-medium">Apex Account Terms</span> and{' '}
                <span className="text-on-surface font-medium">NDPR Data Protection Policy</span>.
              </span>
            </label>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 px-5 rounded-full bg-primary hover:bg-primary-fixed text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(78,222,163,0.3)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning Your Vault...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>Continue with Google &amp; Verify ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitRegistration('home-wallet')}
                className="py-3.5 px-5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Create &amp; Skip KYC</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-on-surface-variant">
            <span>Already have an Apex account?</span>
            <button
              type="button"
              onClick={() => onNavigate('profile-auth')}
              className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Sign In with Google</span>
              <span className="material-symbols-outlined text-sm">login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
