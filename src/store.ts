import { loadListings, saveListings } from './storage';
import type { Listing } from './types';

export interface ListingStore {
  /** 목록이 바뀔 때마다 onChange 호출. 반환값은 구독 해제 함수 */
  subscribe(onChange: (listings: Listing[]) => void, onError: (error: Error) => void): () => void;
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
  movingCost: 0,
  otherCost: 0,
  memo: '',
  link: '',
};

/** 저장된 데이터에 빠진 필드가 있어도 안전하게 채운다 */
export function normalizeListing(data: Partial<Listing>, id: string): Listing {
  return { ...DEFAULTS, ...data, id };
}

/** 이 기기에만 저장 (Firebase 미설정 시) */
export function createLocalStore(): ListingStore {
  const listeners = new Set<(listings: Listing[]) => void>();
  let listings = loadListings().map((l) => normalizeListing(l, l.id));

  function commit(next: Listing[]) {
    listings = next;
    saveListings(listings);
    listeners.forEach((fn) => fn(listings));
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      onChange(listings);
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
