import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  Target, 
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Timer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Hourglass,
  BrickWall
} from 'lucide-react';
import { UserData, TaskStatus, TaskType } from '../../types';
import { timeToMinutes, minutesToTime, formatDate, formatDurationPrecise } from '../../utils';

interface StatsViewProps {
  userData: UserData;
  currentTime: Date;
  deleteReview: (groupId: string, date: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  userData,
  currentTime,
  deleteReview
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(currentTime.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(currentTime.getMonth());
  const [selectedReview, setSelectedReview] = useState<{ date: string; note: string; satisfaction: number } | null>(null);

  // Scroll to top when entering detailed view
  useEffect(() => {
    if (selectedGroupId) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setCalendarYear(currentTime.getFullYear());
      setCalendarMonth(currentTime.getMonth());
    }
  }, [selectedGroupId]);

  const satisfactionIcons = ['🥵', '🥲', '😊', '😁', '🥳'];

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };
  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };
  const prevYear = () => setCalendarYear(calendarYear - 1);
  const nextYear = () => setCalendarYear(calendarYear + 1);

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarYear, calendarMonth, firstDayOfMonth, daysInMonth]);

  const todayStr = formatDate(currentTime);
  
  const getDateRangeStr = (days: string[]) => {
    if (days.length === 0) return '';
    const start = days[0].split('-').slice(1).join('.');
    const end = days[days.length - 1].split('-').slice(1).join('.');
    return `${start} ~ ${end}`;
  };

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - i);
      days.push(formatDate(d));
    }
    return days;
  }, [currentTime]);

  const last30Days = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - i);
      days.push(formatDate(d));
    }
    return days;
  }, [currentTime]);

  // --- Wake-up Stats ---
  const wakeUpStats = useMemo(() => {
    const history = userData.wakeUpTimeHistory || [];
    
    const getAvgForPeriod = (days: string[]) => {
      const periodHistory = days.map(date => {
        const entry = history.find(h => h.date === date);
        const isLate = entry ? timeToMinutes(entry.wakeUpTime) > timeToMinutes(userData.targetWakeUpTime) : false;
        return {
          date,
          time: entry?.wakeUpTime || null,
          status: entry ? (isLate ? '지각' : '달성') : '미기록'
        };
      });

      const recordedTimes = periodHistory.filter(h => h.time).map(h => timeToMinutes(h.time!));
      const avgMinutes = recordedTimes.length > 0 
        ? recordedTimes.reduce((a, b) => a + b, 0) / recordedTimes.length 
        : null;

      return {
        avgTime: avgMinutes !== null ? minutesToTime(avgMinutes) : 'N/A',
        history: periodHistory
      };
    };

    const stats7 = getAvgForPeriod(last7Days);
    const stats30 = getAvgForPeriod(last30Days);

    // Sort history with today at the top
    const sortedHistory7 = [...stats7.history].reverse();

    return {
      avgTime7: stats7.avgTime,
      avgTime30: stats30.avgTime,
      history: sortedHistory7
    };
  }, [userData.wakeUpTimeHistory, userData.targetWakeUpTime, last7Days, last30Days]);

  // --- Achievement Stats ---
  const achievementStats = useMemo(() => {
    const getAvgRateForPeriod = (days: string[]) => {
      const rates = days.map(date => (userData.dailyCompletionRate?.[date]) || 0);
      return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    };

    const avgRate7 = getAvgRateForPeriod(last7Days);
    const avgRate30 = getAvgRateForPeriod(last30Days);

    const groupStats = userData.routineChunks.map(group => {
      const groupHistory = (userData.routineGroupHistory || []).filter(h => h.groupId === group.id && last7Days.includes(h.date));
      
      const startTimes = groupHistory.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const avgStartMinutes = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      
      const endTimes = groupHistory.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const avgEndMinutes = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;

      const durations = groupHistory.map(h => h.totalDuration);
      const avgDurationSeconds = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      const completionCount = groupHistory.filter(h => h.completionStatus === '전체완료').length;
      const rate = groupHistory.length > 0 ? (completionCount / groupHistory.length) * 100 : 0;

      return {
        id: group.id,
        name: group.name,
        avgStartTime: avgStartMinutes !== null ? minutesToTime(avgStartMinutes) : 'N/A',
        avgEndTime: avgEndMinutes !== null ? minutesToTime(avgEndMinutes) : 'N/A',
        avgDuration: formatDurationPrecise(avgDurationSeconds),
        rate: Math.floor(rate).toString()
      };
    });

    return {
      avgTotalRate7: Math.floor(avgRate7).toString(),
      avgTotalRate30: Math.floor(avgRate30).toString(),
      groups: groupStats
    };
  }, [userData.routineChunks, userData.routineGroupHistory, userData.dailyCompletionRate, last7Days, last30Days]);

  // --- Detail View Data ---
  const detailData = useMemo(() => {
    if (!selectedGroupId) return null;
    const group = userData.routineChunks.find(g => g.id === selectedGroupId);
    if (!group) return null;

    // Sort history with today at the top
    const sortedLast7Days = [...last7Days].reverse();

    const groupHistory = sortedLast7Days.map(date => {
      const entry = (userData.routineGroupHistory || []).find(h => h.groupId === selectedGroupId && h.date === date);
      
      // Calculate achievement rate for this day
      const tasksOnThisDay = group.tasks.filter(t => t.scheduledDays?.includes(new Date(date).getDay()) ?? true);
      const taskEntries = (userData.taskHistory || []).filter(h => h.groupId === selectedGroupId && h.date === date);
      const completedCount = taskEntries.filter(h => h.status === '완벽' || h.status === '완료').length;
      const rate = tasksOnThisDay.length > 0 ? (completedCount / tasksOnThisDay.length) * 100 : 0;

      return {
        date,
        startTime: entry?.firstTaskStartTime || '미실행',
        duration: entry ? formatDurationPrecise(entry.totalDuration) : '0초',
        endTime: entry?.completedAt || '미완료',
        rate: Math.floor(rate) + '%'
      };
    });

    const taskStats = group.tasks.map(task => {
      const getStatsForPeriod = (days: string[]) => {
        const entries = (userData.taskHistory || []).filter(h => h.taskId === task.id && days.includes(h.date));
        const completedEntries = entries.filter(h => h.status === '완벽' || h.status === '완료');
        
        const rate = entries.length > 0 ? (completedEntries.length / entries.length) * 100 : 0;
        const durations = completedEntries.map(e => e.duration);
        
        const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const min = durations.length > 0 ? Math.min(...durations) : 0;
        const max = durations.length > 0 ? Math.max(...durations) : 0;

        return {
          rate: Math.floor(rate) + '%',
          avg: formatDurationPrecise(avg),
          min: formatDurationPrecise(min),
          max: formatDurationPrecise(max)
        };
      };

      return {
        name: task.text,
        type: task.taskType,
        targetDuration: task.targetDuration || task.duration || 0,
        last30: getStatsForPeriod(last30Days),
        last7: getStatsForPeriod(last7Days)
      };
    });

    return {
      name: group.name,
      history: groupHistory,
      tasks: taskStats
    };
  }, [selectedGroupId, userData, last7Days, last30Days]);

  if (selectedGroupId && detailData) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedGroupId(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">{detailData.name} 상세 통계</h2>
        </div>

        {/* 7-Day History Table */}
        <section className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              최근 7일 기록
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                  <th className="px-4 py-3">날짜</th>
                  <th className="px-4 py-3">시작</th>
                  <th className="px-4 py-3">소요시간</th>
                  <th className="px-4 py-3">완료</th>
                  <th className="px-4 py-3">달성률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailData.history.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-500">{row.date.split('-').slice(1).join('/')}</td>
                    <td className="px-4 py-3 font-black text-slate-700">{row.startTime}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{row.duration}</td>
                    <td className="px-4 py-3 font-black text-slate-700">{row.endTime}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Individual Task Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">개별 루틴 통계</h3>
          {detailData.tasks.map((task, i) => (
            <div key={i} className="bg-white p-5 rounded-[15px] shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="font-black text-slate-800">{task.name}</h4>
                <div className="flex items-center gap-1 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-[10px] font-black text-[8px] uppercase tracking-widest ml-1">
                  {task.type === TaskType.TIME_INDEPENDENT ? (
                    <Clock className="w-2.5 h-2.5 text-sky-400" />
                  ) : task.type === TaskType.TIME_ACCUMULATED ? (
                    <BrickWall className="w-2.5 h-2.5 text-pink-400" />
                  ) : (
                    <Hourglass className="w-2.5 h-2.5 text-indigo-400" />
                  )}
                  <span>{task.targetDuration}분</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-[10px] bg-slate-50 p-2 rounded-[10px]">
                  <div className="font-black text-slate-400">30일</div>
                  <div className="text-emerald-600 font-black">달성: {task.last30.rate}</div>
                  <div className="text-slate-600 font-bold col-span-2">
                    평균: {task.last30.avg} (최단: {task.last30.min} / 최장: {task.last30.max})
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] bg-indigo-50/50 p-2 rounded-[10px]">
                  <div className="font-black text-indigo-400">7일</div>
                  <div className="text-emerald-600 font-black">달성: {task.last7.rate}</div>
                  <div className="text-slate-600 font-bold col-span-2">
                    평균: {task.last7.avg} (최단: {task.last7.min} / 최장: {task.last7.max})
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Review Box (후기박스) */}
        <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2.5 rounded-[12px]">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div><h2 className="text-lg font-black text-slate-800">루틴 후기</h2></div>
            </div>
            <div className="flex items-center gap-2 ml-1">
              {(() => {
                const hasDataInYear = (year: number) => 
                  (userData.routineGroupHistory || []).some(h => h.groupId === selectedGroupId && new Date(h.date).getFullYear() === year);
                const hasDataInMonth = (year: number, month: number) => 
                  (userData.routineGroupHistory || []).some(h => {
                    const d = new Date(h.date);
                    return h.groupId === selectedGroupId && d.getFullYear() === year && d.getMonth() === month;
                  });

                const canPrevYear = hasDataInYear(calendarYear - 1);
                const canNextYear = hasDataInYear(calendarYear + 1);
                
                let prevM = calendarMonth - 1;
                let prevY = calendarYear;
                if (prevM < 0) { prevM = 11; prevY--; }
                const canPrevMonth = hasDataInMonth(prevY, prevM);

                let nextM = calendarMonth + 1;
                let nextY = calendarYear;
                if (nextM > 11) { nextM = 0; nextY++; }
                const canNextMonth = hasDataInMonth(nextY, nextM);

                return (
                  <>
                    <button 
                      disabled={!canPrevYear}
                      onClick={prevYear} 
                      className={`p-1 rounded-full border transition-all ${canPrevYear ? 'hover:bg-slate-100 text-slate-600 border-slate-200' : 'text-slate-200 border-slate-100 cursor-not-allowed'}`}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={!canPrevMonth}
                      onClick={prevMonth} 
                      className={`p-1 rounded-full border transition-all ${canPrevMonth ? 'hover:bg-slate-100 text-slate-600 border-slate-200' : 'text-slate-200 border-slate-100 cursor-not-allowed'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-slate-700 min-w-[80px] text-center">
                      {calendarYear}.{String(calendarMonth + 1).padStart(2, '0')}
                    </span>
                    <button 
                      disabled={!canNextMonth}
                      onClick={nextMonth} 
                      className={`p-1 rounded-full border transition-all ${canNextMonth ? 'hover:bg-slate-100 text-slate-600 border-slate-200' : 'text-slate-200 border-slate-100 cursor-not-allowed'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={!canNextYear}
                      onClick={nextYear} 
                      className={`p-1 rounded-full border transition-all ${canNextYear ? 'hover:bg-slate-100 text-slate-600 border-slate-200' : 'text-slate-200 border-slate-100 cursor-not-allowed'}`}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 py-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const historyEntry = (userData.routineGroupHistory || []).find(h => h.groupId === selectedGroupId && h.date === dateStr);
              const hasReview = historyEntry?.satisfaction !== undefined || historyEntry?.closingNote;

              return (
                <button
                  key={day}
                  disabled={!hasReview}
                  onClick={() => {
                    if (hasReview) {
                      setSelectedReview({
                        date: dateStr,
                        note: historyEntry?.closingNote || '',
                        satisfaction: historyEntry?.satisfaction || 3
                      });
                    }
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-[12px] transition-all ${
                    hasReview 
                      ? 'bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-100' 
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {hasReview ? (
                    <span className="text-xl">{satisfactionIcons[(historyEntry?.satisfaction || 3) - 1]}</span>
                  ) : (
                    <span className="text-xs font-bold">{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Review Detail Popup */}
        <AnimatePresence>
          {selectedReview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[25px] w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedReview.date}</p>
                      <h3 className="text-xl font-black text-slate-900">오늘의 후기</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedReview(null)}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                      <ChevronRight className="w-6 h-6 rotate-90" />
                    </button>
                  </div>

                  <div className="flex justify-center py-4">
                    <div className="text-6xl animate-bounce">
                      {satisfactionIcons[selectedReview.satisfaction - 1]}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-[20px] border border-slate-100 min-h-[100px]">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.note || '작성된 메모가 없습니다.'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        deleteReview(selectedGroupId!, selectedReview.date);
                        setSelectedReview(null);
                      }}
                      className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-[15px] font-black text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" /> 삭제하기
                    </button>
                    <button
                      onClick={() => setSelectedReview(null)}
                      className="flex-[2] py-4 bg-slate-900 text-white rounded-[15px] font-black text-sm hover:bg-slate-800 transition-all"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 기상시각통계박스 */}
      <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-[12px]">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-black text-slate-800">기상 시각 통계</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 7일 평균</p>
            <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{wakeUpStats.avgTime7}</h3>
          </div>
          <div className="text-center space-y-1 border-l border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균</p>
            <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{wakeUpStats.avgTime30}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              최근 7일 기록
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                  <th className="px-4 py-3">날짜</th>
                  <th className="px-4 py-3">기상 시각</th>
                  <th className="px-4 py-3 text-right">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wakeUpStats.history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-500">{h.date.split('-').slice(1).join('/')}</td>
                    <td className="px-4 py-3 font-black text-slate-700">{h.time || '--:--'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                        h.status === '달성' ? 'bg-emerald-100 text-emerald-600' : 
                        h.status === '지각' ? 'bg-rose-100 text-rose-600' : 
                        'bg-slate-200 text-slate-400'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 달성율통계박스 */}
      <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-violet-50 p-2.5 rounded-[12px]">
            <Target className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-lg font-black text-slate-800">달성률 통계</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 7일 평균 달성률</p>
            <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate7}%</h3>
          </div>
          <div className="text-center space-y-1 border-l border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
            <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate30}%</h3>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">루틴 그룹별 통계</p>
          <div className="grid gap-3">
            {achievementStats.groups.map((group, i) => (
              <button
                key={i}
                onClick={() => setSelectedGroupId(group.id)}
                className="group bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-left space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{group.name}</h4>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-all" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">평균 시작 시각</p>
                    <p className="text-xs font-black text-slate-700">{group.avgStartTime}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">평균 완료 시각</p>
                    <p className="text-xs font-black text-slate-700">{group.avgEndTime}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">평균 소요 시간</p>
                    <p className="text-xs font-black text-slate-700">{group.avgDuration}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">달성률</p>
                    <p className="text-xs font-black text-emerald-600">{group.rate}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
