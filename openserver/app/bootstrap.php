<?php
declare(strict_types=1);

function app_root(): string {
    return dirname(__DIR__, 2);
}

function load_env(): array {
    static $values = null;
    if ($values !== null) return $values;
    $values = [];
    $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
    if (!is_file($file)) return $values;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $values[trim($key)] = trim($value, " \t\n\r\0\x0B\"");
    }
    return $values;
}

function env_value(string $name, string $fallback = ''): string {
    $fromEnvironment = getenv($name);
    if ($fromEnvironment !== false && $fromEnvironment !== '') return $fromEnvironment;
    return load_env()[$name] ?? $fallback;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $host = env_value('DB_HOST', '127.0.0.1');
    $port = env_value('DB_PORT', '3306');
    $name = env_value('DB_NAME', 'studenthub_kz');
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, env_value('DB_USER', 'root'), env_value('DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function json_response(array $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_json(): array {
    $body = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($body)) json_response(['error' => 'Ожидается JSON-запрос.'], 400);
    return $body;
}

function value(array $data, string $key, string $fallback = ''): string {
    return trim((string)($data[$key] ?? $fallback));
}

function ensure_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('studenthub_session');
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
    session_start();
}

function current_user(): ?array {
    ensure_session();
    $id = $_SESSION['user_id'] ?? null;
    if (!is_int($id) && !ctype_digit((string)$id)) return null;
    $statement = db()->prepare('SELECT id, email, display_name, role FROM users WHERE id = ? LIMIT 1');
    $statement->execute([(int)$id]);
    return $statement->fetch() ?: null;
}

function require_user(): array {
    $user = current_user();
    if (!$user) json_response(['error' => 'Сначала войдите в аккаунт.'], 401);
    return $user;
}

function require_admin(): array {
    $user = require_user();
    if ($user['role'] !== 'admin') json_response(['error' => 'Доступ только для администратора.'], 403);
    return $user;
}

function configured_admin(string $email): bool {
    $emails = array_filter(array_map('trim', explode(',', strtolower(env_value('ADMIN_EMAILS')))));
    return in_array(strtolower($email), $emails, true);
}

function safe_slug(string $slug): string {
    $slug = strtolower(trim($slug));
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        json_response(['error' => 'Slug: используйте латинские буквы, цифры и дефисы.'], 422);
    }
    return $slug;
}

function safe_date(string $date, string $label): string {
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) {
        json_response(['error' => "{$label}: укажите дату в формате ГГГГ-ММ-ДД."], 422);
    }
    return $date;
}

function safe_https_url(string $url, bool $required = true): ?string {
    $url = trim($url);
    if ($url === '' && !$required) return null;
    if (!filter_var($url, FILTER_VALIDATE_URL) || !str_starts_with(strtolower($url), 'https://')) {
        json_response(['error' => 'Укажите безопасную ссылку HTTPS.'], 422);
    }
    return $url;
}

function escape_html(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
