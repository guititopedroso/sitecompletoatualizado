<?php
// ============================================================
// ROYAL COAST — API Backend (PHP + MySQL)
// Substitui o servidor Express. Ficheiro único que gere
// todas as rotas /api/* e a ligação à base de dados MySQL.
// ============================================================

// --- Configuração ---
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'u236076924_royalcoast');
define('DB_USER', 'u236076924_royalcoast');
define('DB_PASS', 'Guitacrapazes.101010%');
define('JWT_SECRET', 'super-secret-royalcoast-key-2026');

define('META_WA_TOKEN_DEFAULT', 'EAARmrytIMFkBSA8ZCX1sTY2ZBLgmjSzxpLUm0fl9uIj4OCQX8bVB4dlZBfqYF1gBWOErJGzu4w0hMJunHMZA7NokYzumaxcGB0ZCzbq1pSMyZB1RxZAFJ2rqBwaZCLFJMZCS7Jeh4twpmUkeREQT5jE20CbsFZBwEE36mvK2hR8ZAugmEHZAhupZCZAz257nm57izLQPkA5AZDZD');
define('META_WA_PHONE_ID_DEFAULT', '1239529775907696');

// --- Carregar variáveis do ficheiro .env ---
function loadEnv() {
    static $envLoaded = false;
    if ($envLoaded) return;
    $envLoaded = true;

    $possiblePaths = [
        dirname(__DIR__) . '/.env',
        dirname(__DIR__, 2) . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];

    foreach ($possiblePaths as $envPath) {
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    if (!getenv($key)) {
                        putenv("{$key}={$value}");
                        $_ENV[$key] = $value;
                    }
                }
            }
            break;
        }
    }
}
loadEnv();

// Pasta de uploads — dirname() é mais fiável que realpath() em alguns servidores
define('UPLOADS_DIR', dirname(__DIR__) . '/uploads/');
define('UPLOADS_URL', '/uploads/');

// --- Cabeçalhos CORS e Content-Type ---
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Ligação à Base de Dados ---
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            respond(['error' => 'Erro de ligação à BD: ' . $e->getMessage()], 500);
        }
    }
    return $pdo;
}

// --- Inicialização das Tabelas (corre apenas se não existirem) ---
function initTables() {
    $pdo = getDB();
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(128) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
        displayName VARCHAR(255), photoURL VARCHAR(512), provider VARCHAR(50) DEFAULT 'password',
        referralCode VARCHAR(100) UNIQUE, lastLogin TIMESTAMP NULL DEFAULT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        firstName VARCHAR(255), lastName VARCHAR(255), phonePrefix VARCHAR(10),
        phoneNumber VARCHAR(20), birthDate VARCHAR(50), password_hash VARCHAR(255)
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS boats (
        id VARCHAR(128) PRIMARY KEY, name VARCHAR(255) NOT NULL, size VARCHAR(100),
        engine VARCHAR(100), capacity INT, price4h VARCHAR(50), price8h VARCHAR(50),
        images TEXT, slug VARCHAR(255) UNIQUE, range_type VARCHAR(50) DEFAULT 'mid',
        boat_order INT DEFAULT 0, image VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, features TEXT,
        cost4h VARCHAR(50), cost8h VARCHAR(50),
        useMarkup4h TINYINT(1) DEFAULT 0, useMarkup8h TINYINT(1) DEFAULT 0,
        deliveryCost4h VARCHAR(50), deliveryCost8h VARCHAR(50),
        useDelivery4h TINYINT(1) DEFAULT 0, useDelivery8h TINYINT(1) DEFAULT 0,
        extraOptions TEXT
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS tours (
        id VARCHAR(128) PRIMARY KEY, name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE, packs TEXT, capacity INT,
        price4h VARCHAR(50), price8h VARCHAR(50), extraOptions TEXT,
        theme VARCHAR(50), tour_order INT DEFAULT 0, image VARCHAR(512),
        images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    // Migração: adicionar coluna images se não existir
    try { $pdo->exec('ALTER TABLE tours ADD COLUMN images TEXT'); } catch (Exception $e) {}
    $pdo->exec("CREATE TABLE IF NOT EXISTS gallery (
        id VARCHAR(128) PRIMARY KEY, url VARCHAR(512) NOT NULL,
        alt VARCHAR(255) DEFAULT 'Imagem da galeria',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(128) PRIMARY KEY, client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255), client_phone VARCHAR(100),
        pack_name VARCHAR(512) NOT NULL, extra_preferences TEXT,
        extra_durations TEXT, extra_start_times TEXT,
        booking_date VARCHAR(50), booking_time VARCHAR(50),
        num_people INT, location VARCHAR(255), referralCode VARCHAR(100),
        price DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed TINYINT(1) DEFAULT 0, payment_method VARCHAR(100),
        created_by VARCHAR(255), extras TEXT, notes TEXT
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(128) PRIMARY KEY, date VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL, amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(100) PRIMARY KEY, val_data TEXT
    )");
    $pdo->exec("INSERT IGNORE INTO settings (key_name, val_data) VALUES ('general', '{\"maintenanceMode\":false}')");
}

// --- JWT (sem bibliotecas externas) ---
function b64url($d) { return rtrim(strtr(base64_encode($d), '+/', '-_'), '='); }
function b64urlDec($d) { return base64_decode(strtr($d, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($d)) % 4)); }

