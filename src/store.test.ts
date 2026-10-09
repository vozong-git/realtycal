import { describe, expect, it } from 'vitest';
import { calcCost, calcOneTimeCost } from './calc';
import { normalizeListing } from './store';

describe('normalizeListing', () => {
  it('타입이 틀린 값은 기본값으로 바꾸고 모르는 필드는 버린다', () => {
    const l = normalizeListing(
      {
        name: '<img src=x>',
        type: 'hacked',
        price: 'abc',
        maintenance: null,
        loanAmount: -5,
        loanRate: true,
        loanYears: 0,
        dong: 7,
        evil: 'x',
      },
      'id1',
    );
    expect(l).toEqual({
      id: 'id1',
      name: '<img src=x>',
      type: 'monthly',
      price: 0,
      monthlyRent: 0,
      maintenance: 0,
      loanAmount: 0,
      loanRate: 0,
      loanYears: 30,
      dong: '',
      memo: '',
      link: '',
    });
  });

  it('정리된 값으로 계산해도 NaN이나 오류가 없다', () => {
    const l = normalizeListing({ type: 'jeonse', price: Number.NaN, loanAmount: Infinity }, 'x');
    const settings = { includeOpportunityCost: true, depositRate: 3 };
    expect(Number.isFinite(calcCost(l, settings).total)).toBe(true);
    expect(Number.isFinite(calcOneTimeCost(l).total)).toBe(true);
  });
});
