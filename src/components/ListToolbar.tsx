import { SORT_LABEL, TYPE_LABEL, type Listing, type Settings, type SortKey, type TypeFilter } from '../types';

interface Props {
  listings: Listing[];
  /** 입력된 동 목록 (가나다순) */
  dongs: string[];
  settings: Settings;
  onChange: (update: (s: Settings) => Settings) => void;
}

const FILTERS: TypeFilter[] = ['all', 'monthly', 'jeonse', 'purchase'];

export default function ListToolbar({ listings, dongs, settings, onChange }: Props) {
  // 개수는 다른 쪽 필터를 적용한 상태에서 센다
  const inDong = listings.filter((l) => !settings.dongFilter || l.dong === settings.dongFilter);
  const inType = listings.filter((l) => settings.typeFilter === 'all' || l.type === settings.typeFilter);
  const typeCount = (f: TypeFilter) => (f === 'all' ? inDong.length : inDong.filter((l) => l.type === f).length);
  const dongCount = (d: string) => (d ? inType.filter((l) => l.dong === d).length : inType.length);

  // 동이 하나라도 입력돼 있거나, 지금 동 필터가 걸려 있으면 동 줄을 보여준다
  const showDongs = dongs.length > 0 || settings.dongFilter;
  const dongOptions = settings.dongFilter && !dongs.includes(settings.dongFilter) ? [...dongs, settings.dongFilter] : dongs;

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="chips" role="radiogroup" aria-label="거래 유형">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={f === 'all' ? '전체' : TYPE_LABEL[f]}
              count={typeCount(f)}
              active={settings.typeFilter === f}
              onClick={() => onChange((s) => ({ ...s, typeFilter: f }))}
            />
          ))}
        </div>
        {/* 선택된 항목 길이만큼만 자리를 차지하도록, 보이는 글자 위에 투명한 select를 겹친다 */}
        <label className="sort">
          {SORT_LABEL[settings.sortBy]} ▾
          <select
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
        </label>
      </div>
      {showDongs && (
        <div className="chips" role="radiogroup" aria-label="동">
          {['', ...dongOptions].map((d) => (
            <Chip
              key={d || 'all'}
              label={d || '모든 동'}
              count={dongCount(d)}
              active={settings.dongFilter === d}
              onClick={() => onChange((s) => ({ ...s, dongFilter: d }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip(props: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={props.active}
      className={`chip ${props.active ? 'active' : ''} ${props.count === 0 ? 'empty-type' : ''}`}
      onClick={props.onClick}
    >
      {props.label} {props.count}
    </button>
  );
}