function jwtEncode($payload) {
    $h = b64url(json_encode(['typ'=>'JWT','alg'=>'HS256']));
    $p = b64url(json_encode($payload));
    $s = b64url(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    return "$h.$p.$s";
}

function jwtDecode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    if (!hash_equals(b64url(hash_hmac('sha256', "$h.$p", JWT_SECRET, true)), $s)) return null;
    $data = json_decode(b64urlDec($p), true);
    if (isset($data['exp']) && $data['exp'] < time()) return null;
    return $data;
}

function requireAuth() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $auth, $m)) respond(['error' => 'Token em falta'], 401);
    $user = jwtDecode($m[1]);
    if (!$user) respond(['error' => 'Token inválido ou expirado'], 403);
    return $user;
}

// --- Utilitários ---
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

function genId($prefix = '') {
    return $prefix . bin2hex(random_bytes(6));
}

function ensureUploads() {
    if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);
}

function saveUpload($fileKey) {
    ensureUploads();
    if (empty($_FILES[$fileKey])) respond(['error' => 'Nenhum ficheiro enviado'], 400);
    $ext = strtolower(pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION));
    $filename = time() . '_' . rand(1000,9999) . '.' . $ext;
    if (!move_uploaded_file($_FILES[$fileKey]['tmp_name'], UPLOADS_DIR . $filename)) {
        respond(['error' => 'Erro ao guardar ficheiro'], 500);
    }
    return UPLOADS_URL . $filename;
}

// --- Routing ---
initTables();

$method  = $_SERVER['REQUEST_METHOD'];
$rawPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Remove /api prefix para simplificar o routing
$path    = preg_replace('#^/api/?#', '', $rawPath);
$path    = rtrim($path, '/') ?: '';
$seg     = $path === '' ? [] : explode('/', $path);

// ==================================================
// AUTH ROUTES
// ==================================================

// POST /api/auth/login
if ($method === 'POST' && $seg === ['auth','login']) {
    $b = getBody();
    if (empty($b['email']) || empty($b['password'])) respond(['error' => 'Falta email ou password'], 400);
    $stmt = getDB()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$b['email']]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($b['password'], $user['password_hash']))
        respond(['error' => 'Email ou password incorretos'], 400);
    getDB()->prepare('UPDATE users SET lastLogin = NOW() WHERE uid = ?')->execute([$user['uid']]);
    $token = jwtEncode(['uid'=>$user['uid'],'email'=>$user['email'],'exp'=>time()+30*86400]);
    respond(['token' => $token, 'user' => [
        'uid'=>$user['uid'],'email'=>$user['email'],'displayName'=>$user['displayName'],
        'photoURL'=>$user['photoURL'],'referralCode'=>$user['referralCode'],
        'firstName'=>$user['firstName'],'lastName'=>$user['lastName'],
        'phonePrefix'=>$user['phonePrefix'],'phoneNumber'=>$user['phoneNumber'],'birthDate'=>$user['birthDate']
    ]]);
}

// POST /api/auth/register
if ($method === 'POST' && $seg === ['auth','register']) {
    $b = getBody();
    if (empty($b['email']) || empty($b['password'])) respond(['error' => 'Falta email ou password'], 400);
    $stmt = getDB()->prepare('SELECT uid FROM users WHERE email = ?');
    $stmt->execute([$b['email']]);
    if ($stmt->fetch()) respond(['error' => 'Utilizador já registado'], 400);
    $uid  = genId('u-');
    $name = trim($b['displayName'] ?? 'Utilizador');
    $ref  = strtolower(substr(preg_replace('/\s+/','',$name),0,5)) . '-' . substr(md5(rand()),0,4);
    $hash = password_hash($b['password'], PASSWORD_DEFAULT);
    getDB()->prepare('INSERT INTO users (uid,email,displayName,password_hash,referralCode) VALUES (?,?,?,?,?)')->execute([$uid,$b['email'],$name,$hash,$ref]);
    $token = jwtEncode(['uid'=>$uid,'email'=>$b['email'],'exp'=>time()+30*86400]);
    respond(['token'=>$token,'user'=>['uid'=>$uid,'email'=>$b['email'],'displayName'=>$name,'referralCode'=>$ref]]);
}

