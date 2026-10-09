export type LeaseType = 'monthly' | 'jeonse' | 'purchase';

/** 금액 단위는 모두 만원, 금리는 연 % */
export interface Listing {
  id: string;
  name: string;
  type: LeaseType;
  /** 보증금 / 전세금 / 매매가 */
  price: number;
  /** 월세 (월세 유형만) */
  monthlyRent: number;
  maintenance: number;
  loanAmount: number;
  loanRate: number;
  /** 상환 기간(년), 매매만 사용 */
  loanYears: number;
  /** 이사비 (1회) */
  movingCost: number;
  /** 기타 1회성 비용: 청소, 인테리어 등 */
  otherCost: number;
  memo: string;
  /** 매물 링크 (http/https만) */
  link: string;
}

export type SortKey = 'monthly' | 'cash' | 'capital' | 'name';
export type TypeFilter = 'all' | LeaseType;

/** 기기마다 따로 저장되는 보기 설정 */
export interface Settings {
  includeOpportunityCost: boolean;
  /** 자기자금을 예금에 넣었을 때의 연 이자율 (%) */
  depositRate: number;
  sortBy: SortKey;
  typeFilter: TypeFilter;
}

export const SORT_LABEL: Record<SortKey, string> = {
  monthly: '월 고정비순',
  cash: '입주 현금순',
  capital: '자기자금순',
  name: '이름순',
};

export const TYPE_LABEL: Record<LeaseType, string> = {
  monthly: '월세',
  jeonse: '전세',
  purchase: '매매',
};

export const PRICE_LABEL: Record<LeaseType, string> = {
  monthly: '보증금',
  jeonse: '전세금',
  purchase: '매매가',
};
