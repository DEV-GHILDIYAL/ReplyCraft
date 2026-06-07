# ReplyCraft — AI Review Response & Reputation Manager
## Master Prompt for Antigravity

---

## 🏗️ FULL ARCHITECTURE

### Tech Stack (Final Decision)
| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + SEO + API routes in one |
| Backend | Next.js API Routes | No separate server needed |
| Database | Supabase (PostgreSQL) | Free tier generous, auth built-in, realtime |
| AI | Groq (llama-3.1-8b-instant) → fallback OpenAI/Claude | Fast + free to start |
| Payments | Razorpay | Indian billing, UPI support |
| Email | Resend.com | Free 3000 emails/mo |
| Hosting | AWS EC2 t3.micro (Mumbai ap-south-1) | Low latency India |
| Auth | Supabase Auth (email + Google OAuth) | Free, built-in |
| Caching | Upstash Redis (free tier) | Rate limiting + caching |
| Review Scraping | Apify + direct APIs where available | Multi-platform |

---

## 📁 FOLDER STRUCTURE

```
replycraft/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx          ← Main overview
│   │   ├── reviews/page.tsx            ← All reviews feed
│   │   ├── responses/page.tsx          ← Draft approvals queue
│   │   ├── sentiment/page.tsx          ← Trends & analytics
│   │   ├── platforms/page.tsx          ← Connect review platforms
│   │   └── settings/page.tsx
│   ├── (landing)/
│   │   └── page.tsx                    ← Marketing landing page
│   ├── api/
│   │   ├── reviews/
│   │   │   ├── fetch/route.ts          ← Scrape/pull reviews
│   │   │   └── sync/route.ts           ← Cron sync job
│   │   ├── ai/
│   │   │   ├── draft/route.ts          ← Generate response draft
│   │   │   └── sentiment/route.ts      ← Analyze sentiment
│   │   ├── payments/
│   │   │   ├── create-order/route.ts
│   │   │   └── webhook/route.ts
│   │   └── platforms/
│   │       ├── google/route.ts
│   │       ├── yelp/route.ts
│   │       └── trustpilot/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                             ← shadcn/ui components
│   ├── dashboard/
│   │   ├── ReviewCard.tsx
│   │   ├── ResponseDraftModal.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── PlatformBadge.tsx
│   │   └── StatsGrid.tsx
│   └── landing/
│       ├── Hero.tsx
│       ├── Pricing.tsx
│       └── Features.tsx
├── lib/
│   ├── supabase.ts
│   ├── groq.ts
│   ├── razorpay.ts
│   ├── scraper/
│   │   ├── google.ts
│   │   ├── yelp.ts
│   │   ├── g2.ts
│   │   ├── trustpilot.ts
│   │   └── facebook.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── middleware.ts                       ← Auth protection
```

---

## 🗄️ DATABASE SCHEMA (Supabase)

```sql
-- Users (handled by Supabase Auth)

-- Business profiles
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT,
  plan TEXT DEFAULT 'starter', -- starter | pro | agency
  plan_expires_at TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Connected platforms
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  platform TEXT NOT NULL, -- google | yelp | g2 | trustpilot | facebook | justdial | sulekha | tripadvisor | amazon | zomato | swiggy
  platform_url TEXT,
  platform_id TEXT,
  api_key TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  platform TEXT NOT NULL,
  platform_review_id TEXT UNIQUE,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ,
  sentiment TEXT, -- positive | neutral | negative
  sentiment_score FLOAT,
  keywords TEXT[], -- extracted keywords
  is_responded BOOLEAN DEFAULT false,
  response_text TEXT,
  response_published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- AI Drafts (response queue)
CREATE TABLE response_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id),
  business_id UUID REFERENCES businesses(id),
  draft_text TEXT NOT NULL,
  ai_model TEXT, -- groq | openai | claude
  status TEXT DEFAULT 'pending', -- pending | approved | rejected | published
  tone TEXT DEFAULT 'professional', -- professional | friendly | apologetic | formal
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

-- Subscription payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount INTEGER, -- in paise
  plan TEXT,
  status TEXT, -- created | paid | failed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sentiment trends (aggregated daily)
CREATE TABLE sentiment_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  date DATE,
  platform TEXT,
  avg_rating FLOAT,
  positive_count INTEGER,
  neutral_count INTEGER,
  negative_count INTEGER,
  total_reviews INTEGER
);
```

---

## 🤖 AI DRAFT SYSTEM

