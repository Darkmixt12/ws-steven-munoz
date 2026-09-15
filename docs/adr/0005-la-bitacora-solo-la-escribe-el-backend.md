# La Bitácora solo la escribe el backend

Ningún cliente escribe Eventos de bitácora: las reglas de Firestore prohíben escribir `auditEvents`. Las callables (Pedido, stock, Empleados e Invitaciones, Clientes, Solicitudes de derechos) escriben su Evento en la misma transacción que la acción, con acción, motivo y Autor. Lo que el Panel escribe directo con reglas (catálogo, Configuración) lo audita un trigger de Firestore que arma el Evento con los campos cambiados; el Autor sale de un campo `updatedBy` que las reglas obligan a que sea igual a `request.auth.uid`. Así la Bitácora no se puede saltar ni falsificar desde el navegador, y el Panel conserva la escritura directa.

## Considered Options

- **Evento escrito por el navegador en el mismo batch** (patrón `withFirestoreCrud` de `moofyvip`, con la regla exigiendo `actor.id == request.auth.uid`): descartado porque la auditoría queda en manos del cliente. Un Empleado con las devtools puede escribir sin Evento o con un antes/después inventado, y obligar el Evento desde las reglas exige ids deterministas y `existsAfter()` en cada colección, que compiten con las llamadas `get()` que ya consume el Empleado (ADR 0002).
- **Todo el Panel escribe por callables**: descartado porque elimina la escritura directa del Panel con `withFirestoreCrud` para ganar solo un camino único de auditoría.
- **Autor tomado del `authId` del trigger con contexto de autenticación** (`onDocumentWrittenWithAuthContext`): descartado como fuente principal porque Google no documenta qué valor llega para un usuario del SDK web y en el emulador siempre es falso; queda como verificación cruzada.

## Consequences

- El Evento de una escritura directa aparece segundos después, no en la misma escritura. El trigger se entrega al menos una vez: usa el id del evento como id del documento para no duplicar.
- Las colecciones que el Panel escribe directo llevan `updatedBy` en cada escritura, y no admiten borrados desde el cliente (el Producto se archiva; lo que sí se borre pasa por callable), porque un borrado no deja documento del que leer el Autor.
- Cada acción deja exactamente un Evento: el trigger escucha solo lo que escribe el cliente, y en colecciones con escrituras mixtas (el Empleado edita su nombre, el backend su Rol) no repite lo que ya auditó una callable.
- La acción de un Evento del trigger se deduce del cambio (p. ej. Borrador → Publicado es publicar).
- Cada Evento guarda solo los campos que cambiaron; los campos con datos personales se registran como cambiados, sin su valor. La Bitácora no entra en la anonimización, salvo la nota opcional de un motivo.
- Los Eventos se conservan 5 años y los borra una política TTL de Firestore; nadie los edita ni los borra a mano.
- Cambiar esta decisión más adelante implica mover la auditoría al navegador y aceptar que deje de ser confiable, o pasar todo el Panel a callables.
