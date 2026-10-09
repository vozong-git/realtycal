import { loadListings, saveListings } from './storage';
import type { Listing } from './types';

export interface ListingStore {
  /**
   * 목록이 바뀔 때마다 onChange 호출. offline이면 서버 확인 전 기기에 남은 사본이다.
   * 반환값은 구독 해제 함수
   */
  subscribe(
    onChange: (listings: Listing[], offline: boolean) => void,
    onError: (error: Error) => void,
  ): () => void;
  upsert(listing: Listing): Promise<void>;
  remove(id: string): Promise<void>;
}

const DEFAULTS: Omit<Listing, 'id'> = {
  name: '',
  type: 'monthly',
  price: 0,
  monthlyRent: 0,
  maintenance: 0,
  loanAmount: 0,
  loanRate: 0,
  loanYears: 30,
  dong: '',
  memo: '',
  link: '',
};

const TYPES: Listing['type'][] = ['monthly', 'jeonse', 'purchase'];

/**
 * 저장된 데이터를 믿지 않고 정리한다: 빠진 필드는 채우고, 모르는 필드는 버리고,
 * 타입이 틀린 값(링크를 아는 누군가가 넣은 이상한 값 등)은 기본값으로 바꾼다.
 */
export function normalizeListing(data: Record<string, unknown>, id: string): Listing {
  const listing = { ...DEFAULTS, id } as Listing;
  const out = listing as unknown as Record<string, unknown>;
  for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    const value = data?.[key];
    const fallback = DEFAULTS[key];
    if (typeof fallback === 'number') {
      out[key] = typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
    } else if (typeof value === 'string') {
      out[key] = value;
    }
  }
  if (!TYPES.includes(listing.type)) listing.type = DEFAULTS.type;
  if (listing.loanYears <= 0) listing.loanYears = DEFAULTS.loanYears;
  return listing;
}

/** 이 기기에만 저장 (Firebase 미설정 시) */
export function createLocalStore(): ListingStore {
  const listeners = new Set<(listings: Listing[], offline: boolean) => void>();
  let listings = loadListings()
    .filter((l) => l && typeof l.id === 'string')
    .map((l) => normalizeListing(l as unknown as Record<string, unknown>, l.id));

  function commit(next: Listing[]) {
    listings = next;
    saveListings(listings);
    listeners.forEach((fn) => fn(listings, false));
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      onChange(listings, false);
      return () => listeners.delete(onChange);
    },
    async upsert(listing) {
      commit(
        listings.some((l) => l.id === listing.id)
          ? listings.map((l) => (l.id === listing.id ? listing : l))
          : [...listings, listing],
      );
    },
    async remove(id) {
      commit(listings.filter((l) => l.id !== id));
    },
  };
}
