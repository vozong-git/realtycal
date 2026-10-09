import { describe, expect, it } from 'vitest';
import { acquisitionTax, amortizedPayment, brokerFee, calcCost, calcOneTimeCost } from './calc';
import type { Listing, Settings } from './types';

const off: Pick<Settings, 'includeOpportunityCost' | 'depositRate'> = { includeOpportunityCost: false, depositRate: 3 };
const on: Pick<Settings, 'includeOpportunityCost' | 'depositRate'> = { includeOpportunityCost: true, depositRate: 3 };

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
    movingCost: 0,
    otherCost: 0,
    memo: '',
    link: '',
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

describe('brokerFee', () => {
  it('매매 5억: 0.4%', () => {
    expect(brokerFee(listing({ type: 'purchase', price: 50000 }))).toBeCloseTo(200);
  });
  it('매매 4천만: 0.6%, 한도 25만 이내', () => {
    expect(brokerFee(listing({ type: 'purchase', price: 4000 }))).toBeCloseTo(24);
    expect(brokerFee(listing({ type: 'purchase', price: 4900 }))).toBeCloseTo(25);
  });
  it('전세 3억: 0.3%', () => {
    expect(brokerFee(listing({ type: 'jeonse', price: 30000 }))).toBeCloseTo(90);
  });
  it('월세: 보증금 + 월세×100 으로 환산', () => {
    // 5,000 + 80×100 = 1억 3천 → 0.3%
    expect(brokerFee(listing({ type: 'monthly', price: 5000, monthlyRent: 80 }))).toBeCloseTo(39);
  });
  it('월세 환산액이 5천만 미만이면 ×70', () => {
    // 500 + 40×100 = 4,500 < 5,000 → 500 + 40×70 = 3,300 → 0.5% = 16.5
    expect(brokerFee(listing({ type: 'monthly', price: 500, monthlyRent: 40 }))).toBeCloseTo(16.5);
  });
});

describe('acquisitionTax', () => {
  it('6억 이하 1.1%', () => expect(acquisitionTax(50000)).toBeCloseTo(550));
  it('6~9억 구간은 비례 세율', () => expect(acquisitionTax(80000)).toBeCloseTo(80000 * 0.023333 * 1.1, 0));
  it('9억 초과 3.3%', () => expect(acquisitionTax(100000)).toBeCloseTo(3300));
});

describe('calcOneTimeCost', () => {
  it('전·월세는 취득세 없음, 이사비·기타 합산', () => {
    const c = calcOneTimeCost(listing({ type: 'jeonse', price: 30000, movingCost: 150, otherCost: 50 }));
    expect(c.acquisitionTax).toBe(0);
    expect(c.total).toBeCloseTo(90 + 150 + 50);
  });
  it('매매는 중개수수료 + 취득세', () => {
    const c = calcOneTimeCost(listing({ type: 'purchase', price: 50000 }));
    expect(c.total).toBeCloseTo(200 + 550);
  });
});
