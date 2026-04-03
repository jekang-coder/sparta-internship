import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';

// GET: 내가 등록한 슬롯 목록 (면접관용)
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'interviewer') {
    return NextResponse.json({ data: null, error: '면접관만 접근할 수 있습니다.' }, { status: 403 });
  }

  // 면접관의 company 조회
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (companyError || !company) {
    // 등록된 기업이 없으면 빈 목록 반환
    return NextResponse.json({ data: [], error: null });
  }

  const { data, error } = await supabaseAdmin
    .from('interview_slots')
    .select(`
      *,
      company:companies(*),
      application_count:applications(count)
    `)
    .eq('company_id', company.id)
    .order('interview_date', { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  const slots = data?.map((slot: Record<string, unknown>) => ({
    ...slot,
    application_count: Array.isArray(slot.application_count)
      ? (slot.application_count[0] as { count: number })?.count ?? 0
      : slot.application_count ?? 0,
  }));

  return NextResponse.json({ data: slots, error: null });
}
