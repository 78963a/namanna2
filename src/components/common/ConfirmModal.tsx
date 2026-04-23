import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { getJosa } from '../../utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  validationValue?: string;
  validationPlaceholder?: string;
  confirmColor?: 'rose' | 'indigo';
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
  confirmLabel = "확인",
  cancelLabel = "취소",
  showCancel = true,
  validationValue,
  validationPlaceholder = "내용을 입력해주세요",
  confirmColor = 'rose'
}) => {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const isValid = !validationValue || inputValue === validationValue;

  const colorClasses = {
    rose: 'bg-rose-500 hover:bg-rose-600 shadow-rose-100',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
  };

  const iconClasses = {
    rose: 'text-rose-500',
    indigo: 'text-indigo-600'
  };

  const iconBgClasses = {
    rose: 'bg-rose-50',
    indigo: 'bg-indigo-50'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed left-1/2 -translate-x-1/2 bg-white rounded-[10px] p-6 z-[210] shadow-2xl w-[90%] max-w-sm ${
              validationValue 
                ? 'top-[15%] translate-y-0 sm:top-1/2 sm:-translate-y-1/2' 
                : 'top-1/2 -translate-y-1/2'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-12 h-12 ${iconBgClasses[confirmColor]} rounded-[10px] flex items-center justify-center`}>
                <AlertCircle className={`w-6 h-6 ${iconClasses[confirmColor]}`} />
              </div>
              <div className="space-y-1 w-full">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{message}</p>
                
                {validationValue && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-bold text-rose-500 text-left">
                      삭제하려면 "{validationValue}"{getJosa(validationValue, '을/를')} 정확히 입력해주세요.
                    </p>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={validationPlaceholder}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-[10px] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full pt-2">
                {showCancel && (
                  <button 
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors whitespace-pre-wrap"
                  >
                    {cancelLabel}
                  </button>
                )}
                <button 
                  onClick={onConfirm}
                  disabled={!isValid}
                  className={`flex-1 py-3 rounded-[10px] font-bold text-white transition-all shadow-lg whitespace-pre-wrap ${
                    isValid 
                      ? `${colorClasses[confirmColor]}`
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
