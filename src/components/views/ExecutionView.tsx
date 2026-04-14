import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  CheckCheck,
  Check,
  Clock, 
  Zap, 
  AlertCircle,
  Timer,
  SkipForward,
  XCircle,
  Settings,
  Hourglass,
  BrickWall,
  Target,
  Circle,
  CircleMinus
} from 'lucide-react';
import { getJosa, calculateTaskDuration } from '../../utils';
import { ExecutionViewProps, TaskStatus, TaskType, Task } from '../../types';

const DoubleCheckCircle = ({ className }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <Circle className="w-full h-full" />
    <div className="absolute inset-0 flex items-center justify-center">
      <Check className="w-[60%] h-[60%] -translate-x-[2px]" strokeWidth={4} />
      <Check className="w-[60%] h-[60%] translate-x-[2px]" strokeWidth={4} />
    </div>
  </div>
);

export const ExecutionView: React.FC<ExecutionViewProps> = ({
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
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const calculateCurrentDuration = (task: Task) => {
    return calculateTaskDuration(task, currentTime);
  };

  const activeTask = tasks.find(t => t.startTime && !t.isPaused && !t.completed && !t.givenUp);
  const otherTasks = tasks.filter(t => t.id !== activeTask?.id);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('home')}
          className="p-3 bg-white rounded-[10px] text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center overflow-hidden px-2 flex-grow">
          <h2 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
            {/* 루틴그룹 제목 스타일 설정 (글자 색, 크기 등) */}
            <span style={{ color: '#0f172a', fontSize: '1.25rem' }}>
              {chunk.purpose}{getJosa(chunk.purpose || '', '이/가')} 되기 위한 {chunk.name}
            </span>
            <button 
              onClick={() => {
                setSettingsSubView({ type: 'detail', chunkId: chunk.id });
                setIsSettingsOpen(true);
              }}
              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-[10px] transition-all ml-1 align-middle"
            >
              <Settings className="w-5 h-5" />
            </button>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">루틴 수행 중</p>
        </div>
        <div className="w-[52px]" /> {/* Spacer to balance the back button */}
      </div>

      {/* Progress Card */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-[10px] flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-black text-slate-900">진행률</span>
          </div>
          <span className="text-lg font-black text-indigo-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>{completedCount} 완료</span>
          <span>{tasks.length - completedCount} 남음</span>
        </div>
      </div>

      {/* Active Task Box */}
      {activeTask && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-600 rounded-[20px] p-6 text-white shadow-2xl shadow-indigo-200 space-y-6"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">현재 진행 중</span>
              <h3 className="text-2xl font-black tracking-tight">{activeTask.text}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-[15px] backdrop-blur-sm">
              <Timer className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="text-6xl font-black tabular-nums tracking-tighter">
              {formatTime(calculateCurrentDuration(activeTask))}
            </div>
            <div className="text-indigo-200 font-bold text-sm">
              목표: {activeTask.targetDuration}분
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => togglePauseTask(activeTask.id)}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-[15px] backdrop-blur-sm transition-all flex items-center justify-center gap-2 font-black text-sm"
            >
              <Pause className="w-5 h-5 fill-current" /> 일시정지
            </button>
            {(() => {
              const currentDuration = calculateCurrentDuration(activeTask);
              const targetSeconds = (activeTask.targetDuration || 0) * 60;
              let isPerfect = false;
              if (activeTask.taskType === TaskType.TIME_LIMITED) {
                isPerfect = currentDuration <= targetSeconds;
              } else if (activeTask.taskType === TaskType.TIME_ACCUMULATED) {
                isPerfect = currentDuration >= targetSeconds;
              }

              return (
                <button 
                  onClick={() => toggleTask(activeTask.id)}
                  className="flex-[2] py-4 bg-white text-indigo-600 hover:bg-indigo-50 rounded-[15px] transition-all flex items-center justify-center gap-2 font-black text-sm shadow-lg shadow-indigo-900/20"
                >
                  {isPerfect ? (
                    <>
                      <DoubleCheckCircle className="w-5 h-5" />
                      완벽
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      완료
                    </>
                  )}
                </button>
              );
            })()}
          </div>

          <div className="flex gap-2 pt-4 border-t border-white/10">
            <button 
              onClick={() => laterTask(activeTask.id)}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <SkipForward className="w-3 h-3" /> 나중에 하기
            </button>
            <button 
              onClick={() => giveUpTask(activeTask.id)}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-3 h-3" /> 포기하기
            </button>
          </div>
        </motion.div>
      )}

      {/* Remaining Tasks List */}
      <div className="space-y-2 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">나머지 루틴 목록</h3>
        {otherTasks.map((task, index) => {
          const isPaused = task.isPaused;
          const isCompleted = task.completed;
          const isPerfect = task.status === TaskStatus.PERFECT;
          const isLater = !!task.laterTimestamp;
          const isSkip = task.status === TaskStatus.SKIP || task.givenUp;
          const targetDuration = task.targetDuration || 0;

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`group bg-white rounded-[15px] p-4 border transition-all ${
                isCompleted ? 'border-emerald-100 bg-emerald-50/20' :
                isSkip ? 'border-rose-100 bg-rose-50/20 opacity-60' :
                'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-grow">
                  <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors ${
                    isPerfect ? 'bg-indigo-500 text-white' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isSkip ? 'bg-[#CC9900] text-white' :
                    isPaused ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {isPerfect ? <DoubleCheckCircle className="w-4 h-4" /> :
                     isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                     isSkip ? <CircleMinus className="w-4 h-4" /> :
                     isPaused ? <Pause className="w-4 h-4 fill-current" /> :
                     <span className="text-xs font-black">{tasks.indexOf(task) + 1}</span>}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-black text-sm truncate ${
                        isCompleted || isSkip ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}>
                        {task.text}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                        {targetDuration}분
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-auto justify-end">
                  {(() => {
                    const buttons = [];
                    if (isCompleted || isPerfect) {
                      buttons.push(
                        <button 
                          key="resume"
                          onClick={() => startTask(task.id, false)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-[8px] text-[10px] font-black hover:bg-indigo-100 transition-all"
                        >
                          이어하기
                        </button>,
                        <button 
                          key="restart"
                          onClick={() => startTask(task.id, true)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-[8px] text-[10px] font-black hover:bg-slate-200 transition-all"
                        >
                          다시하기
                        </button>
                      );
                    } else if (isPaused) {
                      buttons.push(
                        <button 
                          key="resume"
                          onClick={() => startTask(task.id, false)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-[8px] text-[10px] font-black hover:bg-indigo-700 transition-all"
                        >
                          이어하기
                        </button>
                      );
                    } else {
                      // NOT_STARTED, LATER, SKIP
                      buttons.push(
                        <button 
                          key="start"
                          onClick={() => startTask(task.id, true)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-[8px] text-[10px] font-black hover:bg-indigo-700 transition-all"
                        >
                          시작하기
                        </button>
                      );
                    }
                    return buttons;
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button 
          onClick={() => resetChunk(chunk.id)}
          className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-[10px] font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> 전체 초기화
        </button>
        <button 
          onClick={() => setActiveTab('home')}
          className="flex-[2] py-4 bg-indigo-600 text-white rounded-[10px] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          수행 완료
        </button>
      </div>
    </div>
  );
};
