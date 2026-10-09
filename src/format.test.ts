import { describe, expect, it } from 'vitest';
import { formatManwon, normalizeLink, parseNumber, withCommas } from './format';

describe('normalizeLink', () => {
  it('스킴 없는 주소에 https를 붙인다', () => {
    expect(normalizeLink('m.land.naver.com/article/1')).toBe('https://m.land.naver.com/article/1');
  });
  it('포트가 있는 주소를 스킴으로 오인하지 않는다', () => {
    expect(normalizeLink('example.com:8080/a')).toBe('https://example.com:8080/a');
  });
  it('http/https는 그대로', () => {
    expect(normalizeLink(' http://a.com ')).toBe('http://a.com');
  });
  it('위험한 스킴은 버린다', () => {
    expect(normalizeLink('javascript:alert(1)')).toBe('');
    expect(normalizeLink('JaVaScRiPt:alert(1)')).toBe('');
    expect(normalizeLink('data:text/html,<script>')).toBe('');
  });
});

describe('숫자 입력', () => {
  it('콤마와 소수점', () => {
    expect(withCommas('30000')).toBe('30,000');
    expect(withCommas('3.85')).toBe('3.85');
    expect(withCommas('1.2.3')).toBe('1.23');
    expect(withCommas('-500원')).toBe('500');
    expect(parseNumber('30,000')).toBe(30000);
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('abc')).toBe(0);
  });
  it('만원 표시', () => {
    expect(formatManwon(30000)).toBe('3억원');
    expect(formatManwon(12500)).toBe('1억 2,500만원');
    expect(formatManwon(0)).toBe('0원');
  });
});
