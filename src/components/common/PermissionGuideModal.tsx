import React from 'react';
import { useTranslation } from 'react-i18next';
import { BellOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PermissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
            className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10"
          >
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-2">
                <BellOff className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{t('alarm.permissionRequiredTitle')}</h3>
              <div className="text-sm font-bold text-slate-500 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl">
                {t('alarm.permissionRequiredDesc')}<br/><br/>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {t('alarm.permissionConfirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface NotificationDeniedModalProps {
  message: string | null;
  onClose: () => void;
}

export const NotificationDeniedModal: React.FC<NotificationDeniedModalProps> = ({
  message,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
            className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10"
          >
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{t('alarm.disableNoticeTitle')}</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                {message}
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-[15px] hover:bg-slate-800 transition-all shadow-lg"
              >
                {t('alarm.ok')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
