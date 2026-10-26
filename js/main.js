// Interfaz: render del menú y del pedido, eventos y circuito de confirmación.

const COLOR_PRINCIPAL = "#c1440e";
const COLOR_SECUNDARIO = "#8a8071";
const CATEGORIA_TODAS = "Todas";

let productos = [];
let opcionesEnvio = [];
let categoriaActiva = CATEGORIA_TODAS;

const contenedorFiltros = document.getElementById("filtros-categoria");
const inputBuscar = document.getElementById("input-buscar");
const estadoCarga = document.getElementById("estado-carga");
const grillaProductos = document.getElementById("grilla-productos");
const contadorCarrito = document.getElementById("contador-carrito");
const listaCarrito = document.getElementById("lista-carrito");
const botonVaciar = document.getElementById("boton-vaciar");
const selectEnvio = document.getElementById("select-envio");
const textoSubtotal = document.getElementById("subtotal");
const textoCostoEnvio = document.getElementById("costo-envio");
const textoTotal = document.getElementById("total");
const formCheckout = document.getElementById("form-checkout");
const campoDireccion = document.getElementById("campo-direccion");
const inputNombre = document.getElementById("input-nombre");
const inputTelefono = document.getElementById("input-telefono");
const inputDireccion = document.getElementById("input-direccion");
const botonConfirmar = document.getElementById("boton-confirmar");

const formatearPrecio = (valor) => `$${valor.toLocaleString("es-AR")}`;

