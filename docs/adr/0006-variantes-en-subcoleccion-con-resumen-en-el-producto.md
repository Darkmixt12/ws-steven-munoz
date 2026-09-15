# Las Variantes viven en una subcolección del Producto, con un resumen derivado que mantiene el backend

Cada Variante es un documento en `products/{productId}/variants/{variantId}`, no un elemento embebido en el Producto ni un documento de una colección `variants` aparte. La Variante guarda el Stock, que escribe el backend en cada Pedido (ADR 0003), y el precio, que edita el Panel directo. La lectura pública de una Variante la decide la regla con un `get()` al Producto padre (`productId` está en la ruta), permitida solo si está Publicado. Para que la grilla del catálogo no lea las Variantes de cada Producto, el Producto lleva un resumen derivado `summary` (`priceMin`, `priceMax`, `inStock`, `activeVariantCount`) que solo escribe el backend: un trigger sobre las Variantes lo recalcula y las transacciones de stock actualizan `inStock` en su misma transacción. El trigger de la Bitácora ignora esos campos derivados.

## Considered Options

- **Variantes embebidas en el Producto** (array o mapa): descartado. El Panel escribe el Producto directo, así que al guardar la ficha puede pisar con un valor viejo el Stock que el backend acaba de escribir, y las reglas no pueden recorrer una lista o un mapa para impedirlo. Además, cada Pedido reescribiría el Producto y competiría con las ediciones del Panel.
- **Colección `variants` top-level**: descartado. Las reglas no pueden leer el estado del Producto al evaluar una consulta de muchas Variantes, así que habría que copiar ese estado en cada Variante y mantenerlo sincronizado desde el Panel al publicar o archivar.
- **Sin resumen en el Producto** (la grilla lee las Variantes): descartado porque `moofyvip` no tiene consultas `collectionGroup` y la grilla haría una lectura de subcolección por Producto.

## Consequences

- Toda referencia a una Variante lleva `{productId, variantId}`: Carrito, Líneas de Pedido, Movimientos de stock y `salesDaily`. Un `variantId` solo no alcanza para construir la ruta.
- El resumen es eventualmente consistente para el precio y la activación (segundos, vía trigger); el Agotado se refleja en la misma transacción que mueve el Stock.
- La lectura anónima de Variantes consume un `get()` del Producto por consulta.
- El backend nunca toca `updatedAt`/`updatedBy` del Producto ni de la Variante, así el trigger de la Bitácora distingue lo que escribió el Panel.
- Cambiar esta decisión más adelante implica migrar las Variantes de todos los Productos y cambiar las rutas en el Panel, en la tienda, en las reglas y en las Functions.
