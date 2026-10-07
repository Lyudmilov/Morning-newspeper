import React from 'react';
import { Volume2, BookOpen, ArrowRight, Heart } from 'lucide-react';
import { NewsHeadlineItem, CategoryKey } from '../types/bulletin';

interface HeroSpotlightProps {
  leadStory: NewsHeadlineItem;
  onReadVerbatim: (item: NewsHeadlineItem) => void;
  dateStr: string;
  totalCount: number;
  isFavorite?: boolean;
  onToggleFavorite?: (item: NewsHeadlineItem, e: React.MouseEvent) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  leadStory,
  onReadVerbatim,
  dateStr,
  totalCount,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 rounded-2xl overflow-hidden shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
      {/* Top Editorial Ribbon */}
      <div className="px-6 py-2.5 bg-stone-100/90 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest text-[11px]">
            Водеща тема на деня
          </span>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
          <span>{dateStr}</span>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
          <span className="text-stone-800 dark:text-stone-200 font-medium">Фиксиран час: 07:00 ч.</span>
        </div>

        <div className="text-[11px] font-mono text-stone-500">
          Пълен вестник: {totalCount} номерирани заглавия
        </div>
      </div>

      {/* Main Grid: Visual Editorial Image + Lead Headline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        {/* Editorial Visual Asset */}
        <div className="lg:col-span-5 relative group overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800 aspect-16/10">
          <img
            src="/src/assets/images/morning_editorial_press_1790507353329.jpg"
            alt="Моят сутрешен вестник 07:00 ч."
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter grayscale-20 contrast-105 group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-stone-200 text-xs font-mono">
            <span>Сутрешна преса · Моят сутрешен вестник</span>
          </div>
        </div>

        {/* Lead Story Content */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Unboxed Metadata Kicker */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono">
              <span className="font-bold text-amber-800 dark:text-amber-400">
                #01 · {leadStory.categoryKey === 'tech' ? 'ТЕХНОЛОГИИ (АКЦЕНТ: KALDATA & MB)' : leadStory.categoryKey === 'fmcg' ? 'БЪРЗООБОРОТЕН СЕКТОР (FMCG)' : 'ВОДЕЩА НОВИНА'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="lowercase">{leadStory.source.toLowerCase()}</span>
              <span aria-hidden="true">·</span>
              <span>2 мин. четене</span>
            </div>

            {/* Main Headline */}
            <h2
              onClick={() => onReadVerbatim(leadStory)}
              className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-stone-900 dark:text-stone-50 leading-tight tracking-tight hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer text-balance"
            >
              {leadStory.title}
            </h2>

            {/* Subtitle / Excerpt */}
            <p className="text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed line-clamp-3">
              {leadStory.fullArticle?.leadParagraph ||
                'Търговските вериги и водещите производители отчитат засилена динамика в потребителското търсене, нови логистични мощности и инвестиционни програми в местен и глобален мащаб.'}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onReadVerbatim(leadStory)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Прочети дословно материала</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onReadVerbatim(leadStory)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>Слушай с аудио четец</span>
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={(e) => onToggleFavorite?.(leadStory, e)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:text-rose-500 hover:border-rose-300'
              }`}
              title={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
                }`}
              />
              <span>{isFavorite ? 'В любими' : 'Запази'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
