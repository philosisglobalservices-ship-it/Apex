import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const BOOTSTRAP_ADMIN_EMAIL = 'philosisglobalservices@gmail.com';

// Verifying ID tokens with verifyIdToken(token) requires no IAM permissions
// and works across both Starter Tier and user-owned Firebase projects.
const adminApp = getApps().length
  ? getApp()
  : initializeApp({ projectId: FIREBASE_PROJECT_ID });

export const adminAuth = getAuth(adminApp);

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken;
  isAdmin?: boolean;
}

export async function requireFirebaseAuth(
  req: FirebaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Missing Firebase ID token.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email_verified !== true) {
      res.status(403).json({ error: 'A verified Google email address is required.' });
      return;
    }

    req.firebaseUser = decoded;
    req.isAdmin = Boolean(
      decoded.email &&
        decoded.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
        decoded.email_verified === true
    );
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired Firebase session. Please sign in again.' });
  }
}

export function requireFirebaseAdmin(
  req: FirebaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.firebaseUser || !req.isAdmin) {
    res.status(403).json({ error: 'CBN SuperAdmin privileges required for this operation.' });
    return;
  }
  next();
}
