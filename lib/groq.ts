import Groq from "groq-sdk";

export const isPlaceholderKey = (key: string | undefined): boolean => {
  if (!key) return true;
  const clean = key.trim().toLowerCase();
  return (
    clean === "" ||
    clean.includes("your-groq-api-key") ||
    clean.includes("gsk_your")
  );
};

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (isPlaceholderKey(apiKey)) {
    return null;
  }
  return new Groq({ apiKey });
}
