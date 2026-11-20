import React from 'react';
import { ScreenId } from '../types';

interface KycSuccessScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const KycSuccessScreen: React.FC<KycSuccessScreenProps> = ({
  onNavigate,
  onShowToast,
}) => {
  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10 space-y-5">
      {/* Hero Approval Crest */}
      <div className="relative w-full flex flex-col items-center text-center pt-4 pb-2 overflow-hidden">
        <div className="absolute -top-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/90 shadow-sm mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="font-mono text-[11px] tracking-wider uppercase text-primary font-semibold">
            Institutional Tier 2 Activated
          </span>
          <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
        </div>

        <div className="relative flex items-center justify-center my-2">
          <div className="absolute w-28 h-28 rounded-full bg-primary/5 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest flex items-center justify-center shadow-xl shadow-primary/20">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined material-symbols-filled text-primary text-4xl">
                verified_user
              </span>
            </div>
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-xs shadow-md">
              <span className="material-symbols-outlined text-sm font-bold">check</span>
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mt-4 tracking-tight">
          Identity Verified &amp; Approved
        </h1>
        <p className="text-sm text-on-surface-variant max-w-md mt-1 leading-relaxed">
          Welcome to Apex, <span className="text-on-surface font-semibold">Alexander</span>. Your
          digital vault credentials and automated liquidity rails are active for capital deployment.
        </p>

        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
          <span className="material-symbols-outlined text-primary text-[16px]">fingerprint</span>
          <span className="font-mono text-[11px] text-on-surface-variant">
            Liveness Confidence: <span className="text-primary font-semibold">99.98%</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="font-mono text-[11px] text-on-surface-variant">
            Protocol: <span className="text-on-surface">FIPS-140-3</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Attestation Certificate Card */}
        <div className="lg:col-span-6 w-full bg-surface-container-low rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                shield_with_heart
              </span>
              <span className="text-sm font-semibold text-on-surface">Attestation Certificate</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary">
              ZK-PROOF ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-surface-container rounded-xl flex flex-col justify-between">
              <span className="text-xs text-on-surface-variant">Account Master ID</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs text-on-surface tracking-wider font-semibold">
                  APX-982410-CH
                </span>
                <button
                  type="button"
                  aria-label="Copy Account ID"
                  onClick={() => {
                    navigator.clipboard?.writeText('APX-982410-CH');
                    onShowToast('Master ID APX-982410-CH copied');
                  }}
                  className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
            <div className="p-3 bg-surface-container rounded-xl flex flex-col justify-between">
              <span className="text-xs text-on-surface-variant">Daily Outbound Wire</span>
              <span className="font-mono text-xs text-primary font-semibold mt-1">₦250,000.00</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            {[
              { label: 'Entity Sanctions & AML', badge: 'CLEARED' },
              { label: 'Government Passport (CHE)', badge: 'VALIDATED' },
              { label: 'Hardware Enclave Proof', badge: '#ZK-7719-PASS' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    verified
                  </span>
                  <span>{row.label}</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary">
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activated Privileges & Next Actions */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">Activated Privileges</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                3 Ready
              </span>
            </div>
            <span className="font-mono text-[11px] text-on-surface-variant">Real-Time Routing</span>
          </div>

          {[
            {
              icon: 'account_balance',
              title: 'USD Operating Vault',
              sub: 'ACH, RTGS & FedNow 24/7 Rails',
            },
            {
              icon: 'euro',
              title: 'EUR Cross-Border IBAN',
              sub: 'SEPA Instant • Direct Clearing',
            },
            {
              icon: 'credit_card',
              title: 'Black Titanium Visa',
              sub: 'Issued • Exp 09/31 • Digitized',
            },
          ].map((priv) => (
            <div
              key={priv.title}
              className="w-full bg-surface-container-low rounded-xl p-3.5 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">{priv.icon}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-on-surface truncate">
                    {priv.title}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">{priv.sub}</span>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2 py-1 rounded bg-primary/10 text-primary font-semibold">
                ONLINE
              </span>
            </div>
          ))}

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('fund-wallet')}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary-fixed-dim text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              <span>Enter Apex &amp; Fund Wallet</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => onShowToast('Black Titanium Visa provisioned for Mobile Wallet')}
              className="w-full h-12 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">wallet</span>
              <span>Add Card to Apple / Google Wallet</span>
            </button>
            <button
              type="button"
              onClick={() => onShowToast('Verification Certificate PDF downloaded (142 KB)')}
              className="w-full py-2 text-center text-on-surface-variant hover:text-on-surface text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">download</span>
              <span>Download Legal Verification Certificate (PDF, 142 KB)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
