import React from 'react';

export const BrickIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="8" width="18" height="8" rx="1" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </svg>
);
