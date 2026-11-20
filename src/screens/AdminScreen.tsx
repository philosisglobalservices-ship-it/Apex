import React, { useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { AdminUser, AuditEntry } from '../types';
import { SafeImage } from '../components/SafeImage';

interface AdminScreenProps {
  users: AdminUser[];
  auditFeed: AuditEntry[];
  isAdminAuthenticated: boolean;
  onNavigateToAdminLogin: () => void;
  onToggleUserFreeze: (userId: string) => void;
  onResolveAml: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: string) => void;
  onAddAuditEntry: (event: string, actor: string) => void;
  onAddUser: (name: string, tier: string, roleLabel: string) => void;
  onExportCompliance?: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

const FILTER_TABS = [
  'All Roles',
  'Compliance Officer',
  'Institutional',
  'Flagged',
  'Pending KYC',
] as const;

export const AdminScreen: React.FC<AdminScreenProps> = ({
  users,
  auditFeed,
  isAdminAuthenticated,
  onNavigateToAdminLogin,
  onToggleUserFreeze,
  onResolveAml,
  onUpdateUserRole,
  onAddAuditEntry,
  onAddUser,
  onExportCompliance,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All Roles');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleDraft, setRoleDraft] = useState('');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTier, setNewTier] = useState('Business Pro Tier');
  const [newRole, setNewRole] = useState('Portfolio Manager');
  const [showFeeModal, setShowFeeModal] = useState(false);

  const flaggedCount = users.filter((u) => u.kycStatus === 'AML Flagged').length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.accountCode.toLowerCase().includes(search.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'All Roles') return true;
    if (activeFilter === 'Compliance Officer') return u.roleCategory === 'Compliance Officer';
    if (activeFilter === 'Institutional') return u.roleCategory === 'Institutional';
    if (activeFilter === 'Flagged') return u.kycStatus === 'AML Flagged';
    if (activeFilter === 'Pending KYC') return u.kycStatus === 'Pending KYC';
    return true;
  });

  const handleExportCompliance = async () => {
    if (onExportCompliance) {
      await onExportCompliance();
      return;
    }
    const report = {
      exportedAt: new Date().toISOString(),
      node: 'LAGOS-01',
      usersCount: users.length,
      users,
      auditFeed,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apex-compliance-export.json';
    a.click();
    URL.revokeObjectURL(url);
    onAddAuditEntry('COMPLIANCE_EXPORT • Snapshot Downloaded', 'Actor: SuperAdmin (Biometric OK)');
    onShowToast('Compliance snapshot exported');
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 space-y-5 pb-12">
      {!isAdminAuthenticated && (
        <div className="rounded-2xl bg-secondary-container/25 border border-secondary/35 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">
                CBN SuperAdmin Session Required for Live Mutations
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Sign in with your authorized CBN SuperAdmin Google account to commit account freezes,
                AML clearances, and role updates to Firestore and the backend API.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAdminLogin}
            className="px-4 py-2 rounded-full bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Admin Sign In / Setup
          </button>
        </div>
      )}

      {/* System Status Banner */}
      <div className="bg-surface-container-high rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-on-surface truncate">
                  Admin Operations Hub
                </span>
                <span className="bg-surface-container-highest text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SuperAdmin Tier 0
                </span>
              </div>
              <span className="text-xs text-on-surface-variant truncate">
                {isAdminAuthenticated
                  ? 'Authenticated Session Active: Node LAGOS-01 • RBAC Mode'
                  : 'Preview Mode: Authenticate as Admin to commit changes'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-full text-secondary-fixed">
              <span className="material-symbols-outlined text-[13px] text-primary">
                verified_user
              </span>
              <span className="font-mono text-[11px] text-primary">
                {isAdminAuthenticated ? '#8841 Active' : 'Read-Only'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant mt-0.5">
              Dual-Sig Shield
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid (2 cols on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">24h System Vol</span>
            <span className="material-symbols-outlined text-primary text-[18px]">query_stats</span>
          </div>
          <div className="mt-2">
            <div className="font-mono text-lg font-semibold text-on-surface tracking-tight">
              ₦48.2M
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="bg-primary/10 text-primary font-mono text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">arrow_upward</span>8.2%
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">vs avg</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Active Accounts</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">group</span>
          </div>
          <div className="mt-2">
            <div className="font-mono text-lg font-semibold text-on-surface tracking-tight">
              {(24807 + users.length).toLocaleString('en-US')}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="bg-secondary-container/20 text-secondary font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                +142 today
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">peak</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">KYC Pending</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">
              pending_actions
            </span>
          </div>
          <div className="mt-2">
            <div className="font-mono text-lg font-semibold text-on-surface tracking-tight">
              {17 + flaggedCount} Queue
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="bg-tertiary-container/30 text-tertiary font-mono text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">emergency</span>Action Req
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Proof of Reserve</span>
            <span className="material-symbols-outlined text-primary text-[18px]">
              verified_user
            </span>
          </div>
          <div className="mt-2">
            <div className="font-mono text-lg font-semibold text-primary tracking-tight">
              104.2%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="bg-primary/10 text-primary font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                Fully Solvent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-on-surface">Administrative Commands</span>
          <span className="font-mono text-[11px] text-on-surface-variant">3 Shortcuts</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0 active:scale-95 transition-transform shadow-md"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>+ New Account</span>
          </button>
          <button
            type="button"
            onClick={handleExportCompliance}
            className="flex items-center gap-2 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-full text-sm flex-shrink-0 hover:bg-surface-bright active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg text-secondary">file_download</span>
            <span>Export Compliance</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFeeModal(true)}
            className="flex items-center gap-2 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-full text-sm flex-shrink-0 hover:bg-surface-bright active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg text-tertiary">tune</span>
            <span>Fee Schedule</span>
          </button>
        </div>
      </div>

      {/* Responsive Split: Users Management Left, RBAC Matrix + Audit Feed Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-on-surface">
                Users &amp; Plan Permissions
              </span>
              <span className="bg-surface-container-high font-mono text-[11px] px-2 py-0.5 rounded-full text-secondary">
                Total: {filteredUsers.length} Targets
              </span>
            </div>
            <button
              type="button"
              onClick={() => onShowToast('Batch policy engine synced across 3 targets')}
              className="text-primary text-xs flex items-center gap-1 hover:underline"
            >
              <span>Bulk Batch</span>
              <span className="material-symbols-outlined text-sm">tune</span>
            </button>
          </div>

          {/* Search and Filter Chips */}
          <div className="bg-surface-container-low rounded-xl p-2.5 space-y-2">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search account ID, entity or wallet hash..."
                className="w-full bg-surface-container-highest/60 text-on-surface text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-surface-container-highest transition-colors placeholder:text-on-surface-variant/70"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              {FILTER_TABS.map((tab) => {
                const label = tab === 'Flagged' ? `Flagged (${flaggedCount})` : tab;
                const active = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    className={`font-mono text-[11px] px-2.5 py-1 rounded-full flex-shrink-0 transition-colors ${
                      active
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Cards */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-surface-container rounded-xl p-8 text-center text-xs text-on-surface-variant">
                No accounts match &ldquo;{search}&rdquo; under {activeFilter}.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isFlagged = user.kycStatus === 'AML Flagged';
                const statusBadgeClass = isFlagged
                  ? 'bg-error-container text-error'
                  : user.kycStatus === 'Verified Entity'
                    ? 'bg-secondary-container/20 text-secondary'
                    : 'bg-primary/10 text-primary';

                return (
                  <div
                    key={user.id}
                    className="bg-surface-container rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SafeImage
                          src={user.avatar || APEX_IMAGES.profileAvatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-on-surface truncate">
                              {user.name}
                            </span>
                            <span
                              className={`material-symbols-outlined text-sm ${
                                isFlagged
                                  ? 'text-error'
                                  : user.roleCategory === 'Institutional'
                                    ? 'text-secondary'
                                    : 'text-primary'
                              }`}
                            >
                              {isFlagged
                                ? 'warning'
                                : user.roleCategory === 'Institutional'
                                  ? 'apartment'
                                  : 'verified'}
                            </span>
                            {user.frozen && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-error-container text-on-error-container">
                                FROZEN
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-on-surface-variant truncate">
                            ID: {user.accountCode} • {user.tier}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-mono text-sm font-semibold text-on-surface tabular-nums">
                          ₦{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-full mt-0.5 ${statusBadgeClass}`}
                        >
                          {user.kycStatus}
                        </span>
                      </div>
                    </div>

                    {isFlagged && user.alertNote ? (
                      <div className="bg-surface-container-lowest rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-sm">
                            crisis_alert
                          </span>
                          <span className="text-xs text-on-surface">{user.alertNote}</span>
                        </div>
                        <span className="font-mono text-[10px] text-error">Auto-Hold</span>
                      </div>
                    ) : (
                      <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm">
                            {user.roleCategory === 'Institutional' ? 'terminal' : 'shield'}
                          </span>
                          <span className="text-xs text-on-surface">
                            Assigned Role:{' '}
                            <strong className="text-secondary font-medium">{user.roleLabel}</strong>
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-primary">{user.limitLabel}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {isFlagged ? (
                        <button
                          type="button"
                          onClick={() => onResolveAml(user.id)}
                          className="flex-1 bg-error-container hover:brightness-110 text-on-error py-2 rounded-lg text-xs font-semibold text-center transition-all"
                        >
                          Review &amp; Clear AML
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(user);
                            setRoleDraft(user.roleLabel);
                          }}
                          className="flex-1 bg-surface-container-high hover:bg-surface-bright text-on-surface py-2 rounded-lg text-xs text-center transition-colors"
                        >
                          Edit Role
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleUserFreeze(user.id)}
                        className={`flex-1 bg-surface-container-high hover:bg-surface-bright py-2 rounded-lg text-xs text-center transition-colors ${
                          user.frozen ? 'text-primary font-semibold' : 'text-error'
                        }`}
                      >
                        {user.frozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                      </button>

                      <button
                        type="button"
                        aria-label={`Audit history for ${user.name}`}
                        onClick={() => {
                          onAddAuditEntry(
                            `AUDIT_INSPECTED • Acct ${user.accountCode}`,
                            'Actor: SuperAdmin (Biometric OK)'
                          );
                          onShowToast(`Audit trail opened for ${user.name}`);
                        }}
                        className="w-10 h-9 bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">history</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: RBAC Permission Matrix + Immutable Audit Feed */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-high rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">key_visualizer</span>
                <span className="text-sm font-semibold text-on-surface">
                  RBAC Permission Matrix
                </span>
              </div>
              <span className="bg-surface-container-lowest text-tertiary font-mono text-[10px] px-2 py-0.5 rounded-full">
                Compliance Officer
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                  <span className="text-xs text-on-surface">Can View Detailed KYC Dossier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-primary">ALLOWED</span>
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">ac_unit</span>
                  <span className="text-xs text-on-surface">
                    Can Freeze Non-Compliant Account
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-primary">ALLOWED</span>
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-sm">
                    currency_exchange
                  </span>
                  <span className="text-xs text-on-surface">
                    Execute Direct Reserve Transfers
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-error">SUPERADMIN ONLY</span>
                  <div className="w-2 h-2 rounded-full bg-error" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">
                  receipt_long
                </span>
                <span className="text-sm font-semibold text-on-surface">Immutable Audit Feed</span>
              </div>
              <span className="font-mono text-[10px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                STREAM SYNCED
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              {auditFeed.slice(0, 6).map((entry) => (
                <div
                  key={entry.id}
                  className="bg-surface-container-low p-2.5 rounded-lg flex items-start justify-between gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-on-surface truncate">{entry.event}</span>
                    <span className="text-on-surface-variant text-[10px]">{entry.actor}</span>
                  </div>
                  <span className="text-on-surface-variant flex-shrink-0 text-[10px]">
                    {entry.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Edit Role — {editingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant block">Assigned RBAC Role</label>
              <select
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value)}
                className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
              >
                <option value="Portfolio Manager">Portfolio Manager</option>
                <option value="Compliance Officer">Compliance Officer</option>
                <option value="Direct API Trader (FIX/WS)">Direct API Trader (FIX/WS)</option>
                <option value="Read-Only Auditor">Read-Only Auditor</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateUserRole(editingUser.id, roleDraft);
                  setEditingUser(null);
                }}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Provision Institutional Account
              </h3>
              <button
                type="button"
                onClick={() => setShowNewUserModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Entity / Operator Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Meridian Treasury Partners"
                  className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Plan Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
                >
                  <option value="Business Pro Tier">Business Pro Tier</option>
                  <option value="Enterprise Institutional">Enterprise Institutional</option>
                  <option value="Personal Standard">Personal Standard</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
                >
                  <option value="Portfolio Manager">Portfolio Manager</option>
                  <option value="Direct API Trader (FIX/WS)">Direct API Trader (FIX/WS)</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewUserModal(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newName.trim()) {
                    onShowToast('Enter an entity or operator name');
                    return;
                  }
                  onAddUser(newName.trim(), newTier, newRole);
                  setNewName('');
                  setShowNewUserModal(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Schedule Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Institutional Fee Schedule
              </h3>
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { rail: 'FedNow / RTP Instant', fee: '₦0.00 (Waived)' },
                { rail: 'SEPA Instant (EUR)', fee: '₦0.00 (Waived)' },
                { rail: 'Cross-Border FX Spread', fee: '0.00% Interbank' },
                { rail: 'USDC Mint / Redeem', fee: '0.00% (1:1)' },
              ].map((item) => (
                <div
                  key={item.rail}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container"
                >
                  <span className="text-on-surface-variant">{item.rail}</span>
                  <span className="font-mono text-primary font-semibold">{item.fee}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFeeModal(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
