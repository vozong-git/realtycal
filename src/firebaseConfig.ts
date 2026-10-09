import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에 나오는 설정값.
 * null이면 공유 없이 이 기기(localStorage)에만 저장한다.
 * 이 값들은 원래 웹에 공개되는 값이고, 접근 제어는 firestore.rules가 담당한다.
 */
export const firebaseConfig: FirebaseOptions | null = null;
