import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Tailwind palette hex codes
export const TIMEBAR_COLORS = {
  base: '#e2e8f0',           // Slate 200: Default gray (future or unpassed)
  past: '#1e293b',           // Slate 800: Elapsed time in the past
  active: '#fbbf24',         // Amber 400: App active, but no timer running
  routine: '#f97316',        // Orange 500: Background timer running
  activeRoutine: '#ef4444'   // Red 500: App active + timer running
};

export interface TimeBarProps {
  activityLog?: number[];
  heightClass?: string;        // e.g. "h-2" or "h-3"
  className?: string;          // container additional classes
  showDuration?: boolean;
  totalMinutes?: number;
  durationColorClass?: string;  // custom text color class for the duration text
  title?: string;
}

/**
 * Generates CSS linear-gradient string for TimeBar from 1440-length activity array.
 * Each index represents one minute of the 24-hour day (1440 minutes).
 */
export function generateTimeBarGradient(activityLog?: number[]): string {
  if (!activityLog || activityLog.length === 0) return '';
  const stops: string[] = [];
  let start = 0;
  let currentColor = activityLog[0];
  
  const colorList = [
    TIMEBAR_COLORS.base,
    TIMEBAR_COLORS.past,
    TIMEBAR_COLORS.active,
    TIMEBAR_COLORS.routine,
    TIMEBAR_COLORS.activeRoutine
  ];

  for (let i = 1; i <= activityLog.length; i++) {
    const val = i < activityLog.length ? activityLog[i] : -1;
    if (val !== currentColor) {
      const colorCode = colorList[currentColor] || TIMEBAR_COLORS.base;
      const startPct = (start / 1440) * 100;
      const endPct = (i / 1440) * 100;
      stops.push(`${colorCode} ${startPct}% ${endPct}%`);
      start = i;
      currentColor = val;
    }
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/**
 * Independent TimeBar component for displaying daily active timeline gradients.
 */
export const TimeBar: React.FC<TimeBarProps> = ({
  activityLog,
  heightClass = 'h-2',
  className = '',
  showDuration = false,
  totalMinutes,
  durationColorClass = 'text-red-500 text-[12px]',
  title
}) => {
  const { t } = useTranslation();
  
  const gradient = useMemo(() => {
    return generateTimeBarGradient(activityLog);
  }, [activityLog]);

  return (
    <div className={`flex items-center gap-4 ${className}`} id="time-bar-container">
      <div className={`flex-grow ${heightClass} bg-slate-100 rounded-full overflow-hidden relative shadow-inner`}>
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{ backgroundImage: gradient }}
          title={title}
          id="time-bar-gradient-fill"
        />
      </div>
      {showDuration && totalMinutes !== undefined && (
        <div className={`font-black tabular-nums transition-colors whitespace-nowrap ${durationColorClass}`} id="time-bar-duration-label">
          {t('home.minutes', { minutes: totalMinutes })}
        </div>
      )}
    </div>
  );
};
