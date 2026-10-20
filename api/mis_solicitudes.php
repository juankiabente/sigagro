<?php
// =====================================================================
//  GET api/mis_solicitudes.php   — ENDPOINT PRIVADO
//  Devuelve los datos del usuario logueado y SUS solicitudes de análisis.
//  Si no hay sesión, responde 401 Unauthorized y no muestra nada.
// =====================================================================

require_once __DIR__ . '/../config/sesion.php';
iniciar_sesion();
header('Content-Type: application/json; charset=utf-8');

// ---------------------------------------------------------------------
//  GUARDIÁN DE SESIÓN
//  Si no existe usuario_id en la sesión, cortamos acá con 401.
// ---------------------------------------------------------------------
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["estado" => "error", "mensaje" => "Acceso no autorizado. Iniciá sesión."]);
    exit;
}

require_once __DIR__ . '/../config/conexion.php';

try {
    // 1. Datos del usuario (el id sale de la SESIÓN, no de lo que mande el cliente)
    $stmt = $pdo->prepare('SELECT nombre, email, rol FROM usuarios WHERE id = :id');
    $stmt->execute(['id' => $_SESSION['usuario_id']]);
    $usuario = $stmt->fetch();

    // Si el usuario fue borrado mientras tenía la sesión abierta
    if (!$usuario) {
        $_SESSION = [];
        session_destroy();
        http_response_code(401);
        echo json_encode(["estado" => "error", "mensaje" => "La sesión ya no es válida."]);
        exit;
    }

    // 2. Solo las solicitudes de ESTE usuario
    $stmt = $pdo->prepare(
        'SELECT id, parcela, analisis, muestras, total, estado, fecha
           FROM solicitudes
          WHERE usuario_id = :id
          ORDER BY fecha DESC, id DESC'
    );
    $stmt->execute(['id' => $_SESSION['usuario_id']]);
    $solicitudes = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        "estado" => "exito",
        "data"   => [
            "usuario"     => $usuario,
            "solicitudes" => $solicitudes,
        ],
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error interno del servidor."]);
}
