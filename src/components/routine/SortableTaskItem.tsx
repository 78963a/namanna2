import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Hourglass, BrickWall, Edit2, Trash2 } from 'lucide-react';
import { Task, TaskType } from '../../types';

interface SortableTaskItemProps {
  task: Task;
  index: number;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingTaskText: string;
  setEditingTaskText: (text: string) => void;
  editingTaskDuration: number;
  setEditingTaskDuration: (duration: number) => void;
  editingTaskType: TaskType;
  setEditingTaskType: (type: TaskType) => void;
  editingTaskScheduledDays: number[];
  setEditingTaskScheduledDays: (days: number[]) => void;
  updateTask: (taskId: string, newText: string, newDuration: number, newTaskType?: TaskType, newScheduledDays?: number[]) => void;
  deleteTask: (id: string) => void;
  chunkScheduledDays: number[];
}

/**
 * A draggable item representing an individual task within a routine.
 * Allows for inline editing of task details and reordering.
 * 
 * @param {SortableTaskItemProps} props - Component properties
 * @returns {JSX.Element} The rendered sortable task item
 */
export const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, 
  index, 
  editingTaskId, 
  setEditingTaskId, 
  editingTaskText, 
  setEditingTaskText, 
  editingTaskDuration,
  setEditingTaskDuration,
  editingTaskType,
  setEditingTaskType,
  editingTaskScheduledDays,
  setEditingTaskScheduledDays,
  updateTask, 
  deleteTask,
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

  const daysLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div ref={setNodeRef} style={style} className="p-3 bg-white rounded-[10px] border border-slate-100 group shadow-sm">
      {editingTaskId === task.id ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">{index + 1}.</span>
            <input 
              type="text"
              value={editingTaskText}
              onChange={(e) => setEditingTaskText(e.target.value)}
              className="flex-grow bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">루틴 유형</span>
              <div className="flex items-center gap-1">
                {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                  const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                  const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                  return (
                    <button 
                      key={type}
                      onClick={() => setEditingTaskType(type)}
                      className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black transition-all flex items-center justify-center gap-1 ${editingTaskType === type ? `${colorClass} text-white shadow-md` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
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
                className={`w-full bg-slate-50 border rounded-[10px] px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 transition-colors ${
                  editingTaskType === TaskType.TIME_INDEPENDENT ? 'border-sky-200 focus:ring-sky-500/20' : editingTaskType === TaskType.TIME_ACCUMULATED ? 'border-pink-200 focus:ring-pink-500/20' : 'border-indigo-200 focus:ring-indigo-500/20'
                }`}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">실행 요일</span>
            <div className="flex gap-1">
              {daysLabels.map((day, i) => {
                const isGroupScheduled = chunkScheduledDays.includes(i);
                const isSelected = editingTaskScheduledDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    disabled={!isGroupScheduled}
                    className={`w-7 h-7 rounded-[10px] text-[10px] font-bold transition-all ${
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
              onClick={() => updateTask(task.id, editingTaskText, editingTaskDuration, editingTaskType, editingTaskScheduledDays)}
              className="flex-1 py-1.5 bg-indigo-600 text-white rounded-[10px] text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              저장
            </button>
            <button 
              onClick={() => setEditingTaskId(null)}
              className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-[10px] text-xs font-bold hover:bg-slate-200 transition-colors"
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
                    <BrickWall className="w-3 h-3 text-pink-500" />
                  ) : (
                    <Hourglass className="w-3 h-3 text-indigo-600" />
                  )}
                  <span className="text-[10px] text-slate-500 font-bold">{task.targetDuration || 0}분</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 transition-opacity">
            <div className="relative group/tooltip">
              <button 
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditingTaskText(task.text);
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
