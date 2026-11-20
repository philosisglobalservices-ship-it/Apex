import React, { useState } from 'react';
import { ScreenId, TransactionItem, UserProfile } from '../types';

interface WalletScreenProps {
  usdBalance: number;
  eurBalance: number;
  usdcBalance: number;
  transactions: TransactionItem[];
  cardFrozen: boolean;
  userProfile: UserProfile;
  onToggleCardFreeze: () => void;
  onNavigate: (screen: ScreenId, options?: { transferMode?: 'send' | 'receive' }) => void;
  onShowToast: (msg: string) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  usdBalance,
  eurBalance,
  usdcBalance,
  transactions,
  cardFrozen,
  userProfile,
  onToggleCardFreeze,
  onNavigate,
  onShowToast,
}) => {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedVaultModal, setSelectedVaultModal] = useState<string | null>(null);

  // Convert EUR + USDC to approximate USD total net worth
  const totalNetWorth = usdBalance + eurBalance * 1.085 + usdcBalance;

  const formatMoney = (val: number, decimals = 2) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const visibleTransactions = showAllActivity ? transactions : transactions.slice(0, 4);

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 space-y-6 select-none">
      {/* User Greeting & Home Sign-Up CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Institutional Portfolio</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]">
              <span className="material-symbols-outlined material-symbols-filled text-[13px] mr-1">
                verified
              </span>
              {userProfile.isRegistered ? 'Registered Account' : 'Tier 2 Verified'}
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-on-surface tracking-tight truncate mt-0.5">
            Welcome back, {userProfile.fullName.split(' ')[0] || 'Alex'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('sign-up')}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-fixed text-on-primary px-3.5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            onClick={() => onShowToast('Portfolio currency: USD Native')}
            className="flex items-center gap-1.5 bg-surface-container-high px-3 py-2 rounded-full shadow-sm hover:bg-surface-container-highest transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] text-on-surface uppercase tracking-wider">
              USD Native
            </span>
          </button>
        </div>
      </div>

      {/* New User Sign-Up Banner */}
      {!userProfile.isRegistered && (
        <div className="rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low p-4 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-on-surface">
                New to Apex Finance? Open your own account in 60 seconds
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Get instant NUBAN &amp; multi-currency vaults, virtual cards, and zero-fee transfers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('profile-auth')}
              className="px-3.5 py-2 rounded-full bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sign-up')}
              className="px-4 py-2 rounded-full bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_16px_rgba(78,222,163,0.25)] transition-all cursor-pointer"
            >
              <span>Create Free Account</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive Desktop Split: Balance + Quick Actions on Left, Cash Flow + Titanium Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Primary Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-6 shadow-xl shadow-surface-container-lowest/50">
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-secondary-container/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                    Total Liquid Net Worth
                  </span>
                  <button
                    type="button"
                    aria-label="Toggle balance visibility"
                    onClick={() => setBalanceHidden((v) => !v)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {balanceHidden ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +12.4%
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-lg text-on-surface-variant font-light">₦</span>
                  <span className="text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight tabular-nums font-mono">
                    {balanceHidden ? '••••••••' : formatMoney(totalNetWorth)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant text-xs">
                  <span className="text-primary font-mono font-medium">+₦16,420.00</span>
                  <span>unrealized yield this cycle</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-surface-container/70 rounded-xl p-3">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block">
                    Daily P&amp;L
                  </span>
                  <span className="font-mono text-sm text-primary font-semibold tabular-nums">
                    {balanceHidden ? '••••••' : '+₦2,410.88'}
                  </span>
                </div>
                <div className="bg-surface-container/70 rounded-xl p-3">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block">
                    Monthly Limit Used
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-sm text-on-surface tabular-nums">34.8%</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">Tier 2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Command Center */}
          <div className="grid grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('transfers', { transferMode: 'send' })}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all">
                <span className="material-symbols-outlined text-2xl">arrow_outward</span>
              </div>
              <span className="text-[11px] text-on-surface font-medium truncate w-full text-center">
                Send
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('transfers', { transferMode: 'receive' })}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
              </div>
              <span className="text-[11px] text-on-surface font-medium truncate w-full text-center">
                Receive
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('fund-wallet')}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-surface-bright transition-all">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <span className="text-[11px] text-on-surface font-medium truncate w-full text-center">
                Deposit
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-tertiary-container/30 text-tertiary flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-tertiary group-hover:text-on-tertiary transition-all">
                <span className="material-symbols-outlined text-2xl">credit_card</span>
              </div>
              <span className="text-[11px] text-on-surface font-medium truncate w-full text-center">
                Cards
              </span>
            </button>
          </div>

          {/* Multi-Currency Vaults & Accounts */}
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface tracking-tight">
                Active Vaults &amp; Accounts
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('fund-wallet')}
                className="text-xs text-primary hover:text-primary-fixed transition-colors font-medium"
              >
                Manage
              </button>
            </div>

            <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
              {/* USD Main */}
              <button
                type="button"
                onClick={() => setSelectedVaultModal('USD Main')}
                className="min-w-[235px] flex-1 text-left rounded-xl bg-surface-container p-4 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">attach_money</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-on-surface block">USD Main</span>
                      <span className="font-mono text-[10px] text-on-surface-variant block">
                        IBAN •••• 4912
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono text-[9px] uppercase">
                    Default
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="font-mono text-lg text-on-surface font-bold tabular-nums">
                    {balanceHidden ? '••••••' : `₦${formatMoney(usdBalance)}`}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-on-surface-variant">Cleared Instant Wire</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              </button>

              {/* EUR Yield Vault */}
              <button
                type="button"
                onClick={() => setSelectedVaultModal('EUR Yield Vault')}
                className="min-w-[235px] flex-1 text-left rounded-xl bg-surface-container p-4 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">euro</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-on-surface block">
                        EUR Yield Vault
                      </span>
                      <span className="font-mono text-[10px] text-primary block">
                        4.8% APY Staked
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono text-[9px] font-semibold">
                    Compounding
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block">
                    Protected Stash
                  </span>
                  <span className="font-mono text-lg text-on-surface font-bold tabular-nums">
                    {balanceHidden ? '••••••' : `€${formatMoney(eurBalance)}`}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-on-surface-variant">
                    Earned this month: €168.40
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    auto_graph
                  </span>
                </div>
              </button>

              {/* Digital Liquidity USDC */}
              <button
                type="button"
                onClick={() => setSelectedVaultModal('Digital Liquidity')}
                className="min-w-[235px] flex-1 text-left rounded-xl bg-surface-container p-4 flex flex-col justify-between shadow-md hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-lg">currency_exchange</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-on-surface block">
                        Digital Liquidity
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant block">
                        Arbitrum L2 Multi-sig
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono text-[9px] uppercase">
                    Cold Vault
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block">
                    Token Pool
                  </span>
                  <span className="font-mono text-lg text-on-surface font-bold tabular-nums">
                    {balanceHidden ? '••••••' : formatMoney(usdcBalance)}{' '}
                    <span className="text-sm font-normal text-tertiary">USDC</span>
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-on-surface-variant">Gas Subsidy Active</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column on Desktop: Cash Flow Sparkline + Black Titanium Card */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* 7-Day Net Cash Flow */}
          <div className="rounded-2xl bg-surface-container p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-on-surface tracking-tight">
                  7-Day Net Cash Flow
                </h3>
                <p className="text-xs text-on-surface-variant">Inflow vs. Outflow settlements</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  +₦34.2k
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-surface-bright" />
                  -₦12.1k
                </span>
              </div>
            </div>

            <div className="relative w-full h-24 pt-2">
              <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 320 80">
                <defs>
                  <linearGradient id="primaryFlowGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="strokeGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#0566d9" />
                    <stop offset="60%" stopColor="#4edea3" />
                    <stop offset="100%" stopColor="#6ffbbe" />
                  </linearGradient>
                </defs>
                <line stroke="#242a38" strokeDasharray="3 3" x1="0" x2="320" y1="65" y2="65" />
                <line stroke="#242a38" strokeDasharray="3 3" x1="0" x2="320" y1="35" y2="35" />
                <path
                  d="M 0,65 Q 40,55 80,42 T 160,28 T 240,48 T 320,15 L 320,75 L 0,75 Z"
                  fill="url(#primaryFlowGrad)"
                />
                <path
                  d="M 0,65 Q 40,55 80,42 T 160,28 T 240,48 T 320,15"
                  stroke="url(#strokeGrad)"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <path
                  d="M 0,55 Q 50,68 110,60 T 200,64 T 270,50 T 320,58"
                  opacity="0.6"
                  stroke="#86948a"
                  strokeDasharray="2 3"
                  strokeWidth="1.5"
                />
                <circle cx="320" cy="15" fill="#4edea3" r="4" />
                <circle cx="320" cy="15" fill="#4edea3" fillOpacity="0.3" r="7" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant font-mono text-[10px] pt-1">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span className="text-primary font-bold">TODAY</span>
            </div>
          </div>

          {/* Active Virtual Card */}
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface tracking-tight">
                Active Virtual Card
              </h3>
              <span className="font-mono text-[11px] text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span> Hardware
                Protected
              </span>
            </div>

            <div
              className={`relative w-full h-52 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl bg-surface-container-low transition-opacity ${
                cardFrozen ? 'opacity-65' : 'opacity-100'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest via-surface-container-high/40 to-surface-bright/20 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-sm font-bold">
                      change_history
                    </span>
                  </div>
                  <span className="text-lg font-semibold tracking-wider text-on-surface">APEX</span>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-bright text-on-surface">
                    Black Titanium
                  </span>
                </div>
                <span className="material-symbols-outlined text-2xl text-on-surface-variant rotate-90">
                  contactless
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-7 rounded bg-gradient-to-br from-amber-200/80 to-amber-600/70 p-0.5 flex flex-col justify-between shadow-inner">
                  <div className="w-full h-0.5 bg-amber-900/40 rounded" />
                  <div className="w-full h-0.5 bg-amber-900/40 rounded" />
                </div>
                <span className="material-symbols-outlined text-lg text-primary/80">
                  {cardFrozen ? 'ac_unit' : 'lock'}
                </span>
                {cardFrozen && (
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-error-container text-on-error-container">
                    Frozen
                  </span>
                )}
              </div>

              <div className="relative z-10 flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg tracking-widest text-on-surface">
                    •••• •••• •••• 8841
                  </span>
                  <span className="font-mono text-sm text-on-surface-variant">10/28</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[10px] uppercase tracking-wider">ALEXANDER M. ROTH</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface font-semibold">
                    VISA PLATINUM
                  </span>
                </div>
              </div>
            </div>

            {/* Card Micro Controls */}
            <div className="flex items-center justify-between bg-surface-container px-4 py-2.5 rounded-xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  {cardFrozen ? 'lock' : 'lock_open'}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">Card Security Status</span>
                  <span
                    className={`font-mono text-[10px] ${
                      cardFrozen ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {cardFrozen ? 'Frozen by user (Declining all)' : 'Active & NFC Enabled'}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Freeze virtual card"
                  checked={cardFrozen}
                  onChange={onToggleCardFreeze}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Institutional Activity Feed */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-on-surface tracking-tight">Recent Activity</h3>
          <button
            type="button"
            onClick={() => setShowAllActivity((v) => !v)}
            className="text-xs text-primary hover:text-primary-fixed transition-colors font-medium"
          >
            {showAllActivity ? 'Show Less' : `View All (${transactions.length})`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {visibleTransactions.map((tx) => {
            const isPositive = tx.amount >= 0;
            const iconBg =
              tx.type === 'inflow'
                ? 'bg-primary/10 text-primary'
                : tx.type === 'yield'
                  ? 'bg-tertiary-container/20 text-tertiary'
                  : 'bg-surface-container-highest text-on-surface';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
                  >
                    <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-on-surface truncate">{tx.title}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {tx.timestamp}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span
                        className={`px-1.5 py-0.5 rounded-full font-mono text-[9px] ${
                          isPositive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-bright text-on-surface'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span
                    className={`font-mono text-sm font-semibold block tabular-nums ${
                      isPositive ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {isPositive ? `+₦${formatMoney(tx.amount)}` : `-₦${formatMoney(Math.abs(tx.amount))}`}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">{tx.vaultLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional Audit Footer Banner */}
      <div className="p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">verified_user</span>
          <span className="text-[11px]">SOC2 Type II Certified &amp; SIPC Covered</span>
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant">v4.18.2</span>
      </div>

      {/* Virtual Card Quick Details Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Black Titanium Card Controls
              </h3>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Cardholder</span>
                <span className="font-mono text-on-surface">ALEXANDER M. ROTH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Card Number</span>
                <span className="font-mono text-on-surface">4532 •••• •••• 8841</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Daily Spend Limit</span>
                <span className="font-mono text-primary">₦25,000.00 / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Status</span>
                <span className={cardFrozen ? 'text-error font-semibold' : 'text-primary font-semibold'}>
                  {cardFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleCardFreeze();
                  setShowCardModal(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-xs font-semibold"
              >
                {cardFrozen ? 'Unfreeze Card' : 'Freeze Card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('4532 8810 4920 8841');
                  onShowToast('Virtual card PAN copied');
                  setShowCardModal(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
              >
                Copy Card Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Detail Modal */}
      {selectedVaultModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">{selectedVaultModal}</h3>
              <button
                type="button"
                onClick={() => setSelectedVaultModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Vault clearing rails are active with real-time settlement across FedNow, SEPA Instant,
              and Arbitrum L2 liquidity pools.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedVaultModal(null);
                  onNavigate('fund-wallet');
                }}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
              >
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVaultModal(null);
                  onNavigate('transfers', { transferMode: 'send' });
                }}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Send From Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
