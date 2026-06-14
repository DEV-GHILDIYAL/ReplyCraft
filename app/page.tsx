import Navbar from "@/components/landing/Navbar";
import BetaBanner from "@/components/landing/BetaBanner";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Platforms from "@/components/landing/Platforms";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = typeof resolvedSearchParams.code === "string" ? resolvedSearchParams.code : undefined;

  if (code) {
    const type = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "";
    const typeParam = type ? `&type=${type}` : "";
    redirect(`/auth/callback?code=${code}${typeParam}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-rc-bg">
      <Navbar />
      <BetaBanner />
      <main>
        <Hero />
        <HowItWorks />
        <Platforms />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
