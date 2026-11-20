import { AdminUser, AuditEntry, NotificationItem, TransactionItem } from '../types';

export const APEX_IMAGES = {
  logo: 'https://lh3.googleusercontent.com/aida/ALJJyrC-m4-41LB9m2PUJId7rMGrzPh9VgrJNq70fXtLSmXY0HeNzmrBySY52QBF0TPTBT0emgaE3a4IbYpoG3cSQsPEuIzFvYSmizbqqcDRigrrBiWaEX0F_HkpfEHZR_JuElk58M_Z1fXMSfSAEJPefRUMkpa7i9nu8leKrJOABEElQlF_U-35WetBqrTpaDf7bD1Taogl47U7wDjpNaVVdhtfePO8tFV9IwNMibb7yrKB',
  profileAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCwzJd7EhcWJkiFvnpU1RsUsQG2dGrEoKnoOg4_YZ-l0ROt1Cpd9koyiN3eQ28qxP1gxSFXX0T0fkB9SArzFqjTggEgXFNnaVTtQgtaBRAHDGfM8ax4jad8gkmt3GDDuptWnymN0JP3yhDXEJ5QyN3vN9QIoU8pGgTbNgGgrEyPLPWPUnOTJBHY_iXcJ2hsAFQJ5MGMWXhCCaZuy9qS3v9anVJ4eDH1HIOixuxAWwU',
  heroVaultCard:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBq8XfZZGmQkzJ-RLDUlxSYRikw5nUAhGkQJmvwQASykX_DxgstD_QF5QgJgcj6r4cpW9DFWcyIPpso2yj79TBYbmXV2L3qtukZHz0XeAs9mTd7DHwTE4GjUV9x746Gm5sj5IDkRM7aKr1bTcn80NUM9FeaCblm9MzsYu7GyfvPgTspQb8SznwaFF3YR5nBrtCk3UKV5pKL-wCT0I4pDGBRH4jl6Xn_dvcGsItpxSk',
  testimonialElena:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAp-vcrMzvzQl6eFPXOufiH6sIT7HmI1pNQe0jgMX8UnDIMpEqNmLuWFTUtkipy0bbRTEIPZlskuBY9R3B64cqWKR3l2Bd2umAmG8j__219d-HxD6a2CouFf5AQTMunw1TA6A5mvsYbc-GgAyLM7_g2E8Ynm7N1NoKmw28aWjrs6oXIbgFJ9LEbwUDuWO33UMrXyJdBH2HHdK1z0Bhzmxc2mvXuUGnmRHuqMtOtcQ4',
  payeeSarah:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0sMTeC-2_aFSodsYe9Sxrxmq3TskBmQOP_wiyBkhZxT6cWpCywdww2Xt5FifMb_B7yQ7Uri3VPPfsTRgbwpUCYlQhd1NOlnEHGoPEODrA5hPqi7TPo4NDX3rzfpRUjvFY3a6MEF3pP8Qhn_-yndhYwNl0DkbFarhunML5QImEheCCG5rCM1IGTjhDOJNgoSk62ZgEqhIiPkI-Bkj-RSKf_VaQyrut1V5GJD1-z2E',
  payeeDavid:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAmfI5AkAhd--throVCXGZqRSQjT-pEhONDy0nYVi27dVIe_JTOIlYPwGRU8MF4hCX6XaQ6Q9gB6MtSkIKa5y2D_drqE-ofESegG2TkD8fb9gemYXX2P6g0PgTgwPP_NEg-SZzhgp6C7pIY5omTbLp6H2e1Gqn6ZHSERbbTIVytNxEzFbRIA67CXoWQeRiaa78R1LZkF5BM2zVQGkGWnkwUoup7bIqOQ1cbg9_Gyw0',
  payeeElena:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAusIq8mYTRK5tAecy146M5XAWY8ztlE6aZeiqwlKPu4ltXbgFkoLFzl59wybKtZqDtv0DdFAF_E49eMN2beUk-blU2XxJkihc6XoGdpHnkJVfIWkWoAxzmIeGqF_Rtdj0sfmV54Uvhg2txiKf1txfRmuBbbWgQlJcCk308LKw3PK4EwSrtrcbT02hdnWKgleKw5hdm76EEVFZfFcd-jeoxVGAaoHlaFNfD3AV8DhU',
  adminElena:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBOUQYBnjAz79InMZqOyUiNLjcdUUYPoMLQ6dSKJrRnL98vHyVcsJlAS7ks0qHngxaG5nq78cogVWjtf_ffcEbirbJJht2nX2DvOvLcVrmjb4fyLAejN-MFYZKBdNAQN59G1Uso8uCiKIqCchzBIwnRs2dKfOvhFRAuuDJP8B8Gn8wOF_4U9QL7XTGrSsLIFLlIxGqDjzC-bG65zBhq70Y9r79G-hjy5f16IIP5C6M',
  adminMarcus:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDnMLNmxBpWJEJquirs0PCmkaA8p9qiIW_Ah2bjtkWaiI-Lyrzg7UFYVsq-Ye_Ma-Zumm07d4LGu9PTE72VJN6rUvtWmGeBUDBsb-vI6G12m3sRR9Rb_MvrcyPExEXLXPSSuakzYwopPax_0ukarfj4qE5t50GB_oq9oCG5-Bg4rFy211B3a__8yr9MJDmPF9MP63ARCrOQFKku-GroG-mIZ4sRfA9uOMRG3fkaLLI',
  adminFintech:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxlcZcbgklHngiNt-IjItGfG_mEC0l4WSjE1chi3ve_aVrXh1yMgAQUIHEqQFdH0-WISG3-bQoM9nSl1a9_Hj6Y1tIoo10GfpeDXDclNiPi8XC88AsRbFyKKRMcoC6yLzs0B5N9CP8RVaNGEJXCLngL1_LkjwHn_oTCkpyY9JQ05sGgNLxHYRogvTOqMFRm-q6oHcUHifNbWbZZVcCEaqKCbXtllkTRyrcgUIr-EI',
  passportScan:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDoNvYnPVaEjMuDVqDFK55YkxpKl0DytD4Pv8IQTTacro2tSoPwpoxfkxR__UPwr7HjuKIYLlPHGnlStxA6Zj76q0eCYYe_YWQ5Y58hf_yq6uxQ_09A4qrM36JjLsZcWNNeXBplWvGJwor08R0iC-FN4kP7l0Au0osYhEEQhWmHCEDB0EYNVDS7k_Fw2oTYNsmVKO0R8vRz6b3b3QPB_S0e58xoHFrVUz20OtzSGH4',
  livenessPortrait:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5jR9h9oWyZumbvIgEX-PPtzC92k5FoicuYZtm_aeF6X7oORbucbRJSydCptwDr-MKh7VU0gKFsmslQ9xY30i3l8HhgTHgNKIV0VXXA9u6SBgaPvyvrZYgAuiA4qNSukig5Qr817FJY3T3874alLNK5BUP_qE4KxifXG2vNGsE66mHG-F1pcE6mPFXr-AbvxE37FmaWOcg7LRe1-lH2_VuEz9_wEtnF0_D_MoOPo',
  usdFlag:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGw7B4rLGvl3rnuuc8CAyLXXfDWvxIIS4JiH2Gvgptt6dDkIm8wYMlWTwH9xNDzpAGZIhVboK6m_Rkmplwxd9w5qx-p0OVRnAoPSri24r0BAP6gl3R4fazY0SWJhXRX1QrqJKTkl5mvNw0FK7u9PkYKXTFV6SSllb_9mGGK_bZ14F_y7dB47YebtAE3A_oAmT9sqAVe_EvJOAuhyYYULZs3w0AA79I8_3UvQsJEOY',
};

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'txn-1',
    title: 'Wire from Stripe Connect',
    timestamp: 'Today, 14:28',
    status: 'Completed',
    amount: 12500.0,
    currency: 'USD',
    vaultLabel: 'USD Vault',
    type: 'inflow',
    icon: 'account_balance',
  },
  {
    id: 'txn-2',
    title: 'Stripe SaaS Infrastructure',
    timestamp: 'Yesterday',
    status: 'Settled',
    amount: -184.2,
    currency: 'USD',
    vaultLabel: 'Card ••8841',
    type: 'outflow',
    icon: 'cloud_sync',
  },
  {
    id: 'txn-3',
    title: 'Vanguard Staked Dividend',
    timestamp: 'Oct 24',
    status: 'Yield Credited',
    amount: 450.0,
    currency: 'USD',
    vaultLabel: 'Auto Reinvest',
    type: 'yield',
    icon: 'pie_chart',
  },
];

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-1',
    accountCode: '#APX-9021',
    name: 'Elena Rostova',
    tier: 'Business Pro Tier',
    avatar: APEX_IMAGES.adminElena,
    balance: 420000,
    kycStatus: 'KYC Verified',
    roleLabel: 'Portfolio Manager',
    roleCategory: 'Compliance Officer',
    limitLabel: 'Tier L3 Limit',
    frozen: false,
  },
  {
    id: 'usr-2',
    accountCode: '#APX-8172',
    name: 'Marcus Vance',
    tier: 'Personal Standard',
    avatar: APEX_IMAGES.adminMarcus,
    balance: 14250,
    kycStatus: 'AML Flagged',
    roleLabel: 'Standard Account',
    roleCategory: 'Personal',
    limitLabel: 'Auto-Hold',
    alertNote: 'Unusual outbound transfer > ₦10k',
    frozen: false,
  },
  {
    id: 'usr-3',
    accountCode: '#APX-3044',
    name: 'Fintech Global LLC',
    tier: 'Enterprise Institutional',
    avatar: APEX_IMAGES.adminFintech,
    balance: 2400000,
    kycStatus: 'Verified Entity',
    roleLabel: 'Direct API Trader (FIX/WS)',
    roleCategory: 'Institutional',
    limitLabel: 'Uncapped TPS',
    frozen: false,
  },
];

