import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Clock, Hourglass, BrickWall, CheckCircle2 } from 'lucide-react';
import { Task, TaskType } from '../../types';

interface SortableRoutineItemProps {
  task: Task;
  index: number;
  onRemove: (id: string) => void;
  onEdit: (idx: number) => void;
  groupScheduledDays: number[];
}

export const SortableRoutineItem: React.FC<SortableRoutineItemProps> = ({ 
  task, 
  index, 
  onRemove, 
  onEdit,
  groupScheduledDays
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
      className="bg-white p-3 rounded-[10px] border border-slate-200 flex flex-col gap-3 shadow-none group"
    >
      <div className="flex items-center justify-between">
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
                  <BrickWall className="w-3 h-3 text-pink-500" />
                ) : (
                  <Hourglass className="w-3 h-3 text-indigo-600" />
                )}
                <span className="text-[10px] font-bold text-slate-400">{task.targetDuration || task.duration}분</span>
              </div>
              {task.checklist && task.checklist.length > 0 && (
                <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter">
                  <CheckCircle2 className="w-2 h-2" />
                  <span>체크리스트</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(index)}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
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

      <div className="flex justify-between gap-1 px-2 pb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => {
          const isGroupActive = groupScheduledDays.includes(i);
          const isTaskActive = task.scheduledDays?.includes(i);
          
          return (
            <div
              key={i}
              className={`flex-1 py-1 rounded-[4px] text-[8px] font-black text-center transition-all ${
                !isGroupActive ? 'bg-slate-50 text-slate-100' :
                isTaskActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                'bg-slate-50 text-slate-300 border border-transparent'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};
