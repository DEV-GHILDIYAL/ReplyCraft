// ============================================
// ReplyCraft — Type Definitions
// ============================================

// --- Enum Types ---

export type PlanType = "free" | "pro" | "business";

export type Sentiment = "positive" | "neutral" | "negative";

export type DraftStatus = "pending" | "approved" | "rejected" | "published";

export type Tone = "professional" | "friendly" | "apologetic" | "formal";

export type PlatformName =
  | "google"
  | "yelp"
  | "facebook"
  | "g2"
  | "trustpilot"
  | "justdial"
  | "sulekha"
  | "tripadvisor"
  | "amazon"
  | "zomato"
  | "swiggy";

export type PaymentStatus = "created" | "paid" | "failed";

export type BusinessCategory =
  | "restaurant"
  | "salon"
  | "clinic"
  | "hotel"
  | "retail"
  | "other";

// --- Database Models ---

export interface Business {
  id: string;
  user_id: string;
  name: string;
  category: BusinessCategory | null;
  plan: PlanType;
  plan_expires_at: string | null;
  razorpay_customer_id: string | null;
  created_at: string;
}

export interface Platform {
  id: string;
  business_id: string;
  platform: PlatformName;
  platform_url: string | null;
  platform_id: string | null;
  api_key?: string;
  last_synced_at: string | null;
  is_active: boolean;
}

export interface Review {
  id: string;
  business_id: string;
  platform: PlatformName;
  platform_review_id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  keywords: string[] | null;
  is_responded: boolean;
  response_text: string | null;
  response_published_at: string | null;
  fetched_at: string;
}

export interface ResponseDraft {
  id: string;
  review_id: string;
  business_id: string;
  draft_text: string;
  ai_model: string | null;
  status: DraftStatus;
  tone: Tone;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface Payment {
  id: string;
  business_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  plan: PlanType;
  status: PaymentStatus;
  created_at: string;
}

export interface SentimentDaily {
  id: string;
  business_id: string;
  date: string;
  platform: PlatformName;
  avg_rating: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  total_reviews: number;
}

// --- Plan Configuration ---

export interface PlanConfig {
  name: string;
  price: number; // in paise
  priceDisplay: string;
  features: string[];
  limits: {
    locations: number;
    platforms: number | "unlimited";
    responsesPerMonth: number | "unlimited";
  };
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: "Free",
    price: 0,
    priceDisplay: "₹0",
    features: [
      "1 location",
      "2 platforms",
      "50 AI responses/mo",
      "Basic dashboard",
    ],
    limits: {
      locations: 1,
      platforms: 2,
      responsesPerMonth: 50,
    },
  },
  pro: {
    name: "Pro",
    price: 99900,
    priceDisplay: "₹999",
    features: [
      "3 locations",
      "All platforms",
      "500 AI responses/mo",
      "Sentiment analytics",
      "Priority support",
    ],
    limits: {
      locations: 3,
      platforms: "unlimited",
      responsesPerMonth: 500,
    },
  },
  business: {
    name: "Business",
    price: 249900,
    priceDisplay: "₹2,499",
    features: [
      "10 locations",
      "All platforms",
      "Unlimited AI responses",
      "Sentiment analytics",
      "Dedicated support",
      "API access",
    ],
    limits: {
      locations: 10,
      platforms: "unlimited",
      responsesPerMonth: "unlimited",
    },
  },
};
