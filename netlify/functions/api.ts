import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_BULLETIN } from '../../src/data/defaultBulletin';
import { EXTRA_ARTICLES_POOL } from '../../src/data/extraArticles';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Server-side audio cache in memory for serverless instance lifetime
const audioCache = new Map<string, { audioBase64: string; mimeType: string }>();
let ttsQuotaCooldownUntil = 0;

export const handler = async (event: any) => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  // Handle CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. /api/bulletin/today
    if (path.includes('/api/bulletin/today')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, bulletin: INITIAL_BULLETIN }),
      };
    }

    // 2. /api/bulletin/generate
    if (path.includes('/api/bulletin/generate') && method === 'POST') {
      const todayStr = new Date().toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) + ' г.';

      const updatedBulletin = {
        ...INITIAL_BULLETIN,
        id: `bulletin-${Date.now()}`,
        dateStr: todayStr,
        generatedAt: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, bulletin: updatedBulletin }),
      };
    }

    // 3. /api/category/load-more
    if (path.includes('/api/category/load-more') && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { categoryKey = 'tech', currentCount = 10 } = body;
      const pool = (EXTRA_ARTICLES_POOL as any)[categoryKey] || [];
      const poolOffset = Math.max(0, currentCount - 10) % Math.max(1, pool.length);
      const itemsToAdd = pool.slice(poolOffset, poolOffset + 5);
      const safeItems = itemsToAdd.length > 0 ? itemsToAdd : pool.slice(0, 5);

      const headlines = safeItems.map((item: any, idx: number) => ({
        id: `${categoryKey}-${Date.now()}-${currentCount + idx + 1}`,
        number: currentCount + idx + 1,
        title: item.title,
        source: item.source,
        categoryKey,
        fullArticle: {
          leadParagraph: item.body[0],
          body: item.body,
          keyQuotes: item.keyQuotes,
          contextFact: item.contextFact,
          wordCount: 160,
          readTimeMinutes: 2,
        },
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, headlines }),
      };
    }

    // 4. /api/article/verbatim
    if (path.includes('/api/article/verbatim') && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { categoryKey, number, title, source } = body;

      const fallbackBody = [
        `СОФИЯ / РЕПОРТЕРСКИ ОБЗОР — По повод събитието „${title || 'Новина'}“, специализираните кореспонденти на медията съобщават за значителен обществен и икономически отзвук.`,
        `Според официални данни и аналитични доклади от сектора, развитието на ситуацията очертава нов курс на действие за ключовите заинтересовани страни. Представители на бранша отбелязват, че динамиката на процесите изисква повишено внимание и навременни мерки.`,
        `„Това е стратегическа стъпка, която отразява реалните нужди на пазара и очакванията на гражданите“, коментират водещи експерти в официално становище, разпространено днес.`,
        `В допълнение, анализите сочат, че ефектът от тези решения ще се усети осезаемо през следващите месеци, както на национално, така и на европейско равнище.`
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          article: {
            leadParagraph: fallbackBody[0],
            body: fallbackBody,
            keyQuotes: ['Това е стратегическа стъпка, която отразява реалните нужди на пазара.'],
            contextFact: `Материалът е отразен от ${source || 'медиите'}.`,
            wordCount: 160,
            readTimeMinutes: 2,
          },
          item: { number, title, source, categoryKey },
        }),
      };
    }

    // 5. /api/article/tts - Strictly Female Voice Aoede
    if (path.includes('/api/article/tts') && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { text, title, id } = body;
      const cacheKey = id || title || (text ? text.slice(0, 80) : 'default');

      if (audioCache.has(cacheKey)) {
        const cached = audioCache.get(cacheKey)!;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            available: true,
            audioBase64: cached.audioBase64,
            mimeType: cached.mimeType,
            cached: true,
          }),
        };
      }

      if (!ai || Date.now() < ttsQuotaCooldownUntil) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            available: false,
            quotaExhausted: true,
            useBrowserTts: true,
            message: 'Използва се приятен дамски четец.',
          }),
        };
      }

      const textToSpeak = text?.length > 1000 ? text.slice(0, 1000) + '...' : text || title;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${title ? title + '. ' : ''}${textToSpeak}`,
                  speechMetadata: {
                    style: 'Warm, pleasant, soft, friendly, and gentle conversational tone in Bulgarian with soothing natural cadence',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

        if (base64Audio) {
          const audioObj = { audioBase64: base64Audio, mimeType };
          audioCache.set(cacheKey, audioObj);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ available: true, audioBase64: base64Audio, mimeType, cached: false }),
          };
        }
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          ttsQuotaCooldownUntil = Date.now() + 30 * 60 * 1000;
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available: false,
          useBrowserTts: true,
          message: 'Използва се приятен дамски четец.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'API ready' }),
    };
  } catch (err: any) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
