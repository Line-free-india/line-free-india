import { motion } from 'framer-motion';

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  accentColor?: string;
}

export default function StepProgress({ steps, currentStep, accentColor = 'var(--color-primary)' }: StepProgressProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-initial">
          {/* Step circle */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{
                scale: i === currentStep ? [1, 1.15, 1] : 1,
                boxShadow: i <= currentStep ? `0 0 12px ${accentColor}40` : 'none',
              }}
              transition={{ duration: 1.5, repeat: i === currentStep ? Infinity : 0 }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all"
              style={{
                background: i <= currentStep ? accentColor : 'transparent',
                borderColor: i <= currentStep ? accentColor : 'rgba(255,255,255,0.15)',
                color: i <= currentStep ? 'white' : 'var(--color-text-dim)',
              }}
            >
              {i < currentStep ? '✓' : i + 1}
            </motion.div>
            <span className="text-xs font-medium text-center max-w-[60px] leading-tight" style={{ color: i <= currentStep ? accentColor : 'var(--color-text-dim)' }}>
              {step}
            </span>
          </div>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="flex-1 h-[2px] mx-1 relative overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                animate={{ width: i < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: accentColor }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