const escaparHTML = (texto) =>
  String(texto).replace(/[&<>"']/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caracter]);

function notificar(texto, tipo = "info") {
  const fondos = {
    exito: "#4c8c3c",
    error: COLOR_PRINCIPAL,
    info: "#2a2420",
  };

  Toastify({
    text: texto,
    duration: 2500,
    gravity: "bottom",
    position: "right",
    style: { background: fondos[tipo] || fondos.info, borderRadius: "0", fontFamily: "'IBM Plex Mono', monospace" },
  }).showToast();
}

function obtenerEnvioActual() {
  return opcionesEnvio.find(({ id }) => id === envioSeleccionado) || opcionesEnvio[0];
}

function necesitaDireccion() {
  const envioActual = obtenerEnvioActual();
  return envioActual ? envioActual.costo > 0 : false;
}

// --- Render ---

function renderFiltros() {
  const categorias = [CATEGORIA_TODAS, ...new Set(productos.map(({ categoria }) => categoria))];

  contenedorFiltros.innerHTML = categorias
    .map((categoria) => {
      const estaActiva = categoria === categoriaActiva;
      return `
        <button type="button" class="filtro ${estaActiva ? "filtro--activo" : ""}" data-categoria="${categoria}" aria-pressed="${estaActiva}">
          ${categoria}
        </button>
      `;
    })
    .join("");
}

function renderCatalogo() {
  const textoBuscado = inputBuscar.value.trim().toLowerCase();

  const productosVisibles = productos.filter(({ categoria, nombre }) => {
    const coincideCategoria = categoriaActiva === CATEGORIA_TODAS || categoria === categoriaActiva;
    return coincideCategoria && nombre.toLowerCase().includes(textoBuscado);
  });

  grillaProductos.innerHTML = productosVisibles.length === 0
    ? `<p class="estado">No encontramos nada con ese nombre.</p>`
    : productosVisibles
        .map(({ id, nombre, categoria, precio, descripcion, imagen }) => `
          <article class="producto">
            <img src="${imagen}" alt="" class="producto__imagen" width="56" height="56" loading="lazy">
            <div>
              <span class="producto__categoria">${categoria}</span>
              <h3 class="producto__nombre">${nombre}</h3>
              <p class="producto__descripcion">${descripcion}</p>
            </div>
            <div class="producto__pie">
              <span class="producto__precio">${formatearPrecio(precio)}</span>
              <button type="button" class="boton-agregar" data-id="${id}" aria-label="Agregar ${nombre} al pedido">Agregar</button>
            </div>
          </article>
        `)
        .join("");
}

function renderOpcionesEnvio() {
  selectEnvio.innerHTML = opcionesEnvio
    .map(({ id, nombre, costo }) => `<option value="${id}">${nombre} (${costo === 0 ? "sin cargo" : formatearPrecio(costo)})</option>`)
    .join("");

  const envioActual = obtenerEnvioActual();
  if (envioActual) {
    selectEnvio.value = envioActual.id;
  }
  actualizarCampoDireccion();
}

function actualizarCampoDireccion() {
  campoDireccion.hidden = !necesitaDireccion();
}

function renderCarrito() {
  const carritoVacio = carrito.length === 0;

  listaCarrito.innerHTML = carritoVacio
    ? `<li class="carrito__vacio">Todavía no agregaste nada.</li>`
    : carrito
        .map(({ id, nombre, precio, cantidad }) => `
          <li class="carrito__item">
            <div>
              <span class="carrito__nombre">${nombre}</span>
              <span class="carrito__unitario">${formatearPrecio(precio)} c/u</span>
            </div>
            <div class="cantidad">
              <button type="button" class="cantidad__boton" data-accion="restar" data-id="${id}" aria-label="Quitar una unidad de ${nombre}">−</button>
              <span class="cantidad__valor">${cantidad}</span>
              <button type="button" class="cantidad__boton" data-accion="sumar" data-id="${id}" aria-label="Sumar una unidad de ${nombre}">+</button>
            </div>
            <span class="carrito__importe">${formatearPrecio(precio * cantidad)}</span>
            <button type="button" class="carrito__quitar" data-accion="quitar" data-id="${id}" aria-label="Quitar ${nombre} del pedido">✕</button>
          </li>
        `)
        .join("");

  const envioActual = obtenerEnvioActual();
  const subtotal = calcularSubtotal();
  const costoEnvio = !carritoVacio && envioActual ? envioActual.costo : 0;

  textoSubtotal.textContent = formatearPrecio(subtotal);
  textoCostoEnvio.textContent = costoEnvio === 0 ? "Sin cargo" : formatearPrecio(costoEnvio);
  textoTotal.textContent = formatearPrecio(subtotal + costoEnvio);
  contadorCarrito.textContent = contarUnidades();

  botonVaciar.disabled = carritoVacio;
  botonConfirmar.disabled = carritoVacio || opcionesEnvio.length === 0;
}

function completarDatosGuardados() {
  const { nombre, telefono, direccion } = leerDatosCliente();
  inputNombre.value = nombre || "";
  inputTelefono.value = telefono || "";
  inputDireccion.value = direccion || "";
}

// --- Carga inicial ---

async function iniciarApp() {
  estadoCarga.hidden = false;
  estadoCarga.textContent = "Cargando el menú…";

  try {
    const datos = await cargarDatosIniciales();
    productos = datos.productos;
    opcionesEnvio = datos.envios;

    renderFiltros();
    renderCatalogo();
    renderOpcionesEnvio();
    estadoCarga.hidden = true;

    if (carrito.length > 0) {
      notificar("Recuperamos el pedido que habías dejado armado.");
    }
  } catch {
    estadoCarga.innerHTML = `No pudimos cargar el menú. <button type="button" id="boton-reintentar" class="boton-texto">Reintentar</button>`;
    Swal.fire({
      icon: "error",
      title: "No se pudo cargar el menú",
      text: "Revisá tu conexión e intentá de nuevo.",
      confirmButtonColor: COLOR_PRINCIPAL,
    });
  } finally {
    renderCarrito();
  }
}

// --- Validación del formulario ---

function marcarCampo(input, esValido) {
  input.setAttribute("aria-invalid", String(!esValido));
}

function validarDatosCliente({ nombre, telefono, direccion }) {
  const nombreValido = nombre.length >= 2;
  const telefonoValido = telefono.replace(/\D/g, "").length >= 8;
  const direccionValida = !necesitaDireccion() || direccion.length >= 5;

  marcarCampo(inputNombre, nombreValido);
  marcarCampo(inputTelefono, telefonoValido);
  marcarCampo(inputDireccion, direccionValida);

  if (!nombreValido) return "Escribí tu nombre.";
  if (!telefonoValido) return "El teléfono tiene que tener al menos 8 números.";
  if (!direccionValida) return "Falta la dirección de entrega.";
  return null;
}

function armarResumenHTML({ nombre, direccion, pago }, envioActual) {
  const subtotal = calcularSubtotal();
  const total = subtotal + envioActual.costo;

  const filasItems = carrito
    .map(({ nombre: nombreProducto, cantidad, precio }) => `<li><span>${cantidad} × ${nombreProducto}</span><span>${formatearPrecio(precio * cantidad)}</span></li>`)
    .join("");

  const lineaEntrega = envioActual.costo > 0
    ? `${envioActual.nombre}: ${escaparHTML(direccion)}`
    : envioActual.nombre;

  return `
    <ul class="resumen-pedido">
      ${filasItems}
      <li><span>Envío</span><span>${envioActual.costo === 0 ? "Sin cargo" : formatearPrecio(envioActual.costo)}</span></li>
      <li class="resumen-pedido__total"><span>Total</span><span>${formatearPrecio(total)}</span></li>
    </ul>
    <p style="font-size:13px;text-align:left;margin-top:14px">
      A nombre de <strong>${escaparHTML(nombre)}</strong><br>
      ${lineaEntrega}<br>
      Pago: ${escaparHTML(pago)}
    </p>
  `;
}

// --- Eventos ---

contenedorFiltros.addEventListener("click", (evento) => {
  const botonFiltro = evento.target.closest("[data-categoria]");
  if (!botonFiltro) return;

  categoriaActiva = botonFiltro.dataset.categoria;
  renderFiltros();
  renderCatalogo();
});

inputBuscar.addEventListener("input", renderCatalogo);

grillaProductos.addEventListener("click", (evento) => {
  const botonAgregar = evento.target.closest(".boton-agregar");
  if (!botonAgregar) return;

  const productoElegido = productos.find(({ id }) => id === Number(botonAgregar.dataset.id));
  if (!productoElegido) return;

  const seGuardo = agregarAlCarrito(productoElegido);
  renderCarrito();
  notificar(
    seGuardo ? `${productoElegido.nombre} agregado al pedido` : "Se agregó, pero no se pudo guardar en este navegador.",
    seGuardo ? "exito" : "error"
  );
});

listaCarrito.addEventListener("click", (evento) => {
  const botonAccion = evento.target.closest("[data-accion]");
  if (!botonAccion) return;

  const { accion, id } = botonAccion.dataset;
  const idProducto = Number(id);

  switch (accion) {
    case "sumar":
      cambiarCantidad(idProducto, 1);
      break;
    case "restar":
      cambiarCantidad(idProducto, -1);
      break;
    case "quitar": {
      const itemQuitado = carrito.find((item) => item.id === idProducto);
      quitarDelCarrito(idProducto);
      if (itemQuitado) {
        notificar(`Quitaste ${itemQuitado.nombre}`);
      }
      break;
    }
  }

  renderCarrito();
});

selectEnvio.addEventListener("change", () => {
  guardarEnvio(selectEnvio.value);
  actualizarCampoDireccion();
  renderCarrito();
});

botonVaciar.addEventListener("click", async () => {
  const respuesta = await Swal.fire({
    icon: "warning",
    title: "¿Vaciar el pedido?",
    text: "Se van a quitar todos los productos.",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PRINCIPAL,
    cancelButtonColor: COLOR_SECUNDARIO,
  });

  if (!respuesta.isConfirmed) return;

  vaciarCarrito();
  renderCarrito();
  notificar("Vaciaste el pedido");
});

formCheckout.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (carrito.length === 0) return;

  const datosFormulario = Object.fromEntries(new FormData(formCheckout));
  const datosCliente = {
    nombre: datosFormulario.nombre.trim(),
    telefono: datosFormulario.telefono.trim(),
    direccion: datosFormulario.direccion.trim(),
    pago: datosFormulario.pago,
  };

  const mensajeError = validarDatosCliente(datosCliente);
  if (mensajeError) {
    notificar(mensajeError, "error");
    return;
  }

  const envioActual = obtenerEnvioActual();

  const respuesta = await Swal.fire({
    title: "Revisá tu pedido",
    html: armarResumenHTML(datosCliente, envioActual),
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Seguir editando",
    confirmButtonColor: COLOR_PRINCIPAL,
    cancelButtonColor: COLOR_SECUNDARIO,
  });

  if (!respuesta.isConfirmed) return;

  const numeroPedido = Math.floor(1000 + Math.random() * 9000);
  const { nombre, telefono, direccion } = datosCliente;
  guardarDatosCliente({ nombre, telefono, direccion });

  await Swal.fire({
    icon: "success",
    title: `Pedido #${numeroPedido} confirmado`,
    html: `Gracias, ${escaparHTML(nombre)}. Va a estar listo en unos <strong>${envioActual.demoraMinutos} minutos</strong>.`,
    confirmButtonColor: COLOR_PRINCIPAL,
  });

  vaciarCarrito();
  renderCarrito();
});

estadoCarga.addEventListener("click", (evento) => {
  if (evento.target.id === "boton-reintentar") {
    iniciarApp();
  }
});

// --- Arranque ---

completarDatosGuardados();
iniciarApp();
