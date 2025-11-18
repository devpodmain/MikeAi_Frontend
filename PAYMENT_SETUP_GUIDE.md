# MikeAI Payment System Setup Guide

## Overview
MikeAI uses a **one-time payment model** (not subscriptions) with Stripe PaymentIntents. Users pay $4.99 for 30 days of access, with no recurring billing or card storage.

## Payment Features
- ✅ One-time $4.99 payment for 30 days access
- ✅ **3D Secure (OTP) authentication required on every transaction**
- ✅ Automatic invoice generation
- ✅ Purchase history dashboard with billing addresses
- ✅ Expiration tracking with renewal prompts
- ✅ No card storage or automatic billing

---

## Stripe Setup Instructions

### 1. Get Your Stripe API Keys

1. Log in to **Stripe Dashboard**: https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle in top right corner)
3. Go to **Developers** → **API keys**
4. Copy both keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

✅ **Already configured in Replit Secrets:**
- `STRIPE_SECRET_KEY` ✅
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅

---

### 2. Set Up Stripe Webhook

The webhook allows Stripe to notify your app when payments are completed.

#### Step 2.1: Get Your Webhook URL

Your webhook endpoint is:
```
https://[YOUR-REPLIT-APP-URL]/api/stripe/webhook
```

**To find your Replit app URL:**
1. Look at the browser preview in Replit
2. Click the URL at the top (looks like: `https://your-app-name.replit.dev`)
3. Copy this base URL
4. Add `/api/stripe/webhook` to the end

**Example webhook URL:**
```
https://mikeai-fitness.replit.dev/api/stripe/webhook
```

#### Step 2.2: Create Webhook in Stripe

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: Paste your webhook URL (from Step 2.1)
4. **Description**: `MikeAI Payment Verification`
5. **Events to send**: Click **Select events** and choose:
   - ✅ `payment_intent.succeeded`
   
   (You only need this one event for the one-time payment system)
   
6. Click **Add endpoint**
7. **Copy the Signing Secret** that appears (starts with `whsec_...`)

#### Step 2.3: Add Webhook Secret to Replit

✅ **Already configured in Replit Secrets:**
- `STRIPE_WEBHOOK_SECRET` ✅

---

## 3. How the Payment Flow Works

### User Journey:
1. User clicks **"Get 30 Days Access"** on `/subscription` page
2. Payment form appears with Stripe Elements (card input)
3. User enters card details
4. **3D Secure popup appears** - User must complete OTP verification
5. Payment is processed
6. Stripe webhook sends `payment_intent.succeeded` event to your server
7. Server creates purchase record with:
   - Purchase amount ($4.99)
   - Expiration date (30 days from now)
   - Billing address
   - Invoice URL
8. User is redirected to `/subscription-success` page
9. User can view purchase in **Purchase History** section

### Access Control:
- Premium features (Fitness GPT, Supplements AI) check for **active non-expired purchase**
- After 30 days, access expires and user sees renewal prompt
- Users can renew anytime by making another $4.99 payment

---

## 4. Testing the Payment System

### Test Cards (Stripe Test Mode)

Use these cards to test the payment flow:

