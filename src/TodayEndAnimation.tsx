import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, Star } from 'lucide-react';
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
      // 재생할 효과음 설정 가져오기 (가장 기분 좋은 레벨업/팬파레 소리 선택 가능)
      const allGroupsCompleteConfig = soundSettings?.allGroupsComplete;
      const allGroupsCompleteEnabled = allGroupsCompleteConfig ? allGroupsCompleteConfig.enabled : true;
      const allGroupsCompleteFile = allGroupsCompleteConfig?.file || '/sounds/freesound_community-piglevelwin2mp3-14800.mp3';

      soundService.refresh(allGroupsCompleteFile);
      soundService.unlock();
      soundService.play(allGroupsCompleteFile, isSoundEnabled && allGroupsCompleteEnabled);

      // 콘페티(폭죽 효과) 실행
      triggerCelebrationConfetti();
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
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-slate-900/85 backdrop-blur-md cursor-pointer touch-none"
      onClick={() => {
        soundService.unlock();
        onClose();
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.05, 1],
                rotate: [10, -5, 0],
                opacity: 1
              }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="bg-white/95 backdrop-blur-2xl p-8 md:p-12 rounded-[40px] border-4 border-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.5)] text-center transform-gpu max-w-md w-full relative"
            >
              <div className="flex justify-center mb-6 relative">
                {/* 배경 아우라 반짝임 효과 */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.25, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 25, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full w-32 h-32 mx-auto"
                />
                
                {/* Goal 아이콘 반짝이 애니메이션 */}
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="p-5 bg-indigo-50 rounded-[28px] border border-indigo-100 shadow-inner inline-flex"
                >
                  <Goal className="w-16 h-16 text-indigo-600 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                </motion.div>
              </div>

              {/* 기상 일자 및 시각 헤더 */}
              <div className="text-xs md:text-sm font-black text-indigo-500 mb-2 uppercase tracking-widest opacity-90">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  weekday: 'long' 
                })}
              </div>

              {/* You did great! display typography */}
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                You did great!
              </h1>

              {/* 오늘 하루도 수고하셨어요 */}
              <p className="text-lg md:text-xl font-bold text-slate-700 leading-tight">
                오늘 하루도 수고하셨어요
              </p>

              {/* 보조 주석 설명글 (오늘은 건너뛰기를 반영한 조금 덜 완벽해도 가치있는 마침표) */}

              {/* 하단 점수/별 장식 */}
              <div className="mt-6 flex gap-2.5 justify-center">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -8, 0],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Star className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
