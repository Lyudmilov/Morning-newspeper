/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, ShoppingBag, Heart, Plus, Minus, Loader2, RefreshCw, Sliders, Clock, Calendar } from 'lucide-react';
import { MorningBulletin, CategoryKey, NewsHeadlineItem } from './types/bulletin';
import { INITIAL_BULLETIN } from './data/defaultBulletin';
import { EXTRA_ARTICLES_POOL } from './data/extraArticles';
import { OPTIONAL_CATEGORIES } from './data/optionalCategories';
import { Header } from './components/Header';
import { CategorySectionAccordion } from './components/CategorySectionAccordion';
import { CountdownBadge } from './components/CountdownBadge';
import { CategoryNav } from './components/CategoryNav';
import { HeadlineCard } from './components/HeadlineCard';
import { QuickCommandBar } from './components/QuickCommandBar';
import { VerbatimReaderModal } from './components/VerbatimReaderModal';
import { PlainTextViewModal } from './components/PlainTextViewModal';
import { ScheduleSettingsModal } from './components/ScheduleSettingsModal';
import { CategoryCustomizerModal } from './components/CategoryCustomizerModal';
import { AudioPreloader } from './utils/audioPreloader';
import { BulgarianTTS } from './utils/speech';
import { generateLiveNewspaperEdition } from './utils/liveNewsGenerator';
import { ensureFullArticle } from './utils/articleContentEnsurer';

const DEFAULT_CORE_CATEGORIES: CategoryKey[] = [
  'tech',
  'fmcg',
  'business',
  'science',
  'art',
  'travel',
  'politics',
  'sports',
  'lifestyle',
];

const ALL_AVAILABLE_CATEGORIES: CategoryKey[] = [
  'tech',
  'fmcg',
  'business',
  'science',
  'art',
  'travel',
  'politics',
  'sports',
  'lifestyle',
  'auto',
  'health',
  'realestate',
  'energy',
  'gaming',
  'books',
  'education',
  'crypto',
  'ecology',
  'gastronomy',
];

