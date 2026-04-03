'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// TODO: 카카오 로그인 구현 시 아래 목 로그인 섹션 제거하고
//       카카오 버튼 (<a href="/api/auth/kakao">) 으로 교체

const MOCK_ROLES = [
  { role: 'applicant', label: '지원자로 로그인', emoji: '🙋', desc: '면접 신청 · 일정 확인 · 결과 조회' },
  { role: 'interviewer', label: '면접관으로 로그인', emoji: '🏢', desc: '공고 등록 · 지원자 승인 · 평가 입력' },
  { role: 'admin', label: '운영 매니저로 로그인', emoji: '📊', desc: '전체 현황 대시보드 · 알럿 관리' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const role = json.data.role;
          if (role === 'admin') router.replace('/admin');
          else if (role === 'interviewer') router.replace('/interviewer');
          else router.replace('/applicant');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleMockLogin(role: string) {
    setLoading(role);
    try {
      const res = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (role === 'admin') router.push('/admin');
      else if (role === 'interviewer') router.push('/interviewer');
      else router.push('/applicant');
    } catch {
      setLoading(null);
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #F5F5F5', borderTopColor: '#FA0030', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1.5px solid #E8E8E8', borderRadius: 16, padding: '48px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: '#FA0030', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 900 }}>S</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#FA0030' }}>SPARTA</span> INTERVIEW
          </span>
        </div>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff0f2', color: '#FA0030', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 100, marginBottom: 24 }}>
          <span style={{ width: 5, height: 5, background: '#FA0030', borderRadius: '50%', display: 'inline-block' }} />
          개발용 목 로그인
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 10, color: '#222' }}>면접 일정 트래커</h1>
        <p style={{ fontSize: 15, color: '#8C8C8C', lineHeight: 1.6, letterSpacing: '-0.2px', marginBottom: 32 }}>
          일경험 사업 참여 청년과 기업의<br />면접 일정을 조율하는 서비스입니다.
        </p>

        {/* 역할 선택 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_ROLES.map(({ role, label, emoji, desc }) => (
            <button
              key={role}
              onClick={() => handleMockLogin(role)}
              disabled={loading !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '14px 18px',
                background: loading === role ? '#FA0030' : '#fff',
                color: loading === role ? '#fff' : '#222',
                border: `1.5px solid ${loading === role ? '#FA0030' : '#E8E8E8'}`,
                borderRadius: 10, cursor: loading !== null ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = '#FA0030'; e.currentTarget.style.background = '#fff0f2'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.background = '#fff'; } }}
            >
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>{loading === role ? '로그인 중...' : label}</div>
                <div style={{ fontSize: 12, color: loading === role ? 'rgba(255,255,255,0.8)' : '#8C8C8C', marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#BBBBBB', marginTop: 24 }}>
          카카오 로그인은 추후 연동 예정입니다.
        </p>
      </div>
    </div>
  );
}
