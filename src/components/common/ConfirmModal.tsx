import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A reusable confirmation modal for critical actions like deletion.
 * 
 * @param {ConfirmModalProps} props - Component properties
 * @returns {JSX.Element} The rendered confirmation modal
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[10px] p-6 z-[70] shadow-2xl w-[90%] max-w-sm"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 rounded-[10px] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
