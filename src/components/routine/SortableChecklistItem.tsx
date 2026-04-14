import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { ChecklistItem } from '../../types';

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onRemove: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

/**
 * A sortable item representing a checklist entry.
 * 
 * @param {SortableChecklistItemProps} props - Component properties
 * @returns {JSX.Element} The rendered sortable checklist item
 */
export const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({ 
  item, 
  onRemove, 
  onEdit 
}) => {
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
    if (editText && editText.trim() && editText !== item.text) {
      onEdit(item.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-slate-50 rounded-[10px] border border-slate-100 group transition-all ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-400 transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
          className="flex-grow bg-white border border-indigo-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      ) : (
        <span className="flex-grow text-sm font-bold text-slate-700 truncate">
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
            onRemove(item.id);
          }}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
