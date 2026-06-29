import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home,
  Settings,
  PlusCircle,
  BarChart3,
  Volume2,
  VolumeX,
  X,
  Clock,
  Bell,
  BellOff,
  BrickWall,
  Hourglass,
  CheckCircle2,
  Check,
  CheckCheck,
  Circle,
  Play,
  Pause,
  ArrowRightCircle,
  CircleMinus,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// Internal Types & Constants
import { 
  TaskType, 
  Task, 
  TaskStatus,
  ExecutionViewProps
} from '../../types';
import phrases from '../../phrases.json';
import { 
  isTaskScheduledToday, 
  formatDurationPrecise,
  getJosa,
  calculateTaskDuration
} from '../../utils';
import { CheckCheckIcon } from '../CheckCheckIcon';
import { useCheckCheckBox } from '../../hooks/useCheckCheckBox';
import { voiceService } from '../../services/voiceService';
import { soundService } from '../../services/soundService';
import { RoutineTitleLine } from '../routine/RoutineTitleLine';
import { MonthlyHeatmap } from '../routine/MonthlyHeatmap';
import { RoutineTitle } from '../routine/RoutineTitle';

// --- Localized Text Object ---
const LOCALIZED_TEXT = {
  activateRoutineTitle: "루틴 활성화",
  activateRoutineMessage: "오늘은 쉬는 요일입니다. 활성화하시겠습니까?",
  restartConfirmTitle: "다시 시작하시겠습니까?",
  restartConfirmMessage: "타이머가 0부터 다시 시작됩니다. 다시 시작하시겠습니까?",
  restartConfirmBtn: "다시하기",
  cancelBtn: "취소",
  fullyCompleted: "전체완료",
  statusPerfect: "완벽",
  statusCompleted: "완료",
  statusSkip: "스킵",
  completionTitleSuffix: "완성!",
  completionTemplateTitle: "축하합니다! 문구를 선택해주세요.",
  purposeDefault: "목표",
  userNameDefault: "나",
  anytime: "언제든",
  totalLabel: "총 ",
  minutesUnit: "분",
  hourUnit: "시",
  currentRoutineBadge: "현재루틴",
  detailStatsTooltip: "루틴 상세 통계 보기",
  checklistTitle: "체크리스트",
  clearAllChecksBtn: "체크 전부 지우기",
  resetRoutinesBtn: "루틴 초기화하기",
  executionCompleted: "실행 완료",
  routineLabelPrefix: "루틴 ",
  dayNames: ['월', '화', '수', '목', '금', '토', '일']
};

const DoubleCheckCircle = ({ className }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <Circle className="w-full h-full" />
    <CheckCheck className="absolute w-[60%] h-[60%]" strokeWidth={3} />
  </div>
);

