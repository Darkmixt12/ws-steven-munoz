# Todo Producto se vende a través de al menos una Variante

El Producto es solo la ficha (nombre, descripción, Categoría, CABYS, tarifa de IVA, imágenes); lo que se vende es siempre una Variante, que lleva SKU, precio, peso y stock. Un Producto sin talla ni color tiene igualmente una Variante por defecto, sin Opciones. Así el Carrito, el Pedido, el inventario y los reportes siempre referencian una Variante y nunca tienen que distinguir entre "producto simple" y "producto con variantes".

## Considered Options

- **Sin Variantes** (cada talla o color es un Producto aparte): descartado porque duplica fichas en el catálogo y fragmenta los reportes de más vendidos.
- **Variantes opcionales** (SKU, precio y stock en el Producto o en la Variante según el caso): descartado porque obliga a todo lo que consume el catálogo a manejar dos formas.

## Consequences

- La administración debe ocultar la Variante por defecto para que un producto simple se edite como si no la tuviera.
- Cambiar esta decisión más adelante implica migrar todas las referencias a `variantId` en Carrito, Pedidos, movimientos de stock y agregados de reportes.
