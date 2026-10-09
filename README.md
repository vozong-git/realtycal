# RealtyCal

월세 · 전세 · 매매 매물의 **월 고정비**를 한눈에 비교하는 웹앱.

- 월세: 월세 + 관리비 + 대출이자
- 전세: 관리비 + 대출이자
- 매매: 관리비 + 원리금(원리금균등, 원금 포함)
- 옵션: 자기자금 기회비용 (자기자금 × 예금금리 / 12)

데이터는 브라우저 localStorage에만 저장됩니다.

```bash
npm install
npm run dev     # 개발 서버
npm test        # 계산 로직 테스트
npm run build   # dist/ 정적 빌드
```