export const ExecutionView: React.FC<ExecutionViewProps> = ({
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
  startTask: _startTask,
  onRestart,
  resetChunk,
  setSettingsSubView,
  setIsSettingsOpen,
  setSelectedChunkId,
  handleCheckCheckClick: _ignoredHandleCheckCheckClick,
  isCheckCheckAvailable: _ignoredIsCheckCheckAvailable,
  setConfirmModal,
  setStatsKey,
  setSelectedTaskForStats,
  onGroupCompleted
}) => {
  // --- [Hook declarations FIRST to comply with React rules] ---
  const {
    checkCheckIconId,
    isCheckCheckAvailable,
    handleCheckCheckClick
  } = useCheckCheckBox(userData, setUserData, todayStr);

  const [isCompleted, setIsCompleted] = useState(false);
  const [animationStage, setAnimationStage] = useState<'none' | 'whiteout' | 'rising' | 'title' | 'fireworks' | 'final'>('none');
  const [visibleTasksCount, setVisibleTasksCount] = useState(0);
  const [shakingTaskId, setShakingTaskId] = useState<string | null>(null);

  const [isPressing, setIsPressing] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const rollbackTriggeredRef = useRef<boolean>(false);
  const isTouchActiveRef = useRef<boolean>(false);

  const activeTaskRef = useRef<HTMLDivElement>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rollbackTimer = (taskId: string) => {
    setUserData(prev => {
      return {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          if (!chunk.tasks.some(t => t.id === taskId)) return chunk;
          return {
            ...chunk,
            tasks: chunk.tasks.map(t => {
              if (t.id === taskId) {
                return {
                  ...t,
                  startTime: undefined,
                  accumulatedDuration: 0,
                  isPaused: false,
                  status: TaskStatus.NOT_STARTED
                };
              }
              return t;
            })
          };
        })
      };
    });
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    if (!activeTask) return;

    setIsPressing(true);
    rollbackTriggeredRef.current = false;
    pressStartTimeRef.current = Date.now();

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    longPressTimeoutRef.current = setTimeout(() => {
      rollbackTimer(activeTask.id);
      rollbackTriggeredRef.current = true;
      setIsPressing(false);
      
      if (navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch (err) {
          // ignore potential iframe permission blocks
        }
      }
    }, 1800);
  };

  const handlePressEnd = (_e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    setIsPressing(false);

    if (rollbackTriggeredRef.current) {
      rollbackTriggeredRef.current = false;
      return;
    }

    if (!activeTask) return;

    const pressDuration = Date.now() - pressStartTimeRef.current;
    if (pressDuration < 400) {
      togglePauseTask(activeTask.id, true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    isTouchActiveRef.current = true;
    handlePressStart(e);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    handlePressEnd(e);
  };

  const onTouchCancel = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsPressing(false);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) return;
    handlePressStart(e);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) {
      isTouchActiveRef.current = false;
      return;
    }
    handlePressEnd(e);
  };

  const onMouseLeave = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsPressing(false);
  };

  const isAlreadyFinalized = useMemo(() => {
    if (!selectedChunkId) return false;
    const history = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === selectedChunkId);
    return !!history?.selectedPhrase;
  }, [userData.routineGroupHistory, todayStr, selectedChunkId]);

  // --- [Data derivation] ---
  const chunk = userData.routineChunks.find(c => c.id === selectedChunkId);
  const tasks = chunk ? chunk.tasks : [];
  const scheduledTasks = tasks.filter(t => chunk ? isTaskScheduledToday(t, chunk, effectiveDate, userData) : false);

  const handleActivateTaskInternal = (taskId: string) => {
    if (!chunk) return;
    setConfirmModal({
      isOpen: true,
      title: LOCALIZED_TEXT.activateRoutineTitle,
      message: LOCALIZED_TEXT.activateRoutineMessage,
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          forcedActiveTasks: {
            ...prev.forcedActiveTasks,
            [todayStr]: {
              ...(prev.forcedActiveTasks?.[todayStr] || {}),
              [taskId]: true
            }
          },
          routineChunks: prev.routineChunks.map(c => {
            if (c.id === chunk.id) {
              return {
                ...c,
                activeTaskId: taskId
              };
            }
            return c;
          })
        }));
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestartTaskInternal = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: LOCALIZED_TEXT.restartConfirmTitle,
      message: LOCALIZED_TEXT.restartConfirmMessage,
      confirmLabel: LOCALIZED_TEXT.restartConfirmBtn,
      cancelLabel: LOCALIZED_TEXT.cancelBtn,
      onConfirm: () => {
        onRestart(taskId);
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // 20.3. 현재 루틴(Current Task) 선정 우선순위 로직
  // 0순위: 기록된 activeTaskId가 있고, 오늘 수행 대상이며 완료되지 않은 경우
  let activeTask = chunk?.activeTaskId ? scheduledTasks.find(t => t.id === chunk.activeTaskId && !t.completed && t.status !== TaskStatus.SKIP) : undefined;
  
  // 1순위: '현재 루틴'으로 마킹되어 있거나 타이머가 돌아가고 있는 루틴
  if (!activeTask) {
    activeTask = scheduledTasks.find(t => t.status === TaskStatus.IN_PROGRESS && !t.completed);
  }
  
  // 2순위: 타이머가 돌아가고 있다면 (비정상 상태 방어)
  if (!activeTask) {
    activeTask = scheduledTasks.find(t => t.startTime && !t.isPaused && !t.completed);
  }
  
  // 3순위: 일시정지 상태거나 기록이 있는 태스크 (상태 소실 방어)
  if (!activeTask) {
    activeTask = scheduledTasks.find(t => (t.isPaused || (t.accumulatedDuration || 0) > 0) && !t.completed);
  }
  
  // 20.2. 트리거 루틴 (미실행 그룹인 경우 첫 번째 루틴을 현재 루틴으로 자동 선정)
  // '미실행' 판단: 모든 루틴이 시작되지 않았고, 완료/스킵/나중에 된 것이 없음
  const isInitiallyUnstarted = scheduledTasks.every(t => 
    (!t.status || t.status === TaskStatus.NOT_STARTED) && 
    !t.completed && 
    !t.laterTimestamp && 
    (t.accumulatedDuration || 0) === 0 &&
    !t.startTime
  );

  if (!activeTask && isInitiallyUnstarted && scheduledTasks.length > 0 && !isAlreadyFinalized) {
    activeTask = scheduledTasks[0];
  }

  const allTasksDone = scheduledTasks.length > 0 && scheduledTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
  const wasDoneOnMount = useRef(allTasksDone);

  useEffect(() => {
    if (activeTask?.id) {
      // Short delay to allow animations/layout to stabilize
      const timer = setTimeout(() => {
        if (activeTaskRef.current && typeof activeTaskRef.current.getBoundingClientRect === 'function') {
          const headerHeight = 64; // Menu icon row height + padding
          const rect = activeTaskRef.current.getBoundingClientRect();
          if (rect) {
            const elementPosition = rect.top + window.pageYOffset;
            window.scrollTo({
              top: elementPosition - headerHeight,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTask?.id]);

  useEffect(() => {
    if (!allTasksDone) {
      wasDoneOnMount.current = false;
    }
  }, [allTasksDone]);

  useEffect(() => {
    if (allTasksDone && !wasDoneOnMount.current && !isCompleted && !isAlreadyFinalized) {
      // Start completion sequence immediately to lock the state
      setIsCompleted(true);
    }
  }, [allTasksDone, isCompleted, isAlreadyFinalized]);

  useEffect(() => {
    if (isCompleted && animationStage === 'none' && !isAlreadyFinalized) {
      soundService.unlock();
      const groupCompleteFile = userData.soundSettings?.routineGroupComplete?.file || '/sounds/dragon-studio-fireworks-02-419019.mp3';
      soundService.refresh(groupCompleteFile);
      const timer = setTimeout(() => {
        setAnimationStage('whiteout');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, animationStage, isAlreadyFinalized, userData.soundSettings?.routineGroupComplete]);

  useEffect(() => {
    if (animationStage === 'whiteout') {
      const timer = setTimeout(() => {
        setAnimationStage('rising');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

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
      const groupCompleteConfig = userData.soundSettings?.routineGroupComplete;
      const groupCompleteEnabled = groupCompleteConfig ? groupCompleteConfig.enabled : true;
      const groupCompleteFile = groupCompleteConfig?.file || '/sounds/dragon-studio-fireworks-02-419019.mp3';
      soundService.play(groupCompleteFile, groupCompleteEnabled);
      const timer = setTimeout(() => {
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
          if (typeof confetti === 'function') {
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.1 } });
            
            if (timeLeft < duration * 0.5) {
              confetti({ ...defaults, particleCount: particleCount * 0.5, origin: { x: randomInRange(0.2, 0.8), y: Math.random() } });
            }
          }
        }, 150);

        return () => clearInterval(interval);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

  useEffect(() => {
    if (animationStage === 'rising' && scrollBottomRef.current) {
      // [수정] 앵커 포인트를 사용하여 스크롤을 끝으로 부드럽게 유도 (setTimeout 소폭 증가로 안정성 확보)
      const timer = setTimeout(() => {
        if (scrollBottomRef.current) {
          scrollBottomRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visibleTasksCount, animationStage]);

  useEffect(() => {
    if ((animationStage === 'title' || animationStage === 'final') && scrollBottomRef.current) {
      const timer = setTimeout(() => {
        if (scrollBottomRef.current) {
          scrollBottomRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, animationStage === 'final' ? 400 : 100);
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
    
    /* 
       [디자인 수정 구역 0: 타이머 채우기(Progress) 색상 로직]
       - 루틴 타입에 따라 타이머 박스 내부가 채워지는 색상을 결정합니다.
       - bg-sky-400, bg-indigo-500, bg-rose-400 등 Tailwind 색상 클래스를 변경하세요.
    */
    let color = "bg-sky-400";
    let isFinished = elapsed >= target;

    if (task.taskType === TaskType.TIME_ACCUMULATED) {
      color = isFinished ? "bg-sky-400" : "bg-violet-400";
    } else if (task.taskType === TaskType.TIME_LIMITED) {
      color = isFinished ? "bg-violet-400" : "bg-sky-400";
    } else {
      // TIME_INDEPENDENT
      color = isFinished ? "bg-sky-400" : "bg-sky-400";
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
    const completedChunkId = selectedChunkId;

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
            completionStatus: LOCALIZED_TEXT.fullyCompleted,
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

    if (completedChunkId && onGroupCompleted) {
      onGroupCompleted(completedChunkId);
    }
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
                    setStatsKey?.(prev => prev + 1);
                  }}
                  className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm`}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>

                {/* 음성안내아이콘 */}
                <button 
                  onClick={() => {
                    soundService.unlock();
                    voiceService.unlock();
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setUserData(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }));
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all bg-white border shadow-sm hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 ${
                    userData.isVoiceEnabled 
                      ? 'border-blue-400 text-blue-500 shadow-blue-50' 
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  {userData.isVoiceEnabled ? <Volume2 className="w-5 h-5" strokeWidth={2.5} /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* 체크체크박스 (Check-Check Box): 클릭하여 성장시키는 아이콘 */}
                <motion.button 
                  onClick={handleCheckCheckClick}
                  whileTap={isCheckCheckAvailable ? "tap" : undefined}
                  variants={{
                    tap: { scale: 0.94 }
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`transition-all w-16 h-10 flex items-center px-1.5 rounded-[10px] border shadow-sm relative overflow-hidden always-light ${
                    isCheckCheckAvailable 
                      ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                      : 'bg-white border-slate-100 cursor-default'
                   }`}
                >
                  <motion.div 
                    variants={{
                      tap: { scaleX: 1.25, scaleY: 0.75 }
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="flex-shrink-0 flex items-center justify-center w-9 origin-bottom"
                  >
                    <CheckCheckIcon iconId={checkCheckIconId} size={32} />
                  </motion.div>
                  <div className="flex-grow flex flex-col items-center justify-center ml-0.5 relative">
                    <span className="text-[10px] font-black text-slate-500 leading-none" title="누를 수 있는 횟수">
                      {(userData.availableCheckCheckCount !== undefined ? userData.availableCheckCheckCount : 5)}
                    </span>
                    {isCheckCheckAvailable && (
                      <div className="mt-1">
                        <span className="flex h-1.5 w-1.5">
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              </nav>
            </div>
          </div>
        )}

        <div 
          ref={scrollContainerRef} 
          className="flex-grow overflow-y-scroll pb-20"
          style={{ scrollbarGutter: 'stable' }}
        >
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
                    scale: shakingTaskId === task.id ? [1, 1.05, 1] : 1
                  }}
                  transition={{ 
                    y: { type: "tween", ease: "easeOut", duration: 0.8 },
                    scale: { duration: 0.3 }
                  }}
                  className={`p-4 rounded-[15px] border-2 flex items-center justify-between bg-white shadow-sm ${shakingTaskId === task.id ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-100'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400">{LOCALIZED_TEXT.routineLabelPrefix}{idx + 1}</span>
                    <span className="text-base font-black text-slate-900">{task.text}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      task.status === TaskStatus.PERFECT ? 'bg-indigo-100 text-indigo-600' :
                      task.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {task.status === TaskStatus.PERFECT ? LOCALIZED_TEXT.statusPerfect : task.status === TaskStatus.COMPLETED ? LOCALIZED_TEXT.statusCompleted : LOCALIZED_TEXT.statusSkip}
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
                {LOCALIZED_TEXT.completionTitleSuffix}
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
              <h3 className="text-center text-lg font-black text-slate-700 mb-6">{LOCALIZED_TEXT.completionTemplateTitle}</h3>
              
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
                  const totalTargetDurationStr = `${totalTargetMinutes}${LOCALIZED_TEXT.minutesUnit}`;

                  // Resolve particles but keep the placeholder for RoutineTitle to style
                  const resolveParticles = (msg: string, tag: string, value: string) => {
                    if (!msg) return "";
                    const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는|으로/로|이죠/죠|야/이야|이야/야|다/이다|이다/다|이|가|을|를|은|는|으로|로|이죠|죠|야|이야|다|이다)`, 'g');
                    return msg.replace(regex, (_, p1) => {
                      return `{{${tag}}}` + getJosa(value, p1 as any);
                    });
                  };

                  storedPhrase = resolveParticles(storedPhrase, 'title', chunk.name);
                  storedPhrase = resolveParticles(storedPhrase, 'purpose', chunk.purpose || LOCALIZED_TEXT.purposeDefault);
                  storedPhrase = resolveParticles(storedPhrase, 'userName', userData.userName || LOCALIZED_TEXT.userNameDefault);

                  // We preserve placeholders for startTime, endTime, userName, duration
                  // so that RoutineTitle can style them based on phrases.json settings.
                  
                  // For the UI display in buttons, replace everything
                  let displayPhrase = storedPhrase || '';
                  if (displayPhrase) {
                    displayPhrase = displayPhrase.replace(/\{\{userName\}\}/g, userData.userName || LOCALIZED_TEXT.userNameDefault);
                    displayPhrase = displayPhrase.replace(/\{\{startTime\}\}/g, startTimeStr);
                    displayPhrase = displayPhrase.replace(/\{\{endTime\}\}/g, endTimeStr);
                    displayPhrase = displayPhrase.replace(/\{\{duration\}\}/g, durationStr);
                    displayPhrase = displayPhrase.replace(/\{\{totalTargetDuration\}\}/g, totalTargetDurationStr);
                    displayPhrase = displayPhrase.replace(/\{\{title\}\}/g, chunk.name);
                    displayPhrase = displayPhrase.replace(/\{\{purpose\}\}/g, chunk.purpose || LOCALIZED_TEXT.purposeDefault);
                  }

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
          
          {/* [수정] 스크롤 고정을 위한 앵커 포인트를 최하단으로 이동 */}
          <div ref={scrollBottomRef} className="h-px w-full" />
        </div>
      </div>
    </div>
    );
  }

  if (!chunk) return null;

  return (
    <div className="space-y-4 relative">
      {/* 루틴그룹박스 (Routine Group Box) */}
      <section className="bg-gradient-to-br from-indigo-500 to-violet-700 rounded-[10px] shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12" />
        
        {/* 월간 캘린더 히트맵 */}
        <div className="relative z-20 px-2">
          <MonthlyHeatmap 
            chunk={chunk}
            userData={userData}
            currentTime={currentTime}
            effectiveDate={effectiveDate}
          />
        </div>

        <div className="p-4 relative z-10">
          <div className="space-y-4">
            {/* 첫번째줄: {목적}이 되기 위한 {제목} <아이콘> */}
            <div className="mb-4">
              <h2 className="text-lg font-black text-white tracking-tight leading-relaxed">
                {/* [디자인 수정 구역 1: 제목 텍스트]
                    - 글자 크기: text-lg, text-xl 등
                    - 글자 색상: text-white, text-indigo-100 등
                */}
                {(() => {
                  const entry = userData.routineGroupHistory?.find(h => h.date === todayStr && h.groupId === chunk.id);
                  return (
                    <RoutineTitle 
                      chunk={chunk} 
                      isExecutionTitle={true}
                      userName={userData.userName}
                      startTime={entry?.firstTaskStartTime}
                      endTime={entry?.completedAt}
                      userData={userData}
                      todayStr={todayStr}
                    />
                  );
                })()}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsSubView({ type: 'detail', chunkId: chunk.id });
                    setIsSettingsOpen(true);
                  }}
                  className="inline-flex items-center justify-center p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-[10px] transition-all ml-1 align-middle"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </h2>
            </div>

            {/* 두번째줄: 실행요일표시 + 시작상황/시각 + 오늘 목표시간 합산 */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1">
              {/* [디자인 수정 구역 2: 요일 표시 (동그라미)]
                  - 동그라미 크기: w-7 h-7
                  - 활성 배경색: bg-white/20, 테두리: border-white/40
                  - 비활성 배경색: bg-black/10, 테두리: border-white/5
                  - 글자 크기: text-xs
              */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((dayNum, i) => {
                  const dayNames = LOCALIZED_TEXT.dayNames;
                  const isScheduled = chunk.scheduledDays.includes(dayNum);
                  return (
                    <div 
                      key={dayNum}
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all ${
                        isScheduled 
                          ? 'bg-white/20 border-white/40 text-white shadow-sm' 
                          : 'bg-black/10 border-white/5 text-white/20'
                      }`}
                    >
                      <span className="text-[11px] font-black z-10">{dayNames[i]}</span>
                      {!isScheduled && (
                        <X className="absolute w-[60%] h-[60%] text-white/5" strokeWidth={4} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* [디자인 수정 구역 3: 시작 정보 및 합산 시간]
                  - 글자 크기: text-xs
                  - 배경색: bg-white/10
                  - 테두리: border-white/10
              */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-[10px] border border-white/10 text-white/90 text-xs font-black shadow-inner">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {chunk.startType === 'time' && chunk.startTime ? chunk.startTime.replace(new RegExp(LOCALIZED_TEXT.hourUnit, 'g'), '') : (chunk.situation || LOCALIZED_TEXT.anytime)}
                  </span>
                  {chunk.startType === 'time' && (
                    chunk.isAlarmEnabled ? (
                      <Bell className="w-3.5 h-3.5 ml-1 opacity-70" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 ml-1 opacity-40" />
                    )
                  )}
                </div>
                <div className="flex items-center px-3 py-1.5 bg-white/10 rounded-[10px] border border-white/10 text-white/90 text-xs font-black shadow-inner">
                  <span>{LOCALIZED_TEXT.totalLabel}{scheduledTasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0)}{LOCALIZED_TEXT.minutesUnit}</span>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsSubView({ type: 'groupStats', chunkId: chunk.id });
                    setIsSettingsOpen(true);
                  }}
                  className="inline-flex items-center justify-center p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-[10px] transition-all ml-1 align-middle"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 세번째 줄: 프로그레스 바 */}
            <div className="flex items-center gap-4 pt-3">
              <div className="flex-grow h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                {/* [디자인 수정 구역 4: 프로그레스 바]
                    - 바 높이: h-2.5
                    - 바 채우기 색상: from-indigo-300 to-violet-300 (그라데이션)
                */}
                <motion.div 
                  animate={{ width: `${scheduledTasks.length > 0 ? (scheduledTasks.filter(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT).length / scheduledTasks.length) * 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full shadow-[0_0_10px_rgba(165,180,252,0.3)]"
                />
              </div>
              <div className="text-xl font-black text-white tabular-nums leading-none tracking-tight">
                {scheduledTasks.length > 0 ? Math.round((scheduledTasks.filter(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT).length / scheduledTasks.length) * 100) : 0}<span className="text-xs text-white/40 ml-0.5">%</span>
              </div>
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
                {/* [디자인 수정 구역 5: 현재 루틴 인디케이터] 
                    - 배경색: bg-indigo-500
                    - 글자색: text-white
                */}
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1.5 rounded-bl-[10px] text-[10px] font-black uppercase tracking-widest">
                  {LOCALIZED_TEXT.currentRoutineBadge}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {/* [디자인 수정 구역 6: 루틴 제목 및 타입 배지] 
                        - 제목 색상: text-slate-900
                        - 배지 배경: bg-slate-100, 배지 글자: text-slate-500
                    */}
                    <h3 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                      {chunk.tasks.findIndex(t => t.id === activeTask.id) + 1}. {activeTask.id === scheduledTasks[0]?.id && "⚡"}{activeTask.text}
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-[10px] font-bold text-xs ml-3 align-middle shrink-0">
                        {activeTask.taskType === TaskType.TIME_INDEPENDENT ? (
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                        ) : activeTask.taskType === TaskType.TIME_ACCUMULATED ? (
                          <BrickWall className="w-3.5 h-3.5 text-pink-500" />
                        ) : (
                          <Hourglass className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{activeTask.targetDuration}{LOCALIZED_TEXT.minutesUnit}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForStats(activeTask.id);
                        }}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-[10px] transition-all ml-2 align-middle cursor-pointer"
                        title={LOCALIZED_TEXT.detailStatsTooltip}
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                    </h3>
                  </div>

                  {/* [디자인 수정 구역 7: 타이머 박스 본체] 
                      - 배경색(일시정지시): bg-slate-50
                      - 배경색(진행시): bg-slate-100
                      - 테두리: border-slate-200
                  */}
                  <div 
                    className={`relative flex flex-col items-center justify-center py-6 rounded-[10px] overflow-hidden select-none ${activeTask.isPaused ? 'bg-slate-50' : 'bg-slate-100'} border border-slate-200`}
                  >
                    {/* [디자인 수정 구역 8: 타이머 채움 애니메이션 레이어] 
                        - 투명도: opacity-0.2 ~ 0.4
                        - 색상은 위쪽 'getStageInfo' 함수 내 'color' 값을 따릅니다. 
                    */}
                    {((userData.hideAnytimeTimer && activeTask.taskType === TaskType.TIME_INDEPENDENT) || getElapsed(activeTask) > 0 || isPressing) && (
                      <motion.div 
                        initial={false}
                        animate={
                          isPressing
                            ? { width: '0%', opacity: 0.2 }
                            : (userData.hideAnytimeTimer && activeTask.taskType === TaskType.TIME_INDEPENDENT) 
                              ? { width: '100%', opacity: 0.4 } 
                              : { 
                                  width: `${getStageInfo(activeTask).progress}%`,
                                  opacity: getStageInfo(activeTask).isFinished ? 0.4 : 0.2
                                }
                        }
                        className={`absolute inset-y-0 left-0 ${getStageInfo(activeTask).color}`}
                        transition={
                          isPressing 
                            ? { duration: 1.8, ease: 'linear' } 
                            : { duration: 0.5 }
                        }
                      />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center select-none">
                      {/* [디자인 수정 구역 9: 타이머 내 날짜/시각 정보] 
                          - 글자색: text-slate-500
                      */}
                      <div className="text-sm font-bold text-slate-500 mb-1 tabular-nums flex flex-col items-center select-none">
                        <div>{`${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')}`}</div>
                        <div>{`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}</div>
                      </div>
                      
                      {/* [디자인 수정 구역 10: 타이머 숫자 (00:00)] 
                          - 진행중 색상: text-slate-900
                          - 일시정지 색상: text-slate-400
                          - 분 표시 색상: text-slate-400
                      */}
                      {(() => {
                        const isAnytimeHidden = userData.hideAnytimeTimer && activeTask.taskType === TaskType.TIME_INDEPENDENT;
                        return (
                          <div 
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                            onTouchCancel={onTouchCancel}
                            onMouseDown={onMouseDown}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseLeave}
                            className={`text-6xl font-black tabular-nums tracking-tighter select-none cursor-pointer touch-none active:scale-[0.97] transition-transform duration-150 py-2 px-4 rounded-[10px] ${
                              isAnytimeHidden 
                                ? 'text-transparent' 
                                : (!activeTask.startTime || activeTask.isPaused) 
                                  ? 'text-slate-400' 
                                  : 'text-slate-900'
                            }`}
                          >
                            {formatDuration(getElapsed(activeTask))}
                            <span className={`text-xl ml-2 select-none ${isAnytimeHidden ? 'text-transparent' : 'text-slate-400'}`}>/ {activeTask.targetDuration}{LOCALIZED_TEXT.minutesUnit}</span>
                          </div>
                        );
                      })()}
                      
                      {/* [디자인 수정 구역 11: 타이머 상태 텍스트 (Ready/Paused/In Progress)] 
                          - 글자색: text-slate-400 ~ text-slate-500
                      */}
                      <div className="flex items-center gap-2 mt-2 select-none">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] select-none ${activeTask.isPaused || !activeTask.startTime ? 'text-slate-400' : 'text-slate-500'}`}>
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
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{LOCALIZED_TEXT.checklistTitle}</span>
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
                          {LOCALIZED_TEXT.clearAllChecksBtn}
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
                            className="w-full flex items-start gap-3 p-3.5 bg-white rounded-[10px] border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm text-left"
                          >
                            <div className={`w-6 h-6 min-w-[24px] min-h-[24px] rounded-[10px] border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                              {item.completed && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-bold transition-all break-words ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* [디자인 수정 구역 12: 하단 보조 버튼들 (START/PAUSE, LATER, SKIP)] 
                      - 각 버튼의 배경색(bg-...) 및 글자색(text-...)을 변경하세요.
                  */}
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => togglePauseTask(activeTask.id, true)}
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
                    
                    let btnText = LOCALIZED_TEXT.executionCompleted;
                    /* 
                       [디자인 수정 구역 13: 메인 완료 버튼 색상 설정]
                    */
                    let btnColor = "bg-indigo-600";
                    
                    if (activeTask.taskType === TaskType.TIME_LIMITED) {
                      if (isFinished) {
                        btnText = LOCALIZED_TEXT.statusCompleted;
                        btnColor = "bg-violet-600";
                      } else {
                        btnText = LOCALIZED_TEXT.statusPerfect;
                        btnColor = "bg-indigo-600";
                      }
                    } else if (activeTask.taskType === TaskType.TIME_ACCUMULATED) {
                      if (isFinished) {
                        btnText = LOCALIZED_TEXT.statusPerfect;
                        btnColor = "bg-indigo-600";
                      } else {
                        btnText = LOCALIZED_TEXT.statusCompleted;
                        btnColor = "bg-violet-600";
                      }
                    } else {
                      // TIME_INDEPENDENT
                      btnText = LOCALIZED_TEXT.statusPerfect;
                      btnColor = "bg-indigo-600";
                    }

                    return (
                      <button 
                        onClick={() => toggleTask(activeTask.id)}
                        className={`w-full py-4 ${btnColor} text-white rounded-[10px] font-black text-lg shadow-xl shadow-indigo-200 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3`}
                      >
                        {btnText === LOCALIZED_TEXT.statusPerfect ? <DoubleCheckCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        {btnText}
                      </button>
                    );
                  })()}
                </div>
              </>
            </motion.div>
          )}

          {/* 나머지루틴목록 (Remaining Routines List) */}
          {chunk.tasks.filter(t => activeTask ? t.id !== activeTask.id : true).length > 0 && (
            <div className="space-y-3">
              {[...chunk.tasks]
                .filter(t => activeTask ? t.id !== activeTask.id : true)
                .sort((a, b) => {
                  // 이미 완료된 루틴그룹인 경우 사용자가 설정한 원래 순서(index)대로 표시
                  if (allTasksDone || isAlreadyFinalized) {
                    return chunk.tasks.indexOf(a) - chunk.tasks.indexOf(b);
                  }
                  
                  const isScheduledA = isTaskScheduledToday(a, chunk, effectiveDate, userData);
                  const isScheduledB = isTaskScheduledToday(b, chunk, effectiveDate, userData);
                  if (isScheduledA && !isScheduledB) return -1;
                  if (!isScheduledA && isScheduledB) return 1;
                  
                  const isFinishedTask = (t: Task) => t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP;
                  const isLaterTask = (t: Task) => !isFinishedTask(t) && !!t.laterTimestamp;
                  const isPausedTask = (t: Task) => !isFinishedTask(t) && !isLaterTask(t) && (!!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
                  const isUnstartedTask = (t: Task) => !isFinishedTask(t) && !isLaterTask(t) && !isPausedTask(t);

                  const getPriority = (t: Task) => {
                    if (isPausedTask(t)) return 1;
                    if (isUnstartedTask(t)) return 2;
                    if (isLaterTask(t)) return 3;
                    if (isFinishedTask(t)) return 4;
                    return 5;
                  };

                  const priorityDiff = getPriority(a) - getPriority(b);
                  if (priorityDiff !== 0) {
                    return priorityDiff;
                  }
                  
                  return chunk.tasks.indexOf(a) - chunk.tasks.indexOf(b);
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
                    isLocked={false}
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
            {LOCALIZED_TEXT.resetRoutinesBtn}
          </button>
        </div>
      )}
    </div>
  );
};
