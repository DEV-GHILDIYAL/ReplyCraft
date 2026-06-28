import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Terms of Service | ReplyDesk",
  description: "Read the terms and conditions for using ReplyDesk's AI-powered review management platform.",
};
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-rc-text leading-relaxed">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-rc-text tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-xs text-rc-muted mb-8">Last Updated: June 2026</p>

        <div className="space-y-8 text-sm sm:text-base text-rc-muted">
          <p>
            Please read these Terms of Service carefully before using ReplyDesk at <a href="https://replydesk.in" className="text-rc-accent hover:underline">replydesk.in</a>, operated by Dev Ghildiyal.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">1. Acceptance of Terms</h2>
            <p>
              By creating an account and using ReplyDesk, you agree to be bound by these Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">2. Description of Service</h2>
            <p>
              ReplyDesk is an AI-powered review management platform that allows business owners to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sync customer reviews from Google Business Profile</li>
              <li>Generate AI-drafted responses using Groq (Llama 3.1)</li>
              <li>Manage and publish responses to reviews</li>
              <li>Analyze review sentiment and trends</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and a legitimate business owner or authorized representative to use ReplyDesk. By using the service, you confirm you meet these requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">4. Free Trial & Subscriptions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-rc-text">Free Trial</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>New accounts receive a 7-day free trial with full access to all features</li>
                  <li>No payment required during the trial period</li>
                  <li>Trial expires automatically after 7 days</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Paid Plans</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Starter: ₹499/month — 50 AI drafts/month</li>
                  <li>Growth: ₹999/month — 200 AI drafts/month</li>
                  <li>Scale: ₹2499/month — 1000 AI drafts/month</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Billing</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Payments are processed via Razorpay in Indian Rupees (INR)</li>
                  <li>Subscriptions are monthly and non-refundable once activated</li>
                  <li>Plan upgrades take effect immediately</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">5. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use ReplyDesk to post fake, misleading, or defamatory reviews</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the service</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Share your account credentials with others</li>
              <li>Exceed your plan&apos;s AI draft limits through unauthorized means</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">6. Google Business Profile</h2>
            <p>By connecting your Google Business Profile, you authorize ReplyDesk to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Read your business reviews via Google APIs</li>
              <li>Access your verified business location data</li>
            </ul>
            <p>
              You remain responsible for all content published to your Google Business Profile through ReplyDesk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">7. AI-Generated Content</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responses generated by ReplyDesk are AI-drafted suggestions</li>
              <li>You are responsible for reviewing and approving responses before publishing</li>
              <li>If Auto-Reply is enabled, you accept responsibility for automatically published responses</li>
              <li>We do not guarantee the accuracy or appropriateness of AI-generated content</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">8. Intellectual Property</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>ReplyDesk and its original content, features, and design are owned by Dev Ghildiyal</li>
              <li>Your business data, reviews, and content remain yours</li>
              <li>You grant us a limited license to process your data to provide the service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">9. Limitation of Liability</h2>
            <p>ReplyDesk is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of business or revenue resulting from use of our service</li>
              <li>Errors in AI-generated responses published to your Google Business Profile</li>
              <li>Service downtime or data loss</li>
            </ul>
            <p>
              Our maximum liability shall not exceed the amount you paid us in the last 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your account if you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent or abusive behavior</li>
              <li>Fail to pay for a subscribed plan</li>
            </ul>
            <p>
              You may terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of ReplyDesk after changes constitutes acceptance of the new Terms. We will notify you of major changes via email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">13. Contact Us</h2>
            <p>For any questions about these Terms:</p>
            <div className="bg-rc-card/30 border border-rc-border p-4 rounded-xl space-y-1">
              <p className="font-semibold text-rc-text">Dev Ghildiyal</p>
              <p>Email: <a href="mailto:ghildiyaldev1325@gmail.com" className="text-rc-accent hover:underline">ghildiyaldev1325@gmail.com</a></p>
              <p>Website: <a href="https://replydesk.in" className="text-rc-accent hover:underline">replydesk.in</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
