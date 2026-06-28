import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Refund Policy | ReplyDesk",
  description: "Understand ReplyDesk's subscription billing, cancellation, and refund policy.",
};
export default function RefundPage() {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-rc-text leading-relaxed">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-rc-text tracking-tight mb-2">
          Refund Policy
        </h1>
        <p className="text-xs text-rc-muted mb-8">Last Updated: June 2026</p>

        <div className="space-y-8 text-sm sm:text-base text-rc-muted">
          <p>
            This Refund Policy outlines the terms and conditions regarding refunds and cancellations for ReplyDesk subscriptions. Please read this policy carefully before subscribing to our services.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">1. Subscriptions and Billing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All ReplyDesk subscriptions are billed on a <strong>monthly</strong> basis.</li>
              <li>Payments are processed in <strong>INR (Indian Rupees)</strong> securely via our payment partner, <strong>Razorpay</strong>.</li>
              <li>We offer a <strong>7-day free trial</strong> before any initial charge is made, allowing you to evaluate our service risk-free.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">2. Cancellations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You may cancel your subscription at any time through your dashboard settings.</li>
              <li>If you cancel your subscription, your access to ReplyDesk will continue until the end of your current billing period.</li>
              <li>Your account will not be charged for the subsequent billing cycles once canceled.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">3. Refund Terms</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>No Refunds After Billing Starts:</strong> Once a billing cycle has started and you have been charged, we do not offer refunds for that billing cycle.</li>
              <li><strong>No Pro-rated Refunds:</strong> We do not offer pro-rated refunds for unused time if you cancel your subscription in the middle of a billing cycle.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">4. Exceptions</h2>
            <p>We may issue a refund only under the following exceptional circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A <strong>duplicate charge</strong> was made due to a payment gateway error.</li>
              <li>A <strong>technical error on our end</strong> severely prevented you from using the service for an extended period.</li>
            </ul>
            <p>
              To request an exception, you must contact us at <a href="mailto:support@replydesk.in" className="text-rc-accent hover:underline">support@replydesk.in</a> within <strong>7 days</strong> of the disputed charge.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-rc-text">5. Contact Us</h2>
            <p>If you have any questions or concerns regarding billing or refunds, please contact our support team:</p>
            <div className="bg-rc-card/30 border border-rc-border p-4 rounded-xl space-y-1">
              <p className="font-semibold text-rc-text">ReplyDesk Support</p>
              <p>Email: <a href="mailto:support@replydesk.in" className="text-rc-accent hover:underline">support@replydesk.in</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
