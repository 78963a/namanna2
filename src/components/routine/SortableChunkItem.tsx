import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import { RoutineChunk } from '../../types';

interface SortableChunkItemProps {
  chunk: RoutineChunk;
  onEnterDetail: (id: string) => void;
  onUpdateInfo: (id: string, newName: string, newPurpose: string) => void;
  onDelete: (id: string) => void;
  editingChunkId: string | null;
  setEditingChunkId: (id: string | null) => void;
  editingChunkName: string;
  setEditingChunkName: (name: string) => void;
  editingChunkPurpose: string;
  setEditingChunkPurpose: (purpose: string) => void;
}

/**
 * A sortable item representing a routine group (chunk) in the settings list.
 * Supports reordering, basic info editing, and deletion.
 * 
 * @param {SortableChunkItemProps} props - Component properties
 * @returns {JSX.Element} The rendered sortable chunk item
 */
export const SortableChunkItem: React.FC<SortableChunkItemProps> = ({
  chunk,
  onEnterDetail,
  onUpdateInfo,
  onDelete,
  editingChunkId,
  setEditingChunkId,
  editingChunkName,
  setEditingChunkName,
  editingChunkPurpose,
  setEditingChunkPurpose,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chunk.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="px-3 py-2 bg-white rounded-[10px] border border-slate-100 group flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 flex-grow min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        
        {editingChunkId === chunk.id ? (
          <div className="flex flex-col gap-2 flex-grow mr-4">
            <input 
              type="text"
              value={editingChunkName}
              onChange={(e) => setEditingChunkName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full bg-white border border-slate-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={editingChunkPurpose}
                onChange={(e) => setEditingChunkPurpose(e.target.value)}
                placeholder="그룹 목적"
                className="flex-grow bg-white border border-slate-200 rounded-[10px] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onUpdateInfo(chunk.id, editingChunkName, editingChunkPurpose);
                  if (e.key === 'Escape') setEditingChunkId(null);
                }}
              />
              <button 
                onClick={() => onUpdateInfo(chunk.id, editingChunkName, editingChunkPurpose)}
                className="text-xs font-bold text-indigo-600 whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <button 
              onClick={() => onEnterDetail(chunk.id)}
              className="flex-grow text-left group/title flex items-center gap-2 min-w-0"
            >
              <h4 className="font-black text-slate-900 group-hover/title:text-indigo-600 transition-colors whitespace-nowrap truncate">
                {chunk.name}
              </h4>
              <div className="relative group/tooltip flex-shrink-0">
                <Settings className="w-4 h-4 text-slate-300 group-hover/title:text-indigo-400 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  상세설정
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onDelete(chunk.id)}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          title="그룹 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