### Groq Integration (lib/groq.ts)
```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateReviewResponse({
  reviewText,
  rating,
  businessName,
  tone = 'professional',
  platform,
}: {
  reviewText: string;
  rating: number;
  businessName: string;
  tone: 'professional' | 'friendly' | 'apologetic' | 'formal';
  platform: string;
}) {
  const systemPrompt = `You are a reputation manager for ${businessName}. 
  Generate a ${tone} response to a ${rating}-star ${platform} review.
  Rules:
  - Max 150 words
  - Don't be defensive for negative reviews
  - Thank reviewer by name if mentioned
  - For 1-2 stars: apologize, offer resolution, provide contact
  - For 3 stars: acknowledge, highlight positives, invite back
  - For 4-5 stars: thank warmly, reinforce positive aspects
  - Never use generic phrases like "We value your feedback"
  - Sound human, not corporate
  Return ONLY the response text, nothing else.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Review: "${reviewText}"` },
    ],
    max_tokens: 200,
  });

  return completion.choices[0].message.content;
}

// Fallback to OpenAI if Groq fails
export async function generateWithFallback(params: any) {
  try {
    return await generateReviewResponse(params);
  } catch (err) {
    // Switch to OpenAI GPT-4o-mini
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // ... same logic with openai client
  }
}
```

---

## 💳 RAZORPAY INTEGRATION

### Plans & Pricing
```typescript
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49900, // ₹499 in paise
    features: ['1 location', '3 platforms', '50 AI responses/mo', 'Basic dashboard'],
  },
  pro: {
    name: 'Pro',
    price: 149900, // ₹1499 in paise
    features: ['3 locations', 'All platforms', 'Unlimited AI responses', 'Sentiment trends', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    price: 399900, // ₹3999 in paise
    features: ['10 locations', 'White-label', 'API access', 'Dedicated support', 'Custom AI tone'],
  },
};
```

### Create Order API (app/api/payments/create-order/route.ts)
```typescript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { plan, businessId } = await req.json();
  
  const order = await razorpay.orders.create({
    amount: PLANS[plan].price,
    currency: 'INR',
    receipt: `rc_${businessId}_${Date.now()}`,
    notes: { plan, businessId },
  });

  return Response.json({ orderId: order.id, amount: order.amount });
}
```

---

## 🌐 PLATFORMS TO SUPPORT

### V1 (Launch)
| Platform | Method |
|---|---|
| Google Reviews | Google My Business API |
| Facebook Reviews | Meta Graph API |
| Trustpilot | Trustpilot Business API |
| Yelp | Yelp Fusion API |
| G2 | Scraping via Apify |

### V2 (Post-launch)
- JustDial, Sulekha, IndiaMART (India-specific)
- TripAdvisor, Zomato, Swiggy (hospitality/food)
| Amazon (product reviews)
- Clutch.co (B2B agencies)

---

## 🎨 UI DESIGN SYSTEM

### Theme
- **Style**: Dark professional SaaS — deep navy/slate background, electric teal accents
- **Font**: Geist (headings) + DM Sans (body)
- **Colors**:
  ```css
  --bg-primary: #0a0f1e;
  --bg-card: #111827;
  --accent: #00d4aa;
  --accent-soft: #00d4aa22;
  --text-primary: #f1f5f9;
  --text-muted: #94a3b8;
  --positive: #22c55e;
  --neutral: #f59e0b;
  --negative: #ef4444;
  --border: #1e293b;
  ```

### Key Screens
1. **Landing Page** — Hero with live demo mockup, pricing, social proof
2. **Dashboard** — Stats grid (total reviews, avg rating, response rate, sentiment score) + recent reviews feed
3. **Reviews Feed** — Filterable by platform/rating/status, each card shows review + AI draft button
4. **Response Queue** — Drafts awaiting approval, edit + approve + publish flow
5. **Sentiment Analytics** — Line charts (rating trend), pie (sentiment split), keyword cloud
6. **Platform Connect** — OAuth/API key setup for each platform
7. **Settings** — Business profile, AI tone preference, notification settings
8. **Billing** — Plan comparison, Razorpay checkout, invoice history

---

## 🔄 CORE USER FLOW

```
Register → Create Business → Connect Platforms
→ Reviews Auto-Sync (every 6 hours via cron)
→ AI Auto-Drafts Generated for each new review
→ Owner gets email notification
→ Owner logs in → sees pending drafts
→ Reviews draft → edits if needed → Approves
→ Response published to platform (where API allows)
→ Sentiment dashboard updates daily
```

