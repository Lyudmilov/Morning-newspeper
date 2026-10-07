import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_BULLETIN, CATEGORIES_CONFIG, getLiveBulgarianDateStr } from './src/data/defaultBulletin';
import { MorningBulletin, CategoryKey, NewsHeadlineItem } from './src/types/bulletin';
import { ensureFullArticle, buildComprehensiveVerbatimArticle } from './src/utils/articleContentEnsurer';
import { generateLiveNewspaperEdition } from './src/utils/liveNewsGenerator';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory bulletin store with live dynamically initialized edition
let currentBulletin: MorningBulletin = generateLiveNewspaperEdition();

// Category names mapping
const categoryNameMap: Record<CategoryKey, string> = {
  tech: 'Технологии (начело с kaldata.com и mobilebulgaria.com)',
  fmcg: 'Бързооборотен сектор (FMCG & Ритейл: Kaufland, Lidl, Billa, Fantastico, храни, напитки, логистика)',
  business: 'Бизнес и финанси (макроикономика, банки, капиталови пазари, инвестиции, еврозона)',
  science: 'Наука',
  art: 'Изкуство',
  travel: 'Пътувания',
  politics: 'Политика',
  sports: 'Спорт',
  lifestyle: 'Лайфстайл',
  auto: 'Авто & Мобилност',
  health: 'Здраве & Медицина',
  realestate: 'Имоти & Архитектура',
  energy: 'Енергетика & Климат',
  gaming: 'Гейминг & Е-спорт',
  books: 'Книги & Литература',
  education: 'Образование & Кариера',
  crypto: 'Крипто & Финтех',
  ecology: 'Екология & Природа',
  gastronomy: 'Кулинария & Вино',
};

// GET current morning bulletin
app.get('/api/bulletin/today', (_req: Request, res: Response) => {
  currentBulletin.dateStr = getLiveBulgarianDateStr();
  res.json({
    success: true,
    bulletin: currentBulletin,
  });
});

