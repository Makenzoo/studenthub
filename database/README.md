# StudentHub KZ database

`studenthub_kz.sql` is the MySQL 8.0+ schema used by the Open Server version of StudentHub KZ. It contains no catalogue entries or user accounts.

Import it through phpMyAdmin, then configure `openserver/.env` with the database credentials and your `ADMIN_EMAILS` value. The same schema is kept at `openserver/database/schema.sql` beside the PHP application for convenience.

The cloud deployment still uses its own D1-compatible migration in `../drizzle/0000_studenthub_initial.sql`. Do not copy passwords, API keys, or email allowlists into SQL, HTML, or JavaScript files.
