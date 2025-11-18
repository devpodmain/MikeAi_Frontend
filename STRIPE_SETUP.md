# Stripe Subscription Setup Instructions

This document explains how to configure Stripe for the monthly subscription system in your MikeAI application.

## Overview

The application uses a simple subscription model:
- **FREE TRIAL**: 7-day trial (auto-granted on signup, no payment required)
- **PLUS**: $4.99/month (full access to all features including Fitness GPT and Supplement AI)

## Prerequisites

1. A Stripe account (sign up at https://stripe.com if you don't have one)
2. Access to your Stripe Dashboard
3. The following environment variables already configured:
   - `STRIPE_SECRET_KEY` ✅ (already set)
   - `VITE_STRIPE_PUBLIC_KEY` ✅ (already set)

## Setup Steps

### Step 1: Create Subscription Products

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Products** in the left sidebar
3. Click **+ Add product** to create each subscription tier

#### Create PLUS Product
- **Name**: MikeAI Plus
- **Description**: Full access to all MikeAI features
- **Pricing**: Recurring
  - **Price**: $4.99 USD
  - **Billing period**: Monthly
- Click **Save product**
- **Copy the Price ID** (starts with `price_...`)

### Step 2: Configure Environment Variables

Add the Price ID to your Replit Secrets:

1. In Replit, open the **Tools** panel
2. Click on **Secrets**
3. Add this new secret:
   - `STRIPE_PRICE_PLUS` = `price_...` (the Price ID you copied for PLUS)

### Step 3: Set Up Stripe Webhook

Webhooks allow Stripe to notify your application about subscription events (payments, cancellations, etc.).

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: Enter your Replit app URL followed by `/api/stripe/webhook`
   - Example: `https://your-replit-app.replit.dev/api/stripe/webhook`
   - Replace `your-replit-app` with your actual Replit app domain
4. **Description**: MikeAI Subscription Events
5. **Events to send**: Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. **Copy the Webhook Signing Secret** (starts with `whsec_...`)

### Step 4: Add Webhook Secret

1. In Replit Secrets, add:
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (the signing secret you just copied)

### Step 5: Restart Your Application

After adding all the secrets, restart your application to pick up the new environment variables.

## Testing

### Test in Stripe Test Mode

1. Ensure you're in **Test mode** (toggle in top right of Stripe Dashboard)
2. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date, any 3-digit CVC, any 5-digit ZIP

### Test the Subscription Flow

1. Go to `/subscription` in your app
2. Click **Choose Plus** or **Choose Pro**
3. Enter test card details
4. Complete the subscription
5. Verify in Stripe Dashboard > **Payments** that the subscription was created

### Test Webhooks

1. In Stripe Dashboard > **Developers** > **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select an event (e.g., `invoice.payment_succeeded`)
5. Verify the webhook was received successfully

## Going Live

When ready to accept real payments:

1. **Switch to Live mode** in Stripe Dashboard
2. **Repeat Steps 1-4** in Live mode (create products, update secrets with live keys)
3. **Enable live mode** in Replit by updating:
   - `STRIPE_SECRET_KEY` with your live secret key
   - `VITE_STRIPE_PUBLIC_KEY` with your live publishable key
4. **Test thoroughly** before announcing to users

## Troubleshooting

### Webhook not receiving events
- Verify the endpoint URL is correct and publicly accessible
- Check Stripe Dashboard > Webhooks for error logs
- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set

### Subscription creation fails
- Verify Price IDs are correct in environment variables
- Check Stripe Dashboard > Logs for detailed error messages
- Ensure test mode/live mode keys match

### Environment variables not loading
- Restart the application after adding secrets
- Verify secret names match exactly (case-sensitive)

## Support

For Stripe-specific issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For application issues:
- Check the browser console for errors
- Check workflow logs in Replit
- Review the webhook logs in Stripe Dashboard
