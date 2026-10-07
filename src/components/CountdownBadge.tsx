import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface CountdownBadgeProps {
  onTriggerNow?: () => void;
  isRefreshing?: boolean;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  onTriggerNow,
  isRefreshing,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeUntil7AM = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(7, 0, 0, 0);

      // If it's already past 7 AM today, target tomorrow 7 AM
      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeUntil7AM();
    const timer = setInterval(calculateTimeUntil7AM, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        <span className="font-mono text-stone-800 dark:text-stone-200">
          Следващо издание в 07:00 ч.
        </span>
      </div>

      <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>

      <div className="flex items-center gap-1 font-mono">
        <Clock className="w-3.5 h-3.5 text-stone-400" />
        <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>

      {onTriggerNow && (
        <>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700 hidden sm:inline">·</span>
          <button
            onClick={onTriggerNow}
            disabled={isRefreshing}
            className="hidden sm:inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-200 transition-colors font-medium underline underline-offset-4 cursor-pointer disabled:opacity-50"
            title="Генерирай ново сутрешно издание за 07:00 ч."
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Обнови сега</span>
          </button>
        </>
      )}
    </div>
  );
};
