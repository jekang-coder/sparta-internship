'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { SessionUser, Application, ApplicationStatus } from '@/lib/types';

export default function SlotApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = params.slotId as string;

  const [session, setSession] = useState<SessionUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 평가 폼 상태
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({ score: '', comment: '', result: 'passed' as 'passed' | 'failed' });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const meRes = await fetch('/api/auth/me');
      const meJson = await meRes.json();
      if (!meJson.data) { router.replace('/login'); return; }
      if (meJson.data.role !== 'interviewer') {
        router.replace(meJson.data.role === 'admin' ? '/admin' : '/applicant');
        return;
      }
      setSession(meJson.data);

      const res = await fetch(`/api/applications/slot/${slotId}`);
      const json = await res.json();
      if (json.data) setApplications(json.data);
      else if (json.error) setError(json.error);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(appId: string, action: 'approve' | 'reject') {
    setActionLoading(appId + action);
    try {
      const res = await fetch(`/api/applications/${appId}/${action}`, { method: 'PATCH' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status: (action === 'approve' ? 'approved' : 'rejected') as ApplicationStatus } : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEvaluate(appId: string) {
    if (!evalForm.score) { setError('점수를 입력해주세요.'); return; }
    setActionLoading(appId + 'eval');
    try {
      const res = await fetch(`/api/applications/${appId}/evaluate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: Number(evalForm.score),
          comment: evalForm.comment,
          result: evalForm.result,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status: evalForm.result as ApplicationStatus, score: Number(evalForm.score), comment: evalForm.comment }
            : a
        )
      );
      setEvaluating(null);
      setEvalForm({ score: '', comment: '', result: 'passed' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '평가에 실패했습니다.');
    } finally {
      setActionLoading(null);
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
      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <Link
          href="/interviewer"
          style={{ fontSize: 14, color: '#8C8C8C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}
        >
          ← 내 공고 목록으로
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8 }}>지원자 관리</h1>
        <p style={{ fontSize: 14, color: '#8C8C8C', marginBottom: 32 }}>
          총 <strong>{applications.length}</strong>명이 신청했습니다.
        </p>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, fontSize: 14, color: '#DC2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C8C8C' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>아직 신청한 지원자가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {applications.map((app) => (
              <ApplicantCard
                key={app.id}
                application={app}
                actionLoading={actionLoading}
                evaluating={evaluating}
                evalForm={evalForm}
                onApprove={() => handleAction(app.id, 'approve')}
                onReject={() => handleAction(app.id, 'reject')}
                onStartEval={() => { setEvaluating(app.id); setError(''); }}
                onCancelEval={() => { setEvaluating(null); setEvalForm({ score: '', comment: '', result: 'passed' }); }}
                onEvalFormChange={(field, val) => setEvalForm((prev) => ({ ...prev, [field]: val }))}
                onSubmitEval={() => handleEvaluate(app.id)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface ApplicantCardProps {
  application: Application;
  actionLoading: string | null;
  evaluating: string | null;
  evalForm: { score: string; comment: string; result: string };
  onApprove: () => void;
  onReject: () => void;
  onStartEval: () => void;
  onCancelEval: () => void;
  onEvalFormChange: (field: string, val: string) => void;
  onSubmitEval: () => void;
}

function ApplicantCard({
  application, actionLoading, evaluating, evalForm,
  onApprove, onReject, onStartEval, onCancelEval, onEvalFormChange, onSubmitEval,
}: ApplicantCardProps) {
  const isEvaluating = evaluating === application.id;
  const appliedStr = new Date(application.applied_at).toLocaleDateString('ko-KR');

  return (
    <div style={{ border: '1.5px solid #E8E8E8', borderRadius: 16, padding: '24px 28px', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
            {application.applicant?.name ?? '지원자'}
          </p>
          <p style={{ fontSize: 12, color: '#8C8C8C' }}>
            {application.applicant?.email ?? ''} · 신청일: {appliedStr}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* 평가 결과 표시 */}
      {(application.status === 'passed' || application.status === 'failed') && (
        <div style={{ padding: '12px 16px', background: '#F9F9F9', borderRadius: 10, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            점수: {application.score}점
          </p>
          {application.comment && (
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{application.comment}</p>
          )}
        </div>
      )}

      {/* 평가 폼 */}
      {isEvaluating && (
        <div style={{ padding: '20px', background: '#F9F9F9', borderRadius: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                점수 <span style={{ color: '#FA0030' }}>*</span>
              </label>
              <input
                type="number" min={0} max={100}
                value={evalForm.score}
                onChange={(e) => onEvalFormChange('score', e.target.value)}
                placeholder="0 ~ 100"
                style={{ width: '100%', height: 40, border: '1.5px solid #E8E8E8', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>결과</label>
              <div style={{ display: 'flex', gap: 8, height: 40 }}>
                {(['passed', 'failed'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onEvalFormChange('result', r)}
                    style={{
                      flex: 1, border: `1.5px solid ${evalForm.result === r ? (r === 'passed' ? '#059669' : '#DC2626') : '#E8E8E8'}`,
                      borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: evalForm.result === r ? (r === 'passed' ? '#ECFDF5' : '#FEE2E2') : '#fff',
                      color: evalForm.result === r ? (r === 'passed' ? '#059669' : '#DC2626') : '#8C8C8C',
                    }}
                  >
                    {r === 'passed' ? '합격' : '불합격'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>코멘트</label>
            <textarea
              value={evalForm.comment}
              onChange={(e) => onEvalFormChange('comment', e.target.value)}
              placeholder="면접 평가 코멘트를 입력하세요 (선택)"
              style={{
                width: '100%', height: 80, border: '1.5px solid #E8E8E8', borderRadius: 8, padding: '10px 12px',
                fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
              onFocus={(e) => { e.target.style.borderColor = '#FA0030'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8E8'; }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancelEval}
              style={{
                flex: 1, height: 38, border: '1.5px solid #E8E8E8', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#222', background: '#fff', fontFamily: 'inherit',
              }}
            >
              취소
            </button>
            <button
              onClick={onSubmitEval}
              disabled={actionLoading === application.id + 'eval'}
              style={{
                flex: 2, height: 38, border: 'none', borderRadius: 8,
                background: '#222', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
            >
              {actionLoading === application.id + 'eval' ? '저장 중...' : '평가 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {!isEvaluating && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {application.status === 'pending' && (
            <>
              <ActionBtn
                label="승인"
                color="#059669"
                bg="#ECFDF5"
                disabled={!!actionLoading}
                loading={actionLoading === application.id + 'approve'}
                onClick={onApprove}
              />
              <ActionBtn
                label="거절"
                color="#DC2626"
                bg="#FEE2E2"
                disabled={!!actionLoading}
                loading={actionLoading === application.id + 'reject'}
                onClick={onReject}
              />
            </>
          )}
          {application.status === 'approved' && (
            <ActionBtn
              label="면접 완료 처리"
              color="#7C3AED"
              bg="#F3E8FF"
              disabled={!!actionLoading}
              loading={actionLoading === application.id + 'approve'}
              onClick={onApprove}
            />
          )}
          {(application.status === 'approved' || application.status === 'interview_done') && (
            <button
              onClick={onStartEval}
              style={{
                height: 36, padding: '0 16px', border: 'none', borderRadius: 8,
                background: '#222', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FA0030'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; }}
            >
              결과 평가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label, color, bg, disabled, loading, onClick,
}: {
  label: string; color: string; bg: string; disabled: boolean; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36, padding: '0 16px', border: `1.5px solid ${color}`,
        borderRadius: 8, fontSize: 13, fontWeight: 700,
        background: bg, color: color,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.15s',
      }}
    >
      {loading ? '처리 중...' : label}
    </button>
  );
}