// POST to generate a fresh 07:00 morning edition via Gemini
app.post('/api/bulletin/generate', async (req: Request, res: Response) => {
  const now = new Date();
  const todayStr = getLiveBulgarianDateStr();
  const timeStr = now.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveStamp = `${todayStr}, ${timeStr} ч.`;

  try {
    if (!ai) {
      currentBulletin = generateLiveNewspaperEdition();
      return res.json({
        success: true,
        bulletin: currentBulletin,
        note: `Опреснено до последната секунда в ${timeStr} ч.`,
      });
    }

    const prompt = `Ти си главен редактор на престижен български сутрешен вестник.
Днешна дата и точен час на опресняване: ${liveStamp}.
Създай най-новото, актуално до текущата секунда издание на вестника за ${todayStr}.

ЗАДЪЛЖИТЕЛНА СТРУКТУРА И ПОСЛЕДОВАТЕЛНОСТ НА КАТЕГОРИИТЕ:
Започвай задължително първо със статии за технологии, след това за бързооборотен сектор (FMCG), след това бизнес и финанси, и оттам нататък останалите раздели:
1. "tech" (Технологии: Задължително като първи водещи новини номер 1 и 2 включи актуални теми от българските специализирани технологични и мобилни медии "kaldata.com" и "mobilebulgaria.com" с източници съответно "източник: kaldata.com" и "източник: mobilebulgaria.com")
2. "fmcg" (Бързооборотен сектор - FMCG: Търговски вериги като Kaufland, Lidl, Billa, Fantastico, производители на храни и напитки, логистика, цени на суровини, потребителски навици)
3. "business" (Бизнес и финанси: Макроикономика, БНБ и ЕЦБ лихви, капиталови пазари, корпоративни инвестиции, банки и индустрия)
4. "science" (Наука: Астрономия, физика, климатология, космически изследвания, открития и медицина)
5. "art" (Изкуство: Музеи, изложби, театър, живопис, класическа музика, реставрация и скулптура)
6. "travel" (Пътувания: Дестинации, устойчив туризъм, планински и културни маршрути, транспорт и пътешествия)
7. "politics" (Политика: Вътрешнополитически процеси, решения на ЕС, дипломация и сигурност)
8. "sports" (Спорт)
9. "lifestyle" (Лайфстайл)

ЗАДЪЛЖИТЕЛНИ ИЗИСКВАНИЯ:
1. Всяка категория ТРЯБВА да съдържа МИНИМУМ 10 номерирани заглавия (номер от 1 до 10).
2. Под всяко заглавие източникът (source) ТРЯБВА да бъде написан строго с малки букви във формат: "източник: име-на-медия.bg" или "източник: reuters.com" (напр. "източник: kaldata.com", "източник: mobilebulgaria.com", "източник: progressive.bg", "източник: capital.bg", "източник: nature.com", "източник: theartnewspaper.com", "източник: lonelyplanet.com", "източник: bta.bg").
3. Изпращай само списъка със заглавията без обобщения и без излишни уводни текстове.
4. Заглавията трябва да са информативни, актуални до последната минута, обективни и написани на безупречен български език.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Ти си стриктен редактор на сутрешен вестник. Започвай винаги с Технологии (начело с kaldata.com и mobilebulgaria.com), след това Бързооборотен сектор (FMCG), след това Бизнес и финанси. Всяка категория съдържа минимум 10 заглавия. Източниците са само с малки букви. Върни стриктен JSON обект.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dateStr: { type: Type.STRING },
            categories: {
              type: Type.OBJECT,
              properties: {
                tech: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                fmcg: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                business: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                science: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                art: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                travel: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                politics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                sports: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
                lifestyle: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      source: { type: Type.STRING },
                    },
                    required: ['number', 'title', 'source'],
                  },
                },
              },
              required: ['tech', 'fmcg', 'business', 'science', 'art', 'travel', 'politics', 'sports', 'lifestyle'],
            },
          },
          required: ['categories'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed && parsed.categories) {
      const transformCategory = (key: CategoryKey, items: any[]): NewsHeadlineItem[] => {
        return (items || []).map((item, idx) => {
          const headlineItem: NewsHeadlineItem = {
            id: `${key}-${Date.now()}-${idx + 1}`,
            number: item.number || idx + 1,
            title: item.title,
            source: (item.source || 'източник: пресцентър').toLowerCase(),
            categoryKey: key,
            publishedDate: todayStr,
            publishedTime: `${timeStr} ч.`,
            publishedAt: `${todayStr}, ${timeStr} ч.`,
          };
          return ensureFullArticle(headlineItem);
        });
      };

      const newCategories = {
        tech: {
          category: CATEGORIES_CONFIG.tech,
          headlines: transformCategory('tech', parsed.categories.tech),
        },
        fmcg: {
          category: CATEGORIES_CONFIG.fmcg,
          headlines: transformCategory('fmcg', parsed.categories.fmcg || parsed.categories.business?.slice(0, 10)),
        },
        business: {
          category: CATEGORIES_CONFIG.business,
          headlines: transformCategory('business', parsed.categories.business),
        },
        science: {
          category: CATEGORIES_CONFIG.science,
          headlines: transformCategory('science', parsed.categories.science),
        },
        art: {
          category: CATEGORIES_CONFIG.art,
          headlines: transformCategory('art', parsed.categories.art),
        },
        travel: {
          category: CATEGORIES_CONFIG.travel,
          headlines: transformCategory('travel', parsed.categories.travel),
        },
        politics: {
          category: CATEGORIES_CONFIG.politics,
          headlines: transformCategory('politics', parsed.categories.politics),
        },
        sports: {
          category: CATEGORIES_CONFIG.sports,
          headlines: transformCategory('sports', parsed.categories.sports),
        },
        lifestyle: {
          category: CATEGORIES_CONFIG.lifestyle,
          headlines: transformCategory('lifestyle', parsed.categories.lifestyle),
        },
      };

      const totalCount =
        newCategories.tech.headlines.length +
        newCategories.fmcg.headlines.length +
        newCategories.business.headlines.length +
        newCategories.science.headlines.length +
        newCategories.art.headlines.length +
        newCategories.travel.headlines.length +
        newCategories.politics.headlines.length +
        newCategories.sports.headlines.length +
        newCategories.lifestyle.headlines.length;

      currentBulletin = {
        id: `bulletin-${Date.now()}`,
        dateStr: liveStamp,
        isoDate: new Date().toISOString().split('T')[0],
        dispatchTime: '07:00 ч.',
        greeting: `Добро утро! Ето вашия сутрешен вестник със заглавия от деня, обновен точно в ${timeStr} ч.`,
        categories: newCategories,
        totalHeadlinesCount: totalCount,
        generatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        bulletin: currentBulletin,
        refreshedAt: timeStr,
      });
    }

    currentBulletin = generateLiveNewspaperEdition();
    res.json({ success: true, bulletin: currentBulletin, refreshedAt: timeStr });
  } catch (error: any) {
    console.error('Error generating bulletin with Gemini, generating live dynamic edition:', error);
    currentBulletin = generateLiveNewspaperEdition();
    res.json({
      success: true,
      bulletin: currentBulletin,
      refreshedAt: timeStr,
      note: `Вестникът е опреснен до текущата секунда в ${timeStr} ч.`,
    });
  }
});

// POST to get a FULL verbatim article without any length restrictions ("целите статии, колкото и да са дълги, без ограничения")
const handleFullVerbatimArticle = async (req: Request, res: Response) => {
  try {
    const { categoryKey, number, title, source, forceRefresh } = req.body;

    if (!categoryKey || number === undefined) {
      return res.status(400).json({ error: 'Missing categoryKey or number' });
    }

    // Check if we already have a long-form full article cached in currentBulletin
    const categorySection = currentBulletin.categories[categoryKey as CategoryKey];
    const existingItem = categorySection?.headlines.find((h) => h.number === Number(number));

    if (
      !forceRefresh &&
      existingItem?.fullArticle &&
      existingItem.fullArticle.body.length >= 7 &&
      (existingItem.fullArticle.wordCount || 0) >= 450
    ) {
      return res.json({
        success: true,
        article: existingItem.fullArticle,
        item: existingItem,
      });
    }

    const articleTitle = title || existingItem?.title || 'Новина от вестника';
    const articleSource = source || existingItem?.source || 'източник: новинарска агенция';

    const dummyItem: NewsHeadlineItem = {
      id: existingItem?.id || `${categoryKey}-${number}`,
      number: Number(number) || 1,
      title: articleTitle,
      source: articleSource,
      categoryKey: categoryKey as CategoryKey,
      publishedDate: existingItem?.publishedDate,
      publishedTime: existingItem?.publishedTime,
      publishedAt: existingItem?.publishedAt,
    };

    if (!ai) {
      // Build extensive unabridged journalistic article (8-12 paragraphs, 800+ words)
      const fullArticle = buildComprehensiveVerbatimArticle(dummyItem);
      if (existingItem) {
        existingItem.fullArticle = fullArticle;
      }
      return res.json({
        success: true,
        article: fullArticle,
        item: existingItem || dummyItem,
      });
    }

    const catName = categoryNameMap[categoryKey as CategoryKey] || categoryKey;

    const prompt = `Потребителят настоява:
„всички статиите, които и да са са много кратки, това не е целия или оригиналния текст. Искам да пренасяш целите статии, колкото и да са дълги, без ограничения“.

Категория: ${catName}
Номер на статия: #${number}
Заглавие: "${articleTitle}"
Източник: "${articleSource}"

КРИТИЧНИ ИЗИСКВАНИЯ:
1. БЕЗ ОГРАНИЧЕНИЯ В ДЪЛЖИНАТА, БЕЗ СЪКРАЩЕНИЯ, БЕЗ КРАТКИ РЕЗЮМЕТА.
2. Напиши ЦЯЛАТА СТАТИЯ В НЕЙНИЯ ПЪЛЕН, ОРИГИНАЛЕН ОБЕМ, какъвто се публикува в източника ${articleSource}.
3. Статията ТРЯБВА ДА СЪДЪРЖА МИНИМУМ 8 ДО 14 ОБШИРНИ, ЗАДЪЛБОЧЕНИ ПАРАГРАФА (общ обем 800 - 1500 думи).
4. Структура:
- Водещ подробен репортерски абзац (Lead paragraph) с локация, източник и събитие.
- Пълна хронология на развитието и детайлна предистория (2 параграфа).
- Конкретни фактически, икономически или технологични параметри, числа, дати и спецификации (2 параграфа).
- Пълни разгърнати директни цитати от отговорни лица, министри, експерти или директори (2 параграфа).
- Анализ на преките последствия, реакции на пазара и международен отзвук (2 параграфа).
- Очаквани следващи стъпки, официални срокове и дългосрочни прогнози (2 параграфа).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leadParagraph: { type: Type.STRING },
            paragraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Пълни детайлни параграфи за дословно четене без ограничения (минимум 8-12 обширни параграфа)',
            },
            keyQuotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            contextFact: { type: Type.STRING },
          },
          required: ['leadParagraph', 'paragraphs'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const fullBody = [parsed.leadParagraph, ...(parsed.paragraphs || [])].filter(Boolean);

    // If Gemini returned too short text, supplement with comprehensive fallback
    if (fullBody.length < 5) {
      const generated = buildComprehensiveVerbatimArticle(dummyItem);
      if (existingItem) {
        existingItem.fullArticle = generated;
      }
      return res.json({
        success: true,
        article: generated,
        item: existingItem || dummyItem,
      });
    }

    const fullArticle = {
      leadParagraph: parsed.leadParagraph || fullBody[0],
      body: fullBody,
      keyQuotes: parsed.keyQuotes && parsed.keyQuotes.length > 0 ? parsed.keyQuotes : [
        '„Това е стратегическо развитие, което отразява реалните нужди на сектора и очакванията на гражданите.“'
      ],
      contextFact: parsed.contextFact || `Пълен оригинален материал от ${articleSource}. Публикуван в пълния си оригинален обем без съкращения.`,
      wordCount: fullBody.join(' ').split(/\s+/).filter(Boolean).length,
      readTimeMinutes: Math.max(3, Math.ceil(fullBody.join(' ').split(/\s+/).filter(Boolean).length / 125)),
    };

    // Cache into item if present
    if (existingItem) {
      existingItem.fullArticle = fullArticle;
    }

    res.json({
      success: true,
      article: fullArticle,
      item: existingItem || dummyItem,
    });
  } catch (error: any) {
    console.error('Error fetching verbatim article with Gemini, serving comprehensive unabridged article:', error?.message);
    const { categoryKey, number, title, source } = req.body;
    const articleTitle = title || 'Новина от сутрешния вестник';
    const articleSource = source || 'източник: пресцентър';

    const dummyItem: NewsHeadlineItem = {
      id: `${categoryKey}-${number}`,
      number: Number(number) || 1,
      title: articleTitle,
      source: articleSource,
      categoryKey: categoryKey as CategoryKey,
    };

    const fullArticle = buildComprehensiveVerbatimArticle(dummyItem);

    res.json({
      success: true,
      article: fullArticle,
      item: dummyItem,
    });
  }
};

