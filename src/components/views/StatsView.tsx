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
  BrickWall,
  Circle,
  Check,
  CheckCheck,
  CircleMinus,
  PauseCircle,
  ArrowRightCircle,
  CircleDot,
  X
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(currentTime.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(currentTime.getMonth());

  const [activeTab, setActiveTab] = useState<'wake-up' | 'achievement'>('achievement');
  const [isWakeUpExpanded, setIsWakeUpExpanded] = useState(false);
  const [isAchievementExpanded, setIsAchievementExpanded] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [isTaskDetailExpanded, setIsTaskDetailExpanded] = useState(false);

  // Scroll to top when entering detailed view
  useEffect(() => {
    if (selectedGroupId || selectedTaskId) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setCalendarYear(currentTime.getFullYear());
      setCalendarMonth(currentTime.getMonth());
    }
  }, [selectedGroupId, selectedTaskId]);

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

  const last40Days = useMemo(() => {
    const days = [];
    for (let i = 39; i >= 0; i--) {
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
    const stats40 = getAvgForPeriod(last40Days);

    // Sort history with today at the top
    const sortedHistory7 = [...stats7.history].reverse();
    const sortedHistory40 = [...stats40.history].reverse();

    return {
      avgTime7: stats7.avgTime,
      avgTime30: stats30.avgTime,
      history7: sortedHistory7,
      history40: sortedHistory40
    };
  }, [userData.wakeUpTimeHistory, userData.targetWakeUpTime, last7Days, last30Days, last40Days]);

  // --- Achievement Stats ---
  const achievementStats = useMemo(() => {
    const getAvgRateForPeriod = (days: string[]) => {
      const recordedRates = days
        .map(date => userData.dailyCompletionRate?.[date])
        .filter((rate): rate is number => rate !== undefined);
      
      return recordedRates.length > 0 
        ? recordedRates.reduce((a, b) => a + b, 0) / recordedRates.length 
        : null;
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
      const rate = groupHistory.length > 0 ? (completionCount / groupHistory.length) * 100 : null;

      return {
        id: group.id,
        name: group.name,
        avgStartTime: avgStartMinutes !== null ? minutesToTime(avgStartMinutes) : 'N/A',
        avgEndTime: avgEndMinutes !== null ? minutesToTime(avgEndMinutes) : 'N/A',
        avgDuration: formatDurationPrecise(avgDurationSeconds),
        rate: rate !== null ? Math.floor(rate).toString() : '-'
      };
    });

    const getDailyHistoryForPeriod = (days: string[]) => {
      return days.map(date => {
        const rate = userData.dailyCompletionRate?.[date];
        const dayTaskHistory = (userData.taskHistory || []).filter(h => h.date === date && h.isActive);
        const dayGroupHistory = (userData.routineGroupHistory || []).filter(h => h.date === date && h.isActive);

        // If no records at all for this day (not in taskHistory AND not in completionRate)
        const hasAnyRecord = rate !== undefined || dayTaskHistory.length > 0 || dayGroupHistory.length > 0;

        if (!hasAnyRecord) {
          return {
            date,
            rate: '-',
            totalActive: 0,
            breakdown: '-',
            startTime: '--:--',
            endTime: '--:--',
            duration: '-'
          };
        }

        let perfect = 0;
        let completed = 0;
        let skipped = 0;
        let failed = 0;

        dayTaskHistory.forEach(h => {
          if (h.status === '완벽') perfect++;
          else if (h.status === '완료') completed++;
          else if (h.status === '스킵') skipped++;
          else failed++;
        });

        const firstStarts = dayGroupHistory
          .filter(h => h.firstTaskStartTime)
          .map(h => timeToMinutes(h.firstTaskStartTime!));
        const completions = dayGroupHistory
          .filter(h => h.completedAt)
          .map(h => timeToMinutes(h.completedAt!));
        const durations = dayGroupHistory.map(h => h.totalDuration || 0);

        const minStart = firstStarts.length > 0 ? Math.min(...firstStarts) : null;
        const maxEnd = completions.length > 0 ? Math.max(...completions) : null;
        const sumDurationSeconds = durations.reduce((a, b) => a + b, 0);

        return {
          date,
          rate: Math.floor(rate || 0) + '%',
          totalActive: dayTaskHistory.length,
          breakdown: `(${failed}/${skipped}/${completed}/${perfect})`,
          startTime: minStart !== null ? minutesToTime(minStart) : '--:--',
          endTime: maxEnd !== null ? minutesToTime(maxEnd) : '--:--',
          duration: sumDurationSeconds > 0 ? Math.floor(sumDurationSeconds / 60) + '분' : '0분'
        };
      }).reverse();
    };

    const dailyHistory7 = getDailyHistoryForPeriod(last7Days);
    const dailyHistory40 = getDailyHistoryForPeriod(last40Days);

    const getStatsForPeriod = (days: string[]) => {
      const histories = (userData.routineGroupHistory || []).filter(h => days.includes(h.date));
      
      const startTimes = histories.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const endTimes = histories.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const durations = histories.filter(h => h.totalDuration > 0).map(h => h.totalDuration || 0);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur)
      };
    };

    const overall7 = getStatsForPeriod(last7Days);
    const overall30 = getStatsForPeriod(last30Days);

    return {
      avgTotalRate7: avgRate7 !== null ? Math.floor(avgRate7).toString() : '-',
      avgTotalRate30: avgRate30 !== null ? Math.floor(avgRate30).toString() : '-',
      avgStart7: overall7.avgStart,
      avgEnd7: overall7.avgEnd,
      avgDuration7: overall7.avgDuration,
      avgStart30: overall30.avgStart,
      avgEnd30: overall30.avgEnd,
      avgDuration30: overall30.avgDuration,
      groups: groupStats,
      dailyHistory7,
      dailyHistory40
    };
  }, [userData.routineChunks, userData.routineGroupHistory, userData.taskHistory, userData.dailyCompletionRate, last7Days, last30Days, last40Days]);

  // --- Detail View Data ---
  const detailData = useMemo(() => {
    if (!selectedGroupId) return null;
    const group = userData.routineChunks.find(g => g.id === selectedGroupId);
    if (!group) return null;

    const getHistoryForPeriod = (days: string[]) => {
      const sortedDays = [...days].reverse();
      return sortedDays.map(date => {
        const entry = (userData.routineGroupHistory || []).find(h => h.groupId === selectedGroupId && h.date === date);
        
        if (!entry) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '-',
            status: '미기록'
          };
        }

        // Calculate achievement rate for this day
        const tasksOnThisDay = group.tasks.filter(t => t.scheduledDays?.includes(new Date(date).getDay()) ?? true);
        const taskEntries = (userData.taskHistory || []).filter(h => h.groupId === selectedGroupId && h.date === date && h.isActive);
        const completedCount = taskEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵').length;
        const rate = taskEntries.length > 0 ? (completedCount / taskEntries.length) * 100 : 0;

        return {
          date,
          startTime: entry.firstTaskStartTime || '미실행',
          duration: formatDurationPrecise(entry.totalDuration),
          endTime: entry.completedAt || '미완료',
          rate: Math.floor(rate) + '%',
          status: entry.completionStatus
        };
      });
    };

    const history7 = getHistoryForPeriod(last7Days);
    const history40 = getHistoryForPeriod(last40Days);

    const getAvgRateForPeriod = (days: string[]) => {
      const entries = (userData.taskHistory || []).filter(h => h.groupId === selectedGroupId && days.includes(h.date) && h.isActive);
      const completedEntries = entries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
      return entries.length > 0 ? (completedEntries.length / entries.length) * 100 : null;
    };

    const taskStats = group.tasks.map(task => {
      const getStatsForPeriod = (days: string[]) => {
        const entries = (userData.taskHistory || []).filter(h => h.taskId === task.id && days.includes(h.date));
        const activeEntries = entries.filter(h => h.isActive);
        
        // Skip is included in rate but excluded from duration
        const attainmentEntries = activeEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
        const durationEntries = activeEntries.filter(h => h.status === '완벽' || h.status === '완료');
        
        if (entries.length === 0) {
          return {
            rate: '-',
            avg: '-',
            min: '-',
            max: '-'
          };
        }

        const rate = activeEntries.length > 0 ? (attainmentEntries.length / activeEntries.length) * 100 : 0;
        const durations = durationEntries.map(e => e.duration);
        
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
        id: task.id,
        name: task.text,
        type: task.taskType,
        targetDuration: task.targetDuration || task.duration || 0,
        last30: getStatsForPeriod(last30Days),
        last7: getStatsForPeriod(last7Days)
      };
    });

    const getAvgMetricsForPeriod = (days: string[]) => {
      const histories = (userData.routineGroupHistory || []).filter(h => h.groupId === selectedGroupId && days.includes(h.date));
      const startTimes = histories.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const endTimes = histories.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const durations = histories.filter(h => h.totalDuration > 0).map(h => h.totalDuration);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur)
      };
    };

    const metrics7 = getAvgMetricsForPeriod(last7Days);
    const metrics30 = getAvgMetricsForPeriod(last30Days);
    const avgRate7 = getAvgRateForPeriod(last7Days);
    const avgRate30 = getAvgRateForPeriod(last30Days);

    return {
      name: group.name,
      history7: history7,
      history40: history40,
      tasks: taskStats,
      avgRate7: avgRate7 !== null ? Math.floor(avgRate7) : '-',
      avgRate30: avgRate30 !== null ? Math.floor(avgRate30) : '-',
      avgStart7: metrics7.avgStart,
      avgEnd7: metrics7.avgEnd,
      avgDuration7: metrics7.avgDuration,
      avgStart30: metrics30.avgStart,
      avgEnd30: metrics30.avgEnd,
      avgDuration30: metrics30.avgDuration
    };
  }, [selectedGroupId, userData, last7Days, last30Days, last40Days]);

  const taskDetailData = useMemo(() => {
    if (!selectedTaskId) return null;
    
    // Find the task in all chunks
    let foundTaskText = '';
    for (const chunk of userData.routineChunks) {
      const task = chunk.tasks.find(t => t.id === selectedTaskId);
      if (task) {
        foundTaskText = task.text;
        break;
      }
    }

    const getHistoryForPeriod = (days: string[]) => {
      const sortedDays = [...days].reverse();
      return sortedDays.map(date => {
        const entry = (userData.taskHistory || []).find(h => h.taskId === selectedTaskId && h.date === date);
        
        if (!entry) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            status: '미기록'
          };
        }

        const startTime = entry.startTime || '--:--';
        const duration = formatDurationPrecise(entry.duration);
        const endTime = entry.endTime || '--:--';
        const status = entry.status;

        return {
          date,
          startTime,
          duration,
          endTime,
          status
        };
      });
    };

    const getAvgRateForPeriod = (days: string[]) => {
      const entries = (userData.taskHistory || []).filter(h => h.taskId === selectedTaskId && days.includes(h.date) && h.isActive);
      const completedEntries = entries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
      return entries.length > 0 ? (completedEntries.length / entries.length) * 100 : null;
    };

    const getAvgMetricsForPeriod = (days: string[]) => {
      const histories = (userData.taskHistory || []).filter(h => h.taskId === selectedTaskId && days.includes(h.date));
      const startTimes = histories.filter(h => h.startTime).map(h => timeToMinutes(h.startTime!));
      const endTimes = histories.filter(h => h.endTime).map(h => timeToMinutes(h.endTime!));
      const durations = histories.filter(h => h.duration > 0).map(h => h.duration);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur)
      };
    };

    const metrics7 = getAvgMetricsForPeriod(last7Days);
    const metrics30 = getAvgMetricsForPeriod(last30Days);
    const avgRate7 = getAvgRateForPeriod(last7Days);
    const avgRate30 = getAvgRateForPeriod(last30Days);

    return {
      name: foundTaskText,
      history7: getHistoryForPeriod(last7Days),
      history40: getHistoryForPeriod(last40Days),
      avgRate7: avgRate7 !== null ? Math.floor(avgRate7) : '-',
      avgRate30: avgRate30 !== null ? Math.floor(avgRate30) : '-',
      avgStart7: metrics7.avgStart,
      avgEnd7: metrics7.avgEnd,
      avgDuration7: metrics7.avgDuration,
      avgStart30: metrics30.avgStart,
      avgEnd30: metrics30.avgEnd,
      avgDuration30: metrics30.avgDuration
    };
  }, [selectedTaskId, userData, last7Days, last30Days, last40Days]);

  if (selectedTaskId && taskDetailData) {
    const renderStatusIcon = (status: string) => {
      let iconColor = "text-slate-200";
      let statusIcon = <Circle className={`w-5 h-5 ${iconColor}`} />;

      if (status === '미기록') {
        iconColor = "text-slate-200";
        statusIcon = <div className="text-slate-300 font-black">-</div>;
      } else if (status === '완벽') {
        iconColor = "text-indigo-600";
        statusIcon = (
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
            <CheckCheck className={`absolute w-[60%] h-[60%] ${iconColor}`} strokeWidth={3} />
          </div>
        );
      } else if (status === '완료') {
        iconColor = "text-indigo-600";
        statusIcon = (
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
            <Check className={`w-3 h-3 ${iconColor}`} strokeWidth={4} />
          </div>
        );
      } else if (status === '스킵') {
        iconColor = "text-[#CC9900]";
        statusIcon = <CircleMinus className={`w-5 h-5 ${iconColor}`} />;
      } else if (status === '나중에') {
        iconColor = "text-slate-400";
        statusIcon = <ArrowRightCircle className={`w-5 h-5 ${iconColor}`} />;
      } else if (status === '일시정지') {
        iconColor = "text-amber-400";
        statusIcon = <PauseCircle className={`w-5 h-5 ${iconColor}`} />;
      } else if (status === '실행중') {
        iconColor = "text-indigo-500 animate-pulse";
        statusIcon = <CircleDot className={`w-5 h-5 ${iconColor}`} />;
      } else if (status === '비활성') {
        iconColor = "text-slate-200";
        statusIcon = (
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
            <X className="w-3 h-3 text-slate-400" strokeWidth={4} />
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center">
          {statusIcon}
        </div>
      );
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex px-4 items-end relative z-20">
          <button
            onClick={() => {
              setActiveTab('wake-up');
              setSelectedTaskId(null);
              setSelectedGroupId(null);
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
              activeTab === 'wake-up' 
                ? 'bg-white text-indigo-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'wake-up' ? 'text-indigo-500' : 'text-slate-300'}`} />
            기상 시각 통계
            {activeTab === 'wake-up' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>

          <button
            onClick={() => {
              setActiveTab('achievement');
              setSelectedTaskId(null);
              setSelectedGroupId(null);
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
              activeTab === 'achievement' 
                ? 'bg-white text-violet-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${activeTab === 'achievement' ? 'text-violet-500' : 'text-slate-300'}`} />
            달성률 통계
            {activeTab === 'achievement' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>
        </div>

        <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10 p-4 md:p-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTaskId(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h2 className="text-xl font-black text-slate-900">{taskDetailData.name} 상세 통계</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 7일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{taskDetailData.avgRate7}{taskDetailData.avgRate7 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{taskDetailData.avgStart7} ~ {taskDetailData.avgEnd7}</div>
                  <div className="text-slate-400">(평균 {taskDetailData.avgDuration7})</div>
                </div>
              </div>
              <div className="text-center space-y-1 border-l border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{taskDetailData.avgRate30}{taskDetailData.avgRate30 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{taskDetailData.avgStart30} ~ {taskDetailData.avgEnd30}</div>
                  <div className="text-slate-400">(평균 {taskDetailData.avgDuration30})</div>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  최근 {isTaskDetailExpanded ? '40' : '7'}일 기록
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                      <th className="px-2 py-2">날짜</th>
                      <th className="px-2 py-2 text-center">시작</th>
                      <th className="px-2 py-2 text-center">소요</th>
                      <th className="px-2 py-2 text-center">완료</th>
                      <th className="px-2 py-2 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(isTaskDetailExpanded ? taskDetailData.history40 : taskDetailData.history7).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2 py-2 font-bold text-slate-500 tracking-tighter whitespace-nowrap">{row.date.split('-').slice(1).join('/')}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.startTime}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-600 tracking-tighter">{row.duration}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.endTime}</td>
                        <td className="px-2 py-2 flex justify-center">
                          {renderStatusIcon(row.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-50">
                <button 
                  onClick={() => setIsTaskDetailExpanded(!isTaskDetailExpanded)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                >
                  <div className="flex flex-col items-center">
                    <span>{isTaskDetailExpanded ? '접기' : '최근 40일 기록 확인'}</span>
                    {!isTaskDetailExpanded && <div className="mt-1 border-b-2 border-r-2 border-slate-300 w-1.5 h-1.5 rotate-45" />}
                    {isTaskDetailExpanded && <div className="mb-1 border-t-2 border-l-2 border-indigo-500 w-1.5 h-1.5 rotate-45" />}
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGroupId && detailData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Folder Tab Containers */}
        <div className="flex px-4 items-end relative z-20">
          <button
            onClick={() => {
              setActiveTab('wake-up');
              setSelectedGroupId(null);
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
              activeTab === 'wake-up' 
                ? 'bg-white text-indigo-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'wake-up' ? 'text-indigo-500' : 'text-slate-300'}`} />
            기상 시각 통계
            {activeTab === 'wake-up' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>

          <button
            onClick={() => {
              setActiveTab('achievement');
              setSelectedGroupId(null);
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
              activeTab === 'achievement' 
                ? 'bg-white text-violet-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${activeTab === 'achievement' ? 'text-violet-500' : 'text-slate-300'}`} />
            달성률 통계
            {activeTab === 'achievement' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>
        </div>

        {/* Main Folder Content Body */}
        <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10 p-4 md:p-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedGroupId(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900">{detailData.name} 상세 통계</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">※ 해당 기간 동안의 모든 개별 루틴 수행 평균 점수</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 7일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{detailData.avgRate7}{detailData.avgRate7 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{detailData.avgStart7} ~ {detailData.avgEnd7}</div>
                  <div className="text-slate-400">(평균 {detailData.avgDuration7})</div>
                </div>
              </div>
              <div className="text-center space-y-1 border-l border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{detailData.avgRate30}{detailData.avgRate30 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{detailData.avgStart30} ~ {detailData.avgEnd30}</div>
                  <div className="text-slate-400">(평균 {detailData.avgDuration30})</div>
                </div>
              </div>
            </div>

            {/* 7-Day History Table 루틴그룹별 최근 7일간 통계*/}
            <section className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  최근 {isDetailExpanded ? '40' : '7'}일 기록
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                      <th className="px-2 py-2">날짜</th>
                      <th className="px-2 py-2 text-center">시작</th>
                      <th className="px-2 py-2 text-center">소요</th>
                      <th className="px-2 py-2 text-center">완료</th>
                      <th className="px-2 py-2 text-right">달성률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(isDetailExpanded ? detailData.history40 : detailData.history7).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2 py-2 font-bold text-slate-500 tracking-tighter whitespace-nowrap">{row.date.split('-').slice(1).join('/')}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.startTime}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-600 tracking-tighter">{row.duration}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.endTime}</td>
                        <td className="px-2 py-2 text-right font-black text-emerald-600 tracking-tighter">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-50">
                <button 
                  onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                >
                  <div className="flex flex-col items-center">
                    <span>{isDetailExpanded ? '접기' : '최근 40일 기록 확인'}</span>
                    {!isDetailExpanded && <div className="mt-1 border-b-2 border-r-2 border-slate-300 w-1.5 h-1.5 rotate-45" />}
                    {isDetailExpanded && <div className="mb-1 border-t-2 border-l-2 border-indigo-500 w-1.5 h-1.5 rotate-45" />}
                  </div>
                </button>
              </div>
            </section>

            {/* Individual Task Stats */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-800 pl-1">개별 루틴 통계</h2>
              {detailData.tasks.map((task, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedTaskId(task.id)}
                  className="w-full bg-white p-5 rounded-[15px] shadow-sm border border-slate-100 space-y-3 text-left hover:border-indigo-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{task.name}</h4>
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
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] bg-indigo-50/50 p-2 rounded-[10px]">
                      <div className="font-black text-indigo-400 whitespace-nowrap">7일</div>
                      <div className="text-emerald-600 font-black whitespace-nowrap">달성: {task.last7.rate}</div>
                      <div className="text-slate-600 font-bold whitespace-nowrap">
                        평균: {task.last7.avg} (최단: {task.last7.min} / 최장: {task.last7.max})
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] bg-slate-50 p-2 rounded-[10px]">
                      <div className="font-black text-slate-400 whitespace-nowrap">30일</div>
                      <div className="text-emerald-600 font-black whitespace-nowrap">달성: {task.last30.rate}</div>
                      <div className="text-slate-600 font-bold whitespace-nowrap">
                        평균: {task.last30.avg} (최단: {task.last30.min} / 최장: {task.last30.max})
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Folder Tab Containers */}
      <div className="flex px-4 items-end relative z-20">
        {/* Left Tab: 기상 시각 통계 */}
        <button
          onClick={() => setActiveTab('wake-up')}
          className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
            activeTab === 'wake-up' 
              ? 'bg-white text-indigo-600 border-slate-100 -mb-[1px] pt-4' 
              : 'bg-slate-50 text-slate-400 border-transparent'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeTab === 'wake-up' ? 'text-indigo-500' : 'text-slate-300'}`} />
          기상 시각 통계
          {activeTab === 'wake-up' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
        </button>

        {/* Right Tab: 달성률 통계 */}
        <button
          onClick={() => setActiveTab('achievement')}
          className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
            activeTab === 'achievement' 
              ? 'bg-white text-violet-600 border-slate-100 -mb-[1px] pt-4' 
              : 'bg-slate-50 text-slate-400 border-transparent'
          }`}
        >
          <Target className={`w-3.5 h-3.5 ${activeTab === 'achievement' ? 'text-violet-500' : 'text-slate-300'}`} />
          달성률 통계
          {activeTab === 'achievement' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
        </button>
      </div>

      {/* Main Folder Content Body */}
      <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10">
        <div className="p-1 md:p-3">
          <AnimatePresence mode="wait">
            {activeTab === 'wake-up' ? (
              <motion.div
                key="wake-up-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-6"
              >
                {/* 기상시각통계박스 */}
                <div className="px-3 space-y-6">
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
                        최근 {isWakeUpExpanded ? '40' : '7'}일 기록
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">날짜</th>
                            <th className="px-2 py-2">기상 시각</th>
                            <th className="px-2 py-2 text-right">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(isWakeUpExpanded ? wakeUpStats.history40 : wakeUpStats.history7).map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-2 py-2 font-bold text-slate-500">{h.date.split('-').slice(1).join('/')}</td>
                              <td className="px-2 py-2 font-black text-slate-700">{h.time || '--:--'}</td>
                              <td className="px-2 py-2 text-right">
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
                    <div className="p-3 border-t border-slate-50">
                      <button 
                        onClick={() => setIsWakeUpExpanded(!isWakeUpExpanded)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                      >
                        <div className="flex flex-col items-center">
                          <span>{isWakeUpExpanded ? '접기' : '최근 40일 기록 확인'}</span>
                          {!isWakeUpExpanded && <div className="mt-1 border-b-2 border-r-2 border-slate-300 w-1.5 h-1.5 rotate-45" />}
                          {isWakeUpExpanded && <div className="mb-1 border-t-2 border-l-2 border-indigo-500 w-1.5 h-1.5 rotate-45" />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="achievement-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-6"
              >
                {/* 달성율통계박스 */}
                <div className="px-3 space-y-6">
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
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate7}{achievementStats.avgTotalRate7 !== '-' ? '%' : ''}</h3>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                        <div>{achievementStats.avgStart7} ~ {achievementStats.avgEnd7}</div>
                        <div className="text-slate-400">(평균 {achievementStats.avgDuration7})</div>
                      </div>
                    </div>
                    <div className="text-center space-y-1 border-l border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
                      <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate30}{achievementStats.avgTotalRate30 !== '-' ? '%' : ''}</h3>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                        <div>{achievementStats.avgStart30} ~ {achievementStats.avgEnd30}</div>
                        <div className="text-slate-400">(평균 {achievementStats.avgDuration30})</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[15px] border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <History className="w-4 h-4 text-violet-500" />
                        최근 {isAchievementExpanded ? '40' : '7'}일 기록
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">날짜</th>
                            <th className="px-2 py-2">달성률</th>
                            <th className="px-2 py-2 md:whitespace-nowrap">
                              루틴<span className="hidden md:inline">(실패/스킵/완료/완벽)</span>
                              <br className="md:hidden" />
                              <span className="md:hidden">(실패/스킵</span>
                              <br className="md:hidden" />
                              <span className="md:hidden">/완료/완벽)</span>
                            </th>
                            <th className="px-2 py-2 text-center">
                              <span className="hidden md:inline">시작 ~ 종료</span>
                              <span className="md:hidden">시작</span>
                              <br className="md:hidden" />
                              <span className="md:hidden">~</span>
                              <br className="md:hidden" />
                              <span className="md:hidden">종료</span>
                            </th>
                            <th className="px-2 py-2 text-right">합계</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(isAchievementExpanded ? achievementStats.dailyHistory40 : achievementStats.dailyHistory7).map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-2 py-2 font-bold text-slate-500">{h.date.split('-').slice(1).join('/')}</td>
                              <td className="px-2 py-2 font-black text-violet-600">{h.rate}</td>
                              <td className="px-2 py-2 font-bold text-slate-700 whitespace-nowrap">
                                {h.totalActive}{h.breakdown}
                              </td>
                              <td className="px-2 py-2 text-center font-black text-slate-700">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-0 md:gap-1 tracking-tighter">
                                  <span>{h.startTime}</span>
                                  <span className="text-[8px] text-slate-300 md:text-xs">~</span>
                                  <span>{h.endTime}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right font-black text-indigo-600">{h.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 border-t border-slate-50">
                      <button 
                        onClick={() => setIsAchievementExpanded(!isAchievementExpanded)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                      >
                        <div className="flex flex-col items-center">
                          <span>{isAchievementExpanded ? '접기' : '최근 40일 기록 확인'}</span>
                          {!isAchievementExpanded && <div className="mt-1 border-b-2 border-r-2 border-slate-300 w-1.5 h-1.5 rotate-45" />}
                          {isAchievementExpanded && <div className="mb-1 border-t-2 border-l-2 border-indigo-500 w-1.5 h-1.5 rotate-45" />}
                        </div>
                      </button>
                    </div>
                  </div>






                  <div className="space-y-4">

                  <div className="flex items-center gap-3">
                    <div className="bg-violet-50 p-2.5 rounded-[12px]">
                      <Target className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-black text-slate-800">루틴 그룹별 통계</h2>
                      <p className="text-[10px] font-bold text-slate-400">※ 7일간 루틴 그룹 전체를 완료한 일수 비중</p>
                    </div>
                  </div>


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
                              <p className="text-xs font-black text-emerald-600">{group.rate}{group.rate !== '-' ? '%' : ''}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
