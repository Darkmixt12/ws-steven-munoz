# Tienda CR

Tienda online de productos físicos que vende solo en Costa Rica. Es un dominio separado del CRM `steven-munoz`: sus términos no se comparten.

## Lenguaje

### Personas

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Cuenta** | `account` | Identidad con la que una persona inicia sesión; puede tener a lo sumo un Cliente y un Empleado. | usuario, login |
| **Cliente** | `customer` | Persona que compra en la tienda, con registro completo; hay uno por Cuenta. | Client (término del CRM), comprador, usuario, cuenta |
| **Empleado** | `employee` | Persona que trabaja en la tienda con acceso al Panel; hay uno por Cuenta, independiente del Cliente de esa misma Cuenta. | staff, colaborador, usuario |

### Acceso al Panel

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Panel** | `admin` | Aplicación interna desde la que los Empleados gestionan la tienda. | backoffice, dashboard |
| **Invitación** | `invitation` | Alta pendiente de un Empleado, hecha con un correo y un rol, que vence si no se completa. | solicitud, pre-registro |

### Roles del Panel

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Rol** | `role` | Conjunto fijo de Permisos asignado a un Empleado; cada Empleado tiene exactamente uno. | perfil, cargo, puesto |
| **Permiso** | `permission` | Acción del Panel que un Rol habilita (p. ej. anular un Pedido, gestionar Empleados). | privilegio, acceso |
| **Administrador** | `administrator` | Rol con todos los Permisos, incluido gestionar Empleados; siempre queda al menos uno Activo. | dueño, superusuario, admin |
| **Operador** | `operator` | Rol que atiende Pedidos, stock y Clientes. | operaciones, vendedor |
| **Editor de catálogo** | `catalogEditor` | Rol que mantiene Productos, Categorías, Etiquetas y stock. | catálogo (como nombre de rol) |

### Datos del Cliente

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Dirección** | `address` | Lugar de entrega en Costa Rica guardado por un Cliente, con destinatario, teléfono, distrito y señas. | domicilio, ubicación |
| **Dirección predeterminada** | `defaultAddress` | La Dirección que se propone primero al Cliente al comprar; hay a lo sumo una. | dirección principal |
| **Perfil de facturación** | `billingProfile` | Identificación y nombre (o razón social) a los que se emite una factura en vez de un tiquete; un Cliente puede tener varios. | receptor, datos fiscales |

### Estados del Cliente y del Empleado

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Invitado** | `invited` | Estado del Empleado que todavía no completó su primer ingreso al Panel. | pendiente |
| **Activo** | `active` | Estado del Cliente que puede comprar, o del Empleado que puede entrar al Panel. | habilitado |
| **Deshabilitado** | `disabled` | Estado reversible del Cliente o del Empleado al que un Empleado impidió usar lo que su papel le permite; conserva su historial. | bloqueado, eliminado, baneado, dado de baja |

### Privacidad

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Aviso de privacidad** | `privacyNotice` | Texto versionado que informa a una persona qué datos se recolectan, para qué Finalidades y cuáles son sus derechos. | política, términos |
| **Finalidad** | `purpose` | Uso concreto de los datos personales para el que se pide Consentimiento (p. ej. cuenta y Pedidos, comunicaciones comerciales, acceso al Panel). | propósito, permiso |
| **Consentimiento** | `consent` | Aceptación o revocación expresa de una Finalidad por una persona, ligada a una versión del Aviso de privacidad. | opt-in, aceptación de términos |
| **Solicitud de derechos** | `dataRequest` | Petición de una persona para acceder, rectificar o suprimir sus datos personales. | reclamo, ticket |