// POST /api/auth/google
if ($method === 'POST' && $seg === ['auth','google']) {
    $b = getBody();
    $email = $b['email'] ?? '';
    $name  = trim($b['displayName'] ?? $b['name'] ?? 'Utilizador Google');
    $photo = $b['photoURL'] ?? $b['picture'] ?? null;
    $gId   = $b['sub'] ?? $b['googleId'] ?? bin2hex(random_bytes(6));

    if (empty($email)) respond(['error' => 'Email do Google em falta'], 400);

    $stmt = getDB()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $uid  = 'g-' . $gId;
        $ref  = strtolower(substr(preg_replace('/\s+/','',$name),0,5)) . '-' . substr(md5(rand()),0,4);
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        getDB()->prepare('INSERT INTO users (uid,email,displayName,photoURL,provider,referralCode,password_hash) VALUES (?,?,?,?,?,?,?)')
            ->execute([$uid, $email, $name, $photo, 'google.com', $ref, $hash]);

        $user = [
            'uid' => $uid, 'email' => $email, 'displayName' => $name,
            'photoURL' => $photo, 'provider' => 'google.com', 'referralCode' => $ref,
            'firstName' => null, 'lastName' => null, 'phonePrefix' => null,
            'phoneNumber' => null, 'birthDate' => null
        ];
    } else {
        if ($photo && $photo !== $user['photoURL']) {
            getDB()->prepare('UPDATE users SET photoURL = ?, updatedAt = NOW() WHERE uid = ?')->execute([$photo, $user['uid']]);
            $user['photoURL'] = $photo;
        }
        getDB()->prepare('UPDATE users SET lastLogin = NOW() WHERE uid = ?')->execute([$user['uid']]);
    }

    $token = jwtEncode(['uid' => $user['uid'], 'email' => $user['email'], 'exp' => time() + 30 * 86400]);
    respond(['token' => $token, 'user' => [
        'uid' => $user['uid'], 'email' => $user['email'], 'displayName' => $user['displayName'],
        'photoURL' => $user['photoURL'], 'provider' => $user['provider'] ?? 'google.com', 'referralCode' => $user['referralCode'],
        'firstName' => $user['firstName'] ?? null, 'lastName' => $user['lastName'] ?? null,
        'phonePrefix' => $user['phonePrefix'] ?? null, 'phoneNumber' => $user['phoneNumber'] ?? null, 'birthDate' => $user['birthDate'] ?? null
    ]]);
}

