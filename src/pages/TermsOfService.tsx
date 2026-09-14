import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function TermsOfService() {
  const nav = useNavigate();

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text pb-20 px-5 app-header-safe animate-fadeIn">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BackButton to={-1} />
            <div>
              <h1 className="text-2xl font-black tracking-tight">Terms of Service</h1>
              <p className="text-xs text-text-dim mt-0.5">Last updated: September 2026 • Line Free India Operating System</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm text-sm leading-relaxed text-text-dim">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>⚖️</span> 1. Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>Line Free India</strong> ("Platform", "we", "us", or "our"). By accessing or using our mobile application, web portal, QR token booking interfaces, and merchant software, you ("User", "Customer", or "Merchant Partner") agree to be bound by these Terms of Service, all applicable laws and regulations of India, including the Information Technology Act, 2000, and rules framed thereunder.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🎫</span> 2. Virtual Queuing &amp; Token System
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Live Token Generation:</strong> Tokens issued via QR scan or online booking represent a real-time queue position. Estimated wait times are dynamically calculated algorithms and may fluctuate based on walk-ins, service complexity, or staff availability.</li>
                <li><strong>Arrival Grace Period:</strong> Customers are expected to report to the merchant location within 10 minutes of their token being announced or marked "Serving". Failure to arrive may result in token cancellation or bump to the end of the line.</li>
                <li><strong>Fair Use Policy:</strong> Customers may not hold more than two active tokens across conflicting categories simultaneously. Spamming tokens will result in automated rate-limiting.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🏪</span> 3. Merchant &amp; Business Partner Obligations
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Accuracy of Information:</strong> Businesses must maintain accurate pricing, service durations, working hours, and operational status (Open/Break/Closed).</li>
                <li><strong>Direct Settlements:</strong> Line Free India is a queue facilitation technology provider. Any peer-to-peer UPI payments or in-store transactions take place directly between the customer and merchant without platform commission deduction on peer settlements unless explicitly subscribed to integrated payment gateway features.</li>
                <li><strong>Customer Service:</strong> Merchants agree to treat virtual queue holders with equal priority as physical walk-in customers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🔔</span> 4. Communications &amp; Notifications
              </h2>
              <p>
                By creating an account or reserving a token, you consent to receive queue updates, token status announcements, reminders, and verification codes via Push Notifications, SMS, and WhatsApp messaging. You may toggle non-essential notification preferences at any time from your settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>💳</span> 5. Subscriptions &amp; Cancellations
              </h2>
              <p>
                Merchant premium tools and promotional tiers are billed on a recurring monthly or annual basis. Subscriptions can be managed or cancelled from the Business Subscription dashboard. Refunds for partial billing cycles are evaluated on a case-by-case basis as detailed in our refund policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🛡️</span> 6. Limitation of Liability
              </h2>
              <p>
                Line Free India does not employ salon staff, healthcare professionals, therapists, or technicians. We do not warranty the quality, safety, or legality of services rendered by independent business partners. Our liability is limited strictly to the fees paid by you for platform software usage in the preceding 30 days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🏛️</span> 7. Governing Law &amp; Dispute Resolution
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India. Any legal dispute, controversy, or claim shall be subject to the exclusive jurisdiction of the competent courts in Patna, Bihar, India.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>📬</span> 8. Contact &amp; Grievance Redressal
              </h2>
              <p>
                For questions regarding these Terms or to reach our Grievance Officer, please email:
              </p>
              <div className="p-4 bg-background rounded-2xl border border-border/70 font-mono text-xs text-text">
                <p>Email: <strong>support@linefreeindia.com</strong></p>
                <p className="mt-1">Operational Support: Patna, Bihar, India</p>
                <p className="mt-1 text-primary font-bold">Line Free India • Zero Wait Time Revolution</p>
              </div>
            </section>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => nav(-1)}
              className="px-8 py-3.5 rounded-2xl bg-primary text-white font-black text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
