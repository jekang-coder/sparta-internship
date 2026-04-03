'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SessionUser, InterviewSlot } from '@/lib/types';

export default function InterviewerPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) { router.replace('/login'); return; }
        if (json.data.role !== 'interviewer') {
          router.replace(json.data.role === 'admin' ? '/admin' : '/applicant');
          return;
        }
        setSession(json.data);
        return fetch('/api/slots/my');
      })
      .then((r) => r?.json())
      .then((json) => {
        if (json?.data) setSlots(json.data);
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
      <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>내 면접 공고</h1>
            <p style={{ fontSize: 14, color: '#8C8C8C' }}>등록한 면접 슬롯과 지원자 현황을 확인하세요.</p>
          </div>
          <Link
            href="/interviewer/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 44, padding: '0 20px',
              background: '#222', color: '#fff', borderRadius: 10,
              fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
          >
            + 면접 공고 등록
          </Link>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C8C8C' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>등록된 면접 공고가 없습니다.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>면접 공고를 등록하고 지원자를 받아보세요!</p>
            <Link
              href="/interviewer/register"
              style={{
                display: 'inline-block', marginTop: 20, padding: '10px 24px',
                background: '#222', color: '#fff', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
            >
              공고 등록하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {slots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SlotRow({ slot }: { slot: InterviewSlot }) {
  const dateStr = new Date(slot.interview_date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
  const fillRate = slot.capacity > 0 ? Math.round(((slot.application_count ?? 0) / slot.capacity) * 100) : 0;

  return (
    <div
      style={{
        border: '1.5px solid #E8E8E8',
        borderRadius: 16,
        padding: '24px 28px',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px' }}>
            {slot.company?.name ?? '내 기업'}
          </span>
          <span
            style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              background: slot.method === 'online' ? '#E8F4FD' : '#FFF3E0',
              color: slot.method === 'online' ? '#2563EB' : '#E65100',
            }}
          >
            {slot.method === 'online' ? '온라인' : '오프라인'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#8C8C8C' }}>{dateStr}</span>
          <span style={{ fontSize: 13, color: '#8C8C8C' }}>{slot.start_time} ~ {slot.end_time}</span>
          {slot.location && <span style={{ fontSize: 13, color: '#8C8C8C' }}>{slot.location}</span>}
        </div>
      </div>

      {/* 신청 현황 */}
      <div style={{ textAlign: 'center', minWidth: 100 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#222', letterSpacing: '-0.5px' }}>
          {slot.application_count ?? 0}
          <span style={{ fontSize: 14, color: '#8C8C8C', fontWeight: 600 }}>/{slot.capacity}</span>
        </p>
        <p style={{ fontSize: 12, color: '#8C8C8C', marginTop: 2 }}>신청자 / 정원</p>
        <div style={{ width: '100%', height: 4, background: '#F5F5F5', borderRadius: 2, marginTop: 8 }}>
          <div
            style={{
              width: `${fillRate}%`, height: '100%',
              background: fillRate >= 100 ? '#FA0030' : '#222',
              borderRadius: 2, transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <Link
        href={`/interviewer/applicants/${slot.id}`}
        style={{
          display: 'inline-flex', alignItems: 'center',
          height: 40, padding: '0 18px',
          border: '1.5px solid #E8E8E8', borderRadius: 10,
          fontSize: 14, fontWeight: 600, color: '#222',
          textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; }}
      >
        지원자 관리
      </Link>
    </div>
  );
}
