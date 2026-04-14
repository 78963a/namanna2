import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Zap, CheckCircle2 } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  type: 'check-in' | 'task-complete' | 'routine-complete';
  title: string;
  subtitle?: string;
}

/**
 * A modal to celebrate user achievements like checking in or completing tasks.
 * 
 * @param {CelebrationModalProps} props - Component properties
 * @returns {JSX.Element} The rendered celebration modal
 */
export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  type,
  title,
  subtitle
}) => {
  const getIcon = () => {
    switch (type) {
      case 'check-in': return <Star className="w-12 h-12 text-amber-500 fill-amber-500" />;
      case 'task-complete': return <Zap className="w-12 h-12 text-indigo-500 fill-indigo-500" />;
      case 'routine-complete': return <CheckCircle2 className="w-12 h-12 text-emerald-500 fill-emerald-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="bg-white/90 backdrop-blur-xl rounded-[10px] p-8 shadow-2xl border border-white/50 text-center space-y-4 max-w-xs w-full pointer-events-auto"
          >
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              className="flex justify-center"
            >
              {getIcon()}
            </motion.div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">{title}</h3>
              {subtitle && <p className="text-slate-500 font-bold">{subtitle}</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
