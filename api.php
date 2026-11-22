<?php
/**
 * ==========================================================================
 * BARWETA RECORDS — API Backend Sécurité Maximale (Compatible OVH PHP / MySQL)
 * ==========================================================================
 * Protections actives :
 * 1. Mot de passe chiffré irréversiblement avec BCRYPT (coût 12) + timing constant
 * 2. Protection Anti-Bruteforce par IP (verrouillage 15 min après 5 échecs)
 * 3. Session durcie (HttpOnly, SameSite=Strict, Secure sur HTTPS, Timeout 30 min,
 *    vérification d'empreinte User-Agent)
 * 4. Protection Anti-CSRF par jeton cryptographique (256 bits) sur chaque requête POST
 * 5. Validation binaire stricte des images (getimagesize + MIME réel + taille max 3 Mo)
 * 6. Nettoyage strict des textes et échappement Anti-XSS
 */

// Configuration stricte des cookies de session avant session_start()
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict'
]);

session_start();

// En-têtes de sécurité HTTP
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// ==========================================================================
// 1. CONFIGURATION MYSQL OVH (À remplir lors de la mise en ligne sur OVH)
// ==========================================================================
define('USE_MYSQL_OVH', false); // Passez à true sur OVH une fois vos identifiants MySQL remplis
define('DB_HOST', 'votre_serveur.mysql.db');
define('DB_NAME', 'votre_base_ovh');
define('DB_USER', 'votre_utilisateur_ovh');
define('DB_PASS', 'votre_mot_de_passe_mysql');

// Paramètres de sécurité
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION_SECONDS', 900); // 15 minutes de blocage après 5 échecs
define('SESSION_TIMEOUT_SECONDS', 1800); // Déconnexion auto après 30 min d'inactivité
define('MAX_IMAGE_BYTES', 3 * 1024 * 1024); // 3 Mo max par photo

// Dossiers de stockage sécurisés (protégés par .htaccess)
define('DATA_DIR', __DIR__ . '/data');
define('ADMIN_FILE', DATA_DIR . '/admin_credentials.php');
define('VINYLS_FILE', DATA_DIR . '/vinyls_db.json');
define('RATE_LIMIT_FILE', DATA_DIR . '/rate_limit.json');
define('UPLOADS_DIR', __DIR__ . '/uploads');

if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0750, true);
}
if (!is_dir(UPLOADS_DIR)) {
    mkdir(UPLOADS_DIR, 0750, true);
}

// ==========================================================================
// 2. GESTION DU JETON ANTI-CSRF & DE LA SESSION DURCIE
// ==========================================================================
function getCsrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(): void {
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $sessionToken = $_SESSION['csrf_token'] ?? '';
    if ($sessionToken === '' || $headerToken === '' || !hash_equals($sessionToken, $headerToken)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Jeton de sécurité CSRF invalide. Rechargez la page.']);
        exit;
    }
}

function isVendorAuthenticated(): bool {
    if (empty($_SESSION['barweta_vendor_authenticated'])) {
        return false;
    }
    // Vérification du timeout d'inactivité (30 min)
    $lastActivity = $_SESSION['barweta_last_activity'] ?? 0;
    if (time() - $lastActivity > SESSION_TIMEOUT_SECONDS) {
        $_SESSION = [];
        session_destroy();
        return false;
    }
    // Vérification de l'empreinte du navigateur (anti-vol de session)
    $currentUaHash = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
    if (empty($_SESSION['barweta_ua_hash']) || !hash_equals($_SESSION['barweta_ua_hash'], $currentUaHash)) {
        $_SESSION = [];
        session_destroy();
        return false;
    }
    $_SESSION['barweta_last_activity'] = time();
    return true;
}

function requireVendorAuth(): void {
    verifyCsrfToken();
    if (!isVendorAuthenticated()) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Session expirée ou non autorisée. Veuillez vous reconnecter.']);
        exit;
    }
}

