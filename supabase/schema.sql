-- ============================================
-- ReplyDesk — Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Business profiles
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- restaurant | salon | clinic | hotel | retail | other
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'scale')),
  plan_expires_at TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  onboarding_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connected review platforms
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN (
    'google', 'yelp', 'facebook', 'g2', 'trustpilot',
    'justdial', 'sulekha', 'tripadvisor', 'amazon', 'zomato', 'swiggy'
  )),
  platform_url TEXT,
  platform_id TEXT,
  place_id TEXT,
  api_key TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews from all platforms
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_review_id TEXT UNIQUE,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score FLOAT,
  keywords TEXT[],
  is_responded BOOLEAN NOT NULL DEFAULT false,
  response_text TEXT,
  response_published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI-generated response drafts
CREATE TABLE response_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL,
  ai_model TEXT, -- groq | openai | claude
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'apologetic', 'formal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Subscription payments via Razorpay
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount INTEGER NOT NULL, -- in paise
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'growth', 'scale')),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregated daily sentiment data
CREATE TABLE sentiment_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  avg_rating FLOAT,
  positive_count INTEGER NOT NULL DEFAULT 0,
  neutral_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  UNIQUE(business_id, date, platform)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_platforms_business_id ON platforms(business_id);
CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_platform ON reviews(platform);
CREATE INDEX idx_reviews_review_date ON reviews(review_date);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX idx_reviews_is_responded ON reviews(is_responded);
CREATE INDEX idx_response_drafts_business_id ON response_drafts(business_id);
CREATE INDEX idx_response_drafts_review_id ON response_drafts(review_id);
CREATE INDEX idx_response_drafts_status ON response_drafts(status);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_sentiment_daily_business_date ON sentiment_daily(business_id, date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_daily ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only access their own businesses
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Platforms: Users can access platforms for their businesses
CREATE POLICY "Users can view own platforms"
  ON platforms FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can create platforms for own businesses"
  ON platforms FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own platforms"
  ON platforms FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own platforms"
  ON platforms FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Reviews: Users can access reviews for their businesses
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can create reviews for own businesses"
  ON reviews FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Response Drafts: Users can access drafts for their businesses
CREATE POLICY "Users can view own drafts"
  ON response_drafts FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can create drafts for own businesses"
  ON response_drafts FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own drafts"
  ON response_drafts FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own drafts"
  ON response_drafts FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Payments: Users can access payments for their businesses
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can create payments for own businesses"
  ON payments FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Sentiment Daily: Users can view sentiment data for their businesses
CREATE POLICY "Users can view own sentiment data"
  ON sentiment_daily FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Service role policies (for API routes / cron jobs)
CREATE POLICY "Service role full access to reviews"
  ON reviews FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to response_drafts"
  ON response_drafts FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to sentiment_daily"
  ON sentiment_daily FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');
