import React from 'react';
import { Copy, Settings, Moon, Sun, RefreshCw, Sliders } from 'lucide-react';
import { MorningBulletin, CategoryKey } from '../types/bulletin';

interface HeaderProps {
  bulletin: MorningBulletin;
  selectedCategory: CategoryKey | 'all';
  onSelectCategory: (cat: CategoryKey | 'all') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenPlainTextView: () => void;
  onOpenSettings: () => void;
  onOpenCustomizer?: () => void;
  lastUpdatedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  bulletin,
  selectedCategory,
  onSelectCategory,
  isDark,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  onOpenPlainTextView,
  onOpenSettings,
  onOpenCustomizer,
  lastUpdatedTime,
}) => {
  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single-element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectCategory('all');
            }}
            className="flex items-baseline gap-2 group cursor-pointer"
          >
            <span className="font-sans text-lg sm:text-xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
              МОЯТ СУТРЕШЕН ВЕСТНИК
            </span>
            <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-widest hidden sm:inline">
              07:00 ч.
            </span>
          </a>
        </div>

        {/* Zone 2: Clean 4–6 text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => onSelectCategory('all')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'all'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Всички новини ({bulletin.totalHeadlinesCount})
          </button>
          <button
            onClick={() => onSelectCategory('tech')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'tech'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Технологии
          </button>
          <button
            onClick={() => onSelectCategory('fmcg')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'fmcg'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Бързооборотен сектор (FMCG)
          </button>
          <button
            onClick={() => onSelectCategory('business')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'business'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Бизнес & Финанси
          </button>
          <button
            onClick={() => onSelectCategory('science')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'science'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Наука
          </button>
          <button
            onClick={() => onSelectCategory('art')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'art'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Изкуство
          </button>
          <button
            onClick={() => onSelectCategory('travel')}
            className={`transition-colors cursor-pointer hover:text-stone-950 dark:hover:text-white ${
              selectedCategory === 'travel'
                ? 'text-stone-950 dark:text-white font-semibold underline underline-offset-8 decoration-amber-600'
                : ''
            }`}
          >
            Пътувания
          </button>
        </nav>

        {/* Zone 3: Clean action buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent Refresh Button & Last Updated Indicator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Обнови сутрешния вестник с актуални новини"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Обновяване...' : 'Обнови'}</span>
            </button>
            {lastUpdatedTime && (
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 hidden 2xl:inline pl-1">
                {lastUpdatedTime.includes(',') ? lastUpdatedTime.split(',')[1].trim() : lastUpdatedTime}
              </span>
            )}
          </div>

          <button
            onClick={onOpenPlainTextView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title="Копирай чистия списък от заглавия"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Копирай списък</span>
          </button>

          {onOpenCustomizer && (
            <button
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-600/30 dark:border-amber-500/30 text-stone-700 dark:text-stone-200 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Персонализирай разделите на вестника (+10 нови)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">+ Раздели</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="График за 07:00 ч. и известия"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Превключи светла/тъмна тема"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
