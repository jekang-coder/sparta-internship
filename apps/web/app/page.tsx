import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { parseSession } from '@/lib/session';

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'admin') {
    redirect('/admin');
  } else if (session.role === 'interviewer') {
    redirect('/interviewer');
  } else {
    redirect('/applicant');
  }
}
