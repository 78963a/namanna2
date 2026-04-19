import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Circle
} from 'lucide-react';
import { HomeViewProps, RoutineChunk, Task, TaskStatus } from '../../types';
import { timeToMinutes, isTaskScheduledToday } from '../../utils';
import { RoutineTitle } from '../routine/RoutineTitle';
import { RoutineTitleLine } from '../routine/RoutineTitleLine';

export const HomeView: React.FC<HomeViewProps> = ({ 
  userData, 
  setUserData,
  currentTime, 
  effectiveDate,
  todayStr, 
  handleCheckIn, 
  handleLateCheckIn, 
  setSelectedChunkId, 
  setActiveTab, 
  startTask,
  toggleInactive, 
  getChunkStatus, 
  getStatusBadge, 
  globalActiveTask, 
  setConfirmModal,
  onEnterExecution
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, chunkId: string) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({ ...prev, [chunkId]: !prev[chunkId] }));
  };

  const getGroupStats = (chunk: RoutineChunk) => {
    const tasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    let startTime = '';
    let endTime = '';
    let totalDurationSeconds = 0;
    let totalTargetDurationMinutes = 0;

    tasks.forEach(task => {
      if (task.startTime && (!startTime || task.startTime < startTime)) {
        startTime = task.startTime;
      }
      if (task.endTime && (!endTime || task.endTime > endTime)) {
        endTime = task.endTime;
      }
      if (task.duration) {
        totalDurationSeconds += task.duration;
      }
      if (task.targetDuration) {
        totalTargetDurationMinutes += task.targetDuration;
      }
    });

    const formatDuration = (totalSec: number) => {
      const totalMin = Math.floor(totalSec / 60);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      if (h > 0) return `${h}시간 ${m}분`;
      return `${m}분`;
    };

    const actualDurationStr = formatDuration(totalDurationSeconds);
    const targetDurationStr = formatDuration(totalTargetDurationMinutes * 60);

    return {
      startTime: startTime ? startTime.slice(0, 5) : '00:00',
      endTime: endTime ? endTime.slice(0, 5) : '00:00',
      duration: `${actualDurationStr}/${targetDurationStr}`
    };
  };

  const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
  const targetDate = new Date(currentTime);
  targetDate.setHours(targetH, targetM, 0, 0);

  const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
  const isTooEarly = diffMinutes < -30;
  const isWithinWindow = diffMinutes >= -30 && diffMinutes <= 10;

  const todayCheckIn = userData.history.find(h => h.date === todayStr);

  return (
    <div className="space-y-[10px]">
      <div className="flex gap-[10px] items-stretch">
        {/* Wake up Check-in */}
        <section className="flex-grow bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[10px] p-[15px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-4 h-full">
            <div className="flex flex-col justify-center">
              <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-wider leading-none mb-1">목표 기상 시간</p>
              <h2 className="text-lg font-black tracking-tight leading-none">{userData.targetWakeUpTime}</h2>
            </div>

            <div className="flex-grow max-w-[120px] flex items-center">
              {todayCheckIn ? (
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[10px] py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[12px] whitespace-nowrap">
                    {(() => {
                      const checkInDiff = timeToMinutes(todayCheckIn.time) - timeToMinutes(userData.targetWakeUpTime);
                      return checkInDiff >= -30 && checkInDiff <= 10 
                        ? `성공! (${todayCheckIn.time.slice(0, 5)})` 
                        : `지각(${todayCheckIn.time.slice(0, 5)})`;
                    })()}
                  </span>
                </div>
              ) : isTooEarly ? (
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[10px] py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/20">
                  <span className="font-bold text-[9px] text-indigo-100/70 whitespace-nowrap">대기 중</span>
                </div>
              ) : isWithinWindow ? (
                <button
                  onClick={handleCheckIn}
                  className="w-full py-1.5 bg-white text-indigo-600 rounded-[10px] font-bold text-[9px] shadow-lg transition-all transform active:scale-95 hover:bg-indigo-50"
                >
                  체크인
                </button>
              ) : (
                <button
                  onClick={handleLateCheckIn}
                  className="w-full py-1.5 bg-rose-500 text-white rounded-[10px] font-bold text-[9px] shadow-lg transition-all transform active:scale-95 hover:bg-rose-600"
                >
                  지각 ㅜㅜ
                </button>
              )}
            </div>
          </div>
          
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-400/20 rounded-full blur-3xl" />
        </section>
      </div>

      {/* Routine Section */}
      <div className="space-y-[10px]">
        {userData.routineChunks
          .map(chunk => ({
            chunk,
            status: getChunkStatus(chunk)
          }))
          .sort((a, b) => {
            const aInactive = a.status === '불활성';
            const bInactive = b.status === '불활성';
            const aCompleted = a.status === '완료' || a.status === '완벽' || a.status === '전체완료';
            const bCompleted = b.status === '완료' || b.status === '완벽' || b.status === '전체완료';

            const getSortPriority = (completed: boolean, inactive: boolean) => {
                let priority = 0;
                if (userData.autoReorderInactiveGroups && inactive) {
                    priority = 2;
                } else if (userData.autoReorderCompletedGroups && completed) {
                    priority = 1;
                }
                return priority;
            };

            const pA = getSortPriority(aCompleted, aInactive);
            const pB = getSortPriority(bCompleted, bInactive);

            if (pA !== pB) return pA - pB;
            return 0; // Keep original order within same priority
          })
          .map(({ chunk, status }) => {
            const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
            const completedTasks = scheduledTasks.filter(t => t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP);
            const startedTasks = scheduledTasks.filter(t => t.startTime || t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP);
            const isFullyCompleted = status === '전체완료' || status === '완료' || status === '완벽';
            const isExpanded = expandedGroups[chunk.id];
            const isInactive = status === '불활성';

            const displayStatus = status;
            let statusColor = 'bg-slate-100 text-slate-500';
            
            if (isInactive) {
              statusColor = 'bg-slate-100 text-slate-400';
            } else if (displayStatus === '미실행') {
              statusColor = 'bg-slate-100 text-slate-500';
            } else if (displayStatus === '완벽') {
              statusColor = 'bg-emerald-100 text-emerald-600';
            } else if (displayStatus === '완료') {
              statusColor = 'bg-indigo-100 text-indigo-600';
            } else if (displayStatus === '실행중') {
              statusColor = 'bg-amber-100 text-amber-600';
            }
          
            // [코멘트] 루틴그룹 박스 배경색 설정 (상태에 따라 연한 배경색 적용)
            // 미실행: bg-white, 실행중: bg-amber-50(연노랑), 완료: bg-emerald-50(연초록), 완벽: bg-sky-50(연파란)
            let boxBgColor = 'bg-white';
            if (!isInactive) {
              if (displayStatus === '실행중') boxBgColor = 'bg-amber-50';
              else if (displayStatus === '완료') boxBgColor = 'bg-emerald-50';
              else if (displayStatus === '완벽') boxBgColor = 'bg-sky-50';
            }
          
          return (
            <section 
              key={chunk.id} 
              onClick={() => {
                if (isInactive) return;
                if (globalActiveTask && globalActiveTask.chunkId !== chunk.id) {
                  setConfirmModal({
                    isOpen: true,
                    title: '진행 중인 루틴 있음',
                    message: `현재 '${globalActiveTask.task.text}' 루틴이 진행 중입니다. 해당 루틴을 일시정지하거나 완료한 후 다른 루틴을 시작할 수 있습니다.`,
                    onConfirm: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
                  });
                  return;
                }
                onEnterExecution(chunk.id);
              }}
              className={`${boxBgColor} rounded-[10px] border border-slate-100 shadow-sm overflow-hidden transition-all group ${isInactive ? 'opacity-60 grayscale cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              <div className="p-[15px] relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-[10px] ${statusColor}`}>
                      {displayStatus} ({completedTasks.length}/{scheduledTasks.length})
                    </span>
                  </div>
                  {!isFullyCompleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleInactive(chunk.id);
                      }}
                      className={`px-3 py-1 rounded-[10px] text-[10px] font-black transition-all ${
                        isInactive 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isInactive ? '활성화하기' : '오늘은 건너뛰기'}
                    </button>
                  )}
                </div>
                
                <div className="mb-1 pr-8">
                  <h3 className="text-sm font-bold text-slate-800 leading-relaxed">
                    {(() => {
                      const entry = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === chunk.id);
                      return (
                        <RoutineTitle 
                          chunk={chunk} 
                          status={displayStatus} 
                          selectedPhrase={entry?.selectedPhrase} 
                          userName={userData.userName}
                          startTime={entry?.firstTaskStartTime}
                          endTime={entry?.completedAt}
                        />
                      );
                    })()}
                  </h3>
                </div>

                <button
                  onClick={(e) => toggleExpand(e, chunk.id)}
                  className="absolute bottom-3 right-3 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors z-20 bg-slate-50/50 rounded-[10px]"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="divide-y divide-slate-50 border-t border-slate-50 pb-[15px]">
                  {chunk.tasks.map(t => ({
                    task: t,
                    isScheduled: isTaskScheduledToday(t, chunk, effectiveDate, userData)
                  }))
                  .sort((a, b) => {
                    if (a.isScheduled && !b.isScheduled) return -1;
                    if (!a.isScheduled && b.isScheduled) return 1;

                    const getPriority = (t: Task) => {
                      if (t.status === TaskStatus.SKIP) return 4;
                      if (t.completed) return 3;
                      if (t.laterTimestamp) return 2;
                      return 1;
                    };
                    const pA = getPriority(a.task);
                    const pB = getPriority(b.task);
                    if (pA !== pB) return pA - pB;
                    if (pA === 2 && a.task.laterTimestamp && b.task.laterTimestamp) return a.task.laterTimestamp - b.task.laterTimestamp;
                    return 0;
                  }).map(({ task, isScheduled }) => (
                    <div
                      key={task.id}
                      className={`group flex items-center gap-3 py-1 px-[15px] transition-all ${
                        task.completed 
                          ? 'bg-slate-50/50' 
                          : ''
                      }`}
                    >
                      <RoutineTitleLine 
                        task={task} 
                        index={chunk.tasks.findIndex(t => t.id === task.id)} 
                        currentTime={currentTime}
                        chunkTasks={chunk.tasks}
                        isScheduledToday={isScheduled}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
