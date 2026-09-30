const URL_LOTE = (id) => "datos/lote/" + id + ".json";

const ROLES_TECNICOS = ["tecnico", "agronomo", "administrador"];

const SISTEMAS = {
  suelo: "A campo",
  invernadero: "Invernadero",
  hidroponico: "Hidroponía",
};

const TIPOS = { hoja: "De hoja", fruto: "De fruto", raiz: "De raíz", tuberculo: "Tubérculo" };
const ROLES = { tecnico: "técnico", agronomo: "agrónomo", administrador: "administrador" };

// --- Estado del visor -------------------------------------------------------

const cache = new Map();     // lotes ya descargados: no se piden dos veces
let idSeleccionado = null;
let loteActual = null;
let vista = "general";       // "general" | "tecnica"

// --- Nodos del DOM ----------------------------------------------------------

const mapa = document.querySelector("#mapa");
const panel = document.querySelector("#visor");
const botonPanel = document.querySelector("#visorAbrir");
const contenido = document.querySelector("#visorContenido");
const selectorRol = document.querySelector("#visorRol");
const botonesVista = document.querySelectorAll(".visor__vista");
const botonTecnica = document.querySelector('.visor__vista[data-vista="tecnica"]');
const avisoRol = document.querySelector("#visorAvisoRol");
const botonCerrar = document.querySelector("#visorCerrar");
const lotesDelMapa = document.querySelectorAll(".mapa__parcela[data-id]");


/* --------------------------------------------------------------------------
   1. Utilidades
   -------------------------------------------------------------------------- */

function miles(n) {
  return n.toLocaleString("es-AR");
}

function fecha(iso) {
  if (!iso) return "—";
  const p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mes + "-" + dia;
}

