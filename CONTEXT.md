# Tienda CR

Tienda online de productos físicos que vende solo en Costa Rica. Es un dominio separado del CRM `steven-munoz`: sus términos no se comparten.

## Lenguaje

### Personas

| Término | Identificador en código | Definición | Evitar |
|---|---|---|---|
| **Cliente** | `customer` | Persona que compra en la tienda. | Client (término del CRM), comprador, usuario |

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
