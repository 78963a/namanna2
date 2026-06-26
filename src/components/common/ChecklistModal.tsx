import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  CheckCircle2, 
  PlusCircle, 
  GripVertical, 
  Edit2, 
  Trash2 
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
import { ChecklistItem } from '../../types';

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onRemove: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  setConfirmModal: (modal: any) => void;
}

const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({ 
  item, 
  onRemove, 
  onEdit,
  setConfirmModal
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onEdit(item.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100 group transition-all ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
    >
      <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-400 transition-colors mt-0.5">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {isEditing ? (
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEdit();
            }
          }}
          className="flex-grow bg-white border border-indigo-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[40px] resize-none"
        />
      ) : (
        <span className="flex-grow text-sm font-bold text-slate-700 whitespace-pre-wrap break-words">
          {item.text}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: t('statsModal.checklistDeleteTitle'),
              message: t('statsModal.checklistDeleteConfirm'),
              onConfirm: () => {
                onRemove(item.id);
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
              }
            });
          }}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: ChecklistItem[];
  setChecklist: (items: ChecklistItem[]) => void;
  setConfirmModal: (modal: any) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ 
  isOpen, 
  onClose, 
  checklist, 
  setChecklist,
  setConfirmModal
}) => {
  const { t } = useTranslation();
  const [newItemText, setNewItemText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const originalBodyStyle = window.getComputedStyle(document.body).overflow;
      const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyStyle;
        document.documentElement.style.overflow = originalHtmlStyle;
      };
    }
  }, [isOpen]);

  // 자동 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [checklist.length]);

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

  const addItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), text: newItemText, completed: false }]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const editItem = (id: string, newText: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text: newText } : item));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = checklist.findIndex((item) => item.id === active.id);
      const newIndex = checklist.findIndex((item) => item.id === over.id);
      setChecklist(arrayMove(checklist, oldIndex, newIndex));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[10px] shadow-2xl overflow-hidden flex flex-col h-[600px]"
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-6 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{t('statsModal.checklistModalTitle')}</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-2 mb-6 flex-shrink-0">
                <input 
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder={t('statsModal.checklistPlaceholder')}
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-[10px] px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={addItem}
                  className="bg-indigo-600 text-white px-4 rounded-[10px] font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {t('statsModal.add')}
                </button>
              </div>

              <div 
                ref={scrollRef}
                className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 min-h-0" 
                style={{ overscrollBehavior: 'contain' }}
              >
                {checklist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                    <PlusCircle className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-bold">{t('statsModal.emptyChecklist')}</p>
                  </div>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={checklist.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {checklist.map((item) => (
                          <SortableChecklistItem 
                            key={item.id} 
                            item={item} 
                            onRemove={removeItem}
                            onEdit={editItem}
                            setConfirmModal={setConfirmModal}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              <div className="pt-4 flex-shrink-0">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-[10px] font-black text-base hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {t('statsModal.complete')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