export const INITIAL_AUDIT_FEED: AuditEntry[] = [
  {
    id: 'aud-1',
    event: 'FLAG_AML_TRIGGER • Acct #APX-8172',
    actor: 'Actor: SysDaemon • 198.51.100.24',
    timeAgo: '2m ago',
  },
  {
    id: 'aud-2',
    event: 'API_KEY_ROTATED • Entity #APX-3044',
    actor: 'Actor: SuperAdmin (Biometric OK)',
    timeAgo: '14m ago',
  },
  {
    id: 'aud-3',
    event: 'ROLE_UPGRADE • Acct #APX-9021 -> Pro',
    actor: 'Actor: Elena.Rostova • 203.0.113.88',
    timeAgo: '1h ago',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not-1',
    title: 'FedNow Settlement Cleared',
    detail: '+₦12,500.00 credited to USD Main Vault from Stripe Connect.',
    time: '12m ago',
    unread: true,
    targetScreen: 'home-wallet',
  },
  {
    id: 'not-2',
    title: 'AML Review Required',
    detail: 'Account #APX-8172 triggered outbound velocity threshold.',
    time: '34m ago',
    unread: true,
    targetScreen: 'admin-console',
  },
  {
    id: 'not-3',
    title: 'KYC Tier 2 Ready',
    detail: 'Complete biometric liveness step to unlock ₦250k daily limit.',
    time: '2h ago',
    unread: false,
    targetScreen: 'kyc-docs',
  },
];

export const TRANSFER_CONTACTS = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    shortName: 'Sarah C.',
    tag: '@sarahchen',
    avatar: APEX_IMAGES.payeeSarah,
    online: true,
  },
  {
    id: 'david',
    name: 'David Miller',
    shortName: 'David M.',
    tag: '@davidm',
    avatar: APEX_IMAGES.payeeDavid,
    online: true,
  },
  {
    id: 'techcorp',
    name: 'TechCorp Ops',
    shortName: 'TechCorp',
    tag: 'ops@techcorp.io',
    avatar: '',
    online: true,
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    shortName: 'Elena R.',
    tag: '@erostova',
    avatar: APEX_IMAGES.payeeElena,
    online: false,
  },
];
