// Renderizado del DOM y notificaciones (Toastify / SweetAlert2)
const elementos = {
  grid: document.getElementById("gridLibros"),
  estadoCarga: document.getElementById("estadoCarga"),
  errorCarga: document.getElementById("errorCarga"),
  mensajeError: document.getElementById("mensajeError"),
  btnReintentar: document.getElementById("btnReintentar"),
  inputBusqueda: document.getElementById("inputBusqueda"),
  selectGenero: document.getElementById("selectGenero"),
  selectOrden: document.getElementById("selectOrden"),
  listaCarrito: document.getElementById("listaCarrito"),
  carritoVacio: document.getElementById("carritoVacio"),
  contadorCarrito: document.getElementById("contadorCarrito"),
  formCheckout: document.getElementById("formCheckout"),
  selectEnvio: document.getElementById("selectEnvio"),
  selectPago: document.getElementById("selectPago"),
  errorFormulario: document.getElementById("errorFormulario"),
  resumen: document.getElementById("resumen"),
  btnVaciar: document.getElementById("btnVaciar"),
  listaPedidos: document.getElementById("listaPedidos"),
  btnBorrarHistorial: document.getElementById("btnBorrarHistorial")
};

const formatearPrecio = (monto) =>
  monto.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const mostrarCarga = (cargando) => {
  elementos.estadoCarga.hidden = !cargando;
};

const mostrarErrorCarga = (mensaje) => {
  elementos.mensajeError.textContent = mensaje;
  elementos.errorCarga.hidden = false;
};

const ocultarErrorCarga = () => {
  elementos.errorCarga.hidden = true;
};

const renderOpcionesSelect = (select, opciones) => {
  select.innerHTML = opciones
    .map(({ id, nombre }) => `<option value="${id}">${nombre}</option>`)
    .join("");
};

const renderGeneros = (libros) => {
  const generos = [...new Set(libros.map((libro) => libro.genero))];
  generos.forEach((genero) => {
    elementos.selectGenero.insertAdjacentHTML("beforeend", `<option value="${genero}">${genero}</option>`);
  });
};

const renderLibros = (libros, carrito) => {
  if (libros.length === 0) {
    elementos.grid.innerHTML = `<p class="estado">No hay libros que coincidan con la búsqueda.</p>`;
    return;
  }

  elementos.grid.innerHTML = libros
    .map(({ id, titulo, autor, genero, precio, stock, portada }) => {
      const enCarrito = carrito.some((item) => item.id === id);
      const sinStock = stock === 0;
      const textoBoton = sinStock ? "Sin stock" : enCarrito ? "Agregar otro" : "Agregar al carrito";

      return `
        <article class="tarjeta ${sinStock ? "tarjeta--agotado" : ""}">
          <img src="${portada}" alt="Tapa de ${titulo}" class="tarjeta__tapa" loading="lazy">
          <div class="tarjeta__info">
            <span class="etiqueta">${genero}</span>
            <h3>${titulo}</h3>
            <p class="tarjeta__autor">${autor}</p>
            <p class="tarjeta__precio">${formatearPrecio(precio)}</p>
            <button type="button" class="btn btn--primario" data-agregar="${id}" ${sinStock ? "disabled" : ""}>
              ${textoBoton}
            </button>
          </div>
        </article>`;
    })
    .join("");
};

const renderCarrito = (itemsDetallados) => {
  const hayItems = itemsDetallados.length > 0;
  elementos.carritoVacio.hidden = hayItems;
  elementos.formCheckout.hidden = !hayItems;

  elementos.listaCarrito.innerHTML = itemsDetallados
    .map(({ id, titulo, precio, cantidad, stock }) => `
      <li class="carrito__item">
        <div>
          <strong>${titulo}</strong>
          <span class="carrito__precio">${formatearPrecio(precio * cantidad)}</span>
        </div>
        <div class="cantidad">
          <button type="button" class="btn-cantidad" data-restar="${id}" aria-label="Restar uno">−</button>
          <span>${cantidad}</span>
          <button type="button" class="btn-cantidad" data-sumar="${id}" aria-label="Sumar uno" ${cantidad >= stock ? "disabled" : ""}>+</button>
          <button type="button" class="btn-eliminar" data-eliminar="${id}" aria-label="Eliminar ${titulo}">Quitar</button>
        </div>
      </li>`)
    .join("");

  const unidades = itemsDetallados.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  elementos.contadorCarrito.textContent = unidades;
};

const renderResumen = ({ subtotal, ajuste, costoEnvio, total }) => {
  const etiquetaAjuste = ajuste < 0 ? "Descuento" : "Recargo";
  elementos.resumen.innerHTML = `
    <p><span>Subtotal</span><span>${formatearPrecio(subtotal)}</span></p>
    ${ajuste !== 0 ? `<p><span>${etiquetaAjuste}</span><span>${formatearPrecio(ajuste)}</span></p>` : ""}
    <p><span>Envío</span><span>${costoEnvio === 0 ? "Gratis" : formatearPrecio(costoEnvio)}</span></p>
    <p class="resumen__total"><span>Total</span><span>${formatearPrecio(total)}</span></p>`;
};

const renderPedidos = (pedidos) => {
  elementos.btnBorrarHistorial.hidden = pedidos.length === 0;
  elementos.listaPedidos.innerHTML = pedidos.length
    ? pedidos
        .map(({ numero, fecha, total, unidades }) => `
          <li><strong>#${numero}</strong> · ${fecha} · ${unidades} libro(s) · ${formatearPrecio(total)}</li>`)
        .join("")
    : `<li class="estado">Todavía no hay pedidos.</li>`;
};

const mostrarErrorFormulario = (mensaje) => {
  elementos.errorFormulario.textContent = mensaje;
  elementos.errorFormulario.hidden = !mensaje;
};

const notificar = (mensaje, tipo = "exito") => {
  Toastify({
    text: mensaje,
    duration: 2500,
    gravity: "bottom",
    position: "right",
    style: { background: tipo === "exito" ? "#1f6f5c" : "#a23b3b" }
  }).showToast();
};

const pedirConfirmacion = async (titulo, texto, textoBoton = "Sí, confirmar") => {
  const { isConfirmed } = await Swal.fire({
    title: titulo,
    html: texto,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1f6f5c"
  });
  return isConfirmed;
};
