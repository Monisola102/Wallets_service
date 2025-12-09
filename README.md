# Wallet Service with Paystack, JWT & API Keys

A NestJS backend service for managing wallets, handling deposits via Paystack, wallet-to-wallet transfers, and transaction history. Supports authentication via **Google JWT** or **API keys** for service-to-service access.

---

## Features

- Google sign-in for JWT-based authentication  
- API key system for service-to-service access with permissions, limits, expiry, and rollover  
- Wallet creation per user  
- Wallet deposits using Paystack  
- Mandatory Paystack webhook handling for secure updates  
- Wallet-to-wallet transfers between users  
- Wallet balance retrieval and transaction history  
- Idempotent transaction processing to prevent double credits  
- Atomic transfers for consistency  

---

## Tech Stack

- **Backend:** NestJS  
- **Database:** PostgreSQL with Prisma ORM  
- **Payments:** Paystack API  
- **HTTP Client:** Axios  

---

## Prisma Models

### User

```prisma
model User {
  id         String      @id @default(cuid())
  email      String      @unique
  firstName  String
  lastName   String
  avatarUrl  String?
  password   String?
  wallet     Wallet?
  transactions Transaction[]
  apiKeys    ApiKey[]
  createdAt  DateTime    @default(now())
}

## Wallet
model Wallet {
  id           String        @id @default(uuid())
  userId       String        @unique
  walletNumber String        @unique
  balance      Float         @default(0)
  user         User          @relation(fields: [userId], references: [id])
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[] @relation("WalletTransactions")
}

## Transaction
model Transaction {
  id        String   @id @default(uuid())
  walletId  String
  userId    String
  amount    Float
  type      String
  status    String
  reference String   @unique
  meta      Json?
  createdAt DateTime @default(now())

  wallet    Wallet   @relation(fields: [walletId], references: [id], name: "WalletTransactions")
  user      User     @relation(fields: [userId], references: [id])
}

## ApiKey
model ApiKey {
  id          String   @id @default(uuid())
  userId      String
  name        String
  prefix      String
  hashedKey   String @unique
  permissions String[]
  expiresAt   DateTime
  revoked     Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
}

## API Endpoints
1.Google Authentication

GET /auth/google – Initiates Google login

GET /auth/google/callback – Logs in user, creates user if not existing, returns JWT

2. API Key Management
a. Create API Key

POST /keys/create

Request:{
  "name": "wallet-service",
  "permissions": ["deposit", "transfer", "read"],
  "expiry": "1D"
}
Rules:

Max 5 active keys per user

Expiry options: 1H, 1D, 1M, 1Y

Permissions must be explicitly assigned

Response:

{
  "api_key": "sk_live_xxxxx",
  "expires_at": "2025-01-01T12:00:00Z"
}

b. Rollover Expired API Key

POST /keys/rollover

Request:

{
  "expired_key_id": "FGH2485K6KK79GKG9GKGK",
  "expiry": "1M"
}


Rules:

Expired key must truly be expired

New key reuses same permissions

expires_at is updated

3. Wallet Deposit (Paystack)

POST /wallet/deposit

Auth: JWT or API key with deposit permission

Request:

{
  "amount": 5000
}


Response:

{
  "reference": "...",
  "authorization_url": "https://paystack.co/checkout/..."
}

4. Paystack Webhook (Mandatory)

POST /wallet/paystack/webhook

Validate Paystack signature

Update transaction status and wallet balance

Response:

{ "status": true }


Only the webhook is allowed to credit wallets; manual verify endpoint is optional.

5. Verify Deposit Status (Optional)

GET /wallet/deposit/{reference}/status

Response:

{
  "reference": "...",
  "status": "success|failed|pending",
  "amount": 5000
}


Must not credit wallets.

6. Get Wallet Balance

GET /wallet/balance

Auth: JWT or API key with read permission

Response:

{
  "balance": 15000
}

7. Wallet Transfer

POST /wallet/transfer

Auth: JWT or API key with transfer permission

Request:

{
  "wallet_number": "4566678954356",
  "amount": 3000
}


Response:

{
  "status": "success",
  "message": "Transfer completed"
}

8. Transaction History

GET /wallet/transactions

Auth: JWT or API key with read permission

Response:

[
  {
    "type": "deposit",
    "amount": 5000,
    "status": "success"
  },
  {
    "type": "transfer",
    "amount": 3000,
    "status": "success"
  }
]

Access Rules

Authorization: Bearer <JWT> → treated as user

x-api-key: <key> → treated as service

API keys must:

Have valid permissions

Not be expired or revoked

JWT users can perform all wallet actions

Security Considerations

Do not expose secret keys

Validate Paystack webhooks

Prevent transfers with insufficient balance

Enforce API key permissions, limits, and expiry

Idempotent webhook processing

Atomic transfers

Environment Variables
Variable	Description
DATABASE_URL	PostgreSQL connection string
PAYSTACK_SECRET	Paystack secret key for API calls
Notes

Amounts from Paystack are in kobo; converted to Naira (amount / 100)

For production, consider disabling auto-create users from Paystack

Wallet update + transaction creation should ideally be wrapped in a Prisma transaction for atomicity

High-Level Flow

Authentication: Users sign in via Google → JWT returned. Services can use API keys.

Wallet Deposit:

Initialize transaction → Paystack payment link

Payment completed → Paystack sends webhook

Webhook verifies transaction → Wallet balance updated, transaction logged

Wallet Transfer:

User sends funds → Checks sender balance & recipient validity → Updates balances → Logs transaction

API Keys:

Max 5 active keys per user

Permissions-based access

Expiry, revocation, and rollover supported