**Success (with 3D Secure):**
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```
This card will trigger 3D Secure authentication.

**Other Test Cards:**
```
Always succeeds: 4242 4242 4242 4242
Declines: 4000 0000 0000 0002
Requires authentication: 4000 0027 6000 3184
```

### Testing Steps:

1. Go to your app's `/subscription` page
2. Click **"Get 30 Days Access"**
3. Enter test card details
4. Complete the 3D Secure authentication popup
5. Verify:
   - Redirect to `/subscription-success`
   - Purchase appears in **Purchase History**
   - Invoice link is generated
   - Expiration date is 30 days from now
6. Check Stripe Dashboard:
   - Go to **Payments**
   - Verify payment appears with amount $4.99
   - Check **Webhooks** → Your endpoint → Events
   - Verify `payment_intent.succeeded` event was delivered successfully

---

## 5. Database Tables

### `purchases` Table
Stores all payment records:
```typescript
{
  id: serial (auto-increment)
  userId: varchar (references users)
  paymentIntentId: varchar (Stripe PaymentIntent ID)
  amount: numeric (4.99)
  currency: varchar (usd)
  planId: varchar (plus)
  planName: varchar (PLUS - 30 Day Access)
  billingAddress: jsonb (full billing details)
  invoiceUrl: varchar (Stripe invoice link)
  expiresAt: timestamp (30 days from purchase)
  createdAt: timestamp (purchase date)
}
```

### Accessing Database

**Via Replit Database Tool:**
1. In Replit, click **Tools** → **Database**
2. View and query your data directly

**Via Neon Dashboard:**
1. Go to https://console.neon.tech
2. Log in with your Neon account
3. Select your database
4. Use **SQL Editor** to run queries
5. Example query:
```sql
SELECT * FROM purchases ORDER BY "createdAt" DESC;
```

---

## 6. Webhook Events Explained

### `payment_intent.succeeded`
Triggered when a payment is successfully completed.

**What the server does:**
1. Verifies webhook signature (security)
2. Extracts metadata (userId, planId)
3. Generates Stripe invoice
4. Marks invoice as paid
5. Creates purchase record in database
6. Sets expiration date to 30 days from now
7. Returns success response

**Important:** The webhook secret (`STRIPE_WEBHOOK_SECRET`) ensures that only Stripe can send events to your endpoint.

---

## 7. Going Live (Production)

When ready to accept real payments:

1. **Switch to Live mode** in Stripe Dashboard
2. Get your **Live API keys**:
   - Go to **Developers** → **API keys**
   - Copy **Live** publishable key and secret key
3. **Create Live webhook**:
   - Go to **Developers** → **Webhooks**
   - Add endpoint with same URL
   - Select `payment_intent.succeeded` event
   - Copy Live signing secret
4. **Update Replit Secrets** with Live keys:
   - Replace `STRIPE_SECRET_KEY` with live secret key
   - Replace `VITE_STRIPE_PUBLISHABLE_KEY` with live publishable key
   - Replace `STRIPE_WEBHOOK_SECRET` with live webhook secret
5. **Restart your application**
6. **Test with real card** (small amount first)

---

## 8. Troubleshooting

### Payment Form Not Showing
- ✅ Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors

### Webhook Not Receiving Events
- Verify webhook URL is correct and publicly accessible
- Check Stripe Dashboard → Webhooks → Your endpoint → Events
- Look for failed deliveries and error messages
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly

### Payment Succeeds but No Purchase Record
- Check webhook delivery in Stripe Dashboard
- Look for errors in workflow logs
- Verify database connection

### 3D Secure Not Appearing
- Use test card `4000 0025 0000 3155`
- Check that `payment_method_options.card.request_three_d_secure = 'any'` is set

### Database Access
- **Replit**: Use Database tool in Tools panel
- **Neon**: Log in to https://console.neon.tech
- Run queries to inspect data

---

## 9. Code Locations

### Backend (server/routes.ts)
- Line ~1254: `/api/create-subscription` - Creates PaymentIntent
- Line ~1375: `/api/stripe/webhook` - Handles payment success
- Line ~1341: `/api/user/active-payment` - Checks active purchase
- Line ~1360: `/api/user/payments` - Gets purchase history

### Frontend
- `client/src/pages/subscription.tsx` - Payment page
- `client/src/pages/subscription-success.tsx` - Success page
- `client/src/pages/purchase-history.tsx` - Purchase history dashboard

### Database Schema
- `shared/schema.ts` - Database models
- `server/storage.ts` - Database operations

---

## 10. Support

**Stripe Documentation:**
- https://stripe.com/docs/payments/payment-intents
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/testing

**Stripe Support:**
- https://support.stripe.com

**Testing Cards:**
- https://stripe.com/docs/testing#cards
