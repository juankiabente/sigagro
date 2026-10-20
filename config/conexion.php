<?php
// =====================================================================
//  Conexión a MySQL con PDO
//  Ajustá usuario y contraseña según tu XAMPP / WAMP / Laragon.
//  (En XAMPP por defecto: usuario "root" y contraseña vacía.)
// =====================================================================

$host    = 'localhost';
$db      = 'sigagro';
$user    = 'root';
$pass    = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // los errores lanzan excepciones
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // filas como arrays asociativos
    PDO::ATTR_EMULATE_PREPARES   => false,                  // consultas preparadas REALES en MySQL
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error de conexión con la base de datos."]);
    exit;
}