// ==========================================================================
// 3. PROTECTION ANTI-BRUTEFORCE (BLOCAGE IP APRÈS 5 ESSAIS RATÉS)
// ==========================================================================
function getClientIpHash(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return hash('sha256', 'barweta_salt_' . $ip);
}

function loadRateLimits(): array {
    if (!file_exists(RATE_LIMIT_FILE)) {
        return [];
    }
    $data = json_decode((string)file_get_contents(RATE_LIMIT_FILE), true);
    return is_array($data) ? $data : [];
}

function saveRateLimits(array $limits): void {
    file_put_contents(RATE_LIMIT_FILE, json_encode($limits, JSON_PRETTY_PRINT), LOCK_EX);
}

function checkBruteForce(): void {
    $ipHash = getClientIpHash();
    $limits = loadRateLimits();
    $now = time();

    if (isset($limits[$ipHash])) {
        $entry = $limits[$ipHash];
        if (!empty($entry['locked_until']) && $entry['locked_until'] > $now) {
            $remainingMin = ceil(($entry['locked_until'] - $now) / 60);
            http_response_code(429);
            echo json_encode([
                'ok' => false,
                'error' => "Trop de tentatives. Accès bloqué par sécurité pendant encore {$remainingMin} minute(s)."
            ]);
            exit;
        }
        // Si le délai de blocage est passé, on remet le compteur à zéro
        if (!empty($entry['locked_until']) && $entry['locked_until'] <= $now) {
            unset($limits[$ipHash]);
            saveRateLimits($limits);
        }
    }
}

function recordFailedLogin(): int {
    $ipHash = getClientIpHash();
    $limits = loadRateLimits();
    $now = time();

    $attempts = ($limits[$ipHash]['attempts'] ?? 0) + 1;
    $lockedUntil = 0;

    if ($attempts >= MAX_LOGIN_ATTEMPTS) {
        $lockedUntil = $now + LOCKOUT_DURATION_SECONDS;
    }

    $limits[$ipHash] = [
        'attempts' => $attempts,
        'last_attempt' => $now,
        'locked_until' => $lockedUntil
    ];
    saveRateLimits($limits);
    return max(0, MAX_LOGIN_ATTEMPTS - $attempts);
}

function clearLoginAttempts(): void {
    $ipHash = getClientIpHash();
    $limits = loadRateLimits();
    if (isset($limits[$ipHash])) {
        unset($limits[$ipHash]);
        saveRateLimits($limits);
    }
}

