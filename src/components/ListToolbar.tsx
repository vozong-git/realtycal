import { SORT_LABEL, TYPE_LABEL, type Listing, type Settings, type SortKey, type TypeFilter } from '../types';

interface Props {
  listings: Listing[];
  settings: Settings;
  onChange: (update: (s: Settings) => Settings) => void;
}

const FILTERS: TypeFilter[] = ['all', 'monthly', 'jeonse', 'purchase'];

export default function ListToolbar({ listings, settings, onChange }: Props) {
  const count = (f: TypeFilter) => (f === 'all' ? listings.length : listings.filter((l) => l.type === f).length);

  return (
    <div className="toolbar">
      <div className="chips" role="radiogroup" aria-label="거래 유형">
        {FILTERS.map((f) => {
          const n = count(f);
          return (
            <button
              key={f}
              role="radio"
              aria-checked={settings.typeFilter === f}
              className={`chip ${settings.typeFilter === f ? 'active' : ''} ${n === 0 ? 'empty-type' : ''}`}
              onClick={() => onChange((s) => ({ ...s, typeFilter: f }))}
            >
              {f === 'all' ? '전체' : TYPE_LABEL[f]} {n}
            </button>
          );
        })}
      </div>
      <select
        className="sort"
        aria-label="정렬"
        value={settings.sortBy}
        onChange={(e) => onChange((s) => ({ ...s, sortBy: e.target.value as SortKey }))}
      >
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABEL[k]}
          </option>
        ))}
      </select>
    </div>
  );
}
