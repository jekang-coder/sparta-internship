# 📋 인터뷰 트래커 — Orchestrator

## 프로젝트 개요
일경험 사업 참여 청년(지원자)과 참여 기업(면접관)이 카카오톡으로 로그인해
면접 일정을 조율하고, 운영 매니저(@teamsparta.co)가 전체 현황을 관리하는 채용 트래킹 서비스.

---

## 아키텍처

```
InterviewTracker/
├── CLAUDE.md                  ← 오케스트레이터 (지금 파일)
├── 기획.md                    ← 서비스 기획서
│
├── frontend-agent/
│   └── CLAUDE.md              ← 프론트엔드 에이전트
│
├── backend-agent/
│   └── CLAUDE.md              ← 백엔드 에이전트
│
├── infra-agent/
│   └── CLAUDE.md              ← 인프라 에이전트
│
└── apps/
    ├── web/                   ← Next.js 14 프론트엔드
    └── api/                   ← Nest.js 백엔드
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| 백엔드 | Nest.js, TypeScript |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | 카카오 소셜 로그인 (OAuth 2.0) |
| 알림 | 카카오 알림톡 API |
| 배포 | Vercel |
| 버전 관리 | GitHub |

---

## 서브에이전트 역할 분담

### 🖥 frontend-agent
- `apps/web/` Next.js 앱 전담
- 3가지 사용자 화면: 지원자 / 면접관(기업) / 어드민
- 카카오 로그인 UI 연동
- 백엔드 API 호출 연동

### ⚙️ backend-agent
- `apps/api/` Nest.js 앱 전담
- 카카오 OAuth 인증 처리 + 역할 분기 (applicant / interviewer / admin)
- 면접 일정 등록/신청/승인/평가/합격 처리 API
- 카카오 알림톡 발송 서비스
- Supabase 데이터 저장/조회

### 🏗 infra-agent
- Supabase 스키마 설계 및 마이그레이션 (5개 테이블 + RLS)
- 환경변수 관리 (`.env.example`)
- Vercel 배포 설정
- GitHub 레포 초기화

---

## 핵심 사용자 플로우

### 지원자
```
카카오 로그인 → 참여 기업 목록 조회 → 면접 시간 슬롯 선택 → 신청
→ 기업 승인 대기 → 면접 일정 확인 → 면접 진행 → 결과 확인
```

### 면접관(기업)
```
카카오 로그인 → 면접 공고 등록(일정/방식) → 지원자 승인/거절
→ 면접 진행 → 평가 점수 + 코멘트 입력 → 최종 합격자 선발
```

### 운영 매니저
```
카카오 로그인(@teamsparta.co 전용) → 어드민 대시보드
→ 단계별 현황 모니터링 → 지연 케이스 확인 → 알럿 발송
```

---

## 면접 단계 상태값

```
pending       → 지원자 신청 완료, 기업 승인 대기
approved      → 기업 승인, 면접 일정 확정
rejected      → 기업 거절
interview_done → 면접 완료, 평가 입력 대기
passed        → 최종 합격
failed        → 최종 불합격
```

---

## 카카오 알림톡 발송 트리거

| 트리거 | 수신자 | 메시지 |
|--------|--------|--------|
| 면접 공고 등록 | 매칭 지원자 | "OO기업 면접 일정이 등록됐어요. 지금 신청하세요!" |
| 지원자 신청 | 기업 담당자 | "새 면접 신청이 들어왔어요. 확인 후 승인해주세요." |
| 기업 승인 | 지원자 | "면접 일정이 확정됐어요! 일정을 확인해주세요." |
| 면접 D-1 | 지원자 + 기업 | "내일 면접이 있어요. 준비됐나요?" |
| 면접 완료 | 기업 담당자 | "면접이 완료됐어요. 평가를 입력해주세요." |
| 단계 지연 알럿 | 지연 당사자 | "아직 [단계명]을 완료하지 않으셨어요. 확인해주세요." |

---

## 환경변수 목록

```
# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=

# 카카오 알림톡
KAKAO_ALIMTALK_APP_KEY=
KAKAO_ALIMTALK_SENDER_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 앱
NEXT_PUBLIC_API_URL=
ADMIN_DOMAIN=teamsparta.co
```

---

## 작업 원칙
- 모든 코드는 TypeScript로 작성
- API 응답은 일관된 형식 유지 `{ data, error }`
- 민감 정보는 절대 코드에 하드코딩 금지 (`.env` 사용)
- 모바일 반응형 필수
- 어드민 접근은 이메일 도메인(@teamsparta.co) 기준으로 서버에서 검증
- 동시 접속자 100명 기준 설계 (별도 캐싱 레이어 불필요)
