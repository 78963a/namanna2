import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Hourglass, BrickWall, Check, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Task, TaskType } from '../../types';

interface TaskInputSectionProps {
  label: string;
  task: {
    text: string;
    duration: number;
    type: TaskType;
    scheduledDays: number[];
    checklist: any[];
    onDelete?: () => void;
  };
  setTask: (task: any) => void;
  onAdd: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  onOpenChecklist: () => void;
  groupScheduledDays: number[];
}

// 루틴수정 팝업
export const TaskInputSection: React.FC<TaskInputSectionProps> = ({ 
  label, 
  task, 
  setTask, 
  onAdd, 
  onCancel,
  isEditing = false,
  onOpenChecklist,
  groupScheduledDays
}) => {
  const toggleDay = (dayIndex: number) => {
    if (!groupScheduledDays.includes(dayIndex)) return;
    const currentDays = task.scheduledDays || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    setTask({ ...task, scheduledDays: newDays });
  };

  return (
    <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
      <div className="flex items-center justify-between mb-1 ml-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        {task.checklist && task.checklist.length > 0 && (
          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">체크리스트 {task.checklist.length}개</span>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 ml-1">루틴 제목</label>
          <input 
            type="text"
            value={task.text}
            onChange={(e) => setTask({ ...task, text: e.target.value })}
            placeholder="루틴 이름 입력..."
            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-grow space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
            <div className="flex items-center gap-1 p-1 bg-white rounded-[10px] border border-slate-200 shadow-sm">
              {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                return (
                  <button 
                    key={type}
                    onClick={() => setTask({ ...task, type })}
                    className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black transition-all flex items-center justify-center gap-1 ${task.type === type ? `${colorClass} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-24 space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">시간(분)</span>
            <input 
              type="number"
              value={task.duration || ''}
              onChange={(e) => setTask({ ...task, duration: e.target.value === '' ? 0 : parseInt(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">실행 요일</span>
          <div className="flex justify-between gap-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => {
              const isGroupActive = groupScheduledDays.includes(i);
              const isTaskActive = task.scheduledDays?.includes(i);
              
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  disabled={!isGroupActive}
                  className={`flex-1 py-2 rounded-[10px] text-[10px] font-black transition-all ${
                    !isGroupActive ? 'bg-slate-50 text-slate-100 cursor-not-allowed' :
                    isTaskActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 
                    'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={onOpenChecklist}
          className={`w-full py-2.5 rounded-[10px] font-black text-xs transition-all flex items-center justify-center gap-2 border-2 border-dashed ${task.checklist && task.checklist.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {task.checklist && task.checklist.length > 0 ? `체크리스트 ${task.checklist.length}개 설정됨` : '체크리스트 추가 (선택)'}
        </button>
      </div>

      {(onAdd || isEditing) && (
        <div className="flex gap-2">
          {isEditing && onCancel && (
            <button 
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-[10px] text-xs font-black hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          )}
          {isEditing && (task as any).onDelete && (
            <button 
              onClick={(task as any).onDelete}
              className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-[10px] text-xs font-black hover:bg-rose-100 transition-colors"
            >
              루틴 삭제
            </button>
          )}
          <button 
            onClick={onAdd}
            disabled={!task.text.trim()}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-[10px] text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? '수정완료' : '루틴 추가하기'}
          </button>
        </div>
      )}
    </div>
  );
};
