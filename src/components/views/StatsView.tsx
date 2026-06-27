import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Calendar, 
  Target, 
  ChevronLeft,
  ChevronRight,
  Timer,
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
import { UserData, TaskType } from '../../types';
import { timeToMinutes, minutesToTime, formatDate, formatDurationPrecise, isTaskScheduledToday, calculateTaskDuration, getCreationDate } from '../../utils';

interface StatsViewProps {
  userData: UserData;
  currentTime: Date;
  initialSelectedGroupId?: string | null;
  isSingleGroupStatsOnly?: boolean;
  onBackOverride?: () => void;
  initialSelectedTaskId?: string | null;
  isSingleTaskStatsOnly?: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  userData,
  currentTime,
  initialSelectedGroupId = null,
  isSingleGroupStatsOnly = false,
  onBackOverride,
  initialSelectedTaskId = null,
  isSingleTaskStatsOnly = false
}) => {
  const { t } = useTranslation();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialSelectedGroupId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialSelectedTaskId);

  useEffect(() => {
    if (initialSelectedGroupId) {
      setSelectedGroupId(initialSelectedGroupId);
    }
  }, [initialSelectedGroupId]);

  useEffect(() => {
    if (initialSelectedTaskId) {
      setSelectedTaskId(initialSelectedTaskId);
    }
  }, [initialSelectedTaskId]);

  const [activeTab, setActiveTab] = useState<'wake-up' | 'achievement' | 'usage'>('achievement');
  const [viewAllType, setViewAllType] = useState<'overall' | 'group' | 'task' | null>(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  // Prevent background scrolling when daily history modal is open
  useEffect(() => {
    if (selectedHistoryDate) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [selectedHistoryDate]);

  const renderFolderTabs = () => {
    if (isSingleGroupStatsOnly || isSingleTaskStatsOnly) return null;
    return (
      <div className="flex px-4 items-end relative z-20">
        <button
          onClick={() => {
            setActiveTab('wake-up');
            setViewAllType(null);
            setSelectedTaskId(null);
            setSelectedGroupId(null);
          }}
          className={`px-[18px] py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
            activeTab === 'wake-up' 
              ? 'bg-white text-indigo-600 border-slate-100 -mb-[1px] pt-4' 
              : 'bg-slate-50 text-slate-400 border-transparent'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeTab === 'wake-up' ? 'text-indigo-500' : 'text-slate-300'}`} />
          {t('stats.wakeUpStats')}
          {activeTab === 'wake-up' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
        </button>

        <button
          onClick={() => {
            setActiveTab('achievement');
            setViewAllType(null);
            setSelectedTaskId(null);
            setSelectedGroupId(null);
          }}
          className={`px-[18px] py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
            activeTab === 'achievement' 
              ? 'bg-white text-violet-600 border-slate-100 -mb-[1px] pt-4' 
              : 'bg-slate-50 text-slate-400 border-transparent'
          }`}
        >
          <Target className={`w-3.5 h-3.5 ${activeTab === 'achievement' ? 'text-violet-500' : 'text-slate-300'}`} />
          {t('stats.achievementStats')}
          {activeTab === 'achievement' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
        </button>

        <button
          onClick={() => {
            setActiveTab('usage');
            setViewAllType(null);
            setSelectedTaskId(null);
            setSelectedGroupId(null);
          }}
          className={`px-[18px] py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 ${
            activeTab === 'usage' 
              ? 'bg-white text-emerald-600 border-slate-100 -mb-[1px] pt-4' 
              : 'bg-slate-50 text-slate-400 border-transparent'
          }`}
        >
          <Timer className={`w-3.5 h-3.5 ${activeTab === 'usage' ? 'text-emerald-500' : 'text-slate-300'}`} />
          {t('stats.usageStats')}
          {activeTab === 'usage' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
        </button>
      </div>
    );
  };

  // Scroll to top when entering detailed view
  useEffect(() => {
    if (selectedGroupId || selectedTaskId || viewAllType) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Scroll all scrollable parent/container elements in the document to the top
      const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-auto, .custom-scrollbar');
      scrollableElements.forEach(el => {
        el.scrollTo({ top: 0, behavior: 'auto' });
      });
    }
  }, [selectedGroupId, selectedTaskId, viewAllType]);

  const todayStr = formatDate(currentTime);
  
  const fillMissingDates = (datesSet: Set<string>): string[] => {
    const activeDates = Array.from(datesSet).filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (activeDates.length === 0) return [];
    
    activeDates.sort();
    const minDateStr = activeDates[0];
    const maxDateStr = activeDates[activeDates.length - 1] > todayStr ? activeDates[activeDates.length - 1] : todayStr;
    
    const result: string[] = [];
    const start = new Date(minDateStr);
    const end = new Date(maxDateStr);
    
    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      result.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    
    return result.sort((a, b) => b.localeCompare(a));
  };
  
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
    
    // Only include today and dates that have actual wake-up records
    const activityDates = new Set<string>();
    activityDates.add(todayStr); // Always include today
    history.forEach(h => { if (h && h.date) activityDates.add(h.date); });

    const allDatesSorted = fillMissingDates(activityDates);
    
    const historyByYear: { [year: string]: any[] } = {};
    allDatesSorted.forEach(date => {
      const year = date.split('-')[0];
      if (!historyByYear[year]) historyByYear[year] = [];
      
      const entry = history.find(h => h.date === date);
      let entryStatus: string = '미기록';
      let targetTime = userData.dailyTargetWakeUpTime?.[date] || userData.targetWakeUpTime;
      let wakeUpTimeFormatted = '--:--';

      if (entry) {
        entryStatus = entry.status || '달성';
        targetTime = entry.targetTime || targetTime;
        wakeUpTimeFormatted = entry.wakeUpTime.split(':').slice(0, 2).join(':');
      }

      historyByYear[year].push({
        date,
        wakeUpTime: wakeUpTimeFormatted,
        targetTime: targetTime,
        status: entryStatus
      });
    });

    const getAvgForPeriod = (days: string[]) => {
      const recordedTimes = days
        .map(date => history.find(h => h.date === date))
        .filter(h => h)
        .map(h => timeToMinutes(h!.wakeUpTime));
        
      const avgMinutes = recordedTimes.length > 0 
        ? recordedTimes.reduce((a, b) => a + b, 0) / recordedTimes.length 
        : null;

      return avgMinutes !== null ? minutesToTime(avgMinutes) : 'N/A';
    };

    return {
      avgTime7: getAvgForPeriod(last7Days),
      avgTime30: getAvgForPeriod(last30Days),
      historyByYear
    };
  }, [userData.wakeUpTimeHistory, userData.targetWakeUpTime, userData.dailyTargetWakeUpTime, userData.dailyCompletionRate, userData.taskHistory, userData.routineGroupHistory, last7Days, last30Days]);

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
      const groupHistory7 = (userData.routineGroupHistory || []).filter(h => h.groupId === group.id && last7Days.includes(h.date));
      
      const startTimes = groupHistory7.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const avgStartMinutes = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      
      const endTimes = groupHistory7.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const avgEndMinutes = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;

      const durations7 = groupHistory7.map(h => h.totalDuration);
      const avgDurationSeconds7 = durations7.length > 0 ? durations7.reduce((a, b) => a + b, 0) / durations7.length : 0;
      const totalDurationSeconds7 = durations7.reduce((a, b) => a + b, 0);

      const completionCount7 = groupHistory7.filter(h => h.completionStatus === '전체완료').length;
      const rate7 = groupHistory7.length > 0 ? (completionCount7 / groupHistory7.length) * 100 : null;

      return {
        id: group.id,
        name: group.name,
        avgStartTime: avgStartMinutes !== null ? minutesToTime(avgStartMinutes) : 'N/A',
        avgEndTime: avgEndMinutes !== null ? minutesToTime(avgEndMinutes) : 'N/A',
        avgDuration7: formatDurationPrecise(avgDurationSeconds7),
        totalDuration7: formatDurationPrecise(totalDurationSeconds7),
        rate: rate7 !== null ? Math.floor(rate7).toString() : '-'
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

        const completedPerfect = completed + perfect;

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
          breakdown: `(${failed}/${skipped}/${completedPerfect})`,
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
      const totalDur = durations.reduce((a, b) => a + b, 0);

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur)
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
      totalDuration7: overall7.totalDuration,
      avgStart30: overall30.avgStart,
      avgEnd30: overall30.avgEnd,
      avgDuration30: overall30.avgDuration,
      totalDuration30: overall30.totalDuration,
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

    const groupCreationDate = getCreationDate(selectedGroupId, userData);

    const getHistoryForPeriod = (days: string[]) => {
      const sortedDays = [...days].reverse();
      return sortedDays.map(date => {
        if (date < groupCreationDate) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '기록없음',
            status: '기록없음'
          };
        }

        const entry = (userData.routineGroupHistory || []).find(h => h.groupId === selectedGroupId && h.date === date);
        const [yStr, mStr, dStr] = date.split('-');
        const yParsed = parseInt(yStr, 10);
        const mParsed = parseInt(mStr, 10);
        const dParsed = parseInt(dStr, 10);
        const dateObj = new Date(yParsed, mParsed - 1, dParsed);
        const dayOfWeek = dateObj.getDay();

        const isNormallyInactive = group
          ? (!group.scheduledDays?.includes(dayOfWeek) && !group.forcedActiveDates?.includes(date))
          : false;

        const isSkipped = group
          ? (group.inactiveDates?.includes(date) || userData.inactiveChunks?.[date]?.includes(selectedGroupId))
          : (userData.inactiveChunks?.[date]?.includes(selectedGroupId));

        const isRestDay = !isSkipped && (
          entry 
            ? (entry.completionStatus === '비활성' || entry.isActive === false)
            : isNormallyInactive
        );

        const taskEntries = (userData.taskHistory || []).filter(h => h.groupId === selectedGroupId && h.date === date && h.isActive);
        const activeTasksOnDate = taskEntries;
        let allActiveTasksUnexecuted = false;
        if (activeTasksOnDate.length > 0) {
          allActiveTasksUnexecuted = activeTasksOnDate.every(t => 
            !t.status || t.status === '미실행' || t.status === '비활성'
          );
        } else if (group) {
          const isNormallyActiveOnDate = (group.scheduledDays?.includes(dayOfWeek) || group.forcedActiveDates?.includes(date)) && !group.inactiveDates?.includes(date);
          if (isNormallyActiveOnDate) {
            allActiveTasksUnexecuted = true;
          }
        }

        const isUnexecuted = !isRestDay && !isSkipped && (
          entry?.completionStatus === '미실행' || 
          entry?.completionStatus === 'fail' ||
          (entry && !entry.firstTaskStartTime && entry.totalDuration === 0) ||
          (!entry && allActiveTasksUnexecuted)
        );

        const todayStr = formatDate(currentTime);
        const isPastDate = date < todayStr;
        const isRecordMissing = !isRestDay && !isSkipped && !isUnexecuted && (
          isPastDate && !entry && taskEntries.length === 0
        );

        if (isRestDay) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '쉬는요일',
            status: '쉬는요일'
          };
        }

        if (isSkipped) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '건너뜀',
            status: '건너뜀'
          };
        }

        if (isRecordMissing) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '기록없음',
            status: '기록없음'
          };
        }

        // Standard formatting
        const completedCount = taskEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵').length;
        const rate = taskEntries.length > 0 ? (completedCount / taskEntries.length) * 100 : 0;

        return {
          date,
          startTime: entry?.firstTaskStartTime || '미실행',
          duration: entry ? formatDurationPrecise(entry.totalDuration) : '0초',
          endTime: entry?.completedAt || '미완료',
          rate: Math.floor(rate) + '%',
          status: entry?.completionStatus || '미실행'
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
        const total = durations.reduce((a, b) => a + b, 0);
        const min = durations.length > 0 ? Math.min(...durations) : 0;
        const max = durations.length > 0 ? Math.max(...durations) : 0;

        return {
          rate: Math.floor(rate) + '%',
          avg: formatDurationPrecise(avg),
          total: formatDurationPrecise(total),
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
      const totalDur = durations.reduce((a, b) => a + b, 0);

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur)
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
      totalDuration7: metrics7.totalDuration,
      avgStart30: metrics30.avgStart,
      avgEnd30: metrics30.avgEnd,
      avgDuration30: metrics30.avgDuration,
      totalDuration30: metrics30.totalDuration
    };
  }, [selectedGroupId, userData, last7Days, last30Days, last40Days]);

  const taskDetailData = useMemo(() => {
    if (!selectedTaskId) return null;
    
    // Find the task in all chunks
    let foundTaskText = '';
    let foundChunk: any = null;
    let foundTask: any = null;
    for (const chunk of userData.routineChunks) {
      const task = chunk.tasks.find(t => t.id === selectedTaskId);
      if (task) {
        foundTaskText = task.text;
        foundChunk = chunk;
        foundTask = task;
        break;
      }
    }

    const taskCreationDate = getCreationDate(selectedTaskId, userData);

    const getHistoryForPeriod = (days: string[]) => {
      const sortedDays = [...days].reverse();
      return sortedDays.map(date => {
        if (date < taskCreationDate) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            status: '기록없음'
          };
        }

        const entry = (userData.taskHistory || []).find(h => h.taskId === selectedTaskId && h.date === date);
        
        const [yStr, mStr, dStr] = date.split('-');
        const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
        let isScheduled = true;
        if (foundChunk && foundTask) {
          isScheduled = isTaskScheduledToday(foundTask, foundChunk, dateObj, userData);
        }

        if (!entry) {
          return {
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            status: !isScheduled ? '비활성' : '미기록'
          };
        }

        let status = entry.status;
        if (!isScheduled && (status === '미실행' || status === '비활성' || status === '미기록')) {
          status = '비활성';
        }

        const startTime = (status === '스킵' || status === '미실행' || status === '비활성' || !entry.startTime) ? '--:--' : entry.startTime;
        const duration = (status === '스킵' || status === '미실행' || status === '비활성' || entry.duration === null || entry.duration === undefined) ? '-' : formatDurationPrecise(entry.duration);
        const endTime = (status === '스킵' || status === '미실행' || status === '비활성' || !entry.endTime) ? '--:--' : entry.endTime;

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
      const startTimes = histories.filter(h => h.startTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.startTime!));
      const endTimes = histories.filter(h => h.endTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.endTime!));
      const durations = histories.filter(h => h.duration !== null && h.duration !== undefined && h.duration > 0 && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => h.duration as number);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const totalDur = durations.reduce((a, b) => a + b, 0);

      return {
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur)
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
      totalDuration7: metrics7.totalDuration,
      avgStart30: metrics30.avgStart,
      avgEnd30: metrics30.avgEnd,
      avgDuration30: metrics30.avgDuration,
      totalDuration30: metrics30.totalDuration
    };
  }, [selectedTaskId, userData, last7Days, last30Days, last40Days]);

  const taskAllTimeStats = useMemo(() => {
    if (!selectedTaskId) return null;

    let taskName = '';
    let foundChunk: any = null;
    let foundTask: any = null;
    for (const chunk of userData.routineChunks) {
      const task = chunk.tasks.find(t => t.id === selectedTaskId);
      if (task) {
        taskName = task.text;
        foundChunk = chunk;
        foundTask = task;
        break;
      }
    }

    const getAllRecordedDays = () => {
      const dates = new Set<string>();
      Object.keys(userData.dailyCompletionRate || {}).forEach(d => { if (d) dates.add(d); });
      (userData.taskHistory || []).forEach(h => { if (h && h.date) dates.add(h.date); });
      (userData.routineGroupHistory || []).forEach(h => { if (h && h.date) dates.add(h.date); });
      return fillMissingDates(dates);
    };

    const allDaysSorted = getAllRecordedDays();
    if (allDaysSorted.length === 0) return null;

    const taskCreationDate = getCreationDate(selectedTaskId, userData);
    const allDaysSortedFiltered = allDaysSorted.filter(date => date >= taskCreationDate);
    if (allDaysSortedFiltered.length === 0) return null;

    const dateRangeStr = `${allDaysSortedFiltered[allDaysSortedFiltered.length - 1].replace(/-/g, '.')} ~ ${allDaysSortedFiltered[0].replace(/-/g, '.')}`;

    const taskHistory = (userData.taskHistory || []).filter(h => h.taskId === selectedTaskId);
    const activeEntries = taskHistory.filter(h => h.isActive);
    const attainmentEntries = activeEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
    const avgRate = activeEntries.length > 0 ? Math.floor((attainmentEntries.length / activeEntries.length) * 100) : 0;

    const startTimes = activeEntries.filter(h => h.startTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.startTime!));
    const endTimes = activeEntries.filter(h => h.endTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.endTime!));
    const durations = activeEntries.filter(h => h.duration !== null && h.duration !== undefined && h.duration > 0 && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => h.duration as number);

    const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
    const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
    const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const totalDur = durations.reduce((a, b) => a + b, 0);

    const historyByYear: { [year: string]: any[] } = {};
    allDaysSortedFiltered.forEach(date => {
      const entry = activeEntries.find(h => h.date === date);
      const year = date.split('-')[0];
      if (!historyByYear[year]) historyByYear[year] = [];
      
      const [yStr, mStr, dStr] = date.split('-');
      const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
      let isScheduled = true;
      if (foundChunk && foundTask) {
        isScheduled = isTaskScheduledToday(foundTask, foundChunk, dateObj, userData);
      }

      if (entry) {
        let status = entry.status;
        if (!isScheduled && (status === '미실행' || status === '비활성' || status === '미기록')) {
          status = '비활성';
        }
        historyByYear[year].push({
          date,
          startTime: (status === '스킵' || status === '미실행' || status === '비활성' || !entry.startTime) ? '--:--' : entry.startTime,
          duration: (status === '스킵' || status === '미실행' || status === '비활성' || entry.duration === null || entry.duration === undefined) ? '-' : formatDurationPrecise(entry.duration),
          endTime: (status === '스킵' || status === '미실행' || status === '비활성' || !entry.endTime) ? '--:--' : entry.endTime,
          status: status
        });
      } else {
        historyByYear[year].push({
          date,
          startTime: '--:--',
          duration: '-',
          endTime: '--:--',
          status: !isScheduled ? '비활성' : '미기록'
        });
      }
    });

    return {
      title: `${taskName} 전체 기록`,
      name: taskName,
      avgRate,
      period: dateRangeStr,
      avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
      avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
      avgDuration: formatDurationPrecise(avgDur),
      totalDuration: formatDurationPrecise(totalDur),
      historyByYear
    };
  }, [selectedTaskId, userData]);
  
  // --- All Time Stats for View All ---
  const allTimeStats = useMemo(() => {
    if (!viewAllType) return null;

    const getAllRecordedDays = () => {
      const dates = new Set<string>();
      Object.keys(userData.dailyCompletionRate || {}).forEach(d => { if (d) dates.add(d); });
      (userData.taskHistory || []).forEach(h => { if (h && h.date) dates.add(h.date); });
      (userData.routineGroupHistory || []).forEach(h => { if (h && h.date) dates.add(h.date); });
      return fillMissingDates(dates);
    };

    const allDaysSorted = getAllRecordedDays();
    if (allDaysSorted.length === 0) return null;

    const dateRangeStr = `${allDaysSorted[allDaysSorted.length - 1].replace(/-/g, '.')} ~ ${allDaysSorted[0].replace(/-/g, '.')}`;

    if (viewAllType === 'overall') {
      const recordedRates = allDaysSorted
        .map(date => userData.dailyCompletionRate?.[date])
        .filter((rate): rate is number => rate !== undefined);
      
      const avgRate = recordedRates.length > 0 
        ? Math.floor(recordedRates.reduce((a, b) => a + b, 0) / recordedRates.length) 
        : 0;

      const histories = userData.routineGroupHistory || [];
      const startTimes = histories.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const endTimes = histories.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const durations = histories.filter(h => h.totalDuration > 0).map(h => h.totalDuration || 0);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const totalDur = durations.reduce((a, b) => a + b, 0);

      // Group dailyHistory by year
      const historyByYear: { [year: string]: any[] } = {};
      allDaysSorted.forEach(date => {
        const year = date.split('-')[0];
        if (!historyByYear[year]) historyByYear[year] = [];
        
        const rate = userData.dailyCompletionRate?.[date];
        const dayTaskHistory = (userData.taskHistory || []).filter(h => h.date === date && h.isActive);
        const dayGroupHistory = (userData.routineGroupHistory || []).filter(h => h.date === date && h.isActive);
        
        if (rate !== undefined || dayTaskHistory.length > 0 || dayGroupHistory.length > 0) {
          let perfect = 0, completed = 0, skipped = 0, failed = 0;
          dayTaskHistory.forEach(h => {
             if (h.status === '완벽') perfect++;
             else if (h.status === '완료') completed++;
             else if (h.status === '스킵') skipped++;
             else failed++;
          });
          const completedPerfect = completed + perfect;
          const firstStarts = dayGroupHistory.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
          const completions = dayGroupHistory.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
          const durations = dayGroupHistory.map(h => h.totalDuration || 0);
          const sumDurationSeconds = durations.reduce((a, b) => a + b, 0);

          historyByYear[year].push({
            date,
            rate: Math.floor(rate || 0) + '%',
            totalActive: dayTaskHistory.length,
            breakdown: `(${failed}/${skipped}/${completedPerfect})`,
            startTime: firstStarts.length > 0 ? minutesToTime(Math.min(...firstStarts)) : '--:--',
            endTime: completions.length > 0 ? minutesToTime(Math.max(...completions)) : '--:--',
            duration: sumDurationSeconds > 0 ? Math.floor(sumDurationSeconds / 60) + '분' : '0분'
          });
        } else {
          historyByYear[year].push({
            date,
            rate: '-',
            totalActive: 0,
            breakdown: '-',
            startTime: '--:--',
            endTime: '--:--',
            duration: '-'
          });
        }
      });

      return {
        title: '전체 기록',
        name: '전체 기록',
        avgRate,
        period: dateRangeStr,
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur),
        historyByYear
      };
    } else if (viewAllType === 'group' && selectedGroupId) {
      const group = userData.routineChunks.find(g => g.id === selectedGroupId);
      if (!group) return null;

      const groupCreationDate = getCreationDate(selectedGroupId, userData);
      const allDaysSortedFiltered = allDaysSorted.filter(date => date >= groupCreationDate);
      const dateRangeStrFiltered = allDaysSortedFiltered.length > 0 
        ? `${allDaysSortedFiltered[allDaysSortedFiltered.length - 1].replace(/-/g, '.')} ~ ${allDaysSortedFiltered[0].replace(/-/g, '.')}`
        : dateRangeStr;

      const groupHistory = (userData.routineGroupHistory || []).filter(h => h.groupId === selectedGroupId);
      const startTimes = groupHistory.filter(h => h.firstTaskStartTime).map(h => timeToMinutes(h.firstTaskStartTime!));
      const endTimes = groupHistory.filter(h => h.completedAt).map(h => timeToMinutes(h.completedAt!));
      const durations = groupHistory.filter(h => h.totalDuration > 0).map(h => h.totalDuration);

      const taskEntries = (userData.taskHistory || []).filter(h => h.groupId === selectedGroupId && h.isActive);
      const completedEntries = taskEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
      const avgRate = taskEntries.length > 0 ? Math.floor((completedEntries.length / taskEntries.length) * 100) : 0;

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const totalDur = durations.reduce((a, b) => a + b, 0);

      const historyByYear: { [year: string]: any[] } = {};
      allDaysSortedFiltered.forEach(date => {
        const entry = groupHistory.find(h => h.date === date);
        const year = date.split('-')[0];
        if (!historyByYear[year]) historyByYear[year] = [];

        const [yStr, mStr, dStr] = date.split('-');
        const yParsed = parseInt(yStr, 10);
        const mParsed = parseInt(mStr, 10);
        const dParsed = parseInt(dStr, 10);
        const dateObj = new Date(yParsed, mParsed - 1, dParsed);
        const dayOfWeek = dateObj.getDay();

        const isNormallyInactive = group
          ? (!group.scheduledDays?.includes(dayOfWeek) && !group.forcedActiveDates?.includes(date))
          : false;

        const isSkipped = group
          ? (group.inactiveDates?.includes(date) || userData.inactiveChunks?.[date]?.includes(selectedGroupId))
          : (userData.inactiveChunks?.[date]?.includes(selectedGroupId));

        const isRestDay = !isSkipped && (
          entry 
            ? (entry.completionStatus === '비활성' || entry.isActive === false)
            : isNormallyInactive
        );

        const dayTaskEntries = taskEntries.filter(h => h.date === date);
        const activeTasksOnDate = dayTaskEntries;
        let allActiveTasksUnexecuted = false;
        if (activeTasksOnDate.length > 0) {
          allActiveTasksUnexecuted = activeTasksOnDate.every(t => 
            !t.status || t.status === '미실행' || t.status === '비활성'
          );
        } else if (group) {
          const isNormallyActiveOnDate = (group.scheduledDays?.includes(dayOfWeek) || group.forcedActiveDates?.includes(date)) && !group.inactiveDates?.includes(date);
          if (isNormallyActiveOnDate) {
            allActiveTasksUnexecuted = true;
          }
        }

        const isUnexecuted = !isRestDay && !isSkipped && (
          entry?.completionStatus === '미실행' || 
          entry?.completionStatus === 'fail' ||
          (entry && !entry.firstTaskStartTime && entry.totalDuration === 0) ||
          (!entry && allActiveTasksUnexecuted)
        );

        const todayStr = formatDate(currentTime);
        const isPastDate = date < todayStr;
        const isRecordMissing = !isRestDay && !isSkipped && !isUnexecuted && (
          isPastDate && !entry && dayTaskEntries.length === 0
        );

        if (isRestDay) {
          historyByYear[year].push({
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '쉬는요일',
            status: '쉬는요일'
          });
        } else if (isSkipped) {
          historyByYear[year].push({
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '건너뜀',
            status: '건너뜀'
          });
        } else if (isRecordMissing) {
          historyByYear[year].push({
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            rate: '기록없음',
            status: '기록없음'
          });
        } else {
          const dayCompleted = dayTaskEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵').length;
          const dayRate = dayTaskEntries.length > 0 ? Math.floor((dayCompleted / dayTaskEntries.length) * 100) : 0;

          historyByYear[year].push({
            date,
            startTime: entry?.firstTaskStartTime || '미실행',
            duration: entry ? formatDurationPrecise(entry.totalDuration) : '0초',
            endTime: entry?.completedAt || '미완료',
            rate: dayRate + '%',
            status: entry?.completionStatus || '미실행'
          });
        }
      });

      return {
        title: `${group.name} 전체 기록`,
        name: group.name,
        avgRate,
        period: dateRangeStrFiltered,
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur),
        historyByYear
      };
    } else if (viewAllType === 'task' && selectedTaskId) {
      let taskName = '';
      let foundChunk: any = null;
      let foundTask: any = null;
      for (const chunk of userData.routineChunks) {
        const task = chunk.tasks.find(t => t.id === selectedTaskId);
        if (task) {
          taskName = task.text;
          foundChunk = chunk;
          foundTask = task;
          break;
        }
      }

      const taskCreationDate = getCreationDate(selectedTaskId, userData);
      const allDaysSortedFiltered = allDaysSorted.filter(date => date >= taskCreationDate);
      const dateRangeStrFiltered = allDaysSortedFiltered.length > 0 
        ? `${allDaysSortedFiltered[allDaysSortedFiltered.length - 1].replace(/-/g, '.')} ~ ${allDaysSortedFiltered[0].replace(/-/g, '.')}`
        : dateRangeStr;

      const taskHistory = (userData.taskHistory || []).filter(h => h.taskId === selectedTaskId);
      const activeEntries = taskHistory.filter(h => h.isActive);
      const attainmentEntries = activeEntries.filter(h => h.status === '완벽' || h.status === '완료' || h.status === '스킵');
      const avgRate = activeEntries.length > 0 ? Math.floor((attainmentEntries.length / activeEntries.length) * 100) : 0;

      const startTimes = activeEntries.filter(h => h.startTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.startTime!));
      const endTimes = activeEntries.filter(h => h.endTime && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => timeToMinutes(h.endTime!));
      const durations = activeEntries.filter(h => h.duration !== null && h.duration !== undefined && h.duration > 0 && h.status !== '스킵' && h.status !== '미실행' && h.status !== '비활성').map(h => h.duration as number);

      const avgStart = startTimes.length > 0 ? startTimes.reduce((a, b) => a + b, 0) / startTimes.length : null;
      const avgEnd = endTimes.length > 0 ? endTimes.reduce((a, b) => a + b, 0) / endTimes.length : null;
      const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const totalDur = durations.reduce((a, b) => a + b, 0);

      const historyByYear: { [year: string]: any[] } = {};
      allDaysSortedFiltered.forEach(date => {
        const entry = activeEntries.find(h => h.date === date);
        const year = date.split('-')[0];
        if (!historyByYear[year]) historyByYear[year] = [];
        
        const [yStr, mStr, dStr] = date.split('-');
        const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
        let isScheduled = true;
        if (foundChunk && foundTask) {
          isScheduled = isTaskScheduledToday(foundTask, foundChunk, dateObj, userData);
        }

        if (entry) {
          let status = entry.status;
          if (!isScheduled && (status === '미실행' || status === '비활성' || status === '미기록')) {
            status = '비활성';
          }
          historyByYear[year].push({
            date,
            startTime: (status === '스킵' || status === '미실행' || status === '비활성' || !entry.startTime) ? '--:--' : entry.startTime,
            duration: (status === '스킵' || status === '미실행' || status === '비활성' || entry.duration === null || entry.duration === undefined) ? '-' : formatDurationPrecise(entry.duration),
            endTime: (status === '스킵' || status === '미실행' || status === '비활성' || !entry.endTime) ? '--:--' : entry.endTime,
            status: status
          });
        } else {
          historyByYear[year].push({
            date,
            startTime: '--:--',
            duration: '-',
            endTime: '--:--',
            status: !isScheduled ? '비활성' : '미기록'
          });
        }
      });

      return {
        title: `${taskName} 전체 기록`,
        name: taskName,
        avgRate,
        period: dateRangeStrFiltered,
        avgStart: avgStart !== null ? minutesToTime(avgStart) : '--:--',
        avgEnd: avgEnd !== null ? minutesToTime(avgEnd) : '--:--',
        avgDuration: formatDurationPrecise(avgDur),
        totalDuration: formatDurationPrecise(totalDur),
        historyByYear
      };
    }
    return null;
  }, [viewAllType, selectedTaskId, selectedGroupId, userData, last7Days, last30Days]);

  const isSunday = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    return new Date(y, m - 1, d).getDay() === 0;
  };

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

  const renderAllRecordsView = () => {
    if (!allTimeStats) return null;

    const years = Object.keys(allTimeStats.historyByYear).sort((a, b) => b.localeCompare(a));

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderFolderTabs()}
        <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10 p-4 md:p-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setViewAllType(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h2 className="text-xl font-black text-slate-900">
                {viewAllType === 'group' ? (
                  <><span className="text-indigo-600">{allTimeStats.name}</span> 전체 기록</>
                ) : viewAllType === 'task' ? (
                  <><span className="text-indigo-400">{allTimeStats.name}</span> 전체 기록</>
                ) : (
                  allTimeStats.title
                )}
              </h2>
            </div>

            <div className="py-8 bg-slate-50/50 rounded-[20px] border border-slate-100">
              <div className="text-center space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">평균 달성률</p>
                <p className="text-[11px] font-bold text-slate-300">{allTimeStats.period}</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{allTimeStats.avgRate}%</h3>
                <div className="mt-4 flex flex-col items-center gap-1 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{allTimeStats.avgStart} ~ {allTimeStats.avgEnd}</span>
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-slate-400">평균 소요 시간: <span className="text-indigo-600 font-black">{allTimeStats.avgDuration}</span></span>
                    <span className="text-slate-400">누적 소요 시간: <span className="text-indigo-600 font-black">{allTimeStats.totalDuration}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {years.map(year => (
                <section key={year} className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {year}년 기록
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">{allTimeStats.historyByYear[year].length}개의 기록</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        {viewAllType === 'task' ? (
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">날짜</th>
                            <th className="px-2 py-2 text-center">시작</th>
                            <th className="px-2 py-2 text-center">소요</th>
                            <th className="px-2 py-2 text-center">완료</th>
                            <th className="px-2 py-2 text-center">상태</th>
                          </tr>
                        ) : viewAllType === 'group' ? (
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">날짜</th>
                            <th className="px-2 py-2 text-center">시작</th>
                            <th className="px-2 py-2 text-center">소요</th>
                            <th className="px-2 py-2 text-center">완료</th>
                            <th className="px-2 py-2 text-right">달성률</th>
                          </tr>
                        ) : (
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">날짜</th>
                            <th className="px-2 py-2">달성률</th>
                            <th className="px-2 py-2">
                              루틴{viewAllType === 'overall' && <span className="block md:inline">(미완료/스킵/완료)</span>}
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
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allTimeStats.historyByYear[year].map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/40 active:bg-indigo-100/40 transition-colors cursor-pointer" onClick={() => setSelectedHistoryDate(row.date)}>
                            {viewAllType === 'task' ? (
                              <>
                                <td className={`px-2 py-2 font-bold whitespace-nowrap ${isSunday(row.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{row.date.split('-').slice(1).join('/')}</td>
                                <td className="px-2 py-2 text-center font-black text-slate-700">{row.startTime}</td>
                                <td className="px-2 py-2 text-center font-bold text-indigo-600">{row.duration}</td>
                                <td className="px-2 py-2 text-center font-black text-slate-700">{row.endTime}</td>
                                <td className="px-2 py-2">{renderStatusIcon(row.status)}</td>
                              </>
                            ) : viewAllType === 'group' ? (
                               <>
                                 <td className={`px-2 py-2 font-bold tracking-tighter whitespace-nowrap ${isSunday(row.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{row.date.split('-').slice(1).join('/')}</td>
                                 <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.startTime}</td>
                                 <td className="px-2 py-2 text-center font-bold text-indigo-600 tracking-tighter">{row.duration}</td>
                                 <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.endTime}</td>
                                 <td className="px-2 py-2 text-right font-black tracking-tighter">
                                   {row.rate === '쉬는요일' || row.rate === '건너뜀' || row.rate === '기록없음' ? (
                                     <span className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-[6px] whitespace-nowrap ${
                                       row.rate === '쉬는요일' ? 'text-slate-400 bg-slate-100 border border-slate-200' :
                                       row.rate === '건너뜀' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
                                       'text-slate-400 bg-slate-50 border border-dashed border-slate-200'
                                     }`}>
                                       {row.rate}
                                     </span>
                                   ) : (
                                     <span className="text-emerald-600">{row.rate}</span>
                                   )}
                                 </td>
                               </>
                            ) : (
                              <>
                                <td className={`px-2 py-2 font-bold whitespace-nowrap ${isSunday(row.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{row.date.split('-').slice(1).join('/')}</td>
                                <td className="px-2 py-2 font-black text-violet-600">{row.rate}</td>
                                <td className="px-2 py-2 font-bold text-slate-700 whitespace-nowrap">
                                  {viewAllType === 'group' ? row.status : `${row.totalActive}${row.breakdown}`}
                                </td>
                                <td className="px-2 py-2 text-center font-black text-slate-700">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-0 md:gap-1 tracking-tighter">
                                    <span>{row.startTime}</span>
                                    <span className="text-[8px] text-slate-300 md:text-xs">~</span>
                                    <span>{row.endTime}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right font-black text-indigo-600">{row.duration}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedHistoryDate && (() => {
            const dateStr = selectedHistoryDate;
            const formattedDate = (() => {
              if (!dateStr || !dateStr.includes('-')) return dateStr;
              const [y, m, d] = dateStr.split('-').map(Number);
              if (viewAllType === 'group' && selectedGroupId) {
                return `${y}년 ${m}월 ${d}일`;
              }
              return `${y}년 ${m}월 ${d}일 전체 기록`;
            })();

            // 1. Gather all unique group IDs from:
            //    - Current routine chunks that existed on or before dateStr
            //    - Historical logs for this date (resilience for deleted groups)
            const aliveGroupsOnDate = (userData.routineChunks || []).filter(group => {
              const creationDate = getCreationDate(group.id, userData);
              const createdOnOrBefore = dateStr >= creationDate;
              return createdOnOrBefore;
            });

            const histGroupIds = new Set<string>();
            (userData.routineGroupHistory || []).forEach(h => {
              if (h.date === dateStr) {
                histGroupIds.add(h.groupId);
              }
            });
            (userData.taskHistory || []).forEach(h => {
              if (h.date === dateStr) {
                histGroupIds.add(h.groupId);
              }
            });

            const allGroupKeys = Array.from(new Set([
              ...aliveGroupsOnDate.map(g => g.id),
              ...Array.from(histGroupIds)
            ])).filter(groupId => {
              const creationDate = getCreationDate(groupId, userData);
              return dateStr >= creationDate;
            });

            // Gather all daily routine groups and tasks details based on existing history data
            let groups = allGroupKeys.map(groupId => {
              const aliveGroup = (userData.routineChunks || []).find(g => g.id === groupId);
              const groupHistEntry = (userData.routineGroupHistory || []).find(
                h => h.date === dateStr && h.groupId === groupId
              );
              const taskHistEntries = (userData.taskHistory || []).filter(
                h => h.groupId === groupId && h.date === dateStr
              );

              // active tasks vs completed tasks on this date to get exact completion rate
              const activeTasks = taskHistEntries.filter(t => t.isActive);
              const completedTasksCount = activeTasks.filter(
                t => t.status === '완벽' || t.status === '완료' || t.status === '스킵'
              ).length;
              
              let percentageStr = activeTasks.length > 0 
                ? Math.floor((completedTasksCount / activeTasks.length) * 100) + '%'
                : (groupHistEntry ? '0%' : '-');

              // Determine if it is actually inactive/skipped
              const [yStr, mStr, dStr] = dateStr.split('-');
              const yParsed = parseInt(yStr, 10);
              const mParsed = parseInt(mStr, 10);
              const dParsed = parseInt(dStr, 10);
              const dateObj = new Date(yParsed, mParsed - 1, dParsed);
              const dayOfWeek = dateObj.getDay();

              // Calculate special states
              const todayStr = formatDate(currentTime);
              const isPastDate = dateStr < todayStr;

              const isNormallyInactive = aliveGroup
                ? (!aliveGroup.scheduledDays?.includes(dayOfWeek) && !aliveGroup.forcedActiveDates?.includes(dateStr))
                : false;

              // 2. 건너뜀 (User manually skipped/today-skipped)
              const isSkipped = aliveGroup
                ? (aliveGroup.inactiveDates?.includes(dateStr) || userData.inactiveChunks?.[dateStr]?.includes(groupId))
                : (userData.inactiveChunks?.[dateStr]?.includes(groupId));

              // 1. 쉬는요일 (normally inactive, and not active)
              const isRestDay = !isSkipped && (
                groupHistEntry 
                  ? (groupHistEntry.completionStatus === '비활성' || groupHistEntry.isActive === false)
                  : isNormallyInactive
              );

              // 3. 미실행 (active target, but all unexecuted)
              const activeTasksOnDate = taskHistEntries.filter(t => t.isActive);
              let allActiveTasksUnexecuted = false;
              if (activeTasksOnDate.length > 0) {
                allActiveTasksUnexecuted = activeTasksOnDate.every(t => 
                  !t.status || t.status === '미실행' || t.status === '비활성'
                );
              } else if (aliveGroup) {
                const isNormallyActiveOnDate = (aliveGroup.scheduledDays?.includes(dayOfWeek) || aliveGroup.forcedActiveDates?.includes(dateStr)) && !aliveGroup.inactiveDates?.includes(dateStr);
                if (isNormallyActiveOnDate) {
                  allActiveTasksUnexecuted = true;
                }
              }

              const isUnexecuted = !isRestDay && !isSkipped && (
                groupHistEntry?.completionStatus === '미실행' || 
                groupHistEntry?.completionStatus === 'fail' ||
                (groupHistEntry && !groupHistEntry.firstTaskStartTime && groupHistEntry.totalDuration === 0) ||
                (!groupHistEntry && allActiveTasksUnexecuted)
              );

              // 4. 기록누락 (past date, target active day, but no data at all)
              const isRecordMissing = !isRestDay && !isSkipped && !isUnexecuted && (
                isPastDate && !groupHistEntry && taskHistEntries.length === 0
              );

              let specialState: '쉬는요일' | '건너뜀' | '미실행' | '기록누락' | null = null;
              if (isRestDay) {
                specialState = '쉬는요일';
              } else if (isSkipped) {
                specialState = '건너뜀';
              } else if (isUnexecuted) {
                specialState = '미실행';
              } else if (isRecordMissing) {
                specialState = '기록누락';
              }

              let groupStatus: '정상' | '비활성' | '쉬어감' = '정상';
              
              if (aliveGroup) {
                const isManuallySkipped = aliveGroup.inactiveDates?.includes(dateStr);
                const isNormallyInactiveVal = !aliveGroup.scheduledDays?.includes(dayOfWeek) && !aliveGroup.forcedActiveDates?.includes(dateStr);
                
                if (isManuallySkipped) {
                  groupStatus = '쉬어감';
                } else if (isNormallyInactiveVal || groupHistEntry?.completionStatus === '비활성' || groupHistEntry?.isActive === false) {
                  groupStatus = '비활성';
                }
              } else {
                // For deleted groups
                if (groupHistEntry?.completionStatus === '비활성' || groupHistEntry?.isActive === false) {
                  groupStatus = '비활성';
                }
              }

              // Retrieve tasks if not inactive/skipped/special
              let tasks: any[] = [];
              if (groupStatus === '정상' && !specialState) {
                const aliveTasks = aliveGroup ? (aliveGroup.tasks || []) : [];
                const aliveTasksOnDate = aliveTasks.filter(task => {
                  const tCreateDate = getCreationDate(task.id, userData);
                  const tCreatedOnOrBefore = dateStr >= tCreateDate;
                  return tCreatedOnOrBefore;
                });
                
                const histTasksOnDate = taskHistEntries;
                const allTaskIds = Array.from(new Set([
                  ...aliveTasksOnDate.map(t => t.id),
                  ...histTasksOnDate.map(t => t.taskId)
                ])).filter(taskId => {
                  const tCreateDate = getCreationDate(taskId, userData);
                  return dateStr >= tCreateDate;
                });

                tasks = allTaskIds.map(taskId => {
                  const aliveTask = aliveTasksOnDate.find(t => t.id === taskId);
                  const taskHistEntry = histTasksOnDate.find(t => t.taskId === taskId);

                  let isScheduled = true;
                  if (aliveGroup && aliveTask) {
                    isScheduled = isTaskScheduledToday(aliveTask, aliveGroup, dateObj, userData);
                  }

                  let finalStatus = taskHistEntry?.status || '미실행';
                  if (!isScheduled && (finalStatus === '미실행' || finalStatus === '미기록' || finalStatus === '비활성')) {
                    finalStatus = '비활성';
                  }

                  let displayStartTime = taskHistEntry?.startTime || '--:--';
                  let displayEndTime = taskHistEntry?.endTime || '--:--';
                  let displayDuration = taskHistEntry?.duration ? formatDurationPrecise(taskHistEntry.duration) : '-';

                  if (finalStatus === '비활성') {
                    displayStartTime = '--:--';
                    displayEndTime = '--:--';
                    displayDuration = '-';
                  }

                  return {
                    id: taskId,
                    name: aliveTask ? aliveTask.text : '삭제된 루틴',
                    startTime: displayStartTime,
                    endTime: displayEndTime,
                    duration: displayDuration,
                    status: finalStatus,
                    isActive: taskHistEntry ? taskHistEntry.isActive : isScheduled
                  };
                });
              }

              // Format duration & percentage for inactive/skipped
              let displayStartTime = groupHistEntry?.firstTaskStartTime || '--:--';
              let displayEndTime = groupHistEntry?.completedAt || '--:--';
              let displayDuration = groupHistEntry?.totalDuration ? formatDurationPrecise(groupHistEntry.totalDuration) : '-';
              
              if (groupStatus === '비활성') {
                displayStartTime = '비활성';
                displayEndTime = '';
                displayDuration = '';
                percentageStr = '';
              } else if (groupStatus === '쉬어감') {
                displayStartTime = '쉬어감';
                displayEndTime = '';
                displayDuration = '';
                percentageStr = '';
              }

              if (specialState) {
                displayStartTime = specialState;
                displayEndTime = '';
                displayDuration = '';
                percentageStr = '';
                tasks = [];
              }

              return {
                id: groupId,
                name: aliveGroup ? aliveGroup.name : '삭제된 그룹',
                startTime: displayStartTime,
                endTime: displayEndTime,
                duration: displayDuration,
                percentage: percentageStr,
                status: groupHistEntry?.completionStatus || '미실행',
                groupStatus,
                specialState,
                tasks
              };
            });

            if (viewAllType === 'group' && selectedGroupId) {
              groups = groups.filter(g => g.id === selectedGroupId);
            }

            const formatTimeCompact = (timeStr: string) => {
              if (!timeStr || timeStr === '--:--' || timeStr === '비활성' || timeStr === '쉬어감' || 
                  timeStr === '쉬는요일' || timeStr === '건너뜀' || timeStr === '미실행' || timeStr === '기록누락') return timeStr;
              const parts = timeStr.trim().split(':');
              if (parts.length >= 2) {
                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
              }
              return timeStr;
            };

            const getTaskStatusCircle = (status: string) => {
              if (status === '완벽') {
                return (
                  <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                    <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                    <CheckCheck className="absolute w-[60%] h-[60%] text-indigo-600" strokeWidth={3} />
                  </div>
                );
              }
              if (status === '완료') {
                return (
                  <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                    <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                    <Check className="w-3 h-3 text-indigo-600" strokeWidth={3} />
                  </div>
                );
              }
              if (status === '스킵') {
                return <CircleMinus className="w-5 h-5 text-[#CC9900] shrink-0" />;
              }
              if (status === '실행중') {
                return <CircleDot className="w-5 h-5 text-indigo-500 animate-pulse shrink-0" />;
              }
              if (status === '일시정지') {
                return <PauseCircle className="w-5 h-5 text-amber-500 shrink-0" />;
              }
              if (status === '비활성' || status === '쉬는요일') {
                return (
                  <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                    <Circle className="absolute inset-0 w-full h-full text-slate-200" />
                    <X className="w-3 h-3 text-slate-400" strokeWidth={4} />
                  </div>
                );
              }
              return <Circle className="w-5 h-5 text-slate-300 shrink-0" />;
            };

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-3 cursor-default touch-none"
                onClick={() => setSelectedHistoryDate(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="bg-white rounded-[20px] shadow-2xl border border-slate-100 max-h-[82vh] flex flex-col w-full max-w-lg md:max-w-xl lg:max-w-2xl overflow-hidden relative text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-2.5 sm:py-3.5 px-3 sm:px-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                      {formattedDate}
                    </h3>
                    <button
                      onClick={() => setSelectedHistoryDate(null)}
                      className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-2 sm:p-4 overflow-y-auto flex-1 bg-white space-y-3 overscroll-contain">
                    {groups.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 font-bold text-xs">
                        설정된 루틴 그룹이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groups.map(group => (
                          <div key={group.id} className="space-y-0.5">
                            {/* Group Header Row: Soft Background Accent */}
                            <div className="grid grid-cols-12 items-center gap-1.5 sm:gap-2 bg-indigo-100/60 hover:bg-indigo-100/85 py-1.5 px-1.5 sm:px-2 rounded-[8px] border border-indigo-100/30 transition-colors">
                              <div className="col-span-4 flex items-center gap-1 min-w-0">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">{group.name}</h4>
                              </div>
                              <div className="col-span-3 text-center text-[10px] sm:text-xs font-bold text-slate-500 font-mono">
                                {group.specialState ? (
                                  <span className={`text-[9px] sm:text-[11px] font-black px-1 sm:px-1.5 py-0.5 rounded-[5px] sm:rounded-[6px] whitespace-nowrap ${
                                    group.specialState === '쉬는요일' ? 'text-slate-400 bg-slate-100 border border-slate-200' :
                                    group.specialState === '건너뜀' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
                                    group.specialState === '미실행' ? 'text-rose-500 bg-rose-50 border border-rose-100/70' :
                                    'text-slate-400 bg-slate-50 border border-dashed border-slate-200' /* 기록누락 */
                                  }`}>
                                    {group.specialState}
                                  </span>
                                ) : group.groupStatus === '비활성' || group.groupStatus === '쉬어감' ? (
                                  <span className={`text-[9px] sm:text-[11px] font-black px-1 sm:px-1.5 py-0.5 rounded-[5px] sm:rounded-[6px] whitespace-nowrap ${
                                    group.groupStatus === '쉬어감' ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-slate-400 bg-slate-100 border border-slate-200'
                                  }`}>
                                    {group.startTime}
                                  </span>
                                ) : (
                                  <span className="whitespace-nowrap text-[10px] sm:text-xs font-semibold">{formatTimeCompact(group.startTime)}~{formatTimeCompact(group.endTime)}</span>
                                )}
                              </div>
                              <div className="col-span-3 text-right text-xs sm:text-sm font-black text-indigo-600 font-mono pr-1">
                                <span>{group.duration}</span>
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <span className="text-xs sm:text-sm font-black text-indigo-600 leading-none">
                                  {group.percentage}
                                </span>
                              </div>
                            </div>

                            {/* Task List under Group */}
                            {!group.specialState && group.groupStatus === '정상' && (
                              <div className="divide-y divide-slate-50">
                                {group.tasks.length === 0 ? (
                                  <div className="text-slate-400 font-bold pl-2 py-1 text-[12px]">등록된 개별 루틴이 없습니다.</div>
                                ) : (
                                  group.tasks.map(task => (
                                    <div key={task.id} className="grid grid-cols-12 items-center gap-1.5 sm:gap-2 py-1 px-1 sm:px-1.5 hover:bg-slate-50/40 rounded-lg transition-colors">
                                      <div className="col-span-4 flex items-center pl-1 sm:pl-2 min-w-0">
                                        <span className="text-xs sm:text-sm font-bold text-slate-700 truncate">{task.name}</span>
                                      </div>
                                      <div className="col-span-3 text-center text-[10px] sm:text-xs font-bold text-slate-400 font-mono">
                                        <span className="whitespace-nowrap">{formatTimeCompact(task.startTime)}~{formatTimeCompact(task.endTime)}</span>
                                      </div>
                                      <div className="col-span-3 text-right text-xs sm:text-sm font-bold text-indigo-500/95 font-mono pr-1">
                                        <span>{task.duration}</span>
                                      </div>
                                      <div className="col-span-2 flex justify-end">
                                        {getTaskStatusCircle(task.status)}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  };

  const usageStatsGroups = useMemo(() => {
    const logs = userData.dailyActivityLog || {};
    const dates = Object.keys(logs).sort((a, b) => b.localeCompare(a));
    const colorList = ['#E5E7EB', '#000000', '#FACC15', '#F97316', '#EF4444']; // 0:Gray, 1:Black, 2:Yellow, 3:Orange, 4:Red
    
    const groups: { [year: string]: any[] } = {};
    
    dates.forEach(date => {
      const year = date.split('-')[0];
      if (!groups[year]) groups[year] = [];
      
      const log = logs[date];
      const stops = [];
      let start = 0;
      let currentColor = log[0];
      
      for (let i = 1; i <= log.length; i++) {
        const val = i < log.length ? log[i] : -1;
        if (val !== currentColor) {
          const colorCode = colorList[currentColor] || '#e2e8f0';
          const startPct = (start / 1440) * 100;
          const endPct = (i / 1440) * 100;
          stops.push(`${colorCode} ${startPct}% ${endPct}%`);
          start = i;
          currentColor = val;
        }
      }

      let totalUsageSeconds = 0;
      if (date === todayStr) {
        totalUsageSeconds = userData.routineChunks.reduce((acc, chunk) => {
          const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData));
          const chunkDuration = scheduledTasks.reduce((taskAcc, task) => {
            if (task.completed) {
              return taskAcc + (task.duration || 0);
            }
            return taskAcc + calculateTaskDuration(task, currentTime);
          }, 0);
          return acc + chunkDuration;
        }, 0);
      } else {
        totalUsageSeconds = (userData.routineGroupHistory || [])
          .filter(h => h.date === date)
          .reduce((acc, h) => acc + (h.totalDuration || 0), 0);
      }
      
      groups[year].push({
        date,
        gradient: `linear-gradient(to right, ${stops.join(', ')})`,
        totalMinutes: Math.floor(totalUsageSeconds / 60),
        totalSeconds: totalUsageSeconds
      });
    });
    
    return groups;
  }, [userData.dailyActivityLog, userData.routineGroupHistory, userData.routineChunks, todayStr, currentTime, userData]);

  if (viewAllType) {
    return renderAllRecordsView();
  }

  if (selectedTaskId && taskDetailData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderFolderTabs()}
        <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10 p-4 md:p-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              {!isSingleTaskStatsOnly && (
                <button 
                  onClick={() => {
                    setSelectedTaskId(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
              )}
              <h2 className="text-xl font-black text-slate-900"><span className="text-indigo-400">{taskDetailData.name}</span> 상세 통계</h2>
            </div>

            {/* 1. 지난 7일 평균 달성률 : 지난 30일 평균 달성률 */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 7일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{taskDetailData.avgRate7}{taskDetailData.avgRate7 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{taskDetailData.avgStart7} ~ {taskDetailData.avgEnd7}</div>
                  <div className="text-slate-400">(평균 {taskDetailData.avgDuration7})</div>
                  <div className="text-slate-400">(누적 {taskDetailData.totalDuration7})</div>
                </div>
              </div>
              <div className="text-center space-y-1 border-l border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{taskDetailData.avgRate30}{taskDetailData.avgRate30 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{taskDetailData.avgStart30} ~ {taskDetailData.avgEnd30}</div>
                  <div className="text-slate-400">(평균 {taskDetailData.avgDuration30})</div>
                  <div className="text-slate-400">(누적 {taskDetailData.totalDuration30})</div>
                </div>
              </div>
            </div>

            {/* 2. 평균 달성률 (전체 평균 달성률 박스) */}
            {taskAllTimeStats && (
              <div className="py-8 bg-slate-50/50 rounded-[20px] border border-slate-100">
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">평균 달성률</p>
                  <p className="text-[11px] font-bold text-slate-300">{taskAllTimeStats.period}</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{taskAllTimeStats.avgRate}%</h3>
                  <div className="mt-4 flex flex-col items-center gap-1 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{taskAllTimeStats.avgStart} ~ {taskAllTimeStats.avgEnd}</span>
                    </div>
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-slate-400">평균 소요 시간: <span className="text-indigo-600 font-black">{taskAllTimeStats.avgDuration}</span></span>
                      <span className="text-slate-400">누적 소요 시간: <span className="text-indigo-600 font-black">{taskAllTimeStats.totalDuration}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 연도별 기록 표 */}
            {taskAllTimeStats && (
              <div className="space-y-10">
                {Object.keys(taskAllTimeStats.historyByYear).sort((a, b) => b.localeCompare(a)).map(year => (
                  <section key={year} className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {year}년 기록
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400">{taskAllTimeStats.historyByYear[year].length}개의 기록</span>
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
                          {taskAllTimeStats.historyByYear[year].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className={`px-2 py-2 font-bold whitespace-nowrap ${isSunday(row.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{row.date.split('-').slice(1).join('/')}</td>
                              <td className="px-2 py-2 text-center font-black text-slate-700">{row.startTime}</td>
                              <td className="px-2 py-2 text-center font-bold text-indigo-600">{row.duration}</td>
                              <td className="px-2 py-2 text-center font-black text-slate-700">{row.endTime}</td>
                              <td className="px-2 py-2 flex justify-center">{renderStatusIcon(row.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedGroupId && detailData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderFolderTabs()}
        {/* Main Folder Content Body */}
        <div className="bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 overflow-hidden relative z-10 p-4 md:p-6">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              {!isSingleGroupStatsOnly && (
                <button 
                  onClick={() => {
                    if (isSingleGroupStatsOnly && onBackOverride) {
                      onBackOverride();
                    } else {
                      setSelectedGroupId(null);
                    }
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
              )}
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900"><span className="text-indigo-600">{detailData.name}</span> 상세 통계</h2>
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
                  <div className="text-slate-400">(누적 {detailData.totalDuration7})</div>
                </div>
              </div>
              <div className="text-center space-y-1 border-l border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">지난 30일 평균 달성률</p>
                <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{detailData.avgRate30}{detailData.avgRate30 !== '-' ? '%' : ''}</h3>
                <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                  <div>{detailData.avgStart30} ~ {detailData.avgEnd30}</div>
                  <div className="text-slate-400">(평균 {detailData.avgDuration30})</div>
                  <div className="text-slate-400">(누적 {detailData.totalDuration30})</div>
                </div>
              </div>
            </div>

            {/* 7-Day History Table 루틴그룹별 최근 7일간 통계*/}
            <section className="bg-white rounded-[15px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  최근 7일 기록
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
                    {detailData.history7.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className={`px-2 py-2 font-bold tracking-tighter whitespace-nowrap ${isSunday(row.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{row.date.split('-').slice(1).join('/')}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.startTime}</td>
                        <td className="px-2 py-2 text-center font-bold text-indigo-600 tracking-tighter">{row.duration}</td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{row.endTime}</td>
                        <td className="px-2 py-2 text-right font-black tracking-tighter">
                          {row.rate === '쉬는요일' || row.rate === '건너뜀' || row.rate === '기록없음' ? (
                            <span className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-[6px] whitespace-nowrap ${
                              row.rate === '쉬는요일' ? 'text-slate-400 bg-slate-100 border border-slate-200' :
                              row.rate === '건너뜀' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
                              'text-slate-400 bg-slate-50 border border-dashed border-slate-200'
                            }`}>
                              {row.rate}
                            </span>
                          ) : (
                            <span className="text-emerald-600">{row.rate}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-50">
                <button 
                  onClick={() => setViewAllType('group')}
                  className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                >
                  모든 기록 확인
                  <ChevronRight className="w-3.5 h-3.5" />
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
      {renderFolderTabs()}

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
                    <h2 className="text-lg font-black text-slate-800">{t('stats.wakeUpStats')}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('stats.avg7')}</p>
                      <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{wakeUpStats.avgTime7}</h3>
                    </div>
                    <div className="text-center space-y-1 border-l border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('stats.avg30')}</p>
                      <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{wakeUpStats.avgTime30}</h3>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.keys(wakeUpStats.historyByYear).sort((a, b) => b.localeCompare(a)).map(year => (
                      <div key={year} className="bg-white rounded-[15px] border border-slate-100 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {t('stats.historyYear', { year })}
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                                <th className="px-2 py-2">{t('stats.date')}</th>
                                <th className="px-2 py-2">{t('stats.targetTime')}</th>
                                <th className="px-2 py-2 font-black text-indigo-600">{t('stats.wakeUpTime')}</th>
                                <th className="px-2 py-2 text-right">{t('stats.status')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {wakeUpStats.historyByYear[year].map((h, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className={`px-2 py-2 font-bold ${isSunday(h.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{h.date.split('-').slice(1).join('/')}</td>
                                  <td className="px-2 py-2 font-bold text-slate-400">{h.targetTime}</td>
                                  <td className="px-2 py-2 font-black text-indigo-600">{h.wakeUpTime || '--:--'}</td>
                                  <td className="px-2 py-2 text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                                      h.status === '달성' ? 'bg-emerald-100 text-emerald-600' : 
                                      h.status === '지각' ? 'bg-rose-100 text-rose-600' : 
                                      'bg-slate-200 text-slate-400'
                                    }`}>
                                      {h.status === '달성' ? t('status.달성') : h.status === '지각' ? t('status.지각') : t('status.미기록')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {Object.keys(wakeUpStats.historyByYear).length === 0 && (
                      <div className="bg-white rounded-[15px] border border-slate-100 p-8 text-center text-slate-400 font-bold">
                        {t('stats.noRecords')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'achievement' ? (
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
                    <h2 className="text-lg font-black text-slate-800">{t('stats.achievementStats')}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('stats.avgAchievement7')}</p>
                      <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last7Days)}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate7}{achievementStats.avgTotalRate7 !== '-' ? '%' : ''}</h3>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                        <div>{achievementStats.avgStart7} ~ {achievementStats.avgEnd7}</div>
                        <div className="text-slate-400">({t('stats.avgDuration')}: {achievementStats.avgDuration7})</div>
                        <div className="text-slate-400">({t('stats.sum')}: {achievementStats.totalDuration7})</div>
                      </div>
                    </div>
                    <div className="text-center space-y-1 border-l border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('stats.avgAchievement30')}</p>
                      <p className="text-[10px] font-bold text-slate-300">{getDateRangeStr(last30Days)}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{achievementStats.avgTotalRate30}{achievementStats.avgTotalRate30 !== '-' ? '%' : ''}</h3>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 leading-tight">
                        <div>{achievementStats.avgStart30} ~ {achievementStats.avgEnd30}</div>
                        <div className="text-slate-400">({t('stats.avgDuration')}: {achievementStats.avgDuration30})</div>
                        <div className="text-slate-400">({t('stats.sum')}: {achievementStats.totalDuration30})</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[15px] border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <History className="w-4 h-4 text-violet-500" />
                        {t('stats.historyRecent7')}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="px-2 py-2">{t('stats.date')}</th>
                            <th className="px-2 py-2">{t('stats.achievementRate')}</th>
                            <th className="px-2 py-2 md:whitespace-nowrap">
                              {t('stats.routineBreakdown')}
                            </th>
                            <th className="px-2 py-2 text-center">
                              <span>{t('stats.startEnd')}</span>
                            </th>
                            <th className="px-2 py-2 text-right">{t('stats.sum')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {achievementStats.dailyHistory7.map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className={`px-2 py-2 font-bold ${isSunday(h.date) ? 'text-[#8B0000]' : 'text-slate-500'}`}>{h.date.split('-').slice(1).join('/')}</td>
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
                        onClick={() => setViewAllType('overall')}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors py-2"
                      >
                        {t('stats.allRecords')}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>






                  <div className="space-y-4">

                  <div className="flex items-center gap-3">
                    <div className="bg-violet-50 p-2.5 rounded-[12px]">
                      <Target className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-black text-slate-800">{t('stats.groupStats')}</h2>
                      <p className="text-[10px] font-bold text-slate-400">{t('stats.groupStatsDesc')}</p>
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
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('stats.avgStartTime')}</p>
                              <p className="text-xs font-black text-slate-700">{group.avgStartTime}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('stats.avgEndTime')}</p>
                              <p className="text-xs font-black text-slate-700">{group.avgEndTime}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('stats.avgDuration')}</p>
                              <p className="text-xs font-black text-slate-700">{group.avgDuration7}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('stats.achievementRate')}</p>
                              <p className="text-xs font-black text-emerald-600">{group.rate}{group.rate !== '-' ? '%' : ''}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="usage-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-6"
              >
                {/* 사용시간통계박스 */}
                <div className="px-3 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2.5 rounded-[12px]">
                      <Timer className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800">{t('stats.usageTimeStats')}</h2>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-[15px] border border-emerald-100/50">
                    <p className="text-[12px] font-bold text-emerald-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('stats.usageStatsDesc') }} />
                  </div>

                  <div className="space-y-6">
                    {Object.keys(usageStatsGroups).sort((a, b) => b.localeCompare(a)).map(year => (
                      <div key={year} className="bg-white rounded-[15px] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <History className="w-4 h-4 text-emerald-500" />
                            {t('stats.yearTitle', { year })}
                          </h3>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {usageStatsGroups[year].map((day, i) => (
                            <div key={i} className="flex items-center gap-1 h-10 group">
                              <div className={`w-9 text-[11px] font-black tabular-nums ${isSunday(day.date) ? 'text-[#8B0000]' : 'text-slate-400'}`}>
                                {day.date.split('-').slice(1).join('/')}
                              </div>
                              
                              <div className="flex-grow h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                <div 
                                  className="absolute inset-0 transition-opacity duration-300"
                                  style={{ backgroundImage: day.gradient }}
                                  title={day.date}
                                />
                              </div>
                              
                              <div className="w-9 text-right text-[11px] font-black text-indigo-600 tabular-nums">
                                {t('home.minutes', { minutes: day.totalMinutes })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(usageStatsGroups).length === 0 && (
                      <div className="bg-white rounded-[15px] border border-slate-100 p-20 text-center space-y-3 shadow-sm text-slate-400 font-bold">
                         <Hourglass className="w-12 h-12 text-slate-200 mx-auto animate-pulse" />
                         <p className="text-sm font-bold text-slate-300">{t('stats.noUsageRecords')}</p>
                      </div>
                    )}
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
