const URL_CATALOGO = "datos/parcelas.json";

let catalogo = [];
let estados = {};

let campoOrden ="id";
let ascendente = true;

const cuerpo = document.querySelector("#filas");
const salidaConteo = document.querySelector("#conteo");

const filtros = {
    id: document.querySelector("#fId"),
    nombre: document.querySelector("#fParcela"),
    cultivo: document.querySelector("#fCultivo"),
    sistema: document.querySelector("#fSistema"),
    plantas: document.querySelector("#fPlantas"),
    superficie: document.querySelector("#fSuperficie"),
    fecha: document.querySelector("#fFecha"),
    estado: document.querySelector("#fEstado"),
    activa: document.querySelector("#fActiva"),
};

function normalizar(texto) {
    return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fecha(iso) {
    if (!iso) return "-";
    const p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
}

function miles(n) {
    return n.toLocaleString("es-AR");
}

function contiene(valor, filtro) {
    const buscado = filtro.value.trim();
    if (buscado === "") return true;
    return normalizar(valor).includes(normalizar(buscado));
}

async function cargarCatalogo() {
  const respuesta = await fetch(URL_CATALOGO);
 
  if (!respuesta.ok) {
    throw new Error("El servidor respondió " + respuesta.status);
  }
 
  return await respuesta.json();
}


function filtrar() {
  let resultado = catalogo.filter(function (p) {
    return (
      contiene(p.id, filtros.id) &&
      contiene(p.nombre, filtros.nombre) &&
      contiene(p.cultivo, filtros.cultivo) &&
      contiene(miles(p.plantas), filtros.plantas) &&
      contiene(p.superficie, filtros.superficie) &&
      contiene(fecha(p.ultimoMuestreo), filtros.fecha) &&
      (filtros.sistema.value === "todos" || p.sistema === filtros.sistema.value) &&
      (filtros.estado.value === "todos" || String(p.estado) === filtros.estado.value) &&
      (filtros.activa.value === "todas" ||
        String(p.activa) === filtros.activa.value)
    );
  });

  resultado = [...resultado].sort(function (a, b) {
    let x = a[campoOrden];
    let y = b[campoOrden];
 
    if (typeof x === "string") {
      return ascendente ? x.localeCompare(y) : y.localeCompare(x);
    }
    return ascendente ? x - y : y - x;
  });
 
  dibujar(resultado);
}

function dibujar(parcelas) {
  if (parcelas.length === 0) {
    cuerpo.innerHTML =
      '<tr><td colspan="11" class="grilla__vacia">' +
      "No se encontraron parcelas con esos criterios.</td></tr>";
    salidaConteo.textContent = "Sin resultados";
    return;
  }
 
  cuerpo.innerHTML = parcelas
    .map(function (p, i) {
      const est = estados[p.estado];
      const inactiva = p.activa ? "" : ' class="grilla__inactiva"';
      const marca = p.activa ? " checked" : "";
 
      return `
        <tr${inactiva}>
          <td class="grilla__num">${i + 1}</td>
          <td>${p.id}</td>
          <td><a class="grilla__parcela" href="producto.html">${p.nombre}</a></td>
          <td>${p.cultivo}</td>
          <td>${p.sistema}</td>
          <td class="grilla__numero">${miles(p.plantas)}</td>
          <td class="grilla__numero">${p.superficie.toFixed(2).replace(".", ",")}</td>
          <td>${fecha(p.ultimoMuestreo)}</td>
          <td><span class="estado estado--${est.clase}">${est.etiqueta}</span></td>
          <td>
            <label class="interruptor">
              <input type="checkbox" aria-label="Parcela activa"${marca}>
              <span></span>
            </label>
          </td>
          <td>
            <a class="grilla__accion" href="producto.html" aria-label="Editar parcela">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
              </svg>
            </a>
          </td>
        </tr>`;
    })
    .join("");
 
  const plantas = parcelas.reduce((suma, p) => suma + p.plantas, 0);
 
  salidaConteo.innerHTML =
    "Mostrando <strong>" + parcelas.length + "</strong> de <strong>" +
    catalogo.length + "</strong> parcelas · " + miles(plantas) + " plantas";
}

function ordenarPor(evento) {
  evento.preventDefault();  
 
  const campo = evento.currentTarget.dataset.campo;
 

  if (campo === campoOrden) {
    ascendente = !ascendente;
  } else {
    campoOrden = campo;
    ascendente = true;
  }
 
  document.querySelectorAll(".grilla__orden").forEach(function (enlace) {
    enlace.classList.remove("grilla__orden--activo", "grilla__orden--desc");
  });
 
  evento.currentTarget.classList.add("grilla__orden--activo");
  if (!ascendente) {
    evento.currentTarget.classList.add("grilla__orden--desc");
  }
 
  filtrar();
}
 
 

 
function conectarEventos() {
  
  Object.values(filtros).forEach(function (campo) {
    const evento = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(evento, filtrar);
  });
 
  document.querySelectorAll(".grilla__orden").forEach(function (enlace) {
    enlace.addEventListener("click", ordenarPor);
  });
}
 

 
async function iniciar() {
  try {
    const datos = await cargarCatalogo();
 
    catalogo = datos.parcelas;
    estados = datos.estados;
 
    conectarEventos();
    filtrar();
  } catch (error) {
    cuerpo.innerHTML =
      '<tr><td colspan="11" class="grilla__vacia">' +
      "No se pudo cargar el catálogo. Verificá que la página se esté " +
      "sirviendo por HTTP.</td></tr>";
    console.error("Error al cargar el catálogo:", error);
  }
}
 
iniciar();
 