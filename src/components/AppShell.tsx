import React, { useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { NotificationItem, PrimaryTabId, ScreenId } from '../types';
import { SafeImage } from './SafeImage';

interface AppShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  toastMessage: string | null;
  roleMode: 'client' | 'admin';
  kycTierStatus: string;
  children: React.ReactNode;
}

const PRIMARY_TABS: { id: PrimaryTabId; label: string; icon: string }[] = [
  { id: 'home-wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { id: 'transfers', label: 'Transfers', icon: 'swap_horiz' },
  { id: 'market-public', label: 'Market', icon: 'candlestick_chart' },
  { id: 'admin-console', label: 'Admin', icon: 'admin_panel_settings' },
  { id: 'profile-auth', label: 'Profile', icon: 'fingerprint' },
];

const JOURNEY_SCREENS: { id: ScreenId; label: string; icon: string; badge?: string }[] = [
  { id: 'kyc-docs', label: 'NIN / BVN KYC', icon: 'document_scanner', badge: '2/3' },
  { id: 'kyc-liveness', label: 'Biometric Scan', icon: 'face', badge: '3/3' },
  { id: 'kyc-success', label: 'Tier 3 Approved', icon: 'verified_user' },
  { id: 'fund-wallet', label: 'Fund Wallet', icon: 'add_card' },
  { id: 'deposit-success', label: 'NIP Receipt', icon: 'receipt_long' },
];

function mapScreenToTab(screen: ScreenId): PrimaryTabId {
  switch (screen) {
    case 'home-wallet':
    case 'fund-wallet':
    case 'deposit-success':
      return 'home-wallet';
    case 'transfers':
      return 'transfers';
    case 'market-public':
      return 'market-public';
    case 'admin-console':
      return 'admin-console';
    case 'profile-auth':
    case 'sign-up':
    case 'kyc-docs':
    case 'kyc-liveness':
    case 'kyc-success':
      return 'profile-auth';
  }
}

export const AppShell: React.FC<AppShellProps> = ({
  activeScreen,
  onNavigate,
  notifications,
  onMarkAllRead,
  toastMessage,
  roleMode,
  kycTierStatus,
  children,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const activeTab = mapScreenToTab(activeScreen);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Global Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-none transition-all duration-200 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-bright text-on-surface shadow-xl border border-outline-variant/40 ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
        <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{toastMessage}</span>
      </div>

      {/* Fixed Top App Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-dim/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto h-16 px-4 lg:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home-wallet')}
            className="flex items-center gap-2.5 min-w-0 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-lg"
          >
            <SafeImage
              src={APEX_IMAGES.logo}
              alt="Apex Finance Nigeria Logo"
              className="h-8 w-8 rounded-lg object-contain flex-shrink-0"
              fallbackIcon="change_history"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-on-surface truncate tracking-tight">
                  Apex Finance NG
                </span>
              </div>
              <div className="flex items-center gap-1 text-primary-fixed-dim">
                <span className="material-symbols-outlined text-[13px] leading-none">lock</span>
                <span className="font-mono uppercase tracking-wider text-[10px] text-primary truncate">
                  CBN &amp; NDIC Protected
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Quick Journey Switcher Strip */}
          <div className="hidden xl:flex items-center gap-1 bg-surface-container-low/90 p-1 rounded-full border border-white/[0.05]">
            {JOURNEY_SCREENS.map((item) => {
              const isCurrent = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 relative">
            <button
              type="button"
              onClick={() => onNavigate('sign-up')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeScreen === 'sign-up'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-primary/15 hover:bg-primary hover:text-on-primary text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Sign Up</span>
            </button>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-[11px] font-mono text-on-surface-variant mr-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  roleMode === 'admin' ? 'bg-secondary' : 'bg-primary'
                }`}
              />
              {roleMode === 'admin' ? 'CBN Admin Mode' : kycTierStatus}
            </span>

            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-dim" />
              )}
            </button>

            <button
              type="button"
              aria-label="Account Profile"
              onClick={() => onNavigate('profile-auth')}
              className="w-11 h-11 flex items-center justify-center rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all"
            >
              <SafeImage
                src={APEX_IMAGES.profileAvatar}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                fallbackIcon="person"
              />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 rounded-2xl bg-surface-container-high border border-white/10 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-on-surface">
                    NIBSS &amp; Security Alerts
                  </span>
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.targetScreen) onNavigate(n.targetScreen);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-colors flex items-start gap-2.5"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.unread ? 'bg-primary' : 'bg-outline-variant'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-on-surface truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant flex-shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                          {n.detail}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Shell */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto pt-16 pb-24 lg:pb-8">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 px-4 py-6 gap-6 border-r border-white/[0.05]">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Core Workspaces
            </div>
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id && activeScreen === tab.id;
              const isParentActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary font-semibold shadow-md shadow-primary/15'
                      : isParentActive
                        ? 'bg-surface-container-high text-primary'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive || isParentActive ? 'material-symbols-filled' : ''
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              CBN KYC &amp; Funding Flow
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sign-up')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeScreen === 'sign-up'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span className="truncate">Sign Up</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                1/3
              </span>
            </button>
            {JOURNEY_SCREENS.map((item) => {
              const isCurrent = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-secondary-container/25 text-secondary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-2xl bg-surface-container-low p-3.5 space-y-2 border border-white/[0.04]">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span className="text-xs font-semibold text-on-surface">NIBSS &amp; NDPR Enclave</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              NIBSS NIP, Domiciliary USD &amp; cNGN / USDC rails active in Lagos (WAT).
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          {JOURNEY_SCREENS.some((s) => s.id === activeScreen) && (
            <div className="xl:hidden px-4 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {JOURNEY_SCREENS.map((item) => {
                const isCurrent = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                      isCurrent
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">{children}</div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-dim/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.5)] border-t border-white/[0.04]">
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(tab.id)}
                className={`relative flex flex-col items-center justify-center w-16 h-14 transition-colors ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isActive ? 'material-symbols-filled' : ''
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="text-[11px] leading-tight mt-0.5">{tab.label}</span>
                <span
                  className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
