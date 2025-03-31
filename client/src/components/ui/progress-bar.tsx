import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const percentage = (value / max) * 100;
  
  return (
    <div className={`w-full bg-slate-200 rounded-full h-1.5 ${className}`}>
      <div 
        className="bg-blue-500 h-1.5 rounded-full" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
