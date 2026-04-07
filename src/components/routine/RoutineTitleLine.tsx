import React from 'react';
import { 
  Circle, 
  CheckCircle2, 
  XCircle, 
  ArrowRightCircle, 
  PauseCircle, 
  CircleDot, 
  Clock, 
  Hourglass, 
  Trophy 
} from 'lucide-react';
import { Task, TaskType } from '../../types';
import { BrickIcon } from '../common/Icons';

interface RoutineTitleLineProps {
  task: Task;
  index: number;
  currentTime: Date;
  chunkTasks: Task[];
  onRestart?: (id: string) => void;
  onDoFirst?: (id: string) => void;
  isLocked?: boolean;
}

/**
 * A single line item representing a task within a routine list.
 * Displays the task's status, name, duration, and points.
 * Provides optional actions like "Restart" or "Do First".
 * 
 * @param {RoutineTitleLineProps} props - Component properties
 * @returns {JSX.Element} The rendered routine title line
 */
export const RoutineTitleLine: React.FC<RoutineTitleLineProps> = ({ 
  task, 
  index, 
  currentTime,
  chunkTasks,
  onRestart,
  onDoFirst,
  isLocked
}) => {
  /**
   * Formats a duration in seconds into a compact time string (m:ss).
   * 
   * @param {number} seconds - The duration in seconds
   * @returns {string} The formatted time string
   */
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

  // Determine the appropriate status icon and color based on the task's current state
  let Icon = Circle;
  let iconColor = "text-slate-200";
  
  if (task.completed) {
    Icon = CheckCircle2;
    iconColor = "text-indigo-600";
  } else if (task.givenUp) {
    Icon = XCircle;
    iconColor = "text-rose-400";
  } else if (task.laterTimestamp) {
    Icon = ArrowRightCircle;
    iconColor = "text-slate-400";
  } else if (task.isPaused) {
    Icon = PauseCircle;
    iconColor = "text-amber-400";
  } else if (task.startTime) {
    Icon = CircleDot;
    iconColor = "text-indigo-500 animate-pulse";
  }

  const showRestart = onRestart && (task.isPaused || task.laterTimestamp || task.givenUp);
  const showDoFirst = onDoFirst && !task.startTime && !task.completed && !task.givenUp && !task.laterTimestamp && !isLocked;

  const targetDuration = task.targetDuration || task.duration || 0;

  return (
    <div className={`flex items-center gap-3 text-sm w-full ${task.completed ? 'text-slate-400' : 'text-slate-700'} ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="font-bold w-4 text-center">{index + 1}.</span>
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className={`font-bold truncate max-w-[120px] sm:max-w-[200px] ${task.completed ? 'line-through' : ''}`}>
          {index === 0 && "⚡"}{task.text}{task.isClosingRoutine && "🥇"}
        </span>
        
        {task.checklist && task.checklist.length > 0 && (
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex-shrink-0">
            <CheckCircle2 className="w-2 h-2" />
            <span>체크리스트</span>
          </div>
        )}

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
            ) : task.startTime ? (
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

      {showRestart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestart(task.id);
            }}
            className="flex-shrink-0 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black hover:bg-indigo-100 transition-all"
          >
            다시하기
          </button>
        )}

        {showDoFirst && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDoFirst(task.id);
            }}
            className="flex-shrink-0 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-black hover:bg-amber-100 transition-all"
          >
            먼저하기
          </button>
        )}
      </div>
  );
};
