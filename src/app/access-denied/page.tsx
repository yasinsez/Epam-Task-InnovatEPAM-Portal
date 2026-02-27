import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/server/auth/route';

const roleLabel: Record<'submitter' | 'evaluator' | 'admin', string> = {
  submitter: 'Submitter',
  evaluator: 'Evaluator',
  admin: 'Admin',
};

/**
 * Access denied page for role-protected routes.
 * Redirects users with a valid role to their appropriate dashboard.
 */
export default async function AccessDeniedPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;

  // Redirect users with a valid role to their dashboard instead of showing access denied
  if (role === 'submitter') redirect('/dashboard/submitter');
  if (role === 'evaluator') redirect('/dashboard/evaluator');
  if (role === 'admin') redirect('/admin');

  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
      <p>
        Current role: <strong>{role ? roleLabel[role] : 'Unknown'}</strong>
      </p>
      <div>
        {!role && <Link href="/auth/login">Go to login</Link>}
        {role === 'submitter' && <Link href="/dashboard/submitter">Go to submitter dashboard</Link>}
        {role === 'evaluator' && <Link href="/dashboard/evaluator">Go to evaluator dashboard</Link>}
        {role === 'admin' && <Link href="/admin">Go to admin dashboard</Link>}
      </div>
    </main>
  );
}
