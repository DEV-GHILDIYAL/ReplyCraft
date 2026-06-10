import { createAdminClient } from "@/lib/supabase-server";
import { getGroqClient } from "@/lib/groq";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { Tone } from "@/types";

// Reusable sentiment logic (from sentiment API)
const POSITIVE_WORDS = ["good", "great", "excellent", "love", "friendly", "best", "perfect", "delicious", "amazing", "happy", "recommend"];
const NEGATIVE_WORDS = ["bad", "terrible", "burnt", "rude", "worst", "hate", "slow", "unprofessional", "expensive", "disappointed", "poor", "waste"];

function analyzeSentimentHeuristically(text: string) {
  const cleanText = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  POSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) posCount += matches.length;
  });

  NEGATIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) negCount += matches.length;
  });

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let score = 0.5;

  if (posCount > negCount) {
    sentiment = "positive";
    score = Math.min(0.5 + (posCount - negCount) * 0.1, 0.98);
  } else if (negCount > posCount) {
    sentiment = "negative";
    score = Math.max(0.5 - (negCount - posCount) * 0.1, 0.02);
  }

  const words = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
  const potentialKeywords = words.filter(w => w.length > 4 && !["about", "there", "their", "would", "could", "should", "place", "service", "people"].includes(w));
  const uniqueKeywords = Array.from(new Set(potentialKeywords)).slice(0, 4);

  return { sentiment, score, keywords: uniqueKeywords };
}

