// Lógica del simulador: catálogo → carrito → checkout → confirmación
const estado = {
  libros: [],
  envios: [],
  mediosPago: [],
  carrito: carritoStorage.obtener()
};

const cargarJSON = async (ruta) => {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta} (estado ${respuesta.status})`);
  }
  return respuesta.json();
};

const buscarLibro = (id) => estado.libros.find((libro) => libro.id === id);

const obtenerItemsDetallados = () =>
  estado.carrito
    .map(({ id, cantidad }) => ({ ...buscarLibro(id), cantidad }))
    .filter((item) => item.titulo);

const calcularTotales = () => {
  const items = obtenerItemsDetallados();
  const subtotal = items.reduce((acumulado, { precio, cantidad }) => acumulado + precio * cantidad, 0);

  const medioPago = estado.mediosPago.find(({ id }) => id === elementos.selectPago.value) || estado.mediosPago[0];
  const envio = estado.envios.find(({ id }) => id === elementos.selectEnvio.value) || estado.envios[0];

  const ajuste = Math.round(subtotal * medioPago.ajuste);
  const costoEnvio = subtotal >= envio.gratisDesde && envio.gratisDesde > 0 ? 0 : envio.costo;
  const total = subtotal + ajuste + costoEnvio;
  const unidades = items.reduce((acumulado, { cantidad }) => acumulado + cantidad, 0);

  return { items, subtotal, ajuste, costoEnvio, total, unidades, envio, medioPago };
};

const obtenerLibrosFiltrados = () => {
  const texto = elementos.inputBusqueda.value.trim().toLowerCase();
  const genero = elementos.selectGenero.value;
  const orden = elementos.selectOrden.value;

  const filtrados = estado.libros.filter(({ titulo, autor, genero: generoLibro }) => {
    const coincideTexto = `${titulo} ${autor}`.toLowerCase().includes(texto);
    const coincideGenero = genero === "todos" || generoLibro === genero;
    return coincideTexto && coincideGenero;
  });

  const criterios = {
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    titulo: (a, b) => a.titulo.localeCompare(b.titulo)
  };

  return criterios[orden] ? [...filtrados].sort(criterios[orden]) : filtrados;
};

const actualizarVista = () => {
  renderLibros(obtenerLibrosFiltrados(), estado.carrito);
  renderCarrito(obtenerItemsDetallados());
  renderResumen(calcularTotales());
};

const guardarCarrito = (nuevoCarrito) => {
  estado.carrito = nuevoCarrito;
  nuevoCarrito.length ? carritoStorage.guardar(nuevoCarrito) : carritoStorage.vaciar();
  actualizarVista();
};

const agregarAlCarrito = (id) => {
  const libro = buscarLibro(id);
  const itemExistente = estado.carrito.find((item) => item.id === id);
  const cantidadActual = itemExistente?.cantidad || 0;

  if (cantidadActual >= libro.stock) {
    notificar(`No hay más stock de "${libro.titulo}"`, "error");
    return;
  }

  const nuevoCarrito = itemExistente
    ? estado.carrito.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item))
    : [...estado.carrito, { id, cantidad: 1 }];

  guardarCarrito(nuevoCarrito);
  notificar(`"${libro.titulo}" agregado al carrito`);
};

const cambiarCantidad = (id, diferencia) => {
  const nuevoCarrito = estado.carrito
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + diferencia } : item))
    .filter(({ cantidad }) => cantidad > 0);
  guardarCarrito(nuevoCarrito);
};

const eliminarDelCarrito = async (id) => {
  const { titulo } = buscarLibro(id);
  const confirmado = await pedirConfirmacion("¿Quitar del carrito?", `Se quitará <b>${titulo}</b>.`, "Quitar");
  if (!confirmado) return;

  guardarCarrito(estado.carrito.filter((item) => item.id !== id));
  notificar(`"${titulo}" quitado del carrito`, "error");
};

const vaciarCarrito = async () => {
  const confirmado = await pedirConfirmacion("¿Vaciar el carrito?", "Se quitarán todos los libros.", "Vaciar");
  if (!confirmado) return;

  guardarCarrito([]);
  notificar("Carrito vaciado", "error");
};

const validarFormulario = ({ nombre, email }) => {
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!nombre.trim()) return "Ingresá tu nombre y apellido.";
  if (!emailValido) return "Ingresá un email válido.";
  return "";
};

const simularProcesamiento = () => new Promise((resolver) => setTimeout(resolver, 1200));

const confirmarCompra = async (evento) => {
  evento.preventDefault();
  const datosCliente = Object.fromEntries(new FormData(elementos.formCheckout));
  const { nombre, email } = datosCliente;

  const errorValidacion = validarFormulario(datosCliente);
  mostrarErrorFormulario(errorValidacion);
  if (errorValidacion) return;

  const { items, total, unidades, envio, medioPago } = calcularTotales();
  const detalle = items.map(({ titulo, cantidad }) => `${cantidad} × ${titulo}`).join("<br>");

  const confirmado = await pedirConfirmacion(
    "Confirmar compra",
    `${detalle}<hr>${envio.nombre} · ${medioPago.nombre}<br><b>Total: ${formatearPrecio(total)}</b>`,
    "Pagar"
  );
  if (!confirmado) return;

  Swal.fire({ title: "Procesando pago…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  await simularProcesamiento();

  items.forEach(({ id, cantidad }) => {
    buscarLibro(id).stock -= cantidad;
  });

  const numeroPedido = Date.now().toString().slice(-6);
  pedidosStorage.agregar({
    numero: numeroPedido,
    fecha: new Date().toLocaleDateString("es-AR"),
    cliente: nombre,
    total,
    unidades
  });

  elementos.formCheckout.reset();
  guardarCarrito([]);
  renderPedidos(pedidosStorage.obtener());

  Swal.fire({
    icon: "success",
    title: `¡Gracias, ${nombre.split(" ")[0]}!`,
    html: `Tu pedido <b>#${numeroPedido}</b> fue confirmado.<br>Te enviamos el detalle a ${email}.`,
    confirmButtonColor: "#1f6f5c"
  });
};

