import type { Recipe } from './types';

/** YouTube search for the dish, e.g. "Ven Pongal recipe Tamil Nadu". */
export function youtubeSearchUrl(r: Pick<Recipe, 'name' | 'cuisine' | 'origin'>): string {
  // Strip side dishes ("with …") so the search finds the main dish.
  const dish = r.name
    .replace(/\s+(with|and)\s.*$/i, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  const where = r.cuisine === 'indian' && r.origin && r.origin !== 'India' ? ` ${r.origin}` : '';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${dish} recipe${where}`)}`;
}

/** Accepts youtube.com/watch, youtu.be and shorts links; returns a clean https URL or undefined. */
export function normaliseYoutubeUrl(input: string): string | undefined {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return undefined;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be' && url.pathname.length > 1) return `https://youtu.be${url.pathname}`;
  if (host === 'youtube.com') {
    const v = url.searchParams.get('v');
    if (url.pathname === '/watch' && v)
      return `https://www.youtube.com/watch?v=${encodeURIComponent(v)}`;
    if (url.pathname.startsWith('/shorts/')) return `https://www.youtube.com${url.pathname}`;
  }
  return undefined;
}
