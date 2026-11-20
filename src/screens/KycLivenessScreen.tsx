import React, { useState } from 'react';
import { APEX_IMAGES } from '../data/mockData';
import { ScreenId } from '../types';
import { SafeImage } from '../components/SafeImage';

interface KycLivenessScreenProps {
  onCompleteKyc: () => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const KycLivenessScreen: React.FC<KycLivenessScreenProps> = ({
  onCompleteKyc,
  onNavigate,
  onShowToast,
}) => {
  const [signingState, setSigningState] = useState<'idle' | 'signing' | 'signed'>('idle');
  const [progress, setProgress] = useState(72);

  const handleCompleteVerification = () => {
    if (signingState !== 'idle') return;
    setSigningState('signing');
    setProgress(100);
    setTimeout(() => {
      setSigningState('signed');
      onCompleteKyc();
      onShowToast('BVN & NIMC NIN Liveness Match Signed!');
      setTimeout(() => {
        setSigningState('idle');
        onNavigate('kyc-success');
      }, 900);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-4 pb-10 space-y-5">
      {/* Stepper Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
              Stage 3 of 3 • CBN Tier 3
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="text-xs text-on-surface-variant">Est. ~1 min</span>
          </div>
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[13px]">verified_user</span>
            <span className="font-mono text-[11px]">BVN + NIMC</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-0.5">
            Biometric Liveness
          </h1>
          <p className="text-xs text-on-surface-variant">
            Step 3: 3D Facial Mapping &amp; BVN / NIMC NIN Anti-Spoofing Match
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-xl pt-1">
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span className="font-mono text-[11px] truncate">BVN &amp; NIN</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full bg-primary rounded-full" />
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span className="font-mono text-[11px] truncate">Documents</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-mono text-[11px] truncate">Biometrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Certification Banner */}
      <div className="bg-surface-container-low px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
            shield
          </span>
          <span className="font-mono text-[11px] text-on-surface-variant truncate">
            ISO 30107-3 &amp; NDPR BVN Biometric Match Certified
          </span>
        </div>
        <span className="font-mono text-[11px] text-primary flex-shrink-0 bg-primary/10 px-2.5 py-0.5 rounded-full">
          Active Liveness
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Biometric Scan Viewfinder HUD */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-[320px] aspect-[4/5] bg-surface-container-lowest rounded-3xl overflow-hidden flex items-center justify-center shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5 pointer-events-none" />
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none" />
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-sm pointer-events-none" />

            <div className="relative w-48 h-64 rounded-[50%] overflow-hidden bg-surface-container flex items-center justify-center shadow-inner">
              <SafeImage
                src={APEX_IMAGES.livenessPortrait}
                alt="Biometric depth scan face frame"
                className="w-full h-full object-cover opacity-60 mix-blend-luminosity filter contrast-125 brightness-90"
                fallbackIcon="face"
              />

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                fill="none"
                viewBox="0 0 192 256"
              >
                <ellipse
                  cx="96"
                  cy="128"
                  opacity="0.6"
                  rx="60"
                  ry="85"
                  stroke="#4edea3"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <ellipse
                  cx="96"
                  cy="130"
                  opacity="0.7"
                  rx="42"
                  ry="60"
                  stroke="#adc6ff"
                  strokeDasharray="2 4"
                  strokeWidth="0.75"
                />
                <circle cx="70" cy="110" fill="#4edea3" r="3" />
                <circle cx="122" cy="110" fill="#4edea3" r="3" />
                <circle cx="96" cy="135" fill="#4edea3" r="2.5" />
                <circle cx="96" cy="165" fill="#4edea3" r="3" />
                <circle cx="78" cy="180" fill="#adc6ff" r="2" />
                <circle cx="114" cy="180" fill="#adc6ff" r="2" />
                <circle cx="96" cy="200" fill="#4edea3" r="2.5" />
                <path
                  d="M 70 110 L 96 135 L 122 110 M 70 110 L 96 85 L 122 110 M 96 135 L 96 165 M 78 180 L 96 165 L 114 180 M 78 180 L 96 200 L 114 180"
                  opacity="0.5"
                  stroke="#4edea3"
                  strokeWidth="0.75"
                />
                <line opacity="0.8" stroke="#4edea3" strokeWidth="2" x1="0" x2="192" y1="130" y2="130">
                  <animate
                    attributeName="y1"
                    dur="3s"
                    repeatCount="indefinite"
                    values="50;210;50"
                  />
                  <animate
                    attributeName="y2"
                    dur="3s"
                    repeatCount="indefinite"
                    values="50;210;50"
                  />
                </line>
              </svg>
            </div>

            <div className="absolute w-52 h-68 rounded-[50%] pointer-events-none border-2 border-primary/40 shadow-[0_0_24px_rgba(78,222,163,0.25)]" />

            <div className="absolute bottom-3 inset-x-3 bg-surface-container-high/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between gap-1 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] text-on-surface truncate">
                  BVN &amp; NIMC Depth Vector Sync
                </span>
              </div>
              <span className="font-mono text-[11px] text-primary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px]">check</span>
                Pass
              </span>
            </div>
          </div>

          {/* Active Challenge Directive Pill */}
          <div className="w-full max-w-[320px] lg:max-w-none bg-surface-container rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-container-high rounded-full">
                <span className="material-symbols-outlined text-primary text-[26px]">
                  rotate_right
                </span>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${progress}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wide">
                  Current Challenge
                </span>
                <span className="text-sm font-semibold text-on-surface truncate">
                  {progress >= 100 ? 'BVN Facial Vector Locked' : 'Slowly turn your head right'}
                </span>
                <span className="text-xs text-on-surface-variant truncate">
                  Keep your shoulders steady
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-mono text-lg font-semibold text-primary">{progress}%</span>
              <span className="font-mono text-[10px] text-on-surface-variant">Mapped</span>
            </div>
          </div>
        </div>

        {/* Right: Readiness, Checklist & Action CTA */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Lighting', val: 'Optimal', sub: '450 Lux' },
              { label: 'Position', val: 'Eye Level', sub: 'Aligned (0°)' },
              { label: 'Obstruction', val: 'None', sub: 'Clear Field' },
            ].map((env) => (
              <div
                key={env.label}
                className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-on-surface-variant truncate">{env.label}</span>
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                </div>
                <span className="font-mono text-xs text-on-surface font-semibold truncate">
                  {env.val}
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant">{env.sub}</span>
              </div>
            ))}
          </div>

          <div className="bg-surface-container rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">
                CBN Tier 3 Biometric Checklist
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                {signingState === 'signed' ? '4 of 4 Cleared' : '2 of 4 Cleared'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-on-surface font-medium truncate">
                      3D Geometry &amp; Depth Map
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Volumetric contour vs NIBSS BVN photo
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-on-surface font-medium truncate">
                      NIMC NIN Facial Cross-Check
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Pupil reflection &amp; ISO 30107-3 pulse check
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="bg-surface-container-high p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      signingState === 'signed'
                        ? 'text-primary'
                        : 'text-secondary animate-spin'
                    }`}
                  >
                    {signingState === 'signed' ? 'check_circle' : 'progress_activity'}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-on-surface font-medium truncate">
                      Active Turn &amp; Nod Challenge
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Angular dynamic verification
                    </span>
                  </div>
                </div>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                    signingState === 'signed'
                      ? 'text-primary bg-primary/10'
                      : 'text-secondary bg-secondary/15'
                  }`}
                >
                  {signingState === 'signed' ? 'Verified' : 'In Progress'}
                </span>
              </div>

              <div className="bg-surface-container-low/70 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-outline text-[20px]">
                    {signingState === 'signed' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-on-surface truncate">
                      Cryptographic Attestation
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      NIBSS / NDPR Enclave key signature
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
                  {signingState === 'signed' ? 'Signed' : 'Queued'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3 items-start shadow-sm">
            <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5">
              enhanced_encryption
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-semibold text-on-surface">
                NDPR Zero-Knowledge Biometrics
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Facial vectors are matched transiently against BVN &amp; NIMC NIN records inside
                your device&apos;s Secure Enclave. Raw biometric streams are never stored.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={signingState !== 'idle'}
              onClick={handleCompleteVerification}
              className={`w-full h-12 rounded-full px-4 flex items-center justify-center gap-2 text-sm font-semibold shadow-[0_0_16px_rgba(78,222,163,0.35)] active:scale-95 transition-all ${
                signingState === 'signed'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-primary text-on-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  signingState === 'signing' ? 'animate-spin' : ''
                }`}
              >
                {signingState === 'signing'
                  ? 'progress_activity'
                  : signingState === 'signed'
                    ? 'check_circle'
                    : 'fingerprint'}
              </span>
              <span>
                {signingState === 'signing'
                  ? 'Verifying BVN & NIN Match...'
                  : signingState === 'signed'
                    ? 'BVN & NIN Liveness Signed!'
                    : 'Complete CBN Tier 3 Verification'}
              </span>
              {signingState === 'idle' && (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onShowToast('Lagos Compliance Officer review ticket #KYC-NG-4910 queued')
              }
              className="w-full py-2.5 rounded-full flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span>Having camera trouble? Switch to Lagos Officer Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
