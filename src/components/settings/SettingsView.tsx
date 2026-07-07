import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Sliders,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { MenuBar } from '../layout/MenuBar';

// Internal Types & Constants
import { 
  Task, 
  RoutineChunk, 
  UserData, 
  SettingsSubView,
  NaggingSettings,
  SoundEffectSettings
} from '../../types';

// Sub-components
import { GeneralSettingsView } from './GeneralSettingsView';
import { GroupManagementView } from './GroupManagementView';
import { SoundSettingsView } from './SoundSettingsView';
import { NaggingSettingsView } from './NaggingSettingsView';
import { CompletionPhrasesSettingsView } from './CompletionPhrasesSettingsView';
import { StatsView } from '../views/StatsView';
import { RoutineGroupFormView } from '../common/RoutineGroupFormView';
import { soundService } from '../../services/soundService';

interface SettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  currentTime: Date;
  settingsSubView: SettingsSubView;
  setSettingsSubView: React.Dispatch<React.SetStateAction<SettingsSubView>>;
  handleSettingsClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isNaggingDirty: boolean;
  setIsNaggingDirty: (val: boolean) => void;
  isEditRoutineDirty: boolean;
  setIsEditRoutineDirty: (val: boolean) => void;
  isSoundSettingsDirty: boolean;
  setIsSoundSettingsDirty: (val: boolean) => void;
  localNaggingSettings: NaggingSettings | null;
  setLocalNaggingSettings: React.Dispatch<React.SetStateAction<NaggingSettings | null>>;
  localSoundSettings: SoundEffectSettings | null;
  setLocalSoundSettings: React.Dispatch<React.SetStateAction<SoundEffectSettings | null>>;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
  setDeletionMessage: (msg: string | null) => void;
  setBackupMessage: (msg: string | null) => void;
  setNaggingSuccessMessage: (msg: string | null) => void;
  setSoundSuccessMessage: (msg: string | null) => void;
  activityLog: Record<string, number[]>;
  setActivityLog: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  addChunk: (name: string, purpose: string, isAlarmEnabled: boolean, alarmTime: string, scheduledDays: number[], tasks: Task[]) => void;
  updateFullChunk: (id: string, updatedData: Partial<RoutineChunk>) => void;
  updateChunkInfo: (id: string, newName: string, newPurpose: string) => void;
  deleteChunk: (id: string, onSuccess?: () => void) => void;
  handleChunkDragEnd: (event: any) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setShowPermissionGuide: (val: boolean) => void;
  syncHistory: (data: UserData, today: string) => UserData;
  mode?: 'main' | 'modal';
  menuBarProps?: any;
  registerNaggingCloseHandler?: (handler: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userData,
  setUserData,
  currentTime,
  settingsSubView,
  setSettingsSubView,
  handleSettingsClose,
  activeTab,
  setActiveTab,
  isNaggingDirty,
  setIsNaggingDirty,
  isEditRoutineDirty,
  setIsEditRoutineDirty,
  isSoundSettingsDirty,
  setIsSoundSettingsDirty,
  localNaggingSettings,
  setLocalNaggingSettings,
  localSoundSettings,
  setLocalSoundSettings,
  setConfirmModal,
  setDeletionMessage,
  setBackupMessage,
  setNaggingSuccessMessage,
  setSoundSuccessMessage,
  activityLog,
  setActivityLog,
  addChunk,
  updateFullChunk,
  updateChunkInfo,
  deleteChunk,
  handleChunkDragEnd,
  setIsSettingsOpen,
  setShowPermissionGuide,
  syncHistory,
  mode = 'main',
  menuBarProps,
  registerNaggingCloseHandler,
}) => {
  const { t } = useTranslation();
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'groups'>('general');

  const renderContent = () => {
    if (settingsSubView.type === 'groupStats') {
      return (
      <div className={`flex flex-col ${mode === 'modal' ? 'h-full overflow-y-auto overscroll-contain' : 'h-auto'} custom-scrollbar animate-in fade-in slide-in-from-bottom-[50px] duration-300`}>
        <StatsView
          userData={userData}
          currentTime={currentTime}
          initialSelectedGroupId={settingsSubView.chunkId}
          isSingleGroupStatsOnly={true}
          onBackOverride={handleSettingsClose}
        />
      </div>
    );
  }

  if (settingsSubView.type === 'main' || settingsSubView.type === 'sound' || settingsSubView.type === 'nagging' || settingsSubView.type === 'completionPhrases' || (activeTab === 'settings' && settingsSubView.type === 'detail')) {
    return (
      <div className={`flex flex-col ${mode === 'modal' ? 'h-full overflow-hidden' : 'h-auto'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* Folder Tab Containers */}
        <div className="flex px-4 items-end relative z-20 flex-shrink-0">
          {/* Left Tab: 일반설정 */}
          <button
            onClick={() => {
              if (settingsSubView.type === 'detail' && isEditRoutineDirty) {
                setConfirmModal({
                  isOpen: true,
                  title: t('statsModal.cancelEditTitle'),
                  message: t('statsModal.cancelEditConfirm'),
                  confirmLabel: t('statsModal.cancelAndExit'),
                  cancelLabel: t('statsModal.keepEditing'),
                  confirmColor: 'indigo',
                  showCancel: true,
                  onConfirm: () => {
                    setIsEditRoutineDirty(false);
                    setActiveSettingsTab('general');
                    setSettingsSubView({ type: 'main' });
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  },
                  onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                return;
              }
              setActiveSettingsTab('general');
              setSettingsSubView({ type: 'main' });
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 cursor-pointer ${
              activeSettingsTab === 'general' 
                ? 'bg-white text-indigo-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Settings className={`w-3.5 h-3.5 ${activeSettingsTab === 'general' ? 'text-indigo-500' : 'text-slate-300'}`} />
            {t('settings.generalSettings')}
            {activeSettingsTab === 'general' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>

          {/* Right Tab: 루틴 그룹 관리 */}
          <button
            onClick={() => {
              if (settingsSubView.type === 'detail' && isEditRoutineDirty) {
                setConfirmModal({
                  isOpen: true,
                  title: t('statsModal.cancelEditTitle'),
                  message: t('statsModal.cancelEditConfirm'),
                  confirmLabel: t('statsModal.cancelAndExit'),
                  cancelLabel: t('statsModal.keepEditing'),
                  confirmColor: 'indigo',
                  showCancel: true,
                  onConfirm: () => {
                    setIsEditRoutineDirty(false);
                    setActiveSettingsTab('groups');
                    setSettingsSubView({ type: 'main' });
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  },
                  onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
                return;
              }
              setActiveSettingsTab('groups');
              setSettingsSubView({ type: 'main' });
            }}
            className={`px-5 py-3 text-xs md:text-sm font-black rounded-t-[15px] transition-all duration-300 relative border-x border-t flex items-center gap-2 cursor-pointer ${
              activeSettingsTab === 'groups' 
                ? 'bg-white text-violet-600 border-slate-100 -mb-[1px] pt-4' 
                : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${activeSettingsTab === 'groups' ? 'text-violet-500' : 'text-slate-300'}`} />
            {t('settings.routineGroupManagement')}
            {activeSettingsTab === 'groups' && <div className="absolute inset-x-0 -bottom-1 bg-white h-2 z-30" />}
          </button>
        </div>

        {/* Main Folder Content Body */}
        <div className={`bg-white rounded-b-[20px] rounded-t-[20px] shadow-sm border border-slate-100 relative z-10 flex-grow flex flex-col ${mode === 'modal' ? 'overflow-hidden' : ''}`}>
          <div className={`p-[15px] custom-scrollbar flex-grow ${mode === 'modal' ? 'overflow-y-auto overscroll-contain' : ''}`}>
            <AnimatePresence mode="wait">
              {activeSettingsTab === 'general' ? (
                settingsSubView.type === 'sound' ? (
                  <SoundSettingsView
                    userData={userData}
                    setUserData={setUserData}
                    localSoundSettings={localSoundSettings}
                    setLocalSoundSettings={setLocalSoundSettings}
                    isSoundSettingsDirty={isSoundSettingsDirty}
                    setIsSoundSettingsDirty={setIsSoundSettingsDirty}
                    setConfirmModal={setConfirmModal}
                    setSoundSuccessMessage={setSoundSuccessMessage}
                    setSettingsSubView={setSettingsSubView}
                    soundService={soundService}
                  />
                ) : settingsSubView.type === 'nagging' ? (
                  <NaggingSettingsView
                    userData={userData}
                    setUserData={setUserData}
                    localNaggingSettings={localNaggingSettings}
                    setLocalNaggingSettings={setLocalNaggingSettings}
                    isNaggingDirty={isNaggingDirty}
                    setIsNaggingDirty={setIsNaggingDirty}
                    setConfirmModal={setConfirmModal}
                    setNaggingSuccessMessage={setNaggingSuccessMessage}
                    setSettingsSubView={setSettingsSubView}
                    registerCloseHandler={registerNaggingCloseHandler}
                    setIsSettingsOpen={setIsSettingsOpen}
                  />
                ) : settingsSubView.type === 'completionPhrases' ? (
                  <CompletionPhrasesSettingsView
                    userData={userData}
                    setUserData={setUserData}
                    setConfirmModal={setConfirmModal}
                    setSettingsSubView={setSettingsSubView}
                    setIsSettingsOpen={setIsSettingsOpen}
                  />
                ) : (
                  <GeneralSettingsView
                    userData={userData}
                    setUserData={setUserData}
                    currentTime={currentTime}
                    setConfirmModal={setConfirmModal}
                    setDeletionMessage={setDeletionMessage}
                    setBackupMessage={setBackupMessage}
                    activityLog={activityLog}
                    setActivityLog={setActivityLog}
                    setSettingsSubView={setSettingsSubView}
                    setShowPermissionGuide={setShowPermissionGuide}
                    syncHistory={syncHistory}
                  />
                )
              ) : (
                settingsSubView.type === 'detail' ? (
                  (() => {
                    const chunk = userData.routineChunks.find(c => c.id === settingsSubView.chunkId);
                    if (!chunk) return null;
                    return (
                      <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <RoutineGroupFormView 
                          addChunk={addChunk}
                          updateChunk={updateFullChunk}
                          initialChunk={chunk}
                          setActiveTab={setActiveTab}
                          setSettingsSubView={setSettingsSubView}
                          setIsSettingsOpen={setIsSettingsOpen}
                          userData={userData}
                          activeTab={activeTab}
                          mode="edit"
                          onDirtyChange={(isDirty) => setIsEditRoutineDirty(isDirty)}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <GroupManagementView
                    userData={userData}
                    setSettingsSubView={setSettingsSubView}
                    updateChunkInfo={updateChunkInfo}
                    deleteChunk={deleteChunk}
                    handleChunkDragEnd={handleChunkDragEnd}
                  />
                )
              )}
            </AnimatePresence>
          </div>
        </div>
        {mode === 'modal' && (
          <button 
            onClick={handleSettingsClose}
            className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-[10px] hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            {t('settings.saveAndClose')}
          </button>
        )}
      </div>
    );
  }

  const chunk = userData.routineChunks.find(c => c.id === settingsSubView.chunkId);
  if (!chunk) return null;

  return (
    <div className={`flex flex-col ${mode === 'modal' ? 'h-full overflow-hidden' : 'h-auto'}`}>
      <div className={`flex-grow pr-2 custom-scrollbar ${mode === 'modal' ? 'overflow-y-auto' : ''}`}>
        <RoutineGroupFormView 
          addChunk={addChunk}
          updateChunk={updateFullChunk}
          initialChunk={chunk}
          setActiveTab={setActiveTab}
          setSettingsSubView={setSettingsSubView}
          setIsSettingsOpen={setIsSettingsOpen}
          userData={userData}
          activeTab={activeTab}
          mode="edit"
          onDirtyChange={(isDirty) => setIsEditRoutineDirty(isDirty)}
        />
      </div>
    </div>
  );
  };

  if (mode === 'modal') {
    return renderContent();
  }

  return (
    <div className="w-full">
      {menuBarProps && <MenuBar {...menuBarProps} />}
      <div className="max-w-2xl mx-auto px-4 pt-[10px] pb-[100px] space-y-3">
        {renderContent()}
      </div>
    </div>
  );
};
export default SettingsView;
