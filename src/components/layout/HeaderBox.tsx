import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar } from 'lucide-react';
import { UserData } from '../../types';
import { isTaskScheduledToday } from '../../utils';

interface HeaderBoxProps {
  userData: UserData;
  todayStr: string;
  formattedDate: string;
  weather: { icon: React.ReactNode; temp: number } | null;
  challengeDays: number;
  successDays: number;
  currentTime: Date;
}

/**
 * The header section of the home view, displaying user stats, weather, and current date.
 * 
 * @param {HeaderBoxProps} props - Component properties
 * @returns {JSX.Element} The rendered header box
 */
export const HeaderBox: React.FC<HeaderBoxProps> = ({
  userData,
  todayStr,
  formattedDate,
  weather,
  challengeDays,
  successDays,
  currentTime
}) => {
  const todayPoints = userData.dailyPoints[todayStr] || 0;
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
      const score = userData.dailyCompletionRate[dStr] || 0;
      const dayOfWeek = weekDays[d.getDay()];
      days.push({ date: dStr, score, dayOfWeek });
    }
    return days;
  }, [userData.dailyCompletionRate, currentTime]);

  return (
    <section className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-2">
      <div className="flex justify-between items-start">
        <div className="text-left space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-black text-slate-900 tracking-tight">{formattedDate}</p>
            {weather && (
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-100">
                {weather.icon}
                <span className="text-xs font-bold text-slate-600">{weather.temp}°</span>
              </div>
            )}
          </div>
          {/* Mobile-only time display */}
          <p className="text-lg font-black text-slate-900 tabular-nums leading-none md:hidden">
            {`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
          </p>
          <div className="text-indigo-600 font-black text-sm leading-tight">
            {challengeDays}일째 도전중 • {successDays}일째 성공중
          </div>
          <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-500" />
            오늘의 성취: <span className="text-slate-900">{completionPercentage.toFixed(1)}%</span> / <span className="text-slate-900">{todayPoints.toLocaleString()}P</span>
          </div>
        </div>
        {/* Desktop-only time display */}
        <div className="text-right space-y-1 hidden md:block">
          <p className="text-lg font-black text-slate-900 tabular-nums leading-none">
            {`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
          </p>
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
                className={`w-5 h-5 rounded-[4px] ${color} transition-all flex items-center justify-center`}
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
