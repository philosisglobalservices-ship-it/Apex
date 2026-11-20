import React, { useRef, useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { ScreenId } from '../types';
import { SafeImage } from '../components/SafeImage';

interface KycDocsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

const ID_OPTIONS = [
  { id: 'passport', label: 'NG Passport', sub: 'e-Passport', icon: 'contactless' },
  { id: 'national', label: 'NIN / Driver’s', sub: 'NIMC Slip / ID', icon: 'badge' },
  { id: 'articles', label: 'CAC Cert', sub: 'RC / TIN Ledger', icon: 'corporate_fare' },
] as const;

export const KycDocsScreen: React.FC<KycDocsScreenProps> = ({ onNavigate, onShowToast }) => {
  const [selectedDocType, setSelectedDocType] = useState<string>('passport');
  const [addressFileName, setAddressFileName] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRetake = () => {
    setRescanning(true);
    onShowToast('Re-calibrating NIMC & NIS optical MRZ scanner...');
    setTimeout(() => {
      setRescanning(false);
      onShowToast('Optical Confidence: 99.84% NIS / BVN Match confirmed');
    }, 900);
  };

  return (
    <div className="flex flex-col w-full pb-8 px-4 lg:px-6 py-4 space-y-5">
      {/* Stepper Header */}
      <section className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            STAGE 2 OF 3
          </span>
          <div className="flex items-center gap-1 text-on-surface-variant font-mono text-[11px]">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Est. ~2 min</span>
          </div>
        </div>

        <div className="flex flex-col space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Nigeria CBN KYC
          </h1>
          <p className="text-sm text-on-surface-variant">
            CBN Tier 3 KYC: NIN, BVN &amp; Proof of Address
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 max-w-xl">
          <div className="flex flex-col space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.35)]" />
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined material-symbols-filled text-[13px]">
                check_circle
              </span>
              <span className="font-mono text-[11px] font-semibold truncate">BVN &amp; NIN</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-secondary-container" />
            <div className="flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
              <span className="font-mono text-[11px] font-semibold truncate">Documents</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-surface-container-high" />
            <div className="flex items-center gap-1 text-outline">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              <span className="font-mono text-[11px] truncate">Biometrics</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant text-xs shadow-sm">
          <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
          <span className="truncate">
            CBN / NFIU / NDPR Compliant • NIBSS BVN &amp; NIMC Enclave
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Document Type Selector */}
          <section className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Primary Nigerian ID</span>
              <span className="font-mono text-[11px] text-primary uppercase">
                NIMC / NIS Preferred
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ID_OPTIONS.map((opt) => {
                const selected = selectedDocType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDocType(opt.id)}
                    className={`relative flex flex-col items-start p-3 rounded-xl transition-all text-left ${
                      selected
                        ? 'bg-surface-container-high shadow-md ring-1 ring-primary/40'
                        : 'bg-surface-container hover:bg-surface-container-high opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span
                        className={`material-symbols-outlined text-[22px] ${
                          selected ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {opt.icon}
                      </span>
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                      )}
                    </div>
                    <span className="text-sm text-on-surface font-semibold leading-tight">
                      {opt.label}
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Passport OCR Viewfinder */}
          <section className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  document_scanner
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  Nigerian e-Passport Bio Page
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-[10px] font-semibold">
                {rescanning ? 'SCANNING...' : 'NIMC VERIFIED'}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-xl">
              <div className="relative z-10 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">public</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        ISSUING NATION
                      </span>
                      <span className="text-sm text-on-surface font-semibold tracking-wider">
                        FEDERAL REPUBLIC OF NIGERIA (NGA)
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">
                    contactless
                  </span>
                </div>

                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-surface-container-lowest flex items-center justify-center p-3">
                  <SafeImage
                    src={APEX_IMAGES.passportScan}
                    alt="Nigerian biometric e-passport identity page scan"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
                    fallbackIcon="badge"
                  />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(78,222,163,0.9)] animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 bg-surface-dim/80 backdrop-blur-md px-3.5 py-2 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">
                        qr_code_scanner
                      </span>
                      <span className="font-mono text-xs font-semibold tracking-wide">
                        MRZ NGA&lt;&lt;&lt;940212
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      Optical Confidence: 99.84% NIS / BVN Match
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      check_circle
                    </span>
                    <span className="font-mono text-[11px] truncate">BVN &amp; NIN Cross-Match</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      check_circle
                    </span>
                    <span className="font-mono text-[11px] truncate">
                      EXP: 2031-10-14 (&gt;6mo)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-xs transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>Retake Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="inline-flex items-center gap-1 text-secondary hover:text-on-surface text-xs transition-colors py-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>Replace File</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Proof of Address Upload */}
          <section className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  home_work
                </span>
                <span className="text-sm font-semibold text-on-surface">Proof of Address</span>
              </div>
              <span className="text-on-surface-variant font-mono text-[11px]">&lt; 90 Days Old</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAddressFileName(file.name);
                  onShowToast(`Encrypted NDPR upload ready: ${file.name}`);
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full flex flex-col items-center justify-center p-5 rounded-2xl bg-surface-container-high text-center transition-all hover:bg-surface-container-highest cursor-pointer shadow-md"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary mb-2">
                <span className="material-symbols-outlined text-[26px]">
                  {addressFileName ? 'check_circle' : 'cloud_upload'}
                </span>
              </div>
              <span className="text-sm text-on-surface font-semibold">
                {addressFileName || 'Tap to select or drop document'}
              </span>
              <span className="text-xs text-on-surface-variant mt-1">
                EKEDC / IKEDC utility bill, bank statement, or CAC residency
              </span>
              <div className="flex items-center gap-2 mt-3">
                {['PDF', 'JPG', 'PNG'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[10px]"
                  >
                    {ext}
                  </span>
                ))}
                <span className="text-outline font-mono text-[10px]">Max 25 MB</span>
              </div>
            </button>
          </section>

          {/* Quality Checklist */}
          <section className="flex flex-col space-y-2">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
              CBN Verification Criteria
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'crop_free', title: '4 Corners Visible', sub: 'Full NIN/Passport frame' },
                { icon: 'flare', title: 'Glare & Blur Free', sub: 'Sharp lighting, clear MRZ' },
                { icon: 'event_available', title: 'Active Validity', sub: 'Document valid for > 6 months' },
                { icon: 'shield', title: 'Original Unaltered', sub: 'Matches BVN registered name' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low text-on-surface"
                >
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{item.title}</span>
                    <span className="text-[11px] text-on-surface-variant leading-tight">
                      {item.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Zero-Knowledge Note */}
          <section className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-lowest text-on-surface-variant shadow-inner">
            <div className="p-2 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">encrypted</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-on-surface font-semibold">
                NDPR Zero-Knowledge Enclave
              </span>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Documents are verified transiently against NIMC and NIBSS BVN registries inside
                hardware enclaves for CBN Tier 3 compliance, with raw files auto-purged.
              </p>
            </div>
          </section>

          {/* Primary CTA */}
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('kyc-liveness')}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-[0_0_20px_rgba(78,222,163,0.35)] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              <span>Continue to BVN &amp; NIN Liveness</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast('CBN KYC progress saved');
                onNavigate('home-wallet');
              }}
              className="w-full h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs transition-colors"
            >
              <span>Save Progress &amp; Resume Later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