---

## ⚙️ ENV VARIABLES NEEDED

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Review Platforms
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
YELP_API_KEY=
TRUSTPILOT_API_KEY=

# Email
RESEND_API_KEY=

# App
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

---

## 🚀 ANTIGRAVITY PROMPT — PHASE 1 (Foundation)

---

**PASTE THIS INTO ANTIGRAVITY:**

```
You are building ReplyCraft — an AI-powered review response and reputation management SaaS for small businesses.

TECH STACK:
- Next.js 14 with App Router + TypeScript
- Supabase (auth + PostgreSQL database)
- Tailwind CSS + shadcn/ui components
- Groq SDK for AI (llama-3.1-8b-instant)
- Razorpay for payments

TASK — BUILD PHASE 1: Project Foundation + Auth + Landing Page

1. INITIALIZE PROJECT:
npx create-next-app@latest replycraft --typescript --tailwind --app --src-dir=false
cd replycraft
npx shadcn-ui@latest init
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs groq razorpay resend

2. CREATE ALL ENV VARIABLES in .env.local (with placeholder values)

3. SETUP SUPABASE CLIENT:
Create lib/supabase.ts with both client-side and server-side Supabase clients

4. CREATE DATABASE SCHEMA:
Create supabase/schema.sql with ALL tables from the schema below. Include RLS policies.

Tables needed:
- businesses (id, user_id, name, category, plan, plan_expires_at, razorpay_customer_id, created_at)
- platforms (id, business_id, platform, platform_url, platform_id, last_synced_at, is_active)
- reviews (id, business_id, platform, platform_review_id, reviewer_name, rating, review_text, review_date, sentiment, sentiment_score, keywords, is_responded, response_text, fetched_at)
- response_drafts (id, review_id, business_id, draft_text, ai_model, status, tone, created_at, approved_at)
- payments (id, business_id, razorpay_order_id, razorpay_payment_id, amount, plan, status, created_at)

5. BUILD LANDING PAGE (app/page.tsx):
Dark theme: bg #0a0f1e, accent color #00d4aa, font Geist
Sections:
a) Hero: "Turn Every Review Into a Growth Opportunity" — headline, subtext "AI drafts perfect responses in seconds. You approve in one click.", CTA buttons "Start Free Trial" + "See Demo"
b) How It Works: 3 steps with icons (Connect platforms → AI drafts responses → You approve & publish)
c) Supported Platforms: logos/icons for Google, Yelp, Facebook, G2, Trustpilot
d) Pricing section with 3 plans:
   - Starter ₹499/mo: 1 location, 3 platforms, 50 AI responses
   - Pro ₹1499/mo: 3 locations, all platforms, unlimited responses, sentiment analytics
   - Agency ₹3999/mo: 10 locations, white-label, API access
   Each plan has a "Get Started" button
e) Footer with links

6. BUILD AUTH PAGES:
- app/(auth)/login/page.tsx — email + password login form + Google OAuth button
- app/(auth)/register/page.tsx — name, email, password, business name fields
- app/(auth)/layout.tsx — centered card layout
- middleware.ts — protect /dashboard/* routes, redirect to /login if not authed

7. BUILD ONBOARDING:
- app/(dashboard)/onboarding/page.tsx
- Step 1: Business name + category (restaurant/salon/clinic/hotel/retail/other)
- Step 2: Connect first platform (show platform cards with "Connect" button)
- Step 3: Success screen with "Go to Dashboard" CTA

USE THESE DESIGN TOKENS THROUGHOUT:
--bg-primary: #0a0f1e
--bg-card: #111827
--accent: #00d4aa
--text-primary: #f1f5f9
--text-muted: #94a3b8
--positive: #22c55e
--neutral: #f59e0b
--negative: #ef4444
--border: #1e293b

Make the UI look premium, dark, professional. Not corporate boring — energetic but trustworthy.
All components must be responsive (mobile first).
```

---

## 🚀 ANTIGRAVITY PROMPT — PHASE 2 (Dashboard + AI Core)

