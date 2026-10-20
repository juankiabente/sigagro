# SIGAgro

**Sistema de Información Geográfica Agropecuaria**

Proyecto de la materia Paradigmas y Lenguajes de Programación III.
Ingeniería en Sistemas de Información — 3.er año.
Desarrollado por el grupo **Nipintucu**.

## Integrantes

- Juan Carlos Abente ([@juankiabente](https://github.com/juankiabente))
- Emilia Auras  ([@emiauras](https://github.com/Emiauras))

## Descripción

SIGAgro permite a productores e ingenieros agrónomos registrar sus
establecimientos, delimitar parcelas sobre un mapa, definir puntos de
muestreo y llevar el historial de observaciones tomadas a campo.

El caso de estudio es la producción de yerba mate en Misiones.

## Estado actual: AE1 — Frontend estático

Maquetado en HTML5 y CSS3, sin frameworks ni librerías externas.

| Archivo | Sección |
|---|---|
| `index.html` | Portada |
| `listado_tabla.html` | Listado de parcelas en tabla |
| `listado_box.html` | Listado de parcelas en tarjetas |
| `producto.html` | Ficha de una parcela |
| `comprar.html` | Solicitud de servicio de muestreo |

**Demo:** https://juankiabente.github.io/sigagro/
**Documentación:** [docs/AE1-analisis-y-diseno.pdf](docs/AE1-analisis-y-diseno.pdf)

## AE3 — Autenticación segura (PHP + MySQL)

Se agregó login, registro y una sección privada: **Mi cuenta** (`cuenta.html`),
donde cada usuario ve sus propias solicitudes de análisis.

| Archivo | Qué hace |
|---|---|
| `sql/sigagro.sql` | Crea la base `sigagro`, las tablas `usuarios` y `solicitudes`, y un usuario demo |
| `config/conexion.php` | Conexión PDO a MySQL (consultas preparadas reales) |
| `config/sesion.php` | `iniciar_sesion()`: cookie `HttpOnly` + `SameSite` y luego `session_start()` |
| `api/registro.php` | Recibe JSON, hashea con `password_hash(..., PASSWORD_BCRYPT)` e inserta con PDO |
| `api/login.php` | Busca por email, valida con `password_verify()`, `session_regenerate_id(true)` y guarda `$_SESSION['usuario_id']` |
| `api/mis_solicitudes.php` | **Endpoint privado**: sin sesión responde `401 Unauthorized` |
| `api/logout.php` | Destruye la sesión y borra la cookie |
| `cuenta.html` + `js/cuenta.js` | SPA: al cargar hace `fetch()` al endpoint privado y muestra el login o el panel. Todo se renderiza con `.textContent` (anti-XSS) |

### Cómo probarlo en XAMPP

1. Copiar la carpeta del proyecto a `C:\xampp\htdocs\sigagro`.
2. Encender **Apache** y **MySQL** en el panel de XAMPP.
3. Entrar a `http://localhost/phpmyadmin` → **Importar** → elegir `sql/sigagro.sql`.
4. Si tu MySQL tiene contraseña, cambiarla en `config/conexion.php`.
5. Abrir `http://localhost/sigagro/cuenta.html`.

> Con Live Server **no funciona**: Live Server no ejecuta PHP. Hay que entrar por `localhost` (Apache).

**Usuario demo:** `demo@sigagro.com` / `sigagro123`

### Pruebas de seguridad realizadas

| Prueba | Resultado |
|---|---|
| `GET api/mis_solicitudes.php` sin sesión | `401 Unauthorized` |
| Login con email `' OR '1'='1' -- ` | `401`, la inyección no funciona |
| Contraseñas en la base | Se guardan como hash `$2y$10$...` (60 caracteres) |
| Registro con nombre `<script>alert(document.cookie)</script>` | Se muestra como texto, no se ejecuta |
| `document.cookie` desde JavaScript | Vacío: la cookie de sesión es `HttpOnly` |
| Recargar la página logueado | La sesión se mantiene sin reenviar la contraseña |
| Cerrar sesión y volver a pedir el endpoint | `401 Unauthorized` |

## Estructura

```
sigagro/
├── index.html          Páginas en la raíz
├── css/
│   ├── base.css        Tokens, tipografía y componentes compartidos
│   └── paginas.css     Estilos propios de cada sección
├── img/                Imágenes del sitio
└── docs/               Documentación de la cátedra
```

## Cómo verlo en local

1. Clonar el repositorio.
2. Abrir la carpeta en Visual Studio Code.
3. Clic derecho sobre `index.html` → *Open with Live Server*.

## Stack previsto

PHP 8.2 · Yii2 · MySQL 8 · Leaflet

## Convenciones

- Nombres de archivo en minúsculas, sin espacios, tildes ni ñ.
- Rutas relativas, nunca absolutas.
- Una rama por funcionalidad (`feat/nombre`), merge a `main` por Pull Request.
- `css/base.css` es compartido: cualquier cambio se acuerda entre los tres.
