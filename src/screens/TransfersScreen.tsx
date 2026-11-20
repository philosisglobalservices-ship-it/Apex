import React, { useEffect, useRef, useState } from 'react';
import { TRANSFER_CONTACTS } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { apexApi } from '../services/api';
import {
  fetchNigerianBanks,
  lookupNibssAccountName,
  NIGERIAN_BANKS,
  NigerianBank,
  NibssEnquiryResult,
} from '../services/nibssService';
import { ScreenId, TransactionItem } from '../types';

export interface TransferDispatchPayload {
  recipientName: string;
  recipientTag: string;
  amount: number;
  category: string;
  rail: 'contacts' | 'nibss';
  bankCode?: string;
  accountNumber?: string;
}

interface TransfersScreenProps {
  initialMode?: 'send' | 'receive';
  usdBalance: number;
  transactions: TransactionItem[];
  onExecuteTransfer: (payload: TransferDispatchPayload) => Promise<TransferReceipt | null>;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

interface TransferReceipt {
  referenceId: string;
  recipientName: string;
  recipientTag: string;
  amount: number;
  category: string;
  currency: string;
  timestamp: string;
  remainingBalance: number;
  nibssSessionId?: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'USDC'] as const;
const CATEGORIES = [
  { id: 'invoice', label: 'Invoice Payment', icon: 'receipt_long' },
  { id: 'payroll', label: 'Payroll', icon: 'badge' },
  { id: 'p2p', label: 'P2P Reimbursement', icon: 'group' },
  { id: 'contractor', label: 'Contractor', icon: 'engineering' },
];

export const TransfersScreen: React.FC<TransfersScreenProps> = ({
  initialMode = 'send',
  usdBalance,
  transactions,
  onExecuteTransfer,
  onNavigate,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'send' | 'receive'>(initialMode);
  const [recipientRail, setRecipientRail] = useState<'contacts' | 'nibss'>('nibss');
  const [bankDirectory, setBankDirectory] = useState<NigerianBank[]>(NIGERIAN_BANKS);
  const [fxUsdToEur, setFxUsdToEur] = useState<number>(0.9214);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(NIGERIAN_BANKS[0].code);
  const [nubanInput, setNubanInput] = useState<string>('0123456789');
  const [nibssLookupStatus, setNibssLookupStatus] = useState<
    'idle' | 'verifying' | 'verified' | 'error'
  >('idle');
  const [nibssResult, setNibssResult] = useState<NibssEnquiryResult | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string>('sarah');
  const [customRecipient, setCustomRecipient] = useState<{ name: string; tag: string } | null>(null);
  const [amountInput, setAmountInput] = useState('2,500.00');
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Invoice Payment');
  const [sendState, setSendState] = useState<'idle' | 'verifying' | 'done'>('idle');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<TransferReceipt | null>(null);
  const [requestedAmount, setRequestedAmount] = useState<string | null>(null);
  const [showAmountPrompt, setShowAmountPrompt] = useState(false);
  const [customRequestInput, setCustomRequestInput] = useState('1,250.00');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const nubanInputRef = useRef<HTMLInputElement | null>(null);
  const sendCtaRef = useRef<HTMLButtonElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const controller = new AbortController();
    fetchNigerianBanks(controller.signal)
      .then((banks) => {
        if (!controller.signal.aborted && banks.length > 0) {
          setBankDirectory(banks);
        }
      })
      .catch(() => {
        // Retain static bank directory fallback
      });

    apexApi
      .getMarketOverview(controller.signal)
      .then((overview) => {
        if (!controller.signal.aborted && overview.fxUsdToEur > 0) {
          setFxUsdToEur(overview.fxUsdToEur);
        }
      })
      .catch(() => {
        // Retain fallback rate
      });

    return () => {
      controller.abort();
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Real-time NIBSS NIP Name Enquiry lookup whenever 10-digit NUBAN or Bank changes
  useEffect(() => {
    if (recipientRail !== 'nibss') return;

    const cleaned = nubanInput.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setNibssLookupStatus('idle');
      setNibssResult(null);
      return;
    }

    const controller = new AbortController();
    setNibssLookupStatus('verifying');

    lookupNibssAccountName(cleaned, selectedBankCode, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setNibssResult(res);
        setNibssLookupStatus(res.verified ? 'verified' : 'error');
        if (res.verified) {
          setAmountError(null);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setNibssLookupStatus('error');
        setNibssResult(null);
      });

    return () => {
      controller.abort();
    };
  }, [nubanInput, selectedBankCode, recipientRail]);

  const selectedBank =
    bankDirectory.find((b) => b.code === selectedBankCode) || bankDirectory[0];

  const filteredContacts = TRANSFER_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContact =
    recipientRail === 'nibss'
      ? {
          id: 'nibss',
          name:
            nibssLookupStatus === 'verified' && nibssResult
              ? nibssResult.accountName
              : 'Unverified Bank Account',
          shortName:
            nibssLookupStatus === 'verified' && nibssResult
              ? nibssResult.accountName.split(' ')[0]
              : selectedBank.shortName,
          tag: `${selectedBank.shortName} • ${nubanInput || '----------'}`,
          avatar: '',
          online: true,
        }
      : selectedContactId === 'custom' && customRecipient
        ? {
            id: 'custom',
            name: customRecipient.name,
            shortName: customRecipient.name.split(' ')[0] || customRecipient.name,
            tag: customRecipient.tag,
            avatar: '',
            online: true,
          }
        : TRANSFER_CONTACTS.find((c) => c.id === selectedContactId) || TRANSFER_CONTACTS[0];

  const numericAmount = parseFloat(amountInput.replace(/[^0-9.]/g, '')) || 0;
  const convertedEur = (numericAmount * fxUsdToEur).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const maxSendable = Math.floor(usdBalance * 100) / 100;

  const handleSelectCustomSearchRecipient = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      searchInputRef.current?.focus();
      onShowToast('Type a @handle, email, phone, or 10-digit NUBAN');
      return;
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 10 && /^\d{10}$/.test(trimmed)) {
      setRecipientRail('nibss');
      setNubanInput(digitsOnly);
      onShowToast('Running NIBSS NIP Name Enquiry...');
      return;
    }
    setCustomRecipient({ name: trimmed, tag: trimmed.startsWith('@') ? trimmed : 'External Payee' });
    setSelectedContactId('custom');
    onShowToast(`Recipient set to ${trimmed}`);
  };