// Reusable draft logic (from draft API)
function generateDraftHeuristically(
  reviewText: string,
  rating: number,
  tone: Tone,
  reviewerName: string | null
): string {
  const name = reviewerName || "there";

  if (rating <= 2) {
    if (tone === "apologetic") {
      return `Hi ${name}, I am truly sorry for the disappointing experience. We always strive to provide top-notch service, and it's clear we fell short here. We would love to make this right for you. Please reach out to us directly at your convenience.`;
    } else {
      return `Hi ${name}, thank you for your feedback. We apologize for not meeting your expectations. We are reviewing this with our team to improve our service. Please feel free to contact us directly to discuss your experience further.`;
    }
  } else if (rating === 3) {
    return `Hi ${name}, thank you for your feedback. We appreciate your honest review. We are constantly working to improve our service, and your comments will be shared with the team to guide our future efforts.`;
  } else { // 4-5 stars
    if (tone === "friendly") {
      return `Hey ${name}! Thank you so much for the awesome review! We are absolutely thrilled to hear you had a great experience with us. Your support means the world to our team. Can't wait to see you again soon!`;
    } else {
      return `Hi ${name}, thank you for taking the time to share your positive experience. We are thrilled to hear you enjoyed our service. Our team works hard to keep our standards high, and we look forward to welcoming you back soon.`;
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")?.[1] || searchParams.get("secret");
    const secret = process.env.CRON_SECRET;

    if (secret && secret !== "your-cron-secret-key" && token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize admin client to run server-wide checks
    const supabase = await createAdminClient();
    const groq = getGroqClient();

    // Load Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const isMockResend =
      !resendApiKey || resendApiKey === "re_your-resend-api-key" || resendApiKey.trim() === "";

    const resend = isMockResend ? null : new Resend(resendApiKey);

    // Fetch all active businesses
    const { data: businesses } = await supabase.from("businesses").select("*");

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ success: true, message: "No businesses to sync" });
    }

    const report: any[] = [];

    for (const biz of businesses) {
      // Find reviews for this business that have not been classified or drafted yet
      const { data: unprocessedReviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_responded", false);

      const unprocessed = (unprocessedReviews || []).filter(r => !r.sentiment);

      if (unprocessed.length === 0) {
        continue;
      }

      let positiveCount = 0;
      let neutralCount = 0;
      let negativeCount = 0;

      for (const review of unprocessed) {
        let sentiment = "neutral";
        let score = 0.5;
        let keywords: string[] = [];
        let draftText = "";

        // 1. Analyze Sentiment
        if (!groq) {
          const res = analyzeSentimentHeuristically(review.review_text || "");
          sentiment = res.sentiment;
          score = res.score;
          keywords = res.keywords;
        } else {
          try {
            const prompt = `
              Classify sentiment of this review as exactly "positive", "neutral", or "negative".
              Provide score from 0.0 to 1.0. Extract up to 4 keywords.
              Return strictly JSON: { "sentiment": "...", "score": 0.5, "keywords": [] }
              Review: "${(review.review_text || "").replace(/"/g, '\\"')}"
            `;
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: "You are a JSON only output machine." },
                { role: "user", content: prompt },
              ],
              model: "llama-3.1-8b-instant",
              response_format: { type: "json_object" },
            });
            const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
            sentiment = parsed.sentiment || "neutral";
            score = parsed.score || 0.5;
            keywords = parsed.keywords || [];
          } catch {
            const res = analyzeSentimentHeuristically(review.review_text || "");
            sentiment = res.sentiment;
            score = res.score;
            keywords = res.keywords;
          }
        }

        // Count for summary
        if (sentiment === "positive") positiveCount++;
        else if (sentiment === "negative") negativeCount++;
        else neutralCount++;

        // Update review sentiment details
        await supabase
          .from("reviews")
          .update({
            sentiment,
            sentiment_score: score,
            keywords,
          })
          .eq("id", review.id);

        // 2. Generate AI Draft Response
        const defaultTone: Tone = "professional";
        if (!groq) {
          draftText = generateDraftHeuristically(
            review.review_text || "",
            review.rating || 5,
            defaultTone,
            review.reviewer_name
          );
        } else {
          try {
            const rating = review.rating || 5;
            const businessName = biz.name || "our team";
            const reviewer = review.reviewer_name || "customer";
            const reviewText = review.review_text || "";

            let promptRules = "";
            if (rating <= 2) {
              promptRules = `Since the rating is low (${rating} stars), draft an apologetic response, offer a resolution (such as looking into the issue or addressing it internally), and invite direct contact to make it right.`;
            } else if (rating === 3) {
              promptRules = `Since the rating is moderate (${rating} stars), acknowledge their feedback, thank them, and highlight our commitment to improve our service based on their input.`;
            } else {
              promptRules = `Since the rating is high (${rating} stars), thank them warmly for their support and reinforce what they loved about their experience.`;
            }

            const prompt = `
              You are a customer relationship assistant for the business "${businessName}".
              Draft a response to the following customer review.

              Business Name: ${businessName}
              Customer Name: ${reviewer}
              Review Rating: ${rating} stars
              Review Text: "${reviewText}"
              Desired Response Tone: ${defaultTone}

              Rules:
              1. ${promptRules}
              2. Sound human and authentic. Avoid corporate speak, robotic language, or clichés.
              3. Keep the response concise: maximum 120 words.
              4. Focus on building customer loyalty.
              5. NEVER use placeholders, templates, or bracketed variables (like "[Your Name]", "[insert email]", "[contact number]", "[manager's name]"). All information must be complete and ready-to-publish as-is.
              6. Sign off as "${businessName}" or "our team" generically. Do not leave a signature placeholder.

              Respond ONLY with the text of the draft response. No headers, introductory phrases, or signatures like "[Your Name]". Just write the reply.
            `;

            const completion = await groq.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content: `You are a customer service assistant writing draft responses to reviews for the business: "${businessName}". 
Output ONLY the final response text.

CRITICAL RULES:
1. NEVER include placeholders, brackets, or template tags like "[insert X]", "[your name]", "[contact details]", "[phone number]", "[email]", etc.
2. Instead of using placeholders, use these generic but professional alternatives:
   - Instead of contact email: say "please contact us directly" or "email us directly"
   - Instead of manager/staff name: say "our team" or "management"
   - Instead of phone number: say "reach out to us directly" or "call us directly"
3. Ensure the response is completely self-contained, warm, professional, and ready to be published as-is without any editing needed.
4. Keep the response concise (maximum 120 words) and maintain the requested tone.`
                },
                { role: "user", content: prompt },
              ],
              model: "llama-3.1-8b-instant",
            });
            draftText = completion.choices[0]?.message?.content?.trim() || "";

            // Cleanup response formatting issues (quotes, etc.)
            if (draftText.startsWith('"') && draftText.endsWith('"')) {
              draftText = draftText.slice(1, -1);
            }
          } catch (err) {
            console.error("Failed to generate AI draft in cron sync, falling back to heuristics:", err);
            draftText = generateDraftHeuristically(
              review.review_text || "",
              review.rating || 5,
              defaultTone,
              review.reviewer_name
            );
          }
        }

        const isAutoReply = biz.auto_reply_enabled && (biz.plan === "growth" || biz.plan === "scale");

        // Insert draft
        await supabase.from("response_drafts").insert({
          review_id: review.id,
          business_id: biz.id,
          draft_text: draftText,
          ai_model: groq ? "llama-3.1-8b-instant" : "cron-fallback",
          status: isAutoReply ? "published" : "pending",
          tone: defaultTone,
        });

        // If Auto-Reply, update the review record directly to responded
        if (isAutoReply) {
          await supabase
            .from("reviews")
            .update({
              is_responded: true,
              response_text: draftText,
              response_published_at: new Date().toISOString(),
            })
            .eq("id", review.id);
        }
      }

      // 3. Email Notification to Business Owner
      // Fetch user profile email using supabase admin
      const { data: authUser } = await supabase.auth.admin.getUserById(biz.user_id);
      const ownerEmail = authUser?.user?.email;

      if (ownerEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const emailSubject = `ReplyDesk: ${unprocessed.length} new reviews need your attention`;
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0f1e; color: #f1f5f9; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00d4aa; margin: 0; font-size: 24px;">ReplyDesk</h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Automated Sync Alert</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #f1f5f9;">
              Hi there, we successfully imported <strong>${unprocessed.length} new review(s)</strong> for your business, <strong>${biz.name}</strong>.
            </p>

            <div style="background: #111827; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #1e293b; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #00d4aa; margin-bottom: 12px;">Review Summary</div>
              <table style="width: 100%; text-align: center; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #22c55e;"><strong>🟢 Positive</strong></td>
                  <td style="padding: 8px; color: #f59e0b;"><strong>🟡 Neutral</strong></td>
                  <td style="padding: 8px; color: #ef4444;"><strong>🔴 Negative</strong></td>
                </tr>
                <tr style="font-size: 20px; font-weight: bold;">
                  <td style="color: #22c55e;">${positiveCount}</td>
                  <td style="color: #f59e0b;">${neutralCount}</td>
                  <td style="color: #ef4444;">${negativeCount}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #94a3b8; text-align: center; margin-bottom: 24px;">
              AI draft responses have been generated for all new reviews. Review them in your approval queue.
            </p>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${appUrl}/responses" style="background: #00d4aa; color: #0a0f1e; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 14px; display: inline-block;">
                Review & Approve Drafts
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #1e293b; margin-bottom: 16px;"/>
            <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0;">
              This is an automated sync system alert from ReplyDesk. You can manage notifications under Settings.
            </p>
          </div>
        `;

        if (resend) {
          await resend.emails.send({
            from: "ReplyDesk Alerts <onboarding@resend.dev>",
            to: ownerEmail,
            subject: emailSubject,
            html: emailHtml,
          });
        } else {
          console.log(`[Resend Email Simulation] Sent email notification to ${ownerEmail}:`);
          console.log(`Subject: ${emailSubject}`);
          console.log(`Summary: Total ${unprocessed.length} (Pos: ${positiveCount}, Neg: ${negativeCount})`);
        }
      }

      report.push({
        business: biz.name,
        processed: unprocessed.length,
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute cron review sync" },
      { status: 500 }
    );
  }
}