export default function App() {
  const [bulletin, setBulletin] = useState<MorningBulletin>(() => generateLiveNewspaperEdition());
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all' | 'favorites'>('all');
  const [activeItem, setActiveItem] = useState<NewsHeadlineItem | null>(null);
  const [isVerbatimModalOpen, setIsVerbatimModalOpen] = useState(false);
  const [isPlainTextViewOpen, setIsPlainTextViewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMoreCategory, setLoadingMoreCategory] = useState<CategoryKey | null>(null);

  // Exact timestamp of last refresh / update
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    const now = new Date();
    const today = new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const time = now.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${today}, ${time} ч.`;
  });

  // Accordion state: which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    tech: true,
  });

  // Active chosen categories (persisted in localStorage)
  const [activeCategories, setActiveCategories] = useState<CategoryKey[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('morning_newspaper_active_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_CORE_CATEGORIES;
  });

  // Persistent Favorites
  const [favorites, setFavorites] = useState<NewsHeadlineItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('morning_bulletin_favorites');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const favoriteIds = new Set(favorites.map((f) => f.id));

  const handleToggleFavorite = (item: NewsHeadlineItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      let updated: NewsHeadlineItem[];
      if (exists) {
        updated = prev.filter((f) => f.id !== item.id);
        showToast('Премахнато от Любими.');
      } else {
        updated = [item, ...prev];
        showToast(`Добавено в Любими: „${item.title.slice(0, 45)}...“`);
      }
      try {
        localStorage.setItem('morning_bulletin_favorites', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Load today's bulletin on mount and warmup speech synthesis
  useEffect(() => {
    BulgarianTTS.warmup();
    fetch('/api/bulletin/today')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.bulletin) {
          const enriched: MorningBulletin = { ...data.bulletin };
          for (const k of Object.keys(enriched.categories || {})) {
            const sec = (enriched.categories as any)?.[k];
            if (sec && sec.headlines) {
              sec.headlines = sec.headlines.map(ensureFullArticle);
            }
          }
          setBulletin(enriched);
          if (enriched.dateStr) {
            setLastUpdatedTime(enriched.dateStr);
          }
        }
      })
      .catch((err) => {
        console.warn('Using live generated edition:', err);
      });
  }, []);

  // Synchronize bulletin.categories with activeCategories (load from OPTIONAL_CATEGORIES if missing)
  useEffect(() => {
    let updated = false;
    const newCatMap = { ...bulletin.categories };
    let addedCount = 0;

    activeCategories.forEach((catKey) => {
      if (!newCatMap[catKey] && OPTIONAL_CATEGORIES[catKey]) {
        const opt = OPTIONAL_CATEGORIES[catKey];
        const readyHeadlines = opt.initialHeadlines.map(ensureFullArticle);
        newCatMap[catKey] = {
          category: opt.meta,
          headlines: readyHeadlines,
        };
        addedCount += readyHeadlines.length;
        updated = true;
        AudioPreloader.preloadTopArticles(readyHeadlines);
      }
    });

    if (updated) {
      setBulletin((prev) => ({
        ...prev,
        categories: newCatMap as any,
        totalHeadlinesCount: (prev.totalHeadlinesCount || 90) + addedCount,
      }));
    }
  }, [activeCategories]);

  // Toggle single category accordion
  const toggleCategory = (key: CategoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    for (const k of ALL_AVAILABLE_CATEGORIES) {
      next[k] = true;
    }
    setExpandedCategories(next);
    showToast('Всички категории са разгърнати.');
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
    showToast('Всички категории са свити.');
  };

  // Automatically expand category when selected directly from top nav
  useEffect(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
      setExpandedCategories((prev) => ({
        ...prev,
        [selectedCategory]: true,
      }));
    }
  }, [selectedCategory]);

  const handleToggleCategory = (key: CategoryKey) => {
    const isCurrentlyActive = activeCategories.includes(key);
    if (isCurrentlyActive) {
      if (activeCategories.length <= 1) {
        showToast('Трябва да има поне един активен раздел във вестника.');
        return;
      }
      const next = activeCategories.filter((k) => k !== key);
      setActiveCategories(next);
      try {
        localStorage.setItem('morning_newspaper_active_categories', JSON.stringify(next));
      } catch (e) {}
      if (selectedCategory === key) {
        setSelectedCategory('all');
      }
      const opt = OPTIONAL_CATEGORIES[key];
      showToast(`Разделът „${opt?.meta.name || key}“ беше скрит от вестника.`);
    } else {
      const next = [...activeCategories, key];
      setActiveCategories(next);
      try {
        localStorage.setItem('morning_newspaper_active_categories', JSON.stringify(next));
      } catch (e) {}
      const opt = OPTIONAL_CATEGORIES[key];
      if (opt) {
        showToast(`Добавен нов раздел: „${opt.meta.name}“!`);
      } else {
        showToast(`Разделът беше добавен.`);
      }
    }
  };

  const handleResetCategories = () => {
    setActiveCategories(DEFAULT_CORE_CATEGORIES);
    try {
      localStorage.setItem('morning_newspaper_active_categories', JSON.stringify(DEFAULT_CORE_CATEGORIES));
    } catch (e) {}
    showToast('Възстановени са стандартните 9 раздела.');
  };

  const handleSelectAllCategories = () => {
    setActiveCategories(ALL_AVAILABLE_CATEGORIES);
    try {
      localStorage.setItem('morning_newspaper_active_categories', JSON.stringify(ALL_AVAILABLE_CATEGORIES));
    } catch (e) {}
    showToast('Всички 19 раздела са активирани във вашия вестник!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const now = new Date();
    const today = new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const time = now.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentStamp = `${today}, ${time} ч.`;

    try {
      const res = await fetch('/api/bulletin/generate', { method: 'POST' });
      const data = await res.json();
      if (data.bulletin) {
        const enriched: MorningBulletin = { ...data.bulletin };
        for (const k of Object.keys(enriched.categories || {})) {
          const sec = (enriched.categories as any)?.[k];
          if (sec && sec.headlines) {
            sec.headlines = sec.headlines.map(ensureFullArticle);
          }
        }
        setBulletin(enriched);
        const timeNote = data.bulletin.dateStr || currentStamp;
        setLastUpdatedTime(timeNote);
        showToast(`Вестникът е обновен! Последно обновяване: ${timeNote}`);
        setIsRefreshing(false);
        return;
      }
    } catch (e) {
      console.warn('Network refresh error, using local live generator:', e);
    }

    const live = generateLiveNewspaperEdition();
    setBulletin(live);
    setLastUpdatedTime(currentStamp);
    showToast(`Вестникът е обновен! Последно обновяване: ${currentStamp}`);
    setIsRefreshing(false);
  };

  // Load more articles for a category
  const handleLoadMore = async (catKey: CategoryKey) => {
    setLoadingMoreCategory(catKey);
    const currentList = bulletin.categories[catKey]?.headlines || [];
    const currentCount = currentList.length;

    try {
      const res = await fetch('/api/category/load-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryKey: catKey, currentCount, count: 5 }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.headlines?.length > 0) {
          setBulletin((prev) => {
            const currentCat = prev.categories[catKey];
            if (!currentCat) return prev;
            return {
              ...prev,
              categories: {
                ...prev.categories,
                [catKey]: {
                  ...currentCat,
                  headlines: [...currentCat.headlines, ...data.headlines],
                },
              },
              totalHeadlinesCount: (prev.totalHeadlinesCount || 90) + data.headlines.length,
            };
          });
          AudioPreloader.preloadTopArticles(data.headlines);
          showToast(`Заредени са ${data.headlines.length} нови статии в "${bulletin.categories[catKey]?.category.name || catKey}"!`);
          setLoadingMoreCategory(null);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend load-more error, using local pool:', e);
    }

    // Rich local fallback pool
    const pool = EXTRA_ARTICLES_POOL[catKey] || [];
    const poolOffset = Math.max(0, currentCount - 10) % Math.max(1, pool.length);
    const itemsToAdd = pool.slice(poolOffset, poolOffset + 5);
    const safeItems = itemsToAdd.length > 0 ? itemsToAdd : pool.slice(0, 5);

    const newItems: NewsHeadlineItem[] = safeItems.map((item, idx) =>
      ensureFullArticle({
        id: `${catKey}-${Date.now()}-${currentCount + idx + 1}`,
        number: currentCount + idx + 1,
        title: item.title,
        source: item.source,
        categoryKey: catKey,
      })
    );

    setBulletin((prev) => {
      const currentCat = prev.categories[catKey];
      if (!currentCat) return prev;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [catKey]: {
            ...currentCat,
            headlines: [...currentCat.headlines, ...newItems],
          },
        },
        totalHeadlinesCount: (prev.totalHeadlinesCount || 90) + newItems.length,
      };
    });

    AudioPreloader.preloadTopArticles(newItems);
    showToast(`Заредени са ${newItems.length} нови статии в "${bulletin.categories[catKey]?.category.name || catKey}"!`);
    setLoadingMoreCategory(null);
  };

  const handleReadVerbatim = (item: NewsHeadlineItem) => {
    const ready = ensureFullArticle(item);
    AudioPreloader.preloadArticleAudio(ready);
    setActiveItem(ready);
    setIsVerbatimModalOpen(true);
  };

  const handleExecuteCommand = (catKey: CategoryKey, number: number) => {
    const sec = bulletin.categories[catKey];
    if (sec) {
      const found = sec.headlines.find((h) => h.number === number);
      if (found) {
        handleReadVerbatim(found);
        return;
      }
    }
    for (const key of Object.keys(bulletin.categories) as CategoryKey[]) {
      const match = bulletin.categories[key]?.headlines.find((h) => h.number === number);
      if (match) {
        handleReadVerbatim(match);
        return;
      }
    }
    showToast(`Статия #${number} в категория ${catKey} не беше намерена.`);
  };

  const handleNavigateItem = (direction: 'prev' | 'next') => {
    if (!activeItem) return;
    const catSec = bulletin.categories[activeItem.categoryKey];
    if (!catSec) return;

    const currentIndex = catSec.headlines.findIndex((h) => h.id === activeItem.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < catSec.headlines.length) {
      setActiveItem(catSec.headlines[targetIndex]);
    }
  };

  const currentCatHeadlines = activeItem
    ? bulletin.categories[activeItem.categoryKey]?.headlines || []
    : [];
  const currentItemIndex = activeItem
    ? currentCatHeadlines.findIndex((h) => h.id === activeItem.id)
    : -1;
  const hasPrev = currentItemIndex > 0;
  const hasNext = currentItemIndex >= 0 && currentItemIndex < currentCatHeadlines.length - 1;

  const counts: Record<string, number> = {};
  for (const key of ALL_AVAILABLE_CATEGORIES) {
    counts[key] = bulletin.categories[key]?.headlines.length || 0;
  }

  const categoryKeys: CategoryKey[] =
    selectedCategory === 'all'
      ? activeCategories
      : selectedCategory === 'favorites'
      ? []
      : [selectedCategory];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors selection:bg-amber-200 dark:selection:bg-amber-900 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern 3-zone Header */}
      <Header
        bulletin={bulletin}
        selectedCategory={selectedCategory === 'favorites' ? 'all' : selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenPlainTextView={() => setIsPlainTextViewOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Editorial Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Editorial Date & Countdown Bar with Refresh button */}
        <div className="border-b border-stone-200 dark:border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest text-[11px]">
              Българско сутрешно издание
            </span>
            <span aria-hidden="true">·</span>
            <span>{bulletin.dateStr}</span>
            <span aria-hidden="true">·</span>
            <span>07:00 ч. Вестник</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Refresh Button in sub-header */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600/40 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Обнови заглавията с последни новини"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Обновяване...' : 'Обнови'}</span>
            </button>

            <CountdownBadge onTriggerNow={handleRefresh} isRefreshing={isRefreshing} />
          </div>
        </div>

        {/* Prominent Live Last-Update Banner */}
        <div className="rounded-xl border border-amber-500/30 dark:border-amber-500/25 bg-gradient-to-r from-amber-50/90 via-amber-100/30 to-amber-50/50 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-900 p-3.5 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 uppercase font-mono tracking-wider text-[11px]">
              Последно обновяване:
            </span>
            <span className="font-mono font-bold text-amber-900 dark:text-amber-300 bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 shadow-2xs">
              {lastUpdatedTime}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-600 dark:text-stone-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-sans font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Опреснено до секундата</span>
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Опреснява се...' : 'Опресни сега'}</span>
            </button>
          </div>
        </div>

        {/* Quick Command Bar */}
        <QuickCommandBar
          activeCategory={selectedCategory === 'favorites' ? 'all' : selectedCategory}
          onExecuteCommand={handleExecuteCommand}
        />

        {/* Category Navigation Tabs */}
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          counts={counts}
          favoritesCount={favorites.length}
          activeCategories={activeCategories}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
        />

        {/* Categories Sections / Favorites View */}
        <div className="space-y-12 sm:space-y-16">
          {/* FAVORITES VIEW */}
          {selectedCategory === 'favorites' && (
            <section className="space-y-6">
              <div className="border-b border-stone-300 dark:border-stone-800 pb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                    <Heart className="w-5 h-5 fill-rose-500 stroke-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-sans font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                      Любими статии
                    </h2>
                    <p className="text-xs text-stone-500">
                      Вашите запазени новини за лесен и бърз повторен прочит
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                  {favorites.length} запазени материала
                </div>
              </div>

              {favorites.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 p-8 space-y-3">
                  <Heart className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700" />
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    Все още нямате запазени любими статии
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    Натиснете иконата със сърце върху която и да е новина от вестника, за да я добавите тук за бърз достъп.
                  </p>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Към всички категории
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.map((item) => (
                    <HeadlineCard
                      key={item.id}
                      item={item}
                      onReadVerbatim={handleReadVerbatim}
                      categoryName={bulletin.categories[item.categoryKey]?.category.name}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Action bar for expanding/collapsing all categories with plus */}
          {selectedCategory === 'all' && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px]">
                  Раздели на вестника ({categoryKeys.length})
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Натиснете плюсчето [+] за разгръщане на раздел
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                  <span>Разгърни всички</span>
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Свий всички</span>
                </button>
              </div>
            </div>
          )}

          {/* ACCORDION CATEGORY SECTIONS WITH PLUS (+) BUTTON */}
          {selectedCategory !== 'favorites' &&
            categoryKeys.map((key, index) => {
              const sec = bulletin.categories[key];
              if (!sec) return null;
              const isExpanded = selectedCategory !== 'all' ? true : !!expandedCategories[key];

              return (
                <CategorySectionAccordion
                  key={key}
                  categoryKey={key}
                  section={sec}
                  index={index}
                  isExpanded={isExpanded}
                  onToggle={() => toggleCategory(key)}
                  onReadVerbatim={handleReadVerbatim}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onLoadMore={handleLoadMore}
                  isLoadingMore={loadingMoreCategory === key}
                />
              );
            })}
        </div>

        {/* Category Discovery & Customization Banner */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs mt-12">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-600 text-white">
                <Sliders className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400 font-bold">
                Персонализиран сутрешен вестник
              </span>
            </div>
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-stone-950 dark:text-stone-50 tracking-tight">
              Искате още теми във вашия вестник?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
              Добавете допълнителни раздели по избор: <strong className="font-semibold text-stone-800 dark:text-stone-200">Авто & Мобилност, Здраве, Имоти, Енергетика, Гейминг, Книги, Образование, Крипто, Екология и Кулинария</strong>. Вестникът се нагажда към вашите интереси!
            </p>
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-sm hover:shadow shrink-0"
          >
            <Sliders className="w-4 h-4" />
            <span>+ Избери още категории ({activeCategories.length}/19 активни)</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-10 text-center text-xs text-stone-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-display font-bold text-stone-900 dark:text-stone-100 text-base tracking-wide">
            МОЯТ СУТРЕШЕН ВЕСТНИК 07:00 Ч.
          </p>
          <p className="max-w-lg mx-auto text-stone-500 text-xs">
            Ежедневен новинарски преглед със списък от номерирани заглавия и източници с малки букви. Дословен прочит и аудио четец с гласово управление.
          </p>
          <div className="pt-2 text-[11px] font-mono text-stone-400 flex flex-wrap justify-center gap-4">
            <span>© 2026 Моят Сутрешен Вестник</span>
            <span>·</span>
            <span>{activeCategories.length} от 19 категории активни</span>
            <span>·</span>
            <span>Гласово управление на български</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VerbatimReaderModal
        item={activeItem}
        isOpen={isVerbatimModalOpen}
        onClose={() => setIsVerbatimModalOpen(false)}
        onNavigateItem={handleNavigateItem}
        hasPrev={hasPrev}
        hasNext={hasNext}
        categoryName={
          activeItem ? bulletin.categories[activeItem.categoryKey]?.category.name || '' : ''
        }
      />

      <PlainTextViewModal
        bulletin={bulletin}
        isOpen={isPlainTextViewOpen}
        onClose={() => setIsPlainTextViewOpen(false)}
      />

      <ScheduleSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSimulateMorningDispatch={() => {
          handleRefresh();
          showToast('07:00 ч. сутрешен звън: вестникът е актуализиран!');
        }}
      />

      <CategoryCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        onResetToDefault={handleResetCategories}
        onSelectAll={handleSelectAllCategories}
      />
    </div>
  );
}
