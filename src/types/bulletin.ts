export type CategoryKey =
  | 'tech'
  | 'fmcg'
  | 'business'
  | 'science'
  | 'art'
  | 'travel'
  | 'politics'
  | 'sports'
  | 'lifestyle'
  | 'auto'
  | 'health'
  | 'realestate'
  | 'energy'
  | 'gaming'
  | 'books'
  | 'education'
  | 'crypto'
  | 'ecology'
  | 'gastronomy';

export interface CategoryMeta {
  id: CategoryKey;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  emphasis?: string;
}

export interface NewsHeadlineItem {
  id: string;
  number: number; // 1 to 10+
  title: string;
  source: string; // strictly lowercase, e.g., 'източник: capital.bg'
  categoryKey: CategoryKey;
  url?: string;
  publishedAt?: string;
  publishedDate?: string; // e.g. "07 октомври 2026 г."
  publishedTime?: string; // e.g. "19:02 ч."
  // Full verbatim article content if loaded
  fullArticle?: {
    leadParagraph: string;
    body: string[]; // verbatim complete paragraphs
    keyQuotes?: string[];
    contextFact?: string;
    wordCount?: number;
    readTimeMinutes?: number;
  };
}

export interface CategorySection {
  category: CategoryMeta;
  headlines: NewsHeadlineItem[];
}

export interface MorningBulletin {
  id: string;
  dateStr: string; // e.g. "27 Септември 2026 г."
  isoDate: string;
  dispatchTime: string; // "07:00 ч."
  greeting: string;
  categories: {
    tech: CategorySection;
    fmcg?: CategorySection;
    business: CategorySection;
    science: CategorySection;
    art: CategorySection;
    travel: CategorySection;
    politics: CategorySection;
    sports: CategorySection;
    lifestyle: CategorySection;
    [key: string]: CategorySection | undefined;
  };
  totalHeadlinesCount: number;
  generatedAt: string;
}

export interface VerbatimReadRequest {
  categoryKey: CategoryKey;
  number: number;
}
