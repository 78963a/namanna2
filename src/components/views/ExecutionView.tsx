import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertCircle,
  Timer,
  SkipForward,
  XCircle,
  Settings,
  Hourglass,
  Trophy,
  Target
} from 'lucide-react';
import { ExecutionViewProps, TaskStatus, TaskType, Task } from '../../types';
import { BrickIcon } from '../common/Icons';

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

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('home')}
          className="p-3 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{chunk.name}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">루틴 수행 중</p>
        </div>
        <button 
          onClick={() => {
            setSettingsSubView({ type: 'detail', chunkId: chunk.id });
            setIsSettingsOpen(true);
          }}
          className="p-3 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
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

      {/* Tasks List */}
      <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map((task, index) => {
          const isActive = task.startTime && !task.isPaused && !task.completed && !task.givenUp;
          const isPaused = task.isPaused;
          const targetDuration = task.targetDuration || 0;

          const formatTime = (seconds: number) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
          };

          const calculateCurrentDuration = (task: Task) => {
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
            return (task.accumulatedDuration || 0) + currentSession;
          };

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group bg-white rounded-3xl p-4 border transition-all ${
                task.completed ? 'border-emerald-100 bg-emerald-50/30' :
                task.givenUp ? 'border-rose-100 bg-rose-50/30 opacity-60' :
                isActive ? 'border-indigo-500 shadow-xl shadow-indigo-100 ring-2 ring-indigo-500/10' :
                'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-grow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed ? 'bg-emerald-500 text-white' :
                    task.givenUp ? 'bg-rose-500 text-white' :
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.completed ? <CheckCircle2 className="w-5 h-5" /> :
                     task.givenUp ? <XCircle className="w-5 h-5" /> :
                     isActive ? <Timer className="w-5 h-5" /> : <span className="text-sm font-black">{index + 1}</span>}
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-black tracking-tight ${
                        task.completed ? 'text-emerald-700 line-through' :
                        task.givenUp ? 'text-rose-700 line-through' :
                        'text-slate-900'
                      }`}>
                        {task.text}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest">
                          {task.taskType === TaskType.TIME_INDEPENDENT ? (
                            <Clock className="w-2.5 h-2.5 text-sky-400" />
                          ) : task.taskType === TaskType.TIME_ACCUMULATED ? (
                            <BrickIcon className="w-2.5 h-2.5 text-pink-400" />
                          ) : (
                            <Hourglass className="w-2.5 h-2.5 text-indigo-400" />
                          )}
                          {task.completed ? (
                            <span>{formatTime(task.duration || 0)} / {targetDuration}분</span>
                          ) : isActive ? (
                            <span>{formatTime(calculateCurrentDuration(task))} / {targetDuration}분</span>
                          ) : (
                            <span>{targetDuration}분</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest">
                          <Trophy className="w-2.5 h-2.5" />
                          {task.completed ? (
                            <span>{task.earnedPoints || 0} / {task.points || 0}P</span>
                          ) : (
                            <span>{task.points || 0}P</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-black tabular-nums">
                            {formatTime(calculateCurrentDuration(task))}
                          </span>
                        </div>
                        {isPaused && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                            일시정지됨
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!task.completed && !task.givenUp && !isActive && (
                    <button 
                      onClick={() => startTask(task.id)}
                      className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  )}

                  {isActive && (
                    <>
                      <button 
                        onClick={() => togglePauseTask(task.id)}
                        className={`p-3 rounded-2xl transition-all ${isPaused ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-amber-500 text-white shadow-amber-100'} shadow-lg`}
                      >
                        {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                      </button>
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {(task.completed || task.givenUp) && (
                    <button 
                      onClick={() => onRestart(task.id)}
                      className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {isActive && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => laterTask(task.id)}
                    className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <SkipForward className="w-3 h-3" /> 나중에 하기
                  </button>
                  <button 
                    onClick={() => giveUpTask(task.id)}
                    className="flex-1 py-2 bg-rose-50 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-3 h-3" /> 포기하기
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button 
          onClick={() => resetChunk(chunk.id)}
          className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> 전체 초기화
        </button>
        <button 
          onClick={() => setActiveTab('home')}
          className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          수행 완료
        </button>
      </div>
    </div>
  );
};
