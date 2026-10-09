import type { Listing, Settings } from './types';

export interface CostBreakdown {
  rent: number;
  maintenance: number;
  /** 대출 이자 (매매는 첫 달 기준) */
  interest: number;
  /** 원금 상환분 (매매만, 첫 달 기준) */
  principal: number;
  /** 자기자금 기회비용 (옵션) */
  opportunityCost: number;
  /** 월 고정비 합계 */
  total: number;
  /** 필요 자기자금 = 보증금(전세금·매매가) − 대출금 */
  ownCapital: number;
}

/** 이자만 내는 대출의 월 이자 */
export function monthlyInterest(amount: number, annualRate: number): number {
  return (amount * annualRate) / 100 / 12;
}

/** 원리금균등상환 월 납부액 */
export function amortizedPayment(amount: number, annualRate: number, years: number): number {
  const n = Math.round(years * 12);
  if (amount <= 0 || n <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return amount / n;
  return (amount * r) / (1 - Math.pow(1 + r, -n));
}

export function calcCost(listing: Listing, settings: Settings): CostBreakdown {
  const loan = Math.max(listing.loanAmount, 0);
  const rent = listing.type === 'monthly' ? listing.monthlyRent : 0;
  const maintenance = listing.maintenance;

  let interest = monthlyInterest(loan, listing.loanRate);
  let principal = 0;
  if (listing.type === 'purchase' && listing.loanYears > 0) {
    principal = Math.max(amortizedPayment(loan, listing.loanRate, listing.loanYears) - interest, 0);
  }

  const ownCapital = Math.max(listing.price - loan, 0);
  const opportunityCost = settings.includeOpportunityCost
    ? monthlyInterest(ownCapital, settings.depositRate)
    : 0;

  if (!Number.isFinite(interest)) interest = 0;

  return {
    rent,
    maintenance,
    interest,
    principal,
    opportunityCost,
    total: rent + maintenance + interest + principal + opportunityCost,
    ownCapital,
  };
}
