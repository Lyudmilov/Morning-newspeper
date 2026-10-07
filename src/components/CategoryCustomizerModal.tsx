import React from 'react';
import {
  X,
  Sliders,
  Check,
  Plus,
  Car,
  HeartPulse,
  Building,
  Zap,
  Gamepad2,
  BookOpenCheck,
  Cpu,
  ShoppingBag,
  TrendingUp,
  Atom,
  Palette,
  Compass,
  Landmark,
  Trophy,
  Sparkles,
  GraduationCap,
  Coins,
  Leaf,
  UtensilsCrossed,
} from 'lucide-react';
import { CategoryKey } from '../types/bulletin';
import { OPTIONAL_CATEGORIES } from '../data/optionalCategories';

interface CategoryCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategories: CategoryKey[];
  onToggleCategory: (key: CategoryKey) => void;
  onResetToDefault: () => void;
  onSelectAll?: () => void;
}

const CORE_CATEGORIES: Array<{ id: CategoryKey; name: string; desc: string; icon: any }> = [
  { id: 'tech', name: 'Технологии', desc: 'Kaldata, хардуер, AI и софтуер', icon: Cpu },
  { id: 'fmcg', name: 'Бързооборотен сектор (FMCG)', desc: 'Ритейл, хранителни вериги и търговия', icon: ShoppingBag },
  { id: 'business', name: 'Бизнес & Финанси', desc: 'Пазари, банки, икономика и инвестиции', icon: TrendingUp },
  { id: 'science', name: 'Наука', desc: 'Космос, открития, биотехнологии и изследвания', icon: Atom },
  { id: 'art', name: 'Изкуство', desc: 'Театър, галерии, музика и изложби', icon: Palette },
  { id: 'travel', name: 'Пътувания', desc: 'Туризъм, дестинации и забележителности', icon: Compass },
  { id: 'politics', name: 'Политика', desc: 'Национални и европейски събития', icon: Landmark },
  { id: 'sports', name: 'Спорт', desc: 'Футбол, тенис, шампионати и рекорди', icon: Trophy },
  { id: 'lifestyle', name: 'Лайфстайл', desc: 'Култура, кулинария и съвременен начин на живот', icon: Sparkles },
];

const OPTIONAL_LIST: Array<{ id: CategoryKey; name: string; desc: string; icon: any; badge: string }> = [
  { id: 'auto', name: 'Авто & Мобилност', desc: 'Електромобили, инфраструктура и нови модели', icon: Car, badge: 'Е-мобилност' },
  { id: 'health', name: 'Здраве & Медицина', desc: 'Медицински открития, превенция и дълголетие', icon: HeartPulse, badge: 'Здраве' },
  { id: 'realestate', name: 'Имоти & Архитектура', desc: 'Жилищен пазар, зелени сгради и градоустройство', icon: Building, badge: 'Имоти' },
  { id: 'energy', name: 'Енергетика & Климат', desc: 'ВЕИ, батерийни системи и зелен преход', icon: Zap, badge: 'ВЕИ' },
  { id: 'gaming', name: 'Гейминг & Е-спорт', desc: 'Видеоигри, хардуер, студиа и турнири', icon: Gamepad2, badge: 'Гейминг' },
  { id: 'books', name: 'Книги & Литература', desc: 'Нови романи, бестселъри, автори и фестивали', icon: BookOpenCheck, badge: 'Книги' },
  { id: 'education', name: 'Образование & Кариера', desc: 'Университети, дигитални умения, стипендии и кариера', icon: GraduationCap, badge: 'Образование' },
  { id: 'crypto', name: 'Крипто & Финтех', desc: 'Дигитални активи, блокчейн протоколи и MiCA регулация', icon: Coins, badge: 'Финтех' },
  { id: 'ecology', name: 'Екология & Природа', desc: 'Национални паркове, биоразнообразие и зелена икономика', icon: Leaf, badge: 'Еко' },
  { id: 'gastronomy', name: 'Кулинария & Вино', desc: 'Винен туризъм, ресторанти, местни сортове и гурме', icon: UtensilsCrossed, badge: 'Вкусове' },
];

export const CategoryCustomizerModal: React.FC<CategoryCustomizerModalProps> = ({
  isOpen,
  onClose,
  activeCategories,
  onToggleCategory,
  onResetToDefault,
  onSelectAll,
}) => {
  if (!isOpen) return null;

  const totalPossible = CORE_CATEGORIES.length + OPTIONAL_LIST.length;
  const activeCount = activeCategories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900 dark:text-stone-100">
                Персонализирай „Моят сутрешен вестник“
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Изберете кои раздели да присъстват във вашия сутрешен вестник ({activeCount} от {totalPossible} активни)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          {/* Optional Categories section - emphasized */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400 font-mono">
                Допълнителни раздели за избор (+10 нови)
              </h4>
              <div className="flex items-center gap-2">
                {onSelectAll && (
                  <button
                    onClick={onSelectAll}
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Включи всички
                  </button>
                )}
                <span className="text-[11px] font-mono text-stone-400">
                  Кликнете за избор
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPTIONAL_LIST.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategories.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleCategory(item.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/80 shadow-2xs'
                        : 'bg-stone-50/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-2 rounded-lg mt-0.5 ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isActive
                          ? 'bg-amber-600 text-white'
                          : 'border border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standard Core Categories section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
                Основни вестникарски раздели (9 раздела)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CORE_CATEGORIES.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategories.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleCategory(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700'
                        : 'bg-stone-100/50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                          {item.name}
                        </span>
                        <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isActive
                          ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                          : 'border border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onResetToDefault}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors cursor-pointer"
            >
              Възстанови стандартните 9 раздела
            </button>
            {onSelectAll && (
              <>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <button
                  onClick={onSelectAll}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Всички 19 раздела
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Запази и покажи вестника ({activeCount} активни)
          </button>
        </div>
      </div>
    </div>
  );
};
