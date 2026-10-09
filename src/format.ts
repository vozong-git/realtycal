/** 만원 단위 숫자를 "1억 2,000만원" 형태로 */
export function formatManwon(value: number): string {
  const v = Math.round(value);
  if (v === 0) return '0원';
  const eok = Math.floor(v / 10000);
  const man = v % 10000;
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  return `${parts.join(' ')}원`;
}

/** 월 금액(만원)을 소수 첫째 자리까지 */
export function formatMonthly(value: number): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
}

/** 입력 문자열 → 숫자 (콤마 제거, 비어있으면 0) */
export function parseNumber(text: string): number {
  const n = Number(text.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** 입력 중인 숫자에 천 단위 콤마 */
export function withCommas(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const [int, ...rest] = cleaned.split('.');
  const intPart = int ? Number(int).toLocaleString('ko-KR') : '';
  return rest.length ? `${intPart || '0'}.${rest.join('')}` : intPart;
}
