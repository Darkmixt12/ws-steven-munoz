# Las Notificaciones salen de una bandeja de salida

Toda Notificación nace como un documento de `notifications`, escrito por el backend **en la misma transacción** que la operación que la origina (crear el Pedido, confirmar el Pago, anular, registrar una Devolución, aceptar un Comprobante, invitar a un Empleado, responder una Solicitud de derechos). Un trigger la envía después, leyendo el origen para armar el correo, y guarda su estado, intentos y error. Así cada hecho produce exactamente una Notificación, aunque la transacción se reintente o el trigger se entregue dos veces, y el Panel puede ver si un correo salió y reenviarlo.

## Considered Options

- **Sin huella:** una Function detecta el cambio del Pedido y manda el correo, dejando rastro solo en Cloud Logging. Descartada porque la entrega del trigger es al menos una vez (correos duplicados), el trigger tendría que deducir el hecho de un antes/después, y nadie en el Panel sabe si el correo salió.
- **Arreglo `notifications[]` embebido en el Pedido:** descartada porque el trigger de envío escribiría de vuelta al Pedido (que ADR 0004 reserva a las operaciones del Pedido) y no sirve para la Invitación ni para la Solicitud de derechos.
- **Que el proveedor de factura electrónica envíe el Comprobante por su cuenta:** descartada porque ata la entrega exigida por Hacienda a un proveedor que este esfuerzo no elige, y deja dos caminos de envío.

## Consequences

- Cada operación del backend que notifica escribe su Notificación dentro de su transacción; una operación con dos hechos (anular y reembolsar) deja una sola.
- La Notificación guarda referencias (`type`, `ref`, destinatario), no el correo armado: el único dato personal es el correo del destinatario, y un TTL de 90 días la borra, así que no entra en la anonimización.
- El trigger de envío es idempotente sobre el estado de la Notificación; si el origen ya no existe (p. ej. una Invitación revocada), la marca cancelada sin enviar.
- Un reenvío es una Notificación nueva con Autor, nunca una reescritura de la anterior, y va al mismo destinatario.
- Cambiar esta decisión más adelante implica mover los envíos a triggers sobre el Pedido y aceptar duplicados, o perder la visibilidad de entrega en el Panel.
