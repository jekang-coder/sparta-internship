import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';
import { ApplicationStatus, DashboardData, DelayedCase } from '@/lib/types';

const ALL_STATUSES: ApplicationStatus[] = [
  'pending', 'approved', 'rejected', 'interview_done', 'passed', 'failed',
];

// 지연 기준: pending 3일, approved 7일, interview_done 3일
const DELAY_THRESHOLDS: Partial<Record<ApplicationStatus, number>> = {
  pending: 3,
  approved: 7,
  interview_done: 3,
};

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ data: null, error: '어드민만 접근할 수 있습니다.' }, { status: 403 });
  }

  // 단계별 건수
  const counts: Record<ApplicationStatus, number> = {} as Record<ApplicationStatus, number>;
  for (const status of ALL_STATUSES) {
    const { count } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    counts[status] = count ?? 0;
  }

  // 지연 케이스 조회
  const now = new Date();
  const delayedCases: DelayedCase[] = [];

  for (const [status, threshold] of Object.entries(DELAY_THRESHOLDS)) {
    const cutoff = new Date(now.getTime() - threshold * 24 * 60 * 60 * 1000);

    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        updated_at,
        applicant:users!applicant_id(name),
        slot:interview_slots(
          interview_date,
          company:companies(name)
        )
      `)
      .eq('status', status)
      .lt('updated_at', cutoff.toISOString());

    if (apps) {
      for (const app of apps) {
        const updatedAt = new Date(app.updated_at);
        const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        const applicant = Array.isArray(app.applicant) ? app.applicant[0] : app.applicant;
        const slot = Array.isArray(app.slot) ? app.slot[0] : app.slot;
        const company = slot?.company ? (Array.isArray(slot.company) ? slot.company[0] : slot.company) : null;

        delayedCases.push({
          id: app.id,
          applicant_name: applicant?.name ?? '이름없음',
          company_name: company?.name ?? '기업명없음',
          status: app.status as ApplicationStatus,
          days_since_update: daysSince,
          slot_date: slot?.interview_date ?? '',
        });
      }
    }
  }

  // 지연 일수 내림차순 정렬
  delayedCases.sort((a, b) => b.days_since_update - a.days_since_update);

  const dashboardData: DashboardData = { counts, delayed: delayedCases };

  return NextResponse.json({ data: dashboardData, error: null });
}
