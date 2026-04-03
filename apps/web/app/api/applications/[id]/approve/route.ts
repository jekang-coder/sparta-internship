import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'interviewer' && session.role !== 'admin') {
    return NextResponse.json({ data: null, error: '권한이 없습니다.' }, { status: 403 });
  }

  // 현재 상태 확인
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('status')
    .eq('id', id)
    .single();

  // approved → interview_done 전환도 이 엔드포인트 처리
  const newStatus = app?.status === 'approved' ? 'interview_done' : 'approved';

  const { data, error } = await supabaseAdmin
    .from('applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
