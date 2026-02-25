import Link from 'next/link';
import { getServerSession } from 'next-auth';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

const roleLabel: Record<'submitter' | 'evaluator' | 'admin', string> = {
  submitter: 'Submitter',
  evaluator: 'Evaluator',
  admin: 'Admin',
};

/**
 * Access denied page for role-protected routes.
 */
export default async function AccessDeniedPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;

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
