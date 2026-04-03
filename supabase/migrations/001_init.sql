-- 1. users
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kakao_id    VARCHAR(100) UNIQUE NOT NULL,
  email       VARCHAR(200),
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'interviewer', 'admin')),
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
  method         VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (method IN ('offline', 'online')),
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
CREATE INDEX idx_applications_status     ON applications(status);
CREATE INDEX idx_applications_applicant  ON applications(applicant_id);
CREATE INDEX idx_applications_slot       ON applications(slot_id);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);
CREATE INDEX idx_slots_company           ON interview_slots(company_id);
CREATE INDEX idx_slots_date              ON interview_slots(interview_date);
CREATE INDEX idx_notifications_user      ON notifications(user_id);

-- RLS 활성화
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- service_role 전체 접근 허용
CREATE POLICY "service_role_all_users"         ON users           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_companies"     ON companies       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_slots"         ON interview_slots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_applications"  ON applications    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_notifications" ON notifications   FOR ALL USING (auth.role() = 'service_role');
