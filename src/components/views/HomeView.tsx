import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Bell,
  BellOff,
  X
} from 'lucide-react';
import { HomeViewProps, TaskStatus } from '../../types';
import { timeToMinutes, isTaskScheduledToday } from '../../utils';
import phrases from '../../phrases.json';
import { RoutineTitle } from '../routine/RoutineTitle';
import { RoutineTitleLine } from '../routine/RoutineTitleLine';
import { MonthlyHeatmap } from '../routine/MonthlyHeatmap';

import { voiceService } from '../../services/voiceService';

export const HomeView: React.FC<HomeViewProps> = ({ 
  userData, 
  setUserData: _setUserData,
  currentTime, 
  effectiveDate,
  todayStr, 
  handleCheckIn, 
  handleLateCheckIn, 
  setSelectedChunkId: _setSelectedChunkId, 
  setActiveTab: _setActiveTab, 
  startTask: _startTask,
  toggleInactive, 
  getChunkStatus, 
  getStatusBadge: _getStatusBadge, 
  globalActiveTask, 
  setConfirmModal,
  onEnterExecution,
  onRestart,
  togglePauseTask
}) => {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleDoFirst = (taskId: string, chunkId: string) => {
    if (togglePauseTask) {
      togglePauseTask(taskId);
      _setSelectedChunkId(chunkId);
      _setActiveTab('execution');
    }
  };

  const handleRestart = (taskId: string, chunkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "다시 시작하시겠습니까?",
      message: "타이머가 0부터 다시 시작됩니다. 다시 시작하시겠습니까?",
      confirmLabel: "다시하기",
      cancelLabel: "취소",
      onConfirm: () => {
        if (onRestart) {
          onRestart(taskId);
          _setSelectedChunkId(chunkId);
          _setActiveTab('execution');
        }
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleActivate = (taskId: string, chunkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "루틴 활성화",
      message: "오늘은 쉬는 요일입니다. 활성화하시겠습니까?",
      onConfirm: () => {
        _setUserData(prev => ({
          ...prev,
          forcedActiveTasks: {
            ...prev.forcedActiveTasks,
            [todayStr]: {
              ...(prev.forcedActiveTasks?.[todayStr] || {}),
              [taskId]: true
            }
          },
          routineChunks: prev.routineChunks.map(c => {
            if (c.id === chunkId) {
              return {
                ...c,
                activeTaskId: taskId
              };
            }
            return c;
          })
        }));
        _setSelectedChunkId(chunkId);
        _setActiveTab('execution');
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleExpand = (e: React.MouseEvent, chunkId: string) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({ ...prev, [chunkId]: !prev[chunkId] }));
  };

  const todayCheckIn = userData.history.find(h => h.date === todayStr);

  const todayTargetWakeUpTime = (todayCheckIn && userData.dailyTargetWakeUpTime?.[todayStr])
    ? userData.dailyTargetWakeUpTime[todayStr]
    : userData.targetWakeUpTime;

  const [targetH, targetM] = todayTargetWakeUpTime.split(':').map(Number);
  const targetDate = new Date(currentTime);
  targetDate.setHours(targetH, targetM, 0, 0);

  const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
  // [코멘트] phrases.json의 wakeUpCheckInSettings 설정을 사용하여 버튼 표시 조건 결정
  const earlyLimit = phrases.wakeUpCheckInSettings?.earlyWindowMinutes || 30;
  const lateLimit = phrases.wakeUpCheckInSettings?.lateWindowMinutes || 10;

  const isTooEarly = diffMinutes < -earlyLimit;
  const isWithinWindow = diffMinutes >= -earlyLimit && diffMinutes <= lateLimit;

  return (
    <div className="space-y-[10px]">
      <div className="flex gap-[10px] items-stretch">
        {/* Wake up Check-in */}
        <section className="flex-grow bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[10px] p-[15px] text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-4 h-full">
            <div className="flex flex-col justify-center">
              <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-wider leading-none mb-1">{t('home.targetWakeUpTime')}</p>
              <h2 className="text-lg font-black tracking-tight leading-none">{todayTargetWakeUpTime}</h2>
            </div>

            <div className="flex-grow max-w-[140px] flex items-center">
              {todayCheckIn ? (
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[10px] py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[11px] whitespace-nowrap">
                    {(() => {
                      const checkInDiff = timeToMinutes(todayCheckIn.time) - timeToMinutes(todayTargetWakeUpTime);
                      const timeStr = todayCheckIn.time.slice(0, 5);
                      // 체크인 성공 판정 시에도 설정된 유예 시간 로직 적용
                      return checkInDiff >= -earlyLimit && checkInDiff <= lateLimit 
                        ? t('home.successWithTime', { time: timeStr }) 
                        : t('home.lateWithTime', { time: timeStr });
                    })()}
                  </span>
                </div>
              ) : isTooEarly ? (
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[10px] py-1.5 px-2 flex items-center justify-center gap-1.5 border border-white/20">
                  <span className="font-bold text-[10px] text-indigo-100/70 whitespace-nowrap">{t('home.waiting')}</span>
                </div>
              ) : isWithinWindow ? (
                <button
                  onClick={handleCheckIn}
                  className="w-full py-1.5 px-2 bg-white text-indigo-600 rounded-[10px] font-bold text-[10px] shadow-lg transition-all transform active:scale-95 hover:bg-indigo-50"
                >
                  {t('home.checkIn')}
                </button>
              ) : (
                <button
                  onClick={handleLateCheckIn}
                  className="w-full py-1.5 px-2 bg-rose-500 text-white rounded-[10px] font-bold text-[10px] shadow-lg transition-all transform active:scale-95 hover:bg-rose-600"
                >
                  {t('home.lateCheckIn')}
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
            const getSortPriority = (status: string) => {
              const isInactive = status === '비활성';
              const isCompleted = status === '완료' || status === '완벽' || status === '전체완료';
              const isInProgress = status === '실행중';

              if (userData.autoReorderInactiveGroups && isInactive) return 2;
              if (userData.autoReorderCompletedGroups && isCompleted) return 1;
              if (userData.autoReorderInProgressGroups && isInProgress) return -1;
              return 0;
            };

            const pA = getSortPriority(a.status);
            const pB = getSortPriority(b.status);

            if (pA !== pB) return pA - pB;
            return 0; // Keep original order within same priority
          })
          .map(({ chunk, status }) => {
            const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
            const completedTasks = scheduledTasks.filter(t => t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP);
            const isFullyCompleted = status === '전체완료' || status === '완료' || status === '완벽';
            const isExpanded = expandedGroups[chunk.id];
            const isInactive = status === '비활성';

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
            // 미실행: bg-white | 실행중: bg-amber-100 | 완료: bg-emerald-50 | 완벽: bg-emerald-50 | 비활성: bg-slate-50
            // *주의: Tailwind 기본 색상값은 50, 100, 200등 정해진 단위를 사용해야 합니다. 직접 입력 bg-["#739BE1"] 한 배경색(#hex)도 사용 가능합니다.
            let boxBgColor = 'bg-white';
            if (displayStatus === '실행중') boxBgColor = 'bg-amber-100';
            else if (displayStatus === '완료') boxBgColor = 'bg-[#D2E1FF]';
            else if (displayStatus === '완벽') boxBgColor = 'bg-[#D2E1FF]';
            else if (displayStatus === '비활성') boxBgColor = 'bg-slate-50'; // 비활성 상태 배경색 설정 포인트
          
          return (
            <section 
              key={chunk.id} 
              onClick={() => {
                voiceService.unlock();
                if (isInactive) return;
                if (globalActiveTask && globalActiveTask.chunkId !== chunk.id) {
                  setConfirmModal({
                    isOpen: true,
                    title: t('home.activeRoutineExistsTitle'),
                    message: t('home.activeRoutineExistsMsg', { task: globalActiveTask.task.text }),
                    showCancel: false,
                    onConfirm: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
                  });
                  return;
                }
                onEnterExecution(chunk.id);
              }}
              className={`${boxBgColor} rounded-[10px] border border-slate-100 shadow-sm overflow-hidden transition-all group ${isInactive ? 'opacity-60 grayscale cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              {/* 월간 캘린더 히트맵 */}
              <div className="relative z-10 px-2">
                <MonthlyHeatmap 
                  chunk={chunk}
                  userData={userData}
                  currentTime={currentTime}
                  effectiveDate={effectiveDate}
                />
              </div>

              <div className="p-[15px] relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-[10px] ${statusColor}`}>
                      {t('status.' + displayStatus, displayStatus)} ({completedTasks.length}/{scheduledTasks.length})
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
                      {isInactive ? t('home.activate') : t('home.skipToday')}
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
                          userData={userData}
                          todayStr={todayStr}
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
                <div className="pb-[15px]">
                  {/* Routine Group Summary Line */}
                  <div className="px-[15px] pb-3 mb-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      {/* Active Days */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 0].map((dayNum, i) => {
                          const dayNames = t('common.days', { returnObjects: true }) as string[] || ['월', '화', '수', '목', '금', '토', '일'];
                          const isScheduled = chunk.scheduledDays.includes(dayNum);
                          return (
                            <div 
                              key={dayNum}
                              className={`relative flex items-center justify-center w-6 h-6 rounded-full border transition-all ${
                                isScheduled 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' 
                                  : 'bg-slate-50 border-slate-100 text-slate-300'
                              }`}
                            >
                              <span className="text-[10px] font-black z-10">{dayNames[i]}</span>
                              {!isScheduled && (
                                <X className="absolute w-[60%] h-[60%] text-slate-200" strokeWidth={4} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Start Situation/Time & Target Duration */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-[8px] text-slate-600 text-[10px] font-black">
                          <Clock className="w-3 h-3" />
                          <span>
                            {chunk.startType === 'time' && chunk.startTime ? chunk.startTime.replace(/시/g, '') : (chunk.situation || t('home.anytime'))}
                          </span>
                          {chunk.startType === 'time' && (
                            chunk.isAlarmEnabled ? (
                              <Bell className="w-3 h-3 ml-0.5 opacity-70" />
                            ) : (
                              <BellOff className="w-3 h-3 ml-0.5 opacity-40" />
                            )
                          )}
                        </div>
                        <div className="flex items-center px-2 py-1 bg-slate-100 rounded-[8px] text-slate-600 text-[10px] font-black">
                          <span>{t('home.totalDuration', { minutes: chunk.tasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0) })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {chunk.tasks.map(task => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 py-1 px-[15px] transition-all"
                    >
                      <RoutineTitleLine 
                        task={task} 
                        index={chunk.tasks.findIndex(t => t.id === task.id)} 
                        currentTime={currentTime}
                        chunkTasks={chunk.tasks}
                        isScheduledToday={isTaskScheduledToday(task, chunk, effectiveDate, userData)}
                        onRestart={(id) => handleRestart(id, chunk.id)}
                        onDoFirst={(id) => handleDoFirst(id, chunk.id)}
                        onActivate={(id) => handleActivate(id, chunk.id)}
                        activeTaskId={globalActiveTask?.chunkId === chunk.id ? globalActiveTask.task.id : chunk.activeTaskId}
                      />
                    </div>
                  ))}

                  {isFullyCompleted && (
                    <div className="px-[15px] pt-3 mt-2 flex justify-end border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600/60">
                        <Clock className="w-3 h-3 opacity-70" />
                        <span>{(() => {
                          const entry = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === chunk.id);
                          const startTime = entry?.firstTaskStartTime ? entry.firstTaskStartTime.slice(0, 5) : '--:--';
                          const endTime = entry?.completedAt ? entry.completedAt.slice(0, 5) : '--:--';
                          const totalDurationSeconds = entry?.totalDuration || scheduledTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
                          const totalMin = Math.floor(totalDurationSeconds / 60);
                          return `${startTime}~${endTime}, ${t('home.minutes', { minutes: totalMin })}`;
                        })()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
