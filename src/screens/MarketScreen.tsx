import React, { useEffect, useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { apexApi, MarketOverviewResponse } from '../services/api';
import { ScreenId } from '../types';
import { SafeImage } from '../components/SafeImage';

interface MarketScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const FAQ_ITEMS = [
  {
    q: 'How does Apex generate up to 5.40% APY on USD?',
    a: 'Yields are backed by ultra-short duration US Treasury Bills and overnight repurchase agreements held with our regulated prime custodians. There is no unsecured lending or speculative rehypothecation.',
  },
  {
    q: 'Is my capital protected and insured?',
    a: "Yes. USD cash holdings are held in program banks insured by the FDIC up to ₦250,000 per depositor. Digital assets are covered under a ₦150M syndicate crime policy through Lloyd's of London underwriters.",
  },
  {
    q: 'What documents are needed to onboard?',
    a: 'Individual accounts require a government-issued photo ID and automated biometric facial verification (completed in ~90 seconds). Corporate entities require articles of incorporation and beneficial ownership verification.',
  },
];

export const MarketScreen: React.FC<MarketScreenProps> = ({ onNavigate }) => {
  const [depositPrincipal, setDepositPrincipal] = useState(50000);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [marketData, setMarketData] = useState<MarketOverviewResponse>({
    treasuryApy: 5.4,
    fxUsdToEur: 0.9214,
    slaUptime: '99.999%',
    settlementVelocityMs: 420,
    globalVolumeLabel: '₦4.2B+',
    updatedAt: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    apexApi
      .getMarketOverview(controller.signal)
      .then((overview) => {
        if (!controller.signal.aborted) {
          setMarketData(overview);
        }
      })
      .catch(() => {
        // Retain fallback defaults when offline
      });
    return () => controller.abort();
  }, []);

  const annualYield = depositPrincipal * (marketData.treasuryApy / 100);
  const totalValue = depositPrincipal + annualYield;

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero + Visual Asset Split on Desktop */}
      <div className="relative w-full overflow-hidden px-4 lg:px-6 pt-5 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-0 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Live Status Pill Tag */}
          <div className="flex items-center gap-2 self-start bg-surface-container-high px-3 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-[11px] text-primary tracking-wide uppercase">
              Apex v3.4 Live Engine
            </span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              verified
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight leading-tight">
              The Next Gen of{' '}
              <span className="bg-gradient-to-r from-primary via-primary-fixed-dim to-secondary bg-clip-text text-transparent">
                Global Capital
              </span>{' '}
              &amp; Precision Yield.
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-xl">
              Experience lightning-fast international settlements, algorithmic treasury yields, and
              bank-grade digital asset custody tailored for sovereign operators.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('sign-up')}
              className="group h-12 px-6 rounded-full bg-primary hover:bg-primary-fixed transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(78,222,163,0.35)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-on-primary text-xl">bolt</span>
              <span className="text-sm font-semibold text-on-primary whitespace-nowrap">
                Open Free Global Account
              </span>
              <span className="material-symbols-outlined text-on-primary text-lg transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('kyc-docs')}
              className="h-12 px-6 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 flex items-center justify-center gap-2 text-on-surface active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-secondary text-xl">
                corporate_fare
              </span>
              <span className="text-sm font-semibold text-on-surface whitespace-nowrap">
                Explore Institutional Tier
              </span>
            </button>
          </div>

          {/* Trust Security Accreditations Ribbon */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-xl p-3 flex items-center justify-around gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px]">
                verified_user
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface">SOC-2 Type II</span>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Certified Safe
                </span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-surface-container-highest" />
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                account_balance
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface">FDIC Insured</span>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Up to ₦250k
                </span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-surface-container-highest" />
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">
                policy
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface">FinCEN</span>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Registered MSB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual Asset */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container shadow-xl">
            <SafeImage
              src={APEX_IMAGES.heroVaultCard}
              alt="Apex obsidian titanium financial vault card"
              className="w-full h-56 lg:h-64 object-cover opacity-65"
              fallbackIcon="credit_card"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">
                    Network Settlement Velocity
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold text-primary tracking-tight">
                      {marketData.settlementVelocityMs}ms
                    </span>
                    <span className="text-xs text-on-surface-variant">avg cross-border speed</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full text-primary">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span className="font-mono text-[11px]">{marketData.slaUptime} SLA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Traction 3-col */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-container p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-on-surface-variant">FX Transfer Fee</span>
              <span className="font-mono text-lg font-semibold text-primary my-1">0.00%</span>
              <span className="text-[10px] text-on-surface-variant">Zero hidden spread</span>
            </div>
            <div className="bg-surface-container p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-on-surface-variant">USD Treasury APY</span>
              <span className="font-mono text-lg font-semibold text-secondary my-1">
                {marketData.treasuryApy.toFixed(2)}%
              </span>
              <span className="text-[10px] text-on-surface-variant">Compounded daily</span>
            </div>
            <div className="bg-surface-container p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <span className="text-[11px] text-on-surface-variant">Global Volume</span>
              <span className="font-mono text-lg font-semibold text-tertiary-fixed-dim my-1">
                {marketData.globalVolumeLabel}
              </span>
              <span className="text-[10px] text-on-surface-variant">140+ Jurisdictions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yield Simulator + Superpowers */}
      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Yield Simulator */}
        <div className="lg:col-span-5 bg-surface-container-high rounded-2xl p-5 shadow-md flex flex-col gap-4 justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">calculate</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-on-surface">Yield Simulator</h3>
                <p className="text-xs text-on-surface-variant">USD Institutional Treasury Vault</p>
              </div>
            </div>
            <div className="bg-primary/10 px-2.5 py-0.5 rounded-full text-primary font-mono text-[11px]">
              {marketData.treasuryApy.toFixed(2)}% APY
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-on-surface-variant">Deposit Principal</span>
              <span className="font-mono text-lg font-semibold text-on-surface tabular-nums">
                ₦{depositPrincipal.toLocaleString('en-US')} USD
              </span>
            </div>
            <input
              type="range"
              aria-label="Deposit principal"
              min={5000}
              max={250000}
              step={5000}
              value={depositPrincipal}
              onChange={(e) => setDepositPrincipal(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
              <span>₦5k</span>
              <span>₦100k</span>
              <span>₦250k Max</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">Est. 12-Month Return</span>
              <span className="font-mono text-lg font-semibold text-primary tabular-nums">
                +₦{annualYield.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-on-surface-variant">Total Vault Value</span>
              <span className="font-mono text-sm font-medium text-on-surface tabular-nums">
                ₦{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('fund-wallet')}
            className="w-full py-3 rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-sm font-semibold text-secondary flex items-center justify-center gap-1.5"
          >
            <span>Lock In Today&apos;s Yield</span>
            <span className="material-symbols-outlined text-sm">north_east</span>
          </button>
        </div>

        {/* Core Financial Superpowers */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold text-on-surface">Architected for Speed</h2>
            <p className="text-xs text-on-surface-variant">
              Three foundational advantages of the Apex financial core.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">sync_alt</span>
              </div>
              <h4 className="text-base font-semibold text-on-surface">
                Instant Liquidity Settlement
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Circumvent legacy SWIFT batch delays. Direct bilateral clearing guarantees funds
                reflect on counterparty balances in sub-seconds.
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-primary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Zero batch waiting windows</span>
              </div>
            </div>

            <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">currency_exchange</span>
              </div>
              <h4 className="text-base font-semibold text-on-surface">
                Multi-Currency Global IBANs
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hold, convert, and route USD, EUR, GBP, and verified USDC natively under single
                algorithmic compliance routing.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { code: 'USD', dot: 'bg-primary' },
                  { code: 'EUR', dot: 'bg-secondary' },
                  { code: 'GBP', dot: 'bg-tertiary-fixed-dim' },
                  { code: 'USDC', dot: 'bg-secondary-fixed' },
                ].map((cur) => (
                  <span
                    key={cur.code}
                    className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-mono text-[11px] text-on-surface flex items-center gap-1"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cur.dot}`} /> {cur.code}
                  </span>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 bg-surface-container p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-on-surface">
                    Role-Based Multi-Sig Vaults
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Configurable corporate signing rules, threshold biometric approvals, and automated
                    dual-custody limits for institutional treasuries.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px] shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">
                  fingerprint
                </span>
                <span>WebAuthn &amp; YubiKey</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Spotlight + FAQ + Final CTA */}
      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Testimonial + Conversion Banner */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <SafeImage
                src={APEX_IMAGES.testimonialElena}
                alt="Elena Vance, CIO at Chronos Digital Capital"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface">Elena Vance</span>
                <span className="text-xs text-on-surface-variant">
                  CIO at Chronos Digital Capital
                </span>
              </div>
            </div>
            <p className="text-sm text-on-surface italic leading-relaxed">
              &ldquo;Apex cut our cross-border FX execution drag by 94% within our first month. The
              ability to swap and settle ₦5M intraday with zero slippage is unprecedented.&rdquo;
            </p>
            <div className="flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
              <div className="flex items-center gap-0.5 text-primary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="material-symbols-outlined material-symbols-filled text-sm">
                    star
                  </span>
                ))}
              </div>
              <span>Verified Institutional Client</span>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest p-6 rounded-2xl flex flex-col items-center text-center gap-3 overflow-hidden shadow-lg">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface">Deploy Capital in Minutes</h3>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Join over 85,000 discerning private traders, syndicates, and funds building on Apex.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('sign-up')}
              className="w-full py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-fixed shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all active:scale-[0.98]"
            >
              Create Free Account
            </button>
            <span className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">
              No setup fee • No minimum balance
            </span>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-on-surface">Frequently Asked</h2>
          <div className="flex flex-col gap-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="bg-surface-container rounded-xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left gap-3"
                  >
                    <span className="text-sm font-semibold text-on-surface">{item.q}</span>
                    <span
                      className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 text-on-surface-variant text-xs leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
