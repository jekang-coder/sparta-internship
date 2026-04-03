import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';

// GET: 슬롯별 지원자 목록 (면접관용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'interviewer' && session.role !== 'admin') {
    return NextResponse.json({ data: null, error: '권한이 없습니다.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      *,
      applicant:users(*),
      slot:interview_slots(
        *,
        company:companies(*)
      )
    `)
    .eq('slot_id', slotId)
    .order('applied_at', { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
