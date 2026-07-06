import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trash2, 
  Check, 
  Edit2, 
  Settings, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  Hourglass, 
  BrickWall, 
  GripVertical, 
  Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 내부 타입 및 상수 정의
import { 
  TaskType, 
  Task, 
  RoutineChunk, 
  UserData, 
  TaskStatus 
} from '../../types';
import { notificationService } from '../../services/notificationService';
import { ConfirmModal } from './ConfirmModal';
import { ChecklistModal } from './ChecklistModal';
import { MenuBar } from '../layout/MenuBar';

// --- Helper Components ---

/**
 * 루틴 그룹 생성/수정 화면의 각 설정 설명문에 사용되는 글자 스타일을 통일하여 렌더링하는 헬퍼 함수입니다.
 * @param text 설명에 들어갈 텍스트 내용
 * @param extraClass 추가 클래스 (기본값: 빈 문자열)
 */
const renderDescription = (text: string, extraClass: string = '') => {
  return (
    <p className={`text-sm font-normal text-slate-400 dark:text-slate-300 leading-tight whitespace-normal ${extraClass}`}>
      {text}
    </p>
  );
};

// 루틴수정 팝업 
const TaskInputSection = ({
  label, 
  task, 
  setTask, 
  isTrigger = false, 
  description,
  onAdd,
  onCancel,
  isEditing = false,
  onOpenChecklist,
  groupScheduledDays = [0, 1, 2, 3, 4, 5, 6]
}: { 
  label: React.ReactNode, 
  task: any, 
  setTask: (t: any) => void, 
  isTrigger?: boolean,
  description?: string,
  onAdd?: () => void,
  onCancel?: () => void,
  isEditing?: boolean,
  onOpenChecklist?: () => void,
  groupScheduledDays?: number[]
}) => {
  const { t } = useTranslation();

  const daysFromTranslation = t('common.days', { returnObjects: true }) as string[] || ['월', '화', '수', '목', '금', '토', '일'];
  const getDayLabel = (val: number) => {
    if (val === 0) return daysFromTranslation[6]; // Sunday
    return daysFromTranslation[val - 1]; // Monday to Saturday
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="text-[15px] font-bold text-slate-600 ml-1">{label}</div>
        {description && renderDescription(description, 'ml-1 leading-relaxed')}
      </div>
      <div className="bg-white p-3 rounded-[10px] border border-slate-200 space-y-4 shadow-none">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 ml-1">{t('statsModal.routineTitleLabel')}</label>
            {onOpenChecklist && (
              <button 
                onClick={onOpenChecklist}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[10px] text-[10px] font-black transition-all ${task.checklist && task.checklist.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {task.checklist && task.checklist.length > 0 ? t('statsModal.checklistCount', { count: task.checklist.length }) : t('statsModal.createChecklist')}
              </button>
            )}
          </div>
          <input 
            type="text"
            value={task.text}
            onChange={(e) => setTask({ ...task, text: e.target.value })}
            placeholder={isTrigger ? t('statsModal.triggerPlaceholder') : t('statsModal.routinePlaceholder')}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* 루틴 요일 설정 */}
        {!isTrigger && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('statsModal.routineDaysLabel')}</span>
            <div className="flex flex-wrap gap-1">
              {[
                { label: getDayLabel(1), value: 1 },
                { label: getDayLabel(2), value: 2 },
                { label: getDayLabel(3), value: 3 },
                { label: getDayLabel(4), value: 4 },
                { label: getDayLabel(5), value: 5 },
                { label: getDayLabel(6), value: 6, color: 'bg-emerald-600' },
                { label: getDayLabel(0), value: 0, color: 'bg-rose-600' }
              ].map((dayObj) => {
                const i = dayObj.value;
                const isAvailable = groupScheduledDays.includes(i);
                const isSelected = task.scheduledDays?.includes(i);
                const selectedColor = dayObj.color || 'bg-indigo-600';
                return (
                  <button
                    key={i}
                    disabled={!isAvailable}
                    onClick={() => {
                      const currentDays = task.scheduledDays || [];
                      let nextDays;
                      if (currentDays.includes(i)) {
                        nextDays = currentDays.filter((d: number) => d !== i);
                      } else {
                        nextDays = [...currentDays, i].sort();
                      }
                      setTask({ ...task, scheduledDays: nextDays });
                    }}
                    className={`w-8 h-8 rounded-[10px] text-[10px] font-black transition-all ${
                      isSelected 
                        ? `${selectedColor} text-white shadow-none` 
                        : isAvailable 
                          ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                          : 'bg-slate-50 text-slate-200 border border-slate-50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {dayObj.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isTrigger && (
          <div className="space-y-0">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('statsModal.routineTypeLabel')}</span>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-[10px]">
                {[
                  { type: TaskType.TIME_INDEPENDENT, label: t('statsModal.timeIndependent'), icon: Clock },
                  { type: TaskType.TIME_LIMITED, label: t('statsModal.timeLimited'), icon: Hourglass },
                  { type: TaskType.TIME_ACCUMULATED, label: t('statsModal.timeAccumulated'), icon: BrickWall }
                ].map((tItem) => (
                  <button
                    key={tItem.type}
                    onClick={() => setTask({ ...task, type: tItem.type })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[10px] font-black transition-all ${task.type === tItem.type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <tItem.icon className="w-3 h-3" />
                    {tItem.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 mt-[-1px]">
              <div className="bg-white border border-slate-200 rounded-[10px] p-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  {t('statsModal.durationMinutes')}
                </span>
                <div className="flex items-center gap-2">
                  {task.type === TaskType.TIME_INDEPENDENT ? (
                    <Clock className="w-4 h-4 text-sky-500" />
                  ) : task.type === TaskType.TIME_ACCUMULATED ? (
                    <BrickWall className="w-4 h-4 text-pink-500" />
                  ) : (
                    <Hourglass className="w-4 h-4 text-indigo-600" />
                  )}
                  <input 
                    type="number"
                    min="1"
                    value={task.duration}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      setTask({ ...task, duration: val });
                    }}
                    onBlur={() => {
                      if (task.duration === '' || task.duration < 1) {
                        setTask({ ...task, duration: 1 });
                      }
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {isTrigger && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
              {t('statsModal.durationMax3')}
            </span>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-[10px] px-4 py-2">
              {task.type === TaskType.TIME_INDEPENDENT ? (
                <Clock className="w-4 h-4 text-sky-500" />
              ) : task.type === TaskType.TIME_ACCUMULATED ? (
                <BrickWall className="w-4 h-4 text-pink-500" />
              ) : (
                <Hourglass className="w-4 h-4 text-indigo-600" />
              )}
              <input 
                type="number"
                min="1"
                max={3}
                value={task.duration}
                onChange={(e) => {
                  let val: any = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (typeof val === 'number') {
                    val = Math.min(3, val);
                  }
                  setTask({ ...task, duration: val });
                }}
                onBlur={() => {
                  if (task.duration === '' || task.duration < 1) {
                    setTask({ ...task, duration: 1 });
                  }
                }}
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
              />
            </div>
          </div>
        )}

        {(onAdd || isEditing) && (
          <div className="flex gap-2">
            {isEditing && onCancel && (
              <button 
                onClick={onCancel}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-[10px] text-xs font-black hover:bg-slate-200 transition-colors"
              >
                {t('statsModal.cancel')}
              </button>
            )}
            {isEditing && (task as any).onDelete && (
              <button 
                onClick={(task as any).onDelete}
                className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-[10px] text-xs font-black hover:bg-rose-100 transition-colors"
              >
                {t('statsModal.deleteRoutine')}
              </button>
            )}
            <button 
              onClick={onAdd}
              disabled={!task.text.trim()}
              className="flex-[2] py-3 bg-indigo-600 text-white rounded-[10px] text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? t('statsModal.editComplete') : t('statsModal.addRoutineBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SortableRoutineItem = ({ 
  rt, 
  idx, 
  onEdit, 
  onDelete,
  groupScheduledDays
}: any) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: rt.id });

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
      className="bg-white p-3 rounded-[10px] border border-slate-200 flex items-center justify-between shadow-none group"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">{idx + 2}. {rt.text}</span>
            {rt.checklist && rt.checklist.length > 0 && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex-shrink-0">
                <CheckCircle2 className="w-2 h-2" />
                <span>{t('statsModal.checklist')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              {rt.type === TaskType.TIME_INDEPENDENT ? (
                <Clock className="w-3 h-3 text-sky-500" />
              ) : rt.type === TaskType.TIME_ACCUMULATED ? (
                <BrickWall className="w-3 h-3 text-pink-500" />
              ) : (
                <Hourglass className="w-3 h-3 text-indigo-600" />
              )}
              <span className="text-[10px] font-bold text-slate-400">{rt.duration}{t('home.minutes', { minutes: '' })}</span>
            </div>
            {(() => {
              const isSameSchedule = JSON.stringify([...(rt.scheduledDays || [])].sort()) === JSON.stringify([...(groupScheduledDays || [])].sort());
              if (!isSameSchedule) {
                const dayOrder = [1, 2, 3, 4, 5, 6, 0];
                const weekDays = t('common.days', { returnObjects: true }) as string[] || ['월', '화', '수', '목', '금', '토', '일'];
                
                const getDayLabelForSortable = (dayNum: number) => {
                  if (dayNum === 0) return weekDays[6]; // Sunday
                  return weekDays[dayNum - 1]; // Monday to Saturday
                };

                return (
                  <div className="flex items-center gap-1">
                    {dayOrder.map((dayNum) => {
                      const isScheduled = (rt.scheduledDays || []).includes(dayNum);
                      return (
                        <div 
                          key={dayNum}
                          className={`relative flex items-center justify-center w-[16px] h-[16px] rounded-full border transition-all ${
                            isScheduled 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                              : 'bg-slate-50 border-slate-100 text-slate-300'
                          }`}
                        >
                          <span className="text-[8px] font-black z-10">{getDayLabelForSortable(dayNum)}</span>
                          {!isScheduled && (
                            <X className="absolute w-full h-full text-slate-300/40" strokeWidth={5} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RoutineEditModal = ({ 
  onClose, 
  task, 
  setTask, 
  onSave, 
  onOpenChecklist, 
  groupScheduledDays, 
  label 
}: { 
  onClose: () => void, 
  task: any, 
  setTask: (t: any) => void, 
  onSave: () => void, 
  onOpenChecklist?: () => void, 
  groupScheduledDays: number[], 
  label: React.ReactNode 
}) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[25px] w-full max-w-sm shadow-none overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <label className="inline-block px-2 py-0.5 bg-sky-100/70 rounded-md text-lg font-black text-slate-700 uppercase tracking-wider ml-1 mb-4 mt-6">
    {children}
  </label>
);

// --- 메인 컴포넌트 내보내기 ---

export const RoutineGroupFormView: React.FC<{
  addChunk: (name: string, purpose: string, tasks: Task[], scheduleType: 'days', scheduledDays: number[], startTime?: string, isAlarmEnabled?: boolean, startType?: 'anytime' | 'situation' | 'time', situation?: string) => void;
  updateChunk?: (id: string, updatedData: Partial<RoutineChunk>) => void;
  initialChunk?: RoutineChunk;
  setActiveTab: (tab: any) => void;
  setSettingsSubView: (view: any) => void;
  setIsSettingsOpen: (open: boolean) => void;
  userData: UserData;
  activeTab?: string;
  mode?: 'add' | 'edit';
  onDirtyChange?: (isDirty: boolean) => void;
  menuBarProps?: any;
}> = ({ addChunk, updateChunk, initialChunk, setActiveTab, setSettingsSubView, setIsSettingsOpen, userData: _userData, activeTab, mode = 'add', onDirtyChange, menuBarProps }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [triggerTask, setTriggerTask] = useState({ text: '', duration: 1, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6], checklist: [] as any[] });
  const [routineList, setRoutineList] = useState<Array<{ id: string, text: string, duration: number, type: TaskType, scheduledDays: number[], checklist: any[] }>>([]);
  const [currentRoutineInput, setCurrentRoutineInput] = useState({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: [0, 1, 2, 3, 4, 5, 6], checklist: [] as any[] });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    validationValue?: string;
    validationPlaceholder?: string;
    confirmColor?: 'rose' | 'indigo';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: t('common.confirm'),
    cancelLabel: t('common.cancel'),
    showCancel: true,
    onConfirm: () => {}
  });
  
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const prevScheduledDaysRef = React.useRef<number[]>(scheduledDays);

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

        const middle = tasks.slice(1);
        setRoutineList(middle.map(tItem => ({
          id: tItem.id,
          text: tItem.text,
          duration: tItem.targetDuration || 1,
          type: tItem.taskType || TaskType.TIME_LIMITED,
          scheduledDays: tItem.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
          checklist: (tItem as any).checklist || []
        })));
      }
    }
  }, [initialChunk]);

  // 스마트 요일 동기화 (그룹 요일 변경 시 개별 루틴 요일 자동 업데이트)
  useEffect(() => {
    const prevDays = prevScheduledDaysRef.current;
    const added = scheduledDays.filter(d => !prevDays.includes(d));
    const removed = prevDays.filter(d => !scheduledDays.includes(d));

    if (added.length > 0 || removed.length > 0) {
      // 1. Trigger Task: Always follows group schedule
      setTriggerTask(prev => ({ ...prev, scheduledDays: scheduledDays }));

      // 2. Routine List: 
      // - Add newly activated group days
      // - Remove newly deactivated group days
      // - Respect manual deactivations (added days are added, but existing ones are kept as is unless removed from group)
      setRoutineList(prev => prev.map(tItem => {
        let nextDays = tItem.scheduledDays || [];
        // Add newly activated group days
        if (added.length > 0) nextDays = [...nextDays, ...added];
        // Remove newly deactivated group days
        if (removed.length > 0) nextDays = nextDays.filter(d => !removed.includes(d));
        return { ...tItem, scheduledDays: [...new Set(nextDays)].sort() };
      }));

      // 3. Current Input: Same logic as routine list
      setCurrentRoutineInput(prev => {
        let nextDays = prev.scheduledDays || [];
        if (added.length > 0) nextDays = [...nextDays, ...added];
        if (removed.length > 0) nextDays = nextDays.filter(d => !removed.includes(d));
        return { ...prev, scheduledDays: [...new Set(nextDays)].sort() };
      });

      prevScheduledDaysRef.current = scheduledDays;
    }
  }, [scheduledDays]);

  const [startTime, setStartTime] = useState('07:00');
  const [startType, setStartType] = useState<'anytime' | 'situation' | 'time'>('anytime');
  const [situation, setSituation] = useState('');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingRoutineIndex, setEditingRoutineIndex] = useState<number | null>(null);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [activeChecklistTarget, setActiveChecklistTarget] = useState<'trigger' | 'current' | null>(null);
  const [routineAddedMessage, setRoutineAddedMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [groupAddedMessage, setGroupAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (routineAddedMessage) {
      const timer = setTimeout(() => setRoutineAddedMessage(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [routineAddedMessage]);

  useEffect(() => {
    if (deletionMessage) {
      const timer = setTimeout(() => setDeletionMessage(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [deletionMessage]);

  useEffect(() => {
    if (groupAddedMessage) {
      const timer = setTimeout(() => setGroupAddedMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [groupAddedMessage]);

  // 팝업 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    const isLocalModalOpen = isEditModalOpen || confirmModal.isOpen || isChecklistModalOpen;
    if (isLocalModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isEditModalOpen, confirmModal.isOpen, isChecklistModalOpen]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (mode === 'add') {
      const hasTriggerChecklist = (triggerTask as any).checklist && (triggerTask as any).checklist.length > 0;
      const hasRoutineChecklist = routineList.some(r => (r as any).checklist && (r as any).checklist.length > 0);
      const hasCurrentInput = currentRoutineInput.text.trim() !== '' || (currentRoutineInput.checklist && (currentRoutineInput.checklist as any[]).length > 0);
      const isDirty = name.trim() !== '' || purpose.trim() !== '' || triggerTask.text.trim() !== '' || routineList.length > 0 || hasTriggerChecklist || hasRoutineChecklist || hasCurrentInput;
      onDirtyChange?.(isDirty);
    } else if (mode === 'edit' && initialChunk) {
      // 수정 모드 변경 사항 비교 감지 로직
      const isNameNew = name !== initialChunk.name;
      const isPurposeNew = purpose !== (initialChunk.purpose || '');
      const isDaysNew = JSON.stringify([...scheduledDays].sort()) !== JSON.stringify([...initialChunk.scheduledDays].sort());
      const isStartTimeNew = (startType === 'time' ? startTime : '') !== (initialChunk.startTime || '');
      const isStartTypeNew = startType !== (initialChunk.startType || 'anytime');
      const isSituationNew = situation !== (initialChunk.situation || '');
      const isAlarmNew = isAlarmEnabled !== (initialChunk.isAlarmEnabled || false);

      // 루틴 항목 목록 변경 사항 비교
      const initialTasks = initialChunk.tasks || [];
      const isTriggerNew = initialTasks.length === 0 || 
        triggerTask.text !== initialTasks[0].text || 
        triggerTask.duration !== initialTasks[0].targetDuration || 
        triggerTask.type !== initialTasks[0].taskType ||
        JSON.stringify((triggerTask as any).checklist || []) !== JSON.stringify((initialTasks[0] as any).checklist || []);
      
      const currentRoutineListTasks = routineList;
      const initialRoutineListTasks = initialTasks.slice(1);
      
      let isRoutineListNew = currentRoutineListTasks.length !== initialRoutineListTasks.length;
      if (!isRoutineListNew) {
        for (let i = 0; i < currentRoutineListTasks.length; i++) {
          if (currentRoutineListTasks[i].text !== initialRoutineListTasks[i].text || 
              currentRoutineListTasks[i].duration !== initialRoutineListTasks[i].targetDuration || 
              currentRoutineListTasks[i].type !== initialRoutineListTasks[i].taskType ||
              JSON.stringify((currentRoutineListTasks[i] as any).checklist || []) !== JSON.stringify((initialRoutineListTasks[i] as any).checklist || [])) {
            isRoutineListNew = true;
            break;
          }
        }
      }

      const hasCurrentInput = currentRoutineInput.text.trim() !== '' || (currentRoutineInput.checklist && (currentRoutineInput.checklist as any[]).length > 0);
      const isDirty = isNameNew || isPurposeNew || isDaysNew || isStartTimeNew || isStartTypeNew || isSituationNew || isAlarmNew || isTriggerNew || isRoutineListNew || hasCurrentInput;
      onDirtyChange?.(isDirty);
    }
  }, [name, purpose, triggerTask, routineList, scheduledDays, startTime, startType, situation, isAlarmEnabled, mode, initialChunk, onDirtyChange]);

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
      setRoutineList([...routineList, { ...taskToSave, id: `new-rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
      setRoutineAddedMessage(t('statsModal.routineAdded', { name: taskToSave.text }));
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
          title: t('statsModal.routineDeleteTitle'),
          message: t('statsModal.routineDeleteConfirm', { name: routine.text }),
          confirmLabel: t('statsModal.delete'),
          confirmColor: 'rose',
          onConfirm: () => {
            setRoutineList(prev => prev.filter((_, i) => i !== idx));
            setEditingRoutineIndex(null);
            setIsEditModalOpen(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setDeletionMessage(t('statsModal.routineDeleted'));
          }
        });
      }
    } as any);
    setIsEditModalOpen(true);
  };

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = routineList.findIndex((rt) => rt.id === active.id);
      const newIndex = routineList.findIndex((rt) => rt.id === over.id);
      setRoutineList(arrayMove(routineList, oldIndex, newIndex));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage(t('statsModal.enterGroupName'));
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage(t('statsModal.enterGroupPurpose'));
      return;
    }
    
    const finalTasks: Task[] = [];
    const now = Date.now();
    
    // 기존 루틴 상태(시작 시간, 누적 시간, 상태 등) 보존을 위한 맵 생성
    const existingTasksMap = new Map<string, Task>();
    if (mode === 'edit' && initialChunk) {
      initialChunk.tasks.forEach(tItem => existingTasksMap.set(tItem.id, tItem));
    }

    // 1. Trigger Task
    const triggerId = mode === 'edit' && initialChunk?.tasks[0]?.id ? initialChunk.tasks[0].id : `trigger-${now}`;
    const existingTrigger = existingTasksMap.get(triggerId);
    finalTasks.push({
      ...(existingTrigger || {}),
      id: triggerId,
      text: triggerTask.text || t('statsModal.defaultTriggerName'),
      targetDuration: Math.min(3, Number(triggerTask.duration) || 1),
      taskType: triggerTask.type,
      scheduledDays: triggerTask.scheduledDays.filter(d => scheduledDays.includes(d)),
      checklist: (triggerTask as any).checklist || [],
      // Ensure basic state if it's a new task
      completed: existingTrigger ? existingTrigger.completed : false,
      status: existingTrigger ? existingTrigger.status : TaskStatus.NOT_STARTED
    } as Task);
    
    // 2. Routine List
    routineList.forEach((rt, idx) => {
      const rtId = rt.id.startsWith('new-rt-') ? `routine-${idx}-${now}` : rt.id;
      const existingRt = existingTasksMap.get(rtId);
      finalTasks.push({
        ...(existingRt || {}),
        id: rtId,
        text: rt.text,
        targetDuration: Number(rt.duration) || 1,
        taskType: rt.type,
        scheduledDays: rt.scheduledDays.filter(d => scheduledDays.includes(d)),
        checklist: (rt as any).checklist || [],
        // Ensure basic state if it's a new task
        completed: existingRt ? existingRt.completed : false,
        status: existingRt ? existingRt.status : TaskStatus.NOT_STARTED
      } as Task);
    });

    // 3. Current Input (if not empty)
    if (currentRoutineInput.text.trim()) {
      finalTasks.push({
        id: `routine-last-${now}`,
        text: currentRoutineInput.text,
        completed: false,
        status: TaskStatus.NOT_STARTED,
        targetDuration: Number(currentRoutineInput.duration) || 1,
        taskType: currentRoutineInput.type,
        scheduledDays: currentRoutineInput.scheduledDays.filter(d => scheduledDays.includes(d)),
        checklist: (currentRoutineInput as any).checklist || []
      } as Task);
    }
    
    if (finalTasks.length < 2) {
      setErrorMessage(t('statsModal.twoRoutinesRequired'));
      return;
    }
    setErrorMessage(null);

    if (mode === 'edit' && initialChunk && updateChunk) {
      updateChunk(initialChunk.id, {
        name,
        purpose,
        tasks: finalTasks,
        scheduledDays,
        startTime: startType === 'time' ? startTime : '',
        isAlarmEnabled,
        startType,
        situation
      });
      
      setSaveSuccessMessage(t('statsModal.changesSaved'));
      setTimeout(() => {
        setSaveSuccessMessage(null);
        // Only go back if it was opened from execution screen
        if (activeTab === 'execution') {
          setSettingsSubView({ type: 'main' });
          setIsSettingsOpen(false);
        } else {
          setSettingsSubView({ type: 'main' });
        }
      }, 2000);
    } else {
      addChunk(name, purpose, finalTasks, 'days', scheduledDays, startType === 'time' ? startTime : '', isAlarmEnabled, startType, situation);
      setActiveTab('home');
    }
  };

  const openChecklistModal = (target: 'trigger' | 'current') => {
    setActiveChecklistTarget(target);
    setIsChecklistModalOpen(true);
  };

  const daysFromTranslation = t('common.days', { returnObjects: true }) as string[] || ['월', '화', '수', '목', '금', '토', '일'];
  const getDayLabel = (val: number) => {
    if (val === 0) return daysFromTranslation[6]; // Sunday
    return daysFromTranslation[val - 1]; // Monday to Saturday
  };

  const renderFormContent = () => {
    return (
      <div className="space-y-5 pb-20">
      {/* 루틴 추가/삭제/수정 알림 팝업 */}
      <AnimatePresence>
        {(routineAddedMessage || deletionMessage || saveSuccessMessage || groupAddedMessage) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] pointer-events-none"
          >
            <div className={`bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-[20px] shadow-none flex flex-col items-center gap-2 border border-white/10 min-w-[200px] ${deletionMessage ? 'border-rose-500/30' : (saveSuccessMessage ? 'border-indigo-500/30' : 'border-emerald-500/30')}`}>
              <div className={`w-10 h-10 ${deletionMessage ? 'bg-rose-500/20' : (saveSuccessMessage ? 'bg-indigo-500/20' : 'bg-emerald-500/20')} rounded-full flex items-center justify-center mb-1`}>
                {deletionMessage ? (
                  <Trash2 className="w-6 h-6 text-rose-400" />
                ) : (
                  <Check className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <span className="text-sm font-black tracking-tight text-center">
                {deletionMessage || routineAddedMessage || saveSuccessMessage || groupAddedMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <RoutineEditModal 
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
            label={<div className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> {t('statsModal.editRoutineTitle')}</div>}
          />
        )}
      </AnimatePresence>

      <ChecklistModal 
        isOpen={isChecklistModalOpen}
        onClose={() => {
          setIsChecklistModalOpen(false);
          setActiveChecklistTarget(null);
        }}
        checklist={activeChecklistTarget === 'trigger' ? (triggerTask as any).checklist || [] : (currentRoutineInput as any).checklist || []}
        setChecklist={(items) => {
          if (activeChecklistTarget === 'trigger') {
            setTriggerTask({ ...triggerTask, checklist: items } as any);
          } else {
            setCurrentRoutineInput({ ...currentRoutineInput, checklist: items } as any);
          }
        }}
        setConfirmModal={setConfirmModal}
      />
      {/* 여백 조정 포인트: px-2.5 (기존 p-5에서 좌우 여백만 절반으로 축소) */}
      <div className="bg-white border border-slate-200 rounded-[10px] px-2.5 py-5 shadow-none space-y-5">
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              {mode === 'edit' ? (
                <Settings className="w-6 h-6 text-indigo-600" />
              ) : (
                <PlusCircle className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900">{mode === 'edit' ? t('statsModal.editGroupTitle') : t('statsModal.createGroupTitle')}</h2>
          </div>
        </div>
        <div className="space-y-5">
          {/* 그룹 이름 입력 */}
          <div className="space-y-3">
            <SectionTitle>{t('statsModal.groupNameLabel')}</SectionTitle>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('statsModal.groupNamePlaceholder')}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 그룹 다짐/목적 입력 */}
          <div className="space-y-3">
            <SectionTitle>{t('statsModal.purposeLabel')}</SectionTitle>
            {renderDescription(t('statsModal.purposeSubLabel'), '-mt-3 ml-1 mb-2')}

            <input 
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t('statsModal.purposePlaceholder')}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 요일 설정 */}
          <div className="space-y-3">
            <SectionTitle>{t('statsModal.daysLabel')}</SectionTitle>
            {renderDescription(t('statsModal.daysSubLabel'), '-mt-3 ml-1 mb-2')}
            <div className="flex flex-wrap gap-2">
              {[
                { label: getDayLabel(1), value: 1 },
                { label: getDayLabel(2), value: 2 },
                { label: getDayLabel(3), value: 3 },
                { label: getDayLabel(4), value: 4 },
                { label: getDayLabel(5), value: 5 },
                { label: getDayLabel(6), value: 6, color: 'bg-emerald-600' },
                { label: getDayLabel(0), value: 0, color: 'bg-rose-600' }
              ].map((dayObj) => {
                const i = dayObj.value;
                const isSelected = scheduledDays.includes(i);
                const selectedColor = dayObj.color || 'bg-indigo-600';
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (scheduledDays.includes(i)) {
                        setScheduledDays(scheduledDays.filter(d => d !== i));
                      } else {
                        setScheduledDays([...scheduledDays, i].sort());
                      }
                    }}
                    className={`w-10 h-10 rounded-[10px] text-sm font-black transition-all ${isSelected ? `${selectedColor} text-white shadow-none` : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {dayObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시작 방법 설정 (언제든지, 특정 상황, 지정 시각) */}
          <div className="space-y-0">
            <SectionTitle>{t('statsModal.startTypeLabel')}</SectionTitle>
            
            <div className="relative">
              {/* 인덱스 스타일 탭 디자인 */}
              <div className="flex items-end gap-1 px-0 relative z-10">
                {[
                  { id: 'anytime', label: t('statsModal.anytime') },
                  { id: 'situation', label: t('statsModal.situation') },
                  { id: 'time', label: t('statsModal.time') }
                ].map((tab) => {
                  const isActive = startType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStartType(tab.id as any);
                        if (tab.id !== 'time') setIsAlarmEnabled(false);
                      }}
                      className={`px-4 py-2 rounded-t-[10px] text-sm font-black transition-all border-x border-t ${
                        isActive 
                          ? 'bg-white border-slate-200 text-slate-700 -mb-px' 
                          : 'bg-slate-100/50 border-transparent text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* 탭 연결 콘텐츠 영역 */}
              <div className="bg-white border border-slate-200 rounded-[12px] rounded-tl-none px-4 py-4 min-h-[85px] flex flex-col justify-center">
                <div className="animate-in fade-in duration-300">
                  {startType === 'anytime' && (
                    <div className="flex items-center justify-start">
                      <p className="text-sm font-black text-slate-700 ml-1">
                        {t('statsModal.anytimeDesc')}
                      </p>
                    </div>
                  )}

                  {startType === 'situation' && (
                    <div className="flex items-center justify-start w-full px-0">
                      <input 
                        type="text"
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        placeholder={t('statsModal.situationPlaceholder')}
                        spellCheck={false}
                        autoComplete="off"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[10px] px-4 py-2 text-sm font-black text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all focus:bg-white"
                      />
                    </div>
                  )}

                  {startType === 'time' && (
                    <div className="flex items-center justify-start gap-5">
                      {/* 시간 입력 필드 */}
                      <div className="flex items-center focus-within:ring-0 transition-all">
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          spellCheck={false}
                          autoComplete="off"
                          className="text-lg font-black bg-transparent border-none focus:ring-0 p-0 text-slate-700 tabular-nums"
                          style={{ width: '130px' }} 
                        />
                      </div>

                      {/* 알림 설정 토글 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-slate-700">
                          {isAlarmEnabled ? t('statsModal.alarmOn') : t('statsModal.alarmOff')}
                        </span>
                        <button 
                          type="button"
                          onClick={async () => {
                            if (!isAlarmEnabled) {
                              const status = await notificationService.requestPermission();
                              if (status !== 'granted') {
                                (window as any).__showPermissionGuide?.();
                                return;
                              }
                            }
                            setIsAlarmEnabled(!isAlarmEnabled);
                          }}
                          className="w-10 h-5 rounded-full transition-all relative border-0 p-0 cursor-pointer shadow-none overflow-hidden"
                          style={{ backgroundColor: isAlarmEnabled ? 'rgb(79 70 229)' : 'rgb(203 213 225)' }}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isAlarmEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 루틴 목록 및 입력 섹션 */}
          <div className="space-y-5">
            <TaskInputSection 
              label={<SectionTitle>{t('statsModal.triggerRoutineLabel')}</SectionTitle>}
              task={triggerTask}
              setTask={setTriggerTask}
              isTrigger={true}
              description={t('statsModal.triggerRoutineDesc')}
              onOpenChecklist={() => openChecklistModal('trigger')}
              groupScheduledDays={scheduledDays}
            />

            <div className="space-y-3">
              <SectionTitle>{t('statsModal.addRoutineLabel')}</SectionTitle>
              
              {/* 추가된 하위 루틴 목록 */}
              {routineList.length > 0 && (
                <div className="space-y-3 mb-4">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleRoutineDragEnd}
                  >
                    <div className="space-y-4">
                      <SortableContext 
                        items={routineList.map(rt => rt.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {routineList.map((rt, idx) => (
                            <SortableRoutineItem 
                              key={rt.id} 
                              rt={rt} 
                              idx={idx} 
                              onEdit={() => startEditing(idx)}
                              onDelete={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: t('statsModal.routineDeleteTitle'),
                                  message: t('statsModal.routineDeleteConfirm', { name: rt.text }),
                                  confirmLabel: t('statsModal.delete'),
                                  confirmColor: 'rose',
                                  onConfirm: () => {
                                    setRoutineList(prev => prev.filter(item => item.id !== rt.id));
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    setDeletionMessage(t('statsModal.routineDeleted'));
                                  }
                                });
                              }}
                              groupScheduledDays={scheduledDays}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  </DndContext>
                </div>
              )}

              {/* 새로운 개별 루틴 입력창 */}
              <div id="routine-input-section">
                <TaskInputSection 
                  label=""
                  task={currentRoutineInput}
                  setTask={setCurrentRoutineInput}
                  onAdd={addRoutineToList}
                  isEditing={editingRoutineIndex !== null}
                  onCancel={() => {
                    setEditingRoutineIndex(null);
                    setCurrentRoutineInput({ text: '', duration: 10, type: TaskType.TIME_LIMITED, scheduledDays: scheduledDays, checklist: [] });
                  }}
                  onOpenChecklist={() => openChecklistModal('current')}
                  groupScheduledDays={scheduledDays}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 취소 및 저장 버튼 영역 */}
      <div className="space-y-3">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-[10px] flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const hasTriggerChecklist = (triggerTask as any).checklist && (triggerTask as any).checklist.length > 0;
              const hasRoutineChecklist = routineList.some(r => (r as any).checklist && (r as any).checklist.length > 0);
              const hasCurrentInput = currentRoutineInput.text.trim() !== '' || (currentRoutineInput.checklist && (currentRoutineInput.checklist as any[]).length > 0);
              
              if (mode === 'edit') {
                const isNameNew = name !== initialChunk?.name;
                const isPurposeNew = purpose !== (initialChunk?.purpose || '');
                const isDaysNew = JSON.stringify([...scheduledDays].sort()) !== JSON.stringify([...(initialChunk?.scheduledDays || [])].sort());
                const isStartTimeNew = (startType === 'time' ? startTime : '') !== (initialChunk?.startTime || '');
                const isStartTypeNew = startType !== (initialChunk?.startType || 'anytime');
                const isSituationNew = situation !== (initialChunk?.situation || '');
                const isAlarmNew = isAlarmEnabled !== (initialChunk?.isAlarmEnabled || false);

                const currentTasks = routineList;
                const initialTasks = initialChunk?.tasks?.slice(1) || [];
                let isRoutineListNew = currentTasks.length !== initialTasks.length;
                if (!isRoutineListNew) {
                  for (let i = 0; i < currentTasks.length; i++) {
                    if (currentTasks[i].text !== initialTasks[i].text || 
                        currentTasks[i].duration !== initialTasks[i].targetDuration || 
                        currentTasks[i].type !== initialTasks[i].taskType ||
                        JSON.stringify((currentTasks[i] as any).checklist || []) !== JSON.stringify((initialTasks[i] as any).checklist || [])) {
                      isRoutineListNew = true;
                      break;
                    }
                  }
                }

                const isTriggerNew = (initialChunk?.tasks?.length || 0) === 0 || 
                  triggerTask.text !== initialChunk?.tasks[0].text || 
                  triggerTask.duration !== initialChunk?.tasks[0].targetDuration || 
                  triggerTask.type !== initialChunk?.tasks[0].taskType ||
                  JSON.stringify((triggerTask as any).checklist || []) !== JSON.stringify((initialChunk?.tasks[0] as any).checklist || []);

                const isDirty = isNameNew || isPurposeNew || isDaysNew || isStartTimeNew || isStartTypeNew || isSituationNew || isAlarmNew || isTriggerNew || isRoutineListNew || hasCurrentInput;

                if (isDirty) {
                  setConfirmModal({
                    isOpen: true,
                    title: t('statsModal.cancelEditTitle'),
                    message: t('statsModal.cancelEditConfirm'),
                    confirmLabel: t('statsModal.cancelAndExit'),
                    cancelLabel: t('statsModal.keepEditing'),
                    confirmColor: 'indigo',
                    showCancel: true,
                    onConfirm: () => {
                      if (activeTab === 'execution' && setIsSettingsOpen) setIsSettingsOpen(false);
                      if (setSettingsSubView) setSettingsSubView({ type: 'main' });
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                } else {
                  if (activeTab === 'execution' && setIsSettingsOpen) setIsSettingsOpen(false);
                  if (setSettingsSubView) setSettingsSubView({ type: 'main' });
                }
              } else {
                const isDirty = name.trim() !== '' || purpose.trim() !== '' || triggerTask.text.trim() !== '' || routineList.length > 0 || hasTriggerChecklist || hasRoutineChecklist || hasCurrentInput;
                if (isDirty) {
                  setConfirmModal({
                    isOpen: true,
                    title: t('statsModal.cancelInputTitle'),
                    message: t('statsModal.cancelInputConfirm'),
                    confirmLabel: t('statsModal.exitWithoutSaving'),
                    cancelLabel: t('statsModal.keepWriting'),
                    confirmColor: 'indigo',
                    showCancel: true,
                    onConfirm: () => {
                      onDirtyChange?.(false);
                      setActiveTab('home');
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                } else {
                  onDirtyChange?.(false);
                  setActiveTab('home');
                }
              }
            }}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[10px] font-black text-lg hover:bg-slate-200 transition-all"
          >
            {t('statsModal.cancelBtn')}
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-[10px] font-black text-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            {mode === 'edit' ? t('statsModal.saveGroupBtn') : t('statsModal.createGroupBtn')}
          </button>
        </div>
      </div>

      {/* 삭제 확인을 위한 모달 다이얼로그 */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => {
          if (confirmModal.onCancel) {
            confirmModal.onCancel();
          } else {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        showCancel={confirmModal.showCancel}
        validationValue={confirmModal.validationValue}
        validationPlaceholder={confirmModal.validationPlaceholder}
        confirmColor={confirmModal.confirmColor}
      />
    </div>
  );
  };

  if (!menuBarProps) {
    return renderFormContent();
  }

  return (
    <div className="w-full">
      <MenuBar {...menuBarProps} />
      <div className="max-w-2xl mx-auto px-4 pt-[10px] pb-[100px] space-y-3">
        {renderFormContent()}
      </div>
    </div>
  );
};
