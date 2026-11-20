import React from 'react';
import { DepositReceiptData, ScreenId } from '../types';

interface DepositSuccessScreenProps {
  receipt: DepositReceiptData;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const DepositSuccessScreen: React.FC<DepositSuccessScreenProps> = ({
  receipt,
  onNavigate,
  onShowToast,
}) => {
  const formatMoney = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10 space-y-5">
      <div className="relative w-full flex flex-col items-center">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Status Badge & Timestamp */}
        <div className="flex flex-col items-center mt-1 mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] text-primary tracking-wider uppercase font-semibold">
              SETTLEMENT COMPLETED • INSTANT CLEARING
            </span>
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant mt-1.5">
            {receipt.timestamp}
          </span>
        </div>

        {/* Hero Success Visual & Amount */}
        <div className="flex flex-col items-center text-center mb-6 w-full">
          <div className="relative flex items-center justify-center w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping opacity-60" />
            <div className="absolute inset-2 rounded-full bg-surface-container-highest shadow-inner" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary shadow-[0_0_28px_rgba(78,222,163,0.45)]">
              <span className="material-symbols-outlined material-symbols-filled text-on-primary font-bold text-3xl">
                done_all
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-primary tabular-nums">
              +₦{formatMoney(receipt.amount)}
            </span>
            <span className="font-mono text-sm text-primary/80 uppercase">USD</span>
          </div>
          <h1 className="text-xl font-semibold text-on-surface mt-1">
            Deposit Settled Successfully
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-sm mx-auto leading-relaxed">
            Funds arrived in your USD Operating Vault via {receipt.railName} and are primed for
            active allocation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Updated Vault Balance Card */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="w-full bg-surface-container rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-on-surface-variant block truncate">Destination</span>
                  <span className="text-sm text-on-surface font-semibold truncate">
                    USD Operating Vault{' '}
                    <span className="text-on-surface-variant font-normal text-xs">
                      (•••• 4912)
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('home-wallet')}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-primary text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
              >
                <span>View Vault</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant block">New Available Balance</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-mono text-lg text-on-surface font-bold tabular-nums">
                    ₦{formatMoney(receipt.newBalance)}
                  </span>
                  <span className="font-mono text-[11px] text-on-surface-variant">USD</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-on-surface-variant block">Previous</span>
                <span className="font-mono text-xs text-outline block mt-0.5 line-through tabular-nums">
                  ₦{formatMoney(receipt.previousBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="text-xs font-medium tracking-tight text-primary">
                Earning 5.40% Treasury APY • Compounded Daily
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigate('home-wallet')}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(78,222,163,0.3)]"
            >
              <span className="text-sm text-on-primary font-semibold">
                Go to Dashboard &amp; Wallet
              </span>
              <span className="material-symbols-outlined text-on-primary text-[20px]">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('market-public')}
              className="w-full h-12 rounded-full bg-surface-container-high hover:bg-surface-bright active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-on-surface"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">
                account_balance_wallet
              </span>
              <span className="text-sm text-on-surface font-medium">
                Deploy into Treasury Yield (5.40% APY)
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onShowToast(`PDF Receipt ${receipt.referenceId} generated`)}
                className="h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span className="text-xs font-medium">PDF Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(receipt.enclaveHash);
                  onShowToast('Cryptographic proof copied');
                }}
                className="h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span className="text-xs font-medium">Share Proof</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipt & Audit Proof Card */}
        <div className="lg:col-span-7 w-full bg-surface-container rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span className="text-base text-on-surface font-semibold truncate">
                Receipt &amp; Audit Proof
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
              COMPLIANT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">Reference ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-on-surface font-semibold">
                  {receipt.referenceId}
                </span>
                <button
                  type="button"
                  aria-label="Copy Reference ID"
                  onClick={() => {
                    navigator.clipboard?.writeText(receipt.referenceId);
                    onShowToast('Copied to Clipboard');
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">Funding Source</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface font-medium">
                  Chase Business Checking{' '}
                  <span className="text-on-surface-variant font-mono">(•••• 8821)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">Network Rail</span>
              <div className="text-right">
                <span className="text-on-surface font-medium block">{receipt.railName}</span>
                <span className="font-mono text-[10px] text-primary font-semibold">
                  Settled in 3.2s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">Inbound Apex Fee</span>
              <div className="text-right">
                <span className="font-mono text-primary font-semibold">₦0.00</span>
                <span className="text-[11px] text-on-surface-variant block">
                  Waived Institutional
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">Clearing Auth</span>
              <span className="font-mono text-on-surface">{receipt.authCode}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant">FDIC Sweep Status</span>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                <span className="font-medium">Protected up to ₦250k</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-3">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">
                    Enclave Attestation Hash
                  </span>
                  <span className="font-mono text-xs text-primary truncate mt-0.5">
                    {receipt.enclaveHash}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Copy Enclave Hash"
                  onClick={() => {
                    navigator.clipboard?.writeText(receipt.enclaveHash);
                    onShowToast('Copied to Clipboard');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="w-full pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-on-surface-variant mb-1">
          <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
          <span className="font-mono text-[11px] tracking-wide text-primary">
            Cryptographically Signed &amp; Audited
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto leading-normal">
          Apex Settlement Engine. FDIC Insured Program Bank swept. FinCEN registered MSB
          #3100021489. All rights reserved.
        </p>
      </div>
    </div>
  );
};