  const handleBiometricSend = async () => {
    if (sendState !== 'idle') return;
    setAmountError(null);

    if (recipientRail === 'nibss') {
      if (nibssLookupStatus === 'verifying') {
        const msg = 'Waiting for NIBSS account name verification to complete...';
        setAmountError(msg);
        onShowToast(msg);
        return;
      }
      if (nibssLookupStatus !== 'verified' || !nibssResult?.verified) {
        const msg =
          nibssResult?.errorMessage ||
          'Enter and verify a valid 10-digit NUBAN bank account via NIBSS before sending.';
        setAmountError(msg);
        onShowToast('Verify recipient bank account first');
        nubanInputRef.current?.focus();
        return;
      }
    }

    if (numericAmount <= 0) {
      const msg = 'Enter a valid transfer amount greater than ₦0.00';
      setAmountError(msg);
      onShowToast(msg);
      return;
    }
    if (numericAmount > usdBalance) {
      const msg = `Insufficient vault balance (₦${usdBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })} available)`;
      setAmountError(msg);
      onShowToast('Insufficient USD Main Vault balance');
      return;
    }

    const recipientSnapshot = selectedContact;
    const amountSnapshot = numericAmount;
    const categorySnapshot = selectedCategory;

    setSendState('verifying');
    try {
      const receipt = await onExecuteTransfer({
        recipientName: recipientSnapshot.name,
        recipientTag: recipientSnapshot.tag,
        amount: amountSnapshot,
        category: categorySnapshot,
        rail: recipientRail,
        bankCode: recipientRail === 'nibss' ? selectedBankCode : undefined,
        accountNumber:
          recipientRail === 'nibss' ? nubanInput.replace(/\D/g, '') : undefined,
      });

      if (!receipt) {
        setSendState('idle');
        return;
      }

      setSendState('done');
      setReceiptModal(receipt);
      resetTimerRef.current = window.setTimeout(() => {
        setSendState('idle');
      }, 1400);
    } catch (err) {
      setSendState('idle');
      const msg = err instanceof Error ? err.message : 'Transfer could not be executed';
      setAmountError(msg);
      onShowToast(msg);
    }
  };

