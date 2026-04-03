import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { serializeSession } from '@/lib/session';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    // 1. 코드 → 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('토큰 교환 실패');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. 유저 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error('유저 정보 조회 실패');
    }

    const kakaoUser = await userRes.json();
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? '이름없음';
    const email = kakaoUser.kakao_account?.email ?? null;
    const phone = kakaoUser.kakao_account?.phone_number ?? null;

    // 3. role 결정
    let role: UserRole = 'applicant';
    if (email && email.endsWith('@teamsparta.co')) {
      role = 'admin';
    }

    // 4. Supabase upsert
    const { data: userData, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          kakao_id: kakaoId,
          email,
          name: nickname,
          role,
          phone,
        },
        { onConflict: 'kakao_id', ignoreDuplicates: false }
      )
      .select('id, role, name')
      .single();

    if (upsertError || !userData) {
      throw new Error('유저 저장 실패: ' + upsertError?.message);
    }

    // 5. 세션 쿠키 저장
    const session = serializeSession({
      userId: userData.id,
      role: userData.role as UserRole,
      name: userData.name,
    });

    // 6. 역할별 리다이렉트
    let redirectPath = '/applicant';
    if (userData.role === 'admin') redirectPath = '/admin';
    else if (userData.role === 'interviewer') redirectPath = '/interviewer';

    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.set('user_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('카카오 콜백 에러:', err);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}
