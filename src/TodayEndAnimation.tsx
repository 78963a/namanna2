import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from './services/soundService';
import { SoundEffectSettings } from './types';

interface TodayEndAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled?: boolean;
  soundSettings?: SoundEffectSettings;
}

export const TodayEndAnimation: React.FC<TodayEndAnimationProps> = ({
  isOpen,
  onClose,
  isSoundEnabled,
  soundSettings
}) => {
  useEffect(() => {
    if (isOpen) {
      // 재생할 효과음 설정 가져오기 (디폴트는 Level Win)
      const allGroupsCompleteConfig = soundSettings?.allGroupsComplete;
      const allGroupsCompleteEnabled = allGroupsCompleteConfig ? allGroupsCompleteConfig.enabled : true;
      const allGroupsCompleteFile = allGroupsCompleteConfig?.file || '/sounds/freesound_community-piglevelwin2mp3-14800.mp3';

      soundService.refresh(allGroupsCompleteFile);
      soundService.unlock();
      soundService.play(allGroupsCompleteFile, isSoundEnabled && allGroupsCompleteEnabled);

      // 콘페티(폭죽 효과) 실행
      triggerCelebrationConfetti();

      // 기상 체크인처럼 일정 시간 뒤 자동으로 닫히도록 설정 (3.5초 후 자동 종료)
      const timer = setTimeout(() => {
        onClose();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const triggerCelebrationConfetti = () => {
    if (typeof confetti !== 'function') return;
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.45 },
        colors: ['#6366f1', '#4f46e5', '#3b82f6', '#a855f7', '#fbbf24']
      });
    } catch (e) {
      console.warn('Confetti failed:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999] bg-indigo-600/10 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [20, -10, 0]
            }}
            transition={{ duration: 0.6, ease: "backOut" }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              {/* 반짝이는 배경 아우라 */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  scale: { duration: 2, repeat: Infinity },
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
                className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full"
              />
              {/* Star 아이콘 */}
              <Star className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.8)] relative z-10" />
            </div>

            {/* 메인 텍스트 Great! */}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black text-red-600 mt-8 drop-shadow-sm uppercase tracking-tight"
            >
              Great!
            </motion.h2>

            {/* 서브 텍스트 오늘 하루도 수고하셨어요! */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-indigo-800 mt-2 text-center"
            >
              오늘 하루도 수고하셨어요!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