function sendWhatsAppMessage($to, $body, $templateParams = null) {
    $cleanPhone = preg_replace('/\D/', '', $to);
    if (empty($cleanPhone) || empty($body)) return false;

    // 1. Green API (100% Gratuito - Developer Plan)
    $greenInstance = getenv('GREEN_API_INSTANCE_ID') ?: getenv('GREEN_API_ID') ?: '';
    $greenToken    = getenv('GREEN_API_TOKEN') ?: '';
    if ($greenInstance && $greenToken) {
        $url = "https://api.green-api.com/waInstance{$greenInstance}/sendMessage/{$greenToken}";
        $chatId = $cleanPhone . "@c.us";
        $data = json_encode([
            'chatId' => $chatId,
            'message' => $body
        ]);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    // 1. CallMeBot (100% Gratuito)
    $callMeBotKey = getenv('CALLMEBOT_API_KEY') ?: '';
    if ($callMeBotKey) {
        $url = "https://api.callmebot.com/whatsapp.php?phone=" . urlencode($cleanPhone) . "&text=" . urlencode($body) . "&apikey=" . urlencode($callMeBotKey);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    // 2. Meta WhatsApp Cloud API (Oficial - 1.000 Mensagens Grátis / mês)
    $metaToken   = getenv('META_WA_TOKEN') ?: (defined('META_WA_TOKEN_DEFAULT') ? META_WA_TOKEN_DEFAULT : '');
    $metaPhoneId = getenv('META_WA_PHONE_ID') ?: (defined('META_WA_PHONE_ID_DEFAULT') ? META_WA_PHONE_ID_DEFAULT : '');
    if ($metaToken && $metaPhoneId) {
        $url = "https://graph.facebook.com/v19.0/{$metaPhoneId}/messages";

        // Tentar enviar modelo de utilidade aprovado (funciona para QUALQUER cliente novo sem restrição de 24h)
        if ($templateParams && is_array($templateParams)) {
            $components = [
                [
                    'type' => 'body',
                    'parameters' => array_map(function($val) {
                        return ['type' => 'text', 'text' => (string)$val];
                    }, $templateParams)
                ]
            ];
            $dataTemplate = json_encode([
                'messaging_product' => 'whatsapp',
                'to' => $cleanPhone,
                'type' => 'template',
                'template' => [
                    'name' => 'reserva_confirmada',
                    'language' => ['code' => 'pt_PT'],
                    'components' => $components
                ]
            ]);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer {$metaToken}",
                "Content-Type: application/json"
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $dataTemplate);
            $resTemplate = curl_exec($ch);
            curl_close($ch);

            $parsedT = json_decode($resTemplate, true);
            if (!empty($parsedT['messages'])) {
                return $resTemplate;
            }
        }

        // Fallback para envio de Texto Livre
        $data = json_encode([
            'messaging_product' => 'whatsapp',
            'to' => $cleanPhone,
            'type' => 'text',
            'text' => ['body' => $body]
        ]);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$metaToken}",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    // 3. UltraMsg / Green API
    $instanceId = getenv('WHATSAPP_INSTANCE_ID') ?: '';
    $token      = getenv('WHATSAPP_TOKEN') ?: getenv('WHATSAPP_API_TOKEN') ?: '';
    $apiUrl     = getenv('WHATSAPP_API_URL') ?: '';

    if ($instanceId && $token) {
        $url = "https://api.ultramsg.com/{$instanceId}/messages/chat";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'token' => $token,
            'to'    => $cleanPhone,
            'body'  => $body
        ]));
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    if ($apiUrl && $token) {
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'token' => $token,
            'to'    => $cleanPhone,
            'body'  => $body
        ]));
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    return false;
}

