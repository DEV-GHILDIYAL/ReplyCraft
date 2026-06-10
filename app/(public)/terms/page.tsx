import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-rc-text leading-relaxed">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-rc-text tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-xs text-rc-muted mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm sm:text-base text-rc-muted">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              1. Service Description
            </h2>
            <p>
              ReplyDesk is an AI-powered customer review relationship management and response automation platform. 
              We provide tools to synchronize your business reviews from supported platforms, classify sentiment, 
              and generate customized, context-aware draft responses ready for publication.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              2. User Responsibilities
            </h2>
            <p>
              By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Only connect platforms and manage customer reviews for businesses that you legally own or are explicitly authorized to represent.</li>
              <li>Provide accurate, complete, and current information during registration and onboarding.</li>
              <li>Maintain the confidentiality of your credentials and account access.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              3. Payment & Refund Terms
            </h2>
            <p>
              ReplyDesk is billed on a monthly subscription model based on your selected plan. Subscriptions renew automatically every 30 days.
            </p>
            <p>
              We offer a **7-day refund policy** from your initial purchase. If you are unsatisfied with the service, you may request a full refund within 7 days of subscribing by contacting support. No refunds will be issued after this 7-day window.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              4. Limitation of Liability
            </h2>
            <p>
              ReplyDesk provides AI-generated draft responses for your convenience. You are solely responsible for reviewing and editing drafts before publication. 
              ReplyDesk is not liable for any published responses, communications, customer dissatisfaction, or account actions taken by review platforms (such as Google My Business) as a result of using our tools.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              5. Governing Law
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. 
              Any disputes arising from these terms or your use of the service shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">
              6. Contact Information
            </h2>
            <p>
              If you have any questions or feedback regarding these Terms, please contact us at:
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
