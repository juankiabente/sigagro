<?php
// =====================================================================
//  POST api/login.php
//  Recibe JSON { email, password }, valida con password_verify()
//  y crea la sesión en el servidor.
// =====================================================================

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../config/sesion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

// 1. Leer el JSON
$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Ingresá correo y contraseña."]);
    exit;
}

try {
    // 2. Consulta preparada: buscamos al usuario SOLO por email.
    //    La contraseña nunca va dentro del SQL.
    $stmt = $pdo->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $usuario = $stmt->fetch();

    // 3. Comparamos la contraseña escrita con el hash BCRYPT guardado
    if ($usuario && password_verify($password, $usuario['password'])) {

        // 4. Credenciales correctas: iniciamos la sesión
        iniciar_sesion();
        session_regenerate_id(true); // ID nuevo: evita la "fijación de sesión"

        // 5. Guardamos el identificador del usuario en el servidor
        $_SESSION['usuario_id']     = $usuario['id'];
        $_SESSION['usuario_nombre'] = $usuario['nombre'];
        $_SESSION['usuario_rol']    = $usuario['rol'];

        http_response_code(200);
        echo json_encode([
            "estado"  => "exito",
            "mensaje" => "Autenticación exitosa.",
            "usuario" => [
                "nombre" => $usuario['nombre'],
                "email"  => $usuario['email'],
                "rol"    => $usuario['rol'],
            ],
            // Nunca devolvemos el hash de la contraseña
        ], JSON_UNESCAPED_UNICODE);

    } else {
        // Mismo mensaje si falla el email o la contraseña: no damos pistas
        http_response_code(401); // Unauthorized
        echo json_encode(["estado" => "error", "mensaje" => "Correo o contraseña incorrectos."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error interno del servidor."]);
}
