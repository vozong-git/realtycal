import { describe, expect, it } from 'vitest';
import { amortizedPayment, calcCost } from './calc';
import type { Listing, Settings } from './types';

const off: Settings = { includeOpportunityCost: false, depositRate: 3 };
const on: Settings = { includeOpportunityCost: true, depositRate: 3 };

function listing(partial: Partial<Listing>): Listing {
  return {
    id: 'x',
    name: '',
    type: 'monthly',
    price: 0,
    monthlyRent: 0,
    maintenance: 0,
    loanAmount: 0,
    loanRate: 0,
    loanYears: 30,
    ...partial,
  };
}

describe('calcCost', () => {
  it('월세: 월세 + 관리비 + 대출이자', () => {
    const c = calcCost(
      listing({ type: 'monthly', price: 5000, monthlyRent: 80, maintenance: 15, loanAmount: 3000, loanRate: 4 }),
      off,
    );
    expect(c.interest).toBeCloseTo(10);
    expect(c.total).toBeCloseTo(105);
    expect(c.ownCapital).toBe(2000);
  });

  it('전세: 관리비 + 대출이자, 월세 입력값은 무시', () => {
    const c = calcCost(
      listing({ type: 'jeonse', price: 30000, monthlyRent: 99, maintenance: 20, loanAmount: 20000, loanRate: 3.8 }),
      off,
    );
    expect(c.rent).toBe(0);
    expect(c.total).toBeCloseTo(83.333, 2);
  });

  it('매매: 관리비 + 원리금(원금 포함)', () => {
    const c = calcCost(
      listing({ type: 'purchase', price: 50000, maintenance: 25, loanAmount: 30000, loanRate: 4.2, loanYears: 30 }),
      off,
    );
    expect(c.interest).toBeCloseTo(105);
    expect(c.interest + c.principal).toBeCloseTo(146.7, 1);
    expect(c.total).toBeCloseTo(171.7, 1);
  });

  it('기회비용 옵션: 자기자금 × 예금금리 / 12', () => {
    const c = calcCost(listing({ type: 'jeonse', price: 30000, loanAmount: 20000, loanRate: 3.8 }), on);
    expect(c.opportunityCost).toBeCloseTo(25);
    expect(c.total).toBeCloseTo(63.333 + 25, 2);
  });

  it('대출이 보증금보다 커도 자기자금은 음수가 되지 않음', () => {
    const c = calcCost(listing({ price: 1000, loanAmount: 2000 }), on);
    expect(c.ownCapital).toBe(0);
    expect(c.opportunityCost).toBe(0);
  });
});

describe('amortizedPayment', () => {
  it('금리 0%면 원금 / 개월수', () => {
    expect(amortizedPayment(12000, 0, 10)).toBeCloseTo(100);
  });
  it('대출 없으면 0', () => {
    expect(amortizedPayment(0, 4, 30)).toBe(0);
  });
});