// ==========================================================================
// 4. GESTION DU MOT DE PASSE CHIFFRÉ BCRYPT & DE LA BASE DE DONNÉES
// ==========================================================================
function getInitialVinyls(): array {
    return [
        [
            "id" => "VIN-01",
            "artist" => "Pink Floyd",
            "title" => "Wish You Were Here",
            "genre" => "Rock & Psyché",
            "year" => "1975",
            "format" => "33 Tours",
            "isNewArrival" => true,
            "price" => 35,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #1f2b38 0%, #3a4e63 100%)",
            "labelColor" => "#d99b26",
            "tracks" => ["Shine On You Crazy Diamond", "Welcome to the Machine", "Have a Cigar", "Wish You Were Here"]
        ],
        [
            "id" => "VIN-02",
            "artist" => "Miles Davis",
            "title" => "Ascenseur pour l'échafaud",
            "genre" => "Jazz & Blues",
            "year" => "1958",
            "format" => "33 Tours",
            "isNewArrival" => true,
            "price" => 40,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #2b2623 0%, #4a413b 100%)",
            "labelColor" => "#1e4d3b",
            "tracks" => ["Générique", "L'Assassinat de Carala", "Sur l'autoroute", "Julien dans l'ascenseur", "Florence sur les Champs-Élysées", "Dîner au motel"]
        ],
        [
            "id" => "VIN-03",
            "artist" => "Serge Gainsbourg",
            "title" => "Histoire de Melody Nelson",
            "genre" => "Chanson & Variété FR",
            "year" => "1971",
            "format" => "33 Tours",
            "isNewArrival" => false,
            "price" => 45,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #5e1914 0%, #2e0c0a 100%)",
            "labelColor" => "#1f3a60",
            "tracks" => ["Melody", "Ballade de Melody Nelson", "Valse de Melody", "Ah ! Melody", "L'Hôtel particulier", "En Melody", "Cargo culte"]
        ],
        [
            "id" => "VIN-04",
            "artist" => "Marvin Gaye",
            "title" => "What's Going On",
            "genre" => "Soul & Funk",
            "year" => "1971",
            "format" => "33 Tours",
            "isNewArrival" => true,
            "price" => 30,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #593a22 0%, #8c5d38 100%)",
            "labelColor" => "#c93b2b",
            "tracks" => ["What's Going On", "What's Happening Brother", "Flyin' High", "Save the Children", "Mercy Mercy Me", "Inner City Blues"]
        ],
        [
            "id" => "VIN-05",
            "artist" => "Daft Punk",
            "title" => "Homework",
            "genre" => "Hip-Hop & Electro",
            "year" => "1997",
            "format" => "Double 33T",
            "isNewArrival" => false,
            "price" => 30,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #111111 0%, #2c2c2c 100%)",
            "labelColor" => "#b82525",
            "tracks" => ["Daftendirekt", "Revolution 909", "Da Funk", "Around the World", "Rollin' & Scratchin'", "Alive"]
        ],
        [
            "id" => "VIN-06",
            "artist" => "Bob Marley & The Wailers",
            "title" => "Exodus",
            "genre" => "Reggae & World",
            "year" => "1977",
            "format" => "33 Tours",
            "isNewArrival" => true,
            "price" => 22,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #8a6421 0%, #bd8b2d 100%)",
            "labelColor" => "#d96b27",
            "tracks" => ["Natural Mystic", "So Much Things to Say", "Guiltiness", "The Heathen", "Exodus", "Jamming", "Waiting in Vain", "Three Little Birds"]
        ],
        [
            "id" => "VIN-07",
            "artist" => "Black Sabbath",
            "title" => "Paranoid",
            "genre" => "Hard & Metal",
            "year" => "1970",
            "format" => "33 Tours",
            "isNewArrival" => false,
            "price" => 35,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #2e1530 0%, #61264b 100%)",
            "labelColor" => "#e6dfd3",
            "tracks" => ["War Pigs", "Paranoid", "Planet Caravan", "Iron Man", "Electric Funeral", "Hand of Doom", "Fairies Wear Boots"]
        ],
        [
            "id" => "VIN-08",
            "artist" => "Jacques Brel",
            "title" => "Ces Gens-Là",
            "genre" => "Chanson & Variété FR",
            "year" => "1966",
            "format" => "45 Tours",
            "isNewArrival" => true,
            "price" => 10,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #3b3228 0%, #5e5041 100%)",
            "labelColor" => "#d97a26",
            "tracks" => ["Ces gens-là", "Jacky", "L'âge idiot", "Fernand"]
        ],
        [
            "id" => "VIN-09",
            "artist" => "Fela Kuti & Africa 70",
            "title" => "Zombie",
            "genre" => "Reggae & World",
            "year" => "1977",
            "format" => "33 Tours",
            "isNewArrival" => true,
            "price" => 25,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #214d2e 0%, #3b7a4c 100%)",
            "labelColor" => "#e8c44d",
            "tracks" => ["Zombie", "Mister Follow Follow"]
        ],
        [
            "id" => "VIN-10",
            "artist" => "The Doors",
            "title" => "L.A. Woman",
            "genre" => "Rock & Psyché",
            "year" => "1971",
            "format" => "33 Tours",
            "isNewArrival" => false,
            "price" => 28,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #4f1c1d 0%, #7d2c2e 100%)",
            "labelColor" => "#c79a2c",
            "tracks" => ["The Changeling", "Love Her Madly", "Been Down So Long", "Cars Hiss by My Window", "L.A. Woman", "Riders on the Storm"]
        ],
        [
            "id" => "VIN-11",
            "artist" => "IAM",
            "title" => "L'École du Micro d'Argent",
            "genre" => "Hip-Hop & Electro",
            "year" => "1997",
            "format" => "Double 33T",
            "isNewArrival" => true,
            "price" => 30,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #2d3033 0%, #52575c 100%)",
            "labelColor" => "#a3a8ad",
            "tracks" => ["L'École du Micro d'Argent", "Nés sous la même étoile", "La Saga", "Petit frère", "Demain, c'est loin"]
        ],
        [
            "id" => "VIN-12",
            "artist" => "Aretha Franklin",
            "title" => "Respect / Dr. Feelgood",
            "genre" => "Soul & Funk",
            "year" => "1967",
            "format" => "45 Tours",
            "isNewArrival" => false,
            "price" => 10,
            "photoUrl" => "",
            "jacketColor" => "linear-gradient(135deg, #872b1b 0%, #b83d27 100%)",
            "labelColor" => "#c93b2b",
            "tracks" => ["Face A : Respect", "Face B : Dr. Feelgood"]
        ]
    ];
}

