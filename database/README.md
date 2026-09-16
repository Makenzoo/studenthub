# StudentHub KZ database

The deployed portal uses the D1-compatible SQLite migration in `../drizzle/0000_studenthub_initial.sql`.

`studenthub_kz.sql` remains as the original MySQL planning schema and is not used by the deployed application.

The production administrator allowlist is read only from the server-side `ADMIN_EMAILS` environment variable. It is never delivered to the browser.
