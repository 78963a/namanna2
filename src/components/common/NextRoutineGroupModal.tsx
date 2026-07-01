import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowBigRightDash, 
  Circle, 
  CheckCheck, 
  Check, 
  CircleMinus, 
  PauseCircle, 
  CircleDot 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData, NextRoutineSuggestion, TaskStatus } from '../../types';

interface NextRoutineGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  modalSuggestions: NextRoutineSuggestion[];
  onSelectSuggestedTask: (chunkId: string, taskId: string) => void;
  isWaiting?: boolean;
}

export const NextRoutineGroupModal: React.FC<NextRoutineGroupModalProps> = ({
  isOpen,
  onClose,
  userData,
  modalSuggestions,
  onSelectSuggestedTask,
  isWaiting = false,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm touch-none"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10 p-6 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
                <ArrowBigRightDash className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{t('alarm.nextRoutineTitle')}</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                {t('alarm.nextRoutineDesc')}
              </p>

              <div className="w-full space-y-2.5 mb-5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
                {modalSuggestions.map((sug, idx) => {
                  const chunk = userData.routineChunks.find(c => c.id === sug.chunkId);
                  const task = chunk?.tasks.find(t => t.id === sug.taskId);
                  const isTrigger = chunk && chunk.tasks.length > 0 && chunk.tasks[0].id === sug.taskId;

                  // Render appropriate check performance/status circle
                  let iconElement;
                  if (task) {
                    if (task.status === TaskStatus.PERFECT) {
                      iconElement = (
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                          <CheckCheck className="absolute w-[60%] h-[60%] text-indigo-600" strokeWidth={3} />
                        </div>
                      );
                    } else if (task.completed || task.status === TaskStatus.COMPLETED) {
                      iconElement = (
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                          <Check className="w-3 h-3 text-indigo-600" strokeWidth={3} />
                        </div>
                      );
                    } else if (task.status === TaskStatus.SKIP) {
                      iconElement = <CircleMinus className="w-5 h-5 text-[#CC9900] shrink-0" />;
                    } else if (task.isPaused) {
                      iconElement = <PauseCircle className="w-5 h-5 text-amber-500 shrink-0" />;
                    } else if (task.startTime) {
                      iconElement = <CircleDot className="w-5 h-5 text-indigo-500 animate-pulse shrink-0" />;
                    } else {
                      // Normal not started
                      iconElement = <Circle className="w-5 h-5 text-slate-300 shrink-0" />;
                    }
                  } else {
                    iconElement = <Circle className="w-5 h-5 text-slate-300 shrink-0" />;
                  }

                  const taskIndex = chunk ? chunk.tasks.findIndex(t => t.id === sug.taskId) : -1;
                  const sequenceNumber = taskIndex !== -1 ? taskIndex + 1 : '';

                  return (
                    <button
                      key={`${sug.chunkId}-${sug.taskId}-${idx}`}
                      onClick={() => onSelectSuggestedTask(sug.chunkId, sug.taskId)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-2xl text-left transition-all active:scale-[0.98] group flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 text-left overflow-hidden">
                        <div className="flex-shrink-0">
                          {iconElement}
                        </div>
                        <div className="flex flex-col gap-0.5 text-left overflow-hidden">
                          <span className="text-[10px] font-black tracking-wider text-indigo-500 uppercase truncate">
                            {sug.chunkName}
                          </span>
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-800 transition-colors truncate">
                            {sequenceNumber}. {isTrigger && "⚡"}{sug.taskName}
                          </span>
                        </div>
                      </div>
                      <ArrowBigRightDash className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1 shrink-0" />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl text-center text-sm font-black text-slate-500 transition-all active:scale-[0.98]"
              >
                {t('alarm.notNow')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InteractionBlockOverlay isWaiting={isWaiting} />
    </>
  );
};

interface InteractionBlockOverlayProps {
  isWaiting: boolean;
}

export const InteractionBlockOverlay: React.FC<InteractionBlockOverlayProps> = ({ isWaiting }) => {
  if (!isWaiting) return null;
  return (
    <div className="fixed inset-0 z-[100000] bg-transparent cursor-wait pointer-events-auto" />
  );
};
