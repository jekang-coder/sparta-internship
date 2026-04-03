import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0D1B2A',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '60px' }}>
          <div
            style={{
              width: '52px', height: '52px', background: '#FA0030',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 900,
            }}
          >
            S
          </div>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            SPARTA INTERVIEW
          </span>
        </div>

        {/* 메인 카피 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(250,0,48,0.15)', color: '#FA0030',
              fontSize: '16px', fontWeight: 700, padding: '8px 18px',
              borderRadius: '100px', width: 'fit-content',
              border: '1px solid rgba(250,0,48,0.3)',
            }}
          >
            팀스파르타 일경험 사업
          </div>
          <div style={{ fontSize: '64px', fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-2px' }}>
            면접 일정,<br />
            <span style={{ color: '#FA0030' }}>한 곳에서</span> 끝내세요
          </div>
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: '8px' }}>
            청년은 기업을 선택하고 · 기업은 일정을 등록하고 · 매니저는 현황을 확인
          </div>
        </div>

        {/* 하단 URL */}
        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)', marginTop: '40px' }}>
          sparta-internship-iota.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
