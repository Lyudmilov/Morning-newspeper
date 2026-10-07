import React from 'react';
import { Volume2, ArrowRight, Heart, Clock, Play } from 'lucide-react';
import { NewsHeadlineItem } from '../types/bulletin';
import { AudioPreloader } from '../utils/audioPreloader';
import { ensureFullArticle } from '../utils/articleContentEnsurer';

interface HeadlineCardProps {
  item: NewsHeadlineItem;
  onReadVerbatim: (item: NewsHeadlineItem) => void;
  categoryName?: string;
  isFmcgCategory?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (item: NewsHeadlineItem, e: React.MouseEvent) => void;
}

export const HeadlineCard: React.FC<HeadlineCardProps> = ({
  item,
  onReadVerbatim,
  categoryName,
  isFmcgCategory,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const formattedNumber = item.number.toString().padStart(2, '0');
  const cleanSource = item.source.toLowerCase();

  const handleWarmup = () => {
    const ready = ensureFullArticle(item);
    AudioPreloader.preloadArticleAudio(ready);
  };

  const handleClick = () => {
    const ready = ensureFullArticle(item);
    onReadVerbatim(ready);
  };

  return (
    <article
      onClick={handleClick}
      onMouseEnter={handleWarmup}
      onTouchStart={handleWarmup}
      className="group relative bg-white dark:bg-stone-900/70 border border-stone-200/90 dark:border-stone-800/80 hover:border-amber-500/70 dark:hover:border-amber-500/60 rounded-xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          {/* Number & Source & Freshness */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
              #{formattedNumber}
            </span>

            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono flex-wrap">
              {isFmcgCategory && item.number <= 3 && (
                <>
                  <span className="text-amber-800 dark:text-amber-300 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                    FMCG сектор
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="lowercase">
                {cleanSource.startsWith('източник:') ? cleanSource : `източник: ${cleanSource}`}
              </span>

              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-sans bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-700/60">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="font-medium">
                  {item.publishedAt || (item.publishedDate ? `${item.publishedDate}, ${item.publishedTime}` : 'Днес в 07:00 ч.')}
                </span>
              </span>
            </div>
          </div>

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(item, e);
            }}
            className={`p-1.5 -mr-1 -mt-1 rounded-full transition-all cursor-pointer ${
              isFavorite
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:scale-110'
                : 'text-stone-300 dark:text-stone-600 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
            aria-label={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
          >
            <Heart
              className={`w-4 h-4 transition-all ${
                isFavorite ? 'fill-rose-500 stroke-rose-500 scale-105' : 'stroke-current'
              }`}
            />
          </button>
        </div>

        {/* Headline Title */}
        <h3 className="text-[16px] sm:text-[17px] font-sans font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-snug text-balance tracking-tight">
          {item.title}
        </h3>
      </div>

      {/* Subtle Bottom Affordance: Ready to read and listen */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors font-sans">
        <span className="flex items-center gap-1.5 font-medium text-stone-600 dark:text-stone-400">
          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Готова за четене и слушане</span>
        </span>

        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 transition-colors">
          <span>Отвори веднага</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </article>
  );
};
