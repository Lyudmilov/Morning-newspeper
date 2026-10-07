// Client-side Article Audio Preloader & Cache
// Enables instant 0ms audio start upon opening and clicking play on articles

import { generateClientGeminiTTS } from './geminiDirectTts';

export interface CachedAudio {
  audioBase64: string;
  mimeType: string;
}

class AudioPreloaderService {
  private cache = new Map<string, CachedAudio>();
  private inFlight = new Map<string, Promise<CachedAudio | null>>();

  // Check if an article's audio is ready in memory
  public isPreloaded(idOrKey: string): boolean {
    return this.cache.has(idOrKey);
  }

  // Get cached audio if available
  public getAudio(idOrKey: string): CachedAudio | undefined {
    return this.cache.get(idOrKey);
  }

  // Set audio manually into cache
  public setAudio(idOrKey: string, audio: CachedAudio): void {
    this.cache.set(idOrKey, audio);
  }

  // Preload a single article's audio
  public async preloadArticleAudio(item: {
    id: string;
    title: string;
    categoryKey?: string;
    fullArticle?: { body?: string[]; leadParagraph?: string };
  }): Promise<CachedAudio | null> {
    if (!item?.id && !item?.title) return null;

    const cacheKey = item.id || item.title;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Reuse in-flight request if already loading
    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey)!;
    }

    const textToSpeak =
      item.fullArticle?.body?.slice(0, 3)?.join('. ') ||
      item.fullArticle?.leadParagraph ||
      item.title;

    const promise = (async () => {
      try {
        const res = await fetch('/api/article/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            text: textToSpeak,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.available && data.audioBase64) {
              const cached: CachedAudio = {
                audioBase64: data.audioBase64,
                mimeType: data.mimeType || 'audio/wav',
              };
              this.cache.set(cacheKey, cached);
              if (item.id) this.cache.set(item.id, cached);
              if (item.title) this.cache.set(item.title, cached);
              return cached;
            }
          }
        }
      } catch (err) {
        console.warn('Backend audio preloading error for:', item.title, err);
      }

      // Static Netlify fallback: direct client Gemini TTS if API key exists
      try {
        const directAudio = await generateClientGeminiTTS(item.title, textToSpeak);
        if (directAudio) {
          this.cache.set(cacheKey, directAudio);
          if (item.id) this.cache.set(item.id, directAudio);
          if (item.title) this.cache.set(item.title, directAudio);
          return directAudio;
        }
      } catch (directErr) {
        console.warn('Direct client-side TTS fallback error:', directErr);
      } finally {
        this.inFlight.delete(cacheKey);
      }
      return null;
    })();

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  // Preload top articles in background without blocking UI
  public preloadTopArticles(items: Array<{ id: string; title: string; fullArticle?: any }>): void {
    if (!items || items.length === 0) return;

    // Preload sequentially with brief intervals to keep network smooth
    let index = 0;
    const loadNext = () => {
      if (index >= items.length) return;
      const target = items[index++];
      this.preloadArticleAudio(target).finally(() => {
        setTimeout(loadNext, 300);
      });
    };

    setTimeout(loadNext, 100);
  }
}

export const AudioPreloader = new AudioPreloaderService();
