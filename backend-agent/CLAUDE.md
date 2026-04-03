# ⚙️ Backend Agent — 인터뷰 트래커

## 역할
`apps/api/` Nest.js 앱 전담.
카카오 OAuth 인증, 면접 일정 관리 API, 카카오 알림톡 발송, Supabase 데이터 저장을 담당한다.

---

## 담당 디렉토리
```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       ← GET /auth/kakao, GET /auth/kakao/callback
│   │   ├── auth.service.ts          ← 카카오 OAuth 처리, JWT 발급
│   │   ├── jwt.strategy.ts          ← JWT 인증 가드
│   │   └── roles.guard.ts           ← 역할 기반 접근 제어
│   ├── slots/
│   │   ├── slots.module.ts
│   │   ├── slots.controller.ts      ← GET /slots, POST /slots
│   │   ├── slots.service.ts
│   │   └── slots.dto.ts
│   ├── applications/
│   │   ├── applications.module.ts
│   │   ├── applications.controller.ts  ← POST /applications, PATCH /applications/:id/*
│   │   ├── applications.service.ts     ← 신청/승인/거절/평가/합격 비즈니스 로직
│   │   └── applications.dto.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts      ← GET /admin/dashboard, POST /admin/alerts
│   │   └── admin.service.ts         ← 현황 집계, 지연 케이스 조회
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts ← 카카오 알림톡 발송
│   └── supabase/
│       ├── supabase.module.ts
│       └── supabase.service.ts      ← DB 저장/조회
├── .env
└── package.json
```

---

## 기술 스택
- **Nest.js** (Express 기반)
- **TypeScript**
- **@supabase/supabase-js** (Supabase 클라이언트)
- **passport-kakao** (카카오 OAuth)
- **@nestjs/jwt** (JWT 인증)
- **axios** (카카오 알림톡 API 호출)

---

## API 엔드포인트

### 인증
| Method | Path | 설명 |
|--------|------|------|
| GET | `/auth/kakao` | 카카오 로그인 리다이렉트 |
| GET | `/auth/kakao/callback` | 카카오 콜백 → JWT 발급 → 역할별 프론트 리다이렉트 |
| GET | `/auth/me` | 현재 로그인 사용자 정보 |

### 면접 슬롯 (면접관)
| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/slots` | interviewer | 면접 슬롯 등록 |
| GET | `/slots` | applicant | 신청 가능한 슬롯 목록 |
| GET | `/slots/my` | interviewer | 내가 등록한 슬롯 목록 |

### 면접 신청 (지원자 / 면접관)
| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/applications` | applicant | 면접 신청 |
| GET | `/applications/my` | applicant | 내 신청 목록 |
| GET | `/applications/slot/:slotId` | interviewer | 슬롯별 지원자 목록 |
| PATCH | `/applications/:id/approve` | interviewer | 승인 |
| PATCH | `/applications/:id/reject` | interviewer | 거절 |
| PATCH | `/applications/:id/evaluate` | interviewer | 평가 입력 + 합격/불합격 |

### 어드민
| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/admin/dashboard` | admin | 단계별 현황 + 지연 케이스 |
| POST | `/admin/alerts` | admin | 수동 알림 재발송 |

---

## 카카오 OAuth 처리

### 역할 분기 로직
```typescript
// auth.service.ts
async handleKakaoCallback(kakaoUser: KakaoUser): Promise<string> {
  let user = await this.supabase.findUserByKakaoId(kakaoUser.id);

  if (!user) {
    // 신규 유저 → 이메일 도메인으로 역할 결정
    const role = kakaoUser.email?.endsWith('@teamsparta.co')
      ? 'admin'
      : 'applicant'; // 기업 계정은 별도 등록 플로우 필요 (2차)
    user = await this.supabase.createUser({ ...kakaoUser, role });
  }

  const token = this.jwt.sign({ sub: user.id, role: user.role });
  return token;
}
```

---

## 알림톡 발송 전략

```typescript
// notifications.service.ts
async send(type: NotificationType, userId: string, context: Record<string, string>) {
  const user = await this.supabase.findUser(userId);
  const template = TEMPLATES[type]; // 템플릿 코드 + 변수 매핑

  await axios.post('https://kakaoapi.aligo.in/kakao/v2/send/', {
    appkey: process.env.KAKAO_ALIMTALK_APP_KEY,
    sender: process.env.KAKAO_ALIMTALK_SENDER_KEY,
    receiver_1: user.phone,
    recvname_1: user.name,
    tpl_code: template.code,
    message_1: template.render(context),
  });

  // 발송 기록 저장
  await this.supabase.saveNotification({ userId, type, status: 'sent' });
}
```

### 알림톡 트리거 위치
| 트리거 | 호출 위치 |
|--------|----------|
| 면접 공고 등록 완료 | `slots.service.ts` → `create()` 이후 |
| 지원자 신청 완료 | `applications.service.ts` → `apply()` 이후 |
| 기업 승인 완료 | `applications.service.ts` → `approve()` 이후 |
| 면접 D-1 | Cron Job (매일 오전 9시) |
| 면접 완료 | `applications.service.ts` → `markDone()` 이후 |
| 단계 지연 알럿 | Cron Job (매일 오전 10시) 또는 어드민 수동 발송 |

---

## 지연 케이스 감지 로직

```typescript
// admin.service.ts
async getDelayedCases(): Promise<DelayedCase[]> {
  const DELAY_THRESHOLDS = {
    pending: 2,          // 2일 이상 승인 대기
    approved: 7,         // 7일 이상 면접 미진행
    interview_done: 3,   // 3일 이상 평가 미입력
  };

  // updated_at 기준으로 임계값 초과 케이스 조회
}
```

---

## 작업 원칙
- 모든 외부 API 호출은 try-catch로 감싸고, 에러 시 적절한 HTTP 상태 코드 반환
- 어드민 권한은 JWT role 필드 + 이메일 도메인 이중 검증
- CORS 설정: 프론트엔드 도메인만 허용 (개발: `localhost:3000`)
- 환경변수는 `ConfigModule`로 관리, 절대 하드코딩 금지
- 알림톡 발송 실패 시 에러 로그 저장 후 API는 정상 응답 (비차단)
