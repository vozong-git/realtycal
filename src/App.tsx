import { useEffect, useMemo, useState } from 'react';
import { calcCost } from './calc';
import ListingCard from './components/ListingCard';
import ListingForm from './components/ListingForm';
import { loadListings, loadSettings, saveListings, saveSettings } from './storage';
import { parseNumber } from './format';
import type { Listing, Settings } from './types';

type Editing = { mode: 'new' } | { mode: 'edit'; listing: Listing } | null;

export default function App() {
  const [listings, setListings] = useState<Listing[]>(loadListings);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [editing, setEditing] = useState<Editing>(null);
  const [rateText, setRateText] = useState(String(settings.depositRate));

  useEffect(() => saveListings(listings), [listings]);
  useEffect(() => saveSettings(settings), [settings]);

  const rows = useMemo(
    () =>
      listings
        .map((listing) => ({ listing, cost: calcCost(listing, settings) }))
        .sort((a, b) => a.cost.total - b.cost.total),
    [listings, settings],
  );

  function save(listing: Listing) {
    setListings((prev) =>
      prev.some((l) => l.id === listing.id)
        ? prev.map((l) => (l.id === listing.id ? listing : l))
        : [...prev, listing],
    );
    setEditing(null);
  }

  function duplicate(listing: Listing) {
    setListings((prev) => [...prev, { ...listing, id: crypto.randomUUID(), name: `${listing.name} (복사)` }]);
  }

  function remove(listing: Listing) {
    if (confirm(`"${listing.name}"을(를) 삭제할까요?`)) {
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>RealtyCal</h1>
        <button className="primary" onClick={() => setEditing({ mode: 'new' })}>
          + 매물
        </button>
      </header>

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

      {rows.length === 0 ? (
        <div className="empty">
          <p>아직 매물이 없어요.</p>
          <p>월세·전세·매매 매물을 추가하면 월 고정비를 비교해 드려요.</p>
          <button className="primary" onClick={() => setEditing({ mode: 'new' })}>
            첫 매물 추가하기
          </button>
        </div>
      ) : (
        <main className="list">
          {rows.map(({ listing, cost }, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              cost={cost}
              cheapest={i === 0 && rows.length > 1}
              onEdit={() => setEditing({ mode: 'edit', listing })}
              onDuplicate={() => duplicate(listing)}
              onDelete={() => remove(listing)}
            />
          ))}
        </main>
      )}

      {editing && (
        <ListingForm
          initial={editing.mode === 'edit' ? editing.listing : undefined}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
