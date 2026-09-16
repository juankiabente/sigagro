

const filas = document.querySelectorAll(".opcion--analisis");
const salidaTotal = document.querySelector("#total");
const salidaCantidad = document.querySelector("#cantidad");



function pesos(valor) {
  return "$ " + valor.toLocaleString("es-AR");
}



function calcular() {
  let total = 0;       
  let muestras = 0;

  filas.forEach(function (fila) {

    const casilla = fila.querySelector('input[type="checkbox"]');
    const campoCantidad = fila.querySelector(".opcion__cantidad");
    const salidaSubtotal = fila.querySelector(".opcion__subtotal");


    const precio = Number(casilla.dataset.precio);
    const cantidad = Number(campoCantidad.value) || 0;


    const subtotal = casilla.checked ? precio * cantidad : 0;

    
    salidaSubtotal.textContent = pesos(subtotal);


    if (casilla.checked) {
      fila.classList.remove("opcion--apagada");
      campoCantidad.disabled = false;
      muestras = muestras + cantidad;
    } else {
      fila.classList.add("opcion--apagada");
      campoCantidad.disabled = true;
    }

    total = total + subtotal;
  });



  salidaTotal.textContent = pesos(total);

  
  salidaCantidad.textContent =
    muestras === 1 ? "1 muestra" : muestras + " muestras";
}



filas.forEach(function (fila) {
  fila.querySelector('input[type="checkbox"]').addEventListener("change", calcular);
  fila.querySelector(".opcion__cantidad").addEventListener("input", calcular);
});



calcular();