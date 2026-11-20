import React, { useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { ScreenId } from '../types';
import { SafeImage } from '../components/SafeImage';

interface FundWalletScreenProps {
  usdBalance: number;
  onConfirmDeposit: (amount: number, railName: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

const DEPOSIT_RAILS = [
  {
    id: 'fednow',
    title: 'Instant Bank Transfer',
    badge: 'FedNow / RTP',
    sub: 'Instant settlement • ₦0.00 network fee',
    connectedBank: 'Chase Business Checking (•••• 8821)',
    icon: 'electric_bolt',
  },
  {
    id: 'fedwire',
    title: 'Same-Day Fedwire',
    badge: 'SWIFT',
    sub: 'Unlimited volume • Cut-off 4:30 PM EST',
    icon: 'account_balance',
  },
  {
    id: 'crypto',
    title: 'USDC Mint Rails',
    badge: 'SOL / ERC-20',
    sub: '1:1 USD Redemption • Native Circle liquidity',
    icon: 'currency_exchange',
  },
  {
    id: 'cardpay',
    title: 'Apple Pay / Corporate Debit',
    sub: 'Instant clearing • Capped at ₦10,000/day',
    icon: 'credit_card',
  },
];

export const FundWalletScreen: React.FC<FundWalletScreenProps> = ({
  usdBalance,
  onConfirmDeposit,
  onNavigate,
  onShowToast,
}) => {
  const [selectedRail, setSelectedRail] = useState('fednow');
  const [depositAmount, setDepositAmount] = useState<number>(25000);

  const activeRailObj = DEPOSIT_RAILS.find((r) => r.id === selectedRail) || DEPOSIT_RAILS[0];
  const remainingLimit = Math.max(250000 - depositAmount, 0);

  const formatMoney = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAmountChange = (raw: string) => {
    const clean = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(clean)) {
      setDepositAmount(0);
    } else {
      setDepositAmount(Math.min(clean, 250000));
    }
  };

  const handleDepositSubmit = () => {
    if (depositAmount <= 0) {
      onShowToast('Enter a deposit amount greater than ₦0');
      return;
    }
    onConfirmDeposit(depositAmount, activeRailObj.title);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10">
      <div className="relative w-full rounded-2xl bg-surface-container-low p-4 sm:p-6 shadow-xl overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined material-symbols-filled text-lg">
                add_card
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[10px] text-primary">
                TIER 2 VERIFIED • ₦250k LIMIT
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss Modal"
            onClick={() => onNavigate('home-wallet')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="relative flex flex-col gap-1 pb-5">
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Fund Your Account
          </h1>
          <p className="text-sm text-on-surface-variant">
            Select your institutional funding rail &amp; initiate instant settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Destination + Funding Rails */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface-variant">Deposit Destination</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      USD Operating Vault
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant">•••• 4912</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="block font-mono text-[10px] text-on-surface-variant uppercase">
                  Current
                </span>
                <span className="font-mono text-sm text-on-surface tabular-nums">
                  ₦{formatMoney(usdBalance)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                  Deposit Rail
                </span>
                <span className="font-mono text-[11px] text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">bolt</span> Zero-Fee Clearing
                </span>
              </div>

              {DEPOSIT_RAILS.map((rail) => {
                const isSelected = selectedRail === rail.id;
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => setSelectedRail(rail.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container ring-1 ring-primary/40'
                        : 'bg-surface-container-high/60 hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">{rail.icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-on-surface">
                              {rail.title}
                            </span>
                            {rail.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                                  isSelected
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-surface-bright text-on-surface-variant'
                                }`}
                              >
                                {rail.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-on-surface-variant mt-0.5">{rail.sub}</span>
                          {rail.connectedBank && isSelected && (
                            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high w-fit">
                              <span className="material-symbols-outlined text-sm text-secondary">
                                verified_user
                              </span>
                              <span className="text-xs text-on-surface truncate">
                                {rail.connectedBank}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-highest'
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-sm font-bold">check</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deposit Amount + Breakdown + CTA */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <label
                  htmlFor="deposit-input"
                  className="text-xs text-on-surface-variant uppercase tracking-wider"
                >
                  Deposit Amount
                </label>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  Tier Limit: ₦250,000.00
                </span>
              </div>

              <div className="relative w-full rounded-xl bg-surface-container p-4 flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-3xl text-primary font-mono font-semibold">₦</span>
                  <input
                    id="deposit-input"
                    type="text"
                    value={depositAmount.toLocaleString('en-US')}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-3xl font-mono font-semibold text-on-surface tracking-tight p-0 tabular-nums"
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-highest flex-shrink-0">
                  <SafeImage
                    src={APEX_IMAGES.usdFlag}
                    alt="USD flag"
                    className="w-4 h-4 rounded-full object-cover"
                    fallbackIcon="attach_money"
                  />
                  <span className="font-mono text-xs text-on-surface font-semibold">USD</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {[
                  { label: '+₦1k', amt: 1000 },
                  { label: '+₦5k', amt: 5000 },
                  { label: '+₦25k', amt: 25000 },
                  { label: '+₦50k', amt: 50000 },
                  { label: 'Max', amt: 250000 },
                ].map((chip) => {
                  const active = depositAmount === chip.amt;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setDepositAmount(chip.amt)}
                      className={`py-2 px-1 rounded-lg text-center font-mono text-xs transition-colors ${
                        active
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-surface-container p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm font-semibold text-on-surface">Transfer Breakdown</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-mono text-[10px] text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">shield</span> Authenticated
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Settlement Principal</span>
                <span className="font-mono text-sm text-on-surface tabular-nums">
                  ₦{formatMoney(depositAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Apex Inbound Fee</span>
                <div className="flex items-center gap-1.5">
                  <span className="line-through font-mono text-[11px] text-on-surface-variant">
                    ₦25.00
                  </span>
                  <span className="font-mono text-xs text-primary font-medium">
                    ₦0.00 (Waived)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Network Rail</span>
                <span className="text-on-surface">{activeRailObj.title}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Funds Availability</span>
                <span className="text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span> Immediate
                  (&lt; 10s)
                </span>
              </div>

              <div className="pt-2 mt-1 flex items-center justify-between bg-surface-container-high/40 p-2.5 rounded-lg">
                <span className="text-xs text-on-surface-variant">Remaining Daily Limit</span>
                <span className="font-mono text-xs text-on-surface font-semibold tabular-nums">
                  ₦{formatMoney(remainingLimit)} left
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-high/50 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined material-symbols-filled text-lg">
                  security
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-on-surface font-semibold">
                  Protected Institutional Clearing
                </span>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Inbound USD deposits are swept into program banks insured by the FDIC up to
                  ₦250,000 per depositor. Regulated FinCEN MSB #3100021489.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDepositSubmit}
                className="w-full py-3.5 px-4 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined material-symbols-filled text-xl">
                  fingerprint
                </span>
                <span>Confirm &amp; Deposit ₦{formatMoney(depositAmount)}</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('transfers')}
                className="w-full py-2 text-on-surface-variant hover:text-on-surface text-xs text-center transition-colors"
              >
                View Wire Routing Details &amp; Direct IBAN Instructions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
