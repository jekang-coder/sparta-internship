# 🏗 Infra Agent — 인터뷰 트래커

## 역할
Supabase DB 스키마, 환경변수, Vercel 배포, GitHub 설정 전담.
코드는 건드리지 않고 인프라와 설정 파일만 관리한다.

---

## 담당 범위
```
InterviewTracker/
├── .env.example               ← 환경변수 템플릿
├── .gitignore
├── vercel.json                ← Vercel 배포 설정
└── supabase/
    └── migrations/
        └── 001_init.sql       ← DB 초기 스키마
```

---

## Supabase 스키마

### 전체 DDL (`001_init.sql`)
```sql
-- 1. users
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kakao_id    VARCHAR(100) UNIQUE NOT NULL,
  email       VARCHAR(200),
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('applicant', 'interviewer', 'admin')),
  phone       VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. companies
CREATE TABLE companies (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. interview_slots
CREATE TABLE interview_slots (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id     UUID REFERENCES companies(id) ON DELETE CASCADE,
  interview_date DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  method         VARCHAR(20) NOT NULL CHECK (method IN ('offline', 'online')),
  location       VARCHAR(300),
  capacity       INT DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. applications
CREATE TABLE applications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slot_id      UUID REFERENCES interview_slots(id) ON DELETE CASCADE,
  status       VARCHAR(30) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected','interview_done','passed','failed')),
  score        INT CHECK (score >= 0 AND score <= 100),
  comment      TEXT,
  applied_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. notifications
CREATE TABLE notifications (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  type           VARCHAR(50) NOT NULL,
  message        TEXT NOT NULL,
  sent_at        TIMESTAMPTZ,
  status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_applications_status      ON applications(status);
CREATE INDEX idx_applications_applicant   ON applications(applicant_id);
CREATE INDEX idx_applications_slot        ON applications(slot_id);
CREATE INDEX idx_applications_updated_at  ON applications(updated_at DESC);
CREATE INDEX idx_slots_company            ON interview_slots(company_id);
CREATE INDEX idx_slots_date               ON interview_slots(interview_date);
CREATE INDEX idx_notifications_user       ON notifications(user_id);
```

### Row Level Security (RLS)
```sql
-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_read" ON users FOR SELECT USING (auth.uid()::text = kakao_id);

-- applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- 지원자: 자기 신청만 조회
CREATE POLICY "applicant_read_own" ON applications
  FOR SELECT USING (applicant_id = (SELECT id FROM users WHERE kakao_id = auth.uid()::text));
-- 서비스 롤(백엔드): 모든 작업 허용
CREATE POLICY "service_role_all" ON applications
  FOR ALL USING (auth.role() = 'service_role');

-- 나머지 테이블도 service_role 정책 적용
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON interview_slots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON notifications   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON companies       FOR ALL USING (auth.role() = 'service_role');
```

---

## 환경변수 목록

### 백엔드 (`apps/api/.env`)
```
# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3001/auth/kakao/callback

# 카카오 알림톡 (알리고 or 카카오 비즈니스)
KAKAO_ALIMTALK_APP_KEY=
KAKAO_ALIMTALK_SENDER_KEY=

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d

# 앱
PORT=3001
ADMIN_DOMAIN=teamsparta.co
FRONTEND_URL=http://localhost:3000
```

### 프론트엔드 (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_KAKAO_CLIENT_ID=
```

---

## Vercel 배포 설정 (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    { "src": "apps/web/package.json", "use": "@vercel/next" },
    { "src": "apps/api/src/main.ts",  "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "apps/api/src/main.ts" },
    { "src": "/(.*)",     "dest": "apps/web/$1" }
  ]
}
```

---

## GitHub 초기 설정

### `.gitignore`
```
node_modules/
.env
.env.local
.env.*.local
.next/
dist/
```

### 브랜치 전략
- `main`: 프로덕션 (Vercel 자동 배포)
- `dev`: 개발 통합 브랜치
- `feat/[기능명]`: 기능별 브랜치

---

## 세팅 순서 체크리스트

1. **카카오 개발자 앱 설정**
   - [ ] [developers.kakao.com](https://developers.kakao.com) 에서 앱 생성
   - [ ] REST API 키 확인 → `KAKAO_CLIENT_ID`
   - [ ] 카카오 로그인 활성화 + Redirect URI 등록
   - [ ] 동의항목: 닉네임, 이메일, 전화번호 설정

2. **GitHub 레포 생성**
   - [ ] `InterviewTracker` 레포 생성
   - [ ] 로컬에서 `git init` → remote 연결

3. **Supabase 설정**
   - [ ] 새 프로젝트 생성 (region: Northeast Asia - Seoul)
   - [ ] `001_init.sql` 실행 (SQL Editor)
   - [ ] URL + service_role key 복사

4. **환경변수 설정**
   - [ ] `apps/api/.env` 생성 및 값 입력
   - [ ] `apps/web/.env.local` 생성 및 값 입력
   - [ ] Vercel 환경변수 등록

5. **Vercel 연결**
   - [ ] GitHub 레포 Vercel에 연결
   - [ ] 환경변수 등록 후 배포

---

## 작업 원칙
- `.env` 파일은 절대 Git에 커밋하지 않는다
- `.env.example`에는 키 이름만 남기고 값은 비워둔다
- Supabase는 service_role 키를 백엔드에서만 사용, 프론트에는 노출 금지
- RLS는 반드시 활성화, 백엔드는 service_role로만 접근
