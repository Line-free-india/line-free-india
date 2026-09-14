import { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedCounter from '../components/AnimatedCounter';

/**
 * Feature #51: Wallet System with Auto-Reload
 * In-app wallet with balance, transactions, and top-up
 */

export default function Wallet() {
  const [showTopUp, setShowTopUp] = useState(false);
  const [balance] = useState(2450);

  const transactions = [
    { id: '1', type: 'credit', amount: 500, desc: 'Wallet Top-Up', date: '8 Apr', icon: '💳' },
    { id: '2', type: 'debit', amount: 350, desc: 'Haircut at Style Studio', date: '7 Apr', icon: '✂️' },
    { id: '3', type: 'credit', amount: 100, desc: 'Referral Bonus', date: '6 Apr', icon: '🎁' },
    { id: '4', type: 'debit', amount: 200, desc: 'Beard Trim at GroomX', date: '5 Apr', icon: '💇' },
    { id: '5', type: 'credit', amount: 2000, desc: 'Wallet Top-Up', date: '4 Apr', icon: '💳' },
    { id: '6', type: 'debit', amount: 600, desc: 'Facial at GlowUp Spa', date: '3 Apr', icon: '🧖' },
  ];

  const topUpAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen pb-24 gradient-mesh-customer">
      <AnimatedBackground variant="customer" />

      <div className="p-4 flex items-center gap-3">
        <BackButton />
        <h1 className="type-heading text-xl text-text">Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, #E11D48, #D946EF, #BE123C)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <p className="text-white/70 text-xs font-medium mb-1">Available Balance</p>
          <div className="flex items-baseline gap-1">
            <span className="text-white/80 text-lg">₹</span>
            <AnimatedCounter
              target={balance}
              variant="slot"
              className="text-4xl font-black text-white"
              duration={1.5}
            />
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowTopUp(!showTopUp)}
              className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold btn-haptic"
            >
              ➕ Add Money
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 text-sm font-semibold btn-haptic">
              📤 Send
            </button>
          </div>

          {/* Auto-reload badge */}
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-full py-1.5 px-3 w-fit">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/70 text-xs font-medium">Auto-reload at ₹200</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Top-Up */}
      {showTopUp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 mb-4"
        >
          <div className="glass-ultra rounded-2xl p-4">
            <h3 className="type-heading text-sm text-text mb-3">Quick Top-Up</h3>
            <div className="grid grid-cols-3 gap-2">
              {topUpAmounts.map((amt, i) => (
                <motion.button
                  key={amt}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="py-3 rounded-xl border-white/10 elite-glass text-text text-sm font-semibold btn-haptic hover:border-primary hover:bg-primary/10 transition-all spatial-card"
                >
                  ₹{amt.toLocaleString()}
                </motion.button>
              ))}
            </div>
            <button className="btn-primary btn-haptic mt-3 w-full">
              Proceed to Pay
            </button>
          </div>
        </motion.div>
      )}

      {/* Transactions */}
      <div className="px-4">
        <h3 className="type-heading text-sm text-text mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-ultra rounded-xl p-3.5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-card-2 flex items-center justify-center text-lg">
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{tx.desc}</p>
                <p className="text-xs text-text-dim">{tx.date}</p>
              </div>
              <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
