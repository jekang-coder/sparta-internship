'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SessionUser, InterviewMethod } from '@/lib/types';

export default function RegisterSlotPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    interview_date: '',
    start_time: '',
    end_time: '',
    method: 'offline' as InterviewMethod,
    location: '',
    capacity: 1,
  });

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
        setLoading(false);
      })
      .catch(() => { router.replace('/login'); });
  }, [router]);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.interview_date) { setError('면접 날짜를 선택해주세요.'); return; }
    if (!form.start_time) { setError('시작 시간을 입력해주세요.'); return; }
    if (!form.end_time) { setError('종료 시간을 입력해주세요.'); return; }
    if (form.start_time >= form.end_time) { setError('종료 시간은 시작 시간 이후여야 합니다.'); return; }
    if (form.capacity < 1) { setError('모집 인원은 1명 이상이어야 합니다.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      router.push('/interviewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header session={session} />
      <main style={{ flex: 1, maxWidth: 600, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <Link
          href="/interviewer"
          style={{ fontSize: 14, color: '#8C8C8C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}
        >
          ← 내 공고 목록으로
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8 }}>
          면접 공고 등록
        </h1>
        <p style={{ fontSize: 14, color: '#8C8C8C', marginBottom: 32 }}>면접 일정과 방식을 등록하면 지원자가 신청할 수 있습니다.</p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              border: '1.5px solid #E8E8E8', borderRadius: 16, padding: 32,
              background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
              display: 'flex', flexDirection: 'column', gap: 24,
            }}
          >
            {/* 날짜 */}
            <FormField label="면접 날짜" required>
              <input
                type="date"
                value={form.interview_date}
                onChange={(e) => handleChange('interview_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
              />
            </FormField>

            {/* 시간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="시작 시간" required>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
                />
              </FormField>
              <FormField label="종료 시간" required>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
                />
              </FormField>
            </div>

            {/* 방식 */}
            <FormField label="면접 방식" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(['offline', 'online'] as InterviewMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleChange('method', method)}
                    style={{
                      height: 48, border: `1.5px solid ${form.method === method ? '#FA0030' : '#E8E8E8'}`,
                      borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      background: form.method === method ? '#FA0030' : '#fff',
                      color: form.method === method ? '#fff' : '#8C8C8C',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    {method === 'offline' ? '오프라인' : '온라인'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 장소 */}
            <FormField label={`장소${form.method === 'offline' ? '' : ' (링크)'}`}>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={form.method === 'offline' ? '예) 서울시 강남구 테헤란로 123' : '예) https://zoom.us/j/...'}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
              />
            </FormField>

            {/* 인원 */}
            <FormField label="모집 인원" required>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => handleChange('capacity', Math.max(1, form.capacity - 1))}
                  style={{
                    width: 40, height: 40, border: '1.5px solid #E8E8E8', borderRadius: 8,
                    background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', color: '#222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; }}
                >
                  −
                </button>
                <span style={{ fontSize: 18, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{form.capacity}</span>
                <button
                  type="button"
                  onClick={() => handleChange('capacity', form.capacity + 1)}
                  style={{
                    width: 40, height: 40, border: '1.5px solid #E8E8E8', borderRadius: 8,
                    background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', color: '#222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; }}
                >
                  +
                </button>
                <span style={{ fontSize: 13, color: '#8C8C8C' }}>명</span>
              </div>
            </FormField>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', height: 52, border: 'none', borderRadius: 10,
                background: submitting ? '#888' : '#222', color: '#fff',
                fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#FA0030'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#222'; }}
            >
              {submitting ? '등록 중...' : '면접 공고 등록하기'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, border: '1.5px solid #E8E8E8', borderRadius: 10,
  padding: '0 14px', fontSize: 14, color: '#222', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s', background: '#fff',
};

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        {label} {required && <span style={{ color: '#FA0030' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
