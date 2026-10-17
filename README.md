# Kier Libros · Simulador de compra

Simulador de e-commerce de una librería online. Circuito completo:
**ver catálogo → buscar/filtrar → agregar al carrito → modificar cantidades → elegir envío y pago → calcular total → confirmar compra → historial de pedidos.**

## Cómo ejecutarlo

`fetch` no funciona abriendo `index.html` con doble clic (protocolo `file://`). Usar un servidor local:

- VS Code: extensión **Live Server** → clic derecho en `index.html` → *Open with Live Server*
- o bien: `npx serve .` / `python -m http.server`

También funciona publicado en **GitHub Pages**.

## Estructura

```
index.html
css/styles.css
js/storage.js     → localStorage (carrito e historial)
js/ui.js          → renderizado del DOM y notificaciones
js/app.js         → lógica del simulador, fetch y eventos
data/libros.json  → catálogo (base de datos simulada)
data/opciones.json→ medios de envío y pago
assets/img/       → logo, ilustraciones y tapas
```

## Cumplimiento de consignas

| Requisito | Dónde |
|---|---|
| DOM y eventos, sin `alert/prompt/confirm` | `ui.js` (render), `app.js` (`registrarEventos`) |
| Arrays de objetos en `.json` + `fetch` | `data/*.json`, `cargarJSON()` |
| Funciones de orden superior | `map`, `filter`, `reduce`, `find`, `some`, `forEach`, `sort` |
| Storage: guardar / modificar / borrar / vaciar | `storage.js` + `agregarAlCarrito`, `cambiarCantidad`, `eliminarDelCarrito`, `vaciarCarrito`, `borrarHistorial` |
| Ternario, OR, destructuring | `renderLibros`, `leerStorage`, `calcularTotales`, `confirmarCompra` |
| `async/await` + `try/catch/finally` | `iniciarApp()` (con botón *Reintentar* si falla la carga) |
| Librerías externas | SweetAlert2 (confirmaciones) y Toastify (notificaciones) |

## Librerías

- [SweetAlert2](https://sweetalert2.github.io/)
- [Toastify JS](https://apvarun.github.io/toastify-js/)
