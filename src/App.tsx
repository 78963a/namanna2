/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sun,
  CheckCircle2, 
  Circle, 
  ArrowRightCircle,
  User,
  Settings, 
  Plus, 
  Trash2, 
  Clock,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Home,
  Calendar,
  Edit2,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Timer,
  X,
  GripVertical,
  RotateCcw,
  Target,
  ChevronDown,
  Zap,
  PlusCircle,
  Hourglass,
  BrickWall,
  Check,
  CheckCheck,
  CircleMinus
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Internal Types & Constants
import { 
  TaskType, 
  ChecklistItem, 
  Task, 
  RoutineChunk, 
  WakeUpRecord, 
  UserData, 
  SettingsSubView,
  TaskStatus,
  StatsTab,
  WakeUpTimeHistoryEntry,
  RoutineGroupHistoryEntry,
  TaskHistoryEntry,
  HeaderBoxProps,
  HomeViewProps,
  StatsViewProps,
  ExecutionViewProps
} from './types';
import { 
  STORAGE_KEY 
} from './constants';
import { 
  timeToMinutes, 
  minutesToTime,
  isChunkScheduledToday, 
  isTaskScheduledToday, 
  formatDate, 
  getEffectiveDate,
  getEffectiveDateObject,
  getAverageWakeUpTime,
  getDaysBetween,
  formatDurationPrecise,
  getJosa,
  calculateTaskDuration
} from './utils';
import phrases from './phrases.json';
import { CheckCheckIcon } from './components/CheckCheckIcon';

// Components
import { HeaderBox } from './components/layout/HeaderBox';
import { HomeView } from './components/views/HomeView';
import { StatsView } from './components/views/StatsView';
// import { ExecutionView } from './components/views/ExecutionView';
// import { AddRoutineGroupView } from './components/views/AddRoutineGroupView';
import { ConfirmModal } from './components/common/ConfirmModal';
import { CelebrationModal } from './components/common/CelebrationModal';
import { RoutineTitleLine } from './components/routine/RoutineTitleLine';
import { RoutineTitle } from './components/routine/RoutineTitle';
// import { TaskInputSection } from './components/routine/TaskInputSection';
// import { SortableTaskItem } from './components/routine/SortableTaskItem';
// import { SortableChunkItem } from './components/routine/SortableChunkItem';
// import { SortableChecklistItem } from './components/routine/SortableChecklistItem';
// --- Components ---

const DoubleCheckCircle = ({ className }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <Circle className="w-full h-full" />
    <CheckCheck className="absolute w-[60%] h-[60%]" strokeWidth={3} />
  </div>
);



// --- Application ---

// --- Main Application ---

// --- Sub-components ---




const SlideToResetButton = ({ onReset }: { onReset: () => void }) => {
  const [x, setX] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleDrag = (_: any, info: any) => {
    if (isResetting) return;
    setX(info.point.x);
    const containerWidth = containerRef.current?.offsetWidth || 0;
    if (info.point.x > containerWidth * 0.8) {
      setIsResetting(true);
      onReset();
      setX(0);
      setTimeout(() => setIsResetting(false), 1000);
    }
  };

  return (
    <div ref={containerRef} className="relative w-32 h-8 bg-white/10 rounded-full overflow-hidden border border-white/10">
      <div className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Slide to Reset</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={() => setX(0)}
        animate={{ x: isResetting ? 100 : 0 }}
        className="absolute top-1 left-1 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center backdrop-blur-md border border-white/20"
      >
        <RotateCcw className="w-3 h-3 text-white" />
      </motion.div>
    </div>
  );
};

