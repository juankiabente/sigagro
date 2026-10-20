<?php
// =====================================================================
//  POST api/registro.php
//  Recibe JSON { nombre, email, password } y da de alta un usuario.
//  La contraseña se guarda como hash BCRYPT, nunca en texto plano.
// =====================================================================

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/conexion.php';

// Solo se acepta POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

// 1. Leer el JSON que manda el frontend con fetch()
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$nombre   = trim($input['nombre'] ?? '');
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// IMPORTANTE: el nombre se guarda TAL CUAL lo escribió el usuario.
// La protección contra XSS se hace al MOSTRARLO (con .textContent en el
// frontend o htmlspecialchars() si se imprime desde PHP), no al guardarlo.

// 2. Validaciones básicas
if ($nombre === '' || $email === '' || $password === '') {
    http_response_code(400); // Bad Request
    echo json_encode(["estado" => "error", "mensaje" => "Todos los campos son obligatorios."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "El correo electrónico no es válido."]);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "La contraseña debe tener al menos 6 caracteres."]);
    exit;
}

// 3. Hasheo BCRYPT de la contraseña
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

try {
    // 4. Inserción con consulta preparada (PDO Prepared Statement)
    $sql  = "INSERT INTO usuarios (nombre, email, password) VALUES (:nombre, :email, :pass)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'nombre' => $nombre,
        'email'  => $email,
        'pass'   => $passwordHash,
    ]);

    http_response_code(201); // Created
    echo json_encode(["estado" => "exito", "mensaje" => "Usuario registrado correctamente."]);

} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409); // Conflict: el email ya existe (columna UNIQUE)
        echo json_encode(["estado" => "error", "mensaje" => "El correo electrónico ya está registrado."]);
    } else {
        http_response_code(500);
        echo json_encode(["estado" => "error", "mensaje" => "Error interno al registrar el usuario."]);
    }
}
