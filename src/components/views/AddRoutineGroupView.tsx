import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  Clock, 
  Target, 
  PlusCircle, 
  Trash2, 
  AlertCircle,
  Settings,
  X,
  CheckCircle2,
  ListTodo,
  Zap
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { AddRoutineGroupViewProps, Task, TaskType } from '../../types';
import { TaskInputSection } from '../routine/TaskInputSection';
import { SortableRoutineItem } from '../routine/SortableRoutineItem';
import { ChecklistModal } from '../common/ChecklistModal';

export const AddRoutineGroupView: React.FC<AddRoutineGroupViewProps> = ({
  addChunk,
  setActiveTab,
  setSettingsSubView,
  setIsSettingsOpen,
  userData
}) => {
  const [groupName, setGroupName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [scheduleType, setScheduleType] = useState<'days' | 'weekly' | 'monthly' | 'yearly'>('days');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [frequency, setFrequency] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [startType, setStartType] = useState<'anytime' | 'situation' | 'time'>('anytime');
  const [situation, setSituation] = useState('');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  
  const [triggerTask, setTriggerTask] = useState<Task>({
    id: 'trigger-' + Date.now(),
    text: '',
    points: 10,
    duration: 5,
    type: TaskType.TIME_LIMITED,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    checklist: []
  });
  
  const [routineList, setRoutineList] = useState<Task[]>([]);
  
  const [closingRoutine, setClosingRoutine] = useState<Task>({
    id: 'closing-' + Date.now(),
    text: '',
    points: 10,
    duration: 5,
    type: TaskType.TIME_LIMITED,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    checklist: []
  });

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [activeChecklistTaskId, setActiveChecklistTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRoutineList((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddTask = (task: Task) => {
    setRoutineList([...routineList, task]);
  };

  const handleRemoveTask = (id: string) => {
    setRoutineList(routineList.filter(t => t.id !== id));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setRoutineList(routineList.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      alert('그룹 이름을 입력해주세요.');
      return;
    }
    if (routineList.length === 0) {
      alert('최소 1개 이상의 루틴을 추가해주세요.');
      return;
    }

    const finalTasks = [
      ...(triggerTask.text ? [triggerTask] : []),
      ...routineList,
      ...(closingRoutine.text ? [closingRoutine] : [])
    ];

    const totalDuration = finalTasks.reduce((acc, t) => acc + (t.duration || 0), 0);

    addChunk(
      groupName,
      purpose,
      finalTasks,
      scheduleType,
      scheduledDays,
      frequency,
      startTime,
      isAlarmEnabled,
      startType,
      situation
    );
    setActiveTab('home');
  };

  const openChecklist = (taskId: string) => {
    setActiveChecklistTaskId(taskId);
    setIsChecklistModalOpen(true);
  };

  const getActiveTaskForChecklist = () => {
    if (activeChecklistTaskId === triggerTask.id) return triggerTask;
    if (activeChecklistTaskId === closingRoutine.id) return closingRoutine;
    return routineList.find(t => t.id === activeChecklistTaskId);
  };

  const updateChecklist = (items: string[]) => {
    if (activeChecklistTaskId === triggerTask.id) {
      setTriggerTask({ ...triggerTask, checklist: items });
    } else if (activeChecklistTaskId === closingRoutine.id) {
      setClosingRoutine({ ...closingRoutine, checklist: items });
    } else {
      setRoutineList(routineList.map(t => t.id === activeChecklistTaskId ? { ...t, checklist: items } : t));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('home')}
          className="p-3 bg-white rounded-2xl text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">새 루틴 그룹 만들기</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">루틴 설계</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        {/* Basic Info */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">그룹 이름</label>
              <input 
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="예: 미라클 모닝, 퇴근 후 루틴"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수행 목적</label>
              <input 
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="이 루틴을 통해 어떤 사람이 되고 싶나요?"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Schedule & Alarm */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">4. 시작 상황 또는 시각 설정</h3>
            <div className={`flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-all ${startType !== 'time' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase">알람</span>
              <button 
                onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                disabled={startType !== 'time'}
                className={`w-10 h-5 rounded-full transition-all relative ${isAlarmEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isAlarmEnabled ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
              {['days', 'weekly', 'monthly', 'yearly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setScheduleType(type as any)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${scheduleType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                >
                  {type === 'days' ? '요일' : type === 'weekly' ? '주간' : type === 'monthly' ? '월간' : '연간'}
                </button>
              ))}
            </div>

            {scheduleType === 'days' && (
              <div className="flex justify-between gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newDays = scheduledDays.includes(i)
                        ? scheduledDays.filter(d => d !== i)
                        : [...scheduledDays, i].sort();
                      if (newDays.length > 0) setScheduledDays(newDays);
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${scheduledDays.includes(i) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl w-fit border border-slate-100">
                  <button
                    onClick={() => {
                      setStartType('anytime');
                      setIsAlarmEnabled(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'anytime' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                  >
                    아무때나
                  </button>
                  <button
                    onClick={() => {
                      setStartType('situation');
                      setIsAlarmEnabled(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'situation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                  >
                    상황
                  </button>
                  <button
                    onClick={() => {
                      setStartType('time');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${startType === 'time' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                  >
                    시각
                  </button>
                </div>

                {startType === 'situation' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시작 상황</label>
                    <input 
                      type="text"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="예: 외출했다 돌아왔을 때"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                    />
                  </div>
                )}

                {startType === 'time' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시작 시각</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                      />
                    </div>
                  </div>
                )}
              </div>
              {scheduleType !== 'days' && (
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">빈도</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shadow-inner">
                    <input 
                      type="number"
                      min="1"
                      value={frequency}
                      onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-sm font-black focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">회</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Trigger Task */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-slate-900">트리거 루틴</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">루틴을 시작하게 만드는 첫 행동</p>
            </div>
          </div>
          <div className="space-y-4">
            <input 
              type="text"
              value={triggerTask.text}
              onChange={(e) => setTriggerTask({ ...triggerTask, text: e.target.value })}
              placeholder="예: 물 한 잔 마시기, 이불 정리하기"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="number"
                  value={triggerTask.duration}
                  onChange={(e) => setTriggerTask({ ...triggerTask, duration: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xs font-black focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">분</span>
              </div>
              <button 
                onClick={() => openChecklist(triggerTask.id)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${triggerTask.checklist.length > 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                <ListTodo className="w-3.5 h-3.5" /> 체크리스트 {triggerTask.checklist.length > 0 && `(${triggerTask.checklist.length})`}
              </button>
            </div>
          </div>
        </section>

        {/* Main Routine List */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-slate-900">메인 루틴 목록</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">순서대로 수행할 핵심 행동들</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black">{routineList.length}개</span>
          </div>

          <div className="space-y-3">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={routineList.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {routineList.map((task, index) => (
                  <SortableRoutineItem 
                    key={task.id}
                    task={task}
                    index={index}
                    onRemove={handleRemoveTask}
                    onUpdate={handleUpdateTask}
                    onOpenChecklist={openChecklist}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <TaskInputSection onAdd={handleAddTask} scheduledDays={scheduledDays} />
        </section>

        {/* Closing Routine */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-slate-900">마무리 루틴</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">루틴을 깔끔하게 끝내는 마지막 행동</p>
            </div>
          </div>
          <div className="space-y-4">
            <input 
              type="text"
              value={closingRoutine.text}
              onChange={(e) => setClosingRoutine({ ...closingRoutine, text: e.target.value })}
              placeholder="예: 일기 쓰기, 내일 옷 준비하기"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="number"
                  value={closingRoutine.duration}
                  onChange={(e) => setClosingRoutine({ ...closingRoutine, duration: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xs font-black focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">분</span>
              </div>
              <button 
                onClick={() => openChecklist(closingRoutine.id)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${closingRoutine.checklist.length > 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                <ListTodo className="w-3.5 h-3.5" /> 체크리스트 {closingRoutine.checklist.length > 0 && `(${closingRoutine.checklist.length})`}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-slate-100">
        <button 
          onClick={handleSave}
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <PlusCircle className="w-6 h-6" />
          루틴 그룹 생성하기
        </button>
      </div>

      {/* Checklist Modal */}
      <ChecklistModal 
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        task={getActiveTaskForChecklist()}
        onUpdate={updateChecklist}
      />
    </div>
  );
};
