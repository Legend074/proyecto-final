# La Comanda

Simulador de pedidos online para una parrilla. Proyecto final del curso de JavaScript de Coderhouse.

Ves el menú, filtrás por categoría o buscás por nombre, armás el pedido, ajustás cantidades, elegís si lo retirás o te lo mandan, cargás tus datos y confirmás. El pedido queda guardado en el navegador si cerrás la pestaña antes de terminar.

## Cómo correrlo

El menú se carga con `fetch` desde archivos `.json`, y los navegadores bloquean eso cuando abrís el `index.html` con doble click. Hace falta servirlo por http:

- Con VS Code: extensión **Live Server**, clic derecho sobre `index.html` → *Open with Live Server*.
- Con Python: `python -m http.server 8000` en la carpeta del proyecto y entrar a `http://localhost:8000`.
- O desde GitHub Pages, que ya lo sirve por https.

## Estructura

```
index.html
css/style.css
js/api.js        carga de los JSON (fetch, async/await)
js/carrito.js    estado del pedido y localStorage
js/main.js       render, eventos y confirmación
data/productos.json
data/envios.json
assets/img/      logo e íconos de categorías (SVG)
```

## Librerías

- [SweetAlert2](https://sweetalert2.github.io/) para confirmar el pedido, vaciarlo y mostrar errores de carga.
- [Toastify](https://apvarun.github.io/toastify-js/) para los avisos cortos (agregar, quitar, validaciones).
