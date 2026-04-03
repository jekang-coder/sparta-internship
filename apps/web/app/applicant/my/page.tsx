'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { SessionUser, Application } from '@/lib/types';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) { router.replace('/login'); return; }
        if (json.data.role !== 'applicant') {
          router.replace(json.data.role === 'admin' ? '/admin' : '/interviewer');
          return;
        }
        setSession(json.data);
        return fetch('/api/applications');
      })
      .then((r) => r?.json())
      .then((json) => {
        if (json?.data) setApplications(json.data);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header session={session} />
      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>
              내 면접 신청 현황
            </h1>
            <p style={{ fontSize: 14, color: '#8C8C8C' }}>신청한 면접의 진행 상태를 확인하세요.</p>
          </div>
          <Link
            href="/applicant"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 40, padding: '0 18px',
              border: '1.5px solid #E8E8E8', borderRadius: 10,
              fontSize: 14, fontWeight: 600, color: '#222',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; }}
          >
            공고 목록으로
          </Link>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C8C8C' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>아직 신청한 면접이 없습니다.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>공고 목록에서 면접을 신청해보세요!</p>
            <Link
              href="/applicant"
              style={{
                display: 'inline-block', marginTop: 20, padding: '10px 24px',
                background: '#222', color: '#fff', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
            >
              공고 목록 보기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const slot = application.slot;
  const dateStr = slot
    ? new Date(slot.interview_date).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
      })
    : '-';
  const appliedStr = new Date(application.applied_at).toLocaleDateString('ko-KR');

  return (
    <div
      style={{
        border: '1.5px solid #E8E8E8',
        borderRadius: 16,
        padding: '24px 28px',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>
            {slot?.company?.name ?? '참여 기업'}
          </p>
          <p style={{ fontSize: 13, color: '#8C8C8C' }}>신청일: {appliedStr}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {slot && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', padding: '16px', background: '#F9F9F9', borderRadius: 10 }}>
          <InfoItem label="면접 날짜" value={dateStr} />
          <InfoItem label="시간" value={`${slot.start_time} ~ ${slot.end_time}`} />
          <InfoItem label="방식" value={slot.method === 'online' ? '온라인' : '오프라인'} />
          {slot.location && <InfoItem label="장소" value={slot.location} />}
        </div>
      )}

      {/* 평가 결과 */}
      {(application.status === 'passed' || application.status === 'failed') && (
        <div
          style={{
            marginTop: 16, padding: '14px 16px',
            background: application.status === 'passed' ? '#ECFDF5' : '#F5F5F5',
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: application.status === 'passed' ? '#059669' : '#8C8C8C', marginBottom: 6 }}>
            {application.status === 'passed' ? '최종 합격' : '불합격'}
            {application.score !== undefined && ` · 점수: ${application.score}점`}
          </p>
          {application.comment && (
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{application.comment}</p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#8C8C8C', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{value}</p>
    </div>
  );
}
