import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MOCK_REVIEWS = [
  {
    platform: "google",
    platform_review_id: "google_mock_1",
    reviewer_name: "Sarah Jenkins",
    rating: 5,
    review_text: "Absolutely loved the food! The service was incredibly fast and the staff were very friendly.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    sentiment: "positive",
    sentiment_score: 0.95,
    keywords: ["food", "service", "fast", "friendly"],
    is_responded: false,
  },
  {
    platform: "yelp",
    platform_review_id: "yelp_mock_1",
    reviewer_name: "Michael Chang",
    rating: 1,
    review_text: "Terrible experience. The order was completely burnt and the manager was extremely rude when I complained.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    sentiment: "negative",
    sentiment_score: 0.05,
    keywords: ["burnt", "manager", "rude"],
    is_responded: false,
  },
  {
    platform: "facebook",
    platform_review_id: "facebook_mock_1",
    reviewer_name: "David Miller",
    rating: 4,
    review_text: "Great atmosphere. The service was nice, but the wait times were a bit longer than expected.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    sentiment: "positive",
    sentiment_score: 0.82,
    keywords: ["atmosphere", "service", "wait times"],
    is_responded: false,
  },
  {
    platform: "google",
    platform_review_id: "google_mock_2",
    reviewer_name: "Emily Watson",
    rating: 3,
    review_text: "Average service. The place was clean, but the staff seemed disinterested and pricing was a bit steep.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    sentiment: "neutral",
    sentiment_score: 0.51,
    keywords: ["clean", "disinterested", "pricing"],
    is_responded: false,
  },
  {
    platform: "trustpilot",
    platform_review_id: "trustpilot_mock_1",
    reviewer_name: "Jonathan Cole",
    rating: 5,
    review_text: "Highly recommend! They went above and beyond to resolve my query. Exceptional client support.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    sentiment: "positive",
    sentiment_score: 0.98,
    keywords: ["recommend", "resolve", "support"],
    is_responded: false,
  },
  {
    platform: "yelp",
    platform_review_id: "yelp_mock_2",
    reviewer_name: "Jessica Taylor",
    rating: 2,
    review_text: "The aesthetic was cool, but the actual delivery was uneven and not worth the premium price.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    sentiment: "negative",
    sentiment_score: 0.28,
    keywords: ["aesthetic", "uneven", "price"],
    is_responded: false,
  },
  {
    platform: "google",
    platform_review_id: "google_mock_3",
    reviewer_name: "Robert Downey",
    rating: 5,
    review_text: "Best customer service in town! They solved my issues in under 5 minutes. Super impressed.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    sentiment: "positive",
    sentiment_score: 0.96,
    keywords: ["service", "solved", "5 minutes"],
    is_responded: false,
  },
  {
    platform: "facebook",
    platform_review_id: "facebook_mock_2",
    reviewer_name: "Sophia Martinez",
    rating: 3,
    review_text: "Decent restaurant. The food is standard, nothing special. Staff is friendly enough though.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(), // 6 days ago
    sentiment: "neutral",
    sentiment_score: 0.49,
    keywords: ["decent", "standard", "friendly"],
    is_responded: false,
  },
  {
    platform: "g2",
    platform_review_id: "g2_mock_1",
    reviewer_name: "Alexander Wright",
    rating: 4,
    review_text: "Solid software tool. Set up was straightforward, though the reporting export features could be improved.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), // 7 days ago
    sentiment: "positive",
    sentiment_score: 0.79,
    keywords: ["software", "straightforward", "export"],
    is_responded: false,
  },
  {
    platform: "google",
    platform_review_id: "google_mock_4",
    reviewer_name: "Daniel Craig",
    rating: 1,
    review_text: "Terrible. Placed an order, got charged, and they never delivered. Customer service refused to refund.",
    review_date: new Date(Date.now() - 1000 * 60 * 60 * 192).toISOString(), // 8 days ago
    sentiment: "negative",
    sentiment_score: 0.02,
    keywords: ["charged", "never delivered", "no refund"],
    is_responded: false,
  },
];

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Seeding mock data is not permitted in production environments." },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get business profile
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Business profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Delete existing reviews and drafts for this business to avoid conflict during seed
    await supabase.from("response_drafts").delete().eq("business_id", businessId);
    await supabase.from("reviews").delete().eq("business_id", businessId);

    // Prepare insertions
    const reviewsToInsert = MOCK_REVIEWS.map((review) => ({
      ...review,
      business_id: businessId,
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from("reviews")
      .insert(reviewsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Seed some daily sentiment count data
    await supabase.from("sentiment_daily").delete().eq("business_id", businessId);
    
    // Group by day to create basic historical count
    const dates = [
      new Date().toISOString().split("T")[0],
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0],
    ];

    const sentimentDailySeeds = [];
    for (const date of dates) {
      sentimentDailySeeds.push({
        business_id: businessId,
        date: date,
        platform: "google",
        avg_rating: 4.0,
        positive_count: 2,
        neutral_count: 1,
        negative_count: 1,
        total_reviews: 4,
      });
      sentimentDailySeeds.push({
        business_id: businessId,
        date: date,
        platform: "yelp",
        avg_rating: 1.5,
        positive_count: 0,
        neutral_count: 0,
        negative_count: 2,
        total_reviews: 2,
      });
    }

    await supabase.from("sentiment_daily").insert(sentimentDailySeeds);

    return NextResponse.json({
      success: true,
      message: `Seeded ${insertedReviews?.length} mock reviews successfully`,
    });
  } catch (err: any) {
    console.error("Mock seed error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to seed mock reviews" },
      { status: 500 }
    );
  }
}
