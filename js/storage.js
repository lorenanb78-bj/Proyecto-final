// Persistencia en localStorage: carrito y historial de pedidos
const CLAVE_CARRITO = "kier_carrito";
const CLAVE_PEDIDOS = "kier_pedidos";

const leerStorage = (clave, valorPorDefecto) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) || valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
};

const guardarStorage = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));

const carritoStorage = {
  obtener: () => leerStorage(CLAVE_CARRITO, []),
  guardar: (items) => guardarStorage(CLAVE_CARRITO, items),
  vaciar: () => localStorage.removeItem(CLAVE_CARRITO)
};

const pedidosStorage = {
  obtener: () => leerStorage(CLAVE_PEDIDOS, []),
  agregar: (pedido) => guardarStorage(CLAVE_PEDIDOS, [pedido, ...pedidosStorage.obtener()]),
  borrarTodo: () => localStorage.removeItem(CLAVE_PEDIDOS)
};
