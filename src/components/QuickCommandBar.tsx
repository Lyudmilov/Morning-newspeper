import React, { useState, useEffect } from 'react';
import { Search, CornerDownLeft, Mic, Sparkles } from 'lucide-react';
import { CategoryKey } from '../types/bulletin';

interface QuickCommandBarProps {
  activeCategory: CategoryKey | 'all';
  onExecuteCommand: (category: CategoryKey, number: number) => void;
}

export const QuickCommandBar: React.FC<QuickCommandBarProps> = ({
  activeCategory,
  onExecuteCommand,
}) => {
  const [commandText, setCommandText] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryKey>(
    activeCategory === 'all' ? 'business' : activeCategory
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeCategory !== 'all') {
      setSelectedCat(activeCategory);
    }
  }, [activeCategory]);

  const handleParseAndRun = (input: string) => {
    setErrorMsg(null);
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    let targetCat: CategoryKey = selectedCat;
    let targetNum: number | null = null;

    if (trimmed.includes('техн') || trimmed.includes('tech') || trimmed.includes('kaldata') || trimmed.includes('mobile')) targetCat = 'tech';
    else if (trimmed.includes('fmcg') || trimmed.includes('бързооб') || trimmed.includes('ритейл') || trimmed.includes('храни') || trimmed.includes('лидл') || trimmed.includes('кауфланд')) targetCat = 'fmcg';
    else if (trimmed.includes('бизн') || trimmed.includes('финанс') || trimmed.includes('bank') || trimmed.includes('банк')) targetCat = 'business';
    else if (trimmed.includes('лайф') || trimmed.includes('стил') || trimmed.includes('life')) targetCat = 'lifestyle';
    else if (trimmed.includes('спорт') || trimmed.includes('sport')) targetCat = 'sports';
    else if (trimmed.includes('полит') || trimmed.includes('politic')) targetCat = 'politics';
    else if (trimmed.includes('наук') || trimmed.includes('science')) targetCat = 'science';
    else if (trimmed.includes('изкуств') || trimmed.includes('арт') || trimmed.includes('art')) targetCat = 'art';
    else if (trimmed.includes('пътуван') || trimmed.includes('travel') || trimmed.includes('туриз')) targetCat = 'travel';

    const numberMatch = trimmed.match(/\b([1-9]|1[0-2])\b/);
    if (numberMatch) {
      targetNum = parseInt(numberMatch[1], 10);
    }

    if (targetNum !== null) {
      onExecuteCommand(targetCat, targetNum);
      setCommandText('');
    } else {
      setErrorMsg('Посочете номер от 1 до 10 (напр. „Бизнес 2“ или просто „5“).');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseAndRun(commandText);
  };

  return (
    <div className="bg-stone-900 text-stone-100 rounded-xl p-4 sm:p-5 border border-stone-800 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Voice Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-amber-400">
              Командна конзола
            </span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-xs text-stone-300 font-medium">Дословен четец и гласово търсене</span>
          </div>
          <p className="text-xs text-stone-400">
            Въведете номер и категория за незабавен дословен прочит или изберете директно от цифрите по-долу:
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value as CategoryKey)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs font-medium text-stone-200 focus:outline-hidden focus:border-amber-400 cursor-pointer"
          >
            <option value="tech">Технологии (Kaldata & MB)</option>
            <option value="fmcg">Бързооборотен сектор (FMCG)</option>
            <option value="business">Бизнес & Финанси</option>
            <option value="science">Наука</option>
            <option value="art">Изкуство</option>
            <option value="travel">Пътувания</option>
            <option value="politics">Политика</option>
            <option value="sports">Спорт</option>
            <option value="lifestyle">Лайфстайл</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              placeholder="напр. '3' или 'бизнес 1'..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-3 pr-8 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Изпълни команда"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            Прочети
          </button>
        </form>
      </div>

      {errorMsg && (
        <p className="text-rose-400 text-xs mt-2 font-mono">{errorMsg}</p>
      )}

      {/* Number Selectors (Tabular Numerals) */}
      <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[11px] font-mono text-stone-400 mr-2">
          Избор на статия (#{selectedCat}):
        </span>

        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onExecuteCommand(selectedCat, num)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 font-mono font-bold text-xs transition-colors border border-stone-700/60 flex items-center justify-center cursor-pointer tabular-nums"
            title={`Прочети дословно статия #${num} от ${selectedCat}`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};
