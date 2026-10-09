import { useEffect, useMemo, useRef, useState } from 'react';
import { calcCost } from './calc';
import ListingCard from './components/ListingCard';
import ListingForm from './components/ListingForm';
import ListToolbar from './components/ListToolbar';
import { firebaseConfig } from './firebaseConfig';
import { resolveRoom, roomFromUrl, shareUrl } from './room';
import { loadListings, loadSettings, saveSettings } from './storage';
import { createLocalStore, type ListingStore } from './store';
import { parseNumber } from './format';
import { TYPE_LABEL, type Listing, type Settings } from './types';

type Row = { listing: Listing; cost: ReturnType<typeof calcCost> };

type Editing = { mode: 'new' } | { mode: 'edit'; listing: Listing } | null;

type Sync =
  | { status: 'local' }
  | { status: 'connecting' }
  | { status: 'shared'; roomId: string }
  | { status: 'error'; message: string };

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [editing, setEditing] = useState<Editing>(null);
  const [rateText, setRateText] = useState(String(settings.depositRate));
  const [sync, setSync] = useState<Sync>(firebaseConfig ? { status: 'connecting' } : { status: 'local' });
  const [toast, setToast] = useState('');
  const storeRef = useRef<ListingStore | null>(null);

  useEffect(() => saveSettings(settings), [settings]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    const onError = (e: Error) => setSync({ status: 'error', message: e.message });

    (async () => {
      let store: ListingStore;
      let roomId: string | null = null;
      if (firebaseConfig) {
        const room = resolveRoom();
        roomId = room.roomId;
        const { createFirestoreStore } = await import('./firestoreStore');
        const shared = createFirestoreStore(firebaseConfig, roomId);
        // 처음 공유를 시작할 때 이 기기에 있던 매물을 방으로 옮긴다
        const local = loadListings();
        if (room.created && local.length) shared.importListings(local).catch(onError);
        store = shared;
      } else {
        store = createLocalStore();
      }
      if (cancelled) return;
      storeRef.current = store;
      unsubscribe = store.subscribe((next) => {
        setListings(next);
        if (roomId) setSync({ status: 'shared', roomId });
      }, onError);
    })().catch(onError);

    // 앱을 켜둔 채 다른 공유 링크를 열면 그 방으로 다시 시작
    const onHashChange = () => {
      const next = roomFromUrl();
      if (firebaseConfig && next) location.reload();
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleWriteError(e: unknown) {
    setSync({ status: 'error', message: e instanceof Error ? e.message : String(e) });
  }

  async function share() {
    if (sync.status !== 'shared') return;
    const url = shareUrl(sync.roomId);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'RealtyCal 매물 비교', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast('링크를 복사했어요. 같이 볼 사람에게 보내주세요.');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') prompt('이 링크를 복사해서 보내주세요', url);
    }
  }

  const rows = useMemo(() => {
    const sortValue = {
      monthly: (r: Row) => r.cost.total,
      capital: (r: Row) => r.cost.ownCapital,
    };
    return listings
      .filter((l) => settings.typeFilter === 'all' || l.type === settings.typeFilter)
      .filter((l) => !settings.dongFilter || l.dong === settings.dongFilter)
      .map((listing) => ({ listing, cost: calcCost(listing, settings) }))
      .sort(
        (a, b) =>
          sortValue[settings.sortBy](a) - sortValue[settings.sortBy](b) || a.cost.total - b.cost.total,
      );
  }, [listings, settings]);

  const dongs = useMemo(
    () => [...new Set(listings.map((l) => l.dong).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
    [listings],
  );

  // "최저"는 정렬과 상관없이 보이는 매물 중 월 고정비가 가장 낮은 매물
  const cheapestId =
    rows.length > 1 ? rows.reduce((min, r) => (r.cost.total < min.cost.total ? r : min)).listing.id : null;

  function save(listing: Listing) {
    storeRef.current?.upsert(listing).catch(handleWriteError);
    setEditing(null);
  }

  function duplicate(listing: Listing) {
    storeRef.current
      ?.upsert({ ...listing, id: crypto.randomUUID(), name: `${listing.name} (복사)` })
      .catch(handleWriteError);
  }

  function remove(listing: Listing) {
    if (confirm(`"${listing.name}"을(를) 삭제할까요?`)) {
      storeRef.current?.remove(listing.id).catch(handleWriteError);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>RealtyCal</h1>
        <div className="topbar-actions">
          {sync.status === 'shared' && (
            <button className="ghost share" onClick={share}>
              공유
            </button>
          )}
          <button className="primary" onClick={() => setEditing({ mode: 'new' })}>
            + 매물
          </button>
        </div>
      </header>

      {sync.status === 'error' && (
        <div className="banner error">
          공유 저장소에 연결하지 못했어요. 인터넷 연결이나 Firestore 규칙을 확인해 주세요.
          <small>{sync.message}</small>
        </div>
      )}

      <section className="settings">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.includeOpportunityCost}
            onChange={(e) => setSettings((s) => ({ ...s, includeOpportunityCost: e.target.checked }))}
          />
          <span>자기자금 기회비용 포함</span>
        </label>
        {settings.includeOpportunityCost && (
          <label className="rate">
            예금금리
            <input
              inputMode="decimal"
              value={rateText}
              onChange={(e) => {
                setRateText(e.target.value);
                setSettings((s) => ({ ...s, depositRate: parseNumber(e.target.value) }));
              }}
            />
            %
          </label>
        )}
        <p className="hint">
          {settings.includeOpportunityCost
            ? '보증금·매매 자기자금을 예금에 넣었다면 받았을 이자를 월 비용에 더해요.'
            : '켜면 묶여 있는 자기자금의 예금이자 손실까지 비교해요.'}
        </p>
      </section>

      {sync.status === 'connecting' ? (
        <div className="empty">불러오는 중…</div>
      ) : listings.length > 0 && rows.length === 0 ? (
        <>
          <ListToolbar listings={listings} dongs={dongs} settings={settings} onChange={setSettings} />
          <div className="empty">
            <p>
              {[settings.dongFilter, settings.typeFilter !== 'all' && TYPE_LABEL[settings.typeFilter]]
                .filter(Boolean)
                .join(' ')}{' '}
              매물이 없어요.
            </p>
            <button
              className="ghost"
              onClick={() => setSettings((s) => ({ ...s, typeFilter: 'all', dongFilter: '' }))}
            >
              전체 보기
            </button>
          </div>
        </>
      ) : rows.length === 0 ? (
        <div className="empty">
          <p>아직 매물이 없어요.</p>
          <p>월세·전세·매매 매물을 추가하면 월 고정비를 비교해 드려요.</p>
          {sync.status === 'shared' && <p>위의 공유 버튼으로 링크를 보내면 같이 보고 수정할 수 있어요.</p>}
          <button className="primary" onClick={() => setEditing({ mode: 'new' })}>
            첫 매물 추가하기
          </button>
        </div>
      ) : (
        <main className="list">
          {listings.length >= 2 && <ListToolbar listings={listings} dongs={dongs} settings={settings} onChange={setSettings} />}
          {rows.map(({ listing, cost }) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              cost={cost}
              cheapest={listing.id === cheapestId}
              onEdit={() => setEditing({ mode: 'edit', listing })}
              onDuplicate={() => duplicate(listing)}
              onDelete={() => remove(listing)}
            />
          ))}
        </main>
      )}

      {toast && <div className="toast">{toast}</div>}

      {editing && (
        <ListingForm
          initial={editing.mode === 'edit' ? editing.listing : undefined}
          dongs={dongs}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
