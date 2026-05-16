import React from 'react';
import { RoutineChunk, UserData, TaskStatus } from '../../types';
import { formatDate, isTaskScheduledToday } from '../../utils';

interface MonthlyHeatmapProps {
  chunk: RoutineChunk;
  userData: UserData;
  currentTime: Date;
  effectiveDate: Date;
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({
  chunk,
  userData,
  currentTime,
  effectiveDate,
}) => {
  // Get all dates for current month
  const year = effectiveDate.getFullYear();
  const month = effectiveDate.getMonth();
  const todayStr = formatDate(effectiveDate);

  const daysInMonth = 31; // Fixed 31 boxes as requested
  const actualDaysInMonth = new Date(year, month + 1, 0).getDate();

  const getDayData = (day: number) => {
    if (day > actualDaysInMonth) return { type: 'none' as const };

    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    
    // Future dates
    if (dateStr > todayStr) return { type: 'future' as const };

    // Check if scheduled
    const isScheduled = isTaskScheduledToday(chunk.tasks[0] || {} as any, chunk, date, userData) || chunk.scheduledDays.includes(date.getDay());
    // Wait, isTaskScheduledToday checks individual tasks. For group, we should use isChunkScheduledToday from utils.
    // Let's re-import or use common logic.
    const isChunkScheduled = chunk.scheduledDays.includes(date.getDay());
    
    // Check history
    const groupHistory = userData.routineGroupHistory?.find(h => h.date === dateStr && h.groupId === chunk.id);
    const tasksHistory = userData.taskHistory?.filter(h => h.date === dateStr && h.groupId === chunk.id) || [];
    
    const isManuallyInactivated = chunk.inactiveDates?.includes(dateStr) || groupHistory?.completionStatus === '비활성';
    
    if (isManuallyInactivated) {
      if (!isChunkScheduled) {
        return { type: 'weekly_inactive' as const }; // X
      } else {
        return { type: 'manually_skipped' as const }; // -
      }
    }

    if (!isChunkScheduled) {
        return { type: 'weekly_inactive' as const }; // X
    }

    // If scheduled but no history yet and not today, it's missed (0%)
    // If it's today and not started, it's also 0% or 'today' state.
    
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, date, userData));
    if (scheduledTasks.length === 0) {
        return { type: 'weekly_inactive' as const }; // Technically no tasks scheduled
    }

    const successCount = tasksHistory.filter(h => h.status === '완벽' || h.status === '완료').length;
    const rate = (successCount / scheduledTasks.length) * 100;

    return { type: 'record' as const, rate };
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => getDayData(i + 1));

  const getColorClass = (rate: number) => {
    if (rate >= 100) return 'bg-indigo-600';
    if (rate > 75) return 'bg-indigo-400';
    if (rate > 50) return 'bg-indigo-300';
    if (rate > 25) return 'bg-indigo-200';
    if (rate > 0) return 'bg-indigo-100';
    return 'bg-black/10';
  };

  return (
    <div className="flex items-center justify-between gap-[2px] w-full px-1 py-1.5">
      {days.map((day, idx) => {
        let content = null;
        let className = "flex-grow aspect-square rounded-[1.5px] flex items-center justify-center text-[7px] font-black underline-offset-1 leading-none transition-all";
        
        switch (day.type) {
          case 'none':
            className += " opacity-0";
            break;
          case 'future':
            className += " bg-white/10 border border-white/5";
            break;
          case 'weekly_inactive':
            className += " bg-black/5 text-slate-400/50";
            content = "X";
            break;
          case 'manually_skipped':
            className += " bg-black/5 text-slate-400/50";
            content = "-";
            break;
          case 'record':
            className += ` ${getColorClass(day.rate)}`;
            if (day.rate === 0) className += " text-slate-400/50";
            else if (day.rate < 50) className += " text-indigo-500";
            else className += " text-white shadow-[0_0_2px_rgba(255,255,255,0.2)]";
            break;
          default:
            className += " bg-black/5";
        }

        return (
          <div key={idx} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
};