function ensureAdminHashExists(): void {
    if (!file_exists(ADMIN_FILE)) {
        // Empreinte Bcrypt irréversible pré-calculée (coût 12) : aucun mot de passe en clair dans le code
        $precomputedBcryptHash = '$2y$12$KZFt8zxUYKx18zm1TYKBl.kLU9ihMY/BmK7Ui4qWnezUZegY755Eq';
        $content = "<?php\n// Fichier sécurisé contenant uniquement l'empreinte chiffrée BCRYPT du mot de passe vendeur\nreturn " . var_export(['password_hash' => $precomputedBcryptHash], true) . ";\n";
        file_put_contents(ADMIN_FILE, $content, LOCK_EX);
    }
}

function getAdminHash(): string {
    ensureAdminHashExists();
    $data = include ADMIN_FILE;
    return $data['password_hash'] ?? '';
}

function saveAdminHash(string $newHash): void {
    $content = "<?php\n// Fichier sécurisé contenant uniquement l'empreinte chiffrée BCRYPT du mot de passe vendeur\nreturn " . var_export(['password_hash' => $newHash], true) . ";\n";
    file_put_contents(ADMIN_FILE, $content, LOCK_EX);
}

// Nettoyage strict des chaînes de caractères (anti-XSS)
function cleanText(string $str, int $maxLength = 140): string {
    $clean = strip_tags(trim($str));
    return mb_substr($clean, 0, $maxLength, 'UTF-8');
}