### Catálogo

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Producto** | `product` | Ficha de un artículo físico del catálogo; se vende a través de sus Variantes. | artículo, ítem |
| **Variante** | `variant` | Unidad vendible de un Producto, definida por una combinación de valores de Opción; todo Producto tiene al menos una. | presentación, modelo |
| **Opción** | `option` | Eje en el que varían las Variantes de un Producto (p. ej. Talla, Color), con su lista de valores. | atributo |
| **SKU** | `sku` | Código único en la tienda que identifica una Variante. | código, referencia |
| **Categoría** | `category` | Agrupación administrada del catálogo, en un árbol de hasta dos niveles; cada Producto está en exactamente una. | departamento, colección |
| **Etiqueta** | `tag` | Agrupación administrada y transversal del catálogo; un Producto puede tener varias. | colección |
| **Borrador** | `draft` | Estado del Producto en preparación, invisible para el Cliente. | inactivo |
| **Publicado** | `published` | Estado del Producto visible en el catálogo y comprable. | activo |
| **Archivado** | `archived` | Estado del Producto retirado del catálogo pero conservado por su historial. | eliminado, borrado |
| **Agotado** | — | Condición de una Variante publicada con Stock en cero: se ve pero no se compra. No es un estado del Producto. | sin existencias, inactivo |
| **Imagen de Producto** | `productImage` | Foto de la galería ordenada de un Producto; una Variante puede señalar una. | foto, media, archivo |
| **Imagen principal** | `mainImage` | La primera Imagen de Producto de la galería; se muestra cuando la Variante no señala ninguna. | portada, destacada |
| **Fecha de publicación** | `publishedAt` | Fecha en que un Producto pasó a Publicado por primera vez; no cambia si se archiva y se vuelve a publicar, y ordena lo más nuevo del catálogo. | fecha de creación, fecha de alta |
| **Búsqueda** | `search` | Consulta de texto con que cualquier visitante encuentra Productos Publicados por su nombre, Categoría, Etiquetas o valores de Opción. | buscador, consulta |

### Stock

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Stock** | `stock` | Cantidad de una Variante disponible para vender; baja al crear un Pedido y nunca es negativa. | existencias, inventario, saldo |
| **Movimiento de stock** | `stockMovement` | Cambio inmutable del Stock de una Variante, con tipo, cantidad, autor y origen; un error se corrige con otro Movimiento. | transacción, kardex |
| **Entrada** | `receipt` | Movimiento manual que suma mercadería recibida en la bodega. | compra, ingreso |
| **Ajuste** | `adjustment` | Movimiento manual que corrige el Stock hacia arriba o abajo, siempre con un motivo de lista fija. | corrección, merma |
| **Carga de stock** | `stockImport` | Grupo de Entradas registradas juntas desde un archivo. | lote, importación |
| **Salida por Pedido** | `orderPlaced` | Movimiento automático que resta las unidades de un Pedido al crearse. | venta, reserva |
| **Reposición por anulación** | `orderCancelled` | Movimiento automático que devuelve lo que un Pedido anulado había restado. | reversa |
| **Reingreso por devolución** | `orderReturned` | Movimiento que suma las unidades devueltas que el Empleado decidió reingresar. | devolución (como movimiento) |

### Carrito

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Carrito** | `cart` | Variantes que un Cliente, o un visitante sin sesión, piensa comprar, con su cantidad; no aparta Stock ni fija precio. | canasta, bolsa |
| **Línea del carrito** | `cartLine` | Una Variante con su cantidad dentro del Carrito; cada Variante aparece a lo sumo en una línea. | ítem |
| **Finalizar compra** | `checkout` | Paso en que el Cliente elige Método de entrega, Comprobante y método de pago y confirma, lo que crea el Pedido. | pago, caja |

### Pedido

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Pedido** | `order` | Compra confirmada por un Cliente: sus Líneas, la entrega, el Pago y los Comprobantes, con copia congelada de lo que se vendió. | orden, compra, venta |
| **Número de Pedido** | `orderNumber` | Consecutivo visible con que el Cliente y la tienda identifican un Pedido; no es el consecutivo de Hacienda. | folio, consecutivo |
| **Línea de Pedido** | `orderLine` | Variante comprada dentro de un Pedido, con cantidad, precio, descuento y la copia de sus datos al momento de la compra. | ítem, detalle |
| **Estado del Pedido** | `orderStatus` | Punto del ciclo de vida en que está un Pedido, de Pendiente de pago a Entregado, Anulado o Devuelto. | estatus, fase |
| **Pendiente de pago** | `pendingPayment` | Estado del Pedido recién creado, con el Stock ya apartado, que espera su Pago. | nuevo, abierto |
| **Por preparar** | `toFulfill` | Estado del Pedido pagado que falta alistar. | pagado, confirmado |
| **Enviado** | `shipped` | Estado del Pedido con Envío a domicilio que salió de la bodega. | despachado, en camino |
| **Listo para retirar** | `readyForPickup` | Estado del Pedido con Retiro en bodega ya alistado, que espera al Cliente. | por retirar |
| **Entregado** | `delivered` | Estado del Pedido que el Cliente recibió o retiró. | completado, finalizado |
| **Anulado** | `cancelled` | Estado final del Pedido que se deshizo antes de la entrega; todo su Stock vuelve. | cancelado, eliminado |
| **Devuelto** | `returned` | Estado final del Pedido entregado cuyas unidades se devolvieron todas. | reembolsado |
| **Devolución** | `return` | Registro de unidades entregadas que el Cliente regresa, con cuáles reingresan al Stock y cuánto se reembolsa; un Pedido puede tener varias. | cambio, reclamo |
| **Pendiente de despacho** | — | Unidades de Pedidos Pendientes de pago, Por preparar o Listos para retirar, que siguen físicamente en la bodega. | comprometido, reservado |
| **Historial del Pedido** | `statusHistory` | Sucesión de cambios de Estado del Pedido con su fecha y autor. | bitácora |

