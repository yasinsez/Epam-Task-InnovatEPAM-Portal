import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/server/auth/route';

/**
 * Redirects to role-specific dashboards.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;

  if (!role) {
    redirect('/auth/login');
  }

  if (role === 'submitter') {
    redirect('/dashboard/submitter');
  }

  if (role === 'evaluator') {
    redirect('/dashboard/evaluator');
  }

  if (role === 'admin') {
    redirect('/admin');
  }

  redirect('/access-denied');
}
