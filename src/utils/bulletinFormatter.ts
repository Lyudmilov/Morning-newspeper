import { MorningBulletin, CategoryKey } from '../types/bulletin';

export function formatBulletinAsPlainText(bulletin: MorningBulletin): string {
  const lines: string[] = [];

  lines.push('═════════════════════════════════════════════════════════════');
  lines.push(`       МОЯТ СУТРЕШЕН ВЕСТНИК — ${bulletin.dispatchTime.toUpperCase()}`);
  lines.push(`               ${bulletin.dateStr}`);
  lines.push('═════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(bulletin.greeting);
  lines.push('');

  const categoryOrder: CategoryKey[] = [
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

  categoryOrder.forEach((key) => {
    const sec = bulletin.categories[key];
    if (!sec) return;

    lines.push('─────────────────────────────────────────────────────────────');
    if (key === 'tech') {
      lines.push(`■ ${sec.category.name.toUpperCase()} (ВОДЕЩИ ЗАГЛАВИЯ: KALDATA.COM И MOBILEBULGARIA.COM)`);
    } else if (key === 'fmcg') {
      lines.push(`■ ${sec.category.name.toUpperCase()} (ТЪРГОВСКИ ВЕРИГИ, ХРАНИ, НАПИТКИ И ЛОГИСТИКА)`);
    } else {
      lines.push(`■ ${sec.category.name.toUpperCase()}`);
    }
    lines.push('─────────────────────────────────────────────────────────────');

    sec.headlines.forEach((item) => {
      lines.push(`${item.number}. ${item.title}`);
      lines.push(`   ${item.source.toLowerCase()}`);
      lines.push('');
    });

    lines.push('');
  });

  lines.push('═════════════════════════════════════════════════════════════');
  lines.push('За да прочетете която и да е статия дословно в пълен обем:');
  lines.push('Посочете номера на статията и категорията (напр. "Бизнес 2" или номер 1).');
  lines.push('═════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
