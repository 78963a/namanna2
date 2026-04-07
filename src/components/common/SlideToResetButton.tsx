/**
 * @file SlideToResetButton.tsx
 * @description A slide-to-confirm style button used for resetting routine states.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface SlideToResetButtonProps {
  /** Callback function triggered when the slider reaches the threshold. */
  onReset: () => void;
}

/**
 * SlideToResetButton provides a deliberate action to reset a routine, preventing accidental clicks.
 */
export const SlideToResetButton = ({ onReset }: SlideToResetButtonProps) => {
  const [x, setX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleDrag = (_: any, info: any) => {
    if (isResetting) return;
    setX(info.point.x);
    const containerWidth = containerRef.current?.offsetWidth || 0;
    
    // If dragged more than 80% of the container width, trigger reset
    if (info.point.x > containerWidth * 0.8) {
      setIsResetting(true);
      onReset();
      setX(0);
      setTimeout(() => setIsResetting(false), 1000);
    }
  };

  return (
    <div ref={containerRef} className="relative w-32 h-8 bg-white/10 rounded-full overflow-hidden border border-white/10">
      <div className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Slide to Reset</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={() => setX(0)}
        animate={{ x: isResetting ? 100 : 0 }}
        className="absolute top-1 left-1 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center backdrop-blur-md border border-white/20"
      >
        <RotateCcw className="w-3 h-3 text-white" />
      </motion.div>
    </div>
  );
};
