import { SORT_LABEL, type Listing, type Settings } from './types';

const LISTINGS_KEY = 'realtycal.listings';
const SETTINGS_KEY = 'realtycal.settings';
const ROOM_KEY = 'realtycal.room';

export const DEFAULT_SETTINGS: Settings = {
  includeOpportunityCost: false,
  depositRate: 3,
  sortBy: 'monthly',
  typeFilter: 'all',
  dongFilter: '',
};

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
export function loadSettings(): Settings {
  const settings = { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}) };
  // 없어진 정렬 기준(이름순·입주 현금순·자기자금순)이 저장돼 있으면 기본값으로
  if (!(settings.sortBy in SORT_LABEL)) settings.sortBy = DEFAULT_SETTINGS.sortBy;
  return settings;
}
export const saveSettings = (settings: Settings) => write(SETTINGS_KEY, settings);
export const loadRoom = () => read<string | null>(ROOM_KEY, null);
export const saveRoom = (roomId: string) => write(ROOM_KEY, roomId);
