import { useState } from 'react';
import { useApp } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import BackButton from '../components/BackButton';
import PaymentModal from '../components/PaymentModal';

const UPI_ID = 'kumarsatyam9378@okhdfcbank';

export default function BarberSubscription() {
  const { isBusinessTrialActive, getBusinessTrialDaysLeft, isBusinessSubscribed, businessProfile, saveBusinessProfile, t } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  const trialDays = getBusinessTrialDaysLeft();
  const trialActive = isBusinessTrialActive();
  const subscribed = isBusinessSubscribed();

  const plans = [
    {
      id: 'barber_monthly',
      name: 'Monthly',
      price: 100,
      period: '/month',
      features: [
        'Unlimited tokens',
        'Queue management',
        'Customer analytics',
        'Break management',
        'Earnings dashboard',
        'Ratings & reviews',
      ],
    },
    {
      id: 'barber_yearly',
      name: 'Yearly',
      price: 1000,
      period: '/year',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Advanced analytics',
        'Custom salon page',
        'Save ₹200/year',
      ],
      badge: 'Best Value 🔥',
    },
  ];

  const handleSubscribe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen pb-40 animate-fadeIn">
      <div className="px-5 app-header-safe pb-8">
        <BackButton to="/barber/home" />
        <h1 className="text-2xl font-bold mb-1">{t('sub.barber.title')}</h1>
        <p className="text-text-dim text-sm mb-5">First month FREE! Then subscribe to continue.</p>

        {/* Subscribed Success Alert */}
        {subscribedSuccess && (
          <div className="p-4 rounded-2xl bg-success/15 border border-success/40 mb-5 flex items-center gap-3 animate-fadeIn">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-success font-bold text-sm">Subscription Activated!</p>
              <p className="text-xs text-text-dim">Thank you for subscribing to Line Free India. Your plan is now active.</p>
            </div>
          </div>
        )}

        {/* Trial Status */}
        {trialActive ? (
          <div className="p-4 rounded-2xl bg-success/10 border border-success/30 mb-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl animate-float">🎁</span>
              <div className="flex-1">
                <p className="text-success font-bold">{t('trial.active')}</p>
                <p className="text-sm text-text-dim">{trialDays} days remaining</p>
              </div>
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${(trialDays / 30) * 100}%` }} />
            </div>
            <p className="text-text-dim text-xs mt-2">
              You're enjoying all premium features for free! Subscribe before trial ends to avoid service interruption.
            </p>
          </div>
        ) : subscribed ? (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 mb-5 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-primary font-bold">Active Subscription</p>
              <p className="text-sm text-text-dim">Your subscription is active. Thank you!</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-danger font-bold">{t('trial.expired')}</p>
                <p className="text-sm text-text-dim">Your 1-month free trial has ended. Subscribe to continue using all features.</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-6">
          {plans.map(plan => (
            <div key={plan.id} className="uv-pack-container">
              {plan.badge && (
                <div className="uv-banner-container">
                  <div className="uv-banner">{plan.badge}</div>
                </div>
              )}
              
              <div className="uv-pack-header">
                <p className="uv-title">{plan.name}</p>
                <div className="uv-price-container">
                  <span className="uv-currency">₹</span>
                  <span className="uv-price">{plan.price}</span>
                  <span className="uv-period">{plan.period}</span>
                </div>
              </div>

              <ul className="uv-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="uv-feature-item">
                    <svg className="uv-check-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              
              <button onClick={() => handleSubscribe(plan.id)} className="uv-button">
                💳 SUBSCRIBE NOW
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-5 p-4 rounded-xl glass-card text-center">
          <p className="text-text-dim text-xs mb-1">Instant Activation with Cards, UPI & Netbanking</p>
          <p className="font-mono text-sm text-primary">{UPI_ID}</p>
          <p className="text-text-dim text-xs mt-2">Razorpay • GPay • PhonePe • Paytm • Cards</p>
        </div>

        {/* FAQ */}
        <div className="mt-5 space-y-3">
          <h3 className="font-semibold text-sm">📋 FAQ</h3>
          {[
            { q: 'What happens after my free trial?', a: 'After 1 month, subscribe at ₹100/month to continue managing your salon.' },
            { q: 'Can I cancel anytime?', a: 'Yes! No lock-in period. Cancel anytime.' },
            { q: 'What\'s included in the free trial?', a: 'All features — unlimited tokens, queue management, analytics, and more.' },
          ].map((faq, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border">
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-text-dim text-xs mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          amount={selectedPlan.price}
          businessName="Line Free India"
          salonId={businessProfile?.uid || 'platform_subscription'}
          description={`Business Subscription - ${selectedPlan.name}`}
          customerName={businessProfile?.businessName || 'Business Owner'}
          customerPhone={businessProfile?.phone || ''}
          upiId={UPI_ID}
          onSuccess={async () => {
            if (businessProfile) {
              await saveBusinessProfile({
                ...businessProfile,
                subscriptionPlan: selectedPlan.id,
                subscribedAt: Date.now(),
                isSubscribed: true,
                subscriptionStatus: 'active'
              });
            }
            setSubscribedSuccess(true);
            setSelectedPlan(null);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
