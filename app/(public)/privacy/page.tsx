import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-rc-text leading-relaxed">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-rc-text tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs text-rc-muted mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm sm:text-base text-rc-muted">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              1. What Data We Collect
            </h2>
            <p>
              We collect and process the following information to provide and improve our services:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Details</strong>: Your email address and account credentials.</li>
              <li><strong>Business Information</strong>: Your business name, category, and connected platform details.</li>
              <li><strong>Review Data</strong>: Customer reviews from your connected accounts (including reviewer name, rating, text, and date).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              2. How We Use Your Data
            </h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To synchronize, analyze, and display your reviews in the ReplyDesk dashboard.</li>
              <li>To generate context-aware AI response drafts for reviews.</li>
              <li>To process subscription billing transactions.</li>
              <li>To send system alerts, notifications, and customer support communications.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              3. Third Party Services
            </h2>
            <p>
              We securely share metadata and transaction information with third-party service providers to facilitate our platform features:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong>: Database hosting, RLS policies, and user authentication.</li>
              <li><strong>Groq AI</strong>: LLM APIs (`llama-3.1-8b-instant`) to perform sentiment analysis and response drafting.</li>
              <li><strong>Razorpay</strong>: Subscription billing checkout and payment gateway webhook verification.</li>
              <li><strong>Google Places API</strong>: Connecting and downloading public business profiles and reviews.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              4. Data Retention & Deletion
            </h2>
            <p>
              We retain your data for as long as your account is active. 
              If you decide to delete your account, all associated records—including your business profile, platform connections, imported reviews, and generated drafts—will be permanently deleted from our databases.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              5. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to us at:
            </p>
            <p className="font-semibold text-rc-accent">
              Email: <a href="mailto:support@replydesk.in" className="hover:underline">support@replydesk.in</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
