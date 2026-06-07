import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Platforms from "@/components/landing/Platforms";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-rc-bg">
      <Navbar />
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
