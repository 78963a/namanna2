import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Clock, Hourglass, Trophy } from 'lucide-react';
import { Task, TaskType } from '../../types';
import { BrickIcon } from '../common/Icons';

interface SortableRoutineItemProps {
  task: Task;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: (task: Task) => void;
  onOpenChecklist: (taskId: string) => void;
}

/**
 * A draggable item representing a task in the "Add Routine Group" view.
 * Allows for reordering and editing tasks during group creation.
 * 
 * @param {SortableRoutineItemProps} props - Component properties
 * @returns {JSX.Element} The rendered sortable routine item
 */
export const SortableRoutineItem: React.FC<SortableRoutineItemProps> = ({ 
  task, 
  index, 
  onRemove, 
  onUpdate,
  onOpenChecklist
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
          <span className="text-sm font-bold text-slate-700">{index + 2}. {task.text}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              {task.taskType === TaskType.TIME_INDEPENDENT ? (
                <Clock className="w-3 h-3 text-sky-500" />
              ) : task.taskType === TaskType.TIME_ACCUMULATED ? (
                <BrickIcon className="w-3 h-3 text-pink-500" />
              ) : (
                <Hourglass className="w-3 h-3 text-indigo-600" />
              )}
              <span className="text-[10px] font-bold text-slate-400">{task.targetDuration || task.duration}분</span>
            </div>
            <span className="text-[10px] text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-indigo-600" />
              <span className="text-[10px] font-bold text-slate-400">{task.points}P</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onOpenChecklist(task.id)}
          className={`p-2 transition-colors ${task.checklist.length > 0 ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onRemove(task.id)}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
