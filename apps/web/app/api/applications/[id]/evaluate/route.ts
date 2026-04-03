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

  const body = await request.json();
  const { score, comment, result } = body;

  if (score === undefined || score === null) {
    return NextResponse.json({ data: null, error: '점수를 입력해주세요.' }, { status: 400 });
  }

  if (result !== 'passed' && result !== 'failed') {
    return NextResponse.json({ data: null, error: '결과는 passed 또는 failed여야 합니다.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .update({
      score: Number(score),
      comment: comment ?? null,
      status: result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
