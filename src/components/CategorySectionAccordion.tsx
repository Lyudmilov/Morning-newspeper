import React from 'react';
import {
  Plus,
  Minus,
  ShoppingBag,
  Cpu,
  TrendingUp,
  Atom,
  Palette,
  Compass,
  Landmark,
  Trophy,
  Sparkles,
  Car,
  HeartPulse,
  Building,
  Zap,
  Gamepad2,
  BookOpenCheck,
  GraduationCap,
  Coins,
  Leaf,
  UtensilsCrossed,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CategoryKey, CategorySection, NewsHeadlineItem } from '../types/bulletin';
import { HeadlineCard } from './HeadlineCard';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  tech: Cpu,
  fmcg: ShoppingBag,
  business: TrendingUp,
  science: Atom,
  art: Palette,
  travel: Compass,
  politics: Landmark,
  sports: Trophy,
  lifestyle: Sparkles,
  auto: Car,
  health: HeartPulse,
  realestate: Building,
  energy: Zap,
  gaming: Gamepad2,
  books: BookOpenCheck,
  education: GraduationCap,
  crypto: Coins,
  ecology: Leaf,
  gastronomy: UtensilsCrossed,
};

interface CategorySectionAccordionProps {
  categoryKey: CategoryKey;
  section: CategorySection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onReadVerbatim: (item: NewsHeadlineItem) => void;
  favoriteIds: Set<string>;
  onToggleFavorite?: (item: NewsHeadlineItem, e: React.MouseEvent) => void;
  onLoadMore: (catKey: CategoryKey) => void;
  isLoadingMore: boolean;
}

export const CategorySectionAccordion: React.FC<CategorySectionAccordionProps> = ({
  categoryKey,
  section,
  index,
  isExpanded,
  onToggle,
  onReadVerbatim,
  favoriteIds,
  onToggleFavorite,
  onLoadMore,
  isLoadingMore,
}) => {
  const IconComponent = CATEGORY_ICONS[categoryKey] || Cpu;
  const isFmcg = categoryKey === 'fmcg';
  const isTech = categoryKey === 'tech';
  const isBusiness = categoryKey === 'business';

  const previewHeadlines = section.headlines.slice(0, 2);

  return (
    <section
      id={`category-${categoryKey}`}
      className="scroll-mt-24 rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-white dark:bg-stone-900/60 shadow-2xs overflow-hidden transition-all duration-300"
    >
      {/* Category Header Bar - Clickable with prominent Plus button */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
        className={`w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
          isExpanded
            ? 'bg-stone-50/90 dark:bg-stone-800/50 border-b border-stone-200/80 dark:border-stone-800'
            : 'hover:bg-stone-50/60 dark:hover:bg-stone-800/30'
        }`}
      >
        {/* Left: Category Icon, Index, Name and Subtitle */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isExpanded
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-amber-100'
            }`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400 dark:text-stone-500">
              <span className="font-semibold">РАЗДЕЛ {String(index + 1).padStart(2, '0')}</span>
              {isTech && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    KALDATA & MOBILEBULGARIA
                  </span>
                </>
              )}
              {isFmcg && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    БЪРЗООБОРОТЕН СЕКТОР (FMCG)
                  </span>
                </>
              )}
              {isBusiness && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    МАКРОИКОНОМИКА И БАНКИ
                  </span>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-sans font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {section.category.name}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                {section.headlines.length} заглавия
              </span>
            </div>

            {/* Collapsed Headline Preview */}
            {!isExpanded && previewHeadlines.length > 0 && (
              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 pt-1 font-serif italic max-w-2xl">
                <span>Водещо: </span>
                <span>„{previewHeadlines[0].title}“</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Prominent Plus/Minus Toggle Button */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-2xs ${
              isExpanded
                ? 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                : 'bg-amber-600 hover:bg-amber-700 text-white hover:scale-102 ring-2 ring-amber-600/20'
            }`}
            title={isExpanded ? 'Свий категорията' : 'Разгърни категорията'}
          >
            {isExpanded ? (
              <>
                <Minus className="w-4 h-4 stroke-[2.5]" />
                <span>Свий</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Разгърни</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
          {/* FMCG Retail Special Notice */}
          {isFmcg && (
            <div className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5 font-sans">
              <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Специална селекция за търговските вериги (Lidl, Kaufland, Billa, Fantastico), храни, напитки, браншови цени и логистични вериги.
              </span>
            </div>
          )}

          {/* Headlines Grid - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.headlines.map((item) => (
              <HeadlineCard
                key={item.id}
                item={item}
                onReadVerbatim={onReadVerbatim}
                categoryName={section.category.name}
                isFmcgCategory={isFmcg}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {/* Bottom Action Footer for this category */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800/80">
            <button
              onClick={() => onLoadMore(categoryKey)}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Зареждане на още новини...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Зареди още (+5 статии от {section.category.name})</span>
                </>
              )}
            </button>

            <button
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Свий {section.category.name}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
