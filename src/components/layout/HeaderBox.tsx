import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { UserData, TaskStatus } from '../../types';
import { isTaskScheduledToday, calculateTaskDuration } from '../../utils';

interface HeaderBoxProps {
  userData: UserData;
  todayStr: string;
  formattedDate: string;
  challengeDays: number;
  successDays: number;
  currentTime: Date;
}

const COLORS = {
  base: '#e2e8f0',           // 기본 회색 (미지나감) - slate-200
  past: '#1e293b',           // 지나감 (검은색) - slate-800
  active: '#fbbf24',         // 접속중, 타이머X (노란색) - amber-400
  routine: '#f97316',        // 백그라운드, 타이머O (주황색) - orange-500
  'active-routine': '#ef4444' // 접속중, 타이머O (빨간색) - red-500
};

/**
 * The header section of the home view, displaying user stats, and current date.
 * 
 * @param {HeaderBoxProps} props - Component properties
 * @returns {JSX.Element} The rendered header box
 */
export const HeaderBox: React.FC<HeaderBoxProps> = ({
  userData,
  todayStr,
  formattedDate,
  challengeDays,
  successDays,
  currentTime,
  activityLog
}) => {
  const totalCompleted = userData.routineChunks.reduce((acc, chunk) => 
    acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData) && (t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT)).length, 0
  );
  const totalScheduledTasksCount = userData.routineChunks.reduce((acc, chunk) => 
    acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData)).length, 0
  );
  const completionPercentage = totalScheduledTasksCount > 0 
    ? Number(((totalCompleted / totalScheduledTasksCount) * 100).toFixed(1)) 
    : 0;

  // --- [합산시간 계산] ---
  const totalDurationSeconds = userData.routineChunks.reduce((acc, chunk) => {
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData));
    const chunkDuration = scheduledTasks.reduce((taskAcc, task) => {
      // 완료된 루틴은 기록된 duration을 사용, 진행 중이거나 일시정지된 루틴은 실시간 계산
      if (task.completed) {
        return taskAcc + (task.duration || 0);
      }
      return taskAcc + calculateTaskDuration(task, currentTime);
    }, 0);
    return acc + chunkDuration;
  }, 0);
  const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);

  const timeBarGradient = useMemo(() => {
    if (!activityLog || activityLog.length === 0) return '';
    const stops = [];
    let start = 0;
    let currentColor = activityLog[0];
    
    const colorList = [COLORS.base, COLORS.past, COLORS.active, COLORS.routine, COLORS['active-routine']];

    for (let i = 1; i <= activityLog.length; i++) {
      const val = i < activityLog.length ? activityLog[i] : -1;
      if (val !== currentColor) {
        const colorCode = colorList[currentColor] || COLORS.base;
        const startPct = (start / 1440) * 100;
        const endPct = (i / 1440) * 100;
        stops.push(`${colorCode} ${startPct}% ${endPct}%`);
        start = i;
        currentColor = val;
      }
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [activityLog]);

  const last7Days = useMemo(() => {
    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const score = (userData.dailyCompletionRate?.[dStr]) || 0;
      const dayOfWeek = weekDays[d.getDay()];
      days.push({ date: dStr, score, dayOfWeek });
    }
    return days;
  }, [userData.dailyCompletionRate, currentTime]);

  return (
    <section className="bg-white p-[15px] rounded-[10px] shadow-sm border border-slate-100 space-y-2">
      <div className="flex justify-between items-start">
        <div className="text-left space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-black text-slate-900 tracking-tight">{formattedDate}</p>
            <p className="text-lg font-black tabular-nums leading-none" style={{ color: '#993399' }}>
              {`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
            </p>
          </div>
          <div className="text-indigo-600 font-black text-sm leading-tight flex items-center gap-1">
              <span>
                {challengeDays}일째 도전중, {successDays}일째 성공중
               </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="flex gap-1">
          {last7Days.map((day) => {
            let color = 'bg-slate-100';
            let textColor = 'text-slate-400';
            if (day.score >= 100) { color = 'bg-indigo-600'; textColor = 'text-white'; }
            else if (day.score > 75) { color = 'bg-indigo-400'; textColor = 'text-white'; }
            else if (day.score > 50) { color = 'bg-indigo-300'; textColor = 'text-white'; }
            else if (day.score > 25) { color = 'bg-indigo-200'; textColor = 'text-indigo-700'; }
            else if (day.score > 0) { color = 'bg-indigo-100'; textColor = 'text-indigo-600'; }
            
            return (
              <div 
                key={day.date} 
                className={`w-5 h-5 rounded-[10px] ${color} transition-all flex items-center justify-center`}
                title={`${day.date}: ${day.score.toFixed(1)}%`}
              >
                <span className={`text-[9px] font-black ${textColor}`}>
                  {day.dayOfWeek}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전체달성률바 */}
      <div className="pt-3 border-t border-slate-50 space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
          <div className="text-l font-black text-slate-800 tabular-nums leading-none">
            {Math.round(completionPercentage)}<span className="text-xs text-slate-400 ml-0.5">% ({totalCompleted}/{totalScheduledTasksCount})</span> 
          </div>
        </div>
      </div>

      {/* TimeBar 컴포넌트 */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-4">
          <div 
            className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden"
            style={{ backgroundImage: timeBarGradient }}
          />
          <div 
            className="text-[12px] font-black tabular-nums transition-colors whitespace-nowrap"
            style={{ color: '#ff0033' }}
          >
            {totalDurationMinutes}분
          </div>
        </div>
      </div>
    </section>
  );
};
