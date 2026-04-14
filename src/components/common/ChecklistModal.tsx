import React, { useState } from 'react';
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
import { CheckCircle2, X, PlusCircle } from 'lucide-react';
import { ChecklistItem } from '../../types';
import { SortableChecklistItem } from '../routine/SortableChecklistItem';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: ChecklistItem[];
  setChecklist: (items: ChecklistItem[]) => void;
}

/**
 * A modal dialog for managing a task's checklist.
 * Supports adding, removing, editing, and reordering checklist items via drag-and-drop.
 * 
 * @param {ChecklistModalProps} props - Component properties
 * @returns {JSX.Element} The rendered checklist modal
 */
export const ChecklistModal: React.FC<ChecklistModalProps> = ({ 
  isOpen, 
  onClose, 
  checklist, 
  setChecklist 
}) => {
  const [newItemText, setNewItemText] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[10px] shadow-2xl overflow-hidden flex flex-col"
            style={{ minHeight: '500px', maxHeight: '80vh' }}
          >
            <div className="p-6 space-y-6 flex flex-col h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">체크리스트 만들기</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-[10px] transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <input 
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="체크리스트 항목 입력..."
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-[10px] px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={addItem}
                  className="bg-indigo-600 text-white px-4 rounded-[10px] font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  추가
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 min-h-0">
                {checklist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                    <PlusCircle className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-bold">항목을 추가해보세요</p>
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
                  완료
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