```
Continue building ReplyCraft. Phase 1 (auth + landing) is complete.

PHASE 2: Core Dashboard + AI Draft System

1. DASHBOARD LAYOUT (app/(dashboard)/layout.tsx):
Left sidebar with nav items:
- Dashboard (home icon)
- Reviews (star icon)
- Responses (check-circle icon)
- Sentiment (trending-up icon)
- Platforms (link icon)
- Settings (settings icon)
Top bar: business name, plan badge, notification bell, user avatar

2. MAIN DASHBOARD (app/(dashboard)/dashboard/page.tsx):
Stats grid (4 cards):
- Total Reviews (with platform breakdown)
- Average Rating (with star display + trend arrow)
- Pending Responses (count needing approval)
- Response Rate % (responded/total)

Below stats: Recent Reviews feed (last 10, with platform badge, rating stars, snippet, "Draft Response" button)
Right sidebar: Sentiment donut chart (positive/neutral/negative split)

3. REVIEWS PAGE (app/(dashboard)/reviews/page.tsx):
Full reviews feed with filters:
- Filter by: Platform (all/google/yelp/etc), Rating (all/1-2/3/4-5), Status (all/pending/responded)
- Each ReviewCard shows:
  * Platform logo + badge
  * Reviewer name + date
  * Star rating (visual)
  * Review text (truncated with expand)
  * Sentiment badge (color coded)
  * Action buttons: "AI Draft" | "Mark Responded" | "Ignore"
- Clicking "AI Draft" opens ResponseDraftModal

4. AI DRAFT MODAL (components/dashboard/ResponseDraftModal.tsx):
- Shows full review text
- Tone selector: Professional / Friendly / Apologetic / Formal
- "Generate Draft" button → calls /api/ai/draft
- Shows generated text in editable textarea
- "Regenerate" button
- "Approve & Save" button (saves to response_drafts with status='approved')
- "Publish Response" button (where platform API allows it)

5. AI DRAFT API (app/api/ai/draft/route.ts):
- Accept: reviewId, tone
- Fetch review from Supabase
- Call Groq API (llama-3.1-8b-instant) with smart system prompt
- System prompt logic:
  * 1-2 stars: apologetic, offer resolution, invite direct contact
  * 3 stars: acknowledge, highlight commitment to improvement
  * 4-5 stars: warm thanks, reinforce what they loved
  * Always: sound human, max 120 words, no corporate speak
- Save draft to response_drafts table
- Return draft text

6. SENTIMENT ANALYSIS API (app/api/ai/sentiment/route.ts):
- Accept: reviewText
- Use Groq to classify: positive/neutral/negative + score 0-1
- Return: { sentiment, score, keywords[] }
- This runs on every new review fetched

7. RESPONSES QUEUE (app/(dashboard)/responses/page.tsx):
- Shows all response_drafts with status='pending' or 'approved'
- Card for each: review snippet + draft text + approve/reject/edit actions
- Bulk approve button
- Status tabs: Pending | Approved | Published | Rejected

IMPORTANT NOTES:
- Use React Query or SWR for data fetching
- Add loading skeletons everywhere
- Error boundaries for API failures
- Toast notifications for all actions (react-hot-toast)
- All API routes must verify user session via Supabase
```

---

## 🚀 ANTIGRAVITY PROMPT — PHASE 3 (Payments + Platforms)

