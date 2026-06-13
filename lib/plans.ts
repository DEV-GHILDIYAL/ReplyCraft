export const PLANS = {
  trial:   { name: 'Free Trial', drafts: Infinity, durationDays: 7 },
  starter: { name: 'Starter',   drafts: 50,       price: 499 },
  growth:  { name: 'Growth',    drafts: 200,       price: 999 },
  scale:   { name: 'Scale',     drafts: 1000,      price: 2499 },
}

export function isTrialExpired(trialStartedAt: string): boolean {
  const start = new Date(trialStartedAt)
  const now = new Date()
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 7
}

export function getDraftLimit(plan: string): number {
  return PLANS[plan as keyof typeof PLANS]?.drafts ?? 0
}