### Entrega y pago

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Método de entrega** | `deliveryMethod` | Forma en que el Cliente recibe su Pedido: Envío a domicilio o Retiro en bodega. | forma de envío |
| **Envío a domicilio** | `homeDelivery` | Entrega en una Dirección de Costa Rica, con costo según la Tarifa de envío. | delivery |
| **Retiro en bodega** | `pickup` | Entrega en la que el Cliente recoge el Pedido en la bodega, sin costo. | pick-up, recoger en tienda |
| **Tarifa de envío** | `shippingRate` | Costo del Envío a domicilio para una provincia, con IVA incluido. | flete |
| **Guía** | `tracking` | Empresa de transporte, número y enlace con que el Cliente rastrea un Pedido Enviado. | tracking, número de rastreo |
| **Pago** | `payment` | Cobro de un Pedido por SINPE Móvil o tarjeta; hay uno por Pedido. | transacción, cobro |
| **Estado de pago** | `paymentStatus` | Situación del Pago: Pendiente, Confirmado, Rechazado, Reembolsado parcialmente o Reembolsado. | — |
| **Reembolso** | `refund` | Devolución de dinero sobre un Pago, por una anulación o una Devolución. | reintegro |
| **Comprobante** | `taxDocument` | Documento electrónico que se emite a Hacienda por un Pedido: Tiquete, Factura o Nota de crédito; un Pedido puede tener varios. | factura (como genérico) |
| **Tiquete** | `ticket` | Comprobante para consumidor final, sin receptor identificado. | boleta, recibo |
| **Factura** | `invoice` | Comprobante a nombre de un Perfil de facturación. | factura electrónica (como genérico) |
| **Nota de crédito** | `creditNote` | Comprobante que revierte total o parcialmente otro Comprobante ya aceptado. | anulación de factura |

### Reportes

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Venta** | `sale` | Unidades y monto de las Líneas de un Pedido que entran a los reportes al confirmarse su Pago. | pedido, compra |
| **Venta neta** | `netSales` | Ventas de un período menos lo anulado y devuelto en ese período. | ventas reales, ganancia |
| **Más y menos vendidos** | `salesRanking` | Reporte que ordena Variantes o Productos por unidades netas en un rango de fechas. | top ventas, ranking |

### Bitácora

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Bitácora** | `auditLog` | Registro inmutable de lo que los Empleados y el Sistema hicieron en la tienda, fuera de lo que ya tiene historia propia; solo la ve el Administrador. | auditoría, log, historial |
| **Evento de bitácora** | `auditEvent` | Entrada de la Bitácora: la acción, sobre qué se hizo, qué campos cambiaron, su Autor, la fecha y el motivo cuando la acción lo exige. | registro, entrada de log |
| **Autor** | `actor` | Quien hizo una acción registrada: un Empleado, un Cliente o el Sistema, según desde dónde actuó. | usuario, responsable |
| **Sistema** | `system` | Autor de las acciones que no dispara ninguna persona (p. ej. la anulación automática de un Pedido sin pago). | automático, bot |

### Notificaciones

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Notificación** | `notification` | Correo que la tienda envía a una persona por un hecho de su Pedido, su Invitación o su Solicitud de derechos; nunca lleva contenido comercial. | aviso (choca con Aviso de privacidad), mensaje, email |
