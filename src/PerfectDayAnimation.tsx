import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Flower, Star } from 'lucide-react';

interface PerfectDayAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  completedGroups: { name: string, status: string }[];
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
  completedGroups
}) => {
  const [stage, setStage] = useState<'boxes' | 'flowers' | 'explosion' | 'text' | 'none'>('none');

  useEffect(() => {
    if (isOpen) {
      setStage('boxes');
      
      // Stage timer for flowers (Slower transition)
      const flowerTimer = setTimeout(() => setStage('flowers'), 2000);
      
      // Explosion timer (Slower transition)
      const explosionTimer = setTimeout(() => {
        setStage('explosion');
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
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-slate-900/80 backdrop-blur-md cursor-pointer"
      onClick={onClose}
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
                <div className="bg-white/95 backdrop-blur-2xl p-8 md:p-12 rounded-[40px] md:rounded-[50px] border-4 border-amber-400 shadow-[0_0_80px_rgba(251,191,36,0.6)] text-center transform-gpu max-w-[90vw]">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      rotate: [0, 8, -8, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl md:text-8xl mb-4 md:mb-6 flex justify-center"
                  >
                    🤩
                  </motion.div>
                  <div className="text-lg md:text-xl font-black text-indigo-500 mb-1 md:mb-2 uppercase tracking-wider whitespace-nowrap opacity-90">
                    {new Date().toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      weekday: 'long' 
                    })}
                  </div>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight whitespace-nowrap">
                    완벽한 하루!
                  </h1>
                  <p className="text-sm md:text-xl lg:text-xl font-black text-indigo-700 mt-2 md:mt-3 uppercase tracking-widest whitespace-nowrap">
                    모든 루틴을 완료했습니다!
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
