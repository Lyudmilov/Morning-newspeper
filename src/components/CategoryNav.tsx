import React from 'react';
import {
  Layers,
  Heart,
  Cpu,
  ShoppingBag,
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
  Sliders,
  GraduationCap,
  Coins,
  Leaf,
  UtensilsCrossed,
} from 'lucide-react';
import { CategoryKey } from '../types/bulletin';

interface CategoryNavProps {
  selectedCategory: CategoryKey | 'all' | 'favorites';
  onSelectCategory: (cat: CategoryKey | 'all' | 'favorites') => void;
  counts: Record<string, number>;
  favoritesCount?: number;
  activeCategories?: CategoryKey[];
  onOpenCustomizer?: () => void;
}

const ALL_CATEGORY_TABS: Array<{
  id: CategoryKey;
  name: string;
  icon: any;
  badge?: string;
}> = [
  { id: 'tech', name: 'Технологии', icon: Cpu, badge: 'Kaldata & MB' },
  { id: 'fmcg', name: 'Бързооборотен сектор (FMCG)', icon: ShoppingBag, badge: 'Ритейл' },
  { id: 'business', name: 'Бизнес & Финанси', icon: TrendingUp },
  { id: 'science', name: 'Наука', icon: Atom },
  { id: 'art', name: 'Изкуство', icon: Palette },
  { id: 'travel', name: 'Пътувания', icon: Compass },
  { id: 'politics', name: 'Политика', icon: Landmark },
  { id: 'sports', name: 'Спорт', icon: Trophy },
  { id: 'lifestyle', name: 'Лайфстайл', icon: Sparkles },
  { id: 'auto', name: 'Авто & Мобилност', icon: Car, badge: 'Е-мобилност' },
  { id: 'health', name: 'Здраве & Медицина', icon: HeartPulse, badge: 'Здраве' },
  { id: 'realestate', name: 'Имоти & Архитектура', icon: Building, badge: 'Имоти' },
  { id: 'energy', name: 'Енергетика & Климат', icon: Zap, badge: 'ВЕИ' },
  { id: 'gaming', name: 'Гейминг & Е-спорт', icon: Gamepad2, badge: 'Гейминг' },
  { id: 'books', name: 'Книги & Литература', icon: BookOpenCheck, badge: 'Книги' },
  { id: 'education', name: 'Образование & Кариера', icon: GraduationCap, badge: 'Образование' },
  { id: 'crypto', name: 'Крипто & Финтех', icon: Coins, badge: 'Финтех' },
  { id: 'ecology', name: 'Екология & Природа', icon: Leaf, badge: 'Еко' },
  { id: 'gastronomy', name: 'Кулинария & Вино', icon: UtensilsCrossed, badge: 'Вкусове' },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
  favoritesCount = 0,
  activeCategories = ['tech', 'fmcg', 'business', 'science', 'art', 'travel', 'politics', 'sports', 'lifestyle'],
  onOpenCustomizer,
}) => {
  const visibleTabs = [
    {
      id: 'all' as const,
      name: 'Всички раздели',
      icon: Layers,
      count: Object.values(counts).reduce((a, b) => a + b, 0),
      badge: undefined as string | undefined,
    },
    {
      id: 'favorites' as const,
      name: 'Любими',
      icon: Heart,
      count: favoritesCount,
      isSpecialFavorite: true,
      badge: undefined as string | undefined,
    },
    ...ALL_CATEGORY_TABS.filter((cat) => activeCategories.includes(cat.id)).map((cat) => ({
      ...cat,
      count: counts[cat.id] || 5,
    })),
  ];

  return (
    <div className="border-b border-stone-200 dark:border-stone-800 pb-2">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          const isFav = tab.id === 'favorites';

          return (
            <button
              key={tab.id}
              onClick={() => onSelectCategory(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? isFav
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-semibold shadow-xs'
                  : isFav
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isFav
                    ? isActive
                      ? 'fill-white stroke-white'
                      : 'fill-rose-500/20 stroke-rose-500'
                    : 'opacity-80'
                }`}
              />
              <span>{tab.name}</span>

              {tab.badge && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                  {tab.badge}
                </span>
              )}

              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isActive
                    ? isFav
                      ? 'text-rose-100'
                      : 'text-amber-300 dark:text-amber-800'
                    : isFav
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-stone-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* Customizer button to add/remove categories */}
        {onOpenCustomizer && (
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-600/50 dark:border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ml-1.5 shadow-2xs"
            title="Добави или скрий още категории от вестника"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>+ Избери още категории</span>
            <span className="text-[10px] font-mono font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded-full">
              +10
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