function loadVinylsFromDB(): array {
    if (USE_MYSQL_OVH) {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $stmt = $pdo->query("SELECT * FROM vinyls ORDER BY created_at DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map(function($r) {
            return [
                "id" => $r['id'],
                "artist" => $r['artist'],
                "title" => $r['title'],
                "genre" => $r['genre'],
                "year" => $r['year'],
                "format" => $r['format'],
                "isNewArrival" => true,
                "price" => (float)$r['price'],
                "photoUrl" => $r['photo_url'] ?? "",
                "jacketColor" => $r['jacket_color'] ?: "linear-gradient(135deg, #2b2623 0%, #4a413b 100%)",
                "labelColor" => $r['label_color'] ?: "#c93b2b",
                "tracks" => json_decode($r['tracks_json'], true) ?: []
            ];
        }, $rows);
    }

    if (!file_exists(VINYLS_FILE)) {
        $initial = getInitialVinyls();
        file_put_contents(VINYLS_FILE, json_encode($initial, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $initial;
    }

    $json = file_get_contents(VINYLS_FILE);
    $list = json_decode((string)$json, true);
    return is_array($list) ? $list : getInitialVinyls();
}

function saveVinylsToDB(array $vinyls): void {
    file_put_contents(VINYLS_FILE, json_encode(array_values($vinyls), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// ==========================================================================
// 5. VALIDATION BINAIRE STRICTE DES IMAGES UPLOADÉES
// ==========================================================================
function saveBase64PhotoToFile(string $base64Data): string {
    if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,/', $base64Data)) {
        return "";
    }

    $dataPos = strpos($base64Data, ',');
    if ($dataPos === false) {
        return "";
    }

    $decoded = base64_decode(substr($base64Data, $dataPos + 1), true);
    if ($decoded === false || strlen($decoded) > MAX_IMAGE_BYTES || strlen($decoded) < 64) {
        return "";
    }

    // Vérification binaire que le contenu est une vraie image (et non un script PHP déguisé)
    $imgInfo = @getimagesizefromstring($decoded);
    if ($imgInfo === false || empty($imgInfo[0]) || empty($imgInfo[1])) {
        return "";
    }

    $allowedMimeMap = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp'
    ];
    $realMime = $imgInfo['mime'] ?? '';
    if (!isset($allowedMimeMap[$realMime])) {
        return "";
    }

    // Interdire tout code PHP dissimulé dans les métadonnées EXIF de l'image
    if (stripos($decoded, '<?php') !== false || stripos($decoded, '<?=') !== false) {
        return "";
    }

    $ext = $allowedMimeMap[$realMime];
    $filename = 'vinyl_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $filepath = UPLOADS_DIR . '/' . $filename;

    if (file_put_contents($filepath, $decoded, LOCK_EX) === false) {
        return "";
    }

    return 'uploads/' . $filename;
}

// ==========================================================================
// 6. ROUTEUR D'ACTIONS API
// ==========================================================================
$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = json_decode((string)$rawInput, true) ?? [];

switch ($action) {
    // Récupérer les vinyles + jeton CSRF + statut connexion
    case 'list':
        echo json_encode([
            'ok' => true,
            'isLoggedIn' => isVendorAuthenticated(),
            'csrfToken' => getCsrfToken(),
            'vinyls' => loadVinylsFromDB()
        ]);
        break;

    // Connexion sécurisée de l'oncle (Anti-Bruteforce + CSRF + Bcrypt coût 12)
    case 'login':
        verifyCsrfToken();
        checkBruteForce();

        $password = trim((string)($input['password'] ?? ''));
        $storedHash = getAdminHash();

        if ($password !== '' && password_verify($password, $storedHash)) {
            clearLoginAttempts();
            session_regenerate_id(true);
            $_SESSION['barweta_vendor_authenticated'] = true;
            $_SESSION['barweta_last_activity'] = time();
            $_SESSION['barweta_ua_hash'] = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // Nouveau jeton CSRF après login

            echo json_encode([
                'ok' => true,
                'csrfToken' => $_SESSION['csrf_token']
            ]);
        } else {
            $remaining = recordFailedLogin();
            http_response_code(401);
            $msg = $remaining > 0
                ? "Code incorrect. Il vous reste {$remaining} essai(s)."
                : "Trop de tentatives. Accès bloqué pendant 15 minutes.";
            echo json_encode(['ok' => false, 'error' => $msg]);
        }
        break;

    // Déconnexion
    case 'logout':
        verifyCsrfToken();
        $_SESSION = [];
        session_destroy();
        session_start();
        echo json_encode([
            'ok' => true,
            'csrfToken' => getCsrfToken()
        ]);
        break;

    // Changer le mot de passe vendeur (stocke uniquement le nouveau hash Bcrypt coût 12)
    case 'change_password':
        requireVendorAuth();

        $newPass = trim((string)($input['newPassword'] ?? ''));
        if (mb_strlen($newPass, 'UTF-8') < 6) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Le nouveau code doit faire au moins 6 caractères.']);
            break;
        }
        $newHash = password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 12]);
        saveAdminHash($newHash);
        echo json_encode(['ok' => true]);
        break;

    // Ajouter un vinyle dans la base de données (protégé par Session + CSRF)
    case 'add':
        requireVendorAuth();

        $artist = cleanText((string)($input['artist'] ?? ''), 100);
        $title = cleanText((string)($input['title'] ?? ''), 120);
        $genre = cleanText((string)($input['genre'] ?? 'Rock & Psyché'), 60);
        $format = cleanText((string)($input['format'] ?? '33 Tours'), 40);
        $price = round((float)($input['price'] ?? 0), 2);
        $year = cleanText((string)($input['year'] ?? 'Époque'), 20);

        $rawTracks = is_array($input['tracks'] ?? null) ? $input['tracks'] : ['Morceaux à découvrir sur le disque'];
        $tracks = array_values(array_filter(array_map(fn($t) => cleanText((string)$t, 120), array_slice($rawTracks, 0, 30))));
        if (empty($tracks)) {
            $tracks = ['Morceaux à découvrir sur le disque'];
        }

        $photoData = (string)($input['photoData'] ?? '');

        if ($artist === '' || $title === '' || $price <= 0 || $price > 50000) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Champs obligatoires invalides.']);
            break;
        }

        $savedPhotoUrl = $photoData !== '' ? saveBase64PhotoToFile($photoData) : '';
        if ($photoData !== '' && $savedPhotoUrl === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Fichier image non valide ou trop volumineux.']);
            break;
        }

        $newId = 'VIN-' . time() . '-' . bin2hex(random_bytes(3));

        $newVinyl = [
            "id" => $newId,
            "artist" => $artist,
            "title" => $title,
            "genre" => $genre,
            "year" => $year ?: 'Époque',
            "format" => $format,
            "isNewArrival" => true,
            "price" => $price,
            "photoUrl" => $savedPhotoUrl,
            "jacketColor" => "linear-gradient(135deg, #2b2623 0%, #4a413b 100%)",
            "labelColor" => "#c93b2b",
            "tracks" => $tracks
        ];

        if (USE_MYSQL_OVH) {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $stmt = $pdo->prepare("INSERT INTO vinyls (id, artist, title, genre, year, format, price, photo_url, jacket_color, label_color, tracks_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newVinyl['id'],
                $newVinyl['artist'],
                $newVinyl['title'],
                $newVinyl['genre'],
                $newVinyl['year'],
                $newVinyl['format'],
                $newVinyl['price'],
                $newVinyl['photoUrl'],
                $newVinyl['jacketColor'],
                $newVinyl['labelColor'],
                json_encode($newVinyl['tracks'], JSON_UNESCAPED_UNICODE)
            ]);
        } else {
            $vinyls = loadVinylsFromDB();
            array_unshift($vinyls, $newVinyl);
            saveVinylsToDB($vinyls);
        }

        echo json_encode(['ok' => true, 'vinyl' => $newVinyl]);
        break;

    // Supprimer un vinyle de la base de données (protégé par Session + CSRF)
    case 'delete':
        requireVendorAuth();

        $id = cleanText((string)($input['id'] ?? ''), 60);
        if ($id === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Identifiant manquant']);
            break;
        }

        if (USE_MYSQL_OVH) {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $stmt = $pdo->prepare("DELETE FROM vinyls WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $vinyls = loadVinylsFromDB();
            foreach ($vinyls as $v) {
                if (($v['id'] ?? '') === $id && !empty($v['photoUrl'])) {
                    // Protection anti-Path Traversal : ne supprime que dans uploads/
                    $basename = basename($v['photoUrl']);
                    $safePath = UPLOADS_DIR . '/' . $basename;
                    if (is_file($safePath)) {
                        @unlink($safePath);
                    }
                }
            }
            $vinyls = array_filter($vinyls, fn($v) => ($v['id'] ?? '') !== $id);
            saveVinylsToDB($vinyls);
        }

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Action inconnue']);
        break;
}
