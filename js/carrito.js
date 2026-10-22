// Estado del carrito y su persistencia en localStorage.

const CLAVE_CARRITO = "lacomanda-carrito";
const CLAVE_ENVIO = "lacomanda-envio";
const CLAVE_CLIENTE = "lacomanda-cliente";

function leerDeStorage(clave, valorPorDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function guardarEnStorage(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

let carrito = leerDeStorage(CLAVE_CARRITO, []);
let envioSeleccionado = leerDeStorage(CLAVE_ENVIO, null);

function persistirCarrito() {
  return guardarEnStorage(CLAVE_CARRITO, carrito);
}

function agregarAlCarrito({ id, nombre, precio }) {
  const itemExistente = carrito.find((item) => item.id === id);

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }

  return persistirCarrito();
}

function cambiarCantidad(id, diferencia) {
  carrito = carrito
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + diferencia } : item))
    .filter(({ cantidad }) => cantidad > 0);

  return persistirCarrito();
}

function quitarDelCarrito(id) {
  carrito = carrito.filter((item) => item.id !== id);
  return persistirCarrito();
}

function vaciarCarrito() {
  carrito = [];
  localStorage.removeItem(CLAVE_CARRITO);
}

function guardarEnvio(idEnvio) {
  envioSeleccionado = idEnvio;
  guardarEnStorage(CLAVE_ENVIO, idEnvio);
}

function leerDatosCliente() {
  return leerDeStorage(CLAVE_CLIENTE, {});
}

function guardarDatosCliente(datosCliente) {
  guardarEnStorage(CLAVE_CLIENTE, datosCliente);
}

const calcularSubtotal = () => carrito.reduce((total, { precio, cantidad }) => total + precio * cantidad, 0);

const contarUnidades = () => carrito.reduce((total, { cantidad }) => total + cantidad, 0);
