import { useState, type FormEvent } from 'react';
import { PRICE_LABEL, TYPE_LABEL, type LeaseType, type Listing } from '../types';
import { formatManwon, parseNumber, withCommas } from '../format';

interface Props {
  initial?: Listing;
  onSave: (listing: Listing) => void;
  onCancel: () => void;
}

type Fields = 'price' | 'monthlyRent' | 'maintenance' | 'loanAmount' | 'loanRate' | 'loanYears';

const TYPES: LeaseType[] = ['monthly', 'jeonse', 'purchase'];

function toText(n: number | undefined): string {
  return n ? withCommas(String(n)) : '';
}

export default function ListingForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<LeaseType>(initial?.type ?? 'monthly');
  const [name, setName] = useState(initial?.name ?? '');
  const [values, setValues] = useState<Record<Fields, string>>({
    price: toText(initial?.price),
    monthlyRent: toText(initial?.monthlyRent),
    maintenance: toText(initial?.maintenance),
    loanAmount: toText(initial?.loanAmount),
    loanRate: initial?.loanRate ? String(initial.loanRate) : '',
    loanYears: String(initial?.loanYears ?? 30),
  });

  const set = (field: Fields) => (text: string) =>
    setValues((v) => ({ ...v, [field]: withCommas(text) }));

  const num = (field: Fields) => parseNumber(values[field]);

  function submit(e: FormEvent) {
    e.preventDefault();
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
    });
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <form className="sheet" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
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

        <label className="field">
          <span>이름 / 메모</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 역삼 오피스텔 3층" />
        </label>

        <MoneyField label={PRICE_LABEL[type]} value={values.price} onChange={set('price')} showEok />
        {type === 'monthly' && (
          <MoneyField label="월세" value={values.monthlyRent} onChange={set('monthlyRent')} />
        )}
        <MoneyField label="관리비 (월)" value={values.maintenance} onChange={set('maintenance')} />

        <div className="group-title">대출</div>
        <MoneyField label="대출 금액" value={values.loanAmount} onChange={set('loanAmount')} showEok />
        <div className="row">
          <NumberField label="금리 (연)" unit="%" value={values.loanRate} onChange={set('loanRate')} />
          {type === 'purchase' && (
            <NumberField label="상환 기간" unit="년" value={values.loanYears} onChange={set('loanYears')} />
          )}
        </div>
        <p className="hint">
          {type === 'purchase'
            ? '원리금균등상환 기준으로 원금까지 포함해 계산해요.'
            : '전·월세 대출은 이자만 내는 만기일시상환 기준이에요.'}
        </p>

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
