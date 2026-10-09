import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PRICE_LABEL, TYPE_LABEL, type LeaseType, type Listing } from '../types';
import { formatManwon, normalizeLink, parseNumber, withCommas } from '../format';

interface Props {
  initial?: Listing;
  /** 이미 입력된 동 목록 (자동완성) */
  dongs: string[];
  onSave: (listing: Listing) => void;
  onCancel: () => void;
}

type Fields =
  | 'price'
  | 'monthlyRent'
  | 'maintenance'
  | 'loanAmount'
  | 'loanRate'
  | 'loanYears';

const TYPES: LeaseType[] = ['monthly', 'jeonse', 'purchase'];

function toText(n: number | undefined): string {
  return n ? withCommas(String(n)) : '';
}

export default function ListingForm({ initial, dongs, onSave, onCancel }: Props) {
  const [type, setType] = useState<LeaseType>(initial?.type ?? 'monthly');
  const [name, setName] = useState(initial?.name ?? '');
  const [dong, setDong] = useState(initial?.dong ?? '');
  const [values, setValues] = useState<Record<Fields, string>>({
    price: toText(initial?.price),
    monthlyRent: toText(initial?.monthlyRent),
    maintenance: toText(initial?.maintenance),
    loanAmount: toText(initial?.loanAmount),
    loanRate: initial?.loanRate ? String(initial.loanRate) : '',
    loanYears: String(initial?.loanYears ?? 30),
  });
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const hasExtra = Boolean(initial?.memo || initial?.link);

  // 처음 연 상태와 달라졌는지: 바깥을 눌러 닫을 때 입력을 잃지 않게
  const snapshot = JSON.stringify({ type, name, dong, values, memo, link });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;
  const [warning, setWarning] = useState('');
  // 입력을 고치면 저장 시 띄운 안내는 지운다
  useEffect(() => setWarning(''), [snapshot]);

  function requestClose() {
    if (!dirty || confirm('입력한 내용을 저장하지 않고 닫을까요?')) onCancel();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const set = (field: Fields) => (text: string) =>
    setValues((v) => ({ ...v, [field]: withCommas(text) }));

  const num = (field: Fields) => parseNumber(values[field]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (num('price') <= 0 && !(type === 'monthly' && num('monthlyRent') > 0)) {
      setWarning(type === 'monthly' ? '보증금이나 월세를 입력해 주세요.' : type === 'jeonse' ? '전세금을 입력해 주세요.' : '매매가를 입력해 주세요.');
      return;
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim() || `${TYPE_LABEL[type]} 매물`,
      type,
      price: num('price'),
      monthlyRent: type === 'monthly' ? num('monthlyRent') : 0,
      maintenance: num('maintenance'),
      loanAmount: num('loanAmount'),
      loanRate: num('loanRate'),
      loanYears: num('loanYears') || 30,
      dong: dong.replace(/\s+/g, ''),
      memo: memo.trim(),
      link: normalizeLink(link),
    });
  }

  return (
    <div className="overlay" onClick={requestClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={initial ? '매물 수정' : '매물 추가'}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{initial ? '매물 수정' : '매물 추가'}</h2>

        <div className="segmented" role="radiogroup" aria-label="거래 유형">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              className={type === t ? 'active' : ''}
              onClick={() => setType(t)}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="row name-row">
          <label className="field">
            <span>이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 역삼 오피스텔 3층"
              maxLength={100}
            />
          </label>
          <label className="field">
            <span>동</span>
            <input
              value={dong}
              onChange={(e) => setDong(e.target.value)}
              placeholder="예: 성수동"
              list="dong-options"
              maxLength={30}
            />
            <datalist id="dong-options">
              {dongs.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>
        </div>

        <MoneyField label={PRICE_LABEL[type]} value={values.price} onChange={set('price')} showEok />
        {type === 'monthly' && (
          <MoneyField label="월세" value={values.monthlyRent} onChange={set('monthlyRent')} />
        )}
        <MoneyField label="관리비 (월)" value={values.maintenance} onChange={set('maintenance')} />

        {num('price') >= 1000000 && (
          <p className="hint warn">금액 단위는 만원이에요. 3억은 30,000으로 입력해요.</p>
        )}

        <div className="group-title">대출</div>
        <MoneyField label="대출 금액" value={values.loanAmount} onChange={set('loanAmount')} showEok />
        <div className="row">
          <NumberField label="금리 (연)" unit="%" value={values.loanRate} onChange={set('loanRate')} />
          {type === 'purchase' && (
            <NumberField label="상환 기간" unit="년" value={values.loanYears} onChange={set('loanYears')} />
          )}
        </div>
        {num('loanAmount') > num('price') && num('price') > 0 && (
          <p className="hint warn">대출 금액이 {PRICE_LABEL[type]}보다 커요. 다시 확인해 주세요.</p>
        )}
        <p className="hint">
          {type === 'purchase'
            ? '원리금균등상환 기준으로 원금까지 포함해 계산해요.'
            : '전·월세 대출은 이자만 내는 만기일시상환 기준이에요.'}
        </p>

        <details className="more-fields" open={hasExtra}>
          <summary>메모 · 링크 (선택)</summary>
          <label className="field">
            <span>메모</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="예: 남향, 5층, 역까지 도보 7분"
            />
          </label>
          <label className="field">
            <span>매물 링크</span>
            <input
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="네이버 부동산 등 주소"
              maxLength={490}
            />
          </label>
        </details>

        {warning && (
          <p className="hint warn" role="alert">
            {warning}
          </p>
        )}

        <div className="actions">
          <button type="button" className="ghost" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="primary">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

function MoneyField(props: { label: string; value: string; onChange: (v: string) => void; showEok?: boolean }) {
  const n = parseNumber(props.value);
  return (
    <label className="field">
      <span>
        {props.label}
        {props.showEok && n >= 10000 && <em className="eok">{formatManwon(n)}</em>}
      </span>
      <div className="input-unit">
        <input inputMode="numeric" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder="0" />
        <span>만원</span>
      </div>
    </label>
  );
}

function NumberField(props: { label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <div className="input-unit">
        <input inputMode="decimal" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder="0" />
        <span>{props.unit}</span>
      </div>
    </label>
  );
}
