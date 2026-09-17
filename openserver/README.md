# StudentHub KZ on Open Server

This directory contains the PHP 8.1+ and MySQL 8.0+ server version of the portal. The current cloud deployment is independent from this local version; Open Server runs the PHP version on your computer.

## Start locally

1. Put this repository in an Open Server domain or add a local domain whose document root is `openserver/public`.
2. Start Apache or Nginx and MySQL in Open Server. Enable PHP 8.1+ with the `pdo_mysql` extension.
3. Open phpMyAdmin and import `openserver/database/schema.sql` once. It creates an empty `studenthub_kz` database.
4. Copy `openserver/.env.example` to `openserver/.env`. Set the MySQL password if your Open Server configuration has one. Set `ADMIN_EMAILS` to your own email address.
5. Open the local domain in a browser, register using that email, then visit `/admin` to manage universities and grants.

Do not place passwords or other secrets in JavaScript, HTML, or Git. The local `.env` file is ignored by Git.

## Available endpoints

The frontend uses the same local origin and calls these routes:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/session`, `GET|POST /api/profile`, `GET /api/stats`
- `GET /api/catalog/universities`, `GET /api/catalog/grants`
- `GET|POST /api/favorites`
- `GET /api/admin/catalog`, `POST /api/admin/university`, `POST /api/admin/grant`

Catalogues begin empty by design. Add only verified records from official HTTPS sources, together with their verification date and, for grants, deadline.
