'use client';

import { useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load users');
          return;
        }
        setUsers(data.users ?? []);
        setCurrentUserId(data.currentUserId ?? null);
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update role');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );
    } catch {
      setError('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const isCurrentUser = (userId: string) =>
    currentUserId != null && userId === currentUserId;

  if (loading) {
    return <p className="text-[#64748b]">Loading users...</p>;
  }

  if (error) {
    return (
      <p className="text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (users.length === 0) {
    return <p className="text-[#64748b]">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <table className="w-full border-collapse border border-[#e2e8f0]">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="border border-[#e2e8f0] px-4 py-2 text-left text-sm font-semibold text-[#0f172a]">
              Email
            </th>
            <th className="border border-[#e2e8f0] px-4 py-2 text-left text-sm font-semibold text-[#0f172a]">
              Name
            </th>
            <th className="border border-[#e2e8f0] px-4 py-2 text-left text-sm font-semibold text-[#0f172a]">
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-[#f8fafc]">
              <td className="border border-[#e2e8f0] px-4 py-2 text-sm">
                {user.email}
              </td>
              <td className="border border-[#e2e8f0] px-4 py-2 text-sm">
                {user.name ?? '—'}
              </td>
              <td className="border border-[#e2e8f0] px-4 py-2 text-sm">
                {isCurrentUser(user.id) ? (
                  <span className="text-[#64748b]">
                    {user.role}
                    <span className="ml-1 text-xs">(you)</span>
                  </span>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingId === user.id}
                    className="rounded border border-[#e2e8f0] px-2 py-1 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5] disabled:bg-[#f1f5f9]"
                  >
                    <option value="submitter">Submitter</option>
                    <option value="evaluator">Evaluator</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
