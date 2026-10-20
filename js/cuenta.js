// =====================================================================
//  SIGAgro — cuenta.js
//  SPA de "Mi cuenta": login, registro y panel privado.
//
//  Regla de seguridad (XSS): todo dato que viene del servidor o del
//  usuario se muestra con .textContent, NUNCA con .innerHTML.
//  Así, si alguien se registra con el nombre <script>...</script>,
//  el navegador lo muestra como texto y no lo ejecuta.
// =====================================================================

const API = {
  login:       "api/login.php",
  registro:    "api/registro.php",
  logout:      "api/logout.php",
  privado:     "api/mis_solicitudes.php", // endpoint protegido (401 sin sesión)
};

const ROLES = {
  productor:     "Productor",
  tecnico:       "Técnico",
  agronomo:      "Ingeniero agrónomo",
  administrador: "Administrador",
};

// Estado de cada solicitud → etiqueta y clase de color de base.css
const ESTADOS = {
  pendiente:      { texto: "Pendiente",      clase: "estado--sin-datos" },
  en_laboratorio: { texto: "En laboratorio", clase: "estado--2" },
  finalizada:     { texto: "Finalizada",     clase: "estado--1" },
};

// --- Nodos del DOM ----------------------------------------------------

const vistaCargando = document.querySelector("#vista-cargando");
const vistaPublica  = document.querySelector("#vista-publica");
const vistaPrivada  = document.querySelector("#vista-privada");

const tabLogin      = document.querySelector("#tab-login");
const tabRegistro   = document.querySelector("#tab-registro");
const vistaLogin    = document.querySelector("#vista-login");
const vistaRegistro = document.querySelector("#vista-registro");

const formLogin     = document.querySelector("#form-login");
const formRegistro  = document.querySelector("#form-registro");
const msgLogin      = document.querySelector("#msg-login");
const msgRegistro   = document.querySelector("#msg-registro");

const barraUsuario  = document.querySelector("#barra-usuario");
const userNombre    = document.querySelector("#user-nombre");
const userEmail     = document.querySelector("#user-email");
const userRol       = document.querySelector("#user-rol");
const btnLogout     = document.querySelector("#btn-logout");

const tablaSolicitudes = document.querySelector("#tabla-solicitudes");
const filasSolicitudes = document.querySelector("#filas-solicitudes");
const sinSolicitudes   = document.querySelector("#sin-solicitudes");


/* --------------------------------------------------------------------
   1. Utilidades
   -------------------------------------------------------------------- */

function fecha(iso) {
  const p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function pesos(n) {
  return "$ " + Number(n).toLocaleString("es-AR");
}

function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;               // textContent: seguro contra XSS
  elemento.className = "mensaje mensaje--" + tipo;
}

function ocultarMensaje(elemento) {
  elemento.textContent = "";
  elemento.className = "mensaje";
}

// POST con cuerpo JSON. Devuelve { ok, status, datos }
async function enviarJSON(url, cuerpo) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  return { ok: respuesta.ok, status: respuesta.status, datos };
}


/* --------------------------------------------------------------------
   2. Alternar el DOM según haya o no sesión
   -------------------------------------------------------------------- */

function mostrarVistaPublica(pestana) {
  vistaCargando.classList.add("oculto");
  vistaPrivada.classList.add("oculto");
  vistaPublica.classList.remove("oculto");

  barraUsuario.textContent = "Ingresar";

  const esLogin = pestana !== "registro";

  tabLogin.classList.toggle("pestana--activa", esLogin);
  tabRegistro.classList.toggle("pestana--activa", !esLogin);
  tabLogin.setAttribute("aria-selected", String(esLogin));
  tabRegistro.setAttribute("aria-selected", String(!esLogin));

  vistaLogin.classList.toggle("oculto", !esLogin);
  vistaRegistro.classList.toggle("oculto", esLogin);
}

function mostrarVistaPrivada(usuario, solicitudes) {
  vistaCargando.classList.add("oculto");
  vistaPublica.classList.add("oculto");
  vistaPrivada.classList.remove("oculto");

  // Renderizado seguro: SIEMPRE textContent
  barraUsuario.textContent = usuario.nombre.split(" ")[0];
  userNombre.textContent   = usuario.nombre;
  userEmail.textContent    = usuario.email;
  userRol.textContent      = ROLES[usuario.rol] || usuario.rol;

  dibujarSolicitudes(solicitudes);
}