  const handlePasteHandle = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text && text.trim()) {
        const cleaned = text.trim();
        setSearchQuery(cleaned);
        setCustomRecipient({ name: cleaned, tag: cleaned.startsWith('@') ? cleaned : 'Pasted Payee' });
        setSelectedContactId('custom');
        onShowToast(`Pasted ${cleaned}`);
        return;
      }
    } catch {
      // Clipboard read not granted in iframe; fall back to sample handle
    }
    setSearchQuery('@sarahchen');
    setSelectedContactId('sarah');
    onShowToast('Handle @sarahchen pasted');
  };

  const recentTransfers = transactions.filter((tx) => tx.type === 'outflow').slice(0, 4);

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 gap-y-4">
      {/* Mode Segmented Switch */}
      <div className="max-w-md w-full mx-auto lg:mx-0 p-1 rounded-full bg-surface-container-low flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (mode === 'send') {
              sendCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              sendCtaRef.current?.focus();
            } else {
              setMode('send');
            }
          }}
          className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-semibold ${
            mode === 'send'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">north_east</span>
          <span>Send</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('receive')}
          className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-semibold ${
            mode === 'receive'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
          <span>Receive / QR</span>
        </button>
      </div>

      {mode === 'send' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Recipient Module */}
            <div className="rounded-2xl bg-surface-container p-4 flex flex-col gap-y-3 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Send To</span>
                <button
                  type="button"
                  onClick={() => setMode('receive')}
                  className="flex items-center gap-1 text-primary hover:text-primary-fixed transition-colors text-xs font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  <span>Scan Code</span>
                </button>
              </div>

              {/* Destination Rail Toggle: Bank Account (NIBSS NIP) vs Apex Contacts */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientRail('nibss');
                    setAmountError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientRail === 'nibss'
                      ? 'bg-surface-container-highest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span>Bank Account (NIBSS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientRail('contacts');
                    setAmountError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientRail === 'contacts'
                      ? 'bg-surface-container-highest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                  <span>Apex @Tag / Contacts</span>
                </button>
              </div>

              {recipientRail === 'nibss' ? (
                <div className="flex flex-col gap-3">
                  {/* Bank Institution Selector */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="nibss-bank-select"
                      className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider"
                    >
                      Destination Bank
                    </label>
                    <div className="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2.5">
                      <span className="material-symbols-outlined text-primary text-[19px] mr-2">
                        account_balance
                      </span>
                      <select
                        id="nibss-bank-select"
                        value={selectedBankCode}
                        onChange={(e) => setSelectedBankCode(e.target.value)}
                        className="w-full bg-transparent text-sm text-on-surface font-medium outline-none cursor-pointer"
                      >
                        {bankDirectory.map((bank) => (
                          <option
                            key={bank.code}
                            value={bank.code}
                            className="bg-surface-container text-on-surface"
                          >
                            {bank.name} ({bank.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 10-Digit NUBAN Input */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="nibss-account-input"
                        className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider"
                      >
                        10-Digit NUBAN Account Number
                      </label>
                      <span className="font-mono text-[10px] text-on-surface-variant tabular-nums">
                        {nubanInput.length}/10 digits
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low text-on-surface">
                      <span className="material-symbols-outlined text-outline text-[20px]">
                        pin
                      </span>
                      <input
                        ref={nubanInputRef}
                        id="nibss-account-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={nubanInput}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNubanInput(digits);
                          setAmountError(null);
                        }}
                        placeholder="Enter 10-digit account number"
                        className="bg-transparent border-0 outline-none w-full font-mono text-sm tracking-wider text-on-surface placeholder:text-outline"
                      />
                      {nubanInput && (
                        <button
                          type="button"
                          onClick={() => setNubanInput('')}
                          aria-label="Clear account number"
                          className="text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard?.readText();
                            const digits = (clip || '').replace(/\D/g, '').slice(0, 10);
                            if (digits.length === 10) {
                              setNubanInput(digits);
                              onShowToast('NUBAN pasted — verifying via NIBSS');
                              return;
                            }
                          } catch {
                            // fallback sample
                          }
                          setNubanInput('0234567890');
                          onShowToast('Sample NUBAN 0234567890 pasted');
                        }}
                        className="px-2 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] text-on-surface-variant uppercase hover:text-on-surface shrink-0"
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  {/* Quick Test NUBAN Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] text-on-surface-variant mr-1">
                      Test NUBANs:
                    </span>
                    {[
                      { label: '0123456789', code: '0123456789' },
                      { label: '0234567890', code: '0234567890' },
                      { label: '2001002001 (Corp)', code: '2001002001' },
                      { label: '0000000000 (Invalid)', code: '0000000000' },
                    ].map((sample) => (
                      <button
                        key={sample.code}
                        type="button"
                        onClick={() => {
                          setNubanInput(sample.code);
                          setAmountError(null);
                        }}
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] transition-colors cursor-pointer ${
                          nubanInput === sample.code
                            ? 'bg-primary/20 text-primary font-semibold'
                            : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>

                  {/* Real-Time NIBSS Name Enquiry Verification Status Card */}
                  {nibssLookupStatus === 'verifying' && (
                    <div className="rounded-xl bg-surface-container-low p-3 border border-secondary/30 flex items-center gap-3">
                      <span className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-secondary block">
                          Verifying account name via NIBSS NIP...
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          Querying {selectedBank.shortName} ({selectedBank.code}) • {nubanInput}
                        </span>
                      </div>
                    </div>
                  )}

                  {nibssLookupStatus === 'verified' && nibssResult && (
                    <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/35 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined material-symbols-filled text-[18px]">
                            verified
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">
                              NIBSS NIP Verified
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                              {nibssResult.kycLevel}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-on-surface block truncate mt-0.5">
                            {nibssResult.accountName}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant block mt-0.5">
                            {nibssResult.bankName} • {nibssResult.accountNumber}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-primary/80 shrink-0 hidden sm:block">
                        SID: {nibssResult.sessionId.slice(-8)}
                      </span>
                    </div>
                  )}

                  {nibssLookupStatus === 'error' && (
                    <div className="rounded-xl bg-error-container/35 p-3 border border-error/40 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
                        error
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-error block">
                          Account Name Verification Failed
                        </span>
                        <span className="text-[11px] text-on-error-container block mt-0.5">
                          {nibssResult?.errorMessage ||
                            'Unable to verify this NUBAN account at the selected bank.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {nibssLookupStatus === 'idle' && (
                    <div className="rounded-xl bg-surface-container-low p-3 flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        info
                      </span>
                      <span>
                        Enter all 10 NUBAN digits to run an automatic NIBSS NIP Name Enquiry.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low text-on-surface">
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      search
                    </span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          searchQuery.trim() &&
                          filteredContacts.length === 0
                        ) {
                          handleSelectCustomSearchRecipient();
                        }
                      }}
                      placeholder="Search by @handle, Email, Phone, or 10-digit NUBAN"
                      className="bg-transparent border-0 outline-none w-full text-sm text-on-surface placeholder:text-outline"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="text-on-surface-variant hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePasteHandle}
                      className="px-2 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] text-on-surface-variant uppercase hover:text-on-surface"
                    >
                      Paste
                    </button>
                  </div>

                  {searchQuery.trim() &&
                    !TRANSFER_CONTACTS.some(
                      (c) =>
                        c.name.toLowerCase() === searchQuery.trim().toLowerCase() ||
                        c.tag.toLowerCase() === searchQuery.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={handleSelectCustomSearchRecipient}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-[16px]">
                            {/^\d{10}$/.test(searchQuery.trim())
                              ? 'verified_user'
                              : 'person_add'}
                          </span>
                          <span className="truncate">
                            {/^\d{10}$/.test(searchQuery.trim())
                              ? `Verify NUBAN ${searchQuery.trim()} via NIBSS NIP`
                              : `Use "${searchQuery.trim()}" as recipient`}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] font-semibold shrink-0">
                          {/^\d{10}$/.test(searchQuery.trim()) ? 'Verify' : 'Select'}
                        </span>
                      </button>
                    )}

                  {/* Quick Contact Avatars */}
                  <div className="flex items-center gap-3 pt-1 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={handleSelectCustomSearchRecipient}
                      className="flex flex-col items-center gap-1.5 min-w-[60px] group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container-high group-hover:bg-surface-container-highest flex items-center justify-center text-primary transition-all">
                        <span className="material-symbols-outlined text-2xl">person_add</span>
                      </div>
                      <span className="text-xs text-on-surface-variant truncate w-14 text-center">
                        New Payee
                      </span>
                    </button>

                    {customRecipient && (
                      <button
                        type="button"
                        onClick={() => setSelectedContactId('custom')}
                        className="flex flex-col items-center gap-1.5 min-w-[60px] group"
                      >
                        <div
                          className={`relative w-12 h-12 rounded-full p-0.5 transition-all ${
                            selectedContactId === 'custom'
                              ? 'bg-primary'
                              : 'bg-surface-container-high group-hover:bg-primary/50'
                          }`}
                        >
                          <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm uppercase">
                            {customRecipient.name.slice(0, 2)}
                          </div>
                        </div>
                        <span
                          className={`text-xs truncate w-14 text-center ${
                            selectedContactId === 'custom'
                              ? 'text-on-surface font-semibold'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {customRecipient.name.split(' ')[0]}
                        </span>
                      </button>
                    )}

                    {filteredContacts.map((contact) => {
                      const active = selectedContactId === contact.id;
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className="flex flex-col items-center gap-1.5 min-w-[60px] group"
                        >
                          <div
                            className={`relative w-12 h-12 rounded-full p-0.5 transition-all ${
                              active
                                ? 'bg-primary'
                                : 'bg-surface-container-high group-hover:bg-primary/50'
                            }`}
                          >
                            {contact.avatar ? (
                              <SafeImage
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                                <span className="material-symbols-outlined text-[20px]">
                                  corporate_fare
                                </span>
                              </div>
                            )}
                            {contact.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary ring-2 ring-surface-container" />
                            )}
                          </div>
                          <span
                            className={`text-xs truncate w-14 text-center ${
                              active
                                ? 'text-on-surface font-semibold'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {contact.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Amount Entry Bento Card */}
            <div className="rounded-2xl bg-surface-container p-4 flex flex-col gap-y-4 shadow-md">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      USD Main Vault
                    </span>
                    <span className="font-mono text-[11px] text-primary truncate tabular-nums">
                      ₦{usdBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} available
                    </span>
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant font-mono px-2">Primary</span>
              </div>

              <div className="flex flex-col items-center justify-center py-2 gap-y-1">
                <span className="text-xs text-on-surface-variant">Transfer Amount</span>
                <div className="flex items-baseline justify-center gap-1.5 w-full">
                  <span className="text-3xl font-bold text-primary">₦</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label="Transfer amount"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      if (amountError) setAmountError(null);
                    }}
                    className="w-48 bg-transparent text-center text-3xl sm:text-4xl font-bold font-mono text-on-surface outline-none border-0 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrencyIndex((i) => (i + 1) % CURRENCIES.length)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all text-on-surface"
                  >
                    <span className="font-mono text-xs font-semibold">
                      {CURRENCIES[currencyIndex]}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      unfold_more
                    </span>
                  </button>
                </div>

                {amountError && (
                  <p className="text-xs text-error font-medium mt-1 text-center">{amountError}</p>
                )}

                {/* Fast Quick-Select Amounts */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {[
                    { label: '₦500', val: '500.00' },
                    { label: '₦1,000', val: '1,000.00' },
                    { label: '₦2,500', val: '2,500.00' },
                    {
                      label: 'MAX',
                      val: maxSendable.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    },
                  ].map((chip) => {
                    const isSelected = amountInput === chip.val;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setAmountInput(chip.val);
                          setAmountError(null);
                        }}
                        className={`px-3 py-1 rounded-full font-mono text-xs transition-all ${
                          isSelected
                            ? 'bg-surface-container-highest text-primary font-semibold'
                            : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payment Category & Reference */}
            <div className="flex flex-col gap-y-2">
              <span className="text-xs text-on-surface-variant">
                Payment Category &amp; Reference
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.label;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 flex-shrink-0 transition-all ${
                        active
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Breakdown, Send Money CTA & Recent Transfers */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl bg-surface-container-low p-4 flex flex-col gap-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
                  Execution Route
                </span>
                <span className="font-mono text-[11px] text-primary uppercase font-semibold">
                  {recipientRail === 'nibss' ? 'NIBSS NIP • Instant' : 'FedNow • Instant'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-on-surface-variant">Recipient</span>
                <span className="text-xs font-semibold text-on-surface text-right">
                  {selectedContact.name} ({selectedContact.tag})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Network Fee</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-outline line-through">₦4.50</span>
                  <span className="font-mono text-[11px] text-primary font-semibold">
                    ₦0.00 (Free ACH/FedNow)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  Guaranteed Rate
                  <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                </span>
                <span className="font-mono text-xs text-on-surface">
                  1 USD = {fxUsdToEur.toFixed(4)} EUR{' '}
                  <span className="text-on-surface-variant">(14:52 left)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Estimated Arrival</span>
                <span className="font-mono text-xs text-primary font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  Instant (Under 3 seconds)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-on-surface">
                <span className="text-sm font-semibold">Recipient Receives</span>
                <span className="font-mono text-lg font-semibold text-primary tabular-nums">
                  €{convertedEur} EUR
                </span>
              </div>
            </div>

            {/* Biometric Action CTA */}
            <div className="flex flex-col gap-y-2">
              <button
                ref={sendCtaRef}
                id="send-cta"
                type="button"
                disabled={sendState !== 'idle'}
                onClick={handleBiometricSend}
                className={`w-full py-4 px-5 rounded-full font-semibold text-sm flex items-center justify-between shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-80 ${
                  sendState === 'done'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-primary hover:bg-primary-fixed text-on-primary'
                }`}
              >
                {sendState === 'verifying' ? (
                  <div className="flex items-center gap-2 mx-auto">
                    <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Face ID &amp; Dispatching...</span>
                  </div>
                ) : sendState === 'done' ? (
                  <div className="flex items-center gap-2 mx-auto">
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span>
                      ₦{numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                      Executed Instantly!
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[22px] shrink-0">
                        fingerprint
                      </span>
                      <span className="truncate">
                        Send Money • ₦
                        {numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to{' '}
                        {selectedContact.shortName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-on-primary/10 rounded-full px-2.5 py-0.5 shrink-0 ml-2">
                      <span className="font-mono text-[11px]">Face ID</span>
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    </div>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[14px] text-primary">shield</span>
                <span>Zero-liability Apex Guarantee • End-to-end Encrypted</span>
              </div>
            </div>

            {/* Recent Outbound Transfers */}
            {recentTransfers.length > 0 && (
              <div className="rounded-2xl bg-surface-container p-4 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider font-mono">
                    Recent Sent Transfers
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('home-wallet')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View Wallet
                  </button>
                </div>
                <div className="space-y-2">
                  {recentTransfers.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-on-surface block truncate">
                          {tx.title}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          {tx.timestamp} • {tx.status}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-on-surface tabular-nums ml-2 shrink-0">
                        -₦
                        {Math.abs(tx.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* RECEIVE / QR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 rounded-2xl bg-surface-container p-6 flex flex-col items-center text-center gap-y-4 shadow-md">
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-on-surface">
                Scan to Pay Apex Account
              </span>
              <span className="text-xs text-on-surface-variant">
                Compatible with FedNow, SEPA, USDC &amp; Wire
              </span>
              {requestedAmount && (
                <span className="mt-1 px-3 py-1 rounded-full bg-primary/15 text-primary font-mono text-xs font-semibold">
                  Requesting ₦{requestedAmount} USD
                </span>
              )}
            </div>

            <div className="relative p-4 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(78,222,163,0.2)]">
              <svg className="w-48 h-48" fill="none" viewBox="0 0 100 100">
                <rect fill="#0d1320" height="28" rx="4" width="28" x="5" y="5" />
                <rect fill="white" height="18" rx="2" width="18" x="10" y="10" />
                <rect fill="#0d1320" height="10" width="10" x="14" y="14" />
                <rect fill="#0d1320" height="28" rx="4" width="28" x="67" y="5" />
                <rect fill="white" height="18" rx="2" width="18" x="72" y="10" />
                <rect fill="#0d1320" height="10" width="10" x="76" y="14" />
                <rect fill="#0d1320" height="28" rx="4" width="28" x="5" y="67" />
                <rect fill="white" height="18" rx="2" width="18" x="10" y="72" />
                <rect fill="#0d1320" height="10" width="10" x="14" y="76" />
                <rect fill="#0d1320" height="6" width="6" x="38" y="8" />
                <rect fill="#0d1320" height="6" width="6" x="48" y="14" />
                <rect fill="#0d1320" height="6" width="6" x="56" y="8" />
                <rect fill="#0d1320" height="6" width="6" x="40" y="24" />
                <rect fill="#0d1320" height="6" width="6" x="52" y="26" />
                <rect fill="#0d1320" height="6" width="6" x="8" y="38" />
                <rect fill="#0d1320" height="6" width="6" x="18" y="44" />
                <rect fill="#0d1320" height="6" width="6" x="28" y="38" />
                <circle cx="50" cy="50" fill="#0d1320" r="14" />
                <path d="M50 41L57 53H43L50 41Z" fill="#4edea3" />
                <rect fill="#0d1320" height="6" width="6" x="68" y="38" />
                <rect fill="#0d1320" height="6" width="6" x="78" y="44" />
                <rect fill="#0d1320" height="6" width="6" x="88" y="38" />
                <rect fill="#0d1320" height="6" width="6" x="38" y="48" />
                <rect fill="#0d1320" height="6" width="6" x="58" y="48" />
                <rect fill="#0d1320" height="6" width="6" x="38" y="68" />
                <rect fill="#0d1320" height="6" width="6" x="48" y="74" />
                <rect fill="#0d1320" height="6" width="6" x="58" y="68" />
                <rect fill="#0d1320" height="6" width="6" x="68" y="76" />
                <rect fill="#0d1320" height="6" width="6" x="78" y="68" />
                <rect fill="#0d1320" height="6" width="6" x="88" y="78" />
                <rect fill="#0d1320" height="6" width="6" x="44" y="88" />
                <rect fill="#0d1320" height="6" width="6" x="58" y="88" />
                <rect fill="#0d1320" height="6" width="6" x="74" y="88" />
              </svg>
              <span className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
              <span className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
              <span className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
              <span className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
            </div>

            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-on-surface">
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs text-on-surface-variant truncate">Apex Pay Tag</span>
                <span className="font-mono text-sm text-primary font-semibold truncate">
                  apex.me/@vault.0194
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('apex.me/@vault.0194');
                  onShowToast('Apex Pay Tag copied');
                }}
                className="px-3 py-1.5 rounded-full bg-surface-container-highest hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 text-xs font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy</span>
              </button>
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAmountPrompt((v) => !v)}
                className="flex-1 py-3 px-4 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Set Exact Amount</span>
              </button>
              <button
                type="button"
                onClick={() => onShowToast('Payment link ready to share')}
                className="p-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all"
                aria-label="Share payment link"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            </div>

            {showAmountPrompt && (
              <div className="w-full flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customRequestInput}
                  onChange={(e) => setCustomRequestInput(e.target.value)}
                  className="flex-1 bg-surface-container-low rounded-xl px-3 py-2 text-sm font-mono text-on-surface outline-none"
                  placeholder="1,250.00"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRequestedAmount(customRequestInput);
                    setShowAmountPrompt(false);
                    onShowToast(`QR updated for ₦${customRequestInput} USD`);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-surface-container-low p-4 flex flex-col gap-y-3 shadow-sm">
            <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">
                account_balance_wallet
              </span>
              Apex Clearing Coordinates
            </span>
            {[
              { label: 'Routing (ABA / FedNow)', value: '021000021' },
              { label: 'Account Number', value: '8830 1928 4401' },
              { label: 'SWIFT / BIC', value: 'APEXUS33XXX' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-surface-container last:border-0"
              >
                <span className="text-xs text-on-surface-variant">{row.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(row.value);
                    onShowToast(`${row.label} copied`);
                  }}
                  className="font-mono text-sm text-on-surface font-semibold hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>{row.value}</span>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                    content_copy
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Confirmation Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-high p-5 shadow-2xl space-y-4 border border-white/10">
            <div className="flex flex-col items-center text-center pt-1">
              <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_24px_rgba(78,222,163,0.4)] mb-3">
                <span className="material-symbols-outlined material-symbols-filled text-3xl">
                  done_all
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">
                {receiptModal.timestamp}
              </span>
              <h3 className="text-xl font-bold text-on-surface mt-1">
                ₦{receiptModal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Sent
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Dispatched to{' '}
                <span className="text-on-surface font-semibold">{receiptModal.recipientName}</span> (
                {receiptModal.recipientTag})
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Reference ID</span>
                <span className="font-mono text-on-surface font-semibold">
                  {receiptModal.referenceId}
                </span>
              </div>
              {receiptModal.nibssSessionId && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">NIBSS Session ID</span>
                  <span className="font-mono text-primary font-semibold">
                    {receiptModal.nibssSessionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Category</span>
                <span className="text-on-surface">{receiptModal.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Network Fee</span>
                <span className="font-mono text-primary font-semibold">₦0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-on-surface-variant">Remaining Vault Balance</span>
                <span className="font-mono text-on-surface font-semibold tabular-nums">
                  ₦
                  {receiptModal.remainingBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="flex-1 py-3 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={() => {
                  setReceiptModal(null);
                  onNavigate('home-wallet');
                }}
                className="flex-1 py-3 rounded-full bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold transition-colors"
              >
                Back to Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
