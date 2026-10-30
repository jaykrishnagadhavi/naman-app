import React, { useState, useEffect } from 'react';
import { cn } from '@abrainoconscious/shared';

// Progress Ring
export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 36,
  strokeWidth = 3,
  className,
  showText = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1A373E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F5871F"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showText && (
        <span className="absolute text-[10px] font-semibold text-white">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

// Countdown Timer
export interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, label = 'Starts in', className }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={cn('inline-flex items-center gap-2 text-xs font-medium text-amber-400', className)}>
      {label && <span className="text-[#8D9FA4] font-normal">{label}:</span>}
      <div className="flex items-center gap-1 font-mono">
        {timeLeft.days > 0 && <span className="rounded bg-[#081619] px-1.5 py-0.5 border border-[#1A373E]">{timeLeft.days}d</span>}
        <span className="rounded bg-[#081619] px-1.5 py-0.5 border border-[#1A373E]">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="rounded bg-[#081619] px-1.5 py-0.5 border border-[#1A373E]">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="rounded bg-[#081619] px-1.5 py-0.5 border border-[#1A373E]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