// Arma la tabla creando los elementos uno por uno (sin innerHTML)
function dibujarSolicitudes(solicitudes) {
  filasSolicitudes.replaceChildren(); // vacía el tbody

  const hay = solicitudes.length > 0;
  sinSolicitudes.classList.toggle("oculto", hay);
  tablaSolicitudes.classList.toggle("oculto", !hay);

  solicitudes.forEach(function (s) {
    const fila = document.createElement("tr");

    agregarCelda(fila, s.id);
    agregarCelda(fila, fecha(s.fecha));
    agregarCelda(fila, s.parcela);
    agregarCelda(fila, s.analisis);
    agregarCelda(fila, s.muestras, "grilla__numero");
    agregarCelda(fila, pesos(s.total), "grilla__numero");

    const est = ESTADOS[s.estado] || { texto: s.estado, clase: "estado--sin-datos" };
    const etiqueta = document.createElement("span");
    etiqueta.className = "estado " + est.clase;
    etiqueta.textContent = est.texto;

    const celdaEstado = document.createElement("td");
    celdaEstado.appendChild(etiqueta);
    fila.appendChild(celdaEstado);

    filasSolicitudes.appendChild(fila);
  });
}

function agregarCelda(fila, valor, clase) {
  const celda = document.createElement("td");
  celda.textContent = valor;
  if (clase) celda.className = clase;
  fila.appendChild(celda);
}


/* --------------------------------------------------------------------
   3. Al cargar la página: ¿hay sesión? (fetch al endpoint privado)
   -------------------------------------------------------------------- */

async function comprobarSesion() {
  try {
    const respuesta = await fetch(API.privado);

    // 401 = no hay sesión → mostramos login
    if (respuesta.status === 401) {
      mostrarVistaPublica("login");
      return;
    }

    const resultado = await respuesta.json();

    if (respuesta.ok && resultado.estado === "exito") {
      mostrarVistaPrivada(resultado.data.usuario, resultado.data.solicitudes);
    } else {
      mostrarVistaPublica("login");
      mostrarMensaje(msgLogin, resultado.mensaje || "No se pudo verificar la sesión.", "error");
    }
  } catch (error) {
    mostrarVistaPublica("login");
    mostrarMensaje(msgLogin,
      "No se pudo conectar con el servidor. Verificá que XAMPP (Apache y MySQL) esté encendido.",
      "error");
    console.error("Error al comprobar la sesión:", error);
  }
}


/* --------------------------------------------------------------------
   4. Login
   -------------------------------------------------------------------- */

async function iniciarSesion(evento) {
  evento.preventDefault();
  mostrarMensaje(msgLogin, "Verificando credenciales…", "info");

  try {
    const { ok, datos } = await enviarJSON(API.login, {
      email: document.querySelector("#login-email").value.trim(),
      password: document.querySelector("#login-pass").value,
    });

    if (ok && datos.estado === "exito") {
      ocultarMensaje(msgLogin);
      formLogin.reset();
      // Ya hay cookie de sesión: pedimos los datos privados
      comprobarSesion();
    } else {
      mostrarMensaje(msgLogin, datos.mensaje || "Credenciales incorrectas.", "error");
    }
  } catch (error) {
    mostrarMensaje(msgLogin, "Error de conexión con el servidor.", "error");
  }
}


/* --------------------------------------------------------------------
   5. Registro
   -------------------------------------------------------------------- */

async function registrarUsuario(evento) {
  evento.preventDefault();
  mostrarMensaje(msgRegistro, "Creando cuenta…", "info");

  try {
    const { ok, datos } = await enviarJSON(API.registro, {
      nombre: document.querySelector("#reg-nombre").value.trim(),
      email: document.querySelector("#reg-email").value.trim(),
      password: document.querySelector("#reg-pass").value,
    });

    if (ok && datos.estado === "exito") {
      formRegistro.reset();
      mostrarVistaPublica("login");
      mostrarMensaje(msgLogin, "¡Cuenta creada! Ya podés iniciar sesión.", "exito");
    } else {
      mostrarMensaje(msgRegistro, datos.mensaje || "No se pudo crear la cuenta.", "error");
    }
  } catch (error) {
    mostrarMensaje(msgRegistro, "Error de conexión con el servidor.", "error");
  }
}


/* --------------------------------------------------------------------
   6. Logout
   -------------------------------------------------------------------- */

async function cerrarSesion() {
  try {
    await fetch(API.logout, { method: "POST" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
  mostrarVistaPublica("login");
  mostrarMensaje(msgLogin, "Sesión cerrada correctamente.", "info");
}


/* --------------------------------------------------------------------
   7. Eventos y arranque
   -------------------------------------------------------------------- */

tabLogin.addEventListener("click", function () {
  ocultarMensaje(msgLogin);
  mostrarVistaPublica("login");
});

tabRegistro.addEventListener("click", function () {
  ocultarMensaje(msgRegistro);
  mostrarVistaPublica("registro");
});

formLogin.addEventListener("submit", iniciarSesion);
formRegistro.addEventListener("submit", registrarUsuario);
btnLogout.addEventListener("click", cerrarSesion);

// Si se llega desde el menú "Cerrar sesión" de otra página (cuenta.html?salir=1)
if (new URLSearchParams(location.search).get("salir") === "1") {
  history.replaceState(null, "", "cuenta.html");
  cerrarSesion();
} else {
  comprobarSesion();
}
