'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/types';

interface HeaderProps {
  session?: SessionUser | null;
}

const ROLE_LABELS: Record<string, string> = {
  applicant: '지원자',
  interviewer: '면접관',
  admin: '운영 매니저',
};

const ROLE_HOME: Record<string, string> = {
  applicant: '/applicant',
  interviewer: '/interviewer',
  admin: '/admin',
};

export default function Header({ session }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout');
    router.push('/login');
  }

  const homeHref = session ? (ROLE_HOME[session.role] ?? '/') : '/';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '60px',
        background: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.11)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
      }}
    >
      <Link
        href={homeHref}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: '#222',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: '#FA0030',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          S
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>
          <span style={{ color: '#FA0030' }}>SPARTA</span> INTERVIEW
        </span>
      </Link>

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontSize: 13,
              color: '#8C8C8C',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: '#F5F5F5',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                color: '#FA0030',
              }}
            >
              {ROLE_LABELS[session.role] ?? session.role}
            </span>
            {session.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #E8E8E8',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#222',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E8E8E8';
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
