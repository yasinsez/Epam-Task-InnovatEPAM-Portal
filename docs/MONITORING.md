# Monitoring Queries

Suggested metrics for authentication monitoring:

- Registration volume per hour/day (`AuthLog.action = register`).
- Login success/failure ratio (`AuthLog.action = login`, grouped by `status`).
- Failed login spikes and brute-force candidates (`FailedLoginAttempt` + warning logs).
- Password reset request and completion rates (`AuthLog.action = password_reset`).
- Token refresh frequency (`AuthLog.action = token_refresh` once enabled at endpoint level).
- Active sessions by user/device from `Session` table.
