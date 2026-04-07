/**
 * @file RoutineTitle.tsx
 * @description Component for displaying the title of a routine chunk with its purpose.
 */

import React from 'react';
import { RoutineChunk } from '../../types';

interface RoutineTitleProps {
  /** The routine chunk to display the title for. */
  chunk: RoutineChunk;
  /** Whether all tasks in this chunk are completed. */
  isCompleted: boolean;
  /** Optional CSS class for the name part of the title. */
  nameClassName?: string;
}

/**
 * RoutineTitle component that formats the routine name and purpose into a sentence.
 */
export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  isCompleted,
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
