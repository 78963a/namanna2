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
  BrickWall,
  Check,
  CheckCheck,
  CircleMinus
} from 'lucide-react';
import { Task, TaskType, TaskStatus } from '../../types';
import { calculateTaskDuration } from '../../utils';
import phrases from '../../../phrases.json';

interface RoutineTitleLineProps {
  task: Task;
  index: number;
  currentTime: Date;
  chunkTasks: Task[];
  onRestart?: (id: string) => void;
  onDoFirst?: (id: string) => void;
  isLocked?: boolean;
  activeTaskId?: string;
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
  isLocked,
  activeTaskId
}) => {
  /**
   * Formats a duration in seconds into a compact time string (m:ss).
   * 
   * @param {number} seconds - The duration in seconds
   * @returns {string} The formatted time string
   */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const calculateCurrentDuration = (task: Task) => {
    return calculateTaskDuration(task, currentTime);
  };

  // Determine the appropriate status icon and color based on the task's current state
  let iconColor = "text-slate-200";
  let statusIcon = <Circle className={`w-5 h-5 ${iconColor}`} />;
  
  if (task.status === TaskStatus.PERFECT) {
    iconColor = "text-indigo-600";
    statusIcon = (
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
        <CheckCheck className={`absolute w-[60%] h-[60%] ${iconColor}`} strokeWidth={3} />
      </div>
    );
  } else if (task.completed || task.status === TaskStatus.COMPLETED) {
    iconColor = "text-indigo-600";
    statusIcon = (
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
        <Check className={`w-3 h-3 ${iconColor}`} strokeWidth={3} />
      </div>
    );
  } else if (task.givenUp || task.status === TaskStatus.SKIP) {
    iconColor = "text-[#CC9900]";
    statusIcon = <CircleMinus className={`w-5 h-5 ${iconColor}`} />;
  } else if (task.laterTimestamp) {
    iconColor = "text-slate-400";
    statusIcon = <ArrowRightCircle className={`w-5 h-5 ${iconColor}`} />;
  } else if (task.isPaused) {
    iconColor = "text-amber-400";
    statusIcon = <PauseCircle className={`w-5 h-5 ${iconColor}`} />;
  } else if (task.startTime) {
    iconColor = "text-indigo-500 animate-pulse";
    statusIcon = <CircleDot className={`w-5 h-5 ${iconColor}`} />;
  }

  const isCompleted = task.completed || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.PERFECT;
  const isGivenUp = task.givenUp || task.status === TaskStatus.SKIP;
  
  const showRestart = onRestart && isCompleted;
  
  // "Start/Resume" button logic
  const showStartResume = onDoFirst && 
    task.id !== activeTaskId && 
    !isLocked;

  let startResumeLabel = '';
  if (task.isPaused || isCompleted) {
    startResumeLabel = '이어하기';
  } else {
    startResumeLabel = '시작하기';
  }

  const targetDuration = task.targetDuration || task.duration || 0;

  return (
    <div className={`flex items-center gap-3 text-sm w-full ${task.completed || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.PERFECT ? 'text-slate-400' : 'text-slate-700'} ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2 flex-shrink-0">
        {statusIcon}
        <span className="font-bold w-4 text-center">{index + 1}.</span>
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-grow">
        <span 
          className={`font-bold truncate max-w-[120px] sm:max-w-[200px] ${task.completed ? 'line-through' : ''}`}
          style={{ fontFamily: phrases.settings.base_style.fontFamily ? `'${phrases.settings.base_style.fontFamily}', sans-serif` : 'inherit' }}
        >
          {index === 0 && "⚡"}{task.text}
        </span>
        
        {task.checklist && task.checklist.length > 0 && (
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex-shrink-0">
            <CheckCircle2 className="w-2 h-2" />
            <span>체크리스트</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-[10px] font-black text-[8px] uppercase tracking-widest">
              {task.taskType === TaskType.TIME_INDEPENDENT ? (
                <Clock className="w-2.5 h-2.5 text-sky-400" />
              ) : task.taskType === TaskType.TIME_ACCUMULATED ? (
                <BrickWall className="w-2.5 h-2.5 text-pink-400" />
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
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto justify-end">
        {showStartResume && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDoFirst(task.id);
            }}
            className="flex-shrink-0 px-2 py-1 bg-sky-50 text-sky-600 rounded-md text-[10px] font-black hover:bg-sky-100 transition-all"
          >
            {startResumeLabel}
          </button>
        )}

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
      </div>
    </div>
  );
};