// POST /api/notify/whatsapp
if ($method === 'POST' && $seg === ['notify','whatsapp']) {
    $b = getBody();
    $to = $b['to'] ?? '';
    $message = $b['message'] ?? '';
    $templateParams = $b['templateParams'] ?? null;

    // 1. Tentar enviar via servidor Node.js Baileys local (porta 3001) se estiver ativo
    $chNode = curl_init('http://127.0.0.1:3001/api/notify/whatsapp');
    curl_setopt($chNode, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chNode, CURLOPT_POST, true);
    curl_setopt($chNode, CURLOPT_TIMEOUT, 4);
    curl_setopt($chNode, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($chNode, CURLOPT_POSTFIELDS, json_encode([
        'to' => $to,
        'message' => $message,
        'templateParams' => $templateParams
    ]));
    $resNode = curl_exec($chNode);
    $httpCodeNode = curl_getinfo($chNode, CURLINFO_HTTP_CODE);
    curl_close($chNode);

    if ($httpCodeNode === 200 && $resNode) {
        $parsedNode = json_decode($resNode, true);
        if (!empty($parsedNode['success']) && !empty($parsedNode['clientSent'])) {
            respond(['success' => true, 'clientSent' => true, 'provider' => 'baileys_node']);
        }
    }

    // 2. Fallback para APIs de Gateway (Meta / Green API / CallMeBot)
    $metaResult = sendWhatsAppMessage($to, $message, $templateParams);
    $parsed = is_string($metaResult) ? json_decode($metaResult, true) : null;

    respond([
        'success' => true,
        'clientSent' => !empty($parsed['messages']),
        'raw' => $parsed ?: $metaResult
    ]);
}

// GET /api/whatsapp/status
if ($method === 'GET' && (in_array('status', $seg) && in_array('whatsapp', $seg))) {
    $chNode = curl_init('http://127.0.0.1:3001/api/whatsapp/status');
    curl_setopt($chNode, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chNode, CURLOPT_TIMEOUT, 3);
    $resNode = curl_exec($chNode);
    $httpCodeNode = curl_getinfo($chNode, CURLINFO_HTTP_CODE);
    curl_close($chNode);

    if ($httpCodeNode === 200 && $resNode) {
        respond(json_decode($resNode, true));
    } else {
        respond(['status' => 'OFFLINE', 'connected' => false, 'note' => 'Servidor Node.js desligado na porta 3001 na Hostinger']);
    }
}

// GET /api/whatsapp/qr
if ($method === 'GET' && (in_array('qr', $seg) && in_array('whatsapp', $seg))) {
    $chNode = curl_init('http://127.0.0.1:3001/api/whatsapp/qr');
    curl_setopt($chNode, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chNode, CURLOPT_TIMEOUT, 3);
    $resNode = curl_exec($chNode);
    $httpCodeNode = curl_getinfo($chNode, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($chNode, CURLINFO_CONTENT_TYPE);
    curl_close($chNode);

    if ($httpCodeNode === 200 && $resNode) {
        header('Content-Type: ' . ($contentType ?: 'text/html; charset=utf-8'));
        echo $resNode;
        exit;
    } else {
        header('Content-Type: text/html; charset=utf-8');
        echo '<div style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1117;color:#fff;min-height:100vh;"><h2>⚠️ Servidor WhatsApp Node.js desligado na porta 3001</h2><p style="color:#8b949e;">Inicia a aplicação Node.js no hPanel da Hostinger para ver o estado do WhatsApp.</p></div>';
        exit;
    }
}

// GET /api/auth/me
if ($method === 'GET' && $seg === ['auth','me']) {
    $au = requireAuth();
    $stmt = getDB()->prepare('SELECT uid,email,displayName,photoURL,provider,referralCode,firstName,lastName,phonePrefix,phoneNumber,birthDate FROM users WHERE uid = ?');
    $stmt->execute([$au['uid']]);
    $user = $stmt->fetch();
    if (!$user) respond(['error' => 'Utilizador não encontrado'], 404);
    respond($user);
}

// PUT /api/auth/profile
if ($method === 'PUT' && $seg === ['auth','profile']) {
    $au = requireAuth();
    $b  = getBody();
    getDB()->prepare('UPDATE users SET displayName=COALESCE(?,displayName), firstName=COALESCE(?,firstName), lastName=COALESCE(?,lastName), phonePrefix=COALESCE(?,phonePrefix), phoneNumber=COALESCE(?,phoneNumber), birthDate=COALESCE(?,birthDate), updatedAt=NOW() WHERE uid=?')
        ->execute([$b['displayName']??null,$b['firstName']??null,$b['lastName']??null,$b['phonePrefix']??null,$b['phoneNumber']??null,$b['birthDate']??null,$au['uid']]);
    respond(['success'=>true]);
}

// PUT /api/auth/change-password
if ($method === 'PUT' && $seg === ['auth','change-password']) {
    $au = requireAuth();
    $b  = getBody();
    if (empty($b['newPassword'])) respond(['error'=>'Nova password em falta'], 400);
    getDB()->prepare('UPDATE users SET password_hash=?,updatedAt=NOW() WHERE uid=?')
        ->execute([password_hash($b['newPassword'],PASSWORD_DEFAULT),$au['uid']]);
    respond(['success'=>true]);
}

// DELETE /api/auth/account
if ($method === 'DELETE' && $seg === ['auth','account']) {
    $au = requireAuth();
    getDB()->prepare('DELETE FROM users WHERE uid=?')->execute([$au['uid']]);
    respond(['success'=>true]);
}

// POST /api/auth/avatar
if ($method === 'POST' && $seg === ['auth','avatar']) {
    $au  = requireAuth();
    $url = saveUpload('avatar');
    getDB()->prepare('UPDATE users SET photoURL=?,updatedAt=NOW() WHERE uid=?')->execute([$url,$au['uid']]);
    respond(['photoURL'=>$url]);
}

// ==================================================
// BOATS ROUTES
// ==================================================

function parseBoat($b) {
    $b['images']      = $b['images']      ? json_decode($b['images'],true)      : [];
    $b['features']    = $b['features']    ? json_decode($b['features'],true)    : [];
    $b['extraOptions']= $b['extraOptions']? json_decode($b['extraOptions'],true): [];
    $b['useMarkup4h'] = (bool)$b['useMarkup4h'];
    $b['useMarkup8h'] = (bool)$b['useMarkup8h'];
    $b['useDelivery4h']=(bool)$b['useDelivery4h'];
    $b['useDelivery8h']=(bool)$b['useDelivery8h'];
    return $b;
}

// GET /api/boats
if ($method === 'GET' && $seg === ['boats']) {
    $rows = getDB()->query('SELECT * FROM boats ORDER BY boat_order ASC')->fetchAll();
    respond(array_map('parseBoat', $rows));
}

// POST /api/boats
if ($method === 'POST' && $seg === ['boats']) {
    $d = getBody(); $id = genId('b-');
    getDB()->prepare('INSERT INTO boats (id,name,size,engine,capacity,price4h,price8h,images,slug,range_type,boat_order,image,features,cost4h,cost8h,useMarkup4h,useMarkup8h,deliveryCost4h,deliveryCost8h,useDelivery4h,useDelivery8h,extraOptions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id,$d['name'],$d['size']??null,$d['engine']??null,$d['capacity']??null,$d['price4h']??null,$d['price8h']??null,json_encode($d['images']??[]),$d['slug']??null,$d['range']??'mid',$d['order']??0,$d['image']??'',json_encode($d['features']??[]),$d['cost4h']??'',$d['cost8h']??'',!empty($d['useMarkup4h'])?1:0,!empty($d['useMarkup8h'])?1:0,$d['deliveryCost4h']??'',$d['deliveryCost8h']??'',!empty($d['useDelivery4h'])?1:0,!empty($d['useDelivery8h'])?1:0,json_encode($d['extraOptions']??[])]);
    respond(array_merge(['id'=>$id],$d));
}

// PUT /api/boats/order/bulk  (tem de vir ANTES de PUT /api/boats/:id)
if ($method === 'PUT' && count($seg)===3 && $seg[0]==='boats' && $seg[1]==='order' && $seg[2]==='bulk') {
    foreach (getBody() as $item)
        getDB()->prepare('UPDATE boats SET boat_order=? WHERE id=?')->execute([$item['order'],$item['id']]);
    respond(['success'=>true]);
}

// PUT /api/boats/:id
if ($method === 'PUT' && count($seg)===2 && $seg[0]==='boats') {
    $id=$seg[1]; $d=getBody();
    getDB()->prepare('UPDATE boats SET name=?,size=?,engine=?,capacity=?,price4h=?,price8h=?,images=?,slug=?,range_type=?,boat_order=?,image=?,features=?,cost4h=?,cost8h=?,useMarkup4h=?,useMarkup8h=?,deliveryCost4h=?,deliveryCost8h=?,useDelivery4h=?,useDelivery8h=?,extraOptions=? WHERE id=?')
        ->execute([$d['name'],$d['size']??null,$d['engine']??null,$d['capacity']??null,$d['price4h']??null,$d['price8h']??null,json_encode($d['images']??[]),$d['slug']??null,$d['range']??'mid',$d['order']??0,$d['image']??'',json_encode($d['features']??[]),$d['cost4h']??'',$d['cost8h']??'',!empty($d['useMarkup4h'])?1:0,!empty($d['useMarkup8h'])?1:0,$d['deliveryCost4h']??'',$d['deliveryCost8h']??'',!empty($d['useDelivery4h'])?1:0,!empty($d['useDelivery8h'])?1:0,json_encode($d['extraOptions']??[]),$id]);
    respond(array_merge(['id'=>$id],$d));
}

// DELETE /api/boats/:id
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='boats') {
    getDB()->prepare('DELETE FROM boats WHERE id=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// POST /api/boats/upload
if ($method === 'POST' && $seg === ['boats','upload']) {
    respond(['url' => saveUpload('file')]);
}

// ==================================================
// TOURS ROUTES
// ==================================================

function parseTour($t) {
    $t['packs']       = $t['packs']       ? json_decode($t['packs'],true)       : [];
    $t['extraOptions']= $t['extraOptions']? json_decode($t['extraOptions'],true) : [];
    // Decode images array; fallback to [image] so the frontend always gets an array
    if ($t['images']) {
        $t['images'] = json_decode($t['images'], true) ?: [];
    } else {
        $t['images'] = $t['image'] ? [$t['image']] : [];
    }
    return $t;
}

// GET /api/tours
if ($method === 'GET' && $seg === ['tours']) {
    $rows = getDB()->query('SELECT * FROM tours ORDER BY tour_order ASC')->fetchAll();
    respond(array_map('parseTour', $rows));
}

// POST /api/tours
if ($method === 'POST' && $seg === ['tours']) {
    $d = getBody();
    $id = genId('t-');
    $imgs = $d['images'] ?? [];
    $img  = $d['image'] ?? ($imgs[0] ?? '');
    getDB()->prepare('INSERT INTO tours (id,name,slug,packs,capacity,price4h,price8h,extraOptions,theme,tour_order,image,images) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id,$d['name'],$d['slug']??null,json_encode($d['packs']??[]),$d['capacity']??null,$d['price4h']??'',$d['price8h']??'',json_encode($d['extraOptions']??[]),$d['theme']??'ocean',$d['order']??0,$img,json_encode($imgs)]);
    respond(array_merge(['id'=>$id],$d));
}

// PUT /api/tours/order/bulk
if ($method === 'PUT' && count($seg)===3 && $seg[0]==='tours' && $seg[1]==='order' && $seg[2]==='bulk') {
    foreach (getBody() as $item)
        getDB()->prepare('UPDATE tours SET tour_order=? WHERE id=?')->execute([$item['order'],$item['id']]);
    respond(['success'=>true]);
}

// PUT /api/tours/:id
if ($method === 'PUT' && count($seg)===2 && $seg[0]==='tours') {
    $id  = $seg[1]; $d = getBody();
    $imgs = $d['images'] ?? [];
    $img  = $d['image'] ?? ($imgs[0] ?? '');
    getDB()->prepare('UPDATE tours SET name=?,slug=?,packs=?,capacity=?,price4h=?,price8h=?,extraOptions=?,theme=?,tour_order=?,image=?,images=? WHERE id=?')
        ->execute([$d['name'],$d['slug']??null,json_encode($d['packs']??[]),$d['capacity']??null,$d['price4h']??'',$d['price8h']??'',json_encode($d['extraOptions']??[]),$d['theme']??'ocean',$d['order']??0,$img,json_encode($imgs),$id]);
    respond(array_merge(['id'=>$id],$d));
}

// DELETE /api/tours/:id
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='tours') {
    getDB()->prepare('DELETE FROM tours WHERE id=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// ==================================================
// GALLERY ROUTES
// ==================================================

// GET /api/gallery
if ($method === 'GET' && $seg === ['gallery']) {
    respond(getDB()->query('SELECT * FROM gallery ORDER BY created_at DESC')->fetchAll());
}

// POST /api/gallery
if ($method === 'POST' && $seg === ['gallery']) {
    $url = saveUpload('file');
    $id  = genId('g-');
    $alt = $_POST['alt'] ?? 'Imagem da galeria';
    getDB()->prepare('INSERT INTO gallery (id,url,alt) VALUES (?,?,?)')->execute([$id,$url,$alt]);
    respond(['id'=>$id,'url'=>$url,'alt'=>$alt,'created_at'=>date('c')]);
}

// DELETE /api/gallery/:id
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='gallery') {
    $stmt = getDB()->prepare('SELECT url FROM gallery WHERE id=?');
    $stmt->execute([$seg[1]]);
    $row = $stmt->fetch();
    if ($row && strpos($row['url'],'/uploads/')===0) {
        $f = UPLOADS_DIR . basename($row['url']);
        if (file_exists($f)) unlink($f);
    }
    getDB()->prepare('DELETE FROM gallery WHERE id=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// ==================================================
// BOOKINGS ROUTES
// ==================================================

// GET /api/bookings
if ($method === 'GET' && $seg === ['bookings']) {
    $sql='SELECT * FROM bookings WHERE 1=1'; $p=[];
    if (isset($_GET['confirmed'])) { $sql.=' AND confirmed=?'; $p[]=$_GET['confirmed']==='true'?1:0; }
    if (isset($_GET['date_start'])) { $sql.=' AND booking_date>=?'; $p[]=$_GET['date_start']; }
    if (isset($_GET['date_end']))   { $sql.=' AND booking_date<=?'; $p[]=$_GET['date_end']; }
    $sql.=' ORDER BY booking_date DESC, booking_time ASC';
    $stmt=getDB()->prepare($sql); $stmt->execute($p);
    $rows=$stmt->fetchAll();
    foreach ($rows as &$b) {
        $b['extra_preferences'] = $b['extra_preferences'] ? json_decode($b['extra_preferences'],true) : [];
        $b['extra_durations']   = $b['extra_durations']   ? json_decode($b['extra_durations'],true)   : [];
        $b['extra_start_times'] = $b['extra_start_times'] ? json_decode($b['extra_start_times'],true) : [];
        $b['extras']            = $b['extras']            ? json_decode($b['extras'],true)            : [];
        $b['confirmed']=(bool)$b['confirmed'];
        $b['price']=floatval($b['price']);
    }
    respond($rows);
}

// POST /api/bookings
if ($method === 'POST' && $seg === ['bookings']) {
    $d=getBody(); $id=genId('bk-');
    getDB()->prepare('INSERT INTO bookings (id,client_name,client_email,client_phone,pack_name,extra_preferences,extra_durations,extra_start_times,booking_date,booking_time,num_people,location,referralCode,price,confirmed,payment_method,created_by,extras,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id,$d['client_name'],$d['client_email']??null,$d['client_phone']??null,$d['pack_name'],json_encode($d['extra_preferences']??[]),json_encode($d['extra_durations']??[]),json_encode($d['extra_start_times']??[]),$d['booking_date']??null,$d['booking_time']??null,$d['num_people']??1,$d['location']??null,$d['referralCode']??null,$d['price']??0,!empty($d['confirmed'])?1:0,$d['payment_method']??null,$d['created_by']??null,json_encode($d['extras']??[]),$d['notes']??null]);
    respond(array_merge(['id'=>$id],$d));
}

// DELETE /api/bookings/cleanup/past-unconfirmed
if ($method === 'DELETE' && $seg === ['bookings','cleanup','past-unconfirmed']) {
    $stmt=getDB()->prepare('DELETE FROM bookings WHERE booking_date<? AND confirmed=0');
    $stmt->execute([date('Y-m-d')]);
    respond(['success'=>true,'deletedCount'=>$stmt->rowCount()]);
}

// PUT /api/bookings/:id
if ($method === 'PUT' && count($seg)===2 && $seg[0]==='bookings') {
    $id=$seg[1]; $d=getBody(); $sets=[]; $p=[];
    foreach ($d as $k=>$v) {
        if (in_array($k,['id','created_at'])) continue;
        $sets[]="`$k`=?";
        $p[]=is_array($v)?json_encode($v):(is_bool($v)?($v?1:0):$v);
    }
    if ($sets) { $p[]=$id; getDB()->prepare('UPDATE bookings SET '.implode(',',$sets).' WHERE id=?')->execute($p); }
    respond(array_merge(['id'=>$id],$d));
}

// DELETE /api/bookings/:id
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='bookings') {
    getDB()->prepare('DELETE FROM bookings WHERE id=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// ==================================================
// EXPENSES ROUTES
// ==================================================

// GET /api/expenses
if ($method === 'GET' && $seg === ['expenses']) {
    $sql='SELECT * FROM expenses WHERE 1=1'; $p=[];
    if (isset($_GET['date_start'])) { $sql.=' AND date>=?'; $p[]=$_GET['date_start']; }
    if (isset($_GET['date_end']))   { $sql.=' AND date<=?'; $p[]=$_GET['date_end']; }
    $sql.=' ORDER BY date DESC';
    $stmt=getDB()->prepare($sql); $stmt->execute($p);
    $rows=$stmt->fetchAll();
    foreach ($rows as &$e) $e['amount']=floatval($e['amount']);
    respond($rows);
}

// POST /api/expenses
if ($method === 'POST' && $seg === ['expenses']) {
    $d=getBody(); $id=genId('ex-');
    getDB()->prepare('INSERT INTO expenses (id,date,type,amount) VALUES (?,?,?,?)')->execute([$id,$d['date'],$d['type'],$d['amount']]);
    respond(array_merge(['id'=>$id],$d));
}

// DELETE /api/expenses/:id
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='expenses') {
    getDB()->prepare('DELETE FROM expenses WHERE id=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// ==================================================
// SETTINGS ROUTES
// ==================================================

// GET /api/settings/:key
if ($method === 'GET' && count($seg)===2 && $seg[0]==='settings') {
    $stmt=getDB()->prepare('SELECT val_data FROM settings WHERE key_name=?');
    $stmt->execute([$seg[1]]);
    $row=$stmt->fetch();
    respond($row ? json_decode($row['val_data'],true) : []);
}

// POST /api/settings/:key
if ($method === 'POST' && count($seg)===2 && $seg[0]==='settings') {
    $d=getBody();
    getDB()->prepare('INSERT INTO settings (key_name,val_data) VALUES (?,?) ON DUPLICATE KEY UPDATE val_data=?')
        ->execute([$seg[1],json_encode($d),json_encode($d)]);
    respond($d);
}

// ==================================================
// USERS ROUTES
// ==================================================

// GET /api/users
if ($method === 'GET' && $seg === ['users']) {
    respond(getDB()->query('SELECT uid,email,displayName,photoURL,provider,referralCode,firstName,lastName,phonePrefix,phoneNumber,birthDate,updatedAt FROM users ORDER BY updatedAt DESC')->fetchAll());
}

// DELETE /api/users/:uid
if ($method === 'DELETE' && count($seg)===2 && $seg[0]==='users') {
    getDB()->prepare('DELETE FROM users WHERE uid=?')->execute([$seg[1]]);
    respond(['success'=>true]);
}

// --- Fallback 404 ---
respond(['error' => 'Rota não encontrada: ' . $method . ' /' . implode('/', $seg)], 404);
