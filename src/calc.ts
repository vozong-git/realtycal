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

export function calcCost(
  listing: Listing,
  settings: Pick<Settings, 'includeOpportunityCost' | 'depositRate'>,
): CostBreakdown {
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

export interface OneTimeCost {
  /** 중개수수료 (법정 상한요율, 부가세 별도) */
  brokerFee: number;
  /** 취득세 + 지방교육세 (매매만) */
  acquisitionTax: number;
  movingCost: number;
  otherCost: number;
  total: number;
}

/** [이 금액 미만, 요율 %, 한도(만원)] — 2021.10 개정 주택 중개보수 상한 */
const SALE_BRACKETS: [number, number, number?][] = [
  [5000, 0.6, 25],
  [20000, 0.5, 80],
  [90000, 0.4],
  [120000, 0.5],
  [150000, 0.6],
  [Infinity, 0.7],
];
const LEASE_BRACKETS: [number, number, number?][] = [
  [5000, 0.5, 20],
  [10000, 0.4, 30],
  [60000, 0.3],
  [120000, 0.4],
  [150000, 0.5],
  [Infinity, 0.6],
];

function feeByBrackets(amount: number, brackets: [number, number, number?][]): number {
  if (amount <= 0) return 0;
  const [, rate, cap] = brackets.find(([upper]) => amount < upper)!;
  const fee = (amount * rate) / 100;
  return cap === undefined ? fee : Math.min(fee, cap);
}

/** 중개수수료 상한. 월세 거래금액 = 보증금 + 월세×100 (5천만 미만이면 ×70) */
export function brokerFee(listing: Listing): number {
  if (listing.type === 'purchase') return feeByBrackets(listing.price, SALE_BRACKETS);
  if (listing.type === 'jeonse') return feeByBrackets(listing.price, LEASE_BRACKETS);
  let amount = listing.price + listing.monthlyRent * 100;
  if (amount < 5000) amount = listing.price + listing.monthlyRent * 70;
  return feeByBrackets(amount, LEASE_BRACKETS);
}

/** 주택 취득세 + 지방교육세 (1주택, 전용 85㎡ 이하, 감면 미반영) */
export function acquisitionTax(price: number): number {
  if (price <= 0) return 0;
  let rate: number;
  if (price <= 60000) rate = 1;
  else if (price <= 90000) rate = Math.round(((price / 10000) * (2 / 3) - 3) * 10000) / 10000;
  else rate = 3;
  return (price * rate * 1.1) / 100;
}

export function calcOneTimeCost(listing: Listing): OneTimeCost {
  const fee = brokerFee(listing);
  const tax = listing.type === 'purchase' ? acquisitionTax(listing.price) : 0;
  const moving = listing.movingCost || 0;
  const other = listing.otherCost || 0;
  return {
    brokerFee: fee,
    acquisitionTax: tax,
    movingCost: moving,
    otherCost: other,
    total: fee + tax + moving + other,
  };
}
