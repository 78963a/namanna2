import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sliders,
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  useSensor, 
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

// Internal Types & Components
import { 
  UserData, 
  SettingsSubView,
} from '../../types';
import { SortableChunkItem } from './SortableChunkItem';

export interface GroupManagementViewProps {
  userData: UserData;
  setSettingsSubView: React.Dispatch<React.SetStateAction<SettingsSubView>>;
  updateChunkInfo: (id: string, newName: string, newPurpose: string) => void;
  deleteChunk: (id: string, onSuccess?: () => void) => void;
  handleChunkDragEnd: (event: any) => void;
}

export const GroupManagementView: React.FC<GroupManagementViewProps> = ({
  userData,
  setSettingsSubView,
  updateChunkInfo,
  deleteChunk,
  handleChunkDragEnd,
}) => {
  const { t } = useTranslation();
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingChunkName, setEditingChunkName] = useState<string>('');
  const [editingChunkPurpose, setEditingChunkPurpose] = useState<string>('');

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <motion.div
      key="groups-settings"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-[15px]"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sliders className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-base font-black text-slate-900">{t('settings.routineGroupManagement')}</h3>
      </div>
      
      <div className="space-y-1">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChunkDragEnd}
        >
          <SortableContext 
            items={userData.routineChunks.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {userData.routineChunks.map((chunk) => (
              <SortableChunkItem 
                key={chunk.id}
                chunk={chunk}
                onEnterDetail={(id) => setSettingsSubView({ type: 'detail', chunkId: id })}
                onUpdateInfo={updateChunkInfo}
                onDelete={deleteChunk}
                editingChunkId={editingChunkId}
                setEditingChunkId={setEditingChunkId}
                editingChunkName={editingChunkName}
                setEditingChunkName={setEditingChunkName}
                editingChunkPurpose={editingChunkPurpose}
                setEditingChunkPurpose={setEditingChunkPurpose}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </motion.div>
  );
};
