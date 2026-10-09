import type { Listing, Settings } from './types';

const LISTINGS_KEY = 'realtycal.listings';
const SETTINGS_KEY = 'realtycal.settings';

export const DEFAULT_SETTINGS: Settings = { includeOpportunityCost: false, depositRate: 3 };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 불가 환경(사생활 보호 모드 등)에서는 무시
  }
}

export const loadListings = () => read<Listing[]>(LISTINGS_KEY, []);
export const saveListings = (listings: Listing[]) => write(LISTINGS_KEY, listings);
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}) });
export const saveSettings = (settings: Settings) => write(SETTINGS_KEY, settings);
