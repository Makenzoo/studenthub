<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

final class Api {
    public static function handle(string $path, string $method): never {
        try {
            if ($path === '/api/stats' && $method === 'GET') self::stats();
            if ($path === '/api/auth/session' && $method === 'GET') self::session();
            if ($path === '/api/auth/register' && $method === 'POST') self::register();
            if ($path === '/api/auth/login' && $method === 'POST') self::login();
            if ($path === '/api/auth/logout' && $method === 'POST') self::logout();
            if ($path === '/api/profile' && $method === 'GET') self::profile();
            if ($path === '/api/profile' && $method === 'POST') self::saveProfile();
            if ($path === '/api/favorites' && $method === 'GET') self::favorites();
            if ($path === '/api/favorites' && $method === 'POST') self::toggleFavorite();
            if ($path === '/api/admin/catalog' && $method === 'GET') self::adminCatalog();
            if (preg_match('#^/api/admin/(university|grant)$#', $path, $match) && $method === 'POST') self::saveCatalog($match[1]);
            if (preg_match('#^/api/catalog/(universities|university|grants|grant)(?:/([a-z0-9-]+))?$#', $path, $match) && $method === 'GET') {
                $type = str_starts_with($match[1], 'university') ? 'university' : 'grant';
                isset($match[2]) ? self::detail($type, $match[2]) : self::catalog($type);
            }
            json_response(['error' => 'Маршрут не найден.'], 404);
        } catch (PDOException $exception) {
            error_log($exception->getMessage());
            json_response(['error' => 'Не удалось подключиться к базе данных. Проверьте настройки Open Server.'], 503);
        }
    }

