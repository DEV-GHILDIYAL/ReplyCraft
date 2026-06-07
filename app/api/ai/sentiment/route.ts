import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGroqClient } from "@/lib/groq";
import { NextResponse } from "next/server";

const POSITIVE_WORDS = ["good", "great", "excellent", "love", "friendly", "best", "perfect", "delicious", "amazing", "happy", "recommend"];
const NEGATIVE_WORDS = ["bad", "terrible", "burnt", "rude", "worst", "hate", "slow", "unprofessional", "expensive", "disappointed", "poor", "waste"];

// Heuristic fallback for sentiment analysis
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

  // extract keywords
  const words = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
  const potentialKeywords = words.filter(w => w.length > 4 && !["about", "there", "their", "would", "could", "should", "place", "service", "people"].includes(w));
  const uniqueKeywords = Array.from(new Set(potentialKeywords)).slice(0, 4);

  return { sentiment, score, keywords: uniqueKeywords };
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewText } = await request.json();

    if (!reviewText || typeof reviewText !== "string") {
      return NextResponse.json(
        { error: "reviewText is required and must be a string" },
        { status: 400 }
      );
    }

    const groq = getGroqClient();

    if (!groq) {
      // Fallback
      const result = analyzeSentimentHeuristically(reviewText);
      return NextResponse.json(result);
    }

    // Call Groq Llama 3.1
    const prompt = `
      You are an expert sentiment analyst. Analyze the following review text.
      Classify the sentiment as exactly one of: "positive", "neutral", "negative".
      Provide a sentiment score from 0.0 (extremely negative) to 1.0 (extremely positive).
      Extract up to 4 key business-relevant keywords from the text (e.g. food, support, speed).

      Respond ONLY with a valid JSON object matching this structure:
      {
        "sentiment": "positive" | "neutral" | "negative",
        "score": number,
        "keywords": string[]
      }

      Review Text: "${reviewText.replace(/"/g, '\\"')}"
    `;

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise JSON-only output assistant." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
    });

    const output = response.choices[0]?.message?.content;
    if (!output) {
      throw new Error("Empty response from Groq");
    }

    const parsed = JSON.parse(output);
    return NextResponse.json({
      sentiment: parsed.sentiment || "neutral",
      score: typeof parsed.score === "number" ? parsed.score : 0.5,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    });
  } catch (err: any) {
    console.error("Sentiment API error:", err);
    // Graceful fallback on failure
    try {
      const body = await request.clone().json();
      const fallbackResult = analyzeSentimentHeuristically(body.reviewText || "");
      return NextResponse.json(fallbackResult);
    } catch {
      return NextResponse.json(
        { error: err.message || "Failed to analyze sentiment" },
        { status: 500 }
      );
    }
  }
}