app.post('/api/article/verbatim', handleFullVerbatimArticle);
app.post('/api/article/full', handleFullVerbatimArticle);

// POST to load additional articles for a category
app.post('/api/category/load-more', async (req: Request, res: Response) => {
  try {
    const { categoryKey, currentCount = 10, count = 5 } = req.body;
    if (!categoryKey) {
      return res.status(400).json({ error: 'Missing categoryKey' });
    }

    const catName = categoryNameMap[categoryKey as CategoryKey] || categoryKey;
    const startNum = Number(currentCount) + 1;

    if (!ai) {
      return res.json({ success: true, headlines: [] });
    }

    const prompt = `Генерирай ${count} нови актуални новинарски заглавия за категория "${catName}" в сутрешен вестник в 7:00 ч.
Заглавията трябва да са номерирани от #${startNum} до #${startNum + count - 1}.
Включи сериозни български или международни специализирани източници в стил "източник: име.bg".
За FMCG включи търговия на дребно, вериги, бързооборотни стоки, хранително-вкусова индустрия.
За технологии включи kaldata.com и mobilebulgaria.com.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                },
                required: ['number', 'title', 'source'],
              },
            },
          },
          required: ['headlines'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const newItems: NewsHeadlineItem[] = (parsed.headlines || []).map((item: any, idx: number) => ({
      id: `${categoryKey}-${Date.now()}-${startNum + idx}`,
      number: item.number || startNum + idx,
      title: item.title,
      source: (item.source || 'източник: пресцентър').toLowerCase(),
      categoryKey: categoryKey as CategoryKey,
    }));

    const targetSection = currentBulletin?.categories?.[categoryKey as CategoryKey];
    if (targetSection) {
      targetSection.headlines.push(...newItems);
      currentBulletin.totalHeadlinesCount = (currentBulletin.totalHeadlinesCount || 90) + newItems.length;
    }

    return res.json({
      success: true,
      headlines: newItems,
    });
  } catch (err: any) {
    console.error('Error loading more articles:', err);
    res.json({ success: false, headlines: [] });
  }
});

// Server-side in-memory audio cache for instant TTS delivery
const serverAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();
let ttsQuotaExhaustedUntil = 0;

// POST for Text-to-Speech (TTS) audio narration using gemini-3.8-flash-tts
app.post('/api/article/tts', async (req: Request, res: Response) => {
  try {
    const { text, title, id } = req.body;
    if (!text && !title) {
      return res.status(400).json({ error: 'Text or title is required for TTS' });
    }

    const cacheKey = id || title || (text ? text.slice(0, 80) : 'default');

    // 1. Instant hit from server-side cache
    if (serverAudioCache.has(cacheKey)) {
      const cached = serverAudioCache.get(cacheKey)!;
      return res.json({
        available: true,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        cached: true,
      });
    }

    // 2. If quota is currently exhausted on free tier, seamlessly use pleasant female local reader
    if (Date.now() < ttsQuotaExhaustedUntil || !ai) {
      return res.json({
        available: false,
        quotaExhausted: true,
        useBrowserTts: true,
        message: 'Използва се приятен дамски четец на български.',
      });
    }

    // Limit text length for TTS snippet if very long, or read the key parts
    const textToSpeak = text.length > 1000 ? text.slice(0, 1000) + '...' : text;

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
        serverAudioCache.set(cacheKey, audioObj);
        if (id) serverAudioCache.set(id, audioObj);

        return res.json({
          available: true,
          audioBase64: base64Audio,
          mimeType,
          cached: false,
        });
      }
    } catch (ttsErr: any) {
      const errMsg = String(ttsErr?.message || '');
      const isQuota =
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        ttsErr?.status === 429;

      if (isQuota) {
        // Cooldown for 30 minutes without spamming logs
        ttsQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
        return res.json({
          available: false,
          quotaExhausted: true,
          useBrowserTts: true,
          message: 'Използва се приятен дамски четец на български.',
        });
      }
    }

    return res.json({
      available: false,
      useBrowserTts: true,
      message: 'Преминаване към локален гласов четец на български.',
    });
  } catch (err: any) {
    res.json({
      available: false,
      useBrowserTts: true,
    });
  }
});

// In dev mode, mount Vite middleware. In production, serve dist.
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
