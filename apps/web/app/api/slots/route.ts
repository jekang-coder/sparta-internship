import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSession } from '@/lib/session';

// GET: 전체 슬롯 목록 (지원자용)
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('interview_slots')
    .select(`
      *,
      company:companies(*),
      application_count:applications(count)
    `)
    .order('interview_date', { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // application_count를 숫자로 변환
  const slots = data?.map((slot: Record<string, unknown>) => ({
    ...slot,
    application_count: Array.isArray(slot.application_count)
      ? (slot.application_count[0] as { count: number })?.count ?? 0
      : slot.application_count ?? 0,
  }));

  return NextResponse.json({ data: slots, error: null });
}

// POST: 슬롯 등록 (면접관용)
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (session.role !== 'interviewer') {
    return NextResponse.json({ data: null, error: '면접관만 슬롯을 등록할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json();
  const { interview_date, start_time, end_time, method, location, capacity } = body;

  if (!interview_date || !start_time || !end_time || !method || !capacity) {
    return NextResponse.json({ data: null, error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }

  // 면접관의 company 조회
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('user_id', session.userId)
    .single();

  if (companyError || !company) {
    return NextResponse.json({ data: null, error: '등록된 기업 정보가 없습니다.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('interview_slots')
    .insert({
      company_id: company.id,
      interview_date,
      start_time,
      end_time,
      method,
      location: location || null,
      capacity: Number(capacity),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}
