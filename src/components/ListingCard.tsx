import type { CostBreakdown } from '../calc';
import { formatManwon, formatMonthly } from '../format';
import { PRICE_LABEL, TYPE_LABEL, type Listing } from '../types';

interface Props {
  listing: Listing;
  cost: CostBreakdown;
  cheapest: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ListingCard({ listing, cost, cheapest, onEdit, onDuplicate, onDelete }: Props) {
  const items: [string, number][] = [
    ['월세', cost.rent],
    ['관리비', cost.maintenance],
    ['이자', cost.interest],
    ['원금', cost.principal],
    ['기회비용', cost.opportunityCost],
  ];

  return (
    <article className={`card ${cheapest ? 'cheapest' : ''}`}>
      <header>
        <span className={`badge ${listing.type}`}>{TYPE_LABEL[listing.type]}</span>
        <h3>{listing.name}</h3>
        {cheapest && <span className="best">최저</span>}
      </header>

      <div className="total">
        월 <strong>{formatMonthly(cost.total)}</strong>만원
      </div>

      <ul className="breakdown">
        {items
          .filter(([, v]) => v > 0)
          .map(([label, v]) => (
            <li key={label} className={label === '원금' ? 'principal' : ''}>
              {label} {formatMonthly(v)}
            </li>
          ))}
      </ul>

      <dl className="meta">
        <div>
          <dt>{PRICE_LABEL[listing.type]}</dt>
          <dd>{formatManwon(listing.price)}</dd>
        </div>
        <div>
          <dt>대출</dt>
          <dd>
            {formatManwon(listing.loanAmount)}
            {listing.loanAmount > 0 && ` · ${listing.loanRate}%`}
            {listing.type === 'purchase' && listing.loanAmount > 0 && ` · ${listing.loanYears}년`}
          </dd>
        </div>
        <div>
          <dt>필요 자기자금</dt>
          <dd>{formatManwon(cost.ownCapital)}</dd>
        </div>
      </dl>

      {cost.principal > 0 && (
        <p className="note">원금 {formatMonthly(cost.principal)}만원은 집값으로 쌓이는 돈이에요 (첫 달 기준).</p>
      )}

      <footer>
        <button className="ghost" onClick={onEdit}>수정</button>
        <button className="ghost" onClick={onDuplicate}>복제</button>
        <button className="ghost danger" onClick={onDelete}>삭제</button>
      </footer>
    </article>
  );
}
