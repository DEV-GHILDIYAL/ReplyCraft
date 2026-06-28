import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy | ReplyDesk",
  description: "Learn how ReplyDesk collects, uses, and protects your business and review data.",
};
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-rc-text leading-relaxed">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-rc-text tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs text-rc-muted mb-8">Last Updated: June 2026</p>

        <div className="space-y-8 text-sm sm:text-base text-rc-muted">
          <p>
            ReplyDesk (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is operated by Dev Ghildiyal. This Privacy Policy explains how we collect, use, and protect your information when you use ReplyDesk at <a href="https://replydesk.in" className="text-rc-accent hover:underline">replydesk.in</a>.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-rc-text">Account Information</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Name and email address when you register</li>
                  <li>Google account information when you connect via Google OAuth</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Business Information</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Business name, category, and website</li>
                  <li>Onboarding preferences (goals, challenges, tone preferences)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Review Data</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Customer reviews synced from your connected Google Business Profile</li>
                  <li>AI-generated response drafts for those reviews</li>
                  <li>Sentiment analysis results</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Payment Information</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>We do NOT store your card details</li>
                  <li>Payments are processed securely by Razorpay</li>
                  <li>We store transaction records (order ID, plan, amount, status) for billing history</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-rc-text">Usage Data</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Pages visited, features used</li>
                  <li>Number of AI drafts generated per month</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the ReplyDesk service</li>
              <li>To sync reviews from your connected Google Business Profile</li>
              <li>To generate AI-powered response drafts using Groq (Llama 3.1)</li>
              <li>To send email notifications about new reviews (via Resend)</li>
              <li>To process subscription payments (via Razorpay)</li>
              <li>To improve our service and fix issues</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">3. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <div className="overflow-x-auto my-4 border border-rc-border rounded-lg">
              <table className="min-w-full divide-y divide-rc-border text-left text-sm">
                <thead className="bg-rc-card/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-rc-text">Service</th>
                    <th className="px-4 py-3 font-semibold text-rc-text">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rc-border">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Supabase</td>
                    <td className="px-4 py-3">Database and authentication</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Google Business Profile API</td>
                    <td className="px-4 py-3">Syncing your business reviews</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Groq (Llama 3.1)</td>
                    <td className="px-4 py-3">AI response generation and sentiment analysis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Razorpay</td>
                    <td className="px-4 py-3">Payment processing</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Resend</td>
                    <td className="px-4 py-3">Email notifications</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-rc-text">Vercel</td>
                    <td className="px-4 py-3">Hosting and deployment</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Each service has its own privacy policy. We recommend reviewing them.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">4. Data Storage & Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All data is stored securely on Supabase (PostgreSQL) with Row Level Security enabled</li>
              <li>Only you can access your business data — we enforce strict tenant isolation</li>
              <li>Access tokens for Google Business Profile are stored encrypted</li>
              <li>We do not sell or share your data with third parties for advertising</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">5. Data Retention & Deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is retained as long as your account is active</li>
              <li>You can request deletion of your account and all associated data by emailing us</li>
              <li>Upon deletion, your reviews, drafts, and business data are permanently removed</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <a href="mailto:ghildiyaldev1325@gmail.com" className="text-rc-accent hover:underline">ghildiyaldev1325@gmail.com</a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">7. Cookies</h2>
            <p>
              ReplyDesk uses cookies to maintain your login session via Supabase Auth. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">8. Children&apos;s Privacy</h2>
            <p>
              ReplyDesk is intended for business owners and is not directed at anyone under the age of 18. We do not knowingly collect data from minors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes via email or an in-app notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">10. Contact Us</h2>
            <p>For any privacy-related questions or requests:</p>
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
