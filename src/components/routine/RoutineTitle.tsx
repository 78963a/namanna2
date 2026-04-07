import React from 'react';
import { 
  Circle, 
  CheckCircle2, 
  XCircle, 
  ArrowRightCircle, 
  PauseCircle, 
  CircleDot 
} from 'lucide-react';
import { RoutineChunk, Task } from '../../types';

interface RoutineTitleProps {
  chunk: RoutineChunk;
  isCompleted?: boolean;
  nameClassName?: string;
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  isCompleted = false,
  nameClassName = "text-slate-900"
}) => {
  const hasPurpose = chunk.purpose && chunk.purpose.trim() !== '';
  
  if (isCompleted) {
    return (
      <span className="inline leading-relaxed text-black">
        나는 <span className="text-blue-600 font-black">{chunk.name}</span>을 완료한 {hasPurpose ? <span className="text-blue-600 font-black">{chunk.purpose}</span> : ""}이다!
      </span>
    );
  } else {
    const titleNameStyle = `block text-xl font-black mt-2 mb-2 ${nameClassName}`;
    if (hasPurpose) {
      return (
        <span className="block">
          {chunk.purpose}를 위한 <span className={titleNameStyle}>{chunk.name}</span>
        </span>
      );
    } else {
      return (
        <span className="block">
          <span className={titleNameStyle}>{chunk.name}</span>
        </span>
      );
    }
  }
};
