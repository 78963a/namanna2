/**
 * @file RoutineTitleLine.tsx
 * @description A single line item representing a task within a routine chunk.
 */

import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  CircleDot, 
  PauseCircle, 
  ArrowRightCircle, 
  XCircle, 
  Clock, 
  Hourglass, 
  Trophy 
} from 'lucide-react';
import { Task, TaskType } from '../../types';
import { BrickIcon } from './Icons';
import { formatDurationPrecise } from '../../utils';

interface RoutineTitleLineProps {
  /** The task object to display. */
  task: Task;
  /** The position of the task in the list. */
  index: number;
  /** The current system time. */
  currentTime: Date;
  /** All tasks in the current chunk (for context). */
  chunkTasks: Task[];
  /** Callback to restart a paused or deferred task. */
  onRestart?: (id: string) => void;
  /** Callback to prioritize a task. */
  onDoFirst?: (id: string) => void;
  /** Whether the task is currently locked (e.g., another task is running). */
  isLocked?: boolean;
}

/**
 * RoutineTitleLine displays task details including status icons, duration, and points.
 */
export const RoutineTitleLine = ({ 
  task, 
  index, 
  currentTime, 
  chunkTasks,
  onRestart,
  onDoFirst,
  isLocked
}: RoutineTitleLineProps) => {
  // Determine the appropriate status icon and color
  let StatusIcon = Circle;
  let iconColor = "text-slate-200";
  
  if (task.completed) {
    StatusIcon = CheckCircle2;
    iconColor = "text-indigo-600";
  } else if (task.givenUp) {
    StatusIcon = XCircle;
    iconColor = "text-rose-400";
  } else if (task.laterTimestamp) {
    StatusIcon = ArrowRightCircle;
    iconColor = "text-slate-400";
  } else if (task.isPaused) {
    StatusIcon = PauseCircle;
    iconColor = "text-amber-400";
  } else if (task.startTime) {
    StatusIcon = CircleDot;
    iconColor = "text-indigo-500 animate-pulse";
  }

  const canRestart = onRestart && (task.isPaused || task.laterTimestamp || task.givenUp);
  const canPrioritize = onDoFirst && !task.startTime && !task.completed && !task.givenUp && !task.laterTimestamp && !isLocked;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm w-full ${task.completed ? 'text-slate-400' : 'text-slate-700'} ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3 flex-grow min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-bold w-4 text-center">{index + 1}.</span>
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold truncate ${task.completed ? 'line-through' : ''}`}>
              {index === 0 && "⚡"}{task.text}{task.isClosingRoutine && "🥇"}
            </span>
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter">
                <CheckCircle2 className="w-2 h-2" />
                <span>체크리스트</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-10 sm:ml-0">
        {canRestart && (
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

        {canPrioritize && (
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold text-[10px]">
            {task.taskType === TaskType.TIME_INDEPENDENT ? (
              <Clock className="w-3 h-3 text-sky-500" />
            ) : task.taskType === TaskType.TIME_ACCUMULATED ? (
              <BrickIcon className="w-3 h-3 text-pink-500" />
            ) : (
              <Hourglass className="w-3 h-3 text-indigo-600" />
            )}
            {task.completed ? (
              <span>{formatDurationPrecise(task.duration || 0)} / {task.targetDuration}분</span>
            ) : (
              <span>{task.targetDuration}분</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold text-[10px]">
            <Trophy className="w-3 h-3" />
            {task.completed ? (
              <span>{task.earnedPoints || 0} / {task.points}P</span>
            ) : (
              <span>{task.points}P</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
