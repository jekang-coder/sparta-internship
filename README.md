# 스파르타 인터뷰 트래커

일경험 사업 참여 청년(지원자)과 참여 기업(면접관)이 면접 일정을 조율하고,
운영 매니저가 전체 현황을 관리하는 채용 트래킹 서비스.

**서비스 URL**: https://sparta-internship-iota.vercel.app  
**GitHub**: https://github.com/jekang-coder/sparta-internship

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | 개발용 목 로그인 → 카카오 OAuth 2.0 연동 예정 |
| 알림 | 카카오 알림톡 API 연동 예정 |
| 배포 | Vercel (GitHub 자동 배포) |

---

## 로컬 실행 방법

### 1. 레포 클론
```bash
git clone https://github.com/jekang-coder/sparta-internship.git
cd sparta-internship/apps/web
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.example`을 참고해 `apps/web/.env.local` 생성:
```
NEXT_PUBLIC_SUPABASE_URL=https://brorhlaoxebuwpbqtqvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
ADMIN_DOMAIN=teamsparta.co
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> Supabase 키는 AX팀에게 문의

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 프로젝트 구조

```
sparta-internship/
├── apps/
│   └── web/                        # Next.js 앱
│       ├── app/
│       │   ├── login/              # 로그인 (목 로그인 → 카카오 연동 예정)
│       │   ├── applicant/          # 지원자 화면
│       │   │   ├── page.tsx        # 기업 목록
│       │   │   ├── my/             # 내 면접 일정 + 결과
│       │   │   └── apply/[slotId]/ # 면접 신청
│       │   ├── interviewer/        # 면접관 화면
│       │   │   ├── page.tsx        # 공고 목록 + 지원자 현황
│       │   │   ├── register/       # 공고 등록
│       │   │   └── applicants/     # 지원자 승인 + 평가
│       │   ├── admin/              # 어드민 대시보드
│       │   └── api/                # API Routes
│       │       ├── auth/           # 인증 (목 로그인, 카카오 콜백)
│       │       ├── slots/          # 면접 슬롯 CRUD
│       │       ├── applications/   # 신청/승인/평가
│       │       └── admin/          # 현황 대시보드
│       ├── components/             # 공통 컴포넌트
│       └── lib/                    # types, supabase, session
├── supabase/
│   └── migrations/
│       └── 001_init.sql            # DB 스키마 (5개 테이블)
└── 기획.md                         # 서비스 기획서
```

---

## 사용자 역할 및 플로우

| 역할 | 로그인 | 주요 기능 |
|------|--------|----------|
| 지원자 | 카카오 로그인 | 기업 목록 조회 → 면접 신청 → 결과 확인 |
| 면접관 | 카카오 로그인 | 면접 공고 등록 → 지원자 승인 → 평가 입력 |
| 운영 매니저 | 카카오 로그인 (@teamsparta.co) | 전체 현황 대시보드 → 지연 케이스 모니터링 |

### 면접 상태값
```
pending → approved → interview_done → passed
                  ↘ rejected        ↘ failed
```

---

## DB 스키마 (Supabase)

5개 테이블: `users` / `companies` / `interview_slots` / `applications` / `notifications`

초기 세팅: Supabase SQL Editor에서 `supabase/migrations/001_init.sql` 실행

---

## 남은 개발 항목

### 1순위 — 카카오 로그인 연동
현재 개발용 목 로그인(`/api/auth/mock-login`)으로 운영 중.
카카오 연동 완료 후 해당 파일 삭제 필요.

**작업 순서:**
1. [developers.kakao.com](https://developers.kakao.com) 앱 생성
2. REST API 키 + Client Secret 발급
3. Redirect URI 등록: `https://sparta-internship-iota.vercel.app/api/auth/kakao/callback`
4. 동의항목 설정: 닉네임(필수), 이메일(선택), 전화번호(선택)
5. Vercel 환경변수에 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI` 추가
6. 로그인 페이지(`/app/login/page.tsx`)에서 목 로그인 버튼 → 카카오 버튼으로 교체
7. `/api/auth/mock-login/route.ts` 삭제

### 2순위 — 면접관 계정 등록 플로우
현재 카카오 로그인 시 이메일 도메인 기준으로만 역할 분기:
- `@teamsparta.co` → admin
- 그 외 → applicant (면접관 자동 분기 없음)

기업 담당자가 면접관으로 등록되는 별도 플로우 필요.
(예: 어드민이 직접 role 변경 / 초대 링크 발송 등)

### 3순위 — 카카오 알림톡 연동
단계별 자동 알림 발송 (`/lib/notifications.ts` 신규 작성 필요)

| 트리거 | 수신자 | 내용 |
|--------|--------|------|
| 면접 공고 등록 | 지원자 | "OO기업 면접 신청하세요" |
| 지원자 신청 | 기업 | "신청이 들어왔어요. 승인해주세요" |
| 기업 승인 | 지원자 | "면접 일정이 확정됐어요" |
| 면접 D-1 | 양측 | "내일 면접이 있어요" |
| 면접 완료 | 기업 | "평가를 입력해주세요" |

### 4순위 — 어드민 알럿 수동 발송
`/admin/alerts` 페이지에서 지연 케이스 대상으로 알림 재발송 기능

---

## 환경변수 전체 목록

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable Key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret Key | ✅ |
| `SESSION_SECRET` | 세션 쿠키 서명 키 | ✅ |
| `ADMIN_DOMAIN` | 어드민 이메일 도메인 (`teamsparta.co`) | ✅ |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | ✅ |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 | 카카오 연동 시 |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret | 카카오 연동 시 |
| `KAKAO_REDIRECT_URI` | 카카오 Redirect URI | 카카오 연동 시 |
| `KAKAO_ALIMTALK_APP_KEY` | 카카오 알림톡 앱키 | 알림톡 연동 시 |
| `KAKAO_ALIMTALK_SENDER_KEY` | 카카오 알림톡 발신키 | 알림톡 연동 시 |

---

## 문의

AX팀 — ax@teamsparta.co
