// TODO: 카카오 로그인 구현 후 이 파일 삭제
// 개발용 목 로그인 — 역할 선택만으로 세션 생성

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { serializeSession } from '@/lib/session';
import { UserRole } from '@/lib/types';

const MOCK_USERS: Record<UserRole, { kakao_id: string; name: string; email: string }> = {
  applicant: { kakao_id: 'mock_applicant_001', name: '테스트 지원자', email: 'applicant@test.com' },
  interviewer: { kakao_id: 'mock_interviewer_001', name: '테스트 면접관', email: 'interviewer@test.com' },
  admin: { kakao_id: 'mock_admin_001', name: '테스트 매니저', email: 'admin@teamsparta.co' },
};

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json() as { role: UserRole };

    if (!['applicant', 'interviewer', 'admin'].includes(role)) {
      return NextResponse.json({ data: null, error: '유효하지 않은 역할입니다.' }, { status: 400 });
    }

    const mockUser = MOCK_USERS[role];

    // Supabase에 목 유저 upsert
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .upsert(
        { kakao_id: mockUser.kakao_id, name: mockUser.name, email: mockUser.email, role },
        { onConflict: 'kakao_id', ignoreDuplicates: false }
      )
      .select('id, role, name')
      .single();

    if (error || !userData) {
      throw new Error('유저 생성 실패: ' + error?.message);
    }

    // 면접관이면 기업 데이터도 생성 (없을 때만)
    if (role === 'interviewer') {
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (!existing) {
        const { error: companyError } = await supabaseAdmin
          .from('companies')
          .insert({ user_id: userData.id, name: '테스트 기업', description: '개발용 목 기업 데이터' });
        if (companyError) {
          console.error('기업 생성 실패:', companyError.message);
        }
      }
    }

    const session = serializeSession({
      userId: userData.id,
      role: userData.role as UserRole,
      name: userData.name,
    });

    const response = NextResponse.json({ data: { role: userData.role }, error: null });
    response.cookies.set('user_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[mock-login error]', err);
    return NextResponse.json({ data: null, error: '로그인에 실패했습니다.' }, { status: 500 });
  }
}
