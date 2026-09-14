import BackButton from '../components/BackButton';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { RefreshCw, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text pb-20 px-5 app-header-safe animate-fadeIn">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BackButton to={-1} />
            <div>
              <h1 className="text-2xl font-black tracking-tight">Refund &amp; Cancellation Policy</h1>
              <p className="text-xs text-text-dim mt-0.5">Last updated: September 2026 | Line Free India</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm text-sm leading-relaxed text-text-dim">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                1. Overview &amp; Purpose
              </h2>
              <p>
                At <strong>Line Free India</strong>, we strive to provide transparent, fair, and seamless digital token booking and queue management services. This policy outlines how cancellations, rescheduled appointments, and fee refunds are handled when using our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                2. Token &amp; Appointment Cancellation
              </h2>
              <div className="space-y-3">
                <div className="p-4 bg-background/60 rounded-2xl border border-border/50">
                  <p className="font-bold text-text text-xs uppercase tracking-wider mb-1">A. Customer-Initiated Cancellation</p>
                  <p className="text-xs">
                    Customers can cancel their token booking directly via the app at any time <strong>before their turn is called or served</strong>. If a nominal convenience fee or pre-service advance was charged, 100% of the refundable amount will be automatically initiated to the original payment source.
                  </p>
                </div>
                <div className="p-4 bg-background/60 rounded-2xl border border-border/50">
                  <p className="font-bold text-text text-xs uppercase tracking-wider mb-1">B. Business-Initiated Cancellation or Closure</p>
                  <p className="text-xs">
                    In rare events where a salon, hospital, clinic, or counter is forced to close unexpectedly (due to emergency or power outage), all active waiting tokens for that day will be cancelled and any prepaid fees will be refunded in full automatically.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                3. Refund Processing Timelines
              </h2>
              <p>
                All approved refunds are processed immediately by our automated payment system. Funds will reflect in your source account depending on the mode of payment:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li><strong>UPI (Google Pay, PhonePe, Paytm, BHIM):</strong> Instant to 24 hours.</li>
                <li><strong>Net Banking &amp; Debit Cards:</strong> 2 to 5 business days.</li>
                <li><strong>Credit Cards:</strong> 5 to 7 business days (depending on the issuing bank).</li>
                <li><strong>LineFree Coins / Wallet:</strong> Instant credit to in-app wallet balance.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                4. Non-Refundable Scenarios
              </h2>
              <p>Refunds will not be applicable under the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>If the customer was called to the counter/chair, did not show up within the grace period (5 mins), and marked as completed/no-show.</li>
                <li>After the requested service has been successfully fulfilled by the business merchant.</li>
                <li>Platform subscription fees for merchants once the active billing cycle has commenced.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                5. Dispute Resolution &amp; Support
              </h2>
              <p>
                If you encountered a failed transaction where money was deducted but no token was generated, our system initiates an auto-reversal within 24 hours. For further assistance:
              </p>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs space-y-1">
                <p><strong>Email Support:</strong> support@linefree.in</p>
                <p><strong>Helpdesk Hours:</strong> Monday to Saturday, 9:00 AM – 7:00 PM IST</p>
                <p><strong>Grievance Officer:</strong> Satyam Kumar (grievance@linefree.in)</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