    private static function stats(): never {
        $count = (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
        json_response(['registeredUsers' => $count]);
    }

    private static function session(): never {
        json_response(['user' => current_user()]);
    }

    private static function register(): never {
        $body = request_json();
        $email = strtolower(value($body, 'email'));
        $password = (string)($body['password'] ?? '');
        $displayName = value($body, 'displayName');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'Введите корректный email.'], 422);
        if (mb_strlen($password) < 8) json_response(['error' => 'Пароль должен содержать не менее 8 символов.'], 422);
        if ($displayName === '') $displayName = strstr($email, '@', true) ?: $email;
        $role = configured_admin($email) ? 'admin' : 'student';
        try {
            $statement = db()->prepare('INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)');
            $statement->execute([$email, password_hash($password, PASSWORD_DEFAULT), mb_substr($displayName, 0, 80), $role]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') json_response(['error' => 'Этот email уже зарегистрирован.'], 409);
            throw $exception;
        }
        ensure_session();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)db()->lastInsertId();
        json_response(['ok' => true, 'user' => current_user()], 201);
    }

    private static function login(): never {
        $body = request_json();
        $email = strtolower(value($body, 'email'));
        $password = (string)($body['password'] ?? '');
        $statement = db()->prepare('SELECT id, email, password_hash, display_name, role FROM users WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $user = $statement->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_response(['error' => 'Неверный email или пароль.'], 401);
        }
        ensure_session();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        unset($user['password_hash']);
        json_response(['ok' => true, 'user' => $user]);
    }

    private static function logout(): never {
        ensure_session();
        $_SESSION = [];
        session_destroy();
        json_response(['ok' => true]);
    }

    private static function profile(): never {
        $user = require_user();
        $statement = db()->prepare('SELECT u.id, u.email, u.display_name, u.role, p.city, p.university_name, p.specialty, p.study_year FROM users u LEFT JOIN student_profiles p ON p.user_id = u.id WHERE u.id = ?');
        $statement->execute([$user['id']]);
        json_response(['profile' => $statement->fetch()]);
    }

    private static function saveProfile(): never {
        $user = require_user();
        $body = request_json();
        $name = mb_substr(value($body, 'displayName', $user['display_name']), 0, 80);
        if ($name === '') json_response(['error' => 'Укажите имя.'], 422);
        $year = value($body, 'studyYear');
        if ($year !== '' && (!ctype_digit($year) || (int)$year < 1 || (int)$year > 5)) json_response(['error' => 'Укажите курс от 1 до 5.'], 422);
        db()->prepare('UPDATE users SET display_name = ? WHERE id = ?')->execute([$name, $user['id']]);
        db()->prepare('INSERT INTO student_profiles (user_id, city, university_name, specialty, study_year) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE city=VALUES(city), university_name=VALUES(university_name), specialty=VALUES(specialty), study_year=VALUES(study_year)')
            ->execute([$user['id'], value($body, 'city'), value($body, 'university'), value($body, 'specialty'), $year === '' ? null : (int)$year]);
        json_response(['ok' => true]);
    }

    private static function catalog(string $type): never {
        $table = $type === 'university' ? 'universities' : 'grants';
        $query = trim((string)($_GET['q'] ?? ''));
        $city = trim((string)($_GET['city'] ?? ''));
        $sql = "SELECT * FROM {$table} WHERE is_published = 1";
        $params = [];
        if ($city !== '') { $sql .= ' AND city = ?'; $params[] = $city; }
        if ($query !== '') {
            $term = '%' . $query . '%';
            $sql .= $type === 'university' ? ' AND (name LIKE ? OR city LIKE ?)' : ' AND (title LIKE ? OR provider_name LIKE ? OR specialty LIKE ?)';
            $params = array_merge($params, $type === 'university' ? [$term, $term] : [$term, $term, $term]);
        }
        $sql .= $type === 'university' ? ' ORDER BY name ASC' : ' ORDER BY deadline ASC';
        $statement = db()->prepare($sql);
        $statement->execute($params);
        json_response(['items' => $statement->fetchAll()]);
    }

    private static function detail(string $type, string $slug): never {
        $table = $type === 'university' ? 'universities' : 'grants';
        $statement = db()->prepare("SELECT * FROM {$table} WHERE slug = ? AND is_published = 1 LIMIT 1");
        $statement->execute([$slug]);
        $item = $statement->fetch();
        if (!$item) json_response(['error' => 'Запись не найдена.'], 404);
        json_response(['item' => $item]);
    }

    private static function favorites(): never {
        $user = require_user();
        $sql = "SELECT f.item_type, f.item_id, f.created_at, u.name AS university_name, u.slug AS university_slug, u.city AS university_city, u.source_url AS university_source_url, g.title AS grant_title, g.slug AS grant_slug, g.provider_name, g.deadline, g.source_url AS grant_source_url FROM favorites f LEFT JOIN universities u ON f.item_type='university' AND f.item_id=u.id LEFT JOIN grants g ON f.item_type='grant' AND f.item_id=g.id WHERE f.user_id=? ORDER BY f.created_at DESC";
        $statement = db()->prepare($sql); $statement->execute([$user['id']]);
        json_response(['items' => $statement->fetchAll()]);
    }

    private static function toggleFavorite(): never {
        $user = require_user(); $body = request_json();
        $type = value($body, 'type'); $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
        if (!in_array($type, ['university', 'grant'], true) || !$id) json_response(['error' => 'Некорректная запись.'], 422);
        $check = db()->prepare('SELECT 1 FROM favorites WHERE user_id=? AND item_type=? AND item_id=?');
        $check->execute([$user['id'], $type, $id]);
        if ($check->fetchColumn()) {
            db()->prepare('DELETE FROM favorites WHERE user_id=? AND item_type=? AND item_id=?')->execute([$user['id'], $type, $id]);
            json_response(['saved' => false]);
        }
        db()->prepare('INSERT INTO favorites (user_id,item_type,item_id) VALUES (?,?,?)')->execute([$user['id'], $type, $id]);
        json_response(['saved' => true]);
    }

    private static function adminCatalog(): never {
        require_admin();
        json_response([
            'universities' => db()->query('SELECT * FROM universities ORDER BY updated_at DESC')->fetchAll(),
            'grants' => db()->query('SELECT * FROM grants ORDER BY updated_at DESC')->fetchAll(),
        ]);
    }

    private static function saveCatalog(string $type): never {
        $admin = require_admin(); $body = request_json(); $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT) ?: null;
        $checked = safe_date(value($body, 'checkedAt'), 'Дата проверки');
        $source = safe_https_url(value($body, 'sourceUrl'));
        $published = !isset($body['published']) || $body['published'] !== false ? 1 : 0;
        if ($type === 'university') {
            $name = value($body, 'name'); $city = value($body, 'city');
            if ($name === '' || $city === '' || value($body, 'description') === '') json_response(['error' => 'Заполните название, город и описание.'], 422);
            $fields = [safe_slug(value($body, 'slug')), $name, $city, value($body, 'kind'), safe_https_url(value($body, 'websiteUrl'), false), value($body, 'description'), $source, $checked, $published];
            $sql = $id ? 'UPDATE universities SET slug=?,name=?,city=?,type=?,website_url=?,description=?,source_url=?,checked_at=?,is_published=? WHERE id=?' : 'INSERT INTO universities (slug,name,city,type,website_url,description,source_url,checked_at,is_published,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)';
            $fields = $id ? [...$fields, $id] : [...$fields, $admin['id']];
        } else {
            $title = value($body, 'title'); $provider = value($body, 'providerName'); $eligibility = value($body, 'eligibility');
            if ($title === '' || $provider === '' || $eligibility === '') json_response(['error' => 'Заполните название, организацию и условия.'], 422);
            $fields = [safe_slug(value($body, 'slug')), $title, $provider, value($body, 'city'), value($body, 'specialty'), value($body, 'amountDescription'), $eligibility, safe_date(value($body, 'deadline'), 'Дедлайн'), safe_https_url(value($body, 'applicationUrl'), false), $source, $checked, $published];
            $sql = $id ? 'UPDATE grants SET slug=?,title=?,provider_name=?,city=?,specialty=?,amount_description=?,eligibility=?,deadline=?,application_url=?,source_url=?,checked_at=?,is_published=? WHERE id=?' : 'INSERT INTO grants (slug,title,provider_name,city,specialty,amount_description,eligibility,deadline,application_url,source_url,checked_at,is_published,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
            $fields = $id ? [...$fields, $id] : [...$fields, $admin['id']];
        }
        try { db()->prepare($sql)->execute($fields); } catch (PDOException $exception) { if ($exception->getCode() === '23000') json_response(['error' => 'Slug уже занят.'], 409); throw $exception; }
        $entityId = $id ?: (int)db()->lastInsertId();
        db()->prepare('INSERT INTO audit_log (actor_id,entity_type,entity_id,action) VALUES (?,?,?,?)')->execute([$admin['id'], $type, $entityId, $id ? 'updated' : 'created']);
        json_response(['ok' => true, 'id' => $entityId]);
    }
}
