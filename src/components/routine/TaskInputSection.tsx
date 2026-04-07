import React from 'react';
import { Plus, Clock, Hourglass } from 'lucide-react';
import { TaskType } from '../../types';
import { PointSelector } from '../common/PointSelector';

interface TaskInputSectionProps {
  taskText: string;
  setTaskText: (text: string) => void;
  taskPoints: number;
  setTaskPoints: (points: number) => void;
  taskDuration: number;
  setTaskDuration: (duration: number) => void;
  taskType: TaskType;
  setTaskType: (type: TaskType) => void;
  onAddTask: () => void;
  disabled?: boolean;
}

/**
 * A reusable section for inputting task details.
 * 
 * @param {TaskInputSectionProps} props - Component properties
 * @returns {JSX.Element} The rendered task input section
 */
export const TaskInputSection: React.FC<TaskInputSectionProps> = ({
  taskText,
  setTaskText,
  taskPoints,
  setTaskPoints,
  taskDuration,
  setTaskDuration,
  taskType,
  setTaskType,
  onAddTask,
  disabled = false
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">새 루틴 추가</span>
        <input 
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="루틴 내용을 입력하세요"
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {[
              { type: TaskType.TIME_INDEPENDENT, icon: Clock },
              { type: TaskType.TIME_LIMITED, icon: Hourglass },
              { type: TaskType.TIME_ACCUMULATED, icon: Plus }
            ].map((t) => (
              <button
                key={t.type}
                onClick={() => setTaskType(t.type)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all ${taskType === t.type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300'}`}
              >
                <t.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">시간 (분)</span>
          <input 
            type="number"
            value={taskDuration || ''}
            onChange={(e) => setTaskDuration(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">포인트</span>
        <PointSelector value={taskPoints} onChange={setTaskPoints} />
      </div>

      <button 
        onClick={onAddTask}
        disabled={disabled || !taskText.trim()}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        루틴 추가
      </button>
    </div>
  );
};
