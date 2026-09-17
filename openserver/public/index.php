<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/bootstrap.php';

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (str_starts_with($path, '/api/')) {
    require_once __DIR__ . '/../app/Api.php';
    Api::handle($path, $method);
}
if ($path === '/admin' || $path === '/admin/') {
    require_once __DIR__ . '/../app/AdminPage.php';
    render_admin_page();
}
if ($method !== 'GET' && $method !== 'HEAD') { http_response_code(405); exit; }
$dist = realpath(app_root() . '/dist');
$asset = $path === '/' ? '/index.html' : $path;
$candidate = realpath($dist . DIRECTORY_SEPARATOR . ltrim($asset, '/\\'));
if ($candidate && str_starts_with($candidate, $dist . DIRECTORY_SEPARATOR) && is_file($candidate)) {
    $extensions = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'js' => 'application/javascript; charset=utf-8', 'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp'];
    $extension = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($extensions[$extension] ?? 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    if ($method === 'GET') readfile($candidate);
    exit;
}
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
echo '<h1>Страница не найдена</h1><p><a href="/">На главную</a></p>';
