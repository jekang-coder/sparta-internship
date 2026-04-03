import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.KAKAO_CLIENT_ID!;
  const redirectUri = process.env.KAKAO_REDIRECT_URI!;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname,account_email,phone_number',
  });

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(kakaoAuthUrl);
}
