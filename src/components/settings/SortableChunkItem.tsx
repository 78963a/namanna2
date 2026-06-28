import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Bell, Settings, Trash2 } from 'lucide-react';
import { RoutineChunk } from '../../types';

interface SortableChunkItemProps {
  chunk: RoutineChunk;
  onEnterDetail: (id: string) => void;
  onUpdateInfo: (id: string, name: string, purpose: string) => void;
  onDelete: (id: string) => void;
  editingChunkId: string | null;
  setEditingChunkId: (id: string | null) => void;
  editingChunkName: string;
  setEditingChunkName: (name: string) => void;
  editingChunkPurpose: string;
  setEditingChunkPurpose: (purpose: string) => void;
}

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
  const { t } = useTranslation();
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
    <div ref={setNodeRef} style={style} className="p-[15px] bg-slate-50 rounded-[10px] border border-slate-100 group flex items-center justify-between">
      <div className="flex items-center gap-3 flex-grow min-w-0">
        <button {...attributes} {...listeners} style={{ touchAction: 'none' }} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 flex-shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>
        
        {editingChunkId === chunk.id ? (
          <div className="flex flex-col gap-2 flex-grow mr-4">
            <input 
              type="text"
              value={editingChunkName}
              onChange={(e) => setEditingChunkName(e.target.value)}
              placeholder={t('settings.groupNamePlaceholderSimple')}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-[10px] px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={editingChunkPurpose}
                onChange={(e) => setEditingChunkPurpose(e.target.value)}
                placeholder={t('settings.groupPurposePlaceholderSimple')}
                spellCheck={false}
                autoComplete="off"
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
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <button 
              onClick={() => onEnterDetail(chunk.id)}
              className="flex-grow text-left group/title flex items-center gap-2 min-w-0"
            >
              <h4 className="font-black text-slate-900 group-hover/title:text-indigo-600 transition-colors whitespace-nowrap truncate flex items-center gap-1.5">
                {chunk.name}
                {chunk.isAlarmEnabled && <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />}
              </h4>
              <div className="relative group/tooltip flex-shrink-0">
                <Settings className="w-4 h-4 text-slate-300 group-hover/title:text-indigo-400 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {t('settings.edit')}
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
          title={t('routine.deleteGroupTitle')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
