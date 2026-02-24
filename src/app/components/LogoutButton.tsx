'use client';

export default function LogoutButton() {
  function handleLogout() {
    void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      globalThis.location.href = '/auth/login';
    });
  }

  return (
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  );
}
