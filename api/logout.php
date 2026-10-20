<?php
// =====================================================================
//  POST api/logout.php
//  Cierra la sesión: vacía los datos, borra la cookie y destruye la sesión.
// =====================================================================

require_once __DIR__ . '/../config/sesion.php';
iniciar_sesion();
header('Content-Type: application/json; charset=utf-8');

// 1. Vaciamos los datos de la sesión
$_SESSION = [];

// 2. Borramos la cookie de sesión del navegador
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires'  => time() - 42000,
        'path'     => $params['path'],
        'domain'   => $params['domain'],
        'secure'   => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'],
    ]);
}

// 3. Destruimos la sesión en el servidor
session_destroy();

http_response_code(200);
echo json_encode(["estado" => "exito", "mensaje" => "Sesión cerrada correctamente."]);
