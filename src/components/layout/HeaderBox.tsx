import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { UserData } from '../../types';
import { isTaskScheduledToday } from '../../utils';

interface HeaderBoxProps {
  userData: UserData;
  todayStr: string;
  formattedDate: string;
  challengeDays: number;
  successDays: number;
  currentTime: Date;
}

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
  currentTime
}) => {
  const totalCompleted = userData.routineChunks.reduce((acc, chunk) => 
    acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData) && t.completed).length, 0
  );
  const totalScheduledTasksCount = userData.routineChunks.reduce((acc, chunk) => 
    acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData)).length, 0
  );
  const completionPercentage = totalScheduledTasksCount > 0 
    ? Number(((totalCompleted / totalScheduledTasksCount) * 100).toFixed(1)) 
    : 0;

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
                {challengeDays}일째 도전중, {successDays}일째 성공중 ({completionPercentage}%)
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
    </section>
  );
};
