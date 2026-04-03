'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SessionUser, InterviewSlot } from '@/lib/types';

export default function ApplicantPage() {
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
        if (json.data.role !== 'applicant') {
          router.replace(json.data.role === 'admin' ? '/admin' : '/interviewer');
          return;
        }
        setSession(json.data);
        return fetch('/api/slots');
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
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {/* 상단 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>
              면접 공고 목록
            </h1>
            <p style={{ fontSize: 14, color: '#8C8C8C' }}>참여 기업의 면접 슬롯을 확인하고 신청하세요.</p>
          </div>
          <Link
            href="/applicant/my"
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
            내 신청 현황
          </Link>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C8C8C' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>현재 등록된 면접 공고가 없습니다.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>곧 새로운 공고가 올라올 예정입니다.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SlotCard({ slot }: { slot: InterviewSlot }) {
  const dateStr = new Date(slot.interview_date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
  const isFull = (slot.application_count ?? 0) >= slot.capacity;

  return (
    <div
      style={{
        border: '1.5px solid #E8E8E8',
        borderRadius: 16,
        padding: 28,
        background: '#fff',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* 회사명 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', color: '#222' }}>
            {slot.company?.name ?? '참여 기업'}
          </span>
          <span
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
              background: slot.method === 'online' ? '#E8F4FD' : '#FFF3E0',
              color: slot.method === 'online' ? '#2563EB' : '#E65100',
            }}
          >
            {slot.method === 'online' ? '온라인' : '오프라인'}
          </span>
        </div>
        {slot.company?.description && (
          <p style={{ fontSize: 13, color: '#8C8C8C', lineHeight: 1.5, letterSpacing: '-0.2px' }}>
            {slot.company.description}
          </p>
        )}
      </div>

      {/* 면접 정보 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow icon="📅" label="날짜" value={dateStr} />
        <InfoRow icon="🕐" label="시간" value={`${slot.start_time} ~ ${slot.end_time}`} />
        {slot.location && <InfoRow icon="📍" label="장소" value={slot.location} />}
        <InfoRow
          icon="👥"
          label="인원"
          value={`${slot.application_count ?? 0} / ${slot.capacity}명 신청`}
        />
      </div>

      {/* 신청 버튼 */}
      {isFull ? (
        <div
          style={{
            height: 44, borderRadius: 10, background: '#F5F5F5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#8C8C8C',
          }}
        >
          마감
        </div>
      ) : (
        <Link
          href={`/applicant/apply/${slot.id}`}
          style={{
            height: 44, borderRadius: 10, background: '#222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
        >
          면접 신청하기
        </Link>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#8C8C8C', minWidth: 30 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{value}</span>
    </div>
  );
}
