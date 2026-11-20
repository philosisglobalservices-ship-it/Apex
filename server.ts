import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {
  FIREBASE_DATABASE_ID,
  FIREBASE_PROJECT_ID,
  requireFirebaseAdmin,
  requireFirebaseAuth,
  type FirebaseAuthenticatedRequest,
} from './server/firebaseAdmin.ts';
import { NIGERIAN_BANKS, performNibssNameEnquiry } from './server/nibss.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Backend Health & Connectivity Check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'apex-finance-backend',
      authProvider: 'firebase-auth',
      firebaseProjectId: FIREBASE_PROJECT_ID,
      databaseId: FIREBASE_DATABASE_ID,
      timestamp: new Date().toISOString(),
    });
  });

  // Public NIBSS Bank Directory & Real-Time Name Enquiry
  app.get('/api/nibss/banks', (_req, res) => {
    res.json({ banks: NIGERIAN_BANKS });
  });

  app.post('/api/nibss/name-enquiry', async (req, res) => {
    const body = req.body as { accountNumber?: unknown; bankCode?: unknown };
    const accountNumber = typeof body?.accountNumber === 'string' ? body.accountNumber : '';
    const bankCode = typeof body?.bankCode === 'string' ? body.bankCode : '';

    if (!bankCode.trim()) {
      res.status(400).json({ error: 'Destination bankCode is required.' });
      return;
    }

    const result = await performNibssNameEnquiry(accountNumber, bankCode.trim());
    res.json(result);
  });

  // Public Market Telemetry & Treasury Rates
  app.get('/api/market/overview', (_req, res) => {
    res.json({
      treasuryApy: 5.4,
      fxUsdToEur: 0.9214,
      slaUptime: '99.999%',
      settlementVelocityMs: 420,
      globalVolumeLabel: '₦4.2B+',
      updatedAt: new Date().toISOString(),
    });
  });

  // Verify active Firebase ID Token against the Express Backend
  app.get(
    '/api/auth/session',
    requireFirebaseAuth,
    (req: FirebaseAuthenticatedRequest, res) => {
      const user = req.firebaseUser!;
      res.json({
        authenticated: true,
        uid: user.uid,
        email: user.email || '',
        name: user.name || '',
        emailVerified: Boolean(user.email_verified),
        role: req.isAdmin ? 'admin' : 'client',
        firebaseProjectId: FIREBASE_PROJECT_ID,
        databaseId: FIREBASE_DATABASE_ID,
      });
    }
  );

  // Server-Side Transfer Authorization & Mandatory NIBSS Re-Verification
  app.post(
    '/api/transfers/authorize',
    requireFirebaseAuth,
    async (req: FirebaseAuthenticatedRequest, res) => {
      const body = req.body as {
        recipientName?: unknown;
        recipientTag?: unknown;
        amount?: unknown;
        category?: unknown;
        rail?: unknown;
        bankCode?: unknown;
        accountNumber?: unknown;
      };

      const rawAmount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount);
      const amount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(2)) : 0;
      const category =
        typeof body?.category === 'string' && body.category.trim()
          ? body.category.trim().slice(0, 60)
          : 'Transfer';
      const rail = body?.rail === 'nibss' ? 'nibss' : 'contacts';

      if (amount <= 0 || amount > 100_000_000) {
        res.status(400).json({ error: 'Transfer amount must be between ₦0.01 and ₦100,000,000.00.' });
        return;
      }

      let finalRecipientName =
        typeof body?.recipientName === 'string' ? body.recipientName.trim().slice(0, 80) : '';
      let finalRecipientTag =
        typeof body?.recipientTag === 'string' ? body.recipientTag.trim().slice(0, 100) : '';
      let bankCode: string | undefined;
      let accountNumber: string | undefined;
      let nibssSessionId: string | undefined;

      if (rail === 'nibss') {
        bankCode = typeof body?.bankCode === 'string' ? body.bankCode.trim() : '';
        accountNumber =
          typeof body?.accountNumber === 'string' ? body.accountNumber.replace(/\D/g, '') : '';
        const enquiry = await performNibssNameEnquiry(accountNumber, bankCode);
        if (!enquiry.verified) {
          res.status(400).json({
            error:
              enquiry.errorMessage ||
              'Recipient bank account could not be verified via NIBSS NIP.',
          });
          return;
        }
        finalRecipientName = enquiry.accountName;
        finalRecipientTag = `${enquiry.bankName} • ${enquiry.accountNumber}`;
        nibssSessionId = enquiry.sessionId;
      } else if (!finalRecipientName) {
        res.status(400).json({ error: 'Recipient name is required.' });
        return;
      }

      const referenceId = `TXN-${crypto.randomInt(100000, 999999)}`;
      const authorizedAt = new Date().toISOString();

      res.status(200).json({
        referenceId,
        recipientName: finalRecipientName,
        recipientTag: finalRecipientTag || 'Apex Instant Rail',
        amount,
        category,
        rail,
        bankCode,
        accountNumber,
        nibssSessionId,
        authorizedAt,
        timestamp:
          rail === 'nibss'
            ? 'Just now • NIBSS NIP Instant Clearing'
            : 'Just now • Instant Clearing',
      });
    }
  );

  // Server-Side Deposit Enclave Signature & Authorization
  app.post(
    '/api/deposits/authorize',
    requireFirebaseAuth,
    (req: FirebaseAuthenticatedRequest, res) => {
      const uid = req.firebaseUser!.uid;
      const body = req.body as { amount?: unknown; railName?: unknown };
      const rawAmount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount);
      const amount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(2)) : 0;
      const railName =
        typeof body?.railName === 'string' && body.railName.trim()
          ? body.railName.trim().slice(0, 60)
          : 'Instant Bank Transfer';

      if (amount <= 0 || amount > 250_000) {
        res.status(400).json({ error: 'Deposit amount must be between ₦1.00 and ₦250,000.00.' });
        return;
      }

      const referenceId = `TXN-${crypto.randomInt(1000, 9999)}-NIBSS-01`;
      const authCode = `AUTH# ${crypto.randomInt(1000, 9999)}-991A-88B`;
      const enclaveHash = `0x${crypto
        .createHash('sha256')
        .update(`${referenceId}:${uid}:${amount}:${railName}`)
        .digest('hex')
        .slice(0, 40)}`;
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      res.status(200).json({
        amount,
        railName,
        referenceId,
        authCode,
        enclaveHash,
        timestamp,
      });
    }
  );

  // Server-Signed Compliance Snapshot Export (Admin Only)
  app.post(
    '/api/admin/compliance-export',
    requireFirebaseAuth,
    requireFirebaseAdmin,
    (req: FirebaseAuthenticatedRequest, res) => {
      const body = req.body as { users?: unknown; auditFeed?: unknown };
      const users = Array.isArray(body?.users) ? body.users.slice(0, 500) : [];
      const auditFeed = Array.isArray(body?.auditFeed) ? body.auditFeed.slice(0, 500) : [];
      const exportedAt = new Date().toISOString();

      const signatureHash = `0x${crypto
        .createHash('sha256')
        .update(JSON.stringify({ exportedAt, usersCount: users.length, auditCount: auditFeed.length }))
        .digest('hex')}`;

      res.status(200).json({
        exportedAt,
        exportedBy: req.firebaseUser!.email || 'SuperAdmin',
        node: 'LAGOS-01',
        databaseId: FIREBASE_DATABASE_ID,
        signatureHash,
        usersCount: users.length,
        auditCount: auditFeed.length,
        users,
        auditFeed,
      });
    }
  );

  // Unknown API routes return JSON 404 instead of SPA fallback
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexHtml = path.resolve(distDir, 'index.html');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Finance server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Apex Finance server:', err);
  process.exit(1);
});
