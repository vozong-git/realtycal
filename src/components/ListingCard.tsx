import { calcOneTimeCost, type CostBreakdown } from '../calc';
import { formatManwon, formatMonthly } from '../format';
import { CopyIcon, EditIcon, TrashIcon } from './icons';
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

  const oneTime = calcOneTimeCost(listing);
  const oneTimeItems: [string, number][] = [
    ['중개수수료 (상한)', oneTime.brokerFee],
    ['취득세 (1주택 기준)', oneTime.acquisitionTax],
  ];

  return (
    <article className={`card ${cheapest ? 'cheapest' : ''}`}>
      <header>
        <span className={`badge ${listing.type}`}>{TYPE_LABEL[listing.type]}</span>
        <h3>
          {listing.name}
          {listing.dong && <small className="dong">{listing.dong}</small>}
        </h3>
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

      <details className="more">
        <summary>
          이사 비용 약 {formatMonthly(oneTime.total)}만원
          {(listing.memo || listing.link) && ' · 메모'}
        </summary>
        <dl className="meta">
          {oneTimeItems
            .filter(([, v]) => v > 0)
            .map(([label, v]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatMonthly(v)}만원</dd>
              </div>
            ))}
          <div className="sum">
            <dt>입주 때 필요한 현금</dt>
            <dd>{formatManwon(cost.ownCapital + oneTime.total)}</dd>
          </div>
        </dl>
        <p className="note">중개수수료는 법정 상한요율 기준이며 부가세는 별도예요.</p>
        {listing.memo && <p className="memo">{listing.memo}</p>}
        {/^https?:\/\//i.test(listing.link) && (
          <a className="link" href={listing.link} target="_blank" rel="noopener noreferrer">
            매물 링크 열기 ↗
          </a>
        )}
      </details>

      <footer>
        <button className="ghost icon" onClick={onEdit} aria-label="수정" title="수정">
          <EditIcon />
        </button>
        <button className="ghost icon" onClick={onDuplicate} aria-label="복제" title="복제">
          <CopyIcon />
        </button>
        <button className="ghost icon danger" onClick={onDelete} aria-label="삭제" title="삭제">
          <TrashIcon />
        </button>
      </footer>
    </article>
  );
}
