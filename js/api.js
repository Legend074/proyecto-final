// Carga de datos desde los archivos JSON que simulan la base de datos.

const RUTA_PRODUCTOS = "./data/productos.json";
const RUTA_ENVIOS = "./data/envios.json";

async function obtenerJSON(ruta) {
  const respuesta = await fetch(ruta);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta} (estado ${respuesta.status})`);
  }

  return respuesta.json();
}

async function cargarDatosIniciales() {
  const productos = await obtenerJSON(RUTA_PRODUCTOS);
  const envios = await obtenerJSON(RUTA_ENVIOS);
  return { productos, envios };
}
