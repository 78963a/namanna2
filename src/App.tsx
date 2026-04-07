/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  CheckCircle2, 
  Circle, 
  CircleDot,
  PauseCircle,
  ArrowRightCircle,
  Trophy, 
  Settings, 
  Plus, 
  Trash2, 
  Flame,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Home as HomeIcon,
  Calendar,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  CloudSun,
  Edit2,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Timer,
  X,
  GripVertical,
  ArrowRight,
  RotateCcw,
  Target,
  Zap,
  PlusCircle,
  Hourglass,
  Camera,
  Check,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
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
  HeaderBoxProps,
  PointSelectorProps,
  HomeViewProps,
  StatsViewProps,
  ExecutionViewProps
} from './types';
import { 
  POINTS_WAKE_UP, 
  STREAK_BONUS_MULTIPLIER, 
  MAX_DAILY_ABSOLUTE_POINTS, 
  STORAGE_KEY 
} from './constants';
import { 
  timeToMinutes, 
  minutesToTime,
  isChunkScheduledToday, 
  isTaskScheduledToday, 
  formatDate, 
  getAverageWakeUpTime,
  getDaysBetween,
  getConsecutiveCompletionDays,
  formatDurationPrecise
} from './utils';

// Components
import { HeaderBox } from './components/layout/HeaderBox';
import { HomeView } from './components/views/HomeView';
import { StatsView } from './components/views/StatsView';
// import { ExecutionView } from './components/views/ExecutionView';
// import { AddRoutineGroupView } from './components/views/AddRoutineGroupView';
import { SettingsView } from './components/views/SettingsView';
import { ConfirmModal } from './components/common/ConfirmModal';
import { CelebrationModal } from './components/common/CelebrationModal';
// import { ChecklistModal } from './components/routine/ChecklistModal';
// import { RoutineTitle } from './components/routine/RoutineTitle';
import { RoutineTitleLine } from './components/routine/RoutineTitleLine';
import { PointSelector } from './components/common/PointSelector';
// import { TaskInputSection } from './components/routine/TaskInputSection';
// import { SortableTaskItem } from './components/routine/SortableTaskItem';
// import { SortableChunkItem } from './components/routine/SortableChunkItem';
// import { SortableChecklistItem } from './components/routine/SortableChecklistItem';
import { BrickIcon } from './components/common/Icons';
// --- Components ---



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
  todayStr,
  toggleTask,
  togglePauseTask,
  laterTask,
  giveUpTask,
  startTask,
  onRestart,
  resetChunk,
  setSettingsSubView,
  setIsSettingsOpen
}) => {
  const chunk = userData.routineChunks.find(c => c.id === selectedChunkId);
  if (!chunk) return null;

  const tasks = chunk.tasks;
  const scheduledTasks = tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData));
  const activeTask = tasks.find(t => t.startTime && !t.endTime);
  const isNotStarted = tasks.every(t => !t.startTime && !t.completed && !t.givenUp);

  const [closingNote, setClosingNote] = useState('');
  const [closingPhoto, setClosingPhoto] = useState<string | undefined>();
  const [satisfaction, setSatisfaction] = useState(5);

  const getElapsed = (task: Task) => {
    if (!task.startTime) return 0;
    const [h, m, s] = task.startTime.split(':').map(Number);
    const start = new Date(currentTime);
    start.setHours(h, m, s, 0);
    if (start.getTime() > currentTime.getTime()) {
      start.setDate(start.getDate() - 1);
    }
    const currentSession = task.isPaused ? 0 : Math.floor((currentTime.getTime() - start.getTime()) / 1000);
    return (task.accumulatedDuration || 0) + currentSession;
  };

  const getStageInfo = (task: Task) => {
    const elapsed = getElapsed(task);
    const target = (task.targetDuration || 0) * 60;
    const progress = Math.min((elapsed / target) * 100, 100);
    
    let color = "bg-indigo-500";
    let points = task.points || 0;
    
    if (progress >= 100) {
      color = "bg-emerald-500";
    } else if (progress >= 80) {
      color = "bg-amber-500";
    }
    
    return { progress, color, points };
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sortedTasks = [...scheduledTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  const isTriggerComplete = true; // Placeholder

  return (
    <div className="space-y-4 relative">
      {/* 루틴그룹박스 (Routine Group Box) */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12" />
        
        <div className="p-4 relative z-10">
          {/* Top Row: Title (Left) and Reset Button (Right) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-2 max-w-[70%]">
              <h2 className="text-base font-black text-white tracking-tight leading-relaxed">
                <RoutineTitle 
                  chunk={chunk} 
                  isCompleted={chunk.tasks.every(t => t.completed || t.givenUp)}
                  nameClassName="text-white"
                />
              </h2>
              <button 
                onClick={() => {
                  setSettingsSubView({ type: 'detail', chunkId: chunk.id });
                  setIsSettingsOpen(true);
                }}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            {chunk.tasks.some(t => t.startTime || t.completed || t.givenUp || t.laterTimestamp) && (
              <SlideToResetButton onReset={() => resetChunk(chunk.id)} />
            )}
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
          {activeTask && !isNotStarted && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                layout: { type: "spring", stiffness: 300, damping: 30 }
              }}
              key={activeTask.id}
              className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-indigo-100 border-2 border-indigo-500 relative overflow-hidden mb-6"
            >
              {activeTask.isClosingRoutine ? (
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">오늘의 회고</p>
                        <textarea
                          value={closingNote}
                          onChange={(e) => setClosingNote(e.target.value)}
                          placeholder="오늘의 소감을 남겨주세요..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                        />
                      </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">사진 인증 (선택)</p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            // Mock photo upload
                            setClosingPhoto('https://picsum.photos/seed/routine/400/300');
                          }}
                          className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all"
                        >
                          <Camera className="w-6 h-6" />
                          <span className="text-[8px] font-black">UPLOAD</span>
                        </button>
                        {closingPhoto && (
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <img src={closingPhoto} alt="Closing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              onClick={() => setClosingPhoto(undefined)}
                              className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-sm"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      toggleTask(activeTask.id, {
                        note: closingNote,
                        photo: closingPhoto,
                        satisfaction: satisfaction
                      });
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    마무리 완료!
                  </button>
                </div>
              ) : (
                <>
                  {/* Active Indicator */}
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                    현재루틴
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h3 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">
                          {chunk.tasks.findIndex(t => t.id === activeTask.id) + 1}. {activeTask.id === scheduledTasks[0]?.id && "⚡"}{activeTask.text}{activeTask.isClosingRoutine && "🥇"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold text-xs">
                            {activeTask.taskType === TaskType.TIME_INDEPENDENT ? (
                              <Clock className="w-4 h-4 text-sky-500" />
                            ) : activeTask.taskType === TaskType.TIME_ACCUMULATED ? (
                              <BrickIcon className="w-4 h-4 text-pink-500" />
                            ) : (
                              <Hourglass className="w-4 h-4 text-indigo-600" />
                            )}
                            <span>{activeTask.targetDuration}분</span>
                          </div>
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold text-xs">
                            <Trophy className="w-4 h-4" />
                            <span>{activeTask.points}P</span>
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
                      className={`relative flex flex-col items-center justify-center py-6 rounded-3xl overflow-hidden cursor-pointer ${activeTask.isPaused ? 'bg-slate-50' : 'bg-slate-100'} border border-slate-200`}
                    >
                      {/* Filling Background */}
                      {getElapsed(activeTask) > 0 && (
                        <motion.div 
                          initial={false}
                          animate={{ width: `${getStageInfo(activeTask).progress}%` }}
                          className={`absolute inset-y-0 left-0 ${activeTask.isPaused ? 'opacity-10' : 'opacity-20'} ${getStageInfo(activeTask).color}`}
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
                          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeTask.isPaused ? 'text-slate-400' : 'text-slate-500'}`}>
                            {activeTask.isPaused ? 'Paused' : `${activeTask.taskType === TaskType.TIME_ACCUMULATED ? '현재 획득 포인트' : '획득 예정 포인트'}: ${getStageInfo(activeTask).points}P`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Checklist Section (Moved here) */}
                    {activeTask.checklist && activeTask.checklist.length > 0 && (
                      <div className="bg-slate-50 rounded-3xl p-5 space-y-4 border-2 border-slate-100 shadow-inner mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
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
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
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
                              className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm"
                            >
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'}`}>
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
                        className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
                          activeTask.isPaused || !activeTask.startTime
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                      >
                        {activeTask.isPaused || !activeTask.startTime ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        {activeTask.isPaused || !activeTask.startTime ? 'RESUME' : 'PAUSE'}
                      </button>
                      <button 
                        onClick={() => laterTask(activeTask.id)}
                        disabled={activeTask.id === scheduledTasks[0]?.id}
                        className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
                          activeTask.id === scheduledTasks[0]?.id
                            ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                      >
                        <ArrowRightCircle className="w-5 h-5" />
                        LATER
                      </button>
                      <button 
                        onClick={() => giveUpTask(activeTask.id)}
                        disabled={activeTask.id === scheduledTasks[0]?.id}
                        className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
                          activeTask.id === scheduledTasks[0]?.id
                            ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                        GIVE UP
                      </button>
                    </div>

                    <button 
                      onClick={() => toggleTask(activeTask.id)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      실행 완료
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* 나머지루틴목록 (Remaining Routines List) */}
          {(isNotStarted ? sortedTasks : sortedTasks.filter(t => t.id !== activeTask?.id)).length > 0 && (
            <div className="space-y-3">
              {(isNotStarted ? sortedTasks : sortedTasks.filter(t => t.id !== activeTask?.id)).map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                  }}
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                    task.completed 
                      ? 'bg-slate-50/50 border-transparent' 
                      : task.givenUp
                        ? 'bg-rose-50/20'
                        : 'bg-white border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <RoutineTitleLine 
                    task={task} 
                    index={chunk.tasks.findIndex(t => t.id === task.id)} 
                    currentTime={currentTime}
                    chunkTasks={chunk.tasks}
                    onRestart={onRestart}
                    onDoFirst={togglePauseTask}
                    isLocked={!isTriggerComplete && task.id !== scheduledTasks[0]?.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => setActiveTab('home')}
        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm"
      >
        Cancel and Return to List
      </button>
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
    <div ref={setNodeRef} style={style} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group flex items-center justify-between">
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
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={editingChunkPurpose}
                onChange={(e) => setEditingChunkPurpose(e.target.value)}
                placeholder="그룹 목적"
                className="flex-grow bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              className="flex-grow text-left truncate group/title flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 group-hover/title:text-indigo-600 transition-colors">{chunk.name}</h4>
                <div className="relative group/tooltip">
                  <Settings className="w-4 h-4 text-slate-300 group-hover/title:text-indigo-400 transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    설정 변경
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 truncate">{chunk.purpose}</p>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEnterDetail(chunk.id)}
          className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
          title="상세 설정"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
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
  editingTaskPoints: number;
  setEditingTaskPoints: (points: number) => void;
  editingTaskDuration: number;
  setEditingTaskDuration: (duration: number) => void;
  editingTaskType: TaskType;
  setEditingTaskType: (type: TaskType) => void;
  editingTaskScheduledDays: number[];
  setEditingTaskScheduledDays: (days: number[]) => void;
  updateTask: (taskId: string, newText: string, newPoints: number, newDuration: number, newTaskType?: TaskType, newScheduledDays?: number[]) => void;
  deleteTask: (id: string) => void;
  PointSelector: any;
  chunkScheduledDays: number[];
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, 
  index, 
  editingTaskId, 
  setEditingTaskId, 
  editingTaskText, 
  setEditingTaskText, 
  editingTaskPoints, 
  setEditingTaskPoints, 
  editingTaskDuration,
  setEditingTaskDuration,
  editingTaskType,
  setEditingTaskType,
  editingTaskScheduledDays,
  setEditingTaskScheduledDays,
  updateTask, 
  deleteTask,
  PointSelector,
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
    <div ref={setNodeRef} style={style} className="p-3 bg-white rounded-2xl border border-slate-100 group shadow-sm">
      {editingTaskId === task.id ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">{index + 1}.</span>
            <input 
              type="text"
              value={editingTaskText}
              onChange={(e) => setEditingTaskText(e.target.value)}
              className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">루틴 유형</span>
              <div className="flex items-center gap-1">
                {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                  const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                  const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickIcon : Hourglass;
                  return (
                    <button 
                      key={type}
                      onClick={() => setEditingTaskType(type)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 ${editingTaskType === type ? `${colorClass} text-white shadow-md` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
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
                className={`w-full bg-slate-50 border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 transition-colors ${
                  editingTaskType === TaskType.TIME_INDEPENDENT ? 'border-sky-200 focus:ring-sky-500/20' : editingTaskType === TaskType.TIME_ACCUMULATED ? 'border-pink-200 focus:ring-pink-500/20' : 'border-indigo-200 focus:ring-indigo-500/20'
                }`}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">포인트</span>
              <PointSelector 
                value={editingTaskPoints} 
                onChange={setEditingTaskPoints} 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">실행 요일</span>
            <div className="flex gap-1">
              {days.map((day, i) => {
                const isGroupScheduled = chunkScheduledDays.includes(i);
                const isSelected = editingTaskScheduledDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    disabled={!isGroupScheduled}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                      isSelected 
                        ? 'bg-indigo-500 text-white shadow-sm' 
                        : isGroupScheduled
                          ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => updateTask(task.id, editingTaskText, editingTaskPoints, editingTaskDuration, editingTaskType, editingTaskScheduledDays)}
              className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              저장
            </button>
            <button 
              onClick={() => setEditingTaskId(null)}
              className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
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
                    <BrickIcon className="w-3 h-3 text-pink-500" />
                  ) : (
                    <Hourglass className="w-3 h-3 text-indigo-600" />
                  )}
                  <span className="text-[10px] text-slate-500 font-bold">{task.targetDuration || 0}분</span>
                </div>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] text-indigo-600 font-bold">{task.points}P</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 transition-opacity">
            <div className="relative group/tooltip">
              <button 
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditingTaskText(task.text);
                  setEditingTaskPoints(task.points);
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

const RoutineTitle = ({ 
  chunk, 
  isCompleted,
  nameClassName = "text-slate-900"
}: { 
  chunk: RoutineChunk, 
  isCompleted: boolean,
  nameClassName?: string
}) => {
  const hasPurpose = chunk.purpose && chunk.purpose.trim() !== '';
  
  if (isCompleted) {
    return (
      <span className="inline leading-relaxed text-black">
        나는 <span className="text-blue-600 font-black">{chunk.name}</span>을 완료한 {hasPurpose ? <span className="text-blue-600 font-black">{chunk.purpose}</span> : ""}이다!
      </span>
    );
  } else {
    const titleNameStyle = `block text-xl font-black mt-2 mb-2 ${nameClassName}`;
    if (hasPurpose) {
      return (
        <span className="block">
          {chunk.purpose}를 위한 <span className={titleNameStyle}>{chunk.name}</span>
        </span>
      );
    } else {
      return (
        <span className="block">
          <span className={titleNameStyle}>{chunk.name}</span>
        </span>
      );
    }
  }
};

// --- Helper Components ---

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onRemove: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({ 
  item, 
  onRemove, 
  onEdit 
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
      className={`flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
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
          className="flex-grow bg-white border border-indigo-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            if (window.confirm('삭제하시겠습니까?')) {
              onRemove(item.id);
            }
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
  setChecklist 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  checklist: ChecklistItem[], 
  setChecklist: (items: ChecklistItem[]) => void 
}) => {
  const [newItemText, setNewItemText] = useState('');

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            style={{ minHeight: '500px', maxHeight: '80vh' }}
          >
            <div className="p-6 space-y-6 flex flex-col h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
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

              <div className="flex gap-2 flex-shrink-0">
                <input 
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="체크리스트 항목 입력..."
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={addItem}
                  className="bg-indigo-600 text-white px-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  추가
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 min-h-0">
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
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-slate-800 transition-all active:scale-[0.98]"
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
  label: string, 
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
      <label className="text-[15px] font-bold text-slate-600 ml-1">{label}</label>
      {description && <p className="text-[10px] font-bold text-slate-400 ml-1 leading-relaxed">{description}</p>}
    </div>
    <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-4 shadow-none">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 내용</span>
          {onOpenChecklist && (
            <button 
              onClick={onOpenChecklist}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${task.checklist && task.checklist.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
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
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Routine Schedule Settings (Restored) */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">실행 요일 (그룹 일정 내)</span>
        <div className="flex flex-wrap gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => {
            const isAvailable = groupScheduledDays.includes(i);
            const isSelected = task.scheduledDays?.includes(i);
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
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-none' 
                    : isAvailable 
                      ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                      : 'bg-slate-50 text-slate-200 border border-slate-50 cursor-not-allowed opacity-50'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {!isTrigger && (
        <div className="space-y-0">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { type: TaskType.TIME_INDEPENDENT, label: '시간무관루틴', icon: Clock },
                { type: TaskType.TIME_LIMITED, label: '시간제한루틴', icon: Hourglass },
                { type: TaskType.TIME_ACCUMULATED, label: '시간축적루틴', icon: Layers }
              ].map((t) => (
                <button
                  key={t.type}
                  onClick={() => setTask({ ...task, type: t.type })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black transition-all ${task.type === t.type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 mt-[-1px]">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                시간 (분)
              </span>
              <input 
                type="number"
                min="1"
                value={task.duration}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 1;
                  setTask({ ...task, duration: val });
                }}
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
              />
            </div>
          </div>
        </div>
      )}

      {isTrigger && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
            시간 (최대 3분)
          </span>
          <input 
            type="number"
            min="1"
            max={3}
            value={task.duration}
            onChange={(e) => {
              let val = parseInt(e.target.value) || 1;
              val = Math.min(3, val);
              setTask({ ...task, duration: val });
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">포인트 (5-10)</span>
        <div className="flex flex-wrap gap-1">
          {[5, 6, 7, 8, 9, 10].map(p => (
            <button 
              key={p}
              onClick={() => setTask({ ...task, points: p })}
              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${task.points === p ? 'bg-indigo-600 text-white shadow-none' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {(onAdd || isEditing) && (
        <div className="flex gap-2">
          {isEditing && onCancel && (
            <button 
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          )}
          <button 
            onClick={onAdd}
            disabled={!task.text.trim()}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? '수정 완료' : '루틴 추가하기'}
          </button>
        </div>
      )}
    </div>
  </div>
);

const SortableRoutineItem = ({ rt, idx, onEdit, onDelete }: any) => {
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
      className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-none group"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{idx + 2}. {rt.text}</span>
          <span className="text-[10px] font-bold text-slate-400">{rt.type} • {rt.duration}분 • {rt.points}P</span>
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

const AddRoutineGroupView: React.FC<{
  addChunk: (name: string, purpose: string, tasks: Task[], scheduleType: 'days' | 'weekly' | 'monthly' | 'yearly', scheduledDays: number[], frequency?: number, startTime?: string, isAlarmEnabled?: boolean, startType?: 'anytime' | 'situation' | 'time', situation?: string) => void;
  setActiveTab: (tab: any) => void;
  setSettingsSubView: (view: any) => void;
  setIsSettingsOpen: (open: boolean) => void;
  userData: UserData;
}> = ({ addChunk, setActiveTab, setSettingsSubView, setIsSettingsOpen, userData }) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [triggerTask, setTriggerTask] = useState({ text: '', duration: 1, points: 5, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6] });
  const [routineList, setRoutineList] = useState<Array<{ id: string, text: string, duration: number, points: number, type: TaskType, scheduledDays: number[] }>>([]);
  const [currentRoutineInput, setCurrentRoutineInput] = useState({ text: '', duration: 10, points: 5, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6] });
  const [isClosingRoutineEnabled, setIsClosingRoutineEnabled] = useState(true);
  
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

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
    if (editingRoutineIndex !== null) {
      const newList = [...routineList];
      newList[editingRoutineIndex] = { ...newList[editingRoutineIndex], ...currentRoutineInput };
      setRoutineList(newList);
      setEditingRoutineIndex(null);
    } else {
      setRoutineList([...routineList, { ...currentRoutineInput, id: `new-rt-${Date.now()}` }]);
    }
    setCurrentRoutineInput({ text: '', duration: 10, points: 5, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
  };

  const startEditing = (idx: number) => {
    setEditingRoutineIndex(idx);
    setCurrentRoutineInput({ ...routineList[idx] });
    // Scroll to input section
    const inputSection = document.getElementById('routine-input-section');
    if (inputSection) {
      inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = routineList.findIndex((rt) => rt.id === active.id);
      const newIndex = routineList.findIndex((rt) => rt.id === over.id);
      setRoutineList(arrayMove(routineList, oldIndex, newIndex));
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    
    const finalTasks: Task[] = [];
    const now = Date.now();
    
    // 1. Trigger Task
    finalTasks.push({
      id: `trigger-${now}`,
      text: triggerTask.text || '트리거 루틴',
      completed: false,
      points: triggerTask.points,
      targetDuration: Math.min(3, triggerTask.duration),
      taskType: triggerTask.type,
      scheduledDays: triggerTask.scheduledDays.filter(d => scheduledDays.includes(d)),
      checklist: (triggerTask as any).checklist || []
    });
    
    // 2. Routine List
    routineList.forEach((rt, idx) => {
      finalTasks.push({
        id: `routine-${idx}-${now}`,
        text: rt.text,
        completed: false,
        points: rt.points,
        targetDuration: rt.duration,
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
        points: currentRoutineInput.points,
        targetDuration: currentRoutineInput.duration,
        taskType: currentRoutineInput.type,
        scheduledDays: currentRoutineInput.scheduledDays.filter(d => scheduledDays.includes(d)),
        checklist: (currentRoutineInput as any).checklist || []
      });
    }
    
    // 4. Closing Task
    if (isClosingRoutineEnabled) {
      finalTasks.push({
        id: `closing-${now}`,
        text: '마무리 루틴',
        completed: false,
        points: 5,
        targetDuration: 1,
        taskType: TaskType.TIME_INDEPENDENT,
        scheduledDays: scheduledDays,
        isClosingRoutine: true
      });
    }
    
    if (finalTasks.length < 3) {
      setErrorMessage('모든 루틴 그룹은 반드시 세 개 이상의 루틴이 들어가야 합니다. (트리거 + 개별 루틴 + 마무리 루틴 등)');
      return;
    }
    setErrorMessage(null);

    addChunk(name, purpose, finalTasks, 'days', scheduledDays, 1, startType === 'time' ? startTime : '', isAlarmEnabled, startType, situation);
    setActiveTab('home');
  };

  const openChecklistModal = (target: 'trigger' | 'current') => {
    setActiveChecklistTarget(target);
    setIsChecklistModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-20">
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
      />
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 shadow-none space-y-5">
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">새로운 루틴 그룹 만들기</h2>
          </div>
        </div>
        <div className="space-y-5">
          {/* Name Input */}
          <div className="space-y-3">
            <label className="text-[15px] font-bold text-slate-600 ml-1">1. 루틴그룹 이름</label>
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
            <label className="text-[15px] font-bold text-slate-600 ml-1">
              2. 목적 (선택사항)
              <span className="block text-[10px] text-slate-400 font-bold mt-0.5">이 루틴이 몸에 익으면 당신은 어떤 사람이 될까요?</span>
            </label>
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
            <label className="text-[15px] font-bold text-slate-600 ml-1">3. 요일 설정</label>
            <div className="flex flex-wrap gap-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
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
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${scheduledDays.includes(i) ? 'bg-indigo-600 text-white shadow-none' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Start Situation or Time Setting */}
          <div className="space-y-3">
            <label className="text-[15px] font-bold text-slate-600 ml-1">4. 시작 상황 또는 시각 설정</label>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-4 shadow-none">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
                  <button
                    onClick={() => {
                      setStartType('anytime');
                      setIsAlarmEnabled(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'anytime' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    아무때나
                  </button>
                  <button
                    onClick={() => {
                      setStartType('situation');
                      setIsAlarmEnabled(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'situation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    상황
                  </button>
                  <button
                    onClick={() => {
                      setStartType('time');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    시각
                  </button>
                </div>

                {startType === 'situation' && (
                  <div className="space-y-1.5">
                    <input 
                      type="text"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="예: 외출했다 돌아왔을 때"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {startType === 'time' && (
                  <div className="flex items-center gap-4 transition-all opacity-100">
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-lg font-black bg-transparent border-none focus:ring-0 p-0 text-slate-900"
                    />
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">알람</span>
                      <button 
                        onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                        className={`w-10 h-5 rounded-full transition-all relative ${isAlarmEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isAlarmEnabled ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-5">
            <TaskInputSection 
              label="5. 첫번째 루틴 (트리거 루틴)"
              task={triggerTask}
              setTask={setTriggerTask}
              isTrigger={true}
              description="가벼운 주의 환기 행동으로 시작합니다. 아침 루틴을 위해서 침대에서 벗어나기, 독서를 위해서 책을 펼쳐놓기와 같이 3분이내 끝날 수 있는 행동을 설정해주세요"
              onOpenChecklist={() => openChecklistModal('trigger')}
              groupScheduledDays={scheduledDays}
            />

            <div className="space-y-3">
              <label className="text-[15px] font-bold text-slate-600 ml-1">6. 루틴 추가</label>
              
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
                            onDelete={() => setRoutineList(routineList.filter((_, i) => i !== idx))}
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
                    setCurrentRoutineInput({ text: '', duration: 10, points: 5, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
                  }}
                  onOpenChecklist={() => openChecklistModal('current')}
                  groupScheduledDays={scheduledDays}
                />
              </div>
            </div>

            {/* 7. 마무리 루틴 설정 */}
            <div className="space-y-3">
              <label className="text-[15px] font-bold text-slate-600 ml-1">7. 마무리 루틴 설정</label>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-none">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-600">마무리 루틴 사용</span>
                  <span className="text-[10px] text-slate-400 font-bold">만족도 표시 및 메모 남기기</span>
                </div>
                <button 
                  onClick={() => setIsClosingRoutineEnabled(!isClosingRoutineEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isClosingRoutineEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isClosingRoutineEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleCreate}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            루틴 그룹 만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'execution' | 'settings' | 'add'>('home');
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('wake-up');
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [showCheckInCelebration, setShowCheckInCelebration] = useState(false);
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('morning-routine-data');
    const today = formatDate(new Date());
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration for old data
      if (!parsed.history) parsed.history = [];
      if (!parsed.startDate) parsed.startDate = today;
      
      // Rename absolutePoints to points
      if (parsed.absolutePoints !== undefined) {
        parsed.points = parsed.absolutePoints;
        delete parsed.absolutePoints;
      }
      // Rename relativePoints to completionRate
      if (parsed.relativePoints !== undefined) {
        parsed.completionRate = parsed.relativePoints;
        delete parsed.relativePoints;
      }
      // Rename dailyAbsolutePoints to dailyPoints
      if (parsed.dailyAbsolutePoints !== undefined) {
        parsed.dailyPoints = parsed.dailyAbsolutePoints;
        delete parsed.dailyAbsolutePoints;
      }
      // Rename dailyRelativePoints to dailyCompletionRate
      if (parsed.dailyRelativePoints !== undefined) {
        parsed.dailyCompletionRate = parsed.dailyRelativePoints;
        delete parsed.dailyRelativePoints;
      }

      if (parsed.points === undefined) parsed.points = 0;
      if (parsed.completionRate === undefined) parsed.completionRate = 0;
      if (!parsed.dailyPoints) parsed.dailyPoints = {};
      if (!parsed.dailyCompletionRate) parsed.dailyCompletionRate = {};
      if (parsed.resetTime === undefined) parsed.resetTime = '04:00';
      if (parsed.lastCheckCheckTime === undefined) parsed.lastCheckCheckTime = Date.now();
      if (parsed.lastResetDate === undefined) parsed.lastResetDate = null;
      if (parsed.dailyCheckCheckCounts === undefined) parsed.dailyCheckCheckCounts = {};
      if (parsed.dailyCheckInPoints === undefined) parsed.dailyCheckInPoints = {};
      
      // Migration for chunks
      if (parsed.routine && !parsed.routineChunks) {
        parsed.routineChunks = [{
          id: 'default',
          name: '기본 루틴',
          purpose: '더 나은 나',
          completionDates: [],
          tasks: parsed.routine.map((t: any) => ({
            ...t,
            points: t.points || 5
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
          tasks: chunk.tasks.map((t: any) => ({
            ...t,
            points: t.points || 5,
            scheduledDays: t.scheduledDays || [0, 1, 2, 3, 4, 5, 6]
          }))
        }));
      }

      return parsed;
    }
    return {
      points: 0,
      completionRate: 0,
      streak: 0,
      lastCheckInDate: null,
      targetWakeUpTime: '07:00',
      routineChunks: [
        {
          id: 'morning',
          name: '아침 루틴',
          purpose: '아침시간을 낭비하지 않는 사람',
          completionDates: [],
          startTime: '07:00',
          duration: 30,
          endTime: '07:30',
          scheduleType: 'days',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          tasks: [
            { id: '1', text: '물 한 잔 마시기', completed: false, points: 5, scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
            { id: '2', text: '이불 정리하기', completed: false, points: 5, scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
            { id: '3', text: '명상 5분', completed: false, points: 7, scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
          ]
        },
        {
          id: 'evening',
          name: '저녁 루틴',
          purpose: '하루를 차분하게 마무리하는 사람',
          completionDates: [],
          startTime: '22:00',
          duration: 20,
          endTime: '22:20',
          scheduleType: 'days',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          tasks: [
            { id: '4', text: '일기 쓰기', completed: false, points: 5, scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
            { id: '5', text: '스트레칭', completed: false, points: 5, scheduledDays: [0, 1, 2, 3, 4, 5, 6] },
          ]
        }
      ],
      history: [],
      startDate: today,
      dailyPoints: {},
      dailyCompletionRate: {},
      resetTime: '04:00',
      lastCheckCheckTime: Date.now(),
      lastResetDate: null,
      dailyCheckCheckCounts: {},
      dailyCheckInPoints: {}
    };
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [addGroupStep, setAddGroupStep] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPurpose, setNewGroupPurpose] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(5);
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
  const [editingTaskPoints, setEditingTaskPoints] = useState(5);
  const [editingTaskDuration, setEditingTaskDuration] = useState(10);
  const [editingTaskType, setEditingTaskType] = useState<TaskType>(TaskType.TIME_LIMITED);
  const [editingTaskScheduledDays, setEditingTaskScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [chunkTimeInputs, setChunkTimeInputs] = useState<Record<string, { s: string, d: number, e: string, alarm?: boolean }>>({});
  const [chunkScheduleInputs, setChunkScheduleInputs] = useState<Record<string, { type: 'days' | 'weekly' | 'monthly' | 'yearly', days: number[], freq: number }>>({});
  const [weather, setWeather] = useState<{ icon: React.ReactNode; temp: number } | null>(null);
  const [lastCompletedTaskName, setLastCompletedTaskName] = useState<string | null>(null);
  const [activeAlarmChunk, setActiveAlarmChunk] = useState<RoutineChunk | null>(null);

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
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- Effects ---
  const todayStr = useMemo(() => {
    const [resetH, resetM] = userData.resetTime.split(':').map(Number);
    const effectiveDate = new Date(currentTime);
    if (currentTime.getHours() < resetH || (currentTime.getHours() === resetH && currentTime.getMinutes() < resetM)) {
      effectiveDate.setDate(effectiveDate.getDate() - 1);
    }
    const y = effectiveDate.getFullYear();
    const m = String(effectiveDate.getMonth() + 1).padStart(2, '0');
    const d = String(effectiveDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentTime, userData.resetTime]);

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
            givenUp: false,
            laterTimestamp: undefined,
            startTime: undefined,
            endTime: undefined,
            isPaused: false,
            accumulatedDuration: 0,
            duration: 0,
            earnedPoints: undefined
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
        if (isChunkScheduledToday(chunk, currentTime, userData)) {
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

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const code = data.current_weather.weathercode;
        const temp = Math.round(data.current_weather.temperature);
        
        // Map WMO Weather interpretation codes (WW)
        let icon = <Sun className="w-6 h-6 text-amber-500" />;
        if (code >= 1 && code <= 3) icon = <CloudSun className="w-6 h-6 text-slate-400" />;
        else if (code >= 45 && code <= 48) icon = <Wind className="w-6 h-6 text-slate-300" />;
        else if (code >= 51 && code <= 67) icon = <CloudRain className="w-6 h-6 text-blue-400" />;
        else if (code >= 71 && code <= 77) icon = <CloudSnow className="w-6 h-6 text-blue-200" />;
        else if (code >= 80 && code <= 82) icon = <CloudRain className="w-6 h-6 text-blue-500" />;
        else if (code >= 95) icon = <CloudLightning className="w-6 h-6 text-indigo-500" />;
        else if (code >= 3) icon = <Cloud className="w-6 h-6 text-slate-400" />;

        setWeather({ icon, temp });
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      });
    }
  }, []);

  // Removed auto-pause when navigating away from execution screen as per user request
  // Current routine should continue counting in the background

  useEffect(() => {
    const totalCompleted = userData.routineChunks.reduce((acc, chunk) => 
      acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData) && t.completed).length, 0
    );
    const totalScheduledTasksCount = userData.routineChunks.reduce((acc, chunk) => 
      acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData)).length, 0
    );
    const completionPercentage = totalScheduledTasksCount > 0 
      ? Number(((totalCompleted / totalScheduledTasksCount) * 100).toFixed(1)) 
      : 0;

    if (userData.dailyCompletionRate[todayStr] !== completionPercentage) {
      setUserData(prev => ({
        ...prev,
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      }));
    }
  }, [userData.routineChunks, todayStr, currentTime]);

  useEffect(() => {
    localStorage.setItem('morning-routine-data', JSON.stringify(userData));
  }, [userData]);

  // --- Helpers ---
  
  const canCheckIn = useMemo(() => {
    if (userData.lastCheckInDate === todayStr) return false;
    
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);
    
    const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
    return diffMinutes >= -30 && diffMinutes <= 10;
  }, [userData.targetWakeUpTime, userData.lastCheckInDate, currentTime, todayStr]);

  const isLate = useMemo(() => {
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);
    return currentTime.getTime() > targetDate.getTime() + (10 * 60 * 1000);
  }, [userData.targetWakeUpTime, currentTime]);

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
  const handleCheckIn = () => {
    if (!canCheckIn) return;

    let newStreak = userData.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    if (userData.lastCheckInDate === yesterdayStr) {
      newStreak += 1;
    } else if (userData.lastCheckInDate === null || userData.lastCheckInDate !== todayStr) {
      newStreak = 1;
    }

    const bonus = (newStreak - 1) * STREAK_BONUS_MULTIPLIER;
    const totalEarned = POINTS_WAKE_UP + bonus;
    const checkInTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      const currentDaily = prev.dailyPoints[todayStr] || 0;
      const currentCheckInPoints = prev.dailyCheckInPoints[todayStr] || 0;
      const canAdd = totalEarned; // No max limit for points accumulation
      
      return {
        ...prev,
        points: prev.points + canAdd,
        dailyPoints: {
          ...prev.dailyPoints,
          [todayStr]: currentDaily + canAdd
        },
        dailyCheckInPoints: {
          ...prev.dailyCheckInPoints,
          [todayStr]: currentCheckInPoints + canAdd
        },
        streak: newStreak,
        lastCheckInDate: todayStr,
        history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
        routineChunks: prev.routineChunks.map(chunk => ({
          ...chunk,
          tasks: chunk.tasks.map(t => ({ ...t, completed: false }))
        }))
      };
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
      history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
      streak: 0,
      routineChunks: prev.routineChunks.map(chunk => ({
        ...chunk,
        tasks: chunk.tasks.map(t => ({ ...t, completed: false }))
      }))
    }));
  };

  const giveUpTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        const foundTask = chunk.tasks.find(t => t.id === id);
        if (!foundTask) return chunk;

        const updatedTasks = chunk.tasks.map(t => t.id === id ? { ...t, givenUp: true, completed: false } : t);
        const sortedTasks = [...updatedTasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
        const nextTask = sortedTasks.find(t => !t.completed && !t.givenUp && !t.startTime);

        if (nextTask) {
          return {
            ...chunk,
            tasks: updatedTasks.map(t => t.id === nextTask.id ? { ...t, startTime: nextTask.isClosingRoutine ? undefined : nowStr } : t)
          };
        }

        return {
          ...chunk,
          tasks: updatedTasks
        };
      })
    }));
  };

  const laterTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        const foundTask = chunk.tasks.find(t => t.id === id);
        if (!foundTask) return chunk;

        const updatedTasks = chunk.tasks.map(t => t.id === id ? { ...t, laterTimestamp: Date.now(), startTime: undefined, isPaused: false } : t);
        
        // Find next task to start
        const sortedTasks = [...updatedTasks].sort((a, b) => {
          const getPriority = (t: Task) => {
            if (t.givenUp) return 4;
            if (t.completed) return 3;
            if (t.laterTimestamp) return 2;
            return 1;
          };
          const pA = getPriority(a);
          const pB = getPriority(b);
          if (pA !== pB) return pA - pB;
          if (pA === 2) return (b.laterTimestamp || 0) - (a.laterTimestamp || 0);
          return 0;
        });

        const nextTask = sortedTasks.find(t => !t.completed && !t.givenUp && !t.startTime);
        if (nextTask) {
          return {
            ...chunk,
            tasks: updatedTasks.map(t => t.id === nextTask.id ? { ...t, startTime: nextTask.isClosingRoutine ? undefined : nowStr, isPaused: false } : t)
          };
        }

        return {
          ...chunk,
          tasks: updatedTasks
        };
      })
    }));
  };

  const startTask = (taskId: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        const newTasks = chunk.tasks.map(task => {
          // If this is the target task, start it
          if (task.id === taskId) {
            const wasPaused = task.isPaused;
            return {
              ...task,
              completed: false,
              givenUp: false,
              laterTimestamp: undefined,
              isPaused: false,
              startTime: nowStr,
              endTime: undefined,
              duration: undefined,
              accumulatedDuration: wasPaused ? (task.accumulatedDuration || 0) : 0
            };
          }
          
          // If this is an active task (not the target one), pause it
          const isActive = task.startTime && !task.isPaused && !task.completed && !task.givenUp;
          if (isActive) {
            let currentSessionDuration = 0;
            if (task.startTime) {
              const [h, m, s] = task.startTime.split(':').map(Number);
              const start = new Date(now);
              start.setHours(h, m, s, 0);
              if (start.getTime() > now.getTime()) {
                start.setDate(start.getDate() - 1);
              }
              currentSessionDuration = Math.floor((now.getTime() - start.getTime()) / 1000);
            }
            return {
              ...task,
              isPaused: true,
              accumulatedDuration: (task.accumulatedDuration || 0) + currentSessionDuration,
              startTime: undefined
            };
          }
          
          return task;
        });
        
        return { ...chunk, tasks: newTasks };
      })
    }));
  };

  const globalActiveTask = useMemo(() => {
    for (const chunk of userData.routineChunks) {
      const active = chunk.tasks.find(t => t.startTime && !t.isPaused && !t.completed && !t.givenUp);
      if (active) return { task: active, chunkId: chunk.id };
    }
    return null;
  }, [userData.routineChunks]);

  const onRestart = (taskId: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setUserData(prev => {
      // If there's a different active task, move it to 'Later'
      let activeTaskId: string | null = null;
      for (const chunk of prev.routineChunks) {
        const active = chunk.tasks.find(t => t.startTime && !t.isPaused && !t.completed && !t.givenUp);
        if (active && active.id !== taskId) {
          activeTaskId = active.id;
          break;
        }
      }

      return {
        ...prev,
        routineChunks: prev.routineChunks.map(chunk => {
          const newTasks = chunk.tasks.map(task => {
            // If this is the target task, start/resume it
            if (task.id === taskId) {
              const wasPaused = task.isPaused;
              return {
                ...task,
                completed: false,
                givenUp: false,
                laterTimestamp: undefined,
                isPaused: false,
                startTime: nowStr,
                endTime: undefined,
                duration: undefined,
                accumulatedDuration: wasPaused ? (task.accumulatedDuration || 0) : 0
              };
            }
            
            // If this was the active task, move it to 'Later'
            if (task.id === activeTaskId) {
              let currentSessionDuration = 0;
              if (task.startTime) {
                const [h, m, s] = task.startTime.split(':').map(Number);
                const start = new Date(now);
                start.setHours(h, m, s, 0);
                if (start.getTime() > now.getTime()) {
                  start.setDate(start.getDate() - 1);
                }
                currentSessionDuration = Math.floor((now.getTime() - start.getTime()) / 1000);
              }
              return {
                ...task,
                isPaused: false,
                laterTimestamp: Date.now(),
                accumulatedDuration: (task.accumulatedDuration || 0) + currentSessionDuration,
                startTime: undefined
              };
            }
            
            return task;
          });
          
          return { ...chunk, tasks: newTasks };
        })
      };
    });
  };

  const togglePauseTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        // Determine if we are about to resume a task
        const isTargetResuming = chunk.tasks.some(t => t.id === id && (t.isPaused || !t.startTime));

        return {
          ...chunk,
          tasks: chunk.tasks.map(t => {
            if (t.id === id) {
              if (t.isPaused || !t.startTime) {
                // Resuming or Starting: set new startTime
                return { ...t, isPaused: false, startTime: nowStr };
              } else {
                // Pausing: calculate accumulated duration
                let currentSessionDuration = 0;
                if (t.startTime) {
                  const [h, m, s] = t.startTime.split(':').map(Number);
                  const start = new Date(now);
                  start.setHours(h, m, s, 0);
                  if (start.getTime() > now.getTime()) {
                    start.setDate(start.getDate() - 1);
                  }
                  currentSessionDuration = Math.floor((now.getTime() - start.getTime()) / 1000);
                }
                return { 
                  ...t, 
                  isPaused: true, 
                  accumulatedDuration: (t.accumulatedDuration || 0) + currentSessionDuration,
                  startTime: undefined 
                };
              }
            }
            
            // If we are resuming the target task, pause all other active tasks
            if (isTargetResuming) {
              const isActive = t.startTime && !t.isPaused && !t.completed && !t.givenUp;
              if (isActive) {
                let currentSessionDuration = 0;
                if (t.startTime) {
                  const [h, m, s] = t.startTime.split(':').map(Number);
                  const start = new Date(now);
                  start.setHours(h, m, s, 0);
                  if (start.getTime() > now.getTime()) {
                    start.setDate(start.getDate() - 1);
                  }
                  currentSessionDuration = Math.floor((now.getTime() - start.getTime()) / 1000);
                }
                return {
                  ...t,
                  isPaused: true,
                  accumulatedDuration: (t.accumulatedDuration || 0) + currentSessionDuration,
                  startTime: undefined
                };
              }
            }
            
            return t;
          }),
        };
      }),
    }));
  };

  const resetChunk = (chunkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '루틴 리셋',
      message: '모든 루틴이 미실행상태로 돌아갑니다. 리셋하시겠습니까?',
      onConfirm: () => {
        setUserData(prev => {
          const chunk = prev.routineChunks.find(c => c.id === chunkId);
          if (!chunk) return prev;

          // Calculate points to subtract (only for tasks completed TODAY)
          let pointsToSubtract = 0;
          let completedCountToSubtract = 0;
          chunk.tasks.forEach(t => {
            if (t.completed) {
              pointsToSubtract += (t.earnedPoints || t.points);
              completedCountToSubtract += 1;
            }
          });

          const newChunks = prev.routineChunks.map(c => {
            if (c.id === chunkId) {
              return {
                ...c,
                tasks: c.tasks.map(t => ({
                  ...t,
                  completed: false,
                  givenUp: false,
                  laterTimestamp: undefined,
                  startTime: undefined,
                  endTime: undefined,
                  isPaused: false,
                  accumulatedDuration: 0,
                  duration: undefined,
                  earnedPoints: undefined
                }))
              };
            }
            return c;
          });

          // Update total points
          const newAbsoluteTotal = Math.max(0, prev.points - pointsToSubtract);
          
          const currentDaily = prev.dailyPoints[todayStr] || 0;
          const newDaily = Math.max(0, currentDaily - pointsToSubtract);

          // Recalculate completion percentage for today
          const totalCompleted = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData) && t.completed).length, 0
          );
          const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData)).length, 0
          );
          const completionPercentage = totalScheduledTasksCount > 0 
            ? Number(((totalCompleted / totalScheduledTasksCount) * 100).toFixed(1)) 
            : 0;

          return {
            ...prev,
            routineChunks: newChunks,
            points: newAbsoluteTotal,
            dailyPoints: {
              ...prev.dailyPoints,
              [todayStr]: newDaily
            },
            dailyCompletionRate: {
              ...prev.dailyCompletionRate,
              [todayStr]: completionPercentage
            }
          };
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleTask = (id: string, closingData?: { note?: string, photo?: string, satisfaction?: number }) => {
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
      
      // Calculate points based on elapsed time if completing
      let earnedPoints = foundTask.points;
      if (isBecomingCompleted && foundTask.startTime) {
        const [h, m, s] = foundTask.startTime.split(':').map(Number);
        const start = new Date(now);
        start.setHours(h, m, s, 0);
        if (start.getTime() > now.getTime()) {
          start.setDate(start.getDate() - 1);
        }
        const elapsed = (foundTask.accumulatedDuration || 0) + Math.floor((now.getTime() - start.getTime()) / 1000);
        const targetSec = (foundTask.targetDuration || 5) * 60;
        
        if (foundTask.taskType === TaskType.TIME_ACCUMULATED) {
          const progress = elapsed / targetSec;
          if (progress >= 1.0) earnedPoints = foundTask.points;
          else if (progress >= 0.9) earnedPoints = Math.floor(foundTask.points * 0.9);
          else if (progress >= 0.8) earnedPoints = Math.floor(foundTask.points * 0.8);
          else if (progress >= 0.5) earnedPoints = Math.floor(foundTask.points * 0.5);
          else earnedPoints = 0;
        } else if (foundTask.taskType === TaskType.TIME_INDEPENDENT) {
          earnedPoints = foundTask.points;
        } else {
          if (elapsed > targetSec) earnedPoints -= 1;
          if (elapsed > 2 * targetSec) earnedPoints -= 1;
          if (elapsed > 3 * targetSec) earnedPoints -= 1;
          if (elapsed > 4 * targetSec) earnedPoints -= 1;
          earnedPoints = Math.max(0, earnedPoints);
        }
      }
      
      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              const updated = { ...t, completed: isBecomingCompleted, givenUp: false };
              if (isBecomingCompleted) {
                updated.endTime = nowStr;
                let currentSession = 0;
                if (t.startTime && !t.isPaused) {
                  const start = new Date(now);
                  const [h, m, s] = t.startTime.split(':').map(Number);
                  start.setHours(h, m, s, 0);
                  if (start.getTime() > now.getTime()) {
                    start.setDate(start.getDate() - 1);
                  }
                  currentSession = Math.floor((now.getTime() - start.getTime()) / 1000);
                }
                updated.duration = (t.accumulatedDuration || 0) + currentSession;
                updated.earnedPoints = earnedPoints;
                
                if (closingData) {
                  updated.closingNote = closingData.note;
                  updated.closingPhoto = closingData.photo;
                  updated.satisfaction = closingData.satisfaction;
                }
              } else {
                updated.endTime = undefined;
                updated.duration = undefined;
                updated.earnedPoints = undefined;
                updated.closingNote = undefined;
                updated.closingPhoto = undefined;
                updated.satisfaction = undefined;
              }
              return updated;
            }
            return t;
          });

          // If we just completed a task, start the next one
          if (isBecomingCompleted) {
            const sortedTasks = [...updatedTasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
            const nextTask = sortedTasks.find(t => !t.completed);
            
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
                tasks: updatedTasks.map(t => t.id === nextTask.id ? { ...t, startTime: nextTask.isClosingRoutine ? undefined : nowStr } : t)
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

      let newAbsoluteTotal = prev.points;
      const currentDaily = prev.dailyPoints[todayStr] || 0;
      let newDaily = currentDaily;

      if (isBecomingCompleted) {
        const canAdd = earnedPoints;
        newAbsoluteTotal += canAdd;
        newDaily += canAdd;

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
      } else {
        const toSubtract = foundTask.earnedPoints || foundTask.points;
        newAbsoluteTotal -= toSubtract;
        newDaily -= toSubtract;
      }

      const totalCompleted = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData) && t.completed).length, 0
      );
      const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, currentTime, userData)).length, 0
      );
      const completionPercentage = totalScheduledTasksCount > 0 
        ? Number(((totalCompleted / totalScheduledTasksCount) * 100).toFixed(1)) 
        : 0;

      return {
        ...prev,
        routineChunks: newChunks,
        points: Math.max(0, newAbsoluteTotal),
        dailyPoints: {
          ...prev.dailyPoints,
          [todayStr]: Math.max(0, newDaily)
        },
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      };
    });
  };

  const addTask = (chunkId: string, scheduledDays: number[] = [0,1,2,3,4,5,6]) => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      points: newTaskPoints,
      targetDuration: newTaskDuration,
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
    setNewTaskPoints(5);
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

  const updateTask = (taskId: string, newText: string, newPoints: number, newDuration: number, newTaskType?: TaskType, scheduledDays?: number[]) => {
    if (!newText.trim()) return;
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => ({
        ...chunk,
        tasks: chunk.tasks.map(t => 
          t.id === taskId 
            ? { ...t, text: newText, points: newPoints, targetDuration: newDuration, taskType: newTaskType || t.taskType, scheduledDays: scheduledDays || t.scheduledDays } 
            : t
        )
      }))
    }));
    setEditingTaskId(null);
  };

  const addChunk = (
    name: string, 
    purpose: string, 
    tasks: Task[], 
    scheduleType: 'days' | 'weekly' | 'monthly' | 'yearly' = 'days', 
    scheduledDays: number[] = [0,1,2,3,4,5,6], 
    frequency?: number,
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
      frequency,
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
          if (inactiveDates.includes(todayStr)) {
            return { ...chunk, inactiveDates: inactiveDates.filter(d => d !== todayStr) };
          } else {
            return { ...chunk, inactiveDates: [...inactiveDates, todayStr] };
          }
        }
        return chunk;
      })
    }));
  };

  const getChunkStatus = (chunk: RoutineChunk) => {
    if (chunk.inactiveDates?.includes(todayStr)) return '불활성';
    if (!isChunkScheduledToday(chunk, currentTime, userData)) return '불활성';
    const allFinished = chunk.tasks.every(t => t.completed || t.givenUp);
    if (allFinished) return '전체완료';
    const anyStarted = chunk.tasks.some(t => t.startTime || t.completed || t.givenUp || t.laterTimestamp);
    if (!anyStarted) return '미실행';
    return '일부완료';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '불활성': return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">불활성</span>;
      case '미실행': return <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">미실행</span>;
      case '일부완료': return <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">일부완료</span>;
      case '전체완료': return <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">전체완료</span>;
      default: return null;
    }
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

  const updateWakeUpTime = (time: string) => {
    setConfirmModal({
      isOpen: true,
      title: '기상 시간 변경',
      message: `기상 목표 시간을 ${time}으로 변경하시겠습니까? 오늘 이미 체크인했다면 획득한 포인트와 기록이 초기화됩니다.`,
      onConfirm: () => {
          setUserData(prev => {
            const hasCheckedInToday = prev.lastCheckInDate === todayStr;
            let newPoints = prev.points;
            let newDailyPoints = { ...prev.dailyPoints };
            let newDailyCheckInPoints = { ...prev.dailyCheckInPoints };
            let newHistory = [...prev.history];
            let newLastCheckInDate = prev.lastCheckInDate;

            if (hasCheckedInToday) {
              const pointsToSubtract = prev.dailyCheckInPoints[todayStr] || 0;
              newPoints = Math.max(0, newPoints - pointsToSubtract);
              newDailyPoints[todayStr] = Math.max(0, (newDailyPoints[todayStr] || 0) - pointsToSubtract);
              newDailyCheckInPoints[todayStr] = 0;
              
              // Remove today's history entry
              newHistory = newHistory.filter(h => h.date !== todayStr);
              
              newLastCheckInDate = null; // Allow re-check-in
            }

            return {
              ...prev,
              targetWakeUpTime: time,
              points: newPoints,
              dailyPoints: newDailyPoints,
              dailyCheckInPoints: newDailyCheckInPoints,
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
      title: '리셋 시간 변경',
      message: `하루 리셋 시간을 ${time}으로 변경하시겠습니까?`,
      onConfirm: () => {
        setUserData(prev => ({ ...prev, resetTime: time }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Stats Calculations ---
  const chartData = useMemo(() => {
    return userData.history.slice(-7).map(record => ({
      date: record.date.split('.').slice(1, 3).join('/'),
      minutes: timeToMinutes(record.time),
      displayTime: record.time.slice(0, 5)
    }));
  }, [userData.history]);

  const relativeChartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      last7Days.push({
        date: dateStr.split('-').slice(1, 3).join('/'),
        percentage: userData.dailyCompletionRate[dateStr] || 0
      });
    }
    return last7Days;
  }, [userData.dailyCompletionRate, currentTime]);

  const absoluteChartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      last7Days.push({
        date: dateStr.split('-').slice(1, 3).join('/'),
        points: userData.dailyPoints[dateStr] || 0
      });
    }
    return last7Days;
  }, [userData.dailyPoints, currentTime]);

  const averageWakeUpTime = useMemo(() => {
    if (userData.history.length === 0) return 'N/A';
    const totalMinutes = userData.history.reduce((acc, curr) => acc + timeToMinutes(curr.time), 0);
    return minutesToTime(totalMinutes / userData.history.length);
  }, [userData.history]);

  const checkCheckDiff = currentTime.getTime() - userData.lastCheckCheckTime;
  const isSad = checkCheckDiff >= 30 * 60 * 1000;

  const handleCheckCheckClick = () => {
    if (isSad) {
      setUserData(prev => {
        const currentDaily = prev.dailyPoints[todayStr] || 0;
        const currentCheckCount = prev.dailyCheckCheckCounts[todayStr] || 0;
        return {
          ...prev,
          points: prev.points + 1,
          dailyPoints: {
            ...prev.dailyPoints,
            [todayStr]: currentDaily + 1
          },
          dailyCheckCheckCounts: {
            ...prev.dailyCheckCheckCounts,
            [todayStr]: currentCheckCount + 1
          },
          lastCheckCheckTime: Date.now()
        };
      });
    }
  };

  const challengeDays = useMemo(() => {
    if (!userData.startDate) return 1;
    return getDaysBetween(userData.startDate, todayStr);
  }, [userData.startDate, todayStr]);

  const successDays = userData.history.length;

  const renderSettingsContent = (mode: 'main' | 'modal') => {
    if (settingsSubView.type === 'main') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900">전체설정화면</h2>
          </div>
          <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-grow">
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
              <div className="flex flex-col gap-1 mb-1">
                <h3 className="text-base font-black text-slate-800 whitespace-nowrap ml-1">기상 목표 시간</h3>
                <p className="text-[10px] font-bold text-slate-400 leading-tight ml-1">매일 이 시간에 맞춰 체크인하면 보너스 포인트를 얻습니다.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="time" 
                  defaultValue={userData.targetWakeUpTime}
                  id="wakeUpTimeInput"
                  className="flex-grow text-lg font-black p-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('wakeUpTimeInput') as HTMLInputElement;
                    if (input) updateWakeUpTime(input.value);
                  }}
                  className="bg-indigo-600 text-white px-5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                >
                  변경
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
              <div className="flex flex-col gap-1 mb-1">
                <h3 className="text-base font-black text-slate-800 whitespace-nowrap ml-1">하루 리셋 시간</h3>
                <p className="text-[10px] font-bold text-slate-400 leading-tight ml-1">이 시간이 되면 모든 루틴의 완료 상태가 초기화됩니다.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="time" 
                  defaultValue={userData.resetTime}
                  id="resetTimeInput"
                  className="flex-grow text-lg font-black p-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('resetTimeInput') as HTMLInputElement;
                    if (input) updateResetTime(input.value);
                  }}
                  className="bg-indigo-600 text-white px-5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                >
                  변경
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5 shadow-sm">
              <div className="flex items-center justify-between ml-1">
                <h3 className="text-base font-black text-slate-900">루틴 그룹 관리</h3>
              </div>
              
              <div className="space-y-2">
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
              className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors flex-shrink-0"
            >
              저장하고 닫기
            </button>
          )}
        </div>
      );
    }

    const chunk = userData.routineChunks.find(c => c.id === settingsSubView.chunkId);
    if (!chunk) return null;
    const times = chunkTimeInputs[chunk.id] || { s: chunk.startTime || '', d: chunk.duration || 0, e: chunk.endTime || '' };
    const schedule = chunkScheduleInputs[chunk.id] || { 
      type: chunk.scheduleType || 'days', 
      days: chunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6], 
      freq: chunk.frequency || 1 
    };

    const isDirty = times.s !== (chunk.startTime || '') || 
                    times.d !== (chunk.duration || 0) || 
                    times.e !== (chunk.endTime || '') ||
                    times.alarm !== chunk.isAlarmEnabled ||
                    schedule.type !== (chunk.scheduleType || 'days') ||
                    JSON.stringify(schedule.days) !== JSON.stringify(chunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6]) ||
                    schedule.freq !== (chunk.frequency || 1);

    const renderActionButtons = () => (
      <div className="flex gap-3">
        <button 
          onClick={() => {
            if (isDirty) {
              applyChunkTimes(chunk.id, times.s, times.d, times.e, times.alarm);
              updateChunkSchedule(chunk.id, schedule.type, schedule.days, schedule.freq);
            }
            if (mode === 'modal') {
              setIsSettingsOpen(false);
            } else {
              setSettingsSubView({ type: 'main' });
            }
          }}
          className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-colors"
        >
          저장하고 돌아가기
        </button>
        <button 
          onClick={() => {
            if (mode === 'modal') {
              setIsSettingsOpen(false);
            } else {
              setSettingsSubView({ type: 'main' });
            }
          }}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
        >
          취소하고 돌아가기
        </button>
      </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            {mode === 'main' && (
              <button 
                onClick={() => setSettingsSubView({ type: 'main' })}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            {editingChunkId === chunk.id ? (
              <div className="flex flex-col gap-3 flex-grow">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={editingChunkName}
                    onChange={(e) => setEditingChunkName(e.target.value)}
                    placeholder="그룹 이름"
                    className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      updateChunkInfo(chunk.id, editingChunkName, editingChunkPurpose);
                      setEditingChunkId(null);
                    }}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-xl font-bold text-xs hover:bg-sky-600 transition-colors"
                  >
                    저장
                  </button>
                </div>
                <input 
                  type="text"
                  value={editingChunkPurpose}
                  onChange={(e) => setEditingChunkPurpose(e.target.value)}
                  placeholder="그룹 목적 (예: 아침시간을 낭비하지 않는 사람)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateChunkInfo(chunk.id, editingChunkName, editingChunkPurpose);
                      setEditingChunkId(null);
                    }
                    if (e.key === 'Escape') setEditingChunkId(null);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setEditingChunkId(chunk.id);
                    setEditingChunkName(chunk.name);
                    setEditingChunkPurpose(chunk.purpose || '');
                  }}
                  className="flex flex-col text-left group/header"
                >
                  <h2 className="text-xl font-black text-slate-900 group-hover/header:text-indigo-600 transition-colors">{chunk.name}</h2>
                  <p className="text-xs font-bold text-slate-400 group-hover/header:text-indigo-400 transition-colors">{chunk.purpose}</p>
                </button>
                <div className="flex items-center gap-1">
                  <div className="relative group/tooltip">
                    <button 
                      onClick={() => {
                        setEditingChunkId(chunk.id);
                        setEditingChunkName(chunk.name);
                        setEditingChunkPurpose(chunk.purpose || '');
                      }}
                      className="p-2 text-slate-300 hover:text-sky-500 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      정보 수정
                    </div>
                  </div>
                  <div className="relative group/tooltip">
                    <button 
                      onClick={() => {
                        deleteChunk(chunk.id, () => {
                          if (mode === 'modal') {
                            setIsSettingsOpen(false);
                            setActiveTab('home');
                            setSelectedChunkId(null);
                          } else {
                            setSettingsSubView({ type: 'main' });
                          }
                        });
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      삭제
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-4">
            <div className="space-y-4">
  
              {/* Time Settings */}
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">시간 및 알람 설정</label>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">알람</span>
                    <button 
                      onClick={() => setChunkTimeInputs(prev => ({ ...prev, [chunk.id]: { ...prev[chunk.id], alarm: !times.alarm } }))}
                      className={`w-9 h-4.5 rounded-full transition-all relative ${times.alarm ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${times.alarm ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">시작 시각</label>
                    <input 
                      type="time"
                      value={times.s}
                      onChange={(e) => {
                        const newS = e.target.value;
                        let newE = times.e;
                        if (newS && times.d > 0) {
                          newE = minutesToTime(timeToMinutes(newS) + times.d);
                        }
                        setChunkTimeInputs(prev => ({ ...prev, [chunk.id]: { ...prev[chunk.id], s: newS, e: newE } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">소요 시간(분)</label>
                    <input 
                      type="number"
                      value={times.d || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newD = val === '' ? 0 : parseInt(val);
                        let newE = times.e;
                        if (times.s && newD > 0) {
                          newE = minutesToTime(timeToMinutes(times.s) + newD);
                        }
                        setChunkTimeInputs(prev => ({ ...prev, [chunk.id]: { ...prev[chunk.id], d: newD, e: newE } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">완료 시각</label>
                    <input 
                      type="time"
                      value={times.e}
                      onChange={(e) => {
                        const newE = e.target.value;
                        setChunkTimeInputs(prev => ({ ...prev, [chunk.id]: { ...prev[chunk.id], e: newE } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                </div>
              </div>
  
              {/* Schedule Settings */}
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">실행 주기</label>
                    <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                      {(['days', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setChunkScheduleInputs(prev => ({ ...prev, [chunk.id]: { ...schedule, type: t } }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            schedule.type === t 
                              ? 'bg-indigo-500 text-white shadow-sm' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {t === 'days' ? '요일' : t === 'weekly' ? '주간' : t === 'monthly' ? '월간' : '연간'}
                        </button>
                      ))}
                    </div>
                  </div>
  
                  {schedule.type === 'days' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between gap-1">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const newDays = schedule.days.includes(i)
                                ? schedule.days.filter(d => d !== i)
                                : [...schedule.days, i].sort();
                              setChunkScheduleInputs(prev => ({ ...prev, [chunk.id]: { ...schedule, days: newDays } }));
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              schedule.days.includes(i)
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-600">
                          {schedule.type === 'weekly' ? '주' : schedule.type === 'monthly' ? '월' : '연'} {schedule.freq}회 실행
                        </span>
                        <input 
                          type="range"
                          min="1"
                          max={schedule.type === 'weekly' ? 7 : schedule.type === 'monthly' ? 31 : 12}
                          value={schedule.freq}
                          onChange={(e) => setChunkScheduleInputs(prev => ({ ...prev, [chunk.id]: { ...schedule, freq: parseInt(e.target.value) } }))}
                          className="w-32 accent-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <h3 className="text-base font-black text-slate-900">루틴 목록</h3>
              </div>
              
              <div className="space-y-2">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, chunk.id)}
                >
                  <SortableContext 
                    items={chunk.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {chunk.tasks.map((task, index) => (
                      <SortableTaskItem 
                        key={task.id}
                        task={task}
                        index={index}
                        editingTaskId={editingTaskId}
                        setEditingTaskId={setEditingTaskId}
                        editingTaskText={editingTaskText}
                        setEditingTaskText={setEditingTaskText}
                        editingTaskPoints={editingTaskPoints}
                        setEditingTaskPoints={setEditingTaskPoints}
                        editingTaskDuration={editingTaskDuration}
                        setEditingTaskDuration={setEditingTaskDuration}
                        editingTaskType={editingTaskType}
                        setEditingTaskType={setEditingTaskType}
                        editingTaskScheduledDays={editingTaskScheduledDays}
                        setEditingTaskScheduledDays={setEditingTaskScheduledDays}
                        updateTask={updateTask}
                        deleteTask={deleteTask}
                        PointSelector={PointSelector}
                        chunkScheduledDays={schedule.days}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
  
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">새 루틴 추가</p>
                  <input 
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="루틴 이름 입력..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
                    <div className="flex items-center gap-1">
                      {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                        const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                        const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickIcon : Hourglass;
                        return (
                          <button 
                            key={type}
                            onClick={() => setNewTaskType(type)}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${newTaskType === type ? `${colorClass} text-white shadow-md` : 'bg-white text-slate-400 border border-slate-100'}`}
                          >
                            <Icon className="w-3 h-3" />
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">포인트</span>
                      <PointSelector value={newTaskPoints} onChange={setNewTaskPoints} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">소요 시간(분)</span>
                      <input 
                        type="number"
                        value={newTaskDuration || ''}
                        onChange={(e) => setNewTaskDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveChunkId(chunk.id);
                    addTask(chunk.id);
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  루틴 추가하기
                </button>
              </div>
            </div>
          </div>
  
          <div className="mt-4 flex-shrink-0">
            {renderActionButtons()}
          </div>
        </div>
    );
  };

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    });
  }, [currentTime]);

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
      <div className="sticky top-0 z-40 bg-[#F7FEE7]/80 backdrop-blur-md pt-3 pb-1.5 px-4">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveTab('home');
                setSelectedChunkId(null);
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-xl ${activeTab === 'home' && !selectedChunkId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'}`}
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('stats');
                setSelectedChunkId(null);
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-xl ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'}`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubView({ type: 'main' });
                setSelectedChunkId(null);
                setIsSettingsOpen(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
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
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                activeTab === 'add'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-slate-400 hover:text-indigo-400 border border-slate-100 shadow-sm'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
            </button>

            {/* Check-Check Box in Nav */}
            <button 
              onClick={handleCheckCheckClick}
              className={`transition-all w-10 h-10 flex flex-col items-center justify-center rounded-xl border shadow-sm relative overflow-hidden ${
                isSad 
                  ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                  : 'bg-white border-slate-100 cursor-default'
              }`}
            >
              <span className="text-xl leading-none">
                {isSad ? '😞' : '😊'}
              </span>
              <span className="text-[8px] font-black text-slate-500 mt-0.5">
                {userData.dailyCheckCheckCounts[todayStr] || 0}
              </span>
              {isSad && (
                <div className="absolute top-1 right-1">
                  <span className="flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                </div>
              )}
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-3 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <HeaderBox 
                userData={userData}
                todayStr={todayStr}
                formattedDate={formattedDate}
                weather={weather}
                challengeDays={challengeDays}
                successDays={successDays}
                currentTime={currentTime}
              />
              <HomeView 
                userData={userData}
                setUserData={setUserData}
                currentTime={currentTime}
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
                chartData={chartData} 
                relativeChartData={relativeChartData}
                absoluteChartData={absoluteChartData}
                averageWakeUpTime={averageWakeUpTime} 
                activeStatsTab={activeStatsTab}
                setActiveStatsTab={setActiveStatsTab}
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
                todayStr={todayStr}
                toggleTask={toggleTask}
                togglePauseTask={togglePauseTask}
                laterTask={laterTask}
                giveUpTask={giveUpTask}
                startTask={startTask}
                onRestart={onRestart}
                resetChunk={resetChunk}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
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
              <AddRoutineGroupView 
                addChunk={addChunk}
                setActiveTab={setActiveTab}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
                userData={userData}
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
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
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
          className="fixed bottom-8 left-4 right-4 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-[60] flex items-center justify-between cursor-pointer border border-white/20 backdrop-blur-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              >
                <Timer className="w-6 h-6" />
              </motion.div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">현재 진행 중</span>
              <span className="text-sm font-black truncate max-w-[150px]">{globalActiveTask.task.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xl font-black tabular-nums">
              {(() => {
                const task = globalActiveTask.task;
                let currentSession = 0;
                if (task.startTime && !task.isPaused) {
                  const [h, m, s] = task.startTime.split(':').map(Number);
                  const start = new Date(currentTime);
                  start.setHours(h, m, s, 0);
                  if (start.getTime() > currentTime.getTime()) {
                    start.setDate(start.getDate() - 1);
                  }
                  currentSession = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
                }
                const total = (task.accumulatedDuration || 0) + currentSession;
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-50 shadow-2xl max-w-2xl mx-auto overflow-hidden flex flex-col"
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-[70] shadow-2xl w-[90%] max-w-sm"
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
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                  >
                    확인
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
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto text-center space-y-6 border border-indigo-100">
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
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> 루틴 시작하기
                  </button>
                  <button 
                    onClick={() => setActiveAlarmChunk(null)}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
