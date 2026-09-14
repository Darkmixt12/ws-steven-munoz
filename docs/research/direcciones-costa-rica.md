# Direcciones en Costa Rica y datos territoriales

> Investigación para el ticket #48 (mapa #35). Fecha de consulta: 2026-09-14.
> Alcance: tienda en línea de bienes físicos, solo Costa Rica. La elección de courier queda fuera de alcance.
> Marcas: **⚠️ Incierto** = no se pudo verificar contra la fuente primaria o la fuente es ambigua.

## Resumen

- Costa Rica tiene hoy **7 provincias, 84 cantones y 494 distritos**, según la tabla oficial *División Territorial Administrativa 2026* del Instituto Geográfico Nacional (IGN, Registro Nacional).
- La jerarquía oficial es **Provincia → Cantón → Distrito**. Por debajo del distrito no hay una unidad oficial con límites legales: "barrio o poblado" es un catálogo auxiliar (Hacienda, INEC), no parte de la DTA.
- El código oficial del distrito tiene **5 dígitos**: `P CC DD` (provincia, cantón, distrito). Ese mismo número funciona como **código postal** de Correos de Costa Rica.
- La división cambia con poca frecuencia pero cambia: en 2021–2022 se crearon 2 cantones y en mayo de 2025, 2 distritos. Los códigos existentes se conservan y las unidades nuevas reciben el siguiente número libre.
- Hay datasets descargables con códigos, pero ninguno es un CSV oficial del IGN. El IGN publica la tabla en **PDF**. Hacienda publica un **XLSX** (hasta nivel barrio) que está **desactualizado**: tiene 492 distritos y le faltan los de 2025.

## 1. División Territorial Administrativa (DTA) vigente

### Totales

| Fuente | Provincias | Cantones | Distritos |
|---|---|---|---|
| IGN, DTA 2026 (vigente) | 7 | 84 | **494** |
| IGN, DTA 2025 (marzo 2025) | 7 | 84 | 492 |
| IGN, DTA 2021 | 7 | 82 | 488 |

- DTA 2026: https://www.snitcr.go.cr/pdfs/ign_repositorio/DTA-TABLA%20POR%20PROVINCIA-CANT%C3%93N-DISTRITO%202026.pdf
- DTA 2025: https://www.snitcr.go.cr/file-uploads/Noticias/NoticiasSubidas/99d0457a2ea34a1061bef8ac931f839792525446e29f06efa174708e7e841aa6/Tabla%20actualizada%20sobre%20Divisi%C3%B3n%20Territorial%20Administrativa%202025/DTA-TABLA%20POR%20PROVINCIA-CANT%C3%93N-DISTRITO%202025.pdf (anunciada el 14 de marzo en https://www.snitcr.go.cr/Noticias/detallenoticia2?id=bm90aWNpYTo6MTc0MTk2NjM0Nw%3D%3D)
- DTA 2021: https://files.snitcr.go.cr/boletines/DTA-TABLA%20POR%20PROVINCIA-CANT%C3%93N-DISTRITO%202021.pdf

Las tablas del IGN traen tres niveles (provincia, cantón y distrito, con su área en km²) y un anexo histórico con la fecha y la norma de creación de cada cantón y distrito.

### Estructura de los códigos (IGN / DTA)

- Provincia: 1 dígito (`1` San José, `2` Alajuela, `3` Cartago, `4` Heredia, `5` Guanacaste, `6` Puntarenas, `7` Limón).
- Cantón: 3 dígitos = provincia + número de cantón de 2 dígitos (p. ej. `216` Río Cuarto).
- Distrito: 5 dígitos = código de cantón + número de distrito de 2 dígitos (p. ej. `40501` San Rafael de San Rafael, Heredia).

Fuente: tabla DTA 2026 (URL arriba). Filas verificadas: `216 Río Cuarto`, `612 Monteverde / 61201 Monteverde`, `613 Puerto Jiménez`, `50405 Pijije`, `60310 Cabagra`, `40501 San Rafael`, `40601 San Isidro`.

### Cambios recientes (qué tan seguido cambia)

