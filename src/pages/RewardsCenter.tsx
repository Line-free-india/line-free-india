import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import BackButton from '../components/BackButton';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { motion } from 'framer-motion';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  type: 'discount' | 'freebie' | 'upgrade';
}

const AVAILABLE_REWARDS: Reward[] = [
  {
    id: '1',
    title: '10% Off Next Visit',
    description: 'Get 10% discount on your next booking',
    points: 100,
    icon: '🎫',
    type: 'discount'
  },
  {
    id: '2',
    title: 'Free Hair Wash',
    description: 'Complimentary hair wash with any service',
    points: 150,
    icon: '💆',
    type: 'freebie'
  },
  {
    id: '3',
    title: '20% Off Next Visit',
    description: 'Get 20% discount on your next booking',
    points: 200,
    icon: '🎁',
    type: 'discount'
  },
  {
    id: '4',
    title: 'Priority Booking',
    description: 'Skip the queue for your next visit',
    points: 250,
    icon: '⚡',
    type: 'upgrade'
  },
  {
    id: '5',
    title: 'Free Beard Trim',
    description: 'Complimentary beard trim service',
    points: 180,
    icon: '✂️',
    type: 'freebie'
  },
  {
    id: '6',
    title: '30% Off Next Visit',
    description: 'Get 30% discount on your next booking',
    points: 300,
    icon: '🏆',
    type: 'discount'
  }
];

export default function RewardsCenter() {
  const { customerProfile } = useApp();
  const nav = useNavigate();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const userPoints = customerProfile?.loyaltyPoints || 0;
  const currentStreak = customerProfile?.currentStreak || 0;

  const handleRedeem = (reward: Reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
      setShowRedeemModal(true);
    }
  };

  const confirmRedeem = () => {
    // TODO: Implement actual redemption logic
    alert(`Redeemed: ${selectedReward?.title}`);
    setShowRedeemModal(false);
    setSelectedReward(null);
  };

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-bg border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <BackButton to="/customer/home" />
            <h1 className="text-xl font-bold text-text">Rewards</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Points Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Your Balance</p>
                <p className="text-4xl font-bold text-amber-700 dark:text-amber-300">{userPoints}</p>
              </div>
              <div className="text-5xl">🏆</div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
              <div>
                <p className="text-xs text-text-dim mb-0.5">Current Streak</p>
                <p className="text-lg font-bold text-text">{currentStreak} days 🔥</p>
              </div>
              <button 
                onClick={() => nav('/customer/home')}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-sm font-semibold transition-colors"
              >
                Earn More
              </button>
            </div>
          </motion.div>

          {/* How to Earn Points */}
          <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-bold text-text mb-3">💡 How to Earn Points</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base flex-shrink-0">🎫</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text">Complete Visit</p>
                  <p className="text-xs text-text-dim">+50 points</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-base flex-shrink-0">⭐</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text">Leave Review</p>
                  <p className="text-xs text-text-dim">+25 points</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-base flex-shrink-0">🔥</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text">Daily Streak</p>
                  <p className="text-xs text-text-dim">+10 points/day</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-base flex-shrink-0">👥</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text">Refer Friend</p>
                  <p className="text-xs text-text-dim">+100 points</p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Rewards */}
          <div>
            <h2 className="text-base font-bold text-text mb-3">🎁 Available Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_REWARDS.map((reward, index) => {
                const canAfford = userPoints >= reward.points;
                return (
                  <motion.button
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => canAfford && handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      canAfford
                        ? 'bg-card border-border hover:border-primary/40 hover:shadow-md active:scale-[0.98]'
                        : 'bg-card/50 border-border opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-card-2 flex items-center justify-center text-2xl flex-shrink-0">
                        {reward.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-text mb-0.5 line-clamp-1">{reward.title}</p>
                        <p className="text-xs text-text-dim mb-2 line-clamp-1">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 text-base">💎</span>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{reward.points} pts</span>
                          </div>
                          {canAfford ? (
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                              Redeem
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-card-2 text-text-dim text-xs font-bold">
                              Need {reward.points - userPoints}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Redeem Confirmation Modal */}
        {showRedeemModal && selectedReward && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
                  {selectedReward.icon}
                </div>
                <h3 className="text-lg font-bold text-text mb-2">Redeem Reward?</h3>
                <p className="text-sm text-text-dim mb-4">{selectedReward.title}</p>
                <div className="p-4 rounded-xl bg-card-2 border border-border">
                  <p className="text-xs text-text-dim mb-1">Cost</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedReward.points} points</p>
                  <p className="text-xs text-text-dim mt-2">
                    Remaining: {userPoints - selectedReward.points} points
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-card-2 border border-border text-text font-semibold hover:bg-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedeem}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
}
