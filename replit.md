# Meal Planner App

## Overview
This full-stack meal planning application offers a scalable, secure, and user-friendly platform for personalized health and wellness. It provides AI-powered meal planning, habit tracking, community engagement, and comprehensive nutrition management for individuals and fitness/nutrition coaches. The project aims to help users achieve dietary and fitness goals and enable coaches to efficiently manage clients, driving innovation in health and wellness.

## Recent Changes
**November 17, 2025** - Fixed 7 Critical Data Sync Issues:
1. **Client Dashboard Plans Fix**: Updated API routes to include `orgId` in URL path (`/api/organizations/:orgId/client-info/:userId/...`) to match `requireOrgActiveSubscription` middleware expectations. Frontend queries now interpolate `user.organizationId` into the path to prevent 401 authorization errors.
2. **Common Password Change Fix**: Fixed mutation to always pass `currentPassword` parameter regardless of notification checkbox state. Previously failed when "send notifications" was unchecked because `currentPassword` was undefined.
3. **Full Meal Tracking Page Fix**: Updated endpoint from `/api/organizations/assigned-meal-plan/:userId` to `/api/organizations/:orgId/assigned-meal-plan/:userId` to match middleware requirements and prevent empty plan responses.
4. **Full Workout Tracking Page Fix**: Updated endpoint from `/api/organizations/assigned-workout-plan/:userId` to `/api/organizations/:orgId/assigned-workout-plan/:userId` to match middleware requirements and prevent empty plan responses.
5. **Coach Dashboard Plan Names Fix**: Fixed two bugs - backend now queries `orgMealPlans`/`orgWorkoutPlans` tables instead of `mealPlans`/`workoutPlans`, and frontend now uses actual plan names from API instead of hardcoding undefined.
6. **Progress Calculation Sync Fix**: Completely rewrote `getOrgUsersWithMetrics` progress calculation to use actual activity data (workout logs, meal logs, habit logs, water logs from last 7 days) instead of just plan assignment recency, ensuring coach and client dashboards reflect the same activity metrics.
7. **Analytics Refresh Verification**: Confirmed analytics are calculated on-demand using 30-day rolling windows with no caching issues.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a mobile-first, PWA-enabled design with distinct post-login experiences for coaches (dark slate) and users (bright), automated routing, and native app features like camera food scanning and voice commands. Key UI elements include smart animations, a clean AI Hub dashboard, a search-based AI Recipe Generator, and an enhanced chat component with customizable themes and voice input. The dashboard provides real-time data, while the community section features a tree-structured comment system and leaderboards. A revolutionary landing page with a cinematic hero, story-driven timeline, and 3D interactive elements is planned. The organization client dashboard utilizes modern gradient cards and streamlined tracking.

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI, Tailwind CSS, and Vite.
-   **Backend**: Express.js with TypeScript, PostgreSQL with Drizzle ORM, and Passport.js for authentication with cookie-based sessions.
-   **API Design**: RESTful endpoints with robust error handling.

### Feature Specifications
-   **Authentication**: Supports individual users, organization owners, and members with role-based access control and a two-cluster architecture.
-   **AI Integration**: AI-powered personalized meal plans, supplement suggestions, workout plans, and recipe generation via a standardized FastAPI backend.
-   **Tracking Systems**: Customizable Habit Tracking (gamification) and Daily Water Tracking.
-   **Community Features**: Social posts, like/comment system, achievement sharing, and a tier-based challenge system with a weekly leaderboard.
-   **Coach-Client Interaction**: Client progress viewing, messaging, and custom plan creation.
-   **Organization System**: Multi-tenant support with role-specific dashboards, visual plan builders for meals and workouts, and a flexible day mapping system.
-   **Subscription System**: 3-tier monthly model (FREE/PLUS/PRO) using Stripe for recurring billing and tier-based feature access.
-   **Organization One-Time Payment System**: Billing infrastructure for organizations with one-time monthly payments via Stripe Checkout, webhook handling, and soft-locking for expired members. Tier pricing and capacity enforcement are actively managed.
-   **Activation Management System**: Full quota management for subscription downgrades and tier changes, including auto-locking of excess members, manual member swaps (one per role per billing cycle), and a comprehensive API for activation summaries.
-   **Automatic Capacity Enforcement**: System automatically enforces member quotas when capacity changes or members are added/removed:
    -   **Auto-Lock Excess Members**: When active member count exceeds quota (e.g., manual DB changes, downgrades), system automatically locks the newest members to maintain compliance
    -   **Auto-Unlock on Available Capacity**: When members are deleted or capacity increases, locked_downgrade members are automatically promoted to active status (earliest locked first)
    -   **NULL Status Handling**: Treats NULL status as active throughout the system for consistent capacity calculations
    -   **Integration Points**: Enforcement runs on dashboard load, billing period checks, and after member deletions
    -   **Logging**: All auto-lock/unlock actions are logged in orgMemberActivationEvents with reason='auto_unlock' or 'downgrade'
-   **Anti-Exploitation System**: Safeguards against subscription exploitation through tier-based swap budgets, member-level swap tracking (one swap-in per cycle), a 48-hour cooldown between swaps, and blocking mid-cycle upgrades.
-   **Member Reactivation System**: Soft delete architecture prevents duplicate member records when re-adding previously deleted members. When adding a member, the system searches for archived records by organization, email, and role, reactivating them instead of creating duplicates. Reactivation enforces swap limits (one activation per member per billing period), respects capacity constraints, and preserves historical data including swap counts and billing period tracking.
-   **Swap Budget System**: Tier-based swap allowances reset at each billing period start:
    -   **FREE Tier**: 2 coach swaps + 2 client swaps per billing period
    -   **BASIC Tier**: 4 coach swaps + 4 client swaps per billing period
    -   **PRO Tier**: 6 coach swaps + 6 client swaps per billing period
    -   Each member can only be activated once per billing period
    -   48-hour cooldown enforced between consecutive swaps
-   **Analytics & Metrics**: Real-time coach and client performance tracking using actual database queries, calculating weighted activity scoring over 30-day rolling windows.
-   **Security**: Authorization middleware, protected routes, data filtering, and security headers.
-   **Password & Email System**: Comprehensive password management, including forgot password flow, and member invitations via Resend.

## External Dependencies

### UI and Styling
-   **Radix UI**: Accessible component primitives.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Lucide React**: Icon library.
-   **Class Variance Authority**: Component variant management.

### Backend Services
-   **Neon Database**: PostgreSQL hosting.
-   **Drizzle ORM**: Type-safe database operations.
-   **Passport.js**: Authentication strategies.
-   **Express Session**: Session management middleware.
-   **Perplexity AI**: 'sonar-pro' model for chatbot responses.
-   **Stripe**: Payment processing for subscriptions and organization payments.
-   **Resend**: Email service for transactional emails.
    -   **Current Configuration**: Using custom verified domain `noreply@mikeai.co` (configured in `server/email.ts` as `FROM_EMAIL` constant)
    -   **Email Types Sent**:
        1. **Welcome Email**: Sent when new users register
        2. **Organization Invitation**: Sent when coaches/clients are added to an organization (includes login credentials)
        3. **Password Reset**: Sent when users request password reset (30-minute expiry link)
        4. **Common Password Changed**: Sent to selected org members when org owner updates the common password
    -   **Domain Setup Completed**: Custom domain `mikeai.co` verified in Resend, all emails now sent from `noreply@mikeai.co` for professional delivery and spam avoidance