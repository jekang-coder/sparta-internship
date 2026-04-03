'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SessionUser, InterviewSlot } from '@/lib/types';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = params.slotId as string;

  const [session, setSession] = useState<SessionUser | null>(null);
  const [slot, setSlot] = useState<InterviewSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        return fetch('/api/slots');
      })
      .then((r) => r?.json())
      .then((json) => {
        if (json?.data) {
          const found = json.data.find((s: InterviewSlot) => s.id === slotId);
          if (found) setSlot(found);
          else setError('해당 면접 슬롯을 찾을 수 없습니다.');
        }
        setLoading(false);
      })
      .catch(() => { setError('데이터를 불러오지 못했습니다.'); setLoading(false); });
  }, [router, slotId]);

  async function handleApply() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #F5F5F5', borderTopColor: '#FA0030', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header session={session} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 12 }}>면접 신청 완료!</h1>
          <p style={{ fontSize: 15, color: '#8C8C8C', marginBottom: 32 }}>
            면접 신청이 완료되었습니다.<br />
            승인 여부는 내 신청 현황에서 확인하세요.
          </p>
          <Link
            href="/applicant/my"
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: '#222', color: '#fff', borderRadius: 10,
              fontSize: 15, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
          >
            내 신청 현황 보기
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header session={session} />
      <main style={{ flex: 1, maxWidth: 560, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <Link
          href="/applicant"
          style={{ fontSize: 14, color: '#8C8C8C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}
        >
          ← 공고 목록으로
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8 }}>
          면접 신청 확인
        </h1>
        <p style={{ fontSize: 14, color: '#8C8C8C', marginBottom: 32 }}>아래 면접 정보를 확인하고 신청하세요.</p>

        {slot && (
          <div style={{ border: '1.5px solid #E8E8E8', borderRadius: 16, padding: 28, background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.5px' }}>
              {slot.company?.name ?? '참여 기업'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <DetailRow label="면접 날짜">
                {new Date(slot.interview_date).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
                })}
              </DetailRow>
              <DetailRow label="면접 시간">{slot.start_time} ~ {slot.end_time}</DetailRow>
              <DetailRow label="면접 방식">
                <span style={{ padding: '2px 8px', borderRadius: 6, background: slot.method === 'online' ? '#E8F4FD' : '#FFF3E0', color: slot.method === 'online' ? '#2563EB' : '#E65100', fontSize: 13, fontWeight: 700 }}>
                  {slot.method === 'online' ? '온라인' : '오프라인'}
                </span>
              </DetailRow>
              {slot.location && <DetailRow label="장소">{slot.location}</DetailRow>}
              <DetailRow label="남은 자리">
                {slot.capacity - (slot.application_count ?? 0)}명 / {slot.capacity}명
              </DetailRow>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/applicant"
            style={{
              flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 15, fontWeight: 600,
              color: '#222', textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; }}
          >
            취소
          </Link>
          <button
            onClick={handleApply}
            disabled={submitting || !slot}
            style={{
              flex: 2, height: 52, border: 'none', borderRadius: 10,
              background: submitting ? '#888' : '#222', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#FA0030'; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#222'; }}
          >
            {submitting ? '신청 중...' : '면접 신청하기'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#8C8C8C', minWidth: 70 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{children}</span>
    </div>
  );
}