```
Continue ReplyCraft. Phase 1 + 2 complete. Now build payments and platform connections.

PHASE 3: Razorpay Payments + Platform OAuth

1. RAZORPAY SETUP:
npm install razorpay

Create lib/razorpay.ts:
- Server-side Razorpay instance
- Plan constants: starter(₹499), pro(₹1499), agency(₹3999)

Create app/api/payments/create-order/route.ts:
- Verify user session
- Create Razorpay order
- Return orderId + amount

Create app/api/payments/webhook/route.ts:
- Verify Razorpay webhook signature
- On payment.captured: update businesses.plan + plan_expires_at in Supabase
- Handle subscription renewals

2. BILLING PAGE (app/(dashboard)/settings/billing/page.tsx):
- Current plan display with usage stats
- Plan comparison table (3 plans side by side)
- Upgrade button → triggers Razorpay checkout
- Razorpay checkout integration:
  ```javascript
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: 'INR',
    name: 'ReplyCraft',
    description: `${plan} Plan`,
    order_id: order.orderId,
    handler: async (response) => {
      // Verify payment on backend
      // Update UI
    },
    prefill: { email: user.email, name: user.name },
    theme: { color: '#00d4aa' },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
  ```
- Payment history table (date, plan, amount, status)

3. PLATFORMS PAGE (app/(dashboard)/platforms/page.tsx):
Platform cards grid. Each card shows:
- Platform logo + name
- Status: Connected (green) / Not connected (gray)
- Last synced time
- Connect / Disconnect button
- Settings (for connected ones)

Platform connection flows:
- Google: OAuth via Google My Business API
- Facebook: Meta OAuth
- Yelp: API key input form
- Trustpilot: API key input form
- G2: Profile URL input (scraping)

Create app/api/platforms/connect/route.ts:
- Save platform credentials to platforms table
- Test connection
- Return success/error

4. REVIEW SYNC SYSTEM:
Create app/api/reviews/sync/route.ts:
- Protected by CRON_SECRET header
- For each active platform connection:
  * Fetch latest reviews
  * Check for new ones (by platform_review_id)
  * Run sentiment analysis on each new review
  * Generate AI draft automatically
  * Save to reviews + response_drafts tables
  * Send email notification via Resend

Create lib/scraper/google.ts — Google My Business API integration
Create lib/scraper/trustpilot.ts — Trustpilot API integration
Create lib/scraper/yelp.ts — Yelp Fusion API integration
Create lib/scraper/facebook.ts — Meta Graph API integration
Create lib/scraper/g2.ts — Apify scraper integration

5. EMAIL NOTIFICATIONS (lib/email.ts using Resend):
Template for new review alert:
- Subject: "⭐ New [rating]-star review on [platform]"
- Body: reviewer name + review snippet + "View & Approve Draft" button

GUARD ALL ROUTES:
- Check plan limits (starter: 50 drafts/mo, pro: unlimited)
- If limit exceeded, show upgrade prompt
```

---

## 📊 PHASE 4 — SENTIMENT ANALYTICS (Final Phase)

```
Final phase of ReplyCraft. Build the Sentiment Analytics dashboard.

PHASE 4: Sentiment Dashboard + Polish

1. SENTIMENT PAGE (app/(dashboard)/sentiment/page.tsx):
Date range picker (last 7/30/90 days)

Charts (use Recharts):
a) Rating Trend Line Chart — average rating over time, per platform
b) Sentiment Pie/Donut — positive % / neutral % / negative % 
c) Review Volume Bar Chart — reviews per day/week
d) Platform Comparison Bar Chart — avg rating by platform
e) Top Keywords — word cloud or tag cloud of most mentioned words

Stats cards:
- Most mentioned positive words (e.g. "quick", "friendly", "clean")
- Most mentioned negative words (e.g. "slow", "rude", "expensive")  
- Best performing platform
- Worst performing platform
- Response rate by platform

2. SETTINGS PAGE (app/(dashboard)/settings/page.tsx):
Tabs:
a) Business Profile: name, category, website, description, logo upload
b) AI Preferences: default tone, response language (English/Hindi/Hinglish), auto-draft on/off, max response length
c) Notifications: email alerts (new reviews, weekly digest), alert threshold (notify if rating < X)
d) Team: invite team members (pro/agency only), manage roles (admin/responder/viewer)
e) Billing: (link to billing page)

3. POLISH TASKS:
- Add empty states for all pages (no reviews, no platforms connected, etc.)
- Add onboarding checklist widget on dashboard (Connect platform → Get first review → Approve first draft)
- Add "Quick Stats" weekly email digest (cron job every Monday)
- Add keyboard shortcuts (J/K to navigate reviews, A to approve, R to regenerate)
- Mobile responsive check for all pages
- Add Suspense boundaries + loading.tsx for each route
- SEO meta tags for landing page
- Add robots.txt + sitemap.xml

4. DEPLOYMENT PREP:
Create Dockerfile:
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

Create docker-compose.yml for local dev with env vars
Create .github/workflows/deploy.yml:
- On push to main
- Build Docker image
- Push to ECR
- SSH into EC2 Mumbai and pull + restart container

Create DEPLOYMENT.md with:
- EC2 setup steps (t3.micro, Ubuntu 22.04, Mumbai)
- Nginx config for reverse proxy
- SSL with Certbot
- Environment variables setup
- Supabase project creation steps
```

---

## 🎯 BUILD ORDER SUMMARY

1. **Phase 1** → Foundation + Auth + Landing (Week 1)
2. **Phase 2** → Dashboard + AI Core (Week 2)  
3. **Phase 3** → Payments + Platform Connections (Week 3)
4. **Phase 4** → Analytics + Polish + Deploy (Week 4)

**Target: Live in 4 weeks on AWS EC2 Mumbai**
