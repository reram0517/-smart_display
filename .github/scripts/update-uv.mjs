import { writeFile } from 'node:fs/promises';

const response = await fetch('https://tenki.jp/indexes/uv_index_ranking/3/16/4410/13101/', {
  headers: { 'User-Agent': 'Mozilla/5.0 SmartDisplay/1.0' }
});
if (!response.ok) throw new Error(`JWA UV request failed: ${response.status}`);

const html = await response.text();
const read = (className) => {
  const match = html.match(new RegExp(`class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return match?.[1]?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || '';
};
const level = read('indexes-telop-0');
const advice = read('indexes-telop-1');
if (!level) throw new Error('JWA UV level was not found');

await writeFile('uv.json', `${JSON.stringify({
  source: '日本気象協会',
  updatedAt: new Date().toISOString(),
  level,
  advice: advice || '紫外線対策を確認してください'
}, null, 2)}\n`);
