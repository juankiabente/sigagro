<?php
// =====================================================================
//  Inicio de sesión seguro (se usa en login, logout y endpoints privados)
//  Se configura la cookie ANTES de llamar a session_start().
// =====================================================================

function iniciar_sesion()
{
    // Si la sesión ya está iniciada, no hacemos nada
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // ¿La página se está sirviendo por HTTPS?
    $esHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_set_cookie_params([
        'lifetime' => 0,         // la cookie se borra al cerrar el navegador
        'path'     => '/',
        'httponly' => true,      // JavaScript NO puede leer la cookie (protege contra XSS)
        'secure'   => $esHttps,  // en producción (HTTPS) la cookie solo viaja cifrada
        'samesite' => 'Lax',     // la cookie no se manda desde otros sitios (protege contra CSRF)
    ]);

    ini_set('session.use_strict_mode', '1'); // rechaza IDs de sesión inventados por el cliente

    session_start();
}
