# Quick Start: Testing Your Payment System

## ✅ Setup Complete!

Your payment system is now fully configured with:
- ✅ Stripe API keys configured
- ✅ 3D Secure (OTP) authentication enabled on ALL transactions
- ✅ One-time payment model ($4.99 for 30 days)
- ✅ Automatic invoice generation
- ✅ Purchase history tracking
- ✅ Expiration management

---

## 🧪 How to Test the Payment Flow

### Step 1: Log In to Your App
1. Open your app in the browser
2. Log in with your test account:
   - Email: `ssandhiya252@gmail.com`
   - Password: `password123`

### Step 2: Navigate to Subscription Page
1. Click on your profile menu (top right)
2. Click **"Subscription"** or **"Get 30 Days Access"**
3. Or directly visit: `/subscription`

### Step 3: Initiate Payment
1. You'll see the **Plus** plan card showing:
   - Price: **$4.99**
   - Duration: **30 days**
   - Text: "One-time payment • No auto-billing"
2. Click the **"Get 30 Days Access"** button
3. Wait for the payment form to load (Stripe Elements)

### Step 4: Enter Test Card Details
Use this Stripe test card:

```
Card Number: 4000 0025 0000 3155
Expiry: 12/25
CVC: 123
ZIP Code: 12345
```

**Important:** This specific card (`4000 0025 0000 3155`) will **trigger 3D Secure authentication** and show an OTP popup.

### Step 5: Complete 3D Secure Authentication
1. After entering the card details, click **"Pay $4.99 - Get 30 Days Access"**
2. **A 3D Secure authentication modal will pop up**
3. In the test popup, click **"Complete"** or **"Authenticate"** (Stripe test mode accepts any action)
4. The payment will process

### Step 6: Verify Success
1. You should be redirected to `/subscription-success`
2. You'll see:
   - Success message
   - Invoice link (click to download PDF)
   - Purchase confirmation

### Step 7: Check Purchase History
1. Go to **Purchase History** (in navigation menu)
2. You should see:
   - Your $4.99 purchase
   - Expiration date (30 days from now)
   - Days remaining
   - Billing address
   - Invoice download link

---

## 🔍 Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle top right)
3. Click **Payments** in left sidebar
4. You should see your $4.99 payment
5. Click on the payment to see details including:
   - 3D Secure authentication status
   - Customer information
   - Metadata (userId, planId, etc.)

### Check Webhook Delivery
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. You should see the `payment_intent.succeeded` event
4. Status should be **Delivered** ✅

---

## 🗄️ Check Database Records

### Via Replit Database Tool
1. In Replit, click **Tools** → **Database**
2. Run this query:
```sql
SELECT * FROM purchases ORDER BY "createdAt" DESC LIMIT 5;
```
3. You should see your purchase record with:
   - userId: "test-user-123"
   - amount: 4.99
   - expiresAt: (30 days from now)
   - invoiceUrl: (Stripe invoice link)
   - billingAddress: (full address JSON)

### Via Neon Dashboard
1. Go to https://console.neon.tech
2. Log in and select your project/database
3. Go to **SQL Editor**
4. Run the same query above
5. View your purchase records

---

## 🎯 What to Look For

### ✅ Success Indicators:
- [x] Payment form loads with Stripe Elements
- [x] 3D Secure popup appears when using card `4000002500003155`
- [x] Payment processes successfully
- [x] Redirect to `/subscription-success`
- [x] Purchase record created in database
- [x] Invoice generated and accessible
- [x] Expiration date is 30 days from purchase
- [x] Webhook event delivered in Stripe Dashboard

### ❌ Common Issues:

**Payment form doesn't load:**
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set in Secrets
- Check browser console for errors

**3D Secure doesn't appear:**
- Make sure you're using test card `4000002500003155`
- The basic card `4242424242424242` may not trigger 3DS
- Stripe may decide based on risk (this is expected behavior)

**"No active payment found" error:**
- This means the webhook hasn't fired yet
- Check Stripe Dashboard → Webhooks for delivery status
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly

**Payment succeeds but no purchase record:**
- Check webhook delivery in Stripe Dashboard
- Look for errors in workflow logs (Replit)
- Verify database connection

---

## 📱 Test Premium Feature Access

After successful payment:

1. Navigate to **AI Hub** (`/ai-hub`)
2. Click on **Fitness GPT** or **Supplements AI**
3. You should have full access (no lock icon)
4. Try asking the AI a question to verify it works

---

## 🔒 Test Access Expiration (Optional)

To test expiration behavior:

1. In Replit Database tool, run:
```sql
UPDATE purchases 
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE "userId" = 'test-user-123';
```

2. Refresh your app
3. Try accessing Fitness GPT or Supplements AI
4. You should see "Access Expired" message
5. Premium features should be locked

To restore access:
```sql
UPDATE purchases 
SET "expiresAt" = NOW() + INTERVAL '30 days'
WHERE "userId" = 'test-user-123';
```

---

## 📋 Test Cards Reference

| Card Number | Behavior |
|-------------|----------|
| `4000 0025 0000 3155` | **Always requires 3D Secure** ✅ |
| `4242 4242 4242 4242` | Basic success (may not trigger 3DS) |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | Requires authentication |

Use any future expiry (e.g., `12/25`), any 3-digit CVC (e.g., `123`), and any ZIP code (e.g., `12345`).

---

## 🚀 Next Steps: Going Live

When ready for production:

1. **Switch to Live mode** in Stripe Dashboard
2. **Get Live API keys** (Developers → API keys)
3. **Create Live webhook** with same URL
4. **Update Replit Secrets** with Live keys
5. **Restart application**
6. **Test with real card** (small amount first)

See `PAYMENT_SETUP_GUIDE.md` for complete production setup instructions.

---

## 💡 Quick Tips

- The system is configured to **request 3D Secure on every transaction**
- Whether it actually appears depends on Stripe's risk assessment and the card used
- Test card `4000002500003155` **guarantees** 3DS authentication
- No cards are stored - users must re-enter details for each purchase
- Webhooks are critical - without them, purchases won't be recorded

---

## 🆘 Need Help?

- Check `PAYMENT_SETUP_GUIDE.md` for detailed setup instructions
- Check workflow logs in Replit for backend errors
- Check browser console for frontend errors
- Check Stripe Dashboard → Webhooks for delivery issues
- Check Stripe Dashboard → Logs for detailed error messages
