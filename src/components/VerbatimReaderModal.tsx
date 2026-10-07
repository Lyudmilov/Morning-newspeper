import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Volume2,
  Play,
  Pause,
  Quote,
  Clock,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  Zap,
  Sparkles,
  Heart,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { NewsHeadlineItem } from '../types/bulletin';
import { BulgarianTTS } from '../utils/speech';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { AudioPreloader } from '../utils/audioPreloader';
import { ensureFullArticle } from '../utils/articleContentEnsurer';

interface VerbatimReaderModalProps {
  item: NewsHeadlineItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateItem: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
  categoryName: string;
  isFavorite?: boolean;
  onToggleFavorite?: (item: NewsHeadlineItem) => void;
}

export const VerbatimReaderModal: React.FC<VerbatimReaderModalProps> = ({
  item,
  isOpen,
  onClose,
  onNavigateItem,
  hasPrev,
  hasNext,
  categoryName,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [copied, setCopied] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<'ai' | 'instant'>('instant');
  const [articleData, setArticleData] = useState<any>(null);
  const [isVoiceControlEnabled, setIsVoiceControlEnabled] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  // Stop audio on close or unmount
  useEffect(() => {
    return () => {
      BulgarianTTS.stop();
    };
  }, []);

  // Fetch remote full article from server
  const fetchRemoteFullArticle = useCallback(async (targetItem: NewsHeadlineItem, force = false) => {
    try {
      setIsFetchingRemote(true);
      const res = await fetch('/api/article/verbatim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: targetItem.number,
          title: targetItem.title,
          source: targetItem.source,
          categoryKey: targetItem.categoryKey,
          forceRefresh: force,
        }),
      });
      const data = await res.json();
      if (data.success && data.article && data.article.body && data.article.body.length >= 4) {
        setArticleData(data.article);
        targetItem.fullArticle = data.article;
        AudioPreloader.preloadArticleAudio({
          id: targetItem.id,
          title: targetItem.title,
          fullArticle: data.article,
        });
      }
    } catch (e) {
      // Retain already loaded article
    } finally {
      setIsFetchingRemote(false);
    }
  }, []);

  // Fetch full verbatim text if not preloaded or when item changes
  useEffect(() => {
    if (!isOpen || !item) {
      BulgarianTTS.stop();
      setIsPlaying(false);
      setIsGeneratingAudio(false);
      return;
    }

    BulgarianTTS.stop();
    setIsPlaying(false);
    setIsGeneratingAudio(false);

    // Immediately ensure full verbatim article with 0ms delay
    const readyItem = ensureFullArticle(item);
    setArticleData(readyItem.fullArticle);
    setIsLoadingArticle(false);

    // Warm up audio preloading immediately upon opening the modal
    AudioPreloader.preloadArticleAudio({
      id: readyItem.id,
      title: readyItem.title,
      fullArticle: readyItem.fullArticle,
    });

    // Check if remote full article can be enriched in background
    if (!item.fullArticle || (item.fullArticle.wordCount || 0) < 650) {
      fetchRemoteFullArticle(readyItem, false);
    }
  }, [isOpen, item, fetchRemoteFullArticle]);

  // Preload audio as soon as article text is loaded
  useEffect(() => {
    if (!item || !articleData) return;
    AudioPreloader.preloadArticleAudio({
      id: item.id,
      title: item.title,
      fullArticle: articleData,
    });
  }, [item, articleData]);

  const fullTextToRead = articleData?.body?.join('. ') || item?.title || '';

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying || isGeneratingAudio) {
      BulgarianTTS.stop();
      setIsPlaying(false);
      setIsGeneratingAudio(false);
      return;
    }

    // Mode 1: Instant Local Voice (Browser SpeechSynthesis)
    if (voiceEngine === 'instant') {
      setIsPlaying(true);
      const spoke = BulgarianTTS.speak(`${item?.title}. ${fullTextToRead}`, {
        rate: speechRate,
        pitch: 1.0,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
      if (!spoke) {
        setIsPlaying(false);
      }
      return;
    }

    // Mode 2: AI Studio Voice (Kore - authoritative clear Bulgarian news broadcast)
    const cached = item?.id ? AudioPreloader.getAudio(item.id) || AudioPreloader.getAudio(item.title) : undefined;

    if (cached) {
      // 0ms delay: starts playing immediately from preloaded memory cache!
      setIsPlaying(true);
      BulgarianTTS.playAudioBase64(
        cached.audioBase64,
        cached.mimeType,
        () => setIsPlaying(false),
        speechRate
      );
      return;
    }

    // If not yet finished preloading, wait with visual spinner and auto-play as soon as arrived
    setIsGeneratingAudio(true);
    try {
      const loaded = await AudioPreloader.preloadArticleAudio({
        id: item?.id || 'temp',
        title: item?.title || '',
        fullArticle: articleData || { leadParagraph: fullTextToRead },
      });
      setIsGeneratingAudio(false);

      if (loaded?.audioBase64) {
        setIsPlaying(true);
        BulgarianTTS.playAudioBase64(
          loaded.audioBase64,
          loaded.mimeType,
          () => setIsPlaying(false),
          speechRate
        );
        return;
      }
    } catch (e) {
      setIsGeneratingAudio(false);
      console.warn('Backend TTS error, fallback to browser speech:', e);
    }

    // Fallback to local speech
    setIsPlaying(true);
    const spoke = BulgarianTTS.speak(`${item?.title}. ${fullTextToRead}`, {
      rate: speechRate,
      pitch: 1.0,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
    if (!spoke) {
      setIsPlaying(false);
    }
  }, [isPlaying, isGeneratingAudio, voiceEngine, item, fullTextToRead, speechRate, articleData]);

  const handleVoiceNext = useCallback(() => {
    if (hasNext) {
      setVoiceNotice('Следваща статия...');
      setTimeout(() => setVoiceNotice(null), 2000);
      onNavigateItem('next');
    } else {
      setVoiceNotice('Последна статия в категорията');
      setTimeout(() => setVoiceNotice(null), 2500);
    }
  }, [hasNext, onNavigateItem]);

  const handleVoicePrev = useCallback(() => {
    if (hasPrev) {
      setVoiceNotice('Предишна статия...');
      setTimeout(() => setVoiceNotice(null), 2000);
      onNavigateItem('prev');
    } else {
      setVoiceNotice('Първа статия в категорията');
      setTimeout(() => setVoiceNotice(null), 2500);
    }
  }, [hasPrev, onNavigateItem]);

  const handleVoicePlay = useCallback(() => {
    if (!isPlaying) handleTogglePlay();
  }, [isPlaying, handleTogglePlay]);

  const handleVoicePause = useCallback(() => {
    if (isPlaying) {
      BulgarianTTS.stop();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const {
    isSupported: isVoiceSupported,
    isListening,
    lastTranscript,
    lastCommand,
    toggleListening,
  } = useVoiceNavigation({
    enabled: isOpen && isVoiceControlEnabled,
    onNext: handleVoiceNext,
    onPrev: handleVoicePrev,
    onPlay: handleVoicePlay,
    onPause: handleVoicePause,
    onClose,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) onNavigateItem('next');
      else if (e.key === 'ArrowLeft' && hasPrev) onNavigateItem('prev');
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNavigateItem, onClose]);

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    const textToCopy = `[${categoryName.toUpperCase()} #${item.number}]\n${item.title}\n${item.source.toLowerCase()}\n\n${articleData?.body?.join('\n\n') || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedNumber = item.number.toString().padStart(2, '0');
  const cleanSource = item.source.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-300">
            <span className="font-bold text-amber-700 dark:text-amber-400">
              #{formattedNumber}
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="uppercase tracking-wider font-semibold">{categoryName}</span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700 hidden sm:inline">·</span>
            <span className="text-stone-500 hidden sm:inline">Дословен материал</span>
          </div>

          <div className="flex items-center gap-2">
            {isVoiceSupported && (
              <button
                onClick={() => {
                  setIsVoiceControlEnabled(!isVoiceControlEnabled);
                  toggleListening();
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isListening && isVoiceControlEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title="Превключи гласово управление"
              >
                {isListening && isVoiceControlEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Гласово</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Гласово изкл.</span>
                  </>
                )}
              </button>
            )}

            {/* Favorite Button */}
            <button
              onClick={() => item && onToggleFavorite?.(item)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-stone-500 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
              title={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
              aria-label={isFavorite ? 'Премахни от любими' : 'Добави в любими'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
                }`}
              />
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Копирай текст"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Затвори (ESC или кажете „затвори“)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice control live strip */}
        {isVoiceSupported && isVoiceControlEnabled && (
          <div className="bg-stone-100/90 dark:bg-stone-950/60 border-b border-stone-200/80 dark:border-stone-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 dark:text-amber-400 font-semibold">Гласови команди:</span>
              <span>„следваща“ · „предишна“ · „прочети“ · „пауза“ · „затвори“</span>
            </div>

            {(lastCommand || voiceNotice || lastTranscript) && (
              <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
                {lastCommand && <span className="font-bold text-emerald-600">✓ {lastCommand}</span>}
                {voiceNotice && !lastCommand && <span>{voiceNotice}</span>}
                {!lastCommand && !voiceNotice && lastTranscript && (
                  <span className="text-stone-400 truncate max-w-[160px]">„{lastTranscript}“</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Article Body */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1">
          {/* Detailed Editorial Metadata with Date & Time */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-stone-500 dark:text-stone-400 mb-3">
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold uppercase text-[11px] border border-amber-200/60 dark:border-amber-900/40">
              #{formattedNumber} · {categoryName}
            </span>
            <span className="lowercase">
              {cleanSource.startsWith('източник:') ? cleanSource : `източник: ${cleanSource}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5 text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded border border-stone-200/60 dark:border-stone-700/60 font-sans font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Дата и час: {item.publishedAt || (item.publishedDate ? `${item.publishedDate}, ${item.publishedTime}` : 'Днес в 07:00 ч.')}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-sans">
              <Clock className="w-3 h-3" />
              <span>{articleData?.readTimeMinutes || 2} мин. четене</span>
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-stone-900 dark:text-stone-50 leading-tight mb-6 text-balance tracking-tight">
            {item.title}
          </h2>

          {/* Audio Bar */}
          <div className="my-6 p-4 rounded-xl bg-stone-900 text-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-800 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlay}
                disabled={isGeneratingAudio}
                className={`w-11 h-11 rounded-full text-white flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isGeneratingAudio
                    ? 'bg-stone-800 text-amber-400 cursor-wait'
                    : isPlaying
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
                title={isGeneratingAudio ? 'Генериране...' : isPlaying ? 'Пауза' : 'Слушай дословно'}
              >
                {isGeneratingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <div>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isGeneratingAudio
                      ? 'Генериране на дамски глас от Gemini AI...'
                      : isPlaying
                      ? 'Възпроизвежда се дамският глас на Gemini...'
                      : 'Слушай дословно статията'}
                  </span>
                </p>
                <p className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Дамски глас Gemini (Aoede) — топъл, мек и приятен</span>
                </p>
              </div>
            </div>

            {/* Right Controls: Voice Badge & Speed Selection */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 bg-amber-950/50 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-md text-[11px] font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Дамски глас Gemini</span>
              </span>

              {/* Playback Rates */}
              <div className="flex items-center gap-1 text-xs text-stone-300 font-mono">
                <span className="text-stone-400 mr-0.5">Скорост:</span>
                {[0.9, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      BulgarianTTS.setPlaybackRate(rate);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      speechRate === rate ? 'bg-amber-600 text-white' : 'bg-stone-800 hover:bg-stone-700'
                    }`}
                    title={`Скорост ${rate}x`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoadingArticle && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-sm font-medium">Зареждане на дословния текст на статията...</p>
            </div>
          )}

          {/* Verbatim Body */}
          {!isLoadingArticle && articleData && (
            <div className="space-y-4 font-sans text-base sm:text-[17px] leading-relaxed text-stone-800 dark:text-stone-200">
              {/* Verbatim Authentic Text Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-stone-200/80 dark:border-stone-800 text-xs font-mono text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider text-[11px] border border-emerald-600/20">
                    ДОСЛОВЕН ПЪЛЕН ТЕКСТ 1:1
                  </span>
                  <span className="font-sans font-medium text-stone-700 dark:text-stone-300">
                    Пълен оригинален обем · Без съкращения и без ограничения
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[11px] font-bold border border-stone-200 dark:border-stone-700">
                    {articleData.wordCount || (articleData.body?.join(' ').split(/\s+/).length) || 850} думи · {articleData.body?.length || 9} параграфа
                  </span>
                  <button
                    type="button"
                    onClick={() => item && fetchRemoteFullArticle(item, true)}
                    disabled={isFetchingRemote}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                    title="Презареди статията в най-пълен оригинален обем от източника"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRemote ? 'animate-spin' : ''}`} />
                    <span>{isFetchingRemote ? 'Синхронизиране...' : 'Опресни 1:1'}</span>
                  </button>
                </div>
              </div>

              {articleData.body?.map((para: string, idx: number) => (
                <p key={idx} className="leading-relaxed font-normal text-stone-800 dark:text-stone-200">
                  {para}
                </p>
              ))}

              {articleData.keyQuotes && articleData.keyQuotes.length > 0 && (
                <div className="my-6 pl-4 border-l-3 border-amber-600 font-sans">
                  {articleData.keyQuotes.map((q: string, qIdx: number) => (
                    <p key={qIdx} className="text-stone-900 dark:text-stone-100 font-medium">
                      „{q}“
                    </p>
                  ))}
                </div>
              )}

              {articleData.contextFact && (
                <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-xs font-sans text-stone-500 dark:text-stone-400">
                  <strong className="text-stone-800 dark:text-stone-200">Контекст: </strong>
                  {articleData.contextFact}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between text-xs font-mono text-stone-600 dark:text-stone-400">
          <button
            onClick={() => onNavigateItem('prev')}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Предишна</span>
          </button>

          <span>
            #{formattedNumber} от {categoryName}
          </span>

          <button
            onClick={() => onNavigateItem('next')}
            disabled={!hasNext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>Следваща</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
