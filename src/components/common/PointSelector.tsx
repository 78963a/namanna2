import React from 'react';

interface PointSelectorProps {
  value: number;
  onChange: (points: number) => void;
}

/**
 * A reusable point selector component for tasks.
 * 
 * @param {PointSelectorProps} props - Component properties
 * @returns {JSX.Element} The rendered point selector
 */
export const PointSelector: React.FC<PointSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex gap-1">
      {[5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-black transition-all ${
            num === value 
              ? 'bg-sky-500 text-white shadow-sm scale-105' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
};
