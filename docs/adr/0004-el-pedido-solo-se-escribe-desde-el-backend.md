# El Pedido solo se escribe desde el backend

Todo cambio de un Pedido (crearlo, confirmar su Pago, avanzar su Estado, corregir la dirección antes del despacho, registrar la Guía, anularlo, devolverlo y reembolsarlo) pasa por Cloud Functions: callables para el Cliente y el Panel, y el webhook de la pasarela para la tarjeta. Las reglas de Firestore prohíben al cliente escribir Pedidos. Así, la tabla de transiciones del Estado del Pedido, los totales, el Historial del Pedido y los efectos sobre Stock, Pago y Comprobantes viven en un solo lugar.

## Considered Options

- **Cambios simples desde el Panel con reglas** (patrón `withFirestoreCrud` de `moofyvip` para Por preparar → Enviado → Entregado, la dirección y la Guía; backend para lo demás): descartado porque crear, anular y devolver ya pasan por el backend (mueven stock, ADR 0003), confirmar el Pago emite el Comprobante y la tarjeta llega por webhook. Con dos caminos, las transiciones válidas y el Historial quedarían repartidos entre reglas y Functions.

## Consequences

- El Panel lee Pedidos con `withWatchCollection`, pero no los escribe con `withFirestoreCrud`: llama a callables. Es otra excepción al patrón de escritura directa del resto del Panel, junto con el stock.
- Las callables releen el Empleado para los Permisos (ADR 0002) y aplican el conflicto de interés (nadie anula ni devuelve sus propios Pedidos).
- Las anulaciones automáticas por falta de pago las hace una Function programada, con autor Sistema.
- Cambiar esta decisión más adelante implica llevar la tabla de transiciones a reglas y validar ahí el Historial del Pedido.