| Unidad | Código | Creación según DTA 2026 | Nota |
|---|---|---|---|
| Cantón Río Cuarto (Alajuela) | 216 | 2017 | ⚠️ Incierto: la fecha y la norma no se leyeron directamente en el PDF porque la maquetación sale desordenada. |
| Cantón Monteverde (Puntarenas) | 612 | 07/01/2022, Ley 10019 | Distrito único `61201`. |
| Cantón Puerto Jiménez (Puntarenas) | 613 | 2022 | Distrito único. ⚠️ Incierto: la norma aparece como Ley 10195 del 21/06/2022, pero la columna viene desalineada en la extracción del PDF. |
| Distrito Pijije (Bagaces, Guanacaste) | 50405 | 30/05/2025, "Decreto 10688" | Así lo dice la tabla del IGN. La prensa lo reporta como Ley 10.688. |
| Distrito Cabagra (Buenos Aires, Puntarenas) | 60310 | 30/05/2025, "Decreto 10709" | Así lo dice la tabla del IGN. La prensa lo reporta como Ley 10709. |

- Monteverde y Puerto Jiménez tienen ley de creación de 2021–2022, pero su municipalidad empezó a funcionar hasta el 1 de mayo de 2024, tras las elecciones municipales (fuente secundaria: https://observador.cr/monteverde-y-puerto-jimenez-hicieron-historia-este-1-de-mayo-al-fin-son-plenamente-en-cantones/). Es decir, entre la creación legal de una unidad y su uso práctico puede pasar tiempo.
- Patrón que se observa: las unidades nuevas **se segregan** de otras existentes (Pijije salió del distrito Bagaces, Cabagra de distritos de Buenos Aires). Reciben el **siguiente código libre** y los códigos existentes **no se renumeran** (ver filas de la DTA 2026). ⚠️ Incierto: es un patrón observado, no una regla escrita que hayamos encontrado.
- Frecuencia: el SNIT indica que "cada dos años se publica la DTA en el Diario Oficial La Gaceta" (https://www.snitcr.go.cr/biblioteca_DTA). En la práctica el IGN actualiza la tabla casi cada año (2021, 2022, 2024, 2025, 2026).
- Oficialización: el **Decreto Ejecutivo 44882-MGP** declara oficial la DTA para efectos administrativos. ⚠️ Incierto: solo se vio citado en resultados de búsqueda; el texto en SCIJ/SINALEVI (https://sinalevi.go.cr) no se pudo abrir y no se verificaron la fecha ni los totales.

### Marco legal (Ley 4366, Ley sobre División Territorial Administrativa, 19/08/1969)

Texto: https://faolex.fao.org/docs/pdf/cos105021.pdf (copia FAO del texto original; SCIJ: https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=35441&nValor3=0&strTipM=TC)

- Art. 1: crea la **Comisión Nacional de División Territorial Administrativa**, integrada por el Ministro de Gobernación y los directores del IGN y de Estadística y Censos (hoy INEC), con sede en el IGN. No se pueden crear provincias, cantones ni distritos sin su criterio.
- Arts. 5 y 11: los límites de provincias y cantones solo se alteran **por ley**.
- Art. 14: los cantones se dividen en distritos. El Poder Ejecutivo declara su creación "por acuerdo", con un requisito de población mínima. Nota: las creaciones de 2025 aparecen con número de ley (10688 y 10709), así que en la práctica también se crean distritos por ley. ⚠️ Incierto: reformas posteriores a la Ley 4366 que no se revisaron.
- Art. 15: los **nombres** de las unidades nuevas los acuerda la Comisión Nacional de Nomenclatura. El IGN y la Dirección de Estadística registran los cambios.

## 2. Datasets oficiales con códigos

| Publicador | Qué contiene | Formato | Vigencia | URL |
|---|---|---|---|---|
| IGN / Registro Nacional (SNIT) | Provincia, cantón y distrito con códigos, área y norma de creación | **PDF** | DTA 2026, 494 distritos (**vigente**) | https://www.snitcr.go.cr/pdfs/ign_repositorio/DTA-TABLA%20POR%20PROVINCIA-CANT%C3%93N-DISTRITO%202026.pdf |
| Ministerio de Hacienda (comprobantes electrónicos v4.4) | Provincia, cantón, distrito y **barrio o poblado** (7.087 filas) | **XLSX** dentro de un `.rar` | Última modificación 2022-12-28; 84 cantones y **492 distritos**; **no incluye Pijije ni Cabagra** | https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/Codificacionubicacion_V4.4.rar (listado en https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/frmAnexosyEstructuras.aspx) |
| INEC | Consulta del codificador geográfico (provincia, cantón, distrito, localidad) con un `Nomenclator_U.xlsx` | XLSX | ⚠️ Incierto: la página no cargó (error de ReportViewer) y no se verificó la fecha | http://sistemas.inec.cr/sitiosen/sitiosen/FrmGeografico.aspx |
| IGN (SNIT) | Capas geográficas de la DTA (servicios OGC y mapas) | WMS/WFS/visor | ⚠️ Incierto: no se evaluó | https://www.snitcr.go.cr |

Detalles del archivo de Hacienda (verificados abriendo el XLSX):

- Una sola hoja (`Hoja1`) con columnas `Provincia | nombre | Cantón | nombre | Distrito | nombre | Barrio o Poblado | nombre`.
- Los códigos son **números por nivel**, no el código concatenado. Por ejemplo, Monteverde aparece como `6 | Puntarenas | 12 | Monte Verde | 1 | Monte Verde`.
- Algunos nombres difieren de la DTA ("Monte Verde" frente a "Monteverde", "Puerto Jimenez" sin tilde, algunas filas en mayúsculas). Pijije aparece solo como **barrio** del distrito Bagaces (`5-4-1`, barrio 17), no como distrito `5-4-5`.

Conclusión: **la fuente de verdad para P/C/D es la DTA del IGN**. El archivo de Hacienda sirve como semilla práctica (ya viene en XLSX), pero hay que corregirlo con la DTA 2026: agregar `50405 Pijije` y `60310 Cabagra`, y normalizar los nombres. No hay un CSV oficial vigente del IGN. Para llevar la tabla a JSON hay que transcribir el PDF o partir del XLSX de Hacienda y aplicar el diff.

## 3. Comprobantes electrónicos de Hacienda (v4.4): cómo modelan la ubicación

Esquema XSD de la Factura Electrónica v4.4, `UbicacionType` (https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/FacturaElectronica_V4.4.xsd):

| Campo | Tipo | Restricción | Obligatorio |
|---|---|---|---|
| `Provincia` | entero | 1 dígito (`\d`) | sí |
| `Canton` | entero | 2 dígitos (`\d\d`) | sí |
| `Distrito` | entero | 2 dígitos (`\d\d`) | sí |
| `Barrio` | texto | 5–50 caracteres | **no** (opcional) |
| `OtrasSenas` | texto | 5–250 caracteres | sí |

- El documento *Anexos y Estructuras v4.4*, cambio n.º 15, dice que el campo "Barrio" pasa de condicional a **opcional** y se habilita la escritura: ahora es texto libre ("Debe de detallarse en texto, el nombre del barrio"). La Nota 14 remite a `Codificacionubicacion_V4.4` para provincia, cantón y distrito. Fuente: https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf
- Existe además `OtrasSenasExtranjero` para receptores extranjeros no domiciliados. No aplica porque la tienda es solo para Costa Rica.
- ⚠️ Incierto: no se verificó si Hacienda rechaza o solo advierte cuando un comprobante usa un distrito que no está en su codificación (Pijije `5-4-5`, Cabagra `6-3-10`). Solo importa si en el futuro se emiten facturas electrónicas con la dirección del receptor.

## 4. Código postal (Correos de Costa Rica)

- **5 dígitos**, sin letras ni separadores, ubicados sobre el nombre del país. Estructura: provincia (1), cantón (2), distrito (2). Fuente: ficha de direccionamiento de la UPU elaborada con Correos de Costa Rica (04/2009), https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/criEn.pdf
- El código postal **coincide con el código de distrito de la DTA**. Ejemplos de la UPU: `40501` = Heredia, San Rafael, San Rafael; `40601` = Heredia, San Isidro, San Isidro. Ambos son idénticos a los códigos de distrito de la DTA 2026. Por lo tanto el código postal **se deriva** del distrito: identifica el distrito, no la calle ni el edificio.
- Correos ofrece una consulta que pide provincia, luego cantón, luego distrito y devuelve el código: https://sucursal.correos.go.cr/web/codigoPostal (también https://correos.go.cr/codigo-postal/). ⚠️ Incierto: en las páginas de Correos que se pudieron leer no hay un texto normativo que diga "código postal = código DTA". La equivalencia se infiere de los ejemplos de la UPU y de la herramienta de consulta.

## 5. Formato habitual de una dirección y campos mínimos para un envío

La UPU, con Correos de Costa Rica, muestra este formato (https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/criEn.pdf):

```
Señor Carlos Torres              ← destinatario
Ca 15 Av 37 # 55                 ← calle / avenida / número (o señas)
Heredia, San Rafael, San Rafael  ← provincia, cantón, distrito
40501                            ← código postal (= código de distrito)
COSTA RICA
```

- Con apartado postal: `Apdo 257-3017`, luego `Heredia, San Isidro, San Isidro`, luego `3017-40601`. Para una tienda que entrega a domicilio no aplica.
- En la práctica la mayoría de las direcciones no tienen calle ni número utilizable. Se describen con **"otras señas"**: puntos de referencia ("200 m norte de la iglesia, casa verde portón negro"). Hacienda formaliza esto como `OtrasSenas`, obligatorio, de 5 a 250 caracteres (sección 3).
- Campos mínimos para un envío (síntesis de la UPU y de Hacienda):
  1. Nombre de quien recibe
  2. Teléfono de contacto. ⚠️ Incierto: no sale de una norma; es práctica de los couriers.
  3. Provincia
  4. Cantón
  5. Distrito
  6. Otras señas (texto libre, obligatorio)
  7. Barrio (opcional)
  8. El código postal es derivable, no hace falta pedirlo al usuario.

## Implicaciones para el modelo de dominio

**Campos de una Dirección** (para Cliente y como copia congelada en Pedido):

| Campo | Tipo / regla | Comentario |
|---|---|---|
| `destinatario` | texto | Quien recibe; puede ser distinto del Cliente. |
| `telefono` | texto | Contacto para la entrega. |
| `distritoCodigo` | texto de 5 dígitos, p. ej. `"40501"` | **Clave primaria de la ubicación.** De él se derivan provincia (`[0]`), cantón (`[0..3]`) y código postal (es el mismo número). Se guarda como string para no perder ceros ni formato. |
| `provinciaNombre`, `cantonNombre`, `distritoNombre` | texto | Copia de los nombres **al momento de guardar**, para mostrar e imprimir sin consultar el catálogo. |
| `barrio` | texto libre opcional (máx. 50, como Hacienda) | Solo ayuda a la entrega. No es unidad oficial ni se valida contra un catálogo. |
| `otrasSenas` | texto obligatorio (5–250, alineado con Hacienda) | Es la parte de la dirección que realmente guía al repartidor. |

Decisiones que se desprenden:

- **Guardar códigos y nombres.** El código permite validar, filtrar y reportar (y más adelante mapear a Hacienda con los números P/C/D separados). Los nombres permiten mostrar la dirección y resisten cambios o correcciones del catálogo. Guardar solo nombres es frágil (hay variantes como "Monte Verde"/"Monteverde" o tildes). Guardar solo códigos obliga a resolver siempre contra un catálogo que cambia.
- **Código postal:** no es un campo capturado. Es `distritoCodigo`. Si se quiere mostrar, se deriva.
- **Barrio:** no es parte de la jerarquía oficial. Conviene texto libre opcional. No hace falta modelarlo como catálogo (el de Hacienda tiene unas 7.000 filas y está desactualizado).
- **Catálogo territorial:** conviene tratarlo como **dato de referencia versionado**, un JSON estático o una colección de Firestore de solo lectura con `version: "DTA-2026"`. Se construye a partir de la DTA 2026 del IGN: se puede partir del XLSX de Hacienda y agregarle `50405 Pijije` y `60310 Cabagra`. Se revisa cuando el IGN publica una tabla nueva, más o menos una vez al año.
- **Cambios territoriales en el tiempo:**
  - **Pedido:** guarda una **copia congelada** de la dirección (códigos + nombres + `dtaVersion`) al confirmarse. Nunca se recalcula. Si después se crea un distrito que absorbe esa zona, el pedido histórico sigue mostrando lo que se usó para enviarlo.
  - **Cliente:** su dirección guardada puede quedar **desactualizada** si una segregación mueve su zona a un distrito nuevo (p. ej. alguien de "Bagaces" que ahora está en "Pijije"). El código viejo sigue siendo válido porque los distritos segregados siguen existiendo, así que no se rompe. Solo sería menos preciso. Basta con permitir que el Cliente edite su dirección. No se recomienda migrar automáticamente.
  - Como los códigos existentes no se renumeran al crear unidades nuevas (patrón observado, ⚠️ no es una regla escrita), un `distritoCodigo` guardado debería seguir resolviendo en catálogos futuros.
- **Contradicción con la decisión del mapa:** no hay. La estructura ya decidida (Provincia / Cantón / Distrito + señas) coincide con la jerarquía oficial de la DTA, con el `UbicacionType` de Hacienda y con el formato de Correos/UPU. Solo hay dos matices: agregar `barrio` como opcional y guardar el **código de distrito** además de los nombres.
