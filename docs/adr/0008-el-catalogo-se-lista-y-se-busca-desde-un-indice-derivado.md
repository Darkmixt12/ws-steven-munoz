# El catálogo de la tienda se lista y se busca desde un índice derivado

La tienda no consulta `products` para mostrar el catálogo. Lee un único documento, `catalogIndex/storefront`, con una entrada compacta por Producto Publicado (nombre, slug, Categoría, Etiquetas, valores de Opción, rango de precio, disponibilidad, Imagen principal y Fecha de publicación), y en el navegador filtra, ordena y hace la Búsqueda: sin tildes, por prefijo, con varias palabras a la vez y con el nombre pesando más. Un trigger sobre `products` mantiene cada entrada: la escribe si el Producto está Publicado y la quita si no. Como el resumen derivado del Producto (ADR 0006) ya trae el precio y la disponibilidad, ese único trigger alcanza. El documento completo del Producto se lee solo en su página.

Se eligió porque el catálogo es pequeño (menos de ~300 Productos Publicados previstos): una lectura por visita, sin proveedor externo y con una Búsqueda mejor que la que permiten las consultas de Firestore Standard.

## Considered Options

- **Leer todos los Productos Publicados y buscar en el navegador:** funciona sin cambiar el modelo y es el patrón de `moofyvip`, pero cuesta una lectura por Producto en cada visita y descarga fichas completas, descripción incluida. Queda como respaldo si el índice diera problemas.
- **`searchTokens` en el Producto con `array-contains`:** descartado. Firestore Standard admite un solo `array-contains` por consulta y `array-contains-any` es un O, así que "camiseta roja" no se resuelve en el servidor; tampoco hay relevancia ni tolerancia a errores.
- **Algolia o Typesense:** la mejor Búsqueda (errores de tipeo, plurales, español), pero suma un proveedor, claves de búsqueda restringidas generadas por el backend, una sincronización propia (sus extensiones no filtran por Publicado y Firebase Extensions se apaga el 31 de marzo de 2027) y costo por búsqueda. Desproporcionado para ~300 Productos.
- **Búsqueda de texto nativa de Firestore:** descartada. En 2026 existe solo en la edición Enterprise y en Preview; exige crear otra base (una Standard no se convierte), no da tiempo real y no está documentado que ignore tildes, busque por prefijo ni funcione bajo reglas de seguridad desde el navegador.

## Consequences

- La portada, la grilla de una Categoría o Etiqueta y los resultados de una Búsqueda son la misma vista sobre el índice, sin paginación. Los índices compuestos del catálogo publicado sobre `products` no hacen falta.
- El índice es eventualmente consistente (segundos): un Producto recién Agotado puede verse disponible un instante, pero la página del Producto lee la Variante y la callable del Pedido rechaza lo que no hay.
- Las entradas llevan ids de Categoría y Etiqueta, no nombres: renombrarlas no toca el índice, y el navegador resuelve los nombres con `categories` y `tags`.
- El documento tiene un techo de 1 MiB (unos pocos miles de entradas). Al acercarse, el índice se parte en varios documentos; si el catálogo crece mucho más, se reabre la decisión hacia un servicio de búsqueda.
- El documento se excluye de los índices automáticos de Firestore.
- Cambiar esta decisión implica rehacer el listado de la tienda sobre consultas a `products` o sobre un servicio externo, y volver a crear los índices compuestos del catálogo.
