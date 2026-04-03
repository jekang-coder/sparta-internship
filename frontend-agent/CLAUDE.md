# 🖥 Frontend Agent — 인터뷰 트래커

## 역할
`apps/web/` Next.js 앱의 UI/UX 전담.
사용자 역할(지원자 / 면접관 / 어드민)에 따라 다른 화면을 렌더링하고, 백엔드 API를 호출한다.

---

## 담당 디렉토리
```
apps/web/
├── app/
│   ├── layout.tsx                    ← 공통 레이아웃
│   ├── page.tsx                      ← 루트 (로그인 또는 역할별 대시보드로 리다이렉트)
│   ├── login/
│   │   └── page.tsx                  ← 카카오 로그인 페이지
│   ├── applicant/                    ← 지원자 화면
│   │   ├── page.tsx                  ← 참여 기업 목록
│   │   ├── apply/[slotId]/
│   │   │   └── page.tsx              ← 면접 신청 확인
│   │   └── my/
│   │       └── page.tsx              ← 내 면접 일정 + 결과 확인
│   ├── interviewer/                  ← 면접관(기업) 화면
│   │   ├── page.tsx                  ← 내 공고 목록 + 지원자 현황
│   │   ├── register/
│   │   │   └── page.tsx              ← 면접 공고 등록
│   │   └── applicants/[slotId]/
│   │       └── page.tsx              ← 슬롯별 지원자 목록 + 승인/평가
│   └── admin/                        ← 어드민 화면 (@teamsparta.co 전용)
│       ├── page.tsx                  ← 전체 현황 대시보드
│       └── alerts/
│           └── page.tsx              ← 알럿 발송 관리
├── components/
│   ├── auth/
│   │   └── KakaoLoginButton.tsx      ← 카카오 로그인 버튼
│   ├── applicant/
│   │   ├── CompanyCard.tsx           ← 기업 카드 (면접 슬롯 정보)
│   │   └── MySchedule.tsx            ← 내 면접 일정 카드
│   ├── interviewer/
│   │   ├── SlotForm.tsx              ← 면접 공고 등록 폼
│   │   ├── ApplicantRow.tsx          ← 지원자 행 (승인/거절 버튼)
│   │   └── EvaluationForm.tsx        ← 평가 점수 + 코멘트 입력
│   ├── admin/
│   │   ├── StatusBoard.tsx           ← 단계별 건수 현황판
│   │   └── DelayedCaseList.tsx       ← 지연 케이스 리스트
│   └── common/
│       ├── StatusBadge.tsx           ← 면접 상태 배지
│       └── LoadingSpinner.tsx
└── lib/
    ├── api.ts                        ← 백엔드 API 호출 함수
    └── auth.ts                       ← 세션/역할 확인 유틸
```

---

## 기술 스택
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (스타일링)
- **Pretendard** 폰트 (CDN)

---

## 디자인 시스템

### 컬러
```css
--red: #FA0030;           /* 팀스파르타 브랜드 레드 */
--black: #222222;         /* 메인 텍스트 */
--gray: #8C8C8C;          /* 보조 텍스트 */
--light-gray: #F5F5F5;    /* 배경 */
--white: #FFFFFF;
```

### 상태 배지 컬러
| 상태 | 컬러 |
|------|------|
| pending | 노란색 (`bg-yellow-100 text-yellow-800`) |
| approved | 파란색 (`bg-blue-100 text-blue-800`) |
| rejected | 빨간색 (`bg-red-100 text-red-800`) |
| interview_done | 보라색 (`bg-purple-100 text-purple-800`) |
| passed | 초록색 (`bg-green-100 text-green-800`) |
| failed | 회색 (`bg-gray-100 text-gray-800`) |

### 버튼
- Primary: `bg-black text-white` → hover `bg-[#FA0030]`
- Secondary: `border border-gray-200` → hover `border-black`
- Danger: `bg-red-500 text-white` → hover `bg-red-600`

---

## 주요 페이지 스펙

### 1. 카카오 로그인 (`/login`)
- 카카오 로그인 버튼 클릭 → 카카오 OAuth 페이지로 리다이렉트
- 콜백 처리: `/api/auth/kakao/callback` → 역할 확인 → 역할별 대시보드로 이동
  - `applicant` → `/applicant`
  - `interviewer` → `/interviewer`
  - `admin` → `/admin`

### 2. 지원자 - 기업 목록 (`/applicant`)
- 참여 기업 카드 목록 (기업명, 면접 방식, 남은 슬롯 수)
- 각 카드에서 일정 슬롯 선택 + 신청 버튼

### 3. 지원자 - 내 면접 (`/applicant/my`)
- 신청한 면접 목록: 기업명 / 일정 / 방식 / 상태 배지
- 합격/불합격 결과 표시

### 4. 면접관 - 공고 등록 (`/interviewer/register`)
- 날짜/시간 슬롯 추가 (여러 개 등록 가능)
- 면접 방식 선택 (대면/온라인)
- 장소 or 링크 입력
- 슬롯당 모집 인원 입력

### 5. 면접관 - 지원자 관리 (`/interviewer/applicants/[slotId]`)
- 지원자 목록 테이블
- 행별 승인/거절 버튼
- 면접 완료 후 평가 점수(0~100) + 코멘트 입력 폼
- 최종 합격자 선발 버튼

### 6. 어드민 대시보드 (`/admin`)
- 단계별 건수: pending / approved / interview_done / passed / failed
- 지연 케이스 목록 (N일 이상 해당 상태 유지)
- 클릭 시 해당 케이스 상세 이동

---

## API 호출 스펙

```typescript
// GET /api/slots — 면접 슬롯 목록 (지원자용)
interface SlotListResponse {
  data: Slot[];
  error: string | null;
}

// POST /api/applications — 면접 신청 (지원자)
interface ApplyRequest {
  slot_id: string;
}

// PATCH /api/applications/:id/approve — 승인 (면접관)
// PATCH /api/applications/:id/reject  — 거절 (면접관)

// PATCH /api/applications/:id/evaluate — 평가 입력 (면접관)
interface EvaluateRequest {
  score: number;       // 0~100
  comment: string;
  result: 'passed' | 'failed';
}

// GET /api/admin/dashboard — 현황 (어드민)
interface DashboardResponse {
  data: {
    counts: Record<string, number>;   // 단계별 건수
    delayed: DelayedCase[];           // 지연 케이스
  };
  error: string | null;
}
```

---

## 작업 원칙
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 `'use client'` 명시
- Tailwind 클래스로만 스타일링 (인라인 스타일 지양)
- 반응형 필수: 모바일(`< 640px`) 기준 먼저 설계
- 로딩/에러 상태 반드시 처리
- 어드민 페이지는 서버 컴포넌트에서 이메일 도메인 검증 후 렌더링
