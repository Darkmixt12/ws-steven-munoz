# Modelo de datos Firestore — Tienda CR

Síntesis de las decisiones del mapa [Tienda CR: modelo de dominio y decisiones transversales](https://github.com/Darkmixt12/ws-steven-munoz/issues/35): qué colecciones hay, la forma de cada documento, quién escribe y quién lee, qué se desnormaliza o agrega, los índices previstos y la matriz rol × colección × operación. El vocabulario sale de [`CONTEXT.md`](../CONTEXT.md); las decisiones difíciles de revertir, de los [ADRs](adr/).

No es código: las reglas van en prosa y los nombres de callables y triggers son indicativos. Las interfaces TypeScript, `firestore.rules`, `storage.rules` y `firestore.indexes.json` son la primera etapa de la ejecución.

## 1. Convenciones

- **Nombres:** colecciones y campos en inglés `camelCase`, con los identificadores en código del glosario (`orders`, `createdAt`, `toFulfill`).
- **Id:** nunca se guarda dentro del documento. `withWatchCollection` lo inyecta como `id` al leer (`idField: 'id'`).
- **Fechas:** `Timestamp` de Firestore. `createdAt` y `updatedAt` con hora del servidor en todo documento mutable; en las escrituras del cliente las reglas exigen `== request.time`.
- **Día:** string `yyyy-mm-dd` en hora de Costa Rica (UTC−6).
- **Montos:** CRC en enteros, con IVA incluido.
- **Autor:** `{type, id}`, con `type` = `employee` | `customer` | `system` e `id` = `uid` o la clave del proceso del Sistema (`autoCancel`, `cardWebhook`, `anonymization`, `salesRebuild`). Nunca copia nombre ni correo ([¿Qué se audita y quién queda como autor?](https://github.com/Darkmixt12/ws-steven-munoz/issues/44)).
- **Referencia a una Variante:** siempre `{productId, variantId}`, porque la Variante vive bajo su Producto ([ADR 0006](adr/0006-variantes-en-subcoleccion-con-resumen-en-el-producto.md)).
- **Datos personales:** cada campo se marca **C** (común) o **R** (restringido: teléfono, dirección exacta, identificación). No se guarda ningún dato sensible ([Ley 8968](https://github.com/Darkmixt12/ws-steven-munoz/issues/49)).

### Tres formas de escribir

| Forma | Quién | Cómo | Auditoría |
|---|---|---|---|
| **Cliente directo** | el Cliente, sobre lo suyo | SDK web, validado por reglas de propiedad y forma | no se audita |
| **Panel directo** | un Empleado Activo con el Permiso | `withFirestoreCrud` **sin** la opción `audit`; `updatedBy == request.auth.uid` obligatorio; **sin borrados** | trigger de Bitácora ([ADR 0005](adr/0005-la-bitacora-solo-la-escribe-el-backend.md)) |
| **Backend** | callables, triggers, funciones programadas y el webhook de la pasarela | Admin SDK (no pasa por reglas); relee `employees/{uid}` para los Permisos ([ADR 0002](adr/0002-permisos-del-panel-leyendo-el-empleado.md)) | la callable escribe su Evento en su transacción, o hay historia propia |

En las colecciones del Panel directo, **el backend nunca toca `updatedAt` ni `updatedBy`**. Así, el trigger de Bitácora audita solo los cambios que traen un `updatedAt` nuevo (los del Panel) y excluye de la diferencia los campos derivados (`summary`, `stock`, `hasHistory`). Cada acción deja exactamente un Evento.

## 2. Mapa de colecciones

| Ruta | Id | Escribe | Lee | Sección |
|---|---|---|---|---|
| `products/{productId}` | autoId | Panel directo; derivados: backend | público si Publicado; Empleados | [3.1](#31-productsproductid) |
| `products/{productId}/variants/{variantId}` | autoId | Panel directo; Stock: backend | público si el Producto está Publicado; Empleados | [3.2](#32-productsproductidvariantsvariantid) |
| `categories/{categoryId}` | autoId | Panel directo | público | [3.3](#33-categoriescategoryid-y-tagstagid) |
| `tags/{tagId}` | autoId | Panel directo | público | [3.3](#33-categoriescategoryid-y-tagstagid) |
| `skus/{sku}` | SKU normalizado | Panel directo (índice) | Empleados | [3.4](#34-skussku-y-slugsslug) |
| `slugs/{slug}` | slug | Panel directo (índice) | público | [3.4](#34-skussku-y-slugsslug) |
| `stockMovements/{movementId}` | autoId | backend | los tres Roles | [4.1](#41-stockmovementsmovementid) |
| `stockImports/{importId}` | autoId | backend | los tres Roles | [4.2](#42-stockimportsimportid) |
| `customers/{uid}` | `uid` | backend + Cliente directo | dueño; Administrador, Operador | [5.1](#51-customersuid) |
| `customers/{uid}/addresses/{addressId}` | autoId | Cliente directo | dueño; Administrador, Operador | [5.2](#52-customersuidaddressesaddressid) |
| `customers/{uid}/billingProfiles/{profileId}` | autoId | Cliente directo | dueño; Administrador, Operador | [5.3](#53-customersuidbillingprofilesprofileid) |
| `employees/{uid}` | `uid` | backend | el propio Empleado; Administrador | [5.4](#54-employeesuid) |
| `invitations/{email}` | correo normalizado | backend | Administrador | [5.5](#55-invitationsemail) |
| `staffDirectory/{uid}` | `uid` | backend | todo Empleado Activo | [5.6](#56-staffdirectoryuid) |
| `consents/{consentId}` | autoId | backend | dueño; Administrador | [5.7](#57-consentsconsentid) |
| `dataRequests/{requestId}` | autoId | backend | dueño; Administrador | [5.8](#58-datarequestsrequestid) |
| `carts/{uid}` | `uid` | Cliente directo + backend | dueño | [6.1](#61-cartsuid) |
| `orders/{orderId}` | autoId | backend | Cliente (propios); Administrador, Operador | [6.2](#62-ordersorderid) |
| `counters/orderNumber` | fijo | backend | nadie desde el cliente | [6.3](#63-countersordernumber) |
| `settings/storefront` | fijo | Panel directo | público | [7.1](#71-settingsstorefront) |
| `settings/issuer` | fijo | Panel directo | Administrador | [7.2](#72-settingsissuer) |
| `privacyNotices/{version}` | versión | Panel directo (solo crear) | público | [7.3](#73-privacynoticesversion) |
| `salesDaily/{yyyy-mm-dd}` | día | backend | los tres Roles | [8.1](#81-salesdailyyyyy-mm-dd) |
| `auditEvents/{eventId}` | id del evento del trigger o autoId | backend | Administrador | [8.2](#82-auditeventseventid) |
| `notifications/{notificationId}` | determinista desde el origen; autoId en reenvíos | backend | Administrador; Operador (las de Pedidos) | [9](#9-notificaciones) |

Todo lo que no aparece aquí queda denegado por la regla final `/{document=**}`. Las subcolecciones necesitan su propio `match` anidado.

## 3. Catálogo

### 3.1 `products/{productId}`

La ficha del Producto ([¿Qué es un Producto en la tienda?](https://github.com/Darkmixt12/ws-steven-munoz/issues/36)).

| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `description` | string | |
| `slug` | string | único vía `slugs/{slug}` |
| `categoryId` | string | exactamente una Categoría; la regla exige que exista |
| `tagIds` | string[] | Etiquetas |
| `status` | `draft` \| `published` \| `archived` | |
| `images` | `{id, alt?}[]` | ≤ 10, en orden; la primera es la Imagen principal |
| `options` | `{name, values: string[]}[]` | ≤ 3 ejes de Opción |
| `cabysCode` | string (13) | |
| `vatRateCode` | string | código de tarifa de Hacienda, sin fijar el 13 % |
| `unitOfMeasure` | string | |
| `summary` | `{priceMin, priceMax, inStock, activeVariantCount}` | **derivado, solo backend** ([ADR 0006](adr/0006-variantes-en-subcoleccion-con-resumen-en-el-producto.md)) |
| `hasHistory` | boolean | **solo backend**; pasa a `true` con el primer Movimiento o la primera Venta de alguna Variante |
| `createdAt`, `updatedAt`, `updatedBy` | | |

- **Escribe:** Panel directo con "Crear y editar Productos" o "Publicar y archivar" (Administrador, Editor de catálogo). El cliente no puede tocar `summary` ni `hasHistory`. Para pasar a `published`, la regla exige `images.size() >= 1`.
- **Borrar:** solo la callable `deleteProduct`, y solo si `hasHistory == false`. Borra también las Variantes, los índices `skus`/`slugs` y, vía trigger, la carpeta de Storage.
- **Lee:** el anónimo y el Cliente, solo si `status == 'published'` (las consultas deben filtrar `where('status', '==', 'published')`); todo Empleado Activo, todos los estados.
- **Triggers:** Bitácora; limpieza de Storage al quitar imágenes si `hasHistory == false` ([imágenes](https://github.com/Darkmixt12/ws-steven-munoz/issues/50)).

### 3.2 `products/{productId}/variants/{variantId}`

La unidad vendible ([ADR 0001](adr/0001-producto-siempre-con-variante.md), [ADR 0006](adr/0006-variantes-en-subcoleccion-con-resumen-en-el-producto.md)).

| Campo | Tipo | Notas |
|---|---|---|
| `sku` | string | único vía `skus/{sku}`; editable solo mientras `hasHistory == false` |
| `price` | int | CRC con IVA incluido |
| `optionValues` | map `{eje: valor}` | vacío en la Variante por defecto |
| `weightGrams` | int | obligatorio |
| `active` | boolean | una Variante inactiva no se muestra ni se vende |
| `imageId` | string \| null | señala una imagen de `images` del Producto |
| `stock` | int ≥ 0 | **solo backend** ([ADR 0003](adr/0003-el-stock-solo-se-mueve-desde-el-backend.md)); nace en 0 |
| `hasHistory` | boolean | **solo backend** |
| `createdAt`, `updatedAt`, `updatedBy` | | |

- **Escribe:** Panel directo (Administrador, Editor de catálogo), para todo salvo `stock` y `hasHistory`. Al crear, la regla exige `stock == 0` y `hasHistory == false`. Un "stock inicial" en el formulario se registra como Entrada vía callable.
- **Borrar:** solo la callable `deleteVariant`, sin historial.
- **Lee:** el anónimo y el Cliente si `get(products/{productId}).data.status == 'published'` (1 `get`). Todo Empleado Activo.
- **Triggers:** Bitácora (ignora `stock` y `hasHistory`); recálculo de `summary` del Producto (idempotente, desde todas sus Variantes). Además, las transacciones de stock actualizan `summary.inStock` en la misma transacción, para que Agotado no espere al trigger.

### 3.3 `categories/{categoryId}` y `tags/{tagId}`

| Colección | Campos |
|---|---|
| `categories` | `name`, `parentId` (string \| null), `sortOrder`, `createdAt`, `updatedAt`, `updatedBy` |
| `tags` | `name`, `createdAt`, `updatedAt`, `updatedBy` |

- **Escribe:** Panel directo con "Administrar Categorías y Etiquetas". Árbol de ≤ 2 niveles: si `parentId` no es nulo, la regla exige que el padre tenga `parentId == null`.
- **Borrar:** callables `deleteCategory` y `deleteTag`. `deleteCategory` rechaza si hay Productos o Subcategorías que la usen; `deleteTag` quita la Etiqueta de los Productos.
- **Lee:** público.

### 3.4 `skus/{sku}` y `slugs/{slug}`

Índices de unicidad, porque Firestore no tiene restricciones únicas.

| Colección | Id | Campos |
|---|---|---|
| `skus` | SKU normalizado (mayúsculas, sin espacios) | `productId`, `variantId` |
| `slugs` | slug | `productId` |

- **Escribe:** Panel directo, en el **mismo batch** que la Variante o el Producto. La regla solo permite crear si no existe, y exige con `getAfter()` que la Variante o el Producto que lo reclama tenga ese valor.
- **Renombrar:** el batch crea el índice nuevo y borra el viejo. Es la única excepción a "sin borrados desde el Panel": el índice no se audita porque el cambio queda en el Evento de la Variante o del Producto. Borrar un `skus` exige que la Variante no tenga historial.
- **Lee:** `skus` solo Empleados Activos (el Panel verifica disponibilidad). `slugs` es público: la tienda resuelve `/p/{slug}` con una lectura.

## 4. Stock

### 4.1 `stockMovements/{movementId}`

Historia inmutable del Stock ([¿Cómo se modela el stock y sus movimientos?](https://github.com/Darkmixt12/ws-steven-munoz/issues/40)).

| Campo | Tipo | Notas |
|---|---|---|
| `productId`, `variantId` | string | |
| `type` | `receipt` \| `adjustment` \| `orderPlaced` \| `orderCancelled` \| `orderReturned` | |
| `quantity` | int con signo | |
| `resultingStock` | int ≥ 0 | |
| `reason` | `physicalCount` \| `damage` \| `lossOrTheft` \| `internalUse` \| `other` \| null | solo en Ajustes |
| `note` | string \| null | |
| `origin` | `{type: 'order' \| 'stockImport', id}` \| null | |
| `actor` | Autor | |
| `createdAt` | Timestamp | |

- **Escribe:** solo el backend, en la misma transacción que `variants.stock`. Para Entradas, Ajustes y Cargas de stock, la callable `recordStockMovements` (los tres Roles); para los automáticos, las operaciones del Pedido. El primer Movimiento pone `hasHistory = true` en la Variante y en el Producto.
- **Lee:** Empleados Activos con "Registrar movimientos de stock" (los tres Roles).
- **Pendiente de despacho:** el Editor de catálogo no lee Pedidos, así que el Panel obtiene las unidades pendientes por Variante con la callable de lectura `getPendingDispatch`. El Ajuste de conteo se calcula en el servidor (*contado − pendientes*).

### 4.2 `stockImports/{importId}`

Carga de stock: `fileName`, `entryCount`, `totalUnits`, `actor`, `createdAt`. La escribe el backend en la misma operación que sus Entradas, que la referencian en `origin`. La leen los tres Roles.

## 5. Personas

### 5.1 `customers/{uid}`

El Cliente ([¿Qué es un Cliente y cómo se registra?](https://github.com/Darkmixt12/ws-steven-munoz/issues/37)).

| Campo | Tipo | Dato | Notas |
|---|---|---|---|
| `name` | string | C | |
| `email` | string | C | copia del correo de Auth; la refresca el backend |
| `phone` | string E.164 | R | |
| `status` | `active` \| `disabled` | | |
| `statusReason` | `{code, note}` \| null | | motivo de lista fija + nota |
| `defaultAddressId` | string \| null | | Dirección predeterminada |
| `createdAt`, `updatedAt` | | | |

- **Crear:** callable `completeRegistration`, que escribe el Cliente y su Consentimiento ("cuenta y Pedidos") en una transacción.
- **Editar:** el dueño directo, solo `name`, `phone`, `defaultAddressId` y `updatedAt` (`affectedKeys()` acotado). `status` y `statusReason`, por la callable `setCustomerStatus` ("Deshabilitar y rehabilitar Clientes"; nadie sobre su propio Cliente).
- **Borrar:** callable `deleteMyAccount`, bloqueada con Pedidos en curso. Hace `recursiveDelete` del Cliente y sus subcolecciones, borra `carts/{uid}` y pone `customerId = null` en sus Pedidos. Borra el usuario de Auth solo si la Cuenta no tiene un Empleado Activo, y crea la Solicitud de derechos de supresión.
- **Lee:** el dueño; Administrador y Operador ("Ver Clientes").

### 5.2 `customers/{uid}/addresses/{addressId}`

| Campo | Tipo | Dato |
|---|---|---|
| `recipientName` | string | C |
| `phone` | string E.164, +506 | R |
| `districtCode` | string (5) | R |
| `provinceName`, `cantonName`, `districtName` | string | R |
| `neighborhood` | string \| null | R |
| `otherSigns` | string (5–250) | R |
| `dtaVersion` | string (`DTA-2026`) | |
| `createdAt`, `updatedAt` | | |

- **Escribe y borra:** el dueño directo. La regla valida forma y el patrón del código de distrito. Las callables del Pedido revalidan contra el catálogo territorial. El tope de ~10 lo aplica la interfaz.
- **Lee:** el dueño; Administrador y Operador.
- El catálogo territorial (DTA) es un JSON versionado en una librería del monorepo, no una colección ([direcciones](https://github.com/Darkmixt12/ws-steven-munoz/issues/48)).

### 5.3 `customers/{uid}/billingProfiles/{profileId}`

| Campo | Tipo | Dato |
|---|---|---|
| `idType` | `01` \| `02` \| `03` \| `04` | |
| `idNumber` | string | R |
| `legalName` | string | C |
| `email` | string | C |
| `location` | `{districtCode, provinceName, cantonName, districtName, otherSigns}` \| null | R |
| `createdAt`, `updatedAt` | | |

Mismo acceso que las Direcciones. Sin predeterminado.

### 5.4 `employees/{uid}`

El Empleado y único origen de Rol y estado ([Empleado](https://github.com/Darkmixt12/ws-steven-munoz/issues/38), [roles](https://github.com/Darkmixt12/ws-steven-munoz/issues/39), [ADR 0002](adr/0002-permisos-del-panel-leyendo-el-empleado.md)).

| Campo | Tipo | Dato | Notas |
|---|---|---|---|
| `email` | string | C | correo de la Invitación y luego copia del de Auth |
| `name` | string \| null | C | nulo hasta completar el primer ingreso |
| `phone` | string \| null | R | |
| `role` | `administrator` \| `operator` \| `catalogEditor` | | |
| `status` | `invited` \| `active` \| `disabled` | | |
| `statusReason` | `{code, note}` \| null | | |
| `invitedBy` | string (`uid`) | | |
| `invitedAt` | Timestamp | | |
| `statusChangedAt` | Timestamp | | |
| `lastPanelEntryAt` | Timestamp \| null | | lo escribe `enterPanel` |
| `anonymizedAt` | Timestamp \| null | | |
| `createdAt`, `updatedAt` | | | |

- **Escribe:** **solo el backend**, así que no hay trigger ni escrituras mixtas en `employees`:
  - `enterPanel`: al primer ingreso con correo verificado, consume la Invitación y crea el Empleado `invited`; en cada ingreso registra `lastPanelEntryAt`;
  - `completeEmployeeProfile`: Consentimiento "acceso al Panel", nombre y teléfono; pasa a `active`;
  - `updateMyEmployeeProfile`: el propio Empleado cambia su nombre o teléfono;
  - `setEmployeeRole` y `setEmployeeStatus`: "Gestionar Empleados", nunca sobre sí mismo ni dejando cero Administradores Activos;
  - la anonimización al atender una Solicitud de derechos.

  Toda callable que cambia nombre o estado actualiza `staffDirectory/{uid}` y escribe su Evento en la misma transacción.
- **Nunca se borra.**
- **Lee:** el propio Empleado (para que el Panel lo saque en cuanto deje de estar Activo); el Administrador ("Ver Empleados"). Las reglas lo leen con `get()` sin importar la regla de lectura.
- **Invitado** cubre dos momentos: antes de ligar la Invitación, cuando solo existe `invitations/{email}`, y después de ligarla, con `employees/{uid}` en `invited`.

### 5.5 `invitations/{email}`

Id = correo normalizado (sin espacios, en minúsculas). Campos: `email`, `role`, `invitedBy`, `invitedAt`, `expiresAt` (7 días).

- **Escribe:** solo el backend: `inviteEmployee`, `resendInvitation` (reinicia `expiresAt`), `changeInvitationRole`, `revokeInvitation` (borra). `enterPanel` la borra al ligarla.
- **Vencimiento:** política TTL sobre `expiresAt`. `enterPanel` igual rechaza una Invitación vencida que el TTL aún no borró.
- **Lee:** el Administrador. `enterPanel` hace la búsqueda por correo, así que la persona invitada no la lee.

### 5.6 `staffDirectory/{uid}`

`{name}`, o el marcador de anonimizado. Lo escribe solo el backend, en las mismas transacciones que `employees`. Lo lee todo Empleado Activo, de cualquier Rol, para mostrar el nombre de un Autor `employee` sin leer `employees`.

### 5.7 `consents/{consentId}`

Evidencia append-only ([Ley 8968](https://github.com/Darkmixt12/ws-steven-munoz/issues/49)).

| Campo | Tipo | Notas |
|---|---|---|
| `subjectType` | `customer` \| `employee` | |
| `subjectId` | string (`uid`) | |
| `purpose` | `accountAndOrders` \| `marketing` \| `panelAccess` | |
| `granted` | boolean | una aceptación o una revocación es un documento nuevo |
| `noticeVersion` | string | versión del Aviso de privacidad |
| `noticeHash` | string | lo calcula el backend desde el texto del Aviso |
| `channel` | `storefront` \| `panel` | |
| `createdAt` | Timestamp | |
| `expiresAt` | Timestamp \| null | TTL; ver abajo |

- **Escribe:** solo el backend (`completeRegistration`, `setMarketingConsent`, `completeEmployeeProfile`). La única mutación permitida es fijar `expiresAt` = eliminación del sujeto + 5 años, al eliminar la cuenta del Cliente o anonimizar al Empleado.
- **Lee:** el dueño (`subjectId == request.auth.uid`); el Administrador.

### 5.8 `dataRequests/{requestId}`

| Campo | Tipo | Notas |
|---|---|---|
| `type` | `access` \| `rectification` \| `erasure` | |
| `subject` | `{type: 'customer' \| 'employee', id}` | |
| `contactEmail` | string (C) | |
| `channel` | `selfService` \| `email` | |
| `status` | `open` \| `resolved` \| `rejected` | |
| `dueAt` | Timestamp | 5 días hábiles |
| `response` | string \| null | |
| `resolvedBy` | Autor \| null | |
| `resolvedAt` | Timestamp \| null | |
| `createdAt` | Timestamp | |
| `expiresAt` | Timestamp \| null | TTL: resolución + 5 años |

- **Escribe:** solo el backend. `deleteMyAccount` crea una de supresión ya resuelta; `registerDataRequest` (el Administrador registra una recibida por correo); `resolveDataRequest` (el Administrador, nunca la propia). Resolverla ejecuta la supresión o anonimización correspondiente.
- **Lee:** el dueño mientras exista su Cliente; el Administrador.

## 6. Compra

### 6.1 `carts/{uid}`

El Carrito del Cliente ([¿Qué es el Carrito?](https://github.com/Darkmixt12/ws-steven-munoz/issues/41)).

| Campo | Tipo | Notas |
|---|---|---|
| `lines` | map `variantId → {productId, quantity, addedAt}` | una Variante = una línea por construcción; orden por `addedAt` |
| `updatedAt` | Timestamp | |

- **Escribe:** el dueño directo. La regla exige `lines.size() <= 50`, que cada escritura cambie **una sola línea** (`lines.diff(...).affectedKeys().size() == 1`) con `quantity` entre 1 y 99, o que vacíe el Carrito. El dueño puede borrar el documento.
- **Backend:** `mergeCart` hace la fusión al iniciar sesión o completar el registro (unión, cantidad mayor, dentro de los topes). `createOrder` lo lee como única fuente de las líneas y lo vacía en su transacción. `deleteMyAccount` lo borra.
- **Lee:** solo el dueño. Ningún Rol del Panel.
- No se audita.

### 6.2 `orders/{orderId}`

El Pedido, escrito solo por el backend ([¿Qué es un Pedido y cuál es su ciclo de vida?](https://github.com/Darkmixt12/ws-steven-munoz/issues/42), [ADR 0004](adr/0004-el-pedido-solo-se-escribe-desde-el-backend.md)). Todos sus sub-registros van **embebidos**: un Pedido tiene a lo sumo 50 líneas y pocos eventos, muy lejos de 1 MiB.

**Identidad y estado**

| Campo | Tipo | Notas |
|---|---|---|
| `orderNumber` | int | Número de Pedido, desde `counters/orderNumber` |
| `customerId` | string \| null | `uid` del Cliente; `null` tras eliminar la cuenta. Base de la regla de lectura del Cliente |
| `buyerUid` | string \| null | `uid` del comprador; sobrevive a la baja para el conflicto de interés; `null` al anonimizar |
| `status` | `pendingPayment` \| `toFulfill` \| `shipped` \| `readyForPickup` \| `delivered` \| `cancelled` \| `returned` | |
| `statusHistory` | `{status, at, actor}[]` | Historial del Pedido |

La regla del Cliente usa `customerId`, no `buyerUid`. Una Cuenta que conservó su Auth por ser Empleado Activo puede volver a registrarse con el mismo `uid`, y no debe ver los Pedidos que quedaron desasociados.

**Copias congeladas**

| Campo | Forma | Dato |
|---|---|---|
| `contact` | `{name, email, phone}` | C / R |
| `delivery` | `{method: 'homeDelivery' \| 'pickup', shippingCost, shippingVatRateCode, address, tracking}` | |
| `delivery.address` | `{recipientName, phone, districtCode, provinceName, cantonName, districtName, neighborhood, otherSigns, dtaVersion}` \| null | R |
| `delivery.tracking` | `{carrier, number, url}` \| null | Guía |
| `lines[]` | `{productId, variantId, sku, productName, optionValues, optionLabel, thumbPath, cabysCode, unitOfMeasure, vatRateCode, unitPrice, quantity, lineDiscount, lineTotal}` | `thumbPath` = ruta de la miniatura de 400 px |
| `totals` | `{subtotal, discountTotal, shipping, total, vatIncluded}` | CRC enteros; `vatIncluded` es informativo |
| `billing` | `{documentType: 'ticket' \| 'invoice', profile}` | `profile` = copia del Perfil de facturación \| null (R) |

**Pago, Devoluciones y Comprobantes**

| Campo | Forma |
|---|---|
| `payment` | `{method: 'sinpeMovil' \| 'card', status: 'pending' \| 'confirmed' \| 'rejected' \| 'partiallyRefunded' \| 'refunded', amount, reference, confirmedBy: Autor \| null, confirmedAt, refunds[]}` |
| `payment.refunds[]` | `{id, amount, reason: 'cancellation' \| 'return', returnId, reference, actor, at}` |
| `returns[]` | `{id, lines: [{variantId, quantity, restockedQuantity}], reason, refundAmount, creditNoteId, actor, at}` |
| `taxDocuments[]` | `{id, type: 'ticket' \| 'invoice' \| 'creditNote', key, consecutive, issuedAt, haciendaStatus: 'pending' \| 'accepted' \| 'rejected', reference: {key, code} \| null, xmlPath, responsePath, pdfPath}` |

El acceso a los archivos de los Comprobantes (XML, respuesta, PDF) lo decide la feature de factura electrónica junto con el proveedor.

**Campos planos para consultas**

| Campo | Para qué |
|---|---|
| `paymentDeadlineAt` | anulación automática (1 h tarjeta, 24 h SINPE Móvil, desde `settings/storefront`) |
| `paymentConfirmedAt` | Ventas por fecha; recálculo de `salesDaily` |
| `cancelledAt` | anulaciones por fecha |
| `returnDays` | string[] `yyyy-mm-dd`; recálculo con `array-contains` por día |

**Retención**

`retentionUntil` (+5 años), `legalHold` (boolean), `anonymizedAt`, `createdAt`, `updatedAt`. La anonimización reemplaza `contact`, `delivery.address`, `billing.profile` y las notas de motivo, y pone `customerId` y `buyerUid` en `null`. Las líneas y los montos quedan para los reportes.

- **Escribe:** solo el backend: `createOrder`, `cancelMyOrder`, `confirmSinpePayment`, `advanceOrderStatus`, `updateOrderAddress`, `setOrderTracking`, `cancelOrder`, `registerReturn`, `registerRefund`, el webhook de tarjeta, la integración de factura, `cancelUnpaidOrders` y `anonymizeExpiredOrders`.
- **Lee:** el Cliente si `customerId == request.auth.uid` (consultas filtradas por `customerId`); Administrador y Operador ("Ver Pedidos"). El Editor de catálogo no lo lee.

### 6.3 `counters/orderNumber`

`{next: int}`, sembrado con el número inicial (p. ej. 1001). Solo el backend lo lee y lo escribe, en la transacción de `createOrder`.

## 7. Configuración

Separada por quién la lee, porque las reglas actúan por documento. Todo lo escribe el Administrador ("Configuración") directo con `updatedBy`, y lo audita el trigger.

### 7.1 `settings/storefront`

Lectura pública, porque el checkout la muestra.

- `shippingRates`: map código de provincia (`1`–`7`) → CRC con IVA
- `shippingVatRateCode`
- `paymentTimeouts`: `{cardMinutes, sinpeMovilMinutes}`
- `sinpeMovilNumber`
- `storeInfo`: `{name, contactEmail, contactPhone}`; `contactEmail` es el *reply-to* de las Notificaciones
- `pickupInfo`: `{address, hours}` de la bodega, para el checkout y la Notificación "Listo para retirar"
- `currentPrivacyNoticeVersion`
- `updatedAt`, `updatedBy`

### 7.2 `settings/issuer`

Datos del emisor para los Comprobantes: identificación, nombre, actividad económica, sucursal y terminal, ubicación y correo. Lo leen el Administrador y el backend. **Las credenciales del proveedor de factura y de la pasarela no van en Firestore**: van en Secret Manager.

### 7.3 `privacyNotices/{version}`

`text`, `purposes[]`, `publishedAt`, `updatedBy`. Solo se crea, nunca se edita; una versión nueva es un documento nuevo, y `settings/storefront.currentPrivacyNoticeVersion` la señala. Lectura pública.

## 8. Reportes y Bitácora

### 8.1 `salesDaily/{yyyy-mm-dd}`

Agregado de Ventas por día ([¿Qué cuenta como venta para los reportes y cómo se agrega?](https://github.com/Darkmixt12/ws-steven-munoz/issues/43)).

| Campo | Tipo |
|---|---|
| `variants` | map `variantId → {productId, soldUnits, cancelledUnits, returnedUnits, soldAmount, cancelledAmount, returnedAmount}` |
| `updatedAt` | Timestamp |

- **Escribe:** solo el backend, en la misma transacción que confirma el Pago, anula o registra la Devolución. `rebuildSalesDaily` (Administrador) reconstruye un rango desde `orders` y queda auditado.
- **Lee:** los tres Roles ("Ver reportes"). Solo ids y contadores. Hay que vigilar 1 MiB por día.

### 8.2 `auditEvents/{eventId}`

La Bitácora ([ADR 0005](adr/0005-la-bitacora-solo-la-escribe-el-backend.md)).

| Campo | Tipo | Notas |
|---|---|---|
| `actionKey` | string | p. ej. `customer.disable`, `product.publish` |
| `target` | `{collection, id}` | |
| `actor` | Autor | |
| `changes` | map `campo → {before, after}` o `{changed: true}` | solo lo que cambió; los campos personales, sin valor |
| `reason` | `{code, note}` \| null | la nota se borra al anonimizar |
| `occurredAt` | Timestamp | |
| `expiresAt` | Timestamp | +5 años, política TTL |

- **Escribe:** solo el backend. El id es `event.id` del trigger, o autoId si lo escribe una callable.
- **Lee:** el Administrador ("Ver la bitácora"). Nadie lo edita ni lo borra.

## 9. Notificaciones

Correos al Cliente, a la persona invitada y a quien presentó una Solicitud de derechos ([¿Qué notificaciones recibe el Cliente y dejan huella en Firestore?](https://github.com/Darkmixt12/ws-steven-munoz/issues/51), [ADR 0007](adr/0007-las-notificaciones-salen-de-una-bandeja-de-salida.md)).

- **Canal:** solo correo. "Mis pedidos" es la vista siempre disponible del estado del Pedido.
- **Finalidad:** son transaccionales, bajo "cuenta y Pedidos" (`accountAndOrders`). No admiten baja y **nunca** llevan contenido comercial. La Finalidad `marketing` no se usa aquí.
- Los correos de Firebase Auth (verificar el correo, restablecer la contraseña) los envía Auth y no pasan por aquí.

### 9.1 `notifications/{notificationId}`

Bandeja de salida: el backend la escribe **en la misma transacción** que la operación que la origina, y un trigger la envía.

| Campo | Tipo | Dato | Notas |
|---|---|---|---|
| `type` | string | | ver [9.2](#92-tipos) |
| `ref` | `{collection: 'orders' \| 'invitations' \| 'dataRequests', id}` | | origen; el correo se arma al enviarlo, leyéndolo |
| `params` | map \| null | | solo lo que el origen no identifica: `refundId`, `returnId`, `taxDocumentId` |
| `to` | string[] | C | uno o dos correos; ver [9.3](#93-destinatario) |
| `channel` | `email` | | |
| `status` | `pending` \| `sent` \| `failed` \| `bounced` \| `cancelled` | | |
| `attempts` | int | | hasta 3, con espera creciente; luego `failed` |
| `lastError` | string \| null | | |
| `providerMessageId` | string \| null | | |
| `sentAt` | Timestamp \| null | | |
| `actor` | Autor | | el de la operación que la originó; en un reenvío, el Empleado |
| `resendOf` | string \| null | | id de la Notificación reenviada |
| `createdAt`, `updatedAt` | Timestamp | | |
| `expiresAt` | Timestamp | | `createdAt` + 90 días, política TTL |

- **Id:** determinista desde el origen, `{ref.id}_{type}`, más `_{subId}` cuando el tipo se repite en el mismo origen (id del Reembolso, de la Devolución o del Comprobante; número de envío de la Invitación). AutoId en los reenvíos.
- **No guarda el correo armado** ni copias del Pedido: el único dato personal es `to`.
- **Escribe:** solo el backend, desde las operaciones de [9.2](#92-tipos). El trigger `sendNotification` actualiza `status`, `attempts`, `lastError`, `providerMessageId` y `sentAt`. Es idempotente (no reenvía una `sent`) y, si el origen ya no existe (p. ej. una Invitación revocada), la marca `cancelled` sin enviar. Si el proveedor tiene webhook de rebotes, pasa a `bounced`.
- **Reenviar:** `resendNotification` (Permiso "Avanzar estado del Pedido", solo Notificaciones de Pedidos) crea una Notificación **nueva** con `resendOf` y `actor`, al mismo `to`. No hay reenvío a otro correo: sería una forma de sacar datos del Pedido a cualquier dirección. Las Invitaciones se reenvían con `resendInvitation`.
- **Lee:** el Administrador, todas. El Operador, solo `ref.collection == 'orders'` (la consulta debe filtrarlo), en la ficha del Pedido. El Cliente no las lee (ve su Pedido) y el Editor de catálogo tampoco.
- **Bitácora:** ni el envío ni el reenvío generan Evento; la Notificación es su propia historia, con Autor.
- **Retención:** 90 días por TTL. "Eliminar mi cuenta" y la anonimización del Pedido no la tocan.

### 9.2 Tipos

**Una Notificación por operación:** si una operación produce dos hechos (anular y reembolsar), el correo cuenta los dos.

| `type` | Cuándo | Lo escribe | Contenido |
|---|---|---|---|
| `order.awaitingSinpePayment` | Pedido creado con SINPE Móvil | `createOrder` | número SINPE, monto, Número de Pedido como referencia y plazo |
| `order.paymentConfirmed` | Pendiente de pago → Por preparar | `confirmSinpePayment`, `cardPaymentWebhook` | |
| `order.shipped` | → Enviado | `advanceOrderStatus` | la Guía, si ya está registrada |
| `order.readyForPickup` | → Listo para retirar | `advanceOrderStatus` | `settings/storefront.pickupInfo` |
| `order.cancelled` | → Anulado | `cancelMyOrder`, `cancelOrder`, `cancelUnpaidOrders` | motivo y, si va en la misma operación, el Reembolso |
| `order.refunded` | Reembolso registrado aparte (p. ej. el SINPE de vuelta) | `registerRefund` | monto y referencia |
| `order.returnRegistered` | Devolución registrada | `registerReturn` | unidades, monto y su Reembolso si va junto |
| `order.addressCorrected` | un Empleado corrige la dirección de entrega | `updateOrderAddress` | |
| `taxDocument.accepted` | Hacienda acepta un Comprobante | integración de factura | PDF, XML y respuesta de Hacienda |
| `invitation.sent` | Invitación creada o reenviada | `inviteEmployee`, `resendInvitation` | enlace al Panel y vencimiento |
| `dataRequest.answered` | Solicitud de derechos resuelta o rechazada | `resolveDataRequest`, `deleteMyAccount` | la respuesta escrita |

**No notifican:** el Pedido creado con tarjeta (el resultado se ve en pantalla), el rechazo de tarjeta, Entregado, la Guía registrada o corregida después de Enviado (se ve en "Mis pedidos"), el cambio de Rol de una Invitación y el Carrito. Un Comprobante rechazado por Hacienda no se envía: se corrige y se envía el reemitido.

### 9.3 Destinatario

| Origen | `to` |
|---|---|
| Pedido (todos los `order.*`) | `contact.email` congelado, siempre: aunque el Cliente cambie su correo, esté Deshabilitado o haya eliminado su cuenta |
| Factura | `billing.profile.email` y, si es distinto, `contact.email` |
| Tiquete y Nota de crédito | `contact.email` |
| Invitación | `email` de la Invitación |
| Solicitud de derechos | `contactEmail` |

`settings/storefront.storeInfo.contactEmail` es el *reply-to* de todas. Un Pedido anonimizado ya no genera Notificaciones.

## 10. Storage (referencia)

Decidido en [¿Cómo se guardan y referencian las imágenes de un Producto?](https://github.com/Darkmixt12/ws-steven-munoz/issues/50):

```
products/{productId}/{imageId}.webp                 ← original ≤ 1600 px
products/{productId}/thumbs/{imageId}_400x400.webp  ← extensión Resize Images
products/{productId}/thumbs/{imageId}_800x800.webp
```

`storage.rules`:

- **Lectura:** pública.
- **Crear:** solo un Empleado Activo con "Crear y editar Productos". La regla lee `employees/{uid}` con `firestore.get()` y exige `resource == null`, tipo JPEG/PNG/WebP y ≤ 5 MB.
- **Actualizar o borrar:** nunca desde el cliente.

## 11. Procesos del backend

Nombres indicativos. Toda callable del Panel relee `employees/{uid}` y verifica Activo, correo verificado y Permiso.

| Proceso | Tipo | Quién lo invoca | Escribe |
|---|---|---|---|
| `completeRegistration` | callable | Cuenta sin Cliente | `customers`, `consents` |
| `setMarketingConsent` | callable | Cliente | `consents` |
| `deleteMyAccount` | callable | Cliente | borra `customers/**` y `carts`; `orders.customerId`; `dataRequests`; `notifications`; Auth condicional |
| `mergeCart` | callable | Cliente | `carts` |
| `createOrder` | callable | Cliente Activo, correo verificado | `orders`, `counters`, `variants.stock`, `stockMovements`, `products.summary`, `carts`, `notifications` (SINPE Móvil) |
| `cancelMyOrder` | callable | Cliente (Pendiente de pago) | `orders`, `variants.stock`, `stockMovements`, `notifications` |
| `cardPaymentWebhook` | HTTP | pasarela | `orders`, `salesDaily`, `notifications` |
| `confirmSinpePayment` | callable | Avanzar estado del Pedido | `orders`, `salesDaily`, `notifications` |
| `advanceOrderStatus` | callable | Avanzar estado del Pedido | `orders`, `notifications` (salvo Entregado) |
| `updateOrderAddress`, `setOrderTracking` | callable | Avanzar estado del Pedido | `orders`, `auditEvents`; `notifications` (solo `updateOrderAddress`) |
| `cancelOrder`, `registerReturn`, `registerRefund` | callable | Anular o devolver Pedido (no los propios) | `orders`, `variants.stock`, `stockMovements`, `salesDaily`, `notifications` |
| `resendNotification` | callable | Avanzar estado del Pedido | `notifications` |
| `recordStockMovements` | callable | Registrar movimientos de stock | `variants.stock`, `stockMovements`, `stockImports`, `products.summary` |
| `getPendingDispatch` | callable (lectura) | Registrar movimientos de stock | — |
| `deleteProduct`, `deleteVariant`, `deleteCategory`, `deleteTag` | callable | Crear y editar Productos / Administrar Categorías y Etiquetas | catálogo, `skus`, `slugs`, `auditEvents` |
| `setCustomerStatus` | callable | Deshabilitar y rehabilitar Clientes | `customers`, `auditEvents` |
| `enterPanel`, `completeEmployeeProfile`, `updateMyEmployeeProfile` | callable | la propia Cuenta | `employees`, `invitations`, `staffDirectory`, `consents`, `auditEvents` |
| `inviteEmployee`, `resendInvitation`, `changeInvitationRole`, `revokeInvitation` | callable | Gestionar Empleados | `invitations`, `auditEvents`; `notifications` (solo `inviteEmployee` y `resendInvitation`) |
| `setEmployeeRole`, `setEmployeeStatus` | callable | Gestionar Empleados | `employees`, `staffDirectory`, `auditEvents` |
| `registerDataRequest`, `resolveDataRequest` | callable | Atender Solicitudes de derechos | `dataRequests`, datos del sujeto, `consents.expiresAt`, `auditEvents`; `notifications` (solo `resolveDataRequest`) |
| `rebuildSalesDaily` | callable | Administrador | `salesDaily`, `auditEvents` |
| integración de factura | backend | tras confirmar el Pago o emitir una Nota de crédito | `orders.taxDocuments`; `notifications` cuando Hacienda acepta |
| `sendNotification` | trigger | creación en `notifications` | envía el correo; `notifications` (estado, intentos) |
| webhook de rebotes | HTTP (opcional) | proveedor de correo | `notifications.status = bounced` |
| `auditPanelWrites` | trigger | escrituras del Panel directo en `products`, `variants`, `categories`, `tags`, `settings`, `privacyNotices` | `auditEvents` |
| `syncProductSummary` | trigger | escrituras en `variants` | `products.summary` |
| `cleanupProductImages` | trigger | escrituras en `products` | Storage |
| Resize Images | extensión | subidas a `products/**` | Storage |
| `cancelUnpaidOrders` | programada (cada pocos minutos) | Sistema | `orders`, `variants.stock`, `stockMovements`, `notifications` |
| `anonymizeExpiredOrders` | programada (diaria) | Sistema | `orders`, `auditEvents` |
| Políticas TTL | Firestore | — | borran `auditEvents`, `invitations`, `consents`, `dataRequests`, `notifications` vencidos |

## 12. Índices compuestos previstos

| Colección | Campos | Consulta |
|---|---|---|
| `products` | `status` ↑, `categoryId` ↑, `createdAt` ↓ | catálogo publicado por Categoría |
| `products` | `status` ↑, `tagIds` (array-contains), `createdAt` ↓ | catálogo publicado por Etiqueta |
| `products` | `status` ↑, `updatedAt` ↓ | Panel: Productos por estado |
| `stockMovements` | `variantId` ↑, `createdAt` ↓ | historia de una Variante |
| `stockMovements` | `origin.id` ↑, `createdAt` ↑ | Movimientos de un Pedido o de una Carga |
| `stockMovements` | `type` ↑, `createdAt` ↓ | Panel: Movimientos por tipo |
| `orders` | `customerId` ↑, `createdAt` ↓ | "Mis pedidos" |
| `orders` | `status` ↑, `paymentDeadlineAt` ↑ | anulación automática |
| `orders` | `status` ↑, `createdAt` ↓ | Panel: Pedidos por estado |
| `orders` | `legalHold` ↑, `anonymizedAt` ↑, `retentionUntil` ↑ | anonimización |
| `consents` | `subjectId` ↑, `purpose` ↑, `createdAt` ↓ | Consentimiento vigente por Finalidad |
| `dataRequests` | `status` ↑, `dueAt` ↑ | Solicitudes abiertas por vencer |
| `auditEvents` | `target.collection` ↑, `target.id` ↑, `occurredAt` ↓ | por objetivo |
| `auditEvents` | `actor.id` ↑, `occurredAt` ↓ | por Autor |
| `auditEvents` | `actionKey` ↑, `occurredAt` ↓ | por acción |
| `notifications` | `ref.collection` ↑, `ref.id` ↑, `createdAt` ↓ | Notificaciones de un Pedido, una Invitación o una Solicitud |

Las consultas por un solo campo (`paymentConfirmedAt`, `cancelledAt`, `returnDays`, `orderNumber`, `auditEvents.occurredAt`) usan los índices automáticos. Políticas TTL: `auditEvents.expiresAt`, `invitations.expiresAt`, `consents.expiresAt`, `dataRequests.expiresAt`, `notifications.expiresAt`.

## 13. Matriz rol × colección × operación

**R** leer · **C** crear · **U** actualizar · **D** borrar · **—** nada. El Cliente actúa solo sobre lo suyo. "Empleado" exige estado Activo y correo verificado. Todo lo que escribe el backend va por callables, triggers o funciones programadas, que ya verificaron el Permiso.

| Colección | Anónimo | Cliente | Administrador | Operador | Editor de catálogo | Backend |
|---|---|---|---|---|---|---|
| `products` | R¹ | R¹ | R C U | R | R C U | U² D |
| `variants` | R³ | R³ | R C U | R | R C U | U⁴ D |
| `categories`, `tags` | R | R | R C U | R | R C U | D |
| `skus` | — | — | R C D⁵ | R | R C D⁵ | D |
| `slugs` | R | R | R C D⁵ | R | R C D⁵ | D |
| `stockMovements` | — | — | R | R | R | C |
| `stockImports` | — | — | R | R | R | C |
| `customers` | — | R U⁶ | R | R | — | C U D |
| `addresses`, `billingProfiles` | — | R C U D | R | R | — | D |
| `employees` | — | — | R | R⁷ | R⁷ | C U |
| `invitations` | — | — | R | — | — | C U D |
| `staffDirectory` | — | — | R | R | R | C U |
| `consents` | — | R | R | — | — | C U⁸ |
| `dataRequests` | — | R | R | — | — | C U |
| `carts` | — | R C U D | — | — | — | U D |
| `orders` | — | R⁹ | R | R | — | C U |
| `counters` | — | — | — | — | — | R U |
| `settings/storefront` | R | R | R U | R | R | — |
| `settings/issuer` | — | — | R U | — | — | R |
| `privacyNotices` | R | R | R C | R | R | — |
| `salesDaily` | — | — | R | R | R | C U |
| `auditEvents` | — | — | R | — | — | C (TTL borra) |
| `notifications` | — | — | R | R¹⁰ | — | C U (TTL borra) |

1. Solo `status == 'published'`; la consulta debe filtrarlo.
2. Solo `summary` y `hasHistory`; borrar, por `deleteProduct`.
3. Solo si el Producto padre está Publicado (1 `get`).
4. Solo `stock` y `hasHistory`.
5. Solo al renombrar, en el mismo batch, y sin historial.
6. Solo `name`, `phone` y `defaultAddressId`.
7. Solo su propio documento. El Administrador lee todos, incluido el suyo.
8. Solo `expiresAt`.
9. Solo los suyos (`customerId == uid`).
10. Solo las de Pedidos (`ref.collection == 'orders'`); la consulta debe filtrarlo. El reenvío es por `resendNotification`.

## 14. Presupuesto de reglas

Límite: 10 llamadas `get()`/`exists()` por evaluación (20 en lotes y transacciones).

| Petición | Llamadas |
|---|---|
| Cualquier petición del Panel | 1 `get(employees/{uid})` |
| Escritura de una Variante | + 1 `getAfter(skus/…)` y, al renombrar, + 1 `get` del índice viejo |
| Categoría con padre | + 1 `get(categories/{parentId})` |
| Producto con Categoría | + 1 `exists(categories/…)` |
| Lectura anónima de Variantes | 1 `get(products/{productId})` |
| Subida a Storage | 1 `firestore.get(employees/{uid})` |

Ninguna petición prevista pasa de 4. La tabla Rol → Permisos tiene tres espejos que deben mantenerse iguales: el código, `firestore.rules` y `storage.rules`.

## 15. Requisitos para la ejecución

- **Librería de stores:** un `withWatchDocument` hermano de `withWatchCollection`, para seguir documentos sueltos: `carts/{uid}`, `customers/{uid}`, el propio `employees/{uid}` y `settings/storefront`. `moofyvip` no lo tiene.
- **`withFirestoreCrud`:** siempre **sin** la opción `audit` ([ADR 0005](adr/0005-la-bitacora-solo-la-escribe-el-backend.md)). Las subcolecciones se pasan como ruta string (`products/{id}/variants`).
- **`firestore.rules`:** `match` anidado para cada subcolección, porque la regla final lo deniega todo.
- **Proyecto Firebase de la tienda:** políticas TTL; extensión Resize Images; secretos en Secret Manager (incluida la credencial del proveedor de correo, que elige la feature); sin Identity Platform (no hay blocking functions: la Invitación se liga en `enterPanel`).
- **Catálogo territorial:** JSON `DTA-2026` en una librería compartida del monorepo, usado por el front y por las Functions.

## 16. Decisiones menores tomadas en este documento

Estos detalles no los fijó ningún ticket; se eligieron al redactar este documento y se pueden ajustar en la ejecución sin migraciones difíciles:

- Los nombres exactos de campos, callables y triggers.
- `hasHistory` en Producto y Variante, escrito por el backend, porque las reglas no pueden consultar si hubo Movimientos o Ventas.
- El backend no toca `updatedAt`/`updatedBy` en las colecciones del Panel directo, y el trigger de Bitácora audita solo cambios con `updatedAt` nuevo.
- Pendiente de despacho por la callable `getPendingDispatch`, porque el Editor de catálogo no lee Pedidos.
- TTL para las Invitaciones vencidas.
- Id de `skus` normalizado en mayúsculas.
- `customerId` como base de la regla de "Mis pedidos", y la anonimización pone `buyerUid` en `null`.
- `consents.expiresAt` como única mutación de un Consentimiento.
- El acceso a los archivos de Comprobantes se deja a la feature de factura electrónica.
- Nombres de los tipos de Notificación (`order.shipped`, …) y el formato del id determinista de `notifications`.
- `changeInvitationRole` no notifica; `deleteMyAccount` sí escribe `dataRequest.answered` como confirmación de la supresión; la Solicitud rechazada también se notifica.
- El `actor` de una Notificación es el Autor de la operación que la originó.
