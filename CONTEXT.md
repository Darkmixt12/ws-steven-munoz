# Tienda CR

Tienda online de productos físicos que vende solo en Costa Rica. Es un dominio separado del CRM `steven-munoz`: sus términos no se comparten.

## Lenguaje

### Personas

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Cliente** | `customer` | Persona que compra en la tienda, con registro completo; hay uno por cuenta. | Client (término del CRM), comprador, usuario, cuenta |

### Datos del Cliente

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Dirección** | `address` | Lugar de entrega en Costa Rica guardado por un Cliente, con destinatario, teléfono, distrito y señas. | domicilio, ubicación |
| **Dirección predeterminada** | `defaultAddress` | La Dirección que se propone primero al Cliente al comprar; hay a lo sumo una. | dirección principal |
| **Perfil de facturación** | `billingProfile` | Identificación y nombre (o razón social) a los que se emite una factura en vez de un tiquete; un Cliente puede tener varios. | receptor, datos fiscales |

### Estados del Cliente

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Activo** | `active` | Estado del Cliente que puede iniciar sesión y comprar. | habilitado |
| **Deshabilitado** | `disabled` | Estado reversible del Cliente al que un Empleado impidió iniciar sesión y comprar; conserva su historial. | bloqueado, eliminado, baneado |

### Privacidad

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Aviso de privacidad** | `privacyNotice` | Texto versionado que informa a una persona qué datos se recolectan, para qué Finalidades y cuáles son sus derechos. | política, términos |
| **Finalidad** | `purpose` | Uso concreto de los datos personales para el que se pide Consentimiento (p. ej. cuenta y Pedidos, comunicaciones comerciales). | propósito, permiso |
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
| **Agotado** | — | Condición de una Variante publicada sin stock disponible: se ve pero no se compra. No es un estado del Producto. | sin existencias, inactivo |
