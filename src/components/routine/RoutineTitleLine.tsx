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
  CircleMinus,
  X
} from 'lucide-react';
import { Task, TaskType, TaskStatus } from '../../types';
import { calculateTaskDuration } from '../../utils';
import phrases from '../../phrases.json';

import { voiceService } from '../../services/voiceService';

interface RoutineTitleLineProps {
  task: Task;
  index: number;
  currentTime: Date;
  chunkTasks: Task[];
  onRestart?: (id: string) => void;
  onDoFirst?: (id: string) => void;
  isLocked?: boolean;
  activeTaskId?: string;
  isScheduledToday?: boolean;
  onActivate?: (id: string) => void;
  chunkScheduledDays?: number[];
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
  activeTaskId,
  isScheduledToday = true,
  onActivate,
  chunkScheduledDays = [0, 1, 2, 3, 4, 5, 6]
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

  if (!isScheduledToday) {
    iconColor = "text-slate-200";
    statusIcon = (
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Circle className={`absolute inset-0 w-full h-full ${iconColor}`} />
        <X className="w-3 h-3 text-slate-400" strokeWidth={4} />
      </div>
    );
  } else if (task.status === TaskStatus.PERFECT) {
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
  } else if (task.status === TaskStatus.SKIP) {
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

  const isActuallyCompleted = task.completed || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.PERFECT;
  const isSkip = task.status === TaskStatus.SKIP;
  const isDone = isActuallyCompleted || isSkip;
  
  const showRestart = onRestart && isActuallyCompleted;
  
  // "Start/Resume" button logic
  const showStartResume = onDoFirst && 
    task.id !== activeTaskId && 
    !isLocked &&
    isScheduledToday;

  const showActivate = onActivate && !isScheduledToday;

  let startResumeLabel = '';
  if (task.laterTimestamp || isSkip || (!task.startTime && !task.isPaused && !isActuallyCompleted)) {
    startResumeLabel = '시작하기';
  } else if (task.isPaused || isActuallyCompleted) {
    startResumeLabel = '이어하기';
  } else {
    startResumeLabel = '시작하기';
  }

  const targetDuration = task.targetDuration || task.duration || 0;

  const currentTaskSchedule = task.scheduledDays || [0, 1, 2, 3, 4, 5, 6];
  const isScheduleDifferent = JSON.stringify([...currentTaskSchedule].sort()) !== JSON.stringify([...chunkScheduledDays].sort());

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  // Sunday is 0 in JS Date, but we list Mon-Sun. 
  // Map index 0->월(1), 1->화(2), 2->수(3), 3->목(4), 4->금(5), 5->토(6), 6->일(0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  const inExecution = !!onDoFirst;

  const ScheduleRow = () => (
    <div className="flex items-center gap-1 mt-1 ml-[52px]">
      {dayOrder.map((dayNum, i) => {
        const isScheduled = currentTaskSchedule.includes(dayNum);
        return (
          <div 
            key={dayNum}
            className={`relative flex items-center justify-center w-[18px] h-[18px] rounded-full border flex-shrink-0 transition-all ${
              isScheduled 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-slate-50 border-slate-100 text-slate-300'
            }`}
          >
            <span className="text-[9px] font-black z-10">{days[i]}</span>
            {!isScheduled && (
              <X className="absolute w-full h-full text-slate-300/60" strokeWidth={5} />
            )}
          </div>
        );
      })}
    </div>
  );

  const TimeBadge = () => (
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
      ) : isSkip ? (
        <span>0 / {targetDuration}분</span>
      ) : (task.startTime || task.isPaused) ? (
        <span>{formatTime(calculateCurrentDuration(task))} / {targetDuration}분</span>
      ) : (
        <span>{targetDuration}분</span>
      )}
    </div>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-2 ml-auto justify-end">
      {showActivate && (
        <button
          onClick={(e) => {
            voiceService.unlock();
            e.stopPropagation();
            onActivate(task.id);
          }}
          className="flex-shrink-0 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-black hover:bg-amber-100 transition-all"
        >
          활성화하기
        </button>
      )}

      {showStartResume && (
        <button
          onClick={(e) => {
            voiceService.unlock();
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
            voiceService.unlock();
            e.stopPropagation();
            onRestart(task.id);
          }}
          className="flex-shrink-0 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black hover:bg-indigo-100 transition-all"
        >
          다시하기
        </button>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col w-full ${!isScheduledToday ? 'opacity-50' : ''} ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Mobile Layout - Only apply vertical break in execution view */}
      <div className={`sm:hidden flex flex-col w-full text-sm ${!inExecution ? 'hidden' : ''}`}>
        {/* Row 1: Status, Number, Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            {statusIcon}
            <span className="font-bold w-4 text-center">{index + 1}.</span>
          </div>
          <div className={`flex items-center gap-2 min-w-0 flex-grow`}>
            <span 
              className={`font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}
            >
              {index === 0 && "⚡"}{task.text}
            </span>
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex-shrink-0">
                <CheckCircle2 className="w-2 h-2" />
                <span>체크리스트</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Time (Left), Buttons (Right) */}
        <div className="flex items-center mt-1 ml-[52px]">
          <TimeBadge />
          <ActionButtons />
        </div>

        {/* Optional Row 3: Schedule (if different and in execution view) */}
        {inExecution && isScheduleDifferent && <ScheduleRow />}
      </div>

      {/* Desktop Layout or Home Mobile (Horizontal Layout) */}
      <div className={`${inExecution ? 'hidden sm:flex' : 'flex'} flex-col w-full text-sm`}>
        <div className={`flex items-center gap-3 w-full ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
          <div className="flex items-center gap-2 flex-shrink-0">
            {statusIcon}
            <span className="font-bold w-4 text-center">{index + 1}.</span>
          </div>
          
          <div className="flex items-center gap-2 min-w-0 flex-grow">
            <span 
              className={`font-bold truncate max-w-[200px] ${isDone ? 'line-through' : ''}`}
            >
              {index === 0 && "⚡"}{task.text}
            </span>
            
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex-shrink-0">
                <CheckCircle2 className="w-2 h-2" />
                <span>체크리스트</span>
              </div>
            )}

            <TimeBadge />
          </div>

          <ActionButtons />
        </div>

        {/* Optional Row 2: Schedule (if different and in execution view) */}
        {inExecution && isScheduleDifferent && <ScheduleRow />}
      </div>
    </div>
  );
};
