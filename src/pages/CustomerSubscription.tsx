import { useApp } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import BackButton from '../components/BackButton';
import ResponsiveContainer from '../components/ResponsiveContainer';

const UPI_ID = 'kumarsatyam9378@okhdfcbank';

export default function CustomerSubscription() {
  const { customerProfile, t } = useApp();

  const plans = [
    {
      id: 'basic_monthly',
      name: 'Basic Monthly',
      price: 11,
      period: '/month',
      features: ['Wait time alerts', 'Favorite salons notifications', 'Priority support'],
      icon: '🌟',
    },
    {
      id: 'basic_yearly',
      name: 'Basic Yearly',
      price: 111,
      period: '/year',
      features: ['Wait time alerts', 'Favorite salons notifications', 'Priority support', 'Save ₹21/year'],
      badge: 'Best Value',
      icon: '💎',
    },
    {
      id: 'adv_monthly',
      name: 'Advance Monthly',
      price: 29,
      period: '/month',
      features: ['All Basic features', 'Advance booking', '30min call alert', '10min call reminder'],
      icon: '🚀',
    },
    {
      id: 'adv_yearly',
      name: 'Advance Yearly',
      price: 249,
      period: '/year',
      features: ['All Basic features', 'Advance booking', '30min call alert', '10min call reminder', 'Save ₹99/year'],
      badge: 'Popular 🔥',
      icon: '👑',
    },
  ];

  const handleSubscribe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent('LineFree')}&tn=${encodeURIComponent(`LineFree Customer Subscription - ${plan.name}`)}&am=${plan.price}&cu=INR`;
    window.location.href = upiUrl;
  };

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen pb-40 animate-fadeIn">
      <div className="p-6">
        <BackButton to="/customer/home" />
        <h1 className="text-2xl font-bold mb-1">{t('sub.customer.title')}</h1>
        <p className="text-text-dim text-sm mb-5">Unlock premium features for a better experience</p>

        {customerProfile?.subscription && (
          <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 mb-5 flex items-center gap-3">
            <span className="text-2xl animate-float">👑</span>
            <div>
              <p className="text-gold font-bold">Active Subscription</p>
              <p className="text-sm text-text-dim">{customerProfile.subscription}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {plans.map((plan, i) => (
            <div key={plan.id} className={`p-5 rounded-2xl border relative overflow-hidden animate-fadeIn ${
              plan.badge ? 'premium-card border-primary' : 'bg-card border-border'
            }`} style={{ animationDelay: `${i * 0.1}s` }}>
              {plan.badge && (
                <span className="absolute -top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-primary text-white text-xs font-bold">
                  {plan.badge}
                </span>
              )}
              
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{plan.icon}</span>
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold gradient-text">₹{plan.price}</span>
                    <span className="text-text-dim text-sm">{plan.period}</span>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-sm text-text-dim flex items-center gap-2">
                    <span className="text-success text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <button onClick={() => handleSubscribe(plan.id)} className={plan.badge ? 'btn-primary text-sm py-3' : 'btn-secondary text-sm py-3'}>
                💳 Subscribe via UPI
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-5 p-4 rounded-xl glass-card text-center">
          <p className="text-text-dim text-xs mb-1">Payment via UPI — Opens your payment app</p>
          <p className="font-mono text-sm text-primary">{UPI_ID}</p>
          <p className="text-text-dim text-xs mt-2">GPay • PhonePe • Paytm • BHIM & more</p>
        </div>
      </div>
      <BottomNav />
    </div>
    </ResponsiveContainer>
  );
}
