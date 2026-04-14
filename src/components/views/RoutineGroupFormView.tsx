import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Clock, 
  Hourglass, 
  BrickWall, 
  Check, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  ChevronLeft,
  Settings,
  X,
  PlusCircle,
  GripVertical,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Task, TaskType, UserData, RoutineChunk } from '../../types';
import { TaskInputSection } from '../routine/TaskInputSection';
import { SortableRoutineItem } from '../routine/SortableRoutineItem';
import { ChecklistModal } from '../routine/ChecklistModal';

const RoutineEditModal = ({ 
  isOpen, 
  onClose, 
  task, 
  setTask, 
  onSave, 
  onOpenChecklist,
  groupScheduledDays,
  label
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[25px] w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <TaskInputSection 
            label={label}
            task={task}
            setTask={setTask}
            onAdd={onSave}
            onCancel={onClose}
            isEditing={true}
            onOpenChecklist={onOpenChecklist}
            groupScheduledDays={groupScheduledDays}
          />
        </div>
      </motion.div>
    </div>
  );
};

// 새로운 루틴 그룹 만들기 제목 글꼴 설정
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-black text-slate-500 uppercase tracking-wider ml-1 mb-3 mt-6">
    {children}
  </label>
);

export const RoutineGroupFormView: React.FC<{
  addChunk: (name: string, purpose: string, tasks: Task[], scheduleType: 'days' | 'weekly' | 'monthly' | 'yearly', scheduledDays: number[], frequency?: number, startTime?: string, isAlarmEnabled?: boolean, startType?: 'anytime' | 'situation' | 'time', situation?: string) => void;
  updateChunk?: (id: string, updatedData: Partial<RoutineChunk>) => void;
  initialChunk?: RoutineChunk;
  setActiveTab: (tab: string) => void;
  setSettingsSubView: (view: any) => void;
  setIsSettingsOpen: (open: boolean) => void;
  userData: UserData;
  mode?: 'add' | 'edit';
}> = ({ addChunk, updateChunk, initialChunk, setActiveTab, setSettingsSubView, setIsSettingsOpen, userData, mode = 'add' }) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [triggerTask, setTriggerTask] = useState({ text: '', duration: 1, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6], checklist: [] as any[] });
  const [routineList, setRoutineList] = useState<Array<{ id: string, text: string, duration: number, type: TaskType, scheduledDays: number[], checklist: any[] }>>([]);
  const [currentRoutineInput, setCurrentRoutineInput] = useState({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6], checklist: [] as any[] });
  const [isClosingRoutineEnabled, setIsClosingRoutineEnabled] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const prevScheduledDaysRef = useRef<number[]>(scheduledDays);

  const [startTime, setStartTime] = useState('07:00');
  const [startType, setStartType] = useState<'anytime' | 'situation' | 'time'>('anytime');
  const [situation, setSituation] = useState('');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingRoutineIndex, setEditingRoutineIndex] = useState<number | null>(null);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [activeChecklistTarget, setActiveChecklistTarget] = useState<'trigger' | 'current' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialChunk) {
      setName(initialChunk.name);
      setPurpose(initialChunk.purpose || '');
      setScheduledDays(initialChunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
      setStartTime(initialChunk.startTime || '07:00');
      setStartType(initialChunk.startType || 'anytime');
      setSituation(initialChunk.situation || '');
      setIsAlarmEnabled(initialChunk.isAlarmEnabled || false);

      const tasks = initialChunk.tasks || [];
      if (tasks.length > 0) {
        const first = tasks[0];
        setTriggerTask({
          text: first.text,
          duration: first.targetDuration || 1,
          type: first.taskType || TaskType.TIME_LIMITED,
          scheduledDays: first.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          checklist: (first as any).checklist || []
        });

        const last = tasks[tasks.length - 1];
        const hasClosing = !!last.isClosingRoutine;
        setIsClosingRoutineEnabled(hasClosing);

        const middle = tasks.slice(1, hasClosing ? -1 : undefined);
        setRoutineList(middle.map(t => ({
          id: t.id,
          text: t.text,
          duration: t.targetDuration || 1,
          type: t.taskType || TaskType.TIME_LIMITED,
          scheduledDays: t.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          checklist: (t as any).checklist || []
        })));
      }
    }
  }, [initialChunk]);

  useEffect(() => {
    const prevDays = prevScheduledDaysRef.current;
    const added = scheduledDays.filter(d => !prevDays.includes(d));
    const removed = prevDays.filter(d => !scheduledDays.includes(d));

    if (added.length > 0 || removed.length > 0) {
      setTriggerTask(prev => {
        let next = [...(prev.scheduledDays || []), ...added];
        next = next.filter(d => !removed.includes(d));
        return { ...prev, scheduledDays: [...new Set(next)].sort() };
      });

      setRoutineList(prev => prev.map(rt => {
        let next = [...(rt.scheduledDays || []), ...added];
        next = next.filter(d => !removed.includes(d));
        return { ...rt, scheduledDays: [...new Set(next)].sort() };
      }));

      setCurrentRoutineInput(prev => {
        let next = [...(prev.scheduledDays || []), ...added];
        next = next.filter(d => !removed.includes(d));
        return { ...prev, scheduledDays: [...new Set(next)].sort() };
      });

      prevScheduledDaysRef.current = scheduledDays;
    }
  }, [scheduledDays]);

  const toggleGroupDay = (i: number) => {
    setScheduledDays(prev => 
      prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort()
    );
  };

  const addRoutineToList = () => {
    if (!currentRoutineInput.text.trim()) return;
    
    const taskToSave = { 
      ...currentRoutineInput, 
      duration: Number(currentRoutineInput.duration) || 1 
    };

    if (editingRoutineIndex !== null) {
      const newList = [...routineList];
      newList[editingRoutineIndex] = { ...newList[editingRoutineIndex], ...taskToSave };
      setRoutineList(newList);
      setEditingRoutineIndex(null);
      setIsEditModalOpen(false);
    } else {
      setRoutineList([...routineList, { ...taskToSave, id: `new-rt-${Date.now()}` }]);
    }
    setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
  };

  const startEditing = (idx: number) => {
    setEditingRoutineIndex(idx);
    const routine = routineList[idx];
    setCurrentRoutineInput({
      text: routine.text,
      duration: routine.duration || 10,
      type: routine.type,
      scheduledDays: routine.scheduledDays || scheduledDays,
      checklist: (routine as any).checklist || [],
      onDelete: () => {
        setConfirmModal({
          isOpen: true,
          title: '루틴 삭제',
          message: '이 루틴을 삭제하시겠습니까?',
          onConfirm: () => {
            setRoutineList(routineList.filter((_, i) => i !== idx));
            setEditingRoutineIndex(null);
            setIsEditModalOpen(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    } as any);
    setIsEditModalOpen(true);
  };

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRoutineList((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('루틴 그룹 이름을 입력해주세요.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('루틴 그룹 목적을 입력해주세요.');
      return;
    }

    if (routineList.length === 0) {
      setErrorMessage('최소 한 개 이상의 루틴을 추가해주세요.');
      return;
    }

    const tasks: Task[] = [];
    
    tasks.push({
      id: `trigger-${Date.now()}`,
      text: triggerTask.text || '기상',
      targetDuration: triggerTask.duration,
      taskType: triggerTask.type,
      scheduledDays: triggerTask.scheduledDays,
      completed: false,
      checklist: (triggerTask as any).checklist || []
    });

    routineList.forEach(rt => {
      tasks.push({
        id: rt.id,
        text: rt.text,
        targetDuration: rt.duration,
        taskType: rt.type,
        scheduledDays: rt.scheduledDays,
        completed: false,
        checklist: rt.checklist || []
      });
    });

    if (isClosingRoutineEnabled) {
      tasks.push({
        id: `closing-${Date.now()}`,
        text: '마무리 및 회고',
        targetDuration: 5,
        taskType: TaskType.TIME_LIMITED,
        scheduledDays: scheduledDays,
        completed: false,
        isClosingRoutine: true,
        checklist: []
      });
    }

    if (mode === 'edit' && initialChunk && updateChunk) {
      updateChunk(initialChunk.id, {
        name,
        purpose,
        tasks,
        scheduledDays,
        startTime,
        isAlarmEnabled,
        startType,
        situation
      });
    } else {
      addChunk(name, purpose, tasks, 'days', scheduledDays, 1, startTime, isAlarmEnabled, startType, situation);
    }

    setIsSettingsOpen(false);
    setSettingsSubView({ type: 'main' });
    setActiveTab('home');
  };

  const openChecklistModal = (target: 'trigger' | 'current') => {
    setActiveChecklistTarget(target);
    setIsChecklistModalOpen(true);
  };

  const handleChecklistSave = (items: any[]) => {
    if (activeChecklistTarget === 'trigger') {
      setTriggerTask(prev => ({ ...prev, checklist: items }));
    } else if (activeChecklistTarget === 'current') {
      setCurrentRoutineInput(prev => ({ ...prev, checklist: items }));
    }
    setIsChecklistModalOpen(false);
    setActiveChecklistTarget(null);
  };

  return (
    <div className="space-y-5 pb-20">
      <AnimatePresence>
        {isEditModalOpen && (
          <RoutineEditModal 
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingRoutineIndex(null);
              setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
            }}
            task={currentRoutineInput}
            setTask={setCurrentRoutineInput}
            onSave={addRoutineToList}
            onOpenChecklist={() => openChecklistModal('current')}
            groupScheduledDays={scheduledDays}
            label={<div className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> 루틴 수정</div>}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[25px] p-6 z-[210] shadow-2xl w-[90%] max-w-sm"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-[15px] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-3 rounded-[15px] font-black text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChecklistModal 
        isOpen={isChecklistModalOpen}
        onClose={() => {
          setIsChecklistModalOpen(false);
          setActiveChecklistTarget(null);
        }}
        items={activeChecklistTarget === 'trigger' ? triggerTask.checklist : currentRoutineInput.checklist}
        onSave={handleChecklistSave}
        title={activeChecklistTarget === 'trigger' ? '기상 루틴 체크리스트' : '루틴 체크리스트'}
      />

      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={() => {
            setIsSettingsOpen(false);
            setSettingsSubView({ type: 'main' });
          }}
          className="p-2 hover:bg-slate-100 rounded-[10px] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">{mode === 'edit' ? '루틴 그룹 수정' : '새 루틴 그룹 만들기'}</h2>
      </div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-rose-50 text-rose-600 rounded-[10px] text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </motion.div>
      )}

      <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <SectionTitle>1. 루틴 그룹 이름</SectionTitle>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 미라클 모닝, 퇴근 후 루틴"
            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <SectionTitle>2. 목적</SectionTitle>
          <input 
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="예: 아침 시간을 낭비하지 않는 사람"
            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>
      </div>

      <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
        <div className="space-y-3">
          <SectionTitle>3. 요일 설정</SectionTitle>
          <div className="flex justify-between gap-1">
            {[
              { label: '월', value: 1 },
              { label: '화', value: 2 },
              { label: '수', value: 3 },
              { label: '목', value: 4 },
              { label: '금', value: 5 },
              { label: '토', value: 6, color: 'bg-emerald-600' },
              { label: '일', value: 0, color: 'bg-rose-600' }
            ].map((dayObj) => {
              const i = dayObj.value;
              const isSelected = scheduledDays.includes(i);
              const selectedColor = dayObj.color || 'bg-indigo-500';
              return (
                <button
                  key={i}
                  onClick={() => toggleGroupDay(i)}
                  className={`flex-1 py-2.5 rounded-[10px] text-xs font-black transition-all ${
                    isSelected
                      ? `${selectedColor} text-white shadow-md shadow-indigo-100`
                      : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dayObj.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
        <div className="flex items-center justify-between mb-1 ml-1">
          <SectionTitle>4. 시작 상황 또는 시각 설정</SectionTitle>
        </div>
        
        <div className="flex gap-2 p-1 bg-white rounded-[10px] border border-slate-200 shadow-sm">
          {[
            { id: 'anytime', label: '아무때나' },
            { id: 'situation', label: '상황' },
            { id: 'time', label: '시각' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStartType(opt.id as any)}
              className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black transition-all ${startType === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="min-h-[42px] flex flex-col justify-center">
          {startType === 'anytime' && (
            <p className="text-[10px] font-bold text-slate-400 ml-2 animate-in fade-in duration-300">
              별도의 조건 없이 언제든 시작할 수 있습니다.
            </p>
          )}

          {startType === 'situation' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <input 
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="예: 외출했다 돌아왔을 때"
                className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              />
            </div>
          )}

          {startType === 'time' && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="relative flex-grow">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[10px] pl-12 pr-5 py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
              <div className="flex flex-col items-center gap-1 bg-white px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-sm">
                <span className="text-[8px] font-black text-slate-400 uppercase">알람</span>
                <button 
                  onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                  className={`w-8 h-4 rounded-full transition-all relative ${isAlarmEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isAlarmEnabled ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskInputSection 
        label={<SectionTitle>5. 첫번째 루틴(트리거 루틴)</SectionTitle>}
        task={triggerTask}
        setTask={setTriggerTask}
        onAdd={() => {}}
        onOpenChecklist={() => openChecklistModal('trigger')}
        groupScheduledDays={scheduledDays}
      />

      <div className="space-y-3">
        <SectionTitle>루틴 목록</SectionTitle>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRoutineDragEnd}
        >
          <SortableContext 
            items={routineList.map(r => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {routineList.map((rt, idx) => (
                <SortableRoutineItem 
                  key={rt.id}
                  task={rt as any}
                  index={idx}
                  onRemove={(id) => setRoutineList(prev => prev.filter(r => r.id !== id))}
                  onEdit={startEditing}
                  groupScheduledDays={scheduledDays}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <TaskInputSection 
        label={<SectionTitle>6. 루틴 추가</SectionTitle>}
        task={currentRoutineInput}
        setTask={setCurrentRoutineInput}
        onAdd={addRoutineToList}
        onOpenChecklist={() => openChecklistModal('current')}
        groupScheduledDays={scheduledDays}
      />

      <div className="space-y-3">
        <SectionTitle>7. 마무리 루틴 설정</SectionTitle>
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-500">만족도 표시 및 메모 남기기</span>
          </div>
          <button 
            onClick={() => setIsClosingRoutineEnabled(!isClosingRoutineEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${isClosingRoutineEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isClosingRoutineEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          onClick={() => {
            setIsSettingsOpen(false);
            setSettingsSubView({ type: 'main' });
          }}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[15px] font-black text-sm hover:bg-slate-200 transition-all"
        >
          취소
        </button>
        <button 
          onClick={handleSave}
          className="flex-[2] py-4 bg-indigo-600 text-white rounded-[15px] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          {mode === 'edit' ? '수정완료' : '루틴 그룹 생성'}
        </button>
      </div>
    </div>
  );
};
