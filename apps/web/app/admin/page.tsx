'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { SessionUser, DashboardData, ApplicationStatus } from '@/lib/types';

const STATUS_STEPS: { status: ApplicationStatus; label: string; emoji: string }[] = [
  { status: 'pending', label: '승인 대기', emoji: '⏳' },
  { status: 'approved', label: '면접 확정', emoji: '✅' },
  { status: 'rejected', label: '거절됨', emoji: '❌' },
  { status: 'interview_done', label: '면접 완료', emoji: '🎤' },
  { status: 'passed', label: '최종 합격', emoji: '🎉' },
  { status: 'failed', label: '불합격', emoji: '😔' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: '#F59E0B',
  approved: '#2563EB',
  rejected: '#DC2626',
  interview_done: '#7C3AED',
  passed: '#059669',
  failed: '#8C8C8C',
};

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) { router.replace('/login'); return; }
        if (json.data.role !== 'admin') {
          router.replace(json.data.role === 'interviewer' ? '/interviewer' : '/applicant');
          return;
        }
        setSession(json.data);
        return fetch('/api/admin/dashboard');
      })
      .then((r) => r?.json())
      .then((json) => {
        if (json?.data) setDashboard(json.data);
        else if (json?.error) setError(json.error);
        setLoading(false);
      })
      .catch(() => { setError('데이터를 불러오지 못했습니다.'); setLoading(false); });
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #F5F5F5', borderTopColor: '#FA0030', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalCount = dashboard
    ? Object.values(dashboard.counts).reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header session={session} />
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>
            운영 대시보드
          </h1>
          <p style={{ fontSize: 14, color: '#8C8C8C' }}>면접 진행 현황 전체를 한눈에 확인하세요.</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* 총계 카드 */}
        <div
          style={{
            padding: '24px 32px', border: '1.5px solid #E8E8E8', borderRadius: 16,
            background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24,
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: '#8C8C8C', marginBottom: 4 }}>전체 신청 건수</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#FA0030', letterSpacing: '-1px' }}>{totalCount}</p>
          </div>
          <div style={{ width: 1, height: 48, background: '#E8E8E8' }} />
          <p style={{ fontSize: 13, color: '#8C8C8C', lineHeight: 1.6 }}>
            합격: <strong style={{ color: '#059669' }}>{dashboard?.counts.passed ?? 0}</strong>명 ·{' '}
            불합격: <strong style={{ color: '#8C8C8C' }}>{dashboard?.counts.failed ?? 0}</strong>명 ·{' '}
            진행 중: <strong style={{ color: '#222' }}>{totalCount - (dashboard?.counts.passed ?? 0) - (dashboard?.counts.failed ?? 0) - (dashboard?.counts.rejected ?? 0)}</strong>명
          </p>
        </div>

        {/* 단계별 현황 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 40 }}>
          {STATUS_STEPS.map(({ status, label, emoji }) => (
            <div
              key={status}
              style={{
                padding: '20px 20px 16px',
                border: '1.5px solid #E8E8E8',
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{emoji}</div>
              <p style={{ fontSize: 12, color: '#8C8C8C', marginBottom: 4 }}>{label}</p>
              <p
                style={{
                  fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px',
                  color: STATUS_COLORS[status],
                }}
              >
                {dashboard?.counts[status] ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* 지연 케이스 */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>
            주의 필요 케이스
            {dashboard && dashboard.delayed.length > 0 && (
              <span
                style={{
                  display: 'inline-block', marginLeft: 10,
                  padding: '2px 8px', borderRadius: 100, background: '#FEE2E2',
                  fontSize: 12, fontWeight: 700, color: '#DC2626', verticalAlign: 'middle',
                }}
              >
                {dashboard.delayed.length}건
              </span>
            )}
          </h2>

          {!dashboard || dashboard.delayed.length === 0 ? (
            <div
              style={{
                padding: '40px', textAlign: 'center', border: '1.5px solid #E8E8E8',
                borderRadius: 16, background: '#FAFAFA', color: '#8C8C8C',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
              <p style={{ fontSize: 15, fontWeight: 600 }}>지연 케이스가 없습니다!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dashboard.delayed.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '18px 24px',
                    border: '1.5px solid #FEE2E2',
                    borderRadius: 14,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{c.applicant_name}</span>
                      <span style={{ fontSize: 13, color: '#8C8C8C' }}>→</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>{c.company_name}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#8C8C8C' }}>
                      면접일: {new Date(c.slot_date).toLocaleDateString('ko-KR')} · {c.days_since_update}일째 상태 변화 없음
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={c.status} />
                    <span
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 8px',
                        background: '#FEE2E2', color: '#DC2626', borderRadius: 6,
                      }}
                    >
                      D+{c.days_since_update}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
