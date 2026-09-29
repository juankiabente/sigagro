const URL_CATALOGO = "datos/parcelas.json";

let catalogo = [];
let estados = {};

const campoBusqueda = document.querySelector("#busqueda");
const filtroSistema = document.querySelector("#filtroSistema");
const filtroEstado = document.querySelector("#filtroEstado");
const orden = document.querySelector("#orden");
const contenedor = document.querySelector("#resultados");
const salidaConteo = document.querySelector("#conteo");
const botonLimpiar = document.querySelector("#limpiar");

function normalizar(texto) {
    return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fecha(iso) {
    if (!iso) return "-";
    const partes = iso.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function miles(n) {
    return n.toLocaleString("es-AR");
}

async function cargarCatalogo() {
    const respuesta = await fetch(URL_CATALOGO);

    if (!respuesta.ok) {
        throw new Error("El servidor respondio " +  respuesta.status);
    }

    return await respuesta.json();
}

function filtrar() {
    const texto = normalizar(campoBusqueda.value.trim());
    const sistema = filtroSistema.value;
    const estado = filtroEstado.value;

    let resultado = catalogo.filter(function (parcela) {
        const coincideTexto = 
        texto === "" || 
        normalizar(parcela.nombre).includes(texto) ||
        normalizar(parcela.cultivo).includes(texto);

        const coincideSistema = sistema === "todos" || parcela.sistema === sistema;

        const coincideEstado = estado === "todos"  || String(parcela.estado) === estado;

        return coincideTexto && coincideSistema && coincideEstado;
    });


    resultado = [...resultado].sort(function (a, b) {
        if (orden.value === "plantas") return b.plantas - a.plantas;
        if (orden.value === "superficie") return b.superficie - a.superficie;
        if (orden.value === "estado") return b.estado - a.estado;
        return a.id - b.id;
    });

    dibujar(resultado);
}


function dibujar(parcelas) {
    if (parcelas.length === 0) {
        contenedor.innerHTML = 
        '<p class="sin-resultados">No se econtraron parcelas con esos criterios.</p>';
        salidaConteo.textContent = "Sin Resultados";
        return;
    }


contenedor.innerHTML = parcelas
    .map(function (p) {
        const est = estados[p.estado];
        const inactiva = p.activa ? "" : " tarjeta--inactiva";
        const guion = p.activa ? "0" : "6 5";

        return `
        <a class="tarjeta${inactiva}" href="producto.html">
          <div class="tarjeta__vista">
            <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="320" height="180" fill="#243016"/>
              <ellipse cx="70" cy="150" rx="120" ry="70" fill="#2f4020" opacity="0.6"/>
              <path d="M-10 130 C 60 118, 130 152, 200 136 S 300 112, 330 122"
                    fill="none" stroke="#2b4a63" stroke-width="9" opacity="0.85"/>
              <polygon points="72,48 246,38 258,124 84,136" fill="${est.color}"
                       fill-opacity="0.82" stroke="#f2f4ee" stroke-width="2"
                       stroke-dasharray="${guion}"/>
              <g fill="#f2b544" stroke="#ffffff" stroke-width="1.5">
                <circle cx="120" cy="70" r="5"/><circle cx="175" cy="66" r="5"/>
                <circle cx="220" cy="78" r="5"/><circle cx="128" cy="105" r="5"/>
                <circle cx="180" cy="100" r="5"/><circle cx="228" cy="108" r="5"/>
              </g>
            </svg>
          </div>
          <div class="tarjeta__cuerpo">
            <div class="tarjeta__encabezado">
              <p class="tarjeta__nombre">${p.nombre}</p>
              <span class="estado estado--${est.clase}">${est.etiqueta}</span>
            </div>
            <p class="tarjeta__cultivo">${p.cultivo} · ${p.sistema}</p>
            <div class="tarjeta__datos">
              <p class="tarjeta__dato"><span>Plantas</span><strong>${miles(p.plantas)}</strong></p>
              <p class="tarjeta__dato"><span>Superficie</span><strong>${p.superficie} ha</strong></p>
              <p class="tarjeta__dato"><span>Últ. muestreo</span><strong>${fecha(p.ultimoMuestreo)}</strong></p>
              <p class="tarjeta__dato"><span>Id</span><strong>${p.id}</strong></p>
            </div>
          </div>
        </a>`;
    })
    .join("");

    const plantas = parcelas.reduce((suma, p) => suma + p.plantas, 0);

    salidaConteo.innerHTML = 
    "Mostrando <strong>" + parcelas.length + "</strong> de <strong>" +
    catalogo.length + "</strong> parcelas · " + miles(plantas) + " plantas";
}

function limpiar() {
    campoBusqueda.value = "";
    filtroSistema.value = "todos";
    filtroEstado.value = "todos";
    orden.value ="id";
    filtrar();
    campoBusqueda.focus();
}

function conectarEventos() {
    campoBusqueda.addEventListener("input", filtrar);
    filtroSistema.addEventListener("change", filtrar);
    filtroEstado.addEventListener("change", filtrar);
    orden.addEventListener("change", filtrar);
    botonLimpiar.addEventListener("click", limpiar);
}


async function iniciar() {
    try {
        const datos = await cargarCatalogo();

        catalogo = datos.parcelas;
        estados = datos.estados;

        conectarEventos();
        filtrar();
    } catch (error) {
        contenedor.innerHTML = 
        '<p class="sin-resultados">No se pudo cargar el catalogo de parcelas. ' +
        "verifica que la pagina se este sirviendo por HTTP.</p>";
        console.error("Error al cargar el catalogo:", error);
    }
}

iniciar();