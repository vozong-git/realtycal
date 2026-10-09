import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { normalizeListing, type ListingStore } from './store';
import type { Listing } from './types';

let db: Firestore | null = null;

function getDb(config: FirebaseOptions): Firestore {
  if (db) return db;
  if (getApps().length) {
    db = getFirestore(getApp());
  } else {
    // 오프라인 캐시: 지하철 등 끊긴 곳에서도 보이고, 다시 연결되면 동기화
    db = initializeFirestore(initializeApp(config), { localCache: persistentLocalCache() });
    // 개발용: VITE_FIRESTORE_EMULATOR=localhost:8080 이면 로컬 에뮬레이터에 연결
    const emulator = import.meta.env.VITE_FIRESTORE_EMULATOR as string | undefined;
    if (emulator) {
      const [host, port] = emulator.split(':');
      connectFirestoreEmulator(db, host, Number(port));
    }
  }
  return db;
}

/** 방(roomId) 하나를 같이 보는 사람끼리 실시간 공유 */
export function createFirestoreStore(config: FirebaseOptions, roomId: string) {
  const listingsRef = collection(getDb(config), 'rooms', roomId, 'listings');

  const store: ListingStore & { importListings(listings: Listing[]): Promise<void> } = {
    subscribe(onChange, onError) {
      return onSnapshot(
        listingsRef,
        (snap) => onChange(snap.docs.map((d) => normalizeListing(d.data() as Partial<Listing>, d.id))),
        onError,
      );
    },
    upsert(listing) {
      return setDoc(doc(listingsRef, listing.id), listing);
    },
    remove(id) {
      return deleteDoc(doc(listingsRef, id));
    },
    importListings(listings) {
      const batch = writeBatch(listingsRef.firestore);
      listings.forEach((l) => batch.set(doc(listingsRef, l.id), l));
      return batch.commit();
    },
  };
  return store;
}
