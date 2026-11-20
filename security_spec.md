# Apex Finance Security Rules Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity & PII Isolation (`/users/{userId}`)**:
   - A user profile document can only be read by its owner (`request.auth.uid == userId`) or a verified Admin (`isAdmin()`).
   - Users must authenticate with a verified email (`request.auth.token.email_verified == true`) for all writes.
   - `uid` and `createdAt` are immutable after creation; `createdAt` must equal `request.time`.
   - Client updates to `/users/{userId}` can only mutate profile or KYC fields (`fullName`, `phone`, `accountType`, `kycTierStatus`, `updatedAt`)—never `uid`, `email`, `accountCode`, or `createdAt`.
2. **Wallet Vault Integrity (`/wallets/{userId}`)**:
   - A wallet document belongs strictly to `userId` (`userId == request.auth.uid`).
   - Only `isAdmin()` can set or toggle `accountFrozen`. Self-registered users must create wallets with `accountFrozen == false` and bounded initial balances (`usdBalance <= 100000`, `eurBalance <= 100000`, `usdcBalance <= 100000`).
   - While `existing().accountFrozen == true`, non-admin owners cannot mutate `usdBalance`, `eurBalance`, or `usdcBalance`.
   - `usdBalance`, `eurBalance`, and `usdcBalance` must always remain non-negative (`>= 0`).
3. **Immutable Transaction Ledger (`/transactions/{transactionId}`)**:
   - Creating a transaction requires `incoming().userId == request.auth.uid`, an existing wallet at `/wallets/$(request.auth.uid)`, `incoming().createdAt == request.time`, and bounded string lengths.
   - Transactions are append-only: `update` and `delete` are denied for all clients.
   - `list` queries on `/transactions` strictly enforce `resource.data.userId == request.auth.uid || isAdmin()`.
4. **Notification Controls (`/notifications/{notificationId}`)**:
   - Users can read/list only their own notifications (`resource.data.userId == request.auth.uid`) and update only the `unread` boolean.
5. **Compliance Directory & RBAC (`/managed_accounts/{accountId}`, `/admins/{userId}`)**:
   - Only `isAdmin()` can read, list, update, or delete `/managed_accounts`. Self-registering users may create a single directory entry with `ownerUid == request.auth.uid`, `kycStatus == 'Pending KYC'`, and `frozen == false`.
   - Only `isAdmin()` can manage `/admins/{userId}`. Admin checks require either `exists(/databases/.../admins/$(uid))` or verified bootstrap email `philosisglobalservices@gmail.com` with `email_verified == true`.
6. **Immutable Audit Trail (`/audit_logs/{auditId}`)**:
   - Reads/lists restricted strictly to `isAdmin()`.
   - Writes allowed only for `create` with `actorUid == request.auth.uid` and `createdAt == request.time`. `update` and `delete` are permanently denied.
7. **Bank Directory (`/nigerian_banks/{bankCode}`)**:
   - Reference codes are readable (`get`, `list`), while writes are restricted to `isAdmin()`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated User Read**: `GET /users/user123` with `auth = null`.
2. **Cross-User PII Read**: `GET /users/victimUid` authenticated as `attackerUid`.
3. **Ghost Field Injection on User Create**: `CREATE /users/attackerUid` with extra field `isAdmin: true`.
4. **UID Spoofing on Transaction Create**: `CREATE /transactions/tx1` where `userId = "victimUid"` while authenticated as `"attackerUid"`.
5. **Negative Wallet Balance Attack**: `UPDATE /wallets/attackerUid` setting `usdBalance = -5000`.
6. **Frozen Account Bypass**: `UPDATE /wallets/attackerUid` updating `usdBalance` when `existing().accountFrozen == true`.
7. **Self-Unfreeze Compliance Bypass**: `UPDATE /wallets/attackerUid` changing `accountFrozen` from `true` to `false` as non-admin owner.
8. **Transaction Ledger Tampering**: `UPDATE /transactions/tx1` modifying `amount` after creation.
9. **Client Timestamp Forgery**: `CREATE /transactions/tx2` with backdated `createdAt` instead of `request.time`.
10. **Oversized Document ID Poisoning**: `CREATE /transactions/<200-char-id>` bypassing `isValidId()`.
11. **Unverified Admin Email Spoof**: `GET /managed_accounts/acc1` where token email is `philosisglobalservices@gmail.com` but `email_verified == false`.
12. **Blanket Transaction List Scraping**: `LIST /transactions` without scoping to `request.auth.uid` as a non-admin user.
