import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Flower, Star } from 'lucide-react';
import { soundService } from './services/soundService';
import { SoundEffectSettings } from './types';

interface PerfectDayAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  completedGroups: { name: string, status: string }[];
  isSoundEnabled?: boolean;
  soundSettings?: SoundEffectSettings;
}

const FLOWER_COLORS = [
  'text-rose-400', 'text-pink-400', 'text-fuchsia-400', 
  'text-purple-400', 'text-violet-400', 'text-indigo-400',
  'text-sky-400', 'text-emerald-400', 'text-amber-400'
];

/**
 * A grand animation for completing all scheduled routine groups in a day.
 */
export const PerfectDayAnimation: React.FC<PerfectDayAnimationProps> = ({
  isOpen,
  onClose,
  completedGroups,
  isSoundEnabled,
  soundSettings
}) => {
  const { t, i18n } = useTranslation();
  const [stage, setStage] = useState<'boxes' | 'flowers' | 'explosion' | 'text' | 'none'>('none');

  useEffect(() => {
    if (isOpen) {
      setStage('boxes');
      
      const groupCompleteConfig = soundSettings?.routineGroupComplete;
      const groupCompleteEnabled = groupCompleteConfig ? groupCompleteConfig.enabled : true;
      const groupCompleteFile = groupCompleteConfig?.file || '/sounds/dragon-studio-fireworks-02-419019.mp3';

      const allGroupsCompleteConfig = soundSettings?.allGroupsComplete;
      const allGroupsCompleteEnabled = allGroupsCompleteConfig ? allGroupsCompleteConfig.enabled : true;
      const allGroupsCompleteFile = allGroupsCompleteConfig?.file || '/sounds/freesound_community-piglevelwin2mp3-14800.mp3';

      // Refresh sounds to ensure they are ready after long period of inactivity
      soundService.refresh(groupCompleteFile);
      soundService.refresh(allGroupsCompleteFile);
      
      // Play initial celebration sound
      soundService.unlock();
      soundService.play(allGroupsCompleteFile, isSoundEnabled && allGroupsCompleteEnabled);

      // Stage timer for flowers (Slower transition)
      const flowerTimer = setTimeout(() => setStage('flowers'), 2000);
      
      // Explosion timer (Slower transition)
      const explosionTimer = setTimeout(() => {
        setStage('explosion');
        // Play fireworks sound for the giant confetti
        soundService.play(groupCompleteFile, isSoundEnabled && groupCompleteEnabled);
        triggerGiantConfetti();
      }, 4000);

      // Text timer (Slower transition)
      const textTimer = setTimeout(() => setStage('text'), 5500);

      return () => {
        clearTimeout(flowerTimer);
        clearTimeout(explosionTimer);
        clearTimeout(textTimer);
      };
    }
  }, [isOpen]);

  const triggerGiantConfetti = () => {
    if (typeof confetti !== 'function') return;

    try {
      const duration = 5 * 1000; // Confetti for longer
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 150, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 150 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.1 } });
      }, 250);
    } catch (e) {
      console.warn('Giant confetti failed:', e);
    }
  };

  if (!isOpen) return null;

  // Calculate grid-like positions to avoid overlap
  const boxPositions = completedGroups.map((_, i) => {
    const cols = completedGroups.length > 4 ? 3 : 2;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const xBase = (col - (cols - 1) / 2) * 220;
    const yBase = (row - (Math.ceil(completedGroups.length / cols) - 1) / 2) * 120;
    
    // Add jitter
    return {
      x: xBase + (Math.random() - 0.5) * 20,
      y: yBase + (Math.random() - 0.5) * 20,
      rotate: (Math.random() - 0.5) * 15
    };
  });

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-slate-900/80 backdrop-blur-md cursor-pointer touch-none"
      onClick={() => {
        soundService.unlock();
        onClose();
      }}
    >
      <AnimatePresence>
        {/* Step 1: Boxes flying in and piling up */}
        {(stage === 'boxes' || stage === 'flowers' || stage === 'explosion' || stage === 'text') && (
          <div className="relative w-full h-full flex items-center justify-center">
            {completedGroups.map((group, idx) => {
              const pos = boxPositions[idx];
              const angle = (idx * (360 / completedGroups.length));
              const distance = 1000;
              const xStart = Math.cos(angle * (Math.PI / 180)) * distance;
              const yStart = Math.sin(angle * (Math.PI / 180)) * distance;

              // Generate fixed random flower positions for this box
              const flowerSeeds = [...Array(Math.floor(Math.random() * 4) + 4)].map((_, fi) => ({
                id: fi,
                color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
                angle: Math.random() * 360,
                dist: Math.random() * 30 + 70,
                delay: 2 + idx * 0.1 + fi * 0.1
              }));

              return (
                <motion.div
                  key={idx}
                  initial={{ x: xStart, y: yStart, rotate: angle, scale: 0.5, opacity: 0 }}
                  animate={{ 
                    x: pos.x, 
                    y: pos.y, 
                    rotate: pos.rotate,
                    scale: 1, 
                    opacity: 1 
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 30,
                    damping: 15,
                    delay: idx * 0.2
                  }}
                  className="absolute p-6 bg-white border-4 border-indigo-500 rounded-[24px] shadow-2xl flex flex-col items-center justify-center min-w-[200px] z-10"
                >
                  {/* Decorative Flowers for this box */}
                  {stage !== 'boxes' && flowerSeeds.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        x: Math.cos(f.angle * (Math.PI / 180)) * f.dist,
                        y: Math.sin(f.angle * (Math.PI / 180)) * f.dist,
                        rotate: f.angle
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 50, 
                        delay: 0.2 + f.id * 0.1 
                      }}
                      className="absolute pointer-events-none"
                    >
                      <Flower className={`w-10 h-10 ${f.color} fill-current/10`} />
                    </motion.div>
                  ))}

                  <Sparkles className="w-8 h-8 text-amber-400 mb-2 relative z-10" />
                  <span className="text-xl font-black text-slate-800 relative z-10">{group.name}</span>
                  <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black relative z-10 ${
                    group.status === '완벽' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-indigo-500 text-white'
                  }`}>
                    {group.status}
                  </div>
                </motion.div>
              );
            })}

            {/* Step 3: Text and Star-struck emoji */}
            {stage === 'text' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, scaleZ: 0 }}
                animate={{ scale: 1, opacity: 1, scaleZ: 1 }}
                transition={{ duration: 1, type: "spring" }}
                className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
              >
                <div className="p-8 md:p-12 text-center transform-gpu max-w-[90vw]">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      rotate: [0, 8, -8, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl md:text-8xl mb-4 md:mb-6 flex justify-center">                

                    🤩
                  </motion.div>
                  <div className="text-lg md:text-xl font-black text-violet-100 mb-1 md:mb-2 uppercase tracking-wider whitespace-nowrap opacity-90"
                    style={{ textShadow: "-1px 0px indigo, 0px 1px indigo, 1px 0px indigo, 0px -1px indigo" }}
                  >
                    {new Date().toLocaleDateString(
                      i18n.language.startsWith('ja') ? 'ja-JP' : i18n.language.startsWith('en') ? 'en-US' : 'ko-KR', 
                      { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric', 
                        weekday: 'long' 
                      }
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-sky-400 tracking-tighter leading-tight whitespace-nowrap"
                   style={{ textShadow: "-1px 0px indigo, 0px 1px indigo, 1px 0px indigo, 0px -1px indigo" }}> 
                    {t('animation.perfectDayTitle')}
                  </h1>
                  <p className="text-sm md:text-xl lg:text-xl font-black text-blue-300 mt-2 md:mt-3 uppercase tracking-widest whitespace-nowrap"
                   style={{ textShadow: "-1px 0px indigo, 0px 1px indigo, 1px 0px indigo, 0px -1px indigo" }}>
                    {t('animation.perfectDaySub')}
                  </p>
                  
                  <div className="mt-8 flex gap-3 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          y: [0, -15, 0],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                      >
                        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