// Días entre dos fechas ISO. Se fija la hora para evitar saltos por huso horario.
function diasEntre(desde, hasta) {
  const a = new Date(desde + "T00:00:00");
  const b = new Date(hasta + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

function puedeVerTecnica() {
  return ROLES_TECNICOS.includes(selectorRol.value);
}


/* --------------------------------------------------------------------------
   2. Consulta asíncrona del detalle
   -------------------------------------------------------------------------- */

async function obtenerLote(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const respuesta = await fetch(URL_LOTE(id));

  if (!respuesta.ok) {
    throw new Error("El servidor respondió " + respuesta.status);
  }

  const datos = await respuesta.json();
  cache.set(id, datos);
  return datos;
}

async function seleccionarLote(id) {
  idSeleccionado = id;
  marcarSeleccion(id);
  abrirPanel();

  panel.classList.add("visor--activo");
  contenido.innerHTML = '<p class="visor__estado">Cargando información del lote...</p>';

  try {
    const datos = await obtenerLote(id);

    // Si mientras esperábamos el usuario eligió otro lote, se descarta.
    if (idSeleccionado !== id) return;

    loteActual = datos;
    dibujar();
  } catch (error) {
    if (idSeleccionado !== id) return;

    contenido.innerHTML =
      '<p class="visor__estado visor__estado--error">No se pudo cargar la información del lote. ' +
      "Verificá que la página se esté sirviendo por HTTP.</p>";
    console.error("Error al cargar el lote " + id + ":", error);
  }
}


/* --------------------------------------------------------------------------
   3. Datos derivados

   En el AE2 el estado sanitario no es una columna del lote: se deriva de la
   severidad de las observaciones del último muestreo.
   -------------------------------------------------------------------------- */

function ultimoRelevamiento(observaciones) {
  if (observaciones.length === 0) return null;

  // Las fechas ISO se ordenan bien como texto.
  const ultimaFecha = observaciones.map((o) => o.fecha).sort().pop();
  const delDia = observaciones.filter((o) => o.fecha === ultimaFecha);

  return {
    fecha: ultimaFecha,
    severidadMaxima: Math.max(...delDia.map((o) => o.severidad)),
    fenologia: delDia[0].estado_fenologico,
  };
}

function estadoGeneral(datos) {
  if (datos.campana.estado !== "activa") {
    return { clase: "sin-datos", etiqueta: "Sin campaña activa" };
  }

  const ultimo = ultimoRelevamiento(datos.observaciones);

  if (!ultimo) return { clase: "sin-datos", etiqueta: "Sin muestreo" };
  if (ultimo.severidadMaxima >= 4) return { clase: "3", etiqueta: "Requiere intervención" };
  if (ultimo.severidadMaxima === 3) return { clase: "2", etiqueta: "En seguimiento" };
  return { clase: "1", etiqueta: "Sin novedades" };
}

function textoCosecha(campana) {
  if (campana.fecha_cosecha_real) {
    return "Cosechado el " + fecha(campana.fecha_cosecha_real);
  }

  const faltan = diasEntre(hoy(), campana.fecha_cosecha_estimada);

  if (faltan > 1) return "Faltan " + faltan + " días";
  if (faltan === 1) return "Falta 1 día";
  if (faltan === 0) return "Hoy";
  return "Demorada " + Math.abs(faltan) + " días";
}


/* --------------------------------------------------------------------------
   4. Inyección en el DOM
   -------------------------------------------------------------------------- */

function dato(etiqueta, valor) {
  return "<div><dt>" + etiqueta + "</dt><dd>" + valor + "</dd></div>";
}

function lista(valores, clase) {
  if (valores.length === 0) return '<span class="visor__nada">—</span>';
  return valores.map((v) => '<span class="' + clase + '">' + v + "</span>").join("");
}

function seccionGeneral(datos) {
  const { lote, campana } = datos;
  const estado = estadoGeneral(datos);
  const ultimo = ultimoRelevamiento(datos.observaciones);

  let filas =
    dato("Cultivo", campana.cultivo.nombre) +
    dato("Sistema", SISTEMAS[lote.sistema_cultivo]) +
    dato("Superficie", lote.superficie_ha.toFixed(2).replace(".", ",") + " ha") +
    dato("Plantas", miles(campana.cantidad_plantas));

  if (campana.estado === "activa") {
    filas +=
      dato("Siembra", fecha(campana.fecha_siembra)) +
      dato("Cosecha estimada", fecha(campana.fecha_cosecha_estimada)) +
      dato("Cosecha", textoCosecha(campana)) +
      dato("Último relevamiento", ultimo ? fecha(ultimo.fecha) : "—");
  } else {
    filas += dato("Última campaña", textoCosecha(campana));
  }

  return `
    <div class="visor__cabecera">
      <h3 class="visor__nombre">${lote.nombre}</h3>
      <span class="estado estado--${estado.clase}">${estado.etiqueta}</span>
    </div>
    <dl class="visor__datos">${filas}</dl>`;
}

function seccionTecnica(datos) {
  const { lote, campana, observaciones } = datos;
  const ultimo = ultimoRelevamiento(observaciones);

  if (campana.estado !== "activa" || !ultimo) {
    return '<p class="visor__estado">El lote no tiene observaciones en la campaña vigente.</p>';
  }

  const densidad = Math.round(campana.cantidad_plantas / lote.superficie_ha);
  const dias = diasEntre(campana.fecha_siembra, hoy());

  const resumen =
    dato("Tipo de cultivo", TIPOS[campana.cultivo.tipo]) +
    dato("Estado fenológico", ultimo.fenologia) +
    dato("Días desde siembra", dias) +
    dato("Densidad", miles(densidad) + " pl/ha") +
    dato("Puntos de muestreo", lote.puntos_muestreo_activos) +
    dato("Severidad máxima", ultimo.severidadMaxima + " de 5");

  // De la más reciente a la más antigua.
  const historial = [...observaciones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map(function (o) {
      const quien = o.usuario.apellido + " (" + ROLES[o.usuario.rol] + ")";
      return `
        <li class="visor__obs">
          <div class="visor__obs-cabecera">
            <span>${fecha(o.fecha)} · ${o.punto_codigo}</span>
            <span class="severidad severidad--${o.severidad}">Severidad ${o.severidad}</span>
          </div>
          <p class="visor__obs-meta">${o.estado_fenologico} · ${quien}</p>
          <div class="visor__obs-fila"><span>Plagas</span>${lista(o.plagas, "etiqueta etiqueta--plaga")}</div>
          <div class="visor__obs-fila"><span>Malezas</span>${lista(o.malezas, "etiqueta etiqueta--maleza")}</div>
          <p class="visor__obs-notas">${o.notas}</p>
        </li>`;
    })
    .join("");

  return `
    <dl class="visor__datos visor__datos--tecnicos">${resumen}</dl>
    <h4 class="visor__subtitulo">Historial de observaciones</h4>
    <ol class="visor__historial">${historial}</ol>`;
}

function dibujar() {
  if (!loteActual) return;

  let html = seccionGeneral(loteActual);

  if (vista === "tecnica" && puedeVerTecnica()) {
    html += seccionTecnica(loteActual);
  }

  html += '<a class="visor__enlace" href="producto.html">Ver ficha completa</a>';

  contenido.innerHTML = html;
}


/* --------------------------------------------------------------------------
   5. Estado visual de los controles
   -------------------------------------------------------------------------- */

function marcarSeleccion(id) {
  lotesDelMapa.forEach(function (enlace) {
    const esEste = Number(enlace.getAttribute("data-id")) === id;
    enlace.classList.toggle("mapa__parcela--seleccionada", esEste);
  });
}

function actualizarBotones() {
  botonesVista.forEach(function (boton) {
    const activo = boton.dataset.vista === vista;
    boton.classList.toggle("visor__vista--activa", activo);
    boton.setAttribute("aria-pressed", String(activo));
  });
}

function aplicarRol() {
  const permitido = puedeVerTecnica();

  botonTecnica.disabled = !permitido;
  avisoRol.hidden = permitido;

  // Si el rol ya no puede ver la vista técnica, se vuelve a la general.
  if (!permitido) vista = "general";

  actualizarBotones();
  dibujar();
}

function abrirPanel() {
  panel.classList.add("visor--abierto");
  mapa.classList.add("mapa--panel-abierto");
  botonPanel.setAttribute("aria-expanded", "true");
}

function cerrarPanel() {
  panel.classList.remove("visor--abierto");
  mapa.classList.remove("mapa--panel-abierto");
  botonPanel.setAttribute("aria-expanded", "false");
}

function alternarPanel() {
  if (panel.classList.contains("visor--abierto")) {
    cerrarPanel();
  } else {
    abrirPanel();
  }
}

function cerrar() {
  idSeleccionado = null;
  loteActual = null;
  marcarSeleccion(null);
  panel.classList.remove("visor--activo");
  cerrarPanel();
  contenido.innerHTML =
    '<p class="visor__estado">Seleccioná un lote en el mapa para ver su información.</p>';
}


/* --------------------------------------------------------------------------
   6. Conexión de los eventos
   -------------------------------------------------------------------------- */

function conectarEventos() {
  // Cada lote del mapa es un enlace a su ficha. Con JavaScript activo se
  // cancela la navegación y en su lugar se abre el visor.
  lotesDelMapa.forEach(function (enlace) {
    enlace.addEventListener("click", function (evento) {
      evento.preventDefault();
      seleccionarLote(Number(enlace.getAttribute("data-id")));
    });
  });

  // Botones de alternancia entre vistas.
  botonesVista.forEach(function (boton) {
    boton.addEventListener("click", function () {
      vista = boton.dataset.vista;
      actualizarBotones();
      dibujar();
    });
  });

  botonPanel.addEventListener("click", alternarPanel);

  // Al cerrar con la ×, el foco vuelve al ☰ para quien navega con teclado.
  botonCerrar.addEventListener("click", function () {
    cerrar();
    botonPanel.focus();
  });

  // Esc cierra el panel sin perder la selección.
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && panel.classList.contains("visor--abierto")) {
      cerrarPanel();
      botonPanel.focus();
    }
  });

  selectorRol.addEventListener("change", aplicarRol);
  botonCerrar.addEventListener("click", cerrar);
}


/* --------------------------------------------------------------------------
   7. Arranque
   -------------------------------------------------------------------------- */

conectarEventos();
aplicarRol();
cerrar();