const ExecutionView: React.FC<ExecutionViewProps> = ({
  userData,
  setUserData,
  selectedChunkId,
  setActiveTab,
  currentTime,
  effectiveDate,
  todayStr,
  toggleTask,
  togglePauseTask,
  laterTask,
  skipTask,
  startTask,
  onRestart,
  resetChunk,
  setSettingsSubView,
  setIsSettingsOpen,
  setSelectedChunkId,
  handleCheckCheckClick,
  isCheckCheckAvailable,
  setConfirmModal
}) => {
  const chunk = userData.routineChunks.find(c => c.id === selectedChunkId);
  if (!chunk) return null;

  const tasks = chunk.tasks;
  const scheduledTasks = tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
  
  const handleActivateTaskInternal = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '루틴 활성화',
      message: '오늘은 쉬는 요일입니다. 활성화하시겠습니까?',
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          forcedActiveTasks: {
            ...prev.forcedActiveTasks,
            [todayStr]: {
              ...(prev.forcedActiveTasks?.[todayStr] || {}),
              [taskId]: true
            }
          }
        }));
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestartTaskInternal = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '다시 시작하시겠습니까?',
      message: '타이머가 0부터 다시 시작됩니다. 다시 시작하시겠습니까?',
      confirmLabel: '다시하기',
      cancelLabel: '취소',
      onConfirm: () => {
        onRestart(taskId);
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // 체크체크박스 아이콘 결정 로직
  const checkCheckIconId = (() => {
    const count = (userData.dailyCheckCheckCounts?.[todayStr]) || 0;
    const stages = phrases.checkCheckSettings.evolutionStages;
    let currentStage = stages[0];
    for (const stage of stages) {
      if (count >= stage.minClicks) {
        currentStage = stage;
      } else {
        break;
      }
    }
    return currentStage.iconId;
  })();

  // 9-2-1. '현재 실행중인 루틴' 우선순위 로직
  // 1. 현재 실행 중인 루틴 (startTime 있고, 일시정지 아님, 완료 아님, 스킵 아님)
  let activeTask = scheduledTasks.find(t => t.startTime && !t.isPaused && !t.completed && t.status !== TaskStatus.SKIP);
  
  // 2. 일시정지 루틴 중 가장 순서가 빠른 루틴 (단, '나중에' 제외, 스킵 제외)
  if (!activeTask) {
    activeTask = scheduledTasks.find(t => t.isPaused && !t.completed && !t.laterTimestamp && t.status !== TaskStatus.SKIP);
  }
  
  // 3. 미실행 루틴 중 가장 순서가 빠른 루틴 (단, '나중에' 제외, 스킵 제외)
  if (!activeTask) {
    activeTask = scheduledTasks.find(t => !t.startTime && !t.completed && !t.laterTimestamp && t.status !== TaskStatus.SKIP);
  }
  
  // '나중에' 루틴은 더 이상 자동으로 현재 루틴이 되지 않음 (사용자가 클릭해야 함)

  const isNotStarted = tasks.every(t => !t.startTime && !t.completed);

  const [isCompleted, setIsCompleted] = useState(false);
  const [animationStage, setAnimationStage] = useState<'none' | 'whiteout' | 'rising' | 'title' | 'fireworks' | 'final'>('none');
  const [visibleTasksCount, setVisibleTasksCount] = useState(0);
  const [shakingTaskId, setShakingTaskId] = useState<string | null>(null);

  const activeTaskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTask?.id) {
      // Short delay to allow animations/layout to stabilize
      const timer = setTimeout(() => {
        if (activeTaskRef.current) {
          const headerHeight = 64; // Menu icon row height + padding
          const elementPosition = activeTaskRef.current.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTask?.id]);

  const allTasksDone = scheduledTasks.length > 0 && scheduledTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
  const wasDoneOnMount = useRef(allTasksDone);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Re-completion logic: if it becomes not done, reset the mount flag
  useEffect(() => {
    if (!allTasksDone) {
      wasDoneOnMount.current = false;
    }
  }, [allTasksDone]);

  useEffect(() => {
    if (allTasksDone && !wasDoneOnMount.current && !isCompleted) {
      // Start completion sequence after a short delay (0.3s after last task celebration)
      const timer = setTimeout(() => {
        setIsCompleted(true);
        setAnimationStage('whiteout');
        
        // Whiteout for a brief moment then start rising
        setTimeout(() => {
          setAnimationStage('rising');
        }, 500);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allTasksDone, isCompleted]);

  useEffect(() => {
    if (animationStage === 'rising') {
      if (visibleTasksCount < scheduledTasks.length) {
        const timer = setTimeout(() => {
          const nextTask = scheduledTasks[visibleTasksCount];
          setVisibleTasksCount(prev => prev + 1);
          setShakingTaskId(nextTask.id);
          setTimeout(() => setShakingTaskId(null), 500);
        }, 600); // Delay between each task rising
        return () => clearTimeout(timer);
      } else {
        // All tasks risen, show title
        setTimeout(() => {
          setAnimationStage('title');
        }, 500);
      }
    }
  }, [animationStage, visibleTasksCount, scheduledTasks.length]);

  useEffect(() => {
    if (animationStage === 'title') {
      setTimeout(() => {
        setAnimationStage('fireworks');
        // 루틴그룹완료축하애니메이션: 폭죽
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            setAnimationStage('final');
            return;
          }

          const particleCount = 100 * (timeLeft / duration);
          // 화려한 불꽃놀이: 여러 위치에서 발사
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.1 } });
          
          if (timeLeft < duration * 0.5) {
            confetti({ ...defaults, particleCount: particleCount * 0.5, origin: { x: randomInRange(0.2, 0.8), y: Math.random() } });
          }
        }, 150);
      }, 1000);
    }
  }, [animationStage]);

  useEffect(() => {
    if (animationStage === 'final') {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 300); // Give a bit more time for the phrase list entrance animation
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

  const getElapsed = (task: Task) => {
    return calculateTaskDuration(task, currentTime);
  };

  const getStageInfo = (task: Task) => {
    const elapsed = getElapsed(task);
    const target = (task.targetDuration || 0) * 60;
    const progress = Math.min((elapsed / target) * 100, 100);
    
    let color = "bg-sky-400";
    let isFinished = elapsed >= target;

    if (task.taskType === TaskType.TIME_ACCUMULATED) {
      color = isFinished ? "bg-indigo-500" : "bg-rose-400";
    } else if (task.taskType === TaskType.TIME_LIMITED) {
      color = isFinished ? "bg-rose-500" : "bg-sky-400";
    } else {
      // TIME_INDEPENDENT
      color = isFinished ? "bg-indigo-500" : "bg-sky-400";
    }
    
    return { progress, color, isFinished };
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinalSave = (phrase: string) => {
    if (selectedChunkId) {
      setUserData(prev => {
        const newGroupHistory = [...(prev.routineGroupHistory || [])];
        const entryIdx = newGroupHistory.findIndex(h => h.date === todayStr && h.groupId === selectedChunkId);
        
        if (entryIdx >= 0) {
          newGroupHistory[entryIdx] = {
            ...newGroupHistory[entryIdx],
            selectedPhrase: phrase
          };
        } else {
          // Entry should exist by this stage due to syncHistory or execution start, 
          // but safety fallback
          newGroupHistory.push({
            date: todayStr,
            groupId: selectedChunkId,
            isActive: true,
            firstTaskStartTime: null,
            completionStatus: '전체완료',
            completedAt: null,
            totalDuration: 0,
            selectedPhrase: phrase
          });
        }
        
        return {
          ...prev,
          routineGroupHistory: newGroupHistory
        };
      });
    }
    
    // Reset states and go home
    setIsCompleted(false);
    setSelectedChunkId(null);
    setActiveTab('home');
    setAnimationStage('none');
  };

  if (isCompleted && animationStage !== 'none') {
    // 루틴그룹완료화면 (Routine Group Completion Screen)
    return (
      <div className={`fixed inset-0 z-[300] flex flex-col ${animationStage === 'whiteout' ? 'bg-white' : 'bg-[#F7FEE7]'} transition-colors duration-500`}>
        {/* 홈아이콘줄 (Sticky Header Box) - Replicated from Home Screen */}
        {(animationStage === 'final') && (
          <div className="sticky top-0 z-40 bg-[#F7FEE7]/80 backdrop-blur-md pt-2.5 pb-0 flex-shrink-0">
            <div className="max-w-2xl mx-auto px-4">
              <nav className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setActiveTab('home');
                    setSelectedChunkId(null);
                  }}
                  className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm`}
                >
                  <Home className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    setSettingsSubView({ type: 'main' });
                    setSelectedChunkId(null);
                    setIsSettingsOpen(false);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('add');
                    setSelectedChunkId(null);
                    setIsSettingsOpen(false);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm`}
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('stats');
                    setSelectedChunkId(null);
                  }}
                  className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm`}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>

                {/* 체크체크박스 (Check-Check Box): 클릭하여 성장시키는 아이콘 */}
                <button 
                  onClick={handleCheckCheckClick}
                  className={`transition-all w-16 h-10 flex items-center px-1.5 rounded-[10px] border shadow-sm relative overflow-hidden ${
                    isCheckCheckAvailable 
                      ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                      : 'bg-white border-slate-100 cursor-default'
                  }`}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-9">
                    <CheckCheckIcon iconId={checkCheckIconId} size={32} />
                  </div>
                  <div className="flex-grow flex flex-col items-center justify-center ml-0.5 relative">
                    <span className="text-[10px] font-black text-slate-500 leading-none">
                      {(userData.dailyCheckCheckCounts?.[todayStr]) || 0}
                    </span>
                    {isCheckCheckAvailable && (
                      <div className="mt-1">
                        <span className="flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>
        )}

        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto pb-20">
          <div className="p-6 flex flex-col items-center">
            {/* Rising Tasks List */}
            <div className="w-full max-w-sm space-y-3 mt-8">
            <AnimatePresence>
              {scheduledTasks.slice(0, visibleTasksCount).map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ y: 1000, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    scale: shakingTaskId === task.id ? [1, 1.05, 1] : 1,
                    x: shakingTaskId === task.id ? [0, -2, 2, -2, 2, 0] : 0
                  }}
                  transition={{ 
                    y: { type: "spring", stiffness: 100, damping: 20 },
                    scale: { duration: 0.3 },
                    x: { duration: 0.3 }
                  }}
                  className={`p-4 rounded-[15px] border-2 flex items-center justify-between bg-white shadow-sm ${shakingTaskId === task.id ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-100'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400">루틴 {idx + 1}</span>
                    <span className="text-base font-black text-slate-900">{task.text}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      task.status === TaskStatus.PERFECT ? 'bg-indigo-100 text-indigo-600' :
                      task.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {task.status === TaskStatus.PERFECT ? '완벽' : task.status === TaskStatus.COMPLETED ? '완료' : '스킵'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 mt-1">{formatDuration(task.duration || 0)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Completion Title */}
          {(animationStage === 'title' || animationStage === 'fireworks' || animationStage === 'final') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-12 mb-8 text-center"
            >
              <h2 className="text-4xl font-black text-slate-900 leading-tight">
                <span className="text-indigo-600">{chunk.name}</span><br />
                완성!
              </h2>
            </motion.div>
          )}

          {/* Completion Phrase Selection (Final Stage) */}
          {animationStage === 'final' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4 mt-8"
            >
              <h3 className="text-center text-lg font-black text-slate-700 mb-6">축하합니다! 문구를 선택해주세요.</h3>
              
              <div className="space-y-3">
                {phrases.routine_messages.COMPLETION_SELECTION_TEMPLATES.map((template, idx) => {
                  let storedPhrase = template;
                  
                  // stats for resolution
                  const currentHistory = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === chunk.id);
                  const startTimeStr = currentHistory?.firstTaskStartTime || '--:--';
                  const endTimeStr = currentTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
                  const totalDurationSec = currentHistory?.totalDuration || 0;
                  const durationStr = formatDurationPrecise(totalDurationSec);
                  const totalTargetMinutes = chunk.tasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0);
                  const totalTargetDurationStr = `${totalTargetMinutes}분`;

                  // Resolve particles but keep the placeholder for RoutineTitle to style
                  const resolveParticles = (msg: string, tag: string, value: string) => {
                    const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는)`, 'g');
                    return msg.replace(regex, (_, p1) => {
                      return `{{${tag}}}` + getJosa(value, p1 as any);
                    });
                  };

                  storedPhrase = resolveParticles(storedPhrase, 'title', chunk.name);
                  storedPhrase = resolveParticles(storedPhrase, 'purpose', chunk.purpose || '목표');
                  storedPhrase = resolveParticles(storedPhrase, 'userName', userData.userName || '나');

                  // We preserve placeholders for startTime, endTime, userName, duration
                  // so that RoutineTitle can style them based on phrases.json settings.
                  
                  // For the UI display in buttons, replace everything
                  let displayPhrase = storedPhrase;
                  displayPhrase = displayPhrase.replace(/\{\{userName\}\}/g, userData.userName || '나');
                  displayPhrase = displayPhrase.replace(/\{\{startTime\}\}/g, startTimeStr);
                  displayPhrase = displayPhrase.replace(/\{\{endTime\}\}/g, endTimeStr);
                  displayPhrase = displayPhrase.replace(/\{\{duration\}\}/g, durationStr);
                  displayPhrase = displayPhrase.replace(/\{\{totalTargetDuration\}\}/g, totalTargetDurationStr);
                  displayPhrase = displayPhrase.replace(/\{\{title\}\}/g, chunk.name);
                  displayPhrase = displayPhrase.replace(/\{\{purpose\}\}/g, chunk.purpose || '목표');

                  return (
                    <button
                      key={idx}
                      onClick={() => handleFinalSave(storedPhrase)}
                      className="w-full p-6 bg-white border-2 border-slate-100 rounded-[20px] text-left hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 transition-all active:scale-[0.98] group"
                    >
                      <p className="text-base font-black text-slate-700 group-hover:text-indigo-600 leading-relaxed">
                        {displayPhrase}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    );
  }

  const sortedTasks = [...scheduledTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  const isTriggerComplete = true; // Placeholder

  return (
    <div className="space-y-4 relative">
      {/* 루틴그룹박스 (Routine Group Box) */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[10px] shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12" />
        
        <div className="p-4 relative z-10">
          {/* Top Row: Title (Left) and Reset Button (Right) */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <h2 className="text-base font-black text-white tracking-tight leading-relaxed">
                {(() => {
                  const entry = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === chunk.id);
                  return (
                    <RoutineTitle 
                      chunk={chunk} 
                      isExecutionTitle={true}
                      userName={userData.userName}
                      startTime={entry?.firstTaskStartTime}
                      endTime={entry?.completedAt}
                    />
                  );
                })()}
                <button 
                  onClick={() => {
                    setSettingsSubView({ type: 'detail', chunkId: chunk.id });
                    setIsSettingsOpen(true);
                  }}
                  className="inline-flex items-center justify-center p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-[10px] transition-all ml-1 align-middle"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </h2>
            </div>
          </div>

          {/* Bottom Row: Progress Graph (Left) and Percentage (Right) */}
          <div className="flex items-center gap-4">
            <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${scheduledTasks.length > 0 ? (scheduledTasks.filter(t => t.completed).length / scheduledTasks.length) * 100 : 0}%` }}
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
              />
            </div>
            <div className="text-xl font-black text-white tabular-nums leading-none">
              {scheduledTasks.length > 0 ? Math.round((scheduledTasks.filter(t => t.completed).length / scheduledTasks.length) * 100) : 0}<span className="text-xs text-white/40 ml-0.5">%</span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {/* 현재루틴박스 (Current Routine Box) */}
          {activeTask && (
            <motion.div
              layout
              ref={activeTaskRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                layout: { type: "spring", stiffness: 300, damping: 30 }
              }}
              key={activeTask.id}
              className="bg-white rounded-[10px] p-6 shadow-2xl shadow-indigo-100 border-2 border-indigo-500 relative overflow-hidden mb-6"
            >
              <>
                {/* Active Indicator */}
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1.5 rounded-bl-[10px] text-[10px] font-black uppercase tracking-widest">
                  현재루틴
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <h3 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                        {chunk.tasks.findIndex(t => t.id === activeTask.id) + 1}. {activeTask.id === scheduledTasks[0]?.id && "⚡"}{activeTask.text}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded-[10px] font-bold text-xs">
                          {activeTask.taskType === TaskType.TIME_INDEPENDENT ? (
                            <Clock className="w-4 h-4 text-sky-500" />
                          ) : activeTask.taskType === TaskType.TIME_ACCUMULATED ? (
                            <BrickWall className="w-4 h-4 text-pink-500" />
                          ) : (
                            <Hourglass className="w-4 h-4 text-indigo-600" />
                          )}
                          <span>{activeTask.targetDuration}분</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div 
                    onClick={() => {
                      if (activeTask.isPaused || !activeTask.startTime) {
                        togglePauseTask(activeTask.id);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center py-6 rounded-[10px] overflow-hidden cursor-pointer ${activeTask.isPaused ? 'bg-slate-50' : 'bg-slate-100'} border border-slate-200`}
                  >
                    {/* Filling Background */}
                    {getElapsed(activeTask) > 0 && (
                      <motion.div 
                        initial={false}
                        animate={{ 
                          width: `${getStageInfo(activeTask).progress}%`,
                          opacity: getStageInfo(activeTask).isFinished ? 0.4 : 0.2
                        }}
                        className={`absolute inset-y-0 left-0 ${getStageInfo(activeTask).color}`}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="text-sm font-bold text-slate-500 mb-1 tabular-nums">
                        {`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
                      </div>
                      <div className={`text-6xl font-black tabular-nums tracking-tighter ${activeTask.isPaused ? 'text-slate-300' : 'text-slate-900'}`}>
                        {formatDuration(getElapsed(activeTask))}
                        <span className="text-xl text-slate-400 ml-2">/ {activeTask.targetDuration}분</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeTask.isPaused || !activeTask.startTime ? 'text-slate-400' : 'text-slate-500'}`}>
                          {!activeTask.startTime ? 'Ready' : activeTask.isPaused ? 'Paused' : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Section (Moved here) */}
                  {activeTask.checklist && activeTask.checklist.length > 0 && (
                    <div className="bg-slate-50 rounded-[10px] p-5 space-y-4 border-2 border-slate-100 shadow-inner mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-[10px] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">체크리스트</span>
                        </div>
                        <button 
                          onClick={() => {
                            setUserData(prev => ({
                              ...prev,
                              routineChunks: prev.routineChunks.map(c => ({
                                ...c,
                                tasks: c.tasks.map(t => t.id === activeTask.id ? {
                                  ...t,
                                  checklist: t.checklist?.map(item => ({ ...item, completed: false }))
                                } : t)
                              }))
                            }));
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-[10px] text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                        >
                          체크 전부 지우기
                        </button>
                      </div>
                      <div className="space-y-2">
                        {activeTask.checklist.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setUserData(prev => ({
                                ...prev,
                                routineChunks: prev.routineChunks.map(c => ({
                                  ...c,
                                  tasks: c.tasks.map(t => t.id === activeTask.id ? {
                                    ...t,
                                    checklist: t.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i)
                                  } : t)
                                }))
                              }));
                            }}
                            className="w-full flex items-center gap-3 p-3.5 bg-white rounded-[10px] border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm"
                          >
                            <div className={`w-6 h-6 rounded-[10px] border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                              {item.completed && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-bold transition-all ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => togglePauseTask(activeTask.id)}
                      className={`flex flex-col items-center justify-center gap-2 py-3 rounded-[10px] text-xs font-black transition-all ${
                        activeTask.isPaused || !activeTask.startTime
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-sky-500 text-white hover:bg-sky-600'
                      }`}
                    >
                      {activeTask.isPaused || !activeTask.startTime ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      {!activeTask.startTime ? 'START' : activeTask.isPaused ? 'RESUME' : 'PAUSE'}
                    </button>
                    <button 
                      onClick={() => laterTask(activeTask.id)}
                      disabled={activeTask.id === scheduledTasks[0]?.id}
                      className={`flex flex-col items-center justify-center gap-2 py-3 rounded-[10px] text-xs font-black transition-all ${
                        activeTask.id === scheduledTasks[0]?.id
                          ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                          : 'bg-sky-500 text-white hover:bg-sky-600'
                      }`}
                    >
                      <ArrowRightCircle className="w-5 h-5" />
                      LATER
                    </button>
                    <button 
                      onClick={() => skipTask(activeTask.id)}
                      disabled={activeTask.id === scheduledTasks[0]?.id}
                      className={`flex flex-col items-center justify-center gap-2 py-3 rounded-[10px] text-xs font-black transition-all ${
                        activeTask.id === scheduledTasks[0]?.id
                          ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                          : 'bg-[#CC9900] text-white hover:opacity-90'
                      }`}
                    >
                      <CircleMinus className="w-5 h-5" />
                      SKIP
                    </button>
                  </div>

                  {(() => {
                    const elapsed = getElapsed(activeTask);
                    const target = (activeTask.targetDuration || 0) * 60;
                    const isFinished = elapsed >= target;
                    
                    let btnText = "실행 완료";
                    let btnColor = "bg-indigo-600";
                    
                    if (activeTask.taskType === TaskType.TIME_LIMITED) {
                      if (isFinished) {
                        btnText = "완료";
                        btnColor = "bg-rose-500";
                      } else {
                        btnText = "완벽";
                        btnColor = "bg-indigo-600";
                      }
                    } else if (activeTask.taskType === TaskType.TIME_ACCUMULATED) {
                      if (isFinished) {
                        btnText = "완벽";
                        btnColor = "bg-indigo-600";
                      } else {
                        btnText = "완료";
                        btnColor = "bg-rose-500";
                      }
                    } else {
                      // TIME_INDEPENDENT
                      btnText = "완벽";
                      btnColor = "bg-indigo-600";
                    }

                    return (
                      <button 
                        onClick={() => toggleTask(activeTask.id)}
                        className={`w-full py-4 ${btnColor} text-white rounded-[10px] font-black text-lg shadow-xl shadow-indigo-200 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3`}
                      >
                        {btnText === "완벽" ? <DoubleCheckCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        {btnText}
                      </button>
                    );
                  })()}
                </div>
              </>
            </motion.div>
          )}

          {/* 나머지루틴목록 (Remaining Routines List) */}
          {chunk.tasks.filter(t => t.id !== activeTask?.id).length > 0 && (
            <div className="space-y-3">
              {[...chunk.tasks]
                .filter(t => t.id !== activeTask?.id)
                .sort((a, b) => {
                  const isScheduledA = isTaskScheduledToday(a, chunk, effectiveDate, userData);
                  const isScheduledB = isTaskScheduledToday(b, chunk, effectiveDate, userData);
                  if (isScheduledA && !isScheduledB) return -1;
                  if (!isScheduledA && isScheduledB) return 1;
                  
                  const getPriority = (t: Task) => {
                    if (t.status === TaskStatus.SKIP) return 4;
                    if (t.completed) return 3;
                    if (t.laterTimestamp) return 2;
                    return 1;
                  };
                  return getPriority(a) - getPriority(b);
                })
                .map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                  }}
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-[10px] border transition-all ${

 /* /bg-: 배경색 (예: bg-blue-100)
border-: 테두리 색상 (예: border-slate-200)
border-transparent: 테두리를 투명하게(없앰) 처리--- */

                    /* --- [실행화면 개별루틴 박스 스타일 수정 구역] --- */
                    /* 1. 완료(Completed) 또는 완벽(Perfect) 상태 */
                    task.completed || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.PERFECT
                      ? 'bg-slate-50/50 border-transparent' 
                    /* 2. 포기(Given Up) 또는 스킵(Skip) 상태 */
                      : task.status === TaskStatus.SKIP
                        ? 'bg-rose-50/20 border-transparent'
                    /* 3. 그 외 기본 상태 (미실행, 진행 중 등) */
                        : 'bg-white border-slate-100 hover:border-indigo-200'
                    /* ----------------------------------------------- */
                  }`}
                >
                  <RoutineTitleLine 
                    task={task} 
                    index={chunk.tasks.findIndex(t => t.id === task.id)} 
                    currentTime={currentTime}
                    chunkTasks={chunk.tasks}
                    onRestart={handleRestartTaskInternal}
                    onDoFirst={togglePauseTask}
                    isLocked={!isTriggerComplete && task.id !== (scheduledTasks.length > 0 ? scheduledTasks[0].id : null)}
                    activeTaskId={activeTask?.id}
                    isScheduledToday={isTaskScheduledToday(task, chunk, effectiveDate, userData)}
                    onActivate={handleActivateTaskInternal}
                    chunkScheduledDays={chunk.scheduledDays}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {(chunk.tasks.some(t => t.startTime !== undefined || t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.laterTimestamp || t.accumulatedDuration !== undefined)) && (
        <div className="flex justify-center py-4">
          <button 
            onClick={() => resetChunk(chunk.id)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-black shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            루틴 초기화하기
          </button>
        </div>
      )}
    </div>
  );
};

interface SortableChunkItemProps {
  chunk: RoutineChunk;
  onEnterDetail: (id: string) => void;
  onUpdateInfo: (id: string, name: string, purpose: string) => void;
  onDelete: (id: string) => void;
  editingChunkId: string | null;
  setEditingChunkId: (id: string | null) => void;
  editingChunkName: string;
  setEditingChunkName: (name: string) => void;
  editingChunkPurpose: string;
  setEditingChunkPurpose: (purpose: string) => void;
}

const SortableChunkItem: React.FC<SortableChunkItemProps> = ({
  chunk,
  onEnterDetail,
  onUpdateInfo,
  onDelete,
  editingChunkId,
  setEditingChunkId,
  editingChunkName,
  setEditingChunkName,
  editingChunkPurpose,
  setEditingChunkPurpose,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chunk.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-[15px] bg-slate-50 rounded-[10px] border border-slate-100 group flex items-center justify-between">
      <div className="flex items-center gap-3 flex-grow min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 flex-shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>
        
        {editingChunkId === chunk.id ? (
          <div className="flex flex-col gap-2 flex-grow mr-4">
            <input 
              type="text"
              value={editingChunkName}
              onChange={(e) => setEditingChunkName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full bg-white border border-slate-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={editingChunkPurpose}
                onChange={(e) => setEditingChunkPurpose(e.target.value)}
                placeholder="그룹 목적"
                className="flex-grow bg-white border border-slate-200 rounded-[10px] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onUpdateInfo(chunk.id, editingChunkName, editingChunkPurpose);
                  if (e.key === 'Escape') setEditingChunkId(null);
                }}
              />
              <button 
                onClick={() => onUpdateInfo(chunk.id, editingChunkName, editingChunkPurpose)}
                className="text-xs font-bold text-indigo-600 whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <button 
              onClick={() => onEnterDetail(chunk.id)}
              className="flex-grow text-left group/title flex items-center gap-2 min-w-0"
            >
              <h4 className="font-black text-slate-900 group-hover/title:text-indigo-600 transition-colors whitespace-nowrap truncate">
                {chunk.name}
              </h4>
              <div className="relative group/tooltip flex-shrink-0">
                <Settings className="w-4 h-4 text-slate-300 group-hover/title:text-indigo-400 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  수정
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onDelete(chunk.id)}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          title="그룹 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface SortableTaskItemProps {
  task: Task;
  index: number;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingTaskText: string;
  setEditingTaskText: (text: string) => void;
  editingTaskDuration: number;
  setEditingTaskDuration: (duration: number) => void;
  editingTaskType: TaskType;
  setEditingTaskType: (type: TaskType) => void;
  editingTaskScheduledDays: number[];
  setEditingTaskScheduledDays: (days: number[]) => void;
  updateTask: (taskId: string, newText: string, newDuration: number, newTaskType?: TaskType, newScheduledDays?: number[]) => void;
  deleteTask: (id: string) => void;
  chunkScheduledDays: number[];
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, 
  index, 
  editingTaskId, 
  setEditingTaskId, 
  editingTaskText, 
  setEditingTaskText, 
  editingTaskDuration,
  setEditingTaskDuration,
  editingTaskType,
  setEditingTaskType,
  editingTaskScheduledDays,
  setEditingTaskScheduledDays,
  updateTask, 
  deleteTask,
  chunkScheduledDays
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const toggleDay = (day: number) => {
    if (!chunkScheduledDays.includes(day)) return;
    if (editingTaskScheduledDays.includes(day)) {
      setEditingTaskScheduledDays(editingTaskScheduledDays.filter(d => d !== day));
    } else {
      setEditingTaskScheduledDays([...editingTaskScheduledDays, day].sort());
    }
  };

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div ref={setNodeRef} style={style} className="p-3 bg-white rounded-[10px] border border-slate-100 group shadow-sm">
      {editingTaskId === task.id ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">{index + 1}.</span>
            <input 
              type="text"
              value={editingTaskText}
              onChange={(e) => setEditingTaskText(e.target.value)}
              className="flex-grow bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">루틴 유형</span>
              <div className="flex items-center gap-1">
                {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                  const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                  const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                  return (
                    <button 
                      key={type}
                      onClick={() => setEditingTaskType(type)}
                      className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black transition-all flex items-center justify-center gap-1 ${editingTaskType === type ? `${colorClass} text-white shadow-md` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                      <Icon className="w-3 h-3" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-3 rounded-full ${editingTaskType === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : editingTaskType === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600'}`} />
                <span className={`text-[10px] font-bold uppercase ${
                  editingTaskType === TaskType.TIME_INDEPENDENT ? 'text-sky-500' : editingTaskType === TaskType.TIME_ACCUMULATED ? 'text-pink-500' : 'text-indigo-600'
                }`}>소요 시간 (분)</span>
              </div>
              <input 
                type="number"
                value={editingTaskDuration || ''}
                onChange={(e) => setEditingTaskDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                className={`w-full bg-slate-50 border rounded-[10px] px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 transition-colors ${
                  editingTaskType === TaskType.TIME_INDEPENDENT ? 'border-sky-200 focus:ring-sky-500/20' : editingTaskType === TaskType.TIME_ACCUMULATED ? 'border-pink-200 focus:ring-pink-500/20' : 'border-indigo-200 focus:ring-indigo-500/20'
                }`}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">실행 요일</span>
            <div className="flex gap-1">
              {[
                { label: '월', value: 1 },
                { label: '화', value: 2 },
                { label: '수', value: 3 },
                { label: '목', value: 4 },
                { label: '금', value: 5 },
                { label: '토', value: 6, color: 'bg-emerald-600' },
                { label: '일', value: 0, color: 'bg-rose-600' }
              ].map((dayObj) => {
                const i = dayObj.value;
                const isGroupScheduled = chunkScheduledDays.includes(i);
                const isSelected = editingTaskScheduledDays.includes(i);
                const selectedColor = dayObj.color || 'bg-indigo-500';
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    disabled={!isGroupScheduled}
                    className={`w-7 h-7 rounded-[10px] text-[10px] font-bold transition-all ${
                      isSelected 
                        ? `${selectedColor} text-white shadow-sm` 
                        : isGroupScheduled
                          ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {dayObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => updateTask(task.id, editingTaskText, editingTaskDuration, editingTaskType, editingTaskScheduledDays)}
              className="flex-1 py-1.5 bg-indigo-600 text-white rounded-[10px] text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              저장
            </button>
            <button 
              onClick={() => setEditingTaskId(null)}
              className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-[10px] text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">
                {index + 1}. {task.text}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  {task.taskType === TaskType.TIME_INDEPENDENT ? (
                    <Clock className="w-3 h-3 text-sky-500" />
                  ) : task.taskType === TaskType.TIME_ACCUMULATED ? (
                    <BrickWall className="w-3 h-3 text-pink-500" />
                  ) : (
                    <Hourglass className="w-3 h-3 text-indigo-600" />
                  )}
                  <span className="text-[10px] text-slate-500 font-bold">{task.targetDuration || 0}분</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 transition-opacity">
            <div className="relative group/tooltip">
              <button 
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditingTaskText(task.text);
                  setEditingTaskDuration(task.targetDuration || 10);
                  setEditingTaskType(task.taskType || TaskType.TIME_LIMITED);
                  setEditingTaskScheduledDays(task.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
                }}
                className="p-1.5 text-slate-300 hover:text-sky-500 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                변경
              </div>
            </div>
            <div className="relative group/tooltip">
              <button 
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                삭제
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onRemove: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  setConfirmModal: (modal: any) => void;
}

const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({ 
  item, 
  onRemove, 
  onEdit,
  setConfirmModal
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onEdit(item.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100 group transition-all ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-400 transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
          className="flex-grow bg-white border border-indigo-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      ) : (
        <span className="flex-grow text-sm font-bold text-slate-700 truncate">
          {item.text}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: '항목 삭제',
              message: '이 항목을 삭제하시겠습니까?',
              onConfirm: () => {
                onRemove(item.id);
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
              }
            });
          }}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const ChecklistModal = ({ 
  isOpen, 
  onClose, 
  checklist, 
  setChecklist,
  setConfirmModal
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  checklist: ChecklistItem[], 
  setChecklist: (items: ChecklistItem[]) => void,
  setConfirmModal: (modal: any) => void
}) => {
  const [newItemText, setNewItemText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const originalBodyStyle = window.getComputedStyle(document.body).overflow;
      const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyStyle;
        document.documentElement.style.overflow = originalHtmlStyle;
      };
    }
  }, [isOpen]);

  // 자동 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [checklist.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), text: newItemText, completed: false }]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const editItem = (id: string, newText: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text: newText } : item));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = checklist.findIndex((item) => item.id === active.id);
      const newIndex = checklist.findIndex((item) => item.id === over.id);
      setChecklist(arrayMove(checklist, oldIndex, newIndex));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[10px] shadow-2xl overflow-hidden flex flex-col h-[600px]"
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-6 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">체크리스트 만들기</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-2 mb-6 flex-shrink-0">
                <input 
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="체크리스트 항목 입력..."
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-[10px] px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={addItem}
                  className="bg-indigo-600 text-white px-4 rounded-[10px] font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  추가
                </button>
              </div>

              <div 
                ref={scrollRef}
                className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 min-h-0" 
                style={{ overscrollBehavior: 'contain' }}
              >
                {checklist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                    <PlusCircle className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-bold">항목을 추가해보세요</p>
                  </div>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={checklist.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {checklist.map((item) => (
                          <SortableChecklistItem 
                            key={item.id} 
                            item={item} 
                            onRemove={removeItem}
                            onEdit={editItem}
                            setConfirmModal={setConfirmModal}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              <div className="pt-4 flex-shrink-0">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-[10px] font-black text-base hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  완료
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 루틴수정 팝업
const TaskInputSection = ({ 
  label, 
  task, 
  setTask, 
  isTrigger = false, 
  description,
  onAdd,
  onCancel,
  isEditing = false,
  onOpenChecklist,
  groupScheduledDays = [0, 1, 2, 3, 4, 5, 6]
}: { 
  label: React.ReactNode, 
  task: any, 
  setTask: (t: any) => void, 
  isTrigger?: boolean,
  description?: string,
  onAdd?: () => void,
  onCancel?: () => void,
  isEditing?: boolean,
  onOpenChecklist?: () => void,
  groupScheduledDays?: number[]
}) => (
  <div className="space-y-3">
    <div className="flex flex-col gap-1">
      <div className="text-[15px] font-bold text-slate-600 ml-1">{label}</div>
      {description && <p className="text-[10px] font-bold text-slate-400 ml-1 leading-relaxed">{description}</p>}
    </div>
    <div className="bg-white p-3 rounded-[10px] border border-slate-200 space-y-4 shadow-none">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 ml-1">루틴 제목</label>
          {onOpenChecklist && (
            <button 
              onClick={onOpenChecklist}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-[10px] text-[10px] font-black transition-all ${task.checklist && task.checklist.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {task.checklist && task.checklist.length > 0 ? `체크리스트 (${task.checklist.length})` : '체크리스트 만들기'}
            </button>
          )}
        </div>
        <input 
          type="text"
          value={task.text}
          onChange={(e) => setTask({ ...task, text: e.target.value })}
          placeholder={isTrigger ? "예: 침대에서 벗어나기" : "루틴 내용을 입력하세요"}
          className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Routine Schedule Settings (Restored) */}
      {!isTrigger && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">실행 요일 (그룹 일정 내)</span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: '월', value: 1 },
              { label: '화', value: 2 },
              { label: '수', value: 3 },
              { label: '목', value: 4 },
              { label: '금', value: 5 },
              { label: '토', value: 6, color: 'bg-emerald-600' },
              { label: '일', value: 0, color: 'bg-rose-600' }
            ].map((dayObj) => {
              const i = dayObj.value;
              const isAvailable = groupScheduledDays.includes(i);
              const isSelected = task.scheduledDays?.includes(i);
              const selectedColor = dayObj.color || 'bg-indigo-600';
              return (
                <button
                  key={i}
                  disabled={!isAvailable}
                  onClick={() => {
                    const currentDays = task.scheduledDays || [];
                    let nextDays;
                    if (currentDays.includes(i)) {
                      if (currentDays.length > 1) {
                        nextDays = currentDays.filter((d: number) => d !== i);
                      } else {
                        nextDays = currentDays;
                      }
                    } else {
                      nextDays = [...currentDays, i].sort();
                    }
                    setTask({ ...task, scheduledDays: nextDays });
                  }}
                  className={`w-8 h-8 rounded-[10px] text-[10px] font-black transition-all ${
                    isSelected 
                      ? `${selectedColor} text-white shadow-none` 
                      : isAvailable 
                        ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                        : 'bg-slate-50 text-slate-200 border border-slate-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  {dayObj.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isTrigger && (
        <div className="space-y-0">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-[10px]">
              {[
                { type: TaskType.TIME_INDEPENDENT, label: '시간무관루틴', icon: Clock },
                { type: TaskType.TIME_LIMITED, label: '시간제한루틴', icon: Hourglass },
                { type: TaskType.TIME_ACCUMULATED, label: '시간축적루틴', icon: BrickWall }
              ].map((t) => (
                <button
                  key={t.type}
                  onClick={() => setTask({ ...task, type: t.type })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[10px] font-black transition-all ${task.type === t.type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 mt-[-1px]">
            <div className="bg-white border border-slate-200 rounded-[10px] p-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                시간 (분)
              </span>
              <div className="flex items-center gap-2">
                {task.type === TaskType.TIME_INDEPENDENT ? (
                  <Clock className="w-4 h-4 text-sky-500" />
                ) : task.type === TaskType.TIME_ACCUMULATED ? (
                  <BrickWall className="w-4 h-4 text-pink-500" />
                ) : (
                  <Hourglass className="w-4 h-4 text-indigo-600" />
                )}
                <input 
                  type="number"
                  min="1"
                  value={task.duration}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    setTask({ ...task, duration: val });
                  }}
                  onBlur={() => {
                    if (task.duration === '' || task.duration < 1) {
                      setTask({ ...task, duration: 1 });
                    }
                  }}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isTrigger && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
            시간 (최대 3분)
          </span>
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-[10px] px-4 py-2">
            {task.type === TaskType.TIME_INDEPENDENT ? (
              <Clock className="w-4 h-4 text-sky-500" />
            ) : task.type === TaskType.TIME_ACCUMULATED ? (
              <BrickWall className="w-4 h-4 text-pink-500" />
            ) : (
              <Hourglass className="w-4 h-4 text-indigo-600" />
            )}
            <input 
              type="number"
              min="1"
              max={3}
              value={task.duration}
              onChange={(e) => {
                let val: any = e.target.value === '' ? '' : parseInt(e.target.value);
                if (typeof val === 'number') {
                  val = Math.min(3, val);
                }
                setTask({ ...task, duration: val });
              }}
              onBlur={() => {
                if (task.duration === '' || task.duration < 1) {
                  setTask({ ...task, duration: 1 });
                }
              }}
              className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
            />
          </div>
        </div>
      )}

      {(onAdd || isEditing) && (
        <div className="flex gap-2">
          {isEditing && onCancel && (
            <button 
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-[10px] text-xs font-black hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          )}
          {isEditing && (task as any).onDelete && (
            <button 
              onClick={(task as any).onDelete}
              className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-[10px] text-xs font-black hover:bg-rose-100 transition-colors"
            >
              루틴 삭제
            </button>
          )}
          <button 
            onClick={onAdd}
            disabled={!task.text.trim()}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-[10px] text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? '수정 완료' : '루틴 추가하기'}
          </button>
        </div>
      )}
    </div>
  </div>
);

const SortableRoutineItem = ({ 
  rt, 
  idx, 
  onEdit, 
  onDelete,
  groupScheduledDays
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: rt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white p-3 rounded-[10px] border border-slate-200 flex items-center justify-between shadow-none group"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{idx + 2}. {rt.text}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              {rt.type === TaskType.TIME_INDEPENDENT ? (
                <Clock className="w-3 h-3 text-sky-500" />
              ) : rt.type === TaskType.TIME_ACCUMULATED ? (
                <BrickWall className="w-3 h-3 text-pink-500" />
              ) : (
                <Hourglass className="w-3 h-3 text-indigo-600" />
              )}
              <span className="text-[10px] font-bold text-slate-400">{rt.duration}분</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RoutineEditModal = ({ 
  isOpen, 
  onClose, 
  task, 
  setTask, 
  onSave, 
  onOpenChecklist,
  groupScheduledDays,
  label
}: any) => {
  useEffect(() => {
    if (isOpen) {
      const originalBodyStyle = window.getComputedStyle(document.body).overflow;
      const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyStyle;
        document.documentElement.style.overflow = originalHtmlStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[25px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <TaskInputSection 
            label={label}
            task={task}
            setTask={setTask}
            onAdd={onSave}
            onCancel={onClose}
            isEditing={true}
            onOpenChecklist={onOpenChecklist}
            groupScheduledDays={groupScheduledDays}
          />
        </div>
      </motion.div>
    </div>
  );
};

// 새로운 루틴 그룹 만들기 제목 글꼴 및 배경색 설정
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  /* Section Title Style: 배경색(bg-sky-100)이나 글자색(text-slate-700)을 여기서 직접 수정할 수 있습니다. */
  <label className="inline-block px-2 py-0.5 bg-sky-100/70 rounded-md text-lg font-black text-slate-700 uppercase tracking-wider ml-1 mb-4 mt-6">
    {children}
  </label>
);

const RoutineGroupFormView: React.FC<{
  addChunk: (name: string, purpose: string, tasks: Task[], scheduleType: 'days', scheduledDays: number[], startTime?: string, isAlarmEnabled?: boolean, startType?: 'anytime' | 'situation' | 'time', situation?: string) => void;
  updateChunk?: (id: string, updatedData: Partial<RoutineChunk>) => void;
  initialChunk?: RoutineChunk;
  setActiveTab: (tab: any) => void;
  setSettingsSubView: (view: any) => void;
  setIsSettingsOpen: (open: boolean) => void;
  userData: UserData;
  mode?: 'add' | 'edit';
}> = ({ addChunk, updateChunk, initialChunk, setActiveTab, setSettingsSubView, setIsSettingsOpen, userData, mode = 'add' }) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [triggerTask, setTriggerTask] = useState({ text: '', duration: 1, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6] });
  const [routineList, setRoutineList] = useState<Array<{ id: string, text: string, duration: number, type: TaskType, scheduledDays: number[] }>>([]);
  const [currentRoutineInput, setCurrentRoutineInput] = useState({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6] });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '확인',
    cancelLabel: '취소',
    onConfirm: () => {}
  });
  
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const prevScheduledDaysRef = React.useRef<number[]>(scheduledDays);

  useEffect(() => {
    if (initialChunk) {
      setName(initialChunk.name);
      setPurpose(initialChunk.purpose || '');
      setScheduledDays(initialChunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
      setStartTime(initialChunk.startTime || '07:00');
      setStartType(initialChunk.startType || 'anytime');
      setSituation(initialChunk.situation || '');
      setIsAlarmEnabled(initialChunk.isAlarmEnabled || false);

      const tasks = initialChunk.tasks || [];
      if (tasks.length > 0) {
        const first = tasks[0];
        setTriggerTask({
          text: first.text,
          duration: first.targetDuration || 1,
          type: first.taskType || TaskType.TIME_LIMITED,
          scheduledDays: first.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          checklist: (first as any).checklist || []
        });

        const middle = tasks.slice(1);
        setRoutineList(middle.map(t => ({
          id: t.id,
          text: t.text,
          duration: t.targetDuration || 1,
          type: t.taskType || TaskType.TIME_LIMITED,
          scheduledDays: t.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          checklist: (t as any).checklist || []
        })));
      }
    }
  }, [initialChunk]);

  // Intelligent Day Synchronization
  useEffect(() => {
    const prevDays = prevScheduledDaysRef.current;
    const added = scheduledDays.filter(d => !prevDays.includes(d));
    const removed = prevDays.filter(d => !scheduledDays.includes(d));

    if (added.length > 0 || removed.length > 0) {
      // 1. Trigger Task: Always follows group schedule
      setTriggerTask(prev => ({ ...prev, scheduledDays: scheduledDays }));

      // 2. Routine List: 
      // - Add newly activated group days
      // - Remove newly deactivated group days
      // - Respect manual deactivations (added days are added, but existing ones are kept as is unless removed from group)
      setRoutineList(prev => prev.map(t => {
        let nextDays = t.scheduledDays || [];
        // Add newly activated group days
        if (added.length > 0) nextDays = [...nextDays, ...added];
        // Remove newly deactivated group days
        if (removed.length > 0) nextDays = nextDays.filter(d => !removed.includes(d));
        return [...new Set(nextDays)].sort();
      }));

      // 3. Current Input: Same logic as routine list
      setCurrentRoutineInput(prev => {
        let nextDays = prev.scheduledDays || [];
        if (added.length > 0) nextDays = [...nextDays, ...added];
        if (removed.length > 0) nextDays = nextDays.filter(d => !removed.includes(d));
        return { ...prev, scheduledDays: [...new Set(nextDays)].sort() };
      });

      prevScheduledDaysRef.current = scheduledDays;
    }
  }, [scheduledDays]);

  const [startTime, setStartTime] = useState('07:00');
  const [startType, setStartType] = useState<'anytime' | 'situation' | 'time'>('anytime');
  const [situation, setSituation] = useState('');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingRoutineIndex, setEditingRoutineIndex] = useState<number | null>(null);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [activeChecklistTarget, setActiveChecklistTarget] = useState<'trigger' | 'current' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addRoutineToList = () => {
    if (!currentRoutineInput.text.trim()) return;
    
    const taskToSave = { 
      ...currentRoutineInput, 
      duration: Number(currentRoutineInput.duration) || 1 
    };

    if (editingRoutineIndex !== null) {
      const newList = [...routineList];
      newList[editingRoutineIndex] = { ...newList[editingRoutineIndex], ...taskToSave };
      setRoutineList(newList);
      setEditingRoutineIndex(null);
      setIsEditModalOpen(false);
    } else {
      setRoutineList([...routineList, { ...taskToSave, id: `new-rt-${Date.now()}` }]);
    }
    setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
  };

  const startEditing = (idx: number) => {
    setEditingRoutineIndex(idx);
    const routine = routineList[idx];
    setCurrentRoutineInput({
      text: routine.text,
      duration: routine.duration || 10,
      type: routine.type,
      scheduledDays: routine.scheduledDays || scheduledDays,
      checklist: (routine as any).checklist || [],
      onDelete: () => {
        setConfirmModal({
          isOpen: true,
          title: '루틴 삭제',
          message: '이 루틴을 삭제하시겠습니까?',
          confirmLabel: '삭제',
          onConfirm: () => {
            setRoutineList(routineList.filter((_, i) => i !== idx));
            setEditingRoutineIndex(null);
            setIsEditModalOpen(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    } as any);
    setIsEditModalOpen(true);
  };

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = routineList.findIndex((rt) => rt.id === active.id);
      const newIndex = routineList.findIndex((rt) => rt.id === over.id);
      setRoutineList(arrayMove(routineList, oldIndex, newIndex));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('루틴 그룹 이름을 입력해주세요.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('루틴 그룹 목적을 입력해주세요.');
      return;
    }
    
    const finalTasks: Task[] = [];
    const now = Date.now();
    
    // 1. Trigger Task
    finalTasks.push({
      id: mode === 'edit' && initialChunk?.tasks[0]?.id ? initialChunk.tasks[0].id : `trigger-${now}`,
      text: triggerTask.text || '트리거 루틴',
      completed: false,
      targetDuration: Math.min(3, Number(triggerTask.duration) || 1),
      taskType: triggerTask.type,
      scheduledDays: triggerTask.scheduledDays.filter(d => scheduledDays.includes(d)),
      checklist: (triggerTask as any).checklist || []
    });
    
    // 2. Routine List
    routineList.forEach((rt, idx) => {
      finalTasks.push({
        id: rt.id.startsWith('new-rt-') ? `routine-${idx}-${now}` : rt.id,
        text: rt.text,
        completed: false,
        targetDuration: Number(rt.duration) || 1,
        taskType: rt.type,
        scheduledDays: rt.scheduledDays.filter(d => scheduledDays.includes(d)),
        checklist: (rt as any).checklist || []
      });
    });

    // 3. Current Input (if not empty)
    if (currentRoutineInput.text.trim()) {
      finalTasks.push({
        id: `routine-last-${now}`,
        text: currentRoutineInput.text,
        completed: false,
        targetDuration: Number(currentRoutineInput.duration) || 1,
        taskType: currentRoutineInput.type,
        scheduledDays: currentRoutineInput.scheduledDays.filter(d => scheduledDays.includes(d)),
        checklist: (currentRoutineInput as any).checklist || []
      });
    }
    
    if (finalTasks.length < 2) {
      setErrorMessage('모든 루틴 그룹은 반드시 두 개 이상의 루틴이 들어가야 합니다. (트리거 + 개별 루틴)');
      return;
    }
    setErrorMessage(null);

    if (mode === 'edit' && initialChunk && updateChunk) {
      updateChunk(initialChunk.id, {
        name,
        purpose,
        tasks: finalTasks,
        scheduledDays,
        startTime: startType === 'time' ? startTime : '',
        isAlarmEnabled,
        startType,
        situation
      });
      setSettingsSubView({ type: 'main' });
      setIsSettingsOpen(false);
    } else {
      addChunk(name, purpose, finalTasks, 'days', scheduledDays, startType === 'time' ? startTime : '', isAlarmEnabled, startType, situation);
      setActiveTab('home');
    }
  };

  const openChecklistModal = (target: 'trigger' | 'current') => {
    setActiveChecklistTarget(target);
    setIsChecklistModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-20">
      <AnimatePresence>
        {isEditModalOpen && (
          <RoutineEditModal 
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingRoutineIndex(null);
              setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
            }}
            task={currentRoutineInput}
            setTask={setCurrentRoutineInput}
            onSave={addRoutineToList}
            onOpenChecklist={() => openChecklistModal('current')}
            groupScheduledDays={scheduledDays}
            label={<div className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> 루틴 수정</div>}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[25px] p-6 z-[210] shadow-2xl w-[90%] max-w-sm"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-[15px] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    {confirmModal.cancelLabel || '취소'}
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-3 rounded-[15px] font-black text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                  >
                    {confirmModal.confirmLabel || '확인'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChecklistModal 
        isOpen={isChecklistModalOpen}
        onClose={() => {
          setIsChecklistModalOpen(false);
          setActiveChecklistTarget(null);
        }}
        checklist={activeChecklistTarget === 'trigger' ? (triggerTask as any).checklist || [] : (currentRoutineInput as any).checklist || []}
        setChecklist={(items) => {
          if (activeChecklistTarget === 'trigger') {
            setTriggerTask({ ...triggerTask, checklist: items } as any);
          } else {
            setCurrentRoutineInput({ ...currentRoutineInput, checklist: items } as any);
          }
        }}
        setConfirmModal={setConfirmModal}
      />
      {/* 여백 조정 포인트: px-2.5 (기존 p-5에서 좌우 여백만 절반으로 축소) */}
      <div className="bg-white border border-slate-200 rounded-[10px] px-2.5 py-5 shadow-none space-y-5">
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{mode === 'edit' ? '루틴 그룹 수정' : '새로운 루틴 그룹 만들기'}</h2>
          </div>
        </div>
        <div className="space-y-5">
          {/* Name Input */}
          <div className="space-y-3">
            <SectionTitle>1. 루틴그룹 이름</SectionTitle>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 아침 루틴, 독서 루틴 등"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Purpose Input */}
          <div className="space-y-3">
            <SectionTitle>2. 목적</SectionTitle>
            <input 
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="예: 아침시간을 낭비하지 않는 사람"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Schedule Settings */}
          <div className="space-y-3">
            <SectionTitle>3. 요일 설정</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '월', value: 1 },
                { label: '화', value: 2 },
                { label: '수', value: 3 },
                { label: '목', value: 4 },
                { label: '금', value: 5 },
                { label: '토', value: 6, color: 'bg-emerald-600' },
                { label: '일', value: 0, color: 'bg-rose-600' }
              ].map((dayObj) => {
                const i = dayObj.value;
                const isSelected = scheduledDays.includes(i);
                const selectedColor = dayObj.color || 'bg-indigo-600';
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (scheduledDays.includes(i)) {
                        if (scheduledDays.length > 1) {
                          setScheduledDays(scheduledDays.filter(d => d !== i));
                        }
                      } else {
                        setScheduledDays([...scheduledDays, i].sort());
                      }
                    }}
                    className={`w-10 h-10 rounded-[10px] text-sm font-black transition-all ${isSelected ? `${selectedColor} text-white shadow-none` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {dayObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Situation or Time Setting */}
          <div className="space-y-0">
            <SectionTitle>4. 시작 상황 또는 시각 설정</SectionTitle>
            
            <div className="relative">
              {/* Index-style Tabs */}
              <div className="flex items-end gap-1 px-0 relative z-10">
                {[
                  { id: 'anytime', label: '아무때나' },
                  { id: 'situation', label: '상황' },
                  { id: 'time', label: '시각' }
                ].map((tab) => {
                  const isActive = startType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStartType(tab.id as any);
                        if (tab.id !== 'time') setIsAlarmEnabled(false);
                      }}
                      className={`px-4 py-2 rounded-t-[10px] text-sm font-black transition-all border-x border-t ${
                        isActive 
                          ? 'bg-white border-slate-200 text-slate-700 -mb-px' 
                          : 'bg-slate-100/50 border-transparent text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Connected Content Area */}
              <div className="bg-white border border-slate-200 rounded-[12px] rounded-tl-none px-4 py-4 min-h-[85px] flex flex-col justify-center">
                <div className="animate-in fade-in duration-300">
                  {startType === 'anytime' && (
                    <div className="flex items-center justify-start">
                      <p className="text-sm font-black text-slate-700 ml-1">
                        아무때나 시작합니다
                      </p>
                    </div>
                  )}

                  {startType === 'situation' && (
                    <div className="flex items-center justify-start w-full px-0">
                      <input 
                        type="text"
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        placeholder="상황을 입력하세요 (예: 나갔다와서)"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[10px] px-4 py-2 text-sm font-black text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all focus:bg-white"
                      />
                    </div>
                  )}

                  {startType === 'time' && (
                    <div className="flex items-center justify-start gap-5">
                      {/* Time Input: Single row layout returned */}
                      <div className="flex items-center focus-within:ring-0 transition-all">
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="text-lg font-black bg-transparent border-none focus:ring-0 p-0 text-slate-700 tabular-nums"
                          style={{ width: '130px' }} 
                        />
                      </div>

                      {/* Alarm Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-slate-700">
                          {isAlarmEnabled ? '알람 ON' : '알람 OFF'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                          className="w-10 h-5 rounded-full transition-all relative border-0 p-0 cursor-pointer shadow-none overflow-hidden"
                          style={{ backgroundColor: isAlarmEnabled ? 'rgb(79 70 229)' : 'rgb(203 213 225)' }}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isAlarmEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-5">
            <TaskInputSection 
              label={<SectionTitle>5. 첫번째 루틴 (트리거 루틴)</SectionTitle>}
              task={triggerTask}
              setTask={setTriggerTask}
              isTrigger={true}
              description="가벼운 주의 환기 행동으로 시작합니다. 아침 루틴을 위해서 침대에서 벗어나기, 독서를 위해서 책을 펼쳐놓기와 같이 3분이내 끝날 수 있는 행동을 설정해주세요"
              onOpenChecklist={() => openChecklistModal('trigger')}
              groupScheduledDays={scheduledDays}
            />

            <div className="space-y-3">
              <SectionTitle>6. 루틴 추가</SectionTitle>
              
              {/* Added Routines List (Numbered 2, 3, 4...) */}
              {routineList.length > 0 && (
                <div className="space-y-3 mb-4">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleRoutineDragEnd}
                  >
                    <SortableContext 
                      items={routineList.map(rt => rt.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {routineList.map((rt, idx) => (
                          <SortableRoutineItem 
                            key={rt.id} 
                            rt={rt} 
                            idx={idx} 
                            onEdit={() => startEditing(idx)}
                            onDelete={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: '루틴 삭제',
                                message: '이 루틴을 삭제하시겠습니까?',
                                confirmLabel: '삭제',
                                onConfirm: () => {
                                  setRoutineList(routineList.filter((_, i) => i !== idx));
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            groupScheduledDays={scheduledDays}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* New Routine Input Dialog */}
              <div id="routine-input-section">
                <TaskInputSection 
                  label=""
                  task={currentRoutineInput}
                  setTask={setCurrentRoutineInput}
                  onAdd={addRoutineToList}
                  isEditing={editingRoutineIndex !== null}
                  onCancel={() => {
                    setEditingRoutineIndex(null);
                    setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
                  }}
                  onOpenChecklist={() => openChecklistModal('current')}
                  groupScheduledDays={scheduledDays}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-[10px] flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (mode === 'edit') {
                if (setIsSettingsOpen) setIsSettingsOpen(false);
                if (setSettingsSubView) setSettingsSubView({ type: 'main' });
              } else {
                setActiveTab('home');
              }
            }}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[10px] font-black text-lg hover:bg-slate-200 transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-[10px] font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            {mode === 'edit' ? '저장하기' : '루틴 그룹 만들기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'execution' | 'settings' | 'add'>('home');
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [showCheckInCelebration, setShowCheckInCelebration] = useState(false);
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = formatDate(new Date());
    
    let parsed: any;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        console.error(`Failed to parse ${STORAGE_KEY}`, e);
        parsed = null;
      }
    }

    if (!parsed) {
      parsed = {
        completionRate: 0,
        streak: 0,
        lastCheckInDate: null,
        targetWakeUpTime: '07:00',
        routineChunks: [],
        history: [],
        startDate: today,
        dailyCompletionRate: {},
        resetTime: '00:00',
        dailyResetHour: 0,
        lastCheckCheckTime: Date.now(),
        lastResetDate: null,
        dailyCheckCheckCounts: {},
        autoReorderGroups: false,
        firstRoutineAutoStart: false,
        nextRoutineAutoStart: false,
        userName: '나'
      };
    }

    // Load separate history keys
    try {
      const wakeUpHistory = localStorage.getItem('WakeUpTimeHistory');
      if (wakeUpHistory) parsed.wakeUpTimeHistory = JSON.parse(wakeUpHistory);
      
      const groupHistory = localStorage.getItem('RoutineGroupHistory');
      if (groupHistory) parsed.routineGroupHistory = JSON.parse(groupHistory);
      
      const taskHistory = localStorage.getItem('TaskHistory');
      if (taskHistory) parsed.taskHistory = JSON.parse(taskHistory);
    } catch (e) {
      console.error('Failed to parse history data', e);
    }

    // Migration for old data
    if (!parsed.history) parsed.history = [];
    if (!parsed.startDate) parsed.startDate = today;
    
    if (!parsed.dailyCompletionRate) parsed.dailyCompletionRate = {};
    if (parsed.resetTime === undefined) parsed.resetTime = '00:00';
    if (parsed.dailyResetHour === undefined) {
      const h = parseInt(parsed.resetTime.split(':')[0]) || 0;
      parsed.dailyResetHour = h;
    }
    if (parsed.lastCheckCheckTime === undefined) parsed.lastCheckCheckTime = Date.now();
    if (parsed.lastResetDate === undefined) parsed.lastResetDate = null;
    if (parsed.dailyCheckCheckCounts === undefined) parsed.dailyCheckCheckCounts = {};
    if (parsed.dailyCheckIn === undefined) parsed.dailyCheckIn = {};
    
    if (parsed.autoReorderGroups === undefined) parsed.autoReorderGroups = false;
    
    if (parsed.firstRoutineAutoStart === undefined) parsed.firstRoutineAutoStart = false;
    if (parsed.nextRoutineAutoStart === undefined) parsed.nextRoutineAutoStart = false;
    
    if (parsed.wakeUpTimeHistory === undefined) parsed.wakeUpTimeHistory = [];
    if (parsed.routineGroupHistory === undefined) parsed.routineGroupHistory = [];
    if (parsed.taskHistory === undefined) parsed.taskHistory = [];

    // Migration for chunks
    if (parsed.routine && !parsed.routineChunks) {
      parsed.routineChunks = [{
        id: 'default',
        name: '기본 루틴',
        purpose: '더 나은 나',
        completionDates: [],
        tasks: parsed.routine.map((t: any) => ({
          ...t
        })),
        startTime: '',
        duration: 0,
        endTime: ''
      }];
      delete parsed.routine;
    }

    if (parsed.routineChunks) {
      parsed.routineChunks = parsed.routineChunks.map((chunk: any) => ({
        ...chunk,
        startTime: chunk.startTime || '',
        duration: chunk.duration || 0,
        endTime: chunk.endTime || '',
        purpose: chunk.purpose || '더 나은 나',
        completionDates: chunk.completionDates || [],
        inactiveDates: chunk.inactiveDates || [],
        scheduleType: chunk.scheduleType || 'days',
        scheduledDays: chunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
        frequency: chunk.frequency || 1,
        isAlarmEnabled: chunk.isAlarmEnabled || false,
        lastAlarmTriggeredDate: chunk.lastAlarmTriggeredDate || null,
        tasks: (chunk.tasks || []).map((t: any) => ({
          ...t,
          scheduledDays: t.scheduledDays || [0, 1, 2, 3, 4, 5, 6]
        }))
      }));
    } else {
      parsed.routineChunks = [];
    }

    return parsed as UserData;
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [addGroupStep, setAddGroupStep] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPurpose, setNewGroupPurpose] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(10);
  const [newTaskType, setNewTaskType] = useState<TaskType>(TaskType.TIME_LIMITED);
  const [newChunkName, setNewChunkName] = useState('');
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingChunkName, setEditingChunkName] = useState('');
  const [editingChunkPurpose, setEditingChunkPurpose] = useState('');
  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>({ type: 'main' });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskDuration, setEditingTaskDuration] = useState(10);
  const [editingTaskType, setEditingTaskType] = useState<TaskType>(TaskType.TIME_LIMITED);
  const [editingTaskScheduledDays, setEditingTaskScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [chunkTimeInputs, setChunkTimeInputs] = useState<Record<string, { s: string, d: number, e: string, alarm?: boolean }>>({});
  const [chunkScheduleInputs, setChunkScheduleInputs] = useState<Record<string, { type: 'days' | 'weekly' | 'monthly' | 'yearly', days: number[], freq: number }>>({});
  const [lastCompletedTaskName, setLastCompletedTaskName] = useState<string | null>(null);
  const [activeAlarmChunk, setActiveAlarmChunk] = useState<RoutineChunk | null>(null);
  const [isResetTimeDropdownOpen, setIsResetTimeDropdownOpen] = useState(false);
  const [swUpdateRegistration, setSwUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize/Sync chunk time inputs when settings open or routineChunks change
  useEffect(() => {
    if (isSettingsOpen) {
      const initial: Record<string, { s: string, d: number, e: string, alarm?: boolean }> = {};
      userData.routineChunks.forEach(c => {
        initial[c.id] = { s: c.startTime || '', d: c.duration || 0, e: c.endTime || '', alarm: c.isAlarmEnabled };
      });
      setChunkTimeInputs(initial);
    }
  }, [isSettingsOpen, userData.routineChunks]);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '확인',
    cancelLabel: '취소',
    onConfirm: () => {}
  });

  // --- Effects ---
  const effectiveDate = useMemo(() => {
    const [resetH] = userData.resetTime.split(':').map(Number);
    return getEffectiveDateObject(currentTime, resetH);
  }, [currentTime, userData.resetTime]);

  const todayStr = useMemo(() => formatDate(effectiveDate), [effectiveDate]);

  useEffect(() => {
    if (settingsSubView.type === 'detail') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Also scroll the modal container if it exists
      const modalScrollContainer = document.querySelector('.custom-scrollbar');
      if (modalScrollContainer) {
        modalScrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [settingsSubView.type]);

  // Listen for Service Worker updates
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const registration = (event as CustomEvent).detail;
      setSwUpdateRegistration(registration);
    };

    window.addEventListener('swUpdateAvailable', handleUpdate);
    return () => window.removeEventListener('swUpdateAvailable', handleUpdate);
  }, []);

  const handleUpdateApp = () => {
    if (swUpdateRegistration?.waiting) {
      swUpdateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: just reload if something went wrong but we know there's an update
      window.location.reload();
    }
  };

  // Reset tasks when todayStr changes
  useEffect(() => {
    if (userData.lastResetDate !== todayStr) {
      setUserData(prev => ({
        ...prev,
        lastResetDate: todayStr,
        routineChunks: prev.routineChunks.map(chunk => ({
          ...chunk,
          tasks: chunk.tasks.map(t => ({ 
            ...t, 
            completed: false,
            laterTimestamp: undefined,
            startTime: undefined,
            endTime: undefined,
            isPaused: false,
            accumulatedDuration: 0,
            duration: 0,
            closingNote: undefined,
            satisfaction: undefined,
            status: TaskStatus.NOT_STARTED,
            checklist: t.checklist?.map(c => ({ ...c, completed: false }))
          }))
        }))
      }));
    }
  }, [todayStr, userData.lastResetDate]);

  // Alarm Logic
  useEffect(() => {
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    const nowTimeStr = `${String(nowH).padStart(2, '0')}:${String(nowM).padStart(2, '0')}`;

    userData.routineChunks.forEach(chunk => {
      if (chunk.isAlarmEnabled && chunk.startTime === nowTimeStr && chunk.lastAlarmTriggeredDate !== todayStr && !activeAlarmChunk) {
        if (isChunkScheduledToday(chunk, effectiveDate, userData)) {
          setActiveAlarmChunk(chunk);
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          setUserData(prev => ({
            ...prev,
            routineChunks: prev.routineChunks.map(c => 
              c.id === chunk.id ? { ...c, lastAlarmTriggeredDate: todayStr } : c
            )
          }));
        }
      }
    });
  }, [currentTime, userData.routineChunks, todayStr, activeAlarmChunk]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Removed auto-pause when navigating away from execution screen as per user request
  // Current routine should continue counting in the background

  useEffect(() => {
    const totalCompleted = userData.routineChunks.reduce((acc, chunk) => 
      acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData) && (t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT)).length, 0
    );
    const totalScheduledTasksCount = userData.routineChunks.reduce((acc, chunk) => 
      acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData)).length, 0
    );
    const completionPercentage = totalScheduledTasksCount > 0 
      ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
      : 0;

    if ((userData.dailyCompletionRate?.[todayStr]) !== completionPercentage) {
      setUserData(prev => ({
        ...prev,
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      }));
    }
  }, [userData.routineChunks, todayStr, currentTime]);

  const saveData = (data: UserData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (data.wakeUpTimeHistory) {
        localStorage.setItem('WakeUpTimeHistory', JSON.stringify(data.wakeUpTimeHistory));
      }
      if (data.routineGroupHistory) {
        localStorage.setItem('RoutineGroupHistory', JSON.stringify(data.routineGroupHistory));
      }
      if (data.taskHistory) {
        localStorage.setItem('TaskHistory', JSON.stringify(data.taskHistory));
      }
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  };

  useEffect(() => {
    saveData(userData);
  }, [userData]);

  // --- Helpers ---
  const syncHistory = (data: UserData, today: string): UserData => {
    const [y, m, d] = today.split('-').map(Number);
    const syncDate = new Date(y, m - 1, d);

    let newTaskHistory = [...(data.taskHistory || [])];
    let newGroupHistory = [...(data.routineGroupHistory || [])];
    let newWakeUpHistory = [...(data.wakeUpTimeHistory || [])];

    // Update WakeUp History if checked in today
    if (data.lastCheckInDate === today) {
      const checkInTime = data.dailyCheckIn?.[today];
      if (checkInTime) {
        const existingIdx = newWakeUpHistory.findIndex(h => h.date === today);
        if (existingIdx >= 0) {
          newWakeUpHistory[existingIdx] = { date: today, wakeUpTime: checkInTime };
        } else {
          newWakeUpHistory.push({ date: today, wakeUpTime: checkInTime });
        }
      }
    }

    // Update Task and Group History
    data.routineChunks.forEach(chunk => {
      const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, syncDate, data));
      const isActive = scheduledTasks.length > 0;
      
      let firstStartTime: string | null = null;
      let totalDuration = 0;
      let allFinished = scheduledTasks.length > 0;
      let anyStarted = false;
      let lastEndTime: string | null = null;

      scheduledTasks.forEach(task => {
        // Task History
        let statusStr = '미실행';
        if (task.status === TaskStatus.PERFECT) statusStr = '완벽';
        else if (task.status === TaskStatus.COMPLETED || task.completed) statusStr = '완료';
        else if (task.status === TaskStatus.SKIP) statusStr = '스킵';
        else if (task.isPaused) statusStr = '일시정지';
        else if (task.startTime) statusStr = '실행중';

        const taskDuration = task.duration || task.accumulatedDuration || 0;
        
        const taskEntryIdx = newTaskHistory.findIndex(h => h.date === today && h.taskId === task.id);
        const taskEntry: TaskHistoryEntry = {
          date: today,
          taskId: task.id,
          groupId: chunk.id,
          isActive: true,
          duration: taskDuration,
          status: statusStr
        };

        if (taskEntryIdx >= 0) {
          newTaskHistory[taskEntryIdx] = taskEntry;
        } else {
          newTaskHistory.push(taskEntry);
        }

        // Group Stats
        if (task.startTime && (!firstStartTime || task.startTime < firstStartTime)) {
          firstStartTime = task.startTime;
        }
        if (task.endTime && (!lastEndTime || task.endTime > lastEndTime)) {
          lastEndTime = task.endTime;
        }
        totalDuration += taskDuration;
        if (!task.completed && task.status !== TaskStatus.SKIP && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.PERFECT) {
          allFinished = false;
        }
        if (task.startTime || task.completed || task.status !== TaskStatus.NOT_STARTED) {
          anyStarted = true;
        }
      });

      // Group History
      let completionStatus: '비활성' | '미실행' | '미완료' | '전체완료' = '미실행';
      if (!isActive) completionStatus = '비활성';
      else if (allFinished) completionStatus = '전체완료';
      else if (anyStarted) completionStatus = '미완료';

      const existingEntry = newGroupHistory.find(h => h.date === today && h.groupId === chunk.id);
      const satisfaction = existingEntry?.satisfaction;
      const closingNote = existingEntry?.closingNote;
      const selectedPhrase = existingEntry?.selectedPhrase;

      // Preserve earliest start time
      const finalFirstStartTime = [firstStartTime, existingEntry?.firstTaskStartTime]
        .filter(Boolean)
        .sort()[0] || null;

      const groupEntryIdx = newGroupHistory.findIndex(h => h.date === today && h.groupId === chunk.id);
      const groupEntry: RoutineGroupHistoryEntry = {
        date: today,
        groupId: chunk.id,
        isActive,
        firstTaskStartTime: finalFirstStartTime,
        completionStatus,
        completedAt: lastEndTime,
        totalDuration,
        satisfaction,
        closingNote,
        selectedPhrase
      };

      if (groupEntryIdx >= 0) {
        newGroupHistory[groupEntryIdx] = groupEntry;
      } else {
        newGroupHistory.push(groupEntry);
      }
    });

    return {
      ...data,
      wakeUpTimeHistory: newWakeUpHistory,
      routineGroupHistory: newGroupHistory,
      taskHistory: newTaskHistory
    };
  };

  const canCheckIn = useMemo(() => {
    if (userData.lastCheckInDate === todayStr) return false;
    
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date(effectiveDate);
    targetDate.setHours(targetH, targetM, 0, 0);
    
    const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
    return diffMinutes >= -30 && diffMinutes <= 10;
  }, [userData.targetWakeUpTime, userData.lastCheckInDate, currentTime, todayStr, effectiveDate]);

  const isLate = useMemo(() => {
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date(effectiveDate);
    targetDate.setHours(targetH, targetM, 0, 0);
    return currentTime.getTime() > targetDate.getTime() + (10 * 60 * 1000);
  }, [userData.targetWakeUpTime, currentTime, effectiveDate]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, chunkId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUserData((prev) => {
        const chunk = prev.routineChunks.find((c) => c.id === chunkId);
        if (!chunk) return prev;

        const oldIndex = chunk.tasks.findIndex((t) => t.id === active.id);
        const newIndex = chunk.tasks.findIndex((t) => t.id === over.id);

        const newTasks = arrayMove(chunk.tasks, oldIndex, newIndex);

        return {
          ...prev,
          routineChunks: prev.routineChunks.map((c) =>
            c.id === chunkId ? { ...c, tasks: newTasks } : c
          ),
        };
      });
    }
  };

  const handleChunkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setUserData((prev) => {
        const oldIndex = prev.routineChunks.findIndex((c) => c.id === active.id);
        const newIndex = prev.routineChunks.findIndex((c) => c.id === over.id);
        return {
          ...prev,
          routineChunks: arrayMove(prev.routineChunks, oldIndex, newIndex),
        };
      });
    }
  };

  // --- Handlers ---
  const handleEnterExecution = (chunkId: string) => {
    const chunk = userData.routineChunks.find(c => c.id === chunkId);
    if (!chunk) return;

    // Find best task to start
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    const isFinished = (t: Task) => t.completed || t.status === TaskStatus.PERFECT || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIP;
    
    // 1. Active task (already running)
    let targetTask = scheduledTasks.find(t => t.startTime && !t.isPaused && !isFinished(t));
    
    // If no active task, find the next one to start
    if (!targetTask) {
      // 2. First unstarted task
      targetTask = scheduledTasks.find(t => !t.startTime && !isFinished(t));
      
      // 3. First paused task
      if (!targetTask) {
        targetTask = scheduledTasks.find(t => t.startTime && t.isPaused && !isFinished(t));
      }
      
      // 4. First later task
      if (!targetTask) {
        targetTask = scheduledTasks.find(t => t.laterTimestamp && !isFinished(t));
      }
    }

    setSelectedChunkId(chunkId);
    setActiveTab('execution');

    // Only start if it's not already active (to avoid resetting startTime)
    if (userData.firstRoutineAutoStart && targetTask && (!targetTask.startTime || targetTask.isPaused || targetTask.laterTimestamp)) {
      const shouldReset = !!targetTask.laterTimestamp || !targetTask.isPaused;
      startTask(targetTask.id, shouldReset);
    }
  };

  const handleCheckIn = () => {
    if (!canCheckIn) return;

    let newStreak = userData.streak;
    const yesterday = new Date(effectiveDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    if (userData.lastCheckInDate === yesterdayStr) {
      newStreak += 1;
    } else if (userData.lastCheckInDate === null || userData.lastCheckInDate !== todayStr) {
      newStreak = 1;
    }

    const checkInTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      const next = {
        ...prev,
        streak: newStreak,
        lastCheckInDate: todayStr,
        dailyCheckIn: {
          ...(prev.dailyCheckIn || {}),
          [todayStr]: checkInTimeStr
        },
        history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
        routineChunks: prev.routineChunks
      };
      return syncHistory(next, todayStr);
    });

    // Show celebration
    setShowCheckInCelebration(true);
    setTimeout(() => setShowCheckInCelebration(false), 3000);

    // Special confetti for check-in
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff'],
      shapes: ['star'],
      scalar: 1.2
    });
  };

  const handleLateCheckIn = () => {
    const checkInTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => ({
      ...prev,
      lastCheckInDate: todayStr,
      dailyCheckIn: {
        ...(prev.dailyCheckIn || {}),
        [todayStr]: checkInTimeStr
      },
      history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
      streak: 0,
      routineChunks: prev.routineChunks
    }));
  };

  const skipTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          const foundTask = chunk.tasks.find(t => t.id === id);
          if (!foundTask) return chunk;

          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              return { 
                ...t, 
                status: TaskStatus.SKIP,
                endTime: nowStr, 
                duration: 0,
                accumulatedDuration: 0,
                startTime: undefined,
                isPaused: false
              };
            }
            return t;
          });
          const nextTask = updatedTasks.find(t => 
            !t.completed && 
            t.status !== TaskStatus.SKIP && 
            !t.laterTimestamp &&
            isTaskScheduledToday(t, chunk, effectiveDate, prev)
          );

          if (nextTask) {
            return {
              ...chunk,
              tasks: updatedTasks.map(t => (t.id === nextTask.id && prev.nextRoutineAutoStart) ? { ...t, startTime: nowStr, isPaused: false, laterTimestamp: undefined } : t)
            };
          }

          return {
            ...chunk,
            tasks: updatedTasks
          };
        })
      };
      return syncHistory(next, todayStr);
    });
  };

  const laterTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          const foundTask = chunk.tasks.find(t => t.id === id);
          if (!foundTask) return chunk;

          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              return { 
                ...t, 
                laterTimestamp: Date.now(), 
                completed: false, 
                isPaused: true,
                accumulatedDuration: undefined,
                startTime: undefined
              };
            }
            return t;
          });
          
          // Find next task to start
          const nextTask = updatedTasks.find(t => 
            !t.completed && 
            !t.laterTimestamp &&
            isTaskScheduledToday(t, chunk, effectiveDate, prev)
          );

          if (nextTask) {
            return {
              ...chunk,
              tasks: updatedTasks.map(t => (t.id === nextTask.id && prev.nextRoutineAutoStart) ? { ...t, startTime: nowStr, isPaused: false, laterTimestamp: undefined } : t)
            };
          }

          return {
            ...chunk,
            tasks: updatedTasks
          };
        })
      };
      return syncHistory(next, todayStr);
    });
  };

  const startTask = (taskId: string, resetTimer: boolean = true) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => {
      const autoStart = prev.nextRoutineAutoStart;
      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          const newTasks = chunk.tasks.map(task => {
            // If this is the target task, start it
            if (task.id === taskId) {
              return {
                ...task,
                completed: false,
                laterTimestamp: undefined,
                isPaused: !autoStart,
                startTime: autoStart ? nowStr : undefined,
                endTime: undefined,
                duration: undefined,
                accumulatedDuration: resetTimer ? 0 : (task.accumulatedDuration || 0)
              };
            }
            
            // If this is an active task (not the target one), pause it
            const isActive = task.startTime && !task.isPaused && !task.completed;
            if (isActive) {
              return {
                ...task,
                isPaused: true,
                accumulatedDuration: calculateTaskDuration(task, now),
                startTime: undefined
              };
            }
            
            return task;
          });
          
          return { ...chunk, tasks: newTasks };
        })
      };
      return syncHistory(next, todayStr);
    });
  };

  const globalActiveTask = useMemo(() => {
    for (const chunk of userData.routineChunks) {
      const active = chunk.tasks.find(t => t.startTime && !t.isPaused && !t.completed);
      if (active) return { task: active, chunkId: chunk.id };
    }
    return null;
  }, [userData.routineChunks]);

  const onRestart = (taskId: string, resetTimer: boolean = true) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setUserData(prev => {
      const autoStart = prev.nextRoutineAutoStart;
      // If there's a different active task, pause it
      let activeTaskId: string | null = null;
      for (const chunk of prev.routineChunks) {
        const active = chunk.tasks.find(t => t.startTime && !t.isPaused && !t.completed);
        if (active && active.id !== taskId) {
          activeTaskId = active.id;
          break;
        }
      }

      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          const newTasks = chunk.tasks.map(task => {
            // If this is the target task, start/resume it
            if (task.id === taskId) {
              return {
                ...task,
                completed: false,
                laterTimestamp: undefined,
                isPaused: !autoStart,
                startTime: autoStart ? nowStr : undefined,
                endTime: undefined,
                duration: undefined,
                accumulatedDuration: resetTimer ? 0 : (task.accumulatedDuration || 0)
              };
            }
            
            // If this was the active task, pause it
            if (task.id === activeTaskId) {
              return {
                ...task,
                isPaused: true,
                accumulatedDuration: calculateTaskDuration(task, now),
                startTime: undefined
              };
            }
            
            return task;
          });
          
          return { ...chunk, tasks: newTasks };
        })
      };
      return syncHistory(next, todayStr);
    });
  };

  const togglePauseTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => {
      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          // Determine if we are about to resume a task
          const isTargetResuming = chunk.tasks.some(t => t.id === id && (t.isPaused || !t.startTime));

          return {
            ...chunk,
            tasks: chunk.tasks.map(t => {
              if (t.id === id) {
                if (t.isPaused || !t.startTime || t.completed || t.status === TaskStatus.SKIP) {
                  // Resuming, Starting, or Reviving from SKIP: set new startTime and status
                  const autoStart = prev.nextRoutineAutoStart;
                  return { 
                    ...t, 
                    isPaused: !autoStart, 
                    startTime: autoStart ? nowStr : undefined,
                    completed: false,
                    laterTimestamp: undefined,
                    status: TaskStatus.IN_PROGRESS,
                    endTime: undefined,
                    duration: undefined,
                    closingNote: undefined,
                    satisfaction: undefined,
                    accumulatedDuration: t.duration ?? t.accumulatedDuration ?? 0
                  };
                } else {
                  // Pausing: calculate accumulated duration
                  return { 
                    ...t, 
                    isPaused: true, 
                    accumulatedDuration: calculateTaskDuration(t, now),
                    startTime: undefined 
                  };
                }
              }
              
              // If we are resuming the target task, pause all other active tasks
              // BUT if we are pausing the target task, do NOT touch other tasks
              if (isTargetResuming) {
                const isActive = t.startTime && !t.isPaused && !t.completed;
                if (isActive) {
                  return {
                    ...t,
                    isPaused: true,
                    accumulatedDuration: calculateTaskDuration(t, now),
                    startTime: undefined
                  };
                }
              }
              
              return t;
            }),
          };
        }),
      };
      return syncHistory(next, todayStr);
    });
  };

  const resetChunk = (chunkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '루틴 초기화',
      message: '모든 루틴의 실행여부와 타이머가 초기화됩니다.',
      onConfirm: () => {
        setUserData(prev => {
          const chunk = prev.routineChunks.find(c => c.id === chunkId);
          if (!chunk) return prev;

          // Calculate tasks completed TODAY
          let completedCount = 0;
          chunk.tasks.forEach(t => {
            if (t.completed) {
              completedCount += 1;
            }
          });

          const newChunks = prev.routineChunks.map(c => {
            if (c.id === chunkId) {
              return {
                ...c,
                tasks: c.tasks.map(t => ({
                  ...t,
                  completed: false,
                  laterTimestamp: undefined,
                  startTime: undefined,
                  endTime: undefined,
                  isPaused: false,
                  accumulatedDuration: 0,
                  duration: undefined,
                  status: TaskStatus.NOT_STARTED,
                  checklist: t.checklist?.map(item => ({ ...item, completed: false }))
                }))
              };
            }
            return c;
          });

          // Clear review from history for this day
          const newGroupHistory = (prev.routineGroupHistory || []).map(h => 
            (h.groupId === chunkId && h.date === todayStr) 
              ? { ...h, closingNote: undefined, satisfaction: undefined, firstTaskStartTime: null, completedAt: null, selectedPhrase: undefined } 
              : h
          );

          // Recalculate completion percentage for today
          const totalCompleted = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData) && (t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)).length, 0
          );
          const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData)).length, 0
          );
          const completionPercentage = totalScheduledTasksCount > 0 
            ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
            : 0;

          const next = {
            ...prev,
            routineChunks: newChunks,
            routineGroupHistory: newGroupHistory,
            dailyCompletionRate: {
              ...prev.dailyCompletionRate,
              [todayStr]: completionPercentage
            }
          };
          return syncHistory(next, todayStr);
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleTask = (id: string, closingData?: { note?: string, satisfaction?: number }) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      let foundTask: Task | null = null;
      let targetChunkId: string | null = null;

      for (const chunk of prev.routineChunks) {
        const t = chunk.tasks.find(task => task.id === id);
        if (t) {
          foundTask = t;
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!foundTask || !targetChunkId) return prev;

      const isBecomingCompleted = !foundTask.completed;
      
      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              const updated = { ...t, completed: isBecomingCompleted };
              if (isBecomingCompleted) {
                updated.endTime = nowStr;
                const totalSeconds = calculateTaskDuration(t, now);
                updated.duration = totalSeconds;
                updated.startTime = undefined; // 완료 시 startTime 제거하여 타이머 중단
                
                // Determine status (PERFECT or COMPLETED)
                const targetSeconds = (t.targetDuration || 0) * 60;
                if (t.taskType === TaskType.TIME_LIMITED) {
                  updated.status = totalSeconds <= targetSeconds ? TaskStatus.PERFECT : TaskStatus.COMPLETED;
                } else if (t.taskType === TaskType.TIME_ACCUMULATED) {
                  updated.status = totalSeconds >= targetSeconds ? TaskStatus.PERFECT : TaskStatus.COMPLETED;
                } else {
                  // TIME_INDEPENDENT
                  updated.status = TaskStatus.PERFECT;
                }

                if (closingData) {
                  updated.closingNote = closingData.note;
                  updated.satisfaction = closingData.satisfaction;
                }
              } else {
                updated.endTime = undefined;
                updated.duration = undefined;
                updated.status = TaskStatus.NOT_STARTED;
              }
              return updated;
            }
            return t;
          });

          // If we just completed a task, start the next one
          if (isBecomingCompleted) {
            const nextTask = updatedTasks.find(t => 
              !t.completed && 
              !t.laterTimestamp &&
              isTaskScheduledToday(t, chunk, effectiveDate, prev)
            );
            
            // Check if all tasks in this chunk are now completed
            const allCompleted = updatedTasks.every(t => t.completed);
            let newCompletionDates = chunk.completionDates || [];
            if (allCompleted && !newCompletionDates.includes(todayStr)) {
              newCompletionDates = [...newCompletionDates, todayStr];
            } else if (!allCompleted && newCompletionDates.includes(todayStr)) {
              newCompletionDates = newCompletionDates.filter(d => d !== todayStr);
            }

          if (nextTask) {
            return {
              ...chunk,
              completionDates: newCompletionDates,
              tasks: updatedTasks.map(t => (t.id === nextTask.id && prev.nextRoutineAutoStart) ? { ...t, startTime: nowStr, isPaused: false, laterTimestamp: undefined } : t)
            };
          }
            return {
              ...chunk,
              completionDates: newCompletionDates,
              tasks: updatedTasks
            };
          }

          return {
            ...chunk,
            tasks: updatedTasks
          };
        }
        return chunk;
      });

      if (isBecomingCompleted) {
        // Celebration animation
        setLastCompletedTaskName(foundTask.text);
        setTimeout(() => setLastCompletedTaskName(null), 2000);

        // Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
        });
      }

      const totalCompleted = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData) && t.completed).length, 0
      );
      const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData)).length, 0
      );
      const completionPercentage = totalScheduledTasksCount > 0 
        ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
        : 0;

      const next = {
        ...prev,
        routineChunks: newChunks,
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      };
      return syncHistory(next, todayStr);
    });
  };

  const addTask = (chunkId: string, scheduledDays: number[] = [0,1,2,3,4,5,6]) => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      targetDuration: newTaskDuration || 1,
      taskType: newTaskType,
      scheduledDays
    };
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => 
        chunk.id === chunkId 
          ? { ...chunk, tasks: [...chunk.tasks, newTask] }
          : chunk
      )
    }));
    setNewTaskText('');
    setNewTaskDuration(10);
    setNewTaskType(TaskType.TIME_LIMITED);
  };

  const deleteTask = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '루틴 삭제',
      message: '이 루틴을 삭제하시겠습니까?',
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineChunks: prev.routineChunks.map(chunk => ({
            ...chunk,
            tasks: chunk.tasks.filter(t => t.id !== id)
          }))
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateTask = (taskId: string, newText: string, newDuration: number, newTaskType?: TaskType, scheduledDays?: number[]) => {
    if (!newText.trim()) return;
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => ({
        ...chunk,
        tasks: chunk.tasks.map(t => 
          t.id === taskId 
            ? { ...t, text: newText, targetDuration: newDuration || 1, taskType: newTaskType || t.taskType, scheduledDays: scheduledDays || t.scheduledDays } 
            : t
        )
      }))
    }));
    setEditingTaskId(null);
  };

  const deleteReview = (groupId: string, date: string) => {
    setConfirmModal({
      isOpen: true,
      title: '후기 삭제',
      message: '이 날의 후기를 삭제하시겠습니까?',
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineGroupHistory: prev.routineGroupHistory?.map(h => 
            (h.groupId === groupId && h.date === date) 
              ? { ...h, closingNote: undefined, satisfaction: undefined } 
              : h
          )
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addChunk = (
    name: string, 
    purpose: string, 
    tasks: Task[], 
    scheduleType: 'days' = 'days', 
    scheduledDays: number[] = [0,1,2,3,4,5,6], 
    startTime?: string,
    isAlarmEnabled?: boolean,
    startType?: 'anytime' | 'situation' | 'time',
    situation?: string
  ) => {
    if (!name.trim()) return;
    const newChunk: RoutineChunk = {
      id: Date.now().toString(),
      name: name,
      purpose: purpose,
      completionDates: [],
      tasks: tasks,
      scheduleType,
      scheduledDays,
      startTime,
      isAlarmEnabled,
      startType,
      situation
    };
    setUserData(prev => ({
      ...prev,
      routineChunks: [...prev.routineChunks, newChunk]
    }));
    setNewChunkName('');
    setNewGroupPurpose('');
  };

  const deleteChunk = (id: string, onSuccess?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title: '그룹 삭제',
      message: '이 그룹과 포함된 모든 루틴이 삭제됩니다. 계속하시겠습니까?',
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineChunks: prev.routineChunks.filter(c => c.id !== id)
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (onSuccess) onSuccess();
      }
    });
  };

  const toggleInactive = (chunkId: string) => {
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        if (chunk.id === chunkId) {
          const inactiveDates = chunk.inactiveDates || [];
          const forcedActiveDates = chunk.forcedActiveDates || [];
          const day = effectiveDate.getDay();
          const isScheduledNormally = chunk.scheduledDays.includes(day);

          if (isScheduledNormally) {
            // Normally active: toggle exclusion from inactiveDates
            if (inactiveDates.includes(todayStr)) {
              return { ...chunk, inactiveDates: inactiveDates.filter(d => d !== todayStr) };
            } else {
              return { ...chunk, inactiveDates: [...inactiveDates, todayStr], forcedActiveDates: forcedActiveDates.filter(d => d !== todayStr) };
            }
          } else {
            // Normally inactive: toggle inclusion in forcedActiveDates
            if (forcedActiveDates.includes(todayStr)) {
              return { ...chunk, forcedActiveDates: forcedActiveDates.filter(d => d !== todayStr) };
            } else {
              return { ...chunk, forcedActiveDates: [...forcedActiveDates, todayStr], inactiveDates: inactiveDates.filter(d => d !== todayStr) };
            }
          }
        }
        return chunk;
      })
    }));
  };

  const getChunkStatus = (chunk: RoutineChunk) => {
    if (chunk.inactiveDates?.includes(todayStr)) return '불활성';
    if (!isChunkScheduledToday(chunk, effectiveDate, userData)) return '불활성';
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    if (scheduledTasks.length === 0) return '불활성';

    const allFinished = scheduledTasks.every(t => t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP);
    
    if (allFinished) {
      const hasPass = scheduledTasks.some(t => t.status === TaskStatus.SKIP);
      return hasPass ? '완료' : '완벽';
    }

    const totalCurrentDuration = scheduledTasks.reduce((acc, t) => acc + calculateTaskDuration(t, currentTime), 0);

    // Identify if any task is explicitly started/in-progress
    const anyStarted = scheduledTasks.some(t => 
      (t.startTime && !t.isPaused) || // Running
      (t.isPaused && (t.accumulatedDuration || 0) > 0) || // Paused (and has some time)
      (t.isPaused && !t.laterTimestamp && t.startTime === undefined && (t.accumulatedDuration || 0) >= 0 && scheduledTasks.indexOf(t) === 0 && chunk.tasks.some(task => task.id === t.id)) || // Special check for first task start
      (t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP) || // Already have finished tasks
      calculateTaskDuration(t, currentTime) >= 1 // More than 1 second accumulated
    );

    // If accumulatedDuration is set, it means it was started and paused.
    const anyAccumulated = scheduledTasks.some(t => (t.accumulatedDuration || 0) >= 1);

    if (anyStarted || anyAccumulated || totalCurrentDuration >= 1) return '실행중';

    return '미실행';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '불활성': return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-[10px]">불활성</span>;
      case '미실행': return <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-[10px]">미실행</span>;
      case '실행중': return <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-[10px]">실행중</span>;
      case '완료': return <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-[10px]">완료</span>;
      case '완벽': return <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-[10px]">완벽</span>;
      case '전체완료': return <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-[10px]">전체완료</span>;
      default: return null;
    }
  };

  const updateFullChunk = (id: string, updatedData: Partial<RoutineChunk>) => {
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(c => c.id === id ? { ...c, ...updatedData } : c)
    }));
  };

  const updateChunkInfo = (id: string, newName: string, newPurpose: string) => {
    if (!newName.trim()) return;
    setConfirmModal({
      isOpen: true,
      title: '그룹 정보 변경',
      message: `그룹 정보를 변경하시겠습니까?`,
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineChunks: prev.routineChunks.map(chunk => 
            chunk.id === id ? { ...chunk, name: newName, purpose: newPurpose } : chunk
          )
        }));
        setEditingChunkId(null);
        setEditingChunkName('');
        setEditingChunkPurpose('');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateChunkSchedule = (chunkId: string, type: 'days' | 'weekly' | 'monthly' | 'yearly', days: number[], freq: number) => {
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(c => 
        c.id === chunkId ? { ...c, scheduleType: type, scheduledDays: days, frequency: freq } : c
      )
    }));
  };

  const applyChunkTimes = (chunkId: string, s: string, d: number, e: string, alarm?: boolean) => {
    setUserData(prev => {
      const chunk = prev.routineChunks.find(c => c.id === chunkId);
      if (!chunk) return prev;

      let finalS = s;
      let finalD = d;
      let finalE = e;

      // Logic for automatic calculations
      if (s && d > 0 && !e) {
        // Start + Duration -> End
        finalE = minutesToTime(timeToMinutes(s) + d);
      } else if (!s && d > 0 && e) {
        // End - Duration -> Start
        finalS = minutesToTime(timeToMinutes(e) - d);
      } else if (s && !d && e) {
        // Start + End -> Duration
        const diff = timeToMinutes(e) - timeToMinutes(s);
        if (diff > 0) finalD = diff;
      } else if (s && d > 0 && e) {
        // All three set: Check for conflict
        const calculatedEnd = timeToMinutes(s) + d;
        const actualEnd = timeToMinutes(e);
        if (calculatedEnd !== actualEnd) {
          setConfirmModal({
            isOpen: true,
            title: '시간 설정 충돌',
            message: `설정하신 시작 시각(${s}), 소요 시간(${d}분), 완료 시각(${e})이 일치하지 않습니다. (계산된 완료 시각: ${minutesToTime(calculatedEnd)})`,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
          });
          return prev;
        }
      }

      return {
        ...prev,
        routineChunks: prev.routineChunks.map(c => 
          c.id === chunkId 
            ? { ...c, startTime: finalS, duration: finalD, endTime: finalE, isAlarmEnabled: alarm }
            : c
        )
      };
    });
  };

  const updateUserName = (name: string) => {
    const trimmed = name.trim();
    const finalName = trimmed === '' ? '나' : trimmed;
    setConfirmModal({
      isOpen: true,
      title: '사용자 이름 변경',
      message: `사용자 이름을 '${finalName}'으로 변경하시겠습니까?`,
      onConfirm: () => {
        setUserData(prev => ({ ...prev, userName: finalName }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateWakeUpTime = (time: string) => {
    setConfirmModal({
      isOpen: true,
      title: '기상 시각 변경',
      message: `기상 목표 시각을 ${time}으로 변경하시겠습니까?`,
      onConfirm: () => {
          setUserData(prev => {
            const hasCheckedInToday = prev.lastCheckInDate === todayStr;
            let newHistory = [...prev.history];
            let newLastCheckInDate = prev.lastCheckInDate;

            if (hasCheckedInToday) {
              // Remove today's history entry
              newHistory = newHistory.filter(h => h.date !== todayStr);
              newLastCheckInDate = null; // Allow re-check-in
            }

            return {
              ...prev,
              targetWakeUpTime: time,
              history: newHistory,
              lastCheckInDate: newLastCheckInDate,
            };
          });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateResetTime = (time: string) => {
    setConfirmModal({
      isOpen: true,
      title: '리셋 시각 변경',
      message: `하루 리셋 시각을 ${time}으로 변경하시겠습니까?`,
      onConfirm: () => {
        const h = parseInt(time.split(':')[0]);
        setUserData(prev => ({ ...prev, resetTime: time, dailyResetHour: h }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- 체크체크박스 (Check-Check Box) 로직 ---
  // 이 부분에서 체크체크박스의 클릭 가능 간격과 상태를 관리합니다.
  const checkCheckDiff = currentTime.getTime() - userData.lastCheckCheckTime;
  
  // 클릭 가능 시간 간격 설정 (기본 30분). phrases.json의 intervalMinutes 값을 변경하여 조절할 수 있습니다.
  // 예: 1초로 바꾸려면 phrases.json에서 intervalMinutes를 1/60으로 하거나, 아래 식을 직접 수정하세요.
  const checkCheckIntervalMs = phrases.checkCheckSettings.intervalMinutes * 60 * 1000;
  const isCheckCheckAvailable = checkCheckDiff >= checkCheckIntervalMs;

  const handleCheckCheckClick = () => {
    if (isCheckCheckAvailable) {
      setUserData(prev => {
        const currentCheckCount = (prev.dailyCheckCheckCounts?.[todayStr]) || 0;
        return {
          ...prev,
          dailyCheckCheckCounts: {
            ...prev.dailyCheckCheckCounts,
            [todayStr]: currentCheckCount + 1
          },
          lastCheckCheckTime: Date.now()
        };
      });
    }
  };

  // 체크체크박스 아이콘 결정 로직 (클릭 횟수에 따라 진화)
  const checkCheckIconId = useMemo(() => {
    const count = (userData.dailyCheckCheckCounts?.[todayStr]) || 0;
    const stages = phrases.checkCheckSettings.evolutionStages;
    let currentStage = stages[0];
    for (const stage of stages) {
      if (count >= stage.minClicks) {
        currentStage = stage;
      } else {
        break;
      }
    }
    return currentStage.iconId;
  }, [userData.dailyCheckCheckCounts, todayStr]);

  const challengeDays = useMemo(() => {
    if (!userData.startDate) return 1;
    return getDaysBetween(userData.startDate, todayStr);
  }, [userData.startDate, todayStr]);

  const successDays = userData.history.length;

  const renderSettingsContent = (mode: 'main' | 'modal') => {
    if (settingsSubView.type === 'main') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="space-y-[15px] overflow-y-auto pr-2 custom-scrollbar flex-grow">
            <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 whitespace-nowrap">사용자 이름</h3>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  defaultValue={userData.userName || '나'}
                  id="userNameInput"
                  placeholder="나"
                  className="flex-grow text-base font-black p-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('userNameInput') as HTMLInputElement;
                    if (input) updateUserName(input.value);
                  }}
                  className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                >
                  저장
                </button>
              </div>
            </div>

            <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 whitespace-nowrap">기상 목표 시각</h3>
              </div>
              <div className="flex gap-2">
                {/* [코멘트] 기상 목표 시각 입력창 및 버튼 크기 줄임 / text-base: 글자크기, p-2: 안쪽여백, px-4: 가로여백, rounded-xl: 모서리곡률 */}
                <input 
                  type="time" 
                  defaultValue={userData.targetWakeUpTime}
                  id="wakeUpTimeInput"
                  className="flex-grow text-base font-black p-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('wakeUpTimeInput') as HTMLInputElement;
                    if (input) updateWakeUpTime(input.value);
                  }}
                  className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                >
                  변경
                </button>
              </div>
            </div>

            <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm">
              <div className="flex flex-col gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 whitespace-nowrap">하루 리셋 시각</h3>
                </div>
                <p className="text-[12px] font-bold text-slate-400 leading-tight ml-10">이 시간이 되면 모든 루틴의 완료 상태가 초기화되며, 그 전까지의 기록은 전날로 합산됩니다.</p>
              </div>
              
              <div className="relative">
                {/* [코멘트] 하루 리셋 시각 선택 버튼 크기 줄임 / p-2.5: 안쪽여백, text-base: 글자크기, rounded-xl: 모서리곡률 */}
                <button 
                  onClick={() => setIsResetTimeDropdownOpen(!isResetTimeDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-base font-black text-slate-800">
                      오전 {parseInt(userData.resetTime.split(':')[0])}시
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isResetTimeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isResetTimeDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]"
                        onClick={() => setIsResetTimeDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[70] overflow-hidden"
                      >
                        <div className="p-1.5 space-y-0.5">
                          {[0, 1, 2, 3, 4].map((hour) => {
                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                            const isSelected = userData.resetTime === timeStr;
                            return (
                              /* [코멘트] 드롭다운 목록 아이템 크기 줄임 / p-2.5: 안쪽여백, text-sm: 글자크기 */
                              <button
                                key={hour}
                                onClick={() => {
                                  updateResetTime(timeStr);
                                  setIsResetTimeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <span className="font-black text-sm">오전 {hour}시</span>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-[20px] bg-white rounded-[15px] space-y-[20px] shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 whitespace-nowrap">타이머 자동 시작</h3>
              </div>
              
              <div className="space-y-[15px] pl-[10px] border-l-2 border-slate-100 ml-[15px]">
                {/* 첫 루틴 자동 시작 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-black text-slate-700">첫 루틴 자동 시작</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-tight">루틴 그룹을 시작함과 동시에 타이머가 자동으로 돌아갑니다.</p>
                  </div>
                  <button 
                    onClick={() => setUserData(prev => ({ ...prev, firstRoutineAutoStart: !prev.firstRoutineAutoStart }))}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.firstRoutineAutoStart ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.firstRoutineAutoStart ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* 다음 루틴 자동 시작 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-black text-slate-700">다음 루틴 자동 시작</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-tight">루틴을 완료하면 다음 루틴이 자동으로 시작됩니다.</p>
                  </div>
                  <button 
                    onClick={() => setUserData(prev => ({ ...prev, nextRoutineAutoStart: !prev.nextRoutineAutoStart }))}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.nextRoutineAutoStart ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.nextRoutineAutoStart ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-black text-slate-800 whitespace-nowrap">루틴그룹 순서 자동전환</h3>
                    <p className="text-[12px] font-bold text-slate-400 leading-tight">완료된 그룹은 자동으로 목록 하단으로 이동합니다.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUserData(prev => ({ ...prev, autoReorderGroups: !prev.autoReorderGroups }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${userData.autoReorderGroups ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.autoReorderGroups ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-[15px] bg-white rounded-[15px] space-y-[10px] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">루틴 그룹 관리</h3>
              </div>
              
              <div className="space-y-1">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleChunkDragEnd}
                >
                  <SortableContext 
                    items={userData.routineChunks.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {userData.routineChunks.map((chunk) => (
                      <SortableChunkItem 
                        key={chunk.id}
                        chunk={chunk}
                        onEnterDetail={(id) => setSettingsSubView({ type: 'detail', chunkId: id })}
                        onUpdateInfo={updateChunkInfo}
                        onDelete={deleteChunk}
                        editingChunkId={editingChunkId}
                        setEditingChunkId={setEditingChunkId}
                        editingChunkName={editingChunkName}
                        setEditingChunkName={setEditingChunkName}
                        editingChunkPurpose={editingChunkPurpose}
                        setEditingChunkPurpose={setEditingChunkPurpose}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
          
          {mode === 'modal' && (
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-[10px] hover:bg-slate-800 transition-colors flex-shrink-0"
            >
              저장하고 닫기
            </button>
          )}
        </div>
      );
    }

    const chunk = userData.routineChunks.find(c => c.id === settingsSubView.chunkId);
    if (!chunk) return null;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <RoutineGroupFormView 
            addChunk={addChunk}
            updateChunk={updateFullChunk}
            initialChunk={chunk}
            setActiveTab={setActiveTab}
            setSettingsSubView={setSettingsSubView}
            setIsSettingsOpen={setIsSettingsOpen}
            userData={userData}
            mode="edit"
          />
        </div>
      </div>
    );
  };

  const formattedDate = useMemo(() => {
    return effectiveDate.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    });
  }, [effectiveDate]);

  return (
    <div className="min-h-screen bg-[#F7FEE7] text-slate-900 font-sans pb-20">
      {/* Celebration Animation Overlay */}
      <AnimatePresence>
        {lastCompletedTaskName && (
          <motion.div
            key="celebration-overlay"
            initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
            animate={{ 
              scale: [0.5, 1, 4], 
              opacity: [0, 1, 0],
              filter: ["blur(10px)", "blur(0px)", "blur(20px)"]
            }}
            transition={{ 
              duration: 1.5, 
              times: [0, 0.15, 1],
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
          >
            <div className="relative">
              <motion.span 
                className="text-5xl md:text-8xl font-black text-indigo-600 drop-shadow-[0_0_40px_rgba(79,70,229,0.6)] text-center px-6 block"
                style={{ letterSpacing: '-0.05em' }}
              >
                {lastCompletedTaskName}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Celebration Overlay */}
      <AnimatePresence>
        {showCheckInCelebration && (
          <motion.div
            key="checkin-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999] bg-indigo-600/10 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [20, -10, 0]
              }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full"
                />
                <Sun className="w-32 h-32 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] relative z-10" />
              </div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-black text-indigo-700 mt-8 drop-shadow-sm"
              >
                GOOD MORNING!
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-bold text-indigo-500 mt-2"
              >
                체크인 성공! 기분 좋은 시작입니다.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 홈아이콘줄 (Sticky Header Box) */}
      <div className="sticky top-0 z-40 bg-[#F7FEE7]/80 backdrop-blur-md pt-2.5 pb-0">
        <div className="max-w-2xl mx-auto px-4">
          <nav className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveTab('home');
                setSelectedChunkId(null);
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${activeTab === 'home' && !selectedChunkId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'}`}
            >
              <Home className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubView({ type: 'main' });
                setSelectedChunkId(null);
                setIsSettingsOpen(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('add');
                setSelectedChunkId(null);
                setIsSettingsOpen(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
                activeTab === 'add'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('stats');
                setSelectedChunkId(null);
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'}`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* 체크체크박스 (Check-Check Box): 클릭하여 성장시키는 아이콘 */}
            <button 
              onClick={handleCheckCheckClick}
              className={`transition-all w-16 h-10 flex items-center px-1.5 rounded-[10px] border shadow-sm relative overflow-hidden ${
                isCheckCheckAvailable 
                  ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                  : 'bg-white border-slate-100 cursor-default'
              }`}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-9">
                <CheckCheckIcon iconId={checkCheckIconId} size={32} />
              </div>
              <div className="flex-grow flex flex-col items-center justify-center ml-0.5 relative">
                <span className="text-[10px] font-black text-slate-500 leading-none">
                  {(userData.dailyCheckCheckCounts?.[todayStr]) || 0}
                </span>
                {isCheckCheckAvailable && (
                  <div className="mt-1">
                    <span className="flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-[10px] pb-[100px] space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-[10px]"
            >
              <HeaderBox 
                userData={userData}
                todayStr={todayStr}
                formattedDate={formattedDate}
                challengeDays={challengeDays}
                successDays={successDays}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
              />
              <HomeView 
                userData={userData}
                setUserData={setUserData}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                todayStr={todayStr}
                handleCheckIn={handleCheckIn}
                handleLateCheckIn={handleLateCheckIn}
                setSelectedChunkId={setSelectedChunkId}
                setActiveTab={setActiveTab}
                startTask={startTask}
                toggleInactive={toggleInactive}
                getChunkStatus={getChunkStatus}
                getStatusBadge={getStatusBadge}
                globalActiveTask={globalActiveTask}
                setConfirmModal={setConfirmModal}
                onEnterExecution={handleEnterExecution}
              />
            </motion.div>
          ) : activeTab === 'stats' ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <StatsView 
                userData={userData} 
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                deleteReview={deleteReview}
              />
            </motion.div>
          ) : activeTab === 'execution' ? (
            <motion.div
              key="execution"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <ExecutionView 
                userData={userData}
                setUserData={setUserData}
                selectedChunkId={selectedChunkId}
                setActiveTab={setActiveTab}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                todayStr={todayStr}
                toggleTask={toggleTask}
                togglePauseTask={togglePauseTask}
                laterTask={laterTask}
                skipTask={skipTask}
                startTask={startTask}
                onRestart={onRestart}
                resetChunk={resetChunk}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
                setSelectedChunkId={setSelectedChunkId}
                handleCheckCheckClick={handleCheckCheckClick}
                isCheckCheckAvailable={isCheckCheckAvailable}
                setConfirmModal={setConfirmModal}
              />
            </motion.div>
          ) : activeTab === 'add' ? (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
            <RoutineGroupFormView 
                addChunk={addChunk}
                setActiveTab={setActiveTab}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
                userData={userData}
                mode="add"
              />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-0">
                {renderSettingsContent('main')}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Floating Active Task Popup */}
      {globalActiveTask && activeTab !== 'execution' && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => {
            setSelectedChunkId(globalActiveTask.chunkId);
            setActiveTab('execution');
          }}
          className="fixed bottom-8 left-4 right-4 bg-indigo-600 text-white p-4 rounded-[10px] shadow-2xl z-[60] flex items-center justify-between cursor-pointer border border-white/20 backdrop-blur-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              >
                <Timer className="w-6 h-6" />
              </motion.div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                {userData.routineChunks.find(c => c.id === globalActiveTask.chunkId)?.name}
              </span>
              <span className="text-sm font-black truncate max-w-[150px]">{globalActiveTask.task.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xl font-black tabular-nums">
              {(() => {
                const total = calculateTaskDuration(globalActiveTask.task, currentTime);
                const h = Math.floor(total / 3600);
                const m = Math.floor((total % 3600) / 60);
                const s = total % 60;
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              })()}
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-50 rounded-t-[20px] p-6 z-50 shadow-2xl max-w-2xl mx-auto overflow-hidden flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 flex-shrink-0" />
              {renderSettingsContent('modal')}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[10px] p-6 z-[70] shadow-2xl w-[90%] max-w-sm"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    {confirmModal.cancelLabel || '취소'}
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-3 rounded-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                  >
                    {confirmModal.confirmLabel || '확인'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Alarm Modal */}
      <AnimatePresence>
        {activeAlarmChunk && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-6 z-[101] pointer-events-none"
            >
              <div className="bg-white w-full max-w-sm rounded-[10px] p-8 shadow-2xl pointer-events-auto text-center space-y-6 border border-indigo-100">
                <div className="relative mx-auto w-24 h-24">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="w-full h-full bg-indigo-50 rounded-full flex items-center justify-center"
                  >
                    <Clock className="w-12 h-12 text-indigo-600" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-indigo-400 rounded-full -z-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">알람이 울립니다!</h3>
                  <p className="text-slate-500 font-bold">
                    <span className="text-indigo-600">[{activeAlarmChunk.name}]</span> 시작할 시간이에요.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setSelectedChunkId(activeAlarmChunk.id);
                      setActiveTab('execution');
                      setActiveAlarmChunk(null);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-[10px] font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> 루틴 시작하기
                  </button>
                  <button 
                    onClick={() => setActiveAlarmChunk(null)}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-[10px] font-black hover:bg-slate-200 transition-all"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 앱 업데이트 알림 */}
      <AnimatePresence>
        {swUpdateRegistration && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[1001]"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-[20px] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <p className="text-sm font-black">새로운 버전이 있습니다!</p>
                  <p className="text-[10px] text-slate-400">데이터 손실 없이 지금 업데이트하세요.</p>
                </div>
              </div>
              <button
                onClick={handleUpdateApp}
                className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-[12px] text-xs font-black transition-all active:scale-95 whitespace-nowrap"
              >
                지금 새로고침
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
