import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';

// GET: 내 신청 목록 (지원자용)
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'applicant') {
    return NextResponse.json({ data: null, error: '지원자만 접근할 수 있습니다.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      *,
      slot:interview_slots(
        *,
        company:companies(*)
      )
    `)
    .eq('applicant_id', session.userId)
    .order('applied_at', { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST: 면접 신청 (지원자용)
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'applicant') {
    return NextResponse.json({ data: null, error: '지원자만 신청할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json();
  const { slot_id } = body;

  if (!slot_id) {
    return NextResponse.json({ data: null, error: '슬롯 ID가 필요합니다.' }, { status: 400 });
  }

  // 이미 신청했는지 확인
  const { data: existing } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('applicant_id', session.userId)
    .eq('slot_id', slot_id)
    .single();

  if (existing) {
    return NextResponse.json({ data: null, error: '이미 신청한 면접입니다.' }, { status: 409 });
  }

  // 정원 확인
  const { data: slot } = await supabaseAdmin
    .from('interview_slots')
    .select('capacity')
    .eq('id', slot_id)
    .single();

  if (!slot) {
    return NextResponse.json({ data: null, error: '존재하지 않는 면접 슬롯입니다.' }, { status: 404 });
  }

  const { count: appCount } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slot_id)
    .neq('status', 'rejected');

  if (appCount !== null && appCount >= slot.capacity) {
    return NextResponse.json({ data: null, error: '정원이 마감되었습니다.' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert({
      applicant_id: session.userId,
      slot_id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}
