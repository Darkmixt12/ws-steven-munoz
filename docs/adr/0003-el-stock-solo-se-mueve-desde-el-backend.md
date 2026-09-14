# El stock solo se mueve desde el backend, con Movimientos inmutables y el Stock en la Variante

Cada cambio de Stock es un Movimiento de stock inmutable (uno por Variante, con cantidad con signo, Stock resultante, autor y origen), y el Stock actual se guarda en la propia Variante. Ambos se escriben en la misma transacción y solo desde Cloud Functions: una callable para Entradas y Ajustes, y la misma operación del backend que crea, anula o devuelve un Pedido para los Movimientos automáticos. Las reglas de Firestore prohíben al cliente escribir el Stock y los Movimientos. Toda operación que dejaría un Stock negativo se rechaza completa.

## Considered Options

- **Escritura directa desde el Panel con reglas** (patrón `withFirestoreCrud` de `moofyvip`, validando con `getAfter()` que el Stock nuevo sea el anterior más el Movimiento): descartado porque la Salida por Pedido nace del checkout del Cliente, que no puede escribir stock, así que el camino por backend existe de todos modos; con dos caminos la regla "Stock = suma de Movimientos" quedaría repartida entre reglas y Functions.
- **Solo el Stock en la Variante**: descartado porque no deja historia para conteos, anulaciones y devoluciones, ni para la regla de que una Variante con movimientos no se borra.
- **Solo Movimientos, con el Stock derivado**: descartado porque el catálogo tendría que sumar Movimientos para saber si una Variante está Agotada.

## Consequences

- El Panel lee Stock y Movimientos con `withWatchCollection`, pero no escribe stock con `withFirestoreCrud`: llama a la callable. Es la excepción al patrón de escritura directa del resto del Panel.
- Las escrituras sobre una misma Variante se serializan en transacciones; el límite práctico de una escritura sostenida por segundo por documento sobra para el volumen de la tienda.
- Los Movimientos son la historia auditable del stock y no se duplican en `auditEvents`.
- Cambiar esta decisión más adelante implica pasar lógica de Functions a reglas y rehacer el flujo de creación, anulación y devolución del Pedido.
