import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function PrivacyPolicy() {
  const nav = useNavigate();

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text pb-20 px-5 app-header-safe animate-fadeIn">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BackButton to={-1} />
            <div>
              <h1 className="text-2xl font-black tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-text-dim mt-0.5">Compliant with Digital Personal Data Protection (DPDP) Act, 2023 &amp; GDPR</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm text-sm leading-relaxed text-text-dim">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🛡️</span> 1. Our Commitment to Your Privacy
              </h2>
              <p>
                At <strong>Line Free India</strong>, we believe your time and your data are sacred. We collect and process only the minimal information required to manage queue tokens, estimate wait times, and provide seamless communication between customers and local businesses. <strong>We do not sell, rent, or trade your personal data to third-party data brokers or advertisers.</strong>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>📋</span> 2. Information We Collect
              </h2>
              <div className="space-y-2">
                <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                  <p className="font-bold text-text text-xs uppercase tracking-wider">A. Identity &amp; Contact Details</p>
                  <p className="text-xs mt-1">Full name, email address, and mobile phone number for authentication, token assignment, and live notifications.</p>
                </div>
                <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                  <p className="font-bold text-text text-xs uppercase tracking-wider">B. Location &amp; Proximity Data</p>
                  <p className="text-xs mt-1">Precise GPS coordinates (when permission is granted) or city/neighborhood information to compute real-time travel distance and queue arrival recommendations.</p>
                </div>
                <div className="p-3 bg-background/50 rounded-xl border border-border/50">
                  <p className="font-bold text-text text-xs uppercase tracking-wider">C. Business &amp; Merchant Data</p>
                  <p className="text-xs mt-1">Business name, operational hours, services, pricing, UPI ID for customer settlements, staff rosters, and store location.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>⚙️</span> 3. How Your Data is Used
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Issuing and managing live digital queue tokens with wait time forecasting.</li>
                <li>Transmitting real-time SMS, WhatsApp, and Push Notifications when your turn is next.</li>
                <li>Displaying nearby businesses based on user distance preferences.</li>
                <li>Assisting merchants with queue throughput, daily reporting, and CRM tools.</li>
                <li>Fraud prevention, spam mitigation, and platform security audits.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🔒</span> 4. Security &amp; Storage
              </h2>
              <p>
                Your data is stored in enterprise-grade, encrypted Google Firebase cloud infrastructure in compliance with industry ISO 27001 / SOC 2 standards. Authentication is secured using encrypted token sessions. We implement granular role-based security rules (Firestore Rules) restricting cross-tenant data access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🗑️</span> 5. Your Rights &amp; Data Erasure
              </h2>
              <p>
                Under the DPDP Act 2023 and GDPR, you retain full ownership of your data. You may:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Request access to all tokens, reviews, and visits recorded on your account.</li>
                <li>Update or modify your profile information at any time from the Profile tab.</li>
                <li>Request permanent account deletion and erasure of all associated personal records via the "Delete Account" option in your settings or by writing to privacy@linefreeindia.com.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span>🏛️</span> 6. Data Protection Officer (DPO)
              </h2>
              <p>
                If you have questions, grievances, or wish to exercise statutory privacy rights:
              </p>
              <div className="p-4 bg-background rounded-2xl border border-border/70 font-mono text-xs text-text">
                <p>Data Protection Officer: <strong>privacy@linefreeindia.com</strong></p>
                <p className="mt-1">Line Free India • Patna, Bihar, India</p>
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