const borrarHistorial = async () => {
  const confirmado = await pedirConfirmacion("¿Borrar historial?", "Se eliminarán todos los pedidos guardados.", "Borrar");
  if (!confirmado) return;

  pedidosStorage.borrarTodo();
  renderPedidos([]);
  notificar("Historial borrado", "error");
};

const manejarClicCatalogo = ({ target }) => {
  const boton = target.closest("[data-agregar]");
  if (boton) agregarAlCarrito(Number(boton.dataset.agregar));
};

const manejarClicCarrito = ({ target }) => {
  const { sumar, restar, eliminar } = target.dataset;
  if (sumar) agregarAlCarrito(Number(sumar));
  if (restar) cambiarCantidad(Number(restar), -1);
  if (eliminar) eliminarDelCarrito(Number(eliminar));
};

const registrarEventos = () => {
  elementos.grid.addEventListener("click", manejarClicCatalogo);
  elementos.listaCarrito.addEventListener("click", manejarClicCarrito);
  elementos.inputBusqueda.addEventListener("input", actualizarVista);
  elementos.selectGenero.addEventListener("change", actualizarVista);
  elementos.selectOrden.addEventListener("change", actualizarVista);
  elementos.selectEnvio.addEventListener("change", actualizarVista);
  elementos.selectPago.addEventListener("change", actualizarVista);
  elementos.formCheckout.addEventListener("submit", confirmarCompra);
  elementos.btnVaciar.addEventListener("click", vaciarCarrito);
  elementos.btnBorrarHistorial.addEventListener("click", borrarHistorial);
  elementos.btnReintentar.addEventListener("click", iniciarApp);
};

const iniciarApp = async () => {
  ocultarErrorCarga();
  mostrarCarga(true);

  try {
    const [libros, { envios, mediosPago }] = await Promise.all([
      cargarJSON("data/libros.json"),
      cargarJSON("data/opciones.json")
    ]);

    estado.libros = libros;
    estado.envios = envios;
    estado.mediosPago = mediosPago;

    if (elementos.selectGenero.options.length === 1) renderGeneros(libros);
    renderOpcionesSelect(elementos.selectEnvio, envios);
    renderOpcionesSelect(elementos.selectPago, mediosPago);
    actualizarVista();
  } catch (error) {
    elementos.grid.innerHTML = "";
    mostrarErrorCarga(`No pudimos cargar el catálogo. ${error.message}`);
    notificar("Error al cargar los datos", "error");
  } finally {
    mostrarCarga(false);
    renderPedidos(pedidosStorage.obtener());
  }
};

registrarEventos();
iniciarApp();
