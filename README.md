# RealtyCal

월세 · 전세 · 매매 매물의 **월 고정비**를 한눈에 비교하는 웹앱.
https://vozong-git.github.io/realtycal/

- 월세: 월세 + 관리비 + 대출이자
- 전세: 관리비 + 대출이자
- 매매: 관리비 + 원리금(원리금균등, 원금 포함)
- 옵션: 자기자금 기회비용 (자기자금 × 예금금리 / 12)
- 카드의 접힌 영역: 이사 비용(중개수수료 상한·취득세 자동 계산), 메모, 매물 링크
- 동별 필터: 매물에 동을 입력하면 목록 위에 동 칩이 생긴다
- 정렬: 월 고정비·보증금·대출금 ↑(높은순)/↓(낮은순). 기회비용을 켜도 순서는 그대로, 금액과 '최저' 배지만 바뀐다
- 정렬·필터·기회비용 설정은 기기마다 따로 저장, 매물 데이터만 공유
- 오프라인: 한 번 연 방은 인터넷이 끊겨도 보이고, 다시 연결되면 동기화

```bash
npm install
npm run dev     # 개발 서버
npm test        # 계산 로직 테스트
npm run build   # dist/ 정적 빌드
```

푸시하면 GitHub Actions가 테스트 → 빌드 → GitHub Pages 배포까지 한다.

## 같이 보기 (비밀 링크 공유)

`src/firebaseConfig.ts`가 `null`이면 이 기기(localStorage)에만 저장한다.
Firebase 설정값을 넣으면 공유 모드가 된다.

- 앱을 처음 열면 22자 무작위 **방 ID**가 생기고 주소가 `…/realtycal/#room=<방ID>`가 된다.
- 상단 **공유** 버튼으로 이 링크를 보내면, 링크를 연 사람과 같은 매물 목록을 실시간으로 보고 고친다.
- 처음 공유를 시작한 기기에 있던 매물은 방으로 자동으로 옮겨진다.
- 기회비용 토글·예금금리 같은 설정은 기기마다 따로 저장된다.
- 링크를 아는 사람은 누구나 보고 고칠 수 있으니 필요한 사람에게만 보낸다.

### Firebase 준비

1. https://console.firebase.google.com → 프로젝트 추가 (Google 애널리틱스는 꺼도 됨)
2. **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → **프로덕션 모드**
3. Firestore → **규칙** 탭에 이 저장소의 `firestore.rules` 내용을 붙여넣고 게시
4. 프로젝트 설정(⚙️) → 내 앱 → 웹(`</>`) 앱 추가 → 나오는 `firebaseConfig` 값을 `src/firebaseConfig.ts`에 넣기

### 로컬 에뮬레이터로 개발

```bash
npx firebase emulators:start --only firestore --project demo-realtycal
VITE_FIRESTORE_EMULATOR=localhost:8080 npm run dev
```
